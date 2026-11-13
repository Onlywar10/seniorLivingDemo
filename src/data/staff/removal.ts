// Removing a resident (People): what happens straight away, worked out for this one resident from the same records
// every other screen uses. Their automatic messages (from the Automations log), the upcoming events they're booked on
// (and who on the waitlist gets each seat), celebrations and photo suggestions, open requests and "ask in person"
// items about them, their apartment, and their family contacts. Moving someone to another care area isn't a
// removal: it moves them, so the list says what changes instead. Server Components only.
import { communities, type CommunitySlug } from "@/data/communities";
import { addDays, dayShort, fmtTime, fromIso, iso, today } from "@/lib/clock";
import { eventRequests } from "./alpha";
import { automationNames, sentAbout } from "./automations";
import { celebrations } from "./engage";
import { getStaffData } from "./index";
import { queue } from "./portal";
import { rsvpFor } from "./shared";

export interface RemovalPlan {
  name: string; apt: string; lantern: boolean; legal?: string;
  /** Automatic messages that stop, by automation, with how many went out about them last week. */
  autos: { name: string; n: number }[];
  autoTotal: number;
  /** Upcoming events they're booked on, and who on the waitlist gets the seat. */
  events: { title: string; when: string; seatTo?: string }[];
  celebrations: string[];
  photos: string[];
  /** Open requests and "ask in person" items about them, and the Today cards that close with them. */
  requests: string[];
  cards: string[];
  family: { name: string; relation: string; channel: string; lang: string; status: string }[];
  /** Where else they could live, for "Moved to another care area". */
  areas: string[];
  current: string;
}

export function removalPlan(slug: CommunitySlug, rec: { name: string; apt: string; lantern: boolean; family: { name: string; relation: string; channel: string; lang: string; status: string }[] }, legal?: string): RemovalPlan {
  const s = getStaffData(slug);
  const c = communities[slug];
  const t = today();
  const names = automationNames(slug);
  const sent = sentAbout(slug, rec.name);
  const by = new Map<string, number>();
  sent.forEach((r) => by.set(r.auto, (by.get(r.auto) ?? 0) + 1));
  const autos = [...by.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => ({ name: names[k] ?? k, n }));

  const evs = c.staffEventsBetween(t, 21, iso(t)).flatMap((d) => d.events).filter((e) => e.cap && (e.date > iso(t)));
  const events = evs.flatMap((e) => {
    const { going, waiting } = rsvpFor(s, e.id, e.taken ?? 0, e.waitlist ?? 0, !!e.lantern);
    if (!going.includes(rec.name) || (!!e.lantern !== rec.lantern && (e.lantern || e.cat === "lantern"))) return [];
    return [{ title: e.title, when: `${dayShort(fromIso(e.date))}, ${fmtTime(e.start)}`, seatTo: waiting[0] }];
  }).slice(0, 6);

  const cel = celebrations(slug).filter((x) => x.who === rec.name).map((x) => `${x.kind === "birthday" ? "Birthday" : x.kind === "welcome" ? "Welcome" : "Anniversary"}: ${x.when}`);
  const photos = s.photoPresets.filter((p) => p.people.some((x) => x.name === rec.name)).map((p) => p.title);
  const reqs = eventRequests(slug).filter((r) => r.resident === rec.name && (r.status === "waiting" || r.status === "checking"));
  const cards = queue(slug).filter((q) => (q.kind === "ask" || q.kind === "rsvp" || q.kind === "seat") && q.resident === rec.name).map((q) => q.id);
  const requests = reqs.map((r) => `${r.from}’s ${r.kind === "seat-request" ? "seat request" : "RSVP"} for ${r.event.title}${r.status === "checking" ? " (ask in person)" : ""}`);
  const current = rec.lantern ? "Lantern" : "Independent Living";
  return {
    name: rec.name, apt: rec.apt, lantern: rec.lantern, legal,
    autos, autoTotal: sent.length, events, celebrations: cel, photos, requests, cards,
    family: rec.family.map((m) => ({ name: m.name, relation: m.relation, channel: m.channel, lang: m.lang, status: m.status })),
    areas: ["Independent Living", "Assisted Living", "Lantern"].filter((a) => a !== current),
    current,
  };
}

/** Today in the community, for the "When" date. */
export const todayIsoOf = () => iso(today());
export const yesterdayIso = () => iso(addDays(today(), -1));
