"use client";
// One-problem-at-a-time worksheet with instant feedback. Every answer is POSTed to
// /api/attempt with a confidence mark; a miss must be tagged (C/S/E/R/T) before
// moving on, because the tags steer tomorrow's sheet. Reloading resumes from the
// first unanswered item.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { MathTex, RichText } from "./Math";
import { LOCAL_DIFFICULTY, globalBand } from "@/lib/difficulty";
import type { ClientProblem } from "./PracticeClient";
import { answersMatch } from "@/lib/answers";
import { ERROR_TAGS, type Confidence, type ErrorTag } from "@/lib/mastery";
import { AnswerInput } from "./AnswerInput";

export type WorksheetItemView = {
  role: string;
  roleLabel: string;
  skillId?: string;
  skillName?: string;
  reason?: string;
  problem: ClientProblem;
};

export type PriorAttempt = { id: string; selected: string; isCorrect: boolean; confidence?: string | null; errorTag?: string | null };

type Props = {
  worksheetId: string;
  title: string;
  kind: string;
  items: WorksheetItemView[];
  prior: Record<string, PriorAttempt>;
  lesson?: { id: string; name: string } | null;
  nextHref?: string;
};

const CONF: { id: Confidence; label: string }[] = [
  { id: "sure", label: "Sure" },
  { id: "unsure", label: "Unsure" },
  { id: "guessed", label: "Guessed" },
];

export function WorksheetClient({ worksheetId, title, kind, items, prior, lesson, nextHref }: Props) {
  const [answers, setAnswers] = useState<Record<string, PriorAttempt>>(prior);
  const firstOpen = useMemo(() => items.findIndex((it) => !answers[it.problem.id]), [items, answers]);
  const [i, setI] = useState(firstOpen === -1 ? items.length : firstOpen);
  const [typed, setTyped] = useState("");
  const [confidence, setConfidence] = useState<Confidence>("sure");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    startedAt.current = Date.now();
  }, [i]);

  const it = items[i];
  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.values(answers).filter((a) => a.isCorrect).length;

  if (!items.length) {
    return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">This worksheet is empty.</div>;
  }

  async function submit(selected: string) {
    if (!it || busy) return;
    setBusy(true);
    setError(null);
    const timeSpentSec = Math.round((Date.now() - startedAt.current) / 1000);
    try {
      const res = await fetch("/api/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ worksheetId, problemId: it.problem.id, selected, confidence, timeSpentSec }),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      const data = await res.json();
      const a = data.attempts?.[0];
      if (!a) throw new Error("No attempt returned");
      setAnswers((m) => ({ ...m, [it.problem.id]: { id: a.id, selected, isCorrect: a.isCorrect, confidence, errorTag: null } }));
    } catch (e: any) {
      setError(e.message ?? "Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function override() {
    const a = answers[it.problem.id];
    if (!a || a.isCorrect) return;
    setAnswers((m) => ({ ...m, [it.problem.id]: { ...a, isCorrect: true, errorTag: null } }));
    await fetch(`/api/attempt/${a.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ override: true }) }).catch(() => {});
  }

  async function tagError(tag: ErrorTag) {
    const a = answers[it.problem.id];
    if (!a) return;
    setAnswers((m) => ({ ...m, [it.problem.id]: { ...a, errorTag: tag } }));
    await fetch(`/api/attempt/${a.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ errorTag: tag }) }).catch(() => {});
  }

  function next() {
    setTyped("");
    setConfidence("sure");
    setI((n) => n + 1);
  }

  // Finished.
  if (!it) {
    const pct = items.length ? Math.round((correctCount / items.length) * 100) : 0;
    const byRole = new Map<string, { label: string; correct: number; total: number }>();
    const bySkill = new Map<string, { name: string; correct: number; total: number }>();
    const tags: Record<string, number> = {};
    let sureWrong = 0;
    for (const x of items) {
      const a = answers[x.problem.id];
      const r = byRole.get(x.role) ?? { label: x.roleLabel, correct: 0, total: 0 };
      r.total++;
      if (a?.isCorrect) r.correct++;
      byRole.set(x.role, r);
      if (x.skillId) {
        const s = bySkill.get(x.skillId) ?? { name: x.skillName ?? x.skillId, correct: 0, total: 0 };
        s.total++;
        if (a?.isCorrect) s.correct++;
        bySkill.set(x.skillId, s);
      }
      if (a && !a.isCorrect) {
        if (a.errorTag) tags[a.errorTag] = (tags[a.errorTag] ?? 0) + 1;
        if (a.confidence === "sure") sureWrong++;
      }
    }
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="text-sm font-medium uppercase tracking-wide text-slate-500">{title}</div>
          <div className="mt-3 text-5xl font-black text-slate-900">
            {correctCount} / {items.length}
          </div>
          <div className="mt-1 text-slate-600">{pct}% correct · mastery and review queue updated</div>
          {sureWrong > 0 && <div className="mt-2 text-sm font-semibold text-red-700">{sureWrong} "sure" answer{sureWrong > 1 ? "s were" : " was"} wrong. Those are the ones to re-read tonight.</div>}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">By section</div>
            {[...byRole.values()].map((r) => (
              <div key={r.label} className="flex justify-between border-b border-slate-100 py-1 text-sm">
                <span>{r.label}</span>
                <span className="font-semibold">{r.correct}/{r.total}</span>
              </div>
            ))}
            {Object.keys(tags).length > 0 && (
              <>
                <div className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Error tags</div>
                {Object.entries(tags).map(([t, n]) => (
                  <div key={t} className="flex justify-between border-b border-slate-100 py-1 text-sm">
                    <span>{ERROR_TAGS[t as ErrorTag]?.name ?? t}</span>
                    <span className="font-semibold">{n}</span>
                  </div>
                ))}
              </>
            )}
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">By skill</div>
            {[...bySkill.entries()].map(([id, s]) => (
              <div key={id} className="flex justify-between border-b border-slate-100 py-1 text-sm">
                <Link href={`/lessons/${id}`} className="text-blue-700 hover:underline">{s.name}</Link>
                <span className={`font-semibold ${s.correct === s.total ? "text-green-700" : s.correct === 0 ? "text-red-700" : ""}`}>{s.correct}/{s.total}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/progress" className="rounded-xl bg-slate-900 px-5 py-2 font-semibold text-white hover:bg-slate-700">See progress</Link>
          <Link href={nextHref ?? "/"} className="rounded-xl border border-slate-300 px-5 py-2 font-semibold text-slate-700 hover:bg-slate-50">Back to today</Link>
        </div>
      </div>
    );
  }

  const p = it.problem;
  const isMultipleChoice = Object.keys(p.choices).length > 0;
  const a = answers[p.id];
  const answered = !!a;
  const needsTag = answered && !a.isCorrect && !a.errorTag;
  const diff = LOCAL_DIFFICULTY[p.localDifficulty] ?? LOCAL_DIFFICULTY[2];
  const primary = p.topics.find((t) => t.isPrimary) ?? p.topics[0];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-medium text-slate-500">{title}</span>
        <span className="text-slate-500">
          {i + 1} of {items.length} · {correctCount}/{answeredCount} correct
        </span>
      </div>
      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div className="h-full bg-blue-600 transition-all" style={{ width: `${(answeredCount / items.length) * 100}%` }} />
      </div>

      {lesson && (kind === "daily" || kind === "quiz") && (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Today&apos;s lesson: <Link href={`/lessons/${lesson.id}`} className="font-semibold underline">{lesson.name}</Link>. Read it first (about 15 minutes), then work these.
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-white" title={it.reason}>{it.roleLabel}</span>
          {it.skillName && <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-900">{it.skillName}</span>}
          {primary && !it.skillName && (
            <span className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: primary.color }}>{primary.name}</span>
          )}
          <span className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: diff.color }}>{diff.label}</span>
          <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600">{globalBand(p.globalDifficulty)} ({p.globalDifficulty}/10)</span>
          <span className="ml-auto text-xs text-slate-400">{p.contestName}{p.year ? ` ${p.year}` : ""} #{p.number}</span>
        </div>

        <div className="mb-5 text-lg leading-relaxed text-slate-900">
          <RichText text={p.statement} />
        </div>
        {p.hasDiagram && p.diagramUrl && (
          <div className="mb-5 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.diagramUrl} alt={`Diagram for problem ${p.number}`} className="max-h-72 rounded-lg border border-slate-200" />
          </div>
        )}

        {!answered && (
          <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
            <span>How sure are you?</span>
            {CONF.map((c) => (
              <button key={c.id} onClick={() => setConfidence(c.id)} className={`rounded-full border px-2.5 py-0.5 font-semibold ${confidence === c.id ? "border-slate-800 bg-slate-800 text-white" : "border-slate-300 text-slate-600 hover:border-slate-500"}`}>
                {c.label}
              </button>
            ))}
          </div>
        )}

        {isMultipleChoice ? (
          <div className="grid gap-2">
            {Object.entries(p.choices).map(([letter, val]) => {
              const isCorrect = letter === p.answer;
              const isPicked = letter === a?.selected;
              let cls = "border-slate-200 bg-white hover:border-slate-400";
              if (answered && isCorrect) cls = "border-green-500 bg-green-50";
              else if (answered && isPicked && !isCorrect) cls = "border-red-500 bg-red-50";
              return (
                <button key={letter} onClick={() => !answered && !busy && submit(letter)} disabled={answered || busy} className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${cls}`}>
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">{letter}</span>
                  <span className="text-slate-900"><MathTex tex={val} /></span>
                </button>
              );
            })}
          </div>
        ) : (
          <AnswerInput
            value={answered ? a.selected : typed}
            onChange={setTyped}
            onSubmit={(v) => submit(v)}
            onSkip={() => submit("")}
            disabled={answered || busy}
            busy={busy}
            integerOnly={p.answerFormat === "integer"}
          />
        )}

        {error && <div className="mt-3 rounded-lg bg-amber-100 px-4 py-2 text-sm text-amber-900">{error} — try again.</div>}

        {answered && (
          <div className="mt-5">
            <div className={`mb-3 rounded-lg px-4 py-2 text-sm font-semibold ${a.isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {a.isCorrect ? (
                a.confidence === "guessed" ? "Correct, but a guess — read the solution anyway." : "Correct!"
              ) : (
                <span className="flex flex-wrap items-center gap-2">
                  <span>{a.selected.trim() === "" ? "Left blank" : "Not quite"} — the answer is {isMultipleChoice ? `(${p.answer})` : <MathTex tex={p.answer} />}.</span>
                  {!isMultipleChoice && a.selected.trim() !== "" && !answersMatch(a.selected, p.answer) && (
                    <button onClick={override} className="rounded-md bg-red-200 px-2 py-0.5 text-xs font-semibold text-red-900 hover:bg-red-300">I had this right</button>
                  )}
                </span>
              )}
            </div>
            {p.solutions[0] && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-slate-800">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Solution</div>
                <div className="leading-relaxed"><RichText text={p.solutions[0]} /></div>
              </div>
            )}
            {!a.isCorrect && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-900">Why did you miss it? (pick one to continue)</div>
                <div className="grid gap-1.5 sm:grid-cols-5">
                  {(Object.keys(ERROR_TAGS) as ErrorTag[]).map((t) => (
                    <button key={t} onClick={() => tagError(t)} className={`rounded-lg border px-2 py-1.5 text-left text-xs ${a.errorTag === t ? "border-amber-700 bg-amber-200" : "border-amber-200 bg-white hover:border-amber-400"}`} title={ERROR_TAGS[t].effect}>
                      <b>{t}</b> {ERROR_TAGS[t].name}
                      <div className="text-[11px] text-slate-600">{ERROR_TAGS[t].blurb}</div>
                    </button>
                  ))}
                </div>
                {a.errorTag && <div className="mt-2 text-xs text-amber-900">→ {ERROR_TAGS[a.errorTag as ErrorTag].effect}.</div>}
              </div>
            )}
            {!a.isCorrect && it.skillId && (
              <div className="mt-3 text-sm text-slate-600">
                Re-read <Link href={`/lessons/${it.skillId}`} className="font-semibold text-blue-700 underline">{it.skillName}</Link> tonight.
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button onClick={next} disabled={needsTag} className="rounded-xl bg-slate-900 px-5 py-2 font-semibold text-white hover:bg-slate-700 disabled:opacity-40">
                {i + 1 < items.length ? "Next problem" : "See results"}
              </button>
            </div>
          </div>
        )}
      </div>
      {it.reason && <div className="mt-2 text-right text-xs text-slate-400">Why this problem: {it.reason}</div>}
    </div>
  );
}
