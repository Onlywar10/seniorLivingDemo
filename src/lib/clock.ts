// Every date on the site is computed from the current day in Folsom's time zone,
// so the calendar, menus and news always read as today's.

export const TZ = "America/Los_Angeles";

const DAY = 86_400_000;
export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Today's calendar date in Pacific time, as a UTC-midnight Date (safe for day arithmetic). */
export function today(): Date {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "numeric", day: "numeric" }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  return new Date(Date.UTC(get("year"), get("month") - 1, get("day")));
}

/** Minutes since midnight, Pacific time. */
export function nowMinutes(): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  return get("hour") * 60 + get("minute");
}

export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY);
/** 0 = Sunday … 6 = Saturday (calendar weeks start on Sunday) */
export const dow = (d: Date) => d.getUTCDay();
export const sundayOf = (d: Date) => addDays(d, -dow(d));
export const iso = (d: Date) => d.toISOString().slice(0, 10);
export const fromIso = (s: string) => new Date(s + "T00:00:00Z");
export const sameDay = (a: Date, b: Date) => iso(a) === iso(b);

export const dayName = (d: Date) => WEEKDAYS[dow(d)];
export const monthName = (d: Date) => MONTHS[d.getUTCMonth()];
/** "Oct 29" */
export const shortDate = (d: Date) => `${monthName(d).slice(0, 3)} ${d.getUTCDate()}`;
/** "Thursday, October 29" */
export const longDate = (d: Date) => `${dayName(d)}, ${monthName(d)} ${d.getUTCDate()}`;
/** "Thu, Oct 29" */
export const dayShort = (d: Date) => `${dayName(d).slice(0, 3)}, ${shortDate(d)}`;
/** "Thursday, October 29, 2026" */
export const fullDate = (d: Date) => `${longDate(d)}, ${d.getUTCFullYear()}`;
/** "October 2026" */
export const monthLabel = (d: Date) => `${monthName(d)} ${d.getUTCFullYear()}`;

/** 570 → "9:30 am"; 720 → "12:00 pm" */
export function fmtTime(min: number): string {
  const h = Math.floor(min / 60), m = min % 60;
  const ap = h < 12 ? "am" : "pm";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ap}`;
}
/** "9:00–9:45 am", "11:30 am–12:30 pm", or "6:00 pm" */
export function fmtRange(start: number, end?: number): string {
  if (end == null) return fmtTime(start);
  const a = fmtTime(start), b = fmtTime(end);
  return a.slice(-2) === b.slice(-2) ? `${a.slice(0, -3)}–${b}` : `${a}–${b}`;
}

/** Relative to today: offset in days → Date */
export const rel = (n: number) => addDays(today(), n);

/** Weeks of the month grid (Sunday first) covering the given month. */
export function monthGrid(year: number, month: number): Date[][] {
  const first = new Date(Date.UTC(year, month, 1));
  let d = sundayOf(first);
  const weeks: Date[][] = [];
  do {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(d, i)));
    d = addDays(d, 7);
  } while (d.getUTCMonth() === month);
  return weeks;
}

/** "Good morning" / "Good afternoon" / "Good evening" in Pacific time. */
export function greeting() {
  const h = Math.floor(nowMinutes() / 60);
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

/** Small stable hash, for deterministic counts (seats taken, opens, views). */
export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
