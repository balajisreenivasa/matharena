// Who is the student? Pages and API routes read the signed session cookie
// (getLearner); scripts address students directly (getLearnerById / listLearners).
// Every table keys on userId, so profiles are fully separate.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { SKILLS } from "@/curriculum/skills";
import { todayStr, addDays } from "./dates";
import { DEFAULT_EXAM_A, DEFAULT_EXAM_B, type PlanConfig } from "./plan";
import { foldAll, effectiveScore, INITIAL_MASTERY, REVIEW_INTERVALS, type MasteryState, type Confidence } from "./mastery";
import { authSecret, verifySessionToken, SESSION_COOKIE } from "./auth";
import type { StudyPlan, User } from "@prisma/client";

// The pre-login single learner from the first version. Retired when the first real
// profile is created (see /signup).
export const LEGACY_LEARNER_EMAIL = "student@matharena.local";

export type Learner = User & { plan: StudyPlan };

async function withPlan(user: User & { plan: StudyPlan | null }): Promise<Learner> {
  let plan = user.plan;
  if (!plan) {
    plan = await db.studyPlan.create({
      data: {
        userId: user.id,
        startDate: todayStr() < "2026-09-21" ? "2026-09-21" : todayStr(),
        examADate: DEFAULT_EXAM_A,
        examBDate: DEFAULT_EXAM_B,
        deliverTo: user.email.endsWith("@matharena.local") ? null : user.email,
      },
    });
  }
  await ensureSkillRows();
  return { ...user, plan };
}

// The signed-in student, or a redirect to /login. Server components, server actions
// and route handlers all go through here.
export async function getLearner(): Promise<Learner> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const userId = await verifySessionToken(token, authSecret());
  const user = userId ? await db.user.findUnique({ where: { id: userId }, include: { plan: true } }) : null;
  if (!user) redirect("/login");
  return withPlan(user!);
}

// Same as getLearner but returns null instead of redirecting (for API routes).
export async function getLearnerOrNull(): Promise<Learner | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const userId = await verifySessionToken(token, authSecret());
  const user = userId ? await db.user.findUnique({ where: { id: userId }, include: { plan: true } }) : null;
  return user ? withPlan(user) : null;
}

export async function getLearnerById(id: string): Promise<Learner | null> {
  const user = await db.user.findUnique({ where: { id }, include: { plan: true } });
  return user ? withPlan(user) : null;
}

// Students with a password (real profiles). Scripts loop over these.
export async function listLearners(): Promise<Learner[]> {
  const users = await db.user.findMany({ where: { passwordHash: { not: null }, role: "student" }, include: { plan: true }, orderBy: { createdAt: "asc" } });
  const out: Learner[] = [];
  for (const u of users) out.push(await withPlan(u));
  return out;
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
