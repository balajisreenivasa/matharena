// CLI wrapper around src/lib/daily.ts (used by Windows Task Scheduler locally).
//   npm run daily                 # morning
//   npm run daily -- evening      # 8 PM parent summary (Sundays also the digest)
//   npm run daily -- digest
//   npm run daily -- morning --date 2026-09-22 --force
import "dotenv/config";
import { db } from "../src/lib/db";
import { runDaily, type Mode } from "../src/lib/daily";
import { todayStr } from "../src/lib/dates";

async function main() {
  const args = process.argv.slice(2);
  const mode = (args.find((a) => ["morning", "evening", "digest"].includes(a)) ?? "morning") as Mode;
  const di = args.indexOf("--date");
  const date = di !== -1 && /^\d{4}-\d{2}-\d{2}$/.test(args[di + 1] ?? "") ? args[di + 1] : todayStr();
  const force = args.includes("--force");
  console.log(`daily ${mode} for ${date}`);
  const report = await runDaily(mode, date, { force });
  const errors = report.results.filter((r) => r.result === "error");
  if (errors.length) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
