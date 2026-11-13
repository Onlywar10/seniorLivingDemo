import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "@/app/staff/reports.css";
import "@/app/staff/automations.css";
import { Icon } from "@/components/Icon";
import { NotYours } from "@/components/staff/portal/NotYours";
import { ResidentPage, type ResidentTab } from "@/components/staff/portal/ResidentPage";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { INTERESTS } from "@/data/staff/engage";
import { viewer } from "@/data/staff/portal";
import { residentProfile } from "@/data/staff/resident";
import { automationNames, sentAbout } from "@/data/staff/automations";
import { removalPlan } from "@/data/staff/removal";
import { iso, today } from "@/lib/clock";
import { getAreaState, getStaffCommunity, getStaffRole } from "@/data/staff/server";
import { presetOf, sectionsFor } from "@/data/staff/shared";

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
  return { title: decodeURIComponent((await params).name) };
}

const TABS: ResidentTab[] = ["week", "about", "family", "kinlight", "notes", "report"];

/** One resident's page: their week, about them, their family and every message, staff notes, and a participation report. */
export default async function ResidentRoute({ params, searchParams }: { params: Promise<{ name: string }>; searchParams: Promise<{ tab?: string; welcome?: string; msg?: string; member?: string }> }) {
  const as = await getStaffRole();
  if (!sectionsFor[as].includes("people")) return <NotYours section="People" who={as === "sales" ? "sales" : "your"} />;
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="This resident" />;
  const name = decodeURIComponent((await params).name);
  const { tab, welcome, msg, member } = await searchParams;
  const p = residentProfile(sc.s.slug, name, await getAreaState());
  if (!p) notFound();
  const me = viewer(sc.s.slug, as);
  return (
    <>
      <p className="rs-back"><Link className="sx-link" href="/staff/people"><Icon name="left" /> People</Link></p>
      <ResidentPage
        p={p}
        me={me.name}
        community={sc.s.brand.name}
        interests={INTERESTS}
        tab={member ? "family" : TABS.includes(tab as ResidentTab) ? (tab as ResidentTab) : "week"}
        member={member}
        openWelcome={welcome === "1"}
        messageTo={msg}
        sent={sentAbout(sc.s.slug, p.record.name)}
        autoNames={automationNames(sc.s.slug)}
        todayIso={iso(today())}
        removal={as === "manager" || presetOf[as] === "Approver" ? removalPlan(sc.s.slug, p.record, p.legal) : undefined}
        as={as}
        approver={sc.s.people[sc.s.roles.approver]?.name ?? ""}
        phone={sc.c.site.phone}
      />
    </>
  );
}
