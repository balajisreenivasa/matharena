// LaTeX handling for the question bank: tokenize prose vs. math, repair the TeX
// KaTeX cannot parse, and turn text-mode markup into something renderable.
//
// The bank is transcribed from three corpora (MATH, AIME, NuminaMath) whose LaTeX was
// written for a full TeX engine, not KaTeX. Everything here is a pure string transform
// so it can run in the browser, on the server, in the mail renderer and in unit checks.
//
//   splitMath(text)  -> Segment[]     prose / math / diagram / breaks / styled runs
//   normalizeTex(tex) -> string       rewrite unsupported commands before KaTeX
//   KATEX_MACROS                      macros KaTeX lacks (\lcm, \mbox, \cancelto ...)
//
// Diagrams: an Asymptote figure is rendered offline (scripts/render-diagrams.ts) and
// the statement carries a marker "[[diagram:/diagrams/<hash>.svg]]" where the figure
// belongs. The tokenizer emits it as an { img } segment.

export type Segment =
  | { text: string }
  | { tex: string; display: boolean }
  | { img: string }
  | { br: true }
  | { para: true }
  | { style: "b" | "i" | "u" | "tt"; children: Segment[] };

export const DIAGRAM_MARKER = /\[\[diagram:([^\]\s]+)\]\]/g;

// Math environments KaTeX can render. A bare \begin{align*}...\end{align*} with no
// surrounding $ or \[ is common in the MATH corpus (~20% of solutions) and must be
// treated as display math, or it renders as raw source. Longest-first so "align*"
// is matched before "align".
const MATH_ENVS = [
  "align*", "align", "aligned", "alignat*", "alignat",
  "gathered", "gather*", "gather", "equation*", "equation",
  "multline*", "multline", "split", "cases", "rcases", "dcases",
  "smallmatrix", "pmatrix", "bmatrix", "Bmatrix", "vmatrix", "Vmatrix", "matrix",
  "array", "CD", "eqnarray*", "eqnarray",
];

// Text-mode wrappers that become styled runs; \text-like ones just unwrap.
const STYLE_CMDS: Record<string, "b" | "i" | "u" | "tt" | null> = {
  textbf: "b", bf: "b", mathbf: "b",
  textit: "i", emph: "i", it: "i", textsl: "i",
  underline: "u",
  texttt: "tt",
  text: null, textrm: null, textnormal: null, mbox: null, textup: null, textsc: null, mathrm: null, ensuremath: null,
};

// Commands that only carry TeX layout and mean nothing on a web page.
const DROP_WITH_ARG = /^\\(vspace\*?|hspace\*?|label|setlength|rule|parbox|fontsize|hphantom|vphantom|phantom|includegraphics)\s*(\[[^\]]*\])?\s*\{/;
const DROP_BARE = /^\\(noindent|centering|raggedright|raggedleft|smallskip|medskip|bigskip|hfill|vfill|newpage|clearpage|linebreak|nolinebreak|par|displaystyle|textstyle|scriptstyle|small|large|Large|LARGE|huge|Huge|tiny|footnotesize|scriptsize|normalsize|bfseries|itshape|rmfamily|sffamily|ttfamily|boldmath|unboldmath|allowbreak|relax|,|;|!|>|:|@)(?![a-zA-Z])/;

function findEnvEnd(text: string, env: string, from: number): number {
  const open = `\\begin{${env}}`;
  const close = `\\end{${env}}`;
  let depth = 1;
  let i = from;
  while (i < text.length) {
    const nextOpen = text.indexOf(open, i);
    const nextClose = text.indexOf(close, i);
    if (nextClose === -1) return -1;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      i = nextOpen + open.length;
      continue;
    }
    depth--;
    if (depth === 0) return nextClose + close.length;
    i = nextClose + close.length;
  }
  return -1;
}

// Index of the matching close brace for the "{" at `open`, or -1.
export function matchBrace(text: string, open: number): number {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    const ch = text[i];
    if (ch === "\\") { i++; continue; }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

// Find the closing "$" for an inline formula opened at `open`, skipping "\$".
// A formula never spans a blank line: a lone "$" (a price) followed by a paragraph
// break and another "$" later is two literal dollar signs, not one formula.
function findInlineClose(text: string, open: number): number {
  let i = open + 1;
  while (i < text.length) {
    const ch = text[i];
    if (ch === "\\") { i += 2; continue; }
    if (ch === "$") return i;
    if (ch === "\n" && /^\n\s*\n/.test(text.slice(i))) return -1;
    i++;
  }
  return -1;
}

function findDisplayClose(text: string, open: number, close: string): number {
  let i = open;
  while (i < text.length) {
    if (text[i] === "\\" && close !== "\\]" ) { i += 2; continue; }
    if (text.startsWith(close, i)) return i;
    i++;
  }
  return -1;
}

// ---------------------------------------------------------------------------
// tabular -> array
// ---------------------------------------------------------------------------

// A tabular cell is text mode: "$x$ & Row 1: & 12" -> "x & \text{Row 1:} & 12".
function cellToMath(cell: string): string {
  const parts = cell.split(/(?<!\\)\$/);
  let out = "";
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (i % 2 === 1) { out += p; continue; }
    const t = p.replace(/\s+/g, " ").trim();
    if (!t) continue;
    // Numbers and operators are the same in text and math mode; words need \text.
    if (/^[\d\s.,+\-*/=<>()%:!?]+$/.test(t)) { out += t; continue; }
    // Keep TeX commands (\hline, \textbf{..}, \underline{..}) working inside \text.
    if (/^\\(hline|cline)/.test(t)) { out += t; continue; }
    out += t.replace(/^(\\hline\s*)?([^\\]+?)(\s*\\hline)?$/, (_m, pre = "", body: string, post = "") => `${pre}${body.trim() ? `\\text{${body.trim()}}` : ""}${post}`);
  }
  return out.trim();
}

export function tabularToArray(spec: string, body: string): string {
  const cols = normalizeColSpec(spec);
  const rows = body.split(/\\\\/);
  const conv = rows.map((row) => row.split(/(?<!\\)&/).map(cellToMath).join(" & ")).join(" \\\\ ");
  return `\\begin{array}{${cols}}${conv}\\end{array}`;
}

// KaTeX array column specs support l c r | and ||, nothing else.
export function normalizeColSpec(spec: string): string {
  let s = spec.replace(/@\{[^}]*\}/g, "").replace(/!\{[^}]*\}/g, "").replace(/p\{[^}]*\}/g, "l").replace(/[mb]\{[^}]*\}/g, "l");
  // *{3}{c} -> ccc
  s = s.replace(/\*\{(\d+)\}\{([^}]*)\}/g, (_m, n: string, x: string) => x.repeat(parseInt(n, 10)));
  return s.replace(/[^lcr|]/g, "");
}

function convertTabulars(text: string): string {
  let out = "";
  let i = 0;
  const open = "\\begin{tabular}";
  while (i < text.length) {
    const at = text.indexOf(open, i);
    if (at === -1) { out += text.slice(i); break; }
    out += text.slice(i, at);
    let j = at + open.length;
    // optional [pos] then {spec}
    const opt = /^\s*\[[^\]]*\]/.exec(text.slice(j));
    if (opt) j += opt[0].length;
    const bo = text.indexOf("{", j);
    const bc = bo === -1 ? -1 : matchBrace(text, bo);
    const end = findEnvEnd(text, "tabular", j);
    if (bo === -1 || bc === -1 || end === -1) { out += text.slice(at, at + open.length); i = at + open.length; continue; }
    const spec = text.slice(bo + 1, bc);
    const body = text.slice(bc + 1, end - "\\end{tabular}".length);
    // If we are already inside math the caller strips the wrapper; here we always
    // emit display math and let the math tokenizer pick it up.
    out += `\\[${tabularToArray(spec, body)}\\]`;
    i = end;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Math normalization (runs on every formula before KaTeX)
// ---------------------------------------------------------------------------

export const KATEX_MACROS: Record<string, string> = {
  "\\lcm": "\\operatorname{lcm}",
  "\\arccot": "\\operatorname{arccot}",
  "\\arcsec": "\\operatorname{arcsec}",
  "\\arccsc": "\\operatorname{arccsc}",
  "\\sech": "\\operatorname{sech}",
  "\\csch": "\\operatorname{csch}",
  "\\cis": "\\operatorname{cis}",
  "\\tr": "\\operatorname{tr}",
  "\\mbox": "\\text{#1}",
  "\\emph": "\\textit{#1}",
  "\\cancelto": "\\overset{#1}{\\cancel{#2}}",
  "\\textnormal": "\\text{#1}",
  "\\ensuremath": "#1",
  "\\R": "\\mathbb{R}",
  "\\Z": "\\mathbb{Z}",
  "\\N": "\\mathbb{N}",
  "\\Q": "\\mathbb{Q}",
  "\\C": "\\mathbb{C}",
  "\\dg": "^\\circ",
  "\\textdegree": "^\\circ",
  "\\qed": "\\blacksquare",
  "\\ol": "\\overline{#1}",
  "\\ul": "\\underline{#1}",
  "\\tfrac": "\\frac{#1}{#2}",
  "\\overarc": "\\overset{\\frown}{#1}",
  "\\textsc": "\\text{#1}",
  "\\cent": "\\text{¢}",
  "\\leftroot": "",
  "\\uproot": "",
  "\\biggm": "\\big",
  "\\O": "\\emptyset",
  "\\textdollar": "\\$",
};

// Replace \multicolumn{n}{spec}{content} with content padded by n-1 empty cells.
function fixMulticolumn(tex: string): string {
  let out = tex;
  for (let guard = 0; guard < 200; guard++) {
    const m = /\\multicolumn\s*\{(\d+)\}\s*\{[^}]*\}\s*\{/.exec(out);
    if (!m) break;
    const bo = m.index + m[0].length - 1;
    const bc = matchBrace(out, bo);
    if (bc === -1) break;
    const n = Math.max(1, parseInt(m[1], 10));
    const content = out.slice(bo + 1, bc);
    out = out.slice(0, m.index) + content + " &".repeat(n - 1) + out.slice(bc + 1);
  }
  return out;
}

// \root n \of {x} -> \sqrt[n]{x}, innermost first so nesting works.
function fixRoot(tex: string): string {
  let t = tex;
  for (let guard = 0; guard < 50; guard++) {
    const m = /\\root\s*(\{[^{}]*\}|[^\\{}]+?)\s*\\of\s*/.exec(t);
    if (!m) break;
    const at = m.index + m[0].length;
    let arg: string;
    let end: number;
    if (t[at] === "{") {
      end = matchBrace(t, at);
      if (end === -1) break;
      arg = t.slice(at + 1, end);
      end += 1;
    } else {
      const tok = /^\\[a-zA-Z]+(\{[^}]*\})?|^\S/.exec(t.slice(at));
      if (!tok) break;
      arg = tok[0];
      end = at + tok[0].length;
    }
    t = t.slice(0, m.index) + `\\sqrt[${m[1].trim().replace(/^\{|\}$/g, "")}]{${arg}}` + t.slice(end);
  }
  return t;
}

const TEXT_GROUP = /\\(?:text|textbf|textit|textrm|textsf|texttt|textnormal|mbox|mathrm|textsc|textup|emph)\s*\{/g;

function escapeDollarsOutsideText(tex: string): string {
  if (!tex.includes("$")) return tex;
  // Ranges covered by text-mode groups (balanced braces).
  const skip: [number, number][] = [];
  let m: RegExpExecArray | null;
  TEXT_GROUP.lastIndex = 0;
  while ((m = TEXT_GROUP.exec(tex))) {
    const bo = m.index + m[0].length - 1;
    const bc = matchBrace(tex, bo);
    if (bc !== -1) skip.push([bo, bc]);
  }
  let out = "";
  for (let i = 0; i < tex.length; i++) {
    const ch = tex[i];
    if (ch === "\\") { out += ch + (tex[i + 1] ?? ""); i++; continue; }
    if (ch === "$" && !skip.some(([a, b]) => i > a && i < b)) { out += "\\$"; continue; }
    out += ch;
  }
  return out;
}

// Remove \cmd{...} with balanced braces (\noalign{..}, \renewcommand{..}{..}).
function dropBraced(tex: string, re: RegExp, argc = 1): string {
  let t = tex;
  for (let guard = 0; guard < 200; guard++) {
    const m = re.exec(t);
    if (!m) break;
    let at = m.index + m[0].length;
    let end = at;
    for (let k = 0; k < argc; k++) {
      const ws = /^\s*/.exec(t.slice(end))![0].length;
      const bo = end + ws;
      if (t[bo] !== "{") break;
      const bc = matchBrace(t, bo);
      if (bc === -1) { end = -1; break; }
      end = bc + 1;
    }
    if (end === -1) break;
    t = t.slice(0, m.index) + " " + t.slice(end);
  }
  return t;
}

// Column specs of array environments inside math (balanced: "c@{}c" has braces).
function fixArraySpecs(tex: string): string {
  let t = tex;
  let from = 0;
  for (let guard = 0; guard < 200; guard++) {
    const at = t.indexOf("\\begin{array}", from);
    if (at === -1) break;
    let j = at + "\\begin{array}".length;
    const opt = /^\s*\[[^\]]*\]/.exec(t.slice(j));
    if (opt) j += opt[0].length;
    const ws = /^\s*/.exec(t.slice(j))![0].length;
    const bo = j + ws;
    if (t[bo] !== "{") { from = j; continue; }
    const bc = matchBrace(t, bo);
    if (bc === -1) break;
    const spec = normalizeColSpec(t.slice(bo + 1, bc));
    t = t.slice(0, at) + `\\begin{array}{${spec}}` + t.slice(bc + 1);
    from = at + "\\begin{array}{}".length + spec.length;
  }
  return t;
}

// A tabular that sits inside math: cells are text mode there too.
function fixTabularInMath(tex: string): string {
  if (!tex.includes("\\begin{tabular}")) return tex;
  const conv = convertTabulars(tex);
  return conv.replace(/\\\[(\\begin\{array\}[\s\S]*?\\end\{array\})\\\]/g, "$1");
}

export function normalizeTex(tex: string): string {
  let t = tex;
  // Row spacing: "\\[-9pt]", "\\ [0.5ex]" (KaTeX accepts the spacing only when glued on).
  t = t.replace(/\\\\\s*\[\s*-?[\d.]+\s*(?:pt|ex|em|cm|mm|in)\s*\]/g, "\\\\");
  // Nested display delimiters inside $$...$$ or \[...\] are a transcription slip.
  t = t.replace(/(?<!\\)\\\[|(?<!\\)\\\]/g, " ");
  t = t.replace(/(?<!\\)\$\$/g, " ");
  // Inline delimiters nested inside display math are a transcription slip.
  t = t.replace(/(?<!\\)\\\(|(?<!\\)\\\)/g, " ");
  // A bare "$" inside a formula is a currency sign ("\text{lost }$900") — except
  // inside \text{...}, where "$" legitimately re-enters math mode.
  t = escapeDollarsOutsideText(t);
  t = fixTabularInMath(t);
  t = fixArraySpecs(t);
  t = fixMulticolumn(t);
  t = fixRoot(t);
  t = dropBraced(t, /\\noalign\s*/);
  t = dropBraced(t, /\\renewcommand\s*\{\\arraystretch\}\s*/);
  t = dropBraced(t, /\\(?:renewcommand|newcommand|setlength|vspace\*?|label|tag\*?|hphantom|vphantom)\s*/, 1);
  t = t.replace(/\\centerline\s*\{/g, "{");
  t = t
    .replace(/\\usepackage\s*(\[[^\]]*\])?\s*\{[^}]*\}/g, " ")
    // Transcription slips: "\hlinex<2" meant "\hline x<2"; "\text{[.1cm]}" meant "\\[.1cm]".
    .replace(/\\hline(?=[a-zA-Z0-9<>(-])/g, "\\hline ")
    .replace(/\\text\{\[[\d.]+\s*(?:cm|pt|ex|em|in|mm)\]\}/g, " ");
  t = t
    // align/gather cannot nest inside display math; their inner forms can.
    .replace(/\\begin\{(align|gather|eqnarray|alignat|multline)\*?\}/g, (_m, e: string) => (e === "gather" || e === "multline" ? "\\begin{gathered}" : "\\begin{aligned}"))
    .replace(/\\end\{(align|gather|eqnarray|alignat|multline)\*?\}/g, (_m, e: string) => (e === "gather" || e === "multline" ? "\\end{gathered}" : "\\end{aligned}"))
    // eqnarray has three columns (r c l); aligned wants two -> drop the middle &.
    .replace(/&\s*(=|<|>|\\le|\\ge|\\leq|\\geq|\\equiv|\\approx|\\neq|\\ne)\s*&/g, "&$1")
    .replace(/\\cline\s*\{[^}]*\}/g, "")
    .replace(/\\(noindent|indent|centering|hfill|vfill|smallskip|medskip|bigskip|displaystyle|par|allowbreak|nonumber|notag|relax|linebreak|nolinebreak|newline)(?![a-zA-Z])/g, (m, c: string) => (c === "hfill" ? "\\quad " : c === "newline" ? "\\\\" : c === "displaystyle" ? m : " "))
    .replace(/\\(bfseries|itshape|rmfamily|sffamily|ttfamily|boldmath|unboldmath|scriptstyle|textstyle)(?![a-zA-Z])/g, " ")
    // \textbf{\large X} etc.: KaTeX has the size commands but not inside \text in
    // every version; sizes carry nothing here anyway.
    .replace(/\\(tiny|scriptsize|footnotesize|small|normalsize|large|Large|LARGE|huge|Huge)(?![a-zA-Z])/g, " ")
    .replace(/\\textdollar(?![a-zA-Z])/g, "\\$")
    .replace(/\\dots(?![a-zA-Z])/g, "\\ldots");
  // \text{...\textbf{...}...} nested wrappers work in KaTeX; \text{ $x$ } does too.
  return t.trim();
}

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

function pushText(out: Segment[], s: string) {
  if (!s) return;
  const last = out[out.length - 1];
  if (last && "text" in last) last.text += s;
  else out.push({ text: s });
}

function pushBreak(out: Segment[], kind: "br" | "para") {
  const last = out[out.length - 1];
  if (last && (("br" in last) || ("para" in last))) {
    if (kind === "para" && "br" in last) out[out.length - 1] = { para: true };
    return;
  }
  if (!out.length) return; // no leading breaks
  out.push(kind === "br" ? { br: true } : { para: true });
}

const TEXT_ESCAPES: Record<string, string> = { $: "$", "%": "%", "&": "&", "#": "#", _: "_", "{": "{", "}": "}", " ": " ", ",": " ", ";": " ", "!": "", "/": "" };
const TEXT_WORDS: Record<string, string> = { ldots: "…", dots: "…", cdots: "⋯", qquad: "    ", quad: "  ", textbackslash: "\\", textasciitilde: "~", textquotedblleft: "“", textquotedblright: "”", textquoteleft: "‘", textquoteright: "’", degree: "°", textdegree: "°", copyright: "©", S: "§", P: "¶", dag: "†", ddag: "‡", pounds: "£", textdollar: "$", textbullet: "•", item: "• ", textendash: "–", textemdash: "—", TeX: "TeX", LaTeX: "LaTeX" };

function tokenize(text: string, out: Segment[]): void {
  let i = 0;
  let buf = "";
  const flush = () => { if (buf) { pushText(out, buf); buf = ""; } };

  while (i < text.length) {
    const ch = text[i];
    const rest = text.slice(i, i + 40);

    // Paragraph / line breaks in the source text.
    if (ch === "\n") {
      const m = /^\n[ \t]*\n[\s]*/.exec(text.slice(i));
      if (m) { flush(); pushBreak(out, "para"); i += m[0].length; continue; }
      buf += " ";
      i++;
      continue;
    }

    // Rendered diagram marker.
    if (ch === "[" && rest.startsWith("[[diagram:")) {
      const end = text.indexOf("]]", i);
      if (end !== -1) {
        flush();
        out.push({ img: text.slice(i + "[[diagram:".length, end) });
        i = end + 2;
        continue;
      }
    }
    // An Asymptote block that was never rendered: drop the source, keep going.
    if (ch === "[" && /^\[asy\]/i.test(rest)) {
      const end = text.toLowerCase().indexOf("[/asy]", i);
      if (end !== -1) {
        i = end + "[/asy]".length;
        if (/\s$/.test(buf)) i += (/^\s*/.exec(text.slice(i))?.[0].length ?? 0);
        continue;
      }
    }

    if (ch === "$") {
      // "$$51.00$" is a price: a literal dollar sign followed by inline math. Treat
      // "$$" as a display opener only when no inline close comes first.
      const priceLike = rest.startsWith("$$") && /^\$\$\s*[\d.]/.test(rest) && findInlineClose(text, i + 1) !== -1 && (findDisplayClose(text, i + 2, "$$") === -1 || findInlineClose(text, i + 1) < findDisplayClose(text, i + 2, "$$"));
      if (rest.startsWith("$$") && !priceLike) {
        const end = findDisplayClose(text, i + 2, "$$");
        if (end !== -1) {
          flush();
          out.push({ tex: text.slice(i + 2, end), display: true });
          i = end + 2;
          continue;
        }
      }
      if (priceLike) { buf += "$"; i++; continue; }
      const end = findInlineClose(text, i);
      // "$ $9000$": an empty formula means the first "$" was a currency sign.
      if (end !== -1 && text.slice(i + 1, end).trim() !== "") {
        flush();
        out.push({ tex: text.slice(i + 1, end), display: false });
        i = end + 1;
        continue;
      }
      buf += "$";
      i++;
      continue;
    }

    if (ch === "\\") {
      // Display math.
      if (rest.startsWith("\\[")) {
        const end = text.indexOf("\\]", i + 2);
        if (end !== -1) {
          flush();
          out.push({ tex: text.slice(i + 2, end), display: true });
          i = end + 2;
          continue;
        }
      }
      if (rest.startsWith("\\(")) {
        const end = text.indexOf("\\)", i + 2);
        if (end !== -1) {
          flush();
          out.push({ tex: text.slice(i + 2, end), display: false });
          i = end + 2;
          continue;
        }
      }
      // Bare math environment.
      if (rest.startsWith("\\begin{")) {
        const env = MATH_ENVS.find((e) => rest.startsWith(`\\begin{${e}}`));
        if (env) {
          const startBody = i + `\\begin{${env}}`.length;
          const end = findEnvEnd(text, env, startBody);
          if (end !== -1) {
            flush();
            out.push({ tex: text.slice(i, end), display: true });
            i = end;
            continue;
          }
        }
        // Layout environments: unwrap.
        const lay = /^\\begin\{(center|flushleft|flushright|itemize|enumerate|description|quote|tabbing|minipage|figure|table)\}(\{[^}]*\})?/.exec(text.slice(i));
        if (lay) { flush(); pushBreak(out, "br"); i += lay[0].length; continue; }
      }
      const layEnd = /^\\end\{(center|flushleft|flushright|itemize|enumerate|description|quote|tabbing|minipage|figure|table)\}/.exec(text.slice(i));
      if (layEnd) { flush(); pushBreak(out, "br"); i += layEnd[0].length; continue; }

      // Line break.
      if (rest.startsWith("\\\\")) {
        flush();
        pushBreak(out, "br");
        i += 2;
        const opt = /^\s*\[[^\]]*\]/.exec(text.slice(i));
        if (opt) i += opt[0].length;
        continue;
      }
      if (rest.startsWith("\\newline")) { flush(); pushBreak(out, "br"); i += 8; continue; }

      // Escaped characters: \$ \% \& \# \_ \{ \} and spacing.
      const esc = text[i + 1];
      if (esc !== undefined && esc in TEXT_ESCAPES) {
        buf += TEXT_ESCAPES[esc];
        i += 2;
        continue;
      }

      // Text-mode command with a brace argument.
      const cmd = /^\\([a-zA-Z]+)\s*/.exec(text.slice(i));
      if (cmd) {
        const name = cmd[1];
        const after = i + cmd[0].length;
        if (name in STYLE_CMDS && text[after] === "{") {
          const close = matchBrace(text, after);
          if (close !== -1) {
            flush();
            const inner: Segment[] = [];
            tokenize(text.slice(after + 1, close), inner);
            const style = STYLE_CMDS[name];
            if (style) out.push({ style, children: inner });
            else out.push(...inner);
            i = close + 1;
            continue;
          }
        }
        if (name in TEXT_WORDS) {
          buf += TEXT_WORDS[name];
          i = after;
          continue;
        }
        const drop = DROP_WITH_ARG.exec(text.slice(i));
        if (drop) {
          const close = matchBrace(text, i + drop[0].length - 1);
          i = close === -1 ? i + drop[0].length : close + 1;
          continue;
        }
        const bare = DROP_BARE.exec(text.slice(i));
        if (bare) { i += bare[0].length; continue; }
        // Unknown text-mode command: a formula that lost its dollar signs
        // (e.g. "\frac{1}{2}" in prose). Render it as math rather than raw source.
        if (text[after] === "{") {
          let j = after;
          let close = -1;
          while (text[j] === "{" && (close = matchBrace(text, j)) !== -1) j = close + 1;
          // Include a trailing ^{...} / _{...}
          const sup = /^(\^|_)\s*(\{[^}]*\}|\S)/.exec(text.slice(j));
          if (sup) j += sup[0].length;
          flush();
          out.push({ tex: text.slice(i, j), display: false });
          i = j;
          continue;
        }
      }
      buf += ch;
      i++;
      continue;
    }

    if (ch === "~") { buf += " "; i++; continue; }
    if (ch === "`" && text[i + 1] === "`") { buf += "“"; i += 2; continue; }
    if (ch === "'" && text[i + 1] === "'") { buf += "”"; i += 2; continue; }

    buf += ch;
    i++;
  }
  flush();
}

// Split prose from math. Handles $...$, $$...$$, \(...\), \[...\], bare math
// environments, tabular tables, text-mode markup and diagram markers.
export function splitMath(text: string): Segment[] {
  const out: Segment[] = [];
  tokenize(convertTabulars(text ?? ""), out);
  // Trailing breaks carry nothing.
  while (out.length && (("br" in out[out.length - 1]) || ("para" in out[out.length - 1]))) out.pop();
  return out;
}

// Plain-text projection (for search, alt text, and the checks in scripts/verify.ts).
export function segmentsToPlain(segs: Segment[]): string {
  return segs
    .map((s) => ("text" in s ? s.text : "tex" in s ? s.tex : "style" in s ? segmentsToPlain(s.children) : "para" in s ? "\n\n" : "br" in s ? "\n" : ""))
    .join("");
}

// Strip a choice value or answer down to TeX KaTeX can render inline.
export function normalizeChoiceTex(value: string): string {
  return normalizeTex(value.replace(/^\$+|\$+$/g, "").replace(/\\\\\s*$/, "").trim());
}
