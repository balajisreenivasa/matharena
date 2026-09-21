// Sanity checks for src/curriculum/lessonPlans.ts: every skill in skills.ts must have
// a complete, well-formed 20-minute plan. Run: npx tsx scripts/check-lesson-plans.ts
import { SKILLS } from "../src/curriculum/skills";
import { LESSON_PLANS, lessonPlanFor } from "../src/curriculum/lessonPlans";

let fails = 0;
const fail = (msg: string) => {
  fails++;
  console.log(`FAIL  ${msg}`);
};

const skillIds = new Set(SKILLS.map((s) => s.id));

for (const skill of SKILLS) {
  const plan = lessonPlanFor(skill.id);
  if (!plan) {
    fail(`${skill.id}: no lesson plan`);
    continue;
  }
  if (plan.skillId !== skill.id) fail(`${skill.id}: skillId mismatch (${plan.skillId})`);

  if (plan.objectives.length < 3 || plan.objectives.length > 4) fail(`${skill.id}: ${plan.objectives.length} objectives (want 3-4)`);
  if (plan.parentNotes.length < 2 || plan.parentNotes.length > 4) fail(`${skill.id}: ${plan.parentNotes.length} parent notes (want 2-4)`);

  const minutes = plan.sequence.reduce((sum, step) => sum + step.minutes, 0);
  if (minutes !== 20) fail(`${skill.id}: sequence minutes sum to ${minutes}, not 20`);
  if (plan.sequence.length < 4 || plan.sequence.length > 6) fail(`${skill.id}: ${plan.sequence.length} sequence steps (want 4-6)`);
  for (const step of plan.sequence) {
    if (step.minutes <= 0) fail(`${skill.id}: step "${step.activity}" has ${step.minutes} minutes`);
    if (!step.activity.trim() || !step.detail.trim()) fail(`${skill.id}: empty sequence step`);
  }

  if (!plan.exitTicket.question.trim()) fail(`${skill.id}: exit ticket has no question`);
  if (!plan.exitTicket.answer.trim()) fail(`${skill.id}: exit ticket has no answer`);

  for (const p of plan.prerequisites) {
    if (!skillIds.has(p)) fail(`${skill.id}: unknown prerequisite "${p}"`);
    if (p === skill.id) fail(`${skill.id}: lists itself as a prerequisite`);
  }

  if (!plan.warmup.trim()) fail(`${skill.id}: empty warmup`);
  if (!plan.homework.trim()) fail(`${skill.id}: empty homework`);
  if (!plan.amcConnection.trim()) fail(`${skill.id}: empty amcConnection`);

  // Every string should have balanced $ delimiters so the renderer never leaks raw LaTeX.
  const strings = [
    plan.warmup,
    plan.homework,
    plan.amcConnection,
    plan.exitTicket.question,
    plan.exitTicket.answer,
    ...plan.objectives,
    ...plan.parentNotes,
    ...plan.sequence.flatMap((s) => [s.activity, s.detail]),
  ];
  for (const s of strings) {
    const dollars = (s.match(/\$/g) ?? []).length;
    if (dollars % 2 !== 0) fail(`${skill.id}: unbalanced $ in "${s.slice(0, 60)}..."`);
  }
}

const extra = Object.keys(LESSON_PLANS).filter((id) => !skillIds.has(id));
if (extra.length) fail(`lesson plans for unknown skill ids: ${extra.join(", ")}`);

console.log(`${SKILLS.length} skills, ${Object.keys(LESSON_PLANS).length} lesson plans checked, ${fails} failure(s)`);
if (fails > 0) process.exit(1);
