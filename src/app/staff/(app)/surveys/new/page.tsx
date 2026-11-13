import type { Metadata } from "next";
import "@/app/staff/automations.css";
import "@/app/staff/surveys.css";
import { NotYours } from "@/components/staff/portal/NotYours";
import { SurveyBuilder } from "@/components/staff/portal/SurveyBuilder";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { PageHead } from "@/components/staff/ui";
import { sectionAccess } from "@/data/staff/access";
import { viewer } from "@/data/staff/portal";
import { getStaffCommunity } from "@/data/staff/server";
import { SURVEY_AREA, audienceFacts, previewPeople, results, surveysOf, templatesOf } from "@/data/staff/surveys";
import { iso, today } from "@/lib/clock";

export const metadata: Metadata = { title: "New survey" };

/** New survey: from a template, a past survey, blank, or "Write it for me". */
export default async function NewSurveyPage({ searchParams }: { searchParams: Promise<{ template?: string; copy?: string; blank?: string }> }) {
  const { as, access } = await sectionAccess("surveys");
  if (!access) return <NotYours section="Surveys" />;
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="New survey" />;
  const { s, c } = sc;
  const sp = await searchParams;
  const me = viewer(s.slug, as);
  const area = SURVEY_AREA[as] ?? "community";
  const past = surveysOf(s.slug)
    .filter((x) => x.status === "closed" || (x.answered > 0 && x.status !== "waiting"))
    .map((x) => ({ id: x.id, title: x.title, when: x.sentLabel ?? "", rate: results(x).rate, questions: x.questions, area: x.area, audience: x.audience, topic: x.topic, anonymous: x.anonymous }));
  const tpls = templatesOf(s.slug);
  const start = sp.template && tpls.some((t) => t.id === sp.template) ? { kind: "template" as const, id: sp.template } : sp.copy && past.some((p) => p.id === sp.copy) ? { kind: "copy" as const, id: sp.copy } : sp.blank ? { kind: "blank" as const } : undefined;
  return (
    <>
      <PageHead title="New survey" sub="Made like an event: start from something that works, then choose who and when." />
      <SurveyBuilder templates={tpls} past={past} facts={audienceFacts(s.slug)} as={as} admin={as === "manager"} me={me.name} approver={s.people[s.roles.approver]?.name ?? ""} community={c.site.name} phone={c.site.phone} domain={s.brand.domain} people={previewPeople(s.slug)} area={area} start={start} todayIso={iso(today())} />
    </>
  );
}
