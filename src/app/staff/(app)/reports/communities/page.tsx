import type { Metadata } from "next";
import { NotYours } from "@/components/staff/portal/NotYours";
import { sectionsFor } from "@/data/staff/shared";
import { getStaffRole as getRole } from "@/data/staff/server";
import { ReportTabs } from "@/components/staff/portal/CalendarTabs";
import { Icon } from "@/components/Icon";
import { OpenCommunity } from "@/components/staff/StaffCommunity";
import { Badge, Card, Kpi, Meter, PageHead, fmt } from "@/components/staff/ui";
import { occupancy, scorecardMonths } from "@/data/staff";
import { evidence, leadershipRow, type PromiseStatus } from "@/data/staff/alpha";
import { communitySlugs } from "@/lib/sites";

export const metadata: Metadata = { title: "All communities" };

const promiseTone: Record<PromiseStatus, "good" | "warn" | "bad" | "neutral"> = { Kept: "good", "At risk": "warn", Missed: "bad", "Not due yet": "neutral" };
const show = (v: number, f?: string) => (f === "pct" ? `${v}%` : f === "dec" ? (v > 10 ? `${v.toFixed(1)}%` : v.toFixed(1)) : fmt(v));

export default async function LeadershipPage() {
  const as = await getRole();
  if (!sectionsFor[as].includes("reports")) return <NotYours section="Reports" who={as === "sales" ? "sales" : as === "events" ? "the events team" : "your"} />;
  const rows = communitySlugs.map(leadershipRow);
  const m = scorecardMonths();
  const sum = (f: (r: (typeof rows)[number]) => number) => rows.reduce((n, r) => n + f(r), 0);
  const units = communitySlugs.map(occupancy);
  const occ = units.reduce((n, o) => n + o.pct * o.units, 0) / units.reduce((n, o) => n + o.units, 0);
  const ev = communitySlugs.map(evidence);
  const evLabels = ev[0].map((e) => e.label);
  const adoptionCodes = rows[0].adoption.map((a) => a.code);

  return (
    <>
      <PageHead title="All communities" sub={`Wrenhaven leadership view · ${m.label} · ${rows.length} communities side by side, whichever community is selected.`}>
        <button type="button" className="sx-btn"><Icon name="download" /> Day-90 results report</button>
        <button type="button" className="sx-btn sx-btn-primary"><Icon name="mail" /> Email the scorecards</button>
      </PageHead>
      <ReportTabs />

      <div className="sx-kpis">
        <Kpi label="Families reached this week" value={<>{fmt(sum((r) => r.familiesReached))}<small> / {fmt(sum((r) => r.families))}</small></>} note="opened at least one message" />
        <Kpi label="Posts this month" value={sum((r) => r.postsMonth)} note={`${sum((r) => r.postsWeek)} this week`} />
        <Kpi label="Inquiries this month" value={sum((r) => r.inquiries)} note={`${sum((r) => r.tours)} tours`} />
        <Kpi label="Promises kept" value={<>{sum((r) => r.kept)}<small> / {rows.length * 11}</small></>} note="this month, all communities" />
        <Kpi label="Waiting on staff" value={sum((r) => r.approvals + r.rsvpsWaiting + r.seatsWaiting)} note="approvals, RSVPs and seat requests" />
      </div>

      <Card title="Key numbers" sub={`${m.month} · open a community to see its own screens`} pad={false}>
        <div className="sx-table-wrap">
          <table className="sx-table">
            <thead>
              <tr>
                <th>Community</th>
                <th className="num">Families reached</th>
                <th className="num">Posts</th>
                <th className="num">Digest opened</th>
                <th className="num">Inquiries</th>
                <th className="num">Tours</th>
                <th className="num">Occupancy</th>
                <th className="num">Approvals waiting</th>
                <th className="num">RSVPs waiting</th>
                <th><span className="vh">Open</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.slug}>
                  <td><b>{r.name}</b><small>{r.city}</small></td>
                  <td className="num">{r.familiesReached}<small>of {r.families}</small></td>
                  <td className="num">{r.postsMonth}<small>{r.postsWeek} this week</small></td>
                  <td className="num">{r.openRate}%</td>
                  <td className="num">{r.inquiries}<small>{r.inquiriesPrev} last month</small></td>
                  <td className="num">{r.tours}<small>{r.toursPrev} last month</small></td>
                  <td className="num">{r.occupancy.toFixed(1)}%<small>tracked</small></td>
                  <td className="num">{r.approvals ? <Badge tone="accent">{r.approvals}</Badge> : <Badge tone="good">0</Badge>}</td>
                  <td className="num">{r.rsvpsWaiting ? <Badge tone="accent">{r.rsvpsWaiting}</Badge> : <Badge tone="good">0</Badge>}{r.seatsWaiting > 0 && <small>+{r.seatsWaiting} seat requests</small>}</td>
                  <td><OpenCommunity slug={r.slug} name={r.name} className="sx-btn sx-btn-sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <h2 className="ld-h">The 11 promises · {m.month}</h2>
      <div className="ov-grid">
        {rows.map((r) => (
          <Card key={r.slug} title={<>{r.name} <Badge tone={r.kept === r.promises.length ? "good" : "warn"}>{r.kept} of {r.promises.length} kept</Badge></>} action={<OpenCommunity slug={r.slug} name={r.name} />}>
            <ul className="ld-promises">
              {r.promises.map((p) => (
                <li key={p.code}>
                  <span className="ld-code">{p.code}</span>
                  <span>
                    <b>{p.promise}</b> <Badge tone={promiseTone[p.status]}>{p.status}</Badge>
                    <small>{p.evidence}</small>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Card title="Adoption" sub="Is each team using it? Measured every month against the alpha’s adoption targets" pad={false}>
        <div className="sx-table-wrap">
          <table className="sx-table">
            <thead>
              <tr>
                <th>Measure</th>
                {rows.map((r) => <th key={r.slug}>{r.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {adoptionCodes.map((code, i) => {
                const a0 = rows[0].adoption[i];
                return (
                  <tr key={code}>
                    <td><b>{code} · {a0.measure}</b><small>{a0.target}</small></td>
                    {rows.map((r) => {
                      const a = r.adoption.find((x) => x.code === code);
                      return a ? (
                        <td key={r.slug} style={{ minWidth: 200 }}>
                          <span className="ld-ad">
                            {a.ok ? <Badge tone="good"><Icon name="check" /> Met</Badge> : <Badge tone="warn">Not yet</Badge>}
                            <Meter v={a.pct} tone={a.ok ? "var(--green)" : "var(--olive)"} label={`${a.pct}%`} />
                          </span>
                          <small>{a.value}{a.note ? ` · ${a.note}` : ""}</small>
                        </td>
                      ) : <td key={r.slug}>–</td>;
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="sx-grid g-21">
        <Card title="Tracked evidence" sub={`${m.month} against ${m.prev}. Occupancy, deposits and move-ins are tracked and compared, never promised: no targets here.`} pad={false}>
          <div className="sx-table-wrap">
            <table className="sx-table">
              <thead>
                <tr>
                  <th>Measure</th>
                  {rows.map((r) => <th key={r.slug} className="num">{r.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {evLabels.map((label) => (
                  <tr key={label}>
                    <td>{label}</td>
                    {ev.map((list, i) => {
                      const e = list.find((x) => x.label === label);
                      return (
                        <td key={rows[i].slug} className="num">
                          {e ? <><b>{show(e.now, e.fmt)}</b>{e.prev > 0 && <small>{show(e.prev, e.fmt)} in {m.prev}</small>}</> : "–"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr>
                  <td>Occupancy, all communities</td>
                  <td className="num" colSpan={rows.length}><b>{occ.toFixed(1)}%</b><small>weighted by apartments</small></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
        <div className="sx-grid">
          <Card title="Monthly scorecard">
            <ul className="sx-list">
              <li><b>Scorecard PDF emailed</b><br /><span className="sx-hint">Each community’s scorecard goes to its Executive Director and to Wrenhaven leadership on the 1st of the month. Last sent: the {m.label} scorecard.</span></li>
              <li><b>Every approval, booking and attendance count</b><br /><span className="sx-hint">feeds the scorecard automatically; nobody fills in a spreadsheet.</span></li>
            </ul>
          </Card>
          <Card title="Day-90 results report">
            <p className="sx-hint" style={{ margin: 0 }}>
              At day 90 each community gets a results report: the 11 promises, the adoption measures, the family and staff surveys before and after, and the tracked evidence, with the full data export.
            </p>
            <p style={{ margin: "12px 0 0" }}>
              <button type="button" className="sx-btn sx-btn-sm"><Icon name="download" /> Download the report</button>
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
