import type { Metadata } from "next";
import { NotYours } from "@/components/staff/portal/NotYours";
import { sectionsFor } from "@/data/staff/shared";
import { getStaffRole as getRole } from "@/data/staff/server";
import { People } from "@/components/staff/portal/People";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { PageHead } from "@/components/staff/ui";
import { INTERESTS, engagement, welcomes } from "@/data/staff/engage";
import { residents, viewer, type ResidentRecord } from "@/data/staff/portal";
import { getStaffCommunity } from "@/data/staff/server";

export const metadata: Metadata = { title: "People" };

export default async function PeoplePage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const as = await getRole();
  if (!sectionsFor[as].includes("people")) return <NotYours section="People" who={as === "sales" ? "sales" : as === "events" ? "the events team" : "your"} />;
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="People" />;
  const { s } = sc;
  const { welcome } = await searchParams;
  const me = viewer(s.slug, as);
  const news = welcomes(s.slug);
  // New residents first, with their welcome checklist; their family is invited from the move-in contacts.
  const fresh: ResidentRecord[] = news.map((w) => ({ name: w.name, apt: w.apt, lantern: false, channel: "Text", lang: "English", photoConsent: true, shares: true, family: [] }));
  const eng = engagement(s.slug);
  news.forEach((w, i) => {
    eng[w.name] = {
      name: w.name, lantern: false, interests: i ? ["Music", "Learning"] : [],
      story: i ? "Moved from Portland to be near the grandchildren. Loves opera and long walks." : "Not written yet. Add a few lines with the resident.",
      last30: i ? 2 : 0, lastDays: i ? 1 : w.days, lastActivity: i ? "Happy Hour" : "None yet", lastLabel: i ? "Yesterday" : "Not yet", visits: [], invites: { sent: i ? 2 : 0, yes: i ? 1 : 0 },
    };
  });
  return (
    <>
      <PageHead title="People" sub="Each resident: how they hear from us, their interests and participation, and their family. Everything the automation needs to reach the right person in the right way." />
      <People records={[...fresh, ...residents(s.slug)]} total={s.community.residents} eng={eng} welcomes={news} interests={INTERESTS} me={me.name} community={s.brand.name} initial={welcome} />
    </>
  );
}
