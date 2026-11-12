import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LiveWeek } from "@/components/week/LiveWeek";
import { isCommunitySlug, residentWeek } from "@/data/staff/weekPage";

export const metadata: Metadata = { title: "Your week", robots: { index: false, follow: false } };

/** A resident's week page: the link in their Sunday text. No sign-in; the link alone is enough. */
export default async function WeekActionPage({ params }: { params: Promise<{ community: string; token: string }> }) {
  const { community, token } = await params;
  if (!isCommunitySlug(community)) notFound();
  const data = residentWeek(community, token);
  if (!data) notFound();
  return (
    <main className="wk-page">
      <LiveWeek data={data} />
    </main>
  );
}
