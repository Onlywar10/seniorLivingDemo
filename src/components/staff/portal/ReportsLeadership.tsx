// The leadership view: every community side by side, with each one's promises, adoption and requests waiting.
// Works whichever community is selected, and when "All communities" is.
import type { ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { OpenCommunity } from "@/components/staff/StaffCommunity";
import { Badge, Card, Kpi, Meter, PageHead, fmt } from "@/components/staff/ui";
import { scorecardMonths } from "@/data/staff";
import { evidence, leadershipRow } from "@/data/staff/alpha";
import { concerns } from "@/data/staff/engage";
import { communitySlugs } from "@/lib/sites";
import { Help } from "./Help";
import { ComingLater, PromiseStatusMark, nextFirst, show } from "./ReportsParts";
import { ReportsActions } from "./ReportsActions";

export function Leadership({ tabs, title = "All communities" }: { tabs: ReactNode; title?: string }) {
  const rows = communitySlugs.map((slug) => {
    const r = leadershipRow(slug);
    // Care concerns go to the care team and its own system, so they aren’t open concerns here.
    const concernsOpen = concerns(slug).filter((c) => !c.care && c.status !== "Resolved").length;
    return { ...r, concernsOpen, waiting: r.approvals + r.rsvpsWaiting + r.seatsWaiting + r.askWaiting + concernsOpen };
  });
  const m = scorecardMonths();
  const sum = (f: (r: (typeof rows)[number]) => number) => rows.reduce((n, r) => n + f(r), 0);
  const ev = communitySlugs.map(evidence);
  const evLabels = ev[0].map((e) => e.label);
  const adoptionCodes = rows[0].adoption.map((a) => a.code);
  const promiseCount = rows[0].promises.length;

  return (
    <>
      <PageHead title={title} sub={`Wrenhaven · ${m.label} · ${rows.length} communities side by side`}>
        <Help label="About the monthly report" align="end">
          <p>Each community’s one-page report is emailed on the 1st to its executive director and to Wrenhaven leadership. Next on {nextFirst()}.</p>
          <p>Every approval, booking, check-in and reply feeds it on its own: nobody fills in a spreadsheet.</p>
        </Help>
        <ReportsActions month={m.month} to="Wrenhaven leadership" next={nextFirst()} />
      </PageHead>
      {tabs}

      <div className="sx-kpis">
        <Kpi label="Promises kept" value={<>{sum((r) => r.kept)}<small> / {rows.length * promiseCount}</small></>} note={`${m.month}, all communities`} />
        <Kpi label="Adoption measures met" value={<>{sum((r) => r.adoptionOk)}<small> / {rows.length * adoptionCodes.length}</small></>} note="against the targets" />
        <Kpi label="Families reached this week" value={<>{fmt(sum((r) => r.familiesReached))}<small> / {fmt(sum((r) => r.families))}</small></>} note="opened at least one message" />
        <Kpi label="Requests waiting" value={sum((r) => r.waiting)} note="approvals, family requests and concerns" />
      </div>

      <Card title="Side by side" sub={m.month} pad={false}>
        <div className="sx-table-wrap">
          <table className="sx-table">
            <thead>
              <tr>
                <th>Community</th>
                <th className="num">Promises kept</th>
                <th className="num">Adoption met</th>
                <th className="num">Families reached</th>
                <th className="num">Inquiries</th>
                <th>Requests waiting</th>
                <th><span className="vh">Open</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.slug}>
                  <td><b>{r.name}</b><small>{r.city}</small></td>
                  <td className="num"><b>{r.kept}</b><small>of {r.promises.length}</small></td>
                  <td className="num"><b>{r.adoptionOk}</b><small>of {r.adoption.length}</small></td>
                  <td className="num">{r.familiesReached}<small>of {r.families} · {r.openRate}% opened</small></td>
                  <td className="num">{r.inquiries}<small>{r.tours} tours</small></td>
                  <td>
                    {r.waiting ? <Badge tone="accent">{r.waiting} waiting</Badge> : <Badge tone="good">None</Badge>}
                    <small>
                      {[
                        r.approvals && `${r.approvals} to approve`,
                        r.rsvpsWaiting + r.seatsWaiting && `${r.rsvpsWaiting + r.seatsWaiting} family requests`,
                        r.askWaiting && `${r.askWaiting} to ask in person`,
                        r.concernsOpen && `${r.concernsOpen} open concerns`,
                      ].filter(Boolean).join(" · ")}
                    </small>
                  </td>
                  <td><OpenCommunity slug={r.slug} name={r.name} className="sx-btn sx-btn-sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <h2 className="ld-h">The {promiseCount} promises · {m.month}</h2>
      <div className="ov-grid">
        {rows.map((r) => (
          <Card key={r.slug} title={<>{r.name} <Badge tone={r.kept === r.promises.length ? "good" : "warn"}>{r.kept} of {r.promises.length} kept</Badge></>} action={<OpenCommunity slug={r.slug} name={r.name} />}>
            <ul className="ld-promises">
              {r.promises.map((p) => (
                <li key={p.code}>
                  <span className="ld-code">{p.code}</span>
                  <span>
                    <b>{p.promise}</b> <PromiseStatusMark status={p.status} />
                    <small>{p.evidence}</small>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Card title="Adoption" sub="Is each team using it?" pad={false}>
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
                        <td key={r.slug} className="rp-ad">
                          <span className="ld-ad">
                            {a.ok ? <span className="sc-status hit"><Icon name="check" /> Met</span> : <span className="sc-status miss"><Icon name="minus" /> Not yet</span>}
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
        <Card title="Evidence we track" sub={`${m.month}, with ${m.prev} underneath`} action={<Help label="About evidence" align="end"><p>Outcomes we follow and compare, never promise, so there are no targets.</p></Help>} pad={false}>
          <div className="sx-table-wrap">
            <table className="sx-table">
              <thead>
                <tr>
                  <th>Outcome</th>
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
              </tbody>
            </table>
          </div>
        </Card>
        <div className="sx-grid">
          <ComingLater when="Coming in Full House" title="Occupancy, deposits and move-in tracking">
            <p>Conversion from inquiry to move-in, deposits and occupancy stay in your own sales system for now.</p>
            <p>Inquiries, tours and move-ins are already in the evidence.</p>
          </ComingLater>
        </div>
      </div>
    </>
  );
}
