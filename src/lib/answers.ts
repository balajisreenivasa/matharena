// Free-response answers are LaTeX, so one value has many spellings ("\dfrac12" vs
// "\frac{1}{2}" vs "0.5"). Normalize the obvious variations, compare numerically when
// both sides are numbers, and let the user override a false negative in the UI.
// Shared by the client (instant feedback) and the API (authoritative grading).

export function normalize(s: string): string {
  return s
    .trim()
    .replace(/^\$+|\$+$/g, "")
    .replace(/\\left|\\right/g, "")
    .replace(/\\[dt]frac/g, "\\frac")
    .replace(/\\!|\\,|\\;|\\:|\\ /g, "")
    .replace(/\s+/g, "")
    .replace(/\.$/, "")
    .toLowerCase();
}

// "\frac{a}{b}" or "a/b" -> a/b as a number, when both parts are numeric.
function fractionValue(s: string): number | null {
  const m = /^(-?)\\frac\{(-?[\d.]+)\}\{(-?[\d.]+)\}$/.exec(s) ?? /^(-?)(-?[\d.]+)\/(-?[\d.]+)$/.exec(s);
  if (!m) return null;
  const sign = m[1] === "-" ? -1 : 1;
  const a = Number(m[2]);
  const b = Number(m[3]);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null;
  return (sign * a) / b;
}

function numericValue(s: string): number | null {
  const cleaned = s.replace(/[,$]/g, "").replace(/\\%|%/g, "").replace(/\^\\circ|\\circ|°/g, "");
  const n = Number(cleaned);
  if (Number.isFinite(n) && cleaned !== "") return n;
  return fractionValue(cleaned);
}

export function answersMatch(given: string, expected: string): boolean {
  const a = normalize(given);
  const b = normalize(expected);
  if (!a) return false;
  if (a === b) return true;
  const na = numericValue(a);
  const nb = numericValue(b);
  if (na !== null && nb !== null) return Math.abs(na - nb) < 1e-9;
  return false;
}

export function gradeAnswer(selected: string, answer: string, isMultipleChoice: boolean): boolean {
  if (isMultipleChoice) return selected.trim().toUpperCase() === answer.trim().toUpperCase();
  return answersMatch(selected, answer);
}
