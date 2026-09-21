"use client";
import { useMemo, useState } from "react";
import { MathTex, RichText } from "./Math";
import { LOCAL_DIFFICULTY, globalBand } from "@/lib/difficulty";

export type ClientProblem = {
  id: string;
  contestName: string;
  year: number;
  number: number;
  statement: string;
  choices: Record<string, string>;
  answer: string;
  answerFormat: string;
  hasDiagram: boolean;
  diagramUrl: string | null;
  localDifficulty: number;
  globalDifficulty: number;
  topics: { name: string; color: string; isPrimary: boolean }[];
  solutions: string[];
};

import { answersMatch } from "@/lib/answers";
export { answersMatch };

export function PracticeClient({ problems, heading }: { problems: ClientProblem[]; heading: string }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const set = useMemo(() => problems, [problems]);
  const p = set[i];

  if (!set.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
        No problems here yet. Load the question bank with{" "}
        <code className="rounded bg-slate-100 px-1">npm run build:data</code>.
      </div>
    );
  }

  // Finished the set.
  if (!p) {
    const pct = score.total ? Math.round((score.correct / score.total) * 100) : 0;
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="text-sm font-medium uppercase tracking-wide text-slate-500">{heading}</div>
        <div className="mt-3 text-4xl font-black text-slate-900">
          {score.correct} / {score.total}
        </div>
        <div className="mt-1 text-slate-600">{pct}% correct</div>
        <button
          onClick={() => {
            setI(0);
            setPicked(null);
            setTyped("");
            setSubmitted(false);
            setWasCorrect(false);
            setScore({ correct: 0, total: 0 });
          }}
          className="mt-6 rounded-xl bg-slate-900 px-5 py-2 font-semibold text-white hover:bg-slate-700"
        >
          Practice again
        </button>
      </div>
    );
  }

  const isMultipleChoice = Object.keys(p.choices).length > 0;
  const answered = isMultipleChoice ? picked !== null : submitted;
  const primary = p.topics.find((t) => t.isPrimary) ?? p.topics[0];
  const diff = LOCAL_DIFFICULTY[p.localDifficulty] ?? LOCAL_DIFFICULTY[2];

  function record(correct: boolean) {
    setWasCorrect(correct);
    setScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
  }

  function choose(letter: string) {
    if (answered) return;
    setPicked(letter);
    record(letter === p.answer);
  }

  function submitTyped() {
    if (answered || !typed.trim()) return;
    setSubmitted(true);
    record(answersMatch(typed, p.answer));
  }

  // Free-response grading is string-based; let the user correct a false negative.
  function overrideCorrect() {
    if (wasCorrect) return;
    setWasCorrect(true);
    setScore((s) => ({ ...s, correct: s.correct + 1 }));
  }

  function next() {
    setPicked(null);
    setTyped("");
    setSubmitted(false);
    setWasCorrect(false);
    setI((n) => n + 1);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-500">{heading}</span>
        <span className="text-slate-500">
          Problem {i + 1} of {set.length} · Score {score.correct}/{score.total}
        </span>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-white">
            {/* The MATH corpus ships no contest attribution, so year is 0 there. */}
            {p.contestName}
            {p.year ? ` ${p.year}` : ""} · #{p.number}
          </span>
          {primary && (
            <span className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: primary.color }}>
              {primary.name}
            </span>
          )}
          <span className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: diff.color }}>
            {diff.label}
          </span>
          <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600">
            Global: {globalBand(p.globalDifficulty)} ({p.globalDifficulty}/10)
          </span>
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

        {isMultipleChoice ? (
          <div className="grid gap-2">
            {Object.entries(p.choices).map(([letter, val]) => {
              const isCorrect = letter === p.answer;
              const isPicked = letter === picked;
              let cls = "border-slate-200 bg-white hover:border-slate-400";
              if (answered && isCorrect) cls = "border-green-500 bg-green-50";
              else if (answered && isPicked && !isCorrect) cls = "border-red-500 bg-red-50";
              return (
                <button
                  key={letter}
                  onClick={() => choose(letter)}
                  disabled={answered}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${cls}`}
                >
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                    {letter}
                  </span>
                  <span className="text-slate-900">
                    <MathTex tex={val} />
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitTyped();
              }}
              disabled={answered}
              placeholder={p.answerFormat === "integer" ? "Integer answer (0-999)" : "Your answer, e.g. 42 or \\frac{1}{2}"}
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 font-mono text-slate-900 outline-none focus:border-slate-500 disabled:bg-slate-50"
              inputMode={p.answerFormat === "integer" ? "numeric" : "text"}
              aria-label="Your answer"
            />
            <button
              onClick={submitTyped}
              disabled={answered || !typed.trim()}
              className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-700 disabled:opacity-40"
            >
              Check
            </button>
          </div>
        )}

        {answered && (
          <div className="mt-5">
            <div className={`mb-3 rounded-lg px-4 py-2 text-sm font-semibold ${wasCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {wasCorrect ? (
                "Correct!"
              ) : (
                <span className="flex flex-wrap items-center gap-2">
                  <span>
                    Not quite — the answer is {isMultipleChoice ? `(${p.answer})` : <MathTex tex={p.answer} />}.
                  </span>
                  {!isMultipleChoice && (
                    <button
                      onClick={overrideCorrect}
                      className="rounded-md bg-red-200 px-2 py-0.5 text-xs font-semibold text-red-900 hover:bg-red-300"
                    >
                      I had this right
                    </button>
                  )}
                </span>
              )}
            </div>
            {p.solutions[0] && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-slate-800">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Solution</div>
                <div className="leading-relaxed">
                  <RichText text={p.solutions[0]} />
                </div>
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button onClick={next} className="rounded-xl bg-slate-900 px-5 py-2 font-semibold text-white hover:bg-slate-700">
                {i + 1 < set.length ? "Next problem" : "See results"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
