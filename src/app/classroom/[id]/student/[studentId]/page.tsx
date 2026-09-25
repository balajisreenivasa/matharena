import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getEducator, canViewStudent } from "@/lib/classroom";
import { buildStudentReport, nextActions, relativeDay } from "@/lib/report";
import { LEVEL_COLOR, ERROR_TAGS, type ErrorTag } from "@/lib/mastery";
import { TOPIC_META, type TopicSlug } from "@/curriculum/skills";
import { KIND_COLOR, KIND_LABEL } from "@/lib/plan";
import { aopsUrl } from "@/curriculum/calendar";
import { fmtShort, fmtLong } from "@/lib/dates";

export const dynamic = "force-dynamic";

// Read-only view of one student for their parent/teacher: what they need to do, the
// week ahead, every skill, recent worksheets, error tags and mocks.
export default async function StudentReportPage({ params }: { params: { id: string; studentId: string } }) {
  const educator = await getEducator();
  if (!(await canViewStudent(educator.id, params.studentId))) notFound();
  const student = await db.user.findUnique({ where: { id: params.studentId }, include: { plan: true } });
  if (!student?.plan) notFound();
  const r = await buildStudentReport({ ...student, plan: student.plan });
  const acts = nextActions(r);
  const maxTag = Math.max(1, ...Object.values(r.tagCounts));
  const accAll = r.attemptsAll ? Math.round((r.correctAll / r.attemptsAll) * 100) : null;
  const acc7 = r.attempts7d ? Math.round((r.correct7d / r.attempts7d) * 100) : null;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-1 text-sm"><Link href={`/classroom/${params.id}`} className="text-blue-700 hover:underline">← Classroom</Link></div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">{student.name}</h1>
          <p className="mt-1 text-sm text-slate-600">{student.email} · grade {student.grade ?? "—"} · last sign-in {relativeDay(r.lastLoginAt)} · last problem {relativeDay(r.lastActive)}</p>
        </div>
        <div className="flex gap-3 text-center text-sm">
          <Count n={r.daysToA} label="days to 10A" sub={fmtShort(r.examADate)} />
          <Count n={r.daysToB} label="days to 10B" sub={fmtShort(r.examBDate)} />
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Stat label="Projected AMC 10" value={r.anyAttempts ? `${r.projection.expected}` : "—"} sub={r.anyAttempts ? `≈ ${r.projection.correct} right · attempt through #${r.projection.attemptThrough}` : "no attempts yet"} />
        <Stat label="Streak" value={`${r.streak}`} sub={`${r.sheetsDone} worksheets done · ${r.sheetsOpen} open`} />
        <Stat label="Accuracy" value={accAll === null ? "—" : `${accAll}%`} sub={`${r.correctAll}/${r.attemptsAll} all time · ${acc7 === null ? "nothing" : `${acc7}%`} this week`} />
        <Stat label="Review queue" value={`${r.dueReview}`} sub={`due today · ${r.queueSize} queued · ${r.sureWrong} sure-and-wrong`} />
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
          <h2 className="mb-2 font-bold text-slate-800">Needs to do</h2>
          <ul className="list-disc pl-5 text-slate-700">{acts.map((a) => <li key={a}>{a}</li>)}</ul>
          <div className="mt-3 text-xs text-slate-500">
            Today, {fmtLong(r.today)}: {r.day ? <><span className="rounded-full px-2 py-0.5 font-semibold text-white" style={{ backgroundColor: KIND_COLOR[r.day.kind] }}>{KIND_LABEL[r.day.kind]}</span> {r.day.label}{r.day.note ? ` — ${r.day.note}` : ""}</> : "outside the plan window"}
          </div>
          {r.overdue.length > 0 && (
            <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Overdue: {r.overdue.map((w) => `${fmtShort(w.date)} ${w.title}`).join(" · ")}
            </div>
          )}
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
          <h2 className="mb-2 font-bold text-slate-800">Coming up</h2>
          {r.upcoming.map((d) => (
            <div key={d.date} className="flex items-center gap-2 border-b border-slate-100 py-1.5 last:border-0">
              <span className="w-24 text-slate-500">{fmtShort(d.date)}</span>
              <span className="rounded-full px-2 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: KIND_COLOR[d.kind] }}>{KIND_LABEL[d.kind]}</span>
              <span className="text-slate-800">{d.label}</span>
              {d.paperMock && <a href={aopsUrl(d.paperMock)} target="_blank" rel="noreferrer" className="ml-auto text-xs text-blue-700 underline">paper ↗</a>}
            </div>
          ))}
          <p className="mt-2 text-xs text-slate-500">Weekdays: warm-up 10 · lesson 20 · worksheet 30 · corrections 10. Saturday paper mock, Sunday review.</p>
        </section>
      </div>

      <section className="mb-6">
        <h2 className="mb-3 text-lg font-bold text-slate-800">Mastery by skill</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {(Object.keys(TOPIC_META) as TopicSlug[]).map((slug) => (
            <div key={slug} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: TOPIC_META[slug].color }} />
                <span className="font-bold text-slate-800">{TOPIC_META[slug].name}</span>
              </div>
              {r.skills.filter((l) => l.skill.topicSlug === slug).map((l) => (
                <Link key={l.skill.id} href={`/lessons/${l.skill.id}`} className="mb-2 block rounded-lg px-1 py-0.5 hover:bg-slate-50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{l.skill.name}</span>
                    <span className="text-xs text-slate-500">{l.attempts ? `${l.correct}/${l.attempts} · ` : ""}{l.level}</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full" style={{ width: `${Math.round(l.effective * 100)}%`, backgroundColor: LEVEL_COLOR[l.level] }} />
                  </div>
                </Link>
              ))}
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
          <h2 className="mb-2 font-bold text-slate-800">Recent worksheets</h2>
          {r.recentSheets.length === 0 && <p className="text-slate-500">None yet.</p>}
          {r.recentSheets.map((w) => (
            <div key={w.id} className="flex items-center justify-between border-b border-slate-100 py-1.5 last:border-0">
              <span className="truncate pr-2 text-slate-700" title={w.title}>{fmtShort(w.date)} · {w.title}</span>
              <span className={`text-xs font-semibold ${w.status === "done" ? "text-green-700" : w.status === "in_progress" ? "text-amber-700" : "text-slate-400"}`}>{w.status === "done" ? `${w.score}/${w.total}` : w.status.replace("_", " ")}</span>
            </div>
          ))}
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
          <h2 className="mb-2 font-bold text-slate-800">Why answers were wrong</h2>
          {Object.values(r.tagCounts).every((n) => !n) && <p className="text-slate-500">No tagged misses yet.</p>}
          {(Object.keys(ERROR_TAGS) as ErrorTag[]).filter((t) => r.tagCounts[t]).map((t) => (
            <div key={t} className="mb-2">
              <div className="flex justify-between"><span><b>{t}</b> {ERROR_TAGS[t].name}</span><span className="font-semibold">{r.tagCounts[t]}</span></div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100"><div className="h-full rounded-full bg-amber-500" style={{ width: `${(r.tagCounts[t] / maxTag) * 100}%` }} /></div>
              <div className="text-xs text-slate-500">{ERROR_TAGS[t].effect}</div>
            </div>
          ))}
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
          <h2 className="mb-2 font-bold text-slate-800">Paper mocks</h2>
          {r.mocks.length === 0 && <p className="text-slate-500">None logged yet.</p>}
          {r.mocks.map((m) => (
            <div key={m.id} className="flex items-center justify-between border-b border-slate-100 py-1.5 last:border-0">
              <span>{fmtShort(m.date)} · {m.year} {m.contest}</span>
              <span className="font-semibold text-slate-800">{m.score} <span className="font-normal text-slate-500">({m.correct}/{m.blank}/{m.wrong})</span></span>
            </div>
          ))}
        </section>
      </div>
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

function Count({ n, label, sub }: { n: number; label: string; sub: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-2">
      <div className="text-2xl font-black text-slate-900">{Math.max(0, n)}</div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-[11px] text-slate-400">{sub}</div>
    </div>
  );
}
