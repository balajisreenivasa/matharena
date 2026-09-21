// The fine-grained layer under the 28 lesson skills: 57 sub-skills (the taxonomy from
// the written plan), each tagged onto problems by its own keywords and tracked with
// its own mastery score. Lessons stay at the 28-unit grain (one lesson a day); the
// skill tree, the diagnostic baseline and the progress page use this layer.
//
// Sub-skill rows live in the same Skill table with ids prefixed "sub-"; the parent is
// recorded here, not in the database, so no migration is needed.

import { SKILLS, SKILL_BY_ID, type TopicSlug } from "./skills";

export type SubSkill = {
  id: string; // "sub-<slug>"
  name: string;
  parentId: string; // lesson skill id
  keywords: string[]; // regex sources; matched only when the parent matched (or the parent's topic)
};

const S = (slug: string, name: string, parentId: string, keywords: string[]): SubSkill => ({ id: `sub-${slug}`, name, parentId, keywords });

export const SUBSKILLS: SubSkill[] = [
  // ---- Algebra ----
  S("linear-word", "Linear equations & word problems", "alg-linear", ["solve for", "linear", "equation", "costs?", "price", "age", "years old", "twice as", "how many (?:dollars|cents)", "sum of .* and"]),
  S("rates-work", "Rates, speed & work", "alg-linear", ["per hour", "miles per", "speed", "rate", "how long", "minutes", "hours", "work(?:s|ing)? together", "fills?", "drains?", "average speed", "round trip"]),
  S("ratios-percents", "Ratios, proportions & percents", "alg-ratios", ["ratio", "percent", "%", "proportion", "fraction of", "increased by", "decreased by", "discount", "what fraction", "scale"]),
  S("averages-stats", "Mean, median, mode & weighted averages", "alg-ratios", ["average", "mean", "median", "mode", "weighted", "data set", "scores?", "test average"]),
  S("quadratics-vieta", "Quadratics & Vieta's formulas", "alg-quadratics", ["quadratic", "x\\^2", "roots?", "vieta", "discriminant", "parabola", "zeros?", "real solutions", "sum of the roots", "product of the roots"]),
  S("factoring-sfft", "Factoring & Simon's Favorite Factoring Trick", "alg-quadratics", ["factor", "\\(x-[^)]*\\)\\(x", "xy", "\\bab\\b", "x\\^2 ?- ?y\\^2", "difference of squares", "simon"]),
  S("exponents-radicals", "Exponents & radicals", "alg-exponents", ["\\\\sqrt", "radical", "exponent", "\\^\\{?\\d{2,}", "power of", "2\\^", "3\\^", "10\\^", "rationalize", "simplify"]),
  S("logarithms", "Logarithms", "alg-exponents", ["\\\\log", "logarithm", "\\\\ln", "log_"]),
  S("absolute-value", "Absolute value", "alg-inequalities", ["\\|x", "absolute value", "\\\\left\\|", "\\|[a-z0-9 +-]*\\|"]),
  S("inequalities-optimization", "Inequalities & optimization", "alg-inequalities", ["minimum", "maximum", "least possible", "greatest possible", "smallest possible", "largest possible", "inequality", "\\\\le", "\\\\ge", "\\\\leq", "\\\\geq", "am-gm"]),
  S("arith-geom-sequences", "Arithmetic & geometric sequences", "alg-sequences", ["arithmetic sequence", "geometric sequence", "arithmetic progression", "geometric progression", "common difference", "common ratio", "term", "a_n", "a_\\{?n"]),
  S("telescoping-series", "Series, sums & telescoping", "alg-sequences", ["series", "sum of the first", "\\\\sum", "\\\\cdots", "\\\\dots", "telescop", "1\\+2\\+", "recursive", "recurrence"]),
  S("functions-graphs", "Functions, graphs & transformations", "alg-functions", ["f\\(x\\)", "function", "graph", "f\\(", "g\\(", "domain", "range", "inverse", "composition", "shifted", "reflected"]),
  S("floor-ceiling", "Floor & ceiling", "alg-functions", ["\\\\lfloor", "floor", "\\\\lceil", "ceiling", "greatest integer", "fractional part", "\\\\\\{x\\\\\\}"]),
  S("polynomials-remainder", "Polynomials & the remainder theorem", "alg-polynomials", ["polynomial", "degree", "remainder when .* divided by", "x\\^3", "x\\^4", "coefficient", "p\\(x\\)", "root"]),
  S("systems-symmetric", "Systems & symmetric manipulation", "alg-polynomials", ["system", "x\\+y", "xy", "x\\^2\\+y\\^2", "a\\+b\\+c", "abc", "simultaneous", "x\\+y\\+z"]),

  // ---- Counting & Probability ----
  S("permutations", "Permutations & arrangements", "cp-counting-basics", ["arrange", "permutation", "order", "in a row", "seat", "license plate", "different (?:ways|orders|arrangements)", "\\d!"]),
  S("combinations", "Combinations & selections", "cp-counting-basics", ["combination", "\\\\binom", "\\\\choose", "committee", "choose", "select", "subsets?", "handshake"]),
  S("overcounting", "Correcting for overcounting", "cp-counting-basics", ["identical", "indistinguishable", "circular", "around a (?:round )?table", "necklace", "rotation", "reflection", "symmetr"]),
  S("casework", "Casework", "cp-casework", ["how many (?:positive )?integers", "between \\d+ and \\d+", "contain(?:s|ing)? the digit", "exactly", "cases?", "digits? .* (?:sum|even|odd)"]),
  S("complementary", "Complementary counting", "cp-casework", ["at least", "at most", "no two", "adjacent", "neither", "none of", "not (?:all|both)", "not adjacent", "at least one"]),
  S("stars-bars", "Stars and bars (distributions)", "cp-stars-bars", ["distribute", "nonnegative integer solutions", "positive integer solutions", "boxes", "balls", "identical .* into", "x_1\\+x_2"]),
  S("inclusion-exclusion", "Inclusion-exclusion", "cp-stars-bars", ["inclusion", "exclusion", "either .* or", "both", "union", "intersection", "venn", "neither .* nor", "divisible by \\d+ or"]),
  S("probability-basics", "Probability basics", "cp-probability", ["probability", "at random", "randomly", "chance", "likely", "dice", "die\\b", "coin", "fair", "deck", "cards?", "marble", "urn", "spinner"]),
  S("conditional-independent", "Conditional probability & independence", "cp-probability", ["given that", "conditional", "independent", "without replacement", "with replacement", "bayes", "at least one .* probability"]),
  S("expected-value", "Expected value", "cp-expected", ["expected", "expectation", "on average", "fair price", "expected number"]),
  S("geometric-probability", "Geometric probability", "cp-expected", ["geometric probability", "chosen (?:uniformly )?at random from the interval", "random point", "randomly (?:chosen|selected) (?:point|real)", "dart", "meet", "arrive"]),
  S("grid-paths", "Grid paths & lattice walks", "cp-paths-recursion", ["path", "grid", "lattice", "steps?", "move", "walk", "reach", "up or right", "block"]),
  S("recursion-bijection", "Recursion, states & bijections", "cp-paths-recursion", ["fibonacci", "tile", "domino", "staircase", "sequence of (?:coin|moves|steps)", "frog", "ant", "bug", "recurrence", "no two consecutive", "bijection"]),

  // ---- Number Theory ----
  S("primes-factorization", "Primes & prime factorization", "nt-divisibility", ["prime", "composite", "prime factorization", "factor of", "multiple of", "divisible"]),
  S("divisor-counting", "Counting & summing divisors", "nt-divisibility", ["number of (?:positive )?divisors", "how many (?:positive )?divisors", "sum of (?:the )?(?:positive )?divisors", "divisors of", "factors of \\d+"]),
  S("gcd-lcm", "GCD & LCM", "nt-gcd-lcm", ["gcd", "lcm", "greatest common", "least common multiple", "\\\\gcd", "\\\\text\\{lcm\\}", "relatively prime", "coprime"]),
  S("euclidean-algorithm", "Euclidean algorithm & linear combinations", "nt-gcd-lcm", ["euclid", "gcd\\((?:[a-z0-9+ ]*n|\\d+,\\s*\\d+)", "\\\\gcd\\([^)]*n", "linear combination", "bezout"]),
  S("modular-arithmetic", "Modular arithmetic & remainders", "nt-modular", ["remainder", "\\\\pmod", "\\\\bmod", "mod\\b", "modulo", "divided by", "congruent", "leaves a remainder"]),
  S("last-digits-cycles", "Last digits & cycles", "nt-modular", ["units digit", "ones digit", "last (?:two )?digits?", "tens digit", "cycle", "\\d+\\^\\{?\\d{2,}"]),
  S("divisibility-rules", "Divisibility rules", "nt-bases", ["divisible by (?:3|9|11|4|8|6|12)", "divisibility", "multiple of (?:3|9|11)", "sum of (?:the|its) digits"]),
  S("number-bases", "Number bases", "nt-bases", ["base[- ]?(?:ten|two|three|four|five|six|seven|eight|nine|\\d+)", "_\\{?\\d+\\}?\\b", "binary", "base-\\d"]),
  S("digit-problems", "Digit problems & palindromes", "nt-bases", ["digits?", "reverse", "palindrome", "two-digit", "three-digit", "four-digit", "leading digit"]),
  S("diophantine", "Diophantine equations", "nt-diophantine", ["ordered pairs? of (?:positive )?integers", "integer solutions", "positive integers? (?:such|with)", "integers a and b", "chicken", "mcnugget", "postage", "cannot be (?:written|expressed)"]),
  S("perfect-powers", "Perfect squares & cubes", "nt-diophantine", ["perfect square", "perfect cube", "square of an integer", "cube of an integer", "square number", "n\\^2"]),
  S("factorials-prime-powers", "Factorials, trailing zeros & prime powers", "nt-factorials-powers", ["factorial", "\\d+!", "n!", "trailing zeros", "largest power of", "highest power", "ends in .* zeros", "divides \\d+!"]),
  S("simultaneous-congruences", "Simultaneous congruences", "nt-factorials-powers", ["when divided by \\d+ .* (?:and|when divided by)", "remainder of \\d+ when .* remainder", "chinese remainder", "\\\\pmod\\{\\d+\\}.*\\\\pmod\\{\\d+\\}", "both .* remainder"]),

  // ---- Geometry ----
  S("angle-chasing", "Angle chasing", "geo-angles", ["angle", "degrees?", "\\^\\\\circ", "exterior angle", "interior angle", "bisect", "supplementary", "complementary"]),
  S("triangle-basics", "Triangle basics & the triangle inequality", "geo-angles", ["isosceles", "equilateral", "triangle inequality", "sum of the (?:interior )?angles", "sides? of (?:a|the) triangle", "integer side", "scalene"]),
  S("pythagorean-special", "Pythagorean theorem & special right triangles", "geo-similar", ["right triangle", "hypotenuse", "pythagor", "legs?", "30-60-90", "45-45-90", "\\\\sqrt\\{?\\d", "ladder", "distance from"]),
  S("similar-triangles", "Similar triangles", "geo-similar", ["similar", "proportional", "shadow", "scale factor", "parallel to", "corresponding"]),
  S("angle-bisector-ratios", "Angle bisector theorem & length ratios", "geo-similar", ["angle bisector", "bisector", "divides .* in the ratio", "ratio .* segments?", "cevian", "median"]),
  S("triangle-area", "Triangle area (Heron, sine, altitudes)", "geo-area", ["area of (?:the )?triangle", "altitude", "heron", "\\\\frac\\{1\\}\\{2\\} ?(?:ab|bh)", "base .* height", "area of \\\\triangle"]),
  S("polygon-area-shoelace", "Polygon area, shoelace & Pick", "geo-area", ["area", "square units", "region", "shaded", "perimeter", "trapezoid", "parallelogram", "rhombus", "quadrilateral", "hexagon", "pentagon", "octagon", "polygon", "shoelace", "lattice points"]),
  S("circles-inscribed-angles", "Circles: arcs, chords & inscribed angles", "geo-circles", ["circle", "radius", "radii", "diameter", "chord", "arc", "inscribed", "circumscribed", "circumference", "sector", "central angle", "\\\\pi"]),
  S("tangents-power-point", "Tangents & power of a point", "geo-circles", ["tangent", "power of a point", "secant", "externally tangent", "internally tangent", "common tangent"]),
  S("coordinate-geometry", "Coordinate geometry", "geo-coordinate", ["coordinate", "\\(\\s*-?\\d+\\s*,\\s*-?\\d+\\s*\\)", "slope", "y-intercept", "x-axis", "y-axis", "line y", "the line", "midpoint", "distance between the points", "origin"]),
  S("lattice-reflections", "Lattice points, reflections & transformations", "geo-coordinate", ["lattice", "reflect", "rotation", "rotated", "translated", "image of", "transformation"]),
  S("regular-polygons", "Regular polygons & tilings", "geo-polygons", ["regular (?:hexagon|pentagon|octagon|polygon|dodecagon|decagon)", "square", "rectangle", "kite", "diagonal", "tiling", "tile", "grid", "unit squares"]),
  S("cyclic-quadrilaterals", "Cyclic quadrilaterals", "geo-polygons", ["cyclic", "inscribed in a circle", "quadrilateral .* circle", "ptolemy", "opposite angles"]),
  S("volume-surface", "Volume & surface area", "geo-solid", ["cube", "sphere", "cylinder", "cone", "pyramid", "prism", "tetrahedron", "volume", "surface area", "solid", "box"]),
  S("space-diagonals-cross-sections", "Space diagonals & cross-sections", "geo-solid", ["cross[- ]section", "space diagonal", "three-dimensional", "edges?", "faces", "vertex of the cube", "plane cuts", "slice"]),
  S("trig-laws", "Law of sines & cosines", "geo-trig", ["\\\\sin", "\\\\cos", "\\\\tan", "law of (?:sines|cosines)", "trigonometr", "\\\\theta", "\\\\alpha"]),
  S("mass-points-length-chasing", "Mass points & length chasing", "geo-trig", ["cevian", "ratio .* (?:AD|BE|CF)", "concurrent", "intersect at", "mass point", "menelaus", "ceva", "length of .* segment"]),
];

export const SUBSKILL_BY_ID: Record<string, SubSkill> = Object.fromEntries(SUBSKILLS.map((s) => [s.id, s]));

export function subSkillsOf(parentId: string): SubSkill[] {
  return SUBSKILLS.filter((s) => s.parentId === parentId);
}

export function topicOfSubSkill(id: string): TopicSlug | undefined {
  const p = SUBSKILL_BY_ID[id]?.parentId;
  return p ? SKILL_BY_ID[p]?.topicSlug : undefined;
}

// Lesson-level prerequisites: the edges of the skill tree. A skill is "available" when
// every prerequisite is at least Progressing (mastery >= 0.4) or has been taught.
export const PREREQS: Record<string, string[]> = {
  "alg-linear": [],
  "alg-ratios": ["alg-linear"],
  "alg-quadratics": ["alg-linear"],
  "alg-exponents": ["alg-linear"],
  "alg-inequalities": ["alg-quadratics"],
  "alg-sequences": ["alg-linear"],
  "alg-functions": ["alg-linear"],
  "alg-polynomials": ["alg-quadratics"],
  "cp-counting-basics": [],
  "cp-casework": ["cp-counting-basics"],
  "cp-stars-bars": ["cp-counting-basics", "cp-casework"],
  "cp-probability": ["cp-counting-basics"],
  "cp-expected": ["cp-probability"],
  "cp-paths-recursion": ["cp-casework"],
  "nt-divisibility": [],
  "nt-gcd-lcm": ["nt-divisibility"],
  "nt-modular": ["nt-divisibility"],
  "nt-bases": ["nt-divisibility"],
  "nt-diophantine": ["nt-divisibility", "alg-quadratics"],
  "nt-factorials-powers": ["nt-modular", "nt-divisibility"],
  "geo-angles": [],
  "geo-similar": ["geo-angles"],
  "geo-area": ["geo-angles"],
  "geo-circles": ["geo-similar"],
  "geo-coordinate": ["geo-similar"],
  "geo-polygons": ["geo-area"],
  "geo-solid": ["geo-area"],
  "geo-trig": ["geo-similar", "geo-circles"],
};

const COMPILED = SUBSKILLS.map((s) => ({ id: s.id, parentId: s.parentId, re: new RegExp(s.keywords.join("|"), "i") }));

// Tag sub-skills for a problem whose parent (lesson) skills are `parentIds`. Falls
// back to the parent's topic when nothing under the matched parents hits, so every
// tagged problem gets at least one sub-skill when possible.
export function tagSubSkills(statement: string, parentIds: string[], topicSlugs: TopicSlug[]): string[] {
  const parents = new Set(parentIds);
  const out: string[] = [];
  for (const c of COMPILED) {
    if (!parents.has(c.parentId)) continue;
    if (c.re.test(statement)) out.push(c.id);
  }
  if (out.length) return out;
  const topics = new Set(topicSlugs);
  for (const c of COMPILED) {
    const t = SKILL_BY_ID[c.parentId]?.topicSlug;
    if (t && topics.has(t) && c.re.test(statement)) out.push(c.id);
  }
  return out;
}

export type NodeStatus = "locked" | "available" | "in-progress" | "proficient" | "mastered";

export function nodeStatus(m: { effective: number; attempts: number }, prereqsOk: boolean): NodeStatus {
  if (m.attempts >= 8 && m.effective >= 0.85) return "mastered";
  if (m.attempts >= 4 && m.effective >= 0.65) return "proficient";
  if (m.attempts > 0) return "in-progress";
  return prereqsOk ? "available" : "locked";
}

export const STATUS_COLOR: Record<NodeStatus, string> = {
  locked: "#94a3b8",
  available: "#2563eb",
  "in-progress": "#d97706",
  proficient: "#0891b2",
  mastered: "#16a34a",
};

export const ALL_TREE_SKILLS = SKILLS;
