import type { Metadata } from "next";
import "@/app/staff/reports.css";
import { ReportTabs } from "@/components/staff/portal/CalendarTabs";
import { NotYours } from "@/components/staff/portal/NotYours";
import { QueueReport } from "@/components/staff/portal/QueueReport";
import { mayOpen } from "@/components/staff/portal/ReportsNav";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { PageHead } from "@/components/staff/ui";
import { sectionAccess } from "@/data/staff/access";
import { lite } from "@/data/staff/lite";
import { queueAll, roleNames, viewer } from "@/data/staff/portal";
import { getAlertRules, getAreaState, getStaffCommunity } from "@/data/staff/server";
import { STAFF_ROLES } from "@/data/staff/shared";
import { SIGNALS } from "@/data/staff/signals";

export const metadata: Metadata = { title: "Today, measured" };

/**
 * How Today's queue is working, for the administrator: what each person has waiting right now (from the same routed
 * queue Today shows), and what people did with their cards in this browser (done, done late, snoozed, handed on).
 * A kind of card that's mostly put off rather than done is marked "Consider turning this off".
 */
export default async function TodayReportPage() {
  const { access } = await sectionAccess("reports");
  if (!access || !mayOpen(access, "today")) return <NotYours section="This report" />;
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Today, measured" />;
  const slug = sc.s.slug;
  const items = queueAll(slug, await getAlertRules(), await getAreaState());
  const signal = Object.fromEntries(items.map((q) => [q.id, q.signal ?? q.kind]));
  return (
    <>
      <PageHead title="Today, measured" sub={`${sc.s.brand.name} · is everyone’s queue short, and does it get done?`} />
      <ReportTabs access={access} />
      <QueueReport
        items={lite(items)}
        signalOf={signal}
        names={roleNames(slug)}
        titles={Object.fromEntries(STAFF_ROLES.map((r) => [r, viewer(slug, r).title]))}
        labels={Object.fromEntries(SIGNALS.map((s) => [s.key, s.label]))}
      />
    </>
  );
}
