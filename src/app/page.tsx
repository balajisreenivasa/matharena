import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const topics = await db.topic.findMany({ orderBy: { name: "asc" } });
  const counts = await Promise.all(
    topics.map(async (t) => ({
      ...t,
      count: await db.problemTopic.count({ where: { topicId: t.id } }),
    }))
  );
  const total = await db.problem.count();
  const contests = await db.contest.count();

  return (
    <div>
      <section className="mb-8 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white">
        <h1 className="text-3xl font-black">Practice competition math, by topic.</h1>
        <p className="mt-2 max-w-xl text-blue-100">
          {total} problems across {contests} contest{contests === 1 ? "" : "s"} loaded. Pick a topic to drill, or take a
          mixed set. Diagnostic exams and progress tracking are coming next.
        </p>
        <div className="mt-5 flex gap-3">
          <Link href="/practice" className="rounded-xl bg-white px-5 py-2.5 font-semibold text-blue-700 hover:bg-blue-50">
            Start mixed practice
          </Link>
        </div>
      </section>

      <h2 className="mb-3 text-lg font-bold text-slate-800">Topics</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {counts.map((t) => (
          <Link
            key={t.id}
            href={`/practice?topic=${t.slug}`}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="mb-3 h-2 w-12 rounded-full" style={{ backgroundColor: t.color }} />
            <div className="text-lg font-bold text-slate-900">{t.name}</div>
            <div className="mt-1 text-sm text-slate-500">{t.count} problem{t.count === 1 ? "" : "s"}</div>
            <div className="mt-3 text-sm font-semibold text-blue-600 group-hover:underline">Practice →</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
