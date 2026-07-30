// Master list of what to scrape. Edit this to add years/contests, then run `npm run build:data`.
export type ContestMeta = { id: string; name: string; level: "middle" | "high" | "olympiad"; answerFormat: "multiple_choice" | "integer"; numProblems: number; hardnessBase: number; years: number[] };

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

export const CONTESTS: ContestMeta[] = [
  { id: "AMC8",    name: "AMC 8",    level: "middle", answerFormat: "multiple_choice", numProblems: 25, hardnessBase: 2, years: range(1999, 2026) },
  { id: "AJHSME",  name: "AJHSME",   level: "middle", answerFormat: "multiple_choice", numProblems: 25, hardnessBase: 1, years: range(1985, 1998) },
  { id: "AMC10",   name: "AMC 10",   level: "middle", answerFormat: "multiple_choice", numProblems: 25, hardnessBase: 3, years: range(2000, 2001) },
  { id: "AMC10A",  name: "AMC 10A",  level: "middle", answerFormat: "multiple_choice", numProblems: 25, hardnessBase: 3, years: range(2002, 2026) },
  { id: "AMC10B",  name: "AMC 10B",  level: "middle", answerFormat: "multiple_choice", numProblems: 25, hardnessBase: 3, years: range(2002, 2026) },
  { id: "AMC12",   name: "AMC 12",   level: "high",   answerFormat: "multiple_choice", numProblems: 25, hardnessBase: 4, years: range(2000, 2001) },
  { id: "AMC12A",  name: "AMC 12A",  level: "high",   answerFormat: "multiple_choice", numProblems: 25, hardnessBase: 4, years: range(2002, 2026) },
  { id: "AMC12B",  name: "AMC 12B",  level: "high",   answerFormat: "multiple_choice", numProblems: 25, hardnessBase: 4, years: range(2002, 2026) },
  { id: "AHSME",   name: "AHSME",    level: "high",   answerFormat: "multiple_choice", numProblems: 30, hardnessBase: 4, years: range(1974, 1999) },
  // AIME was a single exam through 1999, then split into I and II. "2024_AIME_Problems"
  // does not exist on AoPS — the pages are "2024_AIME_I_Problems" / "..._II_Problems".
  { id: "AIME",    name: "AIME",     level: "olympiad", answerFormat: "integer",       numProblems: 15, hardnessBase: 7, years: range(1983, 1999) },
  { id: "AIME_I",  name: "AIME I",   level: "olympiad", answerFormat: "integer",       numProblems: 15, hardnessBase: 7, years: range(2000, 2026) },
  { id: "AIME_II", name: "AIME II",  level: "olympiad", answerFormat: "integer",       numProblems: 15, hardnessBase: 7, years: range(2000, 2026) },
];

// Local difficulty (1-4) from position within the contest.
export function localDifficulty(number: number, numProblems: number): number {
  const frac = number / numProblems;
  if (frac <= 0.2) return 1;
  if (frac <= 0.5) return 2;
  if (frac <= 0.76) return 3;
  return 4;
}

// Global difficulty (1-10): contest hardness base + a spread across the exam by position.
export function globalDifficulty(number: number, numProblems: number, hardnessBase: number): number {
  const local = localDifficulty(number, numProblems); // 1..4
  const g = Math.round(hardnessBase + (local - 2)); // center at base, spread ±
  return Math.max(1, Math.min(10, g));
}
