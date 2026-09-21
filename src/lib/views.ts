// Load a worksheet's problems into the shape the client components render.
import { db } from "./db";
import { SKILL_BY_ID } from "@/curriculum/skills";
import { parseItems, ROLE_LABEL, type ItemRole } from "./worksheet";
import type { ClientProblem } from "@/components/PracticeClient";
import type { WorksheetItemView, PriorAttempt } from "@/components/WorksheetClient";
import type { Worksheet } from "@prisma/client";

export async function loadWorksheetView(w: Worksheet): Promise<{ items: WorksheetItemView[]; prior: Record<string, PriorAttempt> }> {
  const items = parseItems(w);
  const ids = items.map((i) => i.problemId);
  const problems = await db.problem.findMany({
    where: { id: { in: ids } },
    include: { contest: true, solutions: { orderBy: { order: "asc" } }, topics: { include: { topic: true } }, skills: true },
  });
  const byId = new Map(problems.map((p) => [p.id, p]));

  const views: WorksheetItemView[] = [];
  for (const it of items) {
    const p = byId.get(it.problemId);
    if (!p) continue;
    const skillId = it.skillId ?? p.skills[0]?.skillId;
    const cp: ClientProblem = {
      id: p.id,
      contestName: p.contest.name,
      year: p.year,
      number: p.number,
      statement: p.statement,
      choices: p.choices ? JSON.parse(p.choices) : {},
      answer: p.answer,
      answerFormat: p.contest.answerFormat,
      hasDiagram: p.hasDiagram,
      diagramUrl: p.diagramUrl,
      localDifficulty: p.localDifficulty,
      globalDifficulty: p.globalDifficulty,
      topics: p.topics.map((pt) => ({ name: pt.topic.name, color: pt.topic.color, isPrimary: pt.isPrimary })),
      solutions: p.solutions.map((s) => s.content),
    };
    views.push({ role: it.role, roleLabel: ROLE_LABEL[it.role as ItemRole] ?? it.role, skillId, skillName: skillId ? SKILL_BY_ID[skillId]?.name : undefined, reason: it.reason, problem: cp });
  }

  const attempts = await db.attempt.findMany({ where: { worksheetId: w.id }, orderBy: { createdAt: "asc" } });
  const prior: Record<string, PriorAttempt> = {};
  for (const a of attempts) prior[a.problemId] = { id: a.id, selected: a.selected, isCorrect: a.isCorrect, confidence: a.confidence, errorTag: a.errorTag };
  return { items: views, prior };
}
