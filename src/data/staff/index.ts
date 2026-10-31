// Staff back end: every community's operational records, by slug.
// Server pages: `const scope = await getStaffScope()` (./server.ts), then `getStaffData(scope)` for one community.
// Client components import types from "./shared" and people from "./people" so they don't bundle every community's data.
import { communities, type CommunitySlug } from "@/data/communities";
import { communitySlugs } from "@/lib/sites";
import { staff as kp } from "./kestrel-point";
import { staff as ab } from "./alder-bend";
import type { StaffData } from "./shared";

export * from "./shared";
export { staffPeople, user } from "./people";

export const staffData: Record<CommunitySlug, StaffData> = {
  "alder-bend": ab,
  "kestrel-point": kp,
};

export const getStaffData = (slug: CommunitySlug): StaffData => staffData[slug];

/** Each apartment plan with its unit count and notice, from the community's plans and the business office's figures. */
export function planRows(slug: CommunitySlug) {
  const units = staffData[slug].planUnits;
  return communities[slug].plans.map((p) => ({ ...p, units: units[p.code]?.units ?? 0, notice: units[p.code]?.notice ?? 0 }));
}

/** Occupancy as a percentage of apartments, from the plans' availability. */
export function occupancy(slug: CommunitySlug) {
  const rows = planRows(slug);
  const units = rows.reduce((n, r) => n + r.units, 0);
  const avail = rows.reduce((n, r) => n + r.available, 0);
  return { units, avail, pct: ((units - avail) / units) * 100 };
}

/** The headline figures for one community, for the Wrenhaven overview. */
export function staffSummary(slug: CommunitySlug) {
  const d = staffData[slug];
  const c = communities[slug];
  return {
    slug,
    name: c.site.name,
    city: c.site.address.city,
    occupancy: occupancy(slug).pct,
    apartments: occupancy(slug).units,
    toursThisWeek: d.tours.filter((t) => t.days < 7).length,
    enquiries: d.enquirySources.reduce((n, s) => n + s.value, 0),
    enquiriesPrev: d.enquirySourcesPrev.reduce((n, s) => n + s, 0),
    newEnquiries: d.enquiries.filter((e) => e.status === "New").length,
    waitlist: d.waitlist.length,
    approvals: d.approvals.length,
    unread: d.threads.filter((t) => t.unread).length,
    families: d.community.families,
    familiesReached: d.weekKpis.familiesReached,
    openRate: d.weekKpis.openRate,
    visibility: d.geoTrend[d.geoTrend.length - 1],
    rating: d.gbp.rating,
  };
}
export type StaffSummary = ReturnType<typeof staffSummary>;

export const allSummaries = () => communitySlugs.map(staffSummary);
