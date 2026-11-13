// Engagement: what turns the staff area from a posting tool into an engagement system. Each resident's interests,
// life story, participation and 1:1 visits; personal invites from interests; QR check-ins; who we haven't seen lately;
// celebrations; new residents' welcome checklists; family concerns and thank-yous; what worked; and the things
// Kinlight prepared for a person to check. Built from one community's staff data and calendar, so Alder Bend and
// Kestrel Point get the same screens with their own people. Invented sample data; every name is fictional.
// Server Components only (it reads every community's data).
import { communities, type CommunitySlug } from "@/data/communities";
import { kindOf, type CalEvent, type Cat } from "@/data/shared";
import { addDays, dayShort, fmtTime, fromIso, hash, iso, nowMinutes, shortDate, today } from "@/lib/clock";
import { getStaffData } from "./index";
import { ago, type StaffData } from "./shared";
import { weekNumbers } from "./week";
import { surveyConcern, surveyThanks } from "./surveys";

const first = (n = "") => n.split(" ")[0];
const last = (n = "") => n.split(" ").slice(-1)[0];
const uniq = <T,>(xs: T[]) => xs.filter((x, i, a) => a.indexOf(x) === i);

/* ------------------------------------------------------------ interests */

/** The short standard list chosen with each resident. */
export const INTERESTS = ["Music", "Cards and games", "Faith", "Outings", "Fitness", "Crafts", "Learning", "Gardening", "Movies", "Cooking"] as const;
export type Interest = (typeof INTERESTS)[number];

const byCat: Record<Cat, Interest[]> = {
  fitness: ["Fitness"], faith: ["Faith"], clubs: ["Cards and games"], trips: ["Outings"], music: ["Music"],
  movies: ["Movies"], community: ["Learning"], lantern: ["Music"],
};
/** The interests an event matches, from what it is. Staff can change them on the event. */
export function eventInterests(e: Pick<CalEvent, "title" | "cat">): Interest[] {
  const t = e.title.toLowerCase();
  const out = [...byCat[e.cat]];
  if (/bridge|bingo|cards|mahjong|poker|canasta|trivia|game/.test(t)) out.push("Cards and games");
  if (/paint|craft|knit|art|pumpkin|wreath|clay/.test(t)) out.push("Crafts");
  if (/garden|flower|plant|orchard/.test(t)) out.push("Gardening");
  if (/cook|bak|chef|tasting|cellars|wine/.test(t)) out.push("Cooking");
  if (/lecture|talk|class|book|history|learn/.test(t)) out.push("Learning");
  return uniq(out).slice(0, 2);
}

/* ------------------------------------------------------------ each resident's engagement */

export interface Visit { date: string; by: string; note: string }
export interface Engagement {
  name: string;
  lantern: boolean;
  interests: Interest[];
  /** A few lines staff write with the resident. Private: never published, never sent. */
  story: string;
  /** Activities in the last 30 days. */
  last30: number;
  /** Days since they last came to an activity. */
  lastDays: number;
  lastActivity: string;
  lastLabel: string;
  visits: Visit[];
  /** Personal invites sent in the last 30 days, and how many they said yes to. */
  invites: { sent: number; yes: number; lastText?: string };
  /** Happy to be celebrated (birthday posts, welcomes). Some residents would rather not be. */
  celebrate: boolean;
}

const STORIES = [
  "Taught third grade in Sacramento for 30 years. Loves Sinatra and a good crossword.",
  "Ran the family hardware store for four decades. Knows the name of every tool.",
  "Grew up on a dairy farm; still wakes at five. Proud grandparent of eleven.",
  "Navy radio operator, then a mail carrier. Tells the best stories about the 1960s.",
  "Sang in the church choir for fifty years. Bakes a famous lemon cake.",
  "Retired nurse. Quiet in groups, lights up one-on-one. Misses the garden at home.",
  "Played trumpet in a dance band in the 1950s. Still taps the rhythm on the table.",
  "Former librarian. Reads two mysteries a week and will recommend one to anyone.",
  "Worked for the railroad; loves anything about trains and maps.",
  "Came from Guadalajara in 1962. Makes tamales every December with the whole family.",
  "Bridge champion at the old neighborhood club. Competitive, funny, and always early.",
  "Built furniture in the garage for 40 years. Likes to fix things that are broken.",
];
const ACTIVITIES = ["Sit To Be Fit", "Bridge Club", "Happy Hour", "Bingo", "Chair Yoga", "Book Club", "Sunday Hymn Sing", "Painting Class", "Movie Matinee", "Garden Club"];

function residentNames(s: StaffData) {
  return uniq([...s.residentNames, ...s.lanternNames]);
}

/** Every resident's engagement record, by name. */
export function engagement(slug: CommunitySlug): Record<string, Engagement> {
  const s = getStaffData(slug);
  const lantern = new Set(s.lanternNames);
  const staffNames = [s.people[s.roles.calendar].name, s.people[s.roles.lantern].name, s.people[s.roles.desk].name];
  const out: Record<string, Engagement> = {};
  const t = today();
  residentNames(s).forEach((name, i) => {
    const h = hash(name);
    const isL = lantern.has(name);
    // Four residents haven't been out for two weeks or more: these are "we haven't seen lately".
    const quiet = i % 9 === 4 || i === 13;
    const lastDays = quiet ? 15 + (h % 9) : h % 4;
    const last30 = quiet ? (h % 2) : 4 + (h % 14);
    const interests = uniq([INTERESTS[h % 10], INTERESTS[(h >> 3) % 10], ...(h % 3 === 0 ? [INTERESTS[(h >> 5) % 10]] : [])]) as Interest[];
    const visits: Visit[] = quiet || isL ? Array.from({ length: 1 + (h % 2) }, (_, k) => ({
      date: dayShort(addDays(t, -(3 + k * 6 + (h % 3)))), by: staffNames[(h + k) % staffNames.length],
      note: ["Looked at old photos together", "Walked to the garden", "Read the paper aloud", "Played a hand of gin rummy"][(h + k) % 4],
    })) : [];
    out[name] = {
      name, lantern: isL, interests,
      story: STORIES[h % STORIES.length],
      last30, lastDays,
      lastActivity: ACTIVITIES[(h >> 2) % ACTIVITIES.length],
      lastLabel: lastDays === 0 ? "Today" : lastDays === 1 ? "Yesterday" : `${lastDays} days ago`,
      visits,
      invites: { sent: quiet ? 3 : 2 + (h % 6), yes: quiet ? 0 : 1 + (h % 3) },
      celebrate: h % 6 !== 0,
    };
  });
  return out;
}

/* ------------------------------------------------------------ personal invites from interests */

export interface InviteSummary {
  interests: Interest[];
  /** Residents with a matching interest who were texted. */
  invited: number;
  yes: number;
  /** The text, as the first invited resident got it. */
  text: string;
  names: string[];
  yesNames: string[];
  sentAt: string;
}

/** Personal invites for one event: residents whose interests match get a text, and reply YES to book. */
export function invitesFor(slug: CommunitySlug, e: Pick<CalEvent, "id" | "title" | "cat" | "start" | "date" | "cap" | "taken"> & { kind?: CalEvent["kind"] }): InviteSummary | null {
  if (kindOf(e as CalEvent) === "public" && e.cat !== "music") return null;
  const eng = engagement(slug);
  const ints = eventInterests(e);
  const pool = Object.values(eng).filter((r) => !r.lantern && r.interests.some((x) => ints.includes(x)));
  if (!pool.length) return null;
  const h = hash(e.id);
  const names = pool.slice(0, Math.min(pool.length, 9 + (h % 8))).map((r) => r.name);
  const yesN = Math.max(1, Math.min(names.length - 2, e.cap ? Math.min(e.taken ?? 3, Math.round(names.length * 0.45)) : Math.round(names.length * (0.3 + (h % 20) / 100))));
  const d = fromIso(e.date);
  const isToday = e.date === iso(today());
  const whenTxt = isToday ? (e.start >= 17 * 60 ? "tonight" : "today") : dayShort(d).split(",")[0];
  const short = e.title.replace(/^Bus Trip: /, "");
  return {
    interests: ints, invited: names.length, yes: yesN, names, yesNames: names.slice(0, yesN),
    text: `${short} ${whenTxt} at ${fmtTime(e.start).replace(":00", "")}, ${first(names[0])}. ${e.cap ? "Want a seat?" : "Want to come?"} Reply YES.`,
    sentAt: isToday ? "Sent this morning at 8:30" : `Sent ${dayShort(addDays(d, -2))}`,
  };
}

/* ------------------------------------------------------------ QR check-ins */

/** How people were checked in to an activity: by staff scanning their check-in card at the door, or tapped in by staff. */
export function checkIns(id: string, came: number) {
  const qr = Math.round(came * (0.4 + (hash(id) % 25) / 100));
  return { qr, staff: came - qr };
}

/* ------------------------------------------------------------ today's activities, with what Kinlight did for each */

export interface TodayActivity {
  id: string; title: string; start: number; end: number; time: string; place: string; cat: Cat; kind: string; lantern: boolean;
  state: "done" | "now" | "later";
  /** "Today" or "Tomorrow". */
  day: "Today" | "Tomorrow";
  /** Attendance already saved (finished activities only; some are still waiting for it). */
  recorded: boolean;
  /** Checked in so far: by QR and by staff tap. */
  qr: number; tapped: number;
  expected: number; cap?: number; taken?: number;
  /** Who's on the list, for attendance and for tagging photos. */
  pool: string[];
  /** Who came, for suggesting photo tags. */
  came: string[];
  invites: InviteSummary | null;
  /** The reminder Kinlight sends before it starts. */
  reminder?: string;
  justEnded: boolean;
  /** Whether staff asked for photos from it, and how many are attached so far. */
  photosWanted: boolean;
  photosAttached: number;
}

export function todayActivities(slug: CommunitySlug, offset = 0): TodayActivity[] {
  const s = getStaffData(slug);
  const c = communities[slug];
  const t = addDays(today(), offset);
  const now = offset ? -1 : nowMinutes();
  return c
    .staffEventsOn(t, iso(today()))
    .filter((e) => e.cat !== "movies" && e.cat !== "faith")
    .map((e) => {
      const h = hash(e.id);
      const lantern = !!e.lantern || e.cat === "lantern";
      const pool0 = lantern ? s.lanternNames : s.residentNames;
      const n = Math.min(pool0.length, 14 + (h % 8));
      const pool = uniq(Array.from({ length: n }, (_, i) => pool0[(h + i * 5) % pool0.length]));
      const end = e.end ?? e.start + 60;
      const expected = e.cap ? e.taken ?? e.cap : 8 + (h % 14);
      const state: TodayActivity["state"] = now < 0 ? "later" : end <= now ? "done" : e.start <= now ? "now" : "later";
      const cameN = state === "later" ? 0 : state === "now" ? Math.round(expected * 0.7) : Math.max(3, Math.round(expected * (0.65 + (h % 30) / 100)));
      const ck = checkIns(e.id, cameN);
      const qr = lantern ? 0 : ck.qr;
      const booked = e.cap ? e.taken ?? 0 : 0;
      return {
        id: e.id, title: e.title, start: e.start, end, time: fmtTime(e.start), place: e.room, cat: e.cat, kind: kindOf(e), lantern,
        state, day: (offset ? "Tomorrow" : "Today") as TodayActivity["day"], recorded: state === "done" && h % 3 !== 0, qr, tapped: cameN - qr, expected, cap: e.cap, taken: e.taken, pool, came: pool.slice(0, cameN),
        invites: lantern ? null : invitesFor(slug, e),
        reminder: booked ? `Reminder to ${booked} booked at ${fmtTime(Math.max(8 * 60 + 30, e.start - 60))}` : undefined,
        justEnded: state === "done" && now - end < 90 && !offset,
        photosWanted: photosWanted(e),
        photosAttached: state === "done" && h % 2 === 1 && photosWanted(e) ? 2 + (h % 4) : 0,
      };
    })
    .sort((a, b) => a.start - b.start);
}

/* ------------------------------------------------------------ we haven't seen lately */

export interface Unseen { name: string; days: number; lastActivity: string; interests: Interest[]; next?: { title: string; when: string }; visits: number; lantern: boolean }

/** Residents with no activities in two weeks. Staff only: never sent to families, never automatic. */
export function unseen(slug: CommunitySlug): Unseen[] {
  const c = communities[slug];
  const t = today();
  const week = c.staffEventsBetween(t, 7, iso(t)).flatMap((d) => d.events).filter((e) => e.cat !== "lantern");
  return Object.values(engagement(slug))
    .filter((r) => r.lastDays >= 14)
    .sort((a, b) => b.lastDays - a.lastDays)
    .slice(0, 4)
    .map((r) => {
      const ev = week.find((e) => eventInterests(e).some((x) => r.interests.includes(x)) && (e.date > iso(t) || e.start > nowMinutes()));
      return { name: r.name, days: r.lastDays, lastActivity: r.lastActivity, interests: r.interests, visits: r.visits.length, lantern: r.lantern, next: ev ? { title: ev.title, when: `${dayShort(fromIso(ev.date))}, ${fmtTime(ev.start)}` } : undefined };
    });
}

/* ------------------------------------------------------------ celebrations */

export interface Celebration { id: string; kind: "birthday" | "welcome" | "anniversary"; who: string; when: string; line: string; consent: "ok" | "none" | "staff"; note: string }

export function celebrations(slug: CommunitySlug): Celebration[] {
  const s = getStaffData(slug);
  // Only residents who are happy to be celebrated.
  const eng = engagement(slug);
  const names = s.residentNames.filter((n) => eng[n]?.celebrate);
  const b1 = names[(hash(slug) + 5) % names.length];
  const b2 = names[(hash(slug) + 11) % names.length];
  const w = welcomes(slug)[0];
  const staffer = Object.values(s.people).find((p) => /Fitness/.test(p.role)) ?? Object.values(s.people)[1];
  const t = today();
  return [
    { id: "bday-1", kind: "birthday", who: b1, when: "Today", line: `Happy birthday, ${first(b1)}, from all of us at ${s.brand.name}!`, consent: "ok", note: "Photo consent on file. Birthday from the resident record; no age is shared." },
    { id: "bday-2", kind: "birthday", who: b2, when: dayShort(addDays(t, 2)), line: `Happy birthday to ${first(b2)} on ${dayShort(addDays(t, 2)).split(",")[0]}!`, consent: "none", note: "No photo consent on file: the post goes out without a photo." },
    // A welcome only once the new resident has said yes to being celebrated (the consent step of the welcome checklist).
    ...(w.steps.find((x) => x.k === "consent")?.done ? [{ id: "welcome-1", kind: "welcome" as const, who: w.name, when: "First week", line: `Please welcome ${first(w.name)} to the ${w.floor}! Say hello at lunch.`, consent: "ok" as const, note: "Agreed at move-in. First name and floor only." }] : []),
    { id: "anniv-1", kind: "anniversary", who: staffer.name, when: "This week", line: `Five years with us! Thank you, ${first(staffer.name)}, for every class and every laugh.`, consent: "staff", note: "Staff anniversary: they agreed in Settings." },
  ];
}

/* ------------------------------------------------------------ welcoming a new resident */

export interface WelcomeStep { k: "messages" | "interests" | "consent" | "family" | "post"; label: string; done: boolean; detail: string }
export interface Welcome { name: string; apt: string; floor: string; movedIn: string; days: number; steps: WelcomeStep[] }

export function welcomes(slug: CommunitySlug): Welcome[] {
  const ab = slug === "alder-bend";
  const t = today();
  const mk = (name: string, apt: string, floor: string, days: number, done: WelcomeStep["k"][]): Welcome => ({
    name, apt, floor, days, movedIn: dayShort(addDays(t, -days)),
    steps: [
      { k: "messages", label: "Their messages", done: done.includes("messages"), detail: "Text, email or print, and language" },
      { k: "interests", label: "Interests", done: done.includes("interests"), detail: "A short chat with them, or later" },
      { k: "consent", label: "Photo consent, sharing and celebrations", done: done.includes("consent"), detail: "From the move-in paperwork" },
      { k: "family", label: "Invite their family", done: done.includes("family"), detail: "From the move-in contacts" },
      { k: "post", label: "A welcome post", done: done.includes("post"), detail: "Suggested, with consent checked" },
    ],
  });
  return ab
    ? [mk("Marvin Achterberg", "3112", "third floor", 2, ["messages", "consent"]), mk("Lucille Varga", "1226", "first floor", 5, ["messages", "interests", "consent", "family"])]
    : [mk("Desmond Pryor", "C204", "second floor", 3, ["messages"]), mk("Ingrid Solberg", "A112", "first floor", 6, ["messages", "interests", "consent", "family"])];
}

/* ------------------------------------------------------------ family concerns and thank-yous */

export type ConcernStatus = "Open" | "In progress" | "Resolved" | "Passed to the care team";
export interface Concern {
  id: string; from: string; relation: string; resident: string; text: string;
  topic: "Care" | "Billing" | "Dining" | "Housekeeping" | "Activities";
  owner: string; ownerName: string; status: ConcernStatus; mins: number; ago: string;
  how: "The AI recognised it as a concern" | "Marked as a concern by staff" | "From a survey answer";
  log: string[];
  /** Care and safety: not held by Kinlight. Routed to the care team, recorded in the community's own care system. */
  care?: { team: string; system: string; at: string };
}

export function concerns(slug: CommunitySlug): Concern[] {
  const s = getStaffData(slug);
  const fam = s.contacts.filter((c) => !c.lantern);
  const pick = (i: number) => fam[(i * 5 + 3) % fam.length];
  const P = (k: string) => s.people[k]?.name ?? k;
  const careKey = s.roles.lantern;
  const billKey = Object.keys(s.people).find((k) => /Business Office/.test(s.people[k].role)) ?? s.roles.approver;
  const dineKey = s.roles.menus;
  const list: Omit<Concern, "ago" | "ownerName">[] = [
    { id: "c1", ...who(pick(0)), text: `${first(pick(0).resident)} says nobody came after pressing the call button on Tuesday night. Can someone look into it?`, topic: "Care", owner: careKey, status: "Passed to the care team", mins: 95, how: "The AI recognised it as a concern", log: ["Not answered by the AI.", "Passed to the care team straight away, to record in the community’s care system."], care: { team: P(careKey), system: "the community’s care system", at: ago(94) } },
    { id: "c2", ...who(pick(1)), text: `We were charged twice for the guest meals in October.`, topic: "Billing", owner: billKey, status: "In progress", mins: 60 * 26, how: "The AI recognised it as a concern", log: ["Passed to the business office.", `${first(P(billKey))} called back and is checking the statement.`] },
    { id: "c3", ...who(pick(2)), text: `${first(pick(2).resident)}’s dinner keeps arriving cold when it’s delivered to the room.`, topic: "Dining", owner: dineKey, status: "Open", mins: 60 * 5, how: "Marked as a concern by staff", log: [`${first(P(s.roles.calendar))} marked this reply as a concern.`] },
    { id: "c5", ...who(pick(4)), text: `${first(pick(4).resident)} says Bingo has been too loud since it moved to the theater room, and she’s stopped going. Could she sit somewhere quieter?`, topic: "Activities", owner: s.roles.calendar, status: "Open", mins: 60 * 3, how: "The AI recognised it as a concern", log: ["Not answered by the AI. Passed to the activities director."] },
    { id: "c4", ...who(pick(3)), text: `${first(pick(3).resident)}’s bathroom hasn’t been cleaned this week.`, topic: "Housekeeping", owner: s.roles.approver, status: "Resolved", mins: 60 * 74, how: "The AI recognised it as a concern", log: ["Passed to the executive director.", "Housekeeping visited the same afternoon.", "Family told by text. Marked resolved."] },
  ];
  // A written answer in a named survey that's a concern becomes one straight away, with an owner.
  const sv = surveyConcern(slug);
  if (sv) list.push({ id: "c-survey", from: sv.from, relation: sv.relation, resident: sv.resident, text: sv.text, topic: "Dining", owner: dineKey, status: "Open", mins: 60 * 20, how: "From a survey answer", log: [`Written in the Dining experience survey. Passed to ${first(P(dineKey))}, who owns dining concerns.`] });
  return list.map((c) => ({ ...c, ownerName: P(c.owner), ago: ago(c.mins) }));
  // (care concerns keep only the routing: who it went to and when, never the care record itself)
  function who(c: (typeof fam)[number]) { return { from: c.contact, relation: c.relation, resident: c.resident }; }
}

export interface ThankYou { id: string; from: string; relation: string; resident: string; text: string; staff: string; staffName: string; mins: number; ago: string; passed: boolean }

export function thankYous(slug: CommunitySlug): ThankYou[] {
  const s = getStaffData(slug);
  const fam = s.contacts.filter((c) => c.sms || c.emailOpt);
  const P = (k: string) => s.people[k]?.name ?? k;
  const fit = Object.keys(s.people).find((k) => /Fitness/.test(s.people[k].role)) ?? s.roles.calendar;
  const rows = [
    { k: s.roles.calendar, text: (r: string) => `Thank you for the photos of ${first(r)} at the barbecue. It made our week.` },
    { k: fit, text: (r: string) => `${first(r)} says the chair yoga class has helped so much with balance. Please thank the instructor!` },
    { k: s.roles.lantern, text: (r: string) => `Thank you for taking such good care of ${first(r)}.` },
    { k: s.roles.menus, text: (r: string) => `The Sunday brunch was wonderful. ${first(r)} hasn’t stopped talking about the crab cakes.` },
  ];
  const out = rows.map((x, i) => {
    const c = fam[(i * 7 + 2) % fam.length];
    const mins = 60 * (3 + i * 19);
    return { id: `ty${i}`, from: c.contact, relation: c.relation, resident: c.resident, text: x.text(c.resident), staff: x.k, staffName: P(x.k), mins, ago: ago(mins), passed: i > 0 };
  });
  // Thank-yous written in a named survey go to the person they name, as they do from a text.
  const ty = surveyThanks(slug);
  if (ty) out.push({ id: "ty-survey", from: ty.from, relation: ty.relation, resident: ty.resident, text: ty.text, staff: s.roles.desk, staffName: P(s.roles.desk), mins: 60 * 30, ago: ago(60 * 30), passed: true });
  return out;
}

/* ------------------------------------------------------------ what worked */

export interface Attended { title: string; cat: Cat; avg: number; sessions: number; trend: number }

/** Most and least attended activities this month, to plan the next one. */
export function whatWorked(slug: CommunitySlug): { most: Attended[]; least: Attended[] } {
  const c = communities[slug];
  const t = today();
  const seen = new Map<string, CalEvent[]>();
  c.staffEventsBetween(addDays(t, -27), 28, iso(t)).flatMap((d) => d.events).forEach((e) => {
    if (e.cat === "faith" || e.cat === "movies" || e.cat === "lantern") return;
    seen.set(e.title, [...(seen.get(e.title) ?? []), e]);
  });
  const rows: Attended[] = [...seen.entries()].map(([title, es]) => {
    const h = hash(title);
    return { title, cat: es[0].cat, sessions: es.length, avg: 4 + (h % 22), trend: (h % 7) - 3 };
  });
  rows.sort((a, b) => b.avg - a.avg);
  return { most: rows.slice(0, 5), least: rows.filter((r) => r.sessions >= 2).slice(-4).reverse() };
}

/* ------------------------------------------------------------ the replies the AI handled on its own */

export interface Handled { from: string; relation: string; asked: string; reply: string; did: string; ago: string }

/**
 * Clear replies to Kinlight's own questions (yes, no, a number, which event) that became actions after a confirmation.
 * Never open questions: those, concerns, care, health and billing go to staff. STOP is handled without the AI.
 */
export function handledByAI(slug: CommunitySlug): Handled[] {
  const s = getStaffData(slug);
  const c = communities[slug];
  const t = today();
  // Only what's still to come, and never a Lantern activity: Lantern residents aren't texted.
  const now = nowMinutes();
  const evs = c.staffEventsBetween(t, 10, iso(t)).flatMap((d) => d.events).filter((e) => (e.date > iso(t) || e.start > now + 60) && !e.lantern && e.cat !== "lantern");
  const fam = evs.find((e) => kindOf(e) === "family");
  const trip = evs.find((e) => e.cap && e.cat === "trips");
  const club = evs.find((e) => /bridge|bingo|club/i.test(e.title)) ?? evs[0];
  const people = s.contacts.filter((x) => x.sms);
  const res = s.residentNames;
  const out: Handled[] = [];
  const add = (i: number, h: Omit<Handled, "ago" | "from" | "relation"> & { resident?: boolean; to?: (typeof people)[number] }) => {
    const p = h.to ?? people[(i * 3) % people.length];
    out.push({ from: h.resident ? res[(i * 4) % res.length] : p.contact, relation: h.resident ? "Resident" : p.relation, asked: h.asked, reply: h.reply, did: h.did, ago: ago(40 + i * 170) });
  };
  if (fam) add(0, { asked: `“${fam.title}: reply with how many are coming.”`, reply: "3", did: `Asked “RSVP 3 people? Reply YES.” They did. Sent to the resident to say yes.` });
  if (club) add(1, { resident: true, asked: `“${club.title} ${dayShort(fromIso(club.date)).split(",")[0]} at ${fmtTime(club.start)}. Want to come? Reply YES.”`, reply: "yes please", did: "Booked. Confirmation sent." });
  const tp = people[6 % people.length];
  if (trip) add(2, { to: tp, asked: `“Want a seat for ${first(tp.resident)} on ${trip.title.replace(/^Bus Trip: /, "")}? Reply SEAT.”`, reply: "SEAT", did: `Asked ${first(tp.resident)} first, by text.` });
  if (fam) add(3, { resident: true, asked: `“Your daughter would like to come to ${fam.title} with you. Reply YES or NO.”`, reply: "Yes!", did: "Recorded the yes. Waiting for staff to approve." });
  const other = people.find((x) => x.lang !== "English") ?? people[0];
  add(4, { to: other, asked: `“Reply 2 for messages in ${other.lang === "English" ? "Spanish" : other.lang}.”`, reply: "2", did: `Changed their messages to ${other.lang === "English" ? "Spanish" : other.lang}.` });
  if (club) add(5, { resident: true, asked: `“Reminder: ${club.title} at ${fmtTime(club.start)}. Still coming? Reply YES or NO.”`, reply: "no, not feeling up to it", did: "Took them off the list. Their seat went to the waitlist." });
  if (fam) add(6, { asked: `“${fam.title}: reply with how many are coming.”`, reply: "just me", did: `Asked “RSVP 1 person? Reply YES.” They did. Sent to the resident.` });
  return out;
}

/* ------------------------------------------------------------ ready to review: what Kinlight prepared */

export interface Review { id: string; kind: "newsletter" | "import" | "menus" | "captions"; title: string; detail: string; href: string; for: string[]; due: string; flagged: number }

export function readyToReview(slug: CommunitySlug): Review[] {
  const wk = weekNumbers(slug);
  const t = today();
  const next = addDays(t, 30 - t.getUTCDate() + 2);
  const month = next.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  const sunday = addDays(t, (7 - t.getUTCDay()) % 7 || 7);
  // The newsletter is built on Thursday: Monday to Wednesday there's nothing to review yet.
  const built = ![1, 2, 3].includes(t.getUTCDay());
  return [
    ...(built ? [{ id: "rv-news", kind: "newsletter" as const, title: "This week’s newsletter is ready", detail: `Kinlight wrote it from this week’s ${wk.activities} activities and ${wk.photos} photos, next week’s events and the menu highlights. Sends ${dayShort(sunday)} at 5 pm.`, href: "/staff/newsletter", for: ["manager"], due: `Sends ${dayShort(sunday).split(",")[0]} 5 pm`, flagged: 0 }] : []),
    // Importing a calendar now happens in Post (Import), where the changes are confirmed as they're read.
    { id: "rv-import", kind: "import", title: `The ${month} calendar, read from paper`, detail: `312 events read, 6 to check. 41 repeating activities spotted.`, href: "/staff/post?type=import", for: [], due: `Before ${shortDate(addDays(next, -1))}`, flagged: 6 },
    { id: "rv-menus", kind: "menus", title: "Coming up: next week’s menus", detail: "Already filled from each restaurant’s template. 2 things to check: a dietary tag and one line of the chef’s text.", href: "/staff/menus", for: [] /* the kitchen sees "For you in Menus" on Today instead */, due: `Before ${dayShort(sunday).split(",")[0]}`, flagged: 2 },
    { id: "rv-captions", kind: "captions", title: "Photo captions to check", detail: "Kinlight captioned 12 photos from today’s activities. 1 mentions a name to confirm.", href: "/staff/calendar?photos=1", for: [], due: "Today", flagged: 1 },
  ];
}

/* ------------------------------------------------------------ helpers shared with the screens */

export const residentsWithInterest = (slug: CommunitySlug, i: Interest) => Object.values(engagement(slug)).filter((r) => r.interests.includes(i)).map((r) => r.name);
export const lastName = last;
export const timeOf = (m: number) => fmtTime(m);

/* ------------------------------------------------------------ photos wanted */

/** Whether staff want photos from an event (yes or no; no: don't nag). Set on the event when it's added. */
export function photosWanted(e: Pick<CalEvent, "id" | "cat" | "special" | "title"> & { kind?: CalEvent["kind"] }): boolean {
  if (e.cat === "faith" || e.cat === "movies") return false;
  const k = kindOf(e as CalEvent);
  if (e.special || k !== "resident" || e.cat === "trips") return true;
  return e.cat === "music" || /paint|craft|pumpkin|bak|garden|party|concert|happy hour|social|dance|cook|wreath|card making/i.test(e.title);
}
