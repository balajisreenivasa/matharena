// All plan dates are local-calendar strings "YYYY-MM-DD" so a worksheet assigned
// for "today" is the same row whether it is built at 6:30am by the scheduler or
// at 8pm by the student.

// The family's calendar timezone. A hosted server runs in UTC, so "today" must be
// computed in the student's zone or the 8 PM summary would describe tomorrow.
export const APP_TZ = process.env.APP_TZ || process.env.TZ || "";

const fmtCache = new Map<string, Intl.DateTimeFormat>();
function fmtFor(tz: string): Intl.DateTimeFormat {
  let f = fmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-CA", { timeZone: tz || undefined, year: "numeric", month: "2-digit", day: "2-digit" });
    fmtCache.set(tz, f);
  }
  return f;
}

export function toISODate(d: Date): string {
  if (APP_TZ) {
    try {
      return fmtFor(APP_TZ).format(d); // en-CA gives YYYY-MM-DD
    } catch {}
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayStr(): string {
  return toISODate(new Date());
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, n: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

// b - a in whole days (positive when b is later).
export function daysBetween(a: string, b: string): number {
  const ms = parseISODate(b).getTime() - parseISODate(a).getTime();
  return Math.round(ms / 86_400_000);
}

export function weekday(iso: string): number {
  return parseISODate(iso).getDay(); // 0 = Sunday
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function fmtShort(iso: string): string {
  const d = parseISODate(iso);
  return `${DAYS[d.getDay()]} ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function fmtLong(iso: string): string {
  const d = parseISODate(iso);
  return `${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getDay()]}, ${
    ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][d.getMonth()]
  } ${d.getDate()}, ${d.getFullYear()}`;
}

export function isValidISODate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(parseISODate(s).getTime());
}
