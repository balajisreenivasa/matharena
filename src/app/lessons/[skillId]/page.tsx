import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SKILL_BY_ID, TOPIC_META } from "@/curriculum/skills";
import { lessonFor } from "@/curriculum/lessons";
import { subSkillsOf, PREREQS } from "@/curriculum/subskills";
import { resourcesFor, PAST_PAPERS } from "@/curriculum/resources";
import { readingFor, videosFor, extraFor } from "@/curriculum/research";
import { lessonPlanFor } from "@/curriculum/lessonPlans";
import { RichText } from "@/components/Math";
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
  const reading = readingFor(skill.id);
  const videos = videosFor(skill.id);
  const extras = extraFor(skill.id);
  const prereqs = PREREQS[skill.id] ?? [];
  const plan = lessonPlanFor(skill.id);

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

      {plan && (
        <details className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <summary className="cursor-pointer text-lg font-bold text-amber-950">Teaching plan for the parent (20-minute lesson block)</summary>
          <div className="mt-3 grid gap-4 text-sm text-amber-950 md:grid-cols-2">
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide">By the end she can</div>
              <ul className="list-disc space-y-1 pl-5">{plan.objectives.map((o, i) => <li key={i}><RichText text={o} /></li>)}</ul>
              {plan.prerequisites.length > 0 && <div className="mt-2 text-xs">Needs first: {plan.prerequisites.map((p) => SKILL_BY_ID[p]?.name).filter(Boolean).join(", ")}</div>}
              <div className="mb-1 mt-3 text-xs font-semibold uppercase tracking-wide">Warm-up (2-3 min)</div>
              <p><RichText text={plan.warmup} /></p>
              <div className="mb-1 mt-3 text-xs font-semibold uppercase tracking-wide">Exit ticket (60 s)</div>
              <p><RichText text={plan.exitTicket.question} /> <span className="text-xs">(answer: <RichText text={`$${plan.exitTicket.answer}$`} />)</span></p>
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide">Sequence</div>
              <ol className="space-y-1.5">
                {plan.sequence.map((s, i) => (
                  <li key={i} className="flex gap-2"><span className="w-12 flex-none font-mono text-xs">{s.minutes} min</span><span><b>{s.activity}.</b> <RichText text={s.detail} /></span></li>
                ))}
              </ol>
              <div className="mb-1 mt-3 text-xs font-semibold uppercase tracking-wide">Homework</div>
              <p><RichText text={plan.homework} /></p>
              <div className="mb-1 mt-3 text-xs font-semibold uppercase tracking-wide">Watch for</div>
              <ul className="list-disc space-y-1 pl-5">{plan.parentNotes.map((n, i) => <li key={i}><RichText text={n} /></li>)}</ul>
              <div className="mb-1 mt-3 text-xs font-semibold uppercase tracking-wide">On past papers</div>
              <p><RichText text={plan.amcConnection} /></p>
            </div>
          </div>
        </details>
      )}

      {(reading.length > 0 || videos.length > 0 || extras.length > 0) && (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-1 text-lg font-bold text-slate-800">Reading, problem sets & videos</h2>
          <p className="mb-3 text-xs text-slate-500">Free sources verified for this skill (<Link href="/resources" className="text-blue-700 underline">whole library</Link>). ✓✓ = end-of-chapter problems with solutions.</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Textbook chapters</div>
              <ul className="space-y-1.5 text-sm">
                {reading.map(({ book, chapters }) => (
                  <li key={book.url}>
                    <a href={book.url} target="_blank" rel="noreferrer" className="font-semibold text-blue-700 hover:underline">{book.title}</a>
                    <span className="text-xs text-slate-500"> {book.free ? "free" : "paid"}{book.hasEndOfChapterProblems && book.hasSolutions ? " ✓✓" : book.hasEndOfChapterProblems ? " ✓" : ""}</span>
                    <div className="text-xs text-slate-700">{chapters.map((c) => `ch. ${c.chapter} ${c.title}`).join(" · ")}</div>
                    {book.freeExcerpt?.url && chapters.some((c) => c.chapter === book.freeExcerpt?.chapter) && <a href={book.freeExcerpt.url} target="_blank" rel="noreferrer" className="text-xs text-blue-700 underline">This chapter is the free excerpt ↗</a>}
                  </li>
                ))}
                {!reading.length && <li className="text-xs text-slate-500">No chapter mapping yet.</li>}
              </ul>
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Videos & handouts</div>
              <ul className="space-y-1.5 text-sm">
                {videos.map((v) => (
                  <li key={v.url}><a href={v.url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">▶ {v.title}</a></li>
                ))}
                {extras.map((r) => (
                  <li key={r.url}><a href={r.url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">{KIND_ICON[r.kind] ?? "•"} {r.label}</a>{r.note && <span className="text-xs text-slate-500"> — {r.note}</span>}</li>
                ))}
                {!videos.length && !extras.length && <li className="text-xs text-slate-500">None verified yet.</li>}
              </ul>
            </div>
          </div>
        </section>
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
