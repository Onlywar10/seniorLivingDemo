// Post: where new information enters Kinlight. What each of the five forms needs from one community's data (a new
// event, a month imported from paper, an announcement, photos from an event, a resource), plus the planning help
// beside them (ideas and templates, most and least attended). Server Components only (it reads every community).
import { communities, type CommunitySlug } from "@/data/communities";
import { isLantern, kindOf, type Cat, type EventKind } from "@/data/shared";
import { addDays, dayShort, fmtTime, fromIso, hash, iso, monthName, nowMinutes, today } from "@/lib/clock";
import { suggestions } from "./alpha";
import { INTERESTS, engagement, eventInterests, todayActivities, whatWorked, type Interest } from "./engage";
import { getStaffData } from "./index";
import { residents } from "./portal";
import type { StaffRole } from "./shared";

const first = (n = "") => n.split(" ")[0];

/* ------------------------------------------------------------ a new event (Post, and Calendar's "+ Add") */

export interface Busy { date: string; start: number; end: number; room: string; title: string }
export interface Invitee { name: string; interests: Interest[] }
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
}

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
  return {
    brand: { name: s.brand.name, short: s.brand.short, domain: s.brand.domain, phone: s.brand.phone },
    rooms, shared, busy, invitees, interests: [...INTERESTS], todayIso: iso(t),
    approver: { name: approver, first: first(approver) }, isApprover: as === "manager", families: s.community.families,
  };
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

/* ------------------------------------------------------------ importing a month from the paper calendar */

export interface ImportFlag {
  id: string;
  kind: "time" | "room" | "duplicate" | "date" | "seats" | "title";
  title: string;
  /** What Kinlight read, and why it's unsure. */
  read: string;
  why: string;
  /** Choices to fix it, the first being Kinlight's best guess. */
  options: string[];
}
export interface ImportSetup { month: string; file: string; read: number; repeating: number; oneOffs: number; days: number; flags: ImportFlag[]; sample: { day: string; time: string; title: string; room: string; repeat?: string }[] }

export function importSetup(slug: CommunitySlug): ImportSetup {
  const c = communities[slug];
  const t = today();
  const m1 = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 1));
  const days = new Date(Date.UTC(m1.getUTCFullYear(), m1.getUTCMonth() + 1, 0)).getUTCDate();
  const evs = c.staffEventsBetween(m1, days, iso(t)).flatMap((d) => d.events);
  const pick = (test: (e: (typeof evs)[number]) => boolean, n = 0) => evs.filter(test)[n] ?? evs[n];
  const rooms = Object.values(c.rooms);
  const day = (e: { date: string }) => dayShort(fromIso(e.date));
  const yoga = pick((e) => /yoga|fit|stretch|balance/i.test(e.title));
  const club = pick((e) => /bridge|bingo|club|game/i.test(e.title));
  const trip = pick((e) => !!e.cap);
  const music = pick((e) => e.cat === "music");
  const special = pick((e) => !!e.special, 1);
  const craft = pick((e) => /paint|craft|art|knit/i.test(e.title)) ?? evs[5];
  const month = monthName(m1);
  const flags: ImportFlag[] = [
    { id: "f1", kind: "time", title: yoga.title, read: `${day(yoga)}, ${fmtTime(yoga.start)}`, why: "The time is smudged: it could be 10:00 or 10:30.", options: [fmtTime(yoga.start), fmtTime(yoga.start + 30)] },
    { id: "f2", kind: "room", title: club.title, read: `${day(club)}, ${fmtTime(club.start)}`, why: "The room is hard to read.", options: [club.room, ...rooms.filter((r) => r !== club.room).slice(0, 3)] },
    { id: "f3", kind: "duplicate", title: music.title, read: `${day(music)}, ${fmtTime(music.start)}`, why: "It appears twice on this day, at the same time.", options: ["Keep one", "Keep both (two different events)"] },
    { id: "f4", kind: "date", title: special.title, read: `${day(special)}, ${fmtTime(special.start)}`, why: `Written between two days: the ${fromIso(special.date).getUTCDate()}th or the ${fromIso(special.date).getUTCDate() + 1}th?`, options: [day(special), dayShort(addDays(fromIso(special.date), 1))] },
    { id: "f5", kind: "seats", title: trip.title, read: `${day(trip)}, ${fmtTime(trip.start)}`, why: "It says “sign up” but no number of seats.", options: [String(trip.cap ?? 12), "No limit"] },
    { id: "f6", kind: "title", title: craft.title, read: `${day(craft)}, ${fmtTime(craft.start)}`, why: `Not in last month’s calendar. Kinlight read “${craft.title.replace(/s$/, "")}”: is that right?`, options: [craft.title, `${craft.title} (one-off)`] },
  ];
  const sample = evs.filter((e) => e.date === evs[0].date).slice(0, 6).map((e) => ({ day: day(e), time: fmtTime(e.start), title: e.title, room: e.room, repeat: e.special ? undefined : "Weekly" }));
  return { month, file: `${month} calendar.jpg`, read: 312, repeating: 41, oneOffs: 312 - 41 * 4 - 11, days, flags, sample };
}

/* ------------------------------------------------------------ announcements */

export interface Audience { k: string; label: string; residents: number; families: number; group: "all" | "floor" | "care" | "families" | "residents" }
export interface AnnounceSetup {
  slug: CommunitySlug;
  name: string; short: string; phone: string; domain: string;
  audiences: Audience[];
  languages: { k: string; n: number }[];
  todayIso: string;
}

export function announceSetup(slug: CommunitySlug): AnnounceSetup {
  const s = getStaffData(slug);
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
      { k: "care-lantern", label: "Lantern (memory care)", residents: s.community.lanternResidents, families: s.community.lanternFamilies, group: "care" },
      { k: "families", label: "Families only", residents: 0, families: fams, group: "families" },
      { k: "residents", label: "Residents only", residents: total, families: 0, group: "residents" },
    ],
    languages: s.languages,
    todayIso: iso(today()),
  };
}

/* ------------------------------------------------------------ photos, always from an event */

export interface PhotoEvent { id: string; title: string; when: string; place: string; ended: string; came: string[]; lantern: boolean; today: boolean; suggested?: boolean }
export interface PhotoSetup {
  events: PhotoEvent[];
  /** Why the first event is suggested. */
  because: string;
  presets: { k: string; src: string; label: string }[];
  /** Photo consent on file, by resident. */
  consent: Record<string, boolean>;
  /** Whether each resident shares their week and photos with family. */
  shares: Record<string, boolean>;
  residentNames: string[];
  approver: { name: string; first: string };
  isApprover: boolean;
  brand: { name: string; short: string; domain: string };
  newsletter: string;
}

export function photoSetup(slug: CommunitySlug, as: StaffRole, eventId?: string): PhotoSetup {
  const s = getStaffData(slug);
  const c = communities[slug];
  const t = today();
  const now = nowMinutes();
  const acts = todayActivities(slug);
  const recs = residents(slug);
  const presetNo = new Set(s.photoPresets.flatMap((p) => p.people.filter((x) => !x.consent).map((x) => x.name)));
  const names = [...new Set([...s.residentNames, ...s.lanternNames])].sort();
  const consent: Record<string, boolean> = {};
  const shares: Record<string, boolean> = {};
  for (const n of names) { consent[n] = !presetNo.has(n); shares[n] = true; }
  for (const r of recs) { consent[r.name] = r.photoConsent && !presetNo.has(r.name); shares[r.name] = r.shares; }

  // Today's activities that have ended or are on now, most recent first; then the last few days.
  const todays: PhotoEvent[] = acts.filter((a) => a.state !== "later").sort((a, b) => b.end - a.end).map((a) => ({
    id: a.id, title: a.title, when: `Today, ${a.time}`, place: a.place, ended: a.state === "now" ? "on now" : `ended ${fmtTime(a.end)}`,
    came: a.came, lantern: a.lantern, today: true,
  }));
  const pool = s.residentNames;
  const earlier: PhotoEvent[] = c.staffEventsBetween(addDays(t, -5), 5, iso(t)).flatMap((d) => d.events)
    .filter((e) => e.cat !== "movies" && e.cat !== "faith")
    .reverse()
    .filter((e, i, a) => a.findIndex((x) => x.title === e.title) === i)
    .slice(0, 8)
    .map((e) => {
      const h = hash(e.id + e.date);
      const lantern = isLantern(e);
      const src = lantern ? s.lanternNames : pool;
      const n = 6 + (h % 9);
      return { id: e.id, title: e.title, when: `${dayShort(fromIso(e.date))}, ${fmtTime(e.start)}`, place: e.room, ended: `ended ${fmtTime(e.end ?? e.start + 60)}`, came: [...new Set(Array.from({ length: n }, (_, i) => src[(h + i * 7) % src.length]))], lantern, today: false };
    });
  const events = [...todays, ...earlier];
  const want = eventId ? events.find((e) => e.id === eventId) : undefined;
  const sug = want ?? todays.find((e) => acts.find((a) => a.id === e.id)?.justEnded) ?? todays[0] ?? earlier[0];
  if (sug) sug.suggested = true;
  const ordered = sug ? [sug, ...events.filter((e) => e !== sug)] : events;
  const takenAt = fmtTime(Math.max(0, Math.min(now, 23 * 60 + 50) - 7));
  const because = !sug ? "" : want ? `Chosen from Today: ${sug.title}.` : sug.today ? `The photos were taken at ${takenAt}, just after ${sug.title} ${sug.ended.replace("ended", "ended at")}.` : `The photos were taken ${sug.when.split(",")[0]}, during ${sug.title}.`;
  const approver = s.people[s.roles.approver].name;
  const sun = addDays(t, (7 - t.getUTCDay()) % 7 || 7);
  return {
    events: ordered, because,
    presets: s.photoPresets.map((p) => ({ k: p.k, src: p.src, label: p.label })),
    consent, shares, residentNames: names,
    approver: { name: approver, first: first(approver) }, isApprover: as === "manager",
    brand: { name: s.brand.name, short: s.brand.short, domain: s.brand.domain },
    newsletter: dayShort(sun),
  };
}

/* ------------------------------------------------------------ resources */

export interface ResourceSetup {
  kinds: { k: string; label: string; title: string; body: string; review: string; owner: string; path: string }[];
  owners: { key: string; name: string; role: string }[];
  /** Resources already published, with their review dates. */
  existing: { title: string; owner: string; due: string; stale: boolean }[];
  domain: string;
  todayIso: string;
}

export function resourceSetup(slug: CommunitySlug): ResourceSetup {
  const s = getStaffData(slug);
  const c = communities[slug];
  const t = today();
  const P = (k: string) => s.people[k]?.name ?? k;
  const desk = s.roles.desk, appr = s.roles.approver, cal = s.roles.calendar;
  const visiting = c.visiting.map((v) => `${v.label}: ${v.value}`).join("\n");
  return {
    kinds: [
      { k: "visiting", label: "Visiting hours", title: "Visiting hours", body: visiting, review: "6", owner: desk, path: "visiting-hours" },
      { k: "transport", label: "Transport schedule", title: "Transport schedule", body: "", review: "3", owner: cal, path: "transport" },
      { k: "policy", label: "A policy", title: "Guest meal policy", body: "", review: "12", owner: appr, path: "guest-meals" },
      { k: "welcome", label: "The welcome pack", title: "Welcome pack for new residents", body: "", review: "12", owner: appr, path: "welcome" },
    ],
    owners: [desk, cal, appr, s.roles.menus, s.roles.lantern].filter((k, i, a) => a.indexOf(k) === i).map((k) => ({ key: k, name: P(k), role: s.people[k].role })),
    existing: [
      { title: "Visiting hours", owner: P(desk), due: dayShort(addDays(t, 41)), stale: false },
      { title: "Transport schedule", owner: P(cal), due: dayShort(addDays(t, 3)), stale: true },
      { title: "Welcome pack", owner: P(appr), due: dayShort(addDays(t, 160)), stale: false },
    ],
    domain: s.brand.domain,
    todayIso: iso(t),
  };
}

/* ------------------------------------------------------------ planning help beside the forms */

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
    return { k, title, kind, cat, minutes, interests: eventInterests({ title, cat }), worked: extra.worked ?? `Similar events here averaged ${avg} people`, ...extra };
  };
  const musicFans = Object.values(engagement(slug)).filter((r) => r.interests.includes("Music")).length;
  const top = ww.most[0];
  const topEv = top ? evs.find((e) => e.title === top.title) : undefined;
  return {
    most: ww.most.map((m) => ({ title: m.title, avg: m.avg, trend: m.trend })),
    least: ww.least.map((m) => ({ title: m.title, avg: m.avg, trend: m.trend })),
    templates: [
      ...(top && topEv ? [tpl("again", `${top.title}: an extra session`, kindOf(topEv), topEv.cat, (topEv.end ?? topEv.start + 60) - topEv.start, { worked: `Your best attended: ${top.avg} a session this month` })] : []),
      tpl("family", "Family Game Night", "family", "clubs", 90, { worked: "Family events here fill in about a week" }),
      tpl("trip", "Bus Trip: Holiday Lights", "resident", "trips", 120, { cap: 14, worked: "Evening outings fill first: last one had a waitlist of 6" }),
      tpl("open", "Open House and Tea", "public", "community", 90, { worked: "Last open house brought 9 new inquiries" }),
      tpl("music", "Afternoon Concert", "resident", "music", 60, { worked: `${musicFans} residents chose music as an interest` }),
    ],
    ideas: suggestions(slug).filter((x) => x.status === "New" || x.status === "Planned").slice(0, 4).map((x) => ({ id: x.id, title: ideaTitle(x.text), text: x.text, who: x.who, votes: x.votes, status: x.status })),
  };
}
