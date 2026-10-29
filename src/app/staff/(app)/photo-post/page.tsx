import type { Metadata } from "next";
import { PageHead } from "@/components/staff/ui";
import { PhotoPost } from "@/components/staff/Editors";

export const metadata: Metadata = { title: "Photo post" };

export default function PhotoPostPage() {
  return (
    <>
      <PageHead title="Photo post" sub="A staff member snaps a photo on their phone and it becomes a news post, with consent checked and a caption suggested." />
      <PhotoPost />
    </>
  );
}
