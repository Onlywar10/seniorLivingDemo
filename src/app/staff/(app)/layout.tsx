import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Shell } from "@/components/staff/Shell";
import { StaffCommunityProvider, type StaffCommunityOption } from "@/components/staff/StaffCommunity";
import { communities } from "@/data/communities";
import { lite } from "@/data/staff/lite";
import { queueAll, searchIndex, viewer, viewers } from "@/data/staff/portal";
import { kinlightReplyProblems, waitingReplies } from "@/data/staff/messages";
import { automationProblems } from "@/data/staff/automations";
import { accessOf } from "@/data/staff/shared";
import { getAlertRules, getAreaState, getStaffRole, getStaffScope } from "@/data/staff/server";
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
  const areas = await getAreaState();
  const people = viewers(base);
  // Every routed card in its smallest form: the menu counts this person's (and anything handed to them) in the browser.
  const queue = scope === "all" ? [] : lite(queueAll(scope, await getAlertRules(), areas));
  const replies = scope === "all" ? 0 : waitingReplies(scope, as);
  // Automations: the small count beside the section is this person's problems (the administrator sees all of them).
  const autoProblems = scope === "all" || !accessOf(as, "automations") ? [] : [...automationProblems(scope), ...kinlightReplyProblems(scope)].filter((p) => as === "manager" || p.owner === as).map((p) => p.id);
  return (
    <StaffCommunityProvider scope={scope} options={options}>
      <Shell me={me} people={people} queue={queue} replies={replies} autoProblems={autoProblems} found={scope === "all" ? [] : searchIndex(scope, as)}>
        {children}
      </Shell>
    </StaffCommunityProvider>
  );
}
