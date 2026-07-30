// Topic classifier. Reads data/problems.raw.json, tags each problem with one primary
// + optional secondary topic, writes data/problems.json (ready for seed).
//
// Default: a fast offline keyword heuristic. No key, no network, no cost.
// Ambiguous problems are reported so you can decide whether they need a model.
//
// Optional model pass for the ambiguous remainder only:
//   npm run classify -- --ai
// Backend is whichever is configured (checked in this order):
//   1. LLM_BASE_URL  — any OpenAI-compatible server, e.g. a local open-source model:
//        Ollama:    LLM_BASE_URL=http://localhost:11434/v1  LLM_MODEL=qwen2.5:7b-instruct
//        LM Studio: LLM_BASE_URL=http://localhost:1234/v1   LLM_MODEL=<loaded model>
//   2. ANTHROPIC_API_KEY — hosted Claude Haiku.
import "dotenv/config";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const TOPICS = ["Algebra", "Geometry", "Number Theory", "Counting & Probability"] as const;
type Topic = (typeof TOPICS)[number];
type Tag = { name: Topic; isPrimary: boolean; confidence?: number; taggedBy?: string };

// ---------------------------------------------------------------------------
// Heuristic tagger
// ---------------------------------------------------------------------------

// weight 3 = decisive term, 2 = strong, 1 = suggestive.
const SIGNALS: Record<Topic, [RegExp, number][]> = {
  Geometry: [
    [/\b(triangles?|circles?|squares?|rectangles?|polygons?|quadrilaterals?)\b/g, 3],
    [/\b(trapezoids?|rhombus|parallelograms?|pentagons?|hexagons?|octagons?)\b/g, 3],
    [/\b(hypotenuse|altitude|perpendicular|parallel|bisects?|bisector)\b/g, 3],
    [/\b(radius|radii|diameter|circumference|chord|arcs?|tangent|sector)\b/g, 3],
    [/\b(inscribed|circumscribed|centroid|incenter|circumcenter|orthocenter)\b/g, 3],
    [/\b(isosceles|equilateral|congruent|similar\s+triangles?)\b/g, 3],
    [/\b(spheres?|cylinders?|cones?|cubes?|prisms?|pyramids?|tetrahedron)\b/g, 3],
    [/\b(angles?|degrees?|vertex|vertices|diagonals?|midpoints?)\b/g, 2],
    [/\b(area|perimeter|volume|surface\s+area)\b/g, 2],
    [/\b(coordinate\s+plane|collinear|reflection|rotation|translated)\b/g, 2],
  ],
  "Number Theory": [
    [/\b(primes?|composite|divisors?|divisible|factorization)\b/g, 3],
    [/\b(remainder|modulo|\\pmod|\\bmod|congruent\s+to)\b/g, 3],
    [/\b(gcd|lcm|greatest\s+common\s+divisor|least\s+common\s+multiple)\b/g, 3],
    [/\b(relatively\s+prime|coprime|units?\s+digit|digits?\s+sum|sum\s+of\s+the\s+digits)\b/g, 3],
    [/\b(base[- ](?:ten|two|eight|\d+)|palindrome|perfect\s+squares?|perfect\s+cubes?)\b/g, 3],
    [/\b(integers?|multiples?|factors?|digits?)\b/g, 1],
  ],
  "Counting & Probability": [
    [/\b(probability|probabilities|expected\s+value)\b/g, 3],
    [/\b(permutations?|combinations?|factorials?|binomial\s+coefficient)\b/g, 3],
    [/\b(how\s+many\s+ways|number\s+of\s+ways|distinct\s+arrangements?)\b/g, 3],
    [/\b(at\s+random|randomly|uniformly\s+at\s+random)\b/g, 3],
    [/\b(dice|die|coins?\s+(?:flip|toss)|deck\s+of\s+cards|marbles?|urn)\b/g, 3],
    [/\b(subsets?|committees?|choose|arranged?|ordered\s+pairs?)\b/g, 2],
    [/\b(outcomes?|favorable|selected|chosen)\b/g, 1],
  ],
  Algebra: [
    [/\b(polynomials?|quadratics?|roots?\s+of|discriminant)\b/g, 3],
    [/\b(logarithms?|\\log|exponents?|\\sqrt)\b/g, 2],
    [/\b(arithmetic\s+(?:sequence|progression)|geometric\s+(?:sequence|progression))\b/g, 3],
    [/\b(system\s+of\s+equations|inequality|inequalities|absolute\s+value)\b/g, 3],
    [/\b(complex\s+numbers?|imaginary|\\omega)\b/g, 3],
    [/\b(functions?|sequences?|series|equations?|solve\s+for)\b/g, 2],
    [/\b(average|arithmetic\s+mean|median|mode|ratio|proportion|percent)\b/g, 2],
    [/\b(slope|y-intercept|graph\s+of|linear)\b/g, 2],
    [/\b(speed|rate|per\s+hour|work(?:ing)?\s+together|miles\s+per)\b/g, 2],
  ],
};

function scoreTopics(statement: string, hasDiagram: boolean): Record<Topic, number> {
  const text = statement.toLowerCase();
  const scores = { Algebra: 0, Geometry: 0, "Number Theory": 0, "Counting & Probability": 0 } as Record<Topic, number>;
  for (const topic of TOPICS) {
    for (const [re, weight] of SIGNALS[topic]) {
      const hits = text.match(re);
      if (hits) scores[topic] += weight * Math.min(hits.length, 3);
    }
  }
  // A rendered figure is a strong geometry signal on its own.
  if (hasDiagram) scores.Geometry += 4;
  return scores;
}

type HeuristicResult = { tags: Tag[]; confident: boolean };

function heuristicClassify(statement: string, hasDiagram: boolean): HeuristicResult {
  const scores = scoreTopics(statement, hasDiagram);
  const ranked = (Object.entries(scores) as [Topic, number][]).sort((a, b) => b[1] - a[1]);
  const [top, second] = ranked;

  // Confident when the leader is meaningful and clearly ahead of the runner-up.
  const confident = top[1] >= 3 && top[1] >= second[1] * 1.5;
  const tags: Tag[] = [{ name: top[0], isPrimary: true, confidence: confident ? 0.8 : 0.4, taggedBy: "heuristic" }];
  if (second[1] >= 3 && second[1] >= top[1] * 0.6) {
    tags.push({ name: second[0], isPrimary: false, confidence: 0.5, taggedBy: "heuristic" });
  }
  return { tags, confident };
}

// ---------------------------------------------------------------------------
// Optional model pass (ambiguous problems only)
// ---------------------------------------------------------------------------

const PROMPT = (statement: string) =>
  `Classify this competition math problem into topics. Reply with ONLY a JSON array of 1-2 topics from exactly this list: ${JSON.stringify(TOPICS)}. The first is the primary topic. Example: ["Geometry","Algebra"].\n\nProblem: ${statement}`;

function parseTopicArray(text: string): Tag[] {
  const start = text.indexOf("[");
  const end = text.indexOf("]");
  if (start === -1 || end === -1) return [];
  let arr: unknown;
  try {
    arr = JSON.parse(text.slice(start, end + 1));
  } catch {
    return [];
  }
  if (!Array.isArray(arr)) return [];
  return (arr as string[])
    .filter((t): t is Topic => (TOPICS as readonly string[]).includes(t))
    .map((name, i) => ({ name, isPrimary: i === 0, confidence: 0.9, taggedBy: "ai" }));
}

async function classifyOpenAICompatible(statement: string, baseUrl: string, model: string): Promise<Tag[]> {
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(process.env.LLM_API_KEY ? { authorization: `Bearer ${process.env.LLM_API_KEY}` } : {}),
    },
    body: JSON.stringify({ model, max_tokens: 64, temperature: 0, messages: [{ role: "user", content: PROMPT(statement) }] }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text().catch(() => "")}`);
  const data: any = await res.json();
  return parseTopicArray(data?.choices?.[0]?.message?.content ?? "");
}

async function classifyAnthropic(statement: string, apiKey: string): Promise<Tag[]> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5",
      max_tokens: 64,
      messages: [{ role: "user", content: PROMPT(statement) }],
    }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text().catch(() => "")}`);
  const data: any = await res.json();
  return parseTopicArray(data?.content?.[0]?.text ?? "");
}

function resolveBackend(): ((s: string) => Promise<Tag[]>) | null {
  const baseUrl = process.env.LLM_BASE_URL;
  if (baseUrl) {
    const model = process.env.LLM_MODEL;
    if (!model) throw new Error("LLM_BASE_URL is set but LLM_MODEL is not.");
    console.log(`AI pass: OpenAI-compatible endpoint ${baseUrl} (${model})`);
    return (s) => classifyOpenAICompatible(s, baseUrl, model);
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (key) {
    console.log(`AI pass: Anthropic ${process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5"}`);
    return (s) => classifyAnthropic(s, key);
  }
  return null;
}

// ---------------------------------------------------------------------------

async function main() {
  const useAi = process.argv.includes("--ai");
  const rawPath = join(process.cwd(), "data", "problems.raw.json");
  if (!existsSync(rawPath)) {
    console.error(`Missing ${rawPath}. Run \`npm run scrape\` first.`);
    process.exit(1);
  }
  const raw = JSON.parse(readFileSync(rawPath, "utf8"));

  const cacheDir = join(process.cwd(), "scripts", "cache");
  if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });
  const cacheFile = join(cacheDir, "classifications.json");
  const cache: Record<string, Tag[]> = existsSync(cacheFile) ? JSON.parse(readFileSync(cacheFile, "utf8")) : {};

  const ambiguous: any[] = [];
  let cached = 0;
  let byHeuristic = 0;
  let preLabeled = 0;

  for (const p of raw.problems) {
    // Some sources (e.g. the MATH dataset) ship their own topic labels. Those are
    // authoritative — never overwrite them with a guess.
    if (p.topics?.length) {
      preLabeled++;
      continue;
    }
    const key = `${p.contestId}_${p.year}_${p.number}`;
    if (cache[key]) {
      p.topics = cache[key];
      cached++;
      continue;
    }
    const { tags, confident } = heuristicClassify(p.statement ?? "", !!p.hasDiagram);
    p.topics = tags;
    if (confident) {
      cache[key] = tags;
      byHeuristic++;
    } else {
      ambiguous.push({ p, key });
    }
  }

  console.log(
    `Pre-labeled by source: ${preLabeled}. Heuristic: ${byHeuristic} confident, ${cached} from cache, ${ambiguous.length} ambiguous.`
  );

  if (ambiguous.length && useAi) {
    const backend = resolveBackend();
    if (!backend) {
      console.warn("--ai given but no backend configured (set LLM_BASE_URL+LLM_MODEL, or ANTHROPIC_API_KEY).");
      console.warn("Keeping the heuristic's best guess for ambiguous problems.");
    } else {
      let done = 0;
      let failed = 0;
      for (const { p, key } of ambiguous) {
        try {
          const tags = await backend(p.statement);
          if (tags.length) {
            p.topics = tags;
            cache[key] = tags;
          }
        } catch (e: any) {
          failed++;
          if (failed <= 5) console.warn(`  ai fail ${key}: ${e.message}`);
        }
        if (++done % 25 === 0) {
          writeFileSync(cacheFile, JSON.stringify(cache));
          console.log(`  ai-classified ${done}/${ambiguous.length}...`);
        }
      }
      if (failed) console.warn(`  ${failed} AI calls failed; those kept their heuristic guess.`);
    }
  } else if (ambiguous.length) {
    console.log(`Run \`npm run classify -- --ai\` to refine the ${ambiguous.length} ambiguous ones with a model.`);
  }

  writeFileSync(cacheFile, JSON.stringify(cache));
  writeFileSync(join(process.cwd(), "data", "problems.json"), JSON.stringify(raw, null, 2));
  console.log(`Tagged ${raw.problems.length} problems -> data/problems.json. Now: npm run seed`);
}

main().catch((e) => { console.error(e); process.exit(1); });
