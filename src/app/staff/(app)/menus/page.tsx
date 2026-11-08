import type { Metadata } from "next";
import { MenusDesk } from "@/components/staff/portal/MenusDesk";
import { NotYours } from "@/components/staff/portal/NotYours";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { PageHead } from "@/components/staff/ui";
import { sectionAccess } from "@/data/staff/access";
import { menuWeek } from "@/data/staff/menus";
import { viewer } from "@/data/staff/portal";
import { getStaffCommunity } from "@/data/staff/server";
import { siteHref } from "@/data/staff/shared";
import "@/app/staff/menus.css";

export const metadata: Metadata = { title: "Menus" };

export default async function MenusPage() {
  const { as, access } = await sectionAccess("menus");
  if (!access) return <NotYours section="Menus" />;
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Menus" />;
  const { s } = sc;
  const week = menuWeek(s.slug);
  const me = viewer(s.slug, as);
  const canEdit = access === "full" && (as === "kitchen" || as === "manager");
  return (
    <>
      <PageHead
        title="Menus"
        sub={canEdit ? "Once a week: upload the menus, check what Kinlight read, and they publish themselves day by day." : `What’s on the menus today and next week. ${week.chef} looks after them.`}
      />
      <MenusDesk
        week={week}
        canEdit={canEdit}
        isApprover={me.key === s.roles.approver}
        me={me.first}
        diningHref={siteHref(s.slug, "/dining")}
        homeHref={siteHref(s.slug)}
      />
    </>
  );
}
