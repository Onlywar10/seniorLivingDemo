// A resident's week page (an action page, until the resident and family portal arrives), and the previews on Post.
// The week page lists that week's activities by name, the ones that match the resident's interests picked out; each
// opens to show the details and an "I'll go" button that books them straight away (greyed out when it's full). Its
// link comes in a text every Sunday at 5 pm, with reminders during the week for the picks they haven't answered.
// Server Components only.
import { communities, type CommunitySlug } from "@/data/communities";
import { iso, nowMinutes, sundayOf, today } from "@/lib/clock";
import { weekToken } from "@/lib/residentLink";
import { calendarEvents, type CalEvent } from "./calEvents";
import { engagement, eventInterests } from "./engage";
import { getStaffData } from "./index";
import { calToPool, type PoolEvent, type PreviewSetup } from "./pool";

/** Movies and services aren't things we ask anyone to sign up for. */
const askable = (e: { cat: string; lantern?: boolean }) => !e.lantern && e.cat !== "lantern" && e.cat !== "faith" && e.cat !== "movies";
const toPool = (e: CalEvent): PoolEvent => calToPool(e, e.interests ?? e.invites?.interests ?? eventInterests({ title: e.title, cat: e.cat as never }));

/** Six weeks of events from this Sunday, for Post's previews. */
export function previewSetup(slug: CommunitySlug): PreviewSetup {
  const s = getStaffData(slug);
  return {
    pool: calendarEvents(slug, sundayOf(today()), 42).filter((e) => !e.cancelled).map((e) => ({ ...toPool(e), booked: undefined })),
    masthead: `The ${s.brand.name} Weekly`,
  };
}

export interface WeekPageData {
  slug: CommunitySlug;
  brand: { name: string; phone: string };
  resident: { name: string; first: string; interests: string[] };
  /** The Sunday the week starts. */
  weekFrom: string;
  todayIso: string;
  nowMin: number;
  events: PoolEvent[];
}

/** The week page behind one resident's link, or null if the link isn't one of ours. */
export function residentWeek(slug: CommunitySlug, token: string): WeekPageData | null {
  const r = Object.values(engagement(slug)).find((x) => !x.lantern && weekToken(x.name) === token);
  if (!r) return null;
  const s = getStaffData(slug);
  const t = today();
  const from = sundayOf(t);
  return {
    slug,
    brand: { name: s.brand.name, phone: s.brand.phone },
    resident: { name: r.name, first: r.name.split(" ")[0], interests: r.interests.filter(Boolean) },
    weekFrom: iso(from),
    todayIso: iso(t),
    nowMin: nowMinutes(),
    events: calendarEvents(slug, from, 7).filter((e) => askable(e) && !e.cancelled).map(toPool),
  };
}

export const isCommunitySlug = (x: string): x is CommunitySlug => x in communities;
