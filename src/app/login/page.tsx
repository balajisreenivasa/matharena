import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSessionToken, normalizeEmail, verifyPassword, SESSION_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: { next?: string; error?: string } }) {
  const students = await db.user.count({ where: { passwordHash: { not: null } } });
  const next = searchParams.next && searchParams.next.startsWith("/") ? searchParams.next : "/";

  async function login(form: FormData) {
    "use server";
    const email = normalizeEmail(String(form.get("email") ?? ""));
    const password = String(form.get("password") ?? "");
    const dest = String(form.get("next") ?? "/");
    const user = await db.user.findUnique({ where: { email } });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      redirect(`/login?error=1&next=${encodeURIComponent(dest)}`);
    }
    const { token, expires } = await createSessionToken(user!.id);
    cookies().set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", expires, path: "/" });
    await db.user.update({ where: { id: user!.id }, data: { lastLoginAt: new Date() } });
    redirect(dest.startsWith("/") ? dest : "/");
  }

  return (
    <div className="mx-auto mt-10 max-w-sm">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900">Sign in</h1>
        <p className="mt-1 text-sm text-slate-600">Each student has their own profile, plan and progress.</p>
        {searchParams.error && <div className="mt-3 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-800">Wrong email or password.</div>}
        <form action={login} className="mt-4 space-y-3">
          <input type="hidden" name="next" value={next} />
          <label className="block text-sm">Email<input name="email" type="email" required autoComplete="username" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <label className="block text-sm">Password<input name="password" type="password" required autoComplete="current-password" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <button className="w-full rounded-xl bg-slate-900 px-4 py-2.5 font-semibold text-white hover:bg-slate-700">Sign in</button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          {students === 0 ? "No accounts yet. " : "New student? "}
          <Link href="/signup" className="font-semibold text-blue-700 underline">Create a profile</Link>
        </p>
      </div>
    </div>
  );
}
