// The 7-week curriculum template (from amc10-prep-plan-and-claude-code-prompts.md),
// expressed as an ordered list of study days rather than fixed dates so it can slide
// past pause dates and compress/expand to the real runway. plan.ts lays it onto dates.
//
// Paper mocks are real past AMC 10 papers read on the AoPS wiki and done on paper.
// Test allocation (so nothing gets spoiled):
//   2015 10A                              diagnostic
//   2016 10A, 2017 10B, 2018 10A, 2019 10B early mocks
//   2022 10A, 2023 10A, 2024 10A, 2024 10B late mocks (closest to current style)
//   2025 10A/10B                          spare mocks
// The in-app bank (MATH + AIME datasets) contains no AMC papers, so nothing here can leak.

import type { DayKind, PaperMock } from "@/lib/plan";

export type TemplateEntry = {
  kind: DayKind;
  skillIds?: string[];
  label?: string;
  paperMock?: PaperMock;
  note?: string;
  focus?: "hard" | "mid" | "easy";
};

const mock = (year: number, contest: "AMC10A" | "AMC10B", n: number): TemplateEntry => ({
  kind: "mock",
  label: `Mock ${n}: ${year} ${contest === "AMC10A" ? "10A" : "10B"}`,
  paperMock: { year, contest, label: `${year} AMC ${contest === "AMC10A" ? "10A" : "10B"}` },
  note: "Paper, pencil, no calculator, 75 min, bubble sheet. Log the score on the Mock page.",
});
const review = (note = "Redo every miss without looking at the solution first. Tag each one C/S/E/R/T."): TemplateEntry => ({ kind: "mock_review", label: "Mock review", note });
const lesson = (skillIds: string[], note?: string): TemplateEntry => ({ kind: "lesson", skillIds, note });

// Study days before AMC 10A (the light day and exam day are anchored separately).
export const PRE_EXAM_TEMPLATE: TemplateEntry[] = [
  // ---- Week 1: Diagnostic + Algebra ----
  { kind: "diagnostic", label: "Diagnostic", paperMock: { year: 2015, contest: "AMC10A", label: "2015 AMC 10A" }, note: "Full timed 2015 AMC 10A on paper (log it on the Mock page), plus the in-app skill diagnostic to seed mastery." },
  lesson(["alg-linear"], "Also review the diagnostic: tag every miss."),
  lesson(["alg-ratios"]),
  lesson(["alg-quadratics"], "Includes Simon's Favorite Factoring Trick."),
  lesson(["alg-exponents", "alg-inequalities"], "Exponents/radicals plus absolute value and inequalities."),
  { kind: "quiz", skillIds: ["alg-sequences", "alg-functions"], label: "Sequences & functions + Algebra quiz", note: "Short lesson, then a 12-problem algebra quiz in 40 minutes." },
  review("Review queue only, 20 minutes."),

  // ---- Week 2: Counting & Probability ----
  lesson(["cp-casework"], "Counting basics, casework, complementary counting."),
  lesson(["cp-counting-basics"], "Permutations, combinations, correcting for overcounting."),
  lesson(["cp-stars-bars", "cp-paths-recursion"], "Stars and bars, grid paths, distributions."),
  lesson(["cp-probability"], "Probability basics and geometric probability."),
  lesson(["cp-expected"], "Expected value, inclusion-exclusion, intro recursion."),
  mock(2016, "AMC10A", 1),
  review(),

  // ---- Week 3: Number Theory ----
  lesson(["nt-divisibility"], "Primes, factorization, number and sum of divisors."),
  lesson(["nt-gcd-lcm"]),
  lesson(["nt-modular"], "Modular arithmetic, last digits, cycles."),
  lesson(["nt-bases"], "Divisibility rules and number bases."),
  lesson(["nt-diophantine"], "Diophantine equations, Chicken McNugget, digit problems."),
  mock(2017, "AMC10B", 2),
  review(),

  // ---- Week 4: Geometry ----
  lesson(["geo-angles", "geo-area"], "Triangle area formulas, Pythagorean triples, special right triangles."),
  lesson(["geo-similar"], "Similar triangles, angle bisector theorem, area ratios."),
  lesson(["geo-circles"], "Arcs, inscribed angles, tangents, power of a point."),
  lesson(["geo-polygons", "geo-coordinate"], "Polygons, coordinate geometry, shoelace."),
  lesson(["geo-solid"], "Volume, surface area, space diagonals, cross-sections."),
  mock(2018, "AMC10A", 3),
  review(),

  // ---- Week 5: Second pass, harder ----
  lesson(["alg-polynomials"], "Polynomials, remainder theorem, symmetric systems."),
  lesson(["cp-paths-recursion"], "Recursion, bijections, hard casework."),
  lesson(["nt-factorials-powers"], "Simultaneous congruences, powers of primes in n!."),
  lesson(["geo-trig", "geo-circles"], "Mass points, cyclic quadrilaterals, length chasing."),
  lesson(["alg-ratios", "alg-linear"], "Statistics (mean/median/mode), logic, word-problem speed."),
  mock(2019, "AMC10B", 4),
  review(),

  // ---- Week 6: Mock-heavy ----
  { kind: "adaptive", label: "Adaptive worksheet", note: "Weakest two skills." },
  mock(2022, "AMC10A", 5),
  review("Mock review + redo all misses."),
  { kind: "adaptive", label: "Adaptive worksheet" },
  { kind: "strategy", label: "Test strategy + problems 16-20", focus: "hard", note: "Pacing checkpoints, skip rule, answer-choice tactics. Worksheet is a #16-20 difficulty set." },
  mock(2023, "AMC10A", 6),
  review(),

  // ---- Week 7 ----
  { kind: "adaptive", label: "Adaptive + full error-log redo", note: "Redo every problem in the review queue." },
  mock(2024, "AMC10A", 7),
  // then: light day (anchored), AMC 10A (anchored)
];

// Days between AMC 10A and the light day before 10B, in order from the day after 10A.
export const GAP_WEEK_TEMPLATE: TemplateEntry[] = [
  { kind: "off", label: "Off", note: "Rest. No math." },
  { kind: "mock_review", label: "Review 10A", note: "Go through 10A with the posted solutions and tag every miss." },
  { kind: "adaptive", label: "Adaptive from 10A misses" },
  mock(2024, "AMC10B", 8),
  review(),
  { kind: "adaptive", label: "Adaptive, problems 11-20", focus: "mid" },
  // then: light day (anchored), AMC 10B (anchored)
];

export const SPARE_MOCKS: PaperMock[] = [
  { year: 2025, contest: "AMC10A", label: "2025 AMC 10A" },
  { year: 2025, contest: "AMC10B", label: "2025 AMC 10B" },
];

export function aopsUrl(m: PaperMock): string {
  return `https://artofproblemsolving.com/wiki/index.php/${m.year}_AMC_${m.contest === "AMC10A" ? "10A" : "10B"}_Problems`;
}
