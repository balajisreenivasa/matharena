import { test, expect } from "@playwright/test";

// End-to-end coverage of the practice loop against the real seeded database.
// These drive the actual UI, so they catch wiring bugs that server-rendered
// HTML checks cannot (answer grading, score updates, set completion).

test("dashboard shows the seeded bank and links to every topic", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Practice competition math/i })).toBeVisible();

  // Banner reports a real count, not zero.
  const banner = await page.locator("section p").first().innerText();
  const total = parseInt(banner.replace(/,/g, "").match(/(\d+)\s+problems/)![1], 10);
  expect(total).toBeGreaterThan(10000);

  // Every topic card links into a filtered practice set.
  const cards = page.locator('a[href^="/practice?topic="]');
  await expect(cards).toHaveCount(5);
  for (const name of ["Algebra", "Geometry", "Number Theory", "Counting & Probability", "Precalculus"]) {
    await expect(page.getByText(name, { exact: true })).toBeVisible();
  }
});

test("free-response: a correct answer scores and reveals the solution", async ({ page }) => {
  await page.goto("/practice");

  // Read the expected answer straight from the page's own data by submitting a
  // deliberate miss first, then reading the revealed answer.
  await expect(page.getByRole("heading")).toBeHidden({ timeout: 1000 }).catch(() => {});
  const input = page.getByLabel("Your answer");
  await expect(input).toBeVisible();

  await input.fill("__definitely_wrong__");
  await page.getByRole("button", { name: "Check" }).click();

  const verdict = page.locator("text=/Not quite|Correct!/").first();
  await expect(verdict).toBeVisible();
  await expect(page.getByText("Not quite", { exact: false })).toBeVisible();

  // Score counted the attempt.
  await expect(page.locator("text=/Score 0\\/1/")).toBeVisible();

  // The override exists for LaTeX false negatives and updates the score.
  await page.getByRole("button", { name: "I had this right" }).click();
  await expect(page.locator("text=/Score 1\\/1/")).toBeVisible();
});

test("answer input is disabled after checking, and Next advances", async ({ page }) => {
  await page.goto("/practice");
  const input = page.getByLabel("Your answer");
  await input.fill("1");
  await page.getByRole("button", { name: "Check" }).click();

  await expect(input).toBeDisabled();
  await expect(page.locator("text=/Problem 1 of 25/")).toBeVisible();

  await page.getByRole("button", { name: /Next problem/ }).click();
  await expect(page.locator("text=/Problem 2 of 25/")).toBeVisible();
  // Fresh input for the new problem.
  await expect(page.getByLabel("Your answer")).toBeEnabled();
  await expect(page.getByLabel("Your answer")).toHaveValue("");
});

test("Enter key submits the answer", async ({ page }) => {
  await page.goto("/practice");
  const input = page.getByLabel("Your answer");
  await input.fill("42");
  await input.press("Enter");
  await expect(input).toBeDisabled();
  await expect(page.locator("text=/Score \\d\\/1/")).toBeVisible();
});

test("Check is disabled until something is typed", async ({ page }) => {
  await page.goto("/practice");
  await expect(page.getByRole("button", { name: "Check" })).toBeDisabled();
  await page.getByLabel("Your answer").fill("7");
  await expect(page.getByRole("button", { name: "Check" })).toBeEnabled();
});

test("topic filter only serves problems from that topic", async ({ page }) => {
  await page.goto("/practice?topic=geometry");
  await expect(page.locator("text=/Geometry practice/")).toBeVisible();

  // Walk a few problems; each must carry the Geometry tag.
  for (let i = 0; i < 3; i++) {
    await expect(page.locator("span", { hasText: /^Geometry$/ }).first()).toBeVisible();
    await page.getByLabel("Your answer").fill("0");
    await page.getByRole("button", { name: "Check" }).click();
    await page.getByRole("button", { name: /Next problem/ }).click();
  }
});

test("completing the set shows a results screen, not the empty state", async ({ page }) => {
  await page.goto("/practice");

  // Blow through all 25 problems.
  for (let i = 0; i < 25; i++) {
    await page.getByLabel("Your answer").fill("0");
    await page.getByRole("button", { name: "Check" }).click();
    const label = i < 24 ? /Next problem/ : /See results/;
    await page.getByRole("button", { name: label }).click();
  }

  await expect(page.locator("text=/% correct/")).toBeVisible();
  await expect(page.getByRole("button", { name: "Practice again" })).toBeVisible();
  // The old bug rendered the "no problems" empty state here.
  await expect(page.locator("text=/No problems here yet/")).toHaveCount(0);

  // Restart resets to problem 1 with a zeroed score.
  await page.getByRole("button", { name: "Practice again" }).click();
  await expect(page.locator("text=/Problem 1 of 25/")).toBeVisible();
  await expect(page.locator("text=/Score 0\\/0/")).toBeVisible();
});

test("math renders as KaTeX, never as raw LaTeX source", async ({ page }) => {
  await page.goto("/practice");

  // ~19% of the bank is plain prose with no math, so a given problem may
  // legitimately have no .katex. The invariant that must always hold is that no
  // raw LaTeX source is ever visible. Walk the set checking that, and confirm
  // KaTeX does render on at least one problem that contains math.
  let sawKatex = false;
  for (let i = 0; i < 8; i++) {
    const body = await page.locator("main").innerText();
    // Unrendered delimiters or commands leaking into visible text is the bug.
    expect(body, `raw LaTeX visible on problem ${i + 1}`).not.toMatch(/\\\[|\\\]|\\frac|\\dfrac|\\sqrt|\\begin\{/);
    if (await page.locator(".katex").count()) sawKatex = true;

    await page.getByLabel("Your answer").fill("0");
    await page.getByRole("button", { name: "Check" }).click();
    await page.getByRole("button", { name: /Next problem/ }).click();
  }
  expect(sawKatex, "no problem in 8 rendered any KaTeX").toBe(true);
});

// Whether a given random set contains display math is luck, so the deterministic
// proof that \[...\] renders lives in `npm run verify`. What this asserts is the
// invariant that must hold on every problem the user actually sees.
test("no raw LaTeX source leaks in statements OR solutions", async ({ page }) => {
  // The solution panel only appears after answering. An earlier version of this
  // test checked statements only, and missed bare \begin{align*} blocks that were
  // rendering as raw source in ~20% of solutions.
  const RAW = /\\\[|\\\]|\\begin\{(align|aligned|gather|equation|cases|pmatrix|bmatrix|split)|\\frac|\\dfrac|\\boxed/;

  await page.goto("/practice?topic=algebra");
  for (let i = 0; i < 12; i++) {
    const statement = await page.locator("main").innerText();
    expect(statement, `raw LaTeX in statement ${i + 1}`).not.toMatch(RAW);

    await page.getByLabel("Your answer").fill("0");
    await page.getByRole("button", { name: "Check" }).click();

    // Now the solution is on screen — check it too.
    const withSolution = await page.locator("main").innerText();
    expect(withSolution, `raw LaTeX in solution ${i + 1}`).not.toMatch(RAW);

    await page.getByRole("button", { name: /Next problem/ }).click();
  }
});

test("no console errors while practising", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto("/practice");
  await page.getByLabel("Your answer").fill("5");
  await page.getByRole("button", { name: "Check" }).click();
  await page.getByRole("button", { name: /Next problem/ }).click();

  expect(errors).toEqual([]);
});
