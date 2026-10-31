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

/** Public filters, in display order. */
export const filters: Cat[] = ["fitness", "faith", "clubs", "trips", "music", "lantern"];

export interface CalEvent {
  id: string;
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
export const seatsLeft = (e: CalEvent) => (e.cap ? Math.max(0, e.cap - (e.taken ?? 0)) : undefined);

// ---------------------------------------------------------------- dining

export type Tag = "GF" | "VG" | "DF";
export const tagLabels: Record<Tag, string> = { GF: "Gluten free", VG: "Vegetarian", DF: "Dairy free" };

export interface Dish { name: string; desc?: string; tags?: Tag[]; price?: string }
export interface Section { title: string; items: Dish[]; note?: string }
/** Each community names its own restaurants ("juniper", "millpond", "meadowbrook"…). */
export type VenueKey = string;
export interface Venue { key: VenueKey; name: string; kind: string; hours: string; open: number; close: number; photo: string; blurb: string }
export interface DayMenu { date: string; venue: VenueKey; special: Dish; soup: Dish; sections: Section[]; holiday?: string }

// ---------------------------------------------------------------- contact and FAQs

export interface FaqItem { q: string; a: string }
export interface FaqGroup { title: string; items: FaqItem[] }

export const telHref = (n: string) => "tel:+1" + n.replace(/\D/g, "");
