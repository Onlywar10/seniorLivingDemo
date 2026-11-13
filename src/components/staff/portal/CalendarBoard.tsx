"use client";

// The calendar, for managing events that already exist. Week, month and day views (day on a phone), filters
// (including "Mine" and "Needs attendance"), and an Ideas panel beside the calendar (templates, residents' ideas, what
// worked): drag an idea onto a day to start an event there. A line marks "now" on today. Drag an event to another day
// to move it; it asks whether to tell the people booked, and for a repeating event, whether it's this one or every
// week. A room clash opens both events side by side, with Move and Change room. Each event opens the event sheet (the
// same one Today opens). "+ Add" opens the same form as Post. View-only for sales. Saved in this browser only.
import { useMemo, useState, useSyncExternalStore } from "react";
import type { CalEvent } from "@/data/staff/calEvents";
import type { IdeaPrefill, NewEventSetup, PhotoKit, PlanHelp, Template } from "@/data/staff/post";
import { addDays, dayName, fmtTime, fromIso, iso, monthName, nowMinutes } from "@/lib/clock";
import { Icon } from "../../Icon";
import { everyDay, useEventBoard } from "../eventStore";
import { say, useLeaders } from "../store";
import { XIcon } from "../ui";
import { Drawer } from "./Drawer";
import { EventSheet, leaderOf } from "./EventSheet";
import { Help } from "./Help";
import { NewEvent, type EventPrefill, type SavedEvent } from "./NewEvent";
import { calToPool } from "@/data/staff/pool";
import { seatInfo } from "./seats";

export type { Booking, CalEvent, ReqRow } from "@/data/staff/calEvents";

/** Phones get the day view first. */
const phoneQuery = "(max-width: 700px)";
const subPhone = (f: () => void) => { const m = window.matchMedia(phoneQuery); m.addEventListener("change", f); return () => m.removeEventListener("change", f); };
const isPhone = () => window.matchMedia(phoneQuery).matches;
/** Minutes since midnight, refreshed each minute, for the "now" line. */
const subMinute = (f: () => void) => { const id = window.setInterval(f, 60_000); return () => window.clearInterval(id); };

/** Open the calendar on one event (and its Photos area), or on Plan. */
export interface CalFocus { id?: string; date?: string; photos?: boolean; plan?: boolean; clash?: string }

type View = "week" | "month" | "day";
type Filter = "all" | "mine" | "attendance" | "lantern" | "seats" | "open" | "conflicts";

/** A move waiting for "tell them?" (and "this one or every week?" for a repeating event). */
interface Move { e: CalEvent; to: string; scope: "one" | "all"; tell: boolean }

export function CalendarBoard({ events: initial, weekStarts, todayIso, residents, staff, me, readOnly = false, setup, brand, kit, plan, focus, invite }: { invite?: { lantern: string[]; interestsOf: Record<string, string[]> }; events: CalEvent[]; weekStarts: string[]; todayIso: string; residents: string[]; staff: string[]; me: string; readOnly?: boolean; setup?: NewEventSetup; brand: { name: string; domain: string; phone: string }; kit?: PhotoKit; plan?: PlanHelp; focus?: CalFocus }) {
  const focused = focus?.id ? initial.find((e) => e.id === focus.id && (!focus.date || e.date === focus.date)) : undefined;
  const weekOf = (d: string) => Math.max(0, weekStarts.findIndex((ws) => d >= ws && d <= iso(addDays(fromIso(ws), 6))));
  // The calendar with this browser's changes: events added on Post, edits from Post, moves and cancellations here.
  const { events, update: keep, series, writer } = useEventBoard(initial);
  const phone = useSyncExternalStore(subPhone, isPhone, () => false);
  const now = useSyncExternalStore(subMinute, nowMinutes, () => -1);
  const leaders = useLeaders();
  const [chosen, setView] = useState<View | null>(null);
  const view: View = chosen ?? (phone ? "day" : "week");
  // The Ideas panel sits beside the calendar, so an idea can be dragged onto a day.
  const [ideasOpen, setIdeasOpen] = useState(!!(focus?.plan && plan && !readOnly));
  const [dragIdea, setDragIdea] = useState<{ prefill: EventPrefill; idea?: IdeaPrefill } | null>(null);
  const [clashOf, setClashOf] = useState<CalEvent | null>(focus?.clash ? initial.find((e) => e.id === focus.clash && (!focus.date || e.date === focus.date) && !!e.clash) ?? null : null);
  const [drag, setDrag] = useState<CalEvent | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [move, setMove] = useState<Move | null>(null);
  const [w, setW] = useState(focused ? weekOf(focused.date) : 0);
  const [dayIso, setDayIso] = useState(focused?.date ?? todayIso);
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<CalEvent | null>(focused ?? null);
  const [photoFocus, setPhotoFocus] = useState(!!(focused && focus?.photos));
  const [adding, setAdding] = useState<{ date: string; n: number; prefill?: EventPrefill; idea?: IdeaPrefill } | null>(null);

  const lastIso = iso(addDays(fromIso(weekStarts[weekStarts.length - 1]), 6));
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => iso(addDays(fromIso(weekStarts[w]), i))), [w, weekStarts]);
  const monthDays = useMemo(() => {
    const t = fromIso(todayIso);
    const m1 = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 1));
    const startCell = addDays(m1, -m1.getUTCDay());
    return Array.from({ length: 35 }, (_, i) => iso(addDays(startCell, i)));
  }, [todayIso]);
  const ended = (e: CalEvent) => e.date < todayIso || (e.date === todayIso && now >= 0 && (e.end ?? e.start + 60) <= now);
  const needsAttendance = (e: CalEvent) => ended(e) && !e.came && !e.cancelled && e.date >= iso(addDays(fromIso(todayIso), -7)) && e.cat !== "movies" && e.cat !== "faith";
  const show = (e: CalEvent) => (filter === "mine" ? leaderOf(e, leaders) === me : filter === "attendance" ? needsAttendance(e) : filter === "lantern" ? e.lantern : filter === "seats" ? !!e.cap : filter === "open" ? e.kind !== "resident" : filter === "conflicts" ? !!e.clash : true);
  const clashes = events.filter((e) => e.clash && e.date >= todayIso && !e.cancelled);
  const firstD = fromIso(days[0]), lastD = fromIso(days[6]), dd = fromIso(dayIso);
  const range = view === "week" ? `${monthName(firstD).slice(0, 3)} ${firstD.getUTCDate()} – ${monthName(lastD).slice(0, 3)} ${lastD.getUTCDate()}` : view === "day" ? `${dayName(dd)}, ${monthName(dd).slice(0, 3)} ${dd.getUTCDate()}` : monthName(fromIso(todayIso));
  const update = (e: CalEvent) => {
    keep(e);
    setOpen(e);
  };
  /** Every week of a repeating event, from this date on. */
  const everyWeek = (e: CalEvent, patch: Partial<CalEvent>) => {
    series(e, patch);
    setOpen({ ...e, ...patch });
  };
  const bookedOf = (e: CalEvent) => e.booked?.length ?? e.taken ?? e.invites?.yes ?? 0;
  const drop = (to: string) => {
    if (dragIdea) { const x = dragIdea; setDragIdea(null); setOver(null); add(to, x); return; }
    const e = drag;
    setDrag(null);
    setOver(null);
    if (!e || to === e.date || readOnly) return;
    setMove({ e, to, scope: "one", tell: true });
  };
  const doMove = (m: Move) => {
    const shift = Math.round((fromIso(m.to).getTime() - fromIso(m.e.date).getTime()) / 864e5);
    const n = bookedOf(m.e);
    if (m.scope === "all") writer.series(m.e, { rule: everyDay(m.to) }, shift);
    else writer.one(m.e, { date: m.to });
    setMove(null);
    say(`Moved to ${dayName(fromIso(m.to))}${m.scope === "all" ? ", every week" : ""}.${m.tell && n ? ` Told ${n} booked.` : ""}`);
  };
  // The Preview tab of "+ Add" works from the calendar on screen.
  const pool = useMemo(() => (setup ? { pool: events.filter((e) => !e.cancelled).map((e) => calToPool(e)), masthead: `The ${brand.name} Weekly` } : undefined), [events, setup, brand.name]);
  const busy = useMemo(() => events.filter((e) => e.isNew).map((e) => ({ date: e.date, start: e.start, end: e.end ?? e.start + 60, room: e.room, title: e.title })), [events]);
  const add = (date: string, extra: { prefill?: EventPrefill; idea?: IdeaPrefill } = {}) => setAdding((a) => ({ date, n: (a?.n ?? 0) + 1, ...extra }));
  const tomorrow = iso(addDays(fromIso(todayIso), 1));
  const tplPrefill = (t: Template): EventPrefill => ({ title: t.title, kind: t.kind, cat: t.cat, minutes: t.minutes, cap: t.cap, interests: t.interests, repeat: t.repeat, photos: !(t.kind === "resident" && !t.cap) });
  const fromTemplate = (t: Template) => add(tomorrow, { prefill: tplPrefill(t) });
  const openEvent = (e: CalEvent) => { setPhotoFocus(false); setOpen(e); };

  // The form puts it on the calendar (every date, if it repeats); here the calendar goes to its week.
  const saved = (s: SavedEvent) => {
    const i = weekStarts.findIndex((ws) => s.date >= ws && s.date <= iso(addDays(fromIso(ws), 6)));
    if (i >= 0) setW(i);
    setDayIso(s.date);
  };

  const pill = (e: CalEvent) => {
    const full = e.cap && (e.taken ?? 0) >= e.cap;
    const waiting = e.requests?.filter((r) => r.stage === 3 && !r.declined).length ?? 0;
    const needPhotos = !readOnly && !!e.wanted && !e.photos?.length && e.date <= todayIso && !e.cancelled;
    return (
      <button
        type="button"
        className={`ced-ev ${e.clash ? "conflict" : ""} ${e.isNew ? "new" : ""}${drag === e ? " dragging" : ""}`}
        style={{ borderLeftColor: e.color, opacity: e.cancelled ? 0.55 : undefined }}
        onClick={() => openEvent(e)}
        draggable={!readOnly && !e.cancelled && e.date >= todayIso}
        onDragStart={(ev) => { setDrag(e); ev.dataTransfer.effectAllowed = "move"; ev.dataTransfer.setData("text/plain", e.id); }}
        onDragEnd={() => { setDrag(null); setOver(null); }}
        title={!readOnly && e.date >= todayIso ? "Drag to another day to move it" : undefined}
      >
        <span className="t">
          {fmtTime(e.start)}
          {e.rule ? <span title={e.rule}><XIcon name="repeat" /><span className="vh"> {e.rule}</span></span> : e.clash ? <Icon name="alert" /> : null}
          {needPhotos && <span className="pc-want" title="Photos wanted"><Icon name="image" /><span className="vh"> Photos wanted</span></span>}
        </span>
        {e.cancelled ? <s>{e.title}</s> : e.title}
        {e.late && !e.cancelled ? <span className="pc-new">{e.late} min late</span> : null}
        {e.kind !== "resident" && <span className={`ced-kind ${e.kind}`}>{e.kind === "public" ? "Public" : "Family"}</span>}
        {e.idea && <span className="ced-kind idea">Your idea</span>}
        {e.approval && <span className="pc-new">Approval needed</span>}
        {e.cancelled && <span className="pc-new">Cancelled</span>}
        {!e.cancelled && <span className={`cap${full ? " full" : ""}${e.cap ? "" : " open"}`} title={seatInfo(e).text}>{seatInfo(e).short}</span>}
        {!readOnly && waiting > 0 && <span className="cap pt-ced-wait">{waiting} to approve</span>}
      </button>
    );
  };

  /** The events of a day, with a line where "now" falls (today only). */
  const withNow = (list: CalEvent[], isToday: boolean) => {
    const at = isToday && now >= 0 ? list.findIndex((e) => e.start > now) : -2;
    const line = (
      <li key="now" className="pc-now" aria-label={`Now, ${fmtTime(now)}`}><span>Now {fmtTime(now)}</span></li>
    );
    const items = list.map((e) => <li key={e.id + e.date} className={isToday && now >= 0 && (e.end ?? e.start + 60) <= now ? "past" : undefined}>{pill(e)}</li>);
    if (at === -2) return items;
    if (at === -1) return [...items, line];
    return [...items.slice(0, at), line, ...items.slice(at)];
  };

  const step = (n: number) => {
    const next = iso(addDays(dd, n));
    if (next < weekStarts[0] || next > lastIso) return;
    setDayIso(next);
  };

  return (
    <div className="pc-cal">
      <div className="sx-toolbar">
        <div>
          <div className="sx-seg" role="group" aria-label="View">
            <button type="button" aria-pressed={view === "week"} onClick={() => setView("week")}>Week</button>
            <button type="button" aria-pressed={view === "month"} onClick={() => setView("month")}>Month</button>
            <button type="button" aria-pressed={view === "day"} onClick={() => setView("day")}>Day</button>
          </div>
          {view === "week" && (
            <>
              <button type="button" className="sx-btn sx-btn-sm" onClick={() => setW(Math.max(0, w - 1))} disabled={w === 0} aria-label="Previous week"><Icon name="left" /></button>
              <b className="pt-range" aria-live="polite">{range}</b>
              <button type="button" className="sx-btn sx-btn-sm" onClick={() => setW(Math.min(weekStarts.length - 1, w + 1))} disabled={w === weekStarts.length - 1} aria-label="Next week"><Icon name="right" /></button>
            </>
          )}
          {view === "day" && (
            <>
              <button type="button" className="sx-btn sx-btn-sm" onClick={() => step(-1)} disabled={dayIso <= weekStarts[0]} aria-label="Previous day"><Icon name="left" /></button>
              <b className="pt-range" aria-live="polite">{range}</b>
              <button type="button" className="sx-btn sx-btn-sm" onClick={() => step(1)} disabled={dayIso >= lastIso} aria-label="Next day"><Icon name="right" /></button>
              {dayIso !== todayIso && <button type="button" className="sx-btn sx-btn-sm" onClick={() => setDayIso(todayIso)}>Today</button>}
            </>
          )}
          {view === "month" && <b className="pt-range">{range}</b>}
        </div>
        <div>
          <div className="sx-chips" role="group" aria-label="Show">
            {([["all", "All"], ...(readOnly ? [] : [["mine", "Mine"], ["attendance", `Needs attendance${events.filter(needsAttendance).length ? ` · ${events.filter(needsAttendance).length}` : ""}`]]), ["lantern", "Lantern"], ["seats", "Limited seats"], ["open", "Family & public"], ["conflicts", "Room clashes"]] as [Filter, string][]).map(([k, l]) => (
              <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}</button>
            ))}
          </div>
          {plan && !readOnly && <button type="button" className="sx-btn" aria-pressed={ideasOpen} onClick={() => setIdeasOpen((o) => !o)}><Icon name="spark" /> Ideas</button>}
          {!readOnly && setup && (
            <button type="button" className="sx-btn sx-btn-primary" onClick={() => add(view === "day" ? dayIso : days.includes(todayIso) ? todayIso : days[1])}>
              <Icon name="plus" /> Add event
            </button>
          )}
        </div>
      </div>

      {readOnly && <p className="sx-callout info pc-viewonly"><Icon name="eye" /> <span>View only</span></p>}

      {!readOnly && clashes.length > 0 && (
        <div className="sx-callout">
          <Icon name="alert" />
          <p>
            <b>Room clash:</b> {clashes[0].title} and {clashes[0].clash}, {clashes[0].room}, {dayName(fromIso(clashes[0].date))} {fmtTime(clashes[0].start)}.{" "}
            <button type="button" className="sx-link pt-linkbtn" onClick={() => setClashOf(clashes[0])}>Review both</button>
          </p>
        </div>
      )}

      <div className={`pc-main${ideasOpen && plan && !readOnly ? " with-ideas" : ""}`}>
      <div className="pc-views">
      {view === "week" && (
        <div className="ced">
          {days.map((d) => {
            const date = fromIso(d);
            const list = events.filter((e) => e.date === d && show(e)).sort((a, b) => a.start - b.start);
            return (
              <section
                key={d}
                className={`ced-day ${d === todayIso ? "today" : ""}${over === d ? " drop" : ""}`}
                aria-label={`${dayName(date)}, ${monthName(date)} ${date.getUTCDate()}`}
                onDragOver={(ev) => { if ((drag || dragIdea) && d >= todayIso) { ev.preventDefault(); setOver(d); } }}
                onDragLeave={() => setOver((o) => (o === d ? null : o))}
                onDrop={(ev) => { ev.preventDefault(); if (d >= todayIso) drop(d); }}
              >
                <div className="ced-h">
                  <span>{dayName(date).slice(0, 3)} {date.getUTCDate()}</span>
                  <small>{d === todayIso ? "Today" : `${list.length} events`}</small>
                </div>
                <ul className="ced-list">{withNow(list, d === todayIso)}</ul>
                {!readOnly && setup ? <button type="button" className="ced-add" onClick={() => add(d)}>+ Add</button> : <span />}
              </section>
            );
          })}
        </div>
      )}

      {view === "month" && (
        <div className="pt-month" role="grid" aria-label={range}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="pt-month-h" role="columnheader">{d}</div>)}
          {monthDays.map((d) => {
            const date = fromIso(d);
            const all = events.filter((e) => e.date === d && show(e));
            // Fifteen activities a day can't be read in a month: show the count, and only what's special (one-offs,
            // family and public events, trips with seats, ideas).
            const special = all.filter((e) => !e.rule || e.kind !== "resident" || e.cap || e.idea || e.isNew).sort((a, b) => a.start - b.start);
            const inMonth = date.getUTCMonth() === fromIso(todayIso).getUTCMonth();
            return (
              <div key={d} role="gridcell" className={`pt-month-d${d === todayIso ? " today" : ""}${inMonth ? "" : " out"}${over === d ? " drop" : ""}`}
                onDragOver={(ev) => { if ((drag || dragIdea) && d >= todayIso) { ev.preventDefault(); setOver(d); } }}
                onDragLeave={() => setOver((o) => (o === d ? null : o))}
                onDrop={(ev) => { ev.preventDefault(); if (d >= todayIso) drop(d); }}>
                <span className="pt-month-n">{date.getUTCDate()}</span>
                <ul>{special.slice(0, 2).map((e) => <li key={e.id + e.date}>{pill(e)}</li>)}</ul>
                {all.length > 0 && (
                  <button type="button" className="sx-link pt-linkbtn pc-sub" onClick={() => { setDayIso(d); setView("day"); }}>{all.length} {all.length === 1 ? "activity" : "activities"}{special.length > 2 ? ` · ${special.length - 2} more special` : ""}</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {view === "day" && (
        <section className="sx-card sx-card-body pc-day" aria-label={range}>
          {(() => {
            const list = events.filter((e) => e.date === dayIso && show(e)).sort((a, b) => a.start - b.start);
            return list.length ? <ul className="pc-day-list">{withNow(list, dayIso === todayIso)}</ul> : <p className="sx-empty">Nothing on this day{filter !== "all" ? " for this filter" : ""}.</p>;
          })()}
          {!readOnly && setup && <button type="button" className="ced-add" onClick={() => add(dayIso)}>+ Add an event on {dayName(dd)}</button>}
        </section>
      )}

      </div>
      {ideasOpen && plan && !readOnly && (
        <aside className="pc-ideas" aria-label="Ideas">
          <header><h2>Ideas</h2><small>Tap to add, or drag onto a day</small><button type="button" className="sx-x" aria-label="Close ideas" onClick={() => setIdeasOpen(false)}><Icon name="x" /></button></header>
          <Plan plan={plan} onTemplate={fromTemplate} onIdea={(i) => add(tomorrow, { idea: i, prefill: {} })}
            onDragTemplate={(t) => setDragIdea(t ? { prefill: tplPrefill(t) } : null)}
            onDragIdea={(i) => setDragIdea(i ? { idea: i, prefill: {} } : null)} />
        </aside>
      )}
      </div>

      {(
        <div className="pc-legend">
          <span><XIcon name="repeat" /> Repeats weekly</span>
          {!readOnly && <span><Icon name="image" /> Photos wanted</span>}
          {!readOnly && view === "week" && <span className="pc-drag-hint">Drag an event to another day to move it</span>}
          <Help label="What the website shows">
            <p>Seats, waitlists and meeting points are for staff only; the website never shows them.</p>
            <p>Changes here update the website calendar, the newsletter and the printed calendar.</p>
          </Help>
        </div>
      )}

      {open && <EventSheet key={open.id + open.date} e={open} residents={residents} staff={staff} me={me} todayIso={todayIso} readOnly={readOnly} brand={brand} kit={kit} photoFocus={photoFocus} onClose={() => setOpen(null)} onChange={update} onSeries={everyWeek} setup={setup} lantern={invite?.lantern} interestsOf={invite?.interestsOf} />}
      {move && (
        <Drawer title={`Move ${move.e.title}?`} sub={`${dayName(fromIso(move.e.date))} → ${dayName(fromIso(move.to))}, ${monthName(fromIso(move.to)).slice(0, 3)} ${fromIso(move.to).getUTCDate()} · ${fmtTime(move.e.start)}`} onClose={() => setMove(null)}>
          <div className="sx-form pc-move">
            {move.e.rule && (
              <div className="sx-seg" role="group" aria-label="Which dates">
                <button type="button" aria-pressed={move.scope === "one"} onClick={() => setMove({ ...move, scope: "one" })}>This one</button>
                <button type="button" aria-pressed={move.scope === "all"} onClick={() => setMove({ ...move, scope: "all" })}>Every week from now</button>
              </div>
            )}
            <label className="pc-tell">
              <input type="checkbox" checked={move.tell} onChange={(x) => setMove({ ...move, tell: x.target.checked })} />
              <span>{bookedOf(move.e) ? <>Tell the <b>{bookedOf(move.e)}</b> people booked, and their families?</> : "Nobody is booked yet. The website and newsletter update."}</span>
            </label>
            {move.tell && bookedOf(move.e) > 0 && <q className="pc-msg">{move.e.title} has moved to {dayName(fromIso(move.to))} at {fmtTime(move.e.start)}{move.scope === "all" ? ", every week from now" : ""}. Same time, same place.</q>}
            <div className="pt-act">
              <button type="button" className="sx-btn sx-btn-primary" onClick={() => doMove(move)}><Icon name={move.tell && bookedOf(move.e) ? "send" : "check"} /> {move.tell && bookedOf(move.e) ? "Move and tell them" : "Move it"}</button>
              <button type="button" className="sx-btn" onClick={() => setMove(null)}>Keep it where it was</button>
            </div>
          </div>
        </Drawer>
      )}
      {clashOf && (() => {
        const other = events.find((x) => x.date === clashOf.date && x.room === clashOf.room && x.start === clashOf.start && x.title === clashOf.clash);
        return <ClashReview a={clashOf} b={other} rooms={setup?.rooms ?? []} bookedOf={bookedOf} onClose={() => setClashOf(null)}
          onFix={(x, patch, line) => {
            keep({ ...x, ...patch, clash: undefined });
            if (other) keep({ ...other, clash: undefined });
            setClashOf(null);
            say(line);
          }} />;
      })()}
      {adding && setup && (
        <Drawer wide title="New event" onClose={() => setAdding(null)}>
          <NewEvent key={adding.n} inDrawer setup={setup} preview={pool} idea={adding.idea} prefill={{ ...adding.prefill, date: adding.date >= todayIso ? adding.date : todayIso }} extraBusy={busy} onSaved={saved} onAnother={() => add(adding.date)} />
        </Drawer>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ Plan: ideas, templates and what worked */

function Plan({ plan, onTemplate, onIdea, onDragTemplate, onDragIdea }: { plan: PlanHelp; onTemplate: (t: Template) => void; onIdea: (i: IdeaPrefill) => void; onDragTemplate: (t: Template | null) => void; onDragIdea: (i: IdeaPrefill | null) => void }) {
  const trend = (t: number) => <small className={t > 0 ? "up" : t < 0 ? "down" : ""}>{t > 0 ? `▲ ${t}` : t < 0 ? `▼ ${-t}` : "–"}</small>;
  return (
    <div className="pc-plan">
      <section className="sx-card">
        <header className="sx-card-head"><div><h2>Templates</h2></div></header>
        <ul className="po-tpls">
          {plan.templates.map((t) => (
            <li key={t.k}>
              <button type="button" onClick={() => onTemplate(t)} draggable onDragStart={(ev) => { ev.dataTransfer.effectAllowed = "copy"; ev.dataTransfer.setData("text/plain", t.title); onDragTemplate(t); }} onDragEnd={() => onDragTemplate(null)}>
                <b>{t.title}</b>
                <small>{t.worked}</small>
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section className="sx-card">
        <header className="sx-card-head"><div><h2>Residents’ ideas</h2></div></header>
        {plan.ideas.length ? (
          <ul className="po-tpls">
            {plan.ideas.map((i) => (
              <li key={i.id}>
                <button type="button" onClick={() => onIdea(i)} draggable onDragStart={(ev) => { ev.dataTransfer.effectAllowed = "copy"; ev.dataTransfer.setData("text/plain", i.text); onDragIdea(i); }} onDragEnd={() => onDragIdea(null)}>
                  <b>“{i.text}”</b>
                  <small>{i.who ?? "No name"} · {i.votes} vote{i.votes === 1 ? "" : "s"}</small>
                </button>
              </li>
            ))}
          </ul>
        ) : <p className="sx-card-body sx-empty">No new ideas this week.</p>}
      </section>
      <section className="sx-card">
        <header className="sx-card-head">
          <div><h2>This month</h2></div>
          <Help label="How attendance is counted" align="end">
            <p>Average attendance per session over the last four weeks, from card scans and attendance taken by staff.</p>
            <p>▲▼ against the month before. More in Reports.</p>
          </Help>
        </header>
        <div className="sx-card-body po-worked">
          <h3 className="po-aside-h">Most attended</h3>
          <ol>{plan.most.map((m) => <li key={m.title}><span>{m.title}</span><b>{m.avg}</b>{trend(m.trend)}</li>)}</ol>
          <h3 className="po-aside-h">Least attended</h3>
          <ol>{plan.least.map((m) => <li key={m.title}><span>{m.title}</span><b>{m.avg}</b>{trend(m.trend)}</li>)}</ol>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------ a room clash: both events side by side */

function ClashReview({ a, b, rooms, bookedOf, onClose, onFix }: {
  a: CalEvent; b?: CalEvent; rooms: string[]; bookedOf: (e: CalEvent) => number; onClose: () => void;
  onFix: (e: CalEvent, patch: Partial<CalEvent>, line: string) => void;
}) {
  const hh = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  const d = fromIso(a.date);
  const side = (e: CalEvent) => <ClashSide key={e.id} e={e} rooms={rooms.filter((r) => r !== e.room && r !== "All floors")} booked={bookedOf(e)} hh={hh} onFix={onFix} />;
  return (
    <Drawer wide title="Room clash" sub={`${a.room} · ${dayName(d)}, ${monthName(d).slice(0, 3)} ${d.getUTCDate()} · ${fmtTime(a.start)}`} onClose={onClose}>
      <p className="sx-hint">Two events are booked in the same room at the same time. Move one, or give it another room; whoever’s booked is told.</p>
      <div className="pc-clash">{side(a)}{b && side(b)}</div>
    </Drawer>
  );
}

function ClashSide({ e, rooms, booked, hh, onFix }: { e: CalEvent; rooms: string[]; booked: number; hh: (m: number) => string; onFix: (e: CalEvent, patch: Partial<CalEvent>, line: string) => void }) {
  const [room, setRoom] = useState(rooms[0] ?? "");
  const [time, setTime] = useState(hh(e.end ?? e.start + 60));
  const tell = booked ? ` Told the ${booked} booked.` : "";
  return (
    <section className="sx-card sx-card-body pc-clash-side">
      <h3>{e.title}</h3>
      <p className="sx-hint">{fmtTime(e.start)}–{fmtTime(e.end ?? e.start + 60)} · {e.room} · {booked ? `${booked} booked` : "nobody booked yet"}{e.rule ? ` · ${e.rule}` : ""}</p>
      <div className="sx-form pc-clash-f">
        <label>Change room
          <select value={room} onChange={(x) => setRoom(x.target.value)}>{rooms.map((r) => <option key={r}>{r}</option>)}</select>
        </label>
        <button type="button" className="sx-btn sx-btn-sm sx-btn-primary" disabled={!room} onClick={() => onFix(e, { room }, `${e.title} is now in ${room}.${tell}`)}><Icon name="check" /> Change room</button>
      </div>
      <div className="sx-form pc-clash-f">
        <label>Move to
          <input type="time" step={300} value={time} onChange={(x) => setTime(x.target.value)} />
        </label>
        <button type="button" className="sx-btn sx-btn-sm" onClick={() => { const [h, m] = time.split(":").map(Number); const st = (h || 0) * 60 + (m || 0); const dur = (e.end ?? e.start + 60) - e.start; onFix(e, { start: st, end: st + dur }, `${e.title} moved to ${fmtTime(st)}.${tell}`); }}><Icon name="clock" /> Move</button>
      </div>
    </section>
  );
}
