import type { Metadata } from "next";
import { PhotoPost } from "@/components/staff/PhotoPost";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { PageHead } from "@/components/staff/ui";
import { getStaffCommunity } from "@/data/staff/server";
import { longDate, today } from "@/lib/clock";

export const metadata: Metadata = { title: "Photo post" };

export default async function PhotoPostPage() {
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Photo post" />;
  const { s } = sc;
  return (
    <>
      <PageHead title="Photo post" sub="Take a photo on your phone and it becomes a website news post and a family update in one tap, after a photo consent check on every face." />
      <PhotoPost
        presets={s.photoPresets}
        families={s.community.families}
        brand={s.brand}
        approver={s.people[s.roles.approver].name}
        poster={s.people[s.roles.calendar].name}
        weekday={longDate(today()).split(",")[0]}
      />
    </>
  );
}
