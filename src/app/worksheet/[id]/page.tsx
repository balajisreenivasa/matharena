import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getLearner, planConfig } from "@/lib/learner";
import { loadWorksheetView } from "@/lib/views";
import { WorksheetClient } from "@/components/WorksheetClient";
import { MockClient } from "@/components/MockClient";
import { SKILL_BY_ID } from "@/curriculum/skills";
import { aopsUrl } from "@/curriculum/calendar";
import { planDayFor } from "@/lib/plan";
import { fmtShort } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function WorksheetPage({ params }: { params: { id: string } }) {
  const learner = await getLearner();
  const w = await db.worksheet.findFirst({ where: { id: params.id, userId: learner.id } });
  if (!w) notFound();
  const { items, prior } = await loadWorksheetView(w);
  const isMock = w.kind === "mock" || w.kind === "extra-mock";
  const lesson = w.skillId && SKILL_BY_ID[w.skillId] ? { id: w.skillId, name: SKILL_BY_ID[w.skillId].name } : null;
  const day = planDayFor(planConfig(learner.plan), w.date);
  const paper = day?.paperMock;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between text-sm">
        <Link href="/" className="font-medium text-blue-600 hover:underline">← Today</Link>
        <span className="text-slate-500">{fmtShort(w.date)}{day?.note ? ` · ${day.note}` : ""}</span>
      </div>

      {paper && (
        <div className="mx-auto mb-5 max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-950">
          <div className="text-xs font-semibold uppercase tracking-wide text-red-700">{day?.kind === "diagnostic" ? "Paper diagnostic" : "Paper mock"} · {paper.label}</div>
          <p className="mt-1">
            The real thing today is a full past paper, on paper: open{" "}
            <a href={aopsUrl(paper)} target="_blank" rel="noreferrer" className="font-semibold underline">{paper.label} on the AoPS wiki</a>, print or work from the screen,
            set a 75-minute timer, no calculator, bubble answers on a sheet. Then grade with the answer key and{" "}
            <Link href="/mock" className="font-semibold underline">log the score on the Mock page</Link> with the missed problem numbers.
          </p>
          <p className="mt-2 text-red-900/80">
            {day?.kind === "diagnostic"
              ? "The in-app set below is the skill diagnostic that seeds her mastery profile. Do it in a separate sitting, untimed."
              : "The in-app timed set below is a substitute if the paper isn't possible today; the paper mock is the priority."}
          </p>
        </div>
      )}

      {isMock ? (
        <MockClient worksheetId={w.id} title={w.title} items={items} timeLimitSec={w.timeLimitSec ?? 75 * 60} prior={prior} alreadyDone={w.status === "done"} />
      ) : (
        <WorksheetClient worksheetId={w.id} title={w.title} kind={w.kind} items={items} prior={prior} lesson={lesson} nextHref="/" />
      )}
    </div>
  );
}
