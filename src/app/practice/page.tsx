import Link from "next/link";
import { db } from "@/lib/db";
import { PracticeClient, type ClientProblem } from "@/components/PracticeClient";

export const dynamic = "force-dynamic";

export default async function Practice({ searchParams }: { searchParams: { topic?: string } }) {
  const topicSlug = searchParams.topic;
  const topic = topicSlug ? await db.topic.findUnique({ where: { slug: topicSlug } }) : null;

  const problems = await db.problem.findMany({
    where: topic ? { topics: { some: { topicId: topic.id } } } : {},
    include: { contest: true, solutions: { orderBy: { order: "asc" } }, topics: { include: { topic: true } } },
    orderBy: [{ localDifficulty: "asc" }, { number: "asc" }],
  });

  const client: ClientProblem[] = problems.map((p) => ({
    id: p.id,
    contestName: p.contest.name,
    year: p.year,
    number: p.number,
    statement: p.statement,
    choices: p.choices ? JSON.parse(p.choices) : {},
    answer: p.answer,
    hasDiagram: p.hasDiagram,
    diagramUrl: p.diagramUrl,
    localDifficulty: p.localDifficulty,
    globalDifficulty: p.globalDifficulty,
    topics: p.topics.map((pt) => ({ name: pt.topic.name, color: pt.topic.color, isPrimary: pt.isPrimary })),
    solutions: p.solutions.map((s) => s.content),
  }));

  return (
    <div>
      <div className="mb-6">
        <Link href="/" className="text-sm font-medium text-blue-600 hover:underline">← Back to dashboard</Link>
      </div>
      <PracticeClient problems={client} heading={topic ? `${topic.name} practice` : "Mixed practice"} />
    </div>
  );
}
