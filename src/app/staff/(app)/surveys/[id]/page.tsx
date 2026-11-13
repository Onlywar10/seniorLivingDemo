import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "@/app/staff/automations.css";
import "@/app/staff/surveys.css";
import { Icon } from "@/components/Icon";
import { NotYours } from "@/components/staff/portal/NotYours";
import { SurveyDesk } from "@/components/staff/portal/SurveyDesk";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { PageHead } from "@/components/staff/ui";
import { sectionAccess } from "@/data/staff/access";
import { viewer } from "@/data/staff/portal";
import { getStaffCommunity } from "@/data/staff/server";
import { mayManage, previewPeople, results, sampleLinks, surveyById } from "@/data/staff/surveys";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const sc = await getStaffCommunity();
  return { title: (sc && surveyById(sc.s.slug, (await params).id)?.title) || "Survey" };
}

/** One survey: how it's going, its reminders, and what to do next. The approval card, when it's waiting. */
export default async function SurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const { as, access } = await sectionAccess("surveys");
  if (!access) return <NotYours section="Surveys" />;
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="This survey" />;
  const { s, c } = sc;
  const sv = surveyById(s.slug, (await params).id);
  if (!sv) notFound();
  const canManage = mayManage(as, sv);
  if (!canManage) return <NotYours section="This survey" />;
  const me = viewer(s.slug, as);
  const r = results(sv);
  const whenLine = sv.status === "automatic" ? sv.triggerNote ?? "" : sv.repeat ? `${sv.repeat === "monthly" ? "Every month" : `Every ${sv.repeat}`}, next ${sv.nextLabel}` : sv.sentLabel ? `Sent ${sv.sentLabel}` : `Closes ${sv.closesLabel}`;
  const flagged = r.flagged.map((a) => ({ kind: a.flag!.kind, note: a.flag!.note, text: Object.values(a.answers).filter((v) => typeof v === "string" && v.length > 12).join(" "), who: sv.anonymous || a.flag!.kind === "care" ? undefined : a.who }));
  const residents = [...s.lanternNames.map((name) => ({ name, lantern: true })), ...s.residentNames.map((name) => ({ name, lantern: false }))];
  return (
    <>
      <p className="rs-back"><Link className="sx-link" href="/staff/surveys"><Icon name="left" /> Surveys</Link></p>
      <PageHead title={sv.event && sv.status === "automatic" ? `${sv.title} (last: ${sv.event})` : sv.title} sub={`${sv.goesTo} · ${whenLine} · ${sv.ownerName}${sv.anonymous ? " · anonymous" : " · named"}`} />
      <SurveyDesk
        sv={{ id: sv.id, title: sv.title, status: sv.status, anonymous: sv.anonymous, questions: sv.questions, topic: sv.topic, thankYou: sv.thankYou, closesLabel: sv.closesLabel, event: sv.event, ownerName: sv.ownerName, audienceLabel: sv.audienceLabel, goesTo: sv.goesTo, sentLabel: sv.sentLabel, reminderNote: sv.reminderNote, whenLine, sendsTo: sv.sendsTo, answered: sv.answered, byGroup: sv.byGroup, ways: sv.ways, approval: sv.approval, approvedNote: sv.approvedNote, started: sv.started, goal: sv.goal }}
        admin={as === "manager"}
        canManage={canManage}
        me={me.name}
        community={c.site.name}
        phone={c.site.phone}
        domain={s.brand.domain}
        people={previewPeople(s.slug)}
        links={sv.status === "waiting" ? [] : sampleLinks(s.slug, sv)}
        residents={residents}
        flagged={flagged}
      />
    </>
  );
}
