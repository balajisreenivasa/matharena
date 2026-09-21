// Saves interactive-lesson answers and launches the lesson quiz.
// POST {skillId, kind:"checkpoint"|"example", key, answer, correct}
// POST {skillId, kind:"quiz"} -> {worksheetId}
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getLearnerOrNull } from "@/lib/learner";
import { lessonFor } from "@/curriculum/lessons";
import { SKILL_BY_ID } from "@/curriculum/skills";
import { createLessonQuiz } from "@/lib/worksheet";
import { todayStr } from "@/lib/dates";

export const dynamic = "force-dynamic";

type Data = { checkpoints: Record<string, { answer: string; correct: boolean }>; examples: Record<string, { answer: string; correct: boolean }> };

function parseData(s: string): Data {
  try {
    const d = JSON.parse(s);
    return { checkpoints: d.checkpoints ?? {}, examples: d.examples ?? {} };
  } catch {
    return { checkpoints: {}, examples: {} };
  }
}

export async function POST(req: Request) {
  const learner = await getLearnerOrNull();
  if (!learner) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const skillId = String(body.skillId ?? "");
  if (!SKILL_BY_ID[skillId]) return NextResponse.json({ error: "unknown skill" }, { status: 400 });
  const lesson = lessonFor(skillId);
  if (!lesson) return NextResponse.json({ error: "no lesson" }, { status: 404 });

  const row = await db.lessonProgress.upsert({
    where: { userId_skillId: { userId: learner.id, skillId } },
    update: {},
    create: { userId: learner.id, skillId, checkpointsTotal: lesson.checkpoints.length, examplesTotal: lesson.workedExamples.length },
  });

  if (body.kind === "quiz") {
    const w = await createLessonQuiz(learner, skillId, todayStr());
    await db.lessonProgress.update({ where: { id: row.id }, data: { quizWorksheetId: w.id, quizScore: null, quizTotal: w.total } });
    return NextResponse.json({ worksheetId: w.id });
  }

  if (body.kind !== "checkpoint" && body.kind !== "example") return NextResponse.json({ error: "bad kind" }, { status: 400 });
  const key = String(body.key ?? "");
  const data = parseData(row.data);
  const bucket = body.kind === "checkpoint" ? data.checkpoints : data.examples;
  if (bucket[key]) return NextResponse.json({ status: row.status, already: true }); // first answer counts
  bucket[key] = { answer: String(body.answer ?? "").slice(0, 200), correct: body.correct === true };

  const cpC = Object.values(data.checkpoints).filter((x) => x.correct).length;
  const exC = Object.values(data.examples).filter((x) => x.correct).length;
  const allAnswered = Object.keys(data.checkpoints).length >= lesson.checkpoints.length && Object.keys(data.examples).length >= lesson.workedExamples.length;
  const status = row.status === "quiz_passed" ? "quiz_passed" : allAnswered ? "read" : "started";
  const updated = await db.lessonProgress.update({
    where: { id: row.id },
    data: {
      data: JSON.stringify(data),
      checkpointsCorrect: cpC,
      checkpointsTotal: lesson.checkpoints.length,
      examplesCorrect: exC,
      examplesTotal: lesson.workedExamples.length,
      status,
      completedAt: status !== "started" ? row.completedAt ?? new Date() : null,
    },
  });
  return NextResponse.json({ status: updated.status, checkpointsCorrect: cpC, examplesCorrect: exC });
}
