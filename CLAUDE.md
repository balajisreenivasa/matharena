# MathArena — working notes for Claude Code

Local-first AMC 10 prep app for one student. Next.js 14 (app router, server actions) + Prisma/SQLite + KaTeX + Tailwind. Node 18.18+.

## Commands
- `npm run dev` — app at http://localhost:3000 (must be running for email links to work)
- `npm run typecheck && npm run verify && npm run test` — the gate for any change (tsc, unit checks + lesson sanity, Playwright)
- `npm run build:data` — import (HuggingFace, cached in data/vendor) → classify → seed; `npm run seed` alone reloads data/problems.json and re-tags skills; `npm run tag` re-tags only
- `npm run daily [-- morning|evening|digest] [--date YYYY-MM-DD] [--force]` — email or write to data/outbox/

## Where the logic lives (change these, not the pages)
- `src/curriculum/skills.ts` — 28 skills, teaching order, keyword regexes for tagging
- `src/curriculum/calendar.ts` — the 7-week template (lessons, paper mocks, gap week)
- `src/curriculum/lessons.ts` — lesson text; `scripts/check-lessons.ts` validates it
- `src/lib/plan.ts` — template → dated calendar (pause dates, compress/expand, anchored exam days)
- `src/lib/mastery.ts` — mastery EMA with confidence weights, bands, error tags, projected score
- `src/lib/worksheet.ts` — worksheet composition and every adaptation rule; each item carries a `reason`
- `src/lib/learner.ts` — single local user + plan, mastery replay from attempts, review queue
- `src/app/api/attempt` — grading (server-side), review queue, mastery replay, worksheet completion

## Conventions
- Dates are local `YYYY-MM-DD` strings everywhere (`src/lib/dates.ts`); never `Date` for calendar logic.
- Mastery is always recomputed by replaying attempts (`recomputeMastery`), never incremented in place.
- Problems already attempted are never served again except via `ReviewItem`.
- AoPS is blocked to scrapers and MAA owns AMC problems: don't add scrapers; AMC papers are used as *paper* mocks via links.
- Windows dev box: prefer the Write/Edit tools over bash heredocs (Git Bash heredocs with `$` have bitten us).
