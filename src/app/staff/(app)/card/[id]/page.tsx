import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SoloCard } from "@/components/staff/portal/Queue";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { queue } from "@/data/staff/portal";
import { getStaffCommunity } from "@/data/staff/server";

export const metadata: Metadata = { title: "Approval card" };

/** One card on its own: what a staff text alert opens ("Tom wants to bring 3 to the barbecue. Approve: link"). */
export default async function CardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="This card" />;
  const q = queue(sc.s.slug).find((x) => x.id === id);
  if (!q) notFound();
  return (
    <div className="pt-solo">
      <p className="pt-solo-from">From your text alert · <Link className="sx-link" href="/staff/today">Today</Link></p>
      <SoloCard q={q} />
    </div>
  );
}
