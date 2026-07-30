// AoPS Wiki adapter for the AMC family + AIME.
// Extracts exact LaTeX from image alt-text, answer choices, diagrams, answers, and solutions.
// Runs on your machine (open network). AoPS markup varies slightly by year; this is a robust best-effort.
import * as cheerio from "cheerio";

const BASE = "https://artofproblemsolving.com/wiki/index.php";
const UA = "MathArena/0.1 (personal educational use)";

export type RawProblem = {
  contestId: string;
  year: number;
  number: number;
  statement: string;
  choices: Record<string, string> | null;
  answer: string;
  hasDiagram: boolean;
  diagramUrl: string | null;
  sourceUrl: string;
  solutions: string[];
};

// Our contest ids are compact ("AMC10A"); AoPS page titles put an underscore before
// the number ("AMC_10A"). Getting this wrong 404s every request.
export function wikiSlug(contestId: string): string {
  const m = /^(AMC)(\d+)([AB]?)$/.exec(contestId);
  if (m) return `AMC_${m[2]}${m[3]}`;
  return contestId; // AHSME, AJHSME, AIME, AIME_I, AIME_II already match
}

export function problemsUrl(contestId: string, year: number): string {
  return `${BASE}/${year}_${wikiSlug(contestId)}_Problems`;
}

async function getHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return res.text();
}

function isLatexImg(cls: string, src: string): boolean {
  return cls.includes("latex") || src.includes("latex.artofproblemsolving.com");
}

// A choices blob looks like "\textbf{(A)}~2 \qquad \textbf{(B)}~20 ... \textbf{(E)}~2020".
function looksLikeChoices(alt: string): boolean {
  return /\(\s*A\s*\)/.test(alt) && /\(\s*B\s*\)/.test(alt) && /\(\s*[DE]\s*\)/.test(alt);
}

function stripDollars(s: string): string {
  return s.trim().replace(/^\$+/, "").replace(/\$+$/, "").trim();
}

// Parse "\textbf{(A)}~2 \qquad \textbf{(B)}~20 ..." into {A:"2",...}
export function parseChoices(tex: string): Record<string, string> | null {
  const cleaned = stripDollars(tex).replace(/\\qquad|\\quad|\\ /g, " ");
  const parts = cleaned.split(/\\(?:textbf|mathrm|text|mathbf)\s*\{?\s*\(\s*([A-E])\s*\)\s*\}?/);
  // parts: [pre, "A", valA, "B", valB, ...]
  const out: Record<string, string> = {};
  for (let i = 1; i < parts.length; i += 2) {
    const letter = parts[i];
    const val = (parts[i + 1] ?? "").replace(/^[~\s]+/, "").replace(/[~\s]+$/, "").trim();
    if (letter && val) out[letter] = val;
  }
  return Object.keys(out).length ? out : null;
}

// Walk the DOM in document order so prose and inline math stay interleaved.
// LaTeX is emitted with $...$ delimiters intact, which is what <RichText> expects.
type WalkState = { choicesTex: string | null; diagramUrl: string | null };

function serialize($: cheerio.CheerioAPI, node: any, state: WalkState): string {
  if (!node) return "";
  if (node.type === "text") return node.data ?? "";
  if (node.type !== "tag") return "";

  if (node.name === "img") {
    const $img = $(node);
    const cls = $img.attr("class") || "";
    const src = $img.attr("src") || "";
    const alt = ($img.attr("alt") ?? "").trim();

    if (isLatexImg(cls, src)) {
      // Answer choices are pulled out of the statement, not rendered inside it.
      if (looksLikeChoices(alt)) {
        if (!state.choicesTex) state.choicesTex = alt;
        return "";
      }
      const tex = stripDollars(alt);
      return tex ? ` $${tex}$ ` : "";
    }
    // A non-LaTeX image is the problem's diagram (Asymptote rendered server-side).
    if (!state.diagramUrl && /\/images\//.test(src)) {
      state.diagramUrl = src.startsWith("http") ? src : `https://artofproblemsolving.com${src}`;
    }
    return "";
  }

  // Skip navigation/edit chrome that would otherwise land in the statement.
  if (node.name === "style" || node.name === "script") return "";
  const cls = $(node).attr("class") || "";
  if (cls.includes("mw-editsection") || cls.includes("toc")) return "";

  return (node.children ?? []).map((c: any) => serialize($, c, state)).join("");
}

function cleanStatement(raw: string): string {
  return raw
    .replace(/\s+/g, " ")
    // AoPS appends solution/nav links to the end of each problem block.
    .replace(/\s*(Solution\s*\d*|See\s+Also|Contents)\s*$/gi, "")
    .replace(/\s+([.,;:?!])/g, "$1")
    .trim();
}

export async function fetchAnswerKey(contestId: string, year: number): Promise<Record<number, string>> {
  const slug = wikiSlug(contestId);
  const candidates = [
    `${BASE}/${year}_${slug}_Answer_Key`,
    `${BASE}/${year}_${slug}_Problems/Answer_Key`,
  ];

  for (const url of candidates) {
    const html = await getHtml(url).catch(() => "");
    if (!html) continue;
    const $ = cheerio.load(html);
    const answers: Record<number, string> = {};

    // Usual shape: an <ol> of single letters (AMC) or integers (AIME).
    $("ol li").each((i, li) => {
      const t = $(li).text().trim().toUpperCase();
      if (/^[A-E]$/.test(t) || /^\d{1,3}$/.test(t)) answers[i + 1] = t;
    });

    // Some years use a table instead.
    if (!Object.keys(answers).length) {
      let n = 0;
      $("table td").each((_, td) => {
        const t = $(td).text().trim().toUpperCase();
        if (/^[A-E]$/.test(t) || /^\d{1,3}$/.test(t)) answers[++n] = t;
      });
    }

    if (Object.keys(answers).length) return answers;
  }
  return {};
}

export async function fetchContest(contestId: string, year: number): Promise<RawProblem[]> {
  const url = problemsUrl(contestId, year);
  const html = await getHtml(url);
  const $ = cheerio.load(html);
  const answers = await fetchAnswerKey(contestId, year).catch(() => ({} as Record<number, string>));

  const problems: RawProblem[] = [];
  const headings = $("span.mw-headline[id^='Problem_']").toArray();

  for (const h of headings) {
    const id = $(h).attr("id") || "";
    const num = parseInt(id.replace("Problem_", ""), 10);
    if (!num) continue;

    // Collect nodes from this heading until the next heading of any level.
    const block = $(h).closest("h1,h2,h3,h4").nextUntil("h1,h2,h3,h4");
    const state: WalkState = { choicesTex: null, diagramUrl: null };
    const serialized = block.toArray().map((n) => serialize($, n, state)).join(" ");
    const statement = cleanStatement(serialized);

    problems.push({
      contestId,
      year,
      number: num,
      statement,
      choices: state.choicesTex ? parseChoices(state.choicesTex) : null,
      answer: answers[num] ?? "",
      hasDiagram: !!state.diagramUrl,
      diagramUrl: state.diagramUrl,
      sourceUrl: `${url}/Problem_${num}`,
      solutions: [], // populated by fetchSolutions() per problem
    });
  }
  return problems;
}

export async function fetchSolutions(contestId: string, year: number, number: number): Promise<string[]> {
  const url = `${problemsUrl(contestId, year)}/Problem_${number}`;
  const html = await getHtml(url).catch(() => "");
  if (!html) return [];
  const $ = cheerio.load(html);
  const sols: string[] = [];
  $("span.mw-headline[id^='Solution']").each((_, h) => {
    const block = $(h).closest("h1,h2,h3,h4").nextUntil("h1,h2,h3,h4");
    const state: WalkState = { choicesTex: null, diagramUrl: null };
    const text = cleanStatement(block.toArray().map((n) => serialize($, n, state)).join(" "));
    if (text) sols.push(text);
  });
  return sols;
}
