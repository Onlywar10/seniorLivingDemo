import type { Metadata } from "next";
import { NewsletterDesk } from "@/components/staff/portal/NewsletterDesk";
import { NotYours } from "@/components/staff/portal/NotYours";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { PageHead } from "@/components/staff/ui";
import { sectionAccess } from "@/data/staff/access";
import { newsletter } from "@/data/staff/newsletter";
import { viewer } from "@/data/staff/portal";
import { getStaffCommunity } from "@/data/staff/server";
import "@/app/staff/newsletter.css";

export const metadata: Metadata = { title: "Newsletter" };

export default async function Page({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { as, access } = await sectionAccess("newsletter");
  const { from } = await searchParams;
  // The front desk (Poster) reaches the newsletter only from its Today card: they can change it, not approve it.
  const viaCard = !access && as === "desk" && from === "card";
  if (!access && !viaCard) return <NotYours section="Newsletter" />;
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Newsletter" />;
  const issue = newsletter(sc.s.slug);
  const me = viewer(sc.s.slug, as);
  return (
    <>
      <PageHead title="Newsletter" sub="Kinlight builds and writes it every Thursday from the week’s events, photos and menus. Check it, change anything, and it sends on Sunday at 5 pm." />
      <NewsletterDesk issue={issue} me={me.first} canApprove={access === "full"} viaCard={viaCard} />
    </>
  );
}
