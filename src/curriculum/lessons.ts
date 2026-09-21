// Lesson content for every skill in skills.ts. One Lesson per skill id.
//
// Rendering contract: all math lives inside $...$ (inline) or $$...$$ (display).
// The renderer splits on $ delimiters and passes the rest through as plain text,
// so there is no markdown or HTML here. Bullets are plain array entries.

export type WorkedExample = { problem: string; solution: string; answer: string };
export type Checkpoint = { id: string; question: string; answer: string; hint: string; explanation: string };
export type Lesson = {
  skillId: string;
  summary: string;
  keyIdeas: string[];
  formulas: string[];
  checkpoints: Checkpoint[];      // NEW: 4 per lesson
  workedExamples: WorkedExample[]; // NOW with answer
  pitfalls: string[];
  amcStrategy: string;
  estimatedMinutes: number;
};

export const LESSONS: Record<string, Lesson> = {
  // ---------------------------------------------------------------- ALGEBRA
  "alg-linear": {
    skillId: "alg-linear",
    summary:
      "Linear word problems ask you to turn a sentence into an equation and solve it: rates, distances, work, money, ages. They are the bread and butter of AMC 10 problems 1 through 8, and the fastest points on the paper if you set them up cleanly.",
    keyIdeas: [
      "Name the unknown that the question actually asks for, then write one equation per sentence of the problem. Every 'is', 'equals', 'total' is an equals sign.",
      "Distance = rate times time: $d = rt$. Keep the units consistent (convert minutes to hours before you multiply).",
      "Average speed is total distance divided by total time, never the average of the two speeds. Same distance out and back at $v_1$ and $v_2$ gives $\\frac{2v_1v_2}{v_1+v_2}$.",
      "Work problems: if a job takes $a$ hours alone, the rate is $\\frac1a$ of the job per hour. Rates add (and a drain subtracts).",
      "Relative speed: objects moving toward each other close the gap at $v_1+v_2$; the same direction closes it at $v_1-v_2$.",
      "Age problems: the difference between two ages never changes. Write ages 'in $k$ years' as $A+k$ and $M+k$.",
      "For multiple choice, plug the answer choices in when the setup looks messy; the middle choice tells you which direction to move.",
    ],
    formulas: [
      "$d = rt$",
      "$\\text{average speed} = \\dfrac{\\text{total distance}}{\\text{total time}}$",
      "Round trip at speeds $v_1, v_2$: $\\text{avg} = \\dfrac{2v_1v_2}{v_1+v_2}$",
      "Together time for jobs of $a$ and $b$ hours: $\\dfrac{1}{a}+\\dfrac{1}{b}=\\dfrac{1}{t}$, so $t=\\dfrac{ab}{a+b}$",
      "Closing speed (toward each other) $= v_1 + v_2$; catching up $= v_1 - v_2$",
    ],
    checkpoints: [
      {
        id: "alg-linear-1",
        question: "A car travels $150$ miles in $2.5$ hours. What is its average speed in miles per hour?",
        answer: "60",
        hint: "Use $d=rt$ and solve for $r$.",
        explanation: "$r=\\frac{d}{t}=\\frac{150}{2.5}=60$ miles per hour.",
      },
      {
        id: "alg-linear-2",
        question: "Two cyclists start $60$ miles apart and ride toward each other at $12$ and $18$ miles per hour. After how many hours do they meet?",
        answer: "2",
        hint: "Riding toward each other, their speeds add.",
        explanation: "The gap closes at $12+18=30$ miles per hour, so they meet after $\\frac{60}{30}=2$ hours.",
      },
      {
        id: "alg-linear-3",
        question: "One hose fills a pool in $4$ hours and a second hose fills it in $12$ hours. How many hours do both hoses together take?",
        answer: "3",
        hint: "Add the rates $\\frac14$ and $\\frac1{12}$ of the pool per hour.",
        explanation: "$\\frac14+\\frac1{12}=\\frac{3}{12}+\\frac{1}{12}=\\frac13$ of the pool per hour, so the pool fills in $3$ hours.",
      },
      {
        id: "alg-linear-4",
        question: "Kim drives to a town at $40$ miles per hour and returns along the same road at $60$ miles per hour. What is her average speed for the whole round trip, in miles per hour?",
        answer: "48",
        hint: "Average speed is total distance over total time, not the average of $40$ and $60$.",
        explanation: "With a one-way distance of $120$ miles the times are $3$ and $2$ hours, so the average speed is $\\frac{240}{5}=48$. The shortcut $\\frac{2\\cdot40\\cdot60}{40+60}$ gives the same $48$.",
      },
    ],
    workedExamples: [
      {
        problem:
          "Maya drives to work at $30$ miles per hour and drives home along the same route at $45$ miles per hour. The two trips take a total of $2$ hours. How many miles is her one-way commute?",
        solution:
          "Let the one-way distance be $d$. Time out is $\\frac{d}{30}$ and time back is $\\frac{d}{45}$, so $\\frac{d}{30}+\\frac{d}{45}=2$. Common denominator $90$: $\\frac{3d+2d}{90}=2$, so $5d=180$ and $d=36$. Check: $36/30=1.2$ hours and $36/45=0.8$ hours, total $2$. Answer: $36$.",
        answer: "36",
      },
      {
        problem:
          "Pipe A fills a tank in $6$ hours, pipe B fills it in $9$ hours, and drain C empties a full tank in $18$ hours. If all three are opened on an empty tank, how many hours does it take to fill?",
        solution:
          "Rates per hour: $\\frac16+\\frac19-\\frac1{18}=\\frac{3}{18}+\\frac{2}{18}-\\frac{1}{18}=\\frac{4}{18}=\\frac29$ of the tank per hour. Time is the reciprocal: $\\frac92=4.5$ hours. Answer: $4.5$ hours.",
        answer: "\\frac{9}{2}",
      },
      {
        problem:
          "The sum of Ann's age and her mother's age is $50$. In $5$ years, her mother will be exactly three times as old as Ann. How old is Ann now?",
        solution:
          "Let Ann be $A$ and her mother $M$, with $A+M=50$. In $5$ years: $M+5=3(A+5)$, so $M=3A+10$. Substitute: $A+3A+10=50$, $4A=40$, $A=10$. Check: $M=40$; in $5$ years $45=3\\cdot15$. Answer: $10$.",
        answer: "10",
      },
    ],
    pitfalls: [
      "Averaging two speeds instead of computing total distance over total time.",
      "Mixing minutes and hours in the same equation (e.g. $45$ minutes is $0.75$ hours, not $0.45$).",
      "Solving for the wrong quantity: the problem asks for the mother's age but you box Ann's.",
      "Forgetting that a drain or an opposing worker subtracts from the combined rate.",
      "Setting up 'twice as old' backwards: 'M is twice A' means $M = 2A$, not $2M = A$.",
    ],
    amcStrategy:
      "These are problems 1 through 8; budget about a minute each. Read the last sentence first so you know what to solve for, define one variable, and write the equation before doing any arithmetic. If the answer choices are numbers, a quick plug-in check of your answer against the story catches most setup mistakes.",
    estimatedMinutes: 9,
  },

  "alg-ratios": {
    skillId: "alg-ratios",
    summary:
      "Ratios, percents, and averages are the language of the early AMC 10. The skill is to convert every ratio into a scale factor, every percent into a multiplier, and every average into a total.",
    keyIdeas: [
      "A ratio $a:b$ means the actual amounts are $ak$ and $bk$ for some common factor $k$. Introduce $k$ and solve for it.",
      "A percent change is a multiplier: up $20\\%$ is $\\times 1.2$, down $25\\%$ is $\\times 0.75$. Successive changes multiply; they do not add.",
      "Percent of what? 'Increased by $50\\%$' uses the original as the base; 'is $50\\%$ more than' uses the thing after 'than' as the base.",
      "Mean questions are really sum questions: $\\text{sum}=\\text{mean}\\times\\text{count}$. Adding or removing a number changes the sum by that number.",
      "Median: sort first. With an even count, average the two middle values. Mode is the most frequent value.",
      "Weighted averages (mixtures, class averages): total the parts, then divide by the total weight. Never average the averages unless the groups are equal.",
      "$x\\%$ of $y$ equals $y\\%$ of $x$, which is handy for mental arithmetic: $16\\%$ of $25$ is $25\\%$ of $16=4$.",
    ],
    formulas: [
      "$\\text{new} = \\text{old}\\cdot\\left(1+\\dfrac{p}{100}\\right)$",
      "$\\text{percent change} = \\dfrac{\\text{new}-\\text{old}}{\\text{old}}\\cdot 100\\%$",
      "$\\text{mean} = \\dfrac{x_1+x_2+\\cdots+x_n}{n}$",
      "Weighted average: $\\dfrac{w_1a_1+w_2a_2}{w_1+w_2}$",
      "Up $p\\%$ then down $p\\%$ gives $\\left(1-\\dfrac{p^2}{10000}\\right)$ of the original, always a net loss.",
    ],
    checkpoints: [
      {
        id: "alg-ratios-1",
        question: "What is $15\\%$ of $80$?",
        answer: "12",
        hint: "Convert the percent to a decimal multiplier.",
        explanation: "$0.15\\times80=12$ (or notice $80\\%$ of $15$ is $12$).",
      },
      {
        id: "alg-ratios-2",
        question: "Two numbers are in the ratio $2:7$ and their sum is $45$. What is the larger number?",
        answer: "35",
        hint: "Write the numbers as $2k$ and $7k$.",
        explanation: "$2k+7k=9k=45$ gives $k=5$, so the larger number is $7\\cdot5=35$.",
      },
      {
        id: "alg-ratios-3",
        question: "The mean of four numbers is $10$. If the number $22$ is removed, what is the mean of the remaining three numbers?",
        answer: "6",
        hint: "Turn the mean into a total first.",
        explanation: "The four numbers sum to $40$; removing $22$ leaves $18$, and $\\frac{18}{3}=6$.",
      },
      {
        id: "alg-ratios-4",
        question: "A price is increased by $50\\%$ and then decreased by $50\\%$. The final price is what percent less than the original price?",
        answer: "25",
        hint: "Successive percent changes multiply.",
        explanation: "$1.5\\times0.5=0.75$, so the final price is $75\\%$ of the original, a $25\\%$ decrease.",
      },
    ],
    workedExamples: [
      {
        problem:
          "The average of five numbers is $12$. When a sixth number is added, the average of all six becomes $14$. What is the sixth number?",
        solution:
          "The five numbers sum to $5\\cdot12=60$. The six numbers sum to $6\\cdot14=84$. The sixth number is $84-60=24$. Answer: $24$.",
        answer: "24",
      },
      {
        problem:
          "A store raises the price of a jacket by $20\\%$, then puts it on sale for $25\\%$ off the new price. The sale price is what percent of the original price?",
        solution:
          "Multiply the factors: $1.20\\times0.75=0.90$. The sale price is $90\\%$ of the original, a net $10\\%$ decrease. Answer: $90\\%$.",
        answer: "90",
      },
      {
        problem:
          "The ratio of boys to girls in a club is $3:5$. After $4$ boys join and $4$ girls leave, the numbers of boys and girls are equal. How many members did the club have originally?",
        solution:
          "Let there be $3k$ boys and $5k$ girls. Then $3k+4=5k-4$, so $2k=8$ and $k=4$. Originally $12$ boys and $20$ girls, total $32$. Check: $16$ and $16$ afterward. Answer: $32$.",
        answer: "32",
      },
    ],
    pitfalls: [
      "Adding percents: $+20\\%$ then $-20\\%$ is not $0\\%$, it is $-4\\%$.",
      "Using the wrong base for a percent (the original price vs. the marked-up price).",
      "Treating ratio parts as actual counts: $3:5$ does not mean $3$ boys.",
      "Averaging averages of groups of different sizes.",
      "Forgetting to sort before finding the median, or forgetting to average the two middle terms when the count is even.",
    ],
    amcStrategy:
      "Expect one or two of these in problems 1 through 8, often with a trap answer that comes from adding percents or using the wrong base. Convert everything to totals and multipliers before computing. If the numbers are ugly, pick a convenient starting value like $100$ and scale.",
    estimatedMinutes: 8,
  },

  "alg-quadratics": {
    skillId: "alg-quadratics",
    summary:
      "Quadratics show up on the AMC 10 in every disguise: factoring, the discriminant, vertex questions, and above all Vieta's formulas, which let you compute things about roots without finding them. Mastering the sum-and-product viewpoint is worth several problems per year.",
    keyIdeas: [
      "Factor first, quadratic formula second. Look for two numbers with the right product and sum; if the discriminant $b^2-4ac$ is a perfect square the quadratic factors over the integers.",
      "Vieta: for $ax^2+bx+c=0$ with roots $r,s$: $r+s=-\\frac ba$ and $rs=\\frac ca$. Most 'find something about the roots' problems never need the roots themselves.",
      "Symmetric expressions reduce to sum and product: $r^2+s^2=(r+s)^2-2rs$, $\\frac1r+\\frac1s=\\frac{r+s}{rs}$, $(r-s)^2=(r+s)^2-4rs$.",
      "The discriminant tells you the root count: $\\Delta>0$ two real roots, $\\Delta=0$ one repeated root, $\\Delta<0$ none. Integer roots need $\\Delta$ to be a perfect square.",
      "Vertex of $y=ax^2+bx+c$ is at $x=-\\frac{b}{2a}$; complete the square to read off the min or max value.",
      "Disguised quadratics: substitute $u=x^2$, $u=\\sqrt{x}$, or $u=x+\\frac1x$ to expose $au^2+bu+c$.",
      "Difference of squares $a^2-b^2=(a-b)(a+b)$ is the most-used identity on the whole test.",
    ],
    formulas: [
      "$x=\\dfrac{-b\\pm\\sqrt{b^2-4ac}}{2a}$",
      "Vieta: $r+s=-\\dfrac{b}{a}$, $\\quad rs=\\dfrac{c}{a}$",
      "$r^2+s^2=(r+s)^2-2rs$",
      "$(r-s)^2=(r+s)^2-4rs=\\dfrac{b^2-4ac}{a^2}$",
      "Vertex form: $a(x-h)^2+k$ with $h=-\\dfrac{b}{2a}$, $k=c-\\dfrac{b^2}{4a}$",
      "$a^2-b^2=(a-b)(a+b)$",
    ],
    checkpoints: [
      {
        id: "alg-quadratics-1",
        question: "What is the sum of the roots of $x^2-7x+12=0$?",
        answer: "7",
        hint: "Vieta: the sum of the roots is $-\\frac{b}{a}$.",
        explanation: "Here $a=1$ and $b=-7$, so $r+s=7$. (The roots are $3$ and $4$.)",
      },
      {
        id: "alg-quadratics-2",
        question: "For what value of $c$ does $x^2-6x+c=0$ have exactly one real root?",
        answer: "9",
        hint: "One repeated root means the discriminant is zero.",
        explanation: "$b^2-4ac=36-4c=0$ gives $c=9$; indeed $x^2-6x+9=(x-3)^2$.",
      },
      {
        id: "alg-quadratics-3",
        question: "What is the minimum value of $x^2-10x+7$?",
        answer: "-18",
        hint: "Complete the square, or use $x=-\\frac{b}{2a}$.",
        explanation: "$x^2-10x+7=(x-5)^2-18$, so the minimum is $-18$, at $x=5$.",
      },
      {
        id: "alg-quadratics-4",
        question: "If $r$ and $s$ are the roots of $x^2+3x-5=0$, what is $\\frac1r+\\frac1s$?",
        answer: "\\frac{3}{5}",
        hint: "Combine into one fraction: $\\frac{r+s}{rs}$.",
        explanation: "$r+s=-3$ and $rs=-5$, so $\\frac1r+\\frac1s=\\frac{-3}{-5}=\\frac35$.",
      },
    ],
    workedExamples: [
      {
        problem: "Let $r$ and $s$ be the roots of $x^2-5x+3=0$. What is $r^2+s^2$?",
        solution:
          "By Vieta, $r+s=5$ and $rs=3$. Then $r^2+s^2=(r+s)^2-2rs=25-6=19$. Answer: $19$.",
        answer: "19",
      },
      {
        problem:
          "For how many integers $k$ with $|k|\\le 20$ does the equation $x^2+kx+36=0$ have two integer roots (not necessarily distinct)?",
        solution:
          "If the roots are integers $r,s$ then $rs=36$ and $k=-(r+s)$. Both roots have the same sign since the product is positive. Positive factor pairs of $36$: $(1,36),(2,18),(3,12),(4,9),(6,6)$ with sums $37,20,15,13,12$. Negative pairs give sums $-37,-20,-15,-13,-12$. So $k\\in\\{\\pm12,\\pm13,\\pm15,\\pm20,\\pm37\\}$, and $|k|\\le20$ removes $\\pm37$. Answer: $8$.",
        answer: "8",
      },
      {
        problem:
          "The sum of the squares of two consecutive positive odd integers is $290$. What is the sum of the two integers?",
        solution:
          "Call them $n$ and $n+2$: $n^2+(n+2)^2=290$, so $2n^2+4n+4=290$, $n^2+2n-143=0$, $(n+13)(n-11)=0$. Since $n>0$, $n=11$ and the integers are $11$ and $13$. Their sum is $24$. Answer: $24$.",
        answer: "24",
      },
    ],
    pitfalls: [
      "Sign error in Vieta: the sum of the roots is $-b/a$, not $b/a$.",
      "Dividing both sides by $x$ and losing the root $x=0$.",
      "Squaring both sides of an equation and keeping an extraneous root; always check.",
      "Confusing 'distinct real roots' ($\\Delta>0$) with 'real roots' ($\\Delta\\ge0$).",
      "Forgetting that a quadratic with $a<0$ has a maximum, not a minimum.",
    ],
    amcStrategy:
      "Problems 5 through 15. If a problem mentions roots, write down $r+s$ and $rs$ immediately and see whether the target expression is symmetric. For 'how many values of $k$' problems, list factor pairs systematically and remember negative pairs. Check answer choices against the discriminant when unsure.",
    estimatedMinutes: 11,
  },

  "alg-sequences": {
    skillId: "alg-sequences",
    summary:
      "Arithmetic and geometric sequences, sum formulas, and telescoping sums are reliable mid-paper AMC 10 material. The recurring trick is to write the general term, then either sum a closed form or watch a sum collapse.",
    keyIdeas: [
      "Arithmetic: $a_n=a_1+(n-1)d$. The sum of $n$ terms is the count times the average of the first and last term.",
      "Geometric: $a_n=a_1r^{n-1}$. Finite sum $a_1\\frac{r^n-1}{r-1}$; infinite sum $\\frac{a_1}{1-r}$ only when $|r|<1$.",
      "Counting terms: from $a$ to $b$ in steps of $d$ there are $\\frac{b-a}{d}+1$ terms. Off-by-one here is the most common lost point.",
      "Telescoping: split each term into a difference, e.g. $\\frac{1}{k(k+1)}=\\frac1k-\\frac1{k+1}$, and everything but the ends cancels.",
      "Recursions: compute the first several terms by hand. Many AMC recursions are periodic, so find the period and reduce the index mod the period.",
      "Know the sums $1+2+\\cdots+n$, $1^2+\\cdots+n^2$, and that the sum of the first $n$ odd numbers is $n^2$.",
      "For a sequence defined by a pattern, write $a_n$ explicitly in terms of $n$ before answering questions about the $100$th term.",
    ],
    formulas: [
      "$a_n=a_1+(n-1)d, \\qquad S_n=\\dfrac{n(a_1+a_n)}{2}$",
      "$a_n=a_1r^{n-1}, \\qquad S_n=a_1\\dfrac{r^n-1}{r-1}, \\qquad S_\\infty=\\dfrac{a_1}{1-r}\\ (|r|<1)$",
      "$\\displaystyle\\sum_{k=1}^n k=\\frac{n(n+1)}{2}, \\qquad \\sum_{k=1}^n k^2=\\frac{n(n+1)(2n+1)}{6}$",
      "$\\displaystyle\\sum_{k=1}^n k^3=\\left(\\frac{n(n+1)}{2}\\right)^2$",
      "$\\dfrac{1}{k(k+1)}=\\dfrac{1}{k}-\\dfrac{1}{k+1}, \\qquad \\dfrac{1}{k(k+2)}=\\dfrac12\\left(\\dfrac1k-\\dfrac1{k+2}\\right)$",
    ],
    checkpoints: [
      {
        id: "alg-sequences-1",
        question: "What is the $20$th term of the arithmetic sequence $5, 9, 13, \\dots$?",
        answer: "81",
        hint: "$a_n=a_1+(n-1)d$ with $d=4$.",
        explanation: "$a_{20}=5+19\\cdot4=5+76=81$.",
      },
      {
        id: "alg-sequences-2",
        question: "How many multiples of $7$ are there from $20$ to $200$ inclusive?",
        answer: "26",
        hint: "Find the first and last multiples, then count with $\\frac{b-a}{d}+1$.",
        explanation: "The multiples run from $21$ to $196$: $\\frac{196-21}{7}+1=25+1=26$.",
      },
      {
        id: "alg-sequences-3",
        question: "What is the sum of the infinite geometric series $12+4+\\frac43+\\cdots$?",
        answer: "18",
        hint: "Use $\\frac{a_1}{1-r}$ with $r=\\frac13$.",
        explanation: "$\\frac{12}{1-\\frac13}=\\frac{12}{2/3}=18$.",
      },
      {
        id: "alg-sequences-4",
        question: "Compute $\\displaystyle\\sum_{k=1}^{9}\\frac{1}{k(k+1)}$.",
        answer: "\\frac{9}{10}",
        hint: "Write each term as $\\frac1k-\\frac1{k+1}$ and let the sum telescope.",
        explanation: "Every middle term cancels, leaving $1-\\frac{1}{10}=\\frac{9}{10}$.",
      },
    ],
    workedExamples: [
      {
        problem:
          "In an arithmetic sequence the third term is $11$ and the tenth term is $39$. What is the sum of the first $20$ terms?",
        solution:
          "Seven steps take $11$ to $39$, so $7d=28$ and $d=4$. Then $a_1=11-2d=3$ and $a_{20}=3+19\\cdot4=79$. Sum $=\\frac{20(3+79)}{2}=10\\cdot82=820$. Answer: $820$.",
        answer: "820",
      },
      {
        problem: "Compute $\\displaystyle\\sum_{k=1}^{20}\\frac{2}{k(k+2)}$.",
        solution:
          "Each term is $\\frac1k-\\frac1{k+2}$. Writing them out, $\\left(1-\\frac13\\right)+\\left(\\frac12-\\frac14\\right)+\\left(\\frac13-\\frac15\\right)+\\cdots+\\left(\\frac1{20}-\\frac1{22}\\right)$. Everything cancels except $1+\\frac12-\\frac1{21}-\\frac1{22}$. Now $\\frac1{21}+\\frac1{22}=\\frac{43}{462}$ and $\\frac32=\\frac{693}{462}$, so the sum is $\\frac{650}{462}=\\frac{325}{231}$. Answer: $\\frac{325}{231}$.",
        answer: "\\frac{325}{231}",
      },
      {
        problem: "A sequence has $a_1=2$ and $a_{n+1}=\\dfrac{1}{1-a_n}$ for $n\\ge1$. What is $a_{2026}$?",
        solution:
          "Compute: $a_2=\\frac1{1-2}=-1$, $a_3=\\frac{1}{1-(-1)}=\\frac12$, $a_4=\\frac{1}{1-\\frac12}=2=a_1$. The sequence repeats with period $3$. Since $2026=3\\cdot675+1$, $a_{2026}=a_1=2$. Answer: $2$.",
        answer: "2",
      },
    ],
    pitfalls: [
      "Using $n$ instead of $n-1$ in $a_n=a_1+(n-1)d$.",
      "Applying the infinite geometric formula when $|r|\\ge1$.",
      "In a telescoping sum, forgetting that two terms survive at each end when the shift is $2$.",
      "Miscounting the number of terms in a range (remember the $+1$).",
      "Reducing the index mod the period incorrectly: if the period is $3$ and $n\\equiv0$, you want $a_3$, not $a_0$.",
    ],
    amcStrategy:
      "Problems 5 through 18. Write the general term before anything else; for a recursion, just compute six or seven terms and look for a cycle. Telescoping is signaled by fractions with products of consecutive numbers in the denominator. Sanity-check sums with a rough estimate.",
    estimatedMinutes: 11,
  },

  "alg-functions": {
    skillId: "alg-functions",
    summary:
      "Function problems test composition, inverses, absolute value, and the floor function. The AMC 10 likes to hide a simple structure behind notation, so the skill is unwrapping the definitions carefully and splitting into cases.",
    keyIdeas: [
      "Composition: $f(g(x))$ means apply $g$ first. Substitute the whole expression for $g(x)$ into $f$ and expand.",
      "Functional equations: plug in clever values ($x=0$, $x=1$, $x=y$) to get simple equations you can solve.",
      "Inverse functions swap input and output: if $f(a)=b$ then $f^{-1}(b)=a$. The graph reflects over $y=x$.",
      "Absolute value: $|x-a|$ is the distance from $x$ to $a$. Split at the points where each expression inside is zero and solve each interval.",
      "$|a|=|b|$ exactly when $a=\\pm b$; $|x|<r$ means $-r<x<r$.",
      "Floor: $\\lfloor x\\rfloor$ is the greatest integer $\\le x$, so $\\lfloor x\\rfloor\\le x<\\lfloor x\\rfloor+1$. To solve floor equations, set $n=\\lfloor\\cdot\\rfloor$, solve for $x$ in terms of $n$, then enforce the inequality.",
      "Graph transformations: $f(x-h)+k$ shifts right $h$ and up $k$; $f(-x)$ reflects over the $y$-axis; $-f(x)$ over the $x$-axis.",
    ],
    formulas: [
      "$(f\\circ g)(x)=f(g(x))$",
      "$f(f^{-1}(x))=x$; the graph of $f^{-1}$ is the reflection of $f$ over $y=x$",
      "$\\lfloor x\\rfloor\\le x<\\lfloor x\\rfloor+1, \\qquad \\lfloor x+n\\rfloor=\\lfloor x\\rfloor+n$ for integer $n$",
      "$|x|=\\sqrt{x^2}, \\qquad |ab|=|a|\\,|b|$",
      "$|x-a|+|x-b|$ has minimum $|a-b|$, attained for all $x$ between $a$ and $b$",
    ],
    checkpoints: [
      {
        id: "alg-functions-1",
        question: "Let $f(x)=3x-2$ and $g(x)=x^2$. What is $f(g(2))$?",
        answer: "10",
        hint: "Apply $g$ first, then $f$.",
        explanation: "$g(2)=4$, then $f(4)=3\\cdot4-2=10$.",
      },
      {
        id: "alg-functions-2",
        question: "If $f(x)=2x+5$, what is $f^{-1}(13)$?",
        answer: "4",
        hint: "Find the input that produces the output $13$.",
        explanation: "$2x+5=13$ gives $x=4$, so $f^{-1}(13)=4$.",
      },
      {
        id: "alg-functions-3",
        question: "What is $\\lfloor -3.2\\rfloor+\\lfloor 4.9\\rfloor$?",
        answer: "0",
        hint: "The floor is the greatest integer not exceeding the number; be careful with the negative one.",
        explanation: "$\\lfloor -3.2\\rfloor=-4$ and $\\lfloor 4.9\\rfloor=4$, so the sum is $0$.",
      },
      {
        id: "alg-functions-4",
        question: "What is the sum of all real solutions to $|2x-3|=7$?",
        answer: "3",
        hint: "$|a|=7$ means $a=7$ or $a=-7$.",
        explanation: "$2x-3=7$ gives $x=5$ and $2x-3=-7$ gives $x=-2$; the sum is $3$.",
      },
    ],
    workedExamples: [
      {
        problem:
          "Let $f(x)=2x+3$ and $g(x)=x^2-1$. What is the sum of all real $x$ for which $f(g(x))=g(f(x))$?",
        solution:
          "$f(g(x))=2(x^2-1)+3=2x^2+1$. $g(f(x))=(2x+3)^2-1=4x^2+12x+8$. Setting equal: $2x^2+12x+7=0$. The discriminant $144-56=88>0$, so there are two real roots, and by Vieta their sum is $-\\frac{12}{2}=-6$. Answer: $-6$.",
        answer: "-6",
      },
      {
        problem: "Find the sum of all real solutions to $|x-2|+|x-6|=8$.",
        solution:
          "Split at $2$ and $6$. For $x<2$: $(2-x)+(6-x)=8-2x=8$ gives $x=0$, valid. For $2\\le x\\le6$: the sum is always $4\\ne8$, no solutions. For $x>6$: $(x-2)+(x-6)=2x-8=8$ gives $x=8$, valid. Sum $0+8=8$. Answer: $8$.",
        answer: "8",
      },
      {
        problem: "How many real numbers $x$ satisfy $\\lfloor 2x\\rfloor=3x-4$?",
        solution:
          "Let $n=\\lfloor 2x\\rfloor$, an integer, so $3x-4=n$ and $x=\\frac{n+4}{3}$. The floor condition requires $n\\le 2x<n+1$, i.e. $n\\le\\frac{2n+8}{3}<n+1$. Left: $3n\\le 2n+8$ gives $n\\le8$. Right: $2n+8<3n+3$ gives $n>5$. So $n\\in\\{6,7,8\\}$, giving $x=\\frac{10}{3},\\frac{11}{3},4$. Answer: $3$.",
        answer: "3",
      },
    ],
    pitfalls: [
      "Composing in the wrong order: $f(g(x))\\ne g(f(x))$ in general.",
      "Forgetting a case when splitting absolute values, or not checking that each solution lies in its case's interval.",
      "$\\lfloor -2.5\\rfloor=-3$, not $-2$.",
      "Treating $f^{-1}(x)$ as $\\frac{1}{f(x)}$.",
      "Solving a floor equation and forgetting to enforce $n\\le 2x<n+1$, which produces extra fake solutions.",
    ],
    amcStrategy:
      "Problems 8 through 20. Unwrap the notation literally, one layer at a time, and write out cases on paper rather than in your head. For floor equations the substitution $n=\\lfloor\\cdot\\rfloor$ plus the interval check is nearly always the whole solution. When a functional equation looks scary, try $x=0$ and $x=1$ first.",
    estimatedMinutes: 12,
  },

  "alg-exponents": {
    skillId: "alg-exponents",
    summary:
      "Exponent and logarithm problems reward rewriting everything in a common base and applying a small set of rules exactly. The AMC 10 uses these to test whether you can compare huge numbers, solve exponential equations, and simplify radicals cleanly.",
    keyIdeas: [
      "Rewrite in a common base: $4=2^2$, $8=2^3$, $27=3^3$, $\\frac14=2^{-2}$. Then equal bases means equal exponents.",
      "Exponent towers evaluate top-down: $2^{3^2}=2^9$, not $8^2$.",
      "Compare big numbers by forcing a common exponent: $2^{300}=(2^3)^{100}=8^{100}$ vs. $3^{200}=9^{100}$.",
      "Logs are exponents: $\\log_b x=y$ means $b^y=x$. Change of base turns every log into the same base: $\\log_4 x=\\frac{\\log_2 x}{2}$.",
      "Log rules: product becomes sum, quotient becomes difference, power comes out front. There is no rule for $\\log(a+b)$.",
      "Rationalize denominators by multiplying by the conjugate: $\\frac{1}{\\sqrt a-\\sqrt b}\\cdot\\frac{\\sqrt a+\\sqrt b}{\\sqrt a+\\sqrt b}$.",
      "Number of digits of $N$ is $\\lfloor\\log_{10}N\\rfloor+1$; use $2^{10}=1024\\approx10^3$ for estimates.",
      "$\\sqrt{x^2}=|x|$, and even roots of negatives are not real.",
    ],
    formulas: [
      "$a^ma^n=a^{m+n}, \\quad (a^m)^n=a^{mn}, \\quad a^{-n}=\\dfrac{1}{a^n}, \\quad a^{1/n}=\\sqrt[n]{a}$",
      "$\\log_b(xy)=\\log_b x+\\log_b y, \\quad \\log_b\\dfrac{x}{y}=\\log_b x-\\log_b y, \\quad \\log_b x^n=n\\log_b x$",
      "$\\log_b x=\\dfrac{\\log_c x}{\\log_c b}, \\qquad \\log_{b^k}x=\\dfrac{1}{k}\\log_b x$",
      "$b^{\\log_b x}=x, \\qquad \\log_b b=1, \\qquad \\log_b 1=0$",
      "$\\dfrac{1}{\\sqrt a-\\sqrt b}=\\dfrac{\\sqrt a+\\sqrt b}{a-b}$",
    ],
    checkpoints: [
      {
        id: "alg-exponents-1",
        question: "Solve for $x$: $4^x=64$.",
        answer: "3",
        hint: "Write both sides as powers of $2$ (or of $4$).",
        explanation: "$4^x=2^{2x}$ and $64=2^6$, so $2x=6$ and $x=3$.",
      },
      {
        id: "alg-exponents-2",
        question: "What is $\\log_3 81$?",
        answer: "4",
        hint: "Ask: $3$ to what power is $81$?",
        explanation: "$3^4=81$, so $\\log_3 81=4$.",
      },
      {
        id: "alg-exponents-3",
        question: "Simplify $\\dfrac{1}{\\sqrt7-\\sqrt5}$.",
        answer: "\\frac{\\sqrt{7}+\\sqrt{5}}{2}",
        hint: "Multiply top and bottom by the conjugate $\\sqrt7+\\sqrt5$.",
        explanation: "The denominator becomes $7-5=2$, so the value is $\\frac{\\sqrt7+\\sqrt5}{2}$.",
      },
      {
        id: "alg-exponents-4",
        question: "Which is larger, $2^{40}$ or $3^{25}$?",
        answer: "2^{40}",
        hint: "Both exponents are multiples of $5$; compare fifth powers.",
        explanation: "$2^{40}=(2^8)^5=256^5$ and $3^{25}=(3^5)^5=243^5$, so $2^{40}$ is larger.",
      },
    ],
    workedExamples: [
      {
        problem: "Solve for $x$: $8^{x+1}=4^{2x-1}$.",
        solution:
          "Write both sides in base $2$: $2^{3(x+1)}=2^{2(2x-1)}$, so $3x+3=4x-2$ and $x=5$. Check: $8^6=2^{18}$ and $4^9=2^{18}$. Answer: $5$.",
        answer: "5",
      },
      {
        problem: "Find the positive real $x$ satisfying $\\log_2 x+\\log_4 x=6$.",
        solution:
          "Since $\\log_4 x=\\frac{\\log_2 x}{\\log_2 4}=\\frac12\\log_2 x$, the equation becomes $\\frac32\\log_2 x=6$, so $\\log_2 x=4$ and $x=16$. Check: $\\log_2 16=4$, $\\log_4 16=2$, sum $6$. Answer: $16$.",
        answer: "16",
      },
      {
        problem: "Which is larger, $2^{300}$ or $3^{200}$? Also simplify $\\dfrac{\\sqrt5-\\sqrt3}{\\sqrt5+\\sqrt3}$.",
        solution:
          "$2^{300}=(2^3)^{100}=8^{100}$ and $3^{200}=(3^2)^{100}=9^{100}$, so $3^{200}$ is larger. For the fraction, multiply top and bottom by $\\sqrt5-\\sqrt3$: numerator $(\\sqrt5-\\sqrt3)^2=5-2\\sqrt{15}+3=8-2\\sqrt{15}$, denominator $5-3=2$. Result $4-\\sqrt{15}$. Answer: $3^{200}$ is larger; the fraction equals $4-\\sqrt{15}$.",
        answer: "(3^{200},4-\\sqrt{15})",
      },
    ],
    pitfalls: [
      "$(a+b)^2\\ne a^2+b^2$ and $\\sqrt{a+b}\\ne\\sqrt a+\\sqrt b$.",
      "Splitting $\\log(a+b)$; only products and quotients split.",
      "Evaluating $a^{b^c}$ as $(a^b)^c$.",
      "Dropping the absolute value in $\\sqrt{x^2}=|x|$ when $x$ could be negative.",
      "Forgetting the domain: $\\log_b x$ needs $x>0$, $b>0$, $b\\ne1$.",
    ],
    amcStrategy:
      "Problems 8 through 20. Immediately rewrite every number as a power of a prime and every log in one base; the problem usually collapses to a linear equation. For comparisons, match exponents, not bases. Simplify radicals fully since answer choices are always in simplest form.",
    estimatedMinutes: 10,
  },

  "alg-polynomials": {
    skillId: "alg-polynomials",
    summary:
      "Polynomial problems on the AMC 10 revolve around the remainder theorem, Vieta's formulas for cubics, and symmetric-sum manipulation of systems like $x+y$ and $xy$. The winning habit is to never solve for individual variables when a symmetric identity gets you there directly.",
    keyIdeas: [
      "Remainder theorem: dividing $P(x)$ by $x-a$ leaves remainder $P(a)$. Factor theorem: $x-a$ divides $P(x)$ exactly when $P(a)=0$.",
      "Dividing by a quadratic leaves a linear remainder $ax+b$; plug in both roots of the divisor to get two equations.",
      "Vieta for $x^3+bx^2+cx+d$ with roots $r,s,t$: $r+s+t=-b$, $rs+rt+st=c$, $rst=-d$. Signs alternate.",
      "Symmetric identities: $x^2+y^2=(x+y)^2-2xy$, $x^3+y^3=(x+y)^3-3xy(x+y)$, $a^2+b^2+c^2=(a+b+c)^2-2(ab+bc+ca)$.",
      "The sum of the coefficients of $P(x)$ is $P(1)$; the constant term is $P(0)$; $\\frac{P(1)+P(-1)}{2}$ is the sum of even-degree coefficients.",
      "Systems: add, subtract, or multiply equations to build symmetric expressions; substitute $s=x+y$, $p=xy$.",
      "$x+\\frac1x=k$ gives $x^2+\\frac1{x^2}=k^2-2$ and $x^3+\\frac1{x^3}=k^3-3k$.",
    ],
    formulas: [
      "$P(x)=(x-a)Q(x)+P(a)$",
      "Cubic Vieta: $r+s+t=-\\dfrac{b}{a}, \\quad rs+rt+st=\\dfrac{c}{a}, \\quad rst=-\\dfrac{d}{a}$",
      "$x^3+y^3=(x+y)^3-3xy(x+y)=(x+y)(x^2-xy+y^2)$",
      "$a^2+b^2+c^2=(a+b+c)^2-2(ab+bc+ca)$",
      "$a^3+b^3+c^3-3abc=(a+b+c)(a^2+b^2+c^2-ab-bc-ca)$",
      "$\\text{sum of coefficients}=P(1)$",
    ],
    checkpoints: [
      {
        id: "alg-polynomials-1",
        question: "What is the remainder when $x^3-2x+5$ is divided by $x-2$?",
        answer: "9",
        hint: "Remainder theorem: evaluate the polynomial at $x=2$.",
        explanation: "$P(2)=8-4+5=9$.",
      },
      {
        id: "alg-polynomials-2",
        question: "What is the sum of the coefficients of $(3x-1)^4$?",
        answer: "16",
        hint: "The sum of the coefficients is $P(1)$.",
        explanation: "$P(1)=(3-1)^4=2^4=16$.",
      },
      {
        id: "alg-polynomials-3",
        question: "If $x+y=4$ and $xy=1$, what is $x^2+y^2$?",
        answer: "14",
        hint: "Use $x^2+y^2=(x+y)^2-2xy$.",
        explanation: "$4^2-2\\cdot1=16-2=14$.",
      },
      {
        id: "alg-polynomials-4",
        question: "Let $r,s,t$ be the roots of $x^3-6x^2+11x-6=0$. What is $\\frac1r+\\frac1s+\\frac1t$?",
        answer: "\\frac{11}{6}",
        hint: "Combine over the common denominator $rst$ and use Vieta.",
        explanation: "$\\frac{rs+rt+st}{rst}=\\frac{11}{6}$, since $rs+rt+st=11$ and $rst=6$. (The roots are $1,2,3$.)",
      },
    ],
    workedExamples: [
      {
        problem: "Real numbers $x$ and $y$ satisfy $x+y=5$ and $xy=3$. What is $x^3+y^3$?",
        solution:
          "$x^3+y^3=(x+y)^3-3xy(x+y)=125-3\\cdot3\\cdot5=125-45=80$. Answer: $80$.",
        answer: "80",
      },
      {
        problem:
          "A polynomial $P(x)$ leaves remainder $3$ when divided by $x-1$ and remainder $7$ when divided by $x-3$. What is the remainder when $P(x)$ is divided by $(x-1)(x-3)$?",
        solution:
          "The remainder has degree less than $2$, so write $P(x)=(x-1)(x-3)Q(x)+ax+b$. Plugging in $x=1$: $a+b=3$. Plugging in $x=3$: $3a+b=7$. Subtract: $2a=4$, $a=2$, $b=1$. Answer: $2x+1$.",
        answer: "2x+1",
      },
      {
        problem: "Let $r,s,t$ be the roots of $x^3-2x^2+3x-5=0$. Find $r^2+s^2+t^2$.",
        solution:
          "Vieta: $r+s+t=2$, $rs+rt+st=3$. Then $r^2+s^2+t^2=(r+s+t)^2-2(rs+rt+st)=4-6=-2$. A negative answer is fine: two of the roots are non-real. Answer: $-2$.",
        answer: "-2",
      },
    ],
    pitfalls: [
      "Getting the alternating signs wrong in cubic Vieta ($rst=-d/a$).",
      "Expanding $(x+y)^3$ as $x^3+y^3$ and dropping the $3xy(x+y)$.",
      "Writing a constant remainder when dividing by a quadratic; it can be linear.",
      "Confusing $P(1)$ (sum of coefficients) with $P(0)$ (constant term).",
      "Assuming all roots are real when the problem never said so.",
    ],
    amcStrategy:
      "Problems 12 through 22. If the problem gives $x+y$ and $xy$ (or a cubic with roots), reach for the symmetric identities and Vieta rather than solving. Remainder questions almost always reduce to evaluating $P$ at a couple of points. Watch signs on every step.",
    estimatedMinutes: 11,
  },

  "alg-inequalities": {
    skillId: "alg-inequalities",
    summary:
      "Optimization problems ask for the largest or smallest value something can take. On the AMC 10 the tools are completing the square, AM-GM, the discriminant, and plain bounding with integers. The key is recognizing which tool matches the shape of the expression.",
    keyIdeas: [
      "A quadratic $ax^2+bx+c$ has its extreme value at $x=-\\frac{b}{2a}$. Complete the square to see the minimum directly: a sum of squares plus a constant is at least that constant.",
      "AM-GM: for positive numbers, $\\frac{a+b}{2}\\ge\\sqrt{ab}$, with equality only when $a=b$. Use it when a sum is being minimized with a fixed product, or a product maximized with a fixed sum.",
      "Always check that the equality case is achievable; otherwise the bound is not the answer.",
      "A quadratic is positive for all $x$ exactly when $a>0$ and the discriminant is negative.",
      "For integer optimization, find the real optimum then test the nearest integers on both sides.",
      "Multiplying or dividing an inequality by a negative flips it; multiplying by a variable requires knowing its sign.",
      "Rearrange to show something is $\\ge0$: e.g. $a^2+b^2-2ab=(a-b)^2\\ge0$ proves $a^2+b^2\\ge2ab$.",
    ],
    formulas: [
      "$ax^2+bx+c$ (with $a>0$) has minimum $c-\\dfrac{b^2}{4a}$ at $x=-\\dfrac{b}{2a}$",
      "AM-GM: $\\dfrac{a+b}{2}\\ge\\sqrt{ab}, \\qquad \\dfrac{a+b+c}{3}\\ge\\sqrt[3]{abc}$",
      "$x+\\dfrac1x\\ge2$ for $x>0$",
      "$a^2+b^2\\ge2ab, \\qquad (a+b)^2\\le 2(a^2+b^2)$",
      "$ax^2+bx+c>0$ for all real $x$ iff $a>0$ and $b^2-4ac<0$",
      "$|x-a|<r \\iff a-r<x<a+r$",
    ],
    checkpoints: [
      {
        id: "alg-inequalities-1",
        question: "What is the minimum value of $x^2+6x+2$ over all real $x$?",
        answer: "-7",
        hint: "Complete the square.",
        explanation: "$x^2+6x+2=(x+3)^2-7\\ge-7$, with equality at $x=-3$.",
      },
      {
        id: "alg-inequalities-2",
        question: "For $x>0$, what is the minimum value of $x+\\dfrac{9}{x}$?",
        answer: "6",
        hint: "AM-GM: the product $x\\cdot\\frac9x=9$ is fixed.",
        explanation: "$x+\\frac9x\\ge2\\sqrt{9}=6$, with equality at $x=3$.",
      },
      {
        id: "alg-inequalities-3",
        question: "Positive reals $a$ and $b$ satisfy $a+b=10$. What is the largest possible value of $ab$?",
        answer: "25",
        hint: "With a fixed sum, the product is largest when the numbers are equal.",
        explanation: "By AM-GM, $\\sqrt{ab}\\le\\frac{a+b}{2}=5$, so $ab\\le25$, attained at $a=b=5$.",
      },
      {
        id: "alg-inequalities-4",
        question: "For how many integers $k$ is $x^2+kx+4\\ge0$ for every real number $x$?",
        answer: "9",
        hint: "Nonnegative for all $x$ means the discriminant is at most $0$.",
        explanation: "$k^2-16\\le0$ gives $-4\\le k\\le4$, which is $9$ integers.",
      },
    ],
    workedExamples: [
      {
        problem: "What is the minimum value of $x^2-8x+3y^2+6y+25$ over all real $x$ and $y$?",
        solution:
          "Complete the square in each variable: $x^2-8x=(x-4)^2-16$ and $3y^2+6y=3(y+1)^2-3$. So the expression equals $(x-4)^2+3(y+1)^2-16-3+25=(x-4)^2+3(y+1)^2+6\\ge6$, with equality at $x=4$, $y=-1$. Answer: $6$.",
        answer: "6",
      },
      {
        problem: "Positive reals $x$ and $y$ satisfy $xy=36$. What is the least possible value of $4x+9y$?",
        solution:
          "By AM-GM, $4x+9y\\ge2\\sqrt{(4x)(9y)}=2\\sqrt{36xy}=2\\sqrt{1296}=72$. Equality needs $4x=9y$; with $xy=36$ that gives $x=9$, $y=4$, which is achievable. Answer: $72$.",
        answer: "72",
      },
      {
        problem: "For how many integers $k$ is $x^2+kx+9>0$ for every real number $x$?",
        solution:
          "The leading coefficient is positive, so we need the discriminant negative: $k^2-36<0$, i.e. $-6<k<6$. The integers are $-5,-4,\\dots,5$, which is $11$ values. Answer: $11$.",
        answer: "11",
      },
    ],
    pitfalls: [
      "Using AM-GM without checking the equality case can be reached under the constraints.",
      "Applying AM-GM to numbers that might be negative.",
      "Forgetting to flip the inequality when dividing by a negative.",
      "Reporting the location of the minimum ($x=4$) instead of the minimum value.",
      "Confusing 'positive for all $x$' ($\\Delta<0$) with 'nonnegative for all $x$' ($\\Delta\\le0$).",
    ],
    amcStrategy:
      "Problems 12 through 25. A quadratic-looking expression means complete the square; a sum with a product constraint means AM-GM; 'for all $x$' means discriminant. If stuck, plug in a few values to guess the extreme and then prove it matches an answer choice.",
    estimatedMinutes: 11,
  },

  // --------------------------------------------------------------- GEOMETRY
  "geo-angles": {
    skillId: "geo-angles",
    summary:
      "Angle chasing is the first geometry skill on every AMC 10: triangle angle sums, exterior angles, parallel lines, isosceles triangles, and polygon angles. Combined with the triangle inequality, these facts settle most of problems 1 through 10 in geometry.",
    keyIdeas: [
      "Angles of a triangle sum to $180^\\circ$. An exterior angle equals the sum of the two remote interior angles.",
      "Isosceles triangles have equal base angles; the converse is also true. Equilateral means all angles are $60^\\circ$.",
      "Parallel lines cut by a transversal give equal alternate interior angles and equal corresponding angles; co-interior angles are supplementary.",
      "Interior angles of an $n$-gon sum to $(n-2)\\cdot180^\\circ$; the exterior angles of any convex polygon sum to $360^\\circ$. For regular polygons, each exterior angle is $\\frac{360^\\circ}{n}$, which is often the fastest route.",
      "Angle chasing: label one unknown angle $x$ and express every other angle in terms of $x$ using the facts above until you can write an equation.",
      "The angle bisectors of $B$ and $C$ meet at an angle of $90^\\circ+\\frac{A}{2}$; the altitudes from $B$ and $C$ meet at $180^\\circ-A$.",
      "Triangle inequality: three lengths form a triangle exactly when the sum of the two shorter ones is strictly greater than the longest.",
    ],
    formulas: [
      "$\\angle A+\\angle B+\\angle C=180^\\circ$",
      "Exterior angle $=$ sum of the two remote interior angles",
      "Interior sum of an $n$-gon: $(n-2)\\cdot180^\\circ$; regular interior angle $\\dfrac{(n-2)\\cdot180^\\circ}{n}$; regular exterior angle $\\dfrac{360^\\circ}{n}$",
      "Triangle inequality: $a+b>c$ for every choice of the longest side $c$",
      "Bisectors of $\\angle B$ and $\\angle C$ meet at $\\angle BIC=90^\\circ+\\dfrac{\\angle A}{2}$",
      "Clock hands at $h$ hours and $m$ minutes: $|30h-5.5m|$ degrees",
    ],
    checkpoints: [
      {
        id: "geo-angles-1",
        question: "Two angles of a triangle measure $50^\\circ$ and $65^\\circ$. What is the third angle, in degrees?",
        answer: "65",
        hint: "The three angles sum to $180^\\circ$.",
        explanation: "$180-50-65=65$.",
      },
      {
        id: "geo-angles-2",
        question: "An isosceles triangle has a vertex angle of $40^\\circ$. What is the measure of each base angle, in degrees?",
        answer: "70",
        hint: "The two base angles are equal.",
        explanation: "The base angles sum to $180^\\circ-40^\\circ=140^\\circ$, so each is $70^\\circ$.",
      },
      {
        id: "geo-angles-3",
        question: "Each exterior angle of a regular polygon measures $30^\\circ$. How many sides does the polygon have?",
        answer: "12",
        hint: "The exterior angles of any convex polygon sum to $360^\\circ$.",
        explanation: "$n=\\frac{360}{30}=12$.",
      },
      {
        id: "geo-angles-4",
        question: "Two sides of a triangle have lengths $5$ and $9$. How many integer values are possible for the third side?",
        answer: "9",
        hint: "Triangle inequality: the third side is strictly between the difference and the sum of the other two.",
        explanation: "$4<c<14$, so $c$ can be $5,6,\\dots,13$: $9$ values.",
      },
    ],
    workedExamples: [
      {
        problem:
          "In triangle $ABC$, $\\angle A=40^\\circ$. The bisectors of $\\angle B$ and $\\angle C$ meet at point $I$. What is $\\angle BIC$?",
        solution:
          "$\\angle B+\\angle C=180^\\circ-40^\\circ=140^\\circ$. In triangle $BIC$ the angles at $B$ and $C$ are half of those, summing to $70^\\circ$, so $\\angle BIC=180^\\circ-70^\\circ=110^\\circ$. (This matches the general formula $90^\\circ+\\frac{40^\\circ}{2}$.) Answer: $110^\\circ$.",
        answer: "110",
      },
      {
        problem: "Each interior angle of a regular polygon measures $156^\\circ$. How many sides does it have?",
        solution:
          "Each exterior angle is $180^\\circ-156^\\circ=24^\\circ$, and the exterior angles sum to $360^\\circ$, so $n=\\frac{360}{24}=15$. Answer: $15$.",
        answer: "15",
      },
      {
        problem: "How many non-congruent triangles have integer side lengths and perimeter $12$?",
        solution:
          "Let the sides be $a\\le b\\le c$ with $a+b+c=12$ and $a+b>c$, so $c<6$. Also $c\\ge4$ since $3c\\ge12$. If $c=5$: $a+b=7$ with $b\\le5$: $(2,5),(3,4)$. If $c=4$: $a+b=8$ with $b\\le4$: $(4,4)$. That gives $3$ triangles: $2$-$5$-$5$, $3$-$4$-$5$, $4$-$4$-$4$. Answer: $3$.",
        answer: "3",
      },
    ],
    pitfalls: [
      "Using the interior angle formula when the exterior angle ($360^\\circ/n$) would be one step.",
      "Assuming a figure is drawn to scale, or that an angle that looks right is right.",
      "Forgetting the triangle inequality must be strict; $a+b=c$ is a degenerate segment, not a triangle.",
      "Mislabeling which angles are the base angles of an isosceles triangle.",
      "Adding co-interior angles as if they were equal (they sum to $180^\\circ$).",
    ],
    amcStrategy:
      "Problems 1 through 10. Redraw the figure large, mark every given angle, and chase with a single variable. If a regular polygon appears, go straight to $360^\\circ/n$. For 'how many triangles' questions, fix the longest side and bound it with the triangle inequality.",
    estimatedMinutes: 9,
  },

  "geo-similar": {
    skillId: "geo-similar",
    summary:
      "The Pythagorean theorem, similar triangles, and the special $45$-$45$-$90$ and $30$-$60$-$90$ triangles are the workhorses of AMC 10 geometry. Nearly every length problem in the first fifteen questions reduces to one of them.",
    keyIdeas: [
      "Memorize the Pythagorean triples $3$-$4$-$5$, $5$-$12$-$13$, $8$-$15$-$17$, $7$-$24$-$25$, $9$-$40$-$41$, $20$-$21$-$29$ and their multiples; spotting one saves a square root.",
      "$45$-$45$-$90$ sides are $1:1:\\sqrt2$. $30$-$60$-$90$ sides are $1:\\sqrt3:2$, with $\\sqrt3$ opposite the $60^\\circ$ angle and the short leg half the hypotenuse.",
      "Two triangles with two equal angles are similar (AA). Corresponding sides are proportional; set up the ratio with matching vertices in the same order.",
      "A line parallel to one side of a triangle cuts off a similar triangle. Ratio of areas of similar figures is the square of the ratio of lengths.",
      "The altitude to the hypotenuse creates three similar right triangles: $h^2=pq$ and each leg squared equals the hypotenuse times the adjacent segment.",
      "Equilateral triangle with side $s$: height $\\frac{\\sqrt3}{2}s$, area $\\frac{\\sqrt3}{4}s^2$.",
      "Drop a perpendicular to create right triangles whenever a figure has a known angle or a length you cannot reach directly.",
    ],
    formulas: [
      "$a^2+b^2=c^2$",
      "$45$-$45$-$90$: $x, x, x\\sqrt2$; $\\quad 30$-$60$-$90$: $x, x\\sqrt3, 2x$",
      "Altitude to hypotenuse: $h^2=pq, \\quad a^2=cp, \\quad b^2=cq$; also $h=\\dfrac{ab}{c}$",
      "Similar triangles with ratio $k$: $\\dfrac{[ABC]}{[DEF]}=k^2$",
      "Equilateral: height $\\dfrac{\\sqrt3}{2}s$, area $\\dfrac{\\sqrt3}{4}s^2$",
      "Diagonal of an $a\\times b$ rectangle: $\\sqrt{a^2+b^2}$",
    ],
    checkpoints: [
      {
        id: "geo-similar-1",
        question: "A right triangle has legs $9$ and $12$. What is the length of its hypotenuse?",
        answer: "15",
        hint: "It is a scaled $3$-$4$-$5$ triangle.",
        explanation: "$\\sqrt{81+144}=\\sqrt{225}=15$, which is $3$ times $(3,4,5)$.",
      },
      {
        id: "geo-similar-2",
        question: "A $45$-$45$-$90$ triangle has hypotenuse $10$. What is the length of each leg?",
        answer: "5\\sqrt{2}",
        hint: "The sides are in the ratio $1:1:\\sqrt2$.",
        explanation: "Each leg is $\\frac{10}{\\sqrt2}=5\\sqrt2$.",
      },
      {
        id: "geo-similar-3",
        question: "In a $30$-$60$-$90$ triangle the shorter leg is $4$. What is the longer leg?",
        answer: "4\\sqrt{3}",
        hint: "The longer leg is $\\sqrt3$ times the shorter leg.",
        explanation: "The sides are $4$, $4\\sqrt3$, $8$, so the longer leg is $4\\sqrt3$.",
      },
      {
        id: "geo-similar-4",
        question: "Two similar triangles have corresponding sides in the ratio $2:5$. The smaller triangle has area $8$. What is the area of the larger one?",
        answer: "50",
        hint: "Areas scale by the square of the length ratio.",
        explanation: "$8\\cdot\\left(\\frac52\\right)^2=8\\cdot\\frac{25}{4}=50$.",
      },
    ],
    workedExamples: [
      {
        problem: "A right triangle has legs $6$ and $8$. What is the length of the altitude to the hypotenuse?",
        solution:
          "The hypotenuse is $10$ (a $3$-$4$-$5$ triple doubled). Area is $\\frac12\\cdot6\\cdot8=24$, and also $\\frac12\\cdot10\\cdot h$, so $h=\\frac{48}{10}=\\frac{24}{5}$. Answer: $\\frac{24}{5}$.",
        answer: "\\frac{24}{5}",
      },
      {
        problem:
          "A $25$-foot ladder leans against a wall with its base $7$ feet from the wall. The base is then pulled $8$ feet farther from the wall. How many feet does the top of the ladder slide down?",
        solution:
          "Initially the top is at height $\\sqrt{25^2-7^2}=\\sqrt{625-49}=\\sqrt{576}=24$. After moving, the base is $15$ feet out, so the height is $\\sqrt{625-225}=\\sqrt{400}=20$. The top slides down $24-20=4$ feet. Answer: $4$.",
        answer: "4",
      },
      {
        problem:
          "In triangle $ABC$, points $D$ on $AB$ and $E$ on $AC$ satisfy $DE\\parallel BC$, with $AD=4$ and $DB=6$. If the area of triangle $ADE$ is $8$, what is the area of trapezoid $DBCE$?",
        solution:
          "Triangles $ADE$ and $ABC$ are similar with ratio $\\frac{AD}{AB}=\\frac{4}{10}=\\frac25$, so the area ratio is $\\frac{4}{25}$. Thus $[ABC]=8\\cdot\\frac{25}{4}=50$, and the trapezoid has area $50-8=42$. Answer: $42$.",
        answer: "42",
      },
    ],
    pitfalls: [
      "Assuming a triangle is right-angled because it looks that way.",
      "Scaling areas by $k$ instead of $k^2$.",
      "Putting $\\sqrt3$ on the wrong leg of a $30$-$60$-$90$ triangle.",
      "Matching sides of similar triangles in the wrong order (e.g. $AB/DE$ but $BC/DF$).",
      "Leaving $\\sqrt{48}$ instead of $4\\sqrt3$; the answer choices will be simplified.",
    ],
    amcStrategy:
      "Problems 5 through 15. Look for a triple or a special angle first; if neither, look for parallel lines or shared angles that give similarity. Drop altitudes to create right triangles. Write the ratio with vertices in corresponding order to avoid flipping a fraction.",
    estimatedMinutes: 11,
  },

  "geo-area": {
    skillId: "geo-area",
    summary:
      "Area problems on the AMC 10 combine formulas (Heron, shoelace, trapezoid, rhombus) with ratio arguments about triangles sharing a base or a height. The best solvers rarely compute more than one area from scratch; they compare.",
    keyIdeas: [
      "Triangles with the same height have areas proportional to their bases; triangles with the same base have areas proportional to their heights. A cevian dividing $BC$ in ratio $m:n$ divides the area in ratio $m:n$.",
      "A median cuts a triangle into two equal areas; the three medians cut it into six equal areas.",
      "Heron's formula gives the area from three sides; then area $=\\frac12 bh$ recovers any altitude.",
      "Shoelace: list the vertices in order around the polygon, cross-multiply, subtract, halve.",
      "Pick's theorem for lattice polygons: $A=I+\\frac{B}{2}-1$, where $B$ counts lattice points on the boundary (a segment from $(0,0)$ to $(a,b)$ has $\\gcd(a,b)+1$ of them).",
      "Shaded regions: subtract. Enclose the region in a rectangle and remove the right triangles around it.",
      "Rhombus and kite areas are half the product of the diagonals; a trapezoid is the average base times the height.",
    ],
    formulas: [
      "Heron: $A=\\sqrt{s(s-a)(s-b)(s-c)}$ with $s=\\dfrac{a+b+c}{2}$",
      "Shoelace: $A=\\dfrac12\\left|\\sum_{i}(x_iy_{i+1}-x_{i+1}y_i)\\right|$",
      "Pick: $A=I+\\dfrac{B}{2}-1$",
      "Trapezoid $\\dfrac{(b_1+b_2)h}{2}$; rhombus or kite $\\dfrac{d_1d_2}{2}$; parallelogram $bh$",
      "$A=\\dfrac12 ab\\sin C$; regular hexagon $\\dfrac{3\\sqrt3}{2}s^2$",
      "$\\dfrac{[ABD]}{[ADC]}=\\dfrac{BD}{DC}$ for $D$ on $BC$",
    ],
    checkpoints: [
      {
        id: "geo-area-1",
        question: "A trapezoid has bases $6$ and $10$ and height $4$. What is its area?",
        answer: "32",
        hint: "Average the bases, then multiply by the height.",
        explanation: "$\\frac{(6+10)\\cdot4}{2}=32$.",
      },
      {
        id: "geo-area-2",
        question: "A rhombus has diagonals of lengths $6$ and $8$. What is its area?",
        answer: "24",
        hint: "Half the product of the diagonals.",
        explanation: "$\\frac{6\\cdot8}{2}=24$.",
      },
      {
        id: "geo-area-3",
        question: "What is the area of the triangle with vertices $(0,0)$, $(4,0)$, and $(1,5)$?",
        answer: "10",
        hint: "One side lies on the $x$-axis, so use $\\frac12bh$.",
        explanation: "Base $4$ along the $x$-axis and height $5$: $\\frac12\\cdot4\\cdot5=10$.",
      },
      {
        id: "geo-area-4",
        question: "Triangle $ABC$ has area $36$, and point $D$ lies on $BC$ with $BD:DC=1:3$. What is the area of triangle $ABD$?",
        answer: "9",
        hint: "Both triangles share the height from $A$, so areas are proportional to the bases.",
        explanation: "$[ABD]=\\frac{1}{1+3}\\cdot36=9$.",
      },
    ],
    workedExamples: [
      {
        problem: "A triangle has sides $13$, $14$, and $15$. What is the length of the altitude to the side of length $14$?",
        solution:
          "Semiperimeter $s=21$. Heron: $A=\\sqrt{21\\cdot8\\cdot7\\cdot6}=\\sqrt{7056}=84$. Then $\\frac12\\cdot14\\cdot h=84$ gives $h=12$. (Indeed the altitude splits the triangle into $5$-$12$-$13$ and $9$-$12$-$15$ right triangles.) Answer: $12$.",
        answer: "12",
      },
      {
        problem: "Find the area of the pentagon with vertices $(0,0),(4,0),(6,3),(2,5),(0,3)$ listed in order.",
        solution:
          "Shoelace, computing $x_iy_{i+1}-x_{i+1}y_i$ for each edge: $(0\\cdot0-4\\cdot0)=0$; $(4\\cdot3-6\\cdot0)=12$; $(6\\cdot5-2\\cdot3)=24$; $(2\\cdot3-0\\cdot5)=6$; $(0\\cdot0-0\\cdot3)=0$. Sum $=42$, so $A=\\frac{42}{2}=21$. Cross-check with Pick: boundary points $B=4+1+2+2+3=12$, so $I=21-6+1=16$, an integer, as it must be. Answer: $21$.",
        answer: "21",
      },
      {
        problem:
          "In triangle $ABC$ with area $60$, point $D$ lies on $BC$ with $BD:DC=2:3$, and $E$ is the midpoint of $AD$. What is the area of triangle $ABE$?",
        solution:
          "Since $D$ splits $BC$ in ratio $2:3$, $[ABD]=\\frac25\\cdot60=24$. $E$ is the midpoint of $AD$, so $BE$ is a median of triangle $ABD$ and $[ABE]=\\frac12\\cdot24=12$. Answer: $12$.",
        answer: "12",
      },
    ],
    pitfalls: [
      "Using the full perimeter instead of the semiperimeter in Heron.",
      "Listing shoelace vertices out of order (crossing the polygon) and getting a wrong area.",
      "Forgetting the $\\frac12$ in the triangle area formula.",
      "Assuming a quadrilateral is a parallelogram or trapezoid without being told.",
      "Confusing perimeter and area when the problem gives one and asks for the other.",
    ],
    amcStrategy:
      "Problems 5 through 18. Before computing anything, ask whether the answer is a ratio of a known area; those problems take thirty seconds with base and height comparisons. Use Heron for three given sides, shoelace for coordinates, and Pick's theorem to verify lattice answers. Draw the picture with the given lengths marked.",
    estimatedMinutes: 12,
  },

  "geo-circles": {
    skillId: "geo-circles",
    summary:
      "Circle problems test the inscribed angle theorem, tangent properties, and power of a point, plus arc lengths and sector areas. These appear from problem 8 to 20 and reward knowing a handful of theorems cold.",
    keyIdeas: [
      "Inscribed angle theorem: an inscribed angle is half the arc it cuts off (half the central angle). Angles inscribed in a semicircle are right angles.",
      "A tangent is perpendicular to the radius at the point of tangency. Two tangent segments from the same external point are equal.",
      "Power of a point: for chords through $P$ inside, $PA\\cdot PB=PC\\cdot PD$; for secants from $P$ outside, $PA\\cdot PB=PC\\cdot PD$ using the full external-to-far lengths; for a tangent, $PT^2=PA\\cdot PB$.",
      "A perpendicular from the center bisects a chord: half-chord, distance to center, and radius form a right triangle.",
      "Arc length and sector area are fractions of the circumference and area: multiply by $\\frac{\\theta}{360^\\circ}$.",
      "Cyclic quadrilaterals have supplementary opposite angles. The angle between a tangent and a chord equals half the arc inside it.",
      "Incircle and circumcircle: $A=rs$ for any triangle; $R=\\frac{abc}{4A}$; a right triangle has $r=\\frac{a+b-c}{2}$ and $R=\\frac{c}{2}$.",
    ],
    formulas: [
      "Inscribed angle $=\\dfrac12\\,\\text{(intercepted arc)}$",
      "Power of a point: $PA\\cdot PB=PC\\cdot PD, \\qquad PT^2=PA\\cdot PB$",
      "Chord of length $c$ at distance $d$ from the center: $d^2+\\left(\\dfrac{c}{2}\\right)^2=r^2$",
      "Arc length $\\dfrac{\\theta}{360^\\circ}\\cdot2\\pi r$; sector area $\\dfrac{\\theta}{360^\\circ}\\cdot\\pi r^2$",
      "$A=rs, \\qquad R=\\dfrac{abc}{4A}$",
      "Right triangle: $r=\\dfrac{a+b-c}{2}, \\quad R=\\dfrac{c}{2}$",
    ],
    checkpoints: [
      {
        id: "geo-circles-1",
        question: "An inscribed angle intercepts an arc of $80^\\circ$. What is the measure of the angle, in degrees?",
        answer: "40",
        hint: "An inscribed angle is half its intercepted arc.",
        explanation: "$\\frac{80}{2}=40$.",
      },
      {
        id: "geo-circles-2",
        question: "A chord of length $16$ lies at distance $6$ from the center of a circle. What is the radius?",
        answer: "10",
        hint: "The perpendicular from the center bisects the chord; draw the right triangle.",
        explanation: "$r^2=6^2+8^2=100$, so $r=10$.",
      },
      {
        id: "geo-circles-3",
        question: "A circle has radius $6$. What is the area of a sector with central angle $90^\\circ$?",
        answer: "9\\pi",
        hint: "A sector is the fraction $\\frac{\\theta}{360^\\circ}$ of the whole area.",
        explanation: "$\\frac{90}{360}\\cdot\\pi\\cdot36=9\\pi$.",
      },
      {
        id: "geo-circles-4",
        question: "From an external point $P$, a tangent segment $PT$ has length $8$, and a secant from $P$ meets the circle at $A$ and then at $B$ with $PA=4$. What is $PB$?",
        answer: "16",
        hint: "Power of a point: $PT^2=PA\\cdot PB$.",
        explanation: "$64=4\\cdot PB$, so $PB=16$.",
      },
    ],
    workedExamples: [
      {
        problem: "Chords $AB$ and $CD$ of a circle intersect at $P$ inside the circle. If $AP=3$, $PB=8$, and $CP=4$, what is $PD$?",
        solution:
          "By power of a point, $AP\\cdot PB=CP\\cdot PD$, so $3\\cdot8=4\\cdot PD$ and $PD=6$. Answer: $6$.",
        answer: "6",
      },
      {
        problem:
          "From a point $P$ outside a circle, the tangent segment $PT$ has length $6$. A secant from $P$ meets the circle first at $A$ and then at $B$, with $PA=4$. What is $AB$?",
        solution:
          "$PT^2=PA\\cdot PB$ gives $36=4\\cdot PB$, so $PB=9$. Then $AB=PB-PA=9-4=5$. Answer: $5$.",
        answer: "5",
      },
      {
        problem: "A circle is inscribed in a right triangle with legs $5$ and $12$. What is the area of the region inside the triangle but outside the circle?",
        solution:
          "The hypotenuse is $13$. The inradius is $r=\\frac{5+12-13}{2}=2$ (equivalently $A=rs$: $30=r\\cdot15$). The triangle has area $30$ and the circle has area $4\\pi$, so the region has area $30-4\\pi$. Answer: $30-4\\pi$.",
        answer: "30-4\\pi",
      },
    ],
    pitfalls: [
      "Using the central angle where the inscribed angle is meant (or vice versa); they differ by a factor of $2$.",
      "In the secant version of power of a point, using the inside chord $AB$ instead of the full length $PB$.",
      "Forgetting that a tangent meets the radius at $90^\\circ$, which is the right triangle you need.",
      "Mixing up arc length and sector area, or leaving the angle in the wrong unit.",
      "Assuming a point that looks like the center is the center.",
    ],
    amcStrategy:
      "Problems 8 through 20. Mark the center and draw radii to every point of tangency and every chord endpoint; the right triangles and isosceles triangles that appear are usually the whole solution. If lengths along intersecting lines are given, it is power of a point. If angles are given, it is inscribed angles.",
    estimatedMinutes: 12,
  },

  "geo-coordinate": {
    skillId: "geo-coordinate",
    summary:
      "Coordinate geometry turns shapes into algebra: distance, midpoint, slope, line equations, and the shoelace formula. It is both a topic on its own and a fallback method for synthetic problems that resist a clever idea.",
    keyIdeas: [
      "Distance and midpoint come straight from the Pythagorean theorem and averaging; slope is rise over run.",
      "Perpendicular lines have slopes whose product is $-1$; parallel lines have equal slopes.",
      "Write lines in point-slope form $y-y_1=m(x-x_1)$ and solve simultaneous equations to find intersections.",
      "Reflections: over the $x$-axis negate $y$; over the $y$-axis negate $x$; over $y=x$ swap coordinates; over $y=-x$ swap and negate both.",
      "Shoelace computes the area of any polygon from ordered vertices; the area of a triangle with a horizontal or vertical side is faster by $\\frac12bh$.",
      "Lattice points on a segment from $(0,0)$ to $(a,b)$: $\\gcd(a,b)+1$, including both endpoints.",
      "Circle with center $(h,k)$ and radius $r$: $(x-h)^2+(y-k)^2=r^2$. Complete the square to read off the center from an expanded form.",
    ],
    formulas: [
      "$d=\\sqrt{(x_2-x_1)^2+(y_2-y_1)^2}, \\qquad M=\\left(\\dfrac{x_1+x_2}{2},\\dfrac{y_1+y_2}{2}\\right)$",
      "$m=\\dfrac{y_2-y_1}{x_2-x_1}, \\qquad m_1m_2=-1$ for perpendicular lines",
      "Distance from $(x_0,y_0)$ to $Ax+By+C=0$: $\\dfrac{|Ax_0+By_0+C|}{\\sqrt{A^2+B^2}}$",
      "$(x-h)^2+(y-k)^2=r^2$",
      "Lattice points on a segment: $\\gcd(|\\Delta x|,|\\Delta y|)+1$",
      "Triangle area with vertices at the origin, $(a,b)$, $(c,d)$: $\\dfrac12|ad-bc|$",
    ],
    checkpoints: [
      {
        id: "geo-coordinate-1",
        question: "What is the distance between $(1,2)$ and $(7,10)$?",
        answer: "10",
        hint: "Distance formula; the legs are $6$ and $8$.",
        explanation: "$\\sqrt{6^2+8^2}=\\sqrt{100}=10$.",
      },
      {
        id: "geo-coordinate-2",
        question: "What is the midpoint of the segment joining $(-3,5)$ and $(7,1)$?",
        answer: "(2,3)",
        hint: "Average the $x$-coordinates and average the $y$-coordinates.",
        explanation: "$\\left(\\frac{-3+7}{2},\\frac{5+1}{2}\\right)=(2,3)$.",
      },
      {
        id: "geo-coordinate-3",
        question: "What is the slope of a line perpendicular to the line through $(0,0)$ and $(4,6)$?",
        answer: "-\\frac{2}{3}",
        hint: "Perpendicular slopes multiply to $-1$.",
        explanation: "The given line has slope $\\frac64=\\frac32$, so the perpendicular slope is $-\\frac23$.",
      },
      {
        id: "geo-coordinate-4",
        question: "How many lattice points lie on the segment from $(0,0)$ to $(12,18)$, including both endpoints?",
        answer: "7",
        hint: "The count is $\\gcd(12,18)+1$.",
        explanation: "$\\gcd(12,18)=6$, so there are $6+1=7$ lattice points (steps of $(2,3)$).",
      },
    ],
    workedExamples: [
      {
        problem: "What is the $x$-intercept of the perpendicular bisector of the segment joining $(1,2)$ and $(7,6)$?",
        solution:
          "Midpoint $(4,4)$. The segment has slope $\\frac{6-2}{7-1}=\\frac23$, so the bisector has slope $-\\frac32$: $y-4=-\\frac32(x-4)$. Set $y=0$: $-4=-\\frac32(x-4)$, so $x-4=\\frac83$ and $x=\\frac{20}{3}$. Answer: $\\frac{20}{3}$.",
        answer: "\\frac{20}{3}",
      },
      {
        problem: "Find the area of the triangle with vertices $(1,1)$, $(7,3)$, and $(4,8)$.",
        solution:
          "Shoelace: $(1\\cdot3-7\\cdot1)+(7\\cdot8-4\\cdot3)+(4\\cdot1-1\\cdot8)=-4+44-4=36$. Area $=\\frac{36}{2}=18$. Answer: $18$.",
        answer: "18",
      },
      {
        problem: "How many lattice points (points with integer coordinates) lie on the segment from $(2,3)$ to $(26,19)$, including the endpoints?",
        solution:
          "The displacement is $(24,16)$ and $\\gcd(24,16)=8$, so the segment is divided into $8$ equal steps of $(3,2)$, hitting $8+1=9$ lattice points. Answer: $9$.",
        answer: "9",
      },
    ],
    pitfalls: [
      "Taking the negative reciprocal wrong: the perpendicular to slope $\\frac23$ is $-\\frac32$, not $-\\frac23$.",
      "Forgetting the square root in the distance formula (or squaring the midpoint).",
      "Listing shoelace vertices in the wrong order.",
      "Reflecting over $y=x$ by negating instead of swapping.",
      "Counting lattice points with $\\gcd$ but forgetting the $+1$ for the endpoint.",
    ],
    amcStrategy:
      "Problems 8 through 20. Place the figure so that a vertex is at the origin and a side lies on an axis; the algebra shrinks dramatically. Shoelace is your area tool of last resort and it always works. When a synthetic problem stalls, coordinates are a reliable, if slower, backup.",
    estimatedMinutes: 10,
  },

  "geo-polygons": {
    skillId: "geo-polygons",
    summary:
      "Regular polygons, special quadrilaterals, and grid or tiling counts appear in the middle of the AMC 10. The recurring moves are to decompose a regular polygon into triangles, use diagonal properties of quadrilaterals, and count rectangles in a grid by choosing lines.",
    keyIdeas: [
      "A regular hexagon is six equilateral triangles; its long diagonal is $2s$ and its short diagonal is $s\\sqrt3$.",
      "A regular octagon is a square with four $45$-$45$-$90$ corners cut off; set the cut leg to $x$ and solve $\\text{side}-2x=x\\sqrt2$.",
      "Any regular polygon: area $=\\frac12\\cdot\\text{perimeter}\\cdot\\text{apothem}$; the central angle is $\\frac{360^\\circ}{n}$.",
      "Diagonals: an $n$-gon has $\\frac{n(n-3)}{2}$ of them. A rhombus has perpendicular diagonals that bisect each other; a rectangle has equal diagonals; a kite has one diagonal that is the perpendicular bisector of the other.",
      "Cyclic quadrilaterals have supplementary opposite angles; Ptolemy: $AC\\cdot BD=AB\\cdot CD+AD\\cdot BC$.",
      "Rectangles in an $m\\times n$ grid: choose $2$ of the $m+1$ vertical lines and $2$ of the $n+1$ horizontal lines. Squares in an $n\\times n$ grid: $1^2+2^2+\\cdots+n^2$.",
      "Tilings and dissections: track areas and angles at each vertex; angles around a point sum to $360^\\circ$.",
    ],
    formulas: [
      "Regular interior angle $\\dfrac{(n-2)180^\\circ}{n}$; diagonals $\\dfrac{n(n-3)}{2}$",
      "Regular hexagon area $\\dfrac{3\\sqrt3}{2}s^2$; regular octagon area $2(1+\\sqrt2)s^2$",
      "Regular polygon: $A=\\dfrac12 aP$ ($a$ = apothem, $P$ = perimeter)",
      "Ptolemy (cyclic $ABCD$): $AC\\cdot BD=AB\\cdot CD+AD\\cdot BC$",
      "Rectangles in an $m\\times n$ grid: $\\dbinom{m+1}{2}\\dbinom{n+1}{2}$",
      "Square diagonal $s\\sqrt2$; rhombus area $\\dfrac{d_1d_2}{2}$",
    ],
    checkpoints: [
      {
        id: "geo-polygons-1",
        question: "How many diagonals does a regular decagon have?",
        answer: "35",
        hint: "Use $\\frac{n(n-3)}{2}$.",
        explanation: "$\\frac{10\\cdot7}{2}=35$.",
      },
      {
        id: "geo-polygons-2",
        question: "A regular hexagon has side length $2$. What is its area?",
        answer: "6\\sqrt{3}",
        hint: "Split it into six equilateral triangles of side $2$.",
        explanation: "$6\\cdot\\frac{\\sqrt3}{4}\\cdot4=6\\sqrt3$.",
      },
      {
        id: "geo-polygons-3",
        question: "A rhombus has diagonals of lengths $10$ and $24$. What is its side length?",
        answer: "13",
        hint: "The diagonals are perpendicular bisectors of each other.",
        explanation: "Half-diagonals $5$ and $12$ are the legs of a right triangle whose hypotenuse is the side: $\\sqrt{25+144}=13$.",
      },
      {
        id: "geo-polygons-4",
        question: "How many rectangles of any size are formed by the lines of a $2\\times4$ grid of unit squares?",
        answer: "30",
        hint: "Choose two of the vertical lines and two of the horizontal lines.",
        explanation: "$\\binom32\\binom52=3\\cdot10=30$.",
      },
    ],
    workedExamples: [
      {
        problem: "A regular hexagon has side length $4$. What is the area of the triangle formed by joining every other vertex?",
        solution:
          "The hexagon's area is $\\frac{3\\sqrt3}{2}\\cdot16=24\\sqrt3$. Joining alternate vertices cuts off three congruent triangles, each with area $\\frac16$ of the hexagon, so the inner triangle is half the hexagon: $12\\sqrt3$. Check directly: the triangle is equilateral with side $4\\sqrt3$ (the short diagonal), area $\\frac{\\sqrt3}{4}\\cdot48=12\\sqrt3$. Answer: $12\\sqrt3$.",
        answer: "12\\sqrt{3}",
      },
      {
        problem: "How many rectangles (of any size) are formed by the lines of a $4\\times6$ grid of unit squares?",
        solution:
          "A rectangle is determined by two of the $5$ vertical lines and two of the $7$ horizontal lines: $\\binom52\\binom72=10\\cdot21=210$. Answer: $210$.",
        answer: "210",
      },
      {
        problem: "A regular octagon is formed by cutting congruent isosceles right triangles from the corners of a square with side $10$. What is the side length of the octagon?",
        solution:
          "Let each cut triangle have legs $x$. The octagon's side is both the hypotenuse $x\\sqrt2$ and the remaining middle of the square's side, $10-2x$. So $10-2x=x\\sqrt2$, giving $x=\\frac{10}{2+\\sqrt2}=\\frac{10(2-\\sqrt2)}{2}=10-5\\sqrt2$. The side is $10-2x=10-20+10\\sqrt2=10\\sqrt2-10$. Answer: $10\\sqrt2-10$.",
        answer: "10\\sqrt{2}-10",
      },
    ],
    pitfalls: [
      "Counting each diagonal twice (once from each endpoint) and forgetting to halve.",
      "Confusing the hexagon's long diagonal ($2s$) with its short diagonal ($s\\sqrt3$).",
      "Counting only unit squares when the question asks for all rectangles.",
      "Using cyclic-quadrilateral facts on a quadrilateral that is not inscribed.",
      "Applying the regular interior-angle formula to an irregular polygon.",
    ],
    amcStrategy:
      "Problems 10 through 20. Decompose: hexagons into equilateral triangles, octagons into a square minus corners, any regular polygon into congruent isosceles triangles from the center. For grid counts, count by choosing lines, not by drawing. Verify a formula answer by checking $n=1$ or $n=2$.",
    estimatedMinutes: 11,
  },

  "geo-solid": {
    skillId: "geo-solid",
    summary:
      "Three-dimensional problems on the AMC 10 are mostly volume, surface area, space diagonals, and cross-sections, dressed up in cubes, spheres, cones, and boxes. Almost every one reduces to a two-dimensional right triangle once you choose the right slice.",
    keyIdeas: [
      "Volumes: prism and cylinder $Bh$; pyramid and cone $\\frac13Bh$; sphere $\\frac43\\pi r^3$. Surface area of a sphere is $4\\pi r^2$; a cone's lateral area is $\\pi r\\ell$ where $\\ell$ is the slant height.",
      "The space diagonal of an $a\\times b\\times c$ box is $\\sqrt{a^2+b^2+c^2}$; a cube of side $s$ has diagonal $s\\sqrt3$. A sphere inscribed in a cube has diameter $s$; a cube inscribed in a sphere has diagonal $2R$.",
      "Similar solids scale lengths by $k$, areas by $k^2$, and volumes by $k^3$. A cone filled to half its height holds $\\frac18$ of its volume.",
      "Cross-sections of a cube can be triangles, rectangles, pentagons, or regular hexagons (the hexagon passes through six edge midpoints).",
      "Shortest path on a surface: unfold the surface into a net and use a straight line; compare the different unfoldings.",
      "Euler: $V-E+F=2$ for any convex polyhedron; count edges as half the sum of face edge-counts.",
      "Water problems: volume is conserved. Equate the volume before and after pouring or submerging.",
    ],
    formulas: [
      "$V_{\\text{prism}}=Bh, \\quad V_{\\text{pyramid}}=\\dfrac13Bh, \\quad V_{\\text{sphere}}=\\dfrac43\\pi r^3, \\quad S_{\\text{sphere}}=4\\pi r^2$",
      "Cone: $\\ell=\\sqrt{r^2+h^2}$, lateral area $\\pi r\\ell$, total $\\pi r\\ell+\\pi r^2$",
      "Space diagonal $\\sqrt{a^2+b^2+c^2}$; cube diagonal $s\\sqrt3$",
      "Regular tetrahedron of edge $s$: $V=\\dfrac{\\sqrt2}{12}s^3$",
      "$V-E+F=2$",
      "Scale factor $k$: areas $\\times k^2$, volumes $\\times k^3$",
    ],
    checkpoints: [
      {
        id: "geo-solid-1",
        question: "What is the length of the space diagonal of a $2\\times3\\times6$ box?",
        answer: "7",
        hint: "Use $\\sqrt{a^2+b^2+c^2}$.",
        explanation: "$\\sqrt{4+9+36}=\\sqrt{49}=7$.",
      },
      {
        id: "geo-solid-2",
        question: "What is the volume of a sphere of radius $3$?",
        answer: "36\\pi",
        hint: "$V=\\frac43\\pi r^3$.",
        explanation: "$\\frac43\\pi\\cdot27=36\\pi$.",
      },
      {
        id: "geo-solid-3",
        question: "A cone has base radius $6$ and height $8$. What is its lateral (curved) surface area?",
        answer: "60\\pi",
        hint: "Find the slant height first.",
        explanation: "$\\ell=\\sqrt{36+64}=10$, so the lateral area is $\\pi r\\ell=\\pi\\cdot6\\cdot10=60\\pi$.",
      },
      {
        id: "geo-solid-4",
        question: "A cone-shaped cup (apex at the bottom) is filled with water to half its height. What fraction of the cup's volume is water?",
        answer: "\\frac{1}{8}",
        hint: "The water forms a similar cone with scale factor $\\frac12$.",
        explanation: "Volumes scale by $k^3=\\left(\\frac12\\right)^3=\\frac18$.",
      },
    ],
    workedExamples: [
      {
        problem: "A sphere is inscribed in a cube of side $6$. What fraction of the cube's volume is inside the sphere?",
        solution:
          "The sphere has radius $3$, so its volume is $\\frac43\\pi\\cdot27=36\\pi$. The cube's volume is $216$. The fraction is $\\frac{36\\pi}{216}=\\frac{\\pi}{6}$. Answer: $\\frac{\\pi}{6}$.",
        answer: "\\frac{\\pi}{6}",
      },
      {
        problem: "A right circular cone has base radius $3$ and height $4$. What is its total surface area?",
        solution:
          "Slant height $\\ell=\\sqrt{9+16}=5$. Lateral area $\\pi r\\ell=15\\pi$, base area $\\pi r^2=9\\pi$, total $24\\pi$. Answer: $24\\pi$.",
        answer: "24\\pi",
      },
      {
        problem: "An ant walks along the surface of a $3\\times4\\times12$ box from one corner to the opposite corner. What is the shortest possible length of its path?",
        solution:
          "Unfold two adjacent faces into a rectangle; the path is the diagonal. The three ways to pair the dimensions give $\\sqrt{(3+4)^2+12^2}=\\sqrt{193}$, $\\sqrt{(3+12)^2+4^2}=\\sqrt{241}$, and $\\sqrt{(4+12)^2+3^2}=\\sqrt{265}$. The shortest is $\\sqrt{193}$ (fold along the two smallest dimensions). Answer: $\\sqrt{193}$.",
        answer: "\\sqrt{193}",
      },
    ],
    pitfalls: [
      "Dropping the $\\frac13$ for cones and pyramids.",
      "Using the diameter as the radius, especially for an inscribed sphere.",
      "Scaling a volume by $k$ or $k^2$ instead of $k^3$.",
      "Computing lateral area with the height instead of the slant height.",
      "Taking the straight-line space diagonal for a path that must stay on the surface.",
    ],
    amcStrategy:
      "Problems 10 through 22. Draw the relevant two-dimensional slice (a triangle through the axis of a cone, a rectangle through a box's diagonal) and solve it as plane geometry. Keep $\\pi$ symbolic. For 'fill' or 'pour' problems, write volume equality first.",
    estimatedMinutes: 11,
  },

  "geo-trig": {
    skillId: "geo-trig",
    summary:
      "Late AMC 10 geometry sometimes needs trigonometry: the law of cosines for a third side, the law of sines with the circumradius, and the area formula $\\frac12ab\\sin C$. You need exact values at $30^\\circ$, $45^\\circ$, $60^\\circ$ and their supplements, not a calculator.",
    keyIdeas: [
      "Right triangle definitions: $\\sin=\\frac{\\text{opp}}{\\text{hyp}}$, $\\cos=\\frac{\\text{adj}}{\\text{hyp}}$, $\\tan=\\frac{\\text{opp}}{\\text{adj}}$. Know exact values at $30^\\circ, 45^\\circ, 60^\\circ$.",
      "Supplements: $\\sin(180^\\circ-x)=\\sin x$ but $\\cos(180^\\circ-x)=-\\cos x$. So $\\cos120^\\circ=-\\frac12$ and $\\cos135^\\circ=-\\frac{\\sqrt2}{2}$.",
      "Law of cosines finds the third side from two sides and the included angle, or an angle from three sides. It is the Pythagorean theorem with a correction term.",
      "Law of sines relates each side to the sine of its opposite angle, and the common ratio is $2R$, the diameter of the circumcircle.",
      "Area $=\\frac12ab\\sin C$ for any two sides and their included angle; cross-check with Heron when all three sides are known.",
      "Given $\\cos C$, get $\\sin C$ from $\\sin^2C+\\cos^2C=1$ (positive in a triangle).",
      "Two angles given plus one side: find the third angle, then law of sines. Two sides plus the included angle: law of cosines.",
    ],
    formulas: [
      "$c^2=a^2+b^2-2ab\\cos C$",
      "$\\dfrac{a}{\\sin A}=\\dfrac{b}{\\sin B}=\\dfrac{c}{\\sin C}=2R$",
      "$[ABC]=\\dfrac12ab\\sin C=\\dfrac{abc}{4R}$",
      "$\\sin^2\\theta+\\cos^2\\theta=1$",
      "$\\sin30^\\circ=\\tfrac12,\\ \\sin45^\\circ=\\tfrac{\\sqrt2}{2},\\ \\sin60^\\circ=\\tfrac{\\sqrt3}{2};\\ \\cos$ values reversed; $\\tan30^\\circ=\\tfrac{1}{\\sqrt3},\\ \\tan60^\\circ=\\sqrt3$",
      "$\\tan15^\\circ=2-\\sqrt3, \\qquad \\sin(A+B)=\\sin A\\cos B+\\cos A\\sin B$",
    ],
    checkpoints: [
      {
        id: "geo-trig-1",
        question: "What is $\\sin30^\\circ+\\cos60^\\circ$?",
        answer: "1",
        hint: "Both are the same special value.",
        explanation: "$\\frac12+\\frac12=1$.",
      },
      {
        id: "geo-trig-2",
        question: "What is $\\cos120^\\circ$?",
        answer: "-\\frac{1}{2}",
        hint: "$\\cos(180^\\circ-x)=-\\cos x$.",
        explanation: "$\\cos120^\\circ=-\\cos60^\\circ=-\\frac12$.",
      },
      {
        id: "geo-trig-3",
        question: "Two sides of a triangle have lengths $4$ and $6$, and the angle between them is $30^\\circ$. What is the area of the triangle?",
        answer: "6",
        hint: "Use $\\frac12ab\\sin C$.",
        explanation: "$\\frac12\\cdot4\\cdot6\\cdot\\frac12=6$.",
      },
      {
        id: "geo-trig-4",
        question: "Two sides of a triangle have lengths $3$ and $5$, and the angle between them is $120^\\circ$. What is the third side?",
        answer: "7",
        hint: "Law of cosines with $\\cos120^\\circ=-\\frac12$.",
        explanation: "$c^2=9+25-2\\cdot3\\cdot5\\cdot\\left(-\\frac12\\right)=34+15=49$, so $c=7$.",
      },
    ],
    workedExamples: [
      {
        problem: "Two sides of a triangle have lengths $5$ and $8$ and the angle between them is $60^\\circ$. Find the third side and the area.",
        solution:
          "Law of cosines: $c^2=25+64-2\\cdot5\\cdot8\\cdot\\frac12=89-40=49$, so $c=7$. Area $=\\frac12\\cdot5\\cdot8\\cdot\\sin60^\\circ=20\\cdot\\frac{\\sqrt3}{2}=10\\sqrt3$. Answer: third side $7$, area $10\\sqrt3$.",
        answer: "(7,10\\sqrt{3})",
      },
      {
        problem: "A triangle has sides $7$, $8$, and $9$. What is the cosine of its largest angle, and what is its area?",
        solution:
          "The largest angle $C$ is opposite the side $9$: $81=49+64-2\\cdot7\\cdot8\\cos C$, so $112\\cos C=32$ and $\\cos C=\\frac27$. Then $\\sin C=\\sqrt{1-\\frac{4}{49}}=\\frac{\\sqrt{45}}{7}=\\frac{3\\sqrt5}{7}$. Area $=\\frac12\\cdot7\\cdot8\\cdot\\frac{3\\sqrt5}{7}=12\\sqrt5$. Heron confirms: $s=12$, $\\sqrt{12\\cdot5\\cdot4\\cdot3}=\\sqrt{720}=12\\sqrt5$. Answer: $\\cos C=\\frac27$, area $12\\sqrt5$.",
        answer: "(\\frac{2}{7},12\\sqrt{5})",
      },
      {
        problem: "In triangle $ABC$, $\\angle A=30^\\circ$, $\\angle B=45^\\circ$, and $BC=10$. What is $AC$?",
        solution:
          "Side $BC$ is opposite $A$ and $AC$ is opposite $B$. Law of sines: $\\frac{10}{\\sin30^\\circ}=\\frac{AC}{\\sin45^\\circ}$, so $\\frac{10}{1/2}=20=\\frac{AC}{\\sqrt2/2}$ and $AC=10\\sqrt2$. (The circumradius is $R=10$.) Answer: $10\\sqrt2$.",
        answer: "10\\sqrt{2}",
      },
    ],
    pitfalls: [
      "Sign error in the law of cosines: it is minus $2ab\\cos C$, and $\\cos C$ itself is negative for an obtuse angle.",
      "Using $\\frac12ab\\sin C$ with an angle that is not between the two sides.",
      "Matching a side with the wrong opposite angle in the law of sines.",
      "Forgetting that $\\sin$ alone does not determine an angle: $\\sin C=\\frac{\\sqrt3}{2}$ could mean $60^\\circ$ or $120^\\circ$.",
      "Leaving $\\frac{1}{\\sqrt3}$ unrationalized when the answer choices show $\\frac{\\sqrt3}{3}$.",
    ],
    amcStrategy:
      "Problems 15 through 25. Trig is usually the backup when a clean synthetic idea does not appear within a minute; the law of cosines in particular turns many hard-looking length problems into arithmetic. Keep values exact, and use Heron or a special triangle to double-check.",
    estimatedMinutes: 12,
  },

  // ---------------------------------------------------------- NUMBER THEORY
  "nt-divisibility": {
    skillId: "nt-divisibility",
    summary:
      "Prime factorization is the foundation of AMC 10 number theory. Once a number is written as a product of prime powers, counting divisors, testing divisibility, and finding sums of divisors become formula lookups.",
    keyIdeas: [
      "Factor first. Write $n=p_1^{e_1}p_2^{e_2}\\cdots$ and every other question becomes a question about the exponents.",
      "Number of positive divisors is $(e_1+1)(e_2+1)\\cdots$. Divisors of $n$ that are multiples of $m$ correspond to divisors of $\\frac{n}{m}$.",
      "Perfect squares are exactly the numbers with an odd number of divisors (all exponents even). Squares of primes have exactly $3$ divisors.",
      "Divisibility rules: $3$ and $9$ via digit sum; $4$ and $8$ via the last two or three digits; $11$ via the alternating digit sum; $6$ means both $2$ and $3$.",
      "To test whether $n$ is prime, trial-divide by primes up to $\\sqrt n$. Know the primes below $100$.",
      "Counting multiples of $m$ in $1,\\dots,N$: $\\lfloor N/m\\rfloor$. In a range $[a,b]$: $\\lfloor b/m\\rfloor-\\lfloor (a-1)/m\\rfloor$.",
      "The smallest number with a given divisor count: put the largest exponents on the smallest primes and compare the candidate factorizations of the count.",
    ],
    formulas: [
      "$d(n)=(e_1+1)(e_2+1)\\cdots(e_k+1)$ for $n=p_1^{e_1}\\cdots p_k^{e_k}$",
      "$\\sigma(n)=\\displaystyle\\prod_{i}\\frac{p_i^{e_i+1}-1}{p_i-1}$ (sum of divisors)",
      "Product of all divisors of $n$: $n^{d(n)/2}$",
      "$n\\equiv\\text{(digit sum)}\\pmod 9$; $\\quad n\\equiv\\text{(alternating digit sum)}\\pmod{11}$",
      "Multiples of $m$ up to $N$: $\\left\\lfloor\\dfrac{N}{m}\\right\\rfloor$",
    ],
    checkpoints: [
      {
        id: "nt-divisibility-1",
        question: "How many positive divisors does $100$ have?",
        answer: "9",
        hint: "Factor first: $100=2^2\\cdot5^2$.",
        explanation: "$(2+1)(2+1)=9$.",
      },
      {
        id: "nt-divisibility-2",
        question: "What digit $d$ makes the four-digit number $52d3$ divisible by $9$?",
        answer: "8",
        hint: "The digit sum must be a multiple of $9$.",
        explanation: "$5+2+d+3=10+d$ must equal $18$, so $d=8$.",
      },
      {
        id: "nt-divisibility-3",
        question: "How many multiples of $6$ are there from $1$ to $200$?",
        answer: "33",
        hint: "Compute $\\lfloor 200/6\\rfloor$.",
        explanation: "$6\\cdot33=198\\le200<204=6\\cdot34$, so there are $33$.",
      },
      {
        id: "nt-divisibility-4",
        question: "What is the smallest positive integer with exactly $6$ positive divisors?",
        answer: "12",
        hint: "$6=6$ or $6=3\\cdot2$: compare $p^5$ with $p^2q$.",
        explanation: "$2^5=32$ versus $2^2\\cdot3=12$; the smaller is $12$ (divisors $1,2,3,4,6,12$).",
      },
    ],
    workedExamples: [
      {
        problem: "How many positive divisors of $360$ are multiples of $6$?",
        solution:
          "$360=2^3\\cdot3^2\\cdot5$. A divisor that is a multiple of $6$ has the form $6k$ where $k$ divides $\\frac{360}{6}=60=2^2\\cdot3\\cdot5$. The number of such $k$ is $d(60)=3\\cdot2\\cdot2=12$. Answer: $12$.",
        answer: "12",
      },
      {
        problem: "What is the smallest positive integer with exactly $12$ positive divisors?",
        solution:
          "We need exponents with $(e_1+1)(e_2+1)\\cdots=12$. The factorizations of $12$ give candidates: $12$ alone gives $2^{11}=2048$; $6\\cdot2$ gives $2^5\\cdot3=96$; $4\\cdot3$ gives $2^3\\cdot3^2=72$; $3\\cdot2\\cdot2$ gives $2^2\\cdot3\\cdot5=60$. The smallest is $60$. Answer: $60$.",
        answer: "60",
      },
      {
        problem: "How many three-digit positive integers are divisible by both $7$ and $11$ but not by $3$?",
        solution:
          "Divisible by $7$ and $11$ means divisible by $77$. Three-digit multiples of $77$: $77k$ with $100\\le77k\\le999$, so $k=2,3,\\dots,12$, which is $11$ numbers. Those also divisible by $3$ are $77k$ with $3\\mid k$: $k=3,6,9,12$, which is $4$. Answer: $11-4=7$.",
        answer: "7",
      },
    ],
    pitfalls: [
      "Forgetting that $1$ and $n$ both count as divisors.",
      "Treating $1$ as prime, or forgetting that $2$ is prime.",
      "Multiplying the exponents instead of the (exponent $+1$) values.",
      "Off-by-one when counting multiples in a range; check the endpoints.",
      "Stopping trial division too early or too late: only primes up to $\\sqrt n$ are needed.",
    ],
    amcStrategy:
      "Problems 1 through 10. The first move is always the prime factorization; write it in the margin. Divisor-count questions are pure exponent arithmetic. For 'how many integers in a range' questions, count multiples with floor and subtract the overlap carefully.",
    estimatedMinutes: 10,
  },

  "nt-gcd-lcm": {
    skillId: "nt-gcd-lcm",
    summary:
      "GCD and LCM problems test whether you can move between prime factorizations and the Euclidean algorithm fluently. The identity $\\gcd(a,b)\\cdot\\text{lcm}(a,b)=ab$ and the reduction $\\gcd(a,b)=\\gcd(a,b-ka)$ solve most of them.",
    keyIdeas: [
      "From prime factorizations, the gcd takes the minimum exponent of each prime and the lcm takes the maximum. Hence $\\gcd\\cdot\\text{lcm}=ab$ for two numbers.",
      "Euclidean algorithm: $\\gcd(a,b)=\\gcd(b,\\,a\\bmod b)$. Repeat until the remainder is $0$; the last nonzero remainder is the gcd.",
      "Subtracting multiples does not change the gcd: $\\gcd(a,b)=\\gcd(a,b-ka)$. This is the key to expressions like $\\gcd(n+7,3n+1)$.",
      "Consecutive integers are coprime, and $\\gcd(n,n+k)$ divides $k$.",
      "Ordered pairs with $\\gcd=g$ and $\\text{lcm}=\\ell$: write $a=gx$, $b=gy$ with $\\gcd(x,y)=1$ and $xy=\\ell/g$; the count is $2^{(\\text{number of distinct primes of }\\ell/g)}$.",
      "$\\text{lcm}(1,2,\\dots,n)$ is the product of the largest prime powers $\\le n$.",
      "Relatively prime means gcd $1$; the fraction $\\frac{a}{b}$ is in lowest terms exactly when $\\gcd(a,b)=1$.",
    ],
    formulas: [
      "$\\gcd(a,b)\\cdot\\text{lcm}(a,b)=ab$",
      "$\\gcd(a,b)=\\gcd(b,\\,a\\bmod b)=\\gcd(a,\\,b-ka)$",
      "$\\gcd(n,n+k)\\mid k$; in particular $\\gcd(n,n+1)=1$",
      "$\\gcd\\big(p_1^{a_1}\\cdots,\\,p_1^{b_1}\\cdots\\big)=\\prod p_i^{\\min(a_i,b_i)}, \\qquad \\text{lcm}=\\prod p_i^{\\max(a_i,b_i)}$",
      "$\\gcd(2^a-1,2^b-1)=2^{\\gcd(a,b)}-1$",
    ],
    checkpoints: [
      {
        id: "nt-gcd-lcm-1",
        question: "What is $\\gcd(84,36)$?",
        answer: "12",
        hint: "Factor both numbers, or run the Euclidean algorithm.",
        explanation: "$84=2^2\\cdot3\\cdot7$ and $36=2^2\\cdot3^2$, so the gcd is $2^2\\cdot3=12$.",
      },
      {
        id: "nt-gcd-lcm-2",
        question: "What is $\\text{lcm}(12,18)$?",
        answer: "36",
        hint: "Take the larger exponent of each prime.",
        explanation: "$12=2^2\\cdot3$ and $18=2\\cdot3^2$, so the lcm is $2^2\\cdot3^2=36$.",
      },
      {
        id: "nt-gcd-lcm-3",
        question: "Two positive integers have greatest common divisor $4$ and least common multiple $120$. What is their product?",
        answer: "480",
        hint: "$\\gcd(a,b)\\cdot\\text{lcm}(a,b)=ab$.",
        explanation: "$4\\cdot120=480$.",
      },
      {
        id: "nt-gcd-lcm-4",
        question: "What is the largest possible value of $\\gcd(n+3,\\,2n+1)$ as $n$ ranges over the positive integers?",
        answer: "5",
        hint: "Subtract $2(n+3)$ from $2n+1$ to eliminate $n$.",
        explanation: "$\\gcd(n+3,2n+1)=\\gcd(n+3,\\,2n+1-2(n+3))=\\gcd(n+3,5)$, which is at most $5$ and equals $5$ when $n=2$.",
      },
    ],
    workedExamples: [
      {
        problem: "Compute $\\gcd(1001,2618)$.",
        solution:
          "Euclidean algorithm: $2618=2\\cdot1001+616$; $1001=1\\cdot616+385$; $616=1\\cdot385+231$; $385=1\\cdot231+154$; $231=1\\cdot154+77$; $154=2\\cdot77+0$. The gcd is $77$. Check: $1001=7\\cdot11\\cdot13$ and $2618=2\\cdot7\\cdot11\\cdot17$. Answer: $77$.",
        answer: "77",
      },
      {
        problem: "How many ordered pairs $(a,b)$ of positive integers have $\\gcd(a,b)=6$ and $\\text{lcm}(a,b)=180$?",
        solution:
          "Write $a=6x$, $b=6y$ with $\\gcd(x,y)=1$. Then $\\text{lcm}(a,b)=6xy=180$, so $xy=30=2\\cdot3\\cdot5$. Each of the three primes goes entirely to $x$ or entirely to $y$, giving $2^3=8$ ordered pairs. Answer: $8$.",
        answer: "8",
      },
      {
        problem: "For how many positive integers $n\\le50$ is $\\gcd(n+7,\\,3n+1)=4$?",
        solution:
          "$\\gcd(n+7,3n+1)=\\gcd(n+7,\\,3n+1-3(n+7))=\\gcd(n+7,-20)=\\gcd(n+7,20)$. This equals $4$ exactly when $4\\mid n+7$ and $5\\nmid n+7$. As $n$ runs over $1$ to $50$, $n+7$ runs over $8$ to $57$. Multiples of $4$ there: $8,12,\\dots,56$, which is $13$ values. Those also divisible by $5$ (multiples of $20$): $20,40$, which is $2$. Answer: $13-2=11$.",
        answer: "11",
      },
    ],
    pitfalls: [
      "Mixing up gcd (smallest exponents) and lcm (largest exponents).",
      "Believing $\\gcd\\cdot\\text{lcm}=abc$ for three numbers; the identity only holds for two.",
      "Stopping the Euclidean algorithm one step early and reporting a quotient instead of the last nonzero remainder.",
      "Forgetting that a subtracted multiple can be negative and that $\\gcd(a,-20)=\\gcd(a,20)$.",
      "Miscounting pairs by forgetting that $(x,y)$ and $(y,x)$ are different ordered pairs.",
    ],
    amcStrategy:
      "Problems 3 through 12. If two specific numbers are given, factor them or run the Euclidean algorithm; if an expression in $n$ is given, subtract multiples to kill the $n$. For gcd-and-lcm pair counting, the $2^{\\text{primes}}$ trick is instant.",
    estimatedMinutes: 10,
  },

  "nt-modular": {
    skillId: "nt-modular",
    summary:
      "Modular arithmetic handles remainders, units digits, and 'what day of the week' questions. The AMC 10 rewards reducing early, spotting cycles in powers, and combining small moduli by listing candidates.",
    keyIdeas: [
      "Reduce as you go: replace every number by its remainder before adding or multiplying. Negative representatives like $9\\equiv-1\\pmod{10}$ make powers trivial.",
      "Units digits of powers cycle with period dividing $4$: $2\\to2,4,8,6$; $3\\to3,9,7,1$; $7\\to7,9,3,1$; $4,9$ have period $2$; $0,1,5,6$ are constant. Use the exponent mod $4$, and remember exponent $\\equiv0$ means the fourth entry.",
      "For remainders of $a^n$ mod $m$, find a small power of $a$ that is $\\equiv1$ (or $-1$) and reduce the exponent by it. Fermat: $a^{p-1}\\equiv1\\pmod p$ when $p\\nmid a$.",
      "Squares are $0$ or $1\\pmod 4$ and $0,1,4\\pmod 8$ (odd squares are $1\\pmod 8$); squares are $0$ or $1\\pmod 3$. Cubes are $0,\\pm1\\pmod 9$. These rule out impossible equations instantly.",
      "Systems of congruences with small moduli: list numbers satisfying the largest modulus and test the others. Solutions repeat with period equal to the lcm.",
      "$10\\equiv1\\pmod9$ and $10\\equiv-1\\pmod{11}$ explain the digit-sum tests. $a-b$ divides $a^n-b^n$ for every $n$.",
      "Last two digits means mod $100$; use $\\pmod 4$ and $\\pmod{25}$ separately if needed.",
    ],
    formulas: [
      "$a\\equiv b\\pmod m \\implies a+c\\equiv b+c,\\ ac\\equiv bc,\\ a^k\\equiv b^k\\pmod m$",
      "Fermat: $a^{p-1}\\equiv1\\pmod p$ for prime $p\\nmid a$",
      "$a-b\\mid a^n-b^n$; $\\quad a+b\\mid a^n+b^n$ for odd $n$",
      "$n^2\\equiv0,1\\pmod4; \\quad n^2\\equiv0,1\\pmod3; \\quad n^2\\equiv0,1,4\\pmod8$",
      "$10\\equiv1\\pmod9, \\qquad 10\\equiv-1\\pmod{11}$",
      "Two congruences with coprime moduli $m,n$ have exactly one solution mod $mn$",
    ],
    checkpoints: [
      {
        id: "nt-modular-1",
        question: "What is the units digit of $3^{10}$?",
        answer: "9",
        hint: "Units digits of powers of $3$ cycle $3,9,7,1$.",
        explanation: "$10\\equiv2\\pmod4$, so it is the second entry of the cycle, $9$. (Indeed $3^{10}=59049$.)",
      },
      {
        id: "nt-modular-2",
        question: "What is the remainder when $47\\cdot53$ is divided by $5$?",
        answer: "1",
        hint: "Reduce each factor mod $5$ before multiplying.",
        explanation: "$47\\equiv2$ and $53\\equiv3\\pmod5$, so the product is $\\equiv6\\equiv1\\pmod5$.",
      },
      {
        id: "nt-modular-3",
        question: "What is the remainder when $2^{20}$ is divided by $7$?",
        answer: "4",
        hint: "$2^3=8\\equiv1\\pmod7$.",
        explanation: "$2^{20}=(2^3)^6\\cdot2^2\\equiv1\\cdot4=4\\pmod7$.",
      },
      {
        id: "nt-modular-4",
        question: "What is the smallest positive integer $n$ with $n\\equiv1\\pmod4$ and $n\\equiv2\\pmod5$?",
        answer: "17",
        hint: "List numbers that are $2$ mod $5$ and test each mod $4$.",
        explanation: "Candidates $2,7,12,17$: only $17$ leaves remainder $1$ when divided by $4$.",
      },
    ],
    workedExamples: [
      {
        problem: "What is the units digit of $7^{2026}+3^{2026}$?",
        solution:
          "Powers of $7$ end in $7,9,3,1$ repeating; $2026\\equiv2\\pmod4$, so $7^{2026}$ ends in $9$. Powers of $3$ end in $3,9,7,1$; the same exponent gives $9$. The sum ends in $9+9=18$, so the units digit is $8$. Answer: $8$.",
        answer: "8",
      },
      {
        problem: "What is the remainder when $2^{100}$ is divided by $7$?",
        solution:
          "$2^3=8\\equiv1\\pmod7$. Since $100=3\\cdot33+1$, $2^{100}=(2^3)^{33}\\cdot2\\equiv1^{33}\\cdot2=2\\pmod7$. Answer: $2$.",
        answer: "2",
      },
      {
        problem:
          "How many positive integers $n\\le1000$ leave a remainder of $2$ when divided by $3$, a remainder of $3$ when divided by $5$, and a remainder of $2$ when divided by $7$?",
        solution:
          "$n\\equiv2\\pmod3$ and $n\\equiv2\\pmod7$ together mean $n\\equiv2\\pmod{21}$: candidates $2,23,44,65,\\dots$. Testing mod $5$: $2\\to2$, $23\\to3$. So $n\\equiv23\\pmod{105}$. The values $\\le1000$ are $23+105k$ for $k=0,1,\\dots,9$ (since $23+105\\cdot9=968$ and $23+105\\cdot10=1073>1000$). Answer: $10$.",
        answer: "10",
      },
    ],
    pitfalls: [
      "Off-by-one in the cycle: an exponent that is a multiple of $4$ picks the last entry of the cycle, not the first.",
      "Dividing both sides of a congruence; division is only safe when the divisor is coprime to the modulus.",
      "Reporting a negative remainder; add the modulus to land in $0,\\dots,m-1$.",
      "Reducing the exponent mod $m$ instead of mod the cycle length.",
      "Forgetting that the period of solutions to a system is the lcm of the moduli, not their sum.",
    ],
    amcStrategy:
      "Problems 5 through 18. For powers, find the cycle by hand in ten seconds rather than recalling a theorem. For systems, list candidates from the biggest modulus. Use squares mod $4$ or mod $3$ to kill cases quickly in 'no solutions' problems.",
    estimatedMinutes: 11,
  },

  "nt-bases": {
    skillId: "nt-bases",
    summary:
      "Base and digit problems are about place value: a number is a sum of digits times powers of the base. The AMC 10 uses them to test careful conversion, digit-sum reasoning, and algebra on the digits of a two- or three-digit number.",
    keyIdeas: [
      "Expand: $(d_kd_{k-1}\\dots d_0)_b=d_kb^k+\\cdots+d_1b+d_0$. Every digit must satisfy $0\\le d_i<b$.",
      "Convert from base $10$ by finding the largest power of $b$ that fits, or by repeated division by $b$ reading remainders backwards.",
      "A two-digit number is $10a+b$, a three-digit number is $100a+10b+c$. Reversing digits changes a two-digit number by $9(a-b)$, always a multiple of $9$.",
      "$n$ has exactly $k$ digits in base $b$ when $b^{k-1}\\le n<b^k$. The largest $k$-digit number in base $b$ is $b^k-1$.",
      "A number is congruent to its digit sum mod $b-1$ in any base $b$, and to its alternating digit sum mod $b+1$.",
      "Palindromes: a three-digit palindrome is $\\overline{aba}=101a+10b$; count by choosing digits ($a\\ne0$).",
      "Unknown base equations: write the expansion and solve the polynomial in $b$; reject bases that make any digit invalid.",
    ],
    formulas: [
      "$(d_k\\dots d_1d_0)_b=\\displaystyle\\sum_{i=0}^{k}d_ib^i$",
      "$\\overline{ab}=10a+b, \\qquad \\overline{ab}-\\overline{ba}=9(a-b)$",
      "$n$ has $k$ base-$b$ digits $\\iff b^{k-1}\\le n<b^k$",
      "$n\\equiv S_b(n)\\pmod{b-1}$ (digit sum in base $b$)",
      "$\\overline{aba}=101a+10b$; two-digit palindromes are multiples of $11$",
      "$121_b=(b+1)^2, \\qquad 1000_b=b^3$",
    ],
    checkpoints: [
      {
        id: "nt-bases-1",
        question: "What is the base-ten value of $203_5$?",
        answer: "53",
        hint: "Expand using powers of $5$.",
        explanation: "$2\\cdot25+0\\cdot5+3=53$.",
      },
      {
        id: "nt-bases-2",
        question: "Write $45$ in base $3$. (Enter just the digits.)",
        answer: "1200",
        hint: "The powers of $3$ are $27, 9, 3, 1$.",
        explanation: "$45=1\\cdot27+2\\cdot9+0\\cdot3+0\\cdot1$, so $45=1200_3$.",
      },
      {
        id: "nt-bases-3",
        question: "For what base $b$ does $34_b=25$?",
        answer: "7",
        hint: "Expand: $34_b=3b+4$.",
        explanation: "$3b+4=25$ gives $b=7$, and the digits $3$ and $4$ are valid in base $7$.",
      },
      {
        id: "nt-bases-4",
        question: "A two-digit number exceeds the number formed by reversing its digits by $36$. What is the difference between its two digits?",
        answer: "4",
        hint: "$\\overline{ab}-\\overline{ba}=9(a-b)$.",
        explanation: "$9(a-b)=36$ gives $a-b=4$ (for example $51-15=36$).",
      },
    ],
    workedExamples: [
      {
        problem: "What is the sum of the digits of $2026$ when it is written in base $7$?",
        solution:
          "$7^3=343$ and $7^4=2401>2026$. $2026=5\\cdot343+311$; $311=6\\cdot49+17$; $17=2\\cdot7+3$. So $2026=5623_7$. Check: $1715+294+14+3=2026$. Digit sum $5+6+2+3=16$. Answer: $16$.",
        answer: "16",
      },
      {
        problem: "For what base $b$ does $121_b$ equal the base-ten number $144$?",
        solution:
          "$121_b=b^2+2b+1=(b+1)^2$. Setting $(b+1)^2=144$ gives $b+1=12$, so $b=11$. The digits $1$ and $2$ are valid in base $11$. Answer: $11$.",
        answer: "11",
      },
      {
        problem: "How many three-digit palindromes are divisible by $11$?",
        solution:
          "A palindrome $\\overline{aba}=101a+10b$. Mod $11$: $101\\equiv2$ and $10\\equiv-1$, so we need $2a-b\\equiv0\\pmod{11}$, i.e. $b\\equiv2a\\pmod{11}$ with $1\\le a\\le9$ and $0\\le b\\le9$. For $a=1,2,3,4$: $b=2,4,6,8$. For $a=5$: $b=10$, invalid. For $a=6,7,8,9$: $b=12,14,16,18$ reduced mod $11$ gives $1,3,5,7$. That is $8$ palindromes (e.g. $121,242,616,979$). Answer: $8$.",
        answer: "8",
      },
    ],
    pitfalls: [
      "Using a digit that is not less than the base (there is no digit $7$ in base $7$).",
      "Reading remainders in the wrong order when converting by repeated division.",
      "Allowing a leading zero in a 'three-digit number'.",
      "Treating $\\overline{ab}$ as the product $ab$ instead of $10a+b$.",
      "Forgetting to check the base is larger than every digit in the problem.",
    ],
    amcStrategy:
      "Problems 5 through 15. Write the expansion explicitly; never convert in your head. For digit-algebra problems, set the number as $10a+b$ or $100a+10b+c$ and use bounds on the digits to finish with casework. Verify a conversion by converting back.",
    estimatedMinutes: 10,
  },

  "nt-diophantine": {
    skillId: "nt-diophantine",
    summary:
      "Diophantine problems ask for integer solutions, and the AMC 10 usually wants you to factor: Simon's Favorite Factoring Trick, difference of squares, or a reciprocal equation rearranged into a product. After factoring, counting factor pairs finishes the job.",
    keyIdeas: [
      "Simon's Favorite Factoring Trick: $xy+ax+by=c$ becomes $(x+a)(y+b)=c+ab$. Add the missing constant and factor.",
      "Difference of squares: $x^2-y^2=n$ means $(x-y)(x+y)=n$ with both factors of the same parity (so $n$ odd or divisible by $4$).",
      "Reciprocal equations: $\\frac1x+\\frac1y=\\frac1n$ becomes $(x-n)(y-n)=n^2$; the number of positive solutions is $d(n^2)$.",
      "After factoring, list factor pairs of the constant, including negative pairs when the variables may be negative, and translate each back to $(x,y)$. Discard any that violate the given constraints.",
      "Use modular constraints to prove no solutions: squares mod $4$, cubes mod $9$, parity.",
      "Linear equations $ax+by=c$ have integer solutions iff $\\gcd(a,b)\\mid c$; solutions step by $\\frac{b}{g}$ in $x$ and $\\frac{a}{g}$ in $y$. Count solutions in a range by bounding.",
      "Bounding: if $x\\le y$, then $x$ is at most the square root (or a small multiple), which limits casework.",
    ],
    formulas: [
      "SFFT: $xy+ax+by+ab=(x+a)(y+b)$",
      "$x^2-y^2=(x-y)(x+y)$; both factors have the same parity",
      "$\\dfrac1x+\\dfrac1y=\\dfrac1n \\iff (x-n)(y-n)=n^2$",
      "$ax+by=c$ solvable in integers $\\iff \\gcd(a,b)\\mid c$; general solution $x=x_0+\\dfrac{b}{g}t,\\ y=y_0-\\dfrac{a}{g}t$",
      "Ordered positive factor pairs of $N$: $d(N)$ of them",
    ],
    checkpoints: [
      {
        id: "nt-diophantine-1",
        question: "What constant must be added to both sides of $xy+4x+5y=7$ so that the left side factors as a product of two binomials?",
        answer: "20",
        hint: "SFFT: the constant is the product of the two coefficients.",
        explanation: "$xy+4x+5y+20=(x+5)(y+4)$, so add $20$.",
      },
      {
        id: "nt-diophantine-2",
        question: "How many ordered pairs $(x,y)$ of positive integers satisfy $xy=36$?",
        answer: "9",
        hint: "Each divisor $x$ of $36$ gives exactly one $y$.",
        explanation: "$36=2^2\\cdot3^2$ has $d(36)=3\\cdot3=9$ divisors.",
      },
      {
        id: "nt-diophantine-3",
        question: "How many ordered pairs $(x,y)$ of positive integers satisfy $x^2-y^2=15$?",
        answer: "2",
        hint: "Factor as $(x-y)(x+y)=15$ with $x-y<x+y$.",
        explanation: "The factor pairs $(1,15)$ and $(3,5)$ give $(x,y)=(8,7)$ and $(4,1)$.",
      },
      {
        id: "nt-diophantine-4",
        question: "How many ordered pairs $(x,y)$ of positive integers satisfy $\\dfrac1x+\\dfrac1y=\\dfrac12$?",
        answer: "3",
        hint: "Clear denominators and use SFFT: $(x-2)(y-2)=4$.",
        explanation: "The positive factor pairs of $4$ give $(x,y)=(3,6),(4,4),(6,3)$.",
      },
    ],
    workedExamples: [
      {
        problem: "How many ordered pairs $(x,y)$ of positive integers satisfy $xy-3x-2y=6$?",
        solution:
          "Add $6$ to both sides: $xy-3x-2y+6=12$, which factors as $(x-2)(y-3)=12$. Since $x\\ge1$ and $y\\ge1$, $x-2\\ge-1$ and $y-3\\ge-2$; a negative factor pair would need both factors negative and at least one below these bounds, so only positive pairs work. $12$ has $d(12)=6$ positive ordered factor pairs, each giving a valid $(x,y)$ (e.g. $(1,12)\\to(3,15)$). Answer: $6$.",
        answer: "6",
      },
      {
        problem: "How many ordered pairs $(x,y)$ of positive integers satisfy $x^2-y^2=60$?",
        solution:
          "$(x-y)(x+y)=60$ with $0<x-y<x+y$ and both factors of the same parity. Factor pairs of $60$: $(1,60),(2,30),(3,20),(4,15),(5,12),(6,10)$. Both even: $(2,30)$ and $(6,10)$. These give $(x,y)=(16,14)$ and $(8,2)$. Answer: $2$.",
        answer: "2",
      },
      {
        problem: "How many ordered pairs $(x,y)$ of positive integers satisfy $\\dfrac1x+\\dfrac1y=\\dfrac16$?",
        solution:
          "Multiply by $6xy$: $6y+6x=xy$, so $xy-6x-6y=0$ and $(x-6)(y-6)=36$. Since $x,y>6$ is forced for positive solutions (if $x\\le6$ then $\\frac1x\\ge\\frac16$), both factors are positive, and $36=2^2\\cdot3^2$ has $d(36)=9$ ordered factor pairs. Answer: $9$.",
        answer: "9",
      },
    ],
    pitfalls: [
      "Forgetting negative factor pairs when the variables are allowed to be negative (or including them when they are not).",
      "Ignoring parity in $x^2-y^2=n$ and accepting a pair like $(1,60)$ that gives non-integer $x$.",
      "Counting unordered pairs when the problem says ordered, or vice versa.",
      "Adding the wrong constant in SFFT; the constant is the product of the two coefficients.",
      "Dividing by a variable that could be zero.",
    ],
    amcStrategy:
      "Problems 10 through 22. If you see $xy$ together with $x$ and $y$ terms, it is SFFT; if you see a difference of squares, list same-parity factor pairs; if you see reciprocals, clear denominators and SFFT. Then count factor pairs with $d(N)$ and prune by the constraints.",
    estimatedMinutes: 11,
  },

  "nt-factorials-powers": {
    skillId: "nt-factorials-powers",
    summary:
      "Factorial problems ask how many times a prime divides $n!$, which is exactly what Legendre's formula computes. Trailing zeros, largest powers dividing a product, and zeros in other bases all reduce to this one sum.",
    keyIdeas: [
      "Legendre: the exponent of prime $p$ in $n!$ is $\\lfloor n/p\\rfloor+\\lfloor n/p^2\\rfloor+\\lfloor n/p^3\\rfloor+\\cdots$. Each term counts multiples of that power; the sum counts total factors.",
      "Trailing zeros of $n!$ in base $10$ equal the exponent of $5$, since $2$s are always more plentiful.",
      "Trailing zeros in base $b$: factor $b$, compute each prime's exponent in $n!$, divide by the exponent in $b$, and take the minimum.",
      "Exponent of $p$ in a product like $1\\cdot2\\cdots n$ times other factors: exponents add, so $v_p(ab)=v_p(a)+v_p(b)$.",
      "$v_2(n!)=n-s_2(n)$ where $s_2(n)$ is the number of ones in the binary expansion of $n$.",
      "$m$ divides $n!$ exactly when every prime power in $m$ is at most the corresponding Legendre exponent.",
      "The exponent of $p$ in $\\binom{n}{k}$ is the number of carries when adding $k$ and $n-k$ in base $p$ (Kummer).",
    ],
    formulas: [
      "$v_p(n!)=\\displaystyle\\sum_{i\\ge1}\\left\\lfloor\\frac{n}{p^i}\\right\\rfloor$",
      "Trailing zeros of $n!$ $=v_5(n!)$",
      "$v_2(n!)=n-s_2(n)$",
      "$v_p(ab)=v_p(a)+v_p(b), \\qquad v_p\\!\\left(\\frac{a}{b}\\right)=v_p(a)-v_p(b)$",
      "Zeros of $n!$ in base $p^ek$ (with $p\\nmid k$ contributing separately): $\\min$ over primes of $\\left\\lfloor\\dfrac{v_p(n!)}{e_p}\\right\\rfloor$",
    ],
    checkpoints: [
      {
        id: "nt-factorials-powers-1",
        question: "How many zeros does $25!$ end with?",
        answer: "6",
        hint: "Count factors of $5$, including the extra one from $25$.",
        explanation: "$\\lfloor25/5\\rfloor+\\lfloor25/25\\rfloor=5+1=6$.",
      },
      {
        id: "nt-factorials-powers-2",
        question: "What is the exponent of $2$ in the prime factorization of $10!$?",
        answer: "8",
        hint: "Legendre: $\\lfloor10/2\\rfloor+\\lfloor10/4\\rfloor+\\lfloor10/8\\rfloor$.",
        explanation: "$5+2+1=8$.",
      },
      {
        id: "nt-factorials-powers-3",
        question: "What is the largest integer $k$ such that $3^k$ divides $30!$?",
        answer: "14",
        hint: "Add $\\lfloor30/3\\rfloor+\\lfloor30/9\\rfloor+\\lfloor30/27\\rfloor$.",
        explanation: "$10+3+1=14$.",
      },
      {
        id: "nt-factorials-powers-4",
        question: "How many zeros does $25!$ end with when written in base $6$?",
        answer: "10",
        hint: "$6=2\\cdot3$, and the exponent of $3$ is the bottleneck.",
        explanation: "$v_3(25!)=8+2=10$ and $v_2(25!)=12+6+3+1=22$, so the answer is $\\min(22,10)=10$.",
      },
    ],
    workedExamples: [
      {
        problem: "How many zeros does $200!$ end with?",
        solution:
          "Count factors of $5$: $\\lfloor200/5\\rfloor+\\lfloor200/25\\rfloor+\\lfloor200/125\\rfloor=40+8+1=49$. There are far more factors of $2$, so there are $49$ trailing zeros. Answer: $49$.",
        answer: "49",
      },
      {
        problem: "What is the largest integer $k$ such that $3^k$ divides $100!$?",
        solution:
          "$\\lfloor100/3\\rfloor+\\lfloor100/9\\rfloor+\\lfloor100/27\\rfloor+\\lfloor100/81\\rfloor=33+11+3+1=48$. Answer: $48$.",
        answer: "48",
      },
      {
        problem: "How many zeros does $30!$ end with when written in base $12$?",
        solution:
          "$12=2^2\\cdot3$, so we need the largest $k$ with $2^{2k}3^k\\mid30!$. $v_2(30!)=15+7+3+1=26$ and $v_3(30!)=10+3+1=14$. The $2$s allow $k\\le\\lfloor26/2\\rfloor=13$; the $3$s allow $k\\le14$. The minimum is $13$. Answer: $13$.",
        answer: "13",
      },
    ],
    pitfalls: [
      "Stopping at $\\lfloor n/5\\rfloor$ and missing the extra factors from $25$, $125$, and so on.",
      "Multiplying the floor terms instead of adding them.",
      "For a composite base, forgetting to divide by the exponent of the prime in the base before taking the minimum.",
      "Counting factors of $2$ for trailing zeros; the $5$s are the bottleneck.",
      "Computing $v_p$ of a product term by term and losing track; just add the exponents.",
    ],
    amcStrategy:
      "Problems 10 through 22. Write the Legendre sum immediately and stop when the power of $p$ exceeds $n$. For base-$b$ zeros or 'largest power dividing a product' questions, handle each prime separately and take the minimum. These are quick points once the formula is automatic.",
    estimatedMinutes: 9,
  },

  // -------------------------------------------------- COUNTING & PROBABILITY
  "cp-counting-basics": {
    skillId: "cp-counting-basics",
    summary:
      "Counting starts with the multiplication principle, permutations, and combinations. The AMC 10 tests whether you can tell when order matters, when objects are identical, and when a restriction is easier to count through its complement.",
    keyIdeas: [
      "Multiplication principle: if a task has independent stages with $a$, $b$, $c$ choices, there are $abc$ outcomes. Fill the most restricted slot first.",
      "Permutations count ordered selections: $n!$ arrangements of $n$ distinct things, $\\frac{n!}{(n-k)!}$ for choosing and ordering $k$ of them.",
      "Combinations count unordered selections: $\\binom nk$. Choosing positions for the special items is often the cleanest framing.",
      "Repeated letters: divide by the factorial of each multiplicity, e.g. BANANA has $\\frac{6!}{3!\\,2!}=60$ arrangements.",
      "Items that must stay together: glue them into one block, arrange, then multiply by the arrangements inside the block.",
      "Items that must be apart: count the complement (together) and subtract, or place the others first and choose gaps.",
      "Circular arrangements of $n$ distinct people: $(n-1)!$, since rotations are the same seating.",
      "Strictly increasing digit strings are just subsets: choose the digits and there is one way to order them.",
    ],
    formulas: [
      "$P(n,k)=\\dfrac{n!}{(n-k)!}, \\qquad \\dbinom nk=\\dfrac{n!}{k!\\,(n-k)!}$",
      "$\\dbinom nk=\\dbinom n{n-k}, \\qquad \\dbinom nk=\\dbinom{n-1}{k-1}+\\dbinom{n-1}{k}$",
      "$\\displaystyle\\sum_{k=0}^n\\binom nk=2^n$",
      "Arrangements with repeats: $\\dfrac{n!}{a!\\,b!\\,c!\\cdots}$",
      "Circular arrangements: $(n-1)!$",
    ],
    checkpoints: [
      {
        id: "cp-counting-basics-1",
        question: "What is $\\dbinom{7}{3}$?",
        answer: "35",
        hint: "$\\frac{7\\cdot6\\cdot5}{3\\cdot2\\cdot1}$.",
        explanation: "$\\frac{210}{6}=35$.",
      },
      {
        id: "cp-counting-basics-2",
        question: "How many distinct arrangements are there of the letters of LEVEL?",
        answer: "30",
        hint: "Divide $5!$ by the factorials of the repeated letters.",
        explanation: "$\\frac{5!}{2!\\,2!}=\\frac{120}{4}=30$.",
      },
      {
        id: "cp-counting-basics-3",
        question: "In how many ways can $6$ people be seated around a round table, if rotations are considered the same?",
        answer: "120",
        hint: "Circular arrangements: $(n-1)!$.",
        explanation: "$5!=120$.",
      },
      {
        id: "cp-counting-basics-4",
        question: "Five different books are placed in a row. In how many ways can this be done if three particular books must be next to each other?",
        answer: "36",
        hint: "Glue the three books into one block.",
        explanation: "Arrange $3$ objects (the block and the two other books) in $3!$ ways and the block internally in $3!$ ways: $6\\cdot6=36$.",
      },
    ],
    workedExamples: [
      {
        problem: "How many arrangements of the letters of BANANA have the two N's not next to each other?",
        solution:
          "Total arrangements: $\\frac{6!}{3!\\,2!}=60$. Arrangements with the N's adjacent: glue them into one block NN, leaving the five objects B, NN, A, A, A, arranged in $\\frac{5!}{3!}=20$ ways. Answer: $60-20=40$.",
        answer: "40",
      },
      {
        problem: "A committee of $4$ is chosen from $6$ boys and $5$ girls. How many committees include at least one boy and at least one girl?",
        solution:
          "All committees: $\\binom{11}{4}=330$. All-boy: $\\binom64=15$. All-girl: $\\binom54=5$. Answer: $330-15-5=310$.",
        answer: "310",
      },
      {
        problem: "How many three-digit positive integers have digits that are strictly increasing from left to right?",
        solution:
          "A strictly increasing digit string is determined by its set of digits, and $0$ cannot appear (it would have to be first). So choose any $3$ digits from $\\{1,\\dots,9\\}$: $\\binom93=84$. Answer: $84$.",
        answer: "84",
      },
    ],
    pitfalls: [
      "Using a permutation when order does not matter (or a combination when it does).",
      "Forgetting to divide by the factorials of repeated letters.",
      "Counting 'at least one' directly and double counting; use the complement.",
      "Using $n!$ instead of $(n-1)!$ for a circular table.",
      "Forgetting the internal arrangements of a glued block.",
    ],
    amcStrategy:
      "Problems 1 through 10. Decide first whether order matters and whether the objects are distinct, then pick permutation or combination. Restrictions like 'together' or 'apart' are block or complement problems. Verify with a tiny case (e.g. $2$ or $3$ objects) when a formula feels uncertain.",
    estimatedMinutes: 10,
  },

  "cp-probability": {
    skillId: "cp-probability",
    summary:
      "Probability on the AMC 10 is counting in disguise: favorable outcomes over equally likely outcomes. The extra skills are the complement, independence, conditional probability, and drawing without replacement.",
    keyIdeas: [
      "Make the sample space equally likely first. Two dice are $36$ ordered pairs; five coins are $32$ sequences; a $5$-card hand is $\\binom{52}{5}$ unordered hands.",
      "Complement: 'at least one' is $1-P(\\text{none})$. This is the single most useful probability trick on the test.",
      "Independent events multiply. Sequential draws without replacement multiply conditional probabilities: $\\frac{4}{7}\\cdot\\frac{3}{6}$.",
      "Conditional probability: restrict the sample space to the given condition and recount.",
      "Symmetry: with an odd number of coin flips, 'more heads than tails' has probability exactly $\\frac12$.",
      "For dice sums, tabulate: the number of ways to roll a sum $s$ on two dice is $6-|s-7|$.",
      "Exactly $k$ successes in $n$ independent trials: $\\binom nk p^k(1-p)^{n-k}$.",
    ],
    formulas: [
      "$P(A)=\\dfrac{|A|}{|S|}$ when outcomes are equally likely",
      "$P(A^c)=1-P(A)$",
      "$P(A\\cap B)=P(A)\\,P(B)$ for independent events",
      "$P(A\\mid B)=\\dfrac{P(A\\cap B)}{P(B)}$",
      "$P(A\\cup B)=P(A)+P(B)-P(A\\cap B)$",
      "$P(\\text{exactly }k\\text{ of }n)=\\dbinom nk p^k(1-p)^{n-k}$",
    ],
    checkpoints: [
      {
        id: "cp-probability-1",
        question: "Two fair six-sided dice are rolled. What is the probability that the sum is $7$?",
        answer: "\\frac{1}{6}",
        hint: "Count ordered pairs out of $36$.",
        explanation: "Six pairs $(1,6),(2,5),\\dots,(6,1)$ work, so the probability is $\\frac{6}{36}=\\frac16$.",
      },
      {
        id: "cp-probability-2",
        question: "A fair coin is flipped $3$ times. What is the probability of getting at least one head?",
        answer: "\\frac{7}{8}",
        hint: "Use the complement: no heads at all.",
        explanation: "$1-\\left(\\frac12\\right)^3=1-\\frac18=\\frac78$.",
      },
      {
        id: "cp-probability-3",
        question: "A bag has $5$ red and $3$ blue marbles. Two are drawn without replacement. What is the probability that both are red?",
        answer: "\\frac{5}{14}",
        hint: "Multiply, updating the denominator after the first draw.",
        explanation: "$\\frac58\\cdot\\frac47=\\frac{20}{56}=\\frac{5}{14}$.",
      },
      {
        id: "cp-probability-4",
        question: "A fair coin is flipped $4$ times. What is the probability of exactly $2$ heads?",
        answer: "\\frac{3}{8}",
        hint: "Choose which $2$ of the $4$ flips are heads.",
        explanation: "$\\frac{\\binom42}{2^4}=\\frac{6}{16}=\\frac38$.",
      },
    ],
    workedExamples: [
      {
        problem: "Two fair six-sided dice are rolled. What is the probability that the product of the two numbers is even?",
        solution:
          "The product is odd only when both dice are odd, with probability $\\frac12\\cdot\\frac12=\\frac14$. So the product is even with probability $1-\\frac14=\\frac34$. Answer: $\\frac34$.",
        answer: "\\frac{3}{4}",
      },
      {
        problem: "A bag has $4$ red and $3$ blue marbles. Two are drawn without replacement. What is the probability they are different colors?",
        solution:
          "Red then blue: $\\frac47\\cdot\\frac36=\\frac{12}{42}$. Blue then red: $\\frac37\\cdot\\frac46=\\frac{12}{42}$. Total $\\frac{24}{42}=\\frac47$. Alternatively, $\\frac{\\binom41\\binom31}{\\binom72}=\\frac{12}{21}=\\frac47$. Answer: $\\frac47$.",
        answer: "\\frac{4}{7}",
      },
      {
        problem: "A fair coin is flipped $5$ times. Given that the first flip is heads, what is the probability that there are exactly two heads in total?",
        solution:
          "Condition on the first flip being heads: the remaining $4$ flips are equally likely, $16$ outcomes. We need exactly one more head among them: $\\binom41=4$ outcomes. Probability $\\frac{4}{16}=\\frac14$. Answer: $\\frac14$.",
        answer: "\\frac{1}{4}",
      },
    ],
    pitfalls: [
      "Using outcomes that are not equally likely (e.g. treating the sums $2$ through $12$ as equally likely).",
      "Forgetting to change the denominator after a draw without replacement.",
      "Adding probabilities of events that can both happen without subtracting the overlap.",
      "Counting dice as unordered pairs; $(1,2)$ and $(2,1)$ are different outcomes.",
      "Computing 'at least one' by adding cases and double counting.",
    ],
    amcStrategy:
      "Problems 3 through 15. Write the size of the sample space first, then count favorable outcomes with the same kind of objects (ordered with ordered, unordered with unordered). Reach for the complement whenever the words 'at least' appear. Simplify the fraction fully before matching to a choice.",
    estimatedMinutes: 10,
  },

  "cp-casework": {
    skillId: "cp-casework",
    summary:
      "Casework and complementary counting are how you organize a count that has no single formula. The AMC 10 rewards choosing cases that are disjoint and exhaustive, and recognizing when 'total minus bad' is far easier than 'good' directly.",
    keyIdeas: [
      "Choose the case variable that produces the fewest cases: often the position of a special element, a digit, or the size of a set.",
      "Cases must be disjoint (no outcome in two cases) and exhaustive (every outcome in some case). Write them as a list before counting.",
      "Complementary counting: count everything, subtract what is forbidden. The complement of 'at least one' is 'none'; the complement of 'not all' is 'all'.",
      "Digit-containing problems: count strings with no forbidden digit, subtract from the total. Include leading zeros to keep every position uniform, then adjust.",
      "'No two adjacent': place the unrestricted items, then choose gaps; choosing $k$ non-adjacent positions from $n$ in a row gives $\\binom{n-k+1}{k}$.",
      "Use symmetry to collapse cases: $|x|+|y|=k$ has the same count in each quadrant.",
      "Sanity-check a count by testing a small version of the problem by hand.",
    ],
    formulas: [
      "$|A|=|S|-|A^c|$",
      "Integers in $[a,b]$: $b-a+1$",
      "$k$ non-adjacent positions among $n$ in a row: $\\dbinom{n-k+1}{k}$",
      "Strings of length $n$ over $d$ symbols avoiding one symbol: $(d-1)^n$",
      "Integer solutions of $|x|+|y|=k$ for $k\\ge1$: $4k$",
    ],
    checkpoints: [
      {
        id: "cp-casework-1",
        question: "How many integers are there from $15$ to $80$ inclusive?",
        answer: "66",
        hint: "$b-a+1$.",
        explanation: "$80-15+1=66$.",
      },
      {
        id: "cp-casework-2",
        question: "How many three-digit positive integers contain at least one digit $0$?",
        answer: "171",
        hint: "Count the complement: three-digit numbers with no zero at all.",
        explanation: "There are $900$ three-digit numbers and $9^3=729$ with no zero, so $900-729=171$.",
      },
      {
        id: "cp-casework-3",
        question: "In how many ways can you choose $2$ of $6$ chairs in a row so that the chosen chairs are not adjacent?",
        answer: "10",
        hint: "Total pairs minus adjacent pairs, or use $\\binom{n-k+1}{k}$.",
        explanation: "$\\binom62-5=15-5=10$, which matches $\\binom52=10$.",
      },
      {
        id: "cp-casework-4",
        question: "How many ordered pairs of integers $(x,y)$ satisfy $|x|+|y|=4$?",
        answer: "16",
        hint: "Count one quadrant and use symmetry, or use the $4k$ formula.",
        explanation: "The solutions form a diamond with $4\\cdot4=16$ lattice points.",
      },
    ],
    workedExamples: [
      {
        problem: "How many integers from $1$ to $1000$ inclusive contain the digit $7$ at least once?",
        solution:
          "Count the complement. Write each of $0$ through $999$ as a three-digit string with leading zeros; strings with no $7$ number $9^3=729$ (this includes $000$, which we replace by $1000$, also $7$-free). So $729$ of the numbers $1$ to $1000$ avoid $7$, and $1000-729=271$ contain it. Answer: $271$.",
        answer: "271",
      },
      {
        problem: "Ten books stand in a row. In how many ways can you choose $3$ of them so that no two chosen books are adjacent?",
        solution:
          "Line up the $7$ unchosen books; they create $8$ gaps (including the two ends). Choose $3$ distinct gaps for the chosen books: $\\binom83=56$. Answer: $56$.",
        answer: "56",
      },
      {
        problem: "How many ordered pairs of integers $(x,y)$ satisfy $|x|+|y|\\le3$?",
        solution:
          "Casework on $k=|x|+|y|$. For $k=0$: just $(0,0)$, $1$ pair. For $k\\ge1$: the points form a diamond with $4k$ lattice points (each side has $k$ points, not counting the next corner). Total $1+4(1+2+3)=1+24=25$. Answer: $25$.",
        answer: "25",
      },
    ],
    pitfalls: [
      "Overlapping cases that count an outcome twice.",
      "Missing a boundary case such as $x=0$ or the number $1000$.",
      "Taking the complement of 'at least one' as 'exactly one'.",
      "Forgetting the $+1$ when counting integers in a closed range.",
      "Choosing a case variable with dozens of cases when another has three.",
    ],
    amcStrategy:
      "Problems 5 through 18. Before counting, decide: direct casework or complement? If the forbidden condition is simple ('contains a $7$', 'at least one'), go complement. Write the case list down explicitly and total it in a column so you can audit it. Try $n=3$ or $n=4$ when unsure.",
    estimatedMinutes: 10,
  },

  "cp-stars-bars": {
    skillId: "cp-stars-bars",
    summary:
      "Stars and bars counts ways to distribute identical objects into distinct boxes, and inclusion-exclusion counts unions of overlapping sets. Together they handle 'how many solutions' and 'how many are divisible by $2$ or $3$' questions that appear from problem 8 onward.",
    keyIdeas: [
      "Nonnegative integer solutions to $x_1+\\cdots+x_k=n$: place $k-1$ bars among $n$ stars, $\\binom{n+k-1}{k-1}$ ways.",
      "Positive solutions: give each variable $1$ first, leaving $n-k$ to distribute, $\\binom{n-1}{k-1}$. Any lower bound is handled the same way by substitution.",
      "Upper bounds: count without the bound, then subtract the solutions that violate it (substitute $x_1'=x_1-(\\text{bound}+1)$). With several bounds, inclusion-exclusion.",
      "Identical objects into distinct boxes is stars and bars; distinct objects into distinct boxes is $k^n$; identical into identical is partitions (small cases by hand).",
      "Inclusion-exclusion for two sets: add, subtract the overlap. For three: add singles, subtract pairs, add back the triple.",
      "'Divisible by $a$ or $b$' means multiples of $a$, plus multiples of $b$, minus multiples of $\\text{lcm}(a,b)$.",
      "Derangements (nobody gets their own item): $D_1=0, D_2=1, D_3=2, D_4=9, D_5=44$.",
    ],
    formulas: [
      "Nonnegative solutions: $\\dbinom{n+k-1}{k-1}$; positive solutions: $\\dbinom{n-1}{k-1}$",
      "$|A\\cup B|=|A|+|B|-|A\\cap B|$",
      "$|A\\cup B\\cup C|=|A|+|B|+|C|-|A\\cap B|-|A\\cap C|-|B\\cap C|+|A\\cap B\\cap C|$",
      "Distinct objects into $k$ boxes: $k^n$",
      "$D_n=(n-1)(D_{n-1}+D_{n-2})$; $D_4=9$, $D_5=44$",
    ],
    checkpoints: [
      {
        id: "cp-stars-bars-1",
        question: "How many ordered triples of nonnegative integers $(a,b,c)$ satisfy $a+b+c=5$?",
        answer: "21",
        hint: "$5$ stars and $2$ bars.",
        explanation: "$\\binom{5+2}{2}=\\binom72=21$.",
      },
      {
        id: "cp-stars-bars-2",
        question: "How many ordered triples of positive integers $(a,b,c)$ satisfy $a+b+c=7$?",
        answer: "15",
        hint: "Give each variable $1$ first, or use $\\binom{n-1}{k-1}$.",
        explanation: "$\\binom{6}{2}=15$.",
      },
      {
        id: "cp-stars-bars-3",
        question: "How many integers from $1$ to $100$ are divisible by $3$ or $5$?",
        answer: "47",
        hint: "Inclusion-exclusion; the overlap is the multiples of $15$.",
        explanation: "$33+20-6=47$.",
      },
      {
        id: "cp-stars-bars-4",
        question: "In how many ways can $5$ different prizes be given to $3$ people if any person may receive any number of prizes?",
        answer: "243",
        hint: "The prizes are distinct, so this is not stars and bars.",
        explanation: "Each prize independently goes to one of $3$ people: $3^5=243$.",
      },
    ],
    workedExamples: [
      {
        problem: "In how many ways can $10$ identical candies be given to $4$ children so that each child gets at least one?",
        solution:
          "Give each child one candy first, leaving $6$ to distribute freely among $4$ children: $\\binom{6+3}{3}=\\binom93=84$. Equivalently $\\binom{10-1}{4-1}=84$. Answer: $84$.",
        answer: "84",
      },
      {
        problem: "How many ordered triples of nonnegative integers $(a,b,c)$ satisfy $a+b+c=12$ with $a\\le5$?",
        solution:
          "Without the bound: $\\binom{14}{2}=91$. Violations have $a\\ge6$: set $a'=a-6\\ge0$, so $a'+b+c=6$ has $\\binom82=28$ solutions. Answer: $91-28=63$.",
        answer: "63",
      },
      {
        problem: "How many integers from $1$ to $300$ are divisible by $2$ or $3$ but not by $5$?",
        solution:
          "Divisible by $2$ or $3$: $150+100-50=200$. Among these, divisible by $5$ means divisible by $10$ or $15$: $30+20-10=40$ (the overlap is multiples of $30$). Answer: $200-40=160$.",
        answer: "160",
      },
    ],
    pitfalls: [
      "Using stars and bars for distinct objects (that is $k^n$, not a binomial).",
      "Forgetting to subtract $1$ per variable for positive solutions.",
      "Sign errors in three-set inclusion-exclusion (the triple intersection is added back).",
      "Subtracting the upper-bound violation with the wrong shift ($x\\ge6$ means subtract $6$, not $5$).",
      "Using $ab$ instead of $\\text{lcm}(a,b)$ for the overlap when $a$ and $b$ are not coprime.",
    ],
    amcStrategy:
      "Problems 8 through 20. Translate the story into an equation $x_1+\\cdots+x_k=n$ with explicit bounds, then apply the formula and fix bounds by substitution or subtraction. For 'or' counts, draw a quick Venn diagram and fill the regions from the inside out.",
    estimatedMinutes: 11,
  },

  "cp-expected": {
    skillId: "cp-expected",
    summary:
      "Expected value questions ask for a long-run average, and geometric probability turns a random-point question into an area ratio. The star technique is linearity of expectation, which lets you add expectations of dependent events without ever computing a joint distribution.",
    keyIdeas: [
      "Expected value is the probability-weighted average of outcomes: $E[X]=\\sum x\\,P(X=x)$.",
      "Linearity: $E[X+Y]=E[X]+E[Y]$ always, even if $X$ and $Y$ depend on each other. Write a count as a sum of indicator variables and add their probabilities.",
      "Expected number of 'matches' or 'pairs' problems: count the possible pairs and multiply by the probability that any one pair occurs.",
      "Geometric probability: when a point is chosen uniformly, probability is favorable length over total length, or favorable area over total area. Sketch the region defined by the condition.",
      "Two independent uniform numbers on $[0,a]$ live in an $a\\times a$ square; conditions like $x+y>c$ or $|x-y|<c$ cut off triangles.",
      "Waiting time: the expected number of trials until the first success with probability $p$ is $\\frac1p$.",
      "The expected value need not be a possible outcome; a fair die averages $3.5$.",
    ],
    formulas: [
      "$E[X]=\\displaystyle\\sum_x x\\,P(X=x)$",
      "$E[X+Y]=E[X]+E[Y]$ (no independence needed)",
      "$E[\\text{number of events that occur}]=\\displaystyle\\sum P(\\text{each event})$",
      "$P=\\dfrac{\\text{favorable area}}{\\text{total area}}$ (uniform point)",
      "Expected trials until first success: $\\dfrac1p$",
      "Fair $n$-sided die: $E=\\dfrac{n+1}{2}$",
    ],
    checkpoints: [
      {
        id: "cp-expected-1",
        question: "What is the expected value of a roll of a fair $8$-sided die numbered $1$ through $8$?",
        answer: "\\frac{9}{2}",
        hint: "The average of $1$ through $n$ is $\\frac{n+1}{2}$.",
        explanation: "$\\frac{8+1}{2}=\\frac92$.",
      },
      {
        id: "cp-expected-2",
        question: "A fair coin is flipped $6$ times. What is the expected number of heads?",
        answer: "3",
        hint: "Add the probability of heads over each flip.",
        explanation: "By linearity, $6\\cdot\\frac12=3$.",
      },
      {
        id: "cp-expected-3",
        question: "A real number is chosen uniformly at random from $[0,10]$. What is the probability that it is within $2$ of $5$?",
        answer: "\\frac{2}{5}",
        hint: "Favorable length over total length.",
        explanation: "The interval from $3$ to $7$ has length $4$, so the probability is $\\frac{4}{10}=\\frac25$.",
      },
      {
        id: "cp-expected-4",
        question: "Real numbers $x$ and $y$ are chosen independently and uniformly from $[0,1]$. What is the probability that $x>2y$?",
        answer: "\\frac{1}{4}",
        hint: "Shade the region below the line $y=\\frac{x}{2}$ inside the unit square.",
        explanation: "The region is the triangle with vertices $(0,0)$, $(1,0)$, $(1,\\frac12)$, with area $\\frac12\\cdot1\\cdot\\frac12=\\frac14$.",
      },
    ],
    workedExamples: [
      {
        problem: "Ten people check their hats, and the hats are returned in a random order. What is the expected number of people who receive their own hat?",
        solution:
          "Let $X_i=1$ if person $i$ gets their own hat, else $0$. Each $P(X_i=1)=\\frac1{10}$. By linearity, $E[X_1+\\cdots+X_{10}]=10\\cdot\\frac1{10}=1$. The events are dependent, but linearity does not care. Answer: $1$.",
        answer: "1",
      },
      {
        problem: "Real numbers $x$ and $y$ are chosen independently and uniformly from $[0,2]$. What is the probability that $x+y>3$?",
        solution:
          "The sample space is a $2\\times2$ square of area $4$. The region $x+y>3$ inside it is the triangle with vertices $(1,2),(2,1),(2,2)$, a right triangle with legs $1$, area $\\frac12$. Probability $\\frac{1/2}{4}=\\frac18$. Answer: $\\frac18$.",
        answer: "\\frac{1}{8}",
      },
      {
        problem: "A fair coin is flipped $10$ times. What is the expected number of times two consecutive flips are both heads?",
        solution:
          "There are $9$ consecutive pairs (flips $1$-$2$, $2$-$3$, ..., $9$-$10$). Each pair is HH with probability $\\frac14$. By linearity the expected count is $9\\cdot\\frac14=\\frac94$. Answer: $\\frac94$.",
        answer: "\\frac{9}{4}",
      },
    ],
    pitfalls: [
      "Thinking linearity requires independence; it does not.",
      "Forgetting to divide by the total area (or using the wrong total, e.g. $2$ instead of $4$ for $[0,2]^2$).",
      "Misidentifying the favorable region: check which side of the line the condition picks by testing a point.",
      "Counting consecutive pairs as $10$ instead of $9$.",
      "Rejecting a non-integer expected value as impossible.",
    ],
    amcStrategy:
      "Problems 12 through 22. If the question says 'expected number of', define one indicator per possible occurrence and add probabilities; that is the whole problem. If a point is 'chosen at random', draw the square or segment and shade the condition, then compute an area ratio with triangles.",
    estimatedMinutes: 11,
  },

  "cp-paths-recursion": {
    skillId: "cp-paths-recursion",
    summary:
      "Path counting and recursion cover grid walks, staircase climbs, tilings, and moves between states. These late-paper problems are solved by either a binomial formula for lattice paths or by building a small table of values from a recurrence.",
    keyIdeas: [
      "Lattice paths from $(0,0)$ to $(m,n)$ using unit right and up steps: choose which $n$ of the $m+n$ steps are up, $\\binom{m+n}{n}$.",
      "Paths through a point multiply; paths avoiding a point are total minus paths through it. For two forbidden points, use inclusion-exclusion.",
      "Recurrence by last step: if the last move was a $1$-step or a $2$-step, $a_n=a_{n-1}+a_{n-2}$. Staircases, $2\\times n$ domino tilings, and binary strings with no two consecutive $1$s are all Fibonacci.",
      "State recursions: define one count per state (e.g. 'at vertex A' or 'not at A'), write how each state feeds the next, and iterate in a table.",
      "Always establish base cases carefully ($a_0=1$ is 'do nothing'), then compute forward; check that the totals match a known quantity like $2^n$.",
      "Symmetry between equivalent states cuts the number of variables; a bug on a triangle only needs 'home' and 'away'.",
      "For 'how many sequences of $n$ moves end at the start', look for a pattern in the first few values and verify with a formula like $\\frac{2^n+2(-1)^n}{3}$.",
    ],
    formulas: [
      "Grid paths: $\\dbinom{m+n}{m}$; through $P=(a,b)$: $\\dbinom{a+b}{a}\\dbinom{(m-a)+(n-b)}{m-a}$",
      "$a_n=a_{n-1}+a_{n-2}$ with $a_1=1, a_2=2$ (stairs by $1$ or $2$): $1,2,3,5,8,13,21,34,\\dots$",
      "Binary strings of length $n$ with no two adjacent $1$s: $F_{n+2}$ ($2,3,5,8,\\dots$)",
      "Stairs by $1$, $2$, or $3$: $a_n=a_{n-1}+a_{n-2}+a_{n-3}$",
      "Bug on a triangle, $n$ random moves, ways back home: $\\dfrac{2^n+2(-1)^n}{3}$",
    ],
    checkpoints: [
      {
        id: "cp-paths-recursion-1",
        question: "How many paths from $(0,0)$ to $(3,3)$ use only unit steps right or up?",
        answer: "20",
        hint: "Choose which $3$ of the $6$ steps go up.",
        explanation: "$\\binom63=20$.",
      },
      {
        id: "cp-paths-recursion-2",
        question: "A staircase has $6$ steps. Climbing $1$ or $2$ steps at a time, how many different sequences of climbs reach the top?",
        answer: "13",
        hint: "$a_n=a_{n-1}+a_{n-2}$ with $a_1=1$ and $a_2=2$.",
        explanation: "The counts are $1,2,3,5,8,13$, so $a_6=13$.",
      },
      {
        id: "cp-paths-recursion-3",
        question: "How many binary strings of length $6$ have no two adjacent $1$s?",
        answer: "21",
        hint: "Same Fibonacci recurrence: $2,3,5,8,\\dots$ for lengths $1,2,3,4,\\dots$.",
        explanation: "Lengths $1$ through $6$ give $2,3,5,8,13,21$.",
      },
      {
        id: "cp-paths-recursion-4",
        question: "How many right/up lattice paths from $(0,0)$ to $(4,3)$ pass through $(2,1)$?",
        answer: "18",
        hint: "Multiply the paths to $(2,1)$ by the paths from $(2,1)$ to $(4,3)$.",
        explanation: "$\\binom31\\cdot\\binom42=3\\cdot6=18$.",
      },
    ],
    workedExamples: [
      {
        problem: "How many paths from $(0,0)$ to $(5,4)$ using only unit steps right or up avoid the point $(2,2)$?",
        solution:
          "Total paths: $\\binom94=126$. Paths through $(2,2)$: $\\binom42\\cdot\\binom52=6\\cdot10=60$ (to $(2,2)$, then $3$ right and $2$ up). Avoiding: $126-60=66$. Answer: $66$.",
        answer: "66",
      },
      {
        problem: "A frog climbs a staircase of $8$ steps, jumping up either $1$ or $2$ steps at a time. How many different sequences of jumps reach the top?",
        solution:
          "Let $a_n$ be the count for $n$ steps. The last jump is $1$ or $2$, so $a_n=a_{n-1}+a_{n-2}$ with $a_1=1$, $a_2=2$. Then $a_3=3, a_4=5, a_5=8, a_6=13, a_7=21, a_8=34$. Answer: $34$.",
        answer: "34",
      },
      {
        problem:
          "A bug starts at vertex $A$ of triangle $ABC$. Each move it walks along an edge to one of the other two vertices. How many sequences of $6$ moves end at $A$?",
        solution:
          "Let $a_n$ be the number of $n$-move sequences ending at $A$, and $o_n$ the number ending at a specific other vertex (by symmetry the same for $B$ and $C$). From $A$ the bug goes to $B$ or $C$; from $B$ it goes to $A$ or $C$. So $a_{n+1}=2o_n$ and $o_{n+1}=a_n+o_n$, with $a_0=1$, $o_0=0$. Table: $n=1$: $(0,1)$; $n=2$: $(2,1)$; $n=3$: $(2,3)$; $n=4$: $(6,5)$; $n=5$: $(10,11)$; $n=6$: $(22,21)$. Check: $22+2\\cdot21=64=2^6$. Answer: $22$.",
        answer: "22",
      },
    ],
    pitfalls: [
      "Using $\\binom{m+n}{m}$ with $m$ and $n$ as coordinates when the path does not start at the origin; use the differences.",
      "Wrong base cases ($a_0$ vs. $a_1$) shifting the whole Fibonacci sequence by one.",
      "Forgetting that 'avoid' means subtract paths through the point, not just paths that end there.",
      "Not checking that state counts sum to the total number of move sequences.",
      "Treating 'through $P$ or $Q$' as a simple sum when paths can pass through both.",
    ],
    amcStrategy:
      "Problems 12 through 25. For grids, it is a binomial coefficient with a subtraction. For anything else, define states, write the recurrence in one line, and fill a table for six to ten rows; that is faster and safer than hunting for a closed form. Verify the table against $2^n$ or a hand count for $n=2$.",
    estimatedMinutes: 12,
  },
};

export function lessonFor(skillId: string): Lesson | undefined {
  return LESSONS[skillId];
}
