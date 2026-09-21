import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false, // the dev server + SQLite are happier serialized
  workers: 1,
  reporter: [["list"]],
  timeout: 60_000,
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    { name: "chromium", use: { ...devices["Desktop Chrome"], storageState: "test-results/.auth/student.json" }, dependencies: ["setup"], testIgnore: /auth\.setup\.ts/ },
  ],
  // Reuse a dev server if one is already up (BASE_URL=http://localhost:3001 to point at
  // another port), otherwise start one. Never run two dev servers against one .next dir.
  webServer: {
    command: "npm run dev",
    url: process.env.BASE_URL ?? "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
