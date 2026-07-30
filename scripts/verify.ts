// Quick sanity checks on the seeded bank and the free-response answer matcher.
// Run: npx tsx scripts/verify.ts
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { answersMatch } from "../src/components/PracticeClient";
import { extractBoxed } from "./adapters/math-dataset";
import { parseCsv } from "./adapters/aime-dataset";

const db = new PrismaClient();

function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  got ${JSON.stringify(actual)} want ${JSON.stringify(expected)}`}`);
  return ok;
}

async function main() {
  let fails = 0;
  const not = (ok: boolean) => { if (!ok) fails++; };

  console.log("--- answersMatch ---");
  not(check("exact", answersMatch("42", "42"), true));
  not(check("whitespace", answersMatch("  42 ", "42"), true));
  not(check("leading zeros numeric", answersMatch("007", "7"), true));
  not(check("decimal forms", answersMatch("0.5", ".5"), true));
  not(check("dfrac vs frac", answersMatch("\\dfrac{1}{2}", "\\frac{1}{2}"), true));
  not(check("dollar delimiters", answersMatch("$42$", "42"), true));
  not(check("wrong answer", answersMatch("41", "42"), false));
  not(check("empty input", answersMatch("", "42"), false));
  not(check("case insensitive", answersMatch("X", "x"), true));

  console.log("--- extractBoxed ---");
  not(check("simple", extractBoxed("so \\boxed{42}."), "42"));
  not(check("nested braces", extractBoxed("\\boxed{\\frac{1}{2}}"), "\\frac{1}{2}"));
  not(check("last of several", extractBoxed("\\boxed{1} then \\boxed{2}"), "2"));
  not(check("none", extractBoxed("no answer here"), null));

  console.log("--- parseCsv ---");
  not(check("quoted comma", parseCsv('a,b\n"x,y",z')[1], ["x,y", "z"]));
  not(check("escaped quote", parseCsv('a\n"say ""hi"""')[1], ['say "hi"']));

  console.log("--- seeded data ---");
  const total = await db.problem.count();
  not(check("12302 problems", total, 12302));

  const aime = await db.problem.findFirst({
    where: { contestId: "AIME_I" },
    orderBy: [{ year: "desc" }, { number: "asc" }],
    include: { contest: true, topics: { include: { topic: true } } },
  });
  console.log(`latest AIME I: ${aime?.year} #${aime?.number} answer=${aime?.answer} topics=${aime?.topics.map((t) => t.topic.name).join("/")}`);
  not(check("AIME row exists", !!aime, true));
  not(check("AIME answer is an integer", /^\d{1,3}$/.test(aime?.answer ?? ""), true));
  not(check("AIME format", aime?.contest.answerFormat, "integer"));
  not(check("AIME keeps attribution", (aime?.year ?? 0) > 1982, true));

  // Every AIME answer must be in the real 0-999 range.
  const aimeAll = await db.problem.findMany({ where: { contestId: { startsWith: "AIME" } }, select: { answer: true } });
  const badRange = aimeAll.filter((a) => !/^\d{1,3}$/.test(a.answer));
  not(check("all AIME answers in 0-999", badRange.length, 0));

  const noAnswer = await db.problem.count({ where: { answer: "" } });
  not(check("no ungradable problems", noAnswer, 0));

  const noTopic = await db.problem.count({ where: { topics: { none: {} } } });
  not(check("every problem has a topic", noTopic, 0));

  const withChoices = await db.problem.count({ where: { NOT: { choices: null } } });
  console.log(`(multiple-choice problems in bank: ${withChoices})`);

  const byContest = await db.problem.groupBy({ by: ["contestId"], _count: true });
  byContest.forEach((c) => console.log(`  ${c.contestId}: ${c._count}`));

  console.log(fails ? `\n${fails} CHECK(S) FAILED` : "\nAll checks passed.");
  if (fails) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
