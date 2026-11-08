import type { Metadata } from "next";
import Image from "next/image";
import { Icon } from "@/components/Icon";
import { Overview } from "@/components/staff/Overview";
import { Badge, Card, Delta, Meter, PageHead, fmt, pctChange } from "@/components/staff/ui";
import { scorecardMonths } from "@/data/staff";
import { adoption, evidence, promises, type PromiseStatus } from "@/data/staff/alpha";
import { getStaffCommunity } from "@/data/staff/server";

export const metadata: Metadata = { title: "Monthly scorecard" };

const show = (v: number, f?: string) => (f === "pct" ? `${v}%` : f === "dec" ? v.toFixed(1) + (v > 10 ? "%" : "") : fmt(v));
const promiseTone: Record<PromiseStatus, "good" | "warn" | "bad" | "neutral"> = { Kept: "good", "At risk": "warn", Missed: "bad", "Not due yet": "neutral" };

/** Rows the "Evidence we track" section shows as outcomes; the rest of the monthly figures are reach and activity. */
const evidenceKeys = new Set(["Enquiries", "Tours", "Deposits", "Move-ins", "Occupancy", "Google rating"]);

/** A plain change against last month, with no good or bad colouring: these are outcomes we track, not promise. */
function change(now: number, prev: number, fmtKind?: string) {
  if (!prev) return "New this month";
  const d = Number((now - prev).toFixed(1));
  if (d === 0) return "No change";
  const sign = d > 0 ? "+" : "−";
  if (fmtKind === "pct" || fmtKind === "dec") return `${sign}${Math.abs(d).toFixed(fmtKind === "dec" ? 1 : 0)}${fmtKind === "pct" || now > 10 ? " pts" : ""}`;
  return `${sign}${fmt(Math.abs(d))} (${sign}${Math.abs(pctChange(now, prev))}%)`;
}

export default async function ScorecardPage() {
  const sc = await getStaffCommunity();
  if (!sc) return <Overview screen="scorecard" />;
  const { s } = sc;
  const { enquirySources, enquirySourcesPrev, highlights, scoreRows, topPosts } = s;
  const m = scorecardMonths();
  const ps = promises(s.slug);
  const kept = ps.filter((p) => p.status === "Kept").length;
  const ad = adoption(s.slug);
  const ev = evidence(s.slug);
  const activity = scoreRows.filter((r) => !evidenceKeys.has(r.k));
  const maxSrc = Math.max(...enquirySources.map((s) => s.value), ...enquirySourcesPrev);
  return (
    <>
      <PageHead title={`Monthly scorecard · ${m.label}`} sub={`${s.brand.name}: the promises Kinlight made, how the team is using it, and the outcomes we track, compared with ${m.prev}. Shared with ${s.people[s.roles.approver].name} and Wrenhaven Senior Living.`}>
        <button type="button" className="sx-btn"><Icon name="download" /> Download PDF</button>
        <button type="button" className="sx-btn sx-btn-primary"><Icon name="mail" /> Email to the team</button>
      </PageHead>

      <div className="sx-grid g-21">
        <Card title={`Our ${ps.length} promises this month`} sub={`${kept} of ${ps.length} kept${ps.length - kept ? ` · ${ps.length - kept} at risk` : ""}`} pad={false}>
          <div className="sx-table-wrap">
            <table className="sx-table">
              <thead><tr><th>Promise</th><th>Target</th><th>Status</th><th>Evidence</th></tr></thead>
              <tbody>
                {ps.map((p) => (
                  <tr key={p.code}>
                    <td><span className="sc-code">{p.code}</span> <b>{p.promise}</b></td>
                    <td><small style={{ marginTop: 0 }}>{p.target}</small></td>
                    <td style={{ whiteSpace: "nowrap" }}><Badge tone={promiseTone[p.status]}>{p.status === "Kept" && <Icon name="check" />} {p.status}</Badge></td>
                    <td><small style={{ marginTop: 0 }}>{p.evidence}</small></td>
                  </tr>
                ))}
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

      <div className="sx-grid g-2">
        <Card title="Adoption" sub="Is the team using it, and are families reading it?" pad={false}>
          <div className="sx-table-wrap">
            <table className="sx-table">
              <thead><tr><th>Measure</th><th>This month</th><th>Target</th></tr></thead>
              <tbody>
                {ad.map((a) => (
                  <tr key={a.code}>
                    <td><span className="sc-code">{a.code}</span> <b>{a.measure}</b></td>
                    <td>
                      {a.value}
                      <Meter v={a.pct} tone={a.ok ? "var(--green)" : "var(--terra)"} label={`${a.pct}% of target`} />
                      {a.note && <small>{a.note}</small>}
                    </td>
                    <td><small style={{ marginTop: 0 }}>{a.target}</small>{a.ok ? <span className="sc-status hit"><Icon name="check" /> On track</span> : <span className="sc-status miss"><Icon name="minus" /> Behind</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="Evidence we track" sub={`Outcomes we follow and compare with ${m.prev}. Not promises, so no targets.`} pad={false}>
          <div className="sx-table-wrap">
            <table className="sx-table">
              <thead><tr><th>Outcome</th><th className="num">{m.month}</th><th className="num">{m.prev}</th><th>Change</th></tr></thead>
              <tbody>
                {ev.map((r) => (
                  <tr key={r.label}>
                    <td><b>{r.label}</b></td>
                    <td className="num"><b>{show(r.now, r.fmt)}</b></td>
                    <td className="num">{r.prev ? show(r.prev, r.fmt) : "–"}</td>
                    <td className="sx-hint" style={{ whiteSpace: "nowrap" }}>{change(r.now, r.prev, r.fmt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="sx-grid g-2">
        <Card title="Reach and activity" sub={`${m.month} compared with ${m.prev}`} pad={false}>
          <div className="sx-table-wrap">
            <table className="sx-table">
              <thead><tr><th>Measure</th><th className="num">{m.month}</th><th className="num">{m.prev}</th><th>Change</th></tr></thead>
              <tbody>
                {activity.map((r) => {
                  const pts = r.fmt === "pct" || r.k.includes("score") || r.k.includes("visibility");
                  return (
                    <tr key={r.k}>
                      <td><b>{r.k}</b></td>
                      <td className="num"><b>{show(r.now, r.fmt)}</b></td>
                      <td className="num">{show(r.prev, r.fmt)}</td>
                      <td><Delta v={pts ? Number((r.now - r.prev).toFixed(1)) : pctChange(r.now, r.prev)} suffix={pts ? " pts" : "%"} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Leads by source" sub={`${m.month} compared with ${m.prev}. Public event sign-ups count as leads.`}>
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
      </div>
    </>
  );
}
