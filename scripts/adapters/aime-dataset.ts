// Importer for the AIME 1983-2024 dataset (CC0 / public domain).
// https://huggingface.co/datasets/gneubig/aime-1983-2024
//
// Unlike the MATH corpus this keeps full contest attribution: year, problem number,
// and which of AIME I / II it came from. Answers are integers 0-999, matching the
// real contest format, so these seed as answerFormat "integer".
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { localDifficulty, globalDifficulty } from "../contests";

const REPO = "gneubig/aime-1983-2024";
const CSV = "AIME_Dataset_1983_2024.csv";
const VENDOR = join(process.cwd(), "data", "vendor");

// Minimal RFC 4180 parser. Problem statements contain commas, quotes and newlines,
// so splitting on commas would corrupt them.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  // Strip a UTF-8 BOM if present.
  if (text.charCodeAt(0) === 0xfeff) i = 1;

  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (ch === "\r") {
      i++;
      continue;
    }
    if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += ch;
    i++;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export const AIME_CONTESTS = [
  { id: "AIME", name: "AIME", level: "olympiad", answerFormat: "integer", numProblems: 15, hardnessBase: 7 },
  { id: "AIME_I", name: "AIME I", level: "olympiad", answerFormat: "integer", numProblems: 15, hardnessBase: 7 },
  { id: "AIME_II", name: "AIME II", level: "olympiad", answerFormat: "integer", numProblems: 15, hardnessBase: 7 },
];

async function download(): Promise<string> {
  if (!existsSync(VENDOR)) mkdirSync(VENDOR, { recursive: true });
  const local = join(VENDOR, CSV);
  if (existsSync(local)) return local;
  const url = `https://huggingface.co/datasets/${REPO}/resolve/main/${CSV}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  writeFileSync(local, Buffer.from(await res.arrayBuffer()));
  return local;
}

function contestIdFor(part: string): string {
  const p = (part ?? "").trim().toUpperCase();
  if (p === "I" || p === "1") return "AIME_I";
  if (p === "II" || p === "2") return "AIME_II";
  return "AIME";
}

export type AimeStats = { imported: number; skipped: number };

export async function importAime(): Promise<{ problems: any[]; stats: AimeStats }> {
  const file = await download();
  const rows = parseCsv(readFileSync(file, "utf8"));
  if (!rows.length) throw new Error("AIME csv parsed to zero rows");

  const header = rows[0].map((h) => h.trim());
  const col = (name: string) => {
    const i = header.indexOf(name);
    if (i === -1) throw new Error(`AIME csv missing column "${name}" (has: ${header.join(", ")})`);
    return i;
  };
  const iYear = col("Year");
  const iNum = col("Problem Number");
  const iQ = col("Question");
  const iA = col("Answer");
  const iPart = col("Part");

  const problems: any[] = [];
  const stats: AimeStats = { imported: 0, skipped: 0 };
  const seen = new Set<string>();

  for (const r of rows.slice(1)) {
    if (r.length < header.length) {
      stats.skipped++;
      continue;
    }
    const year = parseInt((r[iYear] ?? "").trim(), 10);
    const number = parseInt((r[iNum] ?? "").trim(), 10);
    const statement = (r[iQ] ?? "").trim();
    const answerRaw = (r[iA] ?? "").trim();
    const contestId = contestIdFor(r[iPart]);

    // AIME answers are integers 0-999; anything else means a malformed row.
    if (!year || !number || !statement || !/^\d{1,3}$/.test(answerRaw)) {
      stats.skipped++;
      continue;
    }
    // The unique index is [contestId, year, round, number] — drop duplicates.
    const key = `${contestId}_${year}_${number}`;
    if (seen.has(key)) {
      stats.skipped++;
      continue;
    }
    seen.add(key);

    problems.push({
      contestId,
      year,
      round: null,
      number,
      statement,
      choices: null,
      answer: String(parseInt(answerRaw, 10)), // normalize "007" -> "7"
      hasDiagram: false,
      diagramUrl: null,
      localDifficulty: localDifficulty(number, 15),
      globalDifficulty: globalDifficulty(number, 15, 7),
      source: "AIME dataset (CC0)",
      sourceUrl: `https://huggingface.co/datasets/${REPO}`,
      topics: [], // no labels shipped — `npm run classify` tags these
      solutions: [],
    });
    stats.imported++;
  }
  return { problems, stats };
}
