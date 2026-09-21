// Hosted scheduler endpoint. Vercel Cron calls GET /api/cron?mode=morning|evening with
// "Authorization: Bearer <CRON_SECRET>" (Vercel adds the header automatically when the
// CRON_SECRET env var is set). You can also hit it by hand with the same header.
// Sunday's evening run also sends the weekly digest, so two daily jobs cover everything.
import { NextResponse } from "next/server";
import { runDaily, type Mode } from "@/lib/daily";
import { todayStr, isValidISODate } from "@/lib/dates";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Vercel Hobby cap for a function

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const modeParam = url.searchParams.get("mode") ?? "morning";
  if (!["morning", "evening", "digest"].includes(modeParam)) return NextResponse.json({ error: "mode must be morning|evening|digest" }, { status: 400 });
  const dateParam = url.searchParams.get("date");
  const date = dateParam && isValidISODate(dateParam) ? dateParam : todayStr();
  const force = url.searchParams.get("force") === "1";

  const lines: string[] = [];
  const report = await runDaily(modeParam as Mode, date, { force, log: (s) => lines.push(s) });
  return NextResponse.json({ ...report, log: lines });
}
