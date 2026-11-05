import type { Metadata } from "next";
import { CalendarEditor, type EdEvent } from "@/components/staff/CalendarEditor";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { PageHead } from "@/components/staff/ui";
import { cats, isLantern, kindOf } from "@/data/shared";
import { rsvpFor } from "@/data/staff";
import { getStaffCommunity } from "@/data/staff/server";
import { WEEKDAYS, addDays, iso, sundayOf, today } from "@/lib/clock";

export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage() {
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Calendar" />;
  const { s, c } = sc;
  const { rooms, staffEventsBetween: eventsBetween } = c;
  // Departure points and "All floors" can host several things at once.
  const shared = new Set<string>([rooms.lobby ?? "Lobby", "All floors"]);
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
      const r = e.cap ? rsvpFor(s, e.id, e.taken ?? 0, e.waitlist ?? 0, isLantern(e)) : undefined;
      out.push({
        id: e.id, kind: kindOf(e), date: e.date, start: e.start, end: e.end, title: e.title, room: e.room, cat: e.cat, color: cats[e.cat].color, catLabel: cats[e.cat].label,
        cap: e.cap, taken: e.taken, waitlist: e.waitlist, lantern: isLantern(e), leader: e.leader, desc: e.desc,
        rule: e.special ? undefined : `Every ${WEEKDAYS[d.date.getUTCDay()]}`,
        going: r?.going, waiting: r?.waiting, clash,
      });
    }
  }
  // mark the first event of each clash too
  for (const e of out) if (e.clash) { const o = out.find((x) => x.date === e.date && x.room === e.room && x.start === e.start && x.title === e.clash); if (o) o.clash = e.title; }

  return (
    <>
      <PageHead title="Calendar" sub="The website calendar, the weekly family digest and the printed large-print calendar all come from here. Seats, waitlists and departure points stay with staff." />
      <CalendarEditor events={out} weekStarts={[0, 1, 2, 3, 4, 5].map((w) => iso(addDays(start, w * 7)))} todayIso={iso(t)} rooms={[...Object.values(rooms), "All floors"]} />
    </>
  );
}
