// Every date on the site is computed from the current day in the community's own time zone,
// so the calendar, menus and news always read as this week's.

export const TZ = "America/Los_Angeles";

const DAY = 86_400_000;
export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Today's calendar date in Pacific time, as a UTC-midnight Date (safe for day arithmetic). */
export function today(): Date {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "numeric", day: "numeric" }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  return new Date(Date.UTC(get("year"), get("month") - 1, get("day")));
}

export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY);
/** 0 = Monday … 6 = Sunday */
export const weekdayIndex = (d: Date) => (d.getUTCDay() + 6) % 7;
export const mondayOf = (d: Date) => addDays(d, -weekdayIndex(d));
export const iso = (d: Date) => d.toISOString().slice(0, 10);

export const dayName = (d: Date) => WEEKDAYS[weekdayIndex(d)];
export const monthName = (d: Date) => MONTHS[d.getUTCMonth()];
/** "29 Oct" */
export const shortDate = (d: Date) => `${d.getUTCDate()} ${monthName(d).slice(0, 3)}`;
/** "Thursday 29 October" */
export const longDate = (d: Date) => `${dayName(d)} ${d.getUTCDate()} ${monthName(d)}`;
/** "Thu 29 Oct" */
export const dayShort = (d: Date) => `${dayName(d).slice(0, 3)} ${shortDate(d)}`;
/** "Thursday 29 October 2026" */
export const fullDate = (d: Date) => `${longDate(d)} ${d.getUTCFullYear()}`;
/** "Monday 26 – Sunday 1 November 2026" */
export function weekLabel(monday: Date) {
  const sun = addDays(monday, 6);
  const sameMonth = monday.getUTCMonth() === sun.getUTCMonth();
  return `Monday ${monday.getUTCDate()}${sameMonth ? "" : " " + monthName(monday)} – Sunday ${sun.getUTCDate()} ${monthName(sun)} ${sun.getUTCFullYear()}`;
}

/** Relative to today: offset in days → Date */
export const rel = (n: number) => addDays(today(), n);

/** "Good morning" / "Good afternoon" / "Good evening" in Pacific time. */
export function greeting() {
  const h = Number(new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", hourCycle: "h23" }).format(new Date()));
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}
