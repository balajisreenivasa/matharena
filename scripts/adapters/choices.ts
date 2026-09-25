// Pull the five AMC answer choices out of a statement that embeds them as LaTeX.
//
// Transcriptions vary: "$\textbf{(A)}\ 4 \qquad \textbf{(B)}\ 5$", "\textbf{(A) } 4",
// "\mathrm{(A)}\ 4", "\text{(A) } 4", "(\mathrm {A}) \ 4", "\textbf{(A)}\hspace{.05in}4",
// and choices may sit in one $...$ run or several. We take the last A..E marker set
// that appears in order, keep the stem before (A), and clean each value into inline
// TeX that KaTeX renders (see normalizeChoiceTex).
import { normalize } from "../../src/lib/answers";

const MARK = /\\(?:textbf|mathrm|text|mathbf|bf|rm|textrm)\s*\{\s*\(?\s*([A-E])\s*\)?\s*\}\)?|\(\s*\\(?:mathrm|textbf|text|mathbf|bf|rm)\s*\{\s*([A-E])\s*\}\s*\)|(?<![A-Za-z\\{])\(([A-E])\)(?=\s*[\\~\s]|\s*[0-9$])/g;

export type Split = { stem: string; choices: Record<string, string> };

function cleanValue(raw: string): string {
  return raw
    // Line breaks first: "\\ " would otherwise lose one backslash to the "\ " rule.
    .replace(/\\\\(\[[^\]]*\])?/g, " ")
    .replace(/\\qquad|\\quad|\\indent|\\noindent|\\hfill|\\hspace\*?\{[^}]*\}|\\hskip\s*[\d.]+\s*[a-z]+|\\ |\\,|\\;|\\:|\\!|~/g, " ")
    .replace(/\$\s*\$/g, " ")
    .replace(/^\s*\}+/, "")
    .replace(/\\textbf\{\s*\}/g, "")
    // A wrapper left open by the marker split: "\mathrm{\textbf{(A)} \ }226 \mathrm{"
    .replace(/\\(?:mathrm|textbf|text|mathbf|bf)\s*\{?\s*$/, "")
    .replace(/^(\s*\$)+/, "")
    .replace(/(\$\s*)+$/, "")
    .replace(/^\s*[\\]\s+/, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s*\\+$/, "")
    .replace(/\s*\}+$/, (m) => m) // placeholder: stray closers are removed just below
    .replace(/\}+$/, (m, off: number, s: string) => {
      // "\mathrm{\textbf{(A)}\ -50 }": the closer belongs to a wrapper the split removed.
      const opens = (s.slice(0, off).match(/\{/g) ?? []).length;
      const closes = (s.slice(0, off).match(/\}/g) ?? []).length;
      return m.slice(0, Math.max(0, opens - closes));
    })
    .trim();
}

export function splitChoices(problem: string): Split | null {
  const marks: { letter: string; start: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  MARK.lastIndex = 0;
  while ((m = MARK.exec(problem))) marks.push({ letter: m[1] ?? m[2] ?? m[3], start: m.index, end: m.index + m[0].length });
  if (marks.length < 5) return null;
  // Last in-order A..E run (prose may mention "(A)" earlier).
  let run: typeof marks | null = null;
  for (let i = marks.length - 5; i >= 0; i--) {
    if (marks.slice(i, i + 5).map((x) => x.letter).join("") === "ABCDE") { run = marks.slice(i, i + 5); break; }
  }
  if (!run) return null;
  let stem = problem.slice(0, run[0].start);
  // A wrapper the marker sat inside ("$\mathrm{\textbf{(A)}...") leaves its opener behind.
  stem = stem.replace(/\\(?:mathrm|textbf|text|mathbf|bf|rm)\s*\{?\s*$/, "");
  // The choices usually live in their own $...$; drop a dangling opener.
  const dollars = (stem.match(/(?<!\\)\$/g) ?? []).length;
  if (dollars % 2 === 1) stem = stem.replace(/\$\s*$/, "");
  stem = stem.replace(/(\\qquad|\\quad|\\\\|\\newline|\\hfill|\\hspace\{[^}]*\})\s*$/, "").trim();
  const choices: Record<string, string> = {};
  for (let i = 0; i < 5; i++) {
    const raw = problem.slice(run[i].end, i < 4 ? run[i + 1].start : undefined);
    choices[run[i].letter] = cleanValue(raw);
  }
  if (Object.values(choices).some((c) => !c)) return null;
  // The tail after (E) must be short: a choice, not a paragraph of text.
  if (choices.E.length > 160) return null;
  return { stem, choices };
}

// Map a free-form answer onto a choice letter: "(B)", "\textbf{(B)}", "B", or the
// value itself ("2148", "\frac{1}{3}").
export function answerLetter(answer: string, choices: Record<string, string>): string | null {
  const a = answer.trim();
  const direct = /^\\?(?:textbf|mathrm|text|mathbf)?\s*\{?\s*\(\s*([A-E])\s*\)\s*\}?/.exec(a) ?? /^\(?([A-E])\)?$/.exec(a);
  if (direct) return direct[1];
  const inner = /\(\s*([A-E])\s*\)/.exec(a);
  if (inner && a.length < 40) return inner[1];
  // "\text{ 1022}" and "1022" are the same choice.
  const flat = (s: string) => normalize(s).replace(/\\text\s*\{([^{}]*)\}/g, "$1").replace(/[\s{}]+/g, "");
  const want = flat(a);
  if (!want) return null;
  const hits = Object.entries(choices).filter(([, v]) => flat(v) === want);
  if (hits.length === 1) return hits[0][0];
  // Numeric equality as a last resort ("1.5" vs "3/2" is handled by the grader).
  const num = (s: string) => { const n = Number(s.replace(/[^0-9.-]/g, "")); return /^[-\d.,\s]+$/.test(s) && Number.isFinite(n) ? n : null; };
  const wn = num(want);
  if (wn !== null) {
    const nh = Object.entries(choices).filter(([, v]) => num(normalize(v)) === wn);
    if (nh.length === 1) return nh[0][0];
  }
  return null;
}
