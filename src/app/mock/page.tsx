import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getLearner } from "@/lib/learner";
import { createExtraMock } from "@/lib/worksheet";
import { amcScore } from "@/lib/mastery";
import { fmtShort, todayStr, isValidISODate } from "@/lib/dates";

export const dynamic = "force-dynamic";

// Past AMC 10 papers 2002-2025 are free to read on the AoPS wiki. Doing them on
// paper, timed, is the single highest-value activity in the last three weeks.
const PAPERS = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016];

export default async function MockPage() {
  const learner = await getLearner();
  const mocks = await db.mockExam.findMany({ where: { userId: learner.id }, orderBy: { date: "desc" } });
  const appMocks = await db.worksheet.findMany({ where: { userId: learner.id, kind: { in: ["mock", "extra-mock"] } }, orderBy: { date: "desc" } });

  async function logMock(form: FormData) {
    "use server";
    const l = await getLearner();
    const date = String(form.get("date") ?? "");
    const contest = String(form.get("contest") ?? "AMC10A");
    const year = parseInt(String(form.get("year") ?? "0"), 10);
    const correct = parseInt(String(form.get("correct") ?? "0"), 10);
    const blank = parseInt(String(form.get("blank") ?? "0"), 10);
    const missed = String(form.get("missed") ?? "")
      .split(/[\s,]+/)
      .map((s) => parseInt(s, 10))
      .filter((n) => n >= 1 && n <= 25);
    const notes = String(form.get("notes") ?? "").slice(0, 2000) || null;
    if (!isValidISODate(date) || !year || correct < 0 || blank < 0 || correct + blank > 25) return;
    await db.mockExam.create({
      data: { userId: l.id, date, contest, year, correct, blank, wrong: 25 - correct - blank, score: amcScore(correct, blank), missed: JSON.stringify(missed), notes },
    });
    redirect("/mock");
  }

  async function startInApp() {
    "use server";
    const w = await createExtraMock(todayStr());
    redirect(`/worksheet/${w.id}`);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-black text-slate-900">Mock exams</h1>
      <p className="mb-6 mt-1 text-sm text-slate-600">
        Two kinds. <b>Paper mocks</b> are real past AMC 10 papers from the AoPS wiki, done with a 75-minute timer and logged here.
        <b> In-app mocks</b> are 25 free-response problems from the bank in AMC difficulty order; the plan schedules them in the sharpen phase, and you can start an extra one any time.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-2 text-lg font-bold text-slate-800">Log a paper mock</h2>
          <p className="mb-3 text-xs text-slate-500">
            Open the paper on AoPS (e.g. <a className="text-blue-700 underline" href="https://artofproblemsolving.com/wiki/index.php/2024_AMC_10A_Problems" target="_blank" rel="noreferrer">2024 AMC 10A</a>), set a 75-minute timer, grade with the answer key, then record it. Listing missed problem numbers lets you see patterns (misses at #1-10 = careless, at #18+ = expected).
          </p>
          <form action={logMock} className="grid grid-cols-2 gap-3 text-sm">
            <label className="col-span-1">Date<input name="date" type="date" defaultValue={todayStr()} required className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5" /></label>
            <label>Paper<select name="contest" className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5"><option>AMC10A</option><option>AMC10B</option><option>AMC8</option><option>AMC12A</option><option>AMC12B</option></select></label>
            <label>Year<select name="year" className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5">{PAPERS.map((y) => <option key={y}>{y}</option>)}</select></label>
            <label>Correct<input name="correct" type="number" min={0} max={25} required className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5" /></label>
            <label>Blank<input name="blank" type="number" min={0} max={25} defaultValue={0} required className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5" /></label>
            <label className="col-span-2">Missed / blank problem numbers<input name="missed" placeholder="e.g. 9, 14, 17, 19-25 as 19 20 21 ..." className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5" /></label>
            <label className="col-span-2">Notes<textarea name="notes" rows={2} placeholder="What went wrong? Time ran out at #20? Careless at #6?" className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5" /></label>
            <button className="col-span-2 rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-700">Save mock</button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-2 text-lg font-bold text-slate-800">In-app timed mock</h2>
          <p className="mb-3 text-xs text-slate-500">25 problems, 75 minutes, AMC scoring, full solutions after submitting. Free-response, so it trains the math, not the answer-choice tricks — use the paper mocks for those.</p>
          <form action={startInApp}>
            <button className="rounded-xl bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700">Start an extra mock now</button>
          </form>
          <h3 className="mb-2 mt-5 text-sm font-bold text-slate-700">In-app history</h3>
          {!appMocks.length && <p className="text-sm text-slate-500">None yet.</p>}
          {appMocks.map((m) => (
            <div key={m.id} className="flex items-center justify-between border-b border-slate-100 py-1.5 text-sm last:border-0">
              <span>{fmtShort(m.date)} · {m.title}</span>
              <Link href={`/worksheet/${m.id}`} className="font-semibold text-blue-700 hover:underline">{m.status === "done" ? `${m.score}/${m.total}` : "Resume"}</Link>
            </div>
          ))}
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-lg font-bold text-slate-800">Paper mock history</h2>
        {!mocks.length && <p className="text-sm text-slate-500">Nothing logged yet.</p>}
        {mocks.map((m) => {
          const missed: number[] = JSON.parse(m.missed);
          return (
            <div key={m.id} className="border-b border-slate-100 py-2 text-sm last:border-0">
              <div className="flex items-center justify-between">
                <span>{fmtShort(m.date)} · {m.year} {m.contest}</span>
                <span className="text-lg font-black text-slate-900">{m.score}<span className="ml-2 text-xs font-normal text-slate-500">{m.correct} right · {m.blank} blank · {m.wrong} wrong</span></span>
              </div>
              {missed.length > 0 && <div className="text-xs text-slate-500">Missed: {missed.join(", ")}</div>}
              {m.notes && <div className="text-xs text-slate-600">{m.notes}</div>}
            </div>
          );
        })}
      </section>
    </div>
  );
}
