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
    setNow(nowMinutes());
    const id = window.setInterval(() => setNow(nowMinutes()), 30_000);
    return () => window.clearInterval(id);
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
            <span className="hm-pulse" aria-hidden="true" />{t(" Happening now")}
          </p>
          {current.length ? (
            <ul>
              {current.slice(0, 3).map((e) => (
                <li key={e.id} style={{ ["--cc" as string]: e.color }}>
                  <b>{t(e.title)}</b>
                  <span>{t(`${e.room} · until ${fmtTime(endOf(e))}`)}</span>
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
              <span>{t(dayDone ? e.room : `${fmtTime(e.start)} · ${e.room}`)}</span>
            </div>
          ))}
        </div>
      </div>

      <h3 className="hm-rest-h">{t(dayDone ? `${tomorrowLabel}, from the calendar` : "Later today")}</h3>
      <ul className="hm-rest">
        {(dayDone ? tomorrow.slice(1, 7) : shown).map((e) => (
          <li key={e.id} style={{ ["--cc" as string]: e.color }}>
            <time>{t(fmtRange(e.start, e.end))}</time>
            <span className="hm-rest-t">
              <b>{t(e.title)}</b>
              <span>{t(e.room)}</span>
            </span>
            <span className="hm-rest-cat">{t(e.label)}</span>
          </li>
        ))}
        {!dayDone && !shown.length && <li className="hm-rest-empty">{t("That’s the last event on today’s calendar.")}</li>}
      </ul>
      <Link className="link-arrow" href="/calendar">
        {t(!dayDone && later.length > shown.length ? `See ${later.length - shown.length} more today and the full calendar` : "See the full activity calendar")} <Icon name="arrow" />
      </Link>
    </div>
  );
}
