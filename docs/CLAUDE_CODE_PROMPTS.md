# Claude Code prompts for this repo

The original six prompts in `amc10-prep-plan-and-claude-code-prompts.md` were written before the
codebase was inspected. This file records what of that plan is already built (as of Sep 20, 2026),
what was changed on purpose, and the prompts that take it further. Run them one per session from the
repo root; each ends with a checkpoint.

## What is built (maps to the original prompts)

| Original | Status | Where |
|---|---|---|
| 0 Audit | Done, folded into README + this doc | `README.md`, `docs/PLAN.md` |
| 1 Problem bank & taxonomy | Done, with a difference: the bank is 12,302 open-licensed MATH/AIME problems, **not** AMC papers (AoPS blocks scraping; MAA problems are copyrighted). 28 skills instead of the 50-subtopic taxonomy, tagged by keyword. Reserved mocks are moot because no AMC problems are in the bank. | `src/curriculum/skills.ts`, `scripts/seed.ts` (`tagSkillsForAllProblems`) |
| 2 Adaptive engine | Done: mastery EMA with confidence modifiers, band selection, 1/3/7/14 review queue, error-tag effects, mock re-plan, projected score with attempt-through-N. Deterministic-seed and 45-day simulation **not** done (see Prompt B). | `src/lib/mastery.ts`, `src/lib/worksheet.ts`, `src/lib/learner.ts` |
| 3 Calendar & lessons | Done: 7-week template with paper mocks, pause/push, compress/expand; 28 lessons with worked examples. | `src/curriculum/calendar.ts`, `src/lib/plan.ts`, `src/curriculum/lessons.ts` |
| 4 Student experience | Done: Today, worksheet with confidence + required error tags, timed in-app mock with AMC scoring, diagnostic, lesson practice. Print version = the HTML attachment from the morning email (no PDF). | `src/app/*`, `src/components/WorksheetClient.tsx`, `MockClient.tsx` |
| 5 Scheduling & email | Done locally: `npm run daily` (morning / evening / digest) via SMTP or `data/outbox/`, Windows Task Scheduler wrappers. Idempotent per date. No Vercel cron / Resend (local-first). | `scripts/daily.ts`, `scripts/register-tasks.cmd` |
| 6 Parent dashboard & QA | Partly: `/progress` has projection, mastery, error tags, review queue, mocks; "why this problem" is shown per item. No separate parent login (single local user). Playwright covers the core flow. | `src/app/progress/page.tsx` |

## Prompts to run next

### Prompt A — Load real AMC 10 papers (when you have them legally)

```
The bank in this repo (MATH + AIME) has no AMC 10 multiple-choice problems. I have the AMC 10 papers
listed in data/amc/ as one JSON file per paper: {year, contest:"AMC10A"|"AMC10B", problems:[{number,
statement (LaTeX), choices:{A..E}, answer, solution?}]}. Write scripts/adapters/amc-json.ts that
imports them into data/problems.raw.json alongside the existing sources (contestId AMC10A/AMC10B,
localDifficulty/globalDifficulty from scripts/contests.ts, choices as a JSON string), then run
classify + seed. Add reservedForMock (bool) to Problem and set it true for the papers named in
src/curriculum/calendar.ts (2015 10A, 2016 10A, 2017 10B, 2018 10A, 2019 10B, 2022 10A, 2023 10A,
2024 10A, 2024 10B, 2025 10A/B). Make pickProblems() in src/lib/worksheet.ts skip reserved problems
until a MockExam row for that paper exists. Extend npm run verify with counts per paper and a check
that no reserved problem appears in any generated worksheet. Stop and report the counts.
```

### Prompt B — Deterministic simulation of the engine

```
Add scripts/simulate.ts: a fake student with a hidden true-skill vector runs the full calendar from
src/curriculum/calendar.ts against the seeded bank, answering each worksheet with probability derived
from true skill vs problem difficulty, tagging misses plausibly, and completing Saturday mocks. Make
pickProblems() accept an injectable RNG so the run is reproducible from a seed. Print, per week:
mastery vs true skill (mean abs error), band movements per skill, review-queue size, projected score.
Assert: bands never move more than one step per day; no problem is served twice outside the review
queue; every skill is taught before the sharpen phase; the projection converges toward the true
expected score by week 5. Wire it into npm run verify with a fixed seed. Stop and show the summary.
```

### Prompt C — Paper-mock misses feed the engine

```
On /mock, the logged missed problem numbers are stored but unused. Add an optional per-number
skill picker (the 28 skills from src/curriculum/skills.ts, keyboard-driven: type a number, pick a
skill, Enter) so a paper mock becomes a set of skill misses. Feed those into collectSignals() in
src/lib/worksheet.ts the same way in-app mock misses are (pin skills under 50% for the next 5
worksheets), and show "from paper mock" as the reason on the worksheet. Stop and walk me through
logging one mock.
```

### Prompt D — Hosted delivery

```
I want the daily emails to work without my laptop being on. Keep local-first as the default, but add
a deploy path: Next.js on Vercel with the SQLite file replaced by Turso (libSQL) via the Prisma
driver adapter, a Vercel Cron hitting /api/cron/daily?mode=morning|evening|digest (protected by
CRON_SECRET) that calls the same functions as scripts/daily.ts, and Resend for mail (RESEND_API_KEY).
Keep scripts/daily.ts working locally. Don't put problem statements on any unauthenticated route:
add a single shared-password gate (STUDENT_PASSWORD env) via middleware. Update README with the env
vars and a deploy checklist. Stop before deploying and show me the diff.
```

### Prompt E — Second student

```
Generalize the single local learner into multiple students: a /students switcher (cookie-based, no
passwords locally), StudyPlan/Worksheet/Attempt/ReviewItem/SkillMastery already key on userId so the
change is mostly getLearner() in src/lib/learner.ts and the daily script taking --student <name>.
Each student gets their own emails. Update the scheduled tasks to loop over students. Stop and show
me two students with different calendars.
```

### Prompt F — Tune the tagging

```
Run npm run tag and print, for each of the 28 skills, 10 random tagged problem statements (first 120
chars). I'll mark false positives. Then tighten the keyword lists in src/curriculum/skills.ts for the
skills I flag, re-run tag, and show before/after counts per skill. Also list problems tagged with 4+
skills; those keyword lists are too broad. Stop after the first report and wait for my marks.
```

## Conventions when prompting in this repo

- Say "typecheck, verify, and test must pass" — that's `npm run typecheck && npm run verify && npm run test`.
- Adaptation logic lives in exactly three files: `src/lib/mastery.ts` (scores), `src/lib/worksheet.ts`
  (composition), `src/lib/plan.ts` + `src/curriculum/calendar.ts` (calendar). Ask for changes there, not in pages.
- Never ask it to scrape AoPS; it is blocked and against their terms.
