// The events the previews and a resident's week page work from: what's on, without names, notes or requests.
// Safe on the server and in the browser.
import type { EventKind } from "@/data/shared";
import { interestsFromTitle } from "@/lib/eventInterests";
import type { CalEvent } from "./calEvents";

export interface PoolEvent {
  id: string; date: string; start: number; end?: number; title: string; room: string; kind: EventKind; cat: string; color: string;
  cap?: number; taken?: number; lantern?: boolean; desc?: string; interests: string[]; rule?: string; cancelled?: boolean;
  plan?: { at: number; what: string }[];
  stops?: { id: string; name: string; address: string; kind: string; mins: number; x: number; y: number }[];
  /** Who's booked, so a resident who already said yes sees "You're going". */
  booked?: string[];
}

/** One staff calendar event as a pool event. */
export const calToPool = (e: CalEvent, interests?: string[]): PoolEvent => ({
  id: e.id, date: e.date, start: e.start, end: e.end, title: e.title, room: e.room, kind: e.kind, cat: e.cat, color: e.color,
  cap: e.cap, taken: e.taken, lantern: e.lantern, desc: e.desc, rule: e.rule, cancelled: e.cancelled, plan: e.plan, stops: e.stops,
  interests: interests ?? e.interests ?? e.invites?.interests ?? interestsFromTitle(e.title),
  booked: e.booked?.map((b) => b.name),
});

/** What Post's preview needs: the weeks ahead's events and the newsletter's name. */
export interface PreviewSetup {
  pool: PoolEvent[];
  masthead: string;
}
