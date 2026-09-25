// Importer for the MATH dataset (Hendrycks et al.), MIT licensed.
// https://huggingface.co/datasets/EleutherAI/hendrycks_math
//
// Why this source: it ships its own topic labels (`type`) and a 5-level difficulty
// (`level`), so it needs no classification pass. Problems are free-response — the
// answer lives inside \boxed{...} in the solution, and there are no A-E choices.
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { substituteFigures } from "./figures";
import { splitChoices, answerLetter } from "./choices";

const REPO = "EleutherAI/hendrycks_math";
const VENDOR = join(process.cwd(), "data", "vendor", "math");
const PAGE = 100; // datasets-server caps `length` at 100

// MATH's seven subjects. The first four are exactly MathArena's canonical topics;
// pre/intermediate algebra fold into Algebra, and precalculus gets its own.
const SUBJECTS: { config: string; topic: string }[] = [
  { config: "algebra", topic: "Algebra" },
  { config: "counting_and_probability", topic: "Counting & Probability" },
  { config: "geometry", topic: "Geometry" },
  { config: "number_theory", topic: "Number Theory" },
  { config: "prealgebra", topic: "Algebra" },
  { config: "intermediate_algebra", topic: "Algebra" },
  { config: "precalculus", topic: "Precalculus" },
];

const SPLITS = ["train", "test"];

export const MATH_CONTEST = {
  id: "MATH",
  name: "MATH",
  level: "high",
  answerFormat: "short_answer",
  numProblems: 0, // a corpus, not a fixed-length exam
  hardnessBase: 5,
};

// Extract the contents of \boxed{...} with balanced-brace matching.
export function extractBoxed(solution: string): string | null {
  const marker = /\\boxed\s*\{/g;
  let m: RegExpExecArray | null;
  let last: string | null = null;
  while ((m = marker.exec(solution))) {
    let depth = 1;
    let i = m.index + m[0].length;
    let out = "";
    while (i < solution.length && depth > 0) {
      const ch = solution[i];
      if (ch === "\\") {
        out += solution.slice(i, i + 2);
        i += 2;
        continue;
      }
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) break;
      }
      out += ch;
      i++;
    }
    if (depth === 0) last = out.trim();
  }
  return last;
}

// "Level 3" -> 3. Some rows are "Level ?".
function parseLevel(level: string): number | null {
  const m = /Level\s*(\d)/.exec(level ?? "");
  return m ? parseInt(m[1], 10) : null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getJson(url: string, attempts = 6): Promise<any> {
  let lastErr: any;
  for (let a = 1; a <= attempts; a++) {
    try {
      const res = await fetch(url);
      if (res.status === 429) {
        // datasets-server rate-limits anonymous callers. Respect Retry-After when
        // present, otherwise back off hard — a short retry just burns the next slot.
        const retryAfter = parseInt(res.headers.get("retry-after") ?? "", 10);
        const wait = Number.isFinite(retryAfter) ? retryAfter * 1000 : Math.min(60_000, 10_000 * a);
        console.warn(`    rate limited, waiting ${Math.round(wait / 1000)}s...`);
        await sleep(wait);
        continue;
      }
      if (!res.ok) throw new Error(`${res.status} for ${url}`);
      return await res.json();
    } catch (e: any) {
      lastErr = e;
      await sleep(2000 * a);
    }
  }
  throw lastErr ?? new Error(`gave up after ${attempts} attempts: ${url}`);
}

// Pull one config/split via the datasets-server rows API, cached to disk so
// re-runs are offline and instant.
async function fetchSplit(config: string, split: string): Promise<any[]> {
  if (!existsSync(VENDOR)) mkdirSync(VENDOR, { recursive: true });
  const local = join(VENDOR, `${config}-${split}.json`);
  if (existsSync(local)) return JSON.parse(readFileSync(local, "utf8"));

  const base = `https://datasets-server.huggingface.co/rows?dataset=${encodeURIComponent(REPO)}&config=${config}&split=${split}`;
  const first = await getJson(`${base}&offset=0&length=${PAGE}`);
  const total: number = first.num_rows_total ?? 0;
  const rows: any[] = first.rows.map((r: any) => r.row);

  for (let offset = PAGE; offset < total; offset += PAGE) {
    await sleep(350); // stay under the anonymous rate limit
    const page = await getJson(`${base}&offset=${offset}&length=${PAGE}`);
    rows.push(...page.rows.map((r: any) => r.row));
  }
  if (rows.length !== total) {
    throw new Error(`${config}/${split}: got ${rows.length} rows, expected ${total}`);
  }
  writeFileSync(local, JSON.stringify(rows));
  console.log(`    ${config}/${split}: ${rows.length} rows`);
  return rows;
}

export type ImportStats = { imported: number; skippedAsy: number; skippedNoAnswer: number; withFigure: number; mc: number };

export async function importMath(): Promise<{ problems: any[]; stats: ImportStats }> {
  const problems: any[] = [];
  const stats: ImportStats = { imported: 0, skippedAsy: 0, skippedNoAnswer: 0, withFigure: 0, mc: 0 };
  // Numbering must be stable across re-imports: `number` is part of the seed key, and
  // a student's attempts point at the row behind it. Rows the first release imported
  // (no figure in the statement) keep their sequential numbers; rows that became
  // importable later (rendered figures) are numbered after them.
  const legacy: any[] = [];
  const added: any[] = [];

  for (const { config, topic } of SUBJECTS) {
    for (const split of SPLITS) {
      const rows = await fetchSplit(config, split);

      for (const row of rows) {
        let statement: string = (row.problem ?? "").trim();
        let solution: string = (row.solution ?? "").trim();
        if (!statement) continue;
        const isLegacy = !/\[asy\]/i.test(statement);

        // An [asy] block is an Asymptote figure shipped as source. scripts/render-diagrams.ts
        // renders them to public/diagrams; a statement whose figure did not render is
        // unsolvable and is skipped. A solution figure that is missing is just dropped.
        const fig = substituteFigures(statement, { required: true });
        if (fig.missing) {
          stats.skippedAsy++;
          continue;
        }
        statement = fig.text;
        solution = substituteFigures(solution, { required: false }).text;

        let answer = extractBoxed(solution);
        if (!answer) {
          stats.skippedNoAnswer++;
          continue;
        }

        // Rows transcribed from the AMC keep their five choices in the statement.
        // Split them out so the app can serve the problem as multiple choice.
        let choices: Record<string, string> | null = null;
        const split = splitChoices(statement);
        if (split) {
          const letter = answerLetter(answer, split.choices);
          if (letter) {
            choices = split.choices;
            answer = letter;
            statement = split.stem;
            stats.mc++;
          }
        }
        if (fig.paths.length) stats.withFigure++;

        const lvl = parseLevel(row.level) ?? 3;
        (isLegacy ? legacy : added).push({
          contestId: MATH_CONTEST.id,
          year: 0, // the dataset strips contest attribution
          round: config,
          number: 0, // assigned below
          statement,
          choices,
          answer,
          hasDiagram: fig.paths.length > 0,
          diagramUrl: null,
          diagramPath: fig.paths[0] ?? null,
          localDifficulty: Math.max(1, Math.min(4, Math.round((lvl * 4) / 5))),
          globalDifficulty: Math.max(1, Math.min(10, lvl * 2)),
          source: "MATH dataset (Hendrycks et al., MIT)",
          sourceUrl: `https://huggingface.co/datasets/${REPO}`,
          topics: [{ name: topic, isPrimary: true, confidence: 1, taggedBy: "dataset" }],
          solutions: solution ? [solution] : [],
        });
        stats.imported++;
      }
    }
  }
  let n = 0;
  for (const p of [...legacy, ...added]) { p.number = ++n; problems.push(p); }
  return { problems, stats };
}
