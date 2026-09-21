import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { SKILLS, TOPIC_META, tagSkills, type TopicSlug } from "../src/curriculum/skills";

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

  await tagSkillsForAllProblems();

  // Drop contests left with no problems (e.g. from a previous dataset) so the
  // dashboard's contest count reflects what's actually loaded.
  const empty = await db.contest.findMany({ where: { problems: { none: {} } }, select: { id: true } });
  if (empty.length) {
    await db.contest.deleteMany({ where: { id: { in: empty.map((c) => c.id) } } });
    console.log(`Pruned ${empty.length} contest(s) with no problems: ${empty.map((c) => c.id).join(", ")}`);
  }

  const n = await db.problem.count();
  const withoutAnswer = await db.problem.count({ where: { answer: "" } });
  console.log(`Done. ${n} problems seeded.`);
  if (withoutAnswer) console.warn(`!! ${withoutAnswer} have an empty answer and cannot be graded.`);
}

// Attach fine-grained AMC 10 skills (src/curriculum/skills.ts) to every problem via
// keyword matching, restricted to the problem's topic(s). Idempotent: rebuilds the
// whole ProblemSkill table. Also exported for `npm run tag` to re-run on its own.
export async function tagSkillsForAllProblems() {
  for (const s of SKILLS) {
    await db.skill.upsert({
      where: { id: s.id },
      update: { name: s.name, topicSlug: s.topicSlug, order: s.order },
      create: { id: s.id, name: s.name, topicSlug: s.topicSlug, order: s.order },
    });
  }
  await db.problemSkill.deleteMany({});

  const problems = await db.problem.findMany({
    select: { id: true, statement: true, round: true, topics: { select: { topic: { select: { slug: true } } } } },
  });
  const links: { problemId: string; skillId: string }[] = [];
  const perSkill: Record<string, number> = {};
  let untagged = 0;
  for (const p of problems) {
    const slugs = new Set<TopicSlug>();
    for (const t of p.topics) if (t.topic.slug in TOPIC_META) slugs.add(t.topic.slug as TopicSlug);
    // MATH's prealgebra subject is a grab bag, so let its rows match NT/counting skills too.
    for (const [slug, meta] of Object.entries(TOPIC_META)) if (p.round && meta.mathRounds.includes(p.round)) slugs.add(slug as TopicSlug);
    const ids = tagSkills(p.statement, [...slugs]);
    if (!ids.length) untagged++;
    for (const skillId of ids) {
      links.push({ problemId: p.id, skillId });
      perSkill[skillId] = (perSkill[skillId] ?? 0) + 1;
    }
  }
  for (let i = 0; i < links.length; i += 1000) {
    await db.problemSkill.createMany({ data: links.slice(i, i + 1000) });
  }
  console.log(`Skills: ${links.length} tags on ${problems.length - untagged} problems (${untagged} matched no skill; they still serve via topic).`);
  const thin = SKILLS.filter((s) => (perSkill[s.id] ?? 0) < 40).map((s) => `${s.id}=${perSkill[s.id] ?? 0}`);
  if (thin.length) console.warn(`  thin skills (<40 problems): ${thin.join(", ")}`);
}

if (process.argv[1] && /seed\.ts$/.test(process.argv[1])) {
  main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
}
