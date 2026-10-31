import type { Metadata } from "next";
import { ContactTable, ImportContacts } from "@/components/staff/Families";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { Card, HBars, Kpi, PageHead } from "@/components/staff/ui";
import { getStaffCommunity } from "@/data/staff/server";

export const metadata: Metadata = { title: "Families & contacts" };

export default async function FamiliesPage() {
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Families & contacts" />;
  const { s } = sc;
  const { community, contacts, languages } = s;
  return (
    <>
      <PageHead title="Families & contacts" sub={`Everyone who hears from ${s.brand.name}, how they like to hear, and in which language.`} />
      <div className="sx-kpis">
        <Kpi label="Residents" value={community.residents} note={`${community.lanternResidents} in Lantern`} />
        <Kpi label="Families opted in" value={community.families} note={`${community.contacts} contacts in all`} />
        <Kpi label="Reachable by text" value={community.smsReachable} note={`${Math.round((community.smsReachable / community.families) * 100)}% of families`} />
        <Kpi label="Reachable by email" value={community.emailReachable} note={`${Math.round((community.emailReachable / community.families) * 100)}% of families`} />
      </div>
      <ContactTable contacts={contacts} />
      <div className="sx-grid g-2">
        <Card title="Import from a spreadsheet" sub={s.importNote}>
          <ImportContacts />
        </Card>
        <Card title="Languages" sub="Messages are translated automatically for these families">
          <HBars items={languages.map((l) => ({ label: l.k, value: l.n }))} color="var(--sky)" />
        </Card>
      </div>
    </>
  );
}
