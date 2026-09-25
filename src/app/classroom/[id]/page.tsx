import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getEducator, getClassroomForOwner, addStudentByEmail, removeStudent } from "@/lib/classroom";
import { db } from "@/lib/db";
import { buildStudentReport, nextActions, relativeDay } from "@/lib/report";
import { LEVEL_COLOR } from "@/lib/mastery";
import { fmtShort } from "@/lib/dates";

export const dynamic = "force-dynamic";

// One classroom: the roster with each student's status, plus add/remove.
export default async function ClassroomPage({ params, searchParams }: { params: { id: string }; searchParams: { msg?: string; error?: string } }) {
  const educator = await getEducator();
  const room = await getClassroomForOwner(params.id, educator.id);
  if (!room) notFound();

  async function add(form: FormData) {
    "use server";
    const e = await getEducator();
    const r = await addStudentByEmail(params.id, e.id, String(form.get("email") ?? ""));
    redirect(`/classroom/${params.id}?${r.ok ? `msg=${encodeURIComponent(`${r.student.name} added.`)}` : `error=${encodeURIComponent(r.error)}`}`);
  }
  async function remove(form: FormData) {
    "use server";
    const e = await getEducator();
    await removeStudent(params.id, e.id, String(form.get("studentId") ?? ""));
    redirect(`/classroom/${params.id}?msg=${encodeURIComponent("Student removed from the classroom (their profile and progress are untouched).")}`);
  }
  async function rename(form: FormData) {
    "use server";
    const e = await getEducator();
    const name = String(form.get("name") ?? "").trim().slice(0, 60);
    if (name) await db.classroom.updateMany({ where: { id: params.id, ownerId: e.id }, data: { name } });
    redirect(`/classroom/${params.id}?msg=${encodeURIComponent("Renamed.")}`);
  }
  async function destroy() {
    "use server";
    const e = await getEducator();
    await db.classroom.deleteMany({ where: { id: params.id, ownerId: e.id } });
    redirect(`/classroom?msg=${encodeURIComponent("Classroom deleted.")}`);
  }

  const reports = [];
  for (const m of room.members) if (m.student.plan) reports.push({ member: m, report: await buildStudentReport({ ...m.student, plan: m.student.plan }) });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-1 text-sm"><Link href="/classroom" className="text-blue-700 hover:underline">← Classrooms</Link></div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">{room.name}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Join code <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-base font-bold tracking-widest text-slate-900">{room.code}</code>
            <span className="ml-2">— a student enters it on their Profile page.</span>
          </p>
        </div>
      </div>
      {searchParams.msg && <div className="mb-4 rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-900">{searchParams.msg}</div>}
      {searchParams.error && <div className="mb-4 rounded-lg bg-red-100 px-4 py-2 text-sm text-red-800">{searchParams.error}</div>}

      {reports.length === 0 && <div className="mb-6 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">No students yet.</div>}

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        {reports.map(({ member, report: r }) => {
          const acts = nextActions(r);
          const acc7 = r.attempts7d ? Math.round((r.correct7d / r.attempts7d) * 100) : null;
          return (
            <section key={member.studentId} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <Link href={`/classroom/${room.id}/student/${member.studentId}`} className="text-lg font-bold text-blue-700 hover:underline">{member.student.name}</Link>
                  <div className="text-xs text-slate-500">grade {member.student.grade ?? "—"} · {member.student.email} · last sign-in {relativeDay(r.lastLoginAt)}</div>
                </div>
                <form action={remove}><input type="hidden" name="studentId" value={member.studentId} /><button className="text-xs text-slate-400 hover:text-red-700" title="Remove from classroom">remove</button></form>
              </div>
              <div className="mb-3 grid grid-cols-4 gap-2 text-center">
                <Mini label="streak" value={`${r.streak}`} />
                <Mini label="projected" value={r.anyAttempts ? `${r.projection.expected}` : "—"} />
                <Mini label="7-day acc." value={acc7 === null ? "—" : `${acc7}%`} sub={r.attempts7d ? `${r.correct7d}/${r.attempts7d}` : "no work"} />
                <Mini label="mastery" value={`${Math.round(r.overall * 100)}%`} />
              </div>
              <div className="mb-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Today · {r.dayLabel}</div>
                <div className="text-slate-700">
                  {r.worksheet ? `Worksheet ${r.worksheet.status.replace("_", " ")}${r.worksheet.status === "done" ? ` · ${r.worksheet.score}/${r.worksheet.total}` : ""}` : r.day ? "Worksheet not opened" : ""}
                  {r.day?.skillIds.length ? ` · lesson ${r.lessonRead ? "read" : "not read"}` : ""}
                  {r.dueReview ? ` · ${r.dueReview} review due` : ""}
                </div>
              </div>
              <div className="mb-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Needs to do</div>
                <ul className="list-disc pl-5 text-slate-700">{acts.map((a) => <li key={a}>{a}</li>)}</ul>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Weakest skills</div>
                {r.weakest.map((w) => (
                  <div key={w.skill.id} className="flex items-center gap-2">
                    <span className="w-44 truncate text-slate-700">{w.skill.name}</span>
                    <div className="h-1.5 flex-1 rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${Math.round(w.effective * 100)}%`, backgroundColor: LEVEL_COLOR[w.level] }} /></div>
                    <span className="w-10 text-right text-xs text-slate-500">{Math.round(w.effective * 100)}%</span>
                  </div>
                ))}
              </div>
              {r.overdue.length > 0 && <div className="mt-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-900">{r.overdue.length} overdue worksheet{r.overdue.length > 1 ? "s" : ""}: {r.overdue.slice(0, 4).map((w) => fmtShort(w.date)).join(", ")}{r.overdue.length > 4 ? "…" : ""}</div>}
            </section>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <form action={add} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
          <h2 className="mb-2 font-bold text-slate-800">Add a student by email</h2>
          <p className="mb-2 text-xs text-slate-500">The email of an existing MathArena student profile.</p>
          <div className="flex gap-2">
            <input name="email" type="email" required placeholder="student@example.com" className="flex-1 rounded-lg border border-slate-300 px-3 py-2" />
            <button className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-700">Add</button>
          </div>
        </form>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
          <h2 className="mb-2 font-bold text-slate-800">Classroom</h2>
          <form action={rename} className="flex gap-2">
            <input name="name" defaultValue={room.name} maxLength={60} className="flex-1 rounded-lg border border-slate-300 px-3 py-2" />
            <button className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50">Rename</button>
          </form>
          <form action={destroy} className="mt-2"><button className="text-xs text-slate-400 hover:text-red-700">Delete this classroom</button></form>
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-2">
      <div className="text-xl font-black text-slate-900">{value}</div>
      <div className="text-[11px] text-slate-500">{label}{sub ? ` · ${sub}` : ""}</div>
    </div>
  );
}
