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
import { weekNumbers } from "./week";
import { welcomes } from "./engage";
import { scorecardSurveys } from "./surveys";

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
  via: "Replied to the text" | "Replied to the weekly text" | "In person with staff" | "Website form";
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

  // Family RSVPs by reply to the weekly text: a few waiting, the rest confirmed.
  family.forEach((e, n) => {
    fam.filter((c) => !c.lantern).slice(0, 9).forEach((c, i) => {
      // The first family event: six RSVPs the residents have said yes to (staff approve them together), and one
      // resident who hasn't answered yet. Later family events: all confirmed already.
      const waiting = n === 0 && i !== 2 && i < 7;
      out.push({
        id: `rsvp-${e.id}-${i}`, kind: "family-rsvp", event: ref(e), from: c.contact, relation: c.relation, resident: c.resident,
        party: 1 + (hash(c.contact) % 4), mins: 25 + i * 190 + n * 40, status: waiting ? "waiting" : i === 2 && n === 0 ? "checking" : "confirmed",
        via: i === 1 ? "Replied to the weekly text" : "Replied to the text", lang: c.lang,
        note: i === 0 ? "Bringing the grandchildren, ages 6 and 9" : i === 2 ? "Needs a wheelchair-accessible table" : undefined,
      });
    });
  });

  // Seat requests: a family asks for a seat on an outing for their loved one; staff check with the resident first.
  // The first one waiting is for an outing that's already full, so staff can only add the resident to its waitlist.
  const full = (e: CalEvent) => (e.cap && (e.taken ?? 0) >= e.cap ? 1 : 0);
  [...trips].sort((a, b) => full(b) - full(a)).slice(0, 5).forEach((e, i) => {
    const c = fam[(i * 3 + 1) % fam.length];
    out.push({
      id: `seat-${e.id}`, kind: "seat-request", event: ref(e), from: c.contact, relation: c.relation, resident: c.resident,
      party: 1, mins: 40 + i * 260, status: i === 0 ? "waiting" : i === 1 ? "checking" : i === 4 ? "declined" : "confirmed",
      via: "Replied to the text", lang: c.lang,
      note: i === 1 ? `Checking with ${first(c.resident)} at lunch today` : i === 4 ? `${first(c.resident)} would rather stay for bingo that afternoon` : undefined,
    });
  });

  // A Lantern family's RSVP: no text goes to the resident. Staff ask in person.
  const lc = s.contacts.find((c) => c.lantern && (c.sms || c.emailOpt));
  if (lc && family[0])
    out.push({ id: `rsvp-${family[0].id}-lantern`, kind: "family-rsvp", event: ref(family[0]), from: lc.contact, relation: lc.relation, resident: lc.resident, party: 2, mins: 140, status: "checking", via: "Replied to the text", lang: lc.lang });

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
/** The scheduled surveys, in the shape the older screens read. Family and resident satisfaction now come from the
 *  Surveys section (its real answers), so the scorecard, Feedback and Reports agree. */
export function surveys(slug: CommunitySlug) {
  const s = getStaffData(slug);
  const sc = scorecardSurveys(slug);
  return {
    family: {
      title: "Family satisfaction",
      sent: sc.family.sent, answered: sc.family.answered,
      when: "Before go-live, at day 90 and every six months, by text and email in each family’s language",
      qs: sc.family.qs.map((q, i) => ({ ...q, aim: i < 2 ? "+15 points" : undefined })) as SurveyQ[],
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
    resident: { title: "Resident satisfaction (printed or read aloud)", answered: sc.resident.answered, qs: sc.resident.qs as SurveyQ[] },
  };
}

/* ------------------------------------------------------------ print */

export interface PrintItem { id: string; title: string; size: string; copies: number; note: string; ready: boolean; card?: { name: string; community: string } }

export function printItems(slug: CommunitySlug): PrintItem[] {
  const c = communities[slug];
  const t = today();
  const month = t.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  const sp = nextSpecials();
  // Check-in cards: one per resident, printed once when they move in (and again if one is lost). Staff scan the card
  // at the door; residents never have to scan anything themselves.
  const newcomers = welcomes(slug).filter((w) => !w.steps.every((x) => x.done));
  return [
    { id: "p1", title: `${month} activity calendar`, size: "Tabloid · 16 pt", copies: 120, note: "For every apartment door and the Lobby", ready: true },
    { id: "p2", title: "Lantern activity calendar", size: "Tabloid · 20 pt", copies: 30, note: "Pictures beside each activity", ready: true },
    { id: "p3", title: "This week’s menus", size: "Letter · 18 pt", copies: 60, note: `All ${c.venueOrder.length} restaurants at ${c.site.name}, with the standing menus`, ready: true },
    { id: "p4", title: `Family Barbecue flyer · ${dayShort(fromIso(sp.barbecue))}`, size: "Letter · 24 pt", copies: 40, note: "For the front desk and the elevators", ready: true },
    { id: "p5", title: "Family QR poster: “Get the weekly update”", size: "Tabloid", copies: 6, note: "Front desk and each elevator", ready: true },
    {
      id: "p7", title: "Check-in cards for new residents", size: "Card stock · 10 per page", copies: Math.max(1, newcomers.length),
      note: `${newcomers.map((w) => w.name).join(", ") || "Replacements for lost cards"}: staff scan the card at each activity`, ready: true,
      card: { name: newcomers[0]?.name ?? "Resident name", community: c.site.name },
    },
    { id: "p6", title: "Suggestion slips", size: "Letter · 4 per page", copies: 100, note: "For the box at the front desk", ready: true },
  ];
}

/* ------------------------------------------------------------ team and roles */

export type Permission = "Post updates and photos" | "Edit calendar and menus" | "Approve family messages" | "Approve resident photos" | "Approve event RSVPs" | "Pricing and availability" | "Inquiries and tours" | "Family contacts" | "Settings and roles";

/** Everyone on the team with their preset role (Settings → Team). Fitness and community relations are Posters. */
export function teamRoles(slug: CommunitySlug) {
  const s = getStaffData(slug);
  const r = s.roles;
  type Preset = import("./shared").Preset;
  const byKey = (k: string, role: string): { preset: Preset; status: "Active" | "Invited"; adjusted?: string } => {
    if (k === r.approver) return { preset: "Administrator", status: "Active" };
    if (k === r.calendar) return { preset: "Approver", status: "Active" };
    if (k === r.lantern) return { preset: "Approver", status: "Active", adjusted: "Approves Lantern family requests" };
    if (k === r.menus || /Culinary|Dining/.test(role)) return { preset: "Kitchen", status: "Active" };
    if (k === r.desk) return { preset: "Front desk", status: "Active" };
    if (/Fitness/.test(role)) return { preset: "Poster", status: "Active" };
    if (/Care Partner/.test(role)) return { preset: "Caregiver", status: "Active" };
    if (/Business Office/.test(role)) return { preset: "Poster", status: "Active", adjusted: "Also edits apartments and prices on the website" };
    const h = hash(k);
    return { preset: "Poster", status: h % 4 === 0 ? "Invited" : "Active" };
  };
  const people = Object.entries(s.people).map(([k, p]) => ({ key: k, ...p, title: p.role, ...byKey(k, p.role) }));
  return { people };
}

/* ------------------------------------------------------------ scorecard: promises, adoption, evidence */

export type PromiseStatus = "Kept" | "At risk" | "Missed" | "Not due yet";
export interface KPromise { code: string; promise: string; target: string; status: PromiseStatus; evidence: string;
  /** Where the evidence lives in the staff area. */
  href?: string; hrefLabel?: string }

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
    { code: "D7", promise: "Nothing wrong goes out", target: "Nothing goes out without the approval your rules require (resident photos, prices, special menus, family requests); emergencies only skip it", status: "Kept", evidence: "Every resident photo, price, special menu and family request approved first; 0 exceptions (approval log)" },
    { code: "D8", promise: "No inquiry left waiting", target: "Instant reply day or night; your team told within 5 minutes", status: "Kept", evidence: `${s.scoreRows.find((r) => r.k === "Enquiries")?.now ?? 50} inquiries, all answered instantly; slowest hand-off 2 min`, href: "/staff/automations?tab=log&auto=s-instant", hrefLabel: "Every instant reply, in Automations" },
    { code: "D9", promise: "Easy to find", target: "Live-facts feed and Google Business Profile accurate; monthly AI-answer report", status: slug === "alder-bend" ? "Kept" : "At risk", evidence: slug === "alder-bend" ? "Feed and profile accurate; AI-answer report sent" : "One AI answer still shows the old Lantern price; correction submitted" },
    { code: "D10", promise: "It stays up", target: "99.5% uptime or better", status: "Kept", evidence: "99.98% this month" },
    { code: "D11", promise: "You can see it working", target: "Scorecard sent every month; full export tested once", status: "Kept", evidence: "This scorecard; export tested on day 21" },
  ].map((p) => ({ ...p, status: p.status as PromiseStatus, evidence: p.evidence.replace("{fam}", String(fam)) }));
}

export interface Adoption { code: string; measure: string; target: string; value: string; pct: number; ok: boolean; note?: string; href?: string; hrefLabel?: string }

export function adoption(slug: CommunitySlug): Adoption[] {
  const s = getStaffData(slug);
  const reached = s.weekKpis.familiesReached;
  const optedPct = Math.round((s.community.contacts / s.community.residents) * 100);
  const wk = weekNumbers(slug);
  return [
    { code: "T1", measure: "Staff add photos or events every week", target: "Photos or events added in 10 of the last 12 weeks", value: "8 of 8 weeks so far", pct: 100, ok: true, note: `This week: ${wk.photos} photos and ${wk.activities} activities` },
    { code: "T2", measure: "Training sticks", target: "80% of trained staff post on their own within 14 days", value: "9 of 10 staff", pct: 90, ok: true },
    { code: "T3", measure: "Pages stay current", target: "No page older than 7 days", value: "1 page at 6 days (Fitness)", pct: 96, ok: true, note: "Reminder sent" },
    { code: "T4", measure: "Families reachable", target: "60% by day 30, 70% by day 90", value: `${Math.min(optedPct, 88)}% of residents have an opted-in family contact`, pct: Math.min(optedPct, 88), ok: optedPct >= 60 },
    { code: "T5", measure: "Families read it", target: "50% of opted-in families view or click the digest", value: `${s.weekKpis.openRate}% opened this week · ${reached} families reached`, pct: s.weekKpis.openRate, ok: s.weekKpis.openRate >= 50 },
    { code: "T6", measure: "Families stay subscribed", target: "Opt-outs 5% or less", value: "1.6% opted out", pct: 98, ok: true, href: "/staff/automations?tab=problems", hrefLabel: "This week’s opt-outs, in Automations" },
    { code: "T7", measure: "Calendar takes less time", target: "Monthly calendar build time down 50%", value: "From 9 h to 3.5 h (time diary)", pct: 61, ok: true },
    { code: "T8", measure: "Communication takes less time", target: "15+ staff hours a month saved", value: "17 h saved this month (time diary)", pct: 100, ok: true },
  ];
}

export interface EvidenceRow { label: string; now: number; prev: number; fmt?: "pct" | "dec" | "num"; /** One of the prospect numbers sales can see. */ prospect?: boolean; note?: string }

/**
 * Outcomes we track and compare, never promise: shown as numbers only, with no targets or pass/fail (the spec's
 * inquiries, reply times, tours, move-ins, reviews, family referrals and front-desk calls). Occupancy and deposits
 * belong to the operator's sales system, so they aren't here.
 */
export function evidence(slug: CommunitySlug): EvidenceRow[] {
  const s = getStaffData(slug);
  const row = (k: string) => s.scoreRows.find((r) => r.k === k);
  const pick2 = (k: string, label = k, extra: Partial<EvidenceRow> = {}): EvidenceRow | null => {
    const r = row(k);
    return r ? { label, now: r.now, prev: r.prev, fmt: r.fmt, ...extra } : null;
  };
  const refIdx = s.enquirySources.findIndex((x) => /Referrals from residents and families/.test(x.label));
  const h = hash(slug);
  const calls = Math.round(s.community.residents * 2.1) + (h % 40);
  return [
    pick2("Enquiries", "Inquiries", { prospect: true, note: "Form, website chat, Google, AI search, referrals and public event sign-ups" }),
    { label: "Share of inquiries after hours", now: 41, prev: 33, fmt: "pct", prospect: true, note: "Answered instantly all the same" },
    { label: "Time to first human reply (minutes)", now: slug === "alder-bend" ? 11 : 14, prev: slug === "alder-bend" ? 194 : 171, prospect: true, note: "Median, after the instant reply" },
    pick2("Tours", "Tours", { prospect: true }),
    pick2("Move-ins", "Move-ins", { prospect: true }),
    { label: "New Google reviews", now: s.gbp.newReviews, prev: Math.max(1, s.gbp.newReviews - 2), note: `${s.gbp.rating} stars from ${s.gbp.reviews} reviews` },
    refIdx >= 0 ? { label: "Family and resident referrals", now: s.enquirySources[refIdx].value, prev: s.enquirySourcesPrev[refIdx], note: "Inquiries that came from someone who lives here or their family" } : null,
    { label: "Front-desk calls", now: calls, prev: calls + 38 + (h % 20), note: "Fewer “what’s on today?” calls now the calendar and menus are always current" },
    { label: "“Did the website show you daily life here?” (yes)", now: 82, prev: 0, fmt: "pct", note: "Asked of every new inquiry" },
    { label: "Family RSVPs and event visits per 100 families", now: 37, prev: 14 },
  ].filter(Boolean) as EvidenceRow[];
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

/* ------------------------------------------------------------ alert settings */

export type AlertChannel = "Text" | "Email" | "In the staff area";
export interface AlertSetting { kind: string; label: string; detail: string; expected: string; urgent?: boolean; who: { key: string; name: string; role: string; on: AlertChannel[] }[] }

/** Who gets which alert, and how (Settings): the spec's alerts table. Each alert opens the same card that's on Today. */
export function alertSettings(slug: CommunitySlug): AlertSetting[] {
  const s = getStaffData(slug);
  const r = s.roles;
  const p = (key: string, on: AlertChannel[]) => ({ key, name: staffName(s, key), role: s.people[key]?.role ?? "", on });
  const byRole = (re: RegExp, fallback: string) => Object.keys(s.people).find((k) => re.test(s.people[k].role)) ?? fallback;
  const billing = byRole(/Business Office/, r.approver);
  const dining = byRole(/Dining/, r.menus);
  const area: AlertChannel = "In the staff area";
  return [
    { kind: "post", label: "A post to approve", detail: "Resident photos, prices and special menus.", expected: "Same day", who: [p(r.approver, ["Text", area])] },
    { kind: "rsvp", label: "A family request the resident said yes to", detail: "Family RSVPs and seat requests. Lantern requests go to the memory care director.", expected: "Within 1 business day", who: [p(r.calendar, ["Text", area]), p(r.lantern, ["Text", area])] },
    { kind: "ask", label: "A resident hasn’t answered", detail: "Ask them in person, then tap their answer.", expected: "Ask in person the same day", who: [p(r.calendar, ["Text", area]), p(r.desk, [area])] },
    { kind: "verify", label: "A new family member to verify", detail: "They signed up themselves; check with the resident.", expected: "Within 2 business days", who: [p(r.calendar, [area])] },
    { kind: "reply", label: "A reply the AI couldn’t handle", detail: "Goes to the right person by topic. Urgent ones tell the family to call the front desk.", expected: "No promised time", urgent: true, who: [p(r.calendar, [area]), p(r.tours, [area]), p(r.desk, ["Text", area])] },
    { kind: "concern", label: "A family concern", detail: "Care, billing, dining or housekeeping, each to its owner.", expected: "Until resolved", urgent: true, who: [p(r.lantern, ["Text", area]), p(billing, ["Email", area]), p(dining, ["Email", area]), p(r.approver, ["Email"])] },
    { kind: "inquiry", label: "A new inquiry or tour booked", detail: "The instant reply has already gone.", expected: "Call within the day", who: [p(r.tours, ["Text", area]), p(r.approver, ["Email"])] },
    { kind: "review", label: "Something ready to review", detail: "The newsletter, an imported calendar, the week’s menus.", expected: "Before it publishes", who: [p(r.calendar, ["Email", area]), p(r.menus, ["Email", area]), p(r.approver, [area])] },
    { kind: "stale", label: "A page going stale", detail: "A page hasn’t changed for longer than it should.", expected: "Before the due date", who: [p(r.calendar, ["Email"]), p(r.menus, ["Email"])] },
    { kind: "welcome", label: "A new resident to welcome", detail: "Their messages, interests, consent and a welcome post.", expected: "First week", who: [p(r.calendar, [area]), p(r.desk, [area])] },
  ];
}

/* ------------------------------------------------------------ leadership: one row per community */

/** The key numbers leadership compares across communities: promises, adoption and the requests waiting on staff. */
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
    moveIns: row("Move-ins")?.now ?? 0,
    approvals: s.approvals.length,
    rsvpsWaiting: reqs.filter((r) => r.kind === "family-rsvp" && r.status === "waiting").length,
    seatsWaiting: reqs.filter((r) => r.kind === "seat-request" && (r.status === "waiting" || r.status === "checking")).length,
    /** Residents staff still need to ask in person about a family request. */
    askWaiting: reqs.filter((r) => r.status === "checking").length,
    kept: pr.filter((p) => p.status === "Kept").length,
    promises: pr,
    adoptionOk: ad.filter((a) => a.ok).length,
    adoption: ad,
  };
}
