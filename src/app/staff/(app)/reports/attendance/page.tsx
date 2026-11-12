import type { Metadata } from "next";
import "@/app/staff/reports.css";
import { ReportTabs } from "@/components/staff/portal/CalendarTabs";
import { AttendanceReport } from "@/components/staff/portal/AttendanceReport";
import { NotYours } from "@/components/staff/portal/NotYours";
import { mayOpen } from "@/components/staff/portal/ReportsNav";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { PageHead } from "@/components/staff/ui";
import { sectionAccess } from "@/data/staff/access";
import { attendanceData } from "@/data/staff/attendanceReport";
import { getStaffCommunity } from "@/data/staff/server";

export const metadata: Metadata = { title: "Attendance" };

/** The attendance report builder: any date range in the last 90 days, grouped by activity, resident, category or area. */
export default async function AttendancePage({ searchParams }: { searchParams: Promise<{ resident?: string; group?: string }> }) {
  const { access } = await sectionAccess("reports");
  if (!access || !mayOpen(access, "attendance")) return <NotYours section="Attendance reports" />;
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Attendance" />;
  const { resident, group } = await searchParams;
  return (
    <>
      <PageHead title="Attendance" sub={`${sc.s.brand.name} · who came to what, for any dates in the last 90 days`} />
      <ReportTabs access={access} />
      <AttendanceReport
        data={attendanceData(sc.s.slug)}
        community={sc.s.brand.name}
        initialResident={resident}
        initialGroup={group === "resident" || group === "category" || group === "area" ? group : undefined}
      />
    </>
  );
}
