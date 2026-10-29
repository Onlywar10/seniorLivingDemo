import type { Metadata } from "next";
import { PageHead } from "@/components/staff/ui";
import { Studio } from "@/components/staff/Editors";

export const metadata: Metadata = { title: "Design studio" };

export default function StudioPage() {
  return (
    <>
      <PageHead title="Design studio" sub="Flyers, large-print calendars and menu cards in your brand, ready to print or post." />
      <Studio />
    </>
  );
}
