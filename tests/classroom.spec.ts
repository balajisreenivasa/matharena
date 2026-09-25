import { test, expect, type Browser } from "@playwright/test";

// Parent/teacher classroom flow, end to end: a parent signs up, creates a classroom,
// adds the Playwright student by email, and sees the student's status; the student
// sees the membership on their profile and can leave.
const STUDENT_EMAIL = "playwright@matharena.test";
const PARENT_EMAIL = "playwright-parent@matharena.test";
const PASSWORD = "playwright1";

async function signInOrUp(browser: Browser, email: string, name: string, role: "parent" | "teacher") {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login") || u.searchParams.has("error"), { timeout: 60_000 }).catch(() => {});
  if (page.url().includes("/login")) {
    await page.goto("/signup");
    await page.getByLabel("Name").fill(name);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel(/Password/).fill(PASSWORD);
    await page.getByLabel("I am a").selectOption(role);
    await page.getByRole("button", { name: "Create profile" }).click();
  }
  await expect(page).not.toHaveURL(/\/(login|signup)/);
  return { ctx, page };
}

test("parent creates a classroom, adds the student by email, and sees their status", async ({ browser, page: studentPage }) => {
  const { ctx, page } = await signInOrUp(browser, PARENT_EMAIL, "Playwright Parent", "parent");
  try {
    // Educators land on the classroom view, not the study plan.
    await page.goto("/");
    await expect(page).toHaveURL(/\/classroom/);
    await expect(page.getByRole("heading", { name: "Classrooms" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Today" })).toHaveCount(0);

    const name = `PW room ${Date.now()}`;
    await page.getByPlaceholder(/Our family|Period 3/).fill(name);
    await page.getByRole("button", { name: "Create" }).click();
    await expect(page).toHaveURL(/\/classroom\/[a-z0-9]+$/);
    await expect(page.getByRole("heading", { name })).toBeVisible();
    const code = (await page.locator("code").first().innerText()).trim();
    expect(code).toMatch(/^[A-Z2-9]{6}$/);

    await page.getByPlaceholder("student@example.com").fill(STUDENT_EMAIL);
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText(/added\./)).toBeVisible();
    await expect(page.getByRole("link", { name: "Playwright Student" })).toBeVisible();
    await expect(page.getByText("Needs to do")).toBeVisible();

    // Per-student report.
    await page.getByRole("link", { name: "Playwright Student" }).click();
    await expect(page.getByRole("heading", { name: "Playwright Student" })).toBeVisible();
    await expect(page.getByText("Projected AMC 10")).toBeVisible();
    await expect(page.getByText("Mastery by skill")).toBeVisible();
    await expect(page.getByText("Coming up")).toBeVisible();

    // The student sees the membership on their profile and can leave.
    await studentPage.goto("/profile");
    await expect(studentPage.getByText(name)).toBeVisible();
    await studentPage.getByRole("button", { name: "leave" }).first().click();
    await expect(studentPage.getByText("Left the classroom.")).toBeVisible();

    // ...and can re-join with the code.
    await studentPage.getByPlaceholder("Join code").fill(code.toLowerCase());
    await studentPage.getByRole("button", { name: "Join" }).click();
    await expect(studentPage.getByText(new RegExp(`Joined ${name}`))).toBeVisible();

    // A student cannot open the educator pages.
    await studentPage.goto("/classroom");
    await expect(studentPage).not.toHaveURL(/\/classroom/);

    // Clean up: delete the classroom.
    await page.goto("/classroom");
    await page.getByRole("link", { name }).click();
    await page.getByRole("button", { name: "Delete this classroom" }).click();
    await expect(page.getByText("Classroom deleted.")).toBeVisible();
  } finally {
    await ctx.close();
  }
});
