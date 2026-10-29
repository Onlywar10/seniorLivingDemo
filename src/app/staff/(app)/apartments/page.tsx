import type { Metadata } from "next";
import { PageHead, Card, Kpi, Badge } from "@/components/staff/ui";
import { Icon } from "@/components/Icon";
import { waitlist, waitlistSignups, alertsSent, nameOf } from "@/data/staff";

export const metadata: Metadata = { title: "Apartments & waitlist" };

export default async function AptPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const rows = c ? waitlist.filter((w) => w.where === nameOf(c)) : waitlist;
  const avail = rows.reduce((n, r) => n + r.available, 0);
  const waiting = rows.reduce((n, r) => n + r.waiting, 0);
  const alerts = rows.reduce((n, r) => n + r.alerts, 0);
  return (
    <>
      <PageHead title="Apartments and waitlist" sub={`${c ? nameOf(c) : "All communities"} · availability on the website updates the moment you change it here`}>
        <button className="sx-btn sx-btn-primary" type="button">
          <Icon name="bell" /> Send an availability alert
        </button>
      </PageHead>
      <div className="sx-kpis">
        <Kpi label="Available now" value={avail} note="listed on the website" />
        <Kpi label="On waitlists" value={waiting} delta={22} />
        <Kpi label="Signed up for alerts" value={alerts} delta={31} />
        <Kpi label="Tours from alerts" value="9" note="this month" />
      </div>
      <Card title="Availability by community and type" pad={false}>
        <div className="sx-table-wrap">
          <table className="sx-table">
            <thead>
              <tr>
                <th>Community</th>
                <th>Apartment type</th>
                <th>On the website</th>
                <th className="num">Available</th>
                <th className="num">Waiting</th>
                <th className="num">Alert sign-ups</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.where + r.type}>
                  <td>
                    <b>{r.where}</b>
                  </td>
                  <td>{r.type}</td>
                  <td>{r.available ? <Badge tone="good">{r.available} available</Badge> : <Badge tone="warn">Waitlist ({r.waiting})</Badge>}</td>
                  <td className="num">{r.available}</td>
                  <td className="num">{r.waiting}</td>
                  <td className="num">{r.alerts}</td>
                  <td>
                    <button className="sx-btn" type="button">
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="sx-grid g-2">
        <Card title="New waitlist sign-ups" pad={false}>
          <div className="sx-table-wrap">
            <table className="sx-table">
              <tbody>
                {waitlistSignups().map((w) => (
                  <tr key={w.who}>
                    <td>
                      <b>{w.who}</b>
                      <br />
                      <small style={{ color: "var(--sx-ink-3)" }}>{w.wants}</small>
                    </td>
                    <td>{w.timing}</td>
                    <td>{w.contact}</td>
                    <td>{w.when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="Alerts sent" pad={false}>
          <div className="sx-table-wrap">
            <table className="sx-table">
              <tbody>
                {alertsSent().map((a) => (
                  <tr key={a.what}>
                    <td>{a.when}</td>
                    <td>
                      <b>{a.what}</b>
                      <br />
                      <small style={{ color: "var(--sx-ink-3)" }}>{a.to}</small>
                    </td>
                    <td>
                      <Badge tone="good">{a.result}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
