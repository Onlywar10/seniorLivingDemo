"use client";

// Today's schedule on the Today screen: every activity in order, with "Take attendance" on each one.
import { useState } from "react";
import type { TodayEvent } from "@/data/staff/portal";
import { Icon } from "../../Icon";
import { TakeAttendance } from "../alpha/Attendance";
import { Badge } from "../ui";
import { Drawer } from "./Drawer";

export function Schedule({ events }: { events: TodayEvent[] }) {
  const [open, setOpen] = useState<TodayEvent | null>(null);
  return (
    <section className="sx-card pt-sched" aria-labelledby="pt-sched-h">
      <header className="sx-card-head">
        <div>
          <h2 id="pt-sched-h">Today’s schedule</h2>
          <p>{events.length} activities. Take attendance on a phone at the door.</p>
        </div>
      </header>
      <ol className="pt-sched-list">
        {events.map((e) => (
          <li key={e.id} className={e.state}>
            <time>{e.time}</time>
            <span className="pt-sched-t">
              <b>{e.title}</b>
              <small>
                {e.place}
                {e.kind !== "resident" ? ` · ${e.kind === "public" ? "Public" : "Family"} event` : ""}
                {e.cap ? ` · ${e.taken ?? 0} of ${e.cap} booked` : ""}
              </small>
            </span>
            <span className="pt-sched-a">
              {e.state === "now" && <Badge tone="good">On now</Badge>}
              {e.came !== undefined ? (
                <span className="pt-came"><Icon name="check" /> {e.came} came</span>
              ) : (
                <button type="button" className="sx-btn sx-btn-sm" onClick={() => setOpen(e)} aria-label={`Take attendance: ${e.title}, ${e.time}`}>
                  <Icon name="users" /> Take attendance
                </button>
              )}
            </span>
          </li>
        ))}
        {events.length === 0 && <li className="pt-empty">Nothing on the calendar today.</li>}
      </ol>
      {open && (
        <Drawer title="Take attendance" sub={`${open.title} · ${open.time} · ${open.place}`} onClose={() => setOpen(null)}>
          <TakeAttendance activities={[{ id: open.id, title: open.title, when: open.time, place: open.place, pool: open.pool, expected: open.expected }]} />
        </Drawer>
      )}
    </section>
  );
}
