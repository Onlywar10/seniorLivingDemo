// Types and helpers every Wrenhaven community shares. Each community's own content lives in
// src/data/communities/<slug>/ and is gathered in src/data/communities/index.ts.

// ---------------------------------------------------------------- living options and plans

export type LivingKey = "independent" | "assisted" | "lantern";
export type PlanKind = LivingKey;

export interface Living {
  key: LivingKey;
  name: string;
  href: string;
  lede: string;
  from: string;
  photo: string;
  alt: string;
  points: string[];
}

export interface Plan {
  code: string;
  name: string;
  kind: PlanKind;
  beds: 0 | 1 | 2;
  /** null where the community doesn't publish it */
  baths: number | null;
  sqft?: number;
  from?: number;
  available: number; // 0 = waitlist
  waitlist: number;
  features: string[];
  /** Simple room layout used by the plan drawing and the virtual tour map: [room key, x, y, w, h] on a 100×70 grid */
  rooms: [string, number, number, number, number][];
  balcony?: boolean;
  /** The community's own furnished 3D floor plan, where it publishes one */
  render?: string;
}

export const planKindLabel: Record<PlanKind, string> = { independent: "Independent Living", assisted: "Assisted Living", lantern: "Lantern Memory Care" };

export const money = (n: number) => "$" + n.toLocaleString("en-US");

export interface Space { key: string; name: string; kind: string; text: string; hours?: string; photo: string; alt: string; more?: string[] }

// ---------------------------------------------------------------- people and stories

/** `unnamed`: a role with no published name (the role is shown as the name). */
export interface TeamMember { name: string; role: string; dept: string; bio: string; key?: boolean; ext?: string; unnamed?: true; /** Published portrait */ photo?: string }

export interface Steward { title: string; name: string; role: string; month: string; praise: string[]; quotes: string[] }

export interface Story {
  slug: string;
  title: string;
  dek: string;
  date: string;
  photo: string;
  alt: string;
  credit?: string;
  body: string[];
  kind: "Events & Adventures" | "News" | "Dining" | "Wellness" | "Careers";
  author?: string;
  /** The original post, where it was first published elsewhere */
  link?: string;
}

export const newsKinds: Story["kind"][] = ["Events & Adventures", "News", "Dining", "Wellness", "Careers"];

/** "October 30, 2026" */
export function storyDate(isoDate: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${months[m - 1]} ${d}, ${y}`;
}

export interface Testimonial { quote: string; name: string; relation: string; source?: string }
export interface Award { title: string; detail: string; source: string; years?: number }

// ---------------------------------------------------------------- calendar

export type Cat = "fitness" | "faith" | "clubs" | "trips" | "music" | "movies" | "community" | "lantern";

export const cats: Record<Cat, { label: string; color: string }> = {
  fitness: { label: "Fitness", color: "var(--c-fitness)" },
  faith: { label: "Faith", color: "var(--c-faith)" },
  clubs: { label: "Clubs & games", color: "var(--c-clubs)" },
  trips: { label: "Trips & outings", color: "var(--c-trips)" },
  music: { label: "Music & happy hour", color: "var(--c-music)" },
  movies: { label: "Movies & TV", color: "var(--c-movies)" },
  community: { label: "Learning & community", color: "var(--c-community)" },
  lantern: { label: "Lantern", color: "var(--c-lantern)" },
};

/**
 * Activity categories, for staff: what kind of activity it is (Fitness, Creative…), separate from who it's for (all
 * residents, a floor, Lantern). Editable in Settings; used by the event form, the activity sheet and Reports.
 */
export const ACTIVITY_CATEGORIES = ["Fitness", "Social", "Learning", "Faith", "Creative", "Outings", "Music", "Wellness"] as const;
export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];
export function categoryOf(e: { cat: string; title: string }): ActivityCategory {
  const t = e.title.toLowerCase();
  if (/paint|craft|art|knit|wreath|card making|pumpkin|pottery|flower|floral/.test(t)) return "Creative";
  if (/garden|walk|tai chi|meditat|massage|spa|relax|aroma|sensory/.test(t)) return "Wellness";
  if (/sing|music|concert|piano|ukulele|tune|choir|happy hour|guitar|violin|keys/.test(t)) return "Music";
  if (e.cat === "fitness" || /yoga|fit|stretch|balance|dance|exercise|band|bowling|zumba/.test(t)) return "Fitness";
  if (e.cat === "faith" || /hymn|church|mass|bible|rosary|service/.test(t)) return "Faith";
  if (e.cat === "trips" || /bus trip|shopping|outing|tour/.test(t)) return "Outings";
  if (e.cat === "community" || /talk|lecture|travelogue|book|class|history|news|town hall|tech|learn/.test(t)) return "Learning";
  return "Social";
}

/** Public filters, in display order. */
export const filters: Cat[] = ["fitness", "faith", "clubs", "trips", "music", "lantern"];

/**
 * Who an event is for, which decides what the public website shows and how people sign up:
 * - public: open to anyone (an open house). Full details and a public sign-up form; each sign-up is a sales lead.
 * - family: for families already on the community's list (a family barbecue). The website says it's happening;
 *   families RSVP by replying to their weekly text; the resident says yes first, then staff approve.
 * - resident: a resident activity or outing (the default). The website shows name, day, time and description only;
 *   residents sign up with the activities team, families ask for a seat by replying to a text.
 */
export type EventKind = "public" | "family" | "resident";
export const eventKindLabel: Record<EventKind, string> = { public: "Public event", family: "Family event", resident: "Resident activity" };

export interface CalEvent {
  id: string;
  /** Defaults to "resident". */
  kind?: EventKind;
  date: string; // yyyy-mm-dd
  start: number; // minutes since midnight
  end?: number;
  title: string;
  room: string;
  cat: Cat;
  desc?: string;
  cap?: number;
  /** Seats already taken (capped events only) */
  taken?: number;
  waitlist?: number;
  lantern?: boolean; // shown in the Lantern view
  leader?: string;
  special?: boolean; // a dated, one-off event (as opposed to the weekly program)
  cost?: string;
}

export const isLantern = (e: CalEvent) => e.lantern || e.cat === "lantern";
/** Staff screens only: the public site never shows seat counts (see toPublic). */
export const seatsLeft = (e: CalEvent) => (e.cap ? Math.max(0, e.cap - (e.taken ?? 0)) : undefined);
export const kindOf = (e: CalEvent): EventKind => e.kind ?? "resident";

/**
 * What the public website may know about an event. Seat counts, waitlists and seat limits never leave the staff system,
 * and resident activities lose their place too, so no pickup point or departure time ("the bus leaves the Lobby") is public.
 * Public and family events keep their place: an open house has to say where to come.
 */
export function toPublic(e: CalEvent): CalEvent {
  const rest: CalEvent = { ...e };
  delete rest.cap;
  delete rest.taken;
  delete rest.waitlist;
  return kindOf(e) === "resident" ? { ...rest, room: "" } : rest;
}

// ---------------------------------------------------------------- dining

export type Tag = "GF" | "VG" | "DF";
export const tagLabels: Record<Tag, string> = { GF: "Gluten free", VG: "Vegetarian", DF: "Dairy free" };

export interface Dish { name: string; desc?: string; tags?: Tag[]; price?: string }
export interface Section { title: string; items: Dish[]; note?: string }
/** Each community names its own restaurants ("juniper", "millpond", "meadowbrook"…). */
export type VenueKey = string;
export interface Venue { key: VenueKey; name: string; kind: string; hours: string; open: number; close: number; photo: string; blurb: string }
export interface DayMenu { date: string; venue: VenueKey; special: Dish; soup: Dish; sections: Section[]; holiday?: string }

/**
 * How a kitchen plans a restaurant's menus (staff Menus). The culinary director picks one per restaurant:
 * - cycle: planned menus that repeat on a rotation (usually four weeks) and change by season;
 * - standing: one always-available menu that rarely changes;
 * - daily: named slots filled every day (pour of the day, pastry, soup…).
 * Any restaurant can add daily specials on top (`slots`). Every dish comes from what the kitchen gave; nothing is made up.
 */
export type MenuTemplate = "cycle" | "standing" | "daily";
/** A dish in a cycle, with the simpler wording used on the Lantern (memory care) menu. */
export interface CycleDish extends Dish { plain: string; finger?: boolean }
export interface MenuCycle {
  season: string;
  nextSeason: string;
  /** The Sunday that starts week 1 of the rotation (ISO). */
  anchor: string;
  weeks: number;
  /** When this season's cycle started and ends, and when the next one is due from the kitchen (ISO). */
  starts: string;
  ends: string;
  nextDue: string;
  /** Only what rotates, [week][day], Sunday first. Everything else is on the standing menu. */
  specials: CycleDish[][];
  soups: CycleDish[][];
  periods: string[];
}
/** A meal a restaurant serves (breakfast, lunch, dinner, happy hour…) and its usual service times, minutes from midnight. */
export interface MealPeriod { key: string; label: string; start: number; end: number }
/** The courses a professional cycle menu plans for each meal. Breakfast uses the first three; dinner uses them all. */
export type CourseKey = "entree" | "alternate" | "starch" | "vegetable" | "soup" | "dessert";
export const courseLabels: Record<CourseKey, string> = { entree: "Entrée", alternate: "Alternate", starch: "Starch", vegetable: "Vegetable", soup: "Soup", dessert: "Dessert" };
/** One meal on one day of a cycle: its courses, and its own service times when that day differs from the usual. */
export interface CycleMeal { period: string; courses: Partial<Record<CourseKey, CycleDish>>; start?: number; end?: number }
export interface DailySlot { key: string; label: string; period: string }
export interface VenuePlan {
  template: MenuTemplate;
  /** The always-available menu, by meal period or course. Shown once, not every day. */
  standing: Section[];
  /** When the standing menu last changed (ISO). */
  standingChanged: string;
  cycle?: MenuCycle;
  /** Daily items: the whole menu for "daily", or specials on top of the template. */
  slots?: DailySlot[];
  /** How the daily items reach Kinlight. */
  via?: "photo" | "text" | "form";
  /** Tags printed on the kitchen's menu that an ingredient contradicts: held back for the chef, never published. */
  holds?: { dish: string; tags: Tag[]; why: string[]; /** A tag that could stand, if the chef confirms it. */ maybe?: { tag: Tag; if: string }[] }[];
  /** Lantern (memory care) version of this restaurant's menu: finger foods served every day. */
  lantern?: { finger: string[] };
}
export type MenuPlan = Record<VenueKey, VenuePlan>;

/** Which week of its rotation a cycle is on for a date: 0 for week 1. */
export function cycleWeek(cycle: MenuCycle, date: Date): number {
  const anchor = Date.parse(cycle.anchor + "T00:00:00Z");
  const sunday = date.getTime() - date.getUTCDay() * 86400000;
  const n = Math.floor(Math.round((sunday - anchor) / 86400000) / 7);
  return ((n % cycle.weeks) + cycle.weeks) % cycle.weeks;
}

// ---------------------------------------------------------------- contact and FAQs

export interface FaqItem { q: string; a: string }
export interface FaqGroup { title: string; items: FaqItem[] }

export const telHref = (n: string) => "tel:+1" + n.replace(/\D/g, "");
