// The alpha's staff records that the original screens didn't have: event sign-ups and approvals, attendance,
// staff alerts, resident suggestions, surveys, the content library and print, team roles, the promises and adoption
// measures on the scorecard, and the messages each prospect received.
// Everything is derived from one community's staff data (./<slug>.ts) and its calendar, so Alder Bend and Kestrel Point
// get the same screens with their own people, families and events. Server Components only.
import { communities, type CommunitySlug } from "@/data/communities";
import { kindOf, type CalEvent, type Cat, type EventKind } from "@/data/shared";
import { nextSpecials } from "@/data/communities/specials";
import { addDays, dayShort, fmtTime, fromIso, hash, iso, nowMinutes, today } from "@/lib/clock";
import { getStaffData } from "./index";
import type { Contact, StaffData } from "./shared";

/* ------------------------------------------------------------ helpers */

const pick = <T,>(xs: T[], seed: string, i = 0) => xs[(hash(seed) + i * 7) % xs.length];
const first = (name: string) => name.split(" ")[0];
const staffName = (s: StaffData, key: string) => s.people[key]?.name ?? key;

/** Upcoming staff-side events (full data: seats, waitlists, places) for the next `days` days. */
function upcoming(slug: CommunitySlug, days: number, from = 0) {
  const c = communities[slug];
  const t = today();
  return c.staffEventsBetween(addDays(t, from), days, iso(t)).flatMap((d) => d.events);
}

export interface EventRef { id: string; title: string; date: string; start: number; kind: EventKind; place: string; cap?: number; taken?: number; waitlist?: number; lantern?: boolean; cat?: Cat; end?: number }
const ref = (e: CalEvent): EventRef => ({ id: e.id, title: e.title, date: e.date, start: e.start, kind: kindOf(e), place: e.room, cap: e.cap, taken: e.taken, waitlist: e.waitlist, lantern: e.lantern, cat: e.cat, end: e.end });
export const when = (e: { date: string; start: number }) => `${dayShort(fromIso(e.date))}, ${fmtTime(e.start)}`;

/* ------------------------------------------------------------ event sign-ups and approvals */

export type RequestKind = "family-rsvp" | "seat-request" | "resident-booking" | "public-signup";
export type RequestStatus = "waiting" | "checking" | "confirmed" | "declined";

export interface EventRequest {
  id: string;
  kind: RequestKind;
  event: EventRef;
  /** Who asked: the family member (family RSVPs and seat requests), the resident, or the member of the public. */
  from: string;
  relation?: string;
  /** The resident the request is about (seat requests and resident bookings). */
  resident?: string;
  party: number;
  mins: number;
  status: RequestStatus;
  via: "Personal link" | "Reply to weekly text, finished on the personal link" | "In person with staff" | "Website form";
  lang?: string;
  note?: string;
  /** Public sign-ups: how to reach them (they become sales leads). */
  phone?: string;
  email?: string;
}

/** Every sign-up waiting for staff or recently handled, newest first. */
export function eventRequests(slug: CommunitySlug): EventRequest[] {
  const s = getStaffData(slug);
  const events = upcoming(slug, 21);
  const family = events.filter((e) => kindOf(e) === "family");
  const publicEv = events.filter((e) => kindOf(e) === "public");
  const trips = events.filter((e) => kindOf(e) === "resident" && e.cap && e.cat === "trips");
  const fam = s.contacts.filter((c) => c.sms || c.emailOpt);
  const out: EventRequest[] = [];

  // Family RSVPs from the personal link: a few waiting, the rest confirmed.
  family.forEach((e) => {
    fam.slice(0, 9).forEach((c, i) => {
      out.push({
        id: `rsvp-${e.id}-${i}`, kind: "family-rsvp", event: ref(e), from: c.contact, relation: c.relation, resident: c.resident,
        party: 1 + (hash(c.contact) % 4), mins: 25 + i * 190, status: i < 3 ? "waiting" : "confirmed",
        via: i === 1 ? "Reply to weekly text, finished on the personal link" : "Personal link", lang: c.lang,
        note: i === 0 ? "Bringing the grandchildren, ages 6 and 9" : i === 2 ? "Needs a wheelchair-accessible table" : undefined,
      });
    });
  });

  // Seat requests: a family asks for a seat on an outing for their loved one; staff check with the resident first.
  trips.slice(0, 5).forEach((e, i) => {
    const c = fam[(i * 3 + 1) % fam.length];
    out.push({
      id: `seat-${e.id}`, kind: "seat-request", event: ref(e), from: c.contact, relation: c.relation, resident: c.resident,
      party: 1, mins: 40 + i * 260, status: i === 0 ? "waiting" : i === 1 ? "checking" : i === 4 ? "declined" : "confirmed",
      via: "Personal link", lang: c.lang,
      note: i === 1 ? `Checking with ${first(c.resident)} at lunch today` : i === 4 ? `${first(c.resident)} would rather stay for bingo that afternoon` : undefined,
    });
  });

  // Residents who signed up in person, booked straight into the list.
  trips.slice(0, 4).forEach((e, i) => {
    out.push({
      id: `book-${e.id}`, kind: "resident-booking", event: ref(e), from: pick(s.residentNames, e.id, i), party: 1,
      mins: 90 + i * 300, status: "confirmed", via: "In person with staff",
    });
  });

  // Public sign-ups for the open house: each one is also a lead in Tours & enquiries.
  const people = [
    ["Carol Benedetti", "her mother", "(916) 555-0193", "carol.benedetti@gmail.com"],
    ["Tom & Ruth Alvarez", "themselves", "(916) 555-0127", ""],
    ["Denise Park", "her father", "", "denise.park@outlook.com"],
    ["Marcus Webb", "his aunt", "(916) 555-0178", ""],
    ["Helen Ostrowski", "herself", "(916) 555-0109", "h.ostrowski@comcast.net"],
  ];
  publicEv.forEach((e) => {
    people.forEach(([name, forWhom, phone, email], i) => {
      out.push({
        id: `pub-${e.id}-${i}`, kind: "public-signup", event: ref(e), from: name, party: name.includes("&") ? 2 : 1 + (i % 2),
        mins: 12 + i * 410, status: "confirmed", via: "Website form", phone: phone || undefined, email: email || undefined,
        note: `Asking for ${forWhom}`,
      });
    });
  });

  return out.sort((a, b) => a.mins - b.mins);
}

/** Who on the list for a staff event (residents booked plus approved family guests). Never shown publicly. */
export function eventList(slug: CommunitySlug, e: EventRef) {
  const s = getStaffData(slug);
  const reqs = eventRequests(slug).filter((r) => r.event.id === e.id && r.status === "confirmed");
  const pool = e.lantern ? [...s.lanternNames, ...s.residentNames] : s.residentNames;
  const n = Math.max(0, (e.taken ?? 0) - reqs.length);
  const residents = Array.from({ length: n }, (_, i) => pool[(hash(e.id) + i * 5) % pool.length]);
  return { residents: [...new Set(residents)], requests: reqs };
}

/* ------------------------------------------------------------ attendance */

export interface AttendanceRow { event: EventRef; came: number; expected: number; method: "Tap list" | "Photo of sign-in sheet" | "Not taken yet"; by: string; names: string[] }

/** The last week of activities with attendance, newest first, and today's activities still to take. */
export function attendance(slug: CommunitySlug) {
  const s = getStaffData(slug);
  const c = communities[slug];
  const t = today();
  const now = nowMinutes();
  const past: AttendanceRow[] = [];
  for (let back = 0; back < 7; back++) {
    const d = addDays(t, -back);
    for (const e of c.staffEventsOn(d, iso(t))) {
      if (back === 0 && (e.end ?? e.start + 60) > now) continue;
      if (e.cat === "movies" || e.cat === "faith") continue;
      const h = hash(e.id);
      const expected = e.cap ? e.taken ?? e.cap : 8 + (h % 18);
      const came = Math.max(2, Math.min(expected, Math.round(expected * (0.62 + (h % 35) / 100))));
      const pool = e.lantern || e.cat === "lantern" ? s.lanternNames : s.residentNames;
      past.push({
        event: ref(e), came, expected,
        method: h % 5 === 0 ? "Photo of sign-in sheet" : back === 0 && h % 3 === 0 ? "Not taken yet" : "Tap list",
        by: staffName(s, h % 2 ? s.roles.calendar : pick(Object.keys(s.people), e.id)),
        names: Array.from({ length: Math.min(came, pool.length) }, (_, i) => pool[(h + i * 3) % pool.length]),
      });
    }
  }
  const todayLeft = c.staffEventsOn(t, iso(t)).filter((e) => (e.end ?? e.start + 60) > now && e.cat !== "movies").map(ref);
  const taken = past.filter((r) => r.method !== "Not taken yet");
  return {
    rows: past.sort((a, b) => b.event.date.localeCompare(a.event.date) || b.event.start - a.event.start),
    todayLeft,
    week: { activities: taken.length, visits: taken.reduce((n, r) => n + r.came, 0), residentsReached: Math.round(s.community.residents * 0.71), missing: past.length - taken.length },
  };
}

/* ------------------------------------------------------------ staff alerts */

export interface StaffAlert { id: string; kind: "inquiry" | "tour" | "rsvp" | "seat" | "stale" | "reply"; title: string; detail: string; mins: number; href: string; urgent?: boolean }

export function alerts(slug: CommunitySlug): StaffAlert[] {
  const s = getStaffData(slug);
  const reqs = eventRequests(slug);
  const rsvps = reqs.filter((r) => r.kind === "family-rsvp" && r.status === "waiting");
  const seats = reqs.filter((r) => r.kind === "seat-request" && r.status === "waiting");
  const newEnq = s.enquiries.filter((e) => e.status === "New");
  const nextTour = s.tours.find((t) => t.days >= 0);
  const out: StaffAlert[] = [
    ...newEnq.map((e, i) => ({
      id: `inq-${i}`, kind: "inquiry" as const, title: `New inquiry: ${e.name}`, detail: `${e.interest} · ${e.source}. Instant reply sent; waiting for ${staffName(s, s.roles.tours)} to call.`,
      mins: e.mins, href: "/staff/tours", urgent: e.mins < 60,
    })),
    ...(nextTour ? [{ id: "tour", kind: "tour" as const, title: `Tour booked: ${nextTour.who}`, detail: `${nextTour.interest}, ${nextTour.days === 0 ? "today" : nextTour.days === 1 ? "tomorrow" : `in ${nextTour.days} days`} at ${fmtTime(nextTour.time)} with ${staffName(s, nextTour.with)}. Confirmation and reminder sent.`, mins: 140, href: "/staff/tours" }] : []),
    ...(rsvps.length ? [{ id: "rsvp", kind: "rsvp" as const, title: `${rsvps.length} family RSVPs waiting`, detail: `For ${rsvps[0].event.title}, ${when(rsvps[0].event)}. Approve within 1 business day.`, mins: rsvps[0].mins, href: "/staff/sign-ups", urgent: true }] : []),
    ...seats.map((r) => ({ id: `seat-${r.id}`, kind: "seat" as const, title: `Seat request: ${r.event.title}`, detail: `${r.from} (${r.relation?.toLowerCase()}) asks for a seat for ${r.resident}. Check with ${first(r.resident ?? "")} first.`, mins: r.mins, href: "/staff/sign-ups" })),
    { id: "stale", kind: "stale" as const, title: "Page going stale: Fitness", detail: "Not updated for 6 days. Fitness pages should change every 7 days; the class schedule for next week is due.", mins: 60 * 9, href: s.freshness.length ? "/staff/dashboard" : "/staff/dashboard" },
    { id: "reply", kind: "reply" as const, title: `${s.threads.filter((t) => t.unread).length} family replies to read`, detail: "Replies to this week’s texts, translated into English.", mins: s.threads[0]?.mins ?? 60, href: "/staff/messages" },
  ];
  return out.sort((a, b) => a.mins - b.mins);
}

/* ------------------------------------------------------------ resident suggestions */

export interface Suggestion { id: string; text: string; from: "Paper slip" | "QR code"; who?: string; days: number; status: "New" | "Planned" | "On the calendar" | "Not this time"; votes: number; becameEvent?: { title: string; date: string } ; note?: string }

export function suggestions(slug: CommunitySlug): Suggestion[] {
  const s = getStaffData(slug);
  const ideas: [string, Suggestion["status"], string?][] = [
    ["A trip to see the Christmas lights downtown, in the evening", "On the calendar", "Holiday Lights Bus Tour"],
    ["Bring back the Friday fish fry", "On the calendar", "Friday Fish Fry"],
    ["Ukulele lessons", "Planned"],
    ["A men’s breakfast club once a month", "Planned"],
    ["Learn to use video calls with the grandkids", "New"],
    ["More large-print crossword books in the library", "New"],
    ["A visit from the high school choir", "New"],
    ["Pickleball in the parking lot", "Not this time"],
    ["A Spanish-language movie night", "On the calendar", "Cine en Español"],
    ["Gardening boxes we can reach from a chair", "Planned"],
  ];
  return ideas.map(([text, status, title], i) => ({
    id: `sg-${i}`, text, status, from: i % 3 === 0 ? "QR code" : "Paper slip",
    who: i % 4 === 1 ? undefined : pick(s.residentNames, text), days: 1 + i * 3 + (hash(text) % 3), votes: 1 + (hash(text + slug) % 14),
    becameEvent: title ? { title, date: iso(addDays(today(), 6 + i * 2)) } : undefined,
    note: status === "Not this time" ? "Not safe on the slope; offered table tennis in the Club Room instead" : undefined,
  }));
}

/* ------------------------------------------------------------ surveys */

export interface SurveyQ { q: string; before: number; now: number; aim?: string }
export function surveys(slug: CommunitySlug) {
  const s = getStaffData(slug);
  const h = hash(slug) % 6;
  return {
    family: {
      title: "Family survey",
      sent: s.community.families, answered: Math.round(s.community.families * 0.46),
      when: "Sent before go-live and again at day 90, by text and email in each family’s language",
      qs: [
        { q: "I know what’s happening in my loved one’s community", before: 41 + h, now: 63 + h, aim: "+15 points" },
        { q: "I feel part of the community", before: 38 + h, now: 52 + h, aim: "+15 points" },
        { q: "Messages from the community are useful, not too many", before: 55, now: 78 + (h % 3) },
        { q: "How likely are you to recommend the community? (0–10)", before: 7.4, now: 8.3 },
      ] as SurveyQ[],
      comments: [
        { text: "The Sunday email is the first thing I read. I finally know what Mom did all week.", lang: "English" },
        { text: "Me encanta recibir los mensajes en español. Mi papá se ve feliz en las fotos.", lang: "Spanish", en: "I love getting the messages in Spanish. My dad looks happy in the photos." },
        { text: "Could the texts come a little later in the morning? 8 am is early on the West Coast weekends.", lang: "English" },
      ],
    },
    staff: {
      title: "Monthly staff pulse",
      sent: Object.keys(s.people).length, answered: Object.keys(s.people).length - 1,
      when: "Three questions, two minutes, on the first Monday of each month",
      months: ["Sep", "Oct", "Nov"],
      qs: [
        { q: "Posting an update takes me less time than before", vals: [3.1, 3.9, 4.3] },
        { q: "I know what families are hearing from us", vals: [2.8, 3.7, 4.2] },
        { q: "I’d recommend Kinlight to a colleague at another community", vals: [3.4, 4.0, 4.4] },
      ],
      comments: ["The photo post from my phone is the part I use every day.", "Menu import from the PDF still needs a second look on soups."],
    },
    resident: { title: "Resident survey (read aloud)", answered: Math.round(s.community.residents * 0.3), qs: [{ q: "I know what’s on each week", before: 58, now: 71 }, { q: "I feel part of the community", before: 66, now: 74 }, { q: "My ideas are listened to", before: 49, now: 64 }] as SurveyQ[] },
  };
}

/* ------------------------------------------------------------ content library and print */

export interface LibraryItem { id: string; kind: "Activity idea" | "Post template" | "Flyer template" | "Calendar template" | "Menu template"; title: string; text: string; rating: number; used: number; tag: string; photo?: string; worked?: string }

export const library: LibraryItem[] = [
  { id: "l1", kind: "Activity idea", title: "“This Is Your Life” interviews", text: "Residents interview each other about a turning point in their lives; staff film a two-minute clip for the family digest.", rating: 4.8, used: 14, tag: "Engaged", photo: "/img/friends-laugh.jpg", worked: "Best attended new activity across Wrenhaven in October" },
  { id: "l2", kind: "Activity idea", title: "Grandchildren’s craft afternoon", text: "A family event: a simple seasonal craft at each table, residents and grandchildren side by side. Invite from the calendar.", rating: 4.7, used: 9, tag: "Family event", photo: "/img/art-studio.jpg" },
  { id: "l3", kind: "Activity idea", title: "Armchair travel", text: "A destination a month: slides, music and a tasting from the kitchen. Works well in memory care with shorter sessions.", rating: 4.5, used: 21, tag: "Lively", photo: "/img/wine-toast.jpg" },
  { id: "l4", kind: "Activity idea", title: "Seated garden club", text: "Raised beds at chair height, a seed swap and a harvest lunch. Popular with residents who used to garden at home.", rating: 4.4, used: 11, tag: "Valued", photo: "/img/gardening.jpg" },
  { id: "l5", kind: "Post template", title: "Photos are up", text: "Photos from {event} are up! See them on our website. Thank you to everyone who came.", rating: 4.6, used: 88, tag: "After an event" },
  { id: "l6", kind: "Post template", title: "Family event invitation", text: "You’re invited: {event}, {when}. RSVP from your personal link and tell us how many are coming.", rating: 4.5, used: 31, tag: "Family event" },
  { id: "l7", kind: "Flyer template", title: "Large-print event flyer", text: "Letter size, 24 pt, one photo, the day and time in bold. Filled in from the calendar.", rating: 4.7, used: 64, tag: "Print" },
  { id: "l8", kind: "Calendar template", title: "Large-print monthly calendar", text: "Tabloid, 16 pt, color-coded by category with a legend residents can read from a walker.", rating: 4.8, used: 24, tag: "Print" },
  { id: "l9", kind: "Menu template", title: "Weekly menu card", text: "Letter, 18 pt, three restaurants, dietary tags spelled out rather than abbreviated.", rating: 4.3, used: 40, tag: "Print" },
];

export function printItems(slug: CommunitySlug) {
  const c = communities[slug];
  const t = today();
  const month = t.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  const sp = nextSpecials();
  return [
    { id: "p1", title: `${month} activity calendar`, size: "Tabloid · 16 pt", copies: 120, note: "For every apartment door and the Lobby", ready: true },
    { id: "p2", title: "Lantern activity calendar", size: "Tabloid · 20 pt", copies: 30, note: "Pictures beside each activity", ready: true },
    { id: "p3", title: "This week’s menus", size: "Letter · 18 pt", copies: 60, note: `All three restaurants at ${c.site.name}`, ready: true },
    { id: "p4", title: `Family Barbecue flyer · ${dayShort(fromIso(sp.barbecue))}`, size: "Letter · 24 pt", copies: 40, note: "For the front desk and the elevators", ready: true },
    { id: "p5", title: "QR poster: “Get the weekly update”", size: "Tabloid", copies: 6, note: "Families scan it to sign up; one at the front desk, one by each elevator", ready: true },
    { id: "p6", title: "Suggestion slips", size: "Letter · 4 per page", copies: 100, note: "“What would you like to see?” with a QR code", ready: true },
  ];
}

/* ------------------------------------------------------------ team and roles */

export type Permission = "Post updates and photos" | "Edit calendar and menus" | "Approve family messages" | "Approve resident photos" | "Approve event RSVPs" | "Pricing and availability" | "Inquiries and tours" | "Family contacts" | "Settings and roles";

export function teamRoles(slug: CommunitySlug) {
  const s = getStaffData(slug);
  const r = s.roles;
  const all: Permission[] = ["Post updates and photos", "Edit calendar and menus", "Approve family messages", "Approve resident photos", "Approve event RSVPs", "Pricing and availability", "Inquiries and tours", "Family contacts", "Settings and roles"];
  const byKey = (k: string): { role: string; perms: Permission[]; status: "Active" | "Invited"; lastPost?: number } => {
    if (k === r.approver) return { role: "Administrator", perms: all, status: "Active", lastPost: 60 * 30 };
    if (k === r.tours) return { role: "Sales", perms: ["Post updates and photos", "Inquiries and tours", "Pricing and availability"], status: "Active", lastPost: 60 * 50 };
    if (k === r.calendar) return { role: "Champion", perms: ["Post updates and photos", "Edit calendar and menus", "Approve event RSVPs", "Family contacts"], status: "Active", lastPost: 40 };
    if (k === r.lantern) return { role: "Manager", perms: ["Post updates and photos", "Edit calendar and menus", "Approve family messages", "Approve event RSVPs"], status: "Active", lastPost: 60 * 20 };
    if (k === r.menus) return { role: "Contributor", perms: ["Post updates and photos", "Edit calendar and menus"], status: "Active", lastPost: 60 * 70 };
    const h = hash(k);
    return { role: "Contributor", perms: ["Post updates and photos"], status: h % 5 === 0 ? "Invited" : "Active", lastPost: h % 5 === 0 ? undefined : 60 * (4 + (h % 90)) };
  };
  const people = Object.entries(s.people).map(([k, p]) => ({ key: k, ...p, title: p.role, ...byKey(k) }));
  return {
    people,
    perms: all,
    rules: [
      ...s.approvalRules,
      { what: "Family event RSVPs and seat requests", who: `${staffName(s, r.calendar)} · within 1 business day` },
      { what: "Weekly email digest", who: `${staffName(s, r.approver)} · reviews the draft every Friday` },
      { what: "Emergency and closure alerts", who: `${staffName(s, r.approver)} · skip approval and send at once` },
    ],
  };
}

/* ------------------------------------------------------------ scorecard: promises, adoption, evidence */

export type PromiseStatus = "Kept" | "At risk" | "Missed" | "Not due yet";
export interface KPromise { code: string; promise: string; target: string; status: PromiseStatus; evidence: string }

export function promises(slug: CommunitySlug): KPromise[] {
  const s = getStaffData(slug);
  const fam = s.community.families;
  const live = slug === "alder-bend" ? 27 : 29;
  return [
    { code: "D1", promise: "Up and running in 30 days", target: "Website, calendars, menus and family texting live within 30 days", status: "Kept", evidence: `Live on day ${live}; onboarding log signed off` },
    { code: "D2", promise: "Nothing lost in the move", target: "Every old page address redirected; accessibility check passed", status: "Kept", evidence: `${slug === "alder-bend" ? 214 : 187} old addresses redirected, 0 broken; accessibility scan passed` },
    { code: "D3", promise: "Every community page shows real life", target: "This week’s menu, the calendar and recent news live on every page", status: "Kept", evidence: "Checked every week this month: 4 of 4" },
    { code: "D4", promise: "One post reaches every channel", target: "Every post reaches 3 or more channels", status: "Kept", evidence: `${s.scoreRows.find((r) => r.k === "Posts published")?.now ?? 50} posts, average 4.2 channels each` },
    { code: "D5", promise: "Changes arrive fast", target: "Website and families updated within 15 minutes", status: "Kept", evidence: "Slowest change this month: 6 minutes" },
    { code: "D6", promise: "Messages arrive", target: "95% or more delivered, in the family’s language", status: "Kept", evidence: `${s.weekKpis.deliveredRate}% delivered; ${s.languages.length} languages` },
    { code: "D7", promise: "Nothing wrong goes out", target: "Zero sends without approval", status: "Kept", evidence: "0 sends without approval (approval log)" },
    { code: "D8", promise: "No inquiry left waiting", target: "Instant reply day or night; your team told within 5 minutes", status: "Kept", evidence: `${s.scoreRows.find((r) => r.k === "Enquiries")?.now ?? 50} inquiries, all answered instantly; slowest hand-off 2 min` },
    { code: "D9", promise: "Easy to find", target: "Live-facts feed and Google Business Profile accurate; monthly AI-answer report", status: slug === "alder-bend" ? "Kept" : "At risk", evidence: slug === "alder-bend" ? "Feed and profile accurate; AI-answer report sent" : "One AI answer still shows the old Lantern price; correction submitted" },
    { code: "D10", promise: "It stays up", target: "99.5% uptime or better", status: "Kept", evidence: "99.98% this month" },
    { code: "D11", promise: "You can see it working", target: "Scorecard sent every month; full export tested once", status: "Kept", evidence: "This scorecard; export tested on day 21" },
  ].map((p) => ({ ...p, status: p.status as PromiseStatus, evidence: p.evidence.replace("{fam}", String(fam)) }));
}

export interface Adoption { code: string; measure: string; target: string; value: string; pct: number; ok: boolean; note?: string }

export function adoption(slug: CommunitySlug): Adoption[] {
  const s = getStaffData(slug);
  const reached = s.weekKpis.familiesReached;
  const optedPct = Math.round((s.community.contacts / s.community.residents) * 100);
  return [
    { code: "T1", measure: "Staff post every week", target: "1+ update in 10 of the last 12 weeks", value: "8 of 8 weeks so far", pct: 100, ok: true },
    { code: "T2", measure: "Training sticks", target: "80% of trained staff post on their own within 14 days", value: "9 of 10 staff", pct: 90, ok: true },
    { code: "T3", measure: "Pages stay current", target: "No page older than 7 days", value: "1 page at 6 days (Fitness)", pct: 96, ok: true, note: "Reminder sent" },
    { code: "T4", measure: "Families reachable", target: "60% by day 30, 70% by day 90", value: `${Math.min(optedPct, 88)}% of residents have an opted-in family contact`, pct: Math.min(optedPct, 88), ok: optedPct >= 60 },
    { code: "T5", measure: "Families read it", target: "50% of opted-in families view or click the digest", value: `${s.weekKpis.openRate}% opened this week · ${reached} families reached`, pct: s.weekKpis.openRate, ok: s.weekKpis.openRate >= 50 },
    { code: "T6", measure: "Families stay subscribed", target: "Opt-outs 5% or less", value: "1.6% opted out", pct: 98, ok: true },
    { code: "T7", measure: "Calendar takes less time", target: "Monthly calendar build time down 50%", value: "From 9 h to 3.5 h (time diary)", pct: 61, ok: true },
    { code: "T8", measure: "Communication takes less time", target: "15+ staff hours a month saved", value: "17 h saved this month (time diary)", pct: 100, ok: true },
  ];
}

/** Outcomes we track and compare, never promise: shown as numbers only, with no targets or pass/fail. */
export function evidence(slug: CommunitySlug) {
  const s = getStaffData(slug);
  const row = (k: string) => s.scoreRows.find((r) => r.k === k);
  const pick2 = (k: string, label = k, fmt?: "pct" | "dec") => {
    const r = row(k);
    return r ? { label, now: r.now, prev: r.prev, fmt: fmt ?? r.fmt } : null;
  };
  return [
    pick2("Enquiries", "Inquiries"),
    { label: "Share of inquiries after hours", now: 41, prev: 33, fmt: "pct" as const },
    { label: "Time to first human reply (minutes)", now: 11, prev: 194, fmt: undefined },
    pick2("Tours"),
    pick2("Deposits"),
    pick2("Move-ins"),
    pick2("Occupancy", "Occupancy (%)", "dec"),
    { label: "“Did the website show you daily life here?” (yes)", now: 82, prev: 0, fmt: "pct" as const },
    { label: "Family RSVPs and event visits per 100 families", now: 37, prev: 14, fmt: undefined },
    pick2("Google rating", "Google rating", "dec"),
  ].filter(Boolean) as { label: string; now: number; prev: number; fmt?: "pct" | "dec" | "num" }[];
}

/* ------------------------------------------------------------ messages each prospect received */

export interface ProspectMsg { channel: "Text" | "Email"; at: string; text: string; subject?: string }

/** The instant reply after an inquiry, and the confirmation and reminder after a tour is booked. */
export function prospectMessages(slug: CommunitySlug, p: { name: string; interest: string; tour?: { days: number; time: number }; mins?: number }): ProspectMsg[] {
  const s = getStaffData(slug);
  const c = communities[slug];
  const rep = staffName(s, s.roles.tours);
  const fn = first(p.name.replace(/&.*$/, "").trim());
  const out: ProspectMsg[] = [
    { channel: "Text", at: p.mins !== undefined ? `${Math.max(1, Math.round(p.mins))} min ago` : "Just now", text: `Hi ${fn}, thanks for asking about ${p.interest} at ${c.site.name}. ${first(rep)} will call you shortly. Want to see it in person? Book a tour any time: ${s.brand.domain}/tour. Reply STOP to opt out.` },
    { channel: "Email", at: p.mins !== undefined ? `${Math.max(1, Math.round(p.mins))} min ago` : "Just now", subject: `Thank you for your interest in ${c.site.name}`, text: `Dear ${fn},\n\nThank you for reaching out about ${p.interest}. ${rep}, our ${s.people[s.roles.tours]?.role ?? "Community Relations Director"}, will be in touch today. In the meantime, here is this week’s menu, the activity calendar and our floor plans with starting prices.\n\nWarmly,\nThe ${c.site.name} team · ${s.brand.phone}` },
  ];
  if (p.tour) {
    const d = dayShort(addDays(today(), p.tour.days));
    out.push(
      { channel: "Text", at: "When booked", text: `${c.site.name}: your tour is booked for ${d} at ${fmtTime(p.tour.time)} with ${rep}. Lunch is on us. Address: ${c.site.addressLine}. Need to change it? Reply here or call ${s.brand.phone}.` },
      { channel: "Text", at: "The day before, 4:00 pm", text: `Reminder from ${c.site.name}: we’ll see you tomorrow at ${fmtTime(p.tour.time)}. Park by the main entrance and ask for ${first(rep)} at the front desk.` },
    );
  }
  return out;
}

/* ------------------------------------------------------------ family contact for the phone walk-through */

/** The family contact used on the sample phones: an English-speaking son or daughter on text and email. */
export function sampleFamily(slug: CommunitySlug): Contact {
  const s = getStaffData(slug);
  return s.contacts.find((c) => c.lang === "English" && c.sms && c.emailOpt && !c.lantern && /^(Son|Daughter)$/.test(c.relation)) ?? s.contacts[0];
}

/* ------------------------------------------------------------ sign-ups: capped events, contacts */

/** Upcoming capped events (seats, waitlist, place or departure point), soonest first. Staff only. */
export function cappedEvents(slug: CommunitySlug, days = 10): EventRef[] {
  return upcoming(slug, days).filter((e) => e.cap).map(ref);
}

/** How a family hears back about an RSVP or seat request: the channel they chose, in their language. */
export function replyChannel(slug: CommunitySlug, from: string) {
  const c = getStaffData(slug).contacts.find((x) => x.contact === from);
  const how = !c ? "text" : c.channel === "Email" ? "email" : c.channel === "SMS" ? "text" : "text and email";
  return { how, lang: c?.lang ?? "English" };
}

/* ------------------------------------------------------------ alert settings */

export type AlertChannel = "Text" | "Email" | "In the app";
export interface AlertSetting { kind: StaffAlert["kind"]; label: string; detail: string; who: { key: string; name: string; role: string; on: AlertChannel[] }[] }

/** Who gets which alert, and how. Staff change these on the Alerts screen. */
export function alertSettings(slug: CommunitySlug): AlertSetting[] {
  const s = getStaffData(slug);
  const r = s.roles;
  const p = (key: string, on: AlertChannel[]) => ({ key, name: staffName(s, key), role: s.people[key]?.role ?? "", on });
  return [
    { kind: "inquiry", label: "New inquiry", detail: "Website, Google, AI search and referral partners. Instant reply already sent.", who: [p(r.tours, ["Text", "In the app"]), p(r.approver, ["Email"])] },
    { kind: "tour", label: "Tour booked", detail: "Booked online or by phone, with the confirmation and reminder sent.", who: [p(r.tours, ["Text", "Email", "In the app"]), p(r.approver, ["In the app"])] },
    { kind: "rsvp", label: "Family RSVP waiting", detail: "Approve within 1 business day; the family is told by text or email.", who: [p(r.calendar, ["Text", "In the app"]), p(r.lantern, ["In the app"])] },
    { kind: "seat", label: "Seat request from a family", detail: "Check with the resident first, then confirm or decline.", who: [p(r.calendar, ["Text", "In the app"])] },
    { kind: "stale", label: "Page going stale", detail: "A page hasn’t changed for longer than it should.", who: [p(r.calendar, ["Email"]), p(r.approver, ["Email"])] },
    { kind: "reply", label: "Family replies", detail: "Replies to texts and emails, translated into English.", who: [p(r.calendar, ["In the app"]), p(r.approver, ["Email", "In the app"])] },
  ];
}

/* ------------------------------------------------------------ leadership: one row per community */

/** The key numbers leadership compares across communities. Occupancy, deposits and move-ins are tracked evidence, not targets. */
export function leadershipRow(slug: CommunitySlug) {
  const s = getStaffData(slug);
  const row = (k: string) => s.scoreRows.find((x) => x.k === k);
  const reqs = eventRequests(slug);
  const pr = promises(slug);
  const ad = adoption(slug);
  return {
    slug,
    name: communities[slug].site.name,
    city: communities[slug].site.address.city,
    families: s.community.families,
    familiesReached: s.weekKpis.familiesReached,
    postsWeek: s.weekKpis.postsThisWeek,
    postsMonth: row("Posts published")?.now ?? 0,
    openRate: s.weekKpis.openRate,
    inquiries: row("Enquiries")?.now ?? 0,
    inquiriesPrev: row("Enquiries")?.prev ?? 0,
    tours: row("Tours")?.now ?? 0,
    toursPrev: row("Tours")?.prev ?? 0,
    deposits: row("Deposits")?.now ?? 0,
    moveIns: row("Move-ins")?.now ?? 0,
    occupancy: row("Occupancy")?.now ?? 0,
    occupancyPrev: row("Occupancy")?.prev ?? 0,
    approvals: s.approvals.length,
    rsvpsWaiting: reqs.filter((r) => r.kind === "family-rsvp" && r.status === "waiting").length,
    seatsWaiting: reqs.filter((r) => r.kind === "seat-request" && (r.status === "waiting" || r.status === "checking")).length,
    kept: pr.filter((p) => p.status === "Kept").length,
    promises: pr,
    adoptionOk: ad.filter((a) => a.ok).length,
    adoption: ad,
  };
}
