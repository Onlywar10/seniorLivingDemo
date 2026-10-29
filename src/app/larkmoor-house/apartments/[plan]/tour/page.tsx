import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VirtualTour } from "@/components/VirtualTour";
import { Icon } from "@/components/Icon";
import { apartments, money } from "@/data/community";

export async function generateMetadata({ params }: { params: Promise<{ plan: string }> }): Promise<Metadata> {
  const { plan } = await params;
  const a = apartments.find((x) => x.key === plan);
  return { title: a ? `${a.name} virtual tour` : "Virtual tour" };
}

export default async function TourPage({ params }: { params: Promise<{ plan: string }> }) {
  const { plan } = await params;
  const apt = apartments.find((a) => a.key === plan);
  if (!apt) notFound();
  return (
    <div className="vt-page">
      <div className="wrap">
        <div className="vt-head">
          <Link href="/larkmoor-house/apartments" className="vt-back">
            <Icon name="left" /> All apartments
          </Link>
          <div className="vt-title">
            <h1>{apt.name}</h1>
            <span>
              {apt.size} · {apt.floor} · from {money(apt.from)} a month
            </span>
          </div>
          <div className="vt-others" aria-label="Other floor plans">
            {apartments
              .filter((a) => a.key !== apt.key)
              .map((a) => (
                <Link key={a.key} href={`/larkmoor-house/apartments/${a.key}/tour`}>
                  {a.name}
                </Link>
              ))}
          </div>
        </div>
        <VirtualTour apt={apt} />
      </div>
    </div>
  );
}
