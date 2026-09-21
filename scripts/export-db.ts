// Dumps every table of the current database to data/export/db.json so it can be
// loaded into another database (local SQLite -> hosted Postgres) with import-db.ts.
// Run with the client generated for the SOURCE database:
//   npx prisma generate && npx tsx scripts/export-db.ts
import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const out = {
    exportedAt: new Date().toISOString(),
    contests: await db.contest.findMany(),
    topics: await db.topic.findMany(),
    skills: await db.skill.findMany(),
    problems: await db.problem.findMany(),
    problemTopics: await db.problemTopic.findMany(),
    problemSkills: await db.problemSkill.findMany(),
    solutions: await db.solution.findMany(),
    users: await db.user.findMany(),
    studyPlans: await db.studyPlan.findMany(),
    skillMasteries: await db.skillMastery.findMany(),
    worksheets: await db.worksheet.findMany(),
    studySessions: await db.studySession.findMany(),
    attempts: await db.attempt.findMany(),
    reviewItems: await db.reviewItem.findMany(),
    lessonProgress: await db.lessonProgress.findMany(),
    lessonViews: await db.lessonView.findMany(),
    mockExams: await db.mockExam.findMany(),
  };
  const dir = join(process.cwd(), "data", "export");
  mkdirSync(dir, { recursive: true });
  const file = join(dir, "db.json");
  writeFileSync(file, JSON.stringify(out));
  const counts = Object.entries(out).filter(([, v]) => Array.isArray(v)).map(([k, v]) => `${k}=${(v as unknown[]).length}`).join(" ");
  console.log(`wrote ${file}\n${counts}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
