// The weekly newsletter: built and written by Kinlight every Thursday from this week's events and photos, next week's
// events, family events to RSVP to and next week's menus, using only those facts. One issue, three versions (family,
// resident, public), the midweek highlight, and how last week's issue did. Built from one community's calendar, menus,
// photos and records, so Alder Bend and Kestrel Point each get their own. Server Components only.
import { communities, type CommunitySlug } from "@/data/communities";
import { isLantern, kindOf, tagLabels, type CalEvent, type Cat, type EventKind, type Tag } from "@/data/shared";
import { addDays, dayName, dayShort, dow, fmtTime, fromIso, hash, iso, nowMinutes, shortDate, today } from "@/lib/clock";
import { attendance, sampleFamily } from "./alpha";
import { thankYous } from "./engage";
import { getStaffData } from "./index";
import { residents, type ResidentRecord } from "./portal";
import { rsvpFor } from "./shared";

const first = (n = "") => n.split(" ")[0];
const clean = (t: string) => t.replace(/^Bus Trip: /, "").replace(/^Dinner Trip: /, "Dinner at ").replace(/^Lunch Trip: /, "Lunch at ");
const spell = (tags?: Tag[]) => (tags ?? []).map((t) => tagLabels[t].toLowerCase()).join(", ");
const listOf = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

/* ------------------------------------------------------------ types */

export type StoryKind = "photos" | "family" | "coming" | "menu" | "brief";
export interface StoryItem { title: string; when: string; kind: EventKind; place?: string }
export interface Story {
  id: string;
  kind: StoryKind;
  title: string;
  /** What Kinlight wrote, from the facts in `source` only. */
  text: string;
  photo?: string;
  /** Other photos from the same event, to swap to. */
  photos: string[];
  /** Where every fact came from: "From 12 photos at …", "From the calendar: …". */
  source: string;
  items?: StoryItem[];
  /** In the public version (prospects and community-news subscribers). */
  public: boolean;
  /** What the public version does with this story, if not the same. */
  publicNote?: string;
  /** A person already changed it: their text, and when. The original stays in `text`. */
  changed?: { by: string; text: string; when: string };
}

export interface Personal { photos: { src: string; title: string; when: string }[]; outings: { title: string; when: string }[]; waitlist: { title: string; when: string }[] }

export interface Reader {
  id: string;
  kind: "family" | "resident" | "public";
  /** "Tom Whitaker" */
  name: string;
  /** "Dorothy’s son", "Resident", "Prospect" */
  label: string;
  to: string;
  resident?: string;
  /** Whether the resident shares their week with family (family readers). */
  shares?: boolean;
  personal?: Personal;
  /** A note for staff about this version. */
  note?: string;
}

export interface Album { id: string; event: string; date: string; day: string; photos: number; came: number; src: string; srcs: string[]; tags: string[]; by: string; caption?: string; desc?: string; blocked: boolean }

export interface Issue {
  community: string;
  hello: string;
  domain: string;
  from: string;
  subject: string;
  weekLabel: string;
  approver: string;
  approverFirst: string;
  timeline: { built: string; card: string; sends: string; sendsShort: string; afterLabel: string; stage: "building" | "ready" };
  stories: Story[];
  readers: Reader[];
  /** Facts used, for the "Kinlight used only these" line. */
  used: { events: number; photos: number; next: number; family: number; menus: string };
  /** Photos left out automatically (no consent on file). */
  leftOut: number;
  highlight: { sends: string; reach: number; picks: { id: string; title: string; src: string; text: string; source: string }[] };
  last: {
    sent: string;
    subject: string;
    reached: number;
    families: number;
    opened: number;
    openRate: number;
    versions: { k: string; n: number }[];
    top: { title: string; opens: number; src: string }[];
    replies: { from: string; relation: string; text: string; did: string }[];
    repliesTotal: number;
  };
}

/* ------------------------------------------------------------ photos from events */

const PICS: [RegExp, string[]][] = [
  [/marshmallow|camp stor/i, ["/img/marshmallows.jpg", "/img/fire-table.jpg"]],
  [/pumpkin/i, ["/img/pumpkins.jpg", "/img/courtyard-palms.jpg"]],
  [/veteran/i, ["/img/flag.jpg", "/img/theatre.jpg"]],
  [/wine|cellar|vineyard/i, ["/img/wine-toast.jpg", "/img/vineyard.jpg"]],
  [/chef|cook|baking|fish fry/i, ["/img/chef-kitchen.jpg", "/img/dish-plated.jpg"]],
  [/dinner|lunch|grill|brunch|kettle/i, ["/img/courtyard-dining.jpg", "/img/juniper-people.jpg"]],
  [/museum|air & space|mine/i, ["/img/mine-tour.jpg", "/img/amazon-trip.jpg"]],
  [/craft|art|paint|ceramic/i, ["/img/art-studio.jpg", "/img/puzzle.jpg"]],
  [/speaker|series|talk|lecture|town hall/i, ["/img/theatre.jpg", "/img/club-room.jpg"]],
  [/donut|muffin|coffee/i, ["/img/latte.jpg", "/img/cookies.jpg"]],
  [/violin|guitar|trio|music|sing|piano|concert|jazz|band/i, ["/img/perch-dance.jpg", "/img/drum-circle.jpg"]],
  [/auction|bucks|bingo|game|trivia/i, ["/img/friends-laugh.jpg", "/img/pool-hall.jpg"]],
  [/muertos/i, ["/img/perch-chat.jpg", "/img/friends-laugh.jpg"]],
  [/garden|flower/i, ["/img/gardening.jpg", "/img/couple-flowers.jpg"]],
];
const byCat: Record<Cat, string[]> = {
  fitness: ["/img/gym.jpg", "/img/namaste.jpg"], faith: ["/img/hands.jpg"], clubs: ["/img/puzzle.jpg", "/img/friends-laugh.jpg"],
  trips: ["/img/trail-walk.jpg", "/img/friends-walking.jpg"], music: ["/img/perch-dance.jpg", "/img/drum-circle.jpg"], movies: ["/img/theatre.jpg"],
  community: ["/img/friends-laugh.jpg", "/img/lifestyle.jpg"], lantern: ["/img/lantern-garden.jpg"],
};
const picsFor = (e: CalEvent) => PICS.find(([re]) => re.test(e.title))?.[1] ?? byCat[e.cat];

/** The photo albums staff added this week, one per event, with the residents Kinlight tagged from attendance. */
function albums(slug: CommunitySlug, from: Date, days: number, upTo: Date): Album[] {
  const c = communities[slug];
  const s = getStaffData(slug);
  const t = today();
  const now = nowMinutes();
  const consent = new Map(residents(slug).map((r) => [r.name, r.photoConsent]));
  const att = new Map(attendance(slug).rows.map((r) => [r.event.id, r]));
  const evs = c
    .staffEventsBetween(from, days, iso(t))
    .flatMap((d) => d.events)
    .filter((e) => e.special && !isLantern(e) && e.cat !== "faith" && e.cat !== "movies" && !/meeting|town hall/i.test(e.title))
    .filter((e) => e.date < iso(upTo) || (e.date === iso(upTo) && (e.end ?? e.start + 60) <= now));
  return evs.map((e) => {
    const h = hash(e.id);
    const preset = s.photoPresets.find((p) => new RegExp(p.k.slice(0, 6), "i").test(e.title));
    const a = att.get(e.id);
    const came = a?.came ?? (e.cap ? e.taken ?? e.cap : 8 + (h % 14));
    const names = a?.names ?? [];
    const tags = preset ? preset.people.filter((p) => p.consent).map((p) => p.name) : names.filter((n) => consent.get(n)).slice(0, 3 + (h % 3));
    // A photo with anyone in it who has no photo consent on file never goes out; Kinlight uses the event's other photos.
    const blocked = !!preset && preset.people.some((p) => !p.consent);
    const srcs = preset && !blocked ? [preset.src, ...picsFor(e).filter((x) => x !== preset.src)] : picsFor(e).filter((x) => x !== preset?.src);
    return {
      id: e.id, event: e.title, date: e.date, day: dayName(fromIso(e.date)), photos: 6 + (h % 11), came, src: srcs[0], srcs, tags,
      by: s.people[s.roles.calendar].name, caption: preset?.caption, blocked, desc: e.desc && !/^new!?$/i.test(e.desc) ? e.desc : undefined,
    };
  }).sort((a, b) => Number(!!b.caption) - Number(!!a.caption) || b.photos - a.photos);
}

/* ------------------------------------------------------------ the issue */

export function newsletter(slug: CommunitySlug): Issue {
  const c = communities[slug];
  const s = getStaffData(slug);
  const t = today();
  const now = nowMinutes();
  // It sends on Sunday at 5 pm. Kinlight builds it on the Thursday before; the approver's card comes on Friday.
  const sunday = addDays(t, (7 - dow(t)) % 7 || (now < 17 * 60 ? 0 : 7));
  const weekStart = addDays(sunday, -7);
  const thursday = addDays(sunday, -3);
  const friday = addDays(sunday, -2);
  const nextStart = addDays(sunday, 1);
  const chef = s.people[s.roles.menus].name;
  const editor = s.people[s.roles.calendar].name;
  const approver = s.people[s.roles.approver].name;

  const week = albums(slug, weekStart, 7, t);
  const thisWeek = c.staffEventsBetween(weekStart, 7, iso(t)).flatMap((d) => d.events).filter((e) => e.date <= iso(t));
  const pub = c.eventsBetween(nextStart, 7, iso(t)).flatMap((d) => d.events);
  const nextSpecial = pub.filter((e) => e.special && !isLantern(e) && e.cat !== "faith" && e.cat !== "movies");
  const familyEvents = c.eventsBetween(nextStart, 21, iso(t)).flatMap((d) => d.events).filter((e) => kindOf(e) === "family");
  const range = (a: Date, n: number) => `${shortDate(a)}–${shortDate(addDays(a, n - 1))}`;
  const when = (e: CalEvent) => `${dayShort(fromIso(e.date))}, ${fmtTime(e.start)}`;

  const stories: Story[] = [];
  const photoStory = (a: Album, i: number): Story => {
    const title = clean(a.event);
    const text = a.caption
      ? `${a.caption} ${a.photos} photos are in the gallery.`
      : `On ${a.day}, ${a.came} residents came to ${title}.${a.desc ? ` ${a.desc}` : ""} ${a.photos} photos are in the gallery.`;
    return {
      id: `photos-${i}`, kind: "photos", title, text, photo: a.src, photos: a.srcs, public: true,
      source: `From ${a.photos} photos at ${a.event}, ${dayShort(fromIso(a.date))} · ${a.came} checked in`,
      publicNote: "Same story; residents are never named and only photos with consent on file are used.",
    };
  };
  if (week[0]) stories.push(photoStory(week[0], 0));

  if (familyEvents.length) {
    const fe = familyEvents.slice(0, 3);
    stories.push({
      id: "family", kind: "family", title: fe.length === 1 ? `Families welcome: ${clean(fe[0].title)}` : "Family events to RSVP to",
      text: `${fe.length === 1 ? `Families are welcome at ${clean(fe[0].title)} on ${dayShort(fromIso(fe[0].date))} at ${fmtTime(fe[0].start)}.` : `Families are welcome at ${listOf(fe.map((e) => clean(e.title)))}.`} RSVP from your personal link or reply to our text with how many are coming. We check with your resident first, then confirm.`,
      photo: "/img/grandkid-parade.jpg", photos: ["/img/grandkid-parade.jpg", "/img/mother-daughter.jpg", "/img/grandkid-nature.jpg"],
      items: fe.map((e) => ({ title: e.title, when: when(e), kind: "family", place: e.room })),
      source: `From the calendar: ${fe.length} family ${fe.length === 1 ? "event" : "events"} in the next three weeks`, public: false,
      publicNote: "Left out of the public version: family events are for verified families.",
    });
  }
  if (week[1]) stories.push(photoStory(week[1], 1));

  if (nextSpecial.length) {
    const items = nextSpecial.slice(0, 6);
    stories.push({
      id: "coming", kind: "coming", title: "Coming up next week",
      text: `Next week brings ${nextSpecial.length} special ${nextSpecial.length === 1 ? "event" : "events"}, starting with ${clean(items[0].title)} on ${dayName(fromIso(items[0].date))}. The full calendar is on our website.`,
      items: items.map((e) => ({ title: e.title, when: when(e), kind: kindOf(e), place: kindOf(e) === "resident" ? undefined : e.room })),
      photos: [], source: `From the calendar: next week, ${range(nextStart, 7)}`, public: true,
      publicNote: "Public version lists the same events without family-only ones. No seats, waitlists or pickup points, ever.",
    });
  }

  // Menu highlights from the main restaurant, and any holiday meal coming up.
  const v0 = c.venueOrder[0];
  const venue = c.venues[v0];
  const picks = [0, 3, 5].map((i) => c.menuFor(v0, addDays(nextStart, i)));
  let holiday: { name: string; when: string; note?: string } | undefined;
  for (let i = 0; i < 21 && !holiday; i++) {
    const m = c.menuFor(v0, addDays(nextStart, i));
    if (m.holiday) holiday = { name: m.special.name, when: dayShort(addDays(nextStart, i)), note: m.sections[0]?.title.split(" · ")[1] };
  }
  stories.push({
    id: "menu", kind: "menu", title: `From the kitchen: ${venue.name}`,
    text: `${listOf(picks.map((m) => `${m.special.name}${m.special.tags?.length ? ` (${spell(m.special.tags)})` : ""} on ${dayName(fromIso(m.date))}`))}.${holiday ? ` And ${holiday.name} is on ${holiday.when}${holiday.note ? `, ${holiday.note}` : ""}.` : ""} Every day’s menu is on our website.`,
    photo: venue.photo, photos: [venue.photo, "/img/dish-plated.jpg", "/img/chef-kitchen.jpg"],
    source: `From next week’s menus, ${range(nextStart, 7)}${holiday ? ", and the holiday menu" : ""} (${first(chef)} checks them before they publish)`, public: true,
  });

  // The rest of this week, in a line, from the calendar.
  const used = new Set(week.slice(0, 2).map((a) => a.event));
  const rest = thisWeek.filter((e) => e.special && !isLantern(e) && kindOf(e) !== "family" && !used.has(e.title) && e.cat !== "faith");
  if (rest.length) {
    const items = rest.slice(0, 5);
    stories.push({
      id: "brief", kind: "brief", title: "Also this week",
      text: `${listOf(items.map((e) => clean(e.title)))}${rest.length > items.length ? `, and ${rest.length - items.length} more` : ""}.`,
      items: items.map((e) => ({ title: e.title, when: dayShort(fromIso(e.date)), kind: kindOf(e) })),
      photos: [], source: `From the calendar: ${thisWeek.filter((e) => e.special).length} special events, ${range(weekStart, 7)}`, public: true,
    });
  }

  // One person already changed the lead story on Friday; Kinlight's version stays alongside it.
  if (stories[0]?.kind === "photos")
    stories[0].changed = { by: editor, text: `${stories[0].text} Thank you to everyone who came out.`, when: `${dayShort(friday)}, 9:14 am` };

  /* ---------------- readers: the three versions */
  const recs = residents(slug).filter((r) => !r.lantern);
  const nextCapped = c.staffEventsBetween(nextStart, 7, iso(t)).flatMap((d) => d.events).filter((e) => e.cap && !isLantern(e));
  const personalFor = (name: string): Personal => ({
    photos: week.filter((a) => a.tags.includes(name)).slice(0, 3).map((a) => ({ src: a.src, title: clean(a.event), when: a.day })),
    outings: nextCapped.filter((e) => rsvpFor(s, e.id, e.taken ?? 0, e.waitlist ?? 0).going.includes(name)).map((e) => ({ title: clean(e.title), when: when(e) })),
    waitlist: nextCapped.filter((e) => rsvpFor(s, e.id, e.taken ?? 0, e.waitlist ?? 0).waiting.includes(name)).map((e) => ({ title: clean(e.title), when: when(e) })),
  });
  const score = (r: ResidentRecord) => { const p = personalFor(r.name); return p.photos.length * 2 + p.outings.length + p.waitlist.length; };
  const joined = (r: ResidentRecord) => r.family.find((f) => f.status === "Joined" && f.channel !== "Text" && f.lang === "English");
  const sample = sampleFamily(slug);
  const r0 = recs.find((r) => r.name === sample.resident);
  const famRes = r0 && r0.shares && joined(r0) && score(r0) > 0 ? r0 : recs.filter((r) => r.shares && joined(r)).sort((a, b) => score(b) - score(a))[0] ?? r0 ?? recs[0];
  const fam = joined(famRes) ?? famRes.family[0];
  const rel = (relation: string) => relation.toLowerCase();
  const readers: Reader[] = [
    { id: "family", kind: "family", name: fam.name, label: `${first(famRes.name)}’s ${rel(fam.relation)}`, to: fam.email || fam.name, resident: famRes.name, shares: true, personal: personalFor(famRes.name) },
  ];
  const resRes = /email/i.test(famRes.channel) ? famRes : recs.find((r) => /email/i.test(r.channel) && score(r) > 0) ?? famRes;
  readers.push({
    id: "resident", kind: "resident", name: resRes.name, label: "Resident", to: `${first(resRes.name).toLowerCase()}@email`, resident: resRes.name, personal: personalFor(resRes.name),
    note: /email/i.test(resRes.channel) ? undefined : `${first(resRes.name)}’s messages are set to “${resRes.channel}”. This is the email residents who chose email get.`,
  });
  const quiet = recs.find((r) => !r.shares && r.family.some((f) => f.status === "Joined"));
  if (quiet) {
    const f = quiet.family.find((x) => x.status === "Joined")!;
    readers.push({
      id: "noshare", kind: "family", name: f.name, label: `${first(quiet.name)}’s ${rel(f.relation)}`, to: f.email || f.name, resident: quiet.name, shares: false,
      note: `${quiet.name} has chosen not to share their week with family, so ${first(f.name)} gets the community news without a personal section. ${first(quiet.name)} can change this at any time; staff record it in People.`,
    });
  }
  const prospect = s.enquiries[0];
  readers.push({ id: "public", kind: "public", name: prospect?.name ?? "A subscriber", label: `Prospect at ${s.brand.name}`, to: "Community news", note: "Prospects and community-news subscribers: public events, the menu and life at the community. Nothing personal." });

  /* ---------------- the midweek highlight */
  const nextWed = addDays(sunday, 3);
  const hlPicks = week.slice(0, 4).map((a) => ({
    id: a.id, title: clean(a.event), src: a.src,
    text: `${s.brand.hello} ${a.came} residents came to ${clean(a.event)} on ${a.day}. ${a.photos} photos are up, and there’s more in Sunday’s newsletter. 📷`,
    source: `From ${a.photos} photos at ${a.event}`,
  }));

  /* ---------------- last week's issue */
  const lastWeek = albums(slug, addDays(weekStart, -7), 7, t);
  const lastSunday = weekStart;
  const reached = s.weekKpis.familiesReached;
  const opened = Math.round((reached * s.weekKpis.openRate) / 100);
  const ty = thankYous(slug);
  const h = hash(slug);
  const leftOut = week.filter((a) => a.blocked).length;

  return {
    community: s.brand.name, hello: s.brand.hello, domain: s.brand.domain, from: `${s.brand.name} Community News`,
    subject: `The week at ${s.brand.name}${stories[0] ? `: ${stories[0].title}` : ""}`,
    weekLabel: range(weekStart, 7), approver, approverFirst: first(approver),
    timeline: {
      built: `${dayShort(thursday)}`, card: `${dayShort(friday)}`, sends: `${dayShort(sunday)}, 5:00 pm`, sendsShort: iso(sunday) === iso(t) ? "today at 5 pm" : iso(sunday) === iso(addDays(t, 1)) ? "tomorrow at 5 pm" : `${dayName(sunday)} at 5 pm`,
      afterLabel: `${dayShort(addDays(sunday, 1))}`, stage: t < thursday ? "building" : "ready",
    },
    stories, readers,
    used: { events: thisWeek.length, photos: week.reduce((n, a) => n + a.photos, 0), next: pub.length, family: familyEvents.length, menus: `${c.venueOrder.length} restaurants` },
    leftOut,
    highlight: { sends: `${dayShort(nextWed)}, 10:00 am`, reach: s.community.smsReachable, picks: hlPicks },
    last: {
      sent: `${dayShort(lastSunday)}, 5:00 pm`,
      subject: `The week at ${s.brand.name}${lastWeek[0] ? `: ${clean(lastWeek[0].event)}` : ""}`,
      reached, families: s.community.families, opened, openRate: s.weekKpis.openRate,
      versions: [{ k: "Family", n: reached }, { k: "Resident", n: Math.round(s.community.residents * 0.31) }, { k: "Public", n: 60 + (h % 70) }],
      top: lastWeek.slice(0, 3).map((a, i) => ({ title: clean(a.event), opens: Math.round(opened * (0.74 - i * 0.17)), src: a.src })),
      replies: ty.slice(0, 3).map((x) => ({ from: x.from, relation: x.relation, text: x.text, did: `Passed to ${x.staffName}` })),
      repliesTotal: 6 + (h % 7),
    },
  };
}
