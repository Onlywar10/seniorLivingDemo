// Every Tenfold community's content, by URL slug. Pages read the current one through
// getCommunity() (Server Components, src/lib/community-server.ts) or useCommunity() (Client Components, src/lib/community.tsx).
import type { Award, CalEvent, DayMenu, FaqGroup, FaqItem, Living, LivingKey, Plan, Space, Steward, Story, TeamMember, Testimonial, Venue } from "@/data/shared";
import * as pclSite from "./prairie-city-landing/site";
import * as pclCalendar from "./prairie-city-landing/calendar";
import * as pclMenus from "./prairie-city-landing/menus";
import * as pclInfo from "./prairie-city-landing/info";
import * as pclArticles from "./prairie-city-landing/articles";
import * as bpSite from "./bruceville-point/site";
import * as bpCalendar from "./bruceville-point/calendar";
import * as bpMenus from "./bruceville-point/menus";
import * as bpInfo from "./bruceville-point/info";
import * as bpArticles from "./bruceville-point/articles";

import { communitySlugs, isCommunity, type CommunitySlug } from "@/lib/sites";

export { communitySlugs, isCommunity, type CommunitySlug };

type Facts = typeof pclSite.site & { opened?: string; apartments?: { independentAssisted: number; harbor: number } };
interface NavItem { label: string; href: string; children?: { label: string; href: string }[] }

export interface Community {
  slug: CommunitySlug;
  // ----- facts and copy (site.ts)
  site: Facts;
  awards: Award[];
  welcome: { intro: string; points: { title: string; text: string }[] };
  living: Record<LivingKey, Living>;
  pricing: Omit<typeof pclSite.pricing, "independentRange"> & { independentRange: readonly [number, number] };
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
  eventsOn: (date: Date, todayIso?: string) => CalEvent[];
  eventsBetween: (start: Date, days: number, todayIso?: string) => { date: Date; events: CalEvent[] }[];
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

const bundle = (slug: CommunitySlug, site: object, calendar: object, menus: object, info: object, articles: object) =>
  ({ slug, ...site, ...calendar, ...menus, ...info, ...articles }) as unknown;

export const communities: Record<CommunitySlug, Community> = {
  "prairie-city-landing": bundle("prairie-city-landing", pclSite, pclCalendar, pclMenus, pclInfo, pclArticles) as Community,
  "bruceville-point": bundle("bruceville-point", bpSite, bpCalendar, bpMenus, bpInfo, bpArticles) as Community,
};

// Compile-time check that each community's modules really have the Community shape (the bundle cast above can't see it).
type Check<T extends Community> = T;
export type _pcl = Check<{ slug: CommunitySlug } & typeof pclSite & typeof pclCalendar & typeof pclMenus & typeof pclInfo & typeof pclArticles>;
export type _bp = Check<{ slug: CommunitySlug } & typeof bpSite & typeof bpCalendar & typeof bpMenus & typeof bpInfo & typeof bpArticles>;

export const getCommunityBySlug = (slug: CommunitySlug) => communities[slug];

/** Published portraits by person, across every community (names are unique). */
const portraits = new Map(Object.values(communities).flatMap((c) => c.team.filter((m) => m.photo).map((m) => [m.name, m.photo!] as const)));
export const portraitOf = (name: string) => portraits.get(name);
