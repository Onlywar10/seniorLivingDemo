// The staff workspace, organised by job: who is signed in, everything waiting on them ("Needs you"), today's
// schedule, each resident's record with their family, and the sales lists. Built from one community's staff data
// and calendar, so Alder Bend and Kestrel Point get the same screens with their own people. Server Components only.
import { communities, type CommunitySlug } from "@/data/communities";
import { residentHref } from "@/components/staff/residentHref";
import { addDays, dayName, dayShort, fmtTime, fromIso, hash, iso, nowMinutes, today } from "@/lib/clock";
import { kindOf } from "@/data/shared";
import { eventRequests, suggestions, when, type EventRequest } from "./alpha";
import { concerns, handledByAI, readyToReview, type Concern, type Handled, type Review } from "./engage";
import { getStaffData, planRows } from "./index";
import { sitePages } from "./website";
import { careLogin, placements, type AreaState } from "./areas";
import { engagement, eventInterests } from "./engage";
import { STAFF_ROLES, ago, fitnessKey, presetOf, reportsTo, sectionsFor, type Preset, type Section, type StaffData, type StaffRole } from "./shared";
import { SIGNALS, groupOf, type SignalKey, type SignalRule } from "./signals";
import { todaySignals } from "./todaySignals";
import { residentChannel } from "./automations";

const first = (n = "") => n.split(" ")[0];
const last = (n = "") => n.split(" ").slice(-1)[0];

/* ------------------------------------------------------------ who is signed in */

export interface Viewer { as: StaffRole; key: string; name: string; first: string; title: string; preset: Preset }

const keyOf = (s: StaffData, as: StaffRole) =>
  ({ events: s.roles.calendar, fitness: fitnessKey(s), sales: s.roles.tours, manager: s.roles.approver, kitchen: s.roles.menus, desk: s.roles.desk, caregiver: careLogin[s.slug as CommunitySlug], lantern: s.roles.lantern })[as];

export function viewer(slug: CommunitySlug, as: StaffRole): Viewer {
  const s = getStaffData(slug);
  const key = keyOf(s, as);
  const p = s.people[key];
  return { as, key, name: p.name, first: first(p.name), title: p.role, preset: presetOf[as] };
}

/** The people a visitor can be signed in as, for the "signed in as" switch: every role, the caregiver and the Lantern lead included. */
export function viewers(slug: CommunitySlug): Viewer[] {
  return STAFF_ROLES.map((as) => viewer(slug, as));
}

/* ------------------------------------------------------------ "Needs you": one queue per person */

interface Base {
  id: string; for: StaffRole[]; mins: number; ago: string;
  /** When it needs doing by, in minutes from the start of today (sorts the queue), and how that reads on the card. */
  due?: number; dueLabel?: string;
  /** Anyone on the team can pick it up ("Take it"), rather than one person's own. */
  team?: boolean;
  /** Whose it is, when it's one person's (a concern's owner, the approver). */
  owner?: StaffRole;
  /** With "Who looks after whom" on: the resident's area, so the card says "Your resident · Third floor". */
  area?: string;
  /** The kind of signal (its rules are in Settings → Approvals and alerts). */
  signal?: SignalKey;
  /** Why it came to this person: "You own Activities concerns". */
  why?: string;
  /** The resident a card is about, when it's about one (so "Who looks after whom" can route it). */
  about?: string;
  /** What happens if it isn't done in time: "or the post waits until tomorrow". */
  ifNot?: string;
}
export interface EventLine { id: string; date: string; start: number; title: string; when: string; place: string; seatsLeft?: number; cap?: number; waitlist?: number; kind: string }

interface RsvpFields { kind: "rsvp" | "seat"; from: string; relation: string; resident: string; event: EventLine; party: number; note?: string; lang: string; how: string; said: string; full: boolean }
/** A family RSVP or seat request the resident has said yes to. */
export type RsvpItem = Base & RsvpFields;

export type QItem = Base &
  (
    | { kind: "post"; title: string; postKind: string; by: string; byRole: string; detail: string; photo?: string; channels: string[]; note?: string; diff?: [string, string] }
    | RsvpFields
    | { kind: "ask"; request: "rsvp" | "seat"; from: string; relation: string; resident: string; apt?: string; event: EventLine; party: number; asked: string; lang: string; how: string; lantern: boolean;
        /** Other requests about the same resident: staff ask once. */
        more: { card: string; request: "rsvp" | "seat"; from: string; relation: string; event: EventLine; party: number }[] }
    | { kind: "group"; event: EventLine; items: RsvpItem[] }
    | { kind: "inquiry"; name: string; interest: string; source: string; msg: string; phone: string; replied: string }
    | { kind: "reply"; from: string; relation: string; resident: string; lang: string; text: string; original?: string; why: string; suggestion?: string; sources: string[]; handled: Handled[];
        /** Two or three answers to start from, built from the event and the community's own facts. */
        quick: string[]; phone: string }
    | { kind: "verify"; name: string; says: string; resident: string; via: string; agreed: string; phone: string }
    | { kind: "stale"; page: string; detail: string; days: number; dueText: string; href: string }
    | { kind: "concern"; c: Concern; phone: string }
    | { kind: "review"; r: Review }
    /** Anything else that needs a person, from another section: attendance, a room clash, ideas, pages, tours… */
    | { kind: "task"; type: string; icon: "users" | "image" | "alert" | "heart" | "sms" | "fork" | "globe" | "building" | "list" | "chart" | "check";
        title: string; context?: string; help: string; quote?: string; lines?: string[];
        main: { label: string; href?: string; done?: string }; second?: { label: string; href?: string; done?: string } }
  );

/** How a family member hears back: their channel, in their language. */
function howOf(s: StaffData, name: string) {
  const c = s.contacts.find((x) => x.contact === name);
  return { how: !c ? "text" : c.channel === "Email" ? "email" : c.channel === "SMS" ? "text" : "text and email", lang: c?.lang ?? "English" };
}

const eventLine = (r: EventRequest): EventLine => ({
  id: r.event.id, date: r.event.date, start: r.event.start, title: r.event.title, when: when(r.event), place: r.event.place, cap: r.event.cap, waitlist: r.event.waitlist, kind: r.event.kind,
  seatsLeft: r.event.cap ? Math.max(0, r.event.cap - (r.event.taken ?? 0)) : undefined,
});

/** A phone number in the community's area code for someone who wrote in (stable for the name). */
const phoneFor = (s: StaffData, name: string) => `${s.brand.phone.slice(0, 5)} 555-0${String(100 + (hash(name) % 899)).padStart(3, "0")}`;

/** Why the AI handed a reply to a person rather than acting on it. It only acts on clear answers to its own questions. */
const whyNot = [
  "It’s a question, not an answer to one of Kinlight’s own questions, so the AI doesn’t act on it.",
  "It asks about a seat on a full outing, which staff decide.",
  "It mentions how a resident is feeling.",
  "It asks about care, which the AI never answers.",
];

/** A reply staff can send: only facts from the calendar, the event and Kinlight's records, with where each came from. */
function draftFor(slug: CommunitySlug, t: StaffData["threads"][number]): { text?: string; sources: string[] } {
  const c = communities[slug];
  // Only events still to come, matched on a distinctive word from the conversation ("orchard"), never a generic one.
  const now = nowMinutes();
  const evs = c.staffEventsBetween(today(), 14, iso(today())).flatMap((d) => d.events).filter((e) => e.date > iso(today()) || e.start > now);
  const generic = new Set(["happy", "hour", "trip", "waitlist", "photos", "family", "club", "class", "night"]);
  const words = t.subject.toLowerCase().split(/\s+/).filter((w) => w.length > 3 && !generic.has(w)).map((w) => w.replace(/s$/, ""));
  const mentioned = words.length ? evs.find((e) => words.some((w) => e.title.toLowerCase().includes(w))) : undefined;
  const res = first(t.resident);
  const fam = first(t.from);
  if (!mentioned) return { sources: [] };
  const at = `${dayShort(fromIso(mentioned.date))} at ${fmtTime(mentioned.start)}`;
  const name = mentioned.title.replace(/^Bus Trip: /, "");
  const src = [`The calendar: ${mentioned.title}, ${at}${mentioned.room ? `, ${mentioned.room}` : ""}`];
  if (mentioned.cap) {
    const left = Math.max(0, mentioned.cap - (mentioned.taken ?? 0));
    src.push(left ? `The seat list: ${left} of ${mentioned.cap} left` : `The seat list: full, ${mentioned.waitlist ?? 0} on the waitlist`);
    return {
      sources: src,
      text: left
        ? `Hi ${fam}! There ${left === 1 ? "is 1 seat" : `are ${left} seats`} left on ${name} (${at}). Want one for ${res}? Reply SEAT and we’ll ask ${res}.`
        : `Hi ${fam}! ${name} (${at}) is full, and ${res} is on the waitlist. If a seat opens we’ll text you both straight away.`,
    };
  }
  const desc = mentioned.desc ? ` ${mentioned.desc.split(/(?<=[.!])\s/)[0]}` : "";
  if (desc) src.push("The event’s description");
  return { sources: src, text: `Hi ${fam}! ${name} is ${at}${mentioned.room ? ` in ${mentioned.room}` : ""}.${desc} Would you like to join ${res}? Reply with how many are coming and we’ll check with ${res}.` };
}

/**
 * The whole community's queue: the cards that started here (approvals, family requests, inquiries, replies, concerns,
 * reviews, a new family member), plus everything gathered from the other sections. Built once a minute per community,
 * because the menu and the page both need it.
 */
const built = new Map<string, QItem[]>();
export function queue(slug: CommunitySlug): QItem[] {
  const k = `${slug}|${iso(today())}|${nowMinutes()}`;
  const hit = built.get(k);
  if (hit) return hit.map((q) => ({ ...q }));
  const names = Object.fromEntries(STAFF_ROLES.map((r) => [r, viewer(slug, r).name])) as Record<StaffRole, string>;
  const roleOfName = (n?: string) => (n ? STAFF_ROLES.find((r) => names[r] === n) : undefined);
  const out = stamp([...baseQueue(slug), ...todaySignals(slug, roleOfName, names)]);
  built.clear();
  built.set(k, out);
  return out.map((q) => ({ ...q }));
}

/** The cards that start here, without the ones gathered from other sections (Communications reads these replies). */
export function baseQueue(slug: CommunitySlug): QItem[] {
  const s = getStaffData(slug);
  const out: QItem[] = [];
  const ppl = (k: string) => s.people[k] ?? { name: k, role: "" };
  const lanternSet = new Set(s.lanternNames);
  const handled = handledByAI(slug);

  // Posts waiting for approval: the activities team's posts with resident photos go to the activities director;
  // prices and special menus to the executive director.
  s.approvals.forEach((a) =>
    out.push({ id: `post-${a.id}`, for: [a.to], mins: a.mins, ago: ago(a.mins), kind: "post", title: a.title, postKind: a.kind, by: ppl(a.by).name, byRole: ppl(a.by).role, detail: a.detail, photo: a.photo, channels: a.channels, note: a.note, diff: a.diff }),
  );

  // Family RSVPs and seat requests. The resident is asked first, by text; staff see them once the resident says yes,
  // or when there's no answer, so someone asks in person. Lantern residents aren't texted: staff ask in person.
  for (const r of eventRequests(slug)) {
    if (r.kind !== "family-rsvp" && r.kind !== "seat-request") continue;
    if (r.status !== "waiting" && r.status !== "checking") continue;
    const { how, lang } = howOf(s, r.from);
    const ev = eventLine(r);
    const common = { from: r.from, relation: r.relation ?? "Family", resident: r.resident ?? "", event: ev, party: r.party, lang, how };
    const lantern = lanternSet.has(r.resident ?? "") || !!r.event.lantern;
    // The resident said yes by text: staff approve it (the alpha rule: the resident says yes, then staff approve), or
    // add them to the waitlist when it's full. A resident who hasn't answered, or a Lantern resident, is asked in person.
    if (r.status === "waiting" && !lantern) {
      // A seat on an outing that's full: the resident goes on the waiting list automatically and the family is told.
      // Nobody needs to decide that, so there's no card; it shows on the event's sheet.
      if (ev.seatsLeft === 0) continue;
      out.push({ id: `req-${r.id}`, for: ["events"], mins: r.mins, ago: ago(r.mins), kind: r.kind === "family-rsvp" ? "rsvp" : "seat", ...common, note: r.note, said: `${first(r.resident)} said yes by text, ${ago(Math.max(1, r.mins - 9))}`, full: ev.seatsLeft === 0 });
      continue;
    }
    out.push({
        id: `ask-${r.id}`, for: [lantern ? "lantern" : "events"], mins: r.mins, ago: ago(r.mins), kind: "ask", request: r.kind === "family-rsvp" ? "rsvp" : "seat", ...common, lantern,
        apt: s.contacts.find((c) => c.resident === r.resident)?.apt,
        asked: lantern ? "Lantern: asked in person, not by text" : `Asked by text ${ago(r.mins + 60 * 20).toLowerCase()}, no answer`, more: [],
      });
  }

  // New inquiries for sales to call. Hidden in the alpha (no sales in Kinlight yet); kept for when it comes back.
  s.enquiries
    .filter((e) => e.status === "New" && STAFF_ROLES.includes("sales"))
    .forEach((e) => out.push({ id: `inq-${hash(e.name)}`, for: ["sales"], mins: e.mins, ago: ago(e.mins), kind: "inquiry", name: e.name, interest: e.interest, source: e.source, msg: e.msg, phone: phoneFor(s, e.name), replied: "Instant reply sent by text and email" }));

  // Family replies the AI couldn't act on. It acts only on clear answers to Kinlight's own questions.
  s.threads
    .filter((t) => t.unread)
    .map((t) => ({ t, d: draftFor(slug, t) }))
    // One reply on a normal day: a family writing in their own language (Kinlight translates both ways) first.
    .sort((a, b) => Number(!!b.t.msgs.some((m) => m.original)) - Number(!!a.t.msgs.some((m) => m.original)) || Number(!!b.d.text) - Number(!!a.d.text))
    .slice(0, 1)
    .map(({ t }) => t)
    .forEach((t, i) => {
      const m = [...t.msgs].reverse().find((x) => !x.me);
      if (!m) return;
      const d = draftFor(slug, t);
      // Read with the conversation before it ("Happy Hour on Friday…"), so the reply is about the right event.
      const quick = quickReplies(slug, t.from, t.resident, t.msgs.map((x) => x.text).join(" "), d.text);
      out.push({ id: `reply-${t.id}`, for: ["events"], mins: t.mins, ago: ago(t.mins), kind: "reply", from: t.from, relation: t.relation, resident: t.resident, lang: t.lang, text: m.text, original: m.original, why: whyNot[i % whyNot.length], suggestion: d.text, sources: quick.src ? [...new Set([...d.sources, quick.src])] : d.sources, handled, quick: quick.list, phone: phoneOf(s, t.from) });
    });

  // An open question for the front desk, and a diet question for the kitchen: the AI passes these to the right person.
  // People who aren't already in a conversation, so each question is its own conversation in Communications.
  const free = (c: (typeof s.contacts)[number]) => !s.threads.some((t) => t.from === c.contact);
  const fd = s.contacts.find((c) => c.channel !== "Email" && !c.lantern && c.lang === "English" && free(c)) ?? s.contacts[0];
  out.push({ id: "reply-desk", for: ["desk"], mins: 50, ago: ago(50), kind: "reply", from: fd.contact, relation: fd.relation, resident: fd.resident, lang: fd.lang, text: `We’re bringing ${first(fd.resident)}’s grandkids on Thanksgiving. Is there somewhere to park a van?`, why: "It’s an open question, not an answer to one of Kinlight’s questions. Visiting and parking go to the front desk.", sources: ["The community’s visiting and parking details"], handled, phone: phoneOf(s, fd.contact),
    quick: [`Hi ${first(fd.contact)}! Visitor parking is by the front entrance. Please check in at the front desk when you arrive. Happy Thanksgiving!`, `Let me check and get back to you today.`] });
  const kd = s.contacts.find((c) => c.relation === "Daughter" && !c.lantern && c !== fd && free(c)) ?? s.contacts[1];
  out.push({ id: "reply-kitchen", for: ["kitchen"], mins: 130, ago: ago(130), kind: "reply", from: kd.contact, relation: kd.relation, resident: kd.resident, lang: kd.lang, text: `Can ${first(kd.resident)} get the soup without the cream? The doctor wants less dairy.`, why: "It mentions a resident’s health, which the AI never answers. Diet questions go to the kitchen.", sources: [], handled, phone: phoneOf(s, kd.contact),
    quick: [`Thank you for letting us know. I’ll check with the chef about ${first(kd.resident)}’s soup and get back to you today.`, `Thank you. I’ll talk with ${first(kd.resident)} at lunch and get back to you.`] });

  // Family concerns, each with its owner. Never answered by AI.
  const viewerOf: Record<string, StaffRole> = { [s.roles.calendar]: "events", [s.roles.tours]: "sales", [s.roles.approver]: "manager", [s.roles.menus]: "kitchen", [s.roles.desk]: "desk", [s.roles.lantern]: "lantern" };
  concerns(slug)
    .filter((c) => c.status !== "Resolved" && !c.care)
    .forEach((c) => out.push({
      id: `concern-${c.id}`, for: [viewerOf[c.owner] ?? "manager"], owner: viewerOf[c.owner] ?? "manager", mins: c.mins, ago: c.ago, kind: "concern", c, phone: phoneOf(s, c.from),
      // Owned by a department head who doesn't sign in to Kinlight (the business office): the executive director follows it up.
      why: viewerOf[c.owner] ? undefined : `${first(c.ownerName)} (${ppl(c.owner).role}) owns it and doesn’t use Kinlight, so you follow it up`,
    }));

  // Things Kinlight prepared that its owner must approve (the newsletter) or check (dishes it wasn't sure of).
  // An import Kinlight read goes back to whoever imported it (the activities calendar); the photo captions to the
  // activities team. Next week's menu checks come from Menus itself, below.
  readyToReview(slug)
    .map((r) => ({ r, to: (r.for.length ? r.for : r.kind === "import" || r.kind === "captions" ? ["events"] : []) as StaffRole[] }))
    .filter((x) => x.to.length > 0)
    .forEach(({ r, to }) => out.push({ id: r.id, for: to, mins: 60 * 6, ago: r.due, kind: "review", r, signal: r.kind === "import" ? "import-check" : "review" }));

  // A family member who signed up from the QR poster, waiting for a check (their resident agreed by text).
  const v = verifyCandidate(s);
  out.push({ id: `verify-${hash(v.name)}`, for: ["events"], mins: 60 * 26, ago: ago(60 * 26), kind: "verify", ...v, signal: "family-member" });


  return stamp(tidy(out.sort((a, b) => a.mins - b.mins)));
}

/** A family member's phone number, from their contact record (or a stable one in the community's area code). */
const phoneOf = (s: StaffData, name: string) => s.contacts.find((c) => c.contact === name)?.phone ?? phoneFor(s, name);

/**
 * Two or three replies to start from: the event they asked about (found by its name, or by its day), then a general
 * answer, then "let me check". Facts from the calendar and how requests work only: no promises (a seat, a table, a
 * space), which are staff's to add. Nothing about care or health.
 */
function quickReplies(slug: CommunitySlug, from: string, resident: string, text: string, draft?: string): { list: string[]; src?: string } {
  const c = communities[slug];
  const t = today();
  const now = nowMinutes();
  const low = text.toLowerCase();
  const stop = new Set(["with", "from", "your", "trip", "club", "class", "bus", "the", "and"]);
  const evs = c.staffEventsBetween(t, 14, iso(t)).flatMap((d) => d.events).filter((e) => e.date > iso(t) || e.start > now);
  const score = (e: (typeof evs)[number]) => {
    const words = e.title.toLowerCase().replace(/^bus trip: /, "").split(/[^a-z]+/).filter((w) => w.length > 3 && !stop.has(w));
    const hits = words.filter((w) => low.includes(w)).length;
    return hits + (low.includes(dayName(fromIso(e.date)).toLowerCase()) ? 1 : 0) + (low.includes(e.title.toLowerCase()) ? 3 : 0);
  };
  const best = evs.map((e) => ({ e, n: score(e) })).filter((x) => x.n >= 2).sort((a, b) => b.n - a.n || a.e.date.localeCompare(b.e.date))[0]?.e;
  const res = first(resident);
  const fam = first(from);
  const list: string[] = [];
  if (best) {
    const name = best.title.replace(/^Bus Trip: /, "");
    const at = `${dayName(fromIso(best.date))} at ${fmtTime(best.start)}${best.room ? ` in ${best.room}` : ""}`;
    // Only what the calendar says; anything else they asked (a costume, a seat) is left for staff to answer.
    const extra = "";
    const open = kindOf(best) !== "resident" ? " Families are welcome." : "";
    list.push(`Hi ${fam}! ${name} is ${at}.${open}${extra} Reply with how many are coming and we’ll check with ${res}.`);
  }
  if (draft && !list.length) list.push(draft);
  list.push(`Hi ${fam}! Reply with how many are coming and we’ll check with ${res}.`);
  list.push(`Good question. Let me check and get back to you today.`);
  return { list: list.slice(0, 3), src: best ? `The calendar: ${best.title}, ${dayShort(fromIso(best.date))} at ${fmtTime(best.start)}` : undefined };
}

/**
 * Each card's deadline, and whose it is. Requests about an event are due when it starts; replies and concerns within
 * one business day; a new inquiry the same day. The queue is sorted by deadline, so this morning's trip comes before
 * a reply that can wait until tomorrow.
 */
function stamp(items: QItem[]): QItem[] {
  const now = nowMinutes();
  const t = today();
  const off = (d: string) => Math.round((fromIso(d).getTime() - t.getTime()) / 864e5);
  const at = (d: string, m: number) => off(d) * 1440 + m;
  const by = (abs: number) => {
    const d = Math.floor(abs / 1440);
    const m = ((abs % 1440) + 1440) % 1440;
    if (abs < now) return d === 0 ? `was due ${fmtTime(m)}` : "overdue";
    return d === 0 ? `by ${fmtTime(m)} today` : d === 1 ? `by ${fmtTime(m)} tomorrow` : `by ${dayShort(addDays(t, d))}`;
  };
  const got = (q: QItem) => now - q.mins;
  const toSunday = (7 - t.getUTCDay()) % 7 || 7;
  for (const q of items) {
    if (q.kind === "task") { q.dueLabel ??= by(q.due ?? 1439); continue; }
    let due = got(q) + 1440;
    let label: string | undefined;
    describe(q);
    switch (q.kind) {
      case "post": due = now < 16 * 60 ? 16 * 60 : 1440 + 16 * 60; label = by(due); q.owner = q.for[0]; break;
      // A family is waiting on the answer: within 2 days of asking, or before the event if that's sooner.
      case "rsvp": case "seat": case "group": due = Math.min(at(q.event.date, q.event.start), got(q) + 2 * 1440); q.owner = "events"; break;
      case "ask": due = Math.min(at(q.event.date, q.event.start), ...q.more.map((m) => at(m.event.date, m.event.start)), got(q) + 2 * 1440); q.owner = "events"; break;
      case "inquiry": due = got(q) < 16 * 60 ? 17 * 60 : 1440 + 12 * 60; label = due < 1440 ? "today, while they’re keen" : by(due); q.owner = "sales"; break;
      case "reply": label = "within 1 business day"; q.owner = q.for[0]; break;
      case "verify": due = got(q) + 2 * 1440; label = "within 2 days"; q.owner = "events"; break;
      case "concern": label = "within 1 business day"; break;
      case "stale": due = toSunday * 1440 + 1440 + 9 * 60; q.owner = "desk"; break;
      case "review": {
        const k = q.r.kind;
        due = k === "captions" ? 17 * 60 : k === "newsletter" ? toSunday * 1440 + 17 * 60 : k === "menus" ? toSunday * 1440 + 12 * 60 : 20 * 1440;
        label = q.r.due.replace(/^Sends/, "sends").replace(/^Before/, "before").replace(/^Today$/, "by 5:00 pm today");
        break;
      }
    }
    q.due = due;
    q.dueLabel = label ?? by(due);
  }
  return items.sort((a, b) => (a.due ?? 0) - (b.due ?? 0));
}

/** The signal, why it came to this person and what happens if it waits, for the cards that existed before. */
function describe(q: QItem) {
  switch (q.kind) {
    case "post": {
      const holiday = /holiday|thanksgiving|christmas|menu/i.test(`${q.postKind} ${q.title}`);
      const price = /rate|price|\$/i.test(`${q.title} ${q.detail}`);
      q.signal ??= holiday ? "holiday-menu" : price ? "price-change" : "post";
      q.why = price ? "Prices wait for your approval" : holiday ? "Special menus wait for your approval" : "Your team’s posts with resident photos wait for you";
      q.ifNot = price ? "or the website keeps the old price" : holiday ? "or families see it later, with less time to reserve" : "or it waits until tomorrow";
      break;
    }
    case "rsvp": case "seat": case "group": q.signal ??= "family-request"; q.why = "You approve family requests"; q.ifNot = "or the family hears nothing before the event"; break;
    case "ask": q.signal ??= "ask"; q.why = q.lantern ? "Lantern residents are asked in person, by the Lantern team" : "The resident didn’t answer the text, so someone asks in person"; q.ifNot = "or the family hears nothing before the event"; break;
    case "verify": q.signal ??= "family-member"; q.why = "You check who joins a resident’s family"; q.ifNot = `or ${q.name.split(" ")[0]} gets community news only`; break;
    case "inquiry": q.signal ??= "inquiry"; q.why = "New inquiries come to sales"; q.ifNot = "or they go cold"; break;
    case "concern": q.signal ??= "concern"; q.why ??= `You own ${q.c.topic} concerns`; q.ifNot = "or it shows as overdue to your manager"; break;
    case "review": q.signal ??= "review"; q.why = q.r.kind === "newsletter" ? "You approve the newsletter" : "Kinlight prepared it for you to check"; q.ifNot = q.r.kind === "newsletter" ? "or it sends as it is" : "or it goes out with what Kinlight guessed"; break;
    case "reply": q.signal ??= "message"; break;
    case "stale": q.signal ??= "page-due"; break;
  }
}

/**
 * Keeps Today short: RSVPs for one event that residents have all said yes to become one line ("6 RSVPs · Approve
 * all"), and requests about the same resident become one "ask in person" card, because staff ask once.
 */
function tidy(items: QItem[]): QItem[] {
  const out: QItem[] = [];
  const rsvps = new Map<string, RsvpItem[]>();
  items.forEach((q) => { if (q.kind === "rsvp" && !q.full) rsvps.set(q.event.id, [...(rsvps.get(q.event.id) ?? []), q]); });
  const asks = new Map<string, Extract<QItem, { kind: "ask" }>>();
  for (const q of items) {
    if (q.kind === "rsvp" && !q.full && (rsvps.get(q.event.id)?.length ?? 0) >= 3) {
      const g = rsvps.get(q.event.id)!;
      if (g[0] === q) out.push({ id: `group-${q.event.id}`, for: q.for, mins: q.mins, ago: q.ago, kind: "group", event: q.event, items: g });
      continue;
    }
    if (q.kind === "ask") {
      const first = asks.get(q.resident);
      if (first) { first.more.push({ card: q.id, request: q.request, from: q.from, relation: q.relation, event: q.event, party: q.party }); continue; }
      asks.set(q.resident, q);
    }
    out.push(q);
  }
  return out;
}

/** The self sign-up waiting for a check (the same person appears on the resident's record in People). */
function verifyCandidate(s: StaffData) {
  const c = s.contacts.find((x) => /^(Son|Daughter)$/.test(x.relation) && x.lang === "English" && !x.lantern) ?? s.contacts[0];
  const given = ["Ellen", "Grace", "Paul", "Nathan"][hash(c.resident) % 4];
  const rel = given === "Paul" || given === "Nathan" ? "Grandson" : "Daughter";
  return { name: `${given} ${last(c.resident)}`, says: `${rel} of ${c.resident}`, resident: c.resident, via: "Signed up from the QR poster", agreed: `${first(c.resident)} agreed by text`, phone: phoneFor(s, given) };
}

/* ------------------------------------------------------------ search, from the top bar */

export interface Found { k: "resident" | "family" | "event" | "page" | "prospect"; title: string; sub: string; href: string }

/** Everything the top-bar search can find, for one person: residents, family members, events, website pages and prospects. */
export function searchIndex(slug: CommunitySlug, as: StaffRole): Found[] {
  const s = getStaffData(slug);
  const c = communities[slug];
  const can = (x: Section) => sectionsFor[as].includes(x);
  const out: Found[] = [];
  if (can("people")) {
    const seen = new Set<string>();
    for (const x of s.contacts) {
      if (!seen.has(x.resident)) { seen.add(x.resident); out.push({ k: "resident", title: x.resident, sub: `Resident · ${x.lantern ? "Lantern" : "Apt"} ${x.apt.replace(/^Lantern /, "")}`, href: residentHref(x.resident) }); }
      out.push({ k: "family", title: x.contact, sub: `${x.relation} of ${x.resident}`, href: residentHref(x.resident) });
    }
    for (const n of [...s.residentNames, ...s.lanternNames]) if (!seen.has(n)) { seen.add(n); out.push({ k: "resident", title: n, sub: "Resident", href: residentHref(n) }); }
  }
  if (can("calendar")) {
    const t = today();
    const seen = new Set<string>();
    for (const e of c.staffEventsBetween(addDays(t, -7), 28, iso(t)).flatMap((d) => d.events)) {
      if (seen.has(e.title) && e.date < iso(t)) continue;
      if (seen.has(e.title)) continue;
      seen.add(e.title);
      out.push({ k: "event", title: e.title, sub: `${dayShort(fromIso(e.date))}, ${fmtTime(e.start)} · ${e.room}`, href: `/staff/calendar?event=${encodeURIComponent(e.id)}&date=${e.date}` });
    }
  }
  // Website pages this person may edit (all of them for the administrator).
  if (can("website")) sitePages(slug).filter((p) => as === "manager" || p.ownerRole === as).forEach((p) => out.push({ k: "page", title: p.title, sub: `Website page · ${p.ownerName.split(" ")[0]}’s`, href: `/staff/website?page=${encodeURIComponent(p.id)}` }));
  if (can("prospects") && STAFF_ROLES.includes("sales")) s.enquiries.forEach((e) => out.push({ k: "prospect", title: e.name, sub: `Prospect · ${e.interest} · ${e.status}`, href: "/staff/prospects" }));
  return out;
}

/** Who a concern can be passed to. Care and safety go to the care team's own system, never here. */
export interface ConcernOwner { key: string; name: string; label: string }
export function concernOwners(slug: CommunitySlug): ConcernOwner[] {
  const s = getStaffData(slug);
  const P = (k: string) => s.people[k]?.name ?? k;
  const findKey = (re: RegExp, fallback: string) => Object.keys(s.people).find((k) => re.test(s.people[k].role)) ?? fallback;
  return [
    { key: findKey(/Business Office/, s.roles.approver), label: "Business office" },
    { key: findKey(/Dining/, s.roles.menus), label: "Dining" },
    { key: s.roles.menus, label: "Kitchen" },
    { key: s.roles.calendar, label: "Activities" },
    { key: s.roles.approver, label: "Executive director" },
  ]
    .filter((o, i, all) => all.findIndex((x) => x.key === o.key) === i)
    .map((o) => ({ ...o, name: P(o.key), label: `${o.label}: ${P(o.key)}` }));
}

/** The first name of whoever holds each role, for "Renata's" and "You took this". */
export function roleNames(slug: CommunitySlug): Record<StaffRole, string> {
  return Object.fromEntries(STAFF_ROLES.map((as) => [as, viewer(slug, as).first])) as Record<StaffRole, string>;
}

/** The resident a card is about, when it's about one resident (asks, family members, family messages). */
// Only the things a person who knows the resident should do: ask them in person, and notice when they've stopped
// coming. Checking who joins a family and fixing how a family hears from us stay with the activities director.
const residentOf = (q: QItem) => (q.kind === "ask" ? q.resident : q.kind === "task" && q.about && (q.signal === "unseen" || q.signal === "try-new") ? q.about : undefined);

/**
 * Everything waiting on anyone in the community, each card routed to the person it's for: by the rules in Settings →
 * Approvals and alerts, by "Who looks after whom" when it's on (anything about a resident goes to whoever looks after
 * them), and with anything overdue on someone's Today also shown to the executive director. Passive signals don't
 * come here at all: they go in the Friday summary. Replies to families live in Communications, gathered on Today as
 * one "Message to answer" card per person.
 */
export function queueAll(slug: CommunitySlug, rules: SignalRule[] = SIGNALS, areas?: AreaState): QItem[] {
  const rule = new Map(rules.map((r) => [r.key, r]));
  const base = new Map(SIGNALS.map((r) => [r.key, r]));
  const now = nowMinutes();
  const where = areas?.on ? new Map(placements(slug, areas.placed).map((p) => [p.name, p])) : null;
  const keyToRole = new Map(STAFF_ROLES.map((r) => [viewer(slug, r).key, r]));
  const out: QItem[] = [];
  for (const q0 of queue(slug)) {
    if (q0.kind === "reply") continue;
    const r = q0.signal ? rule.get(q0.signal) : undefined;
    if (r?.level === "passive") continue;
    let q: QItem = q0;
    // An administrator sent this kind to someone else.
    const def = q0.signal ? base.get(q0.signal) : undefined;
    if (r && def && r.to !== def.to && r.to !== "owner") q = { ...q, for: [r.to], owner: r.to, why: "Settings send this kind of item to you" };
    // "Who looks after whom": a resident's things go to whoever looks after them.
    const res = residentOf(q);
    if (where && res) {
      const p = where.get(res);
      // The signed-in care partner, or a role that signs in; a care partner who doesn't sign in (Lena) is covered by
      // the activities director.
      const lead = p?.lead ? keyToRole.get(p.lead) ?? (p.lead === careLogin[slug] ? "caregiver" : undefined) : undefined;
      const to: StaffRole = lead ?? (p?.lead ? "events" : "manager");
      const leadName = p?.lead ? first(getStaffData(slug).people[p.lead]?.name) : "";
      q = { ...q, for: [to], team: false, owner: undefined, why: lead ? "You look after this resident" : p?.lead ? `${leadName} looks after this resident and isn’t on Kinlight yet` : "This resident isn’t in an area yet", area: p?.area ? `${p.area.name}${p.apt && !p.lantern ? ` · ${p.apt}` : ""}` : "Not placed in an area yet" } as QItem;
    }
    // Whoever each person answers to also sees what's overdue for them: the fitness director's go to the activities
    // director; everyone else's to the executive director.
    if (groupOf(q.due ?? 0, now) === "late") {
      const up = [...new Set(q.for.map((r) => reportsTo[r]).filter((r): r is StaffRole => !!r && !q.for.includes(r)))];
      if (up.length) q = { ...q, for: [...q.for, ...up] };
    }
    out.push(q);
  }
  // A care partner's own residents: someone who hasn't been out lately, and something they'd likely enjoy but have
  // never tried. Only with "Who looks after whom" on, because that's what makes them someone's residents.
  if (areas?.on) out.push(...careNudges(slug, areas));
  return out;
}

/**
 * For the care partner who signs in, from the attendance records and each resident's interests: "Hasn't been to
 * anything in 18 days" and "Likes music, has never been to the Afternoon Concert". Engagement only: no care, no
 * health. A person should notice, so nothing is sent automatically and families are never told.
 */
function careNudges(slug: CommunitySlug, areas: AreaState): QItem[] {
  const c = communities[slug];
  const t = today();
  const now = nowMinutes();
  const eng = engagement(slug);
  const mine = placements(slug, areas.placed).filter((p) => p.lead === careLogin[slug] && !p.lantern);
  const off = (d: string) => Math.round((fromIso(d).getTime() - t.getTime()) / 864e5);
  const soon = c.staffEventsBetween(t, 4, iso(t)).flatMap((d) => d.events)
    .filter((e) => !e.lantern && e.cat !== "lantern" && e.cat !== "faith" && e.cat !== "movies" && (e.date > iso(t) || e.start > now + 60) && (!e.cap || (e.taken ?? 0) < e.cap));
  const out: QItem[] = [];
  const area = (p: (typeof mine)[number]) => `${p.area?.name ?? ""}${p.apt ? ` · ${p.apt}` : ""}`;
  // Two weeks or more with no activities. If none of the care partner's residents has been away that long, the
  // quietest of them is shown instead, so a care partner always sees who to look in on first.
  const quiet = mine.map((p) => ({ p, r: eng[p.name] })).filter((x) => x.r).sort((a, b) => b.r.lastDays - a.r.lastDays);
  const unseen = quiet.filter((x) => x.r.lastDays >= 14);
  const shown = (unseen.length ? unseen : quiet.slice(0, 1).map((x) => ({ ...x, r: { ...x.r, lastDays: Math.max(x.r.lastDays, 9 + (hash(x.p.name) % 5)), last30: Math.min(x.r.last30, 1) } }))).slice(0, 2);
  for (const { p, r } of shown) {
    const fn = first(p.name);
    const next = soon.find((e) => eventInterests(e).some((x) => r.interests.includes(x)));
    const nextName = next?.title.replace(/^Bus Trip: /, "");
    out.push({
      kind: "task", id: `unseen-${hash(p.name)}`, signal: "unseen", for: ["caregiver"], about: p.name, area: area(p), team: false,
      type: "Haven’t seen lately", icon: "heart", mins: r.lastDays * 1440, ago: `${r.lastDays} days`,
      title: `${fn} hasn’t been to an activity in ${r.lastDays} days`,
      context: `Last came to ${r.lastActivity} · likes ${r.interests.slice(0, 2).join(" and ").toLowerCase()}`,
      why: "You look after this resident", ifNot: "or nobody notices for another week",
      help: `Drop by and see how ${fn} is. They may be tired, unwell or just out of the habit: a person should notice, not an automatic text. Families are never told automatically.`,
      due: 1439, dueLabel: "today",
      main: { label: "I dropped by", done: `Noted: you dropped by to see ${fn}.` },
      second: next ? { label: `Invite to ${nextName}`, done: `Noted: you invited ${fn} to ${nextName}. Book the seat from the event if they say yes.` } : undefined,
    });
  }
  // Something they'd probably like but have never been to: the next event matching one of their interests.
  const busy = new Set(shown.map((x) => x.p.name));
  const tries = mine
    .filter((p) => !busy.has(p.name) && eng[p.name] && eng[p.name].lastDays < 14)
    .map((p) => {
      const r = eng[p.name];
      const e = soon.find((x) => x.title !== r.lastActivity && hash(p.name + x.title) % 3 === 0 && eventInterests(x).some((i) => r.interests.includes(i)));
      return e ? { p, r, e, i: eventInterests(e).find((x) => r.interests.includes(x))! } : null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x)
    .slice(0, 2);
  for (const { p, r, e, i } of tries) {
    const fn = first(p.name);
    const name = e.title.replace(/^Bus Trip: /, "");
    out.push({
      kind: "task", id: `try-${hash(p.name + e.id)}`, signal: "try-new", for: ["caregiver"], about: p.name, area: area(p), team: false,
      type: "Might enjoy", icon: "users", mins: 60 * 3, ago: "This morning",
      title: `${fn} might enjoy ${name}`,
      context: `${dayShort(fromIso(e.date))}, ${fmtTime(e.start)} · ${e.room} · likes ${i.toLowerCase()}, has never been`,
      quote: `Comes to ${r.last30} activities a month, mostly ${r.lastActivity}.`,
      why: "You look after this resident", ifNot: "or it’s another week of the same few activities",
      help: `Kinlight matched it to what ${fn} told us they like. They’ve never been, so a word from someone they know works better than a text. If they’d like to go, book the seat.`,
      due: Math.max(1439, off(e.date) * 1440 + e.start - 120),
      main: { label: `Book ${fn} a seat`, done: `${fn} is booked on ${name}. They get a reminder by text.` },
      second: { label: "Not for them", done: `Noted: ${name} isn’t for ${fn}.` },
    });
  }
  return out;
}

/** What's waiting on one person: their share of the community's queue. */
export function queueFor(slug: CommunitySlug, as: StaffRole, areas?: AreaState, rules?: SignalRule[]): QItem[] {
  return queueAll(slug, rules, areas).filter((q) => q.for.includes(as)).map((q) =>
    q.for[0] !== as && reportsTo[q.for[0]] === as && !q.why?.startsWith("Settings") ? { ...q, why: `Overdue for ${viewer(slug, q.for[0]).first}, who reports to you` } : q);
}


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
      note: [
        kindOf(e) === "family" ? `${reqs.filter((r) => r.event.id === e.id && r.kind === "family-rsvp").length} family RSVPs` : kindOf(e) === "public" ? "Open to everyone" : "",
        e.cap ? (e.taken ?? 0) >= e.cap ? `Full${e.waitlist ? `, ${e.waitlist} waiting` : ""}` : `${e.cap - (e.taken ?? 0)} of ${e.cap} seats left` : "No limit",
      ].filter(Boolean).join(" · "),
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
        channel: residentChannel(c.resident, !!c.lantern),
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
