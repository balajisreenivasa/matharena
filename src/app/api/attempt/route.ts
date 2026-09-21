// Records answers. Accepts one {problemId, selected, confidence} or a batch
// {answers: [...]} (the mock exam submits all 25 at once; "" = blank). Grades
// server-side, updates the spaced-repetition queue, replays mastery for every skill
// touched, and closes the worksheet when every item has an attempt.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { gradeAnswer } from "@/lib/answers";
import { getLearnerOrNull, recomputeMastery, updateReviewQueue } from "@/lib/learner";
import { parseItems } from "@/lib/worksheet";
import { todayStr } from "@/lib/dates";

export const dynamic = "force-dynamic";

type Answer = { problemId: string; selected: string; confidence?: string; timeSpentSec?: number };
const CONFIDENCE = new Set(["sure", "unsure", "guessed"]);

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.worksheetId) return NextResponse.json({ error: "worksheetId required" }, { status: 400 });
  const answers: Answer[] = Array.isArray(body.answers)
    ? body.answers
    : body.problemId
      ? [{ problemId: body.problemId, selected: body.selected ?? "", confidence: body.confidence, timeSpentSec: body.timeSpentSec }]
      : [];
  if (!answers.length) return NextResponse.json({ error: "no answers" }, { status: 400 });

  const learner = await getLearnerOrNull();
  if (!learner) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  const worksheet = await db.worksheet.findFirst({ where: { id: body.worksheetId, userId: learner.id } });
  if (!worksheet) return NextResponse.json({ error: "worksheet not found" }, { status: 404 });

  const items = parseItems(worksheet);
  const allowed = new Set(items.map((i) => i.problemId));
  const ids = answers.map((a) => a.problemId).filter((id) => allowed.has(id));
  const problems = await db.problem.findMany({ where: { id: { in: ids } }, select: { id: true, answer: true, choices: true, skills: { select: { skillId: true } } } });
  const byId = new Map(problems.map((p) => [p.id, p]));
  const today = todayStr();

  const created: { id: string; problemId: string; isCorrect: boolean; answer: string }[] = [];
  const skillIds = new Set<string>();
  for (const a of answers) {
    const p = byId.get(a.problemId);
    if (!p) continue;
    const selected = String(a.selected ?? "").slice(0, 200);
    const isMC = !!p.choices && Object.keys(JSON.parse(p.choices)).length > 0;
    const isCorrect = selected.trim() !== "" && gradeAnswer(selected, p.answer, isMC);
    const confidence = CONFIDENCE.has(String(a.confidence)) ? String(a.confidence) : null;
    const row = await db.attempt.create({
      data: { userId: learner.id, problemId: p.id, worksheetId: worksheet.id, selected, isCorrect, confidence, timeSpentSec: a.timeSpentSec ?? null },
    });
    created.push({ id: row.id, problemId: p.id, isCorrect, answer: p.answer });
    await updateReviewQueue(learner.id, p.id, isCorrect, today);
    p.skills.forEach((s) => skillIds.add(s.skillId));
  }
  await recomputeMastery(learner.id, [...skillIds]);

  // Completion check.
  const attempted = await db.attempt.findMany({ where: { worksheetId: worksheet.id }, select: { problemId: true, isCorrect: true }, orderBy: { createdAt: "asc" } });
  const latest = new Map<string, boolean>();
  for (const a of attempted) latest.set(a.problemId, a.isCorrect);
  const done = items.every((i) => latest.has(i.problemId));
  const score = [...latest.values()].filter(Boolean).length;
  const updated = await db.worksheet.update({
    where: { id: worksheet.id },
    data: {
      status: done ? "done" : "in_progress",
      startedAt: worksheet.startedAt ?? new Date(),
      completedAt: done ? worksheet.completedAt ?? new Date() : null,
      score,
    },
  });

  // A finished lesson quiz records its score on the lesson; 80% passes.
  if (done && worksheet.kind === "lesson-quiz" && worksheet.skillId) {
    const passed = score >= Math.ceil(items.length * 0.8);
    const row = await db.lessonProgress.findUnique({ where: { userId_skillId: { userId: learner.id, skillId: worksheet.skillId } } });
    await db.lessonProgress.upsert({
      where: { userId_skillId: { userId: learner.id, skillId: worksheet.skillId } },
      update: { quizWorksheetId: worksheet.id, quizScore: score, quizTotal: items.length, status: passed ? "quiz_passed" : row?.status === "quiz_passed" ? "quiz_passed" : row?.status ?? "started", completedAt: passed ? new Date() : row?.completedAt ?? null },
      create: { userId: learner.id, skillId: worksheet.skillId, quizWorksheetId: worksheet.id, quizScore: score, quizTotal: items.length, status: passed ? "quiz_passed" : "started", completedAt: passed ? new Date() : null },
    });
  }

  return NextResponse.json({ attempts: created, worksheet: { status: updated.status, score: updated.score, total: updated.total } });
}
