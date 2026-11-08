import type { Metadata } from "next";
import { NotYours } from "@/components/staff/portal/NotYours";
import { sectionsFor } from "@/data/staff/shared";
import { getStaffRole as getRole } from "@/data/staff/server";
import { People } from "@/components/staff/portal/People";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { PageHead } from "@/components/staff/ui";
import { residents } from "@/data/staff/portal";
import { getStaffCommunity } from "@/data/staff/server";

export const metadata: Metadata = { title: "People" };

export default async function PeoplePage() {
  const as = await getRole();
  if (!sectionsFor[as].includes("people")) return <NotYours section="People" who={as === "sales" ? "sales" : as === "events" ? "the events team" : "your"} />;
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="People" />;
  const { s } = sc;
  return (
    <>
      <PageHead title="People" sub="Each resident, how they hear from us, and their family: who has joined, who is waiting, and what each person gets." />
      <People records={residents(s.slug)} total={s.community.residents} />
    </>
  );
}
