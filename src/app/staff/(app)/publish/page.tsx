import type { Metadata } from "next";
import { PageHead } from "@/components/staff/ui";
import { Publisher } from "@/components/staff/Publisher";
import { scope } from "@/data/staff";

export const metadata: Metadata = { title: "Post once" };

export default async function Publish({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  return (
    <>
      <PageHead title="Post once" sub={`${scope(c).label} · add an event, a menu or a photo, or upload the paper calendar. It goes to the website, families’ phones and inboxes, and the printer in one step.`} />
      <Publisher initial={c} />
    </>
  );
}
