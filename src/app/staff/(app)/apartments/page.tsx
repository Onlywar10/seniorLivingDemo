import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { Badge, Card, Kpi, Meter, PageHead } from "@/components/staff/ui";
import { money, planKindLabel } from "@/data/shared";
import { dayLabel, planRows } from "@/data/staff";
import { getStaffCommunity } from "@/data/staff/server";
import { addDays, shortDate, today } from "@/lib/clock";

export const metadata: Metadata = { title: "Apartments & waitlist" };

export default async function ApartmentsPage() {
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Apartments & waitlist" />;
  const { s } = sc;
  const { alerts, community, moves, waitlist } = s;
  const t = today();
  const rows = planRows(s.slug);
  const units = rows.reduce((n, r) => n + r.units, 0);
  const avail = rows.reduce((n, r) => n + r.available, 0);
  const notice = rows.reduce((n, r) => n + r.notice, 0);
  const occ = ((units - avail) / units) * 100;
  const kinds = (["independent", "assisted", "lantern"] as const).map((k) => {
    const r = rows.filter((x) => x.kind === k);
    const u = r.reduce((n, x) => n + x.units, 0), a = r.reduce((n, x) => n + x.available, 0);
    return { k, u, occ: ((u - a) / u) * 100 };
  }).filter((k) => k.u > 0); // not every community has every kind of plan
  const date = (days: number) => shortDate(addDays(t, days));

  return (
    <>
      <PageHead title="Apartments & waitlist" sub="Availability here updates the floor plans page on the website and sends alerts to people waiting." />
      <div className="sx-kpis">
        <Kpi label="Occupancy" value={`${occ.toFixed(1)}%`} delta={s.occupancyDelta} deltaSuffix=" pts" note="vs last month" />
        <Kpi label="Available now" value={avail} note={`of ${units} apartments`} />
        <Kpi label="On notice" value={notice} note="move-outs in the next 30 days" />
        <Kpi label="On the waitlist" value={waitlist.length} note={`${waitlist.filter((w) => w.deposit).length} with a priority deposit`} />
        <Kpi label="Move-ins this month" value={moves.ins.length} note={`${moves.outs.length} move-outs`} />
      </div>

      <div className="sx-grid g-21">
        <Card title="Availability by floor plan" pad={false}>
          <div className="sx-table-wrap">
            <table className="sx-table">
              <thead>
                <tr><th>Plan</th><th className="num">From</th><th className="num">Units</th><th className="num">Available</th><th className="num">On notice</th><th className="num">Waitlist</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.code}>
                    <td><b>{r.code} · {r.name}</b><small>{planKindLabel[r.kind]}{r.sqft ? ` · ${r.sqft.toLocaleString("en-US")} sq ft` : ""}</small></td>
                    <td className="num">{r.from ? money(r.from) : "Call"}</td>
                    <td className="num">{r.units}</td>
                    <td className="num">{r.available ? <Badge tone="good">{r.available}</Badge> : <span className="sx-hint">0</span>}</td>
                    <td className="num">{r.notice || <span className="sx-hint">0</span>}</td>
                    <td className="num">{r.waitlist ? <Badge tone="warn">{r.waitlist}</Badge> : <span className="sx-hint">0</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <div className="sx-grid">
          <Card title="Occupancy by neighborhood">
            <ul className="sx-trips">
              {kinds.map((k) => (
                <li key={k.k}>
                  <div className="top"><b>{planKindLabel[k.k]}</b><span>{k.occ.toFixed(1)}% · {k.u} units</span></div>
                  <Meter v={k.occ} tone={k.k === "lantern" ? "var(--brick)" : "var(--green)"} />
                </li>
              ))}
            </ul>
            <p className="sx-note">{community.residents} residents in {community.occupied} apartments.</p>
          </Card>
          <Card title="Availability alerts sent">
            <ul className="sx-list">
              {alerts.map((a) => (
                <li key={a.plan}>
                  <b>{a.plan} alert sent to {a.sent} people {date(-a.days)}</b>
                  <br />
                  <span className="sx-hint">{a.text} · {a.opened} opened · {a.tours} tour{a.tours > 1 ? "s" : ""} booked</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <div className="sx-grid g-21">
        <Card title="Waitlist" sub="In priority order. A refundable $1,000 priority deposit holds a place." pad={false}>
          <div className="sx-table-wrap">
            <table className="sx-table">
              <thead><tr><th className="num">#</th><th>Name</th><th>Plan</th><th>Joined</th><th>Priority deposit</th></tr></thead>
              <tbody>
                {[...waitlist].sort((a, b) => Number(b.deposit) - Number(a.deposit) || b.joinedDays - a.joinedDays).map((w, i) => (
                  <tr key={w.name}>
                    <td className="num">{i + 1}</td>
                    <td><b>{w.name}</b>{w.note && <small>{w.note}</small>}</td>
                    <td>{w.plan}</td>
                    <td>{date(-w.joinedDays)}{addDays(t, -w.joinedDays).getUTCFullYear() !== t.getUTCFullYear() ? `, ${addDays(t, -w.joinedDays).getUTCFullYear()}` : ""}</td>
                    <td>{w.deposit ? <Badge tone="good"><Icon name="check" /> Paid</Badge> : <span className="sx-hint">No</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="Moves this month">
          <h3 className="tour-day">Move-ins</h3>
          <ul className="sx-list">
            {moves.ins.map((m) => (
              <li key={m.name}><b>{m.name}</b> <Badge tone={m.days > 0 ? "info" : "good"}>{m.days > 0 ? `Moving in ${dayLabel(m.days)}` : `Moved in ${date(m.days)}`}</Badge><br /><span className="sx-hint">{m.plan} · Apt {m.apt}</span></li>
            ))}
          </ul>
          <h3 className="tour-day" style={{ marginTop: 16 }}>Move-outs</h3>
          <ul className="sx-list">
            {moves.outs.map((m) => (
              <li key={m.name}><b>{m.name}</b> <Badge tone="warn">{date(m.days)}</Badge><br /><span className="sx-hint">{m.plan} · {m.note}</span></li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
