import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import { Avatar, Badge, Card, HBars, Kpi, PageHead } from "@/components/staff/ui";
import { ago, dayLabel, enquiries, enquirySources, followUps, funnel, staffPeople, tours } from "@/data/staff";
import { fmtTime, nowMinutes } from "@/lib/clock";

export const metadata: Metadata = { title: "Tours & enquiries" };

const statusTone = { New: "accent", Contacted: "info", "Tour booked": "good", Nurturing: "neutral" } as const;

export default function ToursPage() {
  const now = nowMinutes();
  const upcoming = tours.filter((t) => t.days > 0 || t.time + 60 > now);
  const byDay = upcoming.reduce<Record<number, typeof tours>>((m, t) => ((m[t.days] ??= []).push(t), m), {});
  const thisWeek = tours.filter((t) => t.days < 7).length;
  const max = funnel[0].value;

  return (
    <>
      <PageHead title="Tours & enquiries" sub="Every enquiry from the website, Google, AI search and referral partners, in one list for Cynthia Bazin.">
        <a className="sx-btn" href="/contact" target="_blank"><Icon name="globe" /> Tour booking page</a>
      </PageHead>
      <div className="sx-kpis">
        <Kpi label="Tours, next 7 days" value={thisWeek} note={`${tours.length} in the next two weeks`} />
        <Kpi label="New enquiries" value={enquiries.filter((e) => e.status === "New").length} note="waiting for a first reply" />
        <Kpi label="Average first reply" value="38 min" delta={-41} invert note="vs last month" />
        <Kpi label="Enquiry to tour" value={`${Math.round((funnel[1].value / funnel[0].value) * 100)}%`} note="last 90 days" />
      </div>

      <div className="sx-grid g-21">
        <Card title="Upcoming tours" sub="This week and next · lunch is on us">
          {Object.entries(byDay).map(([d, list]) => (
            <div key={d}>
              <h3 className="tour-day">{dayLabel(Number(d))}</h3>
              {list.map((t) => (
                <div className="tour" key={t.who}>
                  <time>{fmtTime(t.time)}</time>
                  <div>
                    <b>{t.who}</b> <span className="sx-hint">for {t.for}</span>
                    <small>{t.interest} · {t.source}{t.lunch ? " · Lunch in the Cypress Room" : ""}</small>
                    {t.note && <small>“{t.note}”</small>}
                  </div>
                  <span className="sx-name"><Avatar who={t.with} size={28} /><span className="sx-hint">{staffPeople[t.with].name.split(" ")[0]}</span></span>
                </div>
              ))}
            </div>
          ))}
        </Card>
        <div className="sx-grid">
          <Card title="Conversion" sub="Last 90 days">
            <div className="funnel">
              {funnel.map((f, i) => (
                <div className="funnel-row" key={f.label}>
                  <span>{f.label}</span>
                  <span className="funnel-bar" style={{ width: `${Math.max(12, (f.value / max) * 100)}%`, background: ["var(--green)", "var(--sky)", "var(--olive)", "var(--terra-deep)"][i] }}>{f.value}</span>
                  <small>{i ? `${Math.round((f.value / funnel[i - 1].value) * 100)}%` : ""}</small>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Follow-ups due">
            <ul className="sx-list">
              {followUps.map((f) => (
                <li key={f.who}>
                  <b>{f.who}</b> {f.overdue ? <Badge tone="bad">Overdue</Badge> : <Badge tone={f.due === 0 ? "warn" : "neutral"}>{dayLabel(f.due)}</Badge>}
                  <br /><span className="sx-hint">{f.what}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <div className="sx-grid g-21">
        <Card title="New enquiries" pad={false}>
          <div className="sx-table-wrap">
            <table className="sx-table">
              <thead><tr><th>Name</th><th>Source</th><th>Interested in</th><th>Status</th><th>Received</th></tr></thead>
              <tbody>
                {enquiries.map((e) => (
                  <tr key={e.name}>
                    <td><b>{e.name}</b><small>“{e.msg}”</small></td>
                    <td>{e.source}</td>
                    <td>{e.interest}</td>
                    <td><Badge tone={statusTone[e.status]}>{e.status}</Badge></td>
                    <td style={{ whiteSpace: "nowrap" }}>{ago(e.mins)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="Where enquiries come from" sub="This month">
          <HBars items={enquirySources.map((s) => ({ label: s.label, value: s.value }))} color="var(--sky)" />
        </Card>
      </div>
    </>
  );
}
