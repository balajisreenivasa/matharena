// Run by verify.ts with TZ=UTC and APP_TZ=America/New_York: prints the day after
// 2026-09-21 and the day count to AMC 10A. Expected output: "2026-09-22 45".
import { addDays, daysBetween } from "../src/lib/dates";
console.log(addDays("2026-09-21", 1), daysBetween("2026-09-21", "2026-11-05"));
