import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getLearner, planConfig } from "@/lib/learner";
import { getOrCreateWorksheet, parseItems } from "@/lib/worksheet";
import { planDayFor, IS_STUDY_DAY, KIND_COLOR, KIND_LABEL } from "@/lib/plan";
import { aopsUrl } from "@/curriculum/calendar";
import { SKILL_BY_ID } from "@/curriculum/skills";
import { lessonFor } from "@/curriculum/lessons";
import { todayStr, fmtLong, daysBetween, isValidISODate } from "@/lib/dates";

export const dynamic = "force-dynamic";

// The daily routine, block by block, with live status:
//   Warm-up 10 · Lesson 20 · Worksheet 30 · Corrections 10  (weekdays)
//   Paper mock (Saturday) · Mock review (Sunday)
// ?date=YYYY-MM-DD opens another day (catch up, or preview tomorrow); ?start=1 jumps
// straight into the worksheet.
export default async function Today({ searchParams }: { searchParams: { date?: string; start?: string } }) {
  const date = isValidISODate(searchParams.date ?? "") ? searchParams.date! : todayStr();
  const learner = await getLearner();
  const cfg = planConfig(learner.plan);
  const day = planDayFor(cfg, date);
  const isToday = date === todayStr();

  if (!day) {
    return (
      <Empty date={date} title="Outside the plan window">
        This date is before the plan starts or after AMC 10B. <Link href="/settings" className="underline">Adjust dates</Link>.
      </Empty>
    );
  }
  if (!IS_STUDY_DAY[day.kind]) {
    return (
      <Empty date={date} title={day.label}>
        {day.note ?? (day.kind === "rest" ? "Rest day. Nothing assigned; the review queue and lessons are always open." : "")}
        <div className="mt-4 flex justify-center gap-3 text-sm">
          <Link href="/lessons" className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700">Browse lessons</Link>
          <Link href="/plan" className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white">See the plan</Link>
        </div>
      </Empty>
    );
  }

  const { worksheet } = await getOrCreateWorksheet(date);
  if (searchParams.start && worksheet) redirect(`/worksheet/${worksheet.id}`);

  const dayNo = daysBetween(cfg.startDate, date) + 1;
  const items = worksheet ? parseItems(worksheet) : [];
  const attempts = worksheet ? await db.attempt.findMany({ where: { worksheetId: worksheet.id }, orderBy: { createdAt: "asc" } }) : [];
  const latest = new Map<string, (typeof attempts)[number]>();
  for (const a of attempts) latest.set(a.problemId, a);
  const answered = latest.size;
  const correct = [...latest.values()].filter((a) => a.isCorrect).length;
  const untagged = [...latest.values()].filter((a) => !a.isCorrect && !a.errorTag).length;
  const warmupItems = items.filter((i) => ["warmup", "sprint", "speed", "review", "weak"].includes(i.role)).length;
  const dueReview = await db.reviewItem.count({ where: { userId: learner.id, dueDate: { lte: date } } });
  const views = await db.lessonView.findMany({ where: { userId: learner.id, date, skillId: { in: day.skillIds } } });
  const paperLogged = day.paperMock ? await db.mockExam.findFirst({ where: { userId: learner.id, year: day.paperMock.year, contest: day.paperMock.contest } }) : null;
  const wsDone = worksheet?.status === "done";
  const wsStarted = worksheet?.status === "in_progress";
  const lessonRead = day.skillIds.length > 0 && day.skillIds.every((id) => views.some((v) => v.skillId === id));
  const lessonMinutes = day.skillIds.reduce((a, id) => a + (lessonFor(id)?.estimatedMinutes ?? 12), 0);

  type Block = { n: number; title: string; minutes: string; status: "done" | "active" | "todo" | "skip"; body: React.ReactNode; cta?: { href: string; label: string; external?: boolean } };
  const blocks: Block[] = [];

  if (day.paperMock) {
    blocks.push({
      n: blocks.length + 1,
      title: day.kind === "diagnostic" ? `Paper diagnostic: ${day.paperMock.label}` : `Paper mock: ${day.paperMock.label}`,
      minutes: "75 min + grading",
      status: paperLogged ? "done" : "active",
      body: paperLogged ? (
        <>Logged: <b>{paperLogged.score}</b> ({paperLogged.correct} right, {paperLogged.blank} blank, {paperLogged.wrong} wrong).</>
      ) : (
        <>Print or open the paper on AoPS. 75-minute timer, no calculator, bubble answers on a sheet. Grade with the answer key, then log the score and missed problem numbers.</>
      ),
      cta: paperLogged ? { href: "/mock", label: "Mock history" } : { href: aopsUrl(day.paperMock), label: `Open ${day.paperMock.label} ↗`, external: true },
    });
  }

  if (day.kind === "lesson" || day.kind === "quiz") {
    blocks.push({
      n: blocks.length + 1,
      title: "Warm-up",
      minutes: "10 min",
      status: wsDone ? "done" : wsStarted ? "active" : "todo",
      body: (
        <>
          {dueReview > 0 ? <>{dueReview} problem{dueReview > 1 ? "s" : ""} from the review queue {dueReview > 1 ? "are" : "is"} due. </> : "Nothing due from the review queue. "}
          The first {warmupItems} item{warmupItems === 1 ? "" : "s"} on the worksheet are warm-ups: weak skills and review, at the easy end of her band.
        </>
      ),
    });
    blocks.push({
      n: blocks.length + 1,
      title: `Lesson: ${day.skillIds.map((id) => SKILL_BY_ID[id]?.name ?? id).join(" + ")}`,
      minutes: `${lessonMinutes} min`,
      status: lessonRead ? "done" : wsDone ? "skip" : "active",
      body: (
        <>
          {day.skillIds.map((id) => {
            const l = lessonFor(id);
            return (
              <div key={id} className="mb-1">
                <Link href={`/lessons/${id}`} className="font-semibold text-blue-700 underline">{SKILL_BY_ID[id]?.name}</Link>
                {l && <span className="text-slate-600"> — {l.keyIdeas.length} key ideas, {l.workedExamples.length} worked examples. Try each example before opening its solution.</span>}
                {views.some((v) => v.skillId === id) && <span className="ml-2 text-xs font-semibold text-green-700">opened today</span>}
              </div>
            );
          })}
          {day.note && <div className="mt-1 text-xs text-slate-500">{day.note}</div>}
        </>
      ),
      cta: { href: `/lessons/${day.skillIds[0]}`, label: lessonRead ? "Re-read" : "Read the lesson" },
    });
  }

  blocks.push({
    n: blocks.length + 1,
    title: day.kind === "lesson" ? "Worksheet" : day.kind === "quiz" ? "Topic quiz (timed)" : day.kind === "mock" ? "In-app timed mock" : day.kind === "diagnostic" ? "In-app skill diagnostic" : day.label,
    minutes: worksheet?.timeLimitSec ? `${Math.round(worksheet.timeLimitSec / 60)} min, timed` : day.kind === "diagnostic" ? "45-60 min, untimed" : day.kind === "mock_review" ? "30-45 min" : "30 min",
    status: wsDone ? "done" : wsStarted ? "active" : lessonRead || !day.skillIds.length ? "active" : "todo",
    body: !worksheet ? (
      <>Could not build a worksheet for this day.</>
    ) : wsDone ? (
      <>Done: <b>{correct}/{items.length}</b> correct.</>
    ) : wsStarted ? (
      <>{answered}/{items.length} answered so far, {correct} correct. Pick up where she left off.</>
    ) : (
      <>
        {items.length} problems, easy to hard. Mark how sure she is on each one; every miss asks why (C/S/E/R/T).
        {day.kind === "diagnostic" && " One problem per skill. Skip anything unfamiliar rather than guessing: a blank tells the planner more than a lucky guess."}
      </>
    ),
    cta: worksheet ? { href: `/worksheet/${worksheet.id}`, label: wsDone ? "Review answers" : wsStarted ? "Resume" : "Start" } : undefined,
  });

  if (worksheet && day.kind !== "mock" && day.kind !== "diagnostic") {
    blocks.push({
      n: blocks.length + 1,
      title: "Corrections",
      minutes: "10 min",
      status: wsDone && untagged === 0 ? "done" : wsDone ? "active" : "todo",
      body: wsDone ? (
        untagged === 0 ? (
          <>Every miss is tagged. Tomorrow's sheet already reflects it. Write the misses in the paper error log.</>
        ) : (
          <>{untagged} miss{untagged > 1 ? "es" : ""} still need{untagged === 1 ? "s" : ""} an error tag.</>
        )
      ) : (
        <>After the worksheet: read the solution for each miss, tag it, and copy it into the error-log notebook.</>
      ),
      cta: wsDone && untagged > 0 && worksheet ? { href: `/worksheet/${worksheet.id}`, label: "Tag misses" } : undefined,
    });
  }

  if (day.kind === "diagnostic") {
    blocks.push({
      n: blocks.length + 1,
      title: "Baseline & target",
      minutes: "5 min",
      status: wsDone ? "active" : "todo",
      body: <>When both parts are done, the diagnostic page shows her baseline by skill, the starting band for each, and which score target the plan will aim at.</>,
      cta: { href: "/diagnostic", label: "See baseline" },
    });
  }

  const allDone = blocks.every((b) => b.status === "done" || b.status === "skip");

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-sm font-medium text-slate-500">{fmtLong(date)} · Day {dayNo}{!isToday && " (not today)"}</div>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-black text-slate-900">
            <span className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: KIND_COLOR[day.kind] }}>{KIND_LABEL[day.kind]}</span>
            {day.label}
          </h1>
        </div>
        <div className="text-right text-sm text-slate-500">
          {daysBetween(date, cfg.examADate)} days to 10A · {daysBetween(date, cfg.examBDate)} to 10B
        </div>
      </div>

      {allDone && <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-900">Day {dayNo} complete. Stop here; more isn&apos;t better.</div>}

      <ol className="space-y-3">
        {blocks.map((b) => (
          <li key={b.n} className={`rounded-2xl border bg-white p-5 shadow-sm ${b.status === "active" ? "border-blue-300 ring-2 ring-blue-100" : b.status === "done" ? "border-green-200" : "border-slate-200 opacity-80"}`}>
            <div className="flex flex-wrap items-start gap-3">
              <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm font-bold ${b.status === "done" ? "bg-green-600 text-white" : b.status === "active" ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"}`}>{b.status === "done" ? "✓" : b.n}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-bold text-slate-900">{b.title}</h2>
                  <span className="text-xs text-slate-500">{b.minutes}</span>
                </div>
                <div className="mt-1 text-sm text-slate-700">{b.body}</div>
                {b.cta && (
                  <div className="mt-3">
                    {b.cta.external ? (
                      <a href={b.cta.href} target="_blank" rel="noreferrer" className="inline-block rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">{b.cta.label}</a>
                    ) : (
                      <Link href={b.cta.href} className={`inline-block rounded-xl px-4 py-2 text-sm font-semibold ${b.status === "active" ? "bg-slate-900 text-white hover:bg-slate-700" : "border border-slate-300 text-slate-700 hover:bg-slate-50"}`}>{b.cta.label}</Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-500">
        <Link href="/plan" className="hover:underline">Full calendar</Link>
        <Link href="/progress" className="hover:underline">Progress</Link>
        {!isToday && <Link href="/today" className="hover:underline">Back to today</Link>}
      </div>
    </div>
  );
}

function Empty({ date, title, children }: { date: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="text-sm font-medium uppercase tracking-wide text-slate-500">{fmtLong(date)}</div>
      <h1 className="mt-2 text-2xl font-black text-slate-900">{title}</h1>
      <div className="mt-2 text-slate-600">{children}</div>
    </div>
  );
}
