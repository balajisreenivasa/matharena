# MathArena

A local-first, IXL-style practice platform for competition math — AMC 8, AMC 10/10A/10B, AMC 12/12A/12B, AJHSME, AHSME, AIME, and (via importers) MATHCOUNTS, PUMaC, Berkeley (BMT), and more. Diagnostic exams, topic practice, progress tracking, and full solutions, with faithful LaTeX and real diagrams.

Built with Next.js + SQLite + Prisma + KaTeX + Tailwind.

## Requirements

Node **18.18+** (Next 14 needs ≥18.17, and the import scripts use the global `fetch` that
landed in Node 18). Verified on Node 22.23.2.

## Quick start

```bash
npm install
npx prisma generate
npx prisma db push        # creates prisma/matharena.db from the schema
npm run seed              # loads the hand-verified sample (2024 AMC 10A)
npm run dev               # open http://localhost:3000
```

The app runs immediately on the sample data. To load the full archive, build the real dataset below.

## Build the full question database

### Status of the AoPS scraper

`npm run scrape` targets the AoPS Wiki, which now sits behind Cloudflare and returns
**403 to all programmatic requests** — a custom and a full browser User-Agent are rejected
identically. Their `robots.txt` also carries `Content-Signal: ai-train=no, use=reference`.
The adapter is kept (and its URL/parsing bugs are fixed) in case that access policy changes,
but it cannot currently fetch anything. Bulk collection is not a supported path.

### Openly-licensed datasets (the working path)

```bash
npm run import            # fetch + normalize open datasets -> data/problems.json
npm run seed              # load into the database
```

| Source | License | Seeded | Notes |
| --- | --- | --- | --- |
| [MATH](https://huggingface.co/datasets/EleutherAI/hendrycks_math) | MIT | 11,370 | ships its own topic + 5-level difficulty labels |
| [AIME 1983–2024](https://huggingface.co/datasets/gneubig/aime-1983-2024) | CC0 | 932 | exact year, problem number, integer answer |

**12,302 problems total.** Both sources are free-response, so problems render with a
typed-answer input rather than A–E buttons. Answer checking normalizes common LaTeX
variants (`\dfrac12` = `\frac{1}{2}` = `0.5`) and compares numerically where possible;
since that can't be perfect, a wrong verdict offers an "I had this right" override.

Two known gaps in the source data, both reported by the importers:

- **1,126 MATH problems are skipped** because their statement depends on an `[asy]`
  Asymptote figure that the dataset ships as source code, not a rendered image. A figure-less
  geometry problem is unsolvable, so importing them would only pollute practice sets.
- **The AIME CSV holds 933 rows**, not the ~1,005 a complete 1983–2024 archive would have,
  so some years are short a few problems. That is upstream, not an import bug.

## Testing

```bash
npm run typecheck   # tsc --noEmit
npm run verify      # 42 assertions: answer matching, LaTeX tokenizer, CSV parser, seeded bank
npm run test        # Playwright: 10 end-to-end tests against a real browser
```

`npm run test` starts a dev server automatically (or reuses one). First run needs
`npx playwright install chromium`.

Topic tagging (`npm run classify`) is only needed for sources that don't ship labels. It runs an
offline keyword heuristic by default; `npm run classify -- --ai` refines only the ambiguous
remainder, using either a local open-source model (`LLM_BASE_URL` + `LLM_MODEL`, e.g. Ollama)
or `ANTHROPIC_API_KEY`.

## Adding more content later

New sources get their own importer under `scripts/adapters/`; each emits the same `RawProblem`
shape, so `classify` and `seed` handle them unchanged. For contests that still need scraping,
edit `scripts/contests.ts` to add a year or contest id.

## How it's organized

```
prisma/schema.prisma     data model (Contest, Problem, Topic, Solution, User, Attempt...)
scripts/
  contests.ts            contest metadata + difficulty formulas
  adapters/aops-amc.ts   AoPS Wiki scraper (blocked by Cloudflare — see above)
  adapters/math-dataset.ts, adapters/aime-dataset.ts   open-dataset importers
  import.ts scrape.ts classify.ts seed.ts
data/sample-problems.json  ships so the app runs out of the box
src/app/                 dashboard, /practice (and /diagnostic, /progress as they land)
src/components/          Math (KaTeX), PracticeClient
```

## Roadmap

Phase 1: vertical slice — scaffold + one year end-to-end, working practice screen. ✔
Phase 2: bulk problem import from openly-licensed datasets.
Phase 3: accounts + attempt tracking. Phase 4: topic practice sets. Phase 5: diagnostic exam.
Phase 6: progress dashboard. Phase 7: more competition importers. Phase 8: polish + deploy.

## Sourcing note

The bundled sample is drawn from the AoPS Wiki with per-problem attribution. Bulk content comes
from the openly-licensed datasets listed above (MIT and CC0). Every problem stores its `source`
and `sourceUrl`. If you host this anywhere public, check each source's terms first — the licenses
above permit redistribution, but the underlying competition problems remain the property of their
owners (MAA for the AMC/AIME family).
