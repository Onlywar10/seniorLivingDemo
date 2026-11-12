// One resident's life in the community, for their page in People: their week (activities they came to and missed,
// invites and answers, photos they're in, 1:1 visits, family requests, celebrations), what we know about them, their
// family with every message exchanged, staff notes, and participation over a date range for a care conference.
// Built from the same attendance, invites and requests the rest of the staff area shows, so the numbers agree.
// Server only.
import { communities, type CommunitySlug } from "@/data/communities";
import { cats, kindOf, type Cat } from "@/data/shared";
import { addDays, dayShort, fmtTime, fromIso, hash, iso, nowMinutes, today } from "@/lib/clock";
import { eventRequests } from "./alpha";
import { placements, residentNotes, type AreaState } from "./areas";
import { celebrations, engagement, handledByAI, invitesFor, welcomes, type Engagement } from "./engage";
import { getStaffData, rsvpFor } from "./index";
import { residents, type ResidentRecord } from "./portal";

const first = (n = "") => n.split(" ")[0];

export type TimelineKind = "came" | "missed" | "invite" | "photo" | "visit" | "request" | "celebration" | "booked";
export interface TimelineItem {
  id: string; date: string; when: string; kind: TimelineKind; title: string; detail?: string;
  /** The event it's about, so the line opens the activity sheet in Calendar. */
  event?: { id: string; date: string };
  photo?: string;
}

/** A message in a family conversation, either way, on its channel. */
export interface Msg { id: string; me: boolean; who: string; text: string; original?: string; when: string; sort: number; via: string; kind?: "message" | "request" | "update" | "ai" }

/**
 * A family request about the resident that's still open, keyed by its Today card so answering it in either place
 * answers it in both. "ask": the resident hasn't answered (or is in the Lantern), so staff ask in person. "approve":
 * the resident said yes and staff approve it on their behalf.
 */
export interface Pending {
  id: string; card: string; kind: "ask" | "approve"; request: "rsvp" | "seat"; from: string; relation: string; party: number; note?: string;
  event: { id: string; date: string; title: string; when: string; cap?: number; taken?: number; waitlist?: number };
}

export interface ResidentProfile {
  /** The community's today (ISO), for date ranges. */
  today: string;
  record: ResidentRecord;
  eng: Engagement;
  /** With "Who looks after whom" on: their area and who looks after them. */
  area?: string; careBy?: string;
  /** The family member named as legal representative in the move-in paperwork, if any. */
  legal?: string;
  timeline: TimelineItem[];
  upcoming: TimelineItem[];
  /** Messages with each family member, newest last. */
  conversations: Record<string, Msg[]>;
  /** The resident's own messages from us (invites, reminders) and their replies. */
  own: Msg[];
  notes: { id: string; when: string; by: string; text: string }[];
  /** Activities attended in the last 90 days, each with its category, for the Report tab (filtered by range there). */
  attended: { date: string; title: string; cat: string; catLabel: string; color: string }[];
  /** Activities they could have come to (resident activities in their area), per day back, for a participation rate. */
  offered: { date: string; cat: string }[];
  welcome?: ReturnType<typeof welcomes>[number];
  /** Family requests waiting on the resident's answer, or on staff to approve for them. */
  pending: Pending[];
  /** Upcoming activities matching their interests, for "Invite to an activity". */
  suggestions: { id: string; date: string; title: string; when: string; why: string }[];
}

/** The people who came to a past event: the same rule the attendance lists use, so the event sheet and this page agree. */
export function attendeesOf(slug: CommunitySlug, e: { id: string; cap?: number; taken?: number; lantern?: boolean; cat: string }): string[] {
  const s = getStaffData(slug);
  const h = hash(e.id);
  const expected = e.cap ? e.taken ?? e.cap : 8 + (h % 18);
  const came = Math.max(2, Math.min(expected, Math.round(expected * (0.62 + (h % 35) / 100))));
  const pool = e.lantern || e.cat === "lantern" ? s.lanternNames : s.residentNames;
  return Array.from({ length: Math.min(came, pool.length) }, (_, i) => pool[(h + i * 3) % pool.length]);
}

/**
 * For each resident, the share of the attendance lists they're on that count as theirs, so their activities in 30
 * days match their record. The resident page and the attendance report both use it, so they agree.
 */
export function participationKeep(slug: CommunitySlug): Record<string, number> {
  const s = getStaffData(slug);
  const c = communities[slug];
  const t = today();
  const tIso = iso(t);
  const eng = engagement(slug);
  const listed: Record<string, number> = {};
  for (const d of c.staffEventsBetween(addDays(t, -29), 30, tIso))
    for (const e of d.events) {
      if (e.cat === "movies" || e.cat === "faith" || e.date > tIso) continue;
      const lantern = !!e.lantern || e.cat === "lantern";
      for (const n of attendeesOf(slug, { ...e, lantern })) listed[n] = (listed[n] ?? 0) + 1;
    }
  return Object.fromEntries([...s.residentNames, ...s.lanternNames].map((n) => [n, listed[n] ? Math.min(1, (eng[n]?.last30 ?? 0) / listed[n]) : 0]));
}

/** Whether a resident on an event's attendance list counts as having come (see participationKeep). */
export const counts = (name: string, e: { id: string; date: string }, keep: number): boolean => hash(name + e.id + e.date) % 1000 < keep * 1000;

export function residentProfile(slug: CommunitySlug, name: string, areas?: AreaState): ResidentProfile | null {
  const s = getStaffData(slug);
  const c = communities[slug];
  const t = today();
  const now = nowMinutes();
  const tIso = iso(t);
  const engAll = engagement(slug);
  const news = welcomes(slug);
  const w = news.find((x) => x.name === name);
  let record = residents(slug).find((r) => r.name === name);
  if (!record && w) record = { name: w.name, apt: w.apt, lantern: false, channel: "Text", lang: "English", photoConsent: true, shares: true, family: [] };
  const known = record || [...s.residentNames, ...s.lanternNames].includes(name);
  if (!known) return null;
  const isL = s.lanternNames.includes(name);
  record ??= { name, apt: isL ? `Lantern ${1 + (hash(name) % 16)}` : String(1100 + (hash(name) % 300)), lantern: isL, channel: isL ? "Print only" : "Text", lang: "English", photoConsent: true, shares: true, family: [] };
  const eng: Engagement = engAll[name] ?? {
    name, lantern: false, interests: w ? [] : ["Music"], story: "Not written yet. Add a few lines with the resident.", last30: 0, lastDays: w?.days ?? 0,
    lastActivity: "None yet", lastLabel: "Not yet", visits: [], invites: { sent: 0, yes: 0 }, celebrate: true,
  };

  // Their area and who looks after them, when that's switched on.
  let area: string | undefined, careBy: string | undefined;
  if (areas?.on) {
    const p = placements(slug, areas.placed).find((x) => x.name === name);
    area = p?.area?.name; careBy = p?.lead ? s.people[p.lead]?.name : undefined;
  }

  // ---------------------------------------------------------- their week, and the 90 days behind it
  const timeline: TimelineItem[] = [];
  const upcoming: TimelineItem[] = [];
  const attended: ResidentProfile["attended"] = [];
  const offered: ResidentProfile["offered"] = [];
  const quietDays = eng.lastDays >= 7 ? eng.lastDays : 0;
  const isNew = !!w;
  const reqs = eventRequests(slug).filter((r) => r.resident === name);
  const photoOf = s.photoPresets.filter((p) => p.people.some((x) => x.name === name));
  let photoUsed = 0;

  const keep = participationKeep(slug)[name] ?? 0;

  for (const d of c.staffEventsBetween(addDays(t, -89), 97, tIso)) {
    const daysBack = Math.round((t.getTime() - d.date.getTime()) / 864e5);
    for (const e of d.events) {
      if (e.cat === "movies" || e.cat === "faith") continue;
      const lantern = !!e.lantern || e.cat === "lantern";
      if (lantern !== record.lantern) continue;
      const past = e.date < tIso || (e.date === tIso && (e.end ?? e.start + 60) <= now);
      const when = `${dayShort(fromIso(e.date))}, ${fmtTime(e.start)}`;
      const ev = { id: e.id, date: e.date };
      const inv = !lantern && daysBack <= 14 ? invitesFor(slug, e) : null;
      const booked = e.cap ? rsvpFor(s, e.id, e.taken ?? 0, e.waitlist ?? 0, lantern).going.includes(name) : false;
      if (past) {
        if (isNew && daysBack > (w?.days ?? 0)) continue;
        offered.push({ date: e.date, cat: e.cat });
        // On the attendance list, thinned to the resident's own rate (their activities in 30 days), so this page agrees
        // with People, Today and Reports.
        const came = attendeesOf(slug, { ...e, lantern }).includes(name) && !(quietDays && daysBack < quietDays) && counts(name, e, keep);
        if (came) attended.push({ date: e.date, title: e.title, cat: e.cat, catLabel: cats[e.cat as Cat]?.label ?? e.cat, color: cats[e.cat as Cat]?.color ?? "var(--slate)" });
        if (daysBack > 7) continue;
        if (came) {
          timeline.push({ id: `c-${e.id}-${e.date}`, date: e.date, when, kind: "came", title: `Came to ${e.title}`, detail: e.room, event: ev });
          // A photo they're tagged in, from the first activities they came to that wanted photos.
          if (photoUsed < photoOf.length && /paint|craft|party|happy|music|concert|garden|bak|social|trip|bus/i.test(e.title + e.cat)) {
            const p = photoOf[photoUsed++];
            timeline.push({ id: `p-${p.k}`, date: e.date, when, kind: "photo", title: `In a photo from ${e.title}`, detail: record.photoConsent ? (record.shares ? "In the gallery; their family sees it in their update" : "In the gallery") : "Held: no photo consent on file", photo: p.src, event: ev });
          }
        } else if (booked || inv?.yesNames.includes(name)) {
          timeline.push({ id: `m-${e.id}-${e.date}`, date: e.date, when, kind: "missed", title: `Didn’t come to ${e.title}`, detail: booked ? "Had a seat booked" : "Said yes to the invite", event: ev });
        }
      } else if (daysBack >= -7) {
        if (booked) upcoming.push({ id: `b-${e.id}-${e.date}`, date: e.date, when, kind: "booked", title: `Booked on ${e.title}`, detail: e.room, event: ev });
        else if (inv?.yesNames.includes(name)) upcoming.push({ id: `iy-${e.id}-${e.date}`, date: e.date, when, kind: "invite", title: `Said yes to ${e.title}`, detail: `Invited because they like ${inv.interests.join(", ").toLowerCase()}`, event: ev });
        else if (inv?.names.includes(name) && e.date <= iso(addDays(t, 3))) upcoming.push({ id: `in-${e.id}-${e.date}`, date: e.date, when, kind: "invite", title: `Invited to ${e.title}`, detail: `No answer yet · they like ${inv.interests.join(", ").toLowerCase()}`, event: ev });
      }
    }
  }

  // 1:1 visits, family requests and celebrations.
  eng.visits.forEach((v, i) => timeline.push({ id: `v-${i}`, date: iso(addDays(t, -(3 + i * 6))), when: v.date, kind: "visit", title: "1:1 visit", detail: `${v.note} · ${first(v.by)}` }));
  const status = { waiting: "Said yes · with staff to approve", checking: isL ? "To ask in person" : "Asked by text, no answer yet", confirmed: "Approved · family told", declined: "Declined · family told kindly" } as const;
  for (const r of reqs) {
    const item: TimelineItem = { id: `r-${r.id}`, date: iso(addDays(t, -Math.floor(r.mins / 1440))), when: dayShort(addDays(t, -Math.floor(r.mins / 1440))), kind: "request", title: `${r.from} ${r.kind === "seat-request" ? "asked for a seat" : `would like to come${r.party > 1 ? ` (${r.party})` : ""}`}: ${r.event.title}`, detail: status[r.status], event: { id: r.event.id, date: r.event.date } };
    timeline.push(item);
  }
  celebrations(slug).filter((x) => x.who === name && x.kind !== "anniversary").forEach((x) =>
    upcoming.push({ id: `cel-${x.id}`, date: tIso, when: x.when, kind: "celebration", title: x.kind === "birthday" ? "Birthday" : "Welcome", detail: eng.celebrate ? "On Today to post" : "Not celebrated: they’d rather not be" }),
  );
  timeline.sort((a, b) => b.date.localeCompare(a.date) || a.kind.localeCompare(b.kind));
  upcoming.sort((a, b) => a.date.localeCompare(b.date));

  // ---------------------------------------------------------- family conversations
  const conversations: Record<string, Msg[]> = {};
  // "Today, 9:15 am" / "Yesterday, 4:10 pm" / "Sun, Nov 8, 5:00 pm" for something that happened `mins` ago.
  const stamp = (mins: number) => {
    const abs = now - mins;
    const off = Math.floor(abs / 1440);
    const m = Math.round((((abs % 1440) + 1440) % 1440) / 5) * 5;
    return { when: `${off === 0 ? "Today" : off === -1 ? "Yesterday" : dayShort(addDays(t, off))}, ${fmtTime(m)}`, sort: -mins };
  };
  const handled = handledByAI(slug);
  for (const m of record.family) {
    const lines: Msg[] = [];
    const th = s.threads.filter((x) => x.from === m.name);
    th.forEach((x) => x.msgs.forEach((y, i) => lines.push({ id: `${x.id}-${i}`, me: !!y.me, who: y.me ? (i === 0 ? "Kinlight" : first(s.people[s.roles.calendar].name)) : first(m.name), text: y.text, original: y.original, ...stamp(y.mins), via: m.channel === "Email" ? "Email" : "Text" })));
    reqs.filter((r) => r.from === m.name).forEach((r) => {
      lines.push({ id: `rq-${r.id}`, me: false, who: first(m.name), text: r.kind === "seat-request" ? `SEAT (a seat for ${first(name)} on ${r.event.title})` : `RSVP ${r.party} for ${r.event.title}${r.note ? `: “${r.note}”` : ""}`, ...stamp(r.mins), via: r.via, kind: "request" });
      if (r.status === "confirmed" || r.status === "declined") lines.push({ id: `rq-${r.id}-o`, me: true, who: "Kinlight", text: r.status === "confirmed" ? `Confirmed: ${r.event.title}. ${first(name)} said yes and staff approved.` : `${first(name)} can’t make ${r.event.title} this time. Thank you for asking.`, ...stamp(Math.max(5, r.mins - 90)), via: "Text", kind: "request" });
    });
    handled.filter((h) => h.from === m.name).forEach((h, i) => {
      lines.push({ id: `ai-${i}-a`, me: true, who: "Kinlight", text: h.asked.replace(/^“|”$/g, ""), when: h.ago, sort: -(60 * 30 + i), via: "Text", kind: "ai" });
      lines.push({ id: `ai-${i}-b`, me: false, who: first(m.name), text: h.reply, when: h.ago, sort: -(60 * 29 + i), via: "Text", kind: "ai" });
      lines.push({ id: `ai-${i}-c`, me: true, who: "Kinlight", text: `Handled by the AI: ${h.did}`, when: h.ago, sort: -(60 * 28 + i), via: "Note", kind: "ai" });
    });
    if (m.status === "Joined") {
      const sun = addDays(t, -((t.getUTCDay() + 7) % 7 || 7));
      lines.push({ id: `wk-${m.name}`, me: true, who: "Kinlight", text: m.access === "Their resident" ? `This week at ${s.brand.name}, with ${first(name)}’s week and photos.` : `This week at ${s.brand.name} (community news).`, when: `${dayShort(sun)}, 5:00 pm`, sort: -((t.getTime() - sun.getTime()) / 6e4 - 17 * 60), via: m.channel === "Text" ? "Text" : "Email", kind: "update" });
    }
    conversations[m.name] = lines.sort((a, b) => a.sort - b.sort);
  }
  const own: Msg[] = [];
  if (record.channel !== "Print only") {
    const inv = upcoming.find((u) => u.kind === "invite");
    if (inv) own.push({ id: "own-1", me: true, who: "Kinlight", text: `${inv.title.replace(/^(Said yes to|Invited to) /, "")}, ${inv.when}. Want to come, ${first(name)}? Reply YES.`, when: "Yesterday, 10:00 am", sort: -1500, via: record.channel === "Email" ? "Email" : "Text", kind: "message" });
    if (inv?.title.startsWith("Said yes")) own.push({ id: "own-2", me: false, who: first(name), text: "YES", when: "Yesterday, 10:42 am", sort: -1458, via: "Text", kind: "message" });
  }

  // ---------------------------------------------------------- notes, legal representative, invite suggestions
  const by = careBy ?? s.people[record.lantern ? s.roles.lantern : s.roles.calendar].name;
  const notes = w ? [] : residentNotes(slug, name, by).map((n, i) => ({ id: `n${i}`, ...n }));
  if (record.lantern) notes.unshift({ id: "nl", when: "Mon", by: s.people[s.roles.lantern].name, text: `${first(name)} settles best with a hand to hold at the start of an activity.` });
  const legalM = record.family.find((m) => /^(Son|Daughter|Wife|Husband)$/.test(m.relation));
  const legal = legalM && hash(name) % 3 !== 0 ? `${legalM.name} (${legalM.relation.toLowerCase()})` : undefined;
  const ints = new Set(eng.interests);
  const suggestions = c.staffEventsBetween(t, 8, tIso).flatMap((d) => d.events)
    .filter((e) => (e.date > tIso || e.start > now) && !!(e.lantern || e.cat === "lantern") === record!.lantern && kindOf(e) !== "public" && e.cat !== "movies")
    .map((e) => ({ e, inv: invitesFor(slug, e) }))
    .filter(({ inv }) => !inv || inv.interests.some((i) => ints.has(i)))
    .filter(({ e }) => !upcoming.some((u) => u.event?.id === e.id && u.event?.date === e.date && u.kind !== "invite"))
    .slice(0, 6)
    .map(({ e, inv }) => ({ id: e.id, date: e.date, title: e.title, when: `${dayShort(fromIso(e.date))}, ${fmtTime(e.start)}`, why: inv ? `Likes ${inv.interests.filter((i) => ints.has(i)).join(", ").toLowerCase()}` : "" }));

  // ---------------------------------------------------------- waiting on the resident: the same rule as Today's cards
  const pending: Pending[] = reqs
    .filter((r) => (r.kind === "family-rsvp" || r.kind === "seat-request") && (r.status === "waiting" || r.status === "checking"))
    .flatMap((r) => {
      const lantern = record!.lantern || !!r.event.lantern;
      const full = !!r.event.cap && (r.event.taken ?? 0) >= r.event.cap;
      // A yes to a full outing goes on the waitlist by itself: nothing to decide.
      if (r.status === "waiting" && !lantern && full) return [];
      const ask = r.status === "checking" || lantern;
      const item: Pending = {
        id: r.id, card: `${ask ? "ask" : "req"}-${r.id}`, kind: ask ? "ask" : "approve", request: r.kind === "family-rsvp" ? "rsvp" : "seat",
        from: r.from, relation: r.relation ?? "Family", party: r.party, note: r.note,
        event: { id: r.event.id, date: r.event.date, title: r.event.title, when: `${dayShort(fromIso(r.event.date))}, ${fmtTime(r.event.start)}`, cap: r.event.cap, taken: r.event.taken, waitlist: r.event.waitlist },
      };
      return [item];
    });

  return { today: tIso, record, eng, area, careBy, legal, timeline, upcoming, conversations, own, notes, attended, offered, welcome: w, pending, suggestions };
}
