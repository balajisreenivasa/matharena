// Render every Asymptote figure in the vendor datasets to SVG.
//
//   npm run diagrams              # render anything not yet in public/diagrams
//   npm run diagrams -- --retry   # also retry figures that failed last time
//   npm run diagrams -- --limit 50
//
// Why: the MATH corpus and the Numina AMC slice ship figures as Asymptote source
// inside [asy]...[/asy]. Without a renderer those problems were skipped at import
// (1,300+ problems, most of the geometry bank). This script needs an Asymptote
// install plus a TeX (labels) and Ghostscript (SVG output):
//   * Asymptote 3.x   https://asymptote.sourceforge.io  (ASY env var or the default
//                     user-profile install path below)
//   * MiKTeX          latex + dvisvgm on PATH, and its bundled Ghostscript (mgs.exe)
// Each figure is keyed by the SHA-1 of its source, so re-running is incremental and
// the importers look figures up by the same hash (scripts/adapters/figures.ts).
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, readdirSync, renameSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { collectFigureSources, figureHash, DIAGRAM_DIR, MANIFEST_PATH, readManifest, type Manifest } from "./adapters/figures";

const args = process.argv.slice(2);
const retry = args.includes("--retry");
const li = args.indexOf("--limit");
const limit = li !== -1 ? parseInt(args[li + 1], 10) : Infinity;
const WORKERS = parseInt(process.env.ASY_WORKERS ?? "6", 10);
const TIMEOUT_MS = 90_000;

const HOME = process.env.USERPROFILE ?? process.env.HOME ?? "";
const MIKTEX_BIN = process.env.MIKTEX_BIN ?? join(HOME, "AppData", "Local", "Programs", "MiKTeX", "miktex", "bin", "x64");
const ASY = process.env.ASY ?? join(HOME, "AppData", "Local", "Programs", "Asymptote", "asy.exe");
const GS = process.env.ASY_GS ?? join(MIKTEX_BIN, "mgs.exe");
const WORK = join(process.cwd(), "data", "vendor", "asy-work");
const MODULES = join(process.cwd(), "scripts", "asy-modules"); // olympiad.asy, cse5.asy

function preamble(code: string): string {
  // Figures in these corpora assume the AoPS wiki defaults: a fixed size and the
  // olympiad/cse5 helper modules. Only add what the source does not already set.
  // The AoPS wiki preloads graph, olympiad and cse5 (the latter two are AoPS modules,
  // vendored under data/vendor/asy-modules and put on the search path below).
  const lines: string[] = [];
  if (!/import\s+graph\b/.test(code)) lines.push("import graph;");
  if (!/import\s+olympiad\b/.test(code)) lines.push("import olympiad;");
  if (!/import\s+cse5\b/.test(code)) lines.push("import cse5;");
  lines.push("import aopscompat;"); // old-API shims (scripts/asy-modules/aopscompat.asy)
  if (!/\bsize\s*\(/.test(code) && !/\bunitsize\s*\(/.test(code)) lines.push("size(200);");
  return lines.join("\n") + "\n";
}

function renderOne(hash: string, code: string, slot: number): Promise<{ ok: boolean; error?: string }> {
  const dir = join(WORK, String(slot));
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const src = join(dir, `${hash}.asy`);
  writeFileSync(src, preamble(code) + code + "\n", "utf8");
  const outBase = join(dir, hash);
  return new Promise((resolve) => {
    const p = spawn(ASY, ["-noView", "-safe", "-f", "svg", "-tex", "latex", "-gs", GS, "-render", "0", "-dir", MODULES, "-o", outBase, src], {
      cwd: dir,
      env: { ...process.env, PATH: `${MIKTEX_BIN};${process.env.PATH ?? ""}`, ASYMPTOTE_DIR: MODULES },
      windowsHide: true,
    });
    let err = "";
    p.stderr.on("data", (d) => (err += d.toString()));
    p.stdout.on("data", (d) => (err += d.toString()));
    // Kill the whole tree: a hung latex/gs grandchild would otherwise keep the stdio
    // pipes open and the worker would wait forever.
    const killTree = () => {
      if (process.platform === "win32" && p.pid) spawn("taskkill", ["/PID", String(p.pid), "/T", "/F"], { windowsHide: true });
      else p.kill("SIGKILL");
    };
    const timer = setTimeout(() => { killTree(); err += "\ntimeout"; }, TIMEOUT_MS);
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      killTree(); // reap grandchildren that outlived asy
      // Asymptote appends the suffix itself; either spelling may appear.
      const produced = [outBase + ".svg", outBase + ".svg.svg"].find((f) => existsSync(f));
      if (produced) {
        const svg = readFileSync(produced, "utf8");
        if (svg.includes("<svg")) {
          renameSync(produced, join(DIAGRAM_DIR, `${hash}.svg`));
          cleanup(dir, hash);
          return resolve({ ok: true });
        }
      }
      cleanup(dir, hash);
      resolve({ ok: false, error: err.replace(/latex: major issue.*\n?/g, "").trim().slice(-400) });
    };
    // "exit", not "close": close waits for every stdio pipe, which a grandchild can hold.
    p.on("exit", () => setTimeout(finish, 50));
    p.on("error", finish);
  });
}

function cleanup(dir: string, hash: string) {
  for (const f of readdirSync(dir)) if (f.startsWith(hash)) { try { rmSync(join(dir, f)); } catch {} }
}

async function main() {
  if (!existsSync(ASY)) {
    console.error(`Asymptote not found at ${ASY}. Install it (https://asymptote.sourceforge.io) or set ASY=<path to asy.exe>.`);
    process.exit(1);
  }
  if (!existsSync(DIAGRAM_DIR)) mkdirSync(DIAGRAM_DIR, { recursive: true });
  const manifest: Manifest = readManifest();
  const sources = collectFigureSources();
  console.log(`${sources.size} distinct figures across the vendor datasets`);

  const todo: { hash: string; code: string }[] = [];
  for (const [hash, code] of sources) {
    if (existsSync(join(DIAGRAM_DIR, `${hash}.svg`))) { manifest[hash] = { status: "ok" }; continue; }
    if (manifest[hash]?.status === "failed" && !retry) continue;
    todo.push({ hash, code });
    if (todo.length >= limit) break;
  }
  console.log(`${todo.length} to render with ${WORKERS} workers (${Object.values(manifest).filter((m) => m.status === "ok").length} already done)`);

  let next = 0, ok = 0, failed = 0;
  const started = Date.now();
  const save = () => writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 1));
  const worker = async (slot: number) => {
    while (next < todo.length) {
      const job = todo[next++];
      const r = await renderOne(job.hash, job.code, slot);
      manifest[job.hash] = r.ok ? { status: "ok" } : { status: "failed", error: r.error };
      r.ok ? ok++ : failed++;
      const done = ok + failed;
      if (done % 25 === 0 || done === todo.length) {
        save();
        const rate = done / ((Date.now() - started) / 1000);
        console.log(`  ${done}/${todo.length}  ok=${ok} failed=${failed}  ${rate.toFixed(2)}/s  eta ${Math.round((todo.length - done) / Math.max(rate, 0.01) / 60)} min`);
      }
    }
  };
  await Promise.all(Array.from({ length: WORKERS }, (_, i) => worker(i)));
  save();
  console.log(`Done: ${ok} rendered, ${failed} failed. ${Object.values(manifest).filter((m) => m.status === "ok").length} figures in ${DIAGRAM_DIR}.`);
  if (failed) {
    const reasons: Record<string, number> = {};
    for (const m of Object.values(manifest)) if (m.status === "failed") { const k = (m.error ?? "").split("\n").find((l) => /error|timeout|undefined|no matching/i.test(l))?.slice(0, 80) ?? "?"; reasons[k] = (reasons[k] ?? 0) + 1; }
    console.log("Failure reasons:", Object.entries(reasons).sort((a, b) => b[1] - a[1]).slice(0, 12));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
