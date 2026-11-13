import type { Metadata } from "next";
import "@/app/staff/automations.css";
import { AutomationsDesk, type DeskTab } from "@/components/staff/portal/Automations";
import { NotYours } from "@/components/staff/portal/NotYours";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { PageHead } from "@/components/staff/ui";
import { sectionAccess } from "@/data/staff/access";
import { OWNER_AREA, areaOwners, automationLog, automationProblems, automations, changeHistory, nextDay, summarize } from "@/data/staff/automations";
import { kinlightReplyProblems } from "@/data/staff/messages";
import { viewer } from "@/data/staff/portal";
import { getStaffCommunity } from "@/data/staff/server";
import { iso, nowMinutes, today } from "@/lib/clock";

export const metadata: Metadata = { title: "Automations" };

const TABS: DeskTab[] = ["list", "log", "problems", "next", "changes"];

/**
 * Automations: everything Kinlight sends to residents, families and prospects on its own, with an on/off switch for
 * each; what actually went out; and what went wrong. The administrator sees and changes everything; each area owner
 * sees their own (events and activities, dining, sales and tours, Lantern). Nobody else sees the section.
 */
export default async function AutomationsPage({ searchParams }: { searchParams: Promise<{ tab?: string; auto?: string; person?: string; status?: string }> }) {
  const { as, access } = await sectionAccess("automations");
  if (!access) return <NotYours section="Automations" />;
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Automations" />;
  const { s } = sc;
  const sp = await searchParams;
  const me = viewer(s.slug, as);
  const admin = as === "manager";
  const list = automations(s.slug, as);
  const rows = automationLog(s.slug, as);
  const mine = new Set(list.map((a) => a.id));
  const problems = [...automationProblems(s.slug), ...kinlightReplyProblems(s.slug)].filter((p) => admin || p.owner === as).sort((a, b) => b.at - a.at);
  const owners = areaOwners(s.slug);
  return (
    <>
      <PageHead
        title="Automations"
        sub={admin ? `Everything Kinlight sends on its own to residents, families and prospects at ${s.brand.name}.` : `What Kinlight sends on its own for ${OWNER_AREA[as].toLowerCase()} at ${s.brand.name}. You can switch these on and off.`}
      />
      <AutomationsDesk
        tab={TABS.includes(sp.tab as DeskTab) ? (sp.tab as DeskTab) : "list"}
        filter={{ auto: sp.auto, person: sp.person, status: sp.status }}
        me={me.name}
        as={as}
        admin={admin}
        approver={owners.manager}
        community={s.brand.name}
        list={list}
        rows={rows}
        summary={summarize(rows)}
        problems={problems}
        upcoming={nextDay(s.slug, as)}
        history={changeHistory(s.slug).filter((h) => admin || mine.has(h.auto))}
        todayIso={iso(today())}
        now={nowMinutes()}
      />
    </>
  );
}
