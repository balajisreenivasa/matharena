// Import orchestrator for openly-licensed datasets -> data/problems.raw.json.
// Usage:
//   npm run import            # everything
//   npm run import -- math    # just the MATH corpus
//   npm run import -- aime    # just the AIME set
//
// Downloads are cached under data/vendor/, so re-runs are offline and instant.
import "dotenv/config";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { importMath, MATH_CONTEST } from "./adapters/math-dataset";
import { importAime, AIME_CONTESTS } from "./adapters/aime-dataset";
import { importNuminaAmc, NUMINA_CONTESTS } from "./adapters/numina-amc";

const TOPICS = [
  { name: "Algebra", slug: "algebra", color: "#2563eb" },
  { name: "Geometry", slug: "geometry", color: "#059669" },
  { name: "Number Theory", slug: "number-theory", color: "#d97706" },
  { name: "Counting & Probability", slug: "counting-probability", color: "#7c3aed" },
  { name: "Precalculus", slug: "precalculus", color: "#db2777" },
];

async function main() {
  const which = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  const wantMath = !which.length || which.includes("math");
  const wantAime = !which.length || which.includes("aime");

  const contests: any[] = [];
  const problems: any[] = [];

  if (wantMath) {
    console.log("Importing MATH dataset (MIT)...");
    const { problems: p, stats } = await importMath();
    contests.push(MATH_CONTEST);
    problems.push(...p);
    console.log(`  ${stats.imported} imported`);
    console.log(`  ${stats.skippedAsy} skipped: statement depends on an [asy] figure this dataset ships as source, not an image`);
    console.log(`  ${stats.skippedNoAnswer} skipped: no \\boxed{} answer in the solution`);
  }

  if (wantAime) {
    console.log("Importing AIME 1983-2024 (CC0)...");
    const { problems: p, stats } = await importAime();
    contests.push(...AIME_CONTESTS);
    problems.push(...p);
    console.log(`  ${stats.imported} imported, ${stats.skipped} skipped (malformed or duplicate rows)`);
  }

  const wantNumina = !which.length || which.includes("numina");
  if (wantNumina) {
    console.log("Importing NuminaMath-1.5 amc_aime slice (Apache 2.0)...");
    try {
      const { problems: p, stats } = await importNuminaAmc();
      contests.push(...NUMINA_CONTESTS);
      problems.push(...p);
      console.log(`  ${stats.imported} imported (${stats.mc} multiple-choice), ${stats.skippedAsy} skipped for [asy] figures, ${stats.skippedNoAnswer} no usable answer, ${stats.skippedDup} duplicates`);
    } catch (e: any) {
      console.warn(`  Numina import failed (${e?.message ?? e}). Continuing with the other sources; re-run \`npm run import -- numina\` later.`);
    }
  }

  if (!problems.length) {
    console.error("Nothing imported. Known sources: math, aime, numina");
    process.exit(1);
  }

  const dataDir = join(process.cwd(), "data");
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  writeFileSync(
    join(dataDir, "problems.raw.json"),
    JSON.stringify({ contests, topics: TOPICS, problems }, null, 2)
  );

  const untagged = problems.filter((p) => !p.topics?.length).length;
  console.log(`\n${problems.length} problems -> data/problems.raw.json`);
  if (untagged) console.log(`${untagged} need topics: run \`npm run classify\`, then \`npm run seed\`.`);
  else console.log(`All problems already carry dataset topic labels. Next: npm run seed`);
}

main().catch((e) => { console.error(e); process.exit(1); });
