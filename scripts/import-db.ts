// Loads data/export/db.json (from export-db.ts) into the database named by
// DATABASE_URL. Bulk tables (problems, tags, solutions) use createMany with
// skipDuplicates, so a re-run only adds what's missing; per-student tables are
// upserted so progress is refreshed. Dependency order is respected.
// For a hosted Postgres target, generate the Postgres client first (see docs/DEPLOY.md):
//   set DATABASE_URL / DIRECT_URL, `prisma db push --schema=prisma/schema.postgres.prisma`,
//   `prisma generate --schema=prisma/schema.postgres.local.prisma` (side output), then
//   PRISMA_CLIENT_PATH=<abs path to node_modules/.prisma/client-pg> npx tsx scripts/import-db.ts
import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// PRISMA_CLIENT_PATH lets a Postgres client generated to a side directory be used
// without overwriting the local SQLite client.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require(process.env.PRISMA_CLIENT_PATH ?? "@prisma/client") as typeof import("@prisma/client");

const db = new PrismaClient();
const BULK = 1000;
const isSqlite = /^file:/.test(process.env.DATABASE_URL ?? "");

function dates<T extends Record<string, any>>(row: T): T {
  const out: any = { ...row };
  for (const k of Object.keys(out)) if (typeof out[k] === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(out[k]) && /At$|lastPracticed|viewedAt|sentAt|startedAt|completedAt|lastLoginAt/.test(k)) out[k] = new Date(out[k]);
  return out;
}

async function bulk(name: string, rows: any[], model: { createMany: (args: any) => Promise<{ count: number }> }) {
  let added = 0;
  for (let i = 0; i < rows.length; i += BULK) {
    const r = await model.createMany({ data: rows.slice(i, i + BULK), ...(isSqlite ? {} : { skipDuplicates: true }) });
    added += r.count;
    process.stdout.write(`\r  ${name}: ${Math.min(i + BULK, rows.length)}/${rows.length} (${added} new)`);
  }
  console.log(`\r  ${name}: ${rows.length} rows, ${added} new`);
}

async function upserts(name: string, rows: any[], fn: (row: any) => any) {
  for (let i = 0; i < rows.length; i += 200) await db.$transaction(rows.slice(i, i + 200).map(fn));
  console.log(`  ${name}: ${rows.length} rows upserted`);
}

async function main() {
  const file = process.env.IMPORT_FILE ? join(process.cwd(), process.env.IMPORT_FILE) : join(process.cwd(), "data", "export", "db.json");
  const d = JSON.parse(readFileSync(file, "utf8"));
  console.log(`importing ${file} (exported ${d.exportedAt})`);

  await bulk("contests", d.contests, db.contest);
  await bulk("topics", d.topics, db.topic);
  await bulk("skills", d.skills, db.skill);
  await bulk("problems", d.problems.map(dates), db.problem);
  await bulk("problemTopics", d.problemTopics, db.problemTopic);
  await bulk("problemSkills", d.problemSkills, db.problemSkill);
  await bulk("solutions", d.solutions, db.solution);

  await upserts("users", d.users.map(dates), (r) => db.user.upsert({ where: { id: r.id }, update: r, create: r }));
  await upserts("studyPlans", d.studyPlans.map(dates), (r) => db.studyPlan.upsert({ where: { id: r.id }, update: r, create: r }));
  await upserts("skillMasteries", d.skillMasteries.map(dates), (r) => db.skillMastery.upsert({ where: { id: r.id }, update: r, create: r }));
  await upserts("worksheets", d.worksheets.map(dates), (r) => db.worksheet.upsert({ where: { id: r.id }, update: r, create: r }));
  await upserts("studySessions", d.studySessions.map(dates), (r) => db.studySession.upsert({ where: { id: r.id }, update: r, create: r }));
  await upserts("attempts", d.attempts.map(dates), (r) => db.attempt.upsert({ where: { id: r.id }, update: r, create: r }));
  await upserts("reviewItems", d.reviewItems.map(dates), (r) => db.reviewItem.upsert({ where: { id: r.id }, update: r, create: r }));
  await upserts("lessonProgress", d.lessonProgress.map(dates), (r) => db.lessonProgress.upsert({ where: { id: r.id }, update: r, create: r }));
  await upserts("lessonViews", d.lessonViews.map(dates), (r) => db.lessonView.upsert({ where: { id: r.id }, update: r, create: r }));
  await upserts("mockExams", d.mockExams.map(dates), (r) => db.mockExam.upsert({ where: { id: r.id }, update: r, create: r }));
  console.log("done");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
