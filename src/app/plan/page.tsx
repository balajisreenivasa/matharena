import Link from "next/link";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getLearner, planConfig } from "@/lib/learner";
import { buildCalendar, IS_STUDY_DAY, KIND_COLOR, KIND_LABEL } from "@/lib/plan";
import { aopsUrl } from "@/curriculum/calendar";
import { fmtShort, todayStr, daysBetween, isValidISODate } from "@/lib/dates";
import { SKILL_BY_ID } from "@/curriculum/skills";

export const dynamic = "force-dynamic";

const WEEK_TITLE: Record<number, string> = {
  1: "Diagnostic + Algebra",
  2: "Counting & Probability",
  3: "Number Theory",
  4: "Geometry",
  5: "Second pass, harder",
  6: "Mock-heavy",
  7: "Final week + AMC 10A",
  8: "Gap week + AMC 10B",
};

export default async function PlanPage() {
  const learner = await getLearner();
  const cfg = planConfig(learner.plan);
  const cal = buildCalendar(cfg);
  const today = todayStr();
  const sheets = await db.worksheet.findMany({ where: { userId: learner.id, kind: { notIn: ["extra-mock", "practice"] } }, select: { date: true, status: true, score: true, total: true, id: true } });
  const byDate = new Map(sheets.map((s) => [s.date, s]));
  const paperMocks = await db.mockExam.findMany({ where: { userId: learner.id }, select: { year: true, contest: true, score: true } });

  async function pushSchedule(form: FormData) {
    "use server";
    const date = String(form.get("date") ?? "");
    if (!isValidISODate(date)) return;
    const l = await getLearner();
    const c = planConfig(l.plan);
    if (!c.pauseDates.includes(date)) c.pauseDates.push(date);
    await db.studyPlan.update({ where: { id: l.plan.id }, data: { pauseDates: JSON.stringify(c.pauseDates.sort()) } });
    revalidatePath("/plan");
  }

  const grouped = new Map<number, typeof cal>();
  for (const d of cal) grouped.set(d.week, [...(grouped.get(d.week) ?? []), d]);
  const studyDays = cal.filter((d) => IS_STUDY_DAY[d.kind]).length;
  const lessons = cal.filter((d) => d.kind === "lesson" || d.kind === "quiz").length;
  const mocks = cal.filter((d) => d.kind === "mock").length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">The plan</h1>
          <p className="mt-1 text-sm text-slate-600">
            {fmtShort(cfg.startDate)} → 10A {fmtShort(cfg.examADate)} → 10B {fmtShort(cfg.examBDate)} · {studyDays} study days · {lessons} lesson days · {mocks} paper mocks
          </p>
        </div>
        <Link href="/settings" className="text-sm font-semibold text-blue-700 hover:underline">Dates, rest days, pauses →</Link>
      </div>

      <div className="mb-6 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <b>Weekday routine (70 min).</b> 10 min warm-up from the review queue · 20 min lesson · 30 min worksheet (8 problems, easy to hard) · 10 min corrections with an error tag on every miss.
          <b> Saturday (90 min):</b> paper mock under real conditions. <b>Sunday (30-45 min):</b> mock review only, redo every miss cold.
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <b>How it adapts.</b> The calendar fixes the kind of day and the lesson; the 8 problems are chosen that morning from her mastery, the spaced-repetition queue and her recent error tags.
          Missed a day? Use <i>Push</i> on that row: it becomes a pause and the rest of the plan slides forward (week-6 adaptive days compress first; exam days never move).
        </div>
      </div>

      {[...grouped.keys()].sort((a, b) => a - b).map((week) => {
        const days = grouped.get(week) ?? [];
        return (
          <section key={week} className="mb-8">
            <h2 className="mb-3 text-lg font-bold text-slate-800">Week {week}{WEEK_TITLE[week] ? ` · ${WEEK_TITLE[week]}` : ""}</h2>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {days.map((d) => {
                const ws = byDate.get(d.date);
                const isToday = d.date === today;
                const past = daysBetween(d.date, today) > 0;
                const dayNo = daysBetween(cfg.startDate, d.date) + 1;
                const logged = d.paperMock ? paperMocks.find((m) => m.year === d.paperMock!.year && m.contest === d.paperMock!.contest) : null;
                const missed = IS_STUDY_DAY[d.kind] && past && (!ws || ws.status !== "done");
                return (
                  <div key={d.date} className={`flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-2.5 text-sm last:border-0 ${isToday ? "bg-blue-50" : d.kind === "rest" || d.kind === "off" ? "text-slate-400" : ""}`}>
                    <span className="w-24 font-mono text-xs text-slate-500">{fmtShort(d.date)}</span>
                    <span className="w-14 text-xs text-slate-400">Day {dayNo}</span>
                    <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: KIND_COLOR[d.kind] }}>{KIND_LABEL[d.kind]}</span>
                    <span className="min-w-0 flex-1 font-medium text-slate-800">
                      {d.kind === "lesson" || d.kind === "quiz"
                        ? d.skillIds.map((id, i) => (
                            <span key={id}>
                              {i > 0 && " + "}
                              <Link href={`/lessons/${id}`} className="hover:underline">{SKILL_BY_ID[id]?.name ?? id}</Link>
                            </span>
                          ))
                        : d.label}
                      {d.paperMock && (
                        <a href={aopsUrl(d.paperMock)} target="_blank" rel="noreferrer" className="ml-2 text-xs font-semibold text-red-700 underline">{d.paperMock.label} on AoPS</a>
                      )}
                      {d.note && <span className="ml-2 text-xs font-normal text-slate-500">{d.note}</span>}
                    </span>
                    {logged && <span className="rounded-md bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">Paper: {logged.score}</span>}
                    {ws ? (
                      <Link href={`/worksheet/${ws.id}`} className={`rounded-md px-2 py-0.5 text-xs font-semibold ${ws.status === "done" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                        {ws.status === "done" ? `${ws.score}/${ws.total}` : ws.status === "in_progress" ? "In progress" : "Assigned"}
                      </Link>
                    ) : IS_STUDY_DAY[d.kind] && (isToday || past) ? (
                      <Link href={`/today?date=${d.date}`} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 hover:bg-slate-200">{past ? "Missed · open" : "Open"}</Link>
                    ) : null}
                    {missed && !isToday && (
                      <form action={pushSchedule}>
                        <input type="hidden" name="date" value={d.date} />
                        <button className="rounded-md border border-slate-300 px-2 py-0.5 text-xs font-semibold text-slate-600 hover:bg-slate-100" title="Mark this day as paused and slide the plan forward">Push</button>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
