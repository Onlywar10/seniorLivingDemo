import type { Metadata } from "next";
import { CalendarEditor, type EdEvent } from "@/components/staff/CalendarEditor";
import { PageHead } from "@/components/staff/ui";
import { cats, eventsBetween, isHarbor, rooms } from "@/data/calendar";
import { rsvpFor } from "@/data/staff";
import { WEEKDAYS, addDays, iso, sundayOf, today } from "@/lib/clock";

export const metadata: Metadata = { title: "Calendar" };

const shared = new Set<string>([rooms.lobby, "All floors"]);

export default function CalendarPage() {
  const t = today();
  const start = sundayOf(t);
  const days = eventsBetween(start, 42, iso(t));
  const out: EdEvent[] = [];
  for (const d of days) {
    // a room double-booked at the same start time
    const seen = new Map<string, string>();
    for (const e of d.events) {
      const key = `${e.room}|${e.start}`;
      const clash = !shared.has(e.room) && seen.has(key) ? seen.get(key) : undefined;
      if (!shared.has(e.room)) seen.set(key, e.title);
      const r = e.cap ? rsvpFor(e.id, e.taken ?? 0, e.waitlist ?? 0, isHarbor(e)) : undefined;
      out.push({
        id: e.id, date: e.date, start: e.start, end: e.end, title: e.title, room: e.room, cat: e.cat, color: cats[e.cat].color, catLabel: cats[e.cat].label,
        cap: e.cap, taken: e.taken, waitlist: e.waitlist, harbor: isHarbor(e), leader: e.leader, desc: e.desc,
        rule: e.special ? undefined : `Every ${WEEKDAYS[d.date.getUTCDay()]}`,
        going: r?.going, waiting: r?.waiting, clash,
      });
    }
  }
  // mark the first event of each clash too
  for (const e of out) if (e.clash) { const o = out.find((x) => x.date === e.date && x.room === e.room && x.start === e.start && x.title === e.clash); if (o) o.clash = e.title; }

  return (
    <>
      <PageHead title="Calendar" sub="The activity calendar on the website, the TV channel and the printed calendar all come from here." />
      <CalendarEditor events={out} weekStarts={[0, 1, 2, 3, 4, 5].map((w) => iso(addDays(start, w * 7)))} todayIso={iso(t)} rooms={[...Object.values(rooms), "All floors"]} />
    </>
  );
}
