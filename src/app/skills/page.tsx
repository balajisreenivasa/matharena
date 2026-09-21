import Link from "next/link";
import { getLearner, getMasteryMap, getMasteryMapFor, planConfig } from "@/lib/learner";
import { SKILLS, SKILL_BY_ID, TOPIC_META, type TopicSlug } from "@/curriculum/skills";
import { SUBSKILLS, PREREQS, nodeStatus, STATUS_COLOR, subSkillsOf, type NodeStatus } from "@/curriculum/subskills";
import { taughtSkillIds } from "@/lib/plan";
import { db } from "@/lib/db";
import { todayStr } from "@/lib/dates";

export const dynamic = "force-dynamic";

// The skill tree: 4 topics -> 28 lesson skills (in teaching order, with prerequisite
// edges) -> 57 sub-skills. Each node shows its mastery score, attempts, accuracy and
// a status: locked (prerequisites not yet met), available, in progress, proficient
// (>=65% over 4+ attempts) or mastered (>=85% over 8+ attempts).
export default async function SkillsPage() {
  const learner = await getLearner();
  const cfg = planConfig(learner.plan);
  const today = todayStr();
  const mastery = await getMasteryMap(learner.id);
  const sub = await getMasteryMapFor(learner.id, SUBSKILLS.map((s) => s.id));
  const taught = new Set(taughtSkillIds(cfg, today, []));
  const lessons = await db.lessonProgress.findMany({ where: { userId: learner.id }, select: { skillId: true, status: true, quizScore: true, quizTotal: true } });
  const lessonBy = new Map(lessons.map((l) => [l.skillId, l]));

  const prereqsOk = (id: string) => (PREREQS[id] ?? []).every((p) => mastery[p].effective >= 0.4 || taught.has(p) || lessonBy.get(p)?.status === "quiz_passed");
  const statusOf = (id: string): NodeStatus => nodeStatus(mastery[id], prereqsOk(id));

  const counts: Record<NodeStatus, number> = { locked: 0, available: 0, "in-progress": 0, proficient: 0, mastered: 0 };
  for (const s of SKILLS) counts[statusOf(s.id)]++;
  const points = Math.round(SUBSKILLS.reduce((a, s) => a + sub[s.id].effective * 100, 0));
  const maxPoints = SUBSKILLS.length * 100;

  // Suggested next: the lowest-order available/in-progress skill not yet proficient.
  const next = [...SKILLS].sort((a, b) => a.order - b.order).find((s) => ["available", "in-progress"].includes(statusOf(s.id)));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Skill tree</h1>
          <p className="mt-1 text-sm text-slate-600">{SKILLS.length} lesson skills · {SUBSKILLS.length} sub-skills · mastery points <b>{points}</b> / {maxPoints}</p>
        </div>
        {next && <Link href={`/lessons/${next.id}`} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">Next up: {next.name} →</Link>}
      </div>

      <div className="mb-6 flex flex-wrap gap-3 text-xs">
        {(Object.keys(STATUS_COLOR) as NodeStatus[]).map((s) => (
          <span key={s} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-700">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLOR[s] }} />{s.replace("-", " ")} · {counts[s]}
          </span>
        ))}
        <span className="text-slate-500">Mastery sequence = the numbered order; arrows list what each skill builds on. Proficient = 65%+ over 4 tries, Mastered = 85%+ over 8.</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {(Object.keys(TOPIC_META) as TopicSlug[]).map((slug) => (
          <section key={slug} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2 font-bold text-slate-800"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: TOPIC_META[slug].color }} />{TOPIC_META[slug].name}</div>
            <ol className="space-y-3">
              {SKILLS.filter((s) => s.topicSlug === slug).sort((a, b) => a.order - b.order).map((s) => {
                const m = mastery[s.id];
                const st = statusOf(s.id);
                const lp = lessonBy.get(s.id);
                const acc = m.attempts ? Math.round((m.correct / m.attempts) * 100) : null;
                return (
                  <li key={s.id} className={`rounded-xl border p-3 ${st === "locked" ? "border-slate-200 opacity-70" : "border-slate-200"}`} style={{ borderLeftWidth: 4, borderLeftColor: STATUS_COLOR[st] }}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-slate-400">{String(s.order).padStart(2, "0")}</span>
                      <Link href={`/lessons/${s.id}`} className="font-semibold text-slate-900 hover:underline">{s.name}</Link>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ backgroundColor: STATUS_COLOR[st] }}>{st.replace("-", " ")}</span>
                      <span className="ml-auto text-xs text-slate-500">
                        <b className="text-slate-800">{Math.round(m.effective * 100)}%</b>{acc !== null ? ` · ${m.correct}/${m.attempts} (${acc}%)` : " · untested"}
                        {lp?.quizScore != null ? ` · quiz ${lp.quizScore}/${lp.quizTotal}` : lp?.status === "read" ? " · lesson read" : ""}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100"><div className="h-full" style={{ width: `${Math.round(m.effective * 100)}%`, backgroundColor: STATUS_COLOR[st] }} /></div>
                    {(PREREQS[s.id] ?? []).length > 0 && (
                      <div className="mt-1 text-[11px] text-slate-500">↳ builds on {(PREREQS[s.id] ?? []).map((p) => SKILL_BY_ID[p]?.name).join(", ")}</div>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {subSkillsOf(s.id).map((x) => {
                        const sm = sub[x.id];
                        const sst = nodeStatus(sm, st !== "locked");
                        return (
                          <span key={x.id} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700" title={`${sst}${sm.attempts ? ` · ${sm.correct}/${sm.attempts}` : ""}`}>
                            <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STATUS_COLOR[sst] }} />{x.name}{sm.attempts ? ` ${Math.round(sm.effective * 100)}%` : ""}
                          </span>
                        );
                      })}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
