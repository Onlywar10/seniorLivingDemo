"use client";

import Link from "@/i18n/Link";
import { useEffect, useState } from "react";
import { useT } from "@/i18n/client";
import type { T } from "@/i18n/translate";
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

function until(mins: number, t: T) {
  if (mins < 60) return t(`In ${mins} min`);
  const h = Math.floor(mins / 60), m = mins % 60;
  return t(m ? `In ${h} hr ${m} min` : `In ${h} hr`);
}

/** Live "now / next / rest of today" panel. Starts from the server's minute, then follows the clock. */
export function TodayLive({ events, tomorrow, tomorrowLabel, serverNow, quiet, wrapUp }: {
  events: LiveEvent[];
  tomorrow: LiveEvent[];
  tomorrowLabel: string;
  serverNow: number;
  /** Shown when nothing is on right now. */
  quiet: string;
  /** Shown once the day's last event has started, before the restaurants close. */
  wrapUp: string;
}) {
  const { t } = useT();
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    // Catch up with the browser's clock straight away (the server's minute may be stale), then every 30 seconds.
    const first = window.setTimeout(() => setNow(nowMinutes()), 0);
    const id = window.setInterval(() => setNow(nowMinutes()), 30_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, []);

  const current = events.filter((e) => e.start <= now && now < endOf(e));
  const upcoming = events.filter((e) => e.start > now);
  const next = upcoming.filter((e) => e.start === upcoming[0]?.start);
  // Once the last event has started, "Up next" looks ahead to tomorrow; the schedule below stays on today.
  const dayDone = !upcoming.length;
  // The "now" line sits after every event that has started (events arrive sorted by start).
  const started = events.length - upcoming.length;
  const nowLine = (
    <li key="now" className="hm-nowline">
      {t(`Now · ${fmtTime(now)}`)}
    </li>
  );

  return (
    <div className="hm-live" aria-live="polite">
      <div className="hm-now-row">
        <div className="hm-now">
          <p className="hm-now-k">
            <span className="hm-pulse" aria-hidden="true" />{t(" Happening now")}
          </p>
          {current.length ? (
            <ul>
              {current.slice(0, 3).map((e) => (
                <li key={e.id} style={{ ["--cc" as string]: e.color }}>
                  <b>{t(e.title)}</b>
                  <span>{t(e.room ? `${e.room} · until ${fmtTime(endOf(e))}` : `Until ${fmtTime(endOf(e))}`)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="hm-now-quiet">{t(!upcoming.length ? (now < 1140 ? wrapUp : "That’s a wrap for today. Here’s what’s on tomorrow.") : quiet)}</p>
          )}
        </div>
        <div className="hm-next">
          <p className="hm-now-k">{t(dayDone ? tomorrowLabel : "Up next")}</p>
          {(dayDone ? tomorrow.slice(0, 1) : next.slice(0, 2)).map((e) => (
            <div key={e.id} className="hm-next-ev" style={{ ["--cc" as string]: e.color }}>
              <time>{dayDone ? t(fmtTime(e.start)) : until(e.start - now, t)}</time>
              <b>{t(e.title)}</b>
              {(!dayDone || e.room) && <span>{t(dayDone ? e.room : e.room ? `${fmtTime(e.start)} · ${e.room}` : fmtTime(e.start))}</span>}
            </div>
          ))}
        </div>
      </div>

      <h3 className="hm-rest-h">{t("Today’s schedule")}</h3>
      <ul className="hm-rest">
        {events.map((e, i) => {
          const state = endOf(e) <= now ? "past" : e.start <= now ? "now" : "next";
          return [
            i === started && nowLine,
            <li key={e.id} className={`is-${state}`} style={{ ["--cc" as string]: e.color }}>
              <time>{t(fmtRange(e.start, e.end))}</time>
              <span className="hm-rest-t">
                <b>
                  {t(e.title)}
                  {state === "past" && <span className="vh">{t(" (finished)")}</span>}
                </b>
                {e.room && <span>{t(e.room)}</span>}
              </span>
              <span className="hm-rest-cat">{t(state === "now" ? "Happening now" : e.label)}</span>
            </li>,
          ];
        })}
        {events.length > 0 && started === events.length && nowLine}
        {!events.length && <li className="hm-rest-empty">{t("Nothing on today’s calendar.")}</li>}
      </ul>
      <Link className="link-arrow" href="/calendar">
        {t("See the full activity calendar")} <Icon name="arrow" />
      </Link>
    </div>
  );
}
