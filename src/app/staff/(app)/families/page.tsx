import type { Metadata } from "next";
import { ContactTable, ImportContacts } from "@/components/staff/Families";
import { Card, HBars, Kpi, PageHead } from "@/components/staff/ui";
import { community, contacts, languages } from "@/data/staff";

export const metadata: Metadata = { title: "Families & contacts" };

export default function FamiliesPage() {
  return (
    <>
      <PageHead title="Families & contacts" sub="Everyone who hears from Prairie City Landing, how they like to hear, and in which language." />
      <div className="sx-kpis">
        <Kpi label="Residents" value={community.residents} note={`${community.harborResidents} in Harbor`} />
        <Kpi label="Families opted in" value={community.families} note={`${community.contacts} contacts in all`} />
        <Kpi label="Reachable by text" value={community.smsReachable} note={`${Math.round((community.smsReachable / community.families) * 100)}% of families`} />
        <Kpi label="Reachable by email" value={community.emailReachable} note={`${Math.round((community.emailReachable / community.families) * 100)}% of families`} />
      </div>
      <ContactTable contacts={contacts} />
      <div className="sx-grid g-2">
        <Card title="Import from a spreadsheet" sub="Last import: Oct 3, from the business office (Yardi), 268 contacts">
          <ImportContacts />
        </Card>
        <Card title="Languages" sub="Messages are translated automatically for these families">
          <HBars items={languages.map((l) => ({ label: l.k, value: l.n }))} color="var(--sky)" />
        </Card>
      </div>
    </>
  );
}
