import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getLearner, planConfig } from "@/lib/learner";
import { isValidISODate, fmtShort } from "@/lib/dates";
import { buildCalendar, IS_STUDY_DAY } from "@/lib/plan";

export const dynamic = "force-dynamic";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function SettingsPage() {
  const learner = await getLearner();
  const cfg = planConfig(learner.plan);
  const cal = buildCalendar(cfg);
  const studyDays = cal.filter((d) => IS_STUDY_DAY[d.kind]).length;

  async function save(form: FormData) {
    "use server";
    const l = await getLearner();
    const s = (k: string) => String(form.get(k) ?? "").trim();
    const startDate = s("startDate");
    const examADate = s("examADate");
    const examBDate = s("examBDate");
    if (!isValidISODate(startDate) || !isValidISODate(examADate) || !isValidISODate(examBDate)) return;
    const restDays = WEEKDAYS.map((_, i) => i).filter((i) => form.get(`rest-${i}`) === "on");
    const pauseDates = s("pauseDates")
      .split(/[\s,]+/)
      .filter(isValidISODate)
      .sort();
    const problemsPerDay = Math.max(4, Math.min(20, parseInt(s("problemsPerDay") || "8", 10) || 8));
    const minutesPerDay = Math.max(20, Math.min(180, parseInt(s("minutesPerDay") || "70", 10) || 70));
    const deliverAt = /^\d{2}:\d{2}$/.test(s("deliverAt")) ? s("deliverAt") : "06:00";
    await db.user.update({ where: { id: l.id }, data: { name: s("name") || "Student" } });
    await db.studyPlan.update({
      where: { id: l.plan.id },
      data: {
        startDate,
        examADate,
        examBDate,
        restDays: JSON.stringify(restDays),
        pauseDates: JSON.stringify(pauseDates),
        problemsPerDay,
        minutesPerDay,
        deliverAt,
        deliverTo: s("deliverTo") || null,
        parentEmail: s("parentEmail") || null,
      },
    });
    redirect("/plan");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-black text-slate-900">Settings</h1>
      <p className="mb-6 mt-1 text-sm text-slate-600">Change anything here and the calendar re-plans instantly. Currently {studyDays} study days from {fmtShort(cfg.startDate)} to {fmtShort(cfg.examBDate)}.</p>

      <form action={save} className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 font-bold text-slate-800">Student</h2>
          <label className="block text-sm">Name<input name="name" defaultValue={learner.name} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 font-bold text-slate-800">Dates</h2>
          <div className="grid gap-3 sm:grid-cols-3 text-sm">
            <label>Plan starts<input name="startDate" type="date" defaultValue={cfg.startDate} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
            <label>AMC 10A<input name="examADate" type="date" defaultValue={cfg.examADate} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
            <label>AMC 10B<input name="examBDate" type="date" defaultValue={cfg.examBDate} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          </div>
          <p className="mt-2 text-xs text-slate-500">2026 dates per MAA: 10A Thu Nov 5, 10B Fri Nov 13. She needs a seat at a school or test center hosting both dates; many close sign-ups mid-October.</p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 font-bold text-slate-800">Rhythm</h2>
          <div className="mb-3 text-sm">
            <div className="mb-1 text-slate-600">Rest weekdays (never assigned)</div>
            <div className="flex flex-wrap gap-3">
              {WEEKDAYS.map((w, i) => (
                <label key={w} className="flex items-center gap-1"><input type="checkbox" name={`rest-${i}`} defaultChecked={cfg.restDays.includes(i)} /> {w}</label>
              ))}
            </div>
          </div>
          <label className="block text-sm">Pause dates (travel, school events) — one per line or comma-separated, YYYY-MM-DD
            <textarea name="pauseDates" rows={2} defaultValue={cfg.pauseDates.join("\n")} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs" />
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
            <label>Problems per daily worksheet<input name="problemsPerDay" type="number" min={4} max={20} defaultValue={learner.plan.problemsPerDay} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
            <label>Minutes per weekday<input name="minutesPerDay" type="number" min={20} max={180} defaultValue={learner.plan.minutesPerDay} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 font-bold text-slate-800">Daily delivery</h2>
          <div className="grid gap-3 sm:grid-cols-3 text-sm">
            <label>Student email<input name="deliverTo" type="email" defaultValue={learner.plan.deliverTo ?? ""} placeholder="her@example.com" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
            <label>Parent email<input name="parentEmail" type="email" defaultValue={learner.plan.parentEmail ?? ""} placeholder="you@example.com" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
            <label>Morning send time<input name="deliverAt" type="time" defaultValue={learner.plan.deliverAt} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            The scheduled task runs <code>npm run daily</code> each morning (worksheet + lesson link to the student, cc parent), <code>npm run daily -- evening</code> at 8 PM (parent summary), and a Sunday 6 PM digest.
            Mail goes out only when SMTP_* is set in <code>.env</code>; otherwise each mail is saved to <code>data/outbox/</code> as HTML you can open or print.
          </p>
        </section>

        <div className="flex items-center gap-3">
          <button className="rounded-xl bg-slate-900 px-5 py-2 font-semibold text-white hover:bg-slate-700">Save and re-plan</button>
          <Link href="/plan" className="text-sm text-slate-600 hover:underline">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
