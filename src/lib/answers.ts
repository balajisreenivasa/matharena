// Answer matching for free-response problems.
//
// The bank stores answers as LaTeX from \boxed{...}: "\frac{25\pi}{2}", "\mbox{Saturday}",
// "2 \text{ euros}", "10\frac{1}{12}", "(3, -1)", "\sqrt{2}+1", "0.4\mbox{ miles}".
// A 13-year-old types "25pi/2", "saturday", "2", "10 1/12", "(3,-1)", "sqrt2+1", ".4".
// So: normalize both sides, evaluate anything numeric with a tiny LaTeX-aware expression
// parser (no eval), compare numerically; otherwise compare the words. Units in the
// expected answer are optional in the given one. Shared by the client (instant
// feedback / live preview) and the API (authoritative grading).

export function normalize(s: string): string {
  return s
    .trim()
    .replace(/^\$+|\$+$/g, "")
    .replace(/\\left|\\right|\\displaystyle|\\!|\\,|\\;|\\:|\\quad|\\qquad/g, "")
    .replace(/\\[dt]frac/g, "\\frac")
    .replace(/\\(mbox|textbf|textit|mathrm|mathbf|operatorname)\s*\{/g, "\\text{")
    .replace(/\\%/g, "%")
    .replace(/\\\$/g, "")
    .replace(/\^\s*\{?\\circ\}?|\\circ|°|\\degree/g, "")
    .replace(/\s+/g, " ")
    .replace(/\.$/, "")
    .toLowerCase();
}

// ---------------------------------------------------------------------------
// Words vs. math
// ---------------------------------------------------------------------------

const NUMBER_WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
  thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100, thousand: 1000,
};

// Pull the prose out: contents of \text{...} plus any bare alphabetic runs that are not
// LaTeX commands or the math words the evaluator understands.
const MATH_WORDS = new Set(["pi", "sqrt", "frac", "cdot", "times", "div", "infty", "e", "i"]);

function splitWordsAndMath(s: string): { words: string[]; math: string } {
  const words: string[] = [];
  let math = s;
  // \text{...} with nested braces is rare in answers; a simple non-greedy pass is enough.
  // A unit's exponent ("inches}^2", "m}^3") belongs to the unit, not the number.
  math = math.replace(/\\text\s*\{([^{}]*)\}(?:\s*\^\s*(?:\{[^{}]*\}|\S))?/g, (_, w: string) => {
    words.push(...w.trim().split(/\s+/).filter(Boolean));
    return " ";
  });
  // Bare alphabetic runs (e.g. "saturday", "even", "cm", "x") outside commands.
  math = math.replace(/(^|[^\\a-z])([a-z]{2,})(?![a-z])/g, (m, pre: string, w: string) => {
    if (MATH_WORDS.has(w)) return m;
    words.push(w);
    return pre + " ";
  });
  return { words: words.map((w) => w.replace(/[^a-z0-9^]/g, "")).filter(Boolean), math: math.trim() };
}

// Words that are just units/labels when a number is present ("euros", "inches^2", "m^3").
function isUnitLike(w: string): boolean {
  return !(w in NUMBER_WORDS) && !["even", "odd", "true", "false", "yes", "no", "none", "infinite", "infinitely"].includes(w);
}

// ---------------------------------------------------------------------------
// Numeric evaluation of LaTeX-lite expressions
// ---------------------------------------------------------------------------

// Replace \frac{A}{B} (any nesting) with ((A)/(B)); \sqrt[n]{A}, \sqrt{A}; \pi etc.
function latexToExpr(src: string): string {
  let s = src;
  s = s.replace(/(^|[^\d.\w])(\d+)\s+(\d+)\s*\/\s*(\d+)(?!\d)/g, "$1($2+($3/$4))"); // typed mixed number: 10 1/12
  s = s.replace(/\\frac\s*(\d)\s*(\d)/g, "\\frac{$1}{$2}"); // \frac94
  s = s.replace(/\\sqrt\s*(\d+)/g, "\\sqrt{$1}"); // \sqrt2

  const braced = (str: string, from: number): [string, number] | null => {
    if (str[from] !== "{") return null;
    let depth = 0;
    for (let i = from; i < str.length; i++) {
      if (str[i] === "{") depth++;
      else if (str[i] === "}") {
        depth--;
        if (depth === 0) return [str.slice(from + 1, i), i + 1];
      }
    }
    return null;
  };

  // Iteratively rewrite the innermost-first is not needed: recursion on the arguments handles nesting.
  const rewrite = (str: string): string => {
    let out = "";
    let i = 0;
    while (i < str.length) {
      if (str.startsWith("\\frac", i)) {
        let j = i + 5;
        while (str[j] === " ") j++;
        const a = braced(str, j);
        if (!a) { out += str[i]; i++; continue; }
        let k = a[1];
        while (str[k] === " ") k++;
        const b = braced(str, k);
        if (!b) { out += str[i]; i++; continue; }
        // Mixed number: a bare integer immediately before \frac means addition (10\frac{1}{12}).
        const mixed = /(\d+)\s*$/.exec(out);
        if (mixed && !/[a-z)\]]\s*$/.test(out.slice(0, mixed.index))) {
          out = out.slice(0, mixed.index) + `(${mixed[1]}+((${rewrite(a[0])})/(${rewrite(b[0])})))`;
        } else {
          out += `((${rewrite(a[0])})/(${rewrite(b[0])}))`;
        }
        i = b[1];
        continue;
      }
      if (str.startsWith("\\sqrt", i)) {
        let j = i + 5;
        let n: string | null = null;
        if (str[j] === "[") {
          const end = str.indexOf("]", j);
          if (end !== -1) { n = str.slice(j + 1, end); j = end + 1; }
        }
        const a = braced(str, j);
        if (!a) { out += str[i]; i++; continue; }
        out += n ? `((${rewrite(a[0])})^(1/(${rewrite(n)})))` : `sqrt(${rewrite(a[0])})`;
        i = a[1];
        continue;
      }
      if (str[i] === "{") { out += "("; i++; continue; }
      if (str[i] === "}") { out += ")"; i++; continue; }
      out += str[i];
      i++;
    }
    return out;
  };

  s = rewrite(s);
  s = s.replace(/\\pi/g, "pi").replace(/\\cdot|\\times/g, "*").replace(/\\div/g, "/").replace(/\\/g, "");
  s = s.replace(/(\d),(\d{3})(?!\d)/g, "$1$2"); // thousands separators: 42,409
  s = s.replace(/%/g, "");
  return s.replace(/\s+/g, "");
}

type Tok = { t: "num"; v: number } | { t: "op"; v: string } | { t: "pi" } | { t: "sqrt" } | { t: "lp" } | { t: "rp" };

function tokenize(s: string): Tok[] | null {
  const toks: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\d|\./.test(c)) {
      const m = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i));
      if (!m) return null;
      toks.push({ t: "num", v: parseFloat(m[1]) });
      i += m[1].length;
      continue;
    }
    if (s.startsWith("sqrt", i)) { toks.push({ t: "sqrt" }); i += 4; continue; }
    if (s.startsWith("pi", i)) { toks.push({ t: "pi" }); i += 2; continue; }
    if ("+-*/^".includes(c)) { toks.push({ t: "op", v: c }); i++; continue; }
    if (c === "(" || c === "[") { toks.push({ t: "lp" }); i++; continue; }
    if (c === ")" || c === "]") { toks.push({ t: "rp" }); i++; continue; }
    return null; // anything else (letters, commas) means not a plain number
  }
  return toks;
}

// Recursive descent with implicit multiplication (2pi, 3sqrt(2), 2(3+1)).
function evaluate(toks: Tok[]): number | null {
  let p = 0;
  const peek = () => toks[p];
  const isValueStart = (t?: Tok) => !!t && (t.t === "num" || t.t === "pi" || t.t === "sqrt" || t.t === "lp");

  const expr = (): number | null => {
    let v = term();
    if (v === null) return null;
    while (peek()?.t === "op" && ((peek() as any).v === "+" || (peek() as any).v === "-")) {
      const op = (toks[p++] as any).v;
      const r = term();
      if (r === null) return null;
      v = op === "+" ? v + r : v - r;
    }
    return v;
  };
  const term = (): number | null => {
    let v = unary();
    if (v === null) return null;
    for (;;) {
      const t = peek();
      if (t?.t === "op" && ((t as any).v === "*" || (t as any).v === "/")) {
        p++;
        const r = unary();
        if (r === null) return null;
        v = (t as any).v === "*" ? v * r : r === 0 ? NaN : v / r;
      } else if (isValueStart(t)) {
        const r = unary();
        if (r === null) return null;
        v = v * r;
      } else break;
    }
    return v;
  };
  const unary = (): number | null => {
    if (peek()?.t === "op" && (peek() as any).v === "-") { p++; const v = unary(); return v === null ? null : -v; }
    if (peek()?.t === "op" && (peek() as any).v === "+") { p++; return unary(); }
    return power();
  };
  const power = (): number | null => {
    const base = atom();
    if (base === null) return null;
    if (peek()?.t === "op" && (peek() as any).v === "^") {
      p++;
      const e = unary();
      if (e === null) return null;
      return Math.pow(base, e);
    }
    return base;
  };
  const atom = (): number | null => {
    const t = toks[p];
    if (!t) return null;
    if (t.t === "num") { p++; return t.v; }
    if (t.t === "pi") { p++; return Math.PI; }
    if (t.t === "sqrt") {
      p++;
      const a = peek()?.t === "lp" ? group() : atom();
      return a === null || a < 0 ? null : Math.sqrt(a);
    }
    if (t.t === "lp") return group();
    return null;
  };
  const group = (): number | null => {
    if (peek()?.t !== "lp") return null;
    p++;
    const v = expr();
    if (v === null || peek()?.t !== "rp") return null;
    p++;
    return v;
  };
  const v = expr();
  if (v === null || p !== toks.length || !Number.isFinite(v)) return null;
  return v;
}

export function evalNumber(math: string): number | null {
  if (!math.trim()) return null;
  const toks = tokenize(latexToExpr(math));
  return toks ? evaluate(toks) : null;
}

// Split "a, b" or "(a, b)" at top-level commas into parts; returns null when there is
// no top-level comma. Outer parens are stripped so pairs and lists both work.
function splitList(math: string): { parts: string[]; tuple: boolean } | null {
  let s = math.trim();
  let tuple = false;
  if (/^\(.*\)$/.test(s) || /^\[.*\]$/.test(s)) {
    // Only strip when the outer brackets wrap the whole thing.
    let depth = 0, wraps = true;
    for (let i = 0; i < s.length; i++) {
      if ("([{".includes(s[i])) depth++;
      else if (")]}".includes(s[i])) depth--;
      if (depth === 0 && i < s.length - 1) { wraps = false; break; }
    }
    if (wraps) { s = s.slice(1, -1); tuple = true; }
  }
  const parts: string[] = [];
  let depth = 0, cur = "";
  for (const ch of s) {
    if ("([{".includes(ch)) depth++;
    else if (")]}".includes(ch)) depth--;
    if (ch === "," && depth === 0) { parts.push(cur); cur = ""; } else cur += ch;
  }
  parts.push(cur);
  if (parts.length < 2) return null;
  return { parts: parts.map((x) => x.trim()), tuple };
}

const close = (a: number, b: number) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));

function stripAssignment(s: string): string {
  // "k = -33/2" -> "-33/2"; "x=5" -> "5"
  return s.replace(/^[a-z]\s*=\s*/i, "");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function answersMatch(given: string, expected: string): boolean {
  const a = stripAssignment(normalize(given));
  const b = stripAssignment(normalize(expected));
  if (!a) return false;
  if (a === b) return true;

  const A = splitWordsAndMath(a);
  const B = splitWordsAndMath(b);

  // Lists / tuples: (3, -1), "-2, 2"
  const la = splitList(A.math);
  const lb = splitList(B.math);
  if (lb) {
    if (!la || la.parts.length !== lb.parts.length) return false;
    const na = la.parts.map(evalNumber);
    const nb = lb.parts.map(evalNumber);
    if (na.every((x) => x !== null) && nb.every((x) => x !== null)) {
      const xa = na as number[], xb = nb as number[];
      if (lb.tuple) return xa.every((x, i) => close(x, xb[i]));
      const sa = [...xa].sort((x, y) => x - y), sb = [...xb].sort((x, y) => x - y);
      return sa.every((x, i) => close(x, sb[i]));
    }
    return la.parts.map((x) => x.replace(/\s/g, "")).join(",") === lb.parts.map((x) => x.replace(/\s/g, "")).join(",");
  }

  const na = evalNumber(A.math);
  const nb = evalNumber(B.math);
  const wordsA = A.words.map((w) => (w in NUMBER_WORDS ? String(NUMBER_WORDS[w]) : w));
  const wordsB = B.words.map((w) => (w in NUMBER_WORDS ? String(NUMBER_WORDS[w]) : w));

  // Both numeric: units on either side are optional, but if both give words they must agree
  // (so "3 hours" vs "3 minutes" is wrong while "3" vs "3 hours" is fine).
  if (na !== null && nb !== null) {
    if (!close(na, nb)) return false;
    const ua = wordsA.filter(isUnitLike), ub = wordsB.filter(isUnitLike);
    if (ua.length && ub.length) return ua.join(" ") === ub.join(" ");
    return true;
  }

  // Expected is a number word ("four") and given is a number, or vice versa.
  if (nb !== null && na === null && !A.math.trim() && wordsA.length === 1 && /^\d+$/.test(wordsA[0])) return close(parseInt(wordsA[0], 10), nb);
  if (na !== null && nb === null && !B.math.trim() && wordsB.length === 1 && /^\d+$/.test(wordsB[0])) return close(na, parseInt(wordsB[0], 10));

  // Pure words: "even", "saturday", "no".
  if (wordsA.length && wordsB.length && !A.math.trim() && !B.math.trim()) return wordsA.join(" ") === wordsB.join(" ");

  // Fallback: symbolic form with spaces/braces/backslashes flattened ("\sqrt{2}+1" vs "sqrt(2)+1").
  const flat = (s: string) => latexToExpr(s).replace(/[()]/g, "");
  return flat(a) === flat(b);
}

export function gradeAnswer(selected: string, answer: string, isMultipleChoice: boolean): boolean {
  if (isMultipleChoice) return selected.trim().toUpperCase() === answer.trim().toUpperCase();
  return answersMatch(selected, answer);
}

// For the live preview: turn what the student typed into LaTeX KaTeX can render.
export function typedToLatex(s: string): string {
  let t = s.trim();
  if (!t) return "";
  if (/\\(frac|sqrt|pi|text)/.test(t)) return t; // already LaTeX
  t = t.replace(/\bsqrt\s*\(([^()]*)\)/g, "\\sqrt{$1}").replace(/\bsqrt\s*(\d+)/g, "\\sqrt{$1}");
  t = t.replace(/\bpi\b/g, "\\pi");
  t = t.replace(/(\d+)\s+(\d+)\/(\d+)/g, "$1\\frac{$2}{$3}"); // mixed number 10 1/12
  t = t.replace(/(\([^()]*\)|[\d.]+|\\pi|\\sqrt\{[^{}]*\})\/(\([^()]*\)|[\d.]+|\\pi|\\sqrt\{[^{}]*\})/g, (_, n: string, d: string) => `\\frac{${n.replace(/^\((.*)\)$/, "$1")}}{${d.replace(/^\((.*)\)$/, "$1")}}`);
  t = t.replace(/\*/g, "\\cdot ");
  t = t.replace(/\^(\d\d+)/g, "^{$1}");
  if (/^[a-z ]+$/i.test(t)) return `\\text{${t}}`;
  return t;
}
