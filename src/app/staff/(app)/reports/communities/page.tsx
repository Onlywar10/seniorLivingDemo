import type { Metadata } from "next";
import "@/app/staff/reports.css";
import { ReportTabs } from "@/components/staff/portal/CalendarTabs";
import { NotYours } from "@/components/staff/portal/NotYours";
import { Leadership } from "@/components/staff/portal/ReportsLeadership";
import { mayOpen } from "@/components/staff/portal/ReportsNav";
import { NotThisReport } from "@/components/staff/portal/ReportsParts";
import { sectionAccess } from "@/data/staff/access";

export const metadata: Metadata = { title: "All communities" };

/** The leadership view, whichever community is selected (or all of them). */
export default async function LeadershipPage() {
  const { access } = await sectionAccess("reports");
  if (!access) return <NotYours section="Reports" />;
  if (!mayOpen(access, "communities")) return <NotThisReport title="All communities" access={access} />;
  return <Leadership tabs={<ReportTabs access={access} />} />;
}
