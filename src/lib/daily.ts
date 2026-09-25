// Daily delivery, shared by the CLI (scripts/daily.ts, Windows Task Scheduler) and the
// hosted cron endpoint (src/app/api/cron). Modes:
//   morning  build today's worksheet, mail it to the student (cc parent) with a
//            printable HTML attachment
//   evening  parent summary of today + what changes tomorrow (Sundays also send the digest)
//   digest   weekly mastery digest
// Transport, in order: Resend (RESEND_API_KEY) -> SMTP (SMTP_*) -> data/outbox/ HTML
// files (local only; the hosted filesystem is read-only).
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import katex from "katex";
import { db } from "./db";
import { listLearners, getMasteryMap, planConfig, type Learner } from "./learner";
import { getOrCreateWorksheet } from "./worksheet";
import { loadWorksheetView } from "./views";
import { buildCalendar, planDayFor, KIND_LABEL, IS_STUDY_DAY } from "./plan";
import { aopsUrl } from "@/curriculum/calendar";
import { SKILLS, SKILL_BY_ID } from "@/curriculum/skills";
import { lessonFor } from "@/curriculum/lessons";
import { richHtml, texToHtml } from "./richHtml";
import { normalizeChoiceTex } from "./tex";
import { projectAmcScore, masteryLevel, ERROR_TAGS, type ErrorTag } from "./mastery";
import { todayStr, fmtLong, fmtShort, daysBetween, addDays, weekday } from "./dates";

const APP_URL = () => (process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")).replace(/\/$/, "");
const OUTBOX = join(process.cwd(), "data", "outbox");

export type Mode = "morning" | "evening" | "digest";
export type SendResult = "sent" | "outbox" | "skipped";
export type RunReport = { mode: Mode; date: string; results: { learner: string; result: SendResult | "error"; detail?: string }[] };

// ---------------------------------------------------------------------------
// Rendering helpers
// ---------------------------------------------------------------------------

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function rich(text: string): string {
  return richHtml(text, APP_URL());
}

let katexCss: string | null = null;
function katexStyles(): string {
  if (katexCss === null) {
    try {
      const p = join(process.cwd(), "node_modules", "katex", "dist", "katex.min.css");
      katexCss = existsSync(p) ? readFileSync(p, "utf8").replace(/url\(fonts\//g, "url(https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/fonts/") : "";
    } catch {
      katexCss = "";
    }
    if (!katexCss) katexCss = `@import url("https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css");`;
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
// Transport
// ---------------------------------------------------------------------------

type Mail = { to: string[]; cc?: string[]; subject: string; html: string; attachments?: { filename: string; content: string }[] };

async function sendViaResend(mail: Mail): Promise<void> {
  const from = process.env.MAIL_FROM ?? "MathArena <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: mail.to,
      cc: mail.cc?.length ? mail.cc : undefined,
      subject: mail.subject,
      html: mail.html,
      attachments: mail.attachments?.map((a) => ({ filename: a.filename, content: Buffer.from(a.content, "utf8").toString("base64") })),
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

async function sendViaSmtp(mail: Mail): Promise<void> {
  const nodemailer = (await import("nodemailer")).default;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  const transporter = nodemailer.createTransport({ host: SMTP_HOST, port: parseInt(SMTP_PORT ?? "587", 10), secure: SMTP_PORT === "465", auth: { user: SMTP_USER, pass: SMTP_PASS } });
  await transporter.sendMail({ from: SMTP_FROM ?? SMTP_USER, to: mail.to.join(","), cc: mail.cc?.join(","), subject: mail.subject, html: mail.html, attachments: mail.attachments });
}

function saveToOutbox(mail: Mail, slug: string): string | null {
  try {
    if (!existsSync(OUTBOX)) mkdirSync(OUTBOX, { recursive: true });
    const file = join(OUTBOX, `${slug}.html`);
    writeFileSync(file, mail.html);
    for (const a of mail.attachments ?? []) writeFileSync(join(OUTBOX, a.filename), a.content);
    return file;
  } catch {
    return null; // read-only filesystem (hosted)
  }
}

async function send(mail: Mail, slug: string, log: (s: string) => void): Promise<SendResult> {
  const recipients = [...mail.to, ...(mail.cc ?? [])].filter(Boolean);
  const file = saveToOutbox(mail, slug);
  if (!recipients.length) {
    log(`  no recipient set in Settings${file ? `; saved to ${file}` : ""}`);
    return "skipped";
  }
  if (process.env.RESEND_API_KEY) {
    await sendViaResend(mail);
    log(`  sent via Resend "${mail.subject}" to ${recipients.join(", ")}`);
    return "sent";
  }
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    await sendViaSmtp(mail);
    log(`  sent via SMTP "${mail.subject}" to ${recipients.join(", ")}`);
    return "sent";
  }
  log(`  ${file ? `saved to ${file}` : "no mail transport configured"} (set RESEND_API_KEY or SMTP_*)`);
  return file ? "outbox" : "skipped";
}

// ---------------------------------------------------------------------------
// Modes
// ---------------------------------------------------------------------------

export async function morning(learner: Learner, date: string, force: boolean, log: (s: string) => void): Promise<SendResult> {
  const cfg = planConfig(learner.plan);
  const day = planDayFor(cfg, date);
  if (!day) {
    log(`  ${date} is outside the plan window.`);
    return "skipped";
  }
  const dayNo = daysBetween(cfg.startDate, date) + 1;
  const toA = daysBetween(date, cfg.examADate);
  const toB = daysBetween(date, cfg.examBDate);
  const to = [learner.plan.deliverTo ?? ""].filter(Boolean);
  const cc = [learner.plan.parentEmail ?? ""].filter(Boolean);
  const slug = `${date}-${learner.id.slice(-6)}-morning`;
  const url = APP_URL();

  if (!IS_STUDY_DAY[day.kind]) {
    const html = page(`Day ${dayNo}`, `<h1>Day ${dayNo}: ${esc(day.label)}</h1><p class="muted">${fmtLong(date)} · ${toA} days to 10A · ${toB} days to 10B</p><p>${esc(day.note ?? "Nothing assigned today.")}</p>`);
    return send({ to, cc, subject: `AMC 10 – Day ${dayNo}: ${day.label}`, html }, slug, log);
  }

  const { worksheet } = await getOrCreateWorksheet(learner, date);
  if (!worksheet) {
    log("  no worksheet could be built.");
    return "skipped";
  }
  if (worksheet.sentAt && !force) {
    log(`  already sent at ${worksheet.sentAt.toISOString()}`);
    return "skipped";
  }
  const { items } = await loadWorksheetView(worksheet);
  const lesson = day.skillIds[0] ? lessonFor(day.skillIds[0]) : null;

  const problems = items
    .map(
      (it, i) => `<div class="card"><div><span class="tag">${i + 1}</span><span class="tag">${esc(it.roleLabel)}</span>${it.skillName ? `<span class="skill">${esc(it.skillName)}</span>` : ""}<span class="muted" style="float:right">${it.problem.globalDifficulty}/10</span></div>
      <div style="margin-top:8px">${rich(it.problem.statement)}</div>${Object.keys(it.problem.choices).length ? `<div class="muted" style="margin-top:6px">${Object.entries(it.problem.choices).map(([k, v]) => `<b>${k}</b> ${texToHtml(normalizeChoiceTex(v), false)}`).join(" &nbsp; ")}</div>` : ""}
      <div class="work"></div><div class="muted">Answer: ________ &nbsp; Sure / Unsure / Guessed</div></div>`
    )
    .join("");
  const sheetHtml = page(worksheet.title, `<h1>${esc(worksheet.title)}</h1><p class="muted">${fmtLong(date)} · ${items.length} problems · enter answers at <a href="${url}/worksheet/${worksheet.id}">${url}/worksheet/${worksheet.id}</a></p>${problems}`, true);

  const planLines = [
    `<b>Warm-up (10 min):</b> review-queue and weak-skill problems are the first items on the sheet.`,
    lesson && day.skillIds[0] ? `<b>Lesson (20 min):</b> <a href="${url}/lessons/${day.skillIds[0]}">${esc(SKILL_BY_ID[day.skillIds[0]].name)}</a> — ${esc(lesson.summary.replace(/\$[^$]*\$/g, "…"))}` : `<b>${esc(KIND_LABEL[day.kind])}:</b> ${esc(day.note ?? day.label)}`,
    day.paperMock ? `<b>Paper mock:</b> <a href="${aopsUrl(day.paperMock)}">${esc(day.paperMock.label)}</a>, 75 min, then log it at <a href="${url}/mock">${url}/mock</a>.` : `<b>Worksheet (30 min):</b> ${items.length} problems, easy to hard. Attached, and online at <a href="${url}/worksheet/${worksheet.id}">${url}/worksheet/${worksheet.id}</a>.`,
    `<b>Corrections (10 min):</b> enter answers online, read the solution for every miss, tag each one C/S/E/R/T.`,
  ];
  const html = page(`Day ${dayNo}`, `<h1>Day ${dayNo}: ${esc(day.label)}</h1><p class="muted">${fmtLong(date)} · ${toA} days to 10A · ${toB} days to 10B</p><ol>${planLines.map((l) => `<li>${l}</li>`).join("")}</ol>${day.note ? `<p class="muted">${esc(day.note)}</p>` : ""}<p><a href="${url}/today"><b>Open today's page →</b></a></p>`);
  const status = await send({ to, cc, subject: `AMC 10 – Day ${dayNo}: ${day.label}`, html, attachments: [{ filename: `worksheet-${date}.html`, content: sheetHtml }] }, slug, log);
  if (status === "sent") await db.worksheet.update({ where: { id: worksheet.id }, data: { sentAt: new Date() } });
  return status;
}

export async function evening(learner: Learner, date: string, log: (s: string) => void): Promise<SendResult> {
  const cfg = planConfig(learner.plan);
  const day = planDayFor(cfg, date);
  const dayNo = daysBetween(cfg.startDate, date) + 1;
  const to = [learner.plan.parentEmail ?? learner.plan.deliverTo ?? ""].filter(Boolean);
  const url = APP_URL();
  const sheet = await db.worksheet.findFirst({ where: { userId: learner.id, date, kind: { notIn: ["extra-mock", "practice", "lesson-quiz"] } } });
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
  const lessonsToday = await db.lessonProgress.findMany({ where: { userId: learner.id, updatedAt: { gte: new Date(`${date}T00:00:00`) } }, select: { skillId: true, status: true, checkpointsCorrect: true, checkpointsTotal: true, quizScore: true, quizTotal: true } });
  const tomorrow = planDayFor(cfg, addDays(date, 1));
  const changes: string[] = [];
  if (tags.C) changes.push(`Concept tag${tags.C > 1 ? "s" : ""}: ${[...missedSkills].map((id) => SKILL_BY_ID[id]?.name).filter(Boolean).join(", ")} drop one band and are pinned into tomorrow's weak slots.`);
  if (tags.S) changes.push("Setup tag: two extra same-skill problems at the same level tomorrow.");
  if ((tags.E ?? 0) + (tags.R ?? 0) >= 2) changes.push("Execution/misread tags: a 5-problem accuracy sprint opens tomorrow's sheet.");
  if ((tags.T ?? 0) >= 2) changes.push("Time tags: a timed 5-problem speed set opens tomorrow's sheet.");
  const due = await db.reviewItem.count({ where: { userId: learner.id, dueDate: { lte: addDays(date, 1) } } });
  if (due) changes.push(`${due} problem${due > 1 ? "s" : ""} from the review queue come back tomorrow.`);

  const body = `<h1>Day ${dayNo} summary · ${esc(learner.name)}</h1><p class="muted">${fmtLong(date)} · ${day ? esc(day.label) : ""}</p>
    <div class="card">${
      !sheet
        ? "<b>Not started.</b> Today's worksheet was never opened."
        : sheet.status === "done"
          ? `<b>Done.</b> ${sheet.score}/${sheet.total} correct · ${Math.round(time / 60)} min on problems${sureWrong ? ` · <b style="color:#b91c1c">${sureWrong} "sure" answer${sureWrong > 1 ? "s" : ""} wrong</b>` : ""}`
          : `<b>Incomplete.</b> ${attempts.length}/${sheet.total} answered so far. <a href="${url}/worksheet/${sheet.id}">Resume</a>`
    }</div>
    ${lessonsToday.length ? `<h2>Lessons today</h2><ul>${lessonsToday.map((l) => `<li>${esc(SKILL_BY_ID[l.skillId]?.name ?? l.skillId)}: ${l.status.replace("_", " ")}${l.checkpointsTotal ? ` · checkpoints ${l.checkpointsCorrect}/${l.checkpointsTotal}` : ""}${l.quizScore != null ? ` · quiz ${l.quizScore}/${l.quizTotal}` : ""}</li>`).join("")}</ul>` : ""}
    ${Object.keys(tags).length ? `<h2>Error tags</h2><ul>${Object.entries(tags).map(([t, n]) => `<li><b>${t}</b> ${ERROR_TAGS[t as ErrorTag].name}: ${n}</li>`).join("")}</ul>` : ""}
    <h2>Tomorrow</h2><p>${tomorrow ? `${esc(KIND_LABEL[tomorrow.kind])}: ${esc(tomorrow.label)}` : "Outside the plan."}</p>
    ${changes.length ? `<ul>${changes.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>` : "<p class=\"muted\">No adaptation triggered today.</p>"}
    <p><a href="${url}/progress">Progress dashboard →</a></p>`;
  return send({ to, subject: `AMC 10 – ${learner.name} day ${dayNo} ${sheet?.status === "done" ? `done (${sheet.score}/${sheet.total})` : "summary"}`, html: page("Summary", body) }, `${date}-${learner.id.slice(-6)}-evening`, log);
}

export async function digest(learner: Learner, date: string, log: (s: string) => void): Promise<SendResult> {
  const cfg = planConfig(learner.plan);
  const mastery = await getMasteryMap(learner.id);
  const to = [learner.plan.parentEmail ?? learner.plan.deliverTo ?? ""].filter(Boolean);
  const url = APP_URL();
  const avg = (ids: string[]) => (ids.length ? ids.reduce((a, id) => a + mastery[id].effective, 0) / ids.length : 0);
  const proj = projectAmcScore(avg(SKILLS.filter((s) => s.tier === 1).map((s) => s.id)), avg(SKILLS.filter((s) => s.tier === 2).map((s) => s.id)));
  const weakest = [...SKILLS].sort((a, b) => mastery[a.id].effective - mastery[b.id].effective).slice(0, 3);
  const week = buildCalendar(cfg).filter((d) => daysBetween(date, d.date) > 0 && daysBetween(date, d.date) <= 7);
  const sheets = await db.worksheet.findMany({ where: { userId: learner.id, date: { gte: addDays(date, -6), lte: date }, kind: { notIn: ["practice", "lesson-quiz"] } } });
  const doneN = sheets.filter((s) => s.status === "done").length;
  const mocks = await db.mockExam.findMany({ where: { userId: learner.id }, orderBy: { date: "asc" } });

  const rows = SKILLS.map((s) => {
    const m = mastery[s.id];
    const lvl = masteryLevel(m.effective, m.attempts);
    const color = { "Not started": "#94a3b8", Developing: "#dc2626", Progressing: "#d97706", Proficient: "#2563eb", Mastered: "#16a34a" }[lvl];
    return `<tr><td>${esc(s.name)}</td><td>${m.attempts ? `${m.correct}/${m.attempts}` : "—"}</td><td style="width:40%"><div class="bar"><i style="width:${Math.round(m.effective * 100)}%;background:${color}"></i></div></td><td>${lvl}</td></tr>`;
  }).join("");
  const body = `<h1>Weekly digest · ${esc(learner.name)}</h1><p class="muted">Week ending ${fmtLong(date)} · ${daysBetween(date, cfg.examADate)} days to 10A</p>
    <div class="card"><b>Projected AMC 10: ${proj.expected}</b> (≈${proj.correct} correct, attempt through #${proj.attemptThrough}) · ${doneN}/${sheets.length} worksheets done this week${mocks.length ? ` · last paper mock: ${mocks[mocks.length - 1].score} (${mocks[mocks.length - 1].year} ${mocks[mocks.length - 1].contest})` : ""}</div>
    <h2>Weakest three</h2><ul>${weakest.map((s) => `<li>${esc(s.name)} — ${Math.round(mastery[s.id].effective * 100)}%</li>`).join("")}</ul>
    <h2>Next week</h2><table>${week.map((d) => `<tr><td>${fmtShort(d.date)}</td><td>${KIND_LABEL[d.kind]}</td><td>${esc(d.label)}${d.paperMock ? ` · <a href="${aopsUrl(d.paperMock)}">${esc(d.paperMock.label)}</a>` : ""}</td></tr>`).join("")}</table>
    <h2>Mastery</h2><table><tr><th>Skill</th><th>Right</th><th>Mastery</th><th>Level</th></tr>${rows}</table>
    <p><a href="${url}/progress">Progress dashboard →</a></p>`;
  return send({ to, subject: `AMC 10 – ${learner.name} weekly digest (${fmtShort(date)})`, html: page("Weekly digest", body) }, `${date}-${learner.id.slice(-6)}-digest`, log);
}

// Run a mode for every student profile. `evening` on a Sunday also sends the digest,
// which lets a two-job cron (Vercel Hobby) cover all three mails.
export async function runDaily(mode: Mode, date = todayStr(), opts: { force?: boolean; log?: (s: string) => void } = {}): Promise<RunReport> {
  const t0 = Date.now();
  const base = opts.log ?? ((s) => console.log(s));
  // Always echo to the server console too, with elapsed time, so hosted logs show where time goes.
  const log = (s: string) => { base(s); if (opts.log) console.log(`[daily ${mode} +${Date.now() - t0}ms] ${s}`); };
  const report: RunReport = { mode, date, results: [] };
  const learners = await listLearners();
  if (!learners.length) log("  no student profiles yet (create one at /signup)");
  for (const learner of learners) {
    log(`  ${learner.name} <${learner.email}>`);
    try {
      let r: SendResult;
      if (mode === "morning") r = await morning(learner, date, !!opts.force, log);
      else if (mode === "evening") {
        r = await evening(learner, date, log);
        if (weekday(date) === 0) await digest(learner, date, log);
      } else r = await digest(learner, date, log);
      report.results.push({ learner: learner.name, result: r });
    } catch (e: any) {
      log(`  error: ${e?.message ?? e}`);
      report.results.push({ learner: learner.name, result: "error", detail: String(e?.message ?? e) });
    }
  }
  return report;
}
