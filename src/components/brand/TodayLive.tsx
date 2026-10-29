"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fmtRange, fmtTime, nowMinutes } from "@/lib/clock";
import { Icon } from "@/components/Icon";

export interface LiveEvent {
  id: string;
  start: number;
  end?: number;
  title: string;
  room: string;
  color: string;
  label: string;
  leader?: string;
}

const endOf = (e: LiveEvent) => e.end ?? e.start + 60;

function until(mins: number) {
  if (mins < 60) return `In ${mins} min`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m ? `In ${h} hr ${m} min` : `In ${h} hr`;
}

/** Live "now / next / rest of today" panel. Starts from the server's minute, then follows the clock. */
export function TodayLive({ events, tomorrow, tomorrowLabel, serverNow }: { events: LiveEvent[]; tomorrow: LiveEvent[]; tomorrowLabel: string; serverNow: number }) {
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    setNow(nowMinutes());
    const t = window.setInterval(() => setNow(nowMinutes()), 30_000);
    return () => window.clearInterval(t);
  }, []);

  const current = events.filter((e) => e.start <= now && now < endOf(e));
  const upcoming = events.filter((e) => e.start > now);
  const next = upcoming.filter((e) => e.start === upcoming[0]?.start);
  const later = upcoming.filter((e) => !next.includes(e));
  // Once the last event has started, look ahead to tomorrow.
  const dayDone = !upcoming.length;
  const shown = later.slice(0, 6);

  return (
    <div className="hm-live" aria-live="polite">
      <div className="hm-now-row">
        <div className="hm-now">
          <p className="hm-now-k">
            <span className="hm-pulse" aria-hidden="true" /> Happening now
          </p>
          {current.length ? (
            <ul>
              {current.slice(0, 3).map((e) => (
                <li key={e.id} style={{ ["--cc" as string]: e.color }}>
                  <b>{e.title}</b>
                  <span>{`${e.room} · until ${fmtTime(endOf(e))}`}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="hm-now-quiet">{!upcoming.length ? (now < 1140 ? "That’s a wrap for today’s calendar. The Rendezvous and Natoma Café are open until 7:00 pm." : "That’s a wrap for today. Here’s what’s on tomorrow.") : "A quiet moment — coffee at The Rendezvous, a book in the Living Room, or a stroll in the courtyard."}</p>
          )}
        </div>
        <div className="hm-next">
          <p className="hm-now-k">{dayDone ? tomorrowLabel : "Up next"}</p>
          {(dayDone ? tomorrow.slice(0, 1) : next.slice(0, 2)).map((e) => (
            <div key={e.id} className="hm-next-ev" style={{ ["--cc" as string]: e.color }}>
              <time>{dayDone ? fmtTime(e.start) : until(e.start - now)}</time>
              <b>{e.title}</b>
              <span>{dayDone ? e.room : `${fmtTime(e.start)} · ${e.room}`}</span>
            </div>
          ))}
        </div>
      </div>

      <h3 className="hm-rest-h">{dayDone ? `${tomorrowLabel}, from the calendar` : "Later today"}</h3>
      <ul className="hm-rest">
        {(dayDone ? tomorrow.slice(1, 7) : shown).map((e) => (
          <li key={e.id} style={{ ["--cc" as string]: e.color }}>
            <time>{fmtRange(e.start, e.end)}</time>
            <span className="hm-rest-t">
              <b>{e.title}</b>
              <span>{e.room}</span>
            </span>
            <span className="hm-rest-cat">{e.label}</span>
          </li>
        ))}
        {!dayDone && !shown.length && <li className="hm-rest-empty">That’s the last event on today’s calendar.</li>}
      </ul>
      <Link className="link-arrow" href="/calendar">
        {!dayDone && later.length > shown.length ? `See ${later.length - shown.length} more today and the full calendar` : "See the full activity calendar"} <Icon name="arrow" />
      </Link>
    </div>
  );
}
