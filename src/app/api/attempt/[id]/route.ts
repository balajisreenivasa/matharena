// PATCH an attempt: {override: true} flips a free-response false negative and replays
// mastery; {errorTag: "C"|"S"|"E"|"R"|"T"} records why a problem was missed (this is
// what steers tomorrow's worksheet).
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getLearner, recomputeMastery, updateReviewQueue } from "@/lib/learner";
import { todayStr } from "@/lib/dates";

export const dynamic = "force-dynamic";

const TAGS = new Set(["C", "S", "E", "R", "T"]);

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const learner = await getLearner();
  const attempt = await db.attempt.findFirst({ where: { id: params.id, userId: learner.id }, include: { problem: { select: { skills: { select: { skillId: true } } } } } });
  if (!attempt) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (body.errorTag !== undefined) {
    const tag = TAGS.has(String(body.errorTag)) ? String(body.errorTag) : null;
    await db.attempt.update({ where: { id: attempt.id }, data: { errorTag: tag } });
  }

  if (body.override === true && !attempt.isCorrect) {
    await db.attempt.update({ where: { id: attempt.id }, data: { isCorrect: true, errorTag: null } });
    await recomputeMastery(learner.id, attempt.problem.skills.map((s) => s.skillId));
    // The miss put it in the review queue; a confirmed-correct answer takes it back out.
    await db.reviewItem.deleteMany({ where: { userId: learner.id, problemId: attempt.problemId } });
    await updateReviewQueue(learner.id, attempt.problemId, true, todayStr());
    if (attempt.worksheetId) {
      const rows = await db.attempt.findMany({ where: { worksheetId: attempt.worksheetId }, select: { problemId: true, isCorrect: true }, orderBy: { createdAt: "asc" } });
      const latest = new Map<string, boolean>();
      for (const r of rows) latest.set(r.problemId, r.isCorrect);
      await db.worksheet.update({ where: { id: attempt.worksheetId }, data: { score: [...latest.values()].filter(Boolean).length } });
    }
  }
  return NextResponse.json({ ok: true });
}
