import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Shell } from "@/components/staff/Shell";
import { StaffCommunityProvider, type StaffCommunityOption } from "@/components/staff/StaffCommunity";
import { communities } from "@/data/communities";
import { queueFor, viewer, viewers } from "@/data/staff/portal";
import { getStaffRole, getStaffScope } from "@/data/staff/server";
import { communitySlugs } from "@/lib/sites";
import "../staff.css";
import "../alpha.css";
import "../portal.css";

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
  const as = await getStaffRole();
  const options: StaffCommunityOption[] = communitySlugs.map((slug) => {
    const { site } = communities[slug];
    return { slug, name: site.name, short: site.short, city: site.address.city };
  });
  // The signed-in person, and the one number that says how much is waiting on them (their "Needs you" queue).
  const base = scope === "all" ? communitySlugs[0] : scope;
  const me = viewer(base, as);
  const people = viewers(base);
  const waiting = scope === "all" ? 0 : queueFor(scope, as).length;
  return (
    <StaffCommunityProvider scope={scope} options={options}>
      <Shell me={me} people={people} waiting={waiting}>
        {children}
      </Shell>
    </StaffCommunityProvider>
  );
}
