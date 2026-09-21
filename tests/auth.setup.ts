import { test as setup, expect } from "@playwright/test";

// Creates (or signs into) the test student once and saves the session cookie for
// every other test. Runs against the same dev server the suite uses.
export const STORAGE = "test-results/.auth/student.json";
const EMAIL = "playwright@matharena.test";
const PASSWORD = "playwright1";

setup("sign up or sign in the test student", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  // Server-action redirect: wait until we either leave /login or come back with ?error.
  await page.waitForURL((u) => !u.pathname.startsWith("/login") || u.searchParams.has("error"), { timeout: 60_000 }).catch(() => {});
  if (page.url().includes("/login")) {
    await page.goto("/signup");
    await page.getByLabel("Name").fill("Playwright Student");
    await page.getByLabel("Email").fill(EMAIL);
    await page.getByLabel(/Password/).fill(PASSWORD);
    await page.getByRole("button", { name: "Create profile" }).click();
  }
  await expect(page).not.toHaveURL(/\/(login|signup)/);
  await page.context().storageState({ path: STORAGE });
});
