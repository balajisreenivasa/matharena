import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SKILL_BY_ID, TOPIC_META } from "@/curriculum/skills";
import { lessonFor } from "@/curriculum/lessons";
import { subSkillsOf, PREREQS } from "@/curriculum/subskills";
import { resourcesFor, PAST_PAPERS } from "@/curriculum/resources";
import { getLearner, getMasteryMap, getMasteryMapFor } from "@/lib/learner";
import { LEVEL_COLOR, masteryLevel } from "@/lib/mastery";
import { createSkillPractice } from "@/lib/worksheet";
import { todayStr } from "@/lib/dates";
import { db } from "@/lib/db";
import { LessonClient, type LessonProgressView } from "@/components/LessonClient";

export const dynamic = "force-dynamic";

const KIND_ICON: Record<string, string> = { wiki: "📖", book: "📚", problems: "🧩", video: "▶", drill: "🎯" };

export default async function LessonPage({ params }: { params: { skillId: string } }) {
  const skill = SKILL_BY_ID[params.skillId];
  if (!skill) notFound();
  const lesson = lessonFor(skill.id);
  const learner = await getLearner();
  const mastery = (await getMasteryMap(learner.id))[skill.id];
  const lvl = masteryLevel(mastery.effective, mastery.attempts);
  const subs = subSkillsOf(skill.id);
  const subMastery = await getMasteryMapFor(learner.id, subs.map((s) => s.id));
  const bank = await db.problemSkill.count({ where: { skillId: skill.id } });
  const resources = resourcesFor(skill.id);
  const prereqs = PREREQS[skill.id] ?? [];

  const date = todayStr();
  await db.lessonView.upsert({
    where: { userId_skillId_date: { userId: learner.id, skillId: skill.id, date } },
    update: {},
    create: { userId: learner.id, skillId: skill.id, date },
  });

  const row = await db.lessonProgress.findUnique({ where: { userId_skillId: { userId: learner.id, skillId: skill.id } } });
  let data: { checkpoints: Record<string, { answer: string; correct: boolean }>; examples: Record<string, { answer: string; correct: boolean }> } = { checkpoints: {}, examples: {} };
  try {
    if (row) data = { checkpoints: JSON.parse(row.data).checkpoints ?? {}, examples: JSON.parse(row.data).examples ?? {} };
  } catch {}
  const initial: LessonProgressView = {
    status: row?.status ?? "started",
    checkpoints: data.checkpoints,
    examples: data.examples,
    quizScore: row?.quizScore ?? null,
    quizTotal: row?.quizTotal ?? null,
    quizWorksheetId: row?.quizWorksheetId ?? null,
  };

  async function startPractice() {
    "use server";
    const l = await getLearner();
    const w = await createSkillPractice(l, skill.id, todayStr());
    redirect(`/worksheet/${w.id}`);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex justify-between text-sm">
        <Link href="/lessons" className="font-medium text-blue-600 hover:underline">← All lessons</Link>
        <Link href="/skills" className="font-medium text-blue-600 hover:underline">Skill tree →</Link>
      </div>
      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full px-2.5 py-0.5 font-semibold text-white" style={{ backgroundColor: TOPIC_META[skill.topicSlug].color }}>{TOPIC_META[skill.topicSlug].name}</span>
          <span className="rounded-full border border-slate-300 px-2.5 py-0.5 text-slate-600">Lesson {skill.order} · tier {skill.tier} · AMC 10 {skill.amcRange}</span>
          <span className="rounded-full px-2.5 py-0.5 font-semibold text-white" style={{ backgroundColor: LEVEL_COLOR[lvl] }}>{lvl}{mastery.attempts ? ` · ${mastery.correct}/${mastery.attempts} · ${Math.round(mastery.effective * 100)}%` : ""}</span>
          <span className="ml-auto text-slate-400">{bank} problems in the bank</span>
        </div>
        <h1 className="mt-3 text-2xl font-black text-slate-900">{skill.name}</h1>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {subs.map((s) => {
            const m = subMastery[s.id];
            const l = masteryLevel(m.effective, m.attempts);
            return (
              <span key={s.id} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700" title={`${l}${m.attempts ? ` · ${m.correct}/${m.attempts}` : ""}`}>
                <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: LEVEL_COLOR[l] }} />{s.name}{m.attempts ? ` ${Math.round(m.effective * 100)}%` : ""}
              </span>
            );
          })}
        </div>
        {prereqs.length > 0 && (
          <div className="mt-2 text-xs text-slate-500">Builds on: {prereqs.map((p, i) => <span key={p}>{i > 0 && ", "}<Link href={`/lessons/${p}`} className="text-blue-700 hover:underline">{SKILL_BY_ID[p]?.name}</Link></span>)}</div>
        )}
        <form action={startPractice} className="mt-4">
          <button className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Extra practice (8 problems)</button>
        </form>
      </div>

      {lesson ? <LessonClient skillId={skill.id} skillName={skill.name} lesson={lesson} initial={initial} /> : <p className="text-slate-500">Lesson text not written yet.</p>}

      {resources.length > 0 && (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-1 text-lg font-bold text-slate-800">Go deeper</h2>
          <p className="mb-3 text-xs text-slate-500">Free references for this skill. The AoPS wiki articles are the canonical definitions; the category pages hold hundreds of past problems sorted by difficulty; Alcumus adapts to her like this app does.</p>
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {resources.map((r) => (
              <li key={r.url + r.label} className="text-sm">
                <a href={r.url} target="_blank" rel="noreferrer" className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-blue-700 hover:bg-slate-50 hover:underline">
                  <span className="w-5 flex-none text-center">{KIND_ICON[r.kind]}</span>
                  <span>{r.label}</span>
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
            Past papers: {PAST_PAPERS.map((p, i) => (
              <span key={p.url}>{i > 0 && " · "}<a href={p.url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">{p.label}</a></span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
