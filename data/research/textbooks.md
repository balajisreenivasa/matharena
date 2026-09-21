# Free AMC 10 reading, problem sets and video: research summary

Researched 2026-09-20. Companion data file: `textbooks.json` (same folder). Every URL was fetched and returned real content unless flagged. Rules followed: only rights-holder-posted or open-licensed material; no pirated scans; paid items listed separately without unofficial links.

## 1. Art of Problem Solving (official free material)

AoPS textbooks are paid, but AoPS publishes on its own CDN, per book: a **table-of-contents PDF**, an **index PDF**, and one **full free excerpt chapter** (`exc1.pdf`). Pattern: `https://s3.amazonaws.com/aops-cdn.artofproblemsolving.com/products/<slug>/{toc,index,exc1}.pdf`, slugs `prealgebra`, `intro-algebra`, `intro-counting`, `intro-number-theory`, `intro-geometry`, `aops-vol1`. Online-book preview pages: `https://artofproblemsolving.com/ebooks/<slug>-ebook/preview`.

| Book | Free excerpt chapter (full text) | Skill(s) the excerpt teaches |
|---|---|---|
| Prealgebra | ch. 1 Properties of Arithmetic | (foundations) |
| Introduction to Algebra | ch. 5 Multi-Variable Linear Equations | alg-linear, alg-polynomials (systems) |
| Intro to Counting & Probability | ch. 3 Correcting for Overcounting | cp-counting-basics |
| Intro to Number Theory | ch. 8 Base Numbers | nt-bases |
| Introduction to Geometry | ch. 5 Similar Triangles | geo-similar |
| AoPS Volume 1: the Basics | ch. 5 Using the Integers | nt-divisibility, nt-bases, nt-modular, nt-gcd-lcm |

Full chapter -> skillId maps for all six books are in `textbooks.json` (`books[0..5].chapters`), taken from the official TOC PDFs, so a lesson can cite e.g. "AoPS Intro to Number Theory ch. 12 (Introduction to Modular Arithmetic)" or "AoPS Intro to Geometry ch. 13 (Power of a Point)".

Other free AoPS resources (all verified):
- **Videos** https://artofproblemsolving.com/videos : chapter-by-chapter series for Prealgebra (15 ch.), Introduction to Algebra (22 ch., 220 videos) and Intro C&P (14 ch., 101 videos), plus AMC 10A/12A 2012-2020 problem walkthroughs (162) and MATHCOUNTS State 2009-2020 (117). No login required to watch. There is **no** video series for Intro NT or Intro Geometry.
- **Alcumus** https://artofproblemsolving.com/alcumus : free adaptive practice with full solutions, needs a free account. Subjects: Prealgebra, Algebra, Counting & Probability, Number Theory, Geometry, Precalculus.
- **AoPS Wiki**: AMC 10 Problems and Solutions (2000-2025) https://artofproblemsolving.com/wiki/index.php/AMC_10_Problems_and_Solutions ; categories Introductory Geometry (690 problems), Introductory Number Theory (279), Introductory Combinatorics (235) verified; Introductory Algebra and Introductory Probability category pages exist but were bot-blocked during verification. The wiki sits behind Cloudflare, so link out rather than fetch at runtime.
- MATHCOUNTS Trainer, For the Win!, Naoki Sato's *Number Theory* notes PDF (IMO-level reference). Index: https://artofproblemsolving.com/resources

## 2. Other free full texts and courseware

| Resource | License / terms | Skills | Problems w/ solutions? |
|---|---|---|---|
| **Mastering AMC 10/12** (Omega Learn, free PDF, 690 pp, 45 chapters) https://www.omegalearn.org/mastering-amc1012 | Free from author; no open license | all 28 (see chapter map) | Yes: examples + practice problems, video solutions per chapter |
| **CEMC Open Courseware Gr 9/10/11** (7 courses) https://courseware.cemc.uwaterloo.ca/ | Free, no registration; U. Waterloo copyright | alg-* (all), geo-similar/area/solid/angles/trig, geo-coordinate, nt-divisibility | Yes: every unit ends with "All Exercises, Answers, and Solutions" + Enrichment |
| **CEMC past contests** Pascal/Cayley/Fermat https://cemc.uwaterloo.ca/resources/past-contests + Problem Set Generator (topic filter) https://cemc.uwaterloo.ca/resources/problem-set-generator + Problem of the Week https://cemc.uwaterloo.ca/resources/potw.php | Free; U. Waterloo copyright | all 28 (AMC-10-style MC) | Yes: official full solutions |
| **OpenStax Prealgebra 2e / Intermediate Algebra 2e** https://openstax.org/details/books/prealgebra-2e , https://openstax.org/details/books/intermediate-algebra-2e | CC BY 4.0 (book page; preface fetch said CC BY-NC-SA, confirm) | alg-linear, alg-ratios, alg-quadratics, alg-functions, alg-exponents, alg-polynomials, alg-sequences, alg-inequalities, geo-coordinate | Odd-numbered answers free; full solutions instructor-only |
| **Discrete Mathematics: An Open Introduction, ch. 1 Counting** (Levin) https://discrete.openmathbooks.org/dmoi3/ch_counting.html | CC BY-SA 4.0 | cp-counting-basics, cp-stars-bars, cp-casework, cp-paths-recursion (ch. 2 recurrences) | Yes: 275/473 exercises with full solutions online |
| **Tom Davis, Mathematical Circles Topics** http://www.geometer.org/mathcircles/ | Free, author-posted, no license | cp-counting-basics, cp-probability, cp-expected, nt-diophantine, geo-area (shoelace, Pick), geo-circles, geo-polygons | "How to Count Things" has a full solutions file; others mostly worked examples only |
| **UKMT Intermediate/Junior Challenge papers** https://ukmt.org.uk/competition-papers | Free PDFs (paper, solutions, extended solutions); UKMT copyright | tier-1 skills | Yes, incl. extended "Solutions and Investigations" |
| **Australian Maths Trust** 2019 practice sets https://amt.edu.au/department/past-papers | Free (only 2019 sets; rest paid) | tier-1 | Yes |
| **LIVE by Po-Shen Loh past AMC 10 archive** https://live.poshenloh.com/past-contests | Hosted with MAA permission | all 28 | Answer keys; pair with AoPS wiki for solutions |
| **Kedlaya, Geometry Unbound** https://kskedlaya.org/geometryunbound/ | GFDL | geo-circles, geo-similar, geo-coordinate, geo-trig (advanced) | Problems, no solutions |
| **Berkeley Math Circle archive** https://mathcircle.berkeley.edu/circle-archives | Free, no license | geo-*, nt-* enrichment | Mostly no |
| **NYC Math Team handouts** https://www.nycmathteam.org/archive/ | Free, no license | geo-angles, geo-circles, geo-trig | Practice archives include solutions |
| **MIT OCW Combinatorics: The Fine Art of Counting** (Internet Archive mirror) https://archive.org/details/MITHS.Combinatorics | CC BY-NC-SA; MIT took the HFHS site down | cp-* | Yes (problem sets + solutions) |
| **Brilliant wiki** (archived, unmaintained) https://brilliant.org/wiki/ | Free to read | nt-modular, alg-quadratics, cp-stars-bars | No exercise sets |
| **Khan Academy** https://www.khanacademy.org/math/algebra | Free (CC BY-NC-SA) | tier-1 and prerequisites | Yes (hints/walkthroughs) |

Excluded (see `consideredButExcluded` in the JSON): Evan Chen / Yufei Zhao handouts (olympiad level), Melbourne Math Circle (links only), *Mathematical Reasoning: Writing and Proof* (proof-writing, off-topic), and every Scribd / Course Hero / dokumen.pub / Z-Library hit.

## 3. Video series (chapter-by-chapter)

| Series | URL | Coverage |
|---|---|---|
| AoPS Prealgebra videos | https://artofproblemsolving.com/videos/prealgebra | 15 chapters matching the book |
| AoPS Intro Algebra videos | https://artofproblemsolving.com/videos/algebra1 | 22 chapters matching the book |
| AoPS Intro C&P videos | https://artofproblemsolving.com/videos/counting | 14 chapters matching the book |
| AoPS AMC 10/12 solutions | https://artofproblemsolving.com/videos/amc | 2012-2020 AMC 10A/12A |
| Omega Learn Mastering AMC 10/12 Course | https://www.youtube.com/playlist?list=PLT9bNzqjDoMlmyxKw2bp5nHsEu-Zn9dac | one lecture per book chapter, all 28 skills |
| Omega Learn AMC 10/12 Fundamentals | https://www.youtube.com/playlist?list=PLT9bNzqjDoMkoIg9K_bs4EjdpHYlS0L51 | 6 lessons + homework solutions |
| MATHCOUNTS Minis (Rusczyk) | https://www.youtube.com/playlist?list=PLF579ECF317F5DC48 | 100+ topic lessons with activity sheets |
| MAA Curriculum Inspirations (Tanton) | https://maa.org/resource/curriculum-inspirations-walking-the-track/ | one AMC problem + strategy per video |
| Khan Academy | https://www.khanacademy.org/math/geometry | prerequisites |

## 4. Per-skill picks (free only)

"Omega" = Mastering AMC 10/12 book chapter (free PDF) and the matching lecture in the Mastering AMC 10/12 playlist. "AoPS videos" = the free chapter video pages. CEMC ids are courseware course numbers (https://courseware.cemc.uwaterloo.ca/<id>).

| skillId | Best free reading | Best free problem set (with solutions) | Best free video |
|---|---|---|---|
| alg-linear | AoPS Intro Algebra ch. 5 excerpt (free PDF); Omega ch. 19-20 | CEMC 42 unit 1 (rate/ratio/percent, inequalities); Alcumus Prealgebra/Algebra | AoPS Intro Algebra videos ch. 2-5 |
| geo-angles | Omega ch. 29; NYC Math Team "Angle Chasing" (Purple) | Alcumus Geometry; CEMC Pascal/Cayley via Problem Set Generator | Omega Mastering ch. 29 |
| nt-divisibility | AoPS Vol 1 ch. 5 excerpt (free PDF); Omega ch. 21, 28 | Omega ch. 21 practice; Alcumus Number Theory | Omega Fundamentals lesson 5 |
| cp-counting-basics | AoPS Intro C&P ch. 3 excerpt (free PDF); Levin ch. 1.1-1.3 | Levin ch. 1 (solutions online); Tom Davis "How to Count Things" + solutions | AoPS Intro C&P videos ch. 1-5 |
| alg-ratios | OpenStax Prealgebra ch. 4-6; Omega ch. 18 | CEMC 42 unit 1 lesson 4; Alcumus Prealgebra | AoPS Prealgebra videos ch. 7-8 |
| geo-similar | AoPS Intro Geometry ch. 5 excerpt (free PDF); Omega ch. 31-32 | CEMC 46 unit 1-2; Alcumus Geometry | MATHCOUNTS Minis #8, #11 |
| nt-gcd-lcm | Omega ch. 23 | Alcumus Number Theory; Omega ch. 23 practice | Omega Fundamentals lesson 6 |
| cp-probability | Omega ch. 2 | Alcumus C&P; Omega ch. 2 practice | AoPS Intro C&P videos ch. 7-8 |
| alg-quadratics | Omega ch. 13; CEMC 43; OpenStax Int. Algebra ch. 9 | CEMC 43 (all units, full solutions) | AoPS Intro Algebra videos ch. 10, 13; Omega Fundamentals lesson 1 |
| geo-area | Omega ch. 30, 37; Tom Davis polyarea.pdf (shoelace), pick.pdf | CEMC 46 unit 1; Alcumus Geometry | Omega Mastering ch. 30/37 |
| nt-modular | Omega ch. 24; Brilliant wiki Modular Arithmetic | Omega ch. 24 practice; Alcumus Number Theory | Omega Fundamentals lesson 6; MATHCOUNTS Mini #14 |
| cp-casework | Omega ch. 3 | Alcumus C&P; Levin 1.6 | Omega Fundamentals lesson 3 |
| alg-sequences | Omega ch. 15-17; CEMC 45 | CEMC 45 (full solutions) | AoPS Intro Algebra videos ch. 21; MATHCOUNTS Minis #12, #74, #98 |
| geo-circles | Omega ch. 34; Tom Davis circles.pdf, fourpoints.pdf; NYC Math Team Power of a Point (Orange) | Alcumus Geometry; AoPS wiki Introductory Geometry category | Omega Mastering ch. 34; MAA Curriculum Inspirations "Walking the Track" |
| nt-bases | AoPS Intro NT ch. 8 excerpt (free PDF); Omega ch. 27 | Alcumus Number Theory | Omega Fundamentals lesson 5 |
| cp-stars-bars | Omega ch. 4-5; Levin 1.5-1.6; Brilliant wiki Stars and Bars / PIE | Levin 1.5-1.6 (solutions online) | Omega Mastering ch. 4-5 |
| alg-functions | Omega ch. 39 (floor/ceiling); CEMC 44; OpenStax Int. Algebra ch. 3 | CEMC 44 (full solutions) | AoPS Intro Algebra videos ch. 16-17, 20 |
| geo-coordinate | Omega ch. 38; CEMC 42 unit 7 | CEMC 42; Alcumus Algebra | AoPS Intro Algebra videos ch. 8 |
| nt-diophantine | Omega ch. 25-26; Tom Davis diophantine.pdf | Omega ch. 25-26 practice | Omega Fundamentals lesson 2 (SFFT) and 6 |
| cp-expected | Omega ch. 8-9 | Omega ch. 8-9 practice; Alcumus C&P | AoPS Intro C&P videos ch. 10-11; Omega Fundamentals lesson 4 |
| alg-exponents | Omega ch. 41 (logs); OpenStax Int. Algebra ch. 8, 10; CEMC 41 | CEMC 41 (full solutions) | AoPS Intro Algebra videos ch. 19 |
| geo-polygons | Omega ch. 33, 35; Tom Davis Polygons.pdf | Alcumus Geometry | Omega Mastering ch. 33/35 |
| nt-factorials-powers | Omega ch. 22 (Legendre) | Omega ch. 22 practice; Alcumus Number Theory | Omega Mastering ch. 22 |
| cp-paths-recursion | Omega ch. 7, 10, 11; Levin ch. 2 | Omega practice; MIT OCW combinatorics problem sets | MATHCOUNTS Mini #7; Omega Fundamentals lesson 4 (states) |
| alg-polynomials | Omega ch. 12, 14; OpenStax Int. Algebra ch. 5-6 | Omega practice; CEMC 41 unit 3 | AoPS Intro Algebra videos ch. 18, 22; Omega Fundamentals lessons 1-2 |
| geo-solid | Omega ch. 36; CEMC 46 unit 1 | CEMC 46 unit 1 (full solutions) | Omega Mastering ch. 36 |
| alg-inequalities | Omega ch. 40; CEMC 46 optimization lessons; OpenStax Int. Algebra ch. 2 | CEMC 46 unit 1 (optimization); Alcumus Algebra | Omega Mastering ch. 40 |
| geo-trig | Omega ch. 42-43; CEMC 46 units 3-4; NYC Math Team Trig (Blue) | CEMC 46 (full solutions) | Omega Mastering ch. 42-43 |

## 5. Coverage assessment

Verified free sources: 24 book/courseware/problem-set entries and 10 video series (34 total), plus 6 AoPS TOC/excerpt PDF sets.

Strong coverage (multiple free readings, solved problem sets and videos): alg-linear, alg-ratios, alg-quadratics, alg-sequences, alg-functions, alg-exponents, geo-similar, geo-area, geo-solid, cp-counting-basics, cp-stars-bars, nt-divisibility, nt-modular, nt-bases.

Weak coverage (essentially only Omega Learn at contest level; no open-licensed text; no AoPS video series):
- **nt-factorials-powers**: Omega ch. 22 is the only dedicated free chapter found.
- **nt-diophantine**: Omega ch. 25-26 plus one Tom Davis handout; AoPS Intro NT ch. 7/14 and Intro Algebra ch. 11 are paid.
- **cp-expected**: Omega ch. 8-9 and the AoPS Intro C&P ch. 10-11 videos; no open-licensed text.
- **cp-paths-recursion**: Omega ch. 7/10/11 and MATHCOUNTS Mini #7; Levin ch. 2 covers recurrences but not contest-style path counting.
- **alg-inequalities**: at contest level only Omega ch. 40 (AM-GM etc.); CEMC/OpenStax cover only linear inequalities and simple optimization.
- **geo-trig**: Omega ch. 42-43 and CEMC curricular trig; no free contest-level problem set beyond the NYC Math Team Blue handout.
- **geo-polygons, geo-circles, geo-angles**: readings exist, but the only free solved problem sets are Alcumus (account, not linkable per problem) and past contests; no AoPS Geometry video series exists.

Caveats: the AoPS wiki blocks automated fetches (link out, do not scrape); Alcumus and MATHCOUNTS Trainer need a free account; OpenStax license text conflicted between two pages (CC BY vs CC BY-NC-SA), confirm before redistributing excerpts; the MAA Curriculum Inspirations YouTube playlist could not be verified (link the MAA pages instead); the AMT "free problems" archive is currently empty.

## 6. Paid (for reference, no unofficial links)

AoPS textbooks (all six above); Batterson, *Competition Math for Middle School*; AMT past-paper PDFs (shop); *A Decade of the Berkeley Math Circle*.
