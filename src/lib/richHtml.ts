// Server-side HTML rendering of bank text (mail, printable worksheets). Mirrors
// <RichText> in src/components/Math.tsx but emits a string.
import katex from "katex";
import { splitMath, normalizeTex, KATEX_MACROS, type Segment } from "./tex";

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function texToHtml(tex: string, display: boolean): string {
  return katex.renderToString(normalizeTex(tex), { throwOnError: false, strict: "ignore", displayMode: display, macros: { ...KATEX_MACROS } });
}

// `imageBase` makes diagram paths absolute (mail clients need a full URL).
export function segmentsToHtml(segs: Segment[], imageBase = ""): string {
  return segs
    .map((s) => {
      if ("text" in s) return escapeHtml(s.text);
      if ("tex" in s) return texToHtml(s.tex, s.display);
      if ("img" in s) return `<div style="text-align:center;margin:10px 0"><img src="${imageBase}${s.img}" alt="Figure" style="max-height:320px;max-width:100%;background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:6px"/></div>`;
      if ("br" in s) return "<br/>";
      if ("para" in s) return "<br/><br/>";
      const tag = s.style === "b" ? "b" : s.style === "i" ? "i" : s.style === "u" ? "u" : "code";
      return `<${tag}>${segmentsToHtml(s.children, imageBase)}</${tag}>`;
    })
    .join("");
}

export function richHtml(text: string, imageBase = ""): string {
  return segmentsToHtml(splitMath(text), imageBase);
}
