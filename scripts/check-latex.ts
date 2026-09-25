// Scan the question bank for LaTeX that KaTeX cannot render.
//   npx tsx scripts/check-latex.ts            # summary + samples
//   npx tsx scripts/check-latex.ts --strict   # exit 1 if any statement or choice fails
//
// Reads data/problems.json when present (what `npm run seed` loads), else the database.
// Part of `npm run verify` in --strict mode: a statement or answer choice that renders
// as raw TeX is a bug in src/lib/tex.ts or in an importer, never acceptable.
import "dotenv/config";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import katex from "katex";
import { splitMath, normalizeTex, normalizeChoiceTex, KATEX_MACROS, segmentsToPlain, type Segment } from "../src/lib/tex";

type Row = { where: string; statement: string; choices: Record<string, string> | null; answer: string; solutions: string[] };

async function loadRows(): Promise<Row[]> {
  const file = join(process.cwd(), "data", "problems.json");
  if (existsSync(file)) {
    const d = JSON.parse(readFileSync(file, "utf8"));
    return d.problems.map((p: any) => ({ where: `${p.contestId} ${p.round ?? ""} #${p.number}`, statement: p.statement, choices: p.choices ?? null, answer: String(p.answer), solutions: p.solutions ?? [] }));
  }
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  const ps = await db.problem.findMany({ select: { contestId: true, round: true, number: true, statement: true, choices: true, answer: true, solutions: { select: { content: true } } } });
  await db.$disconnect();
  return ps.map((p) => ({ where: `${p.contestId} ${p.round ?? ""} #${p.number}`, statement: p.statement, choices: p.choices ? JSON.parse(p.choices) : null, answer: p.answer, solutions: p.solutions.map((s) => s.content) }));
}

function tryTex(tex: string, display: boolean): string | null {
  try {
    katex.renderToString(normalizeTex(tex), { throwOnError: true, strict: "ignore", displayMode: display, macros: { ...KATEX_MACROS } });
    return null;
  } catch (e: any) {
    return String(e?.message ?? e);
  }
}

function walk(segs: Segment[], f: (s: Segment) => void) {
  for (const s of segs) { f(s); if ("style" in s) walk(s.children, f); }
}

export type Report = { counts: Record<string, number>; samples: Record<string, string[]>; statementErrors: number; choiceErrors: number; solutionErrors: number };

export function scan(rows: Row[]): Report {
  const counts: Record<string, number> = {};
  const samples: Record<string, string[]> = {};
  let statementErrors = 0, choiceErrors = 0, solutionErrors = 0;
  const add = (kind: string, where: string, sample: string) => {
    counts[kind] = (counts[kind] ?? 0) + 1;
    (samples[kind] ??= []);
    if (samples[kind].length < 4) samples[kind].push(`${where} :: ${sample.replace(/\n/g, "⏎").slice(0, 200)}`);
  };
  const errKey = (msg: string) => msg.replace(/KaTeX parse error: /, "").replace(/ at position.*$/s, "").replace(/: .*$/s, "").slice(0, 50);

  const checkText = (field: "statement" | "solution", text: string, where: string) => {
    const segs = splitMath(text);
    walk(segs, (s) => {
      if ("tex" in s) {
        const err = tryTex(s.tex, s.display);
        if (err) { add(`${field}:${errKey(err)}`, where, s.tex); field === "statement" ? statementErrors++ : solutionErrors++; }
      }
      if ("text" in s) {
        // Raw TeX leaking into prose.
        const raw = /\\(frac|sqrt|begin|end|textbf|text|left|right|cdot|times|mathrm|overline|angle|triangle)\b/.exec(s.text);
        if (raw) { add(`${field}:raw-tex-in-prose`, where, s.text.slice(Math.max(0, raw.index - 40), raw.index + 80)); field === "statement" ? statementErrors++ : solutionErrors++; }
        if (/\[asy\]/i.test(s.text)) { add(`${field}:asy-left`, where, s.text); }
      }
    });
    // Informational: five parenthesised letters still inside the statement means the
    // splitter in scripts/adapters/choices.ts could not map the answer to a letter.
    if (field === "statement" && /\\(textbf|mathrm|text|mathbf)\s*\{\s*\(\s*A\s*\)/.test(text) && /\(\s*E\s*\)/.test(text)) add("statement:choices-embedded (info)", where, text);
  };

  for (const r of rows) {
    checkText("statement", r.statement, r.where);
    if (r.choices) {
      for (const [k, v] of Object.entries(r.choices)) {
        const err = tryTex(normalizeChoiceTex(v), false);
        if (err) { add(`choice:${errKey(err)}`, r.where, `${k}: ${v}`); choiceErrors++; }
        else if (/(^|[^\\])\b(text|textbf|dfrac|frac|sqrt|mathrm)\{/.test(v)) { add("choice:lost-backslash", r.where, `${k}: ${v}`); choiceErrors++; }
      }
    }
    for (const s of r.solutions) checkText("solution", s, r.where);
  }
  return { counts, samples, statementErrors, choiceErrors, solutionErrors };
}

async function main() {
  const strict = process.argv.includes("--strict");
  const rows = await loadRows();
  const rep = scan(rows);
  const sorted = Object.entries(rep.counts).sort((a, b) => b[1] - a[1]);
  for (const [k, n] of sorted) {
    console.log(`${String(n).padStart(6)}  ${k}`);
    if (!strict) for (const s of rep.samples[k]) console.log(`          - ${s}`);
  }
  console.log(`\n${rows.length} problems: ${rep.statementErrors} statement errors, ${rep.choiceErrors} choice errors, ${rep.solutionErrors} solution errors`);
  // A handful of source-level typos ("\-", "\noty", an unclosed \boxed{) are not worth
  // hand-patching a 19k-row corpus for; anything beyond that budget is a regression.
  const BUDGET = { statement: 20, choice: 10 };
  if (strict && (rep.statementErrors > BUDGET.statement || rep.choiceErrors > BUDGET.choice)) {
    console.error(`FAIL  statements/choices must render cleanly (budget: ${BUDGET.statement} statement / ${BUDGET.choice} choice source typos)`);
    process.exit(1);
  }
}

if (process.argv[1] && /check-latex\.ts$/.test(process.argv[1])) main().catch((e) => { console.error(e); process.exit(1); });
