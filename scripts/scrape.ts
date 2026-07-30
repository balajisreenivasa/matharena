// Scrape orchestrator. Reads scripts/contests.ts, pulls problems via the AoPS adapter,
// caches raw results, and writes data/problems.raw.json. Runs on your machine.
// Usage:
//   npm run scrape                       # everything in contests.ts
//   npm run scrape -- AMC10A 2024        # a single contest + year
//   CONCURRENCY=8 npm run scrape         # tune politeness vs speed (default 4)
import "dotenv/config";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CONTESTS, localDifficulty, globalDifficulty } from "./contests";
import { fetchContest, fetchSolutions } from "./adapters/aops-amc";

const CACHE = join(process.cwd(), "scripts", "cache");
const CONCURRENCY = Math.max(1, parseInt(process.env.CONCURRENCY ?? "4", 10));
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const TOPICS = [
  { name: "Algebra", slug: "algebra", color: "#2563eb" },
  { name: "Geometry", slug: "geometry", color: "#059669" },
  { name: "Number Theory", slug: "number-theory", color: "#d97706" },
  { name: "Counting & Probability", slug: "counting-probability", color: "#7c3aed" },
];

// Run tasks with a bounded worker pool, preserving input order in the output.
async function pool<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}

// AoPS will rate-limit a full-archive run. Back off instead of losing the year.
async function withRetry<R>(label: string, fn: () => Promise<R>, attempts = 4): Promise<R> {
  let lastErr: any;
  for (let a = 1; a <= attempts; a++) {
    try {
      return await fn();
    } catch (e: any) {
      lastErr = e;
      const status = /^(\d{3})/.exec(e?.message ?? "")?.[1];
      // A genuine 404 (year doesn't exist) is not worth retrying.
      if (status === "404") throw e;
      const wait = 1000 * 2 ** (a - 1);
      console.warn(`  retry ${a}/${attempts} ${label} in ${wait}ms: ${e.message}`);
      await sleep(wait);
    }
  }
  throw lastErr;
}

async function main() {
  if (!existsSync(CACHE)) mkdirSync(CACHE, { recursive: true });
  const [argContest, argYear] = process.argv.slice(2);

  let targets = CONTESTS;
  if (argContest) {
    targets = CONTESTS.filter((c) => c.id === argContest);
    if (!targets.length) {
      console.error(`Unknown contest "${argContest}". Known ids: ${CONTESTS.map((c) => c.id).join(", ")}`);
      process.exit(1);
    }
  }

  const allProblems: any[] = [];
  const contestsOut: any[] = [];

  for (const c of targets) {
    contestsOut.push({ id: c.id, name: c.name, level: c.level, answerFormat: c.answerFormat, numProblems: c.numProblems, hardnessBase: c.hardnessBase });
    const years = argYear ? [parseInt(argYear, 10)] : c.years;
    for (const year of years) {
      const cacheFile = join(CACHE, `${c.id}_${year}.json`);
      let problems: any[];
      if (existsSync(cacheFile)) {
        problems = JSON.parse(readFileSync(cacheFile, "utf8"));
        console.log(`cache  ${c.id} ${year} (${problems.length})`);
      } else {
        try {
          problems = await withRetry(`${c.id} ${year}`, () => fetchContest(c.id, year));
          // Pull solutions concurrently but politely.
          await pool(problems, CONCURRENCY, async (p) => {
            p.solutions = await withRetry(
              `${c.id} ${year} #${p.number} solutions`,
              () => fetchSolutions(c.id, year, p.number)
            ).catch(() => []);
            await sleep(250);
          });
          writeFileSync(cacheFile, JSON.stringify(problems, null, 2));
          console.log(`scrape ${c.id} ${year} (${problems.length})`);
        } catch (e: any) {
          console.warn(`skip   ${c.id} ${year}: ${e.message}`);
          continue;
        }
        await sleep(500);
      }
      for (const p of problems) {
        allProblems.push({
          ...p,
          localDifficulty: localDifficulty(p.number, c.numProblems),
          globalDifficulty: globalDifficulty(p.number, c.numProblems, c.hardnessBase),
          topics: [], // filled by classify.ts
        });
      }
    }
  }

  // Validation gate. A problem with no answer can never be graded, and a problem with
  // no statement is a parse failure — neither should reach the database silently.
  const isBad = (p: any) =>
    !p.answer || !String(p.answer).trim() ||
    !p.statement || p.statement.length < 10 ||
    (p.choices === null && !/^\d+$/.test(String(p.answer)));
  const good = allProblems.filter((p) => !isBad(p));
  const bad = allProblems.filter(isBad);

  const dataDir = join(process.cwd(), "data");
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

  const out = { contests: contestsOut, topics: TOPICS, problems: good };
  writeFileSync(join(dataDir, "problems.raw.json"), JSON.stringify(out, null, 2));

  if (bad.length) {
    writeFileSync(join(dataDir, "problems.rejected.json"), JSON.stringify(bad, null, 2));
    const byContest = bad.reduce((m: Record<string, number>, p) => {
      const k = `${p.contestId} ${p.year}`;
      m[k] = (m[k] ?? 0) + 1;
      return m;
    }, {});
    console.warn(`\n!! Rejected ${bad.length} problems (missing answer or unparsed statement).`);
    console.warn(`   Written to data/problems.rejected.json for review. Worst offenders:`);
    Object.entries(byContest)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([k, n]) => console.warn(`     ${k}: ${n}`));
    console.warn(`   A whole contest-year here usually means its answer-key page has a different URL.`);
  }

  console.log(`\nScraped ${good.length} usable problems -> data/problems.raw.json`);
  console.log(`Next: npm run classify  (adds topics), then npm run seed`);
}

main().catch((e) => { console.error(e); process.exit(1); });
