"use client";

// Events as staff change them, shared by every screen in this browser tab: Post (new events, and edits from Calendar
// and Today, which open there), Calendar, Today, and each resident's week page. Kept per community in sessionStorage,
// like the rest of the staff area's changes.
//
// A change is to one date of an event ("just this one", keyed `id@date`), or to every date of it from a day on ("every
// date"), or a repeat that was reshaped (its later dates are dropped and the new ones added). Templates are events
// someone kept for later. Bookings come from residents tapping "I'll go" on their week page.
import { useMemo, useState, useSyncExternalStore } from "react";
import type { Booking, CalEvent } from "@/data/staff/calEvents";
import type { EventKind } from "@/data/shared";
import type { Interest } from "@/data/staff/engage";
import { addDays, dayName, fromIso, iso } from "@/lib/clock";
import { useStaffCommunity } from "./StaffCommunity";

/** An event kept as a template ("we'll need this again"): its shape, without a date. */
export interface SavedTemplate {
  k: string; label: string; title: string; kind: EventKind; time: string; minutes: number; room: string;
  cap?: number; interests: Interest[]; photos: number; desc?: string; cost?: string; areas: string[]; leader?: string;
}
export interface SeriesChange { from: string; patch: Partial<CalEvent>; shift?: number }
export interface ResidentBooking { key: string; name: string; via: string }
export interface Changes {
  added: CalEvent[];
  one: Record<string, Partial<CalEvent>>;
  series: Record<string, SeriesChange>;
  /** A repeat that was reshaped: its dates from this day on are gone (the new ones are in `added`). */
  dropped: Record<string, string>;
  bookings: ResidentBooking[];
  templates: SavedTemplate[];
}

const KEY = "wh-staff-events";
const EMPTY: Changes = { added: [], one: {}, series: {}, dropped: {}, bookings: [], templates: [] };
let all: Record<string, Changes> = {};
let loaded = false;
const subs = new Set<() => void>();
const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (raw) all = JSON.parse(raw);
  } catch { /* storage is a convenience only */ }
}
function write(scope: string, next: Changes) {
  all = { ...all, [scope]: next };
  try { window.sessionStorage.setItem(KEY, JSON.stringify(all)); } catch { /* storage is a convenience only */ }
  subs.forEach((f) => f());
}
const read = (scope: string): Changes => { load(); return all[scope] ?? EMPTY; };

/** Which repeating event an event belongs to. The calendar's ids start with the date ("2026-11-13-tai-chi-660"), so
 * every date of Tai Chi shares "tai-chi-660"; events added here share one id across their dates. */
export const seriesOf = (id: string) => id.replace(/^\d{4}-\d{2}-\d{2}-/, "");

/** The instance an event on screen came from: its id and the date it had before any move. */
export const keyOf = (e: Pick<CalEvent, "id" | "date" | "orig">) => `${e.id}@${e.orig ?? e.date}`;

/** The event list with this browser's changes on it. Each moved event remembers its first date in `orig`. */
export function applyChanges(events: CalEvent[], ch: Changes): CalEvent[] {
  if (ch === EMPTY) return events;
  const out: CalEvent[] = [];
  for (const e0 of [...events, ...ch.added]) {
    const sid = seriesOf(e0.id);
    const drop = ch.dropped[sid];
    if (drop && e0.date >= drop && !e0.isNew) continue;
    let e = e0;
    const s = ch.series[sid];
    if (s && e.date >= s.from) e = { ...e, ...s.patch, ...(s.shift ? { date: iso(addDays(fromIso(e.date), s.shift)) } : {}) };
    const one = ch.one[`${e0.id}@${e0.date}`];
    if (one) e = { ...e, ...one };
    if (e.date !== e0.date) e = { ...e, orig: e0.date };
    const mine = ch.bookings.filter((b) => b.key === `${e0.id}@${e0.date}` && !(e.booked ?? []).some((x) => x.name === b.name));
    if (mine.length) {
      const booked: Booking[] = [...mine.map((b) => ({ name: b.name, via: b.via })), ...(e.booked ?? [])];
      e = { ...e, booked, taken: e.cap !== undefined ? (e.taken ?? 0) + mine.length : e.taken, people: [...(e.people ?? []).filter((p) => !mine.some((b) => b.name === p.name)), ...mine.map((b) => ({ name: b.name, status: "signed" as const, why: b.via }))] };
    }
    out.push(e);
  }
  return out;
}

/* ------------------------------------------------------------ hooks */

export function useEventChanges(scopeOverride?: string): Changes {
  const { scope } = useStaffCommunity();
  const sc = scopeOverride ?? scope;
  return useSyncExternalStore(subscribe, () => read(sc), () => EMPTY);
}
/** For pages outside the staff area (a resident's week page), by community. */
export function useCommunityChanges(slug: string): Changes {
  return useSyncExternalStore(subscribe, () => read(slug), () => EMPTY);
}

/** What a screen can do to events: each writes to this browser's shared changes. */
export interface EventWriter {
  /** Add new events (every date of a new repeating event). */
  add: (events: CalEvent[]) => void;
  /** Change one date only. `e` is the event as it is on screen. */
  one: (e: Pick<CalEvent, "id" | "date" | "orig">, patch: Partial<CalEvent>) => void;
  /** Change every date from this one on; `shift` moves each by that many days. */
  series: (e: Pick<CalEvent, "id" | "date" | "orig">, patch: Partial<CalEvent>, shift?: number) => void;
  /** Reshape a repeat: drop its dates from this one on and add these instead. */
  reshape: (e: Pick<CalEvent, "id" | "date" | "orig">, instead: CalEvent[]) => void;
  keepTemplate: (t: SavedTemplate) => void;
  book: (e: Pick<CalEvent, "id" | "date" | "orig">, name: string, via: string) => void;
  unbook: (e: Pick<CalEvent, "id" | "date" | "orig">, name: string) => void;
}
export function writerFor(scope: string): EventWriter {
  const cur = () => read(scope);
  const isAdded = (k: string) => cur().added.some((x) => `${x.id}@${x.date}` === k);
  return {
    add: (events) => write(scope, { ...cur(), added: [...cur().added, ...events] }),
    one: (e, patch) => {
      const k = keyOf(e);
      const c = cur();
      // A new event's own dates are changed in place, so its key stays its date.
      if (isAdded(k)) { write(scope, { ...c, added: c.added.map((x) => (`${x.id}@${x.date}` === k ? { ...x, ...patch } : x)) }); return; }
      write(scope, { ...c, one: { ...c.one, [k]: { ...c.one[k], ...patch } } });
    },
    series: (e, patch, shift) => {
      const c = cur();
      const from = e.orig ?? e.date;
      const sid = seriesOf(e.id);
      if (c.added.some((x) => seriesOf(x.id) === sid)) {
        write(scope, { ...c, added: c.added.map((x) => (seriesOf(x.id) === sid && x.date >= from ? { ...x, ...patch, ...(shift ? { date: iso(addDays(fromIso(x.date), shift)) } : {}) } : x)) });
        return;
      }
      const prev = c.series[sid];
      write(scope, { ...c, series: { ...c.series, [sid]: { from: prev && prev.from < from ? prev.from : from, patch: { ...prev?.patch, ...patch }, shift: (prev?.shift ?? 0) + (shift ?? 0) || undefined } } });
    },
    reshape: (e, instead) => {
      const c = cur();
      const from = e.orig ?? e.date;
      const sid = seriesOf(e.id);
      write(scope, { ...c, dropped: { ...c.dropped, [sid]: from }, added: [...c.added.filter((x) => !(seriesOf(x.id) === sid && x.date >= from)), ...instead] });
    },
    keepTemplate: (t) => { const c = cur(); write(scope, { ...c, templates: [t, ...c.templates.filter((x) => x.k !== t.k)] }); },
    book: (e, name, via) => { const c = cur(); const key = keyOf(e); write(scope, { ...c, bookings: [...c.bookings.filter((b) => !(b.key === key && b.name === name)), { key, name, via }] }); },
    unbook: (e, name) => { const c = cur(); const key = keyOf(e); write(scope, { ...c, bookings: c.bookings.filter((b) => !(b.key === key && b.name === name)) }); },
  };
}
export function useEventWriter(): EventWriter {
  const { scope } = useStaffCommunity();
  return useMemo(() => writerFor(scope), [scope]);
}

/** The fields that describe an event (as opposed to who came, notes, requests): a change to these is saved for every
 * screen; anything else stays on the screen it was made on. */
const DEF: (keyof CalEvent)[] = ["title", "start", "end", "room", "kind", "cat", "color", "catLabel", "cap", "lantern", "desc", "cost", "interests", "wanted", "rule", "approval", "cancelled", "date", "newsletter", "plan", "stops"];
const differs = (a: unknown, b: unknown) => JSON.stringify(a) !== JSON.stringify(b);

/**
 * A screen's events (Calendar, Today): the server's list with this browser's changes on it, plus changes made on this
 * screen. `update` keeps a change to one date: what describes the event is saved for every screen; the rest (requests,
 * notes, attendance) stays here.
 */
export function useEventBoard(initial: CalEvent[]) {
  const ch = useEventChanges();
  const w = useEventWriter();
  const [local, setLocal] = useState<Record<string, CalEvent>>({});
  const events = useMemo(() => applyChanges(initial, ch).map((e) => { const l = local[keyOf(e)]; return l ? { ...l, ...pick(e) } : e; }), [initial, ch, local]);
  const update = (e: CalEvent) => {
    const k = keyOf(e);
    const was = events.find((x) => keyOf(x) === k);
    const patch: Partial<CalEvent> = {};
    for (const f of DEF) if (was && differs(was[f], e[f])) (patch as Record<string, unknown>)[f] = e[f];
    if (Object.keys(patch).length) w.one(e, patch);
    setLocal((m) => ({ ...m, [k]: e }));
  };
  /** Every date from this one on: time, room or cancelled. */
  const series = (e: CalEvent, patch: Partial<CalEvent>, shift?: number) => w.series(e, patch, shift);
  return { events, update, series, writer: w };
}
/** The describing fields of an event as the shared changes have it, laid over a screen's own copy. */
const pick = (e: CalEvent): Partial<CalEvent> => {
  const out: Partial<CalEvent> = { date: e.date, orig: e.orig };
  for (const f of DEF) (out as Record<string, unknown>)[f] = e[f];
  return out;
};

/** "Every Tuesday" for a weekly event moved to another day. */
export const everyDay = (date: string) => `Every ${dayName(fromIso(date))}`;
