// Daily delivery. Run by the Windows scheduled tasks (see docs/PLAN.md) or by hand:
//   npm run daily                 # morning: build today's worksheet, mail it (student, cc parent)
//   npm run daily -- evening      # 8 PM: parent summary of today + what changes tomorrow
//   npm run daily -- digest       # Sunday: weekly mastery digest for the parent
//   npm run daily -- morning --date 2026-09-22 --force
//
// Mail goes through SMTP when SMTP_HOST/SMTP_USER/SMTP_PASS are set in .env.
// Otherwise every message is written to data/outbox/<date>-<mode>.html so you can
// open or print it. The worksheet itself is always attached/saved as a standalone
// HTML page with KaTeX rendered, one problem per block with room to work.
import "dotenv/config";
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import katex from "katex";
import nodemailer from "nodemailer";
import { db } from "../src/lib/db";
import { getLearner, getMasteryMap, planConfig } from "../src/lib/learner";
import { getOrCreateWorksheet } from "../src/lib/worksheet";
import { loadWorksheetView } from "../src/lib/views";
import { buildCalendar, planDayFor, KIND_LABEL, IS_STUDY_DAY } from "../src/lib/plan";
import { aopsUrl } from "../src/curriculum/calendar";
import { SKILLS, SKILL_BY_ID } from "../src/curriculum/skills";
import { lessonFor } from "../src/curriculum/lessons";
import { splitMath } from "../src/components/Math";
import { projectAmcScore, masteryLevel, ERROR_TAGS, type ErrorTag } from "../src/lib/mastery";
import { todayStr, fmtLong, fmtShort, daysBetween, addDays, weekday } from "../src/lib/dates";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";
const OUTBOX = join(process.cwd(), "data", "outbox");

// ---------------------------------------------------------------------------
// Rendering helpers
// ---------------------------------------------------------------------------

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Prose + LaTeX -> HTML with KaTeX markup (needs the KaTeX stylesheet, inlined below).
function rich(text: string): string {
  return splitMath(text)
    .map((seg) => ("text" in seg ? esc(seg.text).replace(/\n/g, "<br/>") : katex.renderToString(seg.tex, { throwOnError: false, displayMode: seg.display })))
    .join("");
}

let katexCss: string | null = null;
function katexStyles(): string {
  if (katexCss === null) {
    const p = join(process.cwd(), "node_modules", "katex", "dist", "katex.min.css");
    // Fonts are relative in the shipped CSS; point them at a CDN so the standalone file renders anywhere.
    katexCss = existsSync(p) ? readFileSync(p, "utf8").replace(/url\(fonts\//g, "url(https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/fonts/") : "";
  }
  return katexCss;
}

const BASE_CSS = `
  body{font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;max-width:760px;margin:24px auto;padding:0 20px;line-height:1.5}
  h1{font-size:22px;margin:0 0 4px} h2{font-size:16px;margin:24px 0 8px;color:#334155}
  .muted{color:#64748b;font-size:13px} .card{border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;margin:12px 0}
  .tag{display:inline-block;background:#1e293b;color:#fff;border-radius:999px;padding:1px 9px;font-size:11px;font-weight:600;margin-right:6px}
  .skill{display:inline-block;background:#dbeafe;color:#1e3a8a;border-radius:999px;padding:1px 9px;font-size:11px;font-weight:600}
  .work{height:110px;border-bottom:1px dashed #cbd5e1;margin-top:10px} table{border-collapse:collapse;width:100%;font-size:13px}
  td,th{border-bottom:1px solid #e2e8f0;padding:6px 4px;text-align:left} .bar{height:8px;background:#e2e8f0;border-radius:4px;overflow:hidden}
  .bar i{display:block;height:100%} a{color:#1d4ed8} @media print{.noprint{display:none}}
`;

function page(title: string, body: string, withKatex = false): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>${BASE_CSS}${withKatex ? katexStyles() : ""}</style></head><body>${body}</body></html>`;
}

// ---------------------------------------------------------------------------
// Mail
// ---------------------------------------------------------------------------

type Mail = { to: string[]; cc?: string[]; subject: string; html: string; attachments?: { filename: string; content: string }[] };

async function send(mail: Mail, slug: string): Promise<"sent" | "outbox"> {
  if (!existsSync(OUTBOX)) mkdirSync(OUTBOX, { recursive: true });
  const file = join(OUTBOX, `${slug}.html`);
  writeFileSync(file, mail.html);
  for (const a of mail.attachments ?? []) writeFileSync(join(OUTBOX, a.filename), a.content);

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  const recipients = [...mail.to, ...(mail.cc ?? [])].filter(Boolean);
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !recipients.length) {
    console.log(`  saved to ${file}${recipients.length ? " (SMTP not configured, not sent)" : " (no recipient set in Settings)"}`);
    return "outbox";
  }
  const transporter = nodemailer.createTransport({ host: SMTP_HOST, port: parseInt(SMTP_PORT ?? "587", 10), secure: SMTP_PORT === "465", auth: { user: SMTP_USER, pass: SMTP_PASS } });
  await transporter.sendMail({ from: SMTP_FROM ?? SMTP_USER, to: mail.to.join(","), cc: mail.cc?.join(","), subject: mail.subject, html: mail.html, attachments: mail.attachments });
  console.log(`  sent "${mail.subject}" to ${recipients.join(", ")}`);
  return "sent";
}

// ---------------------------------------------------------------------------
// Modes
// ---------------------------------------------------------------------------

async function morning(date: string, force: boolean) {
  const learner = await getLearner();
  const cfg = planConfig(learner.plan);
  const day = planDayFor(cfg, date);
  if (!day) return console.log(`${date} is outside the plan window.`);
  const dayNo = daysBetween(cfg.startDate, date) + 1;
  const toA = daysBetween(date, cfg.examADate);
  const toB = daysBetween(date, cfg.examBDate);
  const to = [learner.plan.deliverTo ?? ""].filter(Boolean);
  const cc = [learner.plan.parentEmail ?? ""].filter(Boolean);

  if (!IS_STUDY_DAY[day.kind]) {
    const html = page(`Day ${dayNo}`, `<h1>Day ${dayNo}: ${esc(day.label)}</h1><p class="muted">${fmtLong(date)} · ${toA} days to 10A · ${toB} days to 10B</p><p>${esc(day.note ?? "Nothing assigned today.")}</p>`);
    await send({ to, cc, subject: `AMC 10 – Day ${dayNo}: ${day.label}`, html }, `${date}-morning`);
    return;
  }

  const { worksheet } = await getOrCreateWorksheet(date);
  if (!worksheet) return console.log("No worksheet could be built.");
  if (worksheet.sentAt && !force) return console.log(`Already sent at ${worksheet.sentAt.toISOString()} (use --force to resend).`);
  const { items } = await loadWorksheetView(worksheet);
  const lesson = day.skillIds[0] ? lessonFor(day.skillIds[0]) : null;

  // Standalone printable worksheet.
  const problems = items
    .map(
      (it, i) => `<div class="card"><div><span class="tag">${i + 1}</span><span class="tag">${esc(it.roleLabel)}</span>${it.skillName ? `<span class="skill">${esc(it.skillName)}</span>` : ""}<span class="muted" style="float:right">${it.problem.globalDifficulty}/10</span></div>
      <div style="margin-top:8px">${rich(it.problem.statement)}</div>${Object.keys(it.problem.choices).length ? `<div class="muted" style="margin-top:6px">${Object.entries(it.problem.choices).map(([k, v]) => `<b>${k}</b> ${katex.renderToString(v, { throwOnError: false })}`).join(" &nbsp; ")}</div>` : ""}
      <div class="work"></div><div class="muted">Answer: ________ &nbsp; Sure / Unsure / Guessed</div></div>`
    )
    .join("");
  const sheetHtml = page(
    worksheet.title,
    `<h1>${esc(worksheet.title)}</h1><p class="muted">${fmtLong(date)} · ${items.length} problems · enter answers at <a href="${APP_URL}/worksheet/${worksheet.id}">${APP_URL}/worksheet/${worksheet.id}</a></p>${problems}`,
    true
  );

  const planLines = [
    `<b>Warm-up (10 min):</b> review-queue and weak-skill problems are the first items on the sheet.`,
    lesson && day.skillIds[0] ? `<b>Lesson (20 min):</b> <a href="${APP_URL}/lessons/${day.skillIds[0]}">${esc(SKILL_BY_ID[day.skillIds[0]].name)}</a> — ${esc(lesson.summary.replace(/\$[^$]*\$/g, "…"))}` : `<b>${esc(KIND_LABEL[day.kind])}:</b> ${esc(day.note ?? day.label)}`,
    day.paperMock ? `<b>Paper mock:</b> <a href="${aopsUrl(day.paperMock)}">${esc(day.paperMock.label)}</a>, 75 min, then log it at <a href="${APP_URL}/mock">${APP_URL}/mock</a>.` : `<b>Worksheet (30 min):</b> ${items.length} problems, easy to hard. Attached, and online at <a href="${APP_URL}/worksheet/${worksheet.id}">${APP_URL}/worksheet/${worksheet.id}</a>.`,
    `<b>Corrections (10 min):</b> enter answers online, read the solution for every miss, tag each one C/S/E/R/T.`,
  ];
  const html = page(
    `Day ${dayNo}`,
    `<h1>Day ${dayNo}: ${esc(day.label)}</h1><p class="muted">${fmtLong(date)} · ${toA} days to 10A · ${toB} days to 10B</p><ol>${planLines.map((l) => `<li>${l}</li>`).join("")}</ol>
     ${day.note ? `<p class="muted">${esc(day.note)}</p>` : ""}<p><a href="${APP_URL}/today"><b>Open today's page →</b></a></p>`
  );
  const status = await send({ to, cc, subject: `AMC 10 – Day ${dayNo}: ${day.label}`, html, attachments: [{ filename: `worksheet-${date}.html`, content: sheetHtml }] }, `${date}-morning`);
  if (status === "sent") await db.worksheet.update({ where: { id: worksheet.id }, data: { sentAt: new Date() } });
}

async function evening(date: string) {
  const learner = await getLearner();
  const cfg = planConfig(learner.plan);
  const day = planDayFor(cfg, date);
  const dayNo = daysBetween(cfg.startDate, date) + 1;
  const to = [learner.plan.parentEmail ?? learner.plan.deliverTo ?? ""].filter(Boolean);
  const sheet = await db.worksheet.findFirst({ where: { userId: learner.id, date, kind: { notIn: ["extra-mock", "practice"] } } });
  const attempts = sheet ? await db.attempt.findMany({ where: { worksheetId: sheet.id }, include: { problem: { select: { skills: { select: { skillId: true } } } } } }) : [];
  const time = attempts.reduce((a, x) => a + (x.timeSpentSec ?? 0), 0);
  const tags: Record<string, number> = {};
  const missedSkills = new Set<string>();
  let sureWrong = 0;
  for (const a of attempts) {
    if (a.isCorrect) continue;
    if (a.errorTag) tags[a.errorTag] = (tags[a.errorTag] ?? 0) + 1;
    if (a.confidence === "sure") sureWrong++;
    a.problem.skills.forEach((s) => missedSkills.add(s.skillId));
  }
  const tomorrow = planDayFor(cfg, addDays(date, 1));
  const changes: string[] = [];
  if (tags.C) changes.push(`Concept tag${tags.C > 1 ? "s" : ""}: ${[...missedSkills].map((id) => SKILL_BY_ID[id]?.name).filter(Boolean).join(", ")} drop one band and are pinned into tomorrow's weak slots.`);
  if (tags.S) changes.push("Setup tag: two extra same-skill problems at the same level tomorrow.");
  if ((tags.E ?? 0) + (tags.R ?? 0) >= 2) changes.push("Execution/misread tags: a 5-problem accuracy sprint opens tomorrow's sheet.");
  if ((tags.T ?? 0) >= 2) changes.push("Time tags: a timed 5-problem speed set opens tomorrow's sheet.");
  const due = await db.reviewItem.count({ where: { userId: learner.id, dueDate: { lte: addDays(date, 1) } } });
  if (due) changes.push(`${due} problem${due > 1 ? "s" : ""} from the review queue come back tomorrow.`);

  const body = `<h1>Day ${dayNo} summary</h1><p class="muted">${fmtLong(date)} · ${day ? esc(day.label) : ""}</p>
    <div class="card">${
      !sheet
        ? "<b>Not started.</b> Today's worksheet was never opened."
        : sheet.status === "done"
          ? `<b>Done.</b> ${sheet.score}/${sheet.total} correct · ${Math.round(time / 60)} min on problems${sureWrong ? ` · <b style="color:#b91c1c">${sureWrong} "sure" answer${sureWrong > 1 ? "s" : ""} wrong</b>` : ""}`
          : `<b>Incomplete.</b> ${attempts.length}/${sheet.total} answered so far. <a href="${APP_URL}/worksheet/${sheet.id}">Resume</a>`
    }</div>
    ${Object.keys(tags).length ? `<h2>Error tags</h2><ul>${Object.entries(tags).map(([t, n]) => `<li><b>${t}</b> ${ERROR_TAGS[t as ErrorTag].name}: ${n}</li>`).join("")}</ul>` : ""}
    <h2>Tomorrow</h2><p>${tomorrow ? `${esc(KIND_LABEL[tomorrow.kind])}: ${esc(tomorrow.label)}` : "Outside the plan."}</p>
    ${changes.length ? `<ul>${changes.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>` : "<p class=\"muted\">No adaptation triggered today.</p>"}
    <p><a href="${APP_URL}/progress">Progress dashboard →</a></p>`;
  await send({ to, subject: `AMC 10 – Day ${dayNo} ${sheet?.status === "done" ? `done (${sheet.score}/${sheet.total})` : "summary"}`, html: page("Summary", body) }, `${date}-evening`);
}

async function digest(date: string) {
  const learner = await getLearner();
  const cfg = planConfig(learner.plan);
  const mastery = await getMasteryMap(learner.id);
  const to = [learner.plan.parentEmail ?? learner.plan.deliverTo ?? ""].filter(Boolean);
  const avg = (ids: string[]) => (ids.length ? ids.reduce((a, id) => a + mastery[id].effective, 0) / ids.length : 0);
  const proj = projectAmcScore(avg(SKILLS.filter((s) => s.tier === 1).map((s) => s.id)), avg(SKILLS.filter((s) => s.tier === 2).map((s) => s.id)));
  const weakest = [...SKILLS].sort((a, b) => mastery[a.id].effective - mastery[b.id].effective).slice(0, 3);
  const week = buildCalendar(cfg).filter((d) => daysBetween(date, d.date) > 0 && daysBetween(date, d.date) <= 7);
  const sheets = await db.worksheet.findMany({ where: { userId: learner.id, date: { gte: addDays(date, -6), lte: date }, kind: { notIn: ["practice"] } } });
  const doneN = sheets.filter((s) => s.status === "done").length;
  const mocks = await db.mockExam.findMany({ where: { userId: learner.id }, orderBy: { date: "asc" } });

  const rows = SKILLS.map((s) => {
    const m = mastery[s.id];
    const lvl = masteryLevel(m.effective, m.attempts);
    const color = { "Not started": "#94a3b8", Developing: "#dc2626", Progressing: "#d97706", Proficient: "#2563eb", Mastered: "#16a34a" }[lvl];
    return `<tr><td>${esc(s.name)}</td><td>${m.attempts ? `${m.correct}/${m.attempts}` : "—"}</td><td style="width:40%"><div class="bar"><i style="width:${Math.round(m.effective * 100)}%;background:${color}"></i></div></td><td>${lvl}</td></tr>`;
  }).join("");
  const body = `<h1>Weekly digest</h1><p class="muted">Week ending ${fmtLong(date)} · ${daysBetween(date, cfg.examADate)} days to 10A</p>
    <div class="card"><b>Projected AMC 10: ${proj.expected}</b> (≈${proj.correct} correct, attempt through #${proj.attemptThrough}) · ${doneN}/${sheets.length} worksheets done this week${mocks.length ? ` · last paper mock: ${mocks[mocks.length - 1].score} (${mocks[mocks.length - 1].year} ${mocks[mocks.length - 1].contest})` : ""}</div>
    <h2>Weakest three</h2><ul>${weakest.map((s) => `<li>${esc(s.name)} — ${Math.round(mastery[s.id].effective * 100)}%</li>`).join("")}</ul>
    <h2>Next week</h2><table>${week.map((d) => `<tr><td>${fmtShort(d.date)}</td><td>${KIND_LABEL[d.kind]}</td><td>${esc(d.label)}${d.paperMock ? ` · <a href="${aopsUrl(d.paperMock)}">${esc(d.paperMock.label)}</a>` : ""}</td></tr>`).join("")}</table>
    <h2>Mastery</h2><table><tr><th>Skill</th><th>Right</th><th>Mastery</th><th>Level</th></tr>${rows}</table>
    <p><a href="${APP_URL}/progress">Progress dashboard →</a></p>`;
  await send({ to, subject: `AMC 10 – weekly digest (${fmtShort(date)})`, html: page("Weekly digest", body) }, `${date}-digest`);
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args.find((a) => ["morning", "evening", "digest"].includes(a)) ?? "morning";
  const di = args.indexOf("--date");
  const date = di !== -1 && /^\d{4}-\d{2}-\d{2}$/.test(args[di + 1] ?? "") ? args[di + 1] : todayStr();
  const force = args.includes("--force");
  console.log(`daily ${mode} for ${date}`);
  if (mode === "morning") await morning(date, force);
  else if (mode === "evening") await evening(date);
  else {
    if (weekday(date) !== 0 && !force) console.log("  (digest normally runs on Sundays; sending anyway)");
    await digest(date);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
