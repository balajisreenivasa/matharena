// Quick sanity checks on the seeded bank and the free-response answer matcher.
// Run: npx tsx scripts/verify.ts
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { renderToStaticMarkup } from "react-dom/server";
import { answersMatch } from "../src/components/PracticeClient";
import { RichText, MathTex, splitMath } from "../src/components/Math";
import { normalizeTex, segmentsToPlain } from "../src/lib/tex";
import { splitChoices, answerLetter } from "./adapters/choices";
import { generateCode, normalizeCode } from "../src/lib/classroom";
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

  console.log("--- dates under a UTC server with APP_TZ ---");
  // Regression: a midnight-parsed date shifted into New York time formatted as the
  // previous day, so addDays() never advanced and the hosted calendar looped forever.
  {
    const { spawnSync } = await import("node:child_process");
    const r = spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", ["tsx", "scripts/check-dates-tz.ts"], {
      env: { ...process.env, TZ: "UTC", APP_TZ: "America/New_York" },
      encoding: "utf8",
      shell: process.platform === "win32",
    });
    not(check("addDays advances across a timezone shift", (r.stdout ?? "").trim(), "2026-09-22 45"));
    if (r.stderr?.trim()) console.log("  (stderr) " + r.stderr.trim().split("\n")[0]);
  }

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
  not(check("tokenizer: tabular becomes a display array",
    splitMath("x \\begin{tabular}{c|c}$x$ & Row 1 \\\\ \\hline 1 & 7\\end{tabular} y").some((s) => "tex" in s && s.display && s.tex.replace(/\s+/g, " ") === "\\begin{array}{c|c}x & \\text{Row 1} \\\\ \\hline 1 & 7\\end{array}"), true));
  not(check("tokenizer: unterminated $ is literal text",
    splitMath("costs $5 to enter").every((s) => "text" in s), true));
  not(check("tokenizer: $$ beats $",
    (splitMath("$$a$$") as any)[0].display, true));

  // The bugs behind "questions are not parsed correctly": prices written as \$ or $$,
  // text-mode markup, paragraph breaks and TeX-only commands (see src/lib/tex.ts).
  const plainOf = (s: string) => segmentsToPlain(splitMath(s));
  not(check("tokenizer: \\$ inside math does not end the formula",
    splitMath("earns $\\$$60 a day").filter((s) => "tex" in s).map((s: any) => s.tex), ["\\$"]));
  not(check("tokenizer: \\$ in prose is a dollar sign", plainOf("costs \\$5 and \\$7"), "costs $5 and $7"));
  not(check("tokenizer: $$51.00$ is a price, not display math",
    splitMath("more than $$51.00$. Three").filter((s) => "tex" in s).map((s: any) => [s.tex, s.display]), [["51.00", false]]));
  not(check("tokenizer: $ $9000$ keeps the currency sign", plainOf("worth $ $9000$ is"), "worth $ 9000 is"));
  not(check("tokenizer: paragraph break", splitMath("one\n\ntwo").some((s) => "para" in s), true));
  not(check("tokenizer: \\textbf in prose becomes a styled run",
    splitMath("the \\textbf{same} value").some((s) => "style" in s && s.style === "b"), true));
  not(check("tokenizer: \\% and \\_ in prose", plainOf("a 5\\% rate\\_x"), "a 5% rate_x"));
  not(check("tokenizer: diagram marker",
    splitMath("See [[diagram:/diagrams/abc.svg]] here").some((s) => "img" in s && s.img === "/diagrams/abc.svg"), true));
  not(check("tokenizer: unrendered [asy] block is dropped", plainOf("Look:\n[asy]draw((0,0)--(1,1));[/asy]\nWhat?"), "Look: What?"));
  not(check("normalizeTex: \\mbox -> \\text via macro", renderToStaticMarkup(MathTex({ tex: "\\mbox{Saturday}" }) as any).includes("Saturday"), true));
  not(check("normalizeTex: \\root n \\of", normalizeTex("\\root 3 \\of {x \\root 3 \\of {x}}"), "\\sqrt[3]{x \\sqrt[3]{x}}"));
  not(check("normalizeTex: array @{} column spec", normalizeTex("\\begin{array}{c@{\\qquad}c}a&b\\end{array}"), "\\begin{array}{cc}a&b\\end{array}"));
  not(check("normalizeTex: \\multicolumn padded", normalizeTex("\\multicolumn{2}{r}{} & 3"), "&  & 3".replace(/\s+/g, " ")));
  not(check("normalizeTex: align inside display becomes aligned", normalizeTex("\\begin{align*}a&=b\\end{align*}"), "\\begin{aligned}a&=b\\end{aligned}"));
  not(check("normalizeTex: bare $ becomes \\$", normalizeTex("\\text{lost }$900"), "\\text{lost }\\$900"));
  not(check("normalizeTex: row spacing stripped", normalizeTex("a \\\\[-9pt] b"), "a \\\\ b"));
  {
    const html = renderToStaticMarkup(RichText({ text: "Table: \\begin{tabular}{|c|c|} \\hline $x$ & 1 \\\\ \\hline $f(x)$ & 3 \\\\ \\hline \\end{tabular} done" }) as any);
    not(check("RichText: tabular renders as KaTeX array", html.includes("katex-display") && !html.includes("\\begin{tabular}"), true));
  }

  console.log("--- splitChoices / answerLetter ---");
  {
    const a = splitChoices("How many?\n$\\textbf{(A)}\\ 2128 \\qquad\\textbf{(B)}\\ 2148 \\qquad\\textbf{(C)}\\ 2160 \\qquad\\textbf{(D)}\\ 2200 \\qquad\\textbf{(E)}\\ 2300$");
    not(check("textbf choices split", a?.choices, { A: "2128", B: "2148", C: "2160", D: "2200", E: "2300" }));
    not(check("stem drops the dangling $", a?.stem, "How many?"));
    not(check("value answer maps to letter", answerLetter("2148", a!.choices), "B"));
    not(check("boxed letter maps to letter", answerLetter("\\textbf{(D)}\\ 2200", a!.choices), "D"));
    const b = splitChoices("Which?\n$\\text{(A) } 180 \\quad \\text{(B) } 360 \\quad \\text{(C) } 180(n+2) \\quad \\text{(D) } 180(n-2) \\quad \\text{(E) } 180(n-4)$");
    not(check("text (A) choices split", b?.choices.E, "180(n-4)"));
    const c = splitChoices("x?\n$(\\mathrm {A}) \\ 1 \\qquad (\\mathrm {B}) \\ 2 \\qquad (\\mathrm {C})\\ 5 \\qquad (\\mathrm {D}) \\ 10 \\qquad (\\mathrm {E})\\ 20$");
    not(check("(\\mathrm{A}) choices split", c?.choices, { A: "1", B: "2", C: "5", D: "10", E: "20" }));
    const d = splitChoices("Pick: $\\textbf{(A)}\\ \\text{Increases}\\qquad\\textbf{(B)}\\ \\text{Decreases}\\qquad\\textbf{(C)}\\ \\text{Remains constant}\\qquad\\textbf{(D)}\\ \\text{Increases and then decreases}\\qquad\\textbf{(E)}\\ \\text{Decreases and then increases}$");
    not(check("choice keeps its leading backslash", d?.choices.A, "\\text{Increases}"));
    not(check("no trailing backslash on a choice", d?.choices.D, "\\text{Increases and then decreases}"));
    not(check("fewer than five markers -> null", splitChoices("only $\\textbf{(A)}\\ 1$ here"), null));
    const e = splitChoices("Then:\n$\\textbf{(A)}\\ s^2\\le8r^2\\qquad\\textbf{(B)}\\ s^2=8r^2\\qquad\\textbf{(C)}\\ s^2 \\ge 8r^2 \\\\ \\textbf{(D)}\\ s^2\\le4r^2\\qquad\\textbf{(E)}\\ s^2=4r^2$");
    not(check("a line break before a marker leaves no stray backslash", e?.choices.C, "s^2 \\ge 8r^2"));
    const f = splitChoices("x?\n$\\mathrm{\\textbf{(A)} \\ }226\\qquad \\mathrm{\\textbf{(B)} \\ } 243 \\qquad \\mathrm{\\textbf{(C)} \\ } 270 \\qquad \\mathrm{\\textbf{(D)} \\ }469\\qquad \\mathrm{\\textbf{(E)} \\ } 486$");
    not(check("\\mathrm{\\textbf{(A)} \\ } wrapper leaves clean values", f?.choices, { A: "226", B: "243", C: "270", D: "469", E: "486" }));
    const g = splitChoices("y?\n$\\textbf{(A)} \\text{ 510} \\qquad \\textbf{(B)} \\text{ 1022} \\qquad \\textbf{(C)} \\text{ 8190} \\qquad \\textbf{(D)} \\text{ 8192} \\qquad \\textbf{(E)} \\text{ 65,534}$");
    not(check("\\text-wrapped value maps to its letter", answerLetter("1022", g!.choices), "B"));
    const h = splitChoices("z?\n$\\textbf{(A)} \\indent 25 \\qquad \\textbf{(B)} \\indent 32  \\qquad \\textbf{(C)} \\indent 50  \\qquad \\textbf{(D)} \\indent 63 \\qquad \\textbf{(E)} \\indent 75$");
    not(check("\\indent is stripped from values", h?.choices.C, "50"));
  }

  console.log("--- classroom codes ---");
  not(check("code is 6 chars", generateCode().length, 6));
  not(check("code avoids 0/O 1/I ambiguity", /[01IO]/.test(Array.from({ length: 50 }, generateCode).join("")), false));
  not(check("normalizeCode", normalizeCode(" k7q2-mn "), "K7Q2MN"));

  console.log("--- parseCsv ---");
  not(check("quoted comma", parseCsv('a,b\n"x,y",z')[1], ["x,y", "z"]));
  not(check("escaped quote", parseCsv('a\n"say ""hi"""')[1], ['say "hi"']));

  console.log("--- seeded data ---");
  const total = await db.problem.count();
  not(check("bank holds at least the MATH + AIME sets (12302)", total >= 12302, true));
  console.log(`  bank size: ${total}`);

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
  not(check("AMC rows with embedded choices were split into real choices (>= 2500 MC)", withChoices >= 2500, true));

  // Figures: the geometry bank depends on rendered Asymptote diagrams.
  const withDiagram = await db.problem.count({ where: { hasDiagram: true } });
  console.log(`(problems with a rendered diagram: ${withDiagram})`);
  not(check("diagram problems are in the bank (>= 1000)", withDiagram >= 1000, true));
  const sampleDiagram = await db.problem.findFirst({ where: { hasDiagram: true }, select: { statement: true, diagramPath: true } });
  not(check("diagram statement carries an inline marker", /\[\[diagram:\/diagrams\/[0-9a-f]{40}\.svg\]\]/.test(sampleDiagram?.statement ?? ""), true));
  {
    const { existsSync } = await import("node:fs");
    const { join } = await import("node:path");
    not(check("diagram SVG exists under public/", !!sampleDiagram?.diagramPath && existsSync(join(process.cwd(), "public", sampleDiagram.diagramPath)), true));
  }
  const geoDiagrams = await db.problem.count({ where: { hasDiagram: true, topics: { some: { topic: { slug: "geometry" } } } } });
  console.log(`(geometry problems with a diagram: ${geoDiagrams})`);

  const byContest = await db.problem.groupBy({ by: ["contestId"], _count: true });
  byContest.forEach((c) => console.log(`  ${c.contestId}: ${c._count}`));

  console.log(fails ? `\n${fails} CHECK(S) FAILED` : "\nAll checks passed.");
  if (fails) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
