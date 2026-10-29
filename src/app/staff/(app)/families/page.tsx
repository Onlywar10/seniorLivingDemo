import type { Metadata } from "next";
import { PageHead, Card, Kpi, Badge } from "@/components/staff/ui";
import { ImportContacts } from "@/components/staff/ImportContacts";
import { Icon } from "@/components/Icon";
import { families, scope } from "@/data/staff";

export const metadata: Metadata = { title: "Families & contacts" };

export default async function Families({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const s = scope(c);
  return (
    <>
      <PageHead title="Families and contacts" sub={`${s.label} · ${s.families.toLocaleString()} family contacts`}>
        <ImportContacts />
        <button className="sx-btn sx-btn-primary" type="button">
          <Icon name="plus" /> Add a contact
        </button>
      </PageHead>
      <div className="sx-kpis">
        <Kpi label="Family contacts" value={s.families.toLocaleString()} />
        <Kpi label="Reached this week" value={`${Math.round((s.familiesReached / s.families) * 100)}%`} />
        <Kpi label="Prefer text" value="58%" note="text + email 27%, email 15%" />
        <Kpi label="Not in English" value="23%" note="Spanish 14%, Vietnamese 4%, other 5%" />
        <Kpi label="Opted in to urgent notices" value="100%" note="required at move-in" />
      </div>
      <Card title={c ? s.label : "Larkmoor House"} sub="Showing 12 of 231 · sorted by last opened" pad={false} action={<input className="sx-input" placeholder="Search name or apartment" style={{ maxWidth: 240 }} />}>
        <div className="sx-table-wrap">
          <table className="sx-table">
            <thead>
              <tr>
                <th>Family contact</th>
                <th>Resident · apt</th>
                <th>Wing</th>
                <th>Prefers</th>
                <th>Language</th>
                <th>Opted in to</th>
                <th>Last opened</th>
              </tr>
            </thead>
            <tbody>
              {families.map((f) => (
                <tr key={f.name}>
                  <td>
                    <b>{f.name}</b>
                    <br />
                    <small style={{ color: "var(--sx-ink-3)" }}>{f.rel}</small>
                  </td>
                  <td>{f.resident}</td>
                  <td>{f.wing}</td>
                  <td>{f.channel}</td>
                  <td>{f.lang === "English" ? f.lang : <Badge tone="info">{f.lang}</Badge>}</td>
                  <td>
                    <span style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {f.opt.map((o) => (
                        <Badge key={o} tone={o === "Urgent" ? "bad" : "neutral"}>
                          {o}
                        </Badge>
                      ))}
                    </span>
                  </td>
                  <td>{f.last}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
