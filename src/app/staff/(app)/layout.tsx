import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Shell } from "@/components/staff/Shell";
import { StaffCommunityProvider, type StaffCommunityOption } from "@/components/staff/StaffCommunity";
import { communities } from "@/data/communities";
import { staffSummary } from "@/data/staff";
import { getStaffScope } from "@/data/staff/server";
import { communitySlugs } from "@/lib/sites";
import "../staff.css";

export async function generateMetadata(): Promise<Metadata> {
  const scope = await getStaffScope();
  const site = scope === "all" ? null : communities[scope].site;
  return {
    title: site ? { default: `Team · ${site.name}`, template: `%s · ${site.short} Team` } : { default: "Team · Wrenhaven Senior Living", template: "%s · Wrenhaven Team" },
    robots: { index: false, follow: false },
  };
}

export default async function StaffLayout({ children }: { children: ReactNode }) {
  const scope = await getStaffScope();
  const options: StaffCommunityOption[] = communitySlugs.map((slug) => {
    const { site } = communities[slug];
    return { slug, name: site.name, short: site.short, city: site.address.city };
  });
  // Sidebar badges: the selected community's, or every community's in the overview.
  const sums = (scope === "all" ? [...communitySlugs] : [scope]).map(staffSummary);
  const badges = { approvals: sums.reduce((n, s) => n + s.approvals, 0), unread: sums.reduce((n, s) => n + s.unread, 0) };
  return (
    <StaffCommunityProvider scope={scope} options={options}>
      <Shell badges={badges}>{children}</Shell>
    </StaffCommunityProvider>
  );
}
