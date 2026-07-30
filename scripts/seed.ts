import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const db = new PrismaClient();

type Raw = {
  contests: { id: string; name: string; level: string; answerFormat: string; numProblems: number; hardnessBase: number }[];
  topics: { name: string; slug: string; color: string }[];
  problems: any[];
};

const CHUNK = 200;

async function main() {
  // Prefer the fully-built dataset if present, else fall back to the sample.
  const built = join(process.cwd(), "data", "problems.json");
  const sample = join(process.cwd(), "data", "sample-problems.json");
  const file = existsSync(built) ? built : sample;
  const data: Raw = JSON.parse(readFileSync(file, "utf8"));
  console.log(`Seeding from ${file}`);

  for (const c of data.contests) {
    await db.contest.upsert({ where: { id: c.id }, update: c, create: c });
  }
  const topicByName: Record<string, string> = {};
  for (const t of data.topics) {
    const rec = await db.topic.upsert({ where: { slug: t.slug }, update: t, create: t });
    topicByName[t.name] = rec.id;
  }

  // Idempotent reload of problems (cascades clear ProblemTopic/Solution/Attempt).
  await db.problem.deleteMany({});

  const known = new Set(data.contests.map((c) => c.id));
  const rows = data.problems.filter((p) => {
    if (!known.has(p.contestId)) {
      console.warn(`skip ${p.contestId} ${p.year} #${p.number}: contest not in this dataset`);
      return false;
    }
    return true;
  });

  // One nested create per problem, batched into transactions — far fewer round trips
  // than creating topics and solutions individually.
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    await db.$transaction(
      chunk.map((p) =>
        db.problem.create({
          data: {
            contestId: p.contestId,
            year: p.year,
            round: p.round ?? null,
            number: p.number,
            statement: p.statement,
            choices: p.choices ? JSON.stringify(p.choices) : null,
            answer: String(p.answer),
            hasDiagram: !!p.hasDiagram,
            diagramUrl: p.diagramUrl ?? null,
            diagramPath: p.diagramPath ?? null,
            localDifficulty: p.localDifficulty,
            globalDifficulty: p.globalDifficulty,
            source: p.source ?? "AoPS Wiki",
            sourceUrl: p.sourceUrl ?? "",
            topics: {
              create: (p.topics ?? [])
                .filter((t: any) => topicByName[t.name])
                .map((t: any) => ({
                  topicId: topicByName[t.name],
                  isPrimary: !!t.isPrimary,
                  taggedBy: t.taggedBy ?? "ai",
                  confidence: t.confidence ?? null,
                })),
            },
            solutions: {
              create: (p.solutions ?? []).map((content: string, idx: number) => ({
                order: idx + 1,
                content,
              })),
            },
          },
        })
      )
    );
    console.log(`  seeded ${Math.min(i + CHUNK, rows.length)}/${rows.length}`);
  }

  const n = await db.problem.count();
  const withoutAnswer = await db.problem.count({ where: { answer: "" } });
  console.log(`Done. ${n} problems seeded.`);
  if (withoutAnswer) console.warn(`!! ${withoutAnswer} have an empty answer and cannot be graded.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
