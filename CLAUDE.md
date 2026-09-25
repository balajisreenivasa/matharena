# MathArena — working notes for Claude Code

Local-first AMC 10 prep app for one student. Next.js 14 (app router, server actions) + Prisma/SQLite + KaTeX + Tailwind. Node 18.18+.

## Commands
- `npm run dev` — app at http://localhost:3000 (must be running for email links to work)
- `npm run typecheck && npm run verify && npm run test` — the gate for any change (tsc, unit checks + lesson sanity, Playwright)
- `npm run build:data` — render diagrams → import (HuggingFace, cached in data/vendor) → classify → seed; `npm run seed` alone reloads data/problems.json and re-tags skills; `npm run tag` re-tags only
- `npm run diagrams [-- --retry]` — render every `[asy]` figure in the vendor data to `public/diagrams/<sha1>.svg` (needs Asymptote 3.x in `%LOCALAPPDATA%\Programs\Asymptote` or `ASY=`, plus MiKTeX for latex/dvisvgm/mgs). Manifest in `data/diagrams.json`; importers substitute `[[diagram:/diagrams/<hash>.svg]]` markers and skip statements whose figure failed
- `npx tsx scripts/check-latex.ts` — every KaTeX failure in the bank by category with samples (`--strict` is part of `verify`)
- `npm run daily [-- morning|evening|digest] [--date YYYY-MM-DD] [--force]` — email or write to data/outbox/

## Where the logic lives (change these, not the pages)
- `src/curriculum/skills.ts` — 28 skills, teaching order, keyword regexes for tagging
- `src/curriculum/calendar.ts` — the 7-week template (lessons, paper mocks, gap week)
- `src/curriculum/lessons.ts` — lesson text; `scripts/check-lessons.ts` validates it
- `src/lib/plan.ts` — template → dated calendar (pause dates, compress/expand, anchored exam days)
- `src/lib/mastery.ts` — mastery EMA with confidence weights, bands, error tags, projected score
- `src/lib/worksheet.ts` — worksheet composition and every adaptation rule; each item carries a `reason`
- `src/lib/learner.ts` — single local user + plan, mastery replay from attempts, review queue
- `src/lib/tex.ts` — tokenizer (prose/math/diagram/paragraph/styled runs) and `normalizeTex` repairs for KaTeX; `Math.tsx` (React) and `richHtml.ts` (mail) only render its segments
- `src/lib/classroom.ts` / `report.ts` — parent/teacher accounts (`role` parent|teacher): classrooms, join codes, per-student report used by `/classroom/*`
- `scripts/adapters/choices.ts` / `figures.ts` — split embedded A–E choices out of statements; map Asymptote blocks to rendered SVGs
- `src/app/api/attempt` — grading (server-side), review queue, mastery replay, worksheet completion

## Conventions
- Dates are local `YYYY-MM-DD` strings everywhere (`src/lib/dates.ts`); never `Date` for calendar logic.
- Mastery is always recomputed by replaying attempts (`recomputeMastery`), never incremented in place.
- Problems already attempted are never served again except via `ReviewItem`.
- AoPS is blocked to scrapers and MAA owns AMC problems: don't add scrapers; AMC papers are used as *paper* mocks via links.
- Windows dev box: prefer the Write/Edit tools over bash heredocs (Git Bash heredocs with `$` and `\\` have bitten us).
- Figures: statements carry `[[diagram:/diagrams/<hash>.svg]]` markers rendered inline by `RichText`; `hasDiagram`/`diagramPath` are set for lookups. Committed SVGs in `public/diagrams` are what the hosted app serves.
