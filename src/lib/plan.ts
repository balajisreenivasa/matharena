// Calendar generator, driven by the 7-week curriculum template in
// src/curriculum/calendar.ts. Pure: (plan config) -> one PlanDay per date from the
// start date through AMC 10B. Nothing is stored; edit a setting and it re-plans.
//
// Anchoring rules
//   * Exam days, the light day before each exam, and the gap week between exams
//     are anchored to the exam dates.
//   * Everything before 10A is laid onto consecutive study days from the start date,
//     skipping rest weekdays and pause dates.
//   * If the runway is shorter than the template, days are dropped in this order:
//     week-6 adaptive days, then Sunday mock reviews, then lessons are paired.
//   * If the runway is longer, extra adaptive days are inserted before the final mocks.
//   * A missed day is handled by adding it to pauseDates ("push schedule"), which
//     slides the rest of the template forward under the same rules.
//
// Adaptation happens at worksheet-build time (worksheet.ts): the calendar fixes the
// kind of day and the lesson skill(s); the problems come from current mastery.

import { SKILL_BY_ID } from "@/curriculum/skills";
import { PRE_EXAM_TEMPLATE, GAP_WEEK_TEMPLATE, type TemplateEntry } from "@/curriculum/calendar";
import { addDays, daysBetween, weekday } from "./dates";

export type DayKind = "diagnostic" | "lesson" | "quiz" | "mock" | "mock_review" | "adaptive" | "strategy" | "light" | "exam" | "off" | "rest";

export type PaperMock = { year: number; contest: "AMC10A" | "AMC10B"; label: string };

export type PlanDay = {
  date: string;
  kind: DayKind;
  week: number; // 1-based week of the plan
  label: string;
  skillIds: string[];
  paperMock?: PaperMock;
  note?: string;
  focus?: "hard" | "mid" | "easy"; // adaptive day difficulty emphasis (e.g. "problems 16-20 only")
};

export type PlanConfig = {
  startDate: string;
  examADate: string;
  examBDate: string;
  restDays: number[]; // weekdays 0-6 never assigned
  pauseDates: string[]; // specific dates never assigned
};

export const DEFAULT_EXAM_A = "2026-11-05";
export const DEFAULT_EXAM_B = "2026-11-13";

function fromEntry(date: string, e: TemplateEntry, week: number): PlanDay {
  return {
    date,
    kind: e.kind,
    week,
    label: e.label ?? (e.skillIds?.length ? e.skillIds.map((id) => SKILL_BY_ID[id]?.name ?? id).join(" + ") : e.kind),
    skillIds: e.skillIds ?? [],
    paperMock: e.paperMock,
    note: e.note,
    focus: e.focus,
  };
}

// Drop entries to fit `slots` study days, cheapest first.
function compress(entries: TemplateEntry[], slots: number): TemplateEntry[] {
  let out = [...entries];
  const dropLast = (pred: (e: TemplateEntry) => boolean) => {
    for (let i = out.length - 1; i >= 0; i--) {
      if (pred(out[i])) {
        out.splice(i, 1);
        return true;
      }
    }
    return false;
  };
  while (out.length > slots && dropLast((e) => e.kind === "adaptive")) {}
  while (out.length > slots && dropLast((e) => e.kind === "mock_review")) {}
  while (out.length > slots && dropLast((e) => e.kind === "quiz" || e.kind === "strategy")) {}
  // Pair lessons from the end: merge the last two lesson entries into one day.
  while (out.length > slots) {
    let a = -1, b = -1;
    for (let i = out.length - 1; i >= 0; i--) {
      if (out[i].kind === "lesson") {
        if (b === -1) b = i;
        else {
          a = i;
          break;
        }
      }
    }
    if (a === -1) break;
    const merged: TemplateEntry = { kind: "lesson", skillIds: [...(out[a].skillIds ?? []), ...(out[b].skillIds ?? [])].slice(0, 3), note: "Compressed: two lessons today" };
    out.splice(b, 1);
    out.splice(a, 1, merged);
  }
  // Still too long (tiny runway): keep the diagnostic and the mocks, drop remaining lessons from the end.
  while (out.length > slots && dropLast((e) => e.kind === "lesson")) {}
  while (out.length > slots) out.pop();
  return out;
}

// Pad with adaptive days inserted just before the last mock so the extra time goes to
// weak-skill work at the end, when it matters most.
function expand(entries: TemplateEntry[], slots: number): TemplateEntry[] {
  const out = [...entries];
  let lastMock = -1;
  for (let i = out.length - 1; i >= 0; i--) if (out[i].kind === "mock") { lastMock = i; break; }
  const at = lastMock === -1 ? out.length : lastMock;
  while (out.length < slots) out.splice(at, 0, { kind: "adaptive", label: "Adaptive worksheet", note: "Extra day: weakest two skills." });
  return out;
}

export function buildCalendar(cfg: PlanConfig): PlanDay[] {
  const rest = new Set(cfg.restDays);
  const paused = new Set(cfg.pauseDates);
  const total = daysBetween(cfg.startDate, cfg.examBDate);
  if (total < 1) return [];

  const fixed = new Map<string, PlanDay>();
  const weekOf = (date: string) => Math.floor(daysBetween(cfg.startDate, date) / 7) + 1;

  // ---- Anchored: light day + exam A, gap week, light day + exam B ----
  const lightA = addDays(cfg.examADate, -1);
  fixed.set(cfg.examADate, { date: cfg.examADate, kind: "exam", week: weekOf(cfg.examADate), label: "AMC 10A — exam day", skillIds: [], note: "No practice. Pencils, ID, snack, early arrival. Problem 10 by minute 20, 15 by minute 40." });
  fixed.set(cfg.examBDate, { date: cfg.examBDate, kind: "exam", week: weekOf(cfg.examBDate), label: "AMC 10B — exam day", skillIds: [], note: "Same routine as 10A." });
  if (daysBetween(cfg.startDate, lightA) >= 0) fixed.set(lightA, { date: lightA, kind: "light", week: weekOf(lightA), label: "Light day before 10A", skillIds: [], note: "10 easy problems for accuracy, skim the formula sheet, early bedtime." });

  // Gap week: laid out from the day after exam A, template order, anchored to exam B's light day.
  const gapDays: string[] = [];
  for (let d = addDays(cfg.examADate, 1); daysBetween(d, cfg.examBDate) > 0; d = addDays(d, 1)) gapDays.push(d);
  if (gapDays.length) {
    const lightB = gapDays[gapDays.length - 1];
    const middle = gapDays.slice(0, -1);
    const tpl = GAP_WEEK_TEMPLATE.slice(0, middle.length);
    middle.forEach((d, i) => {
      const e = tpl[i] ?? { kind: "adaptive" as DayKind, label: "Adaptive worksheet" };
      fixed.set(d, fromEntry(d, e, weekOf(d)));
    });
    fixed.set(lightB, { date: lightB, kind: "light", week: weekOf(lightB), label: "Light day before 10B", skillIds: [], note: "10 easy problems, early bedtime." });
  }

  // ---- Pre-exam window: consecutive study days from start through lightA - 1 ----
  const studyDays: string[] = [];
  for (let d = cfg.startDate; daysBetween(d, lightA) > 0; d = addDays(d, 1)) {
    if (fixed.has(d) || paused.has(d) || rest.has(weekday(d))) continue;
    studyDays.push(d);
  }
  let entries = PRE_EXAM_TEMPLATE;
  if (entries.length > studyDays.length) entries = compress(entries, studyDays.length);
  else if (entries.length < studyDays.length) entries = expand(entries, studyDays.length);
  studyDays.forEach((d, i) => fixed.set(d, fromEntry(d, entries[i], weekOf(d))));

  // ---- Emit every date ----
  const out: PlanDay[] = [];
  for (let i = 0; i <= total; i++) {
    const date = addDays(cfg.startDate, i);
    const f = fixed.get(date);
    if (f) out.push(f);
    else if (paused.has(date)) out.push({ date, kind: "off", week: weekOf(date), label: "Paused", skillIds: [], note: "No assignment (pause date). The plan shifted past this day." });
    else out.push({ date, kind: "rest", week: weekOf(date), label: "Rest day", skillIds: [] });
  }
  return out;
}

export function planDayFor(cfg: PlanConfig, date: string): PlanDay | null {
  if (daysBetween(cfg.startDate, date) < 0 || daysBetween(date, cfg.examBDate) < 0) return null;
  return buildCalendar(cfg).find((d) => d.date === date) ?? null;
}

// Skills taught on or before `date`. Once the lesson block is over (first adaptive/strategy
// day, or any day in the sharpen weeks) every skill is fair game.
export function taughtSkillIds(cfg: PlanConfig, date: string, all: string[]): string[] {
  const ids: string[] = [];
  let lessonsOver = false;
  for (const d of buildCalendar(cfg)) {
    if (daysBetween(d.date, date) < 0) break;
    ids.push(...d.skillIds);
    if (d.kind === "adaptive" || d.kind === "strategy") lessonsOver = true;
  }
  if (lessonsOver || !ids.length) return all;
  return [...new Set(ids)];
}

export const IS_STUDY_DAY: Record<DayKind, boolean> = {
  diagnostic: true, lesson: true, quiz: true, mock: true, mock_review: true, adaptive: true, strategy: true, light: true,
  exam: false, off: false, rest: false,
};

export const KIND_LABEL: Record<DayKind, string> = {
  diagnostic: "Diagnostic",
  lesson: "Lesson",
  quiz: "Topic quiz",
  mock: "Mock",
  mock_review: "Mock review",
  adaptive: "Adaptive",
  strategy: "Strategy",
  light: "Light",
  exam: "Exam",
  off: "Paused",
  rest: "Rest",
};

export const KIND_COLOR: Record<DayKind, string> = {
  diagnostic: "#7c3aed",
  lesson: "#2563eb",
  quiz: "#0891b2",
  mock: "#dc2626",
  mock_review: "#d97706",
  adaptive: "#059669",
  strategy: "#4f46e5",
  light: "#0891b2",
  exam: "#111827",
  off: "#94a3b8",
  rest: "#94a3b8",
};
