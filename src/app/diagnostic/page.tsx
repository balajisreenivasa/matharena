import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getLearner, getMasteryMap, planConfig } from "@/lib/learner";
import { buildCalendar } from "@/lib/plan";
import { getOrCreateWorksheet, parseItems } from "@/lib/worksheet";
import { SKILLS, TOPIC_META, type TopicSlug } from "@/curriculum/skills";
import { aopsUrl } from "@/curriculum/calendar";
import { bandFor, projectAmcScore, masteryLevel, LEVEL_COLOR } from "@/lib/mastery";
import { fmtShort, todayStr } from "@/lib/dates";

export const dynamic = "force-dynamic";

// The diagnostic has two halves:
//   1. Paper: the full 2015 AMC 10A (75 min), logged on /mock. Sets the score target.
//   2. In-app: one problem per skill, untimed, skip what's unfamiliar. Seeds mastery
//      and the starting band for every skill.
// This page explains, launches, and afterwards shows the baseline.
export default async function DiagnosticPage() {
  const learner = await getLearner();
  const cfg = planConfig(learner.plan);
  const cal = buildCalendar(cfg);
  const diagDay = cal.find((d) => d.kind === "diagnostic");
  const paper = diagDay?.paperMock;
  const paperLog = paper ? await db.mockExam.findFirst({ where: { userId: learner.id, year: paper.year, contest: paper.contest }, orderBy: { createdAt: "desc" } }) : null;
  const sheet = await db.worksheet.findFirst({ where: { userId: learner.id, kind: "diagnostic" }, orderBy: { createdAt: "asc" } });
  const mastery = await getMasteryMap(learner.id);

  async function start() {
    "use server";
    const l = await getLearner();
    const c = planConfig(l.plan);
    const day = buildCalendar(c).find((d) => d.kind === "diagnostic");
    const date = day?.date ?? todayStr();
    const { worksheet } = await getOrCreateWorksheet(l, date);
    if (worksheet) redirect(`/worksheet/${worksheet.id}`);
    redirect("/diagnostic");
  }

  // Per-skill result from the diagnostic sheet itself (not later practice).
  const items = sheet ? parseItems(sheet) : [];
  const attempts = sheet ? await db.attempt.findMany({ where: { worksheetId: sheet.id }, orderBy: { createdAt: "asc" } }) : [];
  const byProblem = new Map(attempts.map((a) => [a.problemId, a]));
  const result: Record<string, "right" | "wrong" | "blank" | "pending"> = {};
  for (const it of items) {
    if (!it.skillId) continue;
    const a = byProblem.get(it.problemId);
    result[it.skillId] = !a ? "pending" : a.isCorrect ? "right" : a.selected.trim() === "" ? "blank" : "wrong";
  }
  const done = sheet?.status === "done";
  const rights = Object.values(result).filter((r) => r === "right").length;

  // Target from the paper score (the plan's rule), else from the projection.
  const avg = (ids: string[]) => (ids.length ? ids.reduce((a, id) => a + mastery[id].effective, 0) / ids.length : 0);
  const proj = projectAmcScore(avg(SKILLS.filter((s) => s.tier === 1).map((s) => s.id)), avg(SKILLS.filter((s) => s.tier === 2).map((s) => s.id)));
  const baseline = paperLog?.score ?? (done ? proj.expected : null);
  const target =
    baseline === null
      ? null
      : baseline < 60
        ? { name: "Build the floor", range: "aim 75-90", focus: "Problems 1-12 near-perfect. Lessons stay at tier 1 difficulty longer; challenge slots come from #10-15, not #16-20." }
        : baseline < 90
          ? { name: "Achievement Roll / AIME zone", range: "aim 95-105", focus: "Near-perfect 1-15, then 2-4 from 16-20, blank the rest. This is the plan as written." }
          : { name: "Stretch", range: "aim 110+", focus: "Problems 16-22 get the lesson slots' challenge band; mocks are reviewed for time-per-problem, not just misses." };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-black text-slate-900">Diagnostic</h1>
      <p className="mb-6 mt-1 text-sm text-slate-600">
        Two parts on {diagDay ? fmtShort(diagDay.date) : "day 1"}. The paper sets the score target; the in-app set gives every one of the 28 skills a starting point. Fine to split over two sittings.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <section className={`rounded-2xl border bg-white p-5 ${paperLog ? "border-green-200" : "border-red-200"}`}>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Part 1 · Paper</div>
          <h2 className="mt-1 text-lg font-bold text-slate-900">{paper?.label ?? "2015 AMC 10A"}, timed</h2>
          {paperLog ? (
            <p className="mt-2 text-sm text-slate-700">Logged {fmtShort(paperLog.date)}: <b className="text-lg">{paperLog.score}</b> · {paperLog.correct} right, {paperLog.blank} blank, {paperLog.wrong} wrong.</p>
          ) : (
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">
              <li>Print or open the paper. 75 minutes on a timer, no calculator, scratch paper, answers on a bubble sheet.</li>
              <li>Real rules: 6 right, 1.5 blank, 0 wrong. Tell her blanks are fine.</li>
              <li>Grade with the answer key on the same page, then log it with the missed numbers.</li>
            </ol>
          )}
          <div className="mt-3 flex gap-2">
            {paper && <a href={aopsUrl(paper)} target="_blank" rel="noreferrer" className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Open the paper ↗</a>}
            <Link href="/mock" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">{paperLog ? "Mock history" : "Log the score"}</Link>
          </div>
        </section>

        <section className={`rounded-2xl border bg-white p-5 ${done ? "border-green-200" : "border-blue-200"}`}>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Part 2 · In-app</div>
          <h2 className="mt-1 text-lg font-bold text-slate-900">28 problems, one per skill, untimed</h2>
          {done ? (
            <p className="mt-2 text-sm text-slate-700"><b>{rights}/28</b> right. Every skill now has a starting band (below).</p>
          ) : sheet ? (
            <p className="mt-2 text-sm text-slate-700">{attempts.length}/{items.length} answered. Resume when ready.</p>
          ) : (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              <li>Medium difficulty on purpose (band 3-5). Some will be new; that&apos;s the point.</li>
              <li><b>Skip</b> anything unfamiliar instead of guessing. A blank places the skill correctly; a lucky guess hides a gap.</li>
              <li>Mark how sure she is. "Sure and wrong" is the most useful result there is.</li>
              <li>About 45-60 minutes. A break halfway is fine; it saves progress.</li>
            </ul>
          )}
          <div className="mt-3">
            {sheet ? (
              <Link href={`/worksheet/${sheet.id}`} className="inline-block rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">{done ? "Review answers" : "Resume"}</Link>
            ) : (
              <form action={start}><button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">Start the in-app diagnostic</button></form>
            )}
          </div>
        </section>
      </div>

      {target && (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Score target</div>
          <div className="mt-1 text-xl font-black text-slate-900">{target.name} <span className="text-base font-semibold text-slate-600">({target.range})</span></div>
          <p className="mt-1 text-sm text-slate-700">Baseline {paperLog ? `from the paper: ${paperLog.score}` : `projected from the in-app set: ${proj.expected}`}. {target.focus}</p>
          <p className="mt-2 text-xs text-slate-500">Projection right now: {proj.expected} (≈{proj.correct} right, attempt through #{proj.attemptThrough}). It updates after every worksheet.</p>
        </section>
      )}

      {(done || attempts.length > 0) && (
        <section className="mt-6">
          <h2 className="mb-3 text-lg font-bold text-slate-800">Baseline by skill</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {(Object.keys(TOPIC_META) as TopicSlug[]).map((slug) => (
              <div key={slug} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-2 flex items-center gap-2 font-bold text-slate-800"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: TOPIC_META[slug].color }} />{TOPIC_META[slug].name}</div>
                {SKILLS.filter((s) => s.topicSlug === slug).map((s) => {
                  const r = result[s.id] ?? "pending";
                  const m = mastery[s.id];
                  const band = bandFor(m.effective, m.attempts);
                  const lvl = masteryLevel(m.effective, m.attempts);
                  const mark = r === "right" ? "✓" : r === "wrong" ? "✗" : r === "blank" ? "—" : "·";
                  const color = r === "right" ? "text-green-700" : r === "wrong" ? "text-red-700" : "text-slate-400";
                  return (
                    <div key={s.id} className="flex items-center gap-2 border-b border-slate-100 py-1.5 text-sm last:border-0">
                      <span className={`w-4 font-bold ${color}`}>{mark}</span>
                      <Link href={`/lessons/${s.id}`} className="flex-1 text-slate-800 hover:underline">{s.name}</Link>
                      <span className="text-xs text-slate-500">band {band[0]}-{band[1]}</span>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ backgroundColor: LEVEL_COLOR[lvl] }}>{lvl}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">✓ right · ✗ wrong · — left blank. "Band" is the difficulty range (1-10) her next problems on that skill will come from; it moves as she practises.</p>
        </section>
      )}
    </div>
  );
}
