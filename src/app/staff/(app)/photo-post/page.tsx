import type { Metadata } from "next";
import { PhotoPost } from "@/components/staff/PhotoPost";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { PageHead } from "@/components/staff/ui";
import { getStaffCommunity } from "@/data/staff/server";

export const metadata: Metadata = { title: "Photo post" };

export default async function PhotoPostPage() {
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Photo post" />;
  const { s } = sc;
  return (
    <>
      <PageHead title="Photo post" sub="Take a photo on your phone, and it becomes a news post, a family update and a Facebook post in one step." />
      <PhotoPost presets={s.photoPresets} families={s.community.families} brand={s.brand} approver={s.people[s.roles.approver].name} />
    </>
  );
}
