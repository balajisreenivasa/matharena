import * as React from "react";
import katex from "katex";
import { splitMath, normalizeTex, normalizeChoiceTex, KATEX_MACROS, type Segment } from "@/lib/tex";

// The tokenizer and TeX repairs live in src/lib/tex.ts (pure, unit-tested); this
// file only turns segments into React.
export { splitMath, normalizeTex, type Segment };

const KATEX_OPTS = { throwOnError: false, strict: "ignore" as const, macros: KATEX_MACROS };

function renderTex(tex: string, display: boolean): string {
  // KaTeX mutates `macros` when a formula defines one; pass a copy each time.
  return katex.renderToString(normalizeTex(tex), { ...KATEX_OPTS, displayMode: display, macros: { ...KATEX_MACROS } });
}

// Renders a raw LaTeX string (no $ delimiters), e.g. an answer choice value.
export function MathTex({ tex }: { tex: string }) {
  const html = renderTex(normalizeChoiceTex(tex), false);
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

function Diagram({ src }: { src: string }) {
  // Figures are black-on-transparent SVGs; the white card keeps them readable in dark mode.
  return (
    <span className="my-3 flex justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Figure" className="max-h-80 max-w-full rounded-lg border border-slate-200 bg-white p-2" loading="lazy" />
    </span>
  );
}

function Segments({ segs }: { segs: Segment[] }) {
  return (
    <>
      {segs.map((s, i) => {
        if ("text" in s) return <React.Fragment key={i}>{s.text}</React.Fragment>;
        if ("tex" in s) return <span key={i} dangerouslySetInnerHTML={{ __html: renderTex(s.tex, s.display) }} />;
        if ("img" in s) return <Diagram key={i} src={s.img} />;
        if ("br" in s) return <br key={i} />;
        if ("para" in s) return <span key={i} className="block h-3" aria-hidden />;
        const inner = <Segments segs={s.children} />;
        if (s.style === "b") return <b key={i}>{inner}</b>;
        if (s.style === "i") return <i key={i}>{inner}</i>;
        if (s.style === "u") return <u key={i}>{inner}</u>;
        return <code key={i}>{inner}</code>;
      })}
    </>
  );
}

// Renders mixed prose + math from the question bank.
export function RichText({ text }: { text: string }) {
  return (
    <span>
      <Segments segs={splitMath(text)} />
    </span>
  );
}
