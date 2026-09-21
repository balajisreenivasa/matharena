// The AMC 10 skill map. Every lesson, worksheet and mastery score hangs off one of
// these. Order is the default teaching order (topics interleave so no week is all
// geometry); tier 1 skills are the foundation and get taught first, tier 2 skills
// are the later-problem material (roughly AMC 10 #12-25).
//
// `keywords` are regex sources matched (case-insensitive) against a problem's
// statement to tag it with this skill at seed time. `topicSlug` narrows the search
// first, so a keyword only needs to be distinctive within its own topic.

export type TopicSlug = "algebra" | "geometry" | "number-theory" | "counting-probability";

export type Skill = {
  id: string;
  name: string;
  topicSlug: TopicSlug;
  tier: 1 | 2;
  order: number;
  amcRange: string; // where this shows up on a typical AMC 10 paper
  keywords: string[];
  // Optional: MATH-dataset `round` values (dataset subjects) that count as this topic.
  // Defaults per topic are applied in tagging when omitted.
};

export const TOPIC_META: Record<TopicSlug, { name: string; color: string; mathRounds: string[] }> = {
  algebra: { name: "Algebra", color: "#2563eb", mathRounds: ["algebra", "prealgebra", "intermediate_algebra"] },
  geometry: { name: "Geometry", color: "#059669", mathRounds: ["geometry", "precalculus"] },
  "number-theory": { name: "Number Theory", color: "#d97706", mathRounds: ["number_theory", "prealgebra"] },
  "counting-probability": { name: "Counting & Probability", color: "#7c3aed", mathRounds: ["counting_and_probability", "prealgebra"] },
};

const S = (
  id: string,
  name: string,
  topicSlug: TopicSlug,
  tier: 1 | 2,
  amcRange: string,
  keywords: string[]
): Omit<Skill, "order"> => ({ id, name, topicSlug, tier, amcRange, keywords });

// Teaching order interleaves topics: A, G, N, C, A, G, N, C ...
const ORDERED: Omit<Skill, "order">[] = [
  // ---- Tier 1: foundations (AMC 10 #1-12) ----
  S("alg-linear", "Linear equations, rates & work", "algebra", 1, "#1-8", [
    "per hour", "miles per", "speed", "rate", "how long", "minutes", "hours", "work(?:s|ing)? together",
    "solve for", "linear", "how many (?:dollars|cents)", "costs?", "price", "age", "years old", "twice as",
  ]),
  S("geo-angles", "Angles & triangle basics", "geometry", 1, "#1-10", [
    "angle", "degrees?", "\\^\\\\circ", "isosceles", "equilateral", "exterior angle", "interior angle",
    "triangle inequality", "sum of the (?:interior )?angles", "bisect", "supplementary", "complementary",
  ]),
  S("nt-divisibility", "Divisibility, primes & factorization", "number-theory", 1, "#1-10", [
    "prime", "divisible", "divisor", "factor", "composite", "multiple of", "prime factorization",
    "number of (?:positive )?divisors", "how many (?:positive )?(?:integers|divisors)",
  ]),
  S("cp-counting-basics", "Counting principles, permutations & combinations", "counting-probability", 1, "#1-10", [
    "how many ways", "number of ways", "arrange", "permutation", "combination", "\\\\binom", "\\\\choose",
    "committee", "distinct", "different (?:ways|orders|arrangements)", "license plate", "seat",
  ]),
  S("alg-ratios", "Ratios, percents & averages", "algebra", 1, "#1-8", [
    "ratio", "percent", "%", "average", "mean", "median", "mode", "proportion", "fraction of",
    "increased by", "decreased by", "discount", "what fraction",
  ]),
  S("geo-similar", "Pythagorean theorem, similar triangles & special right triangles", "geometry", 1, "#5-15", [
    "similar", "right triangle", "hypotenuse", "pythagor", "legs?", "30-60-90", "45-45-90", "altitude",
    "\\\\sqrt\\{?\\d", "distance from", "ladder", "shadow",
  ]),
  S("nt-gcd-lcm", "GCD, LCM & the Euclidean algorithm", "number-theory", 1, "#3-12", [
    "gcd", "lcm", "greatest common", "least common multiple", "relatively prime", "coprime", "\\\\gcd", "\\\\text\\{lcm\\}",
  ]),
  S("cp-probability", "Probability basics", "counting-probability", 1, "#3-15", [
    "probability", "at random", "randomly", "chance", "likely", "dice", "die\\b", "coin", "fair",
    "deck", "cards?", "marble", "urn", "spinner",
  ]),
  S("alg-quadratics", "Quadratics, factoring & Vieta", "algebra", 1, "#5-15", [
    "quadratic", "x\\^2", "roots?", "vieta", "discriminant", "factor", "parabola", "zeros?", "real solutions",
    "\\(x-[^)]*\\)\\(x", "x\\^\\{2\\}",
  ]),
  S("geo-area", "Area: polygons, ratios, Heron & shoelace", "geometry", 1, "#5-18", [
    "area", "square units", "region", "shaded", "perimeter", "trapezoid", "parallelogram", "rhombus",
    "quadrilateral", "hexagon", "pentagon", "octagon", "polygon",
  ]),
  S("nt-modular", "Modular arithmetic, remainders & units digits", "number-theory", 1, "#5-18", [
    "remainder", "\\\\pmod", "\\\\bmod", "mod\\b", "modulo", "units digit", "ones digit", "last (?:two )?digits?",
    "divided by", "congruent", "leaves a remainder",
  ]),
  S("cp-casework", "Casework & complementary counting", "counting-probability", 1, "#5-18", [
    "at least", "at most", "no two", "adjacent", "exactly", "neither", "none of", "not (?:all|both)",
    "how many (?:positive )?integers", "between \\d+ and \\d+", "contain(?:s|ing)? the digit",
  ]),
  S("alg-sequences", "Sequences, series & telescoping", "algebra", 1, "#5-18", [
    "sequence", "arithmetic", "geometric", "term", "series", "sum of the first", "a_\\{?n", "a_n", "\\\\cdots", "\\\\dots",
    "recursive", "recurrence", "consecutive",
  ]),
  S("geo-circles", "Circles: arcs, chords, tangents & power of a point", "geometry", 1, "#8-20", [
    "circle", "radius", "radii", "diameter", "chord", "tangent", "arc", "inscribed", "circumscribed",
    "circumference", "sector", "central angle", "\\\\pi",
  ]),
  S("nt-bases", "Number bases & digit problems", "number-theory", 1, "#5-15", [
    "base[- ]?(?:ten|two|three|four|five|six|seven|eight|nine|\\d+)", "_\\{?\\d+\\}?\\b", "digits?", "binary",
    "sum of (?:the|its) digits", "reverse", "palindrome", "two-digit", "three-digit", "four-digit",
  ]),
  S("cp-stars-bars", "Distributions, stars & bars, inclusion-exclusion", "counting-probability", 1, "#8-20", [
    "identical", "indistinguishable", "distribute", "nonnegative integer solutions", "positive integer solutions",
    "boxes", "balls", "inclusion", "exclusion", "either .* or", "both", "union", "intersection", "venn",
  ]),

  // ---- Tier 2: mid-to-late paper (AMC 10 #12-25) ----
  S("alg-functions", "Functions, graphs, absolute value & floor", "algebra", 2, "#8-20", [
    "f\\(x\\)", "function", "graph", "\\\\lfloor", "floor", "\\\\lceil", "ceiling", "\\|x", "absolute value",
    "f\\(", "g\\(", "domain", "range", "inverse", "composition",
  ]),
  S("geo-coordinate", "Coordinate geometry", "geometry", 2, "#8-20", [
    "coordinate", "\\(\\s*-?\\d+\\s*,\\s*-?\\d+\\s*\\)", "slope", "y-intercept", "x-axis", "y-axis", "line y",
    "the line", "midpoint", "lattice", "reflect", "origin", "distance between the points",
  ]),
  S("nt-diophantine", "Diophantine equations & factoring tricks", "number-theory", 2, "#10-22", [
    "ordered pairs? of (?:positive )?integers", "integer solutions", "positive integers? (?:such|with)", "perfect square",
    "perfect cube", "square of an integer", "xy", "\\bab\\b", "integers a and b", "simon",
  ]),
  S("cp-expected", "Expected value & geometric probability", "counting-probability", 2, "#12-22", [
    "expected", "expectation", "on average", "geometric probability", "chosen (?:uniformly )?at random from the interval",
    "random point", "randomly (?:chosen|selected) (?:point|real)", "dart",
  ]),
  S("alg-exponents", "Exponents, radicals & logarithms", "algebra", 2, "#8-20", [
    "\\\\log", "logarithm", "\\\\sqrt", "radical", "exponent", "\\^\\{?\\d{2,}", "power of", "2\\^", "3\\^", "10\\^",
    "rationalize", "simplify",
  ]),
  S("geo-polygons", "Regular polygons, quadrilaterals & tilings", "geometry", 2, "#10-20", [
    "regular (?:hexagon|pentagon|octagon|polygon|dodecagon|decagon)", "square", "rectangle", "kite",
    "cyclic", "diagonal", "tiling", "tile", "grid", "unit squares",
  ]),
  S("nt-factorials-powers", "Factorials, trailing zeros & exponents in n!", "number-theory", 2, "#10-22", [
    "factorial", "\\d+!", "n!", "trailing zeros", "largest power of", "highest power", "ends in .* zeros",
    "divides \\d+!", "\\\\cdot 2 \\\\cdot 3",
  ]),
  S("cp-paths-recursion", "Paths, recursion & states", "counting-probability", 2, "#12-25", [
    "path", "grid", "lattice", "steps?", "move", "walk", "fibonacci", "tile", "domino", "staircase",
    "sequence of (?:coin|moves|steps)", "reach", "frog", "ant", "bug",
  ]),
  S("alg-polynomials", "Polynomials, systems & symmetric manipulation", "algebra", 2, "#12-22", [
    "polynomial", "degree", "remainder when .* divided by", "x\\^3", "x\\^4", "system", "x\\+y", "xy", "x\\^2\\+y\\^2",
    "a\\+b\\+c", "abc", "coefficient", "p\\(x\\)",
  ]),
  S("geo-solid", "3D geometry: volume, surface area & cross-sections", "geometry", 2, "#10-22", [
    "cube", "sphere", "cylinder", "cone", "pyramid", "prism", "tetrahedron", "volume", "surface area",
    "cross[- ]section", "solid", "box", "three-dimensional", "edges?", "faces",
  ]),
  S("alg-inequalities", "Inequalities, optimization & completing the square", "algebra", 2, "#12-25", [
    "minimum", "maximum", "least possible", "greatest possible", "smallest possible", "largest possible",
    "inequality", "\\\\le", "\\\\ge", "\\\\leq", "\\\\geq", "am-gm", "optimi", "at least .* at most",
  ]),
  S("geo-trig", "Trig in triangles: law of sines/cosines & area", "geometry", 2, "#15-25", [
    "\\\\sin", "\\\\cos", "\\\\tan", "law of (?:sines|cosines)", "trigonometr", "\\\\theta", "\\\\alpha",
  ]),
];

export const SKILLS: Skill[] = ORDERED.map((s, i) => ({ ...s, order: i + 1 }));

export const SKILL_BY_ID: Record<string, Skill> = Object.fromEntries(SKILLS.map((s) => [s.id, s]));

export function skillsForTopic(topic: TopicSlug): Skill[] {
  return SKILLS.filter((s) => s.topicSlug === topic);
}

// Compile once. Each skill matches when any keyword hits the statement.
const COMPILED: { id: string; topicSlug: TopicSlug; re: RegExp }[] = SKILLS.map((s) => ({
  id: s.id,
  topicSlug: s.topicSlug,
  re: new RegExp(s.keywords.join("|"), "i"),
}));

// Tag a problem with every skill whose keywords hit, restricted to skills in the
// problem's own topic(s). Returns skill ids. Empty when nothing matched — the
// worksheet builder then falls back to topic-level selection.
export function tagSkills(statement: string, topicSlugs: TopicSlug[]): string[] {
  const allowed = new Set(topicSlugs);
  const out: string[] = [];
  for (const c of COMPILED) {
    if (!allowed.has(c.topicSlug)) continue;
    if (c.re.test(statement)) out.push(c.id);
  }
  return out;
}
