// Quick sanity checks on the seeded bank and the free-response answer matcher.
// Run: npx tsx scripts/verify.ts
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { renderToStaticMarkup } from "react-dom/server";
import { answersMatch } from "../src/components/PracticeClient";
import { RichText, splitMath } from "../src/components/Math";
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
  // Real formats from the bank vs what a student types.
  not(check("text word", answersMatch("even", "\\text{even}"), true));
  not(check("mbox word", answersMatch("Saturday", "\\mbox{Saturday}"), true));
  not(check("number word", answersMatch("4", "\\mbox{four}"), true));
  not(check("unit optional", answersMatch("2", "2 \\text{ euros}"), true));
  not(check("unit with power", answersMatch("864", "864 \\mbox{ inches}^2"), true));
  not(check("wrong unit", answersMatch("3 minutes", "3 \\text{ hours}"), false));
  not(check("slash fraction", answersMatch("1/2", "\\frac{1}{2}"), true));
  not(check("pi fraction", answersMatch("25pi/2", "\\frac{25\\pi}{2}"), true));
  not(check("pi spaced", answersMatch("35/2 pi", "\\frac{35}{2} \\pi"), true));
  not(check("frac94", answersMatch("2.25pi", "\\frac94\\pi"), true));
  not(check("sqrt plain", answersMatch("sqrt2+1", "\\sqrt{2}+1"), true));
  not(check("sqrt paren", answersMatch("1+sqrt(2)", "\\sqrt{2}+1"), true));
  not(check("mixed number", answersMatch("10 1/12", "10\\frac{1}{12}"), true));
  not(check("mixed as improper", answersMatch("121/12", "10\\frac{1}{12}"), true));
  not(check("pair", answersMatch("(3,-1)", "(3, -1)"), true));
  not(check("pair order matters", answersMatch("(-1,3)", "(3, -1)"), false));
  not(check("list any order", answersMatch("2, -2", "-2, 2"), true));
  not(check("assignment prefix", answersMatch("-16.5", "k = \\frac{-33}{2}"), true));
  not(check("dollar sign", answersMatch("42409", "\\$42409"), true));
  not(check("thousands comma", answersMatch("42,409", "\\$42409"), true));
  not(check("degrees", answersMatch("45", "45^\\circ"), true));
  not(check("percent", answersMatch("20%", "20\\%"), true));
  not(check("power", answersMatch("2^10", "1024"), true));
  not(check("cube root", answersMatch("8^(1/3)", "2"), true));
  not(check("7-2pi", answersMatch("7 - 2pi", "7-2\\pi"), true));
  not(check("near miss numeric", answersMatch("0.33", "\\frac{1}{3}"), false));
  not(check("interval string", answersMatch("[0,3)", "[0,3)"), true));

  console.log("--- extractBoxed ---");
  not(check("simple", extractBoxed("so \\boxed{42}."), "42"));
  not(check("nested braces", extractBoxed("\\boxed{\\frac{1}{2}}"), "\\frac{1}{2}"));
  not(check("last of several", extractBoxed("\\boxed{1} then \\boxed{2}"), "2"));
  not(check("none", extractBoxed("no answer here"), null));

  console.log("--- RichText rendering ---");
  const render = (s: string) => renderToStaticMarkup(RichText({ text: s }) as any);
  // KaTeX embeds the original TeX in a MathML <annotation> for accessibility/copy.
  // That is not visible text, so strip it before asserting nothing raw leaked.
  const visible = (s: string) => render(s).replace(/<annotation[^>]*>[\s\S]*?<\/annotation>/g, "");
  const inline = render("What is $x+1$?");
  not(check("inline $...$ renders KaTeX", inline.includes("katex"), true));
  not(check("inline is not display mode", inline.includes("katex-display"), false));
  not(check("prose survives", inline.includes("What is"), true));

  // The bug this guards: 1,838 problems use \[...\] and rendered as raw source.
  const display = render("Let \\[f(x) = x^2\\] be a function.");
  not(check("\\[...\\] renders KaTeX", display.includes("katex"), true));
  not(check("\\[...\\] is display mode", display.includes("katex-display"), true));
  not(check("no raw \\[ left behind", visible("Let \\[f(x) = x^2\\] be a function.").includes("\\["), false));

  const dd = render("Thus $$a^2+b^2=c^2$$ holds.");
  not(check("$$...$$ renders display", dd.includes("katex-display"), true));

  const paren = render("Let \\(y\\) be odd.");
  not(check("\\(...\\) renders inline", paren.includes("katex") && !paren.includes("katex-display"), true));

  const plain = render("Three faucets fill a tub in 6 minutes.");
  not(check("plain prose renders no KaTeX", plain.includes("katex"), false));

  // A real statement from the bank, with a piecewise block.
  const real = render("Let \\[f(x) = \\left\\{\\begin{array}{cl} ax+3, &\\text{ if }x>2 \\end{array}\\right.\\]Find $a+b$.");
  not(check("piecewise + inline in one statement", real.includes("katex-display") && real.includes("katex"), true));
  not(check(
    "no raw \\begin left behind",
    visible("Let \\[f(x) = \\left\\{\\begin{array}{cl} ax+3, &\\text{ if }x>2 \\end{array}\\right.\\]Find $a+b$.").includes("\\begin{"),
    false
  ));

  // Bare \begin{align*} with no $ or \[ wrapper: ~20% of solutions and 180 statements.
  const bare = "We solve: \\begin{align*} x+y &= 20 \\\\ 60x-30y &= 660 \\end{align*} so $x=6$.";
  const bareOut = render(bare);
  not(check("bare \\begin{align*} renders as display", bareOut.includes("katex-display"), true));
  not(check("bare env leaves no raw source", visible(bare).includes("\\begin{"), false));
  not(check("prose around bare env survives", bareOut.includes("We solve"), true));

  not(check("tokenizer: nested env consumed whole",
    splitMath("a \\begin{array}{c}\\begin{array}{c}1\\end{array}\\end{array} b").length, 3));
  not(check("tokenizer: unsupported env left as text",
    splitMath("x \\begin{tabular}{c}1\\end{tabular} y").every((s) => "text" in s), true));
  not(check("tokenizer: unterminated $ is literal text",
    splitMath("costs $5 to enter").every((s) => "text" in s), true));
  not(check("tokenizer: $$ beats $",
    (splitMath("$$a$$") as any)[0].display, true));

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
