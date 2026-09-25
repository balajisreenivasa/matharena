import Link from "next/link";
import { redirect } from "next/navigation";
import { getEducator, listClassroomsFor, createClassroom } from "@/lib/classroom";
import { db } from "@/lib/db";
import { buildStudentReport, nextActions, relativeDay } from "@/lib/report";
import { fmtShort } from "@/lib/dates";

export const dynamic = "force-dynamic";

// Parent/teacher home: every classroom, with a one-line status per student.
export default async function ClassroomsPage({ searchParams }: { searchParams: { msg?: string } }) {
  const educator = await getEducator();
  const rooms = await listClassroomsFor(educator.id);

  async function create(form: FormData) {
    "use server";
    const e = await getEducator();
    const room = await createClassroom(e.id, String(form.get("name") ?? ""));
    redirect(`/classroom/${room.id}`);
  }

  const memberRows = await db.classroomMember.findMany({
    where: { classroom: { ownerId: educator.id } },
    include: { student: { include: { plan: true } } },
    orderBy: { joinedAt: "asc" },
  });
  const reports = new Map<string, Awaited<ReturnType<typeof buildStudentReport>>>();
  for (const m of memberRows) if (m.student.plan && !reports.has(m.studentId)) reports.set(m.studentId, await buildStudentReport({ ...m.student, plan: m.student.plan }));

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Classrooms</h1>
          <p className="mt-1 text-sm text-slate-600">
            {educator.role === "teacher" ? "Your students" : "Your children"}, their plans and what each one needs to do next. Students join with a code, or you add them by the email of their MathArena profile.
          </p>
        </div>
        <Link href="/lessons" className="text-sm font-semibold text-blue-700 hover:underline">Browse the lessons →</Link>
      </div>
      {searchParams.msg && <div className="mb-4 rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-900">{searchParams.msg}</div>}

      {rooms.length === 0 && (
        <div className="mb-6 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
          No classroom yet. Create one below, then give the student its join code (or add them by email).
        </div>
      )}

      {rooms.map((room) => {
        const members = memberRows.filter((m) => m.classroomId === room.id);
        return (
          <section key={room.id} className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <Link href={`/classroom/${room.id}`} className="text-lg font-bold text-slate-900 hover:underline">{room.name}</Link>
                <span className="ml-2 text-sm text-slate-500">{members.length} student{members.length === 1 ? "" : "s"}</span>
              </div>
              <div className="text-sm text-slate-600">
                Join code <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-base font-bold tracking-widest text-slate-900">{room.code}</code>
              </div>
            </div>
            {members.length === 0 ? (
              <p className="text-sm text-slate-500">Nobody has joined yet. <Link href={`/classroom/${room.id}`} className="text-blue-700 underline">Add a student</Link>.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="py-1 pr-3">Student</th>
                      <th className="py-1 pr-3">Today</th>
                      <th className="py-1 pr-3">Streak</th>
                      <th className="py-1 pr-3">Last active</th>
                      <th className="py-1 pr-3">Projected</th>
                      <th className="py-1">Needs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => {
                      const r = reports.get(m.studentId);
                      if (!r) return null;
                      const acts = nextActions(r);
                      const todayStatus = !r.day ? "—" : r.worksheet?.status === "done" ? "done" : r.worksheet?.status === "in_progress" ? "in progress" : r.day && ["rest", "off", "exam"].includes(r.day.kind) ? r.day.label : "not started";
                      return (
                        <tr key={m.studentId} className="border-t border-slate-100 align-top">
                          <td className="py-2 pr-3">
                            <Link href={`/classroom/${room.id}/student/${m.studentId}`} className="font-semibold text-blue-700 hover:underline">{m.student.name}</Link>
                            <div className="text-xs text-slate-500">grade {m.student.grade ?? "—"}</div>
                          </td>
                          <td className="py-2 pr-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${todayStatus === "done" ? "bg-green-100 text-green-800" : todayStatus === "in progress" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"}`}>{todayStatus}</span>
                          </td>
                          <td className="py-2 pr-3">{r.streak} d</td>
                          <td className="py-2 pr-3">{relativeDay(r.lastActive)}</td>
                          <td className="py-2 pr-3">{r.anyAttempts ? r.projection.expected : "—"}</td>
                          <td className="py-2 text-slate-700">{acts.slice(0, 2).join(" · ")}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        );
      })}

      <form action={create} className="rounded-2xl border border-slate-200 bg-white p-5 text-sm">
        <h2 className="mb-2 font-bold text-slate-800">New classroom</h2>
        <div className="flex flex-wrap gap-2">
          <input name="name" placeholder={educator.role === "teacher" ? "e.g. Period 3 AMC 10" : "e.g. Our family"} maxLength={60} className="flex-1 rounded-lg border border-slate-300 px-3 py-2" />
          <button className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-700">Create</button>
        </div>
        <p className="mt-2 text-xs text-slate-500">You get a join code to share. Exams: AMC 10A {fmtShort("2026-11-05")}, 10B {fmtShort("2026-11-13")}; each student sets their own dates in Settings.</p>
      </form>
    </div>
  );
}
