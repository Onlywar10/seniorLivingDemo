// Post and Calendar: what the forms need from one community's data. Post creates (an event, an announcement, an
// import); Calendar manages what exists, including each event's photos and the planning help (ideas, templates, what
// worked). Server Components only (it reads every community).
import { communities, type CommunitySlug } from "@/data/communities";
import { kindOf, type Cat, type EventKind, type Tag } from "@/data/shared";
import { addDays, dayName, dayShort, fmtTime, fromIso, hash, iso, monthName, shortDate, sundayOf, today } from "@/lib/clock";
import { suggestions } from "./alpha";
import { INTERESTS, engagement, eventInterests, todayActivities, whatWorked, type Interest } from "./engage";
import { areasOf } from "./areas";
import { getStaffData } from "./index";
import { residents } from "./portal";
import type { StaffRole } from "./shared";

const first = (n = "") => n.split(" ")[0];

/* ------------------------------------------------------------ a new event (Post, and Calendar's "+ Add") */

export interface Busy { date: string; start: number; end: number; room: string; title: string }
export interface Invitee { name: string; interests: Interest[] }
/** A ready-made event to start from: Post opens with one, so the invites show real numbers. */
export interface EventSample { title: string; kind: EventKind; cat: Cat; time: string; minutes: number; room: string; interests: Interest[]; photos: number }
export interface NewEventSetup {
  brand: { name: string; short: string; domain: string; phone: string };
  rooms: string[];
  /** Places that can host several things at once (the lobby as a meeting point, "All floors"). */
  shared: string[];
  /** What's already on, for room clashes. */
  busy: Busy[];
  /** Residents who get texts, with their interests, for personal invites. Lantern residents are asked in person. */
  invitees: Invitee[];
  interests: Interest[];
  todayIso: string;
  approver: { name: string; first: string };
  /** The signed-in person approves their own posts. */
  isApprover: boolean;
  families: number;
  sample: EventSample;
  /** Recent events to copy: most repeat with small changes. Dated to the same weekday next week. */
  past: PastEvent[];
  /** The community's floors and care areas, set once in Settings, for "Who it's for". */
  areas: string[];
  /** Staff who can lead an activity, and who's adding it (the default leader). */
  staff: string[]; me: string;
}
export interface PastEvent extends EventSample { label: string; date: string; cap?: number }

export function newEventSetup(slug: CommunitySlug, as: StaffRole): NewEventSetup {
  const s = getStaffData(slug);
  const c = communities[slug];
  const t = today();
  const rooms = [...Object.values(c.rooms), "All floors"];
  const shared = [c.rooms.lobby ?? "Lobby", "All floors"];
  const busy: Busy[] = c.staffEventsBetween(addDays(t, -7), 63, iso(t)).flatMap((d) => d.events).map((e) => ({ date: e.date, start: e.start, end: e.end ?? e.start + 60, room: e.room, title: e.title }));
  const eng = engagement(slug);
  const invitees = Object.values(eng).filter((r) => !r.lantern).map((r) => ({ name: r.name, interests: r.interests }));
  const approver = s.people[s.roles.approver].name;
  const room = rooms.find((r) => /living|club/i.test(r)) ?? rooms[0];
  return {
    brand: { name: s.brand.name, short: s.brand.short, domain: s.brand.domain, phone: s.brand.phone },
    rooms, shared, busy, invitees, interests: [...INTERESTS], todayIso: iso(t),
    approver: { name: approver, first: first(approver) }, isApprover: as === "manager", families: s.community.families,
    sample: pickSample(invitees, room),
    past: pastEvents(slug),
    areas: areasOf(slug).map((a) => a.name),
    staff: Object.values(s.people).map((x) => x.name).filter((n, i, a) => a.indexOf(n) === i),
    me: s.people[({ events: s.roles.calendar, sales: s.roles.tours, manager: s.roles.approver, kitchen: s.roles.menus, desk: s.roles.desk, caregiver: s.roles.calendar, lantern: s.roles.lantern } as const)[as]]?.name ?? approver,
  };
}

/** The last two weeks' events, newest first, one of each, to start a new event from. */
function pastEvents(slug: CommunitySlug): PastEvent[] {
  const c = communities[slug];
  const t = today();
  const seen = new Set<string>();
  const hh = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  return c.staffEventsBetween(addDays(t, -14), 14, iso(t)).flatMap((d) => d.events)
    .filter((e) => e.cat !== "movies" && e.cat !== "faith" && e.cat !== "lantern")
    .sort((a, b) => b.date.localeCompare(a.date) || b.start - a.start)
    .filter((e) => (seen.has(e.title) ? false : (seen.add(e.title), true)))
    .slice(0, 8)
    .map((e) => {
      const d = fromIso(e.date);
      let next = addDays(d, 7);
      while (iso(next) <= iso(t)) next = addDays(next, 7);
      return {
        label: `${e.title.replace(/^Bus Trip: /, "")} · ${dayShort(d)}`, title: e.title, kind: kindOf(e), cat: e.cat as Cat, time: hh(e.start), minutes: (e.end ?? e.start + 60) - e.start,
        room: e.room, interests: eventInterests(e), photos: 0, date: iso(next), cap: e.cap,
      };
    });
}

/** The sample Post opens with: the first that reaches a good number of residents, so the invites look real. */
function pickSample(invitees: Invitee[], room: string): EventSample {
  const options: EventSample[] = [
    { title: "Afternoon Concert", kind: "resident", cat: "music", time: "15:30", minutes: 60, room, interests: ["Music"], photos: 6 },
    { title: "Travel Talk: Autumn in New England", kind: "resident", cat: "community", time: "14:00", minutes: 60, room, interests: ["Learning"], photos: 4 },
    { title: "Morning Walk and Stretch", kind: "resident", cat: "fitness", time: "10:00", minutes: 45, room, interests: ["Fitness"], photos: 4 },
  ];
  const reach = (x: EventSample) => invitees.filter((r) => r.interests.some((i) => x.interests.includes(i))).length;
  return options.find((x) => reach(x) >= 8) ?? options.reduce((a, b) => (reach(b) > reach(a) ? b : a));
}

/** A resident's suggestion, to start a new event from ("make it an event" in Feedback). */
export interface IdeaPrefill { id: string; title: string; text: string; who?: string }
export function ideaPrefill(slug: CommunitySlug, id?: string): IdeaPrefill | undefined {
  const sg = id ? suggestions(slug).find((x) => x.id === id) : undefined;
  if (!sg) return undefined;
  return { id: sg.id, title: sg.becameEvent?.title ?? ideaTitle(sg.text), text: sg.text, who: sg.who };
}
/** "A men’s breakfast club once a month" → "Men’s breakfast club once a month". */
const ideaTitle = (text: string) => text.replace(/^(A |An |More |Bring back the |Learn to )/i, "").replace(/,.*$/, "").replace(/^\w/, (x) => x.toUpperCase());

/* ------------------------------------------------------------ import: anything on paper, read into the calendar or menus */

export type ImportKind = "month" | "week" | "today" | "menu";
export interface ImportFlag {
  id: string;
  title: string;
  /** Where it is: "Thu, Dec 3 · 10:00 am". */
  read: string;
  /** Why Kinlight is unsure, in a few words. */
  why: string;
  /** Choices to fix it, the first being Kinlight's best guess. */
  options: string[];
}
export interface ImportRow {
  id: string; when: string; title: string; room?: string; was?: string; now?: string; told?: { residents: number; families: number };
  /** For new events: the date and start, so "Details" opens the event form filled in. */
  date?: string; start?: number;
  /** It's the same as an activity already on the calendar ("Every Tuesday"), rather than new. */
  match?: string;
}
export interface MenuDay { day: string; special: { name: string; tags: Tag[] }; soup: string; mains: string[] }

export interface ImportSample {
  k: ImportKind;
  /** The file as it arrived. */
  file: string;
  from: string;
  /** "next week’s activities". */
  what: string;
  /** "Nov 8–14". */
  period: string;
  /** Totals shown before the list. */
  totals: { n: number; label: string; tone?: "warn" }[];
  added: ImportRow[];
  changed: ImportRow[];
  cancelled: ImportRow[];
  flags: ImportFlag[];
  told: { residents: number; families: number };
  /** What the artwork shows. */
  art: MonthArt | WeekArt | NoteArt | MenuArt;
  /** Menu only. */
  menu?: { venue: string; days: MenuDay[] };
}
export interface MonthArt { kind: "month"; brand: string; month: string; year: number; lead: number; days: number; cells: Record<number, string[]> }
export interface WeekArt { kind: "week"; title: string; cols: { day: string; items: { text: string; mark?: "new" | "moved" | "cancel" }[] }[] }
export interface NoteArt { kind: "note"; lines: string[]; sign: string }
export interface MenuArt { kind: "menu"; venue: string; brand: string; week: string; days: MenuDay[] }

export interface ImportSetup { samples: ImportSample[]; todayIso: string }

const short = (t: string) => t.replace(/^Bus Trip: /, "").replace(/ with .*$/, "").replace(/[:“].*$/, "").trim();

export function importSetup(slug: CommunitySlug): ImportSetup {
  return { samples: [importMonth(slug), importWeek(slug), importToday(slug), importMenu(slug)], todayIso: iso(today()) };
}

/** The polished PDF activity calendar for next month. */
function importMonth(slug: CommunitySlug): ImportSample {
  const c = communities[slug];
  const s = getStaffData(slug);
  const t = today();
  const m1 = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 1));
  const days = new Date(Date.UTC(m1.getUTCFullYear(), m1.getUTCMonth() + 1, 0)).getUTCDate();
  const evs = c.staffEventsBetween(m1, days, iso(t)).flatMap((d) => d.events);
  const pick = (test: (e: (typeof evs)[number]) => boolean, n = 0) => evs.filter(test)[n] ?? evs[n];
  const rooms = Object.values(c.rooms);
  const day = (e: { date: string; start: number }) => `${dayShort(fromIso(e.date))} · ${fmtTime(e.start)}`;
  const yoga = pick((e) => /yoga|fit|stretch|balance/i.test(e.title));
  const club = pick((e) => /bridge|bingo|club|game/i.test(e.title));
  const trip = pick((e) => !!e.cap);
  const music = pick((e) => e.cat === "music");
  const special = pick((e) => !!e.special, 1);
  const craft = pick((e) => /paint|craft|art|knit/i.test(e.title)) ?? evs[5];
  const month = monthName(m1);
  const flags: ImportFlag[] = [
    { id: "m1", title: yoga.title, read: day(yoga), why: "Time unclear: 10:00 or 10:30?", options: [fmtTime(yoga.start), fmtTime(yoga.start + 30)] },
    { id: "m2", title: club.title, read: day(club), why: "Room unreadable", options: [club.room, ...rooms.filter((r) => r !== club.room).slice(0, 2)] },
    { id: "m3", title: music.title, read: day(music), why: "Listed twice", options: ["Keep one", "Keep both"] },
    { id: "m4", title: special.title, read: day(special), why: "Between two days", options: [dayShort(fromIso(special.date)), dayShort(addDays(fromIso(special.date), 1))] },
    { id: "m5", title: trip.title, read: day(trip), why: "“Sign up” but no seat count", options: [String(trip.cap ?? 12), "No limit"] },
    { id: "m6", title: craft.title, read: day(craft), why: "New this month: one-off or weekly?", options: ["Weekly", "One-off"] },
  ];
  const firstDay = evs.filter((e) => e.date === evs[0].date && e.cat !== "lantern").slice(0, 6);
  const cells: Record<number, string[]> = {};
  for (let i = 1; i <= days; i++) {
    const di = iso(addDays(m1, i - 1));
    cells[i] = evs.filter((e) => e.date === di && e.cat !== "lantern" && e.cat !== "faith").slice(0, 3).map((e) => `${fmtTime(e.start).replace(":00", "").replace(" ", "")} ${e.title}`);
  }
  return {
    k: "month", file: `${month} activity calendar.pdf`, from: "PDF · 2 pages", what: `the ${month} activity calendar`, period: `${month} 1–${days}`,
    totals: [{ n: 312, label: "events" }, { n: 41, label: "repeating" }, { n: 6, label: "to check", tone: "warn" }],
    added: firstDay.map((e) => ({ id: e.id, when: day(e), title: e.title, room: e.room, date: e.date, start: e.start, match: e.special ? undefined : `Every ${dayName(fromIso(e.date))}` })),
    changed: [], cancelled: [], flags, told: { residents: 0, families: 0 },
    art: { kind: "month", brand: s.brand.name, month, year: m1.getUTCFullYear(), lead: m1.getUTCDay(), days, cells },
  };
}

/** A phone photo of the whiteboard in the activities office: next week, Sunday to Saturday. */
function importWeek(slug: CommunitySlug): ImportSample {
  const c = communities[slug];
  const t = today();
  const sun = addDays(sundayOf(t), 7);
  const week = c.staffEventsBetween(sun, 7, iso(t));
  const all = week.flatMap((d) => d.events).filter((e) => e.cat !== "faith" && e.cat !== "movies" && e.cat !== "lantern" && !e.lantern);
  const R = (re: RegExp, fb = 0) => Object.values(c.rooms).find((r) => re.test(r)) ?? Object.values(c.rooms)[fb];
  const art = R(/art/i), club = R(/club/i), court = R(/courtyard/i), lobby = R(/lobby/i), living = R(/living|bistro|perch/i), theater = R(/theat/i);
  const at = (i: number) => addDays(sun, i);
  const when = (d: Date, m: number) => `${dayShort(d)} · ${fmtTime(m)}`;
  const added: (ImportRow & { d: number; m: number })[] = [
    { d: 0, m: 15 * 60, title: "Ukulele Sing-Along", room: living },
    { d: 1, m: 14 * 60, title: "Thanksgiving Card Making", room: art },
    { d: 1, m: 16 * 60, title: "Apple Cider Social", room: living },
    { d: 2, m: 10 * 60 + 30, title: "Travelogue", room: theater },
    { d: 2, m: 14 * 60 + 30, title: "Harvest Wreath Workshop", room: art },
    { d: 3, m: 10 * 60, title: "Courtyard Bird Walk", room: court },
    { d: 3, m: 11 * 60, title: "Coffee and Stories", room: club },
    { d: 4, m: 14 * 60, title: "Pumpkin Pie Baking", room: club },
    { d: 4, m: 16 * 60, title: "Name That Tune", room: living },
    { d: 5, m: 10 * 60 + 30, title: "Seated Tai Chi Taster", room: lobby },
    { d: 5, m: 14 * 60, title: "Gratitude Tree Crafts", room: art },
    { d: 6, m: 14 * 60, title: "Ice Cream Social", room: court },
  ].map((x, i) => ({ ...x, id: `w-new-${i}`, when: when(at(x.d), x.m) }));
  // Three real activities moved by half an hour, and one cancelled: these are the ones whose people are told.
  const pickOn = (d: number, n = 0) => all.filter((e) => e.date === iso(at(d)))[n] ?? all[(d * 3 + n) % all.length];
  const ch = [pickOn(1, 2), pickOn(2, 3), pickOn(4, 1)];
  const toldCh = [{ residents: 3, families: 2 }, { residents: 2, families: 1 }, { residents: 0, families: 0 }];
  const changed: ImportRow[] = ch.map((e, i) => ({ id: `w-ch-${i}`, when: dayShort(fromIso(e.date)), title: e.title, room: e.room, was: fmtTime(e.start), now: fmtTime(e.start + (i === 1 ? -30 : 30)), told: toldCh[i] }));
  const cx = pickOn(3, 4);
  const cancelled: ImportRow[] = [{ id: "w-cx", when: when(fromIso(cx.date), cx.start), title: cx.title, room: cx.room, told: { residents: 2, families: 1 } }];
  const flags: ImportFlag[] = [
    { id: "w1", title: "Ukulele Sing-Along", read: dayShort(at(0)), why: "Time smudged: 2 or 3 pm?", options: ["3:00 pm", "2:00 pm"] },
    { id: "w2", title: "Name That Tune", read: dayShort(at(4)), why: "Room cut off in the photo", options: [living, club, theater].filter((x, i, a) => a.indexOf(x) === i) },
    // Kinlight never adds words that aren't on the source: a vague title is kept as written and flagged.
    { id: "w3", title: "Travelogue", read: dayShort(at(2)), why: "Only “Travelogue” on the board: which trip?", options: ["Keep “Travelogue”", "I’ll add the place"] },
  ];
  const sh = (m: number) => fmtTime(m).replace(":00", "").replace(" am", "").replace(" pm", "");
  const cols = Array.from({ length: 7 }, (_, i) => {
    const d = at(i);
    const items: WeekArt["cols"][number]["items"] = [];
    added.filter((a) => a.d === i).forEach((a) => items.push({ text: `${sh(a.m)} ${short(a.title)}`, mark: "new" }));
    ch.forEach((e, k) => { if (e.date === iso(d)) items.push({ text: `${short(e.title)} → ${sh(e.start + (k === 1 ? -30 : 30))}`, mark: "moved" }); });
    if (cx.date === iso(d)) items.push({ text: short(cx.title), mark: "cancel" });
    return { day: `${dayName(d).slice(0, 3).toUpperCase()} ${d.getUTCDate()}`, items };
  });
  const range = `${shortDate(sun)}–${addDays(sun, 6).getUTCDate()}`;
  return {
    k: "week", file: "IMG_4127.jpg", from: "Photo from a phone", what: "next week’s activities", period: range,
    totals: [{ n: 12, label: "new" }, { n: 3, label: "changed times" }, { n: 1, label: "cancelled" }, { n: 3, label: "to check", tone: "warn" }],
    added: added.map((r) => {
      // Already on the calendar as a weekly activity (same name), or new.
      const same = c.staffEventsBetween(addDays(sun, -28), 28, iso(t)).flatMap((d) => d.events).find((e) => e.title.toLowerCase() === r.title.toLowerCase() && !e.special);
      return { id: r.id, when: r.when, title: r.title, room: r.room, date: iso(at(r.d)), start: r.m, match: same ? `Every ${dayName(fromIso(same.date))}` : undefined };
    }), changed, cancelled, flags, told: { residents: 7, families: 4 },
    art: { kind: "week", title: `WEEK OF ${monthName(sun).slice(0, 3).toUpperCase()} ${sun.getUTCDate()}`, cols },
  };
}

/** A scribbled note left at the front desk about today. */
function importToday(slug: CommunitySlug): ImportSample {
  const s = getStaffData(slug);
  // Today's activities (tomorrow's, on the rare day with fewer than two).
  const now = todayActivities(slug).filter((a) => !a.lantern);
  const acts = now.length >= 2 ? now : todayActivities(slug, 1).filter((a) => !a.lantern);
  const later = acts.filter((a) => a.state === "later");
  const pool = later.length >= 2 ? later : acts.slice(-2);
  const mv = pool.find((a) => /bingo|game|club|trivia/i.test(a.title)) ?? pool[0];
  const cx = pool.find((a) => a !== mv && /yoga|fit|balance|stretch|dance/i.test(a.title)) ?? pool.find((a) => a !== mv) ?? acts[0];
  const to = mv.start === 15 * 60 ? 15 * 60 + 30 : 15 * 60;
  const bookedOf = (a: typeof mv) => (a.cap ? a.taken ?? 0 : a.invites?.yes ?? Math.round(a.expected * 0.6));
  const r1 = bookedOf(mv), r2 = bookedOf(cx);
  const f = (n: number) => Math.round(n * 0.7);
  const t = today();
  return {
    k: "today", file: "Note from the front desk.jpg", from: "Photo from a phone", what: "changes to today", period: dayShort(t),
    totals: [{ n: 2, label: "changes" }],
    added: [],
    changed: [{ id: "t-ch", when: "Today", title: mv.title, room: mv.place, was: mv.time, now: fmtTime(to), told: { residents: r1, families: f(r1) } }],
    cancelled: [{ id: "t-cx", when: `Today · ${cx.time}`, title: cx.title, room: cx.place, told: { residents: r2, families: f(r2) } }],
    flags: [],
    told: { residents: r1 + r2, families: f(r1) + f(r2) },
    art: { kind: "note", lines: [`${short(mv.title)} moved to ${fmtTime(to).replace(":00", "").replace(" pm", "")}!`, `${short(cx.title)} cancelled`, "(tell the desk)"], sign: `– ${first(s.people[s.roles.calendar].name)[0]}.` },
  };
}

/** The kitchen's PDF menu for the first restaurant, next week. */
function importMenu(slug: CommunitySlug): ImportSample {
  const c = communities[slug];
  const s = getStaffData(slug);
  const t = today();
  const sun = addDays(sundayOf(t), 7);
  const key = c.venueOrder[0];
  const venue = c.venues[key];
  const days: MenuDay[] = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(sun, i);
    const m = c.menuFor(key, d);
    const mains = m.sections.flatMap((x) => x.items).map((x) => x.name).filter((n) => n !== m.special.name).slice(0, 2);
    return { day: dayShort(d), special: { name: m.special.name, tags: m.special.tags ?? [] }, soup: m.soup.name, mains };
  });
  const tagged = days.filter((d) => d.special.tags.length);
  const f1 = tagged[0] ?? days[1], f2 = tagged[1] ?? days[4];
  const flags: ImportFlag[] = [
    { id: "n1", title: f1.special.name, read: f1.day, why: "Tag smudged: GF or DF?", options: ["GF", "DF"] },
    { id: "n2", title: f2.special.name, read: f2.day, why: "Tag cut off: VG?", options: ["VG", "No tag"] },
  ];
  const week = `Week of ${shortDate(sun)}`;
  return {
    k: "menu", file: `${venue.name.replace(/^The /, "")} menu, ${week}.pdf`, from: "PDF from the kitchen", what: `the ${venue.name.replace(/^The /, "")} menu`, period: `week of ${shortDate(sun)}`,
    totals: [{ n: 7, label: "days" }, { n: days.reduce((n, d) => n + 2 + d.mains.length, 0), label: "dishes" }, { n: 2, label: "tags to check", tone: "warn" }],
    added: [], changed: [], cancelled: [], flags, told: { residents: 0, families: 0 },
    art: { kind: "menu", venue: venue.name, brand: s.brand.name, week, days },
    menu: { venue: venue.name, days },
  };
}

/* ------------------------------------------------------------ announcements */

export interface Audience { k: string; label: string; residents: number; families: number; group: "all" | "floor" | "care" | "families" | "residents" }
export interface AnnounceSetup {
  slug: CommunitySlug;
  name: string; short: string; phone: string; domain: string;
  audiences: Audience[];
  languages: { k: string; n: number }[];
  /** Rooms, for "new room" when an event changes. */
  rooms: string[];
  todayIso: string;
}

export function announceSetup(slug: CommunitySlug): AnnounceSetup {
  const s = getStaffData(slug);
  const c = communities[slug];
  const rs = residents(slug);
  const total = s.community.residents;
  const fams = s.community.families;
  const floorOf = (apt: string) => Number((apt.match(/\d/) ?? ["1"])[0]);
  const floors = new Map<number, number>();
  rs.filter((r) => !r.lantern).forEach((r) => floors.set(floorOf(r.apt), (floors.get(floorOf(r.apt)) ?? 0) + 1));
  const known = rs.filter((r) => !r.lantern).length || 1;
  const ordinal = ["", "First", "Second", "Third", "Fourth", "Fifth"];
  const ilAl = total - s.community.lanternResidents;
  const floorRows: Audience[] = [...floors.entries()].sort((a, b) => a[0] - b[0]).map(([f, n]) => {
    const share = n / known;
    return { k: `floor-${f}`, label: `${ordinal[f] ?? `Floor ${f}`} floor`, residents: Math.round(ilAl * share), families: Math.round((fams - s.community.lanternFamilies) * share), group: "floor" };
  });
  const al = Math.round(ilAl * 0.38);
  return {
    slug, name: s.brand.name, short: s.brand.short, phone: s.brand.phone, domain: s.brand.domain,
    audiences: [
      { k: "everyone", label: "Everyone", residents: total, families: fams, group: "all" },
      ...floorRows,
      { k: "care-il", label: "Independent Living", residents: ilAl - al, families: Math.round((fams - s.community.lanternFamilies) * 0.6), group: "care" },
      { k: "care-al", label: "Assisted Living", residents: al, families: Math.round((fams - s.community.lanternFamilies) * 0.4), group: "care" },
      { k: "care-lantern", label: "Lantern", residents: s.community.lanternResidents, families: s.community.lanternFamilies, group: "care" },
    ],
    languages: s.languages,
    rooms: Object.values(c.rooms),
    todayIso: iso(today()),
  };
}

/* ------------------------------------------------------------ photos on an event (Calendar) */

export interface PhotoKit {
  presets: { k: string; src: string; label: string }[];
  /** Photo consent on file, by resident. */
  consent: Record<string, boolean>;
  /** Whether each resident shares their week and photos with family. */
  shares: Record<string, boolean>;
  residentNames: string[];
  approver: { name: string; first: string };
  isApprover: boolean;
  /** The next newsletter's day. */
  newsletter: string;
}

export function photoKit(slug: CommunitySlug, as: StaffRole): PhotoKit {
  const s = getStaffData(slug);
  const t = today();
  const recs = residents(slug);
  const presetNo = new Set(s.photoPresets.flatMap((p) => p.people.filter((x) => !x.consent).map((x) => x.name)));
  const names = [...new Set([...s.residentNames, ...s.lanternNames])].sort();
  const consent: Record<string, boolean> = {};
  const shares: Record<string, boolean> = {};
  for (const n of names) { consent[n] = !presetNo.has(n); shares[n] = true; }
  for (const r of recs) { consent[r.name] = r.photoConsent && !presetNo.has(r.name); shares[r.name] = r.shares; }
  const approver = s.people[s.roles.approver].name;
  const sun = addDays(t, (7 - t.getUTCDay()) % 7 || 7);
  return {
    presets: s.photoPresets.map((p) => ({ k: p.k, src: p.src, label: p.label })),
    consent, shares, residentNames: names,
    approver: { name: approver, first: first(approver) }, isApprover: as === "manager",
    newsletter: dayShort(sun),
  };
}

/** Who came to an event, for suggesting photo tags (attendance, never faces). */
export function cameTo(slug: CommunitySlug, e: { id: string; date: string; lantern?: boolean }, n: number): string[] {
  const s = getStaffData(slug);
  const src = e.lantern ? s.lanternNames : s.residentNames;
  const h = hash(e.id + e.date);
  return [...new Set(Array.from({ length: Math.max(3, n) }, (_, i) => src[(h + i * 7) % src.length]))];
}

/* ------------------------------------------------------------ planning help (Calendar → Plan) */

export interface Template { k: string; title: string; kind: EventKind; cat: Cat; minutes: number; interests: Interest[]; worked: string; cap?: number; repeat?: boolean }
export interface PlanHelp {
  most: { title: string; avg: number; trend: number }[];
  least: { title: string; avg: number; trend: number }[];
  templates: Template[];
  ideas: (IdeaPrefill & { votes: number; status: string })[];
}

export function planHelp(slug: CommunitySlug): PlanHelp {
  const ww = whatWorked(slug);
  const c = communities[slug];
  const t = today();
  const evs = c.staffEventsBetween(addDays(t, -27), 28, iso(t)).flatMap((d) => d.events);
  const tpl = (k: string, title: string, kind: EventKind, cat: Cat, minutes: number, extra: Partial<Template> = {}): Template => {
    const seen = ww.most.find((m) => m.title === title) ?? ww.least.find((m) => m.title === title);
    const avg = seen?.avg ?? 8 + (hash(title + slug) % 12);
    return { k, title, kind, cat, minutes, interests: eventInterests({ title, cat }), worked: extra.worked ?? `Similar events here: ${avg} a session`, ...extra };
  };
  const musicFans = Object.values(engagement(slug)).filter((r) => !r.lantern && r.interests.includes("Music")).length;
  const top = ww.most[0];
  const topEv = top ? evs.find((e) => e.title === top.title) : undefined;
  return {
    most: ww.most.map((m) => ({ title: m.title, avg: m.avg, trend: m.trend })),
    least: ww.least.map((m) => ({ title: m.title, avg: m.avg, trend: m.trend })),
    templates: [
      ...(top && topEv ? [tpl("again", `${top.title}: an extra session`, kindOf(topEv), topEv.cat, (topEv.end ?? topEv.start + 60) - topEv.start, { worked: `Best attended: ${top.avg} a session` })] : []),
      tpl("family", "Family Game Night", "family", "clubs", 90, { worked: "Family events fill in about a week" }),
      tpl("trip", "Bus Trip: Holiday Lights", "resident", "trips", 120, { cap: 14, worked: "Last evening trip: waitlist of 6" }),
      tpl("open", "Open House and Tea", "public", "community", 90, { worked: "Last one: 9 new inquiries" }),
      tpl("music", "Afternoon Concert", "resident", "music", 60, { worked: `Would invite the ${musicFans} residents who like music` }),
    ],
    ideas: suggestions(slug).filter((x) => x.status === "New" || x.status === "Planned").slice(0, 4).map((x) => ({ id: x.id, title: ideaTitle(x.text), text: x.text, who: x.who, votes: x.votes, status: x.status })),
  };
}
