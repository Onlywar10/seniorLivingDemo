import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SurveyRunner } from "@/components/survey/SurveyRunner";
import { communities } from "@/data/communities";
import { fillIn } from "@/data/staff/autoText";
import { resolveToken } from "@/data/staff/surveys";
import { isCommunitySlug } from "@/data/staff/weekPage";
import { iso, today } from "@/lib/clock";

export const metadata: Metadata = { title: "Survey", robots: { index: false, follow: false } };

/**
 * A survey page: the link in a survey invitation (text or email), or the QR code on the printed copy. No login: the
 * link already knows who it's for, or is anonymous if the survey is. Shown in the person's own language.
 */
export default async function SurveyPage({ params }: { params: Promise<{ community: string; token: string }> }) {
  const { community, token } = await params;
  if (!isCommunitySlug(community)) notFound();
  const r = resolveToken(community, decodeURIComponent(token));
  if (!r) notFound();
  const c = communities[community];
  const lang = r.lang === "Spanish" ? "es" : r.lang === "Chinese" ? "zh" : "en";
  const sv = r.sv;
  const closed = sv.status === "closed" || (!!sv.closes && sv.closes < iso(today()));
  // Someone whose answers are already in (the sample answers) sees a polite note instead of the questions.
  const already = !!r.person && sv.answers.some((a) => a.who === r.person!.name);
  return (
    <SurveyRunner
      title={sv.event ? `${sv.title}: ${sv.event}` : sv.title}
      community={c.site.name}
      phone={c.site.phone}
      questions={sv.questions}
      lang={lang}
      anonymous={sv.anonymous}
      thankYou={fillIn(sv.thankYou[lang], { community: c.site.name })}
      vars={{ event: sv.event ?? "" }}
      storageKey={`wh-survey-${community}-${token}`}
      closed={closed}
      alreadyDone={already}
      closesLabel={sv.closesLabel}
    />
  );
}
