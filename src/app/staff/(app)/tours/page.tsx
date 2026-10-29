import type { Metadata } from "next";
import { PageHead, Card, Kpi, Badge, HBars } from "@/components/staff/ui";
import { Icon } from "@/components/Icon";
import { tours, enquiries, scope, sources, nameOf } from "@/data/staff";

export const metadata: Metadata = { title: "Tours & enquiries" };

export default async function ToursPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const s = scope(c);
  const t = tours().filter((x) => !c || x.where === nameOf(c));
  const e = enquiries().filter((x) => !c || x.where === nameOf(c));
  return (
    <>
      <PageHead title="Tours and enquiries" sub={`${s.label} · every enquiry routed to the right person, with where it came from`}>
        <button className="sx-btn sx-btn-primary" type="button">
          <Icon name="plus" /> Log a call
        </button>
      </PageHead>
      <div className="sx-kpis">
        <Kpi label="Tours this week" value={s.tours} delta={Math.round(((s.tours - s.toursPrev) / s.toursPrev) * 100)} />
        <Kpi label="New enquiries" value={s.enquiries} delta={14} />
        <Kpi label="Median first reply" value="28 min" delta={-41} invert note="was 47 min" />
        <Kpi label="Enquiry to tour" value="38%" delta={9} />
        <Kpi label="Tour to move-in" value="27%" note="last 90 days" />
      </div>
      <div className="sx-grid g-21">
        <Card title="Upcoming tours" sub="Reminders go by text the day before" pad={false}>
          <div className="sx-table-wrap">
            <table className="sx-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Who</th>
                  <th>Community</th>
                  <th>Came from</th>
                  <th>Host</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {t.map((x) => (
                  <tr key={x.when + x.who}>
                    <td style={{ whiteSpace: "nowrap" }}>{x.when}</td>
                    <td>
                      <b>{x.who}</b>
                      <br />
                      <small style={{ color: "var(--sx-ink-3)" }}>{x.forWhom}</small>
                    </td>
                    <td>{x.where}</td>
                    <td>
                      <Badge tone={x.source.includes("ChatGPT") ? "accent" : "neutral"}>{x.source}</Badge>
                    </td>
                    <td>{x.host}</td>
                    <td>{x.status.startsWith("Awaiting") ? <Badge tone="warn">{x.status}</Badge> : <Badge tone="good">{x.status}</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="Where enquiries come from" sub="Last 30 days">
          <HBars items={sources.map((x) => ({ label: x.k, value: Math.round(s.enquiries * 4.2 * x.share) }))} />
        </Card>
      </div>
      <Card title="New enquiries" sub="Routed automatically by community, care type and language" pad={false}>
        <div className="sx-table-wrap">
          <table className="sx-table">
            <thead>
              <tr>
                <th>Received</th>
                <th>Who and what</th>
                <th>Community</th>
                <th>Source</th>
                <th>Routed to</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {e.map((x) => (
                <tr key={x.who}>
                  <td style={{ whiteSpace: "nowrap" }}>{x.when}</td>
                  <td>
                    <b>{x.who}</b>
                    <br />
                    <small style={{ color: "var(--sx-ink-3)" }}>{x.about}</small>
                  </td>
                  <td>{x.where}</td>
                  <td>{x.source}</td>
                  <td>{x.routed}</td>
                  <td>
                    <Badge tone={x.status === "New" ? "info" : "good"}>{x.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
