// Mastery model: one 0..1 score per skill, updated by an exponential moving average
// where the target of each step depends on whether the answer was right AND how hard
// the problem was. A correct hard problem is strong evidence; a wrong easy one is too.
//
// Everything is a pure fold over the attempt history, so recomputing from scratch
// (e.g. after an "I had this right" override) gives the same answer as incremental
// updates. See recomputeMastery() in learner.ts for the DB-side replay.

export type MasteryState = { score: number; attempts: number; correct: number; streak: number };

export const INITIAL_MASTERY: MasteryState = { score: 0.35, attempts: 0, correct: 0, streak: 0 };

// globalDifficulty is 1..10. Map it to how strongly a result moves the estimate.
function targetFor(isCorrect: boolean, g: number): number {
  const d = Math.max(1, Math.min(10, g));
  // Right on a 2 -> 0.72, right on an 8 -> 1.0. Wrong on a 2 -> 0.05, wrong on an 8 -> 0.38.
  return isCorrect ? Math.min(1, 0.62 + 0.05 * d) : Math.max(0, -0.06 + 0.055 * d);
}

export type Confidence = "sure" | "unsure" | "guessed";

export type AttemptEvidence = { isCorrect: boolean; globalDifficulty: number; confidence?: Confidence | null; blank?: boolean };

// Confidence changes how much an answer counts. "Sure and wrong" is the strongest
// negative signal there is (1.5x); a lucky guess barely counts (0.5x); a blank is a
// small penalty rather than a full miss.
function weightFor(e: AttemptEvidence): number {
  if (e.blank) return 0.4;
  if (!e.isCorrect && e.confidence === "sure") return 1.5;
  if (e.isCorrect && e.confidence === "guessed") return 0.5;
  return 1;
}

export function foldAttempt(prev: MasteryState, e: AttemptEvidence): MasteryState {
  // Early attempts move the estimate fast (1/2, 1/3, 1/4 ...), then it settles to 0.15.
  const alpha = Math.min(0.6, Math.max(0.15, 1 / (prev.attempts + 2)) * weightFor(e));
  const target = targetFor(e.isCorrect, e.globalDifficulty);
  const score = prev.score + alpha * (target - prev.score);
  return {
    score: Math.max(0, Math.min(1, score)),
    attempts: prev.attempts + 1,
    correct: prev.correct + (e.isCorrect ? 1 : 0),
    streak: e.isCorrect ? prev.streak + 1 : 0,
  };
}

export function foldAll(history: AttemptEvidence[]): MasteryState {
  return history.reduce((s, h) => foldAttempt(s, h), INITIAL_MASTERY);
}

// Spaced-repetition intervals for the review queue, in days.
export const REVIEW_INTERVALS = [1, 3, 7, 14];

export type ErrorTag = "C" | "S" | "E" | "R" | "T";
export const ERROR_TAGS: Record<ErrorTag, { name: string; blurb: string; effect: string }> = {
  C: { name: "Concept", blurb: "Didn't know the idea", effect: "Lesson re-queued; easier problems on this skill next" },
  S: { name: "Setup", blurb: "Knew the idea, couldn't start or model it", effect: "More of this type at the same level" },
  E: { name: "Execution", blurb: "Arithmetic or algebra slip", effect: "Accuracy sprint added to tomorrow's warm-up" },
  R: { name: "Misread", blurb: "Answered a different question", effect: "Accuracy sprint; underline-the-question habit" },
  T: { name: "Time", blurb: "Ran out of time", effect: "Timed speed set on problems 1-10 within 3 days" },
};

// Unpractised skills drift down a little so they come back into review rotation.
export function effectiveScore(score: number, lastPracticed: Date | null | undefined, now = new Date()): number {
  if (!lastPracticed) return score;
  const weeks = (now.getTime() - lastPracticed.getTime()) / (7 * 86_400_000);
  if (weeks <= 1) return score;
  return Math.max(0, score - Math.min(0.15, 0.03 * (weeks - 1)));
}

export type MasteryLevel = "Not started" | "Developing" | "Progressing" | "Proficient" | "Mastered";

export function masteryLevel(score: number, attempts: number): MasteryLevel {
  if (attempts === 0) return "Not started";
  if (score < 0.4) return "Developing";
  if (score < 0.65) return "Progressing";
  if (score < 0.85) return "Proficient";
  return "Mastered";
}

export const LEVEL_COLOR: Record<MasteryLevel, string> = {
  "Not started": "#94a3b8",
  Developing: "#dc2626",
  Progressing: "#d97706",
  Proficient: "#2563eb",
  Mastered: "#16a34a",
};

// Which global-difficulty band (1..10) to serve for a skill at a given mastery.
// The band shifts up as mastery grows so the student is always slightly stretched.
export function bandFor(score: number, attempts: number): [number, number] {
  if (attempts === 0) return [2, 5];
  if (score < 0.4) return [1, 4];
  if (score < 0.65) return [3, 6];
  if (score < 0.85) return [4, 7];
  return [5, 9];
}

// Rough AMC 10 score projection from the two tiers' average mastery. Position on the
// paper drives the base chance; mastery scales it. Problems the student would likely
// get wrong are better left blank (1.5 pts) than guessed, so the projection uses
// max(6p, 1.5) per problem, which is what a disciplined test-taker earns.
export function projectAmcScore(tier1Avg: number, tier2Avg: number): { expected: number; correct: number; attemptThrough: number } {
  let total = 0;
  let correct = 0;
  let attemptThrough = 0;
  for (let n = 1; n <= 25; n++) {
    let p: number;
    if (n <= 10) p = 0.5 + 0.5 * tier1Avg;
    else if (n <= 17) p = 0.15 + 0.7 * ((tier1Avg + tier2Avg) / 2);
    else p = 0.03 + 0.5 * tier2Avg;
    p = Math.max(0, Math.min(1, p));
    // Answering beats a blank only when 6p > 1.5, i.e. p > 1/4.
    if (p > 0.25) {
      attemptThrough = n;
      correct += p;
      total += 6 * p;
    } else {
      total += 1.5;
    }
  }
  return { expected: Math.round(total * 2) / 2, correct: Math.round(correct), attemptThrough };
}

// Official AMC 10 scoring.
export function amcScore(correct: number, blank: number): number {
  return 6 * correct + 1.5 * blank;
}
