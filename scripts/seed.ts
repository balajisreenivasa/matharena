import "dotenv/config";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { SKILLS, TOPIC_META, tagSkills, type TopicSlug } from "../src/curriculum/skills";
import { SUBSKILLS, tagSubSkills } from "../src/curriculum/subskills";

// PRISMA_CLIENT_PATH points at a Postgres client generated to a side directory so the
// same seed can refresh the hosted bank in place (docs/DEPLOY.md, "When the problem
// bank changes") without overwriting the local SQLite client.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require(process.env.PRISMA_CLIENT_PATH ?? "@prisma/client") as typeof import("@prisma/client");

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

  // Non-destructive reload: problems are upserted on their (contest, year, round, number)
  // key so a re-seed never cascades away a student's attempts and review queue.
  // Topics/solutions are rebuilt per problem.
  const existing = await db.problem.findMany({ select: { id: true, contestId: true, year: true, round: true, number: true } });
  const idByKey = new Map(existing.map((p) => [`${p.contestId}|${p.year}|${p.round ?? ""}|${p.number}`, p.id]));
  console.log(`${existing.length} problems already in the database; upserting.`);

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
      chunk.flatMap((p) => {
        const key = `${p.contestId}|${p.year}|${p.round ?? ""}|${p.number}`;
        const id = idByKey.get(key);
        const scalars = {
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
        };
        const topics = (p.topics ?? [])
          .filter((t: any) => topicByName[t.name])
          .map((t: any) => ({ topicId: topicByName[t.name], isPrimary: !!t.isPrimary, taggedBy: t.taggedBy ?? "ai", confidence: t.confidence ?? null }));
        const solutions = (p.solutions ?? []).map((content: string, idx: number) => ({ order: idx + 1, content }));
        if (id) {
          return [
            db.problemTopic.deleteMany({ where: { problemId: id } }),
            db.solution.deleteMany({ where: { problemId: id } }),
            db.problem.update({ where: { id }, data: { ...scalars, topics: { create: topics }, solutions: { create: solutions } } }),
          ];
        }
        return [
          db.problem.create({
            data: { contestId: p.contestId, year: p.year, round: p.round ?? null, number: p.number, ...scalars, topics: { create: topics }, solutions: { create: solutions } },
          }),
        ];
      })
    );
    console.log(`  seeded ${Math.min(i + CHUNK, rows.length)}/${rows.length}`);
  }

  // A row that changed key since the last import (e.g. a Numina problem that moved
  // from free-response to multiple choice once its choices could be split) leaves its
  // old copy behind. Drop such orphans unless a student has attempted them.
  const wanted = new Set(rows.map((p) => `${p.contestId}|${p.year}|${p.round ?? ""}|${p.number}`));
  const orphans = existing.filter((p) => known.has(p.contestId) && !wanted.has(`${p.contestId}|${p.year}|${p.round ?? ""}|${p.number}`)).map((p) => p.id);
  if (orphans.length) {
    const attempted = new Set((await db.attempt.findMany({ where: { problemId: { in: orphans } }, select: { problemId: true }, distinct: ["problemId"] })).map((a) => a.problemId));
    const drop = orphans.filter((id) => !attempted.has(id));
    await db.reviewItem.deleteMany({ where: { problemId: { in: drop } } });
    await db.problem.deleteMany({ where: { id: { in: drop } } });
    console.log(`Pruned ${drop.length} problem(s) no longer in the dataset (${attempted.size} kept because they were attempted).`);
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
  // Sub-skills share the table; order = parent order * 100 + position.
  for (const sub of SUBSKILLS) {
    const parent = SKILLS.find((s) => s.id === sub.parentId)!;
    const order = parent.order * 100 + SUBSKILLS.filter((x) => x.parentId === sub.parentId).indexOf(sub) + 1;
    await db.skill.upsert({
      where: { id: sub.id },
      update: { name: sub.name, topicSlug: parent.topicSlug, order },
      create: { id: sub.id, name: sub.name, topicSlug: parent.topicSlug, order },
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
    for (const subId of tagSubSkills(p.statement, ids, [...slugs])) {
      links.push({ problemId: p.id, skillId: subId });
      perSkill[subId] = (perSkill[subId] ?? 0) + 1;
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
