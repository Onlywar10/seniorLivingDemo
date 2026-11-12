"use client";

// The real week page: the server's events for the week, with anything staff added or changed in this browser (so an
// event posted a moment ago on Post is there), and "I'll go" saved where the staff calendar sees it.
import { useMemo } from "react";
import type { CalEvent } from "@/data/staff/calEvents";
import type { PoolEvent } from "@/data/staff/pool";
import type { WeekPageData } from "@/data/staff/weekPage";
import { addDays, fromIso, iso } from "@/lib/clock";
import { interestsFromTitle } from "@/lib/eventInterests";
import { draftDescription, draftPlan } from "@/lib/eventPlan";
import { placesText } from "@/lib/places";
import { applyChanges, keyOf, useCommunityChanges, writerFor } from "../staff/eventStore";
import { WeekPage, type WeekItem } from "./WeekPage";

/** A week-page event in the shape the staff changes apply to. */
export const poolToCal = (e: PoolEvent): CalEvent => ({ ...e, catLabel: "", booked: e.booked?.map((name) => ({ name, via: "" })) });

/** The week's activities as one resident sees them: picked if they match an interest, "Going" if they're booked. */
export function weekItems(events: CalEvent[], who: { name: string; interests: string[] }, weekFrom: string, newKeys: string[] = []): WeekItem[] {
  const last = iso(addDays(fromIso(weekFrom), 6));
  const all = events
    .filter((e) => e.date >= weekFrom && e.date <= last && !e.cancelled && !e.lantern && e.cat !== "lantern" && e.cat !== "faith" && e.cat !== "movies" && !e.approval)
    .map((e) => {
      const ints = e.interests?.length ? e.interests : interestsFromTitle(e.title);
      return {
        key: keyOf(e), date: e.date, start: e.start, end: e.end, title: e.title, room: e.stops?.length ? `Off campus: ${placesText(e.stops)} (the bus leaves from the lobby)` : e.room, cap: e.cap, taken: e.taken,
        desc: e.desc || draftDescription(e), plan: e.plan?.length ? e.plan : draftPlan(e),
        picked: ints.filter((i) => who.interests.includes(i)),
        going: (e.booked ?? []).some((b) => b.name === who.name),
        isNew: newKeys.includes(keyOf(e)),
      };
    });
  return pickFew(all);
}

/** Most activities match something a resident enjoys, so only the best few are picked out: at most two a day and
 * eight a week, those matching more interests first, then outings and anything with seats. A new event that matches
 * is always picked. */
const PER_DAY = 2, PER_WEEK = 8;
function pickFew(items: WeekItem[]): WeekItem[] {
  const score = (x: WeekItem) => (x.isNew ? 100 : 0) + x.picked.length * 10 + (x.cap !== undefined ? 3 : 0);
  const ranked = items.filter((x) => x.picked.length).sort((a, b) => score(b) - score(a) || a.date.localeCompare(b.date) || a.start - b.start);
  const keep = new Set<string>();
  const perDay: Record<string, number> = {};
  for (const x of ranked) {
    if (!x.isNew && (keep.size >= PER_WEEK || (perDay[x.date] ?? 0) >= PER_DAY)) continue;
    keep.add(x.key);
    perDay[x.date] = (perDay[x.date] ?? 0) + 1;
  }
  return items.map((x) => (keep.has(x.key) ? x : { ...x, picked: [] }));
}

export function LiveWeek({ data }: { data: WeekPageData }) {
  const ch = useCommunityChanges(data.slug);
  const w = useMemo(() => writerFor(data.slug), [data.slug]);
  const events = useMemo(() => applyChanges(data.events.map(poolToCal), ch), [data.events, ch]);
  const items = weekItems(events, data.resident, data.weekFrom);
  const find = (x: WeekItem) => events.find((e) => keyOf(e) === x.key);
  return (
    <WeekPage
      brand={data.brand.name}
      first={data.resident.first}
      weekFrom={data.weekFrom}
      todayIso={data.todayIso}
      nowMin={data.nowMin}
      phone={data.brand.phone}
      items={items}
      onGo={(x) => { const e = find(x); if (e) w.book(e, data.resident.name, "Said yes on their week page"); }}
      onCancel={(x) => { const e = find(x); if (e) w.unbook(e, data.resident.name); }}
    />
  );
}
