import { test, expect } from "@playwright/test";

// End-to-end coverage against the real seeded database and a real browser.
// Free practice (/practice) is untracked, so answering there never touches mastery
// or the review queue; the plan pages are checked read-only.

test("home shows the countdown and today's card", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /AMC 10 prep/i })).toBeVisible();
  await expect(page.getByText(/days to 10A/)).toBeVisible();
  await expect(page.getByText(/days to 10B/)).toBeVisible();
  await expect(page.getByText(/Parent checklist/)).toBeVisible();
});

test("plan renders the 7-week template with paper mocks", async ({ page }) => {
  await page.goto("/plan");
  await expect(page.getByRole("heading", { name: /Week 1/ })).toBeVisible();
  await expect(page.getByText(/2016 AMC 10A on AoPS/).first()).toBeVisible();
  await expect(page.getByText(/AMC 10A — exam day/)).toBeVisible();
  await expect(page.getByText(/AMC 10B — exam day/)).toBeVisible();
});

test("lessons index lists all 28 skills and a lesson page renders its sections", async ({ page }) => {
  await page.goto("/lessons");
  const links = page.locator('a[href^="/lessons/"]');
  await expect(links).toHaveCount(28);
  await page.goto("/lessons/nt-modular");
  // Stepped walkthrough: overview first, then key ideas + checkpoints, etc.
  await expect(page.getByRole("heading", { name: /What this is:/ })).toBeVisible();
  await page.getByRole("button", { name: /2\. Key ideas/ }).click();
  await expect(page.getByRole("heading", { name: "Key ideas" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Checkpoints/ })).toBeVisible();
  await expect(page.getByText("Checkpoint 1")).toBeVisible();
  await page.getByRole("button", { name: /4\. Worked examples/ }).click();
  await expect(page.getByRole("heading", { name: /Worked examples/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Go deeper" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Reading, problem sets & videos/ })).toBeVisible();
  // Math in the lesson renders as KaTeX, never raw.
  const body = await page.locator("main").innerText();
  expect(body).not.toMatch(/\\frac|\\pmod|\\begin\{/);
  expect(await page.locator(".katex").count()).toBeGreaterThan(5);
});

test("today page shows the routine blocks", async ({ page }) => {
  await page.goto("/today?date=2026-09-22");
  await expect(page.getByRole("heading", { name: /Warm-up/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Lesson:/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /^Worksheet$/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Corrections/ })).toBeVisible();
});

test("diagnostic page explains both halves", async ({ page }) => {
  await page.goto("/diagnostic");
  await expect(page.getByText(/Part 1 · Paper/)).toBeVisible();
  await expect(page.getByText(/Part 2 · In-app/)).toBeVisible();
});

test("free-response: a miss reveals the answer and the override updates the score", async ({ page }) => {
  await page.goto("/practice?kind=free");
  const input = page.getByLabel("Your answer");
  await expect(input).toBeVisible();
  await input.fill("__definitely_wrong__");
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByText("Not quite", { exact: false })).toBeVisible();
  await expect(page.locator("text=/Score 0\\/1/")).toBeVisible();
  await page.getByRole("button", { name: "I had this right" }).click();
  await expect(page.locator("text=/Score 1\\/1/")).toBeVisible();
});

test("math keyboard inserts at the caret and the preview renders", async ({ page }) => {
  await page.goto("/practice?kind=free");
  const input = page.getByLabel("Your answer");
  await page.getByRole("button", { name: "√" }).click();
  await expect(input).toHaveValue("sqrt()");
  await page.getByRole("button", { name: "2", exact: true }).click();
  await expect(input).toHaveValue("sqrt(2)");
  await expect(page.getByText("Reads as")).toBeVisible();
  await expect(page.locator(".katex").last()).toBeVisible();
  await page.getByRole("button", { name: "Hide keys" }).click();
  await expect(page.getByRole("button", { name: "√" })).toHaveCount(0);
  await page.getByRole("button", { name: "Math keys" }).click();
  await expect(page.getByRole("button", { name: "√" })).toBeVisible();
});

test("Enter submits and Next advances with a fresh input", async ({ page }) => {
  await page.goto("/practice?kind=free");
  const input = page.getByLabel("Your answer");
  await input.fill("42");
  await input.press("Enter");
  await expect(input).toBeDisabled();
  await expect(page.locator("text=/Problem 1 of 25/")).toBeVisible();
  await page.getByRole("button", { name: /Next problem/ }).click();
  await expect(page.locator("text=/Problem 2 of 25/")).toBeVisible();
  await expect(page.getByLabel("Your answer")).toBeEnabled();
  await expect(page.getByLabel("Your answer")).toHaveValue("");
});

test("Check is disabled until something is typed", async ({ page }) => {
  await page.goto("/practice?kind=free");
  await expect(page.getByRole("button", { name: "Check" })).toBeDisabled();
  await page.getByLabel("Your answer").fill("7");
  await expect(page.getByRole("button", { name: "Check" })).toBeEnabled();
});

test("skill filter only serves problems tagged with that skill", async ({ page }) => {
  await page.goto("/practice?skill=nt-modular");
  await expect(page.locator("text=/remainders & units digits practice/")).toBeVisible();
});

test("no raw LaTeX source leaks in statements or solutions", async ({ page }) => {
  const RAW = /\\\[|\\\]|\\begin\{(align|aligned|gather|equation|cases|pmatrix|bmatrix|split)|\\frac|\\dfrac|\\boxed/;
  await page.goto("/practice?topic=algebra&kind=free");
  for (let i = 0; i < 8; i++) {
    expect(await page.locator("main").innerText(), `raw LaTeX in statement ${i + 1}`).not.toMatch(RAW);
    await page.getByLabel("Your answer").fill("0");
    await page.getByRole("button", { name: "Check" }).click();
    expect(await page.locator("main").innerText(), `raw LaTeX in solution ${i + 1}`).not.toMatch(RAW);
    await page.getByRole("button", { name: /Next problem/ }).click();
  }
});

test("geometry problems with a figure show the rendered diagram inline", async ({ page }) => {
  await page.goto("/practice?topic=geometry&kind=diagram");
  const img = page.locator('img[src^="/diagrams/"]').first();
  await expect(img).toBeVisible();
  // The SVG must actually load (a broken path would still be "visible").
  await expect.poll(async () => img.evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  // No Asymptote source leaks into the statement.
  expect(await page.locator("main").innerText()).not.toMatch(/\[asy\]|\bdraw\(|\blabel\(/);
});

test("multiple-choice problems render five KaTeX choices and grade by letter", async ({ page }) => {
  await page.goto("/practice?kind=mc");
  const choices = page.locator("main button").filter({ has: page.locator("span", { hasText: /^[A-E]$/ }) });
  await expect(choices).toHaveCount(5);
  // Choice values render as math, never as raw TeX such as "text{...}" or "\frac".
  expect(await page.locator("main").innerText()).not.toMatch(/\\frac|\\text|(^|\s)text\{|\\qquad|\\textbf/);
  await choices.first().click();
  await expect(page.locator("text=/Correct!|Not quite/")).toBeVisible();
});

test("no console errors while practising", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("/practice?kind=free");
  await page.getByLabel("Your answer").fill("5");
  await page.getByRole("button", { name: "Check" }).click();
  await page.getByRole("button", { name: /Next problem/ }).click();
  expect(errors).toEqual([]);
});
