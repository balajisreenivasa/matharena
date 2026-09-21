// Sanity checks for src/curriculum/lessons.ts: every skill in skills.ts must have
// a complete lesson. Run: npx tsx scripts/check-lessons.ts
import { SKILLS } from "../src/curriculum/skills";
import { LESSONS, lessonFor } from "../src/curriculum/lessons";

let fails = 0;
const fail = (msg: string) => {
  fails++;
  console.log(`FAIL  ${msg}`);
};

for (const skill of SKILLS) {
  const lesson = lessonFor(skill.id);
  if (!lesson) {
    fail(`${skill.id}: no lesson`);
    continue;
  }
  if (lesson.skillId !== skill.id) fail(`${skill.id}: skillId mismatch (${lesson.skillId})`);
  if (lesson.workedExamples.length < 2) fail(`${skill.id}: only ${lesson.workedExamples.length} worked examples`);
  if (lesson.keyIdeas.length < 5) fail(`${skill.id}: only ${lesson.keyIdeas.length} key ideas`);
  if (lesson.pitfalls.length < 3) fail(`${skill.id}: only ${lesson.pitfalls.length} pitfalls`);
  if (lesson.formulas.length < 3) fail(`${skill.id}: only ${lesson.formulas.length} formulas`);
  if (!lesson.summary.trim()) fail(`${skill.id}: empty summary`);
  if (!lesson.amcStrategy.trim()) fail(`${skill.id}: empty amcStrategy`);
  if (lesson.estimatedMinutes < 8 || lesson.estimatedMinutes > 15) fail(`${skill.id}: estimatedMinutes ${lesson.estimatedMinutes} out of 8-15`);
  for (const ex of lesson.workedExamples) {
    if (!ex.problem.trim() || !ex.solution.trim()) fail(`${skill.id}: empty worked example`);
  }
  // Every string should have balanced $ delimiters so the renderer never leaks raw LaTeX.
  const strings = [
    lesson.summary,
    lesson.amcStrategy,
    ...lesson.keyIdeas,
    ...lesson.formulas,
    ...lesson.pitfalls,
    ...lesson.workedExamples.flatMap((e) => [e.problem, e.solution]),
  ];
  for (const s of strings) {
    const dollars = (s.match(/\$/g) ?? []).length;
    if (dollars % 2 !== 0) fail(`${skill.id}: unbalanced $ in "${s.slice(0, 60)}..."`);
  }
}

const extra = Object.keys(LESSONS).filter((id) => !SKILLS.some((s) => s.id === id));
if (extra.length) fail(`lessons for unknown skill ids: ${extra.join(", ")}`);

console.log(`${SKILLS.length} skills, ${Object.keys(LESSONS).length} lessons checked, ${fails} failure(s)`);
if (fails > 0) process.exit(1);
