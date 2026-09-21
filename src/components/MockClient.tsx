"use client";
// Timed, AMC-style mock: all 25 problems on one page, no feedback until "Submit exam".
// Scored like the real thing: 6 per correct, 1.5 per blank, 0 per wrong. Blanks are
// deliberate — leaving a problem blank is a skill the AMC rewards.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MathTex, RichText } from "./Math";
import type { WorksheetItemView, PriorAttempt } from "./WorksheetClient";
import { amcScore } from "@/lib/mastery";

type Props = {
  worksheetId: string;
  title: string;
  items: WorksheetItemView[];
  timeLimitSec: number;
  prior: Record<string, PriorAttempt>;
  alreadyDone: boolean;
};

const TIMER_KEY = (id: string) => `mock-start-${id}`;

export function MockClient({ worksheetId, title, items, timeLimitSec, prior, alreadyDone }: Props) {
  const [started, setStarted] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [typed, setTyped] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, PriorAttempt>>(prior);
  const [done, setDone] = useState(alreadyDone);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem(TIMER_KEY(worksheetId));
      if (s) setStarted(parseInt(s, 10));
    } catch {}
  }, [worksheetId]);

  useEffect(() => {
    if (!started || done) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [started, done]);

  const remaining = started ? Math.max(0, timeLimitSec - Math.floor((now - started) / 1000)) : timeLimitSec;

  useEffect(() => {
    if (started && !done && remaining === 0) submitAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, started, done]);

  function start() {
    const t = Date.now();
    try {
      localStorage.setItem(TIMER_KEY(worksheetId), String(t));
    } catch {}
    setStarted(t);
    setNow(t);
  }

  async function submitAll() {
    if (busy || done) return;
    setBusy(true);
    try {
      const answers = items.map((it) => ({ problemId: it.problem.id, selected: typed[it.problem.id] ?? "" }));
      const res = await fetch("/api/attempt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ worksheetId, answers }) });
      const data = await res.json();
      const map: Record<string, PriorAttempt> = {};
      for (const a of data.attempts ?? []) map[a.problemId] = { id: a.id, selected: typed[a.problemId] ?? "", isCorrect: a.isCorrect };
      setResults(map);
      setDone(true);
      try {
        localStorage.removeItem(TIMER_KEY(worksheetId));
      } catch {}
    } finally {
      setBusy(false);
    }
  }

  const summary = useMemo(() => {
    if (!done) return null;
    let correct = 0, blank = 0, wrong = 0;
    for (const it of items) {
      const r = results[it.problem.id];
      if (!r || r.selected.trim() === "") blank++;
      else if (r.isCorrect) correct++;
      else wrong++;
    }
    return { correct, blank, wrong, score: amcScore(correct, blank) };
  }, [done, items, results]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  if (!started && !done) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900">{title}</h1>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-slate-700">
          <li>{items.length} problems, {Math.round(timeLimitSec / 60)} minutes, no calculator, scratch paper only.</li>
          <li>Scoring is the real AMC rule: 6 points right, 1.5 points blank, 0 wrong. Leave it blank if you can&apos;t eliminate at least two choices&apos; worth of doubt.</li>
          <li>No feedback until you submit. The timer keeps running if you reload.</li>
          <li>Afterwards, review every miss and every blank and write one line on what you&apos;d do differently.</li>
        </ul>
        <button onClick={start} className="mt-6 rounded-xl bg-red-600 px-6 py-3 font-bold text-white hover:bg-red-700">Start the clock</button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="sticky top-0 z-10 mb-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
        <div className="font-semibold text-slate-800">{title}</div>
        {done && summary ? (
          <div className="text-sm">
            <span className="text-2xl font-black text-slate-900">{summary.score}</span> / 150 · {summary.correct} right, {summary.blank} blank, {summary.wrong} wrong
          </div>
        ) : (
          <div className={`font-mono text-2xl font-bold ${remaining < 300 ? "text-red-600" : "text-slate-900"}`}>{mm}:{ss}</div>
        )}
      </div>

      {done && summary && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm text-slate-600">
            AMC 10 reference points: AIME qualification has recently needed roughly 100-110; Distinguished Honor Roll is the top 1%; the median is usually 50-60. Review each miss below, then read the lesson for any skill that shows up twice.
          </div>
          <div className="mt-3 flex gap-3">
            <Link href="/progress" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Progress</Link>
            <Link href="/mock" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Mock history</Link>
          </div>
        </div>
      )}

      <div className="space-y-5">
        {items.map((it, idx) => {
          const p = it.problem;
          const isMC = Object.keys(p.choices).length > 0;
          const r = results[p.id];
          const blank = done && (!r || r.selected.trim() === "");
          const border = !done ? "border-slate-200" : r?.isCorrect ? "border-green-400" : blank ? "border-amber-300" : "border-red-400";
          return (
            <div key={p.id} className={`rounded-2xl border bg-white p-5 shadow-sm ${border}`}>
              <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-slate-800 px-2.5 py-0.5 font-bold text-white">{idx + 1}</span>
                {it.skillName && <span>{it.skillName}</span>}
                <span className="ml-auto">{p.globalDifficulty}/10</span>
              </div>
              <div className="mb-3 leading-relaxed text-slate-900"><RichText text={p.statement} /></div>
              {isMC ? (
                <div className="grid gap-1.5 sm:grid-cols-5">
                  {Object.entries(p.choices).map(([letter, val]) => {
                    const sel = done ? r?.selected : typed[p.id];
                    const cls = done
                      ? letter === p.answer
                        ? "border-green-500 bg-green-50"
                        : sel === letter
                          ? "border-red-500 bg-red-50"
                          : "border-slate-200"
                      : sel === letter
                        ? "border-blue-600 bg-blue-50"
                        : "border-slate-200 hover:border-slate-400";
                    return (
                      <button key={letter} disabled={done} onClick={() => setTyped((m) => ({ ...m, [p.id]: m[p.id] === letter ? "" : letter }))} className={`rounded-lg border px-2 py-1.5 text-left text-sm ${cls}`}>
                        <b className="mr-1">{letter}</b><MathTex tex={val} />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <input
                  value={done ? r?.selected ?? "" : typed[p.id] ?? ""}
                  onChange={(e) => setTyped((m) => ({ ...m, [p.id]: e.target.value }))}
                  disabled={done}
                  placeholder="Answer (leave blank to skip)"
                  className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm outline-none focus:border-slate-500 disabled:bg-slate-50"
                  aria-label={`Answer ${idx + 1}`}
                />
              )}
              {done && (
                <div className="mt-3 text-sm">
                  <div className={`mb-2 inline-block rounded px-2 py-0.5 font-semibold ${r?.isCorrect ? "bg-green-100 text-green-800" : blank ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>
                    {r?.isCorrect ? "Correct" : blank ? "Blank (+1.5)" : "Wrong"} · answer: {isMC ? p.answer : <MathTex tex={p.answer} />}
                  </div>
                  {p.solutions[0] && (
                    <details className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-500">Solution</summary>
                      <div className="mt-2 leading-relaxed text-slate-800"><RichText text={p.solutions[0]} /></div>
                    </details>
                  )}
                  {it.skillId && !r?.isCorrect && (
                    <div className="mt-2 text-slate-600">Review: <Link href={`/lessons/${it.skillId}`} className="font-semibold text-blue-700 underline">{it.skillName}</Link></div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!done && (
        <div className="sticky bottom-0 mt-6 flex justify-end rounded-xl border border-slate-200 bg-white/95 p-3 shadow backdrop-blur">
          <button onClick={submitAll} disabled={busy} className="rounded-xl bg-red-600 px-6 py-3 font-bold text-white hover:bg-red-700 disabled:opacity-50">
            {busy ? "Grading…" : "Submit exam"}
          </button>
        </div>
      )}
    </div>
  );
}
