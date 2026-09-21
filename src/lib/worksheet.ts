// Worksheet builder: turns "what kind of day is it" (plan.ts) plus "what does the
// student know" (mastery, review queue, recent error tags) into a stored list of
// problems, each with a one-line reason so a parent can see why it was picked.
//
// Daily worksheet = problemsPerDay (default 8), ordered easy to hard:
//   4 from today's lesson skill(s), at her current band for that skill
//   2 from the two weakest skills already taught
//   1 from the review queue (missed 1/3/7/14 days ago), else another weak-skill problem
//   1 confidence builder from a strong skill, to keep speed up
// Adaptive days (no lesson): 5 weak + 2 review + 1 strong.
//
// Error-tag effects (from the last 3 days of attempts):
//   C  concept   -> that skill drops one band and is pinned into a weak slot
//   S  setup     -> two extra same-skill problems at the same band
//   E/R          -> a 5-problem D1/D2 accuracy sprint prepended as warm-up
//   T  time      -> a 5-problem timed speed set prepended (12 minutes)
// Mock re-plan: skills under 50% on the last mock are pinned into weak slots.
// Problems answered correctly are never re-served; misses come back only via the queue.
import { db } from "./db";
import { SKILLS, SKILL_BY_ID, TOPIC_META, type TopicSlug } from "@/curriculum/skills";
import { bandFor, type ErrorTag } from "./mastery";
import { planDayFor, taughtSkillIds, type PlanDay } from "./plan";
import { getMasteryMap, planConfig, type Learner, type MasteryRow } from "./learner";
import { addDays, daysBetween } from "./dates";
import type { Worksheet } from "@prisma/client";

export type ItemRole = "warmup" | "sprint" | "speed" | "lesson" | "weak" | "review" | "confidence" | "challenge" | "diagnostic" | "mock" | "practice";
export type Item = { problemId: string; role: ItemRole; skillId?: string; reason?: string };

export function parseItems(w: { items: string }): Item[] {
  try {
    return JSON.parse(w.items);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Problem selection
// ---------------------------------------------------------------------------

type PickOpts = {
  userId: string;
  skillId?: string;
  topicSlug?: TopicSlug;
  band: [number, number];
  n: number;
  exclude: Set<string>;
};

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const clamp = (x: number) => Math.max(1, Math.min(10, x));
const ALL_SKILL_IDS = SKILLS.map((s) => s.id);

// One query per build instead of one per pick: load every problem the student has
// not attempted (ids, difficulty, contest, skills, topics; ~4 MB for 17k problems) and
// filter in memory. Cached briefly per user so a build's dozens of picks share it.
type PoolRow = { id: string; globalDifficulty: number; contestId: string; number: number; round: string | null; skillIds: string[]; topicSlugs: string[] };
const poolCache = new Map<string, { at: number; rows: PoolRow[] }>();
const POOL_TTL_MS = 20_000;

async function loadPool(userId: string): Promise<PoolRow[]> {
  const hit = poolCache.get(userId);
  if (hit && Date.now() - hit.at < POOL_TTL_MS) return hit.rows;
  const rows = await db.problem.findMany({
    where: { attempts: { none: { userId } } },
    select: { id: true, globalDifficulty: true, contestId: true, number: true, round: true, skills: { select: { skillId: true } }, topics: { select: { topic: { select: { slug: true } } } } },
  });
  const pool: PoolRow[] = rows.map((r) => ({ id: r.id, globalDifficulty: r.globalDifficulty, contestId: r.contestId, number: r.number, round: r.round, skillIds: r.skills.map((s) => s.skillId), topicSlugs: r.topics.map((t) => t.topic.slug) }));
  poolCache.set(userId, { at: Date.now(), rows: pool });
  return pool;
}

export function invalidatePool(userId: string) {
  poolCache.delete(userId);
}

const AIME_IDS = new Set(["AIME", "AIME_I", "AIME_II"]);

async function query(o: PickOpts, widen: number): Promise<{ id: string; globalDifficulty: number }[]> {
  const lo = clamp(o.band[0] - widen);
  const hi = clamp(o.band[1] + widen);
  const pool = await loadPool(o.userId);
  const out: { id: string; globalDifficulty: number }[] = [];
  for (const p of pool) {
    if (p.globalDifficulty < lo || p.globalDifficulty > hi) continue;
    if (o.skillId ? !p.skillIds.includes(o.skillId) : o.topicSlug ? !p.topicSlugs.includes(o.topicSlug) : false) continue;
    if (o.exclude.has(p.id)) continue;
    // AIME beyond #5 is out of AMC 10 range; MATH precalculus only feeds geo-trig.
    if (AIME_IDS.has(p.contestId) && p.number > 5) continue;
    if (o.skillId !== "geo-trig" && p.round === "precalculus") continue;
    out.push({ id: p.id, globalDifficulty: p.globalDifficulty });
    if (out.length >= 300) break;
  }
  return out;
}

// Pick `n` problems, widening the band and then falling back to the parent topic
// when a skill is thin at the requested difficulty.
export async function pickProblems(o: PickOpts): Promise<Item[]> {
  const out: Item[] = [];
  const attempts: { skillId?: string; topicSlug?: TopicSlug; widen: number }[] = [
    { skillId: o.skillId, topicSlug: o.topicSlug, widen: 0 },
    { skillId: o.skillId, topicSlug: o.topicSlug, widen: 1 },
    { skillId: o.skillId, topicSlug: o.topicSlug, widen: 3 },
  ];
  if (o.skillId) {
    const topic = SKILL_BY_ID[o.skillId]?.topicSlug;
    attempts.push({ topicSlug: topic, widen: 0 }, { topicSlug: topic, widen: 2 }, { widen: 5 });
  } else {
    attempts.push({ widen: 5 });
  }
  for (const a of attempts) {
    if (out.length >= o.n) break;
    const rows = shuffle(await query({ ...o, skillId: a.skillId, topicSlug: a.topicSlug }, a.widen));
    for (const r of rows) {
      if (out.length >= o.n) break;
      if (o.exclude.has(r.id)) continue;
      o.exclude.add(r.id);
      out.push({ problemId: r.id, role: "practice", skillId: o.skillId });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Signals that adapt the sheet
// ---------------------------------------------------------------------------

type Signals = {
  bandShift: Record<string, number>; // skillId -> -1 for a recent C tag
  pinned: string[]; // skills forced into weak slots (C tags, mock re-plan)
  extraSameSkill: string[]; // S tags: skills that get +2 problems
  sprint: boolean; // E/R: 5-problem accuracy sprint
  speed: boolean; // T: timed speed set
  dueReview: { problemId: string; skillId?: string }[];
};

async function collectSignals(learner: Learner, date: string): Promise<Signals> {
  const userId = learner.id;
  const since = new Date(new Date(`${addDays(date, -3)}T00:00:00`).getTime());
  const recent = await db.attempt.findMany({
    where: { userId, createdAt: { gte: since }, errorTag: { not: null } },
    select: { errorTag: true, problem: { select: { skills: { select: { skillId: true } } } } },
  });
  const bandShift: Record<string, number> = {};
  const pinned = new Set<string>();
  const extra = new Set<string>();
  let er = 0, t = 0;
  for (const a of recent) {
    const tag = a.errorTag as ErrorTag;
    const skills = a.problem.skills.map((s) => s.skillId);
    if (tag === "C") skills.forEach((id) => { bandShift[id] = -1; pinned.add(id); });
    if (tag === "S") skills.forEach((id) => extra.add(id));
    if (tag === "E" || tag === "R") er++;
    if (tag === "T") t++;
  }

  // Mock re-plan: skills under 50% on the most recent completed in-app mock.
  const lastMock = await db.worksheet.findFirst({ where: { userId, kind: { in: ["mock", "extra-mock"] }, status: "done" }, orderBy: { completedAt: "desc" } });
  if (lastMock && daysBetween(lastMock.date, date) <= 7) {
    const rows = await db.attempt.findMany({ where: { worksheetId: lastMock.id }, select: { isCorrect: true, problem: { select: { skills: { select: { skillId: true } } } } } });
    const acc: Record<string, { c: number; n: number }> = {};
    for (const r of rows) for (const s of r.problem.skills) {
      acc[s.skillId] = acc[s.skillId] ?? { c: 0, n: 0 };
      acc[s.skillId].n++;
      if (r.isCorrect) acc[s.skillId].c++;
    }
    for (const [id, v] of Object.entries(acc)) if (v.n >= 2 && v.c / v.n < 0.5) pinned.add(id);
  }

  const due = await db.reviewItem.findMany({ where: { userId, dueDate: { lte: date } }, orderBy: { dueDate: "asc" }, take: 8, select: { problemId: true } });
  const dueProblems = due.length ? await db.problem.findMany({ where: { id: { in: due.map((d) => d.problemId) } }, select: { id: true, skills: { select: { skillId: true } } } }) : [];
  const dueReview = due.map((d) => ({ problemId: d.problemId, skillId: dueProblems.find((p) => p.id === d.problemId)?.skills[0]?.skillId }));

  return { bandShift, pinned: [...pinned], extraSameSkill: [...extra], sprint: er >= 2, speed: t >= 2, dueReview };
}

// ---------------------------------------------------------------------------
// Composition per kind of day
// ---------------------------------------------------------------------------

function weakest(mastery: Record<string, MasteryRow>, pool: string[], n: number, exclude: string[] = [], pinned: string[] = []): string[] {
  const p = pinned.filter((id) => pool.includes(id) && !exclude.includes(id));
  const rest = pool
    .filter((id) => !exclude.includes(id) && !p.includes(id))
    .sort((a, b) => mastery[a].effective - mastery[b].effective || mastery[a].attempts - mastery[b].attempts);
  return [...p, ...rest].slice(0, n);
}

function strongest(mastery: Record<string, MasteryRow>, pool: string[], n: number): string[] {
  return [...pool].sort((a, b) => mastery[b].effective - mastery[a].effective).slice(0, n);
}

function shift(band: [number, number], by: number): [number, number] {
  return [clamp(band[0] + by), clamp(band[1] + by)];
}

type Built = { items: Item[]; title: string; timeLimitSec: number | null; skillId: string | null };

const named = (id: string) => SKILL_BY_ID[id]?.name ?? id;

async function compose(learner: Learner, day: PlanDay): Promise<Built | null> {
  const userId = learner.id;
  const mastery = await getMasteryMap(userId);
  const cfg = planConfig(learner.plan);
  const taught = taughtSkillIds(cfg, day.date, ALL_SKILL_IDS);
  const sig = await collectSignals(learner, day.date);
  const exclude = new Set<string>(sig.dueReview.map((d) => d.problemId));
  const dayNo = daysBetween(cfg.startDate, day.date) + 1;
  const bandOf = (id: string) => shift(bandFor(mastery[id].effective, mastery[id].attempts), sig.bandShift[id] ?? 0);
  const tag = (items: Item[], role: ItemRole, reason: string) => items.map((i) => ({ ...i, role, reason }));

  // Shared building blocks -------------------------------------------------
  const prelude = async (): Promise<Item[]> => {
    const items: Item[] = [];
    if (sig.sprint) {
      for (const id of shuffle([...taught]).slice(0, 5)) items.push(...tag(await pickProblems({ userId, skillId: id, band: [1, 3], n: 1, exclude }), "sprint", "Accuracy sprint: recent E/R (execution/misread) tags. Slow down, underline the question, check the answer."));
    }
    if (sig.speed) {
      for (const id of shuffle([...taught]).slice(0, 5)) items.push(...tag(await pickProblems({ userId, skillId: id, band: [1, 4], n: 1, exclude }), "speed", "Speed set: recent T (time) tags. Aim for 90 seconds each."));
    }
    return items;
  };
  const reviewSlot = async (n: number): Promise<Item[]> => {
    const items: Item[] = [];
    for (const d of sig.dueReview.slice(0, n)) items.push({ problemId: d.problemId, role: "review", skillId: d.skillId, reason: "Review queue: missed earlier, due today (1/3/7/14-day spacing)." });
    return items;
  };
  const weakSlots = async (n: number, avoid: string[]): Promise<Item[]> => {
    const items: Item[] = [];
    const ids = weakest(mastery, taught, n, avoid, sig.pinned);
    for (const id of ids) {
      const why = sig.pinned.includes(id) ? `Pinned weak skill (${named(id)}): recent concept tag or under 50% on the last mock.` : `Weak skill (${named(id)}): ${Math.round(mastery[id].effective * 100)}% mastery.`;
      items.push(...tag(await pickProblems({ userId, skillId: id, band: bandOf(id), n: 1, exclude }), "weak", why));
    }
    return items;
  };
  const strongSlot = async (n: number): Promise<Item[]> => {
    const items: Item[] = [];
    for (const id of strongest(mastery, taught, n)) items.push(...tag(await pickProblems({ userId, skillId: id, band: bandOf(id), n: 1, exclude }), "confidence", `Confidence builder from a strong skill (${named(id)}) to keep speed up.`));
    return items;
  };
  const fillWeak = async (items: Item[], target: number, avoid: string[]) => {
    let guard = 0;
    while (items.length < target && guard++ < 6) {
      const more = await weakSlots(target - items.length, avoid);
      if (!more.length) break;
      items.push(...more);
    }
  };

  switch (day.kind) {
    case "diagnostic": {
      const items: Item[] = [];
      // Two per skill: an easy one (band 2-3) and a core one (band 4-6), so a single
      // miss cannot be a fluke and the starting band has two data points.
      for (const s of SKILLS) {
        items.push(...tag(await pickProblems({ userId, skillId: s.id, band: [2, 3], n: 1, exclude }), "diagnostic", `Baseline for ${s.name} (easy).`));
        items.push(...tag(await pickProblems({ userId, skillId: s.id, band: [4, 6], n: 1, exclude }), "diagnostic", `Baseline for ${s.name} (core).`));
      }
      return { items, title: `In-app diagnostic (${SKILLS.length} skills × 2)`, timeLimitSec: null, skillId: null };
    }

    case "lesson":
    case "quiz": {
      const N = learner.plan.problemsPerDay;
      const lessonSkills = day.skillIds.length ? day.skillIds : weakest(mastery, taught, 1);
      const primary = lessonSkills[0];
      const items: Item[] = await prelude();
      const lessonCount = day.kind === "quiz" ? Math.max(6, N) : Math.max(3, Math.round(N * 0.5));
      const per = Math.ceil(lessonCount / lessonSkills.length);
      for (const id of lessonSkills) {
        const b = bandOf(id);
        items.push(...tag(await pickProblems({ userId, skillId: id, band: b, n: per, exclude }), "lesson", `Today's lesson (${named(id)}) at band ${b[0]}-${b[1]}${sig.bandShift[id] ? ", one band lower after a concept tag" : ""}.`));
      }
      for (const id of sig.extraSameSkill.filter((x) => !lessonSkills.includes(x)).slice(0, 2)) {
        items.push(...tag(await pickProblems({ userId, skillId: id, band: bandOf(id), n: 1, exclude }), "weak", `Setup tag on ${named(id)}: more of the same type at the same level.`));
      }
      if (day.kind === "lesson") {
        items.push(...(await weakSlots(2, lessonSkills)));
        const rv = await reviewSlot(1);
        items.push(...(rv.length ? rv : await weakSlots(1, [...lessonSkills, ...items.map((i) => i.skillId ?? "")])));
        items.push(...(await strongSlot(1)));
      }
      const title = day.kind === "quiz" ? `Day ${dayNo} · ${day.label}` : `Day ${dayNo} · Lesson: ${lessonSkills.map(named).join(" + ")}`;
      return { items, title, timeLimitSec: day.kind === "quiz" ? 40 * 60 : null, skillId: primary };
    }

    case "adaptive":
    case "strategy":
    case "mock_review": {
      const items: Item[] = await prelude();
      const n = day.kind === "mock_review" ? 6 : learner.plan.problemsPerDay;
      const rv = await reviewSlot(day.kind === "mock_review" ? 4 : 2);
      items.push(...rv);
      const weakN = Math.max(0, n - rv.length - 1);
      if (day.focus === "hard" || day.focus === "mid") {
        // Strategy / late-gap days: serve the paper's mid-to-late difficulty regardless of band.
        const band: [number, number] = day.focus === "hard" ? [6, 8] : [4, 7];
        for (const id of weakest(mastery, taught, weakN, [], sig.pinned)) {
          items.push(...tag(await pickProblems({ userId, skillId: id, band, n: 1, exclude }), "weak", `${day.focus === "hard" ? "Problems 16-20" : "Problems 11-20"} difficulty on a weak skill (${named(id)}).`));
        }
      } else {
        await fillWeak(items, items.length + weakN, []);
      }
      items.push(...(await strongSlot(1)));
      return { items, title: `Day ${dayNo} · ${day.label}`, timeLimitSec: null, skillId: null };
    }

    case "mock": {
      return { ...(await composeMock(userId, exclude)), title: `Day ${dayNo} · In-app timed mock` };
    }

    case "light": {
      const items: Item[] = [];
      for (const id of strongest(mastery, ALL_SKILL_IDS, 10)) items.push(...tag(await pickProblems({ userId, skillId: id, band: [1, 3], n: 1, exclude }), "confidence", "Easy accuracy problem the day before the exam."));
      return { items, title: `Day ${dayNo} · Light day: ten easy wins`, timeLimitSec: null, skillId: null };
    }

    case "exam":
    case "off":
    case "rest":
      return null;
  }
}

// AMC-shaped: 25 problems ramping from #1 to #25 across all four topics.
export async function composeMock(userId: string, exclude = new Set<string>()): Promise<Built> {
  const topics: TopicSlug[] = ["algebra", "geometry", "number-theory", "counting-probability"];
  const bands: [number, number][] = [
    [1, 3], [1, 3], [2, 3], [2, 4], [2, 4],
    [3, 4], [3, 4], [3, 5], [3, 5], [4, 5],
    [4, 6], [4, 6], [5, 6], [5, 6], [5, 7],
    [5, 7], [6, 7], [6, 8], [6, 8], [7, 8],
    [7, 9], [7, 9], [8, 10], [8, 10], [8, 10],
  ];
  const items: Item[] = [];
  for (let i = 0; i < 25; i++) {
    const topic = topics[i % 4];
    const got = await pickProblems({ userId, topicSlug: topic, band: bands[i], n: 1, exclude });
    items.push(...got.map((g) => ({ ...g, role: "mock" as ItemRole, reason: `Position ${i + 1}: ${TOPIC_META[topic].name}, band ${bands[i][0]}-${bands[i][1]}.` })));
  }
  return { items, title: "Timed mock exam", timeLimitSec: 75 * 60, skillId: null };
}

// ---------------------------------------------------------------------------
// Entry points
// ---------------------------------------------------------------------------

const CALENDAR_KINDS = ["daily", "diagnostic", "mock", "review", "quiz", "light"];

export async function getOrCreateWorksheet(learner: Learner, date: string): Promise<{ worksheet: Worksheet | null; day: PlanDay | null }> {
  const cfg = planConfig(learner.plan);
  const day = planDayFor(cfg, date);
  if (!day) return { worksheet: null, day: null };

  const existing = await db.worksheet.findFirst({ where: { userId: learner.id, date, kind: { in: CALENDAR_KINDS } }, orderBy: { createdAt: "asc" } });
  if (existing) return { worksheet: existing, day };

  const built = await compose(learner, day);
  if (!built || !built.items.length) return { worksheet: null, day };

  const kind = day.kind === "lesson" ? "daily" : day.kind === "adaptive" || day.kind === "strategy" || day.kind === "mock_review" ? "review" : day.kind;
  const worksheet = await db.worksheet.create({
    data: {
      userId: learner.id,
      date,
      kind,
      skillId: built.skillId,
      title: built.title,
      items: JSON.stringify(built.items),
      total: built.items.length,
      timeLimitSec: built.timeLimitSec,
    },
  });
  return { worksheet, day };
}

// An extra timed mock on demand (from /mock), independent of the calendar.
export async function createExtraMock(learner: Learner, date: string): Promise<Worksheet> {
  const built = await composeMock(learner.id);
  return db.worksheet.create({
    data: { userId: learner.id, date, kind: "extra-mock", title: `Extra mock · ${date}`, items: JSON.stringify(built.items), total: built.items.length, timeLimitSec: built.timeLimitSec },
  });
}

// A focused 8-problem set for one skill (from a lesson page).
export async function createSkillPractice(learner: Learner, skillId: string, date: string): Promise<Worksheet> {
  const mastery = await getMasteryMap(learner.id);
  const m = mastery[skillId];
  const exclude = new Set<string>();
  const band = bandFor(m.effective, m.attempts);
  const items: Item[] = [
    ...(await pickProblems({ userId: learner.id, skillId, band: shift(band, -1), n: 2, exclude })).map((i) => ({ ...i, role: "warmup" as ItemRole, reason: "Warm-up, one band down." })),
    ...(await pickProblems({ userId: learner.id, skillId, band, n: 5, exclude })).map((i) => ({ ...i, role: "lesson" as ItemRole, reason: `At current band ${band[0]}-${band[1]}.` })),
    ...(await pickProblems({ userId: learner.id, skillId, band: shift(band, 2), n: 1, exclude })).map((i) => ({ ...i, role: "challenge" as ItemRole, reason: "Challenge, two bands up." })),
  ];
  return db.worksheet.create({
    data: { userId: learner.id, date, kind: "practice", skillId, title: `Practice: ${SKILL_BY_ID[skillId]?.name ?? skillId}`, items: JSON.stringify(items), total: items.length },
  });
}

// End-of-lesson quiz: 5 problems on one skill at her band (the interactive lesson
// launches this; 4/5 marks the lesson quiz_passed in LessonProgress).
export async function createLessonQuiz(learner: Learner, skillId: string, date: string): Promise<Worksheet> {
  const mastery = await getMasteryMap(learner.id);
  const m = mastery[skillId];
  const exclude = new Set<string>();
  const band = bandFor(m.effective, m.attempts);
  const items: Item[] = [
    ...(await pickProblems({ userId: learner.id, skillId, band: shift(band, -1), n: 1, exclude })).map((i) => ({ ...i, role: "lesson" as ItemRole, reason: "Quiz, one band down." })),
    ...(await pickProblems({ userId: learner.id, skillId, band, n: 3, exclude })).map((i) => ({ ...i, role: "lesson" as ItemRole, reason: `Quiz at band ${band[0]}-${band[1]}.` })),
    ...(await pickProblems({ userId: learner.id, skillId, band: shift(band, 1), n: 1, exclude })).map((i) => ({ ...i, role: "challenge" as ItemRole, reason: "Quiz, one band up." })),
  ];
  return db.worksheet.create({
    data: { userId: learner.id, date, kind: "lesson-quiz", skillId, title: `Lesson quiz: ${SKILL_BY_ID[skillId]?.name ?? skillId}`, items: JSON.stringify(items), total: items.length, timeLimitSec: 15 * 60 },
  });
}

export const ROLE_LABEL: Record<ItemRole, string> = {
  warmup: "Warm-up",
  sprint: "Accuracy sprint",
  speed: "Speed set",
  lesson: "Lesson",
  weak: "Weak skill",
  review: "Review queue",
  confidence: "Confidence",
  challenge: "Challenge",
  diagnostic: "Diagnostic",
  mock: "Mock",
  practice: "Practice",
};

export { TOPIC_META };
