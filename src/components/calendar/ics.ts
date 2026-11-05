import type { CalEvent } from "@/data/shared";

/** Where the events take place: the community’s name, address and web domain (for event UIDs). */
export interface IcsPlace { name: string; addressLine: string; domain: string }

const pad = (n: number) => String(n).padStart(2, "0");
const stamp = (date: string, min: number) => `${date.replace(/-/g, "")}T${pad(Math.floor(min / 60))}${pad(min % 60)}00`;
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

/** An iCalendar file for the given events, in Pacific time. */
export function buildIcs(events: CalEvent[], name: string, place: IcsPlace): string {
  const now = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${place.name}//Activity Calendar//EN`,
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${esc(name)}`,
    "X-WR-TIMEZONE:America/Los_Angeles",
    "BEGIN:VTIMEZONE",
    "TZID:America/Los_Angeles",
    "BEGIN:DAYLIGHT",
    "TZOFFSETFROM:-0800",
    "TZOFFSETTO:-0700",
    "TZNAME:PDT",
    "DTSTART:19700308T020000",
    "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU",
    "END:DAYLIGHT",
    "BEGIN:STANDARD",
    "TZOFFSETFROM:-0700",
    "TZOFFSETTO:-0800",
    "TZNAME:PST",
    "DTSTART:19701101T020000",
    "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU",
    "END:STANDARD",
    "END:VTIMEZONE",
  ];
  for (const e of events) {
    const desc = [e.desc, e.leader ? `With ${e.leader}` : ""].filter(Boolean).join(" ");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.id}@${place.domain}`,
      `DTSTAMP:${now}`,
      `DTSTART;TZID=America/Los_Angeles:${stamp(e.date, e.start)}`,
      `DTEND;TZID=America/Los_Angeles:${stamp(e.date, e.end ?? e.start + 60)}`,
      `SUMMARY:${esc(e.title)}`,
      `LOCATION:${esc([e.room, place.name, place.addressLine].filter(Boolean).join(", "))}`,
      ...(desc ? [`DESCRIPTION:${esc(desc)}`] : []),
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadIcs(events: CalEvent[], name: string, file: string, place: IcsPlace) {
  const blob = new Blob([buildIcs(events, name, place)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** The ICS place for a community's site facts. */
export const icsPlace = (site: { name: string; addressLine: string; email: string }): IcsPlace => ({
  name: site.name,
  addressLine: site.addressLine,
  domain: site.email.split("@")[1] ?? "wrenhaven.example",
});
