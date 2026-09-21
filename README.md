# MathArena — adaptive AMC 10 prep

A local-first daily prep system for one student preparing for AMC 10A (Nov 5, 2026) and AMC 10B
(Nov 13, 2026). It runs the plan in [docs/PLAN.md](docs/PLAN.md): a 7-week curriculum of 28 skills,
an 8-problem worksheet every day that adapts to her mastery, error tags and a spaced-repetition
review queue, Saturday paper mocks from the AoPS wiki, and a morning/evening/Sunday email loop
for the parent.

Built with Next.js 14 + SQLite/Prisma + KaTeX + Tailwind. Node 18.18+.

## Hosted

The family instance runs at https://matharena-dun.vercel.app (Vercel + Neon + Resend, all free tiers; see
[docs/DEPLOY.md](docs/DEPLOY.md) for setup, backups and maintenance). The local setup below is the fallback and the dev environment.

## Run it

```powershell
cd C:\Users\General\Desktop\Programming\math-prep
npm run dev          # http://localhost:3000   (on PowerShell, if scripts are blocked: npm.cmd run dev)
```

Everything is already installed and seeded on this machine. From a fresh clone:

```bash
npm install
cp .env.example .env
npx prisma generate && npx prisma db push
npm run build:data   # download + classify + seed the 12k-problem bank (cached under data/vendor)
npm run dev
```

## Accounts

Each student creates a profile at `/signup` (name, email, password, grade); everything — plan, worksheets,
mastery, review queue, lesson progress — belongs to that profile. Sessions are a signed cookie; passwords are
scrypt-hashed locally. The parent can create a second profile (role: parent) or simply sign in as the student.
The daily emails loop over every student profile.

## What's where

| Page | What it does |
|---|---|
| `/` | Countdown to both exams, today's card, streak, projected score, parent checklist |
| `/today` | The daily routine as a checklist: warm-up, lesson, worksheet, corrections (or paper mock) |
| `/plan` | The full calendar, week by week, with completion status and *Push* for missed days |
| `/diagnostic` | Day-1 paper diagnostic (2015 10A) + in-app diagnostic (two problems per skill); baseline and score target |
| `/lessons` | 28 interactive lessons: key ideas with 4 checkpoint questions, formulas, try-first worked examples, pitfalls, AMC strategy, a 5-problem quiz, and "go deeper" links |
| `/skills` | Skill tree: 4 topics → 28 lesson skills (teaching order, prerequisite edges) → 57 sub-skills, each with mastery %, attempts, accuracy and status |
| `/profile` | Questions solved, accuracy by topic, lessons read and quizzes passed, weekly activity, password change |
| `/worksheet/[id]` | Answer entry with math keyboard and live preview, confidence marks, error tags, solutions |
| `/progress` | Mastery by skill, 14-day activity, error-tag breakdown, review queue, mock history |
| `/mock` | Log paper mocks (score + missed numbers); start an extra in-app timed mock |
| `/settings` | Exam dates, rest days, pause dates, problems per day, email addresses |
| `/practice` | Free, untracked practice by topic or skill |

## Daily delivery

```bash
npm run daily                  # morning: builds today's worksheet, mails it (student, cc parent) with a printable HTML
npm run daily -- evening       # 8 PM parent summary: done/not, score, error tags, what changes tomorrow
npm run daily -- digest        # Sunday digest: mastery table, projection, weakest three, next week
```

Set `SMTP_*` in `.env` (Gmail app password works) or every mail is saved to `data/outbox/`.
Windows Task Scheduler entries are created by `scripts\register-tasks.cmd` (06:00, 20:00, Sun 18:00)
and removed by `scripts\unregister-tasks.cmd`. The app must be running for links in the mail to open.

## Problem sources

| Source | License | What it adds |
|---|---|---|
| [MATH](https://huggingface.co/datasets/EleutherAI/hendrycks_math) (Hendrycks) | MIT | 11,370 free-response problems with topic + 5-level difficulty |
| [AIME 1983–2024](https://huggingface.co/datasets/gneubig/aime-1983-2024) | CC0 | 932 integer-answer problems; only #1–5 are served for AMC 10 prep |
| [NuminaMath-1.5](https://huggingface.co/datasets/AI-MO/NuminaMath-1.5) `amc_aime` slice | Apache 2.0 (problems © MAA) | Real AMC 8/10/12 transcriptions; A–E choices are split out so in-app mocks can be multiple choice |

Problems are tagged with the 28 lesson skills and 57 sub-skills by keyword (`src/curriculum/skills.ts`,
`src/curriculum/subskills.ts`); re-tag with `npm run tag`. Seeding is an upsert, so re-seeding never erases a student's history.
The AoPS wiki is blocked to scrapers, so past AMC 10 papers are used as *paper* mocks via links, never fetched.

## Checks

```bash
npm run typecheck    # tsc
npm run verify       # answer matcher (36 cases), LaTeX tokenizer, CSV parser, seeded bank, lesson sanity
npm run test         # Playwright against a running dev server (reuses one on :3000)
```

## Adapting the logic

All adaptation lives in three files: `src/lib/mastery.ts` (scores, bands, error tags, projection),
`src/lib/worksheet.ts` (worksheet composition and every rule), `src/lib/plan.ts` +
`src/curriculum/calendar.ts` (the calendar template). See [CLAUDE.md](CLAUDE.md) and
[docs/CLAUDE_CODE_PROMPTS.md](docs/CLAUDE_CODE_PROMPTS.md) for prompts that extend it.
