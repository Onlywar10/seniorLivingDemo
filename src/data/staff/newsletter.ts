// The weekly newsletter: built and written by Kinlight every Thursday from this week's events and photos, next week's
// events, family events to RSVP to and next week's menus, using only those facts. One issue, three versions (family,
// resident, public), and how last week's issue did. Built from one community's calendar, menus,
// photos and records, so Alder Bend and Kestrel Point each get their own. Server Components only.
import { communities, type CommunitySlug } from "@/data/communities";
import { cycleWeek, isLantern, kindOf, tagLabels, type CalEvent, type Cat, type EventKind, type Tag } from "@/data/shared";
import { addDays, dayName, dayShort, dow, fmtTime, fromIso, hash, iso, monthName, nowMinutes, shortDate, today } from "@/lib/clock";
import { attendance, sampleFamily } from "./alpha";
import { celebrations, thankYous, welcomes } from "./engage";
import { getStaffData } from "./index";
import { residents, type ResidentRecord } from "./portal";
import { residentProfile } from "./resident";
import { rsvpFor } from "./shared";
import { weekNumbers } from "./week";

const first = (n = "") => n.split(" ")[0];
const clean = (t: string) => t.replace(/^Bus Trip: /, "").replace(/^Dinner Trip: /, "Dinner at ").replace(/^Lunch Trip: /, "Lunch at ");
const spell = (tags?: Tag[]) => (tags ?? []).map((t) => tagLabels[t].toLowerCase()).join(", ");
const listOf = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

/* ------------------------------------------------------------ types */

export type StoryKind = "note" | "photos" | "celebrate" | "family" | "coming" | "menu" | "wellness" | "team" | "brief" | "teaser";
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
  /** Who signs it, under the text: "Renata Holloway, Executive Director". */
  sign?: string;
  /** A person already changed it: their text, and when. The original stays in `text`. */
  changed?: { by: string; text: string; when: string };
}

/** One resident's week for their family's email: photos they're in and activities they came to this week (from their
 * page in People), and what they're booked on next week. */
export interface Personal {
  photos: { src: string; title: string; when: string }[];
  came: { title: string; when: string }[];
  outings: { title: string; when: string }[];
  waitlist: { title: string; when: string }[];
  /** Invites they said yes to for next week. */
  saidYes: { title: string; when: string }[];
}

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

export interface Album {
  id: string; event: string; date: string; day: string; photos: number; came: number; src: string; srcs: string[]; tags: string[]; by: string;
  /** The title and caption staff gave the photos, if any. */
  title?: string; caption?: string; desc?: string; blocked: boolean;
  room: string; start: number; leader?: string; full: boolean;
}

/** An event staff can add to the issue as its own section. Kinlight drafts the section from the event's facts only
 * (what, when, where, who led it, its description): no resident names, no head counts. */
export interface Addable {
  id: string;
  title: string;
  /** "Tue, Nov 10 · 2:00 pm" */
  when: string;
  place: string;
  /** This week (already happened) or next week (coming up). */
  week: "this" | "next";
  /** Family events are for families and residents only. */
  family: boolean;
  story: Story;
}

export interface Issue {
  community: string;
  /** This week's and next week's events not already in the issue, ready to become a section. */
  addable: Addable[];
  /** The masthead: "The Alder Bend Weekly". */
  masthead: string;
  /** Street address, phone and website for the footer. */
  contact: { address: string; phone: string; web: string; facebook?: string };
  /** Who to call, for the footer: published team roles with extensions. */
  directory: { role: string; name: string; ext?: string }[];
  hello: string;
  domain: string;
  from: string;
  subject: string;
  weekLabel: string;
  approver: string;
  approverFirst: string;
  /** "building": Sunday evening to Wednesday, the draft so far (it builds on Thursday). "ready": built, on or before today. */
  timeline: { built: string; card: string; sends: string; sendsShort: string; afterLabel: string; stage: "building" | "ready" };
  stories: Story[];
  readers: Reader[];
  /** Facts used, for the "Kinlight used only these" line: this week so far (activities that have happened, photos per
   * event as staff added them). */
  used: { activities: number; photos: number; photoEvents: number; stories: number; next: number; family: number; menus: string };
  /** Photos left out automatically (no consent on file). */
  leftOut: number;
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
  [/craft|art|paint|ceramic/i, ["/img/art-studio.jpg", "/img/puzzle.jpg"]],
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
      by: s.people[s.roles.calendar].name, title: preset?.title, caption: preset?.caption, blocked, desc: e.desc && !/^new!?$/i.test(e.desc) ? e.desc : undefined,
      room: e.room, start: e.start, leader: e.leader, full: !!e.cap && came >= e.cap,
    };
    // The week's best moment first: photos staff captioned, then the most residents, then the most photos.
  }).sort((a, b) => Number(!!b.caption) - Number(!!a.caption) || b.came - a.came || b.photos - a.photos);
}

/** The events staff added photos to, and how many photos each, made to add up to the week's numbers once the week has
 * that many events with photos. Before then (early in the week) each event keeps its own count: one event never carries
 * the whole week's photos. */
function fitTo(list: Album[], events: number, photos: number): Album[] {
  if (list.length < events) return list;
  const top = list.slice(0, events);
  const sum = top.reduce((n, a) => n + a.photos, 0);
  if (!top.length || !sum) return top;
  let left = photos;
  return top.map((a, i) => {
    const n = i === top.length - 1 ? Math.max(1, left) : Math.max(1, Math.round((a.photos * photos) / sum));
    left -= n;
    return { ...a, photos: n };
  });
}

/* ------------------------------------------------------------ the regular columns */

// What senior living weeklies carry besides the week's news: a note from the executive director, celebrations,
// a wellness corner, a team spotlight and something just for fun. Never a resident's name, never a head count:
// the email goes to every family, and the public version to anyone who subscribes.
const SEASON: string[] = [
  "A new year is a good time to try one new thing, and the calendar has plenty to choose from.",
  "February brings Valentine’s Day, and a reminder of how much our friendships here mean to us.",
  "Spring is close: the Courtyard planters are getting ready, and so are our gardeners.",
  "April showers mean more time indoors, and more time for music, games and good company.",
  "May is Older Americans Month, and we are celebrating the stories and wisdom all around us.",
  "Summer is here: early walks, shady afternoons in the Courtyard and plenty of iced tea.",
  "July brings long evenings, outdoor music and the Fourth with friends and family.",
  "August is our last stretch of summer, and the calendar is full of reasons to get out and about.",
  "September is National Healthy Aging Month, a good time to try a class you’ve been curious about.",
  "Autumn has arrived, with harvest flavors in the kitchen and cooler days for outings.",
  "November is a month of gratitude, from honoring our veterans to gathering around the table for Thanksgiving.",
  "December is full of lights, music and visits from family. We are grateful to share the season with you.",
];
const WELLNESS: { title: string; text: string }[] = [
  { title: "Stay steady on your feet", text: "Shorter days and cooler mornings make good footing more important. Wear shoes with a firm grip, turn on a light before you get up at night, and try a Better Balance class: it builds the strength that prevents falls." },
  { title: "Drink before you’re thirsty", text: "We feel thirst less as we age, especially in cool weather. Keep a glass of water where you can see it, and remember that soup, fruit and herbal tea count too." },
  { title: "Move a little, often", text: "Ten minutes of walking after a meal helps digestion and keeps joints loose. A lap of the hallways counts, and a friend makes it go faster." },
  { title: "Keep your mind busy", text: "Puzzles, trivia, a new language or a book club all keep the mind sharp. Learning something new with other people is best of all." },
  { title: "Sleep well", text: "Daylight in the morning, a short walk in the afternoon and a regular bedtime help with a good night’s sleep. Save naps for early afternoon, and keep them short." },
  { title: "Stay connected", text: "Time with friends is as good for us as exercise. Say yes to an invitation this week, or bring a neighbor along to something new." },
  { title: "Look after your hands", text: "Gentle stretches and squeezing a soft ball keep fingers nimble for cards, crafts and buttons. Ask the fitness team for a few simple exercises." },
  { title: "Eat the colors", text: "A plate with three colors on it usually has the vitamins you need. Our chefs mark the season’s vegetables on the menu each day." },
];
const TEASERS: { q: string; a: string }[] = [
  { q: "What has keys but can’t open a single lock?", a: "A piano." },
  { q: "Which U.S. state is the only one with a one-syllable name?", a: "Maine." },
  { q: "What gets wetter the more it dries?", a: "A towel." },
  { q: "In what year did the first person walk on the moon?", a: "1969." },
  { q: "What has a neck but no head?", a: "A bottle." },
  { q: "Which is the only planet that spins clockwise?", a: "Venus." },
  { q: "What can you catch but not throw?", a: "A cold." },
  { q: "Who sang “Blue Suede Shoes” first, Elvis Presley or Carl Perkins?", a: "Carl Perkins, in 1955." },
];

/* ------------------------------------------------------------ the issue */

export function newsletter(slug: CommunitySlug): Issue {
  const c = communities[slug];
  const s = getStaffData(slug);
  const t = today();
  const now = nowMinutes();
  // It sends on Sunday at 5 pm. Kinlight builds it on the Thursday before; the approver's card comes on Friday.
  // "This week" is Sunday to Saturday, and so is "next week": the same weeks as Menus, Calendar and Reports.
  const sunday = addDays(t, (7 - dow(t)) % 7 || (now < 17 * 60 ? 0 : 7));
  const weekStart = addDays(sunday, -7);
  const thursday = addDays(sunday, -3);
  const friday = addDays(sunday, -2);
  const nextStart = sunday;
  const chef = s.people[s.roles.menus].name;
  const editor = s.people[s.roles.calendar].name;
  const approver = s.people[s.roles.approver].name;
  const done = (e: CalEvent) => e.date < iso(t) || (e.date === iso(t) && (e.end ?? e.start + 60) <= now);

  const wk = weekNumbers(slug);
  const week = fitTo(albums(slug, weekStart, 7, t), wk.photoEvents, wk.photos);
  const thisWeek = c.staffEventsBetween(weekStart, 7, iso(t)).flatMap((d) => d.events).filter(done);
  const pub = c.eventsBetween(nextStart, 7, iso(t)).flatMap((d) => d.events);
  const nextSpecial = pub.filter((e) => e.special && !isLantern(e) && e.cat !== "faith" && e.cat !== "movies");
  const familyEvents = c.eventsBetween(nextStart, 21, iso(t)).flatMap((d) => d.events).filter((e) => kindOf(e) === "family");
  const range = (a: Date, n: number) => {
    const b = addDays(a, n - 1);
    return a.getUTCMonth() === b.getUTCMonth() ? `${shortDate(a)}–${b.getUTCDate()}` : `${shortDate(a)}–${shortDate(b)}`;
  };
  const when = (e: CalEvent) => `${dayShort(fromIso(e.date))}, ${fmtTime(e.start)}`;
  const partOfDay = (min: number) => (min < 12 * 60 ? "morning" : min < 17 * 60 ? "afternoon" : "evening");
  const inRoom = (r: string) => (/floor/i.test(r) ? "" : /^the /i.test(r) ? ` in ${r}` : ` in the ${r}`);

  const stories: Story[] = [];
  // Written only from what staff entered: the caption they gave the photos, who came (attendance), where and when (the
  // calendar), who led it and the event's description. Nothing else.
  const photoStory = (a: Album, i: number): Story => {
    // No head counts and no names: what happened, where, when, and who led it.
    const facts = [
      a.caption ?? `${clean(a.event)} brought residents together on ${a.day} ${partOfDay(a.start)}${inRoom(a.room)}.`,
      !a.caption && a.full ? "Every seat was taken." : "",
      !a.caption && a.leader ? `Thank you to ${a.leader} for leading it.` : "",
      !a.caption && a.desc ? a.desc : "",
      "More photos are in the gallery on our website.",
    ];
    return {
      id: `photos-${i}`, kind: "photos", title: a.title ?? clean(a.event), text: facts.filter(Boolean).join(" "), photo: a.src, photos: a.srcs, public: true,
      source: `From ${a.photos} photos at ${a.event}, ${dayShort(fromIso(a.date))}${a.caption ? `, with ${first(a.by)}’s caption` : ""} · ${a.came} checked in`,
      publicNote: "Same story in every version: no resident is ever named or counted, and only photos where everyone has consent on file are used.",
    };
  };
  const ed = c.team.find((m) => /executive director/i.test(m.role));
  const lead0 = pub.find((e) => e.special && !isLantern(e) && e.cat !== "faith" && e.cat !== "movies");
  stories.push({
    id: "note", kind: "note", title: `A note from ${ed ? first(ed.name) : "our director"}`,
    text: `${s.brand.hello} ${SEASON[nextStart.getUTCMonth()]}${lead0 ? ` Next week starts with ${clean(lead0.title)} on ${dayName(fromIso(lead0.date))}, and I hope to see you there.` : ""} As always, my door is open: stop by, or reply to this email.`,
    sign: ed ? `${ed.name}, ${ed.role}` : undefined,
    photos: [], public: true,
    source: `From the season and next week’s calendar${ed ? `, written in ${first(ed.name)}’s name, for ${first(ed.name)} to approve` : ""}`,
  });
  if (week[0]) stories.push(photoStory(week[0], 0));

  // Celebrations: never a name or a number. Birthdays are celebrated together at the month's party; new neighbors are
  // welcomed in general, and each family hears about their own resident directly.
  const parties = c.eventsBetween(nextStart, 14, iso(t)).flatMap((d) => d.events).filter((e) => /birthday/i.test(e.title));
  const hasBirthdays = celebrations(slug).some((x) => x.kind === "birthday");
  const hasWelcomes = welcomes(slug).length > 0;
  if (parties.length || hasBirthdays || hasWelcomes) {
    const p0 = parties[0];
    stories.push({
      id: "celebrate", kind: "celebrate", title: "Celebrations",
      text: [
        hasBirthdays || p0 ? `Happy birthday to everyone celebrating in ${monthName(nextStart)}!${p0 ? ` We’ll raise a glass together at ${clean(p0.title)} on ${dayName(fromIso(p0.date))} at ${fmtTime(p0.start)}.` : ""}` : "",
        hasWelcomes ? `We have new neighbors this month. If you see a new face at lunch, please say hello and save them a seat.` : "",
      ].filter(Boolean).join(" "),
      photo: "/img/friends-laugh.jpg", photos: ["/img/friends-laugh.jpg", "/img/cookies.jpg", "/img/perch-chat.jpg"], public: true,
      source: `From the calendar${hasBirthdays ? ", this month’s birthdays" : ""}${hasWelcomes ? " and this month’s move-ins" : ""}. No names: each resident chooses how they’re celebrated.`,
      publicNote: "Same in every version. Birthdays and move-ins are never listed by name or number.",
    });
  }

  if (familyEvents.length) {
    const fe = familyEvents.slice(0, 3);
    stories.push({
      id: "family", kind: "family", title: fe.length === 1 ? `Families welcome: ${clean(fe[0].title)}` : "Family events to RSVP to",
      text: `${fe.length === 1 ? `Families are welcome at ${clean(fe[0].title)} on ${dayShort(fromIso(fe[0].date))} at ${fmtTime(fe[0].start)}.` : `Families are welcome at ${listOf(fe.map((e) => clean(e.title)))}.`} Reply to our text with how many are coming. We check with your resident first, then confirm.`,
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
      text: `Mark your calendar: next week starts with ${clean(items[0].title)} on ${dayName(fromIso(items[0].date))}. Here are some highlights; the full calendar is on our website.`,
      items: items.map((e) => ({ title: e.title, when: when(e), kind: kindOf(e), place: kindOf(e) === "resident" ? undefined : e.room })),
      photos: [], source: `From the calendar: next week, ${range(nextStart, 7)}`, public: true,
      publicNote: "Public version leaves out family events and resident meetings. No seats, waitlists, head counts or pickup points, ever.",
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
  // Which week of the kitchen's cycle menu next week is (Menus → templates), for the source line.
  const cyc = c.menuPlan?.[v0]?.cycle;
  const cycleNote = cyc && cyc.weeks > 1 ? `, week ${cycleWeek(cyc, nextStart) + 1} of the ${cyc.season} cycle` : "";
  stories.push({
    id: "menu", kind: "menu", title: `From the kitchen: ${venue.name}`,
    text: `${listOf(picks.map((m) => `${m.special.name}${m.special.tags?.length ? ` (${spell(m.special.tags)})` : ""} on ${dayName(fromIso(m.date))}`))}.${holiday ? ` And ${holiday.name} is on ${holiday.when}${holiday.note ? `, ${holiday.note}` : ""}.` : ""} Every day’s menu is on our website.`,
    photo: venue.photo, photos: [venue.photo, "/img/dish-plated.jpg", "/img/chef-kitchen.jpg"],
    source: `From next week’s menus, ${range(nextStart, 7)}${cycleNote}${holiday ? ", and the holiday menu" : ""} (${first(chef)} checks them before they publish)`, public: true,
  });

  // Wellness corner, from the fitness director, with next week's balance or fitness class.
  const wkNo = Math.floor(nextStart.getTime() / (7 * 86400000));
  const tip = WELLNESS[wkNo % WELLNESS.length];
  const fit = c.team.find((m) => /fitness director/i.test(m.role));
  const cls = pub.find((e) => e.cat === "fitness" && /balance|chair|yoga|stretch|walk/i.test(e.title)) ?? pub.find((e) => e.cat === "fitness");
  stories.push({
    id: "wellness", kind: "wellness", title: `Wellness corner: ${tip.title.toLowerCase()}`,
    text: `${tip.text}${cls ? ` Try ${clean(cls.title)} on ${dayName(fromIso(cls.date))} at ${fmtTime(cls.start)}.` : ""}`,
    sign: fit ? `${fit.name}, ${fit.role}` : undefined,
    photo: "/img/gym.jpg", photos: ["/img/gym.jpg", "/img/namaste.jpg", "/img/trail-walk.jpg"], public: true,
    source: `From the wellness library${fit ? `, checked by ${first(fit.name)}` : ""}, and next week’s fitness classes`,
  });

  // Team spotlight: a different member of the team each week, from their published bio on the website.
  const crew = c.team.filter((m) => !m.unnamed && !/council|executive director/i.test(m.role) && m.bio);
  const star = crew[wkNo % crew.length];
  if (star) stories.push({
    id: "team", kind: "team", title: `Team spotlight: ${star.name}`,
    text: `Meet ${first(star.name)}, our ${star.role}. ${star.bio} Next time you see ${first(star.name)}, say thank you!`,
    photo: star.photo, photos: star.photo ? [star.photo] : [], public: true,
    source: `From ${first(star.name)}’s bio on the team page of our website`,
  });

  // The rest of this week so far, in a line, from the calendar, and the other events with photos.
  const used = new Set(week.slice(0, 2).map((a) => a.event));
  const rest = thisWeek.filter((e) => e.special && !isLantern(e) && kindOf(e) !== "family" && !used.has(e.title) && e.cat !== "faith");
  const morePhotos = week.slice(2);
  if (rest.length || morePhotos.length) {
    const items = rest.slice(0, 5);
    const text = [
      items.length ? `${listOf(items.map((e) => clean(e.title)))}${rest.length > items.length ? ", and more" : ""}.` : "",
      morePhotos.length ? `Photos are in the gallery from ${listOf(morePhotos.map((a) => clean(a.event)))}.` : "",
    ];
    stories.push({
      id: "brief", kind: "brief", title: "Also this week",
      text: text.filter(Boolean).join(" "),
      items: items.map((e) => ({ title: e.title, when: dayShort(fromIso(e.date)), kind: kindOf(e) })),
      photos: [], source: `From this week’s calendar and photos, ${range(weekStart, 7)}`, public: true,
    });
  }

  const tz = TEASERS[wkNo % TEASERS.length];
  const tzLast = TEASERS[(wkNo + TEASERS.length - 1) % TEASERS.length];
  stories.push({
    id: "teaser", kind: "teaser", title: "Just for fun",
    text: `This week’s brain teaser: ${tz.q} The answer is in next week’s issue. Last week’s answer: ${tzLast.a}`,
    photos: [], public: true, source: "From the brain teaser library: a new one every week",
  });

  // Once it's ready to review (Friday), one person has already changed the lead story; Kinlight's version stays
  // alongside it. Never dated after now.
  const changedAt = 9 * 60 + 14;
  const lead1 = stories.find((x) => x.kind === "photos");
  if (lead1 && (t > friday || (iso(t) === iso(friday) && now >= changedAt)))
    lead1.changed = { by: editor, text: `${lead1.text} Thank you to everyone who came out.`, when: iso(t) === iso(friday) ? `today, ${fmtTime(changedAt)}` : `${dayShort(friday)}, ${fmtTime(changedAt)}` };

  /* ---------------- readers: the three versions */
  const recs = residents(slug).filter((r) => !r.lantern);
  const nextCapped = c.staffEventsBetween(nextStart, 7, iso(t)).flatMap((d) => d.events).filter((e) => e.cap && !isLantern(e));
  const bookings = (name: string) => ({
    outings: nextCapped.filter((e) => rsvpFor(s, e.id, e.taken ?? 0, e.waitlist ?? 0).going.includes(name)).map((e) => ({ title: clean(e.title), when: when(e) })),
    waitlist: nextCapped.filter((e) => rsvpFor(s, e.id, e.taken ?? 0, e.waitlist ?? 0).waiting.includes(name)).map((e) => ({ title: clean(e.title), when: when(e) })),
  });
  const tagged = (name: string) => week.filter((a) => a.tags.includes(name)).map((a) => ({ src: a.src, title: clean(a.event), when: a.day }));
  // Their week, from their page in People: the activities they came to and the photos they're in (with consent), this
  // week only (Sunday to today).
  const personalFor = (name: string): Personal => {
    const prof = residentProfile(slug, name);
    const items = (prof?.timeline ?? []).filter((x) => x.date >= iso(weekStart) && x.date <= iso(t));
    const photos = [...tagged(name)];
    for (const x of items)
      if (x.kind === "photo" && x.photo && !/^Held/.test(x.detail ?? "")) {
        const title = clean(x.title.replace(/^In a photo from /, ""));
        if (!photos.some((p) => p.title === title)) photos.push({ src: x.photo, title, when: dayName(fromIso(x.date)) });
      }
    const came = items
      .filter((x) => x.kind === "came")
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((x) => ({ title: clean(x.title.replace(/^Came to /, "")), when: dayName(fromIso(x.date)) }));
    const saidYes = (prof?.upcoming ?? [])
      .filter((x) => x.kind === "invite" && x.title.startsWith("Said yes to ") && x.date >= iso(nextStart) && x.date < iso(addDays(nextStart, 7)))
      .map((x) => ({ title: clean(x.title.replace(/^Said yes to /, "")), when: x.when }));
    return { photos: photos.slice(0, 3), came, ...bookings(name), saidYes };
  };
  const score = (r: ResidentRecord) => { const b = bookings(r.name); return tagged(r.name).length * 2 + b.outings.length + b.waitlist.length; };
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

  /* ---------------- events staff can add as their own section */
  const inIssue = new Set(stories.flatMap((x) => [x.title, ...(x.items ?? []).map((i) => i.title)]).map((x) => clean(x)));
  // The week's one-off events (topped up with regular activities if there are few), with rooms from the staff calendar.
  const nextAll = c.staffEventsBetween(nextStart, 7, iso(t)).flatMap((d) => d.events);
  const pool = [...thisWeek.map((e) => ({ e, week: "this" as const })), ...nextAll.map((e) => ({ e, week: "next" as const }))]
    .filter(({ e }) => !isLantern(e) && e.cat !== "movies" && e.cat !== "faith" && !/council|meeting|town hall/i.test(e.title) && !inIssue.has(clean(e.title)))
    .filter(({ e }, i, xs) => xs.findIndex((x) => x.e.title === e.title) === i);
  const specials = pool.filter(({ e }) => e.special);
  const toAdd = (specials.length >= 12 ? specials : [...specials, ...pool.filter(({ e }) => !e.special).slice(0, 12 - specials.length)])
    .slice(0, 24)
    .sort((a, b) => (a.e.date + String(a.e.start).padStart(4, "0")).localeCompare(b.e.date + String(b.e.start).padStart(4, "0")));
  const addable: Addable[] = toAdd.map(({ e, week: wk2 }) => {
    const fam = kindOf(e) === "family";
    const d = fromIso(e.date);
    const name = clean(e.title);
    const desc = e.desc && !/^new!?$/i.test(e.desc) ? e.desc : "";
    const where = inRoom(e.room);
    const text = wk2 === "this"
      ? [`${name} brought residents together on ${dayName(d)} ${partOfDay(e.start)}${where}.`, e.leader ? `Thank you to ${e.leader} for leading it.` : "", desc, "More photos are in the gallery on our website."]
      : fam
        ? [`Families are welcome at ${name} on ${dayName(d)}, ${shortDate(d)} at ${fmtTime(e.start)}${where}.`, desc, e.leader ? `${e.leader} is hosting.` : "", "Reply to our text with how many are coming. We check with your resident first, then confirm."]
        : [`Join us for ${name} on ${dayName(d)}, ${shortDate(d)} at ${fmtTime(e.start)}${where}.`, desc, e.leader ? `${e.leader} is leading it.` : "", e.cost ? `The cost is ${e.cost}.` : "", "Everyone is welcome: just come along, or ask at the front desk."];
    const ph = picsFor(e);
    return {
      id: e.id, title: e.title, when: `${dayShort(d)} · ${fmtTime(e.start)}`, place: e.room, week: wk2, family: fam,
      story: {
        id: `add-${e.id}`, kind: wk2 === "this" ? "photos" : fam ? "family" : "coming",
        title: wk2 === "this" ? name : fam ? `Families welcome: ${name}` : `Coming up: ${name}`,
        text: text.filter(Boolean).join(" "), photo: ph[0], photos: ph, public: !fam,
        source: `From the calendar: ${e.title}, ${dayShort(d)}, ${fmtTime(e.start)}${e.leader ? `, led by ${e.leader}` : ""}${desc ? ", and its description" : ""}`,
        publicNote: fam ? "Left out of the public version: family events are for verified families." : "Same in every version: no resident is named or counted.",
        items: wk2 === "next" ? [{ title: e.title, when: when(e), kind: kindOf(e), place: e.room }] : undefined,
      },
    };
  });

  /* ---------------- last week's issue */
  const lastWeek = albums(slug, addDays(weekStart, -7), 7, t);
  const lastSunday = weekStart;
  const reached = s.weekKpis.familiesReached;
  const opened = Math.round((reached * s.weekKpis.openRate) / 100);
  const ty = thankYous(slug);
  const h = hash(slug);
  const leftOut = week.filter((a) => a.blocked).length;
  const ready = t >= thursday;
  const lead = lead1?.title;
  const lastLead = lastWeek[0] ? lastWeek[0].title ?? clean(lastWeek[0].event) : undefined;

  return {
    community: s.brand.name, hello: s.brand.hello, domain: s.brand.domain, from: `${s.brand.name} Community News`,
    subject: lead ? `The ${s.brand.name} Weekly: ${lead}, and more` : `The ${s.brand.name} Weekly`,
    masthead: `The ${s.brand.name} Weekly`,
    contact: { address: `${c.site.address.street}, ${c.site.address.city}, ${c.site.address.state} ${c.site.address.zip}`, phone: s.brand.phone, web: s.brand.domain, facebook: (s.brand as { facebook?: string }).facebook },
    directory: c.team.filter((m) => m.key && !m.unnamed).map((m) => ({ role: m.role, name: m.name, ext: m.ext })),
    weekLabel: range(weekStart, 7), approver, approverFirst: first(approver),
    timeline: {
      // Done things carry a date on or before today; things still to come are named by day.
      built: !ready ? "Thursday" : iso(t) === iso(thursday) ? "today" : dayShort(thursday),
      card: !ready ? "Friday" : dayShort(friday),
      sends: `${dayShort(sunday)}, 5:00 pm`,
      sendsShort: iso(sunday) === iso(t) ? "today at 5 pm" : iso(sunday) === iso(addDays(t, 1)) ? "tomorrow at 5 pm" : `${dayName(sunday)} at 5 pm`,
      afterLabel: `${dayShort(addDays(sunday, 1))}`, stage: ready ? "ready" : "building",
    },
    stories, readers, addable,
    used: {
      activities: thisWeek.filter((e) => e.cat !== "faith" && e.cat !== "movies").length, photos: week.reduce((n, a) => n + a.photos, 0), photoEvents: week.length,
      stories: stories.length, next: pub.length, family: familyEvents.length, menus: `${c.venueOrder.length} restaurants`,
    },
    leftOut,
    last: {
      sent: `${dayShort(lastSunday)}, 5:00 pm`,
      subject: lastLead ? `The ${s.brand.name} Weekly: ${lastLead}, and more` : `The ${s.brand.name} Weekly`,
      reached, families: s.community.families, opened, openRate: s.weekKpis.openRate,
      versions: [{ k: "Family", n: reached }, { k: "Resident", n: Math.round(s.community.residents * 0.31) }, { k: "Public", n: 60 + (h % 70) }],
      top: lastWeek.slice(0, 3).map((a, i) => ({ title: clean(a.event), opens: Math.round(opened * (0.74 - i * 0.17)), src: a.src })),
      replies: ty.slice(0, 3).map((x) => ({ from: x.from, relation: x.relation, text: x.text, did: `Passed to ${x.staffName}` })),
      repliesTotal: 6 + (h % 7),
    },
  };
}
