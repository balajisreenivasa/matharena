import * as React from "react";
import katex from "katex";

// Renders a raw LaTeX string (no $ delimiters), e.g. an answer choice value.
export function MathTex({ tex }: { tex: string }) {
  const html = katex.renderToString(tex, { throwOnError: false, displayMode: false });
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

// Math environments KaTeX can render. A bare \begin{align*}...\end{align*} with no
// surrounding $ or \[ is common in the MATH corpus (~20% of solutions) and must be
// treated as display math, or it renders as raw source.
// Longest-first so "align*" is matched before "align".
const MATH_ENVS = [
  "align*", "align", "aligned", "alignat*", "alignat",
  "gathered", "gather*", "gather", "equation*", "equation",
  "multline*", "multline", "split", "cases", "rcases", "dcases",
  "smallmatrix", "pmatrix", "bmatrix", "Bmatrix", "vmatrix", "Vmatrix", "matrix",
  "array", "CD",
];

export type Segment = { text: string } | { tex: string; display: boolean };

// Find the end of a \begin{env} block, honouring nesting of the same environment.
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

// Split prose from math. Handles $...$, $$...$$, \(...\), \[...\] and bare
// math environments. Exported so it can be unit tested without a DOM.
export function splitMath(text: string): Segment[] {
  const out: Segment[] = [];
  let buf = "";
  let i = 0;

  const flush = () => {
    if (buf) out.push({ text: buf });
    buf = "";
  };

  while (i < text.length) {
    const rest = text.slice(i);

    // Display: $$...$$
    if (rest.startsWith("$$")) {
      const end = text.indexOf("$$", i + 2);
      if (end !== -1) {
        flush();
        out.push({ tex: text.slice(i + 2, end), display: true });
        i = end + 2;
        continue;
      }
    }

    // Display: \[...\]
    if (rest.startsWith("\\[")) {
      const end = text.indexOf("\\]", i + 2);
      if (end !== -1) {
        flush();
        out.push({ tex: text.slice(i + 2, end), display: true });
        i = end + 2;
        continue;
      }
    }

    // Inline: \(...\)
    if (rest.startsWith("\\(")) {
      const end = text.indexOf("\\)", i + 2);
      if (end !== -1) {
        flush();
        out.push({ tex: text.slice(i + 2, end), display: false });
        i = end + 2;
        continue;
      }
    }

    // Bare math environment: \begin{align*}...\end{align*}
    if (rest.startsWith("\\begin{")) {
      const env = MATH_ENVS.find((e) => rest.startsWith(`\\begin{${e}}`));
      if (env) {
        const startBody = i + `\\begin{${env}}`.length;
        const end = findEnvEnd(text, env, startBody);
        if (end !== -1) {
          flush();
          // Keep the \begin/\end wrapper — KaTeX needs it to pick the layout.
          out.push({ tex: text.slice(i, end), display: true });
          i = end;
          continue;
        }
      }
    }

    // Inline: $...$
    if (rest.startsWith("$")) {
      const end = text.indexOf("$", i + 1);
      if (end !== -1) {
        flush();
        out.push({ tex: text.slice(i + 1, end), display: false });
        i = end + 1;
        continue;
      }
    }

    buf += text[i];
    i++;
  }
  flush();
  return out;
}

// Renders mixed prose + math from the question bank.
export function RichText({ text }: { text: string }) {
  const segments = splitMath(text);
  return (
    <span>
      {segments.map((s, i) => {
        if ("text" in s) return <span key={i}>{s.text}</span>;
        const html = katex.renderToString(s.tex, { throwOnError: false, displayMode: s.display });
        return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
      })}
    </span>
  );
}
