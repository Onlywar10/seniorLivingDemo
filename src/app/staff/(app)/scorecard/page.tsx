import type { Metadata } from "next";
import Image from "next/image";
import { Icon } from "@/components/Icon";
import { Overview } from "@/components/staff/Overview";
import { Card, Delta, PageHead, fmt, pctChange } from "@/components/staff/ui";
import { scorecardMonths } from "@/data/staff";
import { getStaffCommunity } from "@/data/staff/server";

export const metadata: Metadata = { title: "Monthly scorecard" };

const show = (v: number, f?: string) => (f === "pct" ? `${v}%` : f === "dec" ? (v % 1 ? v.toFixed(1) : v.toFixed(1)) + (v > 10 ? "%" : "") : fmt(v));

export default async function ScorecardPage() {
  const sc = await getStaffCommunity();
  if (!sc) return <Overview screen="scorecard" />;
  const { s } = sc;
  const { enquirySources, enquirySourcesPrev, highlights, scoreRows, topPosts } = s;
  const m = scorecardMonths();
  const hit = scoreRows.filter((r) => r.now >= r.target).length;
  const maxSrc = Math.max(...enquirySources.map((s) => s.value), ...enquirySourcesPrev);
  return (
    <>
      <PageHead title={`Monthly scorecard · ${m.label}`} sub={`${s.brand.name} compared with ${m.prev} and this month’s targets. Shared with ${s.people[s.roles.approver].name} and Tenfold Senior Living.`}>
        <button type="button" className="sx-btn"><Icon name="download" /> Download PDF</button>
        <button type="button" className="sx-btn sx-btn-primary"><Icon name="mail" /> Email to the team</button>
      </PageHead>

      <div className="sx-grid g-21">
        <Card title="Key metrics" sub={`${hit} of ${scoreRows.length} on or above target`} pad={false}>
          <div className="sx-table-wrap">
            <table className="sx-table">
              <thead><tr><th>Metric</th><th className="num">{m.month}</th><th className="num">{m.prev}</th><th>Change</th><th className="num">Target</th><th>Status</th></tr></thead>
              <tbody>
                {scoreRows.map((r) => {
                  const diff = r.fmt === "pct" || r.fmt === "dec" || r.k.includes("score") || r.k.includes("visibility") ? Number((r.now - r.prev).toFixed(1)) : pctChange(r.now, r.prev);
                  const suf = r.fmt === "pct" || (r.fmt === "dec" && r.now > 10) || r.k.includes("score") || r.k.includes("visibility") ? " pts" : r.fmt === "dec" ? "" : "%";
                  return (
                    <tr key={r.k}>
                      <td><b>{r.k}</b></td>
                      <td className="num"><b>{show(r.now, r.fmt)}</b></td>
                      <td className="num">{show(r.prev, r.fmt)}</td>
                      <td><Delta v={diff} suffix={suf} /></td>
                      <td className="num">{show(r.target, r.fmt)}</td>
                      <td>{r.now >= r.target ? <span className="sc-status hit"><Icon name="check" /> On target</span> : <span className="sc-status miss"><Icon name="minus" /> Below</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
        <div className="sx-grid">
          <Card title="Highlights">
            <ul className="hl">
              {highlights.map((h) => <li key={h}><Icon name="star" /><span>{h}</span></li>)}
            </ul>
          </Card>
          <Card title="Top posts" sub="By families reached and opens">
            <ul className="top-posts">
              {topPosts.map((p) => (
                <li key={p.title}>
                  <span className="sx-thumb"><Image src={p.photo} alt="" fill sizes="56px" /></span>
                  <span><b>{p.title}</b><small>{p.kind} · {fmt(p.reach)} views</small></span>
                  <span className="sx-hint">{p.opens} opens</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <Card title="Leads by source" sub={`${m.month} compared with ${m.prev}`}>
        <ul className="sx-legend">
          <li><i style={{ background: "var(--green)" }} />{m.month}</li>
          <li><i style={{ background: "#cdbfa5" }} />{m.prev}</li>
        </ul>
        <ul className="sx-hbars">
          {enquirySources.map((s, i) => (
            <li key={s.label}>
              <span className="sx-hb-l">{s.label}</span>
              <span className="sx-hb-v">{s.value} <small>({enquirySourcesPrev[i]})</small></span>
              <span className="sx-hb-track" style={{ display: "grid", gap: 2, height: "auto", background: "none", borderRadius: 0 }}>
                <span className="sx-hb-bar" style={{ width: `${(s.value / maxSrc) * 100}%`, background: "var(--green)", height: 10 }} />
                <span className="sx-hb-bar" style={{ width: `${(enquirySourcesPrev[i] / maxSrc) * 100}%`, background: "#cdbfa5", height: 6 }} />
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
