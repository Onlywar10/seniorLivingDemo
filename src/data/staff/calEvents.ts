// Every event as staff see it, with everything about it: seats, who's booked, family requests, invites, attendance and
// photos. One builder for the calendar and for Today, so the same event sheet opens from both with the same facts.
// Server only (reads the community's staff data).
import type { CommunitySlug } from "@/data/communities";
import { communities } from "@/data/communities";
import { cats, isLantern, kindOf, type EventKind } from "@/data/shared";
import { rsvpFor, getStaffData } from "./index";
import { attendance, eventRequests, suggestions } from "./alpha";
import { checkIns, engagement, eventInterests, invitesFor, photosWanted } from "./engage";
import { cameTo } from "./post";
import { WEEKDAYS, hash, iso, today } from "@/lib/clock";
import { demoTripPlan, demoTripStops, isDemoTrip } from "@/data/communities/demoTrip";

export interface Booking { name: string; via: string }
export interface ReqRow {
  id: string; from: string; relation: string; resident: string; party: number; kind: "rsvp" | "seat"; stage: 1 | 2 | 3 | 4; declined?: boolean;
  /** A Lantern (memory care) resident: no text; asked in person. */
  lantern?: boolean;
  /** The event was full, so the resident went on the waitlist. */
  waitlisted?: boolean;
}

export interface CalEvent {
  id: string; date: string; start: number; end?: number; title: string; room: string; cat: string; color: string; catLabel: string;
  kind: EventKind;
  cap?: number; taken?: number; waitlist?: number; lantern?: boolean; leader?: string; desc?: string; rule?: string;
  booked?: Booking[]; waiting?: string[]; clash?: string; isNew?: boolean;
  requests?: ReqRow[];
  /** About how many usually come, and who (events without a seat list), for attendance. */
  expected?: number; regulars?: string[];
  /** Attendance, once taken: QR check-ins and staff taps (or a photo of the paper sheet). */
  came?: { n: number; of: number; qr: number; staff: number; how: "tap" | "sheet"; by: string };
  /** Who came (or is booked), for suggesting photo tags. */
  cameNames?: string[];
  /** Personal invites to residents whose interests match. */
  invites?: { invited: number; yes: number; interests: string[]; text: string; sentAt: string };
  photos?: string[];
  /** How many photos staff want from it (0 or missing: none). */
  wanted?: number;
  /** A resident's suggestion that became this event (their name, or "a resident"). */
  idea?: string;
  /** Waiting for the approver (it has a price). */
  approval?: boolean;
  cancelled?: boolean;
  /** Running late: how many minutes. */
  late?: number;
  /** Who's signed up, and who has shown interest (their interests match, or they asked about it). */
  people?: Person[];
  /** The interests it matches, for invites. */
  interests?: string[];
  /** Notes the leader keeps for themselves: materials, set-up, people. Staff only, never published. */
  notes?: Note[];
  cost?: string;
  /** Moved in this browser: the date it had before (so the move can be found again). */
  orig?: string;
  /** What happens during it, step by step (staff wrote it on Post; otherwise Kinlight drafts one). */
  plan?: { at: number; what: string }[];
  /** Off campus: where the bus goes, in order. */
  stops?: { id: string; name: string; address: string; kind: string; mins: number; x: number; y: number }[];
  /** Staff chose to put it in the coming newsletter. */
  newsletter?: boolean;
}

export interface Person { name: string; status: "signed" | "interested" | "invited"; why: string }
export interface Note { id: string; by: string; when: string; kind: "materials" | "people" | "setup"; text: string; files?: Material[] }
/** A printable attached to a materials note: a PDF of questions, a song sheet, a sign-in sheet. */
export interface Material { name: string; url: string; size: string }

const M = (file: string, name: string, kb: number): Material => ({ name, url: `/staff-materials/${file}`, size: `${kb} KB` });
const signIn = M("sign-in-sheet.pdf", "Sign-in sheet.pdf", 2);

export function calendarEvents(slug: CommunitySlug, from: Date, days: number): CalEvent[] {
  const s = getStaffData(slug);
  const c = communities[slug];
  const { rooms } = c;
  // Meeting points and "All floors" can host several things at once.
  const shared = new Set<string>([rooms.lobby ?? "Lobby", "All floors"]);
  const t = today();
  const reqs = eventRequests(slug);
  const eng = engagement(slug);
  const lanternRes = new Set(s.lanternNames);
  const taken = new Map(attendance(slug).rows.filter((r) => r.method !== "Not taken yet").map((r) => [`${r.event.id}|${r.event.date}`, r]));
  const out: CalEvent[] = [];
  for (const d of c.staffEventsBetween(from, days, iso(t))) {
    const seen = new Map<string, string>();
    for (const e of d.events) {
      const key = `${e.room}|${e.start}`;
      const clash = !shared.has(e.room) && seen.has(key) ? seen.get(key) : undefined;
      if (!shared.has(e.room)) seen.set(key, e.title);
      const lantern = isLantern(e);
      const h = hash(e.id);
      const r = e.cap ? rsvpFor(s, e.id, e.taken ?? 0, e.waitlist ?? 0, lantern) : undefined;
      const inv = lantern || e.cat === "faith" || e.cat === "movies" ? null : invitesFor(slug, e);
      const mine = reqs.filter((q) => q.event.id === e.id && (q.kind === "family-rsvp" || q.kind === "seat-request"));
      const requests: ReqRow[] = mine.map((q) => {
        const res = q.resident ?? "";
        const isL = lanternRes.has(res) || eng[res]?.lantern;
        return {
          id: q.id, from: q.from, relation: q.relation ?? "Family", resident: res, party: q.party, kind: q.kind === "family-rsvp" ? "rsvp" : "seat",
          // The resident says yes, then staff approve (or add them to the waitlist when it's full).
          stage: q.status === "checking" ? 2 : q.status === "waiting" ? 3 : 4, declined: q.status === "declined",
          waitlisted: q.status === "waiting" && q.kind === "seat-request" && !!e.cap && (e.taken ?? 0) >= e.cap ? true : undefined,
          lantern: isL || undefined,
        };
      });
      const booked: Booking[] | undefined = r?.going.map((n, i) => ({
        name: n,
        via: mine.some((q) => q.kind === "seat-request" && q.resident === n && q.status === "confirmed") ? "Family asked, resident said yes"
          : inv?.yesNames.includes(n) ? `Invited by interest (${inv.interests.join(", ").toLowerCase()})`
          : (hash(n + e.id) + i) % 3 === 0 ? "Signed up at the desk" : "Replied YES by text",
      }));
      // Who usually comes, for events without a seat list: the same people attendance counts (so the list matches).
      const pool = lantern ? s.lanternNames : s.residentNames;
      const expected = e.cap ? e.taken ?? e.cap : 8 + (h % 18);
      const regulars = e.cap ? undefined : [...new Set([...(inv?.yesNames ?? []), ...Array.from({ length: Math.min(expected, pool.length) }, (_, i) => pool[(h + i * 3) % pool.length])])].slice(0, Math.max(expected, inv?.yes ?? 0));
      const att = taken.get(`${e.id}|${e.date}`);
      const ck = att ? checkIns(e.id, att.came) : undefined;
      const qr = att && !lantern ? ck!.qr : 0;
      // Earlier days have some photos already; today's are still to come.
      const photos = att && e.date < iso(t) && hash(e.id + e.date) % 3 === 0 ? s.photoPresets.slice(h % 2, (h % 2) + 2).map((p) => p.src) : undefined;
      const wanted = photosWanted(e);
      const cameNames = e.date <= iso(t) ? [...new Set([...(r?.going ?? []), ...(att?.names ?? []), ...cameTo(slug, { id: e.id, date: e.date, lantern }, att?.came ?? 10)])] : undefined;
      // Signed up (booked, or said YES to the invite), then residents whose interests match who haven't yet.
      const ints = eventInterests(e);
      const signed: Person[] = booked
        ? booked.map((b) => ({ name: b.name, status: "signed", why: b.via }))
        : [...new Set([...(inv?.yesNames ?? []), ...(regulars ?? []).slice(0, 4)])].map((n, i) => ({ name: n, status: "signed", why: inv?.yesNames.includes(n) ? "Said YES to the invite" : i % 2 ? "Signed up at the desk" : "Comes every week" }));
      const inList = new Set(signed.map((p) => p.name));
      const interested: Person[] = Object.values(eng)
        .filter((r) => !inList.has(r.name) && !!r.lantern === !!lantern && r.interests.some((x) => ints.includes(x)))
        .slice(0, 10)
        .map((r) => ({ name: r.name, status: "interested", why: `Likes ${r.interests.filter((x) => ints.includes(x)).join(", ").toLowerCase()}` }));
      out.push({
        people: [...signed, ...interested], interests: ints, notes: notesFor(s, e, signed.map((p) => p.name), d.date.getTime() < t.getTime()),
        cost: e.cat === "trips" && e.cap ? `$${10 + (h % 3) * 5} (lunch)` : undefined,
        id: e.id, kind: kindOf(e), date: e.date, start: e.start, end: e.end, title: e.title, room: e.room, cat: e.cat, color: cats[e.cat].color, catLabel: cats[e.cat].label,
        cap: e.cap, taken: e.taken, waitlist: e.waitlist, lantern, leader: e.leader, desc: e.desc,
        rule: e.special ? undefined : `Every ${WEEKDAYS[d.date.getUTCDay()]}`,
        booked, waiting: r?.waiting, clash, requests: requests.length ? requests : undefined,
        expected, regulars,
        came: att ? { n: att.came, of: att.expected, qr, staff: att.came - qr, how: att.method === "Tap list" ? "tap" : "sheet", by: att.by } : undefined,
        invites: inv ? { invited: inv.invited, yes: inv.yes, interests: inv.interests, text: inv.text, sentAt: inv.sentAt } : undefined,
        photos, wanted: wanted || undefined, cameNames,
        ...(isDemoTrip(e.id) ? { stops: demoTripStops(), plan: demoTripPlan(), cost: "$15 (lunch included)", wanted: 6, newsletter: true } : {}),
      });
    }
  }
  for (const e of out) if (e.clash) { const o = out.find((x) => x.date === e.date && x.room === e.room && x.start === e.start && x.title === e.clash); if (o) o.clash = e.title; }

  // Residents' ideas that became events, marked "Your idea".
  const last = iso(new Date(from.getTime() + (days - 1) * 864e5));
  for (const sg of suggestions(slug)) {
    if (!sg.becameEvent) continue;
    const date = sg.becameEvent.date;
    if (date < iso(from) || date > last) continue;
    out.push({ id: `idea-${sg.id}`, kind: "resident", date, start: 14 * 60, end: 15 * 60 + 30, title: sg.becameEvent.title, room: Object.values(rooms).find((r) => /club/i.test(r)) ?? Object.values(rooms)[0], cat: "community", color: cats.community.color, catLabel: cats.community.label, idea: sg.who ?? "a resident", desc: `Suggested by ${sg.who ?? "a resident (no name on the slip)"}: “${sg.text}”`, expected: 10 });
  }
  return out;
}

/**
 * The leader's own notes for an activity: what to bring and set up, and a word about people coming. Written by
 * staff for themselves; never published or sent. A few per event in the demo, depending on what kind of event it is.
 */
function notesFor(s: ReturnType<typeof getStaffData>, e: { id: string; title: string; cat: string; cap?: number; room: string; leader?: string }, names: string[], past: boolean): Note[] {
  const h = hash(e.id);
  const by = e.leader ?? s.people[s.roles.calendar].name;
  const who = (i: number) => names[(h + i) % Math.max(1, names.length)]?.split(" ")[0];
  const when = past ? "Last week" : ["Yesterday", "Mon", "Last Thursday"][h % 3];
  const t = e.title.toLowerCase();
  const out: Omit<Note, "id">[] = [];
  const add = (kind: Note["kind"], text: string, files?: Material[]) => out.push({ by, when, kind, text, files });
  if (e.cat === "trips") {
    add("setup", "Bus booked for 15 minutes before; driver has the list. Bring the first-aid kit and the trip phone.");
    add("materials", "Print the checklist and the sign-in sheet for the bus.", [M("trip-checklist.pdf", "Trip checklist.pdf", 2), signIn]);
    if (who(0)) add("people", `${who(0)} needs the wheelchair lift. Save the seat by the door.`);
    if (who(1)) add("people", `${who(1)} asked to sit with ${who(2) ?? "a friend"}.`);
  } else if (e.cat === "fitness" || /yoga|fit|balance|stretch|zumba|band/.test(t)) {
    add("materials", `${10 + (h % 8)} chairs without arms, the resistance bands from the storage closet, water jug and cups.`, [M("chair-exercise-guide.pdf", "Chair exercise routine.pdf", 2)]);
    if (who(0)) add("people", `${who(0)} uses a walker: leave room at the end of the front row.`);
    add("setup", "Turn the music down for the cool-down; the speaker is on the back shelf.");
  } else if (e.cat === "music" || /concert|sing|music|piano/.test(t)) {
    add("setup", `Move the piano to the window side of ${e.room}. Microphone batteries are in the top drawer.`);
    if (who(0)) add("people", `${who(0)} is hard of hearing: save a seat near the front.`);
    add("materials", "Large-print song sheets: print 20 copies.", [M("large-print-song-sheet.pdf", "Large-print song sheet.pdf", 2)]);
  } else if (/craft|paint|knit|art|pumpkin|wreath/.test(t)) {
    add("materials", `Paints, brushes and ${12 + (h % 6)} canvases from the craft cupboard. Plastic tablecloths, paper towels.`, [M("craft-instructions.pdf", "Step-by-step instructions.pdf", 2)]);
    if (who(0)) add("people", `${who(0)} brings their own yarn and likes the corner table by the light.`);
  } else if (/trivia|bingo|game|cards|scrabble|bridge|puzzle|brain/.test(t)) {
    add("materials", /bingo/.test(t) ? "Bingo cards, daubers, and the prize basket (restock the chocolates)." : "Question cards, score sheet, pencils and the small prizes.",
      /bingo/.test(t) ? [M("bingo-cards.pdf", "Large-print bingo cards.pdf", 2)] : [M("trivia-questions.pdf", "This week’s questions.pdf", 2), M("score-sheet.pdf", "Score sheet.pdf", 2)]);
    if (who(0)) add("people", `${who(0)} won last week: has asked to be quizmaster for one round.`);
  } else if (e.cat === "lantern") {
    add("setup", "Keep the room calm and well lit; the familiar playlist is on the tablet.");
    if (who(0)) add("people", `${who(0)} settles best with a hand to hold at the start.`);
  } else {
    add("setup", `Set up ${e.room} 20 minutes before: chairs in a half circle, name tags at the door.`);
    add("materials", "Sign-in sheet for anyone who doesn’t scan the QR code.", [signIn]);
    if (who(0)) add("people", `${who(0)} asked to help hand things out.`);
  }
  if (e.cap) add("people", "Check the waitlist the morning of: anyone who drops out frees a seat automatically.");
  return out.map((n, i) => ({ ...n, id: `${e.id}-n${i}` }));
}

/** Everyone who can be checked in or booked: residents and Lantern residents, A to Z. */
export function everyone(slug: CommunitySlug): string[] {
  const s = getStaffData(slug);
  return [...s.residentNames, ...s.lanternNames].filter((n, i, a) => a.indexOf(n) === i).sort();
}

/** The staff who can lead an activity, for "Who's leading". */
export function leaders(slug: CommunitySlug): string[] {
  const s = getStaffData(slug);
  return Object.values(s.people).map((p) => p.name).filter((n, i, a) => a.indexOf(n) === i);
}

/** For "Invite someone else": who lives in Lantern, and each resident's interests (matching residents come first). */
export function inviteData(slug: CommunitySlug): { lantern: string[]; interestsOf: Record<string, string[]> } {
  const s = getStaffData(slug);
  return { lantern: s.lanternNames, interestsOf: Object.fromEntries(Object.values(engagement(slug)).map((r) => [r.name, r.interests])) };
}
