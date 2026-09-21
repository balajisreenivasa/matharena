# Extra free resources for the AMC 10 skill map

Companion to `data/research/resources-extra.json` (181 entries, 172 unique URLs, all 28 skills covered).
Every URL was fetched and returned real content (HTML page, PDF binary, or a YouTube page whose title matched).
Nothing here duplicates `src/curriculum/resources.ts` (AoPS wiki/book/Alcumus/Khan/YouTube-search links).

Sources used and why they are legitimate:

- **MATHCOUNTS Foundation** (mathcounts.org): the 100 "MATHCOUNTS Minis" (Richard Rusczyk video lessons, each with a free activity sheet + solutions PDF) and the topic "Practice Plans" (student handout + coach solutions). Posted by MATHCOUNTS itself.
- **Omega Learn** (omegalearn.org, 501(c)(3)): the free *Mastering AMC 10/12* and *Mastering AMC 8* books and their per-chapter YouTube lectures ("<Topic> - Mastering AMC 10/12") and the "AMC 10/12 Fundamentals" class lectures. Posted by the authors.
- **Brilliant Math & Science Wiki** (brilliant.org/wiki/...): archived but freely readable, no login wall. Roughly 20 guessed slugs 404'd; only verified slugs are in the JSON.
- **David Altizio's Math League handouts** (davidaltizio.web.illinois.edu): 9 PDFs (Angle Chasing, Similar Figures, Vieta, Sequences & Series, Algebraic Manipulations II, Intro Counting & Probability, Divisors & Divisibility, Diophantine, Modular Arithmetic). Posted by the author.
- **CEMC, University of Waterloo**: Open Courseware (Grade 9/10/11 units at courseware.cemc.uwaterloo.ca/41-47 and the Problem Solving course /40), Math Circles lesson PDFs (grades 6-12, each with problem set + solutions), Problem of the Week archive booklets, past Gauss/Pascal/Cayley/Fermat contests with solutions, and the topic-filtered Problem Set Generator.
- **Berkeley Math Circle archives** (mathcircle.berkeley.edu/circle-archives): session handout PDFs since 1998 (used: Modular Arithmetic I, Counting Partitions).
- **MIT OpenCourseWare 6.042J** readings (number theory, cardinality rules, recurrences, probability, expectation) as stretch reading.
- **UKMT** free past papers (JMC/IMC question papers + solutions + extended solutions PDFs, plus official per-question video solutions), **Purple Comet** problem/solution PDFs, **Math Kangaroo USA** past-exam PDFs, **MOEMS** sample contests: general problem banks (see list below).
- **Eddie Woo** (misterwootube) playlists/videos for foundation-level explanations of trig and combinatorics.

Things deliberately left out: Khan Academy unit pages (return only a JS shell to a fetcher, and Khan is already in resources.ts), AoPS wiki category pages (Cloudflare 403 to fetchers; AoPS is already covered), Evan Chen / Yufei Zhao handouts (olympiad level), Justin Stevens' number theory book (only the first three chapters are free), any Scribd/CourseHero/pdfcoffee mirrors, third-party re-uploads of AoPS course videos.

## By topic

### Algebra
- **alg-linear (7)**: Minis #19 (word problems to equations) and #28 (d = rt); practice plan Distance = Rate x Time; Brilliant systems of linear equations; CEMC Math Circles Systems of Equations PDF; CEMC courseware Linear Relations (/42); Omega Learn Advanced Systems of Equations video.
- **alg-ratios (7)**: Minis #59 (ratios) and #17 (sequences/mean/median); practice plans Percentages and Averages; Brilliant percentages and ratio-and-proportion; CEMC Problem Set Generator (topic filter).
- **alg-quadratics (6)**: Altizio Vieta handout; Brilliant Vieta and completing the square; Omega Learn Vieta video; Mini #38; CEMC courseware Quadratic Relations (/43).
- **alg-exponents (6)**: Brilliant logarithms and exponent rules; Omega Learn Logarithms video; Eddie Woo intro to logs; Mini #10 (radicals/binomial squares); CEMC courseware Number Sense & Algebraic Expressions (/41).
- **alg-inequalities (6)**: Brilliant AM-GM and Applying AM-GM; Omega Learn Inequalities video; Minis #67 (optimization) and #45 (max inscribed area); CEMC courseware Functions unit 4 (inequalities/absolute value).
- **alg-sequences (8)**: Altizio Sequences & Series; Brilliant arithmetic progressions, telescoping series, sums of powers; Omega Learn arithmetic and geometric sequence videos; Mini #12; CEMC courseware Sequences & Series (/45).
- **alg-functions (6)**: Brilliant floor function, functions, absolute value; Omega Learn Floor/Ceiling video; Mini #86 (custom operators); CEMC courseware Intro to Functions (/44).
- **alg-polynomials (6)**: Brilliant remainder/factor theorem; Altizio Algebraic Manipulations II; Omega Learn polynomials lecture and Algebraic Manipulations video; Minis #53 and #65.

### Geometry
- **geo-angles (7)**: Altizio Angle Chasing; Omega Learn Angle Chasing video; practice plan Interior Angles; Brilliant triangle inequality, isosceles properties, polygon angles; Mini #58 (labeling figures).
- **geo-similar (8)**: Altizio Similar Figures; Brilliant similar triangles and Pythagorean theorem; Omega Learn Similar Triangles and Special Triangles videos; practice plan Special Right Triangles; Minis #30 and #22.
- **geo-area (7)**: Brilliant Heron, shoelace (area of a polygon), irregular polygons; Mini #18; practice plan Ratios and Area; Omega Learn circular-region areas (AMC 8); CEMC Problem of the Week archive.
- **geo-circles (6)**: Brilliant power of a point and circles; Omega Learn circular geometry / PoP / cyclic quads lecture; Minis #34, #11, #80.
- **geo-coordinate (6)**: Brilliant distance formula and shoelace; Omega Learn Coordinate Geometry video; Minis #41 and #78; CEMC courseware Analytic Geometry (/42).
- **geo-polygons (6)**: Brilliant regular polygons, cyclic quadrilaterals, polygon angles; Omega Learn Polygons Part 1 video; Mini #21 (counting rectangles in grids); practice plan Interior Angles.
- **geo-solid (6)**: Brilliant volume of a cylinder and surface area of a sphere; Omega Learn 3D Geometry video; Minis #72 and #97; CEMC courseware Measurement/Geometry/Trig (/46).
- **geo-trig (6)**: Brilliant cosine rule and sine rule; Omega Learn Geometric and Algebraic Trigonometry videos; Eddie Woo non-right-angled trig playlist; CEMC courseware trig unit (/46).

### Number theory
- **nt-divisibility (6)**: Altizio Divisors & Divisibility; Brilliant prime factorization and divisibility rules; practice plan Divisibility Rules; Omega Learn Divisibility & Legendre video; MIT 6.042J ch. 4.
- **nt-gcd-lcm (6)**: Brilliant GCD, Euclidean algorithm, LCM; practice plan LCM; Omega Learn GCD/LCM video and number-theory fundamentals lecture.
- **nt-modular (7)**: Altizio Modular Arithmetic; Brilliant modular arithmetic and last digit of a power; Berkeley Math Circle Modular Arithmetic I; practice plan Modular Arithmetic; Omega Learn Modular Arithmetic video; Mini #14.
- **nt-bases (5)**: Brilliant number base; practice plan Basics of Bases; Minis #49 and #79; Brilliant divisibility rules (digit tests).
- **nt-diophantine (6)**: Altizio More Diophantine Equations; CEMC Math Circles LDE Part I PDF + presentations index (problem sets and solutions); Brilliant solve-by-factoring pages (incl. SFFT); Omega Learn Diophantine video.
- **nt-factorials-powers (5)**: Brilliant trailing zeros and floor function (Legendre); Mini #91 Factorials; Omega Learn Divisibility & Legendre video; Mini #71.

### Counting and probability
- **cp-counting-basics (8)**: Altizio Intro to Counting & Probability; Brilliant permutations; practice plan Fundamental Counting Principle; Minis #2 and #50; Omega Learn permutations video and counting fundamentals lecture; MIT 6.042J ch. 11.
- **cp-casework (6)**: Brilliant casework; Omega Learn Casework and Complementary Counting videos; Minis #62 and #77; Eddie Woo Working with Combinatorics playlist.
- **cp-probability (7)**: Brilliant rule of sum and conditional probability; Minis #1 and #99; practice plan Ratios & Simple Probability; Omega Learn Combinations & Probability video; MIT 6.042J ch. 14.
- **cp-stars-bars (6)**: Brilliant stars and bars and PIE; Omega Learn Stars and Bars and PIE videos; "AMC 10 Skills: Stars and Bars (5 examples)" video; Berkeley Math Circle Counting Partitions handout.
- **cp-expected (8)**: Brilliant expected value, linearity of expectation, geometric probability; Omega Learn Expected Value and Geometric Probability videos plus the probability/EV/states lecture; Mini #15; MIT 6.042J ch. 18.
- **cp-paths-recursion (7)**: Brilliant rectangular grid walk and recurrence relations; Minis #7 and #85; practice plan Counting Paths Along a Grid; Omega Learn Recursion video; MIT 6.042J ch. 10.

## Ten best general-purpose sources (site level)

1. **CEMC past contests (Gauss / Pascal / Cayley / Fermat) with full solutions** - https://www.cemc.uwaterloo.ca/resources/past-contests (e.g. 2024 Pascal contest https://cemc.uwaterloo.ca/sites/default/files/documents/2024/2024PascalContest.pdf and solutions https://cemc.uwaterloo.ca/sites/default/files/documents/2024/2024PascalSolution.pdf; Cayley and Gauss follow the same pattern). Pascal/Cayley are the closest free analogue to AMC 10 #1-20.
2. **CEMC Problem Set Generator** - https://www.cemc.uwaterloo.ca/resources/problem-set-generator - builds printable sets of past Waterloo contest problems filtered by topic and difficulty (A/B/C).
3. **CEMC Open Courseware, Grade 9/10/11** - https://www.cemc.uwaterloo.ca/resources/courseware/grade-9-10-11-mathematics (units at https://courseware.cemc.uwaterloo.ca/41 ... /47; Problem Solving & Mathematical Discovery at /40) - narrated lessons with exercises and full solutions, no login.
4. **CEMC Problem of the Week archive** - https://www.cemc.uwaterloo.ca/resources/potw-archive - yearly PDF booklets (grade 7/8 and 9/10) of problems with solutions grouped by theme.
5. **MATHCOUNTS Minis** - https://www.mathcounts.org/resources/mathcounts-minis (100 Rusczyk video lessons, each with activity sheet + solutions; YouTube playlist https://www.youtube.com/playlist?list=PLF579ECF317F5DC48) and **Practice Plans** - https://www.mathcounts.org/resources/practice-plans.
6. **Omega Learn: Mastering AMC 10/12 (free book + per-chapter videos)** - https://www.omegalearn.org/mastering-amc1012 (PDF at https://www.omegalearn.org/books/Mastering_AMC_1012_Book.pdf; YouTube course playlist https://www.youtube.com/playlist?list=PLT9bNzqjDoMlmyxKw2bp5nHsEu-Zn9dac; AMC 8 book https://www.omegalearn.org/mastering-amc8).
7. **UKMT free past papers** - https://ukmt.org.uk/free-past-papers (e.g. JMC 2024 https://ukmt.org.uk/free-past-papers/junior-mathematical-challenge-2024, IMC 2024 https://ukmt.org.uk/free-past-papers/intermediate-mathematical-challenge-2024, each with question paper, solutions and extended solutions PDFs; official video solutions at https://ukmt.org.uk/video-solutions-list). IMC ~ AMC 10 difficulty.
8. **Purple Comet! Math Meet problem and solution PDFs** - https://purplecomet.org/ (e.g. https://purplecomet.org/views/data/2023HSProblems.pdf, https://purplecomet.org/views/data/2024HSSolutions.pdf, https://purplecomet.org/views/data/2024MSSolutions.pdf). Middle-school set ~ AMC 8/10, high-school set ~ AMC 10/12.
9. **Brilliant Math & Science Wiki (archived, free)** - https://brilliant.org/wiki/ - short expository pages with worked examples for nearly every AMC 10 topic (54 pages verified in the JSON).
10. **David Altizio's handouts** - https://davidaltizio.web.illinois.edu/mathlinks.html - nine topic handouts by an AMC/AIME problem writer, plus his Homemade Problem Collection.

Also worth knowing (used for a few skills):
- **MIT OCW 6.042J Mathematics for Computer Science readings** - https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-fall-2010/pages/readings/ (number theory, counting, recurrences, probability, expectation).
- **Berkeley Math Circle archives** - https://mathcircle.berkeley.edu/circle-archives (session handouts by year since 1998).
- **CEMC Math Circles presentations** - https://www.cemc.uwaterloo.ca/events/mathcircle_presentations_sr.html (lesson + problem set + solutions PDFs, grades 6-12).
- **Math Kangaroo USA past exams (PDF, free)** - https://mathkangaroo.org/mks/practice/pdf-exams/ (answer keys are only in student accounts, so questions only).
- **MOEMS sample contests** - https://www.moems.org/pages/resources (Division E/M samples; easy warm-ups).
