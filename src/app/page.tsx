import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { isEducator } from "@/lib/classroom";
import { getLearner, getMasteryMap, planConfig } from "@/lib/learner";
import { planDayFor, KIND_COLOR, KIND_LABEL, IS_STUDY_DAY, buildCalendar } from "@/lib/plan";
import { aopsUrl } from "@/curriculum/calendar";
import { SKILLS, SKILL_BY_ID } from "@/curriculum/skills";
import { addDays, daysBetween, fmtLong, fmtShort, todayStr } from "@/lib/dates";
import { projectAmcScore } from "@/lib/mastery";

export const dynamic = "force-dynamic";

export default async function Home() {
  const learner = await getLearner();
  if (isEducator(learner)) redirect("/classroom");
  const cfg = planConfig(learner.plan);
  const today = todayStr();
  const day = planDayFor(cfg, today);
  const sheet = await db.worksheet.findFirst({ where: { userId: learner.id, date: today, kind: { notIn: ["extra-mock", "practice"] } }, orderBy: { createdAt: "asc" } });
  const dueReview = await db.reviewItem.count({ where: { userId: learner.id, dueDate: { lte: today } } });
  const total = await db.problem.count();

  const mastery = await getMasteryMap(learner.id);
  const avg = (ids: string[]) => (ids.length ? ids.reduce((a, id) => a + mastery[id].effective, 0) / ids.length : 0);
  const proj = projectAmcScore(avg(SKILLS.filter((s) => s.tier === 1).map((s) => s.id)), avg(SKILLS.filter((s) => s.tier === 2).map((s) => s.id)));
  const anyAttempts = Object.values(mastery).some((m) => m.attempts > 0);

  const done = await db.worksheet.findMany({ where: { userId: learner.id, status: "done" }, select: { date: true } });
  const doneDates = new Set(done.map((d) => d.date));
  let streak = 0;
  for (let d = doneDates.has(today) ? today : addDays(today, -1); doneDates.has(d); d = addDays(d, -1)) streak++;

  const daysToA = daysBetween(today, cfg.examADate);
  const daysToB = daysBetween(today, cfg.examBDate);
  const dayNo = daysBetween(cfg.startDate, today) + 1;
  const upcoming = buildCalendar(cfg).filter((d) => daysBetween(today, d.date) > 0 && IS_STUDY_DAY[d.kind]).slice(0, 4);
  const weakest = [...SKILLS].sort((a, b) => mastery[a.id].effective - mastery[b.id].effective).slice(0, 3);

  return (
    <div>
      <section className="mb-6 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-blue-100">{fmtLong(today)}{day && daysBetween(cfg.startDate, today) >= 0 ? ` · Day ${dayNo}` : ""}</div>
            <h1 className="mt-1 text-3xl font-black">{learner.name}&apos;s AMC 10 prep</h1>
          </div>
          <div className="flex gap-3 text-center">
            <Countdown n={daysToA} label="to 10A" sub={fmtShort(cfg.examADate)} />
            <Countdown n={daysToB} label="to 10B" sub={fmtShort(cfg.examBDate)} />
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-white/10 p-4 backdrop-blur">
          {day ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ backgroundColor: KIND_COLOR[day.kind], color: "white" }}>{KIND_LABEL[day.kind]}</span>
                <span className="text-lg font-bold">{day.label}</span>
              </div>
              {day.note && <div className="mt-1 text-sm text-blue-100">{day.note}</div>}
              <div className="mt-3 flex flex-wrap gap-2">
                {IS_STUDY_DAY[day.kind] && (
                  <Link href="/today" className="rounded-xl bg-white px-5 py-2.5 font-semibold text-blue-700 hover:bg-blue-50">
                    {sheet ? (sheet.status === "done" ? `Done today · ${sheet.score}/${sheet.total} · review` : sheet.status === "in_progress" ? "Resume today's worksheet" : "Start today's worksheet") : "Build today's worksheet"}
                  </Link>
                )}
                {day.skillIds.map((id) => (
                  <Link key={id} href={`/lessons/${id}`} className="rounded-xl border border-white/40 px-4 py-2.5 font-semibold text-white hover:bg-white/10">
                    Lesson: {SKILL_BY_ID[id]?.name ?? id}
                  </Link>
                ))}
                {day.paperMock && (
                  <a href={aopsUrl(day.paperMock)} target="_blank" rel="noreferrer" className="rounded-xl border border-white/40 px-4 py-2.5 font-semibold text-white hover:bg-white/10">
                    Paper: {day.paperMock.label} ↗
                  </a>
                )}
              </div>
            </>
          ) : (
            <div className="text-sm">
              Today is outside the plan window ({fmtShort(cfg.startDate)} → {fmtShort(cfg.examBDate)}). <Link href="/settings" className="underline">Adjust dates</Link>.
            </div>
          )}
        </div>
      </section>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Stat label="Streak" value={`${streak}`} sub="days completed in a row" />
        <Stat label="Review queue" value={`${dueReview}`} sub="due today" />
        <Stat label="Projected 10A" value={anyAttempts ? `${proj.expected}` : "—"} sub={anyAttempts ? `attempt through #${proj.attemptThrough}` : "after the diagnostic"} />
        <Stat label="Problem bank" value={total.toLocaleString()} sub="MATH + AIME, skill-tagged" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="mb-2 font-bold text-slate-800">Next up</h2>
          {upcoming.map((d) => (
            <div key={d.date} className="flex items-center gap-2 border-b border-slate-100 py-1.5 text-sm last:border-0">
              <span className="w-20 font-mono text-xs text-slate-500">{fmtShort(d.date)}</span>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: KIND_COLOR[d.kind] }} />
              <span className="truncate text-slate-700">{d.label}</span>
            </div>
          ))}
          <Link href="/plan" className="mt-2 block text-sm font-semibold text-blue-700 hover:underline">Full calendar →</Link>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="mb-2 font-bold text-slate-800">Weakest right now</h2>
          {weakest.map((s) => (
            <div key={s.id} className="flex items-center justify-between border-b border-slate-100 py-1.5 text-sm last:border-0">
              <Link href={`/lessons/${s.id}`} className="text-blue-700 hover:underline">{s.name}</Link>
              <span className="text-slate-500">{mastery[s.id].attempts ? `${Math.round(mastery[s.id].effective * 100)}%` : "untested"}</span>
            </div>
          ))}
          <Link href="/progress" className="mt-2 block text-sm font-semibold text-blue-700 hover:underline">Progress →</Link>
        </section>
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <h2 className="mb-2 font-bold">Parent checklist</h2>
          <ul className="list-disc space-y-1 pl-4">
            <li><b>Register now.</b> Families can&apos;t sign up directly; find a school or test center hosting <i>both</i> Nov 5 and Nov 13. Many close in mid-October. <a className="underline" href="https://maa.org/student-programs/amc/" target="_blank" rel="noreferrer">MAA AMC page ↗</a></li>
            <li>Buy <i>AoPS Volume 1: The Basics</i> and a paper error-log notebook.</li>
            <li>Set <Link href="/settings" className="underline">emails</Link> so the 6 AM worksheet and 8 PM summary go out.</li>
            <li>Saturdays: print the paper mock, 75-minute timer, bubble sheet.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function Countdown({ n, label, sub }: { n: number; label: string; sub: string }) {
  return (
    <div className="rounded-xl bg-white/15 px-4 py-2">
      <div className="text-3xl font-black">{n < 0 ? "✓" : n}</div>
      <div className="text-xs text-blue-100">{n < 0 ? "done" : `days ${label}`}</div>
      <div className="text-[10px] text-blue-200">{sub}</div>
    </div>
  );
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
