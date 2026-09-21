// Structured 20-minute teaching plans, one per skill in skills.ts, for the parent
// running the weekday session (10 warm-up, 20 lesson, 30 worksheet, 10 corrections).
// Worked examples are referenced by number from lessons.ts (example 1, 2, 3).
//
// Rendering contract matches lessons.ts: math lives inside $...$, no markdown.
// AMC citations deliberately avoid the papers reserved for mocks in calendar.ts
// (2015 10A, 2016 10A, 2017 10B, 2018 10A, 2019 10B, 2022 10A, 2023 10A, 2024 A/B,
// 2025 A/B) so nothing gets spoiled before a mock.

export type PlanStep = { minutes: number; activity: string; detail: string };

export type LessonPlan = {
  skillId: string;
  objectives: string[];
  prerequisites: string[];
  warmup: string;
  sequence: PlanStep[];
  exitTicket: { question: string; answer: string };
  homework: string;
  parentNotes: string[];
  amcConnection: string;
};

export const LESSON_PLANS: Record<string, LessonPlan> = {
  // ---------------------------------------------------------------- ALGEBRA
  "alg-linear": {
    skillId: "alg-linear",
    objectives: [
      "By the end she can turn a two-sentence rate, work or age story into one equation in one named variable and solve it in under 90 seconds.",
      "By the end she can compute a round-trip average speed as total distance over total time and say why averaging the two speeds is wrong.",
      "By the end she can add rates for a combined-work problem, including a subtracting drain, and take the reciprocal to get the time.",
      "By the end she can check a boxed answer against the story before moving on.",
    ],
    prerequisites: [],
    warmup:
      "Rapid-fire, answers aloud: 45 minutes as a fraction of an hour ($\\frac34$); a car at 60 mph for 20 minutes covers how many miles (20); if a job takes 4 hours alone, what fraction is done in 1 hour ($\\frac14$); if $M=2A$ and $A+M=36$, find $A$ (12).",
    sequence: [
      { minutes: 2, activity: "Hook", detail: "Ask: driving 30 mph out and 60 mph back, is the average speed 45? Make her commit, then compute with a 60-mile route: 2 h out, 1 h back, 120 miles in 3 h is 40 mph. The wrong instinct is the lesson." },
      { minutes: 4, activity: "Idea 1: d = rt and units", detail: "Work example 1 together: let $d$ be the one-way distance, write $\\frac{d}{30}+\\frac{d}{45}=2$, clear denominators with 90. She does the arithmetic; you only ask 'what does each term mean?'" },
      { minutes: 4, activity: "Idea 2: rates add", detail: "Example 2: $\\frac16+\\frac19-\\frac1{18}=\\frac29$ tank per hour, so $\\frac92$ hours. Stress that the drain is a negative rate and that the last step is a reciprocal, never a sum of times." },
      { minutes: 4, activity: "Idea 3: ages", detail: "Example 3: $A+M=50$ and $M+5=3(A+5)$. Have her translate 'in 5 years' before you show it. Underline that the difference $M-A$ never changes." },
      { minutes: 3, activity: "Trap demo", detail: "Say 'Tom is twice as old as Sam' and ask for the equation. If she writes $2T=S$, do not correct it; plug in $T=10$ and ask whether that makes Tom older." },
      { minutes: 3, activity: "Exit ticket", detail: "Closed book, 60 seconds, then compare setups even if the answer is right." },
    ],
    exitTicket: {
      question: "Pipe A fills a pool in 3 hours and pipe B fills it in 6 hours. Working together, how many hours do they take?",
      answer: "2",
    },
    homework:
      "4 lesson problems at her band, mixed rate, work and age so she must choose the setup each time. If she misses a work-rate problem, tomorrow's warm-up is example 2 with the drain removed, then with it back.",
    parentNotes: [
      "Strong answer: she writes 'let $d$ be the one-way distance in miles' before anything else. Shaky: she starts computing with no variable named.",
      "Minutes and hours in the same equation is the classic execution slip; ask 'what unit is that?' at every number.",
      "If she averages the two speeds in the hook and still defends it after the 60-mile check, spend the whole block on total distance over total time and skip example 3.",
    ],
    amcConnection:
      "Problems 1-8 nearly every year. Look up 2019 AMC 10A #3 (ages), 2018 AMC 10B #2 (average speed over the last leg of a trip), 2021 Spring AMC 10A #6 (Chantal and Jean hike, rates) and 2021 Fall AMC 10A #11 (Emily and the ship, relative speed).",
  },

  "alg-ratios": {
    skillId: "alg-ratios",
    objectives: [
      "By the end she can rewrite any ratio $a:b$ as $ak$ and $bk$ and solve for $k$.",
      "By the end she can chain percent changes as multipliers and name the base of every percent.",
      "By the end she can convert a mean into a total and back, including a weighted average of unequal groups.",
      "By the end she can find a median from an unsorted even-length list without error.",
    ],
    prerequisites: ["alg-linear"],
    warmup:
      "Mental: 15% of 80 (12); a price goes up 25% then down 20%, net change (0%); the mean of 5 numbers is 12, their sum (60); the median of 3, 9, 4, 7 (5.5).",
    sequence: [
      { minutes: 2, activity: "Hook", detail: "A shirt is marked up 20% then discounted 20%. Back to the original price? She will probably say yes. Compute $1.2\\times0.8=0.96$. Percents multiply; they never add." },
      { minutes: 4, activity: "Idea 1: ratio as scale factor", detail: "Example 3: $3k$ boys and $5k$ girls, $3k+4=5k-4$, $k=4$, total 32. Ask her to check the 16 and 16 afterward." },
      { minutes: 4, activity: "Idea 2: multipliers and the base", detail: "Example 2: $1.20\\times0.75=0.90$. Then a base question: '$B$ is 50% more than $A$' means $B=1.5A$; ask what percent $A$ is of $B$ ($66\\frac23\\%$, not 50% less)." },
      { minutes: 4, activity: "Idea 3: mean is a total", detail: "Example 1: five numbers sum to 60, six sum to 84, the new number is 24. Then a weighted average: a class of 20 averages 80 and a class of 30 averages 90; overall is $\\frac{1600+2700}{50}=86$, not 85." },
      { minutes: 3, activity: "Trap demo", detail: "Write 2, 8, 5, 11, 3, 7 and ask for the median. She must sort and average the middle pair (6). Then ask for the mode of a list with no repeats (none)." },
      { minutes: 3, activity: "Exit ticket", detail: "60 seconds. Watch whether she writes the two totals." },
    ],
    exitTicket: {
      question: "The average of 7 numbers is 20. When one number is removed, the average of the remaining 6 is 18. What number was removed?",
      answer: "32",
    },
    homework:
      "4 lesson problems at her band with at least one percent chain and one mean-as-total. If she adds percents anywhere, tomorrow's warm-up is example 2 with three successive changes.",
    parentNotes: [
      "Strong: she writes 'sum = 60' or '$\\times1.2$' in the margin before anything else. Shaky: she reaches for the answer choices immediately.",
      "Listen for the base: 'percent of what?' If she cannot say which quantity is 100%, pause and have her label it.",
      "Averaging averages of unequal groups is the sure-and-wrong classic; if the weighted example gives 85, re-teach with totals before the worksheet.",
    ],
    amcConnection:
      "Problems 1-8 plus a statistics item around #10-14 most years. Look up 2020 AMC 10A #2 (mean of five numbers), 2017 AMC 10A #14 (Roger's allowance, percent), 2023 AMC 10B #2 (discount plus sales tax) and 2021 Spring AMC 10B #6 (two classes, weighted mean).",
  },

  "alg-quadratics": {
    skillId: "alg-quadratics",
    objectives: [
      "By the end she can write $r+s$ and $rs$ from any quadratic and compute $r^2+s^2$, $\\frac1r+\\frac1s$ and $(r-s)^2$ without finding the roots.",
      "By the end she can count the integer values of $k$ for which $x^2+kx+c$ has integer roots by listing factor pairs, negatives included.",
      "By the end she can factor $xy+ax+by=c$ with Simon's Favorite Factoring Trick by adding $ab$.",
      "By the end she can read the number of real roots from the sign of the discriminant.",
    ],
    prerequisites: ["alg-linear"],
    warmup:
      "Factor mentally: $x^2-7x+12$ ($(x-3)(x-4)$); the sum and product of the roots of $x^2-9x+14=0$ (9 and 14); $41^2-39^2$ by difference of squares (160); does $x^2+4x+5$ have real roots (no, discriminant $-4$).",
    sequence: [
      { minutes: 2, activity: "Hook", detail: "Write $x^2-5x+3=0$ and ask for $r^2+s^2$. She will start the quadratic formula and hit square roots; stop her. Today's point is that Vieta skips that." },
      { minutes: 4, activity: "Idea 1: Vieta", detail: "Example 1: $r+s=5$, $rs=3$, $r^2+s^2=25-6=19$. Then she derives $\\frac1r+\\frac1s$ and $(r-s)^2$ from sum and product on her own." },
      { minutes: 5, activity: "Idea 2: counting k", detail: "Example 2 together: integer roots mean $rs=36$ and $k=-(r+s)$. She lists positive factor pairs; you ask about negative pairs. Eight values. This 'how many $k$' template recurs on the AMC." },
      { minutes: 4, activity: "Idea 3: SFFT", detail: "The calendar puts SFFT here: $xy+3x+2y=10$ becomes $(x+2)(y+3)=16$. Show adding the product of the two coefficients, then she factors $xy-4x-5y=20$ herself ($(x-5)(y-4)=40$)." },
      { minutes: 2, activity: "Trap demo", detail: "Ask for the sum of the roots of $2x^2+6x-5=0$. Wanted: $-3$. If she says 3 or $-6$ she has the formula but not the sign or the division by $a$." },
      { minutes: 3, activity: "Exit ticket", detail: "60 seconds; she should never compute a root." },
    ],
    exitTicket: {
      question: "Let $r$ and $s$ be the roots of $x^2-6x+4=0$. What is $(r-s)^2$?",
      answer: "20",
    },
    homework:
      "4 lesson problems at her band; one must be a symmetric Vieta expression and one SFFT. If she misses the SFFT one, tomorrow's warm-up is factoring $(x-5)(y-4)=40$ again with the 'add the constant' step said aloud.",
    parentNotes: [
      "Strong: as soon as she reads 'roots', $r+s$ and $rs$ appear in the margin. Shaky: she starts the quadratic formula on a problem that never needs the roots.",
      "In example 2, stopping at 5 values means she forgot negative pairs; do not tell her, ask 'can both roots be negative?'",
      "'Two distinct real roots' means the discriminant is strictly positive; if she treats zero as fine, spend two minutes on the three cases.",
    ],
    amcConnection:
      "Problems 5-15. Look up 2022 AMC 10B #7 (how many $k$ give $x^2+kx+36$ two distinct integer roots, nearly example 2), 2017 AMC 10A #5 (sum of reciprocals from sum and product), 2015 AMC 10B #14 (maximize a sum of roots) and 2019 AMC 10A #19 (minimum of $(x+1)(x+2)(x+3)(x+4)+2019$, a disguised quadratic).",
  },

  "alg-exponents": {
    skillId: "alg-exponents",
    objectives: [
      "By the end she can solve an exponential equation by rewriting both sides in one prime base.",
      "By the end she can convert between $\\log_b x=y$ and $b^y=x$ and change $\\log_4$ into $\\log_2$.",
      "By the end she can compare $a^m$ and $b^n$ by forcing a common exponent.",
      "By the end she can rationalize a denominator with a conjugate and simplify the result.",
    ],
    prerequisites: ["alg-linear"],
    warmup:
      "Mental: $2^{10}$ (1024); $8^{4/3}$ (16); $\\log_2 32$ (5); write $\\frac1{27}$ as a power of 3 ($3^{-3}$); which is bigger, $2^{30}$ or $3^{20}$ ($3^{20}$, since $8^{10}<9^{10}$).",
    sequence: [
      { minutes: 2, activity: "Hook", detail: "Ask her to evaluate $2^{3^2}$ aloud. If she says 64, fix the tower rule (it is $2^9=512$). Then: $4^x=8$, so $x=\\frac32$. Common base is today's theme." },
      { minutes: 4, activity: "Idea 1: common base", detail: "Example 1: $8^{x+1}=4^{2x-1}$ becomes $2^{3x+3}=2^{4x-2}$, $x=5$. Make her write 8, 4, 16, $\\frac12$, $\\sqrt2$ as powers of 2 on one line (3, 2, 4, $-1$, $\\frac12$)." },
      { minutes: 4, activity: "Idea 2: logs are exponents", detail: "Define $\\log_b x=y$ as $b^y=x$ and nothing more. Example 2: $\\log_4 x=\\frac12\\log_2 x$, so $\\frac32\\log_2 x=6$, $x=16$. She verifies $\\log_2 16$ and $\\log_4 16$ separately." },
      { minutes: 4, activity: "Idea 3: compare and rationalize", detail: "Example 3: $2^{300}$ vs $3^{200}$ by matching exponents ($8^{100}$ vs $9^{100}$). Then $\\frac{\\sqrt5-\\sqrt3}{\\sqrt5+\\sqrt3}$ with the conjugate to get $4-\\sqrt{15}$." },
      { minutes: 3, activity: "Trap demo", detail: "Is $\\log(a+b)=\\log a+\\log b$? Test $a=b=10$ in base 10: left is $\\log 20\\approx1.3$, right is 2. And $\\sqrt{9+16}$ is 5, not 7." },
      { minutes: 3, activity: "Exit ticket", detail: "60 seconds; both sides must become powers of 3." },
    ],
    exitTicket: {
      question: "Solve for $x$: $27^{x}=9^{x+2}$.",
      answer: "4",
    },
    homework:
      "4 lesson problems at her band: one equal-base equation, one log equation, one comparison, one radical simplification. If she misses the log one, tomorrow's warm-up is converting five log statements to exponent statements and back.",
    parentNotes: [
      "Strong: every number is rewritten as a prime power before anything else. Shaky: she tries to take a root of both sides or divides exponents.",
      "Logs are new for many 8th graders; if she cannot say '$\\log_2 8=3$ because $2^3=8$' in one breath, stay on that sentence for five minutes and drop example 3.",
      "Watch $(a+b)^2$ written as $a^2+b^2$ in the rationalizing step; it shows up as sure-and-wrong.",
    ],
    amcConnection:
      "Problems 8-20, plus an easy exponent item early. Look up 2019 AMC 10A #1 (exponent tower), 2021 Spring AMC 10A #10 (product of $2^k+3^k$ factors), 2021 Fall AMC 10B #5 ($8^{2022}$ divided by 4) and 2020 AMC 10B #12 (zeros after the decimal point in $\\frac{1}{20^{20}}$, a log-style estimate).",
  },

  "alg-inequalities": {
    skillId: "alg-inequalities",
    objectives: [
      "By the end she can complete the square in one or two variables and read off the minimum value and where it occurs.",
      "By the end she can apply AM-GM to a sum with a fixed product and verify the equality case is achievable.",
      "By the end she can translate 'positive for all $x$' into $a>0$ and a negative discriminant.",
      "By the end she can name which of the three tools a problem wants before computing.",
    ],
    prerequisites: ["alg-quadratics"],
    warmup:
      "Mental: minimum of $(x-3)^2+7$ (7, at $x=3$); for $x>0$, smallest value of $x+\\frac1x$ (2); does $x^2+2x+5$ ever equal zero (no, $4-20<0$); if $-2x>6$ then $x<$ what ($-3$).",
    sequence: [
      { minutes: 2, activity: "Hook", detail: "Ask for the smallest value of $x^2-6x+13$. Let her plug $x=0,1,2,3$ and find 4 at $x=3$. Today gives three ways to prove such answers, not just find them." },
      { minutes: 4, activity: "Idea 1: complete the square", detail: "Example 1: $x^2-8x+3y^2+6y+25=(x-4)^2+3(y+1)^2+6$, minimum 6. She completes the square in $x$, you do $y$ (factor the 3 out first), then swap roles on a fresh expression." },
      { minutes: 5, activity: "Idea 2: AM-GM", detail: "State $\\frac{a+b}2\\ge\\sqrt{ab}$ with equality iff $a=b$; verify with 2 and 8. Example 2: $4x+9y\\ge2\\sqrt{36xy}=72$ when $xy=36$. Then check equality: $4x=9y$ and $xy=36$ give $x=9$, $y=4$. The check is not optional." },
      { minutes: 3, activity: "Idea 3: discriminant", detail: "Example 3: $x^2+kx+9>0$ for all $x$ iff $k^2-36<0$, so 11 integers. Draw the parabola: $a>0$ and it never touches the axis." },
      { minutes: 3, activity: "Trap demo", detail: "Minimum of $x+\\frac4x$ for $x>0$, then for $x<0$. AM-GM gives 4 for positive $x$; for negative $x$ there is no minimum (the maximum is $-4$). Sign matters." },
      { minutes: 3, activity: "Exit ticket", detail: "60 seconds; she must report the value, not the location." },
    ],
    exitTicket: {
      question: "What is the minimum value of $x^2+10x+30$ over all real $x$?",
      answer: "5",
    },
    homework:
      "4 lesson problems at her band, one per tool plus one mixed. If the AM-GM one is wrong because the equality case failed, redo example 2 tomorrow with $xy=25$ (answer 60).",
    parentNotes: [
      "Strong: she names the tool before computing ('quadratic in $x$, complete the square'). Shaky: she plugs values and hopes.",
      "Reporting $x=4$ instead of the value 6 is the classic misread; ask 'what did the question ask for?' every time.",
      "If completing the square with the coefficient 3 falls apart, factor the 3 out together and skip AM-GM rather than rushing both; this shares the day with exponents.",
    ],
    amcConnection:
      "Problems 12-25. Look up 2021 Spring AMC 10A #9 (least value of $(xy-1)^2+(x+y)^2$), 2019 AMC 10A #19 (minimum of $(x+1)(x+2)(x+3)(x+4)+2019$), 2021 Fall AMC 10A #20 (two quadratics with no distinct real solutions) and 2017 AMC 10A #2 (Pablo's popsicles, integer optimization).",
  },

  "alg-sequences": {
    skillId: "alg-sequences",
    objectives: [
      "By the end she can count the terms in an arithmetic list with the $+1$ and sum it as count times the average of the ends.",
      "By the end she can write the general term $a_n$ from two given terms.",
      "By the end she can telescope $\\sum\\frac{1}{k(k+2)}$ and name exactly which terms survive.",
      "By the end she can find the period of a simple recursion and reduce a large index mod the period.",
    ],
    prerequisites: ["alg-linear"],
    warmup:
      "Mental: $1+2+\\cdots+20$ (210); the 10th term of 5, 8, 11, ... (32); how many multiples of 7 from 1 to 100 (14); $\\frac12+\\frac14+\\frac18+\\cdots$ (1).",
    sequence: [
      { minutes: 2, activity: "Hook", detail: "How many terms in 7, 11, 15, ..., 99? Most say 23; it is $\\frac{99-7}{4}+1=24$. The plus-one is the most common lost point in this skill." },
      { minutes: 4, activity: "Idea 1: arithmetic", detail: "Example 1: $a_3=11$, $a_{10}=39$, seven steps give $d=4$, $a_1=3$, $a_{20}=79$, sum $\\frac{20\\cdot82}{2}=820$. She says 'count times average of the ends' before using it." },
      { minutes: 3, activity: "Idea 2: geometric", detail: "$3+\\frac32+\\frac34+\\cdots=6$. Ask why $1+2+4+\\cdots$ has no sum ($|r|\\ge1$). Finite sum formula once, with $r^n-1$ on top." },
      { minutes: 5, activity: "Idea 3: telescoping", detail: "Example 2: write $\\frac{2}{k(k+2)}=\\frac1k-\\frac1{k+2}$, expand the first three and last two terms on paper, cross out pairs. Two terms survive at each end because the shift is 2: $1+\\frac12-\\frac1{21}-\\frac1{22}$." },
      { minutes: 3, activity: "Idea 4: recursion cycles", detail: "Example 3: $a_1=2$, $a_{n+1}=\\frac{1}{1-a_n}$. Compute $a_2,a_3,a_4$, spot period 3; $2026\\equiv1\\pmod3$ so $a_{2026}=2$. Ask for $a_{2025}$ ($a_3=\\frac12$)." },
      { minutes: 3, activity: "Exit ticket", detail: "60 seconds; count the terms first." },
    ],
    exitTicket: {
      question: "What is the sum of the arithmetic sequence 4, 7, 10, ..., 61?",
      answer: "650",
    },
    homework:
      "Quiz day: the 12-problem algebra quiz replaces the sheet; two items should be sequences, one telescoping. If the telescoping one is missed, tomorrow's warm-up is example 2 with every surviving term written out.",
    parentNotes: [
      "Strong: she writes $a_n=3+4(n-1)$ before answering anything about the 20th term. Shaky: she counts on fingers.",
      "In telescoping the error is almost always the surviving terms; make her physically cross out pairs on paper.",
      "If the recursion-cycle idea does not land, skip it; it is one problem a year, arithmetic sums are two or three. This day is shared with functions, so keep to time.",
    ],
    amcConnection:
      "Problems 5-18. Look up 2019 AMC 10A #5 (greatest number of consecutive integers summing to 45), 2021 Spring AMC 10A #4 (cart down a hill, arithmetic sum), 2022 AMC 10B #15 ($S_{3n}/S_n$ independent of $n$) and 2016 AMC 10B #16 (infinite geometric series with second term 1).",
  },

  "alg-functions": {
    skillId: "alg-functions",
    objectives: [
      "By the end she can compose two functions in the correct order and expand the result.",
      "By the end she can solve $|x-a|+|x-b|=c$ by splitting the number line at $a$ and $b$ and checking each solution against its interval.",
      "By the end she can solve a floor equation by substituting $n=\\lfloor\\cdot\\rfloor$ and enforcing $n\\le\\cdot<n+1$.",
    ],
    prerequisites: ["alg-quadratics"],
    warmup:
      "Mental: $f(x)=3x-1$, find $f(f(2))$ (14); $\\lfloor-1.5\\rfloor$ ($-2$); solve $|x-4|=3$ (1 and 7); if $f(x)=2x+5$, find $f^{-1}(11)$ (3).",
    sequence: [
      { minutes: 2, activity: "Hook", detail: "Is $f(g(x))$ the same as $g(f(x))$? Try $f(x)=x+1$, $g(x)=2x$ at $x=3$: 7 versus 8. Order matters, and that is the whole first idea." },
      { minutes: 4, activity: "Idea 1: composition", detail: "Example 1: $f(g(x))=2x^2+1$, $g(f(x))=4x^2+12x+8$; set equal, $2x^2+12x+7=0$, sum of roots $-6$ by Vieta. Point out she never needed to solve." },
      { minutes: 5, activity: "Idea 2: absolute value cases", detail: "Example 2: $|x-2|+|x-6|=8$. Number line with 2 and 6 marked, three regions, solve each, check each solution lives in its region: 0 and 8. Also the distance reading: total distance 8 from the points 2 and 6." },
      { minutes: 5, activity: "Idea 3: floor", detail: "Example 3: set $n=\\lfloor2x\\rfloor$, so $x=\\frac{n+4}3$, then enforce $n\\le2x<n+1$ to get $n\\in\\{6,7,8\\}$. Substitute-then-enforce is the entire floor toolkit." },
      { minutes: 1, activity: "Trap demo", detail: "$\\lfloor-2.5\\rfloor$? If she says $-2$: greatest integer at or below, so $-3$." },
      { minutes: 3, activity: "Exit ticket", detail: "60 seconds; the middle region is the point." },
    ],
    exitTicket: {
      question: "What is the sum of all integer solutions of $|x-1|+|x-5|=4$?",
      answer: "15",
    },
    homework:
      "Quiz day: two quiz items should be function problems, one with absolute-value cases. If she misses the absolute-value one, redo example 2 tomorrow with the number line drawn first; a missed floor problem can wait for the review queue.",
    parentNotes: [
      "Strong: she draws the number line and labels three regions before writing any equation. Shaky: she squares both sides.",
      "A floor solution that fails the interval check is the sure-and-wrong; ask to see the check line.",
      "Twenty minutes is tight for two skills today; if sequences ran long, do the hook, example 2 and the exit ticket only.",
    ],
    amcConnection:
      "Problems 8-20. Look up 2020 AMC 10A #5 (sum of $x$ with $|x^2-12x+34|=2$), 2016 AMC 10B #3 (nested absolute values), 2023 AMC 10B #22 ($\\lfloor x\\rfloor^2-3x+2=0$) and 2018 AMC 10B #25 ($x^2+10000\\lfloor x\\rfloor=10000x$).",
  },

  "alg-polynomials": {
    skillId: "alg-polynomials",
    objectives: [
      "By the end she can compute $x^3+y^3$ and $x^2+y^2$ from $x+y$ and $xy$ without solving for $x$ or $y$.",
      "By the end she can find the linear remainder on division by a quadratic by evaluating at both roots of the divisor.",
      "By the end she can write cubic Vieta with the alternating signs and use it for $r^2+s^2+t^2$.",
      "By the end she can read the sum of coefficients and the constant term as $P(1)$ and $P(0)$.",
    ],
    prerequisites: ["alg-quadratics"],
    warmup:
      "Mental: if $x+y=7$ and $xy=10$, find $x^2+y^2$ (29); remainder when $x^3-2x+1$ is divided by $x-2$ (5); sum of the coefficients of $(2x-1)^5$ (1); if $x+\\frac1x=3$, find $x^2+\\frac1{x^2}$ (7).",
    sequence: [
      { minutes: 2, activity: "Hook", detail: "Give $x+y=5$, $xy=3$ and ask for $x^3+y^3$. Let her try to find $x$ and $y$ (irrational). Today's rule: never solve when a symmetric identity will do." },
      { minutes: 4, activity: "Idea 1: symmetric identities", detail: "Example 1: $(x+y)^3-3xy(x+y)=125-45=80$. Then expand $(x+y)^3$ with her so the identity is derived, not a memorized string." },
      { minutes: 5, activity: "Idea 2: remainder theorem", detail: "$P(a)$ is the remainder on division by $x-a$; show it from $P(x)=(x-a)Q(x)+R$. Example 2: remainder mod $(x-1)(x-3)$ is $ax+b$; $a+b=3$, $3a+b=7$, so $2x+1$. Emphasize 'degree less than the divisor'." },
      { minutes: 4, activity: "Idea 3: cubic Vieta", detail: "Example 3: for $x^3-2x^2+3x-5$, sum 2, pairwise 3, product 5, so $r^2+s^2+t^2=4-6=-2$. Ask why a negative is fine (non-real roots)." },
      { minutes: 2, activity: "Trap demo", detail: "Sum of coefficients and constant term of $(x^2-3x+1)^4$: $P(1)=1$, $P(0)=1$. Then $(x^2-3x+2)^4$: $P(1)=0$. She should expand nothing." },
      { minutes: 3, activity: "Exit ticket", detail: "60 seconds, identity only." },
    ],
    exitTicket: {
      question: "Real numbers $a$ and $b$ satisfy $a+b=6$ and $ab=7$. What is $a^3+b^3$?",
      answer: "90",
    },
    homework:
      "4 lesson problems at her band: one symmetric sum, one remainder with a quadratic divisor, one cubic Vieta, one $P(1)$ trick. If the quadratic-divisor one is missed, redo example 2 tomorrow and have her state why the remainder is linear.",
    parentNotes: [
      "Strong: she writes $s=x+y$, $p=xy$ and works only in $s$ and $p$. Shaky: she tries to solve a quadratic for $x$.",
      "Cubic Vieta signs trip almost everyone; have her write the pattern $-,+,-$ at the top of the page.",
      "If $(x+y)^3=x^3+y^3$ appears anywhere, stop and expand $(x+y)^3$ term by term together before continuing.",
    ],
    amcConnection:
      "Problems 12-22. Look up 2020 AMC 10A #14 ($x+y=4$, $xy=-2$, evaluate a symmetric expression), 2017 AMC 10A #24 (roots of $g$ are roots of $f$, find $f(1)$), 2022 AMC 10B #21 (remainders on division by two quadratics) and 2021 Spring AMC 10A #14 (all roots positive integers, find a coefficient).",
  },

  // --------------------------------------------------------------- GEOMETRY
  "geo-angles": {
    skillId: "geo-angles",
    objectives: [
      "By the end she can find any regular polygon's interior angle through the exterior angle $\\frac{360^\\circ}{n}$ in one step.",
      "By the end she can angle-chase a figure with parallel lines and an isosceles triangle using a single variable $x$.",
      "By the end she can count integer-sided triangles with a given perimeter by bounding the longest side.",
      "By the end she can state the triangle inequality with the strict sign and reject a degenerate case.",
    ],
    prerequisites: [],
    warmup:
      "Mental: the third angle of a triangle with $35^\\circ$ and $65^\\circ$ ($80^\\circ$); each exterior angle of a regular decagon ($36^\\circ$); interior angle sum of a hexagon ($720^\\circ$); can 3, 4, 8 be a triangle (no, $3+4<8$).",
    sequence: [
      { minutes: 2, activity: "Hook", detail: "Interior angle of a regular 20-gon? Let her start $\\frac{(n-2)180}{n}$, then show exterior $\\frac{360}{20}=18$, so 162. Exterior angles are the shortcut all lesson." },
      { minutes: 4, activity: "Idea 1: triangle facts", detail: "Angle sum, exterior angle equals the two remote interiors, isosceles base angles. Example 1: $B+C=140^\\circ$, halves sum to $70^\\circ$, so $\\angle BIC=110^\\circ$. Then she proves the general $90^\\circ+\\frac A2$." },
      { minutes: 3, activity: "Idea 2: polygons", detail: "Example 2: interior $156^\\circ$ means exterior $24^\\circ$, $n=15$. One more: interior $144^\\circ$ ($n=10$)." },
      { minutes: 4, activity: "Idea 3: triangle inequality counting", detail: "Example 3: perimeter 12, fix the longest side $c$ with $4\\le c<6$, list (2,5,5), (3,4,5), (4,4,4). She must explain both bounds on $c$." },
      { minutes: 4, activity: "Angle chase", detail: "Two parallels cut by a transversal at $50^\\circ$, a triangle built on it; label one unknown $x$ and chase every angle to an equation. She narrates, you draw." },
      { minutes: 3, activity: "Exit ticket", detail: "60 seconds; watch for the strict inequality." },
    ],
    exitTicket: {
      question: "How many non-congruent triangles have integer side lengths and perimeter 11?",
      answer: "4",
    },
    homework:
      "Area shares today: 2 problems from each skill at her band. If she misses the triangle-counting one, redo example 3 tomorrow with perimeter 13 (answer 5).",
    parentNotes: [
      "Strong: she redraws the figure large and labels every given angle before thinking. Shaky: she reads the tiny diagram and assumes it is to scale.",
      "If 'exterior angle' is not automatic, drill regular $n$-gons for $n=5,6,8,9,12$; thirty seconds each and worth a sure point.",
      "Strict inequality: $3+4=7$ is not a triangle. If she counts (3,4,7), correct it with a drawing.",
    ],
    amcConnection:
      "Problems 1-10. Look up 2019 AMC 10A #13 (isosceles triangle with a circle, angle chasing to 105), 2023 AMC 10B #7 (rotated square, $\\angle EAB$), 2020 AMC 10B #4 (prime acute angles of a right triangle) and 2017 AMC 10A #10 (Joy's rods, polygon inequality).",
  },

  "geo-area": {
    skillId: "geo-area",
    objectives: [
      "By the end she can find the area of a sub-triangle from a base ratio without computing any height.",
      "By the end she can run Heron on 13-14-15 and recover an altitude from the area.",
      "By the end she can apply shoelace to five ordered vertices and cross-check a lattice answer with Pick's theorem.",
    ],
    prerequisites: ["geo-angles"],
    warmup:
      "Mental: area of a triangle with base 14 and height 6 (42); area of a rhombus with diagonals 6 and 10 (30); area of a trapezoid with bases 5 and 9 and height 4 (28); area of a 3-4-5 triangle (6).",
    sequence: [
      { minutes: 2, activity: "Hook", detail: "Triangle $ABC$ has area 60 and $D$ on $BC$ with $BD:DC=1:2$. Area of $ABD$? Same height, so 20. Most AMC area problems are this comparison, not a computation." },
      { minutes: 4, activity: "Idea 1: ratios", detail: "Example 3: $BD:DC=2:3$ gives $[ABD]=24$; $E$ the midpoint of $AD$ makes $BE$ a median, so $[ABE]=12$. She says 'same height, areas as bases' every time she uses it." },
      { minutes: 4, activity: "Idea 2: Heron", detail: "Example 1: 13-14-15, $s=21$, $\\sqrt{21\\cdot8\\cdot7\\cdot6}=84$, altitude to 14 is 12. Show the 5-12-13 and 9-12-15 split; this triangle is worth memorizing." },
      { minutes: 5, activity: "Idea 3: shoelace and Pick", detail: "Example 2: pentagon (0,0),(4,0),(6,3),(2,5),(0,3); she writes the columns and cross-multiplies, area 21. Cross-check with Pick using gcd counts on each edge: $B=12$, $I=16$." },
      { minutes: 2, activity: "Trap demo", detail: "Swap (6,3) and (2,5) in the shoelace list and watch the area change. Order around the polygon, always." },
      { minutes: 3, activity: "Exit ticket", detail: "60 seconds, no formulas beyond base ratios." },
    ],
    exitTicket: {
      question: "Triangle $ABC$ has area 48. Point $D$ is on $BC$ with $BD:DC=3:1$, and $M$ is the midpoint of $AD$. What is the area of triangle $MDC$?",
      answer: "6",
    },
    homework:
      "2 area and 2 angle problems at her band; one area problem should be a pure ratio problem. If she misses it, redo example 3 tomorrow by shading the triangles.",
    parentNotes: [
      "Strong: she asks 'is this a ratio of a known area?' before computing. Shaky: she sets up Heron on a problem that only needs bases.",
      "Heron with the full perimeter is the common slip; have her write $s=$ first.",
      "If the shoelace columns get messy, use only three-vertex triangles until the pattern is clean; Pick can wait.",
    ],
    amcConnection:
      "Problems 5-18. Look up 2021 Fall AMC 10B #2 (shaded figure area), 2020 AMC 10A #20 (quadrilateral with two right angles, area 360), 2021 Fall AMC 10B #13 (two squares inside an isosceles triangle) and 2015 AMC 10B #13 (altitudes of the triangle cut off by $12x+5y=60$).",
  },

  "geo-similar": {
    skillId: "geo-similar",
    objectives: [
      "By the end she can spot a Pythagorean triple (and its multiples) and skip the square root.",
      "By the end she can find the altitude to the hypotenuse from two area expressions.",
      "By the end she can set up a similar-triangle ratio with vertices in corresponding order and scale areas by $k^2$.",
      "By the end she can label a 30-60-90 triangle with $x$, $x\\sqrt3$, $2x$ on the correct sides.",
    ],
    prerequisites: ["geo-angles"],
    warmup:
      "Mental: hypotenuse with legs 9 and 12 (15); other leg with hypotenuse 17 and leg 8 (15); short leg of a 30-60-90 with hypotenuse 10 (5); diagonal of a square with side 6 ($6\\sqrt2$).",
    sequence: [
      { minutes: 2, activity: "Hook", detail: "Legs 6 and 8: the altitude to the hypotenuse? Let her flounder for 30 seconds, then: two area formulas for the same triangle." },
      { minutes: 3, activity: "Idea 1: triples and the area trick", detail: "Example 1: hypotenuse 10, area 24, $h=\\frac{48}{10}=\\frac{24}5$. Put 3-4-5, 5-12-13, 8-15-17, 7-24-25 and their doubles on an index card." },
      { minutes: 4, activity: "Idea 2: ladder", detail: "Example 2: $\\sqrt{625-49}=24$, then base 15 gives height 20, slides 4 feet. Both are triples (7-24-25, 15-20-25); no root was ever needed." },
      { minutes: 5, activity: "Idea 3: similar triangles", detail: "Example 3: $DE\\parallel BC$, $AD:AB=4:10$, areas scale by $\\frac{4}{25}$; $[ABC]=50$, trapezoid 42. She writes the ratio with matching vertices in order. Then the altitude-to-hypotenuse picture: $h^2=pq$." },
      { minutes: 3, activity: "Special triangles", detail: "Draw 45-45-90 and 30-60-90 labeled $x$, $x\\sqrt3$, $2x$. Which leg is $\\sqrt3$, opposite which angle? Equilateral side 8: height $4\\sqrt3$, area $16\\sqrt3$." },
      { minutes: 3, activity: "Exit ticket", detail: "60 seconds; squared ratio." },
    ],
    exitTicket: {
      question: "In triangle $ABC$, $D$ is on $AB$ and $E$ on $AC$ with $DE\\parallel BC$, $AD=3$ and $DB=6$. If the area of $ADE$ is 5, what is the area of $ABC$?",
      answer: "45",
    },
    homework:
      "4 lesson problems at her band, including one similar-triangle area ratio and one special right triangle. If she scales an area by $k$ instead of $k^2$, tomorrow's warm-up is example 3 with $AD:DB=1:1$ (the trapezoid is 3 times $ADE$).",
    parentNotes: [
      "Strong: she spots the triple and writes 25 without computing. Shaky: she squares and roots every time.",
      "If she writes $AB/DE$ next to $BC/DF$ (mismatched), do not fix it; ask her to label which vertex matches which.",
      "$\\sqrt3$ on the wrong leg is a sure-and-wrong; ask 'is the $\\sqrt3$ side opposite the $60^\\circ$?' whenever a 30-60-90 appears.",
    ],
    amcConnection:
      "Problems 5-15. Look up 2017 AMC 10A #7 (Jerry and Silvia, the diagonal shortcut), 2017 AMC 10A #21 (two squares inscribed in a 3-4-5 triangle), 2021 Spring AMC 10B #14 (three parallel chords, Pythagorean setup) and 2016 AMC 10B #19 (rectangle with cevians, ratio $PQ/EF$).",
  },

  "geo-circles": {
    skillId: "geo-circles",
    objectives: [
      "By the end she can apply power of a point in the chord, secant and tangent forms with the full external lengths.",
      "By the end she can halve an arc for an inscribed angle and use the right angle in a semicircle.",
      "By the end she can find a right triangle's inradius from $\\frac{a+b-c}2$ or $A=rs$.",
      "By the end she can build the radius, half-chord, center-distance right triangle on sight.",
    ],
    prerequisites: ["geo-angles", "geo-similar"],
    warmup:
      "Mental: inscribed angle cutting a $100^\\circ$ arc ($50^\\circ$); circumference of radius 7 ($14\\pi$); arc length of a $90^\\circ$ arc in radius 4 ($2\\pi$); a chord of length 8 sits 3 from the center, find the radius (5).",
    sequence: [
      { minutes: 2, activity: "Hook", detail: "Chords $AB$ and $CD$ cross at $P$ with $AP=3$, $PB=8$, $CP=4$. Ask for $PD$. If she does not know, say 'products are equal' and let her get 6. Then ask why (triangles $APC$ and $DPB$ are similar)." },
      { minutes: 4, activity: "Idea 1: power of a point", detail: "Example 1 is the hook; example 2: $PT^2=PA\\cdot PB$ with $PT=6$, $PA=4$ gives $PB=9$, so $AB=5$. The secant uses the full $PB$, not the inside chord." },
      { minutes: 4, activity: "Idea 2: angles and tangents", detail: "Inscribed angle is half the arc; angle in a semicircle is $90^\\circ$; tangent is perpendicular to the radius; two tangents from a point are equal. Draw each as a tiny picture she copies into her notes." },
      { minutes: 4, activity: "Idea 3: inradius", detail: "Example 3: the 5-12-13 triangle has $r=\\frac{5+12-13}2=2$, also from $30=15r$; region outside the circle is $30-4\\pi$. Then $R=\\frac c2=\\frac{13}2$." },
      { minutes: 3, activity: "Chord-center triangle", detail: "Chord 16 in a circle of radius 10: distance from the center is $\\sqrt{100-64}=6$. Radius to the endpoint plus perpendicular from the center; that triangle is half the circle problems on the test." },
      { minutes: 3, activity: "Exit ticket", detail: "60 seconds; full secant length." },
    ],
    exitTicket: {
      question: "From an external point $P$, the tangent $PT=8$ and a secant meets the circle at $A$ then $B$ with $PA=4$. What is $AB$?",
      answer: "12",
    },
    homework:
      "4 lesson problems at her band: power of a point in two forms, one inscribed-angle chase, one inradius. If the secant one is missed by using $AB$ instead of $PB$, redo example 2 tomorrow with new numbers.",
    parentNotes: [
      "Strong: she draws the center and radii to tangent points before anything else. Shaky: she stares at the figure hunting for a formula.",
      "The factor of 2 between central and inscribed angle is the standard misread; ask 'is that angle at the center or on the circle?'",
      "If power of a point has not landed after example 2, drop the inradius section and do two more numeric power-of-a-point drills instead.",
    ],
    amcConnection:
      "Problems 8-20. Look up 2023 AMC 10B #3 (circumcircles of 3-4-5 and 5-12-13 triangles), 2019 AMC 10A #16 (thirteen unit circles inside a larger circle), 2021 Fall AMC 10A #15 (circle tangent to two sides of an isosceles triangle) and 2015 AMC 10B #19 (squares on a right triangle, four points on a circle).",
  },

  "geo-coordinate": {
    skillId: "geo-coordinate",
    objectives: [
      "By the end she can compute a triangle's area by shoelace, or by $\\frac12|ad-bc|$ when a vertex is at the origin.",
      "By the end she can write the perpendicular bisector of a segment and find its intercepts.",
      "By the end she can count lattice points on a segment with $\\gcd(\\Delta x,\\Delta y)+1$.",
      "By the end she can reflect a point over the axes and $y=x$, and read a circle's center by completing the square.",
    ],
    prerequisites: ["geo-similar", "geo-area"],
    warmup:
      "Mental: distance from (1,2) to (4,6) (5); midpoint of $(-3,5)$ and $(7,1)$ ((2,3)); slope perpendicular to $\\frac34$ ($-\\frac43$); area of the triangle with vertices (0,0),(6,0),(0,4) (12).",
    sequence: [
      { minutes: 2, activity: "Hook", detail: "Area of the triangle (1,1),(7,3),(4,8)? No side is horizontal. She may try distances and Heron; stop her and promise a 20-second method." },
      { minutes: 4, activity: "Idea 1: shoelace", detail: "Example 2: cross-multiply in a column, $\\frac{36}2=18$. Then the origin shortcut $\\frac12|ad-bc|$; verify with (6,0),(0,4)." },
      { minutes: 5, activity: "Idea 2: lines", detail: "Example 1: midpoint (4,4), slope $\\frac23$, perpendicular slope $-\\frac32$, point-slope, set $y=0$, $x=\\frac{20}3$. She does each step aloud; you check the negative reciprocal." },
      { minutes: 3, activity: "Idea 3: lattice points", detail: "Example 3: displacement (24,16), $\\gcd=8$, so 9 points. She lists them for (0,0) to (6,4): (0,0),(3,2),(6,4)." },
      { minutes: 3, activity: "Reflections and circles", detail: "Reflect $(3,-2)$ over $y=x$ ($(-2,3)$) and over the $x$-axis ($(3,2)$). Complete the square on $x^2+y^2-6x+4y=12$: center $(3,-2)$, radius 5." },
      { minutes: 3, activity: "Exit ticket", detail: "60 seconds, shoelace column." },
    ],
    exitTicket: {
      question: "What is the area of the triangle with vertices (2,1), (8,3) and (5,7)?",
      answer: "15",
    },
    homework:
      "2 coordinate and 2 polygon problems at her band; the coordinate ones should include one shoelace and one perpendicular-bisector line. If the line one is missed, tomorrow's warm-up is three perpendicular slopes and one point-slope equation.",
    parentNotes: [
      "Strong: she writes the shoelace column neatly and boxes the absolute value. Shaky: she lists vertices in a random order and gets a wrong small number.",
      "$-\\frac23$ instead of $-\\frac32$ is the sure-and-wrong; make her say 'flip and negate'.",
      "If plain distance and midpoint are slow, do not push the circle-equation step; leave it for a review day.",
    ],
    amcConnection:
      "Problems 8-20. Look up 2019 AMC 10A #7 (triangle bounded by two lines and $x+y=10$), 2015 AMC 10B #12 (points $(x,-x)$ inside a circle), 2021 Spring AMC 10B #9 (rotate then reflect a point) and 2023 AMC 10B #13 (area of $||x|-1|+||y|-1|\\le1$).",
  },

  "geo-polygons": {
    skillId: "geo-polygons",
    objectives: [
      "By the end she can decompose a regular hexagon into six equilateral triangles and name both diagonal lengths.",
      "By the end she can count rectangles in an $m\\times n$ grid by choosing two lines each way.",
      "By the end she can set up the corner-cut equation for a regular octagon inside a square.",
      "By the end she can state the diagonal property of a rhombus, rectangle, kite and cyclic quadrilateral.",
    ],
    prerequisites: ["geo-angles", "geo-similar", "cp-counting-basics"],
    warmup:
      "Mental: interior angle of a regular hexagon ($120^\\circ$); diagonals of an octagon (20); area of a regular hexagon with side 2 ($6\\sqrt3$); rectangles in a $1\\times3$ strip of unit squares (6).",
    sequence: [
      { minutes: 2, activity: "Hook", detail: "How many rectangles of any size in a $4\\times6$ grid? She starts counting by size. Tell her: a rectangle is two vertical lines and two horizontal lines, $\\binom52\\binom72=210$ (example 2)." },
      { minutes: 4, activity: "Idea 1: hexagon", detail: "Example 1: side 4, area $24\\sqrt3$, alternate-vertex triangle is half, $12\\sqrt3$; verify via its side $4\\sqrt3$. Long diagonal $2s$, short diagonal $s\\sqrt3$." },
      { minutes: 4, activity: "Idea 2: octagon", detail: "Example 3: corner legs $x$, the side is both $x\\sqrt2$ and $10-2x$; solve to $10\\sqrt2-10$. Rationalizing $\\frac{10}{2+\\sqrt2}$ is the hurdle; do it slowly." },
      { minutes: 3, activity: "Idea 3: quadrilateral diagonals", detail: "Rhombus: perpendicular bisecting diagonals, area $\\frac{d_1d_2}2$. Rectangle: equal diagonals. Kite: one diagonal bisects the other. Cyclic: opposite angles supplementary. Quiz each with a sketch." },
      { minutes: 4, activity: "Grid counting", detail: "Squares in a $4\\times4$ grid: $16+9+4+1=30$. Rectangles: $\\binom52^2=100$. How many of the 100 are not squares (70)?" },
      { minutes: 3, activity: "Exit ticket", detail: "60 seconds, choose lines." },
    ],
    exitTicket: {
      question: "How many rectangles of any size are formed by the lines of a $3\\times5$ grid of unit squares?",
      answer: "90",
    },
    homework:
      "2 polygon and 2 coordinate problems at her band, one a hexagon decomposition. If the rectangle count is missed, redo it tomorrow on a $2\\times3$ grid by listing all 18 and then via $\\binom32\\binom42$.",
    parentNotes: [
      "Strong: she draws the six triangles inside the hexagon unprompted. Shaky: she hunts for a hexagon area formula to memorize.",
      "If she says $\\frac{n(n-1)}2$ diagonals she is counting sides too; have her draw a pentagon and count (5).",
      "The octagon algebra is the one place to slow down; a wrong rationalization is an execution error, not a concept gap.",
    ],
    amcConnection:
      "Problems 10-20. Look up 2016 AMC 10B #23 (hexagon with equally spaced parallel lines, ratio $\\frac{11}{27}$), 2021 Fall AMC 10B #11 (hexagon with reflected arcs, $3\\sqrt3-\\pi$), 2022 AMC 10B #2 (rhombus area from a perpendicular) and 2021 Spring AMC 10A #21 (equiangular hexagon perimeter).",
  },

  "geo-solid": {
    skillId: "geo-solid",
    objectives: [
      "By the end she can find the shortest surface path on a box by comparing the three unfoldings.",
      "By the end she can use the volume formulas for prism, pyramid, cone and sphere with the $\\frac13$ where it belongs.",
      "By the end she can scale lengths, areas and volumes by $k$, $k^2$, $k^3$.",
      "By the end she can reduce a cone or box question to one 2D right triangle.",
    ],
    prerequisites: ["geo-similar", "geo-area"],
    warmup:
      "Mental: volume of a cube with side 3 (27); space diagonal of a $2\\times3\\times6$ box (7); volume of a cone with $r=3$, $h=4$ ($12\\pi$); surface area of a sphere with radius 2 ($16\\pi$).",
    sequence: [
      { minutes: 2, activity: "Hook", detail: "An ant on a $3\\times4\\times12$ box wants the far corner. Is the answer 13, the space diagonal? It cannot be; the ant stays on the surface. Unfolding is the idea." },
      { minutes: 4, activity: "Idea 1: nets", detail: "Example 3: three unfoldings give $\\sqrt{193}$, $\\sqrt{241}$, $\\sqrt{265}$; the shortest folds across the two smallest dimensions. She draws all three nets." },
      { minutes: 4, activity: "Idea 2: volumes and scaling", detail: "Example 1: sphere in a cube of side 6, ratio $\\frac{36\\pi}{216}=\\frac\\pi6$. Then scaling: a cone filled to half its height holds $\\frac18$. Double a sphere's radius, volume times what (8)?" },
      { minutes: 4, activity: "Idea 3: cone slice", detail: "Example 2: slant height 5 from the 3-4-5 slice through the axis; lateral $\\pi r\\ell=15\\pi$, total $24\\pi$. Everything about a cone lives in that 2D triangle." },
      { minutes: 3, activity: "Trap demo", detail: "Pyramid with a $6\\times6$ base and height 5: if she says 180 she dropped the $\\frac13$ (60). Radius of the sphere inscribed in a cube of side 10: 5, not 10." },
      { minutes: 3, activity: "Exit ticket", detail: "60 seconds, no calculator." },
    ],
    exitTicket: {
      question: "A cube has side length 4. What is the length of its space diagonal?",
      answer: "$4\\sqrt{3}$",
    },
    homework:
      "4 lesson problems at her band: one net path, one volume ratio, one cone or sphere formula, one box diagonal. If the scaling one is missed, tomorrow's warm-up is $k$, $k^2$, $k^3$ for three shapes.",
    parentNotes: [
      "Strong: she draws the 2D slice or net before computing. Shaky: she tries to hold the whole solid in her head.",
      "Dropping the $\\frac13$ and confusing radius with diameter are both sure-and-wrong; ask 'radius or diameter?' on every sphere.",
      "If the three unfoldings confuse her, do only the $3\\times4\\times12$ case on a real box (a tissue box works) and skip the cone.",
    ],
    amcConnection:
      "Problems 10-22. Look up 2018 AMC 10B #4 (box with face areas 24, 48, 72), 2020 AMC 10B #10 (three-quarter sector rolled into a cone), 2021 Spring AMC 10B #10 (cone of water poured into a cylinder) and 2023 AMC 10B #17 (box from edge sum, face sum and volume, longest diagonal).",
  },

  "geo-trig": {
    skillId: "geo-trig",
    objectives: [
      "By the end she can find a third side with the law of cosines, including a negative cosine for an obtuse angle.",
      "By the end she can find an angle's cosine from three sides and then its sine and the area.",
      "By the end she can use the law of sines with sides matched to opposite angles.",
      "By the end she can give exact values at $30^\\circ$, $45^\\circ$, $60^\\circ$ and their supplements without hesitation.",
    ],
    prerequisites: ["geo-similar", "geo-area"],
    warmup:
      "Mental: $\\sin30^\\circ$ ($\\frac12$); $\\cos60^\\circ$ ($\\frac12$); $\\cos120^\\circ$ ($-\\frac12$); $\\tan45^\\circ$ (1); third side with sides 3, 5 and included angle $60^\\circ$ ($\\sqrt{19}$).",
    sequence: [
      { minutes: 2, activity: "Hook", detail: "Sides 5 and 8 with $60^\\circ$ between: third side? Drop an altitude first (30-60-90 gives 4 and $4\\sqrt3$, then $\\sqrt{48+1}=7$). Law of cosines does the same in one line." },
      { minutes: 5, activity: "Idea 1: law of cosines", detail: "Example 1: $25+64-40=49$, $c=7$, area $\\frac12\\cdot5\\cdot8\\sin60^\\circ=10\\sqrt3$. Then example 2 in reverse: 7-8-9 gives $\\cos C=\\frac27$, $\\sin C=\\frac{3\\sqrt5}7$, area $12\\sqrt5$, confirmed by Heron." },
      { minutes: 4, activity: "Idea 2: law of sines", detail: "Example 3: angles $30^\\circ$ and $45^\\circ$, $BC=10$; $\\frac{10}{\\sin30^\\circ}=\\frac{AC}{\\sin45^\\circ}$, so $AC=10\\sqrt2$, and the common ratio 20 is $2R$. She labels which side is opposite which angle before writing the ratio." },
      { minutes: 3, activity: "Idea 3: supplements", detail: "$\\cos(180^\\circ-x)=-\\cos x$, $\\sin(180^\\circ-x)=\\sin x$. Ask: $\\cos135^\\circ$, $\\sin150^\\circ$, $\\cos120^\\circ$. This is why an obtuse angle makes the law of cosines add." },
      { minutes: 3, activity: "Cyclic quadrilateral link", detail: "Week-5 pairing with circles: opposite angles supplementary, so $\\cos D=-\\cos B$. The diagonal via law of cosines from both triangles gives one equation; sketch it, no numbers." },
      { minutes: 3, activity: "Exit ticket", detail: "60 seconds; obtuse, so the correction term adds." },
    ],
    exitTicket: {
      question: "A triangle has sides 4 and 6 with a $120^\\circ$ angle between them. What is the length of the third side?",
      answer: "$2\\sqrt{19}$",
    },
    homework:
      "2 trig and 2 circle problems at her band; the trig ones: one law of cosines with an obtuse angle, one area with sine. If the obtuse one is wrong on sign, tomorrow's warm-up is five cosines of angles above $90^\\circ$.",
    parentNotes: [
      "Strong: she writes the exact value $\\frac{\\sqrt3}2$, never a decimal. Shaky: she estimates from calculator habit.",
      "Sign of cosine for obtuse angles is the sure-and-wrong; a third side shorter than both given sides with an obtuse angle is a red flag she should notice.",
      "If the special-angle values are not instant, stop and drill the 30-45-60 table for five minutes; trig without that table is useless on the AMC.",
    ],
    amcConnection:
      "Problems 15-25, and the backup tool for many others. Look up 2020 AMC 10A #20 (quadrilateral with two right angles, area 360), 2021 Spring AMC 10A #17 (trapezoid with a perpendicular diagonal), 2018 AMC 10B #17 (equilateral octagon in a rectangle) and 2022 AMC 10B #20 (rhombus with $\\angle ADC=46^\\circ$, a cyclic-quadrilateral angle chase).",
  },

  // ---------------------------------------------------------- NUMBER THEORY
  "nt-divisibility": {
    skillId: "nt-divisibility",
    objectives: [
      "By the end she can write a prime factorization and read off the divisor count with $(e_1+1)(e_2+1)\\cdots$.",
      "By the end she can find the smallest integer with a given number of divisors by trying each factorization of the count.",
      "By the end she can count multiples of $m$ in a range with floors and remove an overlap.",
      "By the end she can test primality by trial division only up to $\\sqrt n$ and apply the 9 and 11 digit rules.",
    ],
    prerequisites: [],
    warmup:
      "Mental: prime factorization of 360 ($2^3\\cdot3^2\\cdot5$); number of divisors of 72 (12); is 91 prime (no, $7\\times13$); how many multiples of 6 from 1 to 100 (16).",
    sequence: [
      { minutes: 2, activity: "Hook", detail: "How many divisors does 360 have? Let her start listing; after 20 seconds show $(3+1)(2+1)(1+1)=24$. Then: which numbers have an odd number of divisors (perfect squares)?" },
      { minutes: 4, activity: "Idea 1: divisor counts", detail: "Example 1: divisors of 360 that are multiples of 6 correspond to divisors of 60; $d(60)=12$. She explains the correspondence with one pair (6 times 10 pairs with 10)." },
      { minutes: 5, activity: "Idea 2: smallest with 12 divisors", detail: "Example 2: factor 12 as $12$, $6\\cdot2$, $4\\cdot3$, $3\\cdot2\\cdot2$; candidates 2048, 96, 72, 60. She builds each; the rule is big exponents on small primes." },
      { minutes: 3, activity: "Idea 3: counting in a range", detail: "Example 3: three-digit multiples of 77 are $k=2,\\dots,12$, eleven of them; four are multiples of 3; answer 7. Emphasize $\\lfloor b/m\\rfloor-\\lfloor(a-1)/m\\rfloor$." },
      { minutes: 3, activity: "Primality and rules", detail: "Is 221 prime? Trial divide by 2, 3, 5, 7, 11, 13 only ($13^2=169<221<289$): $221=13\\times17$. Then the digit-sum test for 9 and the alternating test for 11 on 2728 ($2-7+2-8=-11$, so $11\\mid2728$)." },
      { minutes: 3, activity: "Exit ticket", detail: "60 seconds, exponent arithmetic only." },
    ],
    exitTicket: {
      question: "How many positive divisors does $2^4\\cdot3^2\\cdot7$ have?",
      answer: "30",
    },
    homework:
      "4 lesson problems at her band: one divisor count, one 'smallest with $k$ divisors', one range count, one divisibility rule. If the smallest-with-$k$ one is missed, redo example 2 tomorrow with 8 divisors (answer 24).",
    parentNotes: [
      "Strong: the prime factorization appears in the margin within ten seconds. Shaky: she works with the number itself.",
      "Multiplying exponents instead of (exponent + 1) is the sure-and-wrong; ask her to check $d(12)=6$ by listing.",
      "If trial division runs past $\\sqrt n$, stop and prove why it need not: a factor above the root pairs with one below.",
    ],
    amcConnection:
      "Problems 1-10. Look up 2019 AMC 10A #11 (divisors of $201^9$ that are squares or cubes), 2021 Fall AMC 10B #6 (least integer with exactly 2021 divisors), 2020 AMC 10A #15 (random divisor of $12!$ is a square) and 2021 Fall AMC 10A #5 (digit $A$ making $20210A$ prime).",
  },

  "nt-gcd-lcm": {
    skillId: "nt-gcd-lcm",
    objectives: [
      "By the end she can run the Euclidean algorithm on two four-digit numbers and report the last nonzero remainder.",
      "By the end she can use $\\gcd\\cdot\\text{lcm}=ab$ and min/max exponents to move between the two.",
      "By the end she can count ordered pairs with a given gcd and lcm with the $2^{\\text{primes}}$ trick.",
      "By the end she can simplify $\\gcd(n+a,\\,bn+c)$ by subtracting a multiple to kill $n$.",
    ],
    prerequisites: ["nt-divisibility"],
    warmup:
      "Mental: $\\gcd(12,18)$ (6); $\\text{lcm}(4,6)$ (12); $\\gcd(n,n+1)$ for any $n$ (1); $\\gcd(100,75)$ via $100-75$ (25).",
    sequence: [
      { minutes: 2, activity: "Hook", detail: "Ask for $\\gcd(1001,2618)$ with no factoring allowed. Show the first Euclidean step $2618-2\\cdot1001=616$ and hand her the rest." },
      { minutes: 4, activity: "Idea 1: Euclid", detail: "Example 1 to the end: 77. Verify by factoring $1001=7\\cdot11\\cdot13$. Ask for $\\text{lcm}(1001,2618)$ without computing it fully ($\\frac{1001\\cdot2618}{77}$)." },
      { minutes: 4, activity: "Idea 2: exponents", detail: "gcd takes min exponents, lcm takes max, so $\\gcd\\cdot\\text{lcm}=ab$. Do 72 and 120: $2^3 3^2$ and $2^3\\cdot3\\cdot5$ give gcd 24, lcm 360; check $24\\cdot360=8640=72\\cdot120$." },
      { minutes: 4, activity: "Idea 3: pair counting", detail: "Example 2: gcd 6, lcm 180, so $xy=30$ with $x,y$ coprime; each of three primes goes whole to one side, $2^3=8$ ordered pairs. How many unordered (4)?" },
      { minutes: 3, activity: "Idea 4: gcd with n", detail: "Example 3: $\\gcd(n+7,3n+1)=\\gcd(n+7,20)$; count $n\\le50$ with that equal to 4: $13-2=11$. 'Subtract a multiple to kill $n$' is the whole trick." },
      { minutes: 3, activity: "Exit ticket", detail: "60 seconds, product identity." },
    ],
    exitTicket: {
      question: "$\\gcd(a,b)=4$ and $\\text{lcm}(a,b)=120$. If $a=8$, what is $b$?",
      answer: "60",
    },
    homework:
      "4 lesson problems at her band: Euclid on ugly numbers, a gcd-lcm product, a pair count, a $\\gcd$ of expressions in $n$. If the last is missed, redo example 3 tomorrow with $\\gcd(n+3,2n+1)=\\gcd(n+3,5)$.",
    parentNotes: [
      "Strong: she subtracts multiples without hesitation and never factors numbers over 200 by hand. Shaky: she tries to factor 2618.",
      "Stopping Euclid one step early (reporting 154 or 231) is the execution slip; the answer is the last nonzero remainder.",
      "If the $2^{\\text{primes}}$ count feels like magic, list $30=2\\cdot3\\cdot5$ and show that splitting one prime across $x$ and $y$ would make them share a factor.",
    ],
    amcConnection:
      "Problems 3-12. Look up 2017 AMC 10A #16 (ten horses and lcm), 2020 AMC 10A #24 (least $n$ with two gcd conditions), 2018 AMC 10B #23 ($ab+63=20\\,\\text{lcm}+12\\gcd$) and 2023 AMC 10B #18 ($a+b+c=23$ with gcd sum 9).",
  },

  "nt-modular": {
    skillId: "nt-modular",
    objectives: [
      "By the end she can find the units digit of $a^n$ from the cycle, using the fourth entry when the exponent is a multiple of 4.",
      "By the end she can reduce $a^n \\bmod m$ by finding a small power congruent to 1 or $-1$.",
      "By the end she can solve a system of two or three congruences by listing from the largest modulus.",
      "By the end she can rule out an equation with squares mod 4.",
    ],
    prerequisites: ["nt-divisibility"],
    warmup:
      "Mental: units digit of $7^4$ (1); remainder of 100 divided by 7 (2); $2^5\\bmod7$ (4); units digit of $3^7$ (7); $999\\bmod9$ (0).",
    sequence: [
      { minutes: 2, activity: "Hook", detail: "Units digit of $7^{2026}$? Let her compute 7, 49, 343, 2401 and see the cycle 7, 9, 3, 1. The exponent mod 4 is 2, so 9. Cycles are the first idea." },
      { minutes: 4, activity: "Idea 1: cycles", detail: "Example 1: $7^{2026}+3^{2026}$ ends in $9+9$, so 8. Trap: an exponent that is a multiple of 4 picks the fourth entry, not the first; ask for the units digit of $3^{100}$ (1)." },
      { minutes: 4, activity: "Idea 2: find a power that is 1", detail: "Example 2: $2^3\\equiv1\\pmod7$, so $2^{100}=2^{3\\cdot33+1}\\equiv2$. Then $9\\equiv-1\\pmod{10}$, so $9^{2027}$ ends in 9. Negative representatives are fast." },
      { minutes: 5, activity: "Idea 3: systems", detail: "Example 3: $n\\equiv2$ mod 3 and mod 7 gives $n\\equiv2\\pmod{21}$; list 2, 23, 44 and test mod 5; $n\\equiv23\\pmod{105}$; ten values up to 1000. The method is 'list from the biggest modulus'." },
      { minutes: 2, activity: "Squares mod 4", detail: "Squares are 0 or 1 mod 4, so $x^2+y^2=2023$ has no integer solutions ($2023\\equiv3$). Ten seconds, kills whole problems." },
      { minutes: 3, activity: "Exit ticket", detail: "60 seconds; find the power that is 1." },
    ],
    exitTicket: {
      question: "What is the remainder when $3^{50}$ is divided by 8?",
      answer: "1",
    },
    homework:
      "4 lesson problems at her band: a units digit, an $a^n\\bmod m$, a system of congruences, a 'no solutions' by mod 4. If the system one is missed, redo example 3 tomorrow listing candidates aloud.",
    parentNotes: [
      "Strong: she reduces every number before multiplying. Shaky: she computes $7^5$ and then reduces.",
      "The 'multiple of 4 means the last entry' off-by-one is the sure-and-wrong; have her write the cycle with indices 1, 2, 3, 0.",
      "Do not let her divide both sides of a congruence; if she does, show $6\\equiv2\\pmod4$ but $3\\not\\equiv1$.",
    ],
    amcConnection:
      "Problems 5-18. Look up 2023 AMC 10B #8 (units digit of $2022^{2023}+2023^{2022}$), 2017 AMC 10A #13 (Fibonacci mod 3 is periodic), 2018 AMC 10B #13 (which of 101, 1001, 10001, ... are divisible by 101) and 2018 AMC 10B #16 (sum of cubes mod 6).",
  },

  "nt-bases": {
    skillId: "nt-bases",
    objectives: [
      "By the end she can convert a base-ten number to base 7 by largest powers or repeated division, and convert back to check.",
      "By the end she can solve an unknown-base equation like $121_b=144$ and reject bases smaller than a digit.",
      "By the end she can set a two- or three-digit number as $10a+b$ or $100a+10b+c$ and finish with digit bounds.",
      "By the end she can state that a number is congruent to its digit sum mod $b-1$.",
    ],
    prerequisites: ["nt-divisibility", "nt-modular"],
    warmup:
      "Mental: $101_2$ in base ten (5); $2\\cdot5^2+3\\cdot5+4$ (69, which is $234_5$); 45 in base 4 ($231_4$); with $a=7$, $b=2$, the value of $(10b+a)-(10a+b)$ ($-45$).",
    sequence: [
      { minutes: 2, activity: "Hook", detail: "What is $121$ in base 7? ($49+14+1=64$.) In base 5? (36.) In any base it is $(b+1)^2$. That pattern is the kind of thing the AMC hides." },
      { minutes: 4, activity: "Idea 1: conversion", detail: "Example 1: $2026=5\\cdot343+311$, $311=6\\cdot49+17$, $17=2\\cdot7+3$, so $5623_7$, digit sum 16. She converts back. Then repeated division on the same number, reading remainders upward." },
      { minutes: 3, activity: "Idea 2: unknown base", detail: "Example 2: $121_b=(b+1)^2=144$ gives $b=11$; digits legal. Then: in what base is $100_b=49$ ($b=7$)?" },
      { minutes: 5, activity: "Idea 3: digit algebra", detail: "Example 3: palindromes $\\overline{aba}=101a+10b$; mod 11 need $b\\equiv2a$; eight of them. She lists all eight (121, 242, 363, 484, 616, 737, 858, 979)." },
      { minutes: 3, activity: "Trap and rules", detail: "Write 78 in base 8 ($116_8$). Any digit 8 or 9 is wrong by definition. Then: a number equals its digit sum mod $b-1$; in base 10 that is the mod-9 rule." },
      { minutes: 3, activity: "Exit ticket", detail: "60 seconds, expand explicitly." },
    ],
    exitTicket: {
      question: "What is the base-ten value of $243_6$?",
      answer: "99",
    },
    homework:
      "4 lesson problems at her band: one conversion each way, one unknown-base equation, one digit-algebra problem. If the digit-algebra one is missed, tomorrow's warm-up is 'a two-digit number is 4 times its digit sum' (12, 24, 36, 48).",
    parentNotes: [
      "Strong: she writes the expansion $d_2b^2+d_1b+d_0$ every time. Shaky: she converts in her head and is off by one place.",
      "Remainders read in the wrong order in repeated division is the execution slip; have her write them bottom-to-top with an arrow.",
      "If conversion is fluent, spend the saved time on digit algebra; that is where the mid-paper problems live.",
    ],
    amcConnection:
      "Problems 5-15. Look up 2019 AMC 10A #18 (repeating base-$k$ fraction $0.\\overline{23}_k=\\frac7{51}$), 2021 Spring AMC 10B #13 ($32d$ in base $n$ equals 263), 2021 Spring AMC 10A #11 ($2021_b-221_b$ divisible by 3) and 2017 AMC 10A #25 (permutations of digits giving a multiple of 11).",
  },

  "nt-diophantine": {
    skillId: "nt-diophantine",
    objectives: [
      "By the end she can apply SFFT to $xy+ax+by=c$ by adding $ab$ and count solutions with $d(N)$.",
      "By the end she can solve $x^2-y^2=n$ by listing same-parity factor pairs.",
      "By the end she can decide when negative factor pairs count and prune by the given constraints.",
      "By the end she can kill an equation with a mod 4 or gcd argument.",
    ],
    prerequisites: ["nt-divisibility", "alg-quadratics"],
    warmup:
      "Mental: factor $xy+2x+3y+6$ ($(x+3)(y+2)$); number of positive divisors of 36 (9); can $x^2-y^2=6$ for integers (no, $6\\equiv2\\pmod4$); one solution of $3x+5y=1$ ($x=2$, $y=-1$).",
    sequence: [
      { minutes: 2, activity: "Hook", detail: "How many positive integer pairs satisfy $xy-3x-2y=6$? She will guess and check. The whole lesson is: add a constant, factor, count factor pairs." },
      { minutes: 5, activity: "Idea 1: SFFT", detail: "Example 1: add 6, $(x-2)(y-3)=12$, six positive factor pairs, six solutions; she translates each pair back. Then example 3: $\\frac1x+\\frac1y=\\frac16$ becomes $(x-6)(y-6)=36$, $d(36)=9$." },
      { minutes: 4, activity: "Idea 2: difference of squares", detail: "Example 2: $(x-y)(x+y)=60$; same parity forces both even: (2,30) and (6,10), two pairs. Ask why (1,60) fails ($x=30.5$)." },
      { minutes: 3, activity: "Idea 3: negatives and bounds", detail: "Redo example 1 with 'integers' instead of 'positive integers': now the negative factor pairs count too, 12 solutions. Bounds like $x\\le y$ halve the search." },
      { minutes: 3, activity: "Obstructions", detail: "$x^2+y^2=4023$ has no solutions since squares are 0 or 1 mod 4 and $4023\\equiv3$. Then $4x+6y=15$ has none since $\\gcd(4,6)=2$ does not divide 15." },
      { minutes: 3, activity: "Exit ticket", detail: "60 seconds; discard the pairs that give $x=0$." },
    ],
    exitTicket: {
      question: "How many ordered pairs $(x,y)$ of positive integers satisfy $xy+x+y=23$?",
      answer: "6",
    },
    homework:
      "4 lesson problems at her band: SFFT positive, SFFT with negatives allowed, difference of squares, a 'no solutions' mod argument. If SFFT is missed, tomorrow's warm-up is factoring five expressions of the form $xy+ax+by$.",
    parentNotes: [
      "Strong: she writes 'add $ab$' and factors before listing anything. Shaky: she lists pairs $(x,y)$ directly from the equation.",
      "Keeping the factor pairs (1,24) and (24,1) in the exit ticket is the standard slip; ask 'does $x+1=1$ give a positive $x$?'",
      "If the parity argument for $x^2-y^2$ does not land, show (1,60) numerically and move on; the count-by-$d(N)$ habit matters more.",
    ],
    amcConnection:
      "Problems 10-22. Look up 2023 AMC 10B #14 ($m^2+mn+n^2=m^2n^2$), 2020 AMC 10B #9 ($x^{2020}+y^2=2y$), 2015 AMC 10B #25 (box with volume equal to surface area, a three-variable SFFT) and 2018 AMC 10B #23 ($ab+63=20\\,\\text{lcm}+12\\gcd$, a factoring finish).",
  },

  "nt-factorials-powers": {
    skillId: "nt-factorials-powers",
    objectives: [
      "By the end she can compute $v_p(n!)$ with Legendre's floor sum and stop when $p^k>n$.",
      "By the end she can count trailing zeros of $n!$ in base 10 from the fives alone.",
      "By the end she can count trailing zeros in a composite base by dividing each prime's exponent and taking the minimum.",
      "By the end she can decide whether $m$ divides $n!$ prime by prime.",
    ],
    prerequisites: ["nt-divisibility"],
    warmup:
      "Mental: $6!$ (720); trailing zeros of $10!$ (2); largest power of 2 dividing 24 (8); multiples of 5 in 1 to 50 (10), multiples of 25 (2).",
    sequence: [
      { minutes: 2, activity: "Hook", detail: "How many zeros does $200!$ end with? She may say 40 (multiples of 5). Ask about 25, 50, ..., 200: each gives an extra 5, and 125 a third. 49." },
      { minutes: 4, activity: "Idea 1: Legendre", detail: "Example 1 formally: $\\lfloor200/5\\rfloor+\\lfloor200/25\\rfloor+\\lfloor200/125\\rfloor=40+8+1$. Each term is 'numbers with at least that many fives'. Why 5 and not 2: 2s are more plentiful." },
      { minutes: 4, activity: "Idea 2: any prime", detail: "Example 2: $v_3(100!)=33+11+3+1=48$. Then $v_2(30!)=15+7+3+1=26$, and the binary check $30-s_2(30)=30-4=26$ ($30=11110_2$)." },
      { minutes: 4, activity: "Idea 3: other bases", detail: "Example 3: base $12=2^2\\cdot3$; the 2s allow $\\lfloor26/2\\rfloor=13$, the 3s allow 14; minimum 13. Dividing by the exponent in the base is the step she must not skip." },
      { minutes: 3, activity: "Does m divide n!", detail: "Does $2^{10}\\cdot3^5$ divide $20!$? $v_2(20!)=18$, $v_3(20!)=8$, so yes. Does $7^3$? $v_7(20!)=2$, so no." },
      { minutes: 3, activity: "Exit ticket", detail: "60 seconds; two floor terms." },
    ],
    exitTicket: {
      question: "How many zeros does $100!$ end with?",
      answer: "24",
    },
    homework:
      "4 lesson problems at her band: base-10 zeros, $v_p$ for an odd prime, zeros in another base, one 'does $m$ divide $n!$'. If the other-base one is missed, redo example 3 tomorrow with base 6 (answer 14).",
    parentNotes: [
      "Strong: she writes the floor sum and stops when $p^k>n$. Shaky: she stops at $\\lfloor n/5\\rfloor$ and misses 25.",
      "Multiplying the floor terms instead of adding is a sure-and-wrong; ask 'what does each term count?'",
      "The week-5 calendar also lists simultaneous congruences for this day; if Legendre is solid in ten minutes, spend the rest on nt-modular example 3 again.",
    ],
    amcConnection:
      "Problems 10-22. Look up 2019 AMC 10A #2 (hundreds digit of $20!-15!$), 2023 AMC 10B #15 (least $m$ making $m\\cdot2!\\cdot3!\\cdots16!$ a perfect square), 2015 AMC 10B #23 ($n!$ ends in $k$ zeros and $(2n)!$ in $3k$) and 2019 AMC 10A #25 ($\\frac{(n^2-1)!}{(n!)^n}$ an integer).",
  },

  // -------------------------------------------------- COUNTING & PROBABILITY
  "cp-counting-basics": {
    skillId: "cp-counting-basics",
    objectives: [
      "By the end she can count arrangements with repeated letters by dividing by the factorials of the multiplicities.",
      "By the end she can handle 'together' by gluing a block and 'apart' by complement or gaps, and get the same answer both ways.",
      "By the end she can decide whether order matters and choose $P(n,k)$, $\\binom nk$ or a slot product accordingly.",
      "By the end she can count strictly increasing digit strings as subsets.",
    ],
    prerequisites: [],
    warmup:
      "Mental: $5!$ (120); $\\binom62$ (15); $\\binom{10}3$ (120); arrangements of the letters of BOOK (12); ways to seat 4 people in a row (24).",
    sequence: [
      { minutes: 2, activity: "Hook", detail: "Arrangements of BANANA? She may say 720. Divide by $3!$ for the A's and $2!$ for the N's: 60. Then: how many have the N's apart? That is the second idea." },
      { minutes: 4, activity: "Idea 1: repeats and blocks", detail: "Example 1: 60 total, glue NN to get $\\frac{5!}{3!}=20$ together, so 40 apart. Then by gaps: arrange B, A, A, A (4 ways), choose 2 of 5 gaps, $4\\cdot\\binom52=40$. Both routes must agree." },
      { minutes: 4, activity: "Idea 2: combinations and at least one", detail: "Example 2: $\\binom{11}4-\\binom64-\\binom54=330-15-5=310$. Ask why 'at least one boy and one girl' directly needs three cases and the complement needs one subtraction." },
      { minutes: 4, activity: "Idea 3: order or not", detail: "Example 3: strictly increasing three-digit numbers are subsets, $\\binom93=84$. Contrast: three-digit numbers with distinct digits is a slot product, $9\\cdot9\\cdot8=648$. Which is which, and why?" },
      { minutes: 3, activity: "Circular and slots", detail: "Five people at a round table: $(5-1)!=24$. In a row with A and B adjacent: $2\\cdot4!=48$. Most restricted slot first: plates with three letters then two digits, first letter a vowel, $5\\cdot26\\cdot26\\cdot10\\cdot10$." },
      { minutes: 3, activity: "Exit ticket", detail: "60 seconds, repeated letters." },
    ],
    exitTicket: {
      question: "How many arrangements of the letters of LETTER are there?",
      answer: "180",
    },
    homework:
      "4 lesson problems at her band: a repeated-letter arrangement, a committee with a restriction, a 'together or apart', an increasing-digits subset. If the 'apart' one is missed, redo example 1 tomorrow by both the complement and the gap method.",
    parentNotes: [
      "Strong: she asks 'does order matter?' and 'are they distinct?' aloud before picking a formula. Shaky: she multiplies whatever numbers appear.",
      "Forgetting the inside-the-block arrangements (the $\\times2$) is the common slip; ask 'can A and B swap inside the block?'",
      "The calendar teaches this the day after casework; open with the $\\binom nk$ warm-up and skip nothing, since casework leaned on binomials.",
    ],
    amcConnection:
      "Problems 1-10. Look up 2019 AMC 10A #17 (towers of colored cubes, arrangements with repeats), 2020 AMC 10B #5 (arrangements of colored tiles), 2017 AMC 10A #8 (handshakes at a gathering) and 2020 AMC 10B #11 (Harold and Betty each pick 5 of 10 books, exactly 2 in common).",
  },

  "cp-probability": {
    skillId: "cp-probability",
    objectives: [
      "By the end she can write an equally likely sample space (36 ordered dice pairs, $\\binom72$ hands) before counting anything.",
      "By the end she can use the complement for 'at least one' and for 'product is even'.",
      "By the end she can compute a without-replacement probability both by sequential fractions and by a hand count, and get the same answer.",
      "By the end she can condition by shrinking the sample space and recounting.",
    ],
    prerequisites: ["cp-counting-basics", "cp-casework"],
    warmup:
      "Mental: $P$(two coins both heads) ($\\frac14$); $P$(a die shows a prime) ($\\frac12$); $P$(at least one head in three flips) ($\\frac78$); ways to roll a sum of 7 on two dice (6).",
    sequence: [
      { minutes: 2, activity: "Hook", detail: "Two dice: probability the product is even? Let her start listing. Then: odd only if both are odd, $\\frac14$, so $\\frac34$ (example 1). 'At least' and 'even product' both scream complement." },
      { minutes: 3, activity: "Idea 1: equally likely", detail: "Two dice are 36 ordered pairs, not 21 unordered and not 11 sums. From a quick $6\\times6$ sketch: $P(\\text{sum}=5)=\\frac4{36}$, $P(\\text{sum}=7)=\\frac6{36}$." },
      { minutes: 5, activity: "Idea 2: without replacement", detail: "Example 2: 4 red, 3 blue; red-then-blue $\\frac47\\cdot\\frac36$ plus blue-then-red $\\frac37\\cdot\\frac46$ gives $\\frac47$. Then $\\frac{\\binom41\\binom31}{\\binom72}=\\frac{12}{21}$. She should be able to run either route." },
      { minutes: 4, activity: "Idea 3: conditional", detail: "Example 3: given the first flip is heads, 4 flips remain, 16 outcomes, exactly one more head is 4, so $\\frac14$. Conditional means shrink the space and recount, nothing fancier." },
      { minutes: 3, activity: "Independence and binomial", detail: "$P$(exactly 2 heads in 4 flips) $=\\binom42/16=\\frac6{16}$. Unfair coin with $P(H)=\\frac13$: $\\binom42(\\frac13)^2(\\frac23)^2=\\frac{8}{27}$." },
      { minutes: 3, activity: "Exit ticket", detail: "60 seconds; denominator first." },
    ],
    exitTicket: {
      question: "A bag has 5 red and 3 blue marbles. Two are drawn without replacement. What is the probability both are red?",
      answer: "$\\frac{5}{14}$",
    },
    homework:
      "4 lesson problems at her band: one complement, one without-replacement, one conditional, one dice sum. If the without-replacement one is missed, tomorrow's warm-up is example 2 with 5 red and 2 blue.",
    parentNotes: [
      "Strong: she writes the denominator (36, $\\binom72$, 16) first. Shaky: she writes a fraction with no idea where the denominator came from.",
      "Treating the sums 2 through 12 as equally likely is the classic sure-and-wrong; the $6\\times6$ grid fixes it permanently.",
      "If her two routes in example 2 disagree, stop; that disagreement is the concept gap (ordered versus unordered) and is worth the rest of the block.",
    ],
    amcConnection:
      "Problems 3-15. Look up 2016 AMC 10B #12 (product of two numbers from 1-5 is even), 2018 AMC 10B #6 (chips drawn until the sum exceeds 4), 2021 Fall AMC 10A #9 (unfair die, even sum) and 2021 Fall AMC 10B #14 (product of six dice divisible by 4, a complement).",
  },

  "cp-casework": {
    skillId: "cp-casework",
    objectives: [
      "By the end she can count 'contains at least one 7' as total minus 7-free using leading zeros.",
      "By the end she can choose $k$ non-adjacent positions from $n$ with the gap method and the formula $\\binom{n-k+1}{k}$.",
      "By the end she can write a disjoint, exhaustive case list before counting and audit it for overlap.",
    ],
    prerequisites: ["cp-counting-basics"],
    warmup:
      "Mental: integers from 1 to 100 that are multiples of 3 (33); two-digit numbers with no digit 0 (81); 'at least one' is the complement of what (none); integers from 10 to 40 inclusive (31).",
    sequence: [
      { minutes: 2, activity: "Hook", detail: "How many integers from 1 to 1000 contain the digit 7? Let her try casework by position; it gets messy. 'At least one 7' means count the ones with none: $9^3=729$, so 271 (example 1)." },
      { minutes: 4, activity: "Idea 1: complement", detail: "Example 1 carefully: leading zeros make every number a three-digit string and 000 stands in for 1000. Ask why the answer is not $1000-9\\cdot9\\cdot9$ plus something; the check is that 1000 has no 7." },
      { minutes: 5, activity: "Idea 2: gaps", detail: "Example 2: 3 non-adjacent books out of 10: line up the 7 others, 8 gaps, $\\binom83=56$. Then the general $\\binom{n-k+1}k$; verify with $n=5$, $k=2$ by listing (6)." },
      { minutes: 4, activity: "Idea 3: clean casework", detail: "Example 3: $|x|+|y|\\le3$ by the value $k=|x|+|y|$: $1+4+8+12=25$. Cases are disjoint and exhaustive; the case list is written before any counting." },
      { minutes: 2, activity: "Overlap check", detail: "Integers 1 to 30 divisible by 2 or 3 by cases 'even' and 'odd multiple of 3': $15+5=20$. If she does $15+10$ she double counted the multiples of 6." },
      { minutes: 3, activity: "Exit ticket", detail: "60 seconds, slot product." },
    ],
    exitTicket: {
      question: "How many three-digit positive integers have no digit equal to 5?",
      answer: "648",
    },
    homework:
      "4 lesson problems at her band: one complement, one gap count, one case-by-value, one range count. If the complement one is missed, tomorrow's warm-up is example 1 for the digit 3 (still 271) and then for 'contains 7 or 3' ($1000-8^3=488$).",
    parentNotes: [
      "Strong: she writes 'total minus bad' or the explicit case list before counting. Shaky: she starts enumerating and loses track.",
      "Overlapping cases are the sure-and-wrong; ask 'can one number be in two of your cases?' for every list.",
      "Counting basics come the next day in the calendar; if $\\binom83$ is unfamiliar today, give her the formula, let her compute, and flag it for tomorrow.",
    ],
    amcConnection:
      "Problems 5-18. Look up 2018 AMC 10B #5 (subsets with at least one prime, complement), 2017 AMC 10A #19 (Alice, Bob and Carla seating with refusals), 2022 AMC 10B #3 (three-digit integers with an odd number of even digits) and 2021 Fall AMC 10A #18 (four crops in a $2\\times2$ field with adjacency rules).",
  },

  "cp-stars-bars": {
    skillId: "cp-stars-bars",
    objectives: [
      "By the end she can count nonnegative and positive solutions of $x_1+\\cdots+x_k=n$ with the right binomial.",
      "By the end she can handle an upper bound by subtracting the shifted violations.",
      "By the end she can count 'divisible by $a$ or $b$' with inclusion-exclusion using the lcm for the overlap.",
      "By the end she can tell identical-into-distinct (stars and bars) from distinct-into-distinct ($k^n$).",
    ],
    prerequisites: ["cp-counting-basics"],
    warmup:
      "Mental: $\\binom92$ (36); nonnegative solutions to $a+b=5$ (6); multiples of 2 or 3 up to 12 (8); how many of 1 to 20 are divisible by neither 2 nor 5 (8).",
    sequence: [
      { minutes: 2, activity: "Hook", detail: "Ten identical candies to 4 kids, each gets at least one. She guesses, then draws 10 stars with 3 bars placed in the 9 gaps: $\\binom93=84$ (example 1)." },
      { minutes: 4, activity: "Idea 1: stars and bars", detail: "Nonnegative: $\\binom{n+k-1}{k-1}$. Positive: give one each first. Example 1 both ways. Distinct objects into boxes is $k^n$, not this; ask which applies to 'letters into mailboxes'." },
      { minutes: 4, activity: "Idea 2: upper bounds", detail: "Example 2: $a+b+c=12$ with $a\\le5$: 91 total minus the 28 with $a\\ge6$ (substitute $a'=a-6$). The shift is by 6, not 5." },
      { minutes: 4, activity: "Idea 3: inclusion-exclusion", detail: "Example 3: divisible by 2 or 3 up to 300 is $150+100-50=200$; remove those also divisible by 5 (multiples of 10 or 15, overlap 30): $200-40=160$. Draw the Venn diagram and fill from the center." },
      { minutes: 3, activity: "Three sets", detail: "Singles minus pairs plus triple. Integers 1 to 60 divisible by 2, 3 or 5: $30+20+12-10-6-4+2=44$. She writes each term with its sign before summing." },
      { minutes: 3, activity: "Exit ticket", detail: "60 seconds, positive solutions." },
    ],
    exitTicket: {
      question: "How many ordered triples of positive integers $(a,b,c)$ satisfy $a+b+c=10$?",
      answer: "36",
    },
    homework:
      "2 stars-and-bars and 2 path problems at her band today. If the upper-bound one is missed, tomorrow's warm-up is example 2 with $a\\le3$ ($91-\\binom{10}2=46$).",
    parentNotes: [
      "Strong: she writes the equation with explicit bounds before any binomial. Shaky: she picks $\\binom nk$ with the wrong $n$.",
      "The give-one-each step for positive solutions and the shift for upper bounds are the two slips; ask 'what did you substitute?'",
      "If the three-set signs are shaky, drop it; two-set inclusion-exclusion is what the AMC 10 usually needs.",
    ],
    amcConnection:
      "Problems 8-20. Look up 2023 AMC 10B #11 (Suzanne's 800 dollars in 20s, 50s and 100s), 2021 Fall AMC 10A #21 (20 balls into 5 bins, ratio of two probabilities), 2019 AMC 10A #11 (divisors that are squares or cubes, inclusion-exclusion) and 2022 AMC 10B #8 (sets of ten with exactly two multiples of 7).",
  },

  "cp-expected": {
    skillId: "cp-expected",
    objectives: [
      "By the end she can compute an expected count by adding one probability per possible occurrence, with no independence needed.",
      "By the end she can compute a weighted-average expectation and the $\\frac1p$ waiting time.",
      "By the end she can turn 'two numbers chosen from $[0,a]$' into a square and compute a probability as an area ratio with triangles.",
    ],
    prerequisites: ["cp-probability", "geo-area"],
    warmup:
      "Mental: expected value of one die roll (3.5); expected heads in 10 flips (5); a point chosen at random on $[0,10]$ is within 2 of an endpoint ($\\frac25$); expected flips until the first head (2).",
    sequence: [
      { minutes: 2, activity: "Hook", detail: "Ten hats returned at random; expected number of people with their own hat? She guesses. Define $X_i$ and add ten $\\frac1{10}$'s: 1 (example 1). The events are dependent and it does not matter." },
      { minutes: 5, activity: "Idea 1: linearity", detail: "Example 3: nine consecutive pairs of flips, each HH with probability $\\frac14$, so $\\frac94$. She states the recipe: one indicator per possible occurrence, add the probabilities. What changes for 'both tails' (nothing)?" },
      { minutes: 4, activity: "Idea 2: weighted average", detail: "$E[X]=\\sum xP(x)$. A game pays 6 with probability $\\frac16$ and 0 otherwise: $E=1$. Fair $n$-sided die: $\\frac{n+1}2$. Expected trials until a $\\frac16$ event: 6." },
      { minutes: 5, activity: "Idea 3: geometric probability", detail: "Example 2: $x,y$ uniform on $[0,2]$, $P(x+y>3)$: draw the $2\\times2$ square, shade above the line, triangle of area $\\frac12$, so $\\frac18$. Then $P(|x-y|<1)$ by shading the diagonal band: $1-\\frac{1}{4}=\\frac34$." },
      { minutes: 1, activity: "Trap demo", detail: "Can the expected value be a number that never occurs? Yes (3.5). And the total area for $[0,2]^2$ is 4, not 2." },
      { minutes: 3, activity: "Exit ticket", detail: "60 seconds, count the pairs." },
    ],
    exitTicket: {
      question: "A fair coin is flipped 8 times. What is the expected number of times two consecutive flips are both tails?",
      answer: "$\\frac{7}{4}$",
    },
    homework:
      "4 lesson problems at her band: an indicator sum, a weighted average, a geometric probability in a square, one on a segment. If the geometric one is missed, tomorrow's warm-up is example 2 with $x+y<1$ (area $\\frac12$ of 4, so $\\frac18$).",
    parentNotes: [
      "Strong: for 'expected number of', she writes $P$(one specific occurrence) times the number of occurrences. Shaky: she tries to list the whole distribution.",
      "Counting 10 consecutive pairs instead of 9 is the standard misread; have her list the pairs for 4 flips (3).",
      "If she insists linearity needs independence, do example 1 with 2 hats by listing both outcomes ($E=1$, and the events are obviously dependent).",
    ],
    amcConnection:
      "Problems 12-22. Look up 2017 AMC 10A #15 (Chloe and Laurent, geometric probability), 2021 Fall AMC 10B #16 (five balls swapped twice, expected number in place), 2018 AMC 10B #22 ($x$, $y$, 1 form an obtuse triangle) and 2020 AMC 10A #16 (point within $d$ of a lattice point).",
  },

  "cp-paths-recursion": {
    skillId: "cp-paths-recursion",
    objectives: [
      "By the end she can count lattice paths with a binomial and subtract paths through a forbidden point.",
      "By the end she can write a last-step recurrence, set the base cases, and fill a table to $n=8$.",
      "By the end she can define states for a bug on a triangle, write the transitions, and check the table against $2^n$.",
    ],
    prerequisites: ["cp-counting-basics", "alg-sequences"],
    warmup:
      "Mental: paths from (0,0) to (3,2) with right and up steps (10); next Fibonacci after 1, 2, 3, 5, 8 (13); $\\binom63$ (20); ways to climb 4 stairs by 1s and 2s (5).",
    sequence: [
      { minutes: 2, activity: "Hook", detail: "Paths from (0,0) to (5,4) with only right and up: she guesses. Each path is a word with 5 R's and 4 U's, $\\binom94=126$. Then: how many avoid (2,2)?" },
      { minutes: 4, activity: "Idea 1: lattice paths", detail: "Example 1: through (2,2) is $\\binom42\\binom52=60$, so avoiding is 66. Paths through a point multiply; 'avoid' is total minus through. What changes if the start is (1,1) (use differences)?" },
      { minutes: 5, activity: "Idea 2: recurrence", detail: "Example 2: stairs of 8 by 1 or 2; the last jump was 1 or 2, so $a_n=a_{n-1}+a_{n-2}$, 34. She builds the table from $a_1=1$, $a_2=2$. Binary strings with no two adjacent 1s are the same sequence shifted." },
      { minutes: 5, activity: "Idea 3: states", detail: "Example 3: bug on a triangle, $a_{n+1}=2o_n$ and $o_{n+1}=a_n+o_n$. She fills the table to $n=6$ (22) and checks $22+2\\cdot21=64=2^6$. State tables are how the hardest AMC counting problems fall." },
      { minutes: 1, activity: "Base case trap", detail: "With $a_0=1$ (do nothing) and $a_1=1$, what is $a_8$? Still 34; a 21 or 55 means the base cases shifted." },
      { minutes: 3, activity: "Exit ticket", detail: "60 seconds, multiply two binomials." },
    ],
    exitTicket: {
      question: "How many paths from (0,0) to (4,3) using only unit right and up steps pass through (1,1)?",
      answer: "20",
    },
    homework:
      "Today: 2 path and 2 stars-and-bars problems; on the week-5 revisit, 4 recursion or state problems at the hard band. If the state-table one is missed, redo example 3 tomorrow with a square instead of a triangle (states: home, adjacent, opposite).",
    parentNotes: [
      "Strong: she writes the recurrence in one line and fills a table. Shaky: she hunts for a closed form or draws every path.",
      "Base cases off by one shift the whole Fibonacci table; have her verify $a_3=3$ by listing (1+1+1, 1+2, 2+1).",
      "On the week-5 pass, if the triangle example is instant, move to '10-step sequences returning a bug to the start on a square' and let her build the states herself.",
    ],
    amcConnection:
      "Problems 12-25. Look up 2020 AMC 10A #13 (frog jumping inside a square, ends on a vertical side), 2021 Spring AMC 10A #23 (Frieda the frog on a $3\\times3$ grid), 2021 Spring AMC 10A #20 (rearrangements of 1-5 with no three consecutive monotone terms) and 2015 AMC 10B #20 (Erin the ant on the edges of a cube).",
  },
};

export function lessonPlanFor(skillId: string): LessonPlan | undefined {
  return LESSON_PLANS[skillId];
}
