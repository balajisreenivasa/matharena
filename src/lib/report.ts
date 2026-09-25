// One student's progress, summarized for the classroom dashboard and the per-student
// report. Everything here is derived from the same tables the student's own pages
// read (attempts, worksheets, mastery, review queue, plan), so parent and student
// always see the same numbers.
import { db } from "./db";
import { getMasteryMap, planConfig, type MasteryRow } from "./learner";
import { buildCalendar, planDayFor, IS_STUDY_DAY, KIND_LABEL, type PlanDay } from "./plan";
import { SKILLS, SKILL_BY_ID, type Skill } from "@/curriculum/skills";
import { masteryLevel, projectAmcScore, ERROR_TAGS, type ErrorTag, type MasteryLevel } from "./mastery";
import { addDays, daysBetween, todayStr, toISODate } from "./dates";
import type { StudyPlan, User, Worksheet, MockExam } from "@prisma/client";

export type SkillLine = { skill: Skill; effective: number; attempts: number; correct: number; level: MasteryLevel };

export type StudentReport = {
  student: User & { plan: StudyPlan };
  today: string;
  day: PlanDay | null; // today's plan entry
  dayLabel: string;
  worksheet: Worksheet | null; // today's assigned sheet
  lessonRead: boolean;
  dueReview: number;
  queueSize: number;
  overdue: Worksheet[]; // dated sheets before today still open
  streak: number;
  lastActive: Date | null;
  lastLoginAt: Date | null;
  sheetsDone: number;
  sheetsOpen: number;
  attempts7d: number;
  correct7d: number;
  attemptsAll: number;
  correctAll: number;
  sureWrong: number;
  tagCounts: Record<ErrorTag, number>;
  projection: { expected: number; correct: number; attemptThrough: number };
  overall: number; // 0..1 average effective mastery
  anyAttempts: boolean;
  skills: SkillLine[]; // in teaching order
  weakest: SkillLine[];
  strongest: SkillLine[];
  upcoming: PlanDay[]; // next study days
  recentSheets: Worksheet[];
  mocks: MockExam[];
  daysToA: number;
  daysToB: number;
  examADate: string;
  examBDate: string;
  mastery: Record<string, MasteryRow>;
};

export async function buildStudentReport(student: User & { plan: StudyPlan }, today = todayStr()): Promise<StudentReport> {
  const cfg = planConfig(student.plan);
  const day = planDayFor(cfg, today);
  const mastery = await getMasteryMap(student.id);

  const [sheets, attemptsAll, dueReview, queueSize, mocks, lessonViews] = await Promise.all([
    db.worksheet.findMany({ where: { userId: student.id }, orderBy: [{ date: "desc" }, { createdAt: "desc" }] }),
    db.attempt.findMany({ where: { userId: student.id }, select: { isCorrect: true, confidence: true, errorTag: true, createdAt: true } }),
    db.reviewItem.count({ where: { userId: student.id, dueDate: { lte: today } } }),
    db.reviewItem.count({ where: { userId: student.id } }),
    db.mockExam.findMany({ where: { userId: student.id }, orderBy: { date: "desc" } }),
    day ? db.lessonView.findMany({ where: { userId: student.id, date: today, skillId: { in: day.skillIds } } }) : Promise.resolve([]),
  ]);

  const worksheet = sheets.find((s) => s.date === today && !["extra-mock", "practice", "lesson-quiz"].includes(s.kind)) ?? null;
  const routine = sheets.filter((s) => !["extra-mock", "practice", "lesson-quiz"].includes(s.kind));
  const done = routine.filter((s) => s.status === "done");
  const overdue = routine.filter((s) => s.status !== "done" && s.date < today);
  const doneDates = new Set(done.map((s) => s.date));
  let streak = 0;
  for (let d = doneDates.has(today) ? today : addDays(today, -1); doneDates.has(d); d = addDays(d, -1)) streak++;

  const since7 = addDays(today, -6);
  let attempts7d = 0, correct7d = 0, correctAll = 0, sureWrong = 0;
  const tagCounts = { C: 0, S: 0, E: 0, R: 0, T: 0 } as Record<ErrorTag, number>;
  let lastActive: Date | null = null;
  for (const a of attemptsAll) {
    if (!lastActive || a.createdAt > lastActive) lastActive = a.createdAt;
    if (a.isCorrect) correctAll++;
    if (toISODate(a.createdAt) >= since7) { attempts7d++; if (a.isCorrect) correct7d++; }
    if (!a.isCorrect && a.confidence === "sure") sureWrong++;
    if (!a.isCorrect && a.errorTag && a.errorTag in ERROR_TAGS) tagCounts[a.errorTag as ErrorTag]++;
  }

  const lines: SkillLine[] = SKILLS.map((skill) => {
    const m = mastery[skill.id];
    return { skill, effective: m.effective, attempts: m.attempts, correct: m.correct, level: masteryLevel(m.effective, m.attempts) };
  });
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const tier1 = avg(lines.filter((l) => l.skill.tier === 1).map((l) => l.effective));
  const tier2 = avg(lines.filter((l) => l.skill.tier === 2).map((l) => l.effective));
  const anyAttempts = lines.some((l) => l.attempts > 0);
  const practised = lines.filter((l) => l.attempts > 0);
  const bySc = [...(practised.length ? practised : lines)].sort((a, b) => a.effective - b.effective);

  const upcoming = buildCalendar(cfg).filter((d) => daysBetween(today, d.date) > 0 && IS_STUDY_DAY[d.kind]).slice(0, 5);

  return {
    student,
    today,
    day,
    dayLabel: day ? `${KIND_LABEL[day.kind]} · ${day.label}` : "Outside the plan window",
    worksheet,
    lessonRead: !!day && day.skillIds.length > 0 && day.skillIds.every((id) => lessonViews.some((v) => v.skillId === id)),
    dueReview,
    queueSize,
    overdue,
    streak,
    lastActive,
    lastLoginAt: student.lastLoginAt,
    sheetsDone: done.length,
    sheetsOpen: routine.length - done.length,
    attempts7d,
    correct7d,
    attemptsAll: attemptsAll.length,
    correctAll,
    sureWrong,
    tagCounts,
    projection: projectAmcScore(tier1, tier2),
    overall: avg(lines.map((l) => l.effective)),
    anyAttempts,
    skills: lines,
    weakest: bySc.slice(0, 3),
    strongest: bySc.slice(-3).reverse(),
    upcoming,
    recentSheets: sheets.slice(0, 12),
    mocks,
    daysToA: daysBetween(today, cfg.examADate),
    daysToB: daysBetween(today, cfg.examBDate),
    examADate: cfg.examADate,
    examBDate: cfg.examBDate,
    mastery,
  };
}

// What the student should do next, in plain words, for the dashboard "needs" column.
export function nextActions(r: StudentReport): string[] {
  const out: string[] = [];
  if (r.overdue.length) out.push(`${r.overdue.length} overdue worksheet${r.overdue.length > 1 ? "s" : ""} (oldest ${r.overdue[r.overdue.length - 1].date})`);
  if (r.day && IS_STUDY_DAY[r.day.kind]) {
    if (r.day.skillIds.length && !r.lessonRead) out.push(`Read today's lesson: ${r.day.skillIds.map((id) => SKILL_BY_ID[id]?.name ?? id).join(" + ")}`);
    if (r.day.paperMock) out.push(`Paper mock: ${r.day.paperMock.label}`);
    if (!r.worksheet) out.push("Open Today to build today's worksheet");
    else if (r.worksheet.status === "pending") out.push("Start today's worksheet");
    else if (r.worksheet.status === "in_progress") out.push("Finish today's worksheet");
  }
  if (r.dueReview) out.push(`${r.dueReview} review problem${r.dueReview > 1 ? "s" : ""} due`);
  if (!r.anyAttempts) out.push("Take the diagnostic");
  else if (r.weakest[0]) out.push(`Weakest skill: ${r.weakest[0].skill.name} (${Math.round(r.weakest[0].effective * 100)}%)`);
  if (!out.length) out.push("All caught up");
  return out;
}

// "3 days ago", "today", "never"
export function relativeDay(d: Date | null, today = todayStr()): string {
  if (!d) return "never";
  const n = daysBetween(toISODate(d), today);
  if (n <= 0) return "today";
  if (n === 1) return "yesterday";
  return `${n} days ago`;
}
