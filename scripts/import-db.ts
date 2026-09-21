// Loads data/export/db.json (from export-db.ts) into the database named by
// DATABASE_URL, in dependency order, upserting by primary key so it is safe to re-run.
// For a hosted Postgres target, generate the Postgres client first:
//   set DATABASE_URL=postgres://...   (and DIRECT_URL)
//   npx prisma db push --schema=prisma/schema.postgres.prisma
//   npx prisma generate --schema=prisma/schema.postgres.prisma
//   npx tsx scripts/import-db.ts
//   npx prisma generate            # restore the local SQLite client afterwards
import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const CHUNK = 500;

async function upsertAll<T extends { id?: string }>(name: string, rows: T[], fn: (row: T) => Promise<unknown>) {
  let n = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    await db.$transaction(rows.slice(i, i + CHUNK).map((r) => fn(r) as any));
    n = Math.min(i + CHUNK, rows.length);
    if (rows.length > CHUNK) process.stdout.write(`\r  ${name}: ${n}/${rows.length}`);
  }
  console.log(`${rows.length > CHUNK ? "\r" : "  "}${name}: ${rows.length} rows`);
}

function dates<T extends Record<string, any>>(row: T): T {
  const out: any = { ...row };
  for (const k of Object.keys(out)) if (typeof out[k] === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(out[k]) && /At$|lastPracticed|viewedAt|sentAt|startedAt|completedAt|lastLoginAt/.test(k)) out[k] = new Date(out[k]);
  return out;
}

async function main() {
  const file = join(process.cwd(), "data", "export", "db.json");
  const d = JSON.parse(readFileSync(file, "utf8"));
  console.log(`importing ${file} (exported ${d.exportedAt})`);

  await upsertAll("contests", d.contests, (r: any) => db.contest.upsert({ where: { id: r.id }, update: r, create: r }));
  await upsertAll("topics", d.topics, (r: any) => db.topic.upsert({ where: { id: r.id }, update: r, create: r }));
  await upsertAll("skills", d.skills, (r: any) => db.skill.upsert({ where: { id: r.id }, update: r, create: r }));
  await upsertAll("problems", d.problems.map(dates), (r: any) => db.problem.upsert({ where: { id: r.id }, update: r, create: r }));
  await upsertAll("problemTopics", d.problemTopics, (r: any) => db.problemTopic.upsert({ where: { problemId_topicId: { problemId: r.problemId, topicId: r.topicId } }, update: r, create: r }));
  await upsertAll("problemSkills", d.problemSkills, (r: any) => db.problemSkill.upsert({ where: { problemId_skillId: { problemId: r.problemId, skillId: r.skillId } }, update: r, create: r }));
  await upsertAll("solutions", d.solutions, (r: any) => db.solution.upsert({ where: { id: r.id }, update: r, create: r }));
  await upsertAll("users", d.users.map(dates), (r: any) => db.user.upsert({ where: { id: r.id }, update: r, create: r }));
  await upsertAll("studyPlans", d.studyPlans.map(dates), (r: any) => db.studyPlan.upsert({ where: { id: r.id }, update: r, create: r }));
  await upsertAll("skillMasteries", d.skillMasteries.map(dates), (r: any) => db.skillMastery.upsert({ where: { id: r.id }, update: r, create: r }));
  await upsertAll("worksheets", d.worksheets.map(dates), (r: any) => db.worksheet.upsert({ where: { id: r.id }, update: r, create: r }));
  await upsertAll("studySessions", d.studySessions.map(dates), (r: any) => db.studySession.upsert({ where: { id: r.id }, update: r, create: r }));
  await upsertAll("attempts", d.attempts.map(dates), (r: any) => db.attempt.upsert({ where: { id: r.id }, update: r, create: r }));
  await upsertAll("reviewItems", d.reviewItems.map(dates), (r: any) => db.reviewItem.upsert({ where: { id: r.id }, update: r, create: r }));
  await upsertAll("lessonProgress", d.lessonProgress.map(dates), (r: any) => db.lessonProgress.upsert({ where: { id: r.id }, update: r, create: r }));
  await upsertAll("lessonViews", d.lessonViews.map(dates), (r: any) => db.lessonView.upsert({ where: { id: r.id }, update: r, create: r }));
  await upsertAll("mockExams", d.mockExams.map(dates), (r: any) => db.mockExam.upsert({ where: { id: r.id }, update: r, create: r }));
  console.log("done");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
