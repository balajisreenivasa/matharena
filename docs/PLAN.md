# AMC 10A/10B 2026 — the prep plan, and how the app runs it

**Exam dates:** AMC 10A Thu **Nov 5, 2026** · AMC 10B Fri **Nov 13, 2026**
**Plan window:** Mon Sep 21 → Nov 13. 45 days to 10A, 53 to 10B.
**Format:** 25 multiple choice, 75 minutes, no calculator. 6 points correct, 1.5 blank, 0 wrong.

> **Do this week:** she needs a seat. Families can't register directly; find a school or test center
> hosting *both* dates (many close sign-ups in mid-October). https://maa.org/student-programs/amc/

This document is the human-readable version of what the app in this repo does. The day-by-day
calendar lives in code (`src/curriculum/calendar.ts`) and is rendered live at `/plan`; the lesson
text lives in `src/curriculum/lessons.ts` and is rendered at `/lessons`.

---

## 1. Goal and scoring strategy

| Target | Score | What it takes |
|---|---|---|
| Achievement Roll (grade 8 and below) | 90+ | 12 correct + 13 blank = 91.5 |
| Typical AIME cutoff zone | ~95–105 | 14 correct + 11 blank = 100.5 |
| Stretch | 110+ | 16 correct + 9 blank = 109.5 |

One idea drives everything: **be near-perfect on 1–15, pick up 2–4 from 16–20, leave the rest blank
unless she can eliminate down to two choices.** A wrong answer costs 1.5 vs a blank, so a blind guess
from five is break-even at best; from two or three it's worth it.

The app's *Projected score* (dashboard and `/progress`) applies exactly this rule: it estimates her
chance on each position from tier-1/tier-2 mastery and answers only where 6p > 1.5, reporting
"attempt through #N". The Day-1 diagnostic sets the real target; under 60 means weight 1–12, over 90
means weight 16–22.

## 2. Prep materials

**Core**
- AoPS past contests wiki (free): every AMC 10 since 2000 with several solutions per problem. This is
  the source for paper mocks. Each mock day on `/plan` links straight to its paper.
- AoPS Alcumus (free): adaptive topic drill for the 10-minute warm-up on days she finishes early.
- *Art of Problem Solving, Volume 1: The Basics* (Lehoczky & Rusczyk): the one-book match for AMC 10.
- A paper error-log notebook. Every miss gets a line: problem, why (C/S/E/R/T), the fix.

**Topic references (chapters, not cover to cover)**
- AoPS *Intro to Algebra*: quadratics, inequalities, sequences, functions
- AoPS *Intro to Counting & Probability*: all of it
- AoPS *Intro to Number Theory*: divisors, modular arithmetic, bases
- AoPS *Intro to Geometry*: similar triangles, circles, power of a point, 3D
- *Competition Math for Middle School* (Batterson): gentler on-ramp if the diagnostic is under 60

**In the app:** 28 lessons (one per skill), each with key ideas, formulas to know cold, 3 worked
AMC-style examples with solutions, pitfalls, a "how this shows up on the AMC 10" note, and a
"go deeper" list: the AoPS wiki article for each idea, the matching AoPS book chapter, the wiki's
problem category (hundreds of past problems by difficulty), AoPS solution videos, Alcumus, Khan.
10–15 minutes each. The problem bank is the MATH dataset + AIME 1983–2024 (free-response) plus the
AMC/AIME slice of NuminaMath-1.5, which carries real AMC 8/10/12 problems with A–E choices, so
in-app mocks include genuine multiple-choice items. Answer-choice tactics are still practised
mainly on the paper mocks.

**Test allocation (nothing gets spoiled)**
| Papers | Use |
|---|---|
| 2015 10A | Diagnostic (Day 1) |
| 2016 10A, 2017 10B, 2018 10A, 2019 10B | Mocks 1–4 (Saturdays, weeks 2–5) |
| 2022 10A, 2023 10A, 2024 10A | Mocks 5–7 (weeks 6–7) |
| 2024 10B | Mock 8 (gap week) |
| 2025 10A, 2025 10B | Spares |

## 3. Daily structure

**Weekdays, 70 min**
| Block | Min | What |
|---|---|---|
| Warm-up | 10 | Review queue: problems missed 1, 3, 7, 14 days ago (first items on the sheet) |
| Lesson | 20 | One skill page: read it, work the 3 examples before opening the solutions |
| Worksheet | 30 | 8 problems, easy to hard, timed on screen or printed from the morning email |
| Corrections | 10 | Read the solution for each miss, tag it C/S/E/R/T, note it in the error log |

**Saturday, 90 min:** paper mock under real conditions (print, pencil, 75-min timer, bubble sheet),
then log it at `/mock` with the missed problem numbers.
**Sunday, 30–45 min:** mock review only. Redo every miss cold before reading the solution.

Cap it there. Seven weeks of more than this burns an 8th grader out before Nov 5.

## 4. Error tagging (this drives the adaptation)

Every miss on a worksheet must be tagged before she can move on:

| Tag | Meaning | What the app does next |
|---|---|---|
| **C** Concept | didn't know the idea | skill drops one band and is pinned into the weak slots |
| **S** Setup | knew the idea, couldn't model it | two extra same-skill problems at the same level |
| **E** Execution | arithmetic/algebra slip | 5-problem easy accuracy sprint opens the next sheet |
| **R** Misread | answered a different question | same sprint; underline-the-question habit |
| **T** Time | ran out | 5-problem timed speed set within 3 days |

Plus a confidence mark on every answer (sure / unsure / guessed). "Sure and wrong" moves mastery
down 1.5× and is called out on the results screen and in the evening email. A lucky guess counts half.

## 5. Calendar

Rendered live at `/plan` with completion status; this is the shape.

| Week | Theme | Mon–Fri | Sat | Sun |
|---|---|---|---|---|
| 1 (9/21) | Diagnostic + Algebra | 2015 10A diagnostic; linear/rates; ratios/averages; quadratics/Vieta/SFFT; exponents + inequalities | sequences & functions + 12-problem algebra quiz (40 min) | review queue |
| 2 (9/28) | Counting & Probability | casework/complementary; perms/combos; stars-and-bars + paths; probability; expected value/PIE | **Mock 1: 2016 10A** | mock review |
| 3 (10/5) | Number Theory | primes/divisors; GCD/LCM; modular; bases + divisibility; Diophantine | **Mock 2: 2017 10B** | mock review |
| 4 (10/12) | Geometry | angles + area; similar triangles; circles; polygons + coordinate; 3D | **Mock 3: 2018 10A** | mock review |
| 5 (10/19) | Second pass | polynomials; recursion/bijections; factorials & prime powers; trig/cyclic quads; statistics + speed | **Mock 4: 2019 10B** | mock review |
| 6 (10/26) | Mock-heavy | adaptive; **Mock 5: 2022 10A**; review + redo; adaptive; strategy day (#16–20 set) | **Mock 6: 2023 10A** | mock review |
| 7 (11/2) | Final | adaptive + error-log redo; **Mock 7: 2024 10A**; light day; **AMC 10A Thu 11/5**; off Fri | review 10A | adaptive from 10A misses |
| 8 (11/9) | Gap | **Mock 8: 2024 10B**; review; adaptive (#11–20); light day; **AMC 10B Fri 11/13** | | |

Pacing checkpoints to drill on every mock: problem 10 by minute 20, problem 15 by minute 40, then
3–4 chosen problems from 16–22, with 5 minutes held back to bubble and recheck 1–10.

**Missed a day?** On `/plan`, press *Push* on that row. It becomes a pause date and the rest of the
template slides forward; week-6 adaptive days compress first, then Sunday reviews, then lessons pair
up. Exam days and the light day before each never move. Travel or school events go in Settings →
pause dates ahead of time.

## 6. How the app adapts (plain terms)

1. **Every problem** carries a topic, one or more of the 28 skills (keyword-tagged), and a 1–10
   difficulty. Bands used for selection: 1–4 easy, 3–6 core, 4–7 hard, 5–9 stretch.
2. **Every skill has a mastery score 0–1**, replayed from her full attempt history after each answer
   (so an "I had this right" override or a tag change never drifts it). Correct on a hard problem
   moves it more than correct on an easy one; sure-and-wrong moves it down most. Skills untouched for
   more than a week decay slowly so they come back into rotation.
3. **Each daily worksheet = 8 problems** (Settings can change the count):
   4 from today's lesson skill at her current band · 2 from the two weakest skills already taught ·
   1 from the review queue (due today) · 1 confidence builder from a strong skill.
   Adaptive days: 5 weak + 2 review + 1 strong. Every item shows *why it was picked*.
4. **Error tags change tomorrow** as in section 4. The 8 PM parent email lists each change and why.
5. **Mock results re-plan:** any skill under 50% on the last in-app mock is pinned into the weak
   slots for the following week. Paper-mock misses go in by number on `/mock` and in the error log.
6. **Never re-serve** a problem she has answered; misses come back only through the review queue.
7. **Parent view** (`/progress`): projected score + attempt-through-N, mastery by skill, 14-day
   activity, error-tag breakdown, review-queue size, mock history, average time per problem.

## 7. Daily delivery

`npm run daily` builds today's worksheet and emails it (student, cc parent) with a printable HTML
attachment; `npm run daily -- evening` sends the parent summary; `npm run daily -- digest` sends the
Sunday digest. Without SMTP settings every mail is saved to `data/outbox/` instead. Windows Task
Scheduler entries (created by `scripts/register-tasks.cmd`): 6:00 AM morning, 8:00 PM evening,
Sunday 6:00 PM digest. The app must be running (`npm run dev`) for the links in the mail to work.

## 8. Weekly parent checklist

- Sunday: read the digest. If a skill is red two weeks running, book 20 minutes with her on that lesson.
- Saturday: print the mock, run the timer, don't help. Log the score together.
- Any day: "sure and wrong" count in the evening mail > 1 → ask her to explain those two problems aloud.
- Mid-October: confirm the registration and both test-day logistics.
- Nov 4 and Nov 12: light day, early bedtime, no new material.
