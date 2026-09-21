"use client";
// Interactive lesson walkthrough. Steps: overview -> key ideas + checkpoints (answer
// each, instant grading, explanation) -> formulas -> worked examples (answer before
// the solution unlocks) -> pitfalls & strategy -> 5-problem quiz from the bank.
// Every answer is saved to /api/lesson-progress so the profile and Today page know
// how far she got; reloading resumes.
import { useMemo, useState } from "react";
import Link from "next/link";
import { RichText, MathTex } from "./Math";
import { AnswerInput } from "./AnswerInput";
import { answersMatch } from "@/lib/answers";
import type { Lesson } from "@/curriculum/lessons";

export type SavedAnswer = { answer: string; correct: boolean };
export type LessonProgressView = {
  status: string;
  checkpoints: Record<string, SavedAnswer>;
  examples: Record<string, SavedAnswer>;
  quizScore: number | null;
  quizTotal: number | null;
  quizWorksheetId: string | null;
};

type Props = { skillId: string; skillName: string; lesson: Lesson; initial: LessonProgressView };

const STEPS = ["Overview", "Key ideas", "Formulas", "Worked examples", "Pitfalls & strategy", "Quiz"] as const;

export function LessonClient({ skillId, skillName, lesson, initial }: Props) {
  const [progress, setProgress] = useState<LessonProgressView>(initial);
  const [step, setStep] = useState(0);
  const [busyQuiz, setBusyQuiz] = useState(false);

  const cpDone = lesson.checkpoints.filter((c) => progress.checkpoints[c.id]).length;
  const cpRight = lesson.checkpoints.filter((c) => progress.checkpoints[c.id]?.correct).length;
  const exDone = lesson.workedExamples.filter((_, i) => progress.examples[String(i)]).length;
  const exRight = lesson.workedExamples.filter((_, i) => progress.examples[String(i)]?.correct).length;
  const total = lesson.checkpoints.length + lesson.workedExamples.length;
  const done = cpDone + exDone;
  const quizPassed = progress.quizScore !== null && progress.quizTotal !== null && progress.quizScore >= Math.ceil(progress.quizTotal * 0.8);

  async function save(kind: "checkpoint" | "example", key: string, answer: string, correct: boolean) {
    const next = { ...progress, [kind === "checkpoint" ? "checkpoints" : "examples"]: { ...(kind === "checkpoint" ? progress.checkpoints : progress.examples), [key]: { answer, correct } } } as LessonProgressView;
    setProgress(next);
    try {
      const res = await fetch("/api/lesson-progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ skillId, kind, key, answer, correct }) });
      if (res.ok) {
        const data = await res.json();
        if (data?.status) setProgress((p) => ({ ...p, status: data.status }));
      }
    } catch {}
  }

  async function startQuiz() {
    setBusyQuiz(true);
    try {
      const res = await fetch("/api/lesson-progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ skillId, kind: "quiz" }) });
      const data = await res.json();
      if (data?.worksheetId) window.location.href = `/worksheet/${data.worksheetId}`;
    } finally {
      setBusyQuiz(false);
    }
  }

  return (
    <div>
      {/* Step rail */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        {STEPS.map((s, i) => (
          <button key={s} onClick={() => setStep(i)} className={`rounded-full px-3 py-1 font-semibold ${i === step ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-100"}`}>
            {i + 1}. {s}
            {s === "Key ideas" && cpDone > 0 && <span className="ml-1 opacity-80">{cpRight}/{lesson.checkpoints.length}</span>}
            {s === "Worked examples" && exDone > 0 && <span className="ml-1 opacity-80">{exRight}/{lesson.workedExamples.length}</span>}
            {s === "Quiz" && progress.quizScore !== null && <span className="ml-1 opacity-80">{progress.quizScore}/{progress.quizTotal}</span>}
          </button>
        ))}
        <span className="ml-auto text-slate-500">{done}/{total} answered{quizPassed ? " · quiz passed ✓" : ""}</span>
      </div>
      <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-blue-600" style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></div>

      {step === 0 && (
        <Card title={`What this is: ${skillName}`}>
          <p className="leading-relaxed"><RichText text={lesson.summary} /></p>
          <p className="mt-3 text-sm text-slate-600">About {lesson.estimatedMinutes} minutes. Read the key ideas and answer the four checkpoint questions as you go; then try each worked example before opening its solution; then take the quiz.</p>
          <div className="mt-4"><Next onClick={() => setStep(1)} label="Start: key ideas" /></div>
        </Card>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <Card title="Key ideas">
            <ul className="list-disc space-y-2 pl-5">{lesson.keyIdeas.map((k, i) => <li key={i}><RichText text={k} /></li>)}</ul>
          </Card>
          <Card title="Checkpoints · answer each one">
            <div className="space-y-4">
              {lesson.checkpoints.map((c, i) => (
                <Question
                  key={c.id}
                  n={i + 1}
                  question={c.question}
                  answer={c.answer}
                  hint={c.hint}
                  explanation={c.explanation}
                  saved={progress.checkpoints[c.id]}
                  onAnswer={(a, ok) => save("checkpoint", c.id, a, ok)}
                />
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-slate-600">{cpRight}/{lesson.checkpoints.length} correct{cpDone < lesson.checkpoints.length ? ` · ${lesson.checkpoints.length - cpDone} to go` : ""}</span>
              <Next onClick={() => setStep(2)} label="Formulas" />
            </div>
          </Card>
        </div>
      )}

      {step === 2 && (
        <Card title="Formulas & facts to know cold">
          <ul className="space-y-2">{lesson.formulas.map((f, i) => <li key={i} className="rounded-lg bg-slate-50 px-3 py-2"><RichText text={f} /></li>)}</ul>
          <p className="mt-3 text-sm text-slate-600">Cover the list and say each one out loud before moving on.</p>
          <div className="mt-4"><Next onClick={() => setStep(3)} label="Worked examples" /></div>
        </Card>
      )}

      {step === 3 && (
        <Card title="Worked examples · try it before you look">
          <div className="space-y-5">
            {lesson.workedExamples.map((ex, i) => (
              <Question
                key={i}
                n={i + 1}
                label="Example"
                question={ex.problem}
                answer={ex.answer}
                explanation={ex.solution}
                explanationLabel="Full solution"
                saved={progress.examples[String(i)]}
                onAnswer={(a, ok) => save("example", String(i), a, ok)}
                allowReveal
              />
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-slate-600">{exRight}/{lesson.workedExamples.length} correct on first try</span>
            <Next onClick={() => setStep(4)} label="Pitfalls & strategy" />
          </div>
        </Card>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <Card title="Pitfalls">
            <ul className="list-disc space-y-2 pl-5">{lesson.pitfalls.map((k, i) => <li key={i}><RichText text={k} /></li>)}</ul>
          </Card>
          <Card title="On the AMC 10">
            <p className="leading-relaxed"><RichText text={lesson.amcStrategy} /></p>
            <div className="mt-4"><Next onClick={() => setStep(5)} label="Take the quiz" /></div>
          </Card>
        </div>
      )}

      {step === 5 && (
        <Card title="Lesson quiz">
          {progress.quizWorksheetId && progress.quizScore !== null ? (
            <div>
              <div className={`inline-block rounded-lg px-3 py-1.5 text-sm font-semibold ${quizPassed ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                {progress.quizScore}/{progress.quizTotal} · {quizPassed ? "passed" : "not yet passed (need 4/5)"}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={`/worksheet/${progress.quizWorksheetId}`} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Review the quiz</Link>
                <button onClick={startQuiz} disabled={busyQuiz} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50">{busyQuiz ? "Building…" : "Take another quiz"}</button>
              </div>
            </div>
          ) : progress.quizWorksheetId ? (
            <div>
              <p className="text-sm text-slate-700">A quiz is in progress.</p>
              <Link href={`/worksheet/${progress.quizWorksheetId}`} className="mt-3 inline-block rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Resume quiz</Link>
            </div>
          ) : (
            <div>
              <p className="text-sm text-slate-700">Five problems on this skill from the bank at her current level, 15 minutes. 4 out of 5 passes the lesson and moves the skill toward Proficient; misses go into the review queue like any worksheet.</p>
              {done < total && <p className="mt-2 text-xs text-amber-800">{total - done} checkpoint/example question{total - done > 1 ? "s" : ""} still unanswered. You can take the quiz anyway.</p>}
              <button onClick={startQuiz} disabled={busyQuiz} className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50">{busyQuiz ? "Building…" : "Start the quiz"}</button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="mb-3 text-lg font-bold text-slate-800">{title}</h2>
      <div className="text-slate-800">{children}</div>
    </section>
  );
}

function Next({ onClick, label }: { onClick: () => void; label: string }) {
  return <button onClick={onClick} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">{label} →</button>;
}

function Question({ n, label = "Checkpoint", question, answer, hint, explanation, explanationLabel = "Why", saved, onAnswer, allowReveal = false }: {
  n: number; label?: string; question: string; answer: string; hint?: string; explanation: string; explanationLabel?: string;
  saved?: SavedAnswer; onAnswer: (answer: string, correct: boolean) => void; allowReveal?: boolean;
}) {
  const [typed, setTyped] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const answered = !!saved;
  const isCorrect = saved?.correct ?? false;
  const show = answered || revealed;
  const border = useMemo(() => (answered ? (isCorrect ? "border-green-300" : "border-red-300") : "border-slate-200"), [answered, isCorrect]);

  return (
    <div className={`rounded-xl border p-4 ${border}`}>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{label} {n}</div>
      <div className="leading-relaxed"><RichText text={question} /></div>
      <div className="mt-3">
        {!show ? (
          <>
            <AnswerInput value={typed} onChange={setTyped} onSubmit={(v) => onAnswer(v, answersMatch(v, answer))} autoFocus={false} />
            <div className="mt-2 flex gap-3 text-xs">
              {hint && <button onClick={() => setShowHint((s) => !s)} className="font-semibold text-blue-700 hover:underline">{showHint ? "Hide hint" : "Hint"}</button>}
              {allowReveal && <button onClick={() => { setRevealed(true); onAnswer("", false); }} className="text-slate-500 hover:underline">Show solution (counts as a miss)</button>}
            </div>
            {showHint && hint && <div className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-900"><RichText text={hint} /></div>}
          </>
        ) : (
          <>
            <div className={`inline-block rounded-lg px-3 py-1 text-sm font-semibold ${isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {isCorrect ? "Correct" : saved?.answer ? "Not quite" : "Revealed"} · answer: <MathTex tex={answer} />
              {saved?.answer && !isCorrect && <span className="ml-2 font-normal">(you: {saved.answer})</span>}
            </div>
            <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{explanationLabel}</div>
              <div className="leading-relaxed"><RichText text={explanation} /></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
