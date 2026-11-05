"use client";

import Link from "@/i18n/Link";
import { useT } from "@/i18n/client";
import { useEffect, useMemo, useState } from "react";
import { cats, filters, isLantern, kindOf, type Cat, type CalEvent } from "@/data/shared";
import { useCommunity } from "@/lib/community";
import { dayName, fmtRange, fromIso, nowMinutes, shortDate } from "@/lib/clock";
import { Icon } from "@/components/Icon";
import { EventDialog, type PublicSignup } from "./EventDialog";
import { downloadIcs, icsPlace } from "./ics";

export type CalView = "today" | "week" | "month";
export interface CalDay { date: string; events: CalEvent[] }

interface Hrefs {
  today: string; week: string; month: string;
  prev: string; next: string; prevLabel: string; nextLabel: string;
  backToToday: string; published?: string; day: string; lantern: string; all: string;
}

const isNow = (e: CalEvent, todayIso: string, now: number) => e.date === todayIso && e.start <= now && now < (e.end ?? e.start + 60);
const priority = (e: CalEvent) => (e.special ? 3 : 0) + (kindOf(e) !== "resident" ? 2 : 0) + (e.cat === "music" ? 1 : 0);
const kindTag = { public: "Open to the public", family: "Family event" } as const;

/** The interactive calendar: views, filters, event detail and public event sign-up. */
export function CalendarApp({ view, lantern, todayIso, nowMin, label, days, month, todayInRange, hrefs, phone, phoneHref }: {
  view: CalView; lantern: boolean; todayIso: string; nowMin: number; label: string; days: CalDay[]; month: number;
  todayInRange: boolean; hrefs: Hrefs; phone: string; phoneHref: string;
}) {
  const { t } = useT();
  const c = useCommunity();
  const [active, setActive] = useState<Cat[]>([]);
  const [now, setNow] = useState(nowMin);
  const [openId, setOpenId] = useState<string | null>(null);
  const [signups, setSignups] = useState<Record<string, PublicSignup>>({});
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(nowMinutes()), 30_000);
    return () => clearInterval(id);
  }, []);

  const toggle = (c: Cat) => setActive((a) => (a.includes(c) ? a.filter((x) => x !== c) : [...a, c]));
  const match = (e: CalEvent) => {
    if (lantern && !isLantern(e)) return false;
    if (!active.length) return true;
    return active.some((c) => (c === "lantern" ? isLantern(e) : e.cat === c));
  };

  const shown = useMemo(
    () => days.map((d) => ({ ...d, events: d.events.filter(match) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [days, active, lantern],
  );
  const visible = shown.flatMap((d) => (month >= 0 ? (fromIso(d.date).getUTCMonth() === month ? d.events : []) : d.events));
  const nowEvents = shown.find((d) => d.date === todayIso)?.events.filter((e) => isNow(e, todayIso, now)) ?? [];

  const openEv = openId ? days.flatMap((d) => d.events).find((e) => e.id === openId) ?? null : null;

  const chipList: Cat[] = lantern ? filters.filter((c) => c !== "lantern") : filters;

  const subscribe = () => {
    const name = lantern ? `${c.site.name} · Lantern` : c.site.name;
    const file = `${c.slug}-${view === "month" ? label.toLowerCase().replace(/\s+/g, "-") : (days[0]?.date ?? "calendar")}.ics`;
    downloadIcs(visible, name, file, icsPlace(c.site));
  };

  const card = (e: CalEvent, compact = false) => {
    const live = isNow(e, todayIso, now);
    const past = e.date < todayIso || (e.date === todayIso && (e.end ?? e.start + 60) <= now);
    const kind = kindOf(e);
    const tag = kind === "resident" ? undefined : kindTag[kind];
    const mine = signups[e.id];
    return (
      <button
        type="button"
        className={`cal-ev${compact ? " cal-ev-compact" : ""}${live ? " is-now" : ""}${past ? " is-past" : ""}${e.special ? " is-special" : ""}`}
        style={{ "--cat": cats[e.cat].color } as React.CSSProperties}
        onClick={() => setOpenId(e.id)}
        aria-haspopup="dialog"
      >
        <span className="cal-ev-time">{t(fmtRange(e.start, e.end))}</span>
        <span className="cal-ev-title">{t(e.title)}</span>
        {!compact && (e.room || e.leader) && (
          <span className="cal-ev-meta">
            {e.room && t(e.room)}
            {e.leader && <span data-no-translate>{e.room ? " · " : ""}{e.leader}</span>}
          </span>
        )}
        {(live || tag || mine) && (
          <span className="cal-ev-flags">
            {live && <span className="cal-now">{t("Happening now")}</span>}
            {tag && <span className={`cal-flag cal-flag-${kind}`}>{t(tag)}</span>}
            {mine && !past && <span className="cal-flag cal-flag-mine"><Icon name="check" /> {t("Signed up")}</span>}
          </span>
        )}
      </button>
    );
  };

  const empty = <p className="cal-empty">{t("Nothing on with these filters.")}</p>;

  return (
    <div className={`cal cal-view-${view}${lantern ? " cal-lantern" : ""}`}>
      <div className="cal-print-head" aria-hidden="true">
        <strong>{c.site.name}{lantern ? " · Lantern" : ""}</strong>{t(" · Activity Calendar · ")}{t(label)}
        <span className="cal-print-sub" data-no-translate>{c.site.name} · {c.site.addressLine} · {c.site.phone} · {c.site.licence}</span>
      </div>

      <div className="cal-bar">
        <div className="cal-nav">
          <Link className="cal-arrow" href={hrefs.prev} scroll={false} aria-label={t(hrefs.prevLabel)}><Icon name="left" /></Link>
          <Link className="cal-arrow" href={hrefs.next} scroll={false} aria-label={t(hrefs.nextLabel)}><Icon name="right" /></Link>
          <h2 id="cal-heading" className="cal-label" aria-live="polite">{lantern ? <><span className="cal-lantern-mark">Lantern</span> · </> : null}{t(label)}</h2>
        </div>
        <div className="cal-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => window.print()}><Icon name="printer" /> {t("Print large-print calendar")}</button>
          <button type="button" className="btn btn-green btn-sm" onClick={subscribe}><Icon name="download" /> {t("Add to my phone calendar")}</button>
        </div>
      </div>

      <div className="cal-bar2">
        <nav className="cal-tabs" aria-label={t("Calendar view")}>
          <Link href={hrefs.today} scroll={false} aria-current={view === "today" ? "page" : undefined}>{t("Today")}</Link>
          <Link href={hrefs.week} scroll={false} aria-current={view === "week" ? "page" : undefined}>{t("Week")}</Link>
          <Link href={hrefs.month} scroll={false} aria-current={view === "month" ? "page" : undefined}>{t("Month")}</Link>
        </nav>
        {!todayInRange && <Link className="btn btn-ghost btn-sm" href={hrefs.backToToday} scroll={false}>{t("Back to today")}</Link>}
        {hrefs.published && (
          <Link className="cal-published" href={hrefs.published} scroll={false}>
            <Icon name="spark" /> <span>{t("The November calendar is out — ")}<b>{t("see November")}</b></span> <Icon name="arrow" />
          </Link>
        )}
      </div>

      <div className="cal-filters" role="group" aria-label={t("Show only")}>
        <button type="button" className="cal-chip cal-chip-all" aria-pressed={active.length === 0} onClick={() => setActive([])}>{t("All")}</button>
        {chipList.map((c) => (
          <button key={c} type="button" className="cal-chip" aria-pressed={active.includes(c)} style={{ "--cat": cats[c].color } as React.CSSProperties} onClick={() => toggle(c)}>
            <span className="cal-dot" aria-hidden="true" /> {t(cats[c].label)}
          </button>
        ))}
        {lantern ? (
          <Link className="cal-chip cal-chip-link" href={hrefs.all}>{t("Whole community calendar")}</Link>
        ) : (
          <Link className="cal-chip cal-chip-link" href={hrefs.lantern}>{t("Lantern calendar")}</Link>
        )}
      </div>

      {nowEvents.length > 0 && view !== "today" && (
        <div className="cal-nowbar" role="status">
          <span className="cal-now">{t("Happening now")}</span>
          {nowEvents.map((e) => (
            <button key={e.id} type="button" className="cal-nowbar-ev" onClick={() => setOpenId(e.id)}>
              <b>{t(e.title)}</b>{e.room && <> · {t(e.room)}</>}
            </button>
          ))}
        </div>
      )}

      {view === "today" && (
        <div className="cal-day">
          {shown[0].events.length === 0 ? empty : (
            <ol className="cal-day-list">
              {shown[0].events.map((e) => <li key={e.id}>{card(e)}</li>)}
            </ol>
          )}
        </div>
      )}

      {view === "week" && todayInRange && days[0].date < todayIso && !showPast && (
        <button type="button" className="cal-show-past" onClick={() => setShowPast(true)}>
          <Icon name="chev" /> {t("Show earlier this week")}
        </button>
      )}
      {view === "week" && (
        <ol className={`cal-week${todayInRange && !showPast ? " cal-hide-past" : ""}`}>
          {shown.map((d) => {
            const dt = fromIso(d.date);
            const isToday = d.date === todayIso;
            return (
              <li key={d.date} className={`cal-col${isToday ? " is-today" : ""}${d.date < todayIso ? " is-pastday" : ""}`} aria-current={isToday ? "date" : undefined}>
                <h3 className="cal-col-head">
                  <span className="cal-col-dow">{t(dayName(dt))}</span>
                  <span className="cal-col-date">{t(shortDate(dt))}</span>
                  {isToday && <span className="cal-today-tag">{t("Today")}</span>}
                </h3>
                {d.events.length === 0 ? empty : (
                  <ol className="cal-col-list">
                    {d.events.map((e) => <li key={e.id}>{card(e)}</li>)}
                  </ol>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {view === "month" && (
        <>
          <div className="cal-month" role="table" aria-label={t(label)}>
            <div className="cal-month-head" role="row">
              {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((d) => (
                <span key={d} role="columnheader"><span className="cal-dow-long">{t(d)}</span><span className="cal-dow-short" aria-hidden="true">{t(d.slice(0, 3))}</span></span>
              ))}
            </div>
            {Array.from({ length: shown.length / 7 }, (_, w) => (
              <div className="cal-month-row" role="row" key={w}>
                {shown.slice(w * 7, w * 7 + 7).map((d) => {
                  const dt = fromIso(d.date);
                  const out = dt.getUTCMonth() !== month;
                  const isToday = d.date === todayIso;
                  const top = [...d.events].sort((a, b) => priority(b) - priority(a) || a.start - b.start).slice(0, 4).sort((a, b) => a.start - b.start);
                  const more = d.events.length - top.length;
                  return (
                    <div role="cell" key={d.date} className={`cal-cell${out ? " is-out" : ""}${isToday ? " is-today" : ""}${d.date < todayIso ? " is-pastday" : ""}`} aria-current={isToday ? "date" : undefined}>
                      <Link className="cal-cell-num" href={hrefs.day + d.date} aria-label={t(`${dayName(dt)}, ${shortDate(dt)} — all events`)}>
                        {dt.getUTCDate()}
                        {isToday && <span className="cal-today-tag">{t("Today")}</span>}
                      </Link>
                      {!out && (
                        <ul className="cal-cell-list">
                          {top.map((e) => <li key={e.id}>{card(e, true)}</li>)}
                          {more > 0 && (
                            <li><Link className="cal-more" href={hrefs.day + d.date}>+{more}{t(" more")}</Link></li>
                          )}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <ol className="cal-agenda">
            {shown.filter((d) => fromIso(d.date).getUTCMonth() === month).map((d) => {
              const dt = fromIso(d.date);
              const isToday = d.date === todayIso;
              const top = [...d.events].sort((a, b) => priority(b) - priority(a) || a.start - b.start).slice(0, 5).sort((a, b) => a.start - b.start);
              return (
                <li key={d.date} className={`cal-agenda-day${isToday ? " is-today" : ""}`}>
                  <h3 className="cal-col-head">
                    <span className="cal-col-dow">{t(dayName(dt))}</span>
                    <span className="cal-col-date">{t(shortDate(dt))}</span>
                    {isToday && <span className="cal-today-tag">{t("Today")}</span>}
                  </h3>
                  {top.length === 0 ? empty : (
                    <ol className="cal-col-list">
                      {top.map((e) => <li key={e.id}>{card(e)}</li>)}
                    </ol>
                  )}
                  {d.events.length > top.length && (
                    <Link className="cal-more" href={hrefs.day + d.date}>{t("See all ")}{d.events.length}{t(" events ")}<Icon name="arrow" /></Link>
                  )}
                </li>
              );
            })}
          </ol>
        </>
      )}

      <ul className="cal-legend" aria-label={t("Color key")}>
        {(Object.keys(cats) as Cat[]).map((c) => (
          <li key={c} style={{ "--cat": cats[c].color } as React.CSSProperties}><span className="cal-dot" aria-hidden="true" /> {t(cats[c].label)}</li>
        ))}
      </ul>

      <EventDialog
        event={openEv}
        signup={openEv ? signups[openEv.id] : undefined}
        todayIso={todayIso}
        now={now}
        phone={phone}
        phoneHref={phoneHref}
        onClose={() => setOpenId(null)}
        onSignup={(id, r) => setSignups((m) => ({ ...m, [id]: r }))}
      />
    </div>
  );
}
