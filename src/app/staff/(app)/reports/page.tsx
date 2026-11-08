import type { Metadata } from "next";
import Image from "next/image";
import "@/app/staff/reports.css";
import { Icon } from "@/components/Icon";
import { ReportTabs } from "@/components/staff/portal/CalendarTabs";
import { NotYours } from "@/components/staff/portal/NotYours";
import { ReportsActions } from "@/components/staff/portal/ReportsActions";
import { Leadership } from "@/components/staff/portal/ReportsLeadership";
import { EvidenceTable, LeadsBySource, nextFirst, show } from "@/components/staff/portal/ReportsParts";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { Badge, Card, Delta, Meter, PageHead, fmt, pctChange } from "@/components/staff/ui";
import { scorecardMonths } from "@/data/staff";
import { sectionAccess } from "@/data/staff/access";
import { adoption, evidence, promises, type PromiseStatus } from "@/data/staff/alpha";
import { prospectNumbers } from "@/data/staff/reports";
import { getStaffCommunity } from "@/data/staff/server";

export const metadata: Metadata = { title: "Monthly scorecard" };

const promiseTone: Record<PromiseStatus, "good" | "warn" | "bad" | "neutral"> = { Kept: "good", "At risk": "warn", Missed: "bad", "Not due yet": "neutral" };

/** Monthly figures that are outcomes (shown in "Evidence we track"); the rest are reach and activity. */
const evidenceKeys = new Set(["Enquiries", "Tours", "Deposits", "Move-ins", "Occupancy", "Google rating"]);

export default async function ScorecardPage() {
  const { access } = await sectionAccess("reports");
  if (!access) return <NotYours section="Reports" />;
  const sc = await getStaffCommunity();
  const tabs = <ReportTabs access={access} />;
  if (!sc) return access === "full" ? <Leadership tabs={tabs} title="Monthly scorecard · All communities" /> : <PickCommunity screen="Reports" />;
  const { s } = sc;
  const m = scorecardMonths();

  // Sales: only the prospect numbers.
  if (access === "prospect-numbers") {
    const pn = prospectNumbers(s.slug);
    return (
      <>
        <PageHead title={`Prospect numbers · ${m.label}`} sub={`${s.brand.name}: inquiries, how fast they heard from a person, tours and move-ins, compared with ${m.prev}. Numbers we track, not targets.`} />
        <div className="sx-grid g-2">
          <Card title="Prospect numbers" sub={`${m.month} compared with ${m.prev}`} pad={false}>
            <EvidenceTable rows={pn.rows} month={m.month} prev={m.prev} />
          </Card>
          <Card title="Where inquiries came from" sub={`${m.month}, with ${m.prev} in brackets. Public event sign-ups count as inquiries.`}>
            <LeadsBySource sources={pn.sources} prevValues={pn.sourcesPrev} month={m.month} prev={m.prev} />
          </Card>
        </div>
      </>
    );
  }

  const { highlights, scoreRows, topPosts } = s;
  const ps = promises(s.slug);
  const kept = ps.filter((p) => p.status === "Kept").length;
  const ad = adoption(s.slug);
  const ev = evidence(s.slug);
  const activity = scoreRows.filter((r) => !evidenceKeys.has(r.k));
  return (
    <>
      <PageHead title={`Monthly scorecard · ${m.label}`} sub={`${s.brand.name}: the promises Kinlight made, how the team is using it, and the outcomes we track, compared with ${m.prev}.`}>
        <ReportsActions month={m.month} to={`${s.people[s.roles.approver].name} and Wrenhaven`} next={nextFirst()} />
      </PageHead>
      {tabs}

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
                    <td className="rp-nowrap"><Badge tone={promiseTone[p.status]}>{p.status === "Kept" && <Icon name="check" />} {p.status}</Badge></td>
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
          <EvidenceTable rows={ev} month={m.month} prev={m.prev} />
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
        <Card title="Where inquiries came from" sub={`${m.month}, with ${m.prev} in brackets. Public event sign-ups count as inquiries.`}>
          <LeadsBySource sources={s.enquirySources} prevValues={s.enquirySourcesPrev} month={m.month} prev={m.prev} />
        </Card>
      </div>
    </>
  );
}
