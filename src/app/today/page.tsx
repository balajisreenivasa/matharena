import Link from "next/link";
import { redirect } from "next/navigation";
import { getOrCreateWorksheet } from "@/lib/worksheet";
import { todayStr, fmtLong } from "@/lib/dates";

export const dynamic = "force-dynamic";

// Builds (or resumes) the worksheet for a date and jumps to it. ?date=YYYY-MM-DD
// lets a parent open tomorrow's sheet early or catch up on a missed day.
export default async function Today({ searchParams }: { searchParams: { date?: string } }) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date ?? "") ? searchParams.date! : todayStr();
  const { worksheet, day } = await getOrCreateWorksheet(date);
  if (worksheet) redirect(`/worksheet/${worksheet.id}`);

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="text-sm font-medium uppercase tracking-wide text-slate-500">{fmtLong(date)}</div>
      <h1 className="mt-2 text-2xl font-black text-slate-900">{day ? day.label : "Outside the plan window"}</h1>
      <p className="mt-2 text-slate-600">
        {day?.kind === "exam" && (day.note ?? "Exam day. No practice.")}
        {day?.kind === "rest" && "Rest day. Nothing assigned — or pick a lesson to read."}
        {!day && "This date is before the plan starts or after AMC 10B. Adjust dates in Settings."}
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/plan" className="rounded-xl bg-slate-900 px-5 py-2 font-semibold text-white">See the plan</Link>
        <Link href="/lessons" className="rounded-xl border border-slate-300 px-5 py-2 font-semibold text-slate-700">Lessons</Link>
      </div>
    </div>
  );
}
