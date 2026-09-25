import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSessionToken, hashPassword, normalizeEmail, passwordProblem, SESSION_COOKIE } from "@/lib/auth";
import { LEGACY_LEARNER_EMAIL } from "@/lib/learner";
import { DEFAULT_EXAM_A, DEFAULT_EXAM_B } from "@/lib/plan";
import { todayStr } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function SignupPage({ searchParams }: { searchParams: { error?: string } }) {
  async function signup(form: FormData) {
    "use server";
    const name = String(form.get("name") ?? "").trim().slice(0, 60);
    const email = normalizeEmail(String(form.get("email") ?? ""));
    const password = String(form.get("password") ?? "");
    const grade = parseInt(String(form.get("grade") ?? "8"), 10);
    const roleRaw = String(form.get("role") ?? "student");
    const role = roleRaw === "parent" || roleRaw === "teacher" ? roleRaw : "student";
    if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) redirect("/signup?error=" + encodeURIComponent("Name and a valid email are required."));
    const pp = passwordProblem(password);
    if (pp) redirect("/signup?error=" + encodeURIComponent(pp));
    if (await db.user.findUnique({ where: { email } })) redirect("/signup?error=" + encodeURIComponent("That email already has a profile. Sign in instead."));

    // The pre-login default learner (and any smoke-test data on it) retires when the
    // first real profile is created.
    const legacy = await db.user.findUnique({ where: { email: LEGACY_LEARNER_EMAIL } });
    if (legacy && !legacy.passwordHash) await db.user.delete({ where: { id: legacy.id } });

    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash: hashPassword(password),
        grade: Number.isFinite(grade) ? grade : null,
        role,
        lastLoginAt: new Date(),
        plan: {
          create: {
            startDate: todayStr() < "2026-09-21" ? "2026-09-21" : todayStr(),
            examADate: DEFAULT_EXAM_A,
            examBDate: DEFAULT_EXAM_B,
            deliverTo: email,
          },
        },
      },
    });
    const { token, expires } = await createSessionToken(user.id);
    cookies().set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", expires, path: "/" });
    redirect(role === "student" ? "/diagnostic" : "/classroom");
  }

  return (
    <div className="mx-auto mt-10 max-w-sm">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900">Create a profile</h1>
        <p className="mt-1 text-sm text-slate-600">One per student. The plan, worksheets, mastery and review queue all belong to this profile.</p>
        {searchParams.error && <div className="mt-3 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-800">{searchParams.error}</div>}
        <form action={signup} className="mt-4 space-y-3">
          <label className="block text-sm">Name<input name="name" required maxLength={60} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <label className="block text-sm">Email<input name="email" type="email" required autoComplete="username" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <label className="block text-sm">Password (6+ characters)<input name="password" type="password" required minLength={6} autoComplete="new-password" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <label>Grade<select name="grade" defaultValue="8" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">{[5, 6, 7, 8, 9, 10].map((g) => <option key={g} value={g}>{g}</option>)}</select></label>
            <label>I am a<select name="role" defaultValue="student" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"><option value="student">Student</option><option value="parent">Parent</option><option value="teacher">Teacher</option></select></label>
          </div>
          <p className="text-xs text-slate-500">Parents and teachers get a classroom view instead of a study plan: create a classroom, share its code, and follow each student&apos;s progress.</p>
          <button className="w-full rounded-xl bg-slate-900 px-4 py-2.5 font-semibold text-white hover:bg-slate-700">Create profile</button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">Already have one? <Link href="/login" className="font-semibold text-blue-700 underline">Sign in</Link></p>
      </div>
    </div>
  );
}
