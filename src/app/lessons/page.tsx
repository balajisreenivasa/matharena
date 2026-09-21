import Link from "next/link";
import { getLearner, getMasteryMap } from "@/lib/learner";
import { SKILLS, TOPIC_META, type TopicSlug } from "@/curriculum/skills";
import { LEVEL_COLOR, masteryLevel } from "@/lib/mastery";

export const dynamic = "force-dynamic";

export default async function LessonsIndex() {
  const learner = await getLearner();
  const mastery = await getMasteryMap(learner.id);
  return (
    <div>
      <h1 className="text-2xl font-black text-slate-900">Lessons</h1>
      <p className="mb-6 mt-1 text-sm text-slate-600">
        28 skills in teaching order. Tier 1 is the foundation (AMC 10 #1-12), tier 2 is the later-paper material. Each lesson is 10-15
        minutes of reading, then the day&apos;s worksheet applies it.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {(Object.keys(TOPIC_META) as TopicSlug[]).map((slug) => (
          <div key={slug} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: TOPIC_META[slug].color }} />
              <span className="font-bold text-slate-800">{TOPIC_META[slug].name}</span>
            </div>
            {SKILLS.filter((s) => s.topicSlug === slug).map((s) => {
              const m = mastery[s.id];
              const lvl = masteryLevel(m.effective, m.attempts);
              return (
                <Link key={s.id} href={`/lessons/${s.id}`} className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-slate-50">
                  <span>
                    <span className="mr-2 font-mono text-xs text-slate-400">{String(s.order).padStart(2, "0")}</span>
                    <span className="text-slate-800">{s.name}</span>
                    <span className="ml-2 text-xs text-slate-400">tier {s.tier} · {s.amcRange}</span>
                  </span>
                  <span className="rounded-full px-2 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: LEVEL_COLOR[lvl] }}>{lvl}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
