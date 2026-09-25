import Link from "next/link";
import { db } from "@/lib/db";
import { PracticeClient, type ClientProblem } from "@/components/PracticeClient";

export const dynamic = "force-dynamic";

const SET_SIZE = 25;

// ?kind=free | mc | diagram narrows to free-response, multiple-choice, or problems with a figure.
export default async function Practice({ searchParams }: { searchParams: { topic?: string; skill?: string; kind?: string } }) {
  const topicSlug = searchParams.topic;
  const topic = topicSlug ? await db.topic.findUnique({ where: { slug: topicSlug } }) : null;
  const skill = searchParams.skill ? await db.skill.findUnique({ where: { id: searchParams.skill } }) : null;
  const kind = searchParams.kind === "free" ? { choices: null } : searchParams.kind === "mc" ? { NOT: { choices: null } } : searchParams.kind === "diagram" ? { hasDiagram: true } : {};
  const where = { ...(skill ? { skills: { some: { skillId: skill.id } } } : topic ? { topics: { some: { topicId: topic.id } } } : {}), ...kind };

  // The bank holds >12k problems, so never load them all. Take a random window
  // of SET_SIZE so repeat visits get a different set.
  const total = await db.problem.count({ where });
  const skip = total > SET_SIZE ? Math.floor(Math.random() * (total - SET_SIZE)) : 0;

  const problems = await db.problem.findMany({
    where,
    include: { contest: true, solutions: { orderBy: { order: "asc" } }, topics: { include: { topic: true } } },
    orderBy: { id: "asc" },
    skip,
    take: SET_SIZE,
  });

  const client: ClientProblem[] = problems
    .map((p) => ({
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
    }))
    // Ramp difficulty within the set rather than jumping around.
    .sort((a, b) => a.localDifficulty - b.localDifficulty || a.number - b.number);

  const heading = skill ? `${skill.name} practice` : topic ? `${topic.name} practice` : "Mixed practice";

  return (
    <div>
      <div className="mb-6">
        <Link href="/" className="text-sm font-medium text-blue-600 hover:underline">
          ← Back to dashboard
        </Link>
      </div>
      <PracticeClient problems={client} heading={`${heading} · ${total.toLocaleString()} available`} />
    </div>
  );
}
