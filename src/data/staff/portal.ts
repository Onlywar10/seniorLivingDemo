// The staff workspace, organised by job: who is signed in, everything waiting on them ("Needs you"), today's
// schedule, each resident's record with their family, and the sales lists. Built from one community's staff data
// and calendar, so Alder Bend and Kestrel Point get the same screens with their own people. Server Components only.
import { communities, type CommunitySlug } from "@/data/communities";
import { addDays, dayShort, fmtTime, fromIso, hash, iso, nowMinutes, today } from "@/lib/clock";
import { kindOf } from "@/data/shared";
import { eventRequests, suggestions, when, type EventRequest } from "./alpha";
import { getStaffData, planRows } from "./index";
import { ago, type StaffData, type StaffRole } from "./shared";

const first = (n = "") => n.split(" ")[0];
const last = (n = "") => n.split(" ").slice(-1)[0];

/* ------------------------------------------------------------ who is signed in */

export interface Viewer { as: StaffRole; key: string; name: string; first: string; title: string; preset: "Approver" | "Sales" | "Administrator" }

export function viewer(slug: CommunitySlug, as: StaffRole): Viewer {
  const s = getStaffData(slug);
  const key = as === "sales" ? s.roles.tours : as === "manager" ? s.roles.approver : s.roles.calendar;
  const p = s.people[key];
  return { as, key, name: p.name, first: first(p.name), title: p.role, preset: as === "sales" ? "Sales" : as === "manager" ? "Administrator" : "Approver" };
}

/** The three people a visitor can be signed in as, for the "signed in as" switch. */
export function viewers(slug: CommunitySlug): Viewer[] {
  return (["events", "sales", "manager"] as const).map((as) => viewer(slug, as));
}

/* ------------------------------------------------------------ "Needs you": one queue per person */

interface Base { id: string; for: StaffRole; mins: number; ago: string }
export interface EventLine { title: string; when: string; place: string; seatsLeft?: number; cap?: number; waitlist?: number; kind: string }

export type QItem = Base &
  (
    | { kind: "post"; title: string; postKind: string; by: string; byRole: string; detail: string; photo?: string; channels: string[]; note?: string; diff?: [string, string] }
    | { kind: "rsvp" | "seat"; from: string; relation: string; resident: string; event: EventLine; party: number; note?: string; lang: string; how: string; said: string }
    | { kind: "ask"; request: "rsvp" | "seat"; from: string; relation: string; resident: string; event: EventLine; party: number; asked: string; lang: string; how: string }
    | { kind: "inquiry"; name: string; interest: string; source: string; msg: string; phone: string; replied: string }
    | { kind: "reply"; from: string; relation: string; resident: string; lang: string; text: string; original?: string; why: string; suggestion?: string; handled: number }
    | { kind: "verify"; name: string; says: string; resident: string; via: string; agreed: string; phone: string }
    | { kind: "stale"; page: string; detail: string; days: number; due: string; href: string }
  );

/** How a family member hears back: their channel, in their language. */
function howOf(s: StaffData, name: string) {
  const c = s.contacts.find((x) => x.contact === name);
  return { how: !c ? "text" : c.channel === "Email" ? "email" : c.channel === "SMS" ? "text" : "text and email", lang: c?.lang ?? "English" };
}

const eventLine = (r: EventRequest): EventLine => ({
  title: r.event.title, when: when(r.event), place: r.event.place, cap: r.event.cap, waitlist: r.event.waitlist, kind: r.event.kind,
  seatsLeft: r.event.cap ? Math.max(0, r.event.cap - (r.event.taken ?? 0)) : undefined,
});

/** A phone number in the community's area code for someone who wrote in (stable for the name). */
const phoneFor = (s: StaffData, name: string) => `${s.brand.phone.slice(0, 5)} 555-0${String(100 + (hash(name) % 899)).padStart(3, "0")}`;

/** Why the AI handed a reply to a person rather than answering it. */
const whyNot = ["It reads as an RSVP and a question at once, so it wasn’t sure what was being asked.", "It asks about a seat on a full outing, which staff decide.", "It mentions how a resident is feeling.", "It asks about care, which the AI never answers."];

export function queue(slug: CommunitySlug): QItem[] {
  const s = getStaffData(slug);
  const out: QItem[] = [];
  const ppl = (k: string) => s.people[k] ?? { name: k, role: "" };

  // Posts waiting for the manager's approval.
  s.approvals.forEach((a) =>
    out.push({ id: `post-${a.id}`, for: "manager", mins: a.mins, ago: ago(a.mins), kind: "post", title: a.title, postKind: a.kind, by: ppl(a.by).name, byRole: ppl(a.by).role, detail: a.detail, photo: a.photo, channels: a.channels, note: a.note, diff: a.diff }),
  );

  // Family RSVPs and seat requests. The resident is asked first, by text; staff see them once she says yes,
  // or when she hasn't answered, so someone asks her in person.
  for (const r of eventRequests(slug)) {
    if (r.kind !== "family-rsvp" && r.kind !== "seat-request") continue;
    if (r.status !== "waiting" && r.status !== "checking") continue;
    const { how, lang } = howOf(s, r.from);
    const common = { from: r.from, relation: r.relation ?? "Family", resident: r.resident ?? "", event: eventLine(r), party: r.party, lang, how };
    if (r.status === "waiting")
      out.push({ id: `req-${r.id}`, for: "events", mins: r.mins, ago: ago(r.mins), kind: r.kind === "family-rsvp" ? "rsvp" : "seat", ...common, note: r.note, said: `${first(r.resident)} said yes by text, ${ago(Math.max(1, r.mins - 9))}` });
    else
      out.push({ id: `ask-${r.id}`, for: "events", mins: r.mins, ago: ago(r.mins), kind: "ask", request: r.kind === "family-rsvp" ? "rsvp" : "seat", ...common, asked: `Asked by text ${ago(r.mins + 60 * 20)}. No answer yet.` });
  }

  // New inquiries for sales to call. The instant reply has already gone.
  s.enquiries
    .filter((e) => e.status === "New")
    .forEach((e) => out.push({ id: `inq-${hash(e.name)}`, for: "sales", mins: e.mins, ago: ago(e.mins), kind: "inquiry", name: e.name, interest: e.interest, source: e.source, msg: e.msg, phone: phoneFor(s, e.name), replied: "Instant reply sent by text and email" }));

  // Family replies the AI couldn't handle on its own. Everything else it answered, within what that family may do.
  s.threads
    .filter((t) => t.unread)
    .forEach((t, i) => {
      const m = [...t.msgs].reverse().find((x) => !x.me);
      if (!m) return;
      out.push({ id: `reply-${t.id}`, for: "events", mins: t.mins, ago: ago(t.mins), kind: "reply", from: t.from, relation: t.relation, resident: t.resident, lang: t.lang, text: m.text, original: m.original, why: whyNot[i % whyNot.length], suggestion: s.suggestions[t.id], handled: 12 + (hash(slug) % 9) });
    });

  // A family member who signed up from the QR poster, naming their resident. The resident has agreed by text;
  // staff check they are who they say before they hear about her.
  const fam = verifyCandidate(s);
  out.push({ id: `verify-${hash(fam.name)}`, for: "events", mins: 60 * 4 + 20, ago: ago(60 * 4 + 20), kind: "verify", ...fam });

  // The page going stale this week.
  out.push({ id: "stale-fitness", for: "events", mins: 60 * 9, ago: ago(60 * 9), kind: "stale", page: "Fitness classes", detail: "Not updated for 6 days. Next week’s class schedule is due.", days: 6, due: "Due tomorrow", href: "/staff/post?type=flyer" });

  return out.sort((a, b) => a.mins - b.mins);
}

/** The self sign-up waiting for a check (the same person appears on the resident's record in People). */
function verifyCandidate(s: StaffData) {
  const c = s.contacts.find((x) => /^(Son|Daughter)$/.test(x.relation) && x.lang === "English" && !x.lantern) ?? s.contacts[0];
  const given = ["Ellen", "Grace", "Paul", "Nathan"][hash(c.resident) % 4];
  const rel = given === "Paul" || given === "Nathan" ? "Grandson" : "Daughter";
  return { name: `${given} ${last(c.resident)}`, says: `${rel} of ${c.resident}`, resident: c.resident, via: "Signed up from the QR poster", agreed: `${first(c.resident)} agreed by text`, phone: phoneFor(s, given) };
}

/** The queue for one person, newest first. Its length is the one "waiting" number in the workspace. */
export const queueFor = (slug: CommunitySlug, as: StaffRole) => queue(slug).filter((q) => q.for === as);

/* ------------------------------------------------------------ today's schedule */

export interface TodayEvent { id: string; title: string; start: number; end?: number; time: string; place: string; kind: string; lantern: boolean; cap?: number; taken?: number; state: "done" | "now" | "later"; came?: number; expected: number; pool: string[] }

export function schedule(slug: CommunitySlug): TodayEvent[] {
  const s = getStaffData(slug);
  const c = communities[slug];
  const t = today();
  const now = nowMinutes();
  return c
    .staffEventsOn(t, iso(t))
    .filter((e) => e.cat !== "movies" && e.cat !== "faith")
    .map((e) => {
      const h = hash(e.id);
      const lantern = !!e.lantern || e.cat === "lantern";
      const pool = lantern ? s.lanternNames : s.residentNames;
      const n = Math.min(pool.length, 14 + (h % 8));
      const end = e.end ?? e.start + 60;
      const expected = e.cap ? e.taken ?? e.cap : 8 + (h % 18);
      const state = end <= now ? "done" : e.start <= now ? "now" : "later";
      return {
        id: e.id, title: e.title, start: e.start, end: e.end, time: fmtTime(e.start), place: e.room, kind: kindOf(e), lantern, cap: e.cap, taken: e.taken,
        state, expected, came: state === "done" && h % 3 !== 0 ? Math.max(2, Math.round(expected * (0.6 + (h % 30) / 100))) : undefined,
        pool: Array.from({ length: n }, (_, i) => pool[(h + i * 5) % pool.length]).filter((x, i, a) => a.indexOf(x) === i),
      } as TodayEvent;
    })
    .sort((a, b) => a.start - b.start);
}

/** The week at a glance, for the manager: what's coming that families or the public will notice. */
export function weekAhead(slug: CommunitySlug) {
  const c = communities[slug];
  const t = today();
  const reqs = eventRequests(slug);
  return c
    .staffEventsBetween(addDays(t, 1), 7, iso(t))
    .flatMap((d) => d.events)
    .filter((e) => kindOf(e) !== "resident" || (e.cap && e.cat === "trips"))
    .slice(0, 6)
    .map((e) => ({
      id: e.id, title: e.title, when: `${dayShort(fromIso(e.date))}, ${fmtTime(e.start)}`, kind: kindOf(e),
      note: kindOf(e) === "family" ? `${reqs.filter((r) => r.event.id === e.id && r.kind === "family-rsvp").length} family RSVPs` : kindOf(e) === "public" ? "Open to everyone" : e.cap ? `${e.taken ?? 0} of ${e.cap} seats taken${e.waitlist ? `, ${e.waitlist} waiting` : ""}` : "",
    }));
}

/* ------------------------------------------------------------ people: each resident and their family */

export type FamilyStatus = "Joined" | "Invited" | "Waiting for a check" | "Stopped";
export type Access = "Their resident" | "Community news";
export interface FamilyMember { name: string; relation: string; channel: string; lang: string; status: FamilyStatus; access: Access; phone: string; email: string; note?: string }
export interface ResidentRecord {
  name: string; apt: string; lantern: boolean;
  /** The resident's own messages. */
  channel: "Text and email" | "Text" | "Email" | "Print only"; lang: string;
  photoConsent: boolean;
  /** Whether family with access see what she's signed up for and her photos. */
  shares: boolean;
  family: FamilyMember[];
}

export function residents(slug: CommunitySlug): ResidentRecord[] {
  const s = getStaffData(slug);
  const v = verifyCandidate(s);
  const noConsent = new Set(s.photoPresets.flatMap((p) => p.people.filter((x) => !x.consent).map((x) => x.name)));
  const byRes = new Map<string, ResidentRecord>();
  for (const c of s.contacts) {
    const h = hash(c.resident);
    let r = byRes.get(c.resident);
    if (!r) {
      r = {
        name: c.resident, apt: c.apt, lantern: !!c.lantern, lang: c.lang,
        channel: c.lantern ? "Print only" : h % 5 === 0 ? "Print only" : h % 3 === 0 ? "Email" : h % 2 ? "Text and email" : "Text",
        photoConsent: !noConsent.has(c.resident) && h % 9 !== 0, shares: h % 11 !== 0, family: [],
      };
      byRes.set(c.resident, r);
    }
    const hc = hash(c.contact);
    const status: FamilyStatus = !c.sms && !c.emailOpt ? "Stopped" : hc % 13 === 0 ? "Invited" : "Joined";
    r.family.push({ name: c.contact, relation: c.relation, channel: c.channel === "SMS" ? "Text" : c.channel === "Email" ? "Email" : "Text and email", lang: c.lang, status, access: status === "Joined" && r.shares ? "Their resident" : "Community news", phone: c.phone, email: c.email });
  }
  const vr = byRes.get(v.resident);
  if (vr) vr.family.push({ name: v.name, relation: v.says.split(" of ")[0], channel: "Text", lang: "English", status: "Waiting for a check", access: "Community news", phone: v.phone, email: "", note: `${v.via}; ${v.agreed}` });
  // A grandchild invited at move-in who hasn't joined yet, on a couple of records.
  [...byRes.values()].filter((r) => !r.lantern).slice(2, 4).forEach((r, i) => r.family.push({ name: `${["Olivia", "Jacob"][i]} ${last(r.name)}`, relation: i ? "Grandson" : "Granddaughter", channel: "Text", lang: r.lang, status: "Invited", access: "Their resident", phone: phoneFor(s, r.name + i), email: "", note: "Invited at move-in; one reminder sent" }));
  return [...byRes.values()].sort((a, b) => last(a.name).localeCompare(last(b.name)));
}

/* ------------------------------------------------------------ prospects: availability and waitlist */

export function availability(slug: CommunitySlug) {
  const s = getStaffData(slug);
  return planRows(slug).map((p) => ({ code: p.code, name: p.name, kind: p.kind, from: p.from ?? 0, available: p.available, waiting: s.waitlist.filter((w) => w.plan === p.code).length }));
}

/** The waitlist in order (longest waiting first). Names and the plan they want only: no notes. */
export function waitlistInOrder(slug: CommunitySlug) {
  const s = getStaffData(slug);
  return [...s.waitlist].sort((a, b) => b.joinedDays - a.joinedDays).map((w) => ({ name: w.name, plan: w.plan, since: dayShort(addDays(today(), -w.joinedDays)) }));
}

/* ------------------------------------------------------------ resident ideas for the calendar */

export function ideas(slug: CommunitySlug) {
  return suggestions(slug).map((x) => ({ id: x.id, text: x.text, from: x.from, who: x.who, status: x.status, votes: x.votes, ago: x.days === 1 ? "Yesterday" : `${x.days} days ago`, event: x.becameEvent ? { title: x.becameEvent.title, when: dayShort(fromIso(x.becameEvent.date)) } : undefined, note: x.note }));
}
