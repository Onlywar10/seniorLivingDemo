"use client";

import { useEffect, useState } from "react";
import { TZ } from "@/lib/clock";

interface Item {
  time: string;
  name: string;
  room: string;
}

const LENGTH = 60;

const minutes = (t: string) => {
  const m = t.match(/^(\d{1,2}):(\d{2}) (am|pm)$/);
  if (!m) return -1;
  return ((Number(m[1]) % 12) + (m[3] === "pm" ? 12 : 0)) * 60 + Number(m[2]);
};

const nowMinutes = () => {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(new Date());
  const get = (t: string) => Number(p.find((x) => x.type === t)!.value);
  return get("hour") * 60 + get("minute");
};

/** Today's list with what is on right now marked, and a line saying what is on or coming up next. */
export function TodayLive({ events, show = 4 }: { events: Item[]; show?: number }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(nowMinutes());
    const first = window.setTimeout(tick, 0);
    const t = window.setInterval(tick, 30_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(t);
    };
  }, []);

  const on = now === null ? -1 : events.findIndex((e) => now >= minutes(e.time) && now < minutes(e.time) + LENGTH);
  const next = now === null ? -1 : events.findIndex((e) => minutes(e.time) > now);

  // Show a window of the day that starts with what is on now (or next), so the list never looks stale.
  const focus = on >= 0 ? on : next >= 0 ? next : now === null ? 0 : events.length;
  const start = Math.max(0, Math.min(focus, events.length - show));
  const shown = events.slice(start, start + show);

  let line = null;
  if (now !== null) {
    if (on >= 0) {
      line = (
        <>
          <b>On now:</b> {events[on].name}, {events[on].room}
        </>
      );
    } else if (next >= 0) {
      const wait = minutes(events[next].time) - now;
      line = (
        <>
          <b>{wait <= 45 ? `Starting in ${wait} min:` : `Up next, ${events[next].time}:`}</b> {events[next].name}
        </>
      );
    } else {
      line = <b>That’s everything for today. Tomorrow’s calendar is up.</b>;
    }
  }

  return (
    <>
      <p className={`live-line ${line ? "is-on" : ""}`} aria-live="polite">
        <span className="live-dot" aria-hidden="true" />
        <span>{line ?? " "}</span>
      </p>
      <ul className="events">
        {shown.map((e, n) => (
          <li key={e.time + e.name} className={start + n === on ? "is-now" : start + n === next && on < 0 ? "is-next" : undefined}>
            <time>{e.time}</time>
            <div>
              <span className="nm">{e.name}</span>
              <span className="rm">{e.room}</span>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
