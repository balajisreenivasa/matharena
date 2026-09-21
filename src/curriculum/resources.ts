// Curated "go deeper" links per skill: the AoPS wiki article(s) that define the idea,
// the AoPS book chapter, and where to find more problems. AoPS wiki pages are free to
// read in a browser; the app never fetches them. Video search links open YouTube
// filtered to AoPS's own solution videos (Richard Rusczyk works through AMC 10 problems
// by number, so searching the topic + "Art of Problem Solving" finds the relevant ones).

export type Resource = { label: string; url: string; kind: "wiki" | "book" | "problems" | "video" | "drill" };

const wiki = (title: string, label = title.replace(/_/g, " ")): Resource => ({ label, url: `https://artofproblemsolving.com/wiki/index.php/${title}`, kind: "wiki" });
const yt = (q: string): Resource => ({ label: `Videos: ${q}`, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`Art of Problem Solving ${q}`)}`, kind: "video" });
const book = (label: string): Resource => ({ label, url: "https://artofproblemsolving.com/store", kind: "book" });
const cat = (c: string, label: string): Resource => ({ label, url: `https://artofproblemsolving.com/wiki/index.php/Category:${c}`, kind: "problems" });
const ALCUMUS: Resource = { label: "Alcumus (free adaptive drill; pick this topic)", url: "https://artofproblemsolving.com/alcumus", kind: "drill" };
const KHAN = (path: string, label: string): Resource => ({ label: `Khan Academy: ${label}`, url: `https://www.khanacademy.org/${path}`, kind: "drill" });

export const RESOURCES: Record<string, Resource[]> = {
  "alg-linear": [wiki("Linear_equation"), wiki("Rate", "Rates, work and distance"), book("AoPS Volume 1, ch. 1-2 (linear equations, word problems)"), cat("Introductory_Algebra_Problems", "AoPS wiki: introductory algebra problems"), yt("rate work word problems AMC 10"), ALCUMUS, KHAN("math/algebra/x2f8bb11595b61c86:solve-equations-inequalities", "linear equations")],
  "alg-ratios": [wiki("Ratio"), wiki("Percent"), wiki("Arithmetic_mean", "Mean, median, mode"), book("AoPS Volume 1, ch. 3 (ratios and percents), ch. 21 (statistics)"), yt("ratios percents AMC 10"), ALCUMUS],
  "alg-quadratics": [wiki("Quadratic_equation"), wiki("Vieta%27s_Formulas", "Vieta's formulas"), wiki("Simon%27s_Favorite_Factoring_Trick", "Simon's Favorite Factoring Trick"), wiki("Completing_the_square"), book("AoPS Volume 1, ch. 6-7 (quadratics), Intro to Algebra ch. 10-12"), yt("Vieta's formulas AMC 10"), ALCUMUS],
  "alg-exponents": [wiki("Exponent", "Exponents"), wiki("Radical", "Radicals"), wiki("Logarithm"), wiki("Rationalizing_the_denominator"), book("AoPS Volume 1, ch. 4 (exponents and radicals); Intro to Algebra ch. 19 (logs)"), yt("logarithms AMC 10"), ALCUMUS],
  "alg-inequalities": [wiki("Inequality"), wiki("Absolute_value"), wiki("AM-GM_Inequality", "AM-GM inequality"), wiki("Optimization"), book("AoPS Volume 1, ch. 8; Intro to Algebra ch. 16-17"), yt("inequalities absolute value AMC 10"), ALCUMUS],
  "alg-sequences": [wiki("Arithmetic_sequence"), wiki("Geometric_sequence"), wiki("Telescoping_series"), wiki("Summation"), book("AoPS Volume 1, ch. 9 (sequences and series)"), yt("arithmetic geometric sequences AMC 10"), ALCUMUS],
  "alg-functions": [wiki("Function"), wiki("Floor_function"), wiki("Graph_of_a_function"), wiki("Function_composition"), book("Intro to Algebra ch. 14-15 (functions, graphing)"), yt("functions floor AMC 10"), ALCUMUS, KHAN("math/algebra/x2f8bb11595b61c86:functions", "functions")],
  "alg-polynomials": [wiki("Polynomial"), wiki("Remainder_Theorem"), wiki("Factor_Theorem"), wiki("Symmetric_sum"), wiki("System_of_equations"), book("Intro to Algebra ch. 20-21; Intermediate Algebra ch. 5-6"), yt("polynomials remainder theorem AMC 10"), ALCUMUS],

  "geo-angles": [wiki("Angle"), wiki("Triangle"), wiki("Triangle_Inequality"), wiki("Isosceles_triangle"), wiki("Exterior_angle"), book("AoPS Volume 1, ch. 11; Intro to Geometry ch. 2-3"), cat("Introductory_Geometry_Problems", "AoPS wiki: introductory geometry problems"), yt("angle chasing AMC 10"), ALCUMUS, KHAN("math/geometry", "geometry")],
  "geo-similar": [wiki("Pythagorean_Theorem"), wiki("Similar_triangles"), wiki("Special_right_triangles"), wiki("Angle_Bisector_Theorem"), wiki("Pythagorean_triple"), book("AoPS Volume 1, ch. 12-13; Intro to Geometry ch. 4-5"), yt("similar triangles AMC 10"), ALCUMUS],
  "geo-area": [wiki("Area"), wiki("Heron%27s_Formula", "Heron's formula"), wiki("Shoelace_Theorem"), wiki("Pick%27s_Theorem", "Pick's theorem"), wiki("Trapezoid"), book("AoPS Volume 1, ch. 14; Intro to Geometry ch. 7-8"), yt("area problems AMC 10"), ALCUMUS],
  "geo-circles": [wiki("Circle"), wiki("Inscribed_angle"), wiki("Power_of_a_Point_Theorem", "Power of a point"), wiki("Tangent_line", "Tangents"), wiki("Chord"), wiki("Arc"), book("AoPS Volume 1, ch. 15-16; Intro to Geometry ch. 9-11"), yt("power of a point AMC 10"), ALCUMUS],
  "geo-coordinate": [wiki("Coordinate_geometry"), wiki("Distance_formula"), wiki("Slope"), wiki("Midpoint"), wiki("Reflection"), book("AoPS Volume 1, ch. 17; Intro to Geometry ch. 17"), yt("coordinate geometry AMC 10"), ALCUMUS],
  "geo-polygons": [wiki("Polygon"), wiki("Regular_polygon"), wiki("Cyclic_quadrilateral"), wiki("Hexagon"), wiki("Parallelogram"), book("Intro to Geometry ch. 8, 12-13"), yt("regular hexagon cyclic quadrilateral AMC 10"), ALCUMUS],
  "geo-solid": [wiki("Volume"), wiki("Surface_area"), wiki("Cube_(geometry)", "Cube"), wiki("Sphere"), wiki("Cone"), wiki("Cylinder"), book("AoPS Volume 1, ch. 18; Intro to Geometry ch. 14-15"), yt("3D geometry AMC 10"), ALCUMUS],
  "geo-trig": [wiki("Trigonometry"), wiki("Law_of_Sines"), wiki("Law_of_Cosines"), wiki("Mass_points", "Mass points"), wiki("Ptolemy%27s_Theorem", "Ptolemy's theorem"), book("Intro to Geometry ch. 18-19; Precalculus ch. 1-4"), yt("law of cosines AMC 10"), ALCUMUS],

  "nt-divisibility": [wiki("Prime_number"), wiki("Divisibility"), wiki("Divisor", "Divisors and the divisor function"), wiki("Prime_factorization"), wiki("Composite_number"), book("AoPS Volume 1, ch. 5; Intro to Number Theory ch. 1-5"), cat("Introductory_Number_Theory_Problems", "AoPS wiki: introductory number theory problems"), yt("number of divisors AMC 10"), ALCUMUS],
  "nt-gcd-lcm": [wiki("Greatest_common_divisor"), wiki("Least_common_multiple"), wiki("Euclidean_algorithm"), wiki("Relatively_prime"), book("Intro to Number Theory ch. 6-7"), yt("Euclidean algorithm gcd lcm AMC 10"), ALCUMUS],
  "nt-modular": [wiki("Modular_arithmetic/Introduction", "Modular arithmetic: introduction"), wiki("Modular_arithmetic/Intermediate", "Modular arithmetic: intermediate"), wiki("Units_digit"), wiki("Chinese_Remainder_Theorem"), wiki("Fermat%27s_Little_Theorem", "Fermat's little theorem"), book("Intro to Number Theory ch. 12-15"), yt("modular arithmetic AMC 10"), ALCUMUS],
  "nt-bases": [wiki("Base_numbers"), wiki("Divisibility_rules"), wiki("Digit"), wiki("Palindrome"), book("Intro to Number Theory ch. 8-11"), yt("base conversion divisibility rules AMC 10"), ALCUMUS],
  "nt-diophantine": [wiki("Diophantine_equation"), wiki("Simon%27s_Favorite_Factoring_Trick", "Simon's Favorite Factoring Trick"), wiki("Chicken_McNugget_Theorem"), wiki("Perfect_square"), wiki("Linear_Diophantine_equation"), book("Intro to Number Theory ch. 16; Intermediate ch. 8"), yt("Diophantine equations AMC 10"), ALCUMUS],
  "nt-factorials-powers": [wiki("Factorial"), wiki("Legendre%27s_Formula", "Legendre's formula"), wiki("Trailing_zeroes"), wiki("Wilson%27s_Theorem", "Wilson's theorem"), wiki("Chinese_Remainder_Theorem"), book("Intro to Number Theory ch. 13, 15"), yt("trailing zeros factorial AMC 10"), ALCUMUS],

  "cp-counting-basics": [wiki("Combinatorics/Introduction", "Combinatorics: introduction"), wiki("Permutation"), wiki("Combination"), wiki("Overcounting"), wiki("Constructive_counting"), book("AoPS Volume 1, ch. 19; Intro to Counting & Probability ch. 1-5"), cat("Introductory_Combinatorics_Problems", "AoPS wiki: introductory counting problems"), yt("permutations combinations AMC 10"), ALCUMUS, KHAN("math/precalculus/x9e81a4f98389efdf:prob-comb", "combinatorics")],
  "cp-casework": [wiki("Casework"), wiki("Complementary_counting"), wiki("Constructive_counting"), book("Intro to Counting & Probability ch. 2-3"), yt("casework complementary counting AMC 10"), ALCUMUS],
  "cp-stars-bars": [wiki("Ball-and-urn", "Stars and bars (ball-and-urn)"), wiki("Principle_of_Inclusion-Exclusion"), wiki("Distinguishability"), wiki("Venn_diagram"), book("Intro to Counting & Probability ch. 6, 13"), yt("stars and bars inclusion exclusion AMC 10"), ALCUMUS],
  "cp-probability": [wiki("Probability"), wiki("Conditional_probability"), wiki("Independent_events"), wiki("Geometric_probability"), book("AoPS Volume 1, ch. 20; Intro to Counting & Probability ch. 7-11"), yt("probability AMC 10"), ALCUMUS, KHAN("math/statistics-probability/probability-library", "probability")],
  "cp-expected": [wiki("Expected_value"), wiki("Geometric_probability"), wiki("Linearity_of_expectation"), wiki("Principle_of_Inclusion-Exclusion"), book("Intro to Counting & Probability ch. 12-13"), yt("expected value AMC 10"), ALCUMUS],
  "cp-paths-recursion": [wiki("Recursion"), wiki("Fibonacci_sequence"), wiki("Block_walking", "Block walking (grid paths)"), wiki("Bijection"), wiki("Pascal%27s_Triangle", "Pascal's triangle"), book("Intro to Counting & Probability ch. 14-16; Intermediate Counting ch. 1-3"), yt("recursion grid paths AMC 10"), ALCUMUS],
};

// Past-paper problem sets on the AoPS wiki, grouped by where a skill usually lands on
// the paper. Every AMC 10 since 2002 has a "Problems" page with per-problem solution pages.
export const PAST_PAPERS: Resource[] = [
  { label: "AMC 10 problems & solutions index (all years)", url: "https://artofproblemsolving.com/wiki/index.php/AMC_10_Problems_and_Solutions", kind: "problems" },
  { label: "AMC 8 problems & solutions (easier warm-ups)", url: "https://artofproblemsolving.com/wiki/index.php/AMC_8_Problems_and_Solutions", kind: "problems" },
  { label: "AoPS Contest Collections (searchable by contest)", url: "https://artofproblemsolving.com/community/c3158_usa_contests", kind: "problems" },
  { label: "MAA AMC 10 official page (dates, registration)", url: "https://maa.org/student-programs/amc/", kind: "problems" },
];

export function resourcesFor(skillId: string): Resource[] {
  return RESOURCES[skillId] ?? [];
}
