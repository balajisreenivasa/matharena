import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getLearner, getMasteryMap } from "@/lib/learner";
import { SKILLS, TOPIC_META, type TopicSlug } from "@/curriculum/skills";
import { hashPassword, verifyPassword, passwordProblem } from "@/lib/auth";
import { addDays, fmtShort, todayStr } from "@/lib/dates";
import { projectAmcScore } from "@/lib/mastery";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ searchParams }: { searchParams: { msg?: string } }) {
  const learner = await getLearner();
  const today = todayStr();

  const attempts = await db.attempt.findMany({ where: { userId: learner.id }, select: { isCorrect: true, selected: true, confidence: true, timeSpentSec: true, createdAt: true, problemId: true, problem: { select: { topics: { select: { topic: { select: { slug: true } }, isPrimary: true } } } } } });
  const solvedIds = new Set(attempts.filter((a) => a.isCorrect).map((a) => a.problemId));
  const attemptedIds = new Set(attempts.map((a) => a.problemId));
  const answered = attempts.filter((a) => a.selected.trim() !== "");
  const correct = attempts.filter((a) => a.isCorrect).length;
  const accuracy = answered.length ? Math.round((correct / answered.length) * 100) : 0;
  const timeSec = attempts.reduce((s, a) => s + Math.min(1800, a.timeSpentSec ?? 0), 0);
  const sureWrong = attempts.filter((a) => !a.isCorrect && a.confidence === "sure").length;

  const byTopic: Record<string, { n: number; c: number }> = {};
  for (const a of attempts) {
    const t = (a.problem.topics.find((x) => x.isPrimary) ?? a.problem.topics[0])?.topic.slug;
    if (!t) continue;
    byTopic[t] = byTopic[t] ?? { n: 0, c: 0 };
    if (a.selected.trim() !== "") byTopic[t].n++;
    if (a.isCorrect) byTopic[t].c++;
  }

  const lessons = await db.lessonProgress.findMany({ where: { userId: learner.id } });
  const lessonsRead = lessons.filter((l) => l.status === "read" || l.status === "quiz_passed").length;
  const quizzesPassed = lessons.filter((l) => l.status === "quiz_passed").length;
  const cpCorrect = lessons.reduce((s, l) => s + l.checkpointsCorrect, 0);
  const cpTotal = lessons.reduce((s, l) => s + Object.keys(safeJson(l.data).checkpoints ?? {}).length, 0);

  const sheets = await db.worksheet.findMany({ where: { userId: learner.id }, select: { date: true, status: true, kind: true } });
  const done = sheets.filter((s) => s.status === "done");
  const doneDates = new Set(done.filter((s) => !["practice", "lesson-quiz", "extra-mock"].includes(s.kind)).map((s) => s.date));
  let streak = 0;
  for (let d = doneDates.has(today) ? today : addDays(today, -1); doneDates.has(d); d = addDays(d, -1)) streak++;
  const mocks = await db.mockExam.count({ where: { userId: learner.id } });
  const queue = await db.reviewItem.count({ where: { userId: learner.id } });

  const mastery = await getMasteryMap(learner.id);
  const avg = (ids: string[]) => (ids.length ? ids.reduce((a, id) => a + mastery[id].effective, 0) / ids.length : 0);
  const proj = projectAmcScore(avg(SKILLS.filter((s) => s.tier === 1).map((s) => s.id)), avg(SKILLS.filter((s) => s.tier === 2).map((s) => s.id)));
  const overall = Math.round(avg(SKILLS.map((s) => s.id)) * 100);

  // Last 8 weeks, questions per week.
  const weeks: { label: string; n: number; c: number }[] = [];
  for (let w = 7; w >= 0; w--) {
    const start = addDays(today, -7 * w - 6);
    const end = addDays(today, -7 * w);
    const rows = attempts.filter((a) => {
      const d = localDate(a.createdAt);
      return d >= start && d <= end;
    });
    weeks.push({ label: fmtShort(end).slice(4), n: rows.length, c: rows.filter((a) => a.isCorrect).length });
  }
  const maxW = Math.max(1, ...weeks.map((w) => w.n));

  async function changePassword(form: FormData) {
    "use server";
    const l = await getLearner();
    const current = String(form.get("current") ?? "");
    const next = String(form.get("next") ?? "");
    if (!verifyPassword(current, l.passwordHash)) redirect("/profile?msg=" + encodeURIComponent("Current password is wrong."));
    const pp = passwordProblem(next);
    if (pp) redirect("/profile?msg=" + encodeURIComponent(pp));
    await db.user.update({ where: { id: l.id }, data: { passwordHash: hashPassword(next) } });
    redirect("/profile?msg=" + encodeURIComponent("Password changed."));
  }

  async function rename(form: FormData) {
    "use server";
    const l = await getLearner();
    const name = String(form.get("name") ?? "").trim().slice(0, 60);
    const grade = parseInt(String(form.get("grade") ?? ""), 10);
    if (name) await db.user.update({ where: { id: l.id }, data: { name, grade: Number.isFinite(grade) ? grade : l.grade } });
    redirect("/profile?msg=" + encodeURIComponent("Saved."));
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">{learner.name}</h1>
          <p className="mt-1 text-sm text-slate-600">{learner.email} · grade {learner.grade ?? "—"} · {learner.role} · joined {fmtShort(localDate(learner.createdAt))}{learner.lastLoginAt ? ` · last sign-in ${fmtShort(localDate(learner.lastLoginAt))}` : ""}</p>
        </div>
        <form action="/api/auth/logout" method="post"><button className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Sign out</button></form>
      </div>
      {searchParams.msg && <div className="mb-4 rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-900">{searchParams.msg}</div>}

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Stat label="Questions solved" value={`${solvedIds.size}`} sub={`${attemptedIds.size} attempted · ${attempts.length} answers`} />
        <Stat label="Accuracy" value={`${accuracy}%`} sub={`${correct} right of ${answered.length} answered${sureWrong ? ` · ${sureWrong} sure-and-wrong` : ""}`} />
        <Stat label="Overall mastery" value={`${overall}%`} sub={`projected AMC 10: ${attempts.length ? proj.expected : "—"}`} />
        <Stat label="Streak" value={`${streak}`} sub={`${done.length} worksheets done · ${mocks} paper mocks`} />
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
          <h2 className="mb-2 font-bold text-slate-800">Accuracy by topic</h2>
          {(Object.keys(TOPIC_META) as TopicSlug[]).map((slug) => {
            const t = byTopic[slug] ?? { n: 0, c: 0 };
            const pct = t.n ? Math.round((t.c / t.n) * 100) : 0;
            return (
              <div key={slug} className="mb-2">
                <div className="flex justify-between"><span className="text-slate-700">{TOPIC_META[slug].name}</span><span className="text-slate-500">{t.n ? `${t.c}/${t.n} · ${pct}%` : "—"}</span></div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: TOPIC_META[slug].color }} /></div>
              </div>
            );
          })}
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
          <h2 className="mb-2 font-bold text-slate-800">Lessons</h2>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Mini label="started" value={lessons.length} />
            <Mini label="read" value={lessonsRead} />
            <Mini label="quiz passed" value={quizzesPassed} />
          </div>
          <p className="mt-2 text-xs text-slate-500">{cpTotal ? `${cpCorrect}/${cpTotal} checkpoint questions right · ` : ""}{SKILLS.length} lessons total · {queue} in the review queue · {Math.round(timeSec / 60)} min on problems</p>
          <Link href="/skills" className="mt-2 inline-block text-sm font-semibold text-blue-700 hover:underline">Skill tree →</Link>
        </section>
      </div>

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="mb-2 font-bold text-slate-800">Questions per week</h2>
        <div className="flex h-24 items-end gap-2">
          {weeks.map((w) => (
            <div key={w.label} className="flex flex-1 flex-col items-center gap-1" title={`${w.c}/${w.n}`}>
              <div className="flex w-full flex-col justify-end" style={{ height: "80px" }}>
                <div className="w-full rounded-t bg-slate-200" style={{ height: `${((w.n - w.c) / maxW) * 80}px` }} />
                <div className="w-full bg-blue-600" style={{ height: `${(w.c / maxW) * 80}px` }} />
              </div>
              <div className="text-[10px] text-slate-400">{w.label}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <form action={rename} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
          <h2 className="mb-2 font-bold text-slate-800">Profile</h2>
          <label className="block">Name<input name="name" defaultValue={learner.name} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <label className="mt-2 block">Grade<input name="grade" type="number" min={4} max={12} defaultValue={learner.grade ?? 8} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <button className="mt-3 rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-700">Save</button>
        </form>
        <form action={changePassword} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
          <h2 className="mb-2 font-bold text-slate-800">Change password</h2>
          <label className="block">Current<input name="current" type="password" required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <label className="mt-2 block">New (6+ characters)<input name="next" type="password" required minLength={6} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <button className="mt-3 rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-700">Change</button>
        </form>
      </div>
    </div>
  );
}

function safeJson(s: string): any {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
function localDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-50 p-2">
      <div className="text-2xl font-black text-slate-900">{value}</div>
      <div className="text-[11px] text-slate-500">{label}</div>
    </div>
  );
}
