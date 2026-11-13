import type { Metadata } from "next";
import Link from "next/link";
import "@/app/staff/automations.css";
import "@/app/staff/surveys.css";
import { Icon } from "@/components/Icon";
import { Help } from "@/components/staff/portal/Help";
import { NotYours } from "@/components/staff/portal/NotYours";
import { SurveyList } from "@/components/staff/portal/SurveyList";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { PageHead } from "@/components/staff/ui";
import { sectionAccess } from "@/data/staff/access";
import { viewer } from "@/data/staff/portal";
import { getStaffCommunity } from "@/data/staff/server";
import { SURVEY_AREA, previewPeople, surveyRows, templatesOf } from "@/data/staff/surveys";

export const metadata: Metadata = { title: "Surveys" };

/**
 * Surveys: staff make, send and repeat their own surveys, the way they make an event. The administrator and approvers
 * make any survey; area owners make surveys for their own area (dining, Lantern). Results are in Reports.
 */
export default async function SurveysPage() {
  const { as, access } = await sectionAccess("surveys");
  if (!access) return <NotYours section="Surveys" />;
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Surveys" />;
  const { s, c } = sc;
  const me = viewer(s.slug, as);
  const area = SURVEY_AREA[as];
  const approver = s.people[s.roles.approver]?.name ?? "";
  return (
    <>
      <PageHead title="Surveys" sub={area === "all" ? `Ask residents, families and staff at ${s.brand.name}. Results are in Reports.` : `Surveys for ${area === "dining" ? "dining" : area === "lantern" ? "Lantern" : "your area"} at ${s.brand.name}. Results are in Reports.`}>
        <Help label="How surveys work" align="end">
          <p>Each survey is a short invitation by text or email with a personal link to a survey page. No app, no login. A printed copy with a QR code is ready for anyone who prefers paper, and staff can read it aloud.</p>
          <p>A new survey goes to {approver.split(" ")[0]} once before it first sends. Approved templates send without asking again.</p>
        </Help>
        <Link href="/staff/reports/surveys" className="sx-btn"><Icon name="chart" /> Results</Link>
        <Link href="/staff/surveys/new" className="sx-btn sx-btn-primary"><Icon name="plus" /> New survey</Link>
      </PageHead>
      <SurveyList rows={surveyRows(s.slug, as)} templates={templatesOf(s.slug)} admin={as === "manager"} approver={approver} me={me.name} community={c.site.name} phone={c.site.phone} domain={s.brand.domain} people={previewPeople(s.slug)} />
    </>
  );
}
