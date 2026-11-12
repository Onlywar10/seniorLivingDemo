import type { Metadata } from "next";
import { MenusDesk } from "@/components/staff/portal/MenusDesk";
import { NotYours } from "@/components/staff/portal/NotYours";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { PageHead } from "@/components/staff/ui";
import { sectionAccess } from "@/data/staff/access";
import { menuBoard } from "@/data/staff/menus";
import { diningRequests } from "@/data/staff/dining";
import { viewer } from "@/data/staff/portal";
import { getStaffCommunity } from "@/data/staff/server";
import { siteHref } from "@/data/staff/shared";
import "@/app/staff/menus.css";

export const metadata: Metadata = { title: "Menus" };

export default async function MenusPage({ searchParams }: { searchParams: Promise<{ room?: string; start?: string }> }) {
  const { as, access } = await sectionAccess("menus");
  if (!access) return <NotYours section="Menus" />;
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Menus" />;
  const { s } = sc;
  const week = menuBoard(s.slug);
  const { room, start } = await searchParams;
  const dining = diningRequests(s.slug);
  const requestsOnly = access === "dining-requests";
  const me = viewer(s.slug, as);
  const canEdit = access === "full" && (as === "kitchen" || as === "manager");
  return (
    <>
      <PageHead
        title={requestsOnly ? "Dining requests" : "Menus"}
        sub={requestsOnly ? "Reservations, guests, holiday meals and requests to the chef, by text." : canEdit ? "The kitchen hands over the menu it already has. Kinlight takes care of everyone else: the website, print, the newsletter, texts and the requests that come back." : `${week.chef} looks after them. Kinlight fills each week from the kitchen’s own menus.`}
      />
      <MenusDesk
        week={week}
        dining={dining}
        room={room}
        start={start}
        requestsOnly={requestsOnly}
        canEdit={canEdit}
        isApprover={me.key === s.roles.approver}
        me={me.first}
        diningHref={siteHref(s.slug, "/dining")}
        homeHref={siteHref(s.slug)}
      />
    </>
  );
}
