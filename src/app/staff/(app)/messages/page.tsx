import type { Metadata } from "next";
import { Inbox } from "@/components/staff/portal/Inbox";
import { NotYours } from "@/components/staff/portal/NotYours";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { PageHead } from "@/components/staff/ui";
import { sectionAccess } from "@/data/staff/access";
import { inbox } from "@/data/staff/messages";
import { viewer } from "@/data/staff/portal";
import { getStaffCommunity } from "@/data/staff/server";

export const metadata: Metadata = { title: "Communications" };

/** Every text and email conversation with families and residents, and replying to them. */
export default async function MessagesPage() {
  const { as, access } = await sectionAccess("messages");
  if (!access) return <NotYours section="Communications" />;
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Communications" />;
  const { convos, people } = inbox(sc.s.slug, as);
  return (
    <>
      <PageHead title="Communications" sub={access === "assigned" ? "Conversations assigned to you, by text and email." : "Every conversation with families and residents, by text and email."} />
      <Inbox convos={convos} people={people} as={as} me={viewer(sc.s.slug, as).name} />
    </>
  );
}
