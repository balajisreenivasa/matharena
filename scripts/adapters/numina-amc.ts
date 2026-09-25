// Importer for the AMC/AIME slice of NuminaMath-1.5 (AI-MO, Apache 2.0).
// https://huggingface.co/datasets/AI-MO/NuminaMath-1.5
//
// Why: the MATH + AIME bank is free-response only. Numina's `amc_aime` source rows are
// transcriptions of real AMC 8/10/12 (and AIME) problems, many with the five answer
// choices embedded in the statement as "$\textbf{(A)}\ 4 \qquad \textbf{(B)}\ ...$".
// We split those out into real A-E choices so in-app mocks can be multiple choice.
//
// Rows are fetched through the datasets-server /filter API (source = 'amc_aime'),
// cached under data/vendor/numina-amc.json. The underlying problems remain MAA's;
// this is for personal practice, same as reading them on the AoPS wiki.
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { localDifficulty, globalDifficulty } from "../contests";
import { substituteFigures } from "./figures";
import { splitChoices, answerLetter } from "./choices";

const REPO = "AI-MO/NuminaMath-1.5";
const VENDOR = join(process.cwd(), "data", "vendor");
const CACHE = join(VENDOR, "numina-amc.json");
const PAGE = 100;

export const NUMINA_CONTESTS = [
  { id: "AMC_MC", name: "AMC (Numina)", level: "middle", answerFormat: "multiple_choice", numProblems: 25, hardnessBase: 3 },
  { id: "AMC_FR", name: "AMC/AIME (Numina)", level: "high", answerFormat: "short_answer", numProblems: 25, hardnessBase: 4 },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getJson(url: string, attempts = 12): Promise<any> {
  let lastErr: any;
  for (let a = 1; a <= attempts; a++) {
    try {
      const res = await fetch(url);
      if (res.status === 429 || res.status === 500 || res.status === 503) {
        const body = await res.text().catch(() => "");
        const wait = res.status === 429 ? Math.min(60_000, 10_000 * a) : 15_000;
        console.warn(`    ${res.status} ${body.slice(0, 80)} — waiting ${Math.round(wait / 1000)}s`);
        await sleep(wait);
        continue;
      }
      if (!res.ok) throw new Error(`${res.status} for ${url}`);
      return await res.json();
    } catch (e: any) {
      lastErr = e;
      await sleep(3000 * a);
    }
  }
  throw lastErr ?? new Error(`gave up: ${url}`);
}

async function fetchRows(): Promise<any[]> {
  if (!existsSync(VENDOR)) mkdirSync(VENDOR, { recursive: true });
  if (existsSync(CACHE)) return JSON.parse(readFileSync(CACHE, "utf8"));
  const where = encodeURIComponent(`"source"='amc_aime'`);
  const base = `https://datasets-server.huggingface.co/filter?dataset=${encodeURIComponent(REPO)}&config=default&split=train&where=${where}`;
  const first = await getJson(`${base}&offset=0&length=${PAGE}`);
  const total: number = first.num_rows_total ?? 0;
  const rows: any[] = first.rows.map((r: any) => r.row);
  console.log(`    ${total} amc_aime rows`);
  for (let offset = PAGE; offset < total; offset += PAGE) {
    await sleep(400);
    const page = await getJson(`${base}&offset=${offset}&length=${PAGE}`);
    rows.push(...page.rows.map((r: any) => r.row));
    if (offset % 1000 === 0) console.log(`    ${rows.length}/${total}`);
  }
  writeFileSync(CACHE, JSON.stringify(rows));
  return rows;
}

// Choice splitting and answer-letter mapping live in ./choices.ts, shared with the
// MATH adapter (its AMC rows embed the five choices the same way).

// Guess the year/contest/number from the solution or problem text when present, e.g.
// "2019 AMC 10B #7". Optional; used only for attribution.
function attribution(text: string): { year: number; contest: string; number: number } | null {
  const m = /((?:19|20)\d\d)\s*AMC\s*(8|10|12)\s*([AB])?\s*(?:Problems?\/Problem\s*|#|Problem\s*)(\d{1,2})/i.exec(text);
  if (!m) return null;
  return { year: parseInt(m[1], 10), contest: `AMC${m[2]}${m[3] ?? ""}`.toUpperCase(), number: parseInt(m[4], 10) };
}

export type NuminaStats = { imported: number; mc: number; skippedAsy: number; skippedNoAnswer: number; skippedDup: number };

export async function importNuminaAmc(): Promise<{ problems: any[]; stats: NuminaStats }> {
  const rows = await fetchRows();
  const problems: any[] = [];
  const stats: NuminaStats = { imported: 0, mc: 0, skippedAsy: 0, skippedNoAnswer: 0, skippedDup: 0 };
  const seen = new Set<string>();
  // Numbering must be stable across re-imports (`number` is part of the seed key that
  // a student's attempts hang off). Rows the first release imported keep their
  // sequential numbers; rows that became importable later (rendered figures, better
  // choice splitting) are numbered after them. See legacyEligible().
  const legacy: any[] = [];
  const added: any[] = [];
  for (const row of rows) {
    const answer: string = String(row.answer ?? "").trim();
    const original = String(row.problem ?? "").trim();
    if (!original) continue;
    const isLegacy = legacyEligible(original, answer, seen);
    // Figures are rendered by scripts/render-diagrams.ts; a statement whose figure is
    // missing is unsolvable and skipped, a missing solution figure is just dropped.
    const fig = substituteFigures(original, { required: true });
    if (fig.missing) { stats.skippedAsy++; continue; }
    const problem: string = fig.text;
    const solution: string = substituteFigures(String(row.solution ?? "").trim(), { required: false }).text;
    const key = original.replace(/\s+/g, " ").slice(0, 160).toLowerCase();
    if (seen.has(key)) { stats.skippedDup++; continue; }
    seen.add(key);

    const split = splitChoices(problem);
    const letter = split ? answerLetter(answer, split.choices) : null;
    const isMC = !!split && !!letter;
    if (!isMC && (!answer || answer.length > 60 || /^(proof|none)$/i.test(answer))) { stats.skippedNoAnswer++; continue; }

    // Difficulty: Numina has no level. Use the attribution number when we can find it,
    // otherwise a middle band; the mastery model self-corrects from results.
    const attr = attribution(solution) ?? attribution(problem);
    const number = attr?.number ?? 13;
    const base = attr?.contest?.startsWith("AMC8") ? 2 : attr?.contest?.startsWith("AMC12") ? 4 : 3;
    (isLegacy ? legacy : added).push({
      contestId: isMC ? "AMC_MC" : "AMC_FR",
      year: attr?.year ?? 0,
      round: attr?.contest ?? null,
      number: 0, // assigned below
      statement: isMC ? split!.stem : problem,
      choices: isMC ? split!.choices : null,
      answer: isMC ? letter : answer,
      hasDiagram: fig.paths.length > 0,
      diagramUrl: null,
      diagramPath: fig.paths[0] ?? null,
      localDifficulty: localDifficulty(number, 25),
      globalDifficulty: globalDifficulty(number, 25, base),
      source: "NuminaMath-1.5 amc_aime (AI-MO, Apache 2.0; problems © MAA)",
      sourceUrl: `https://huggingface.co/datasets/${REPO}`,
      topics: [], // tagged by scripts/classify.ts
      solutions: solution ? [solution] : [],
    });
    stats.imported++;
    if (isMC) stats.mc++;
  }
  let n = 0;
  for (const p of [...legacy, ...added]) { p.number = ++n; problems.push(p); }
  return { problems, stats };
}

// The first release's eligibility rules, kept verbatim so those rows keep their numbers.
// (Must be called before the row is added to `seen`; it does not mutate it.)
function legacyEligible(problem: string, answer: string, seen: Set<string>): boolean {
  if (/\[asy\]/i.test(problem)) return false;
  const key = problem.replace(/\s+/g, " ").slice(0, 160).toLowerCase();
  if (seen.has(key)) return false;
  const re = /\\(?:textbf|mathrm|text|mathbf)\s*\{\s*\(?([A-E])\)?\s*\}\)?/g;
  const letters: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(problem))) letters.push(m[1]);
  let oldMC = false;
  if (letters.length >= 5 && letters.slice(-5).join("") === "ABCDE") {
    const lm = /\(?\b([A-E])\b\)?/.exec(answer.replace(/\\(?:textbf|mathrm|text|mathbf)\s*\{/g, "").replace(/[{}]/g, ""));
    oldMC = !!lm;
  }
  return oldMC || !!(answer && answer.length <= 60 && !/^(proof|none)$/i.test(answer));
}
