import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SKILL_BY_ID, TOPIC_META } from "@/curriculum/skills";
import { lessonFor } from "@/curriculum/lessons";
import { RichText } from "@/components/Math";
import { getLearner, getMasteryMap } from "@/lib/learner";
import { LEVEL_COLOR, masteryLevel } from "@/lib/mastery";
import { createSkillPractice } from "@/lib/worksheet";
import { todayStr } from "@/lib/dates";
import { db } from "@/lib/db";
import { resourcesFor, PAST_PAPERS } from "@/curriculum/resources";

const KIND_ICON: Record<string, string> = { wiki: "📖", book: "📚", problems: "🧩", video: "▶", drill: "🎯" };

export const dynamic = "force-dynamic";

export default async function LessonPage({ params }: { params: { skillId: string } }) {
  const skill = SKILL_BY_ID[params.skillId];
  if (!skill) notFound();
  const lesson = lessonFor(skill.id);
  const learner = await getLearner();
  const mastery = (await getMasteryMap(learner.id))[skill.id];
  const lvl = masteryLevel(mastery.effective, mastery.attempts);
  const bank = await db.problemSkill.count({ where: { skillId: skill.id } });
  const resources = resourcesFor(skill.id);
  // Opening the lesson counts as reading it for Today's checklist and the evening mail.
  const date = todayStr();
  await db.lessonView.upsert({
    where: { userId_skillId_date: { userId: learner.id, skillId: skill.id, date } },
    update: {},
    create: { userId: learner.id, skillId: skill.id, date },
  });

  async function startPractice() {
    "use server";
    const w = await createSkillPractice(skill.id, todayStr());
    redirect(`/worksheet/${w.id}`);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 text-sm"><Link href="/lessons" className="font-medium text-blue-600 hover:underline">← All lessons</Link></div>
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full px-2.5 py-0.5 font-semibold text-white" style={{ backgroundColor: TOPIC_META[skill.topicSlug].color }}>{TOPIC_META[skill.topicSlug].name}</span>
          <span className="rounded-full border border-slate-300 px-2.5 py-0.5 text-slate-600">Lesson {skill.order} · tier {skill.tier} · AMC 10 {skill.amcRange}</span>
          <span className="rounded-full px-2.5 py-0.5 font-semibold text-white" style={{ backgroundColor: LEVEL_COLOR[lvl] }}>{lvl}{mastery.attempts ? ` · ${mastery.correct}/${mastery.attempts}` : ""}</span>
          <span className="ml-auto text-slate-400">{bank} problems in the bank</span>
        </div>
        <h1 className="mt-3 text-2xl font-black text-slate-900">{skill.name}</h1>
        {lesson ? <p className="mt-2 leading-relaxed text-slate-700"><RichText text={lesson.summary} /></p> : <p className="mt-2 text-slate-500">Lesson text not written yet.</p>}
        <form action={startPractice} className="mt-4">
          <button className="rounded-xl bg-slate-900 px-5 py-2 font-semibold text-white hover:bg-slate-700">Practice this skill (8 problems)</button>
        </form>
      </div>

      {lesson && (
        <div className="space-y-6">
          <Section title="Key ideas">
            <ul className="list-disc space-y-2 pl-5">
              {lesson.keyIdeas.map((k, i) => <li key={i}><RichText text={k} /></li>)}
            </ul>
          </Section>
          <Section title="Formulas & facts to know cold">
            <ul className="space-y-2">
              {lesson.formulas.map((f, i) => <li key={i} className="rounded-lg bg-slate-50 px-3 py-2"><RichText text={f} /></li>)}
            </ul>
          </Section>
          <Section title="Worked examples">
            <div className="space-y-5">
              {lesson.workedExamples.map((ex, i) => (
                <div key={i} className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Example {i + 1}</div>
                  <div className="leading-relaxed text-slate-900"><RichText text={ex.problem} /></div>
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-semibold text-blue-700">Show solution</summary>
                    <div className="mt-2 leading-relaxed text-slate-800"><RichText text={ex.solution} /></div>
                  </details>
                </div>
              ))}
            </div>
          </Section>
          <Section title="Pitfalls">
            <ul className="list-disc space-y-2 pl-5">
              {lesson.pitfalls.map((k, i) => <li key={i}><RichText text={k} /></li>)}
            </ul>
          </Section>
          <Section title="On the AMC 10">
            <p className="leading-relaxed"><RichText text={lesson.amcStrategy} /></p>
            <p className="mt-2 text-xs text-slate-500">About {lesson.estimatedMinutes} minutes to read.</p>
          </Section>
        </div>
      )}

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="mb-3 text-lg font-bold text-slate-800">{title}</h2>
      <div className="text-slate-800">{children}</div>
    </section>
  );
}
