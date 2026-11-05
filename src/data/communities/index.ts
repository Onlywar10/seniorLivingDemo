// Every Wrenhaven community's content, by URL slug. Pages read the current one through
// getCommunity() (Server Components, src/lib/community-server.ts) or useCommunity() (Client Components, src/lib/community.tsx).
import { toPublic, type Award, type CalEvent, type DayMenu, type FaqGroup, type FaqItem, type Living, type LivingKey, type Plan, type Space, type Steward, type Story, type TeamMember, type Testimonial, type Venue } from "@/data/shared";
import * as abSite from "./alder-bend/site";
import * as abCalendar from "./alder-bend/calendar";
import * as abMenus from "./alder-bend/menus";
import * as abInfo from "./alder-bend/info";
import * as abArticles from "./alder-bend/articles";
import * as kpSite from "./kestrel-point/site";
import * as kpCalendar from "./kestrel-point/calendar";
import * as kpMenus from "./kestrel-point/menus";
import * as kpInfo from "./kestrel-point/info";
import * as kpArticles from "./kestrel-point/articles";

import { communitySlugs, isCommunity, type CommunitySlug } from "@/lib/sites";

export { communitySlugs, isCommunity, type CommunitySlug };

type Facts = typeof abSite.site & { opened?: string; apartments?: { independentAssisted: number; lantern: number } };
interface NavItem { label: string; href: string; children?: { label: string; href: string }[] }

export interface Community {
  slug: CommunitySlug;
  // ----- facts and copy (site.ts)
  site: Facts;
  awards: Award[];
  welcome: { intro: string; points: { title: string; text: string }[] };
  living: Record<LivingKey, Living>;
  pricing: Omit<typeof abSite.pricing, "independentRange"> & { independentRange: readonly [number, number] };
  plans: Plan[];
  spaces: Space[];
  team: TeamMember[];
  steward: Steward | null;
  instructors: { name: string; what: string; unnamed?: true }[];
  fitness: { intro: string; highlights: string[] };
  stories: Story[];
  guides: { title: string; pages: number | null; photo: string }[];
  faqs: FaqItem[];
  careers: {
    intro: string;
    benefits: string[];
    steps: { title: string; text: string }[];
    openings: { title: string; dept: string; type: string; pay: string | null }[];
    applyUrl?: string;
    generalInterestUrl?: string;
    quotes?: { quote: string; name: string }[];
  };
  testimonials: Testimonial[];
  nav: NavItem[];
  // ----- calendar.ts
  rooms: Record<string, string>;
  /** The public calendar: no seat counts, waitlists or seat limits, and no place for resident activities (toPublic). */
  eventsOn: (date: Date, todayIso?: string) => CalEvent[];
  eventsBetween: (start: Date, days: number, todayIso?: string) => { date: Date; events: CalEvent[] }[];
  /** Staff screens only: every event in full, with seats, waitlists and departure points. */
  staffEventsOn: (date: Date, todayIso?: string) => CalEvent[];
  staffEventsBetween: (start: Date, days: number, todayIso?: string) => { date: Date; events: CalEvent[] }[];
  // ----- menus.ts
  venues: Record<string, Venue>;
  venueOrder: string[];
  menuFor(venue: string, date: Date): DayMenu;
  allMenus: (date: Date) => DayMenu[];
  // ----- info.ts
  phones: { label: string; number: string; note: string }[];
  emails: { label: string; address: string }[];
  visiting: { label: string; value: string }[];
  directions: { title: string; text: string }[];
  nearby: string[];
  whoToCall: { topic: string; name: string; ext?: string | null }[];
  faqGroups: FaqGroup[];
  guideSummaries: { lede: string; points: string[] }[];
  // ----- articles.ts
  extraStories: Story[];
  articleBodies: Record<string, string[]>;
  publishedStories: (todayIso: string) => Story[];
  findStory: (slug: string) => Story | undefined;
  bodyOf: (s: Story) => string[];
  authorOf: (s: Story) => string;
}

type Calendar = { eventsOn: Community["eventsOn"]; eventsBetween: Community["eventsBetween"] };

/** The public site reads redacted events; the staff system reads them in full. */
const split = (cal: Calendar) => ({
  eventsOn: (d: Date, t?: string) => cal.eventsOn(d, t).map(toPublic),
  eventsBetween: (s: Date, n: number, t?: string) => cal.eventsBetween(s, n, t).map((x) => ({ date: x.date, events: x.events.map(toPublic) })),
  staffEventsOn: cal.eventsOn,
  staffEventsBetween: cal.eventsBetween,
});

const bundle = (slug: CommunitySlug, site: object, calendar: Calendar, menus: object, info: object, articles: object) =>
  ({ slug, ...site, ...calendar, ...split(calendar), ...menus, ...info, ...articles }) as unknown;

export const communities: Record<CommunitySlug, Community> = {
  "alder-bend": bundle("alder-bend", abSite, abCalendar, abMenus, abInfo, abArticles) as Community,
  "kestrel-point": bundle("kestrel-point", kpSite, kpCalendar, kpMenus, kpInfo, kpArticles) as Community,
};

// Compile-time check that each community's modules really have the Community shape (the bundle cast above can't see it).
type Check<T extends Community> = T;
export type _ab = Check<{ slug: CommunitySlug } & ReturnType<typeof split> & typeof abSite & typeof abCalendar & typeof abMenus & typeof abInfo & typeof abArticles>;
export type _kp = Check<{ slug: CommunitySlug } & ReturnType<typeof split> & typeof kpSite & typeof kpCalendar & typeof kpMenus & typeof kpInfo & typeof kpArticles>;

export const getCommunityBySlug = (slug: CommunitySlug) => communities[slug];

/** Published portraits by person, across every community (names are unique). */
const portraits = new Map(Object.values(communities).flatMap((c) => c.team.filter((m) => m.photo).map((m) => [m.name, m.photo!] as const)));
export const portraitOf = (name: string) => portraits.get(name);
