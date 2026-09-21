// Local-first: one learner, no login. The first request creates the student and a
// default study plan; everything else keys off that user id.
import { db } from "./db";
import { SKILLS } from "@/curriculum/skills";
import { todayStr, addDays } from "./dates";
import { DEFAULT_EXAM_A, DEFAULT_EXAM_B, type PlanConfig } from "./plan";
import { foldAll, effectiveScore, INITIAL_MASTERY, REVIEW_INTERVALS, type MasteryState, type Confidence } from "./mastery";
import type { StudyPlan, User } from "@prisma/client";

export const LEARNER_EMAIL = "student@matharena.local";

export type Learner = User & { plan: StudyPlan };

export async function getLearner(): Promise<Learner> {
  let user = await db.user.findUnique({ where: { email: LEARNER_EMAIL }, include: { plan: true } });
  if (!user) {
    user = await db.user.create({
      data: { name: "Student", email: LEARNER_EMAIL, grade: 8 },
      include: { plan: true },
    });
  }
  let plan = user.plan;
  if (!plan) {
    plan = await db.studyPlan.create({
      data: {
        userId: user.id,
        // The written plan starts Mon Sep 21, 2026; if created later, start today.
        startDate: todayStr() < "2026-09-21" ? "2026-09-21" : todayStr(),
        examADate: DEFAULT_EXAM_A,
        examBDate: DEFAULT_EXAM_B,
      },
    });
  }
  await ensureSkillRows();
  return { ...user, plan };
}

let skillsEnsured = false;
export async function ensureSkillRows() {
  if (skillsEnsured) return;
  const n = await db.skill.count();
  if (n < SKILLS.length) {
    for (const s of SKILLS) {
      await db.skill.upsert({
        where: { id: s.id },
        update: { name: s.name, topicSlug: s.topicSlug, order: s.order },
        create: { id: s.id, name: s.name, topicSlug: s.topicSlug, order: s.order },
      });
    }
  }
  skillsEnsured = true;
}

function parseJsonArray<T>(s: string, fallback: T[]): T[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

export function planConfig(plan: StudyPlan): PlanConfig {
  return {
    startDate: plan.startDate,
    examADate: plan.examADate,
    examBDate: plan.examBDate,
    restDays: parseJsonArray<number>(plan.restDays, []),
    pauseDates: parseJsonArray<string>(plan.pauseDates, []),
  };
}

export type MasteryRow = MasteryState & { skillId: string; lastPracticed: Date | null; effective: number };

// Every skill, with a default row for anything not yet practised.
export async function getMasteryMap(userId: string): Promise<Record<string, MasteryRow>> {
  const rows = await db.skillMastery.findMany({ where: { userId } });
  const byId: Record<string, MasteryRow> = {};
  for (const s of SKILLS) {
    byId[s.id] = { skillId: s.id, ...INITIAL_MASTERY, lastPracticed: null, effective: INITIAL_MASTERY.score };
  }
  for (const r of rows) {
    byId[r.skillId] = {
      skillId: r.skillId,
      score: r.score,
      attempts: r.attempts,
      correct: r.correct,
      streak: r.streak,
      lastPracticed: r.lastPracticed,
      effective: effectiveScore(r.score, r.lastPracticed),
    };
  }
  return byId;
}

// Replay the attempt history for the given skills and store the folded result.
// Called after every attempt (cheap: a student makes a few hundred attempts in a
// season) and after an override, so mastery never drifts from the record.
export async function recomputeMastery(userId: string, skillIds: string[]) {
  if (!skillIds.length) return;
  const attempts = await db.attempt.findMany({
    where: { userId, problem: { skills: { some: { skillId: { in: skillIds } } } } },
    orderBy: { createdAt: "asc" },
    select: { isCorrect: true, selected: true, confidence: true, createdAt: true, problem: { select: { globalDifficulty: true, skills: { select: { skillId: true } } } } },
  });
  for (const skillId of skillIds) {
    const history = attempts
      .filter((a) => a.problem.skills.some((s) => s.skillId === skillId))
      .map((a) => ({
        isCorrect: a.isCorrect,
        globalDifficulty: a.problem.globalDifficulty,
        confidence: (a.confidence as Confidence | null) ?? null,
        blank: a.selected.trim() === "",
        at: a.createdAt,
      }));
    const state = foldAll(history);
    const lastPracticed = history.length ? history[history.length - 1].at : null;
    await db.skillMastery.upsert({
      where: { userId_skillId: { userId, skillId } },
      update: { ...state, lastPracticed },
      create: { userId, skillId, ...state, lastPracticed },
    });
  }
}

// Spaced repetition. A miss (or blank) schedules the problem for tomorrow; each
// correct redo advances 1 -> 3 -> 7 -> 14 days; after 14 it retires. A wrong redo resets.
export async function updateReviewQueue(userId: string, problemId: string, isCorrect: boolean, today: string) {
  const existing = await db.reviewItem.findUnique({ where: { userId_problemId: { userId, problemId } } });
  if (!isCorrect) {
    await db.reviewItem.upsert({
      where: { userId_problemId: { userId, problemId } },
      update: { dueDate: addDays(today, REVIEW_INTERVALS[0]), intervalIndex: 0 },
      create: { userId, problemId, dueDate: addDays(today, REVIEW_INTERVALS[0]), intervalIndex: 0 },
    });
    return;
  }
  if (!existing) return;
  const next = existing.intervalIndex + 1;
  if (next >= REVIEW_INTERVALS.length) {
    await db.reviewItem.delete({ where: { id: existing.id } });
  } else {
    await db.reviewItem.update({ where: { id: existing.id }, data: { dueDate: addDays(today, REVIEW_INTERVALS[next]), intervalIndex: next } });
  }
}
