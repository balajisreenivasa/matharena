// Asymptote figures shared by the importers and scripts/render-diagrams.ts.
//
// A figure is identified by the SHA-1 of its trimmed source. Rendered SVGs live in
// public/diagrams/<hash>.svg (committed, so the hosted app serves them too) and
// data/diagrams.json records what rendered and what failed.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parseCsv } from "./aime-dataset";

export const DIAGRAM_DIR = join(process.cwd(), "public", "diagrams");
export const MANIFEST_PATH = join(process.cwd(), "data", "diagrams.json");
export type Manifest = Record<string, { status: "ok" | "failed"; error?: string }>;

const ASY_BLOCK = /\[asy\]([\s\S]*?)\[\/asy\]/gi;

export function figureHash(code: string): string {
  return createHash("sha1").update(code.trim()).digest("hex");
}

export function readManifest(): Manifest {
  try {
    return existsSync(MANIFEST_PATH) ? JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) : {};
  } catch {
    return {};
  }
}

export function figureBlocks(text: string): string[] {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  ASY_BLOCK.lastIndex = 0;
  while ((m = ASY_BLOCK.exec(text ?? ""))) out.push(m[1]);
  return out;
}

let rendered: Set<string> | null = null;
export function renderedFigures(): Set<string> {
  if (rendered) return rendered;
  rendered = new Set();
  if (existsSync(DIAGRAM_DIR)) for (const f of readdirSync(DIAGRAM_DIR)) if (f.endsWith(".svg")) rendered.add(f.slice(0, -4));
  return rendered;
}

// Replace each [asy] block with a diagram marker the renderer understands. Returns
// null when a figure has no rendered SVG (the caller decides whether that makes
// the problem unusable — it does for a statement, not for a solution).
export function substituteFigures(text: string, opts: { required: boolean }): { text: string; paths: string[]; missing: number } {
  const have = renderedFigures();
  const paths: string[] = [];
  let missing = 0;
  const out = (text ?? "").replace(ASY_BLOCK, (_m, code: string) => {
    const h = figureHash(code);
    if (have.has(h)) {
      const p = `/diagrams/${h}.svg`;
      paths.push(p);
      return `\n[[diagram:${p}]]\n`;
    }
    missing++;
    return opts.required ? _m : "";
  });
  return { text: out, paths, missing };
}

// Every distinct figure in the vendor datasets, hash -> source.
export function collectFigureSources(): Map<string, string> {
  const out = new Map<string, string>();
  const grab = (t: string | undefined) => { for (const code of figureBlocks(t ?? "")) out.set(figureHash(code), code); };
  const vendor = join(process.cwd(), "data", "vendor");
  const mathDir = join(vendor, "math");
  if (existsSync(mathDir)) {
    for (const f of readdirSync(mathDir)) {
      if (!f.endsWith(".json")) continue;
      for (const r of JSON.parse(readFileSync(join(mathDir, f), "utf8"))) { grab(r.problem); grab(r.solution); }
    }
  }
  const numina = join(vendor, "numina-amc.json");
  if (existsSync(numina)) for (const r of JSON.parse(readFileSync(numina, "utf8"))) { grab(r.problem); grab(r.solution); }
  const aime = join(vendor, "AIME_Dataset_1983_2024.csv");
  if (existsSync(aime)) {
    const rows = parseCsv(readFileSync(aime, "utf8"));
    const iQ = rows[0]?.indexOf("Question") ?? -1;
    if (iQ !== -1) for (const r of rows.slice(1)) grab(r[iQ]);
  }
  return out;
}
