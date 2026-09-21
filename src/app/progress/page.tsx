import Link from "next/link";
import { db } from "@/lib/db";
import { getLearner, getMasteryMap, planConfig } from "@/lib/learner";
import { LEVEL_COLOR, masteryLevel, projectAmcScore, ERROR_TAGS, type ErrorTag } from "@/lib/mastery";
import { SKILLS, TOPIC_META, type TopicSlug } from "@/curriculum/skills";
import { addDays, daysBetween, fmtShort, todayStr } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const learner = await getLearner();
  const cfg = planConfig(learner.plan);
  const mastery = await getMasteryMap(learner.id);
  const today = todayStr();

  const tier1 = SKILLS.filter((s) => s.tier === 1).map((s) => mastery[s.id].effective);
  const tier2 = SKILLS.filter((s) => s.tier === 2).map((s) => mastery[s.id].effective);
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const projection = projectAmcScore(avg(tier1), avg(tier2));
  const anyAttempts = Object.values(mastery).some((m) => m.attempts > 0);

  // Last 14 days of activity.
  const since = new Date(Date.now() - 14 * 86_400_000);
  const attempts = await db.attempt.findMany({ where: { userId: learner.id, createdAt: { gte: since } }, select: { isCorrect: true, createdAt: true } });
  const dayRows: { date: string; total: number; correct: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const date = addDays(today, -i);
    const rows = attempts.filter((a) => a.createdAt.toISOString().slice(0, 10) === date || localDate(a.createdAt) === date);
    dayRows.push({ date, total: rows.length, correct: rows.filter((a) => a.isCorrect).length });
  }
  const maxDay = Math.max(1, ...dayRows.map((d) => d.total));

  const sheets = await db.worksheet.findMany({ where: { userId: learner.id }, orderBy: { date: "desc" }, take: 60 });
  const done = sheets.filter((s) => s.status === "done");
  // Streak: consecutive calendar days (ending today or yesterday) with a completed sheet.
  const doneDates = new Set(done.map((s) => s.date));
  let streak = 0;
  for (let d = doneDates.has(today) ? today : addDays(today, -1); doneDates.has(d); d = addDays(d, -1)) streak++;

  const mocks = await db.mockExam.findMany({ where: { userId: learner.id }, orderBy: { date: "asc" } });
  const appMocks = sheets.filter((s) => (s.kind === "mock" || s.kind === "extra-mock") && s.status === "done").sort((a, b) => a.date.localeCompare(b.date));

  const weakest = [...SKILLS].sort((a, b) => mastery[a.id].effective - mastery[b.id].effective).slice(0, 5);
  const daysToA = daysBetween(today, cfg.examADate);

  // Error tags over the whole season, plus "sure and wrong" count.
  const allAttempts = await db.attempt.findMany({ where: { userId: learner.id }, select: { isCorrect: true, confidence: true, errorTag: true, timeSpentSec: true } });
  const tagCounts: Record<string, number> = {};
  let sureWrong = 0;
  let timed = 0, timeSum = 0;
  for (const a of allAttempts) {
    if (!a.isCorrect && a.errorTag) tagCounts[a.errorTag] = (tagCounts[a.errorTag] ?? 0) + 1;
    if (!a.isCorrect && a.confidence === "sure") sureWrong++;
    if (a.timeSpentSec && a.timeSpentSec > 0 && a.timeSpentSec < 1800) { timed++; timeSum += a.timeSpentSec; }
  }
  const avgTime = timed ? Math.round(timeSum / timed) : 0;
  const dueReview = await db.reviewItem.count({ where: { userId: learner.id, dueDate: { lte: today } } });
  const queueSize = await db.reviewItem.count({ where: { userId: learner.id } });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-black text-slate-900">Progress</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <Stat label="Projected AMC 10" value={anyAttempts ? `${projection.expected}` : "—"} sub={anyAttempts ? `≈ ${projection.correct} right · attempt through #${projection.attemptThrough}` : "take the diagnostic"} />
        <Stat label="Streak" value={`${streak}`} sub="days in a row" />
        <Stat label="Worksheets done" value={`${done.length}`} sub={`${sheets.length - done.length} open · ${avgTime ? `${Math.floor(avgTime / 60)}:${String(avgTime % 60).padStart(2, "0")} avg/problem` : "no timing yet"}`} />
        <Stat label="Days to 10A" value={`${Math.max(0, daysToA)}`} sub={fmtShort(cfg.examADate)} />
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
          <h2 className="mb-2 font-bold text-slate-800">Error tags (all misses)</h2>
          {Object.keys(tagCounts).length === 0 && <p className="text-slate-500">No tagged misses yet. Every miss on a worksheet asks for one.</p>}
          {(Object.keys(ERROR_TAGS) as ErrorTag[]).filter((t) => tagCounts[t]).map((t) => {
            const n = tagCounts[t];
            const max = Math.max(...Object.values(tagCounts));
            return (
              <div key={t} className="mb-2">
                <div className="flex justify-between"><span><b>{t}</b> {ERROR_TAGS[t].name} <span className="text-slate-500">· {ERROR_TAGS[t].blurb}</span></span><span className="font-semibold">{n}</span></div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100"><div className="h-full rounded-full bg-amber-500" style={{ width: `${(n / max) * 100}%` }} /></div>
              </div>
            );
          })}
          <p className="mt-2 text-xs text-slate-500">{sureWrong} "sure" answers were wrong. Those are the highest-value review items.</p>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
          <h2 className="mb-2 font-bold text-slate-800">Review queue</h2>
          <div className="text-3xl font-black text-slate-900">{dueReview}<span className="ml-2 text-base font-normal text-slate-500">due today · {queueSize} in the queue</span></div>
          <p className="mt-2 text-xs text-slate-500">A miss comes back after 1 day, then 3, 7 and 14. A correct redo advances it; a wrong redo resets it. One review slot is built into every daily worksheet, two into adaptive days, four into mock-review days.</p>
        </section>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold text-slate-800">Last 14 days</h2>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex h-28 items-end gap-1">
            {dayRows.map((d) => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1" title={`${fmtShort(d.date)}: ${d.correct}/${d.total}`}>
                <div className="flex w-full flex-col justify-end" style={{ height: "90px" }}>
                  <div className="w-full rounded-t bg-slate-200" style={{ height: `${((d.total - d.correct) / maxDay) * 90}px` }} />
                  <div className="w-full bg-blue-600" style={{ height: `${(d.correct / maxDay) * 90}px` }} />
                </div>
                <div className="text-[10px] text-slate-400">{d.date.slice(8)}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-slate-500">Blue = correct, grey = missed. Hover a bar for the count.</div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold text-slate-800">Mastery by skill</h2>
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
                  <Link key={s.id} href={`/lessons/${s.id}`} className="mb-2 block rounded-lg px-1 py-0.5 hover:bg-slate-50">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">{s.name}</span>
                      <span className="text-xs text-slate-500">{m.attempts ? `${m.correct}/${m.attempts} · ` : ""}{lvl}</span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full" style={{ width: `${Math.round(m.effective * 100)}%`, backgroundColor: LEVEL_COLOR[lvl] }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-800">Focus next</h2>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
            {weakest.map((s) => (
              <div key={s.id} className="flex items-center justify-between border-b border-slate-100 py-1.5 last:border-0">
                <Link href={`/lessons/${s.id}`} className="text-blue-700 hover:underline">{s.name}</Link>
                <span className="text-slate-500">{Math.round(mastery[s.id].effective * 100)}%</span>
              </div>
            ))}
            <p className="mt-3 text-xs text-slate-500">Review days pull from this list automatically.</p>
          </div>
        </section>
        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-800">Mock exams</h2>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
            {!mocks.length && !appMocks.length && <p className="text-slate-500">None yet. Timed mocks start in the sharpen phase; log paper mocks on the <Link href="/mock" className="text-blue-700 underline">Mock page</Link>.</p>}
            {appMocks.map((m) => (
              <div key={m.id} className="flex items-center justify-between border-b border-slate-100 py-1.5">
                <span>{fmtShort(m.date)} · in-app mock</span>
                <Link href={`/worksheet/${m.id}`} className="font-semibold text-slate-800 hover:underline">{m.score}/{m.total}</Link>
              </div>
            ))}
            {mocks.map((m) => (
              <div key={m.id} className="flex items-center justify-between border-b border-slate-100 py-1.5 last:border-0">
                <span>{fmtShort(m.date)} · {m.year} {m.contest}</span>
                <span className="font-semibold text-slate-800">{m.score} <span className="font-normal text-slate-500">({m.correct}/{m.blank}/{m.wrong})</span></span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function localDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-black text-slate-900">{value}</div>
      <div className="text-xs text-slate-500">{sub}</div>
    </div>
  );
}
