import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Image from "next/image";
import "@/app/staff/reports.css";
import "@/app/staff/automations.css";
import Link from "next/link";
import { AutoSummaryCard } from "@/components/staff/portal/AutoSummary";
import { weekSummary } from "@/data/staff/automations";
import { scorecardSurveys } from "@/data/staff/surveys";
import "@/app/staff/surveys.css";
import { accessOf } from "@/data/staff/shared";
import { Icon } from "@/components/Icon";
import { ReportTabs } from "@/components/staff/portal/CalendarTabs";
import { Help } from "@/components/staff/portal/Help";
import { NotYours } from "@/components/staff/portal/NotYours";
import { ReportsActions } from "@/components/staff/portal/ReportsActions";
import { Leadership } from "@/components/staff/portal/ReportsLeadership";
import { EvidenceNotes, EvidenceTable, LeadsBySource, PromiseStatusMark, nextFirst, show } from "@/components/staff/portal/ReportsParts";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { Card, Delta, Meter, PageHead, fmt, pctChange } from "@/components/staff/ui";
import { scorecardMonths } from "@/data/staff";
import { sectionAccess } from "@/data/staff/access";
import { adoption, evidence, promises } from "@/data/staff/alpha";
import { prospectNumbers } from "@/data/staff/reports";
import { getStaffCommunity } from "@/data/staff/server";

export const metadata: Metadata = { title: "Monthly scorecard" };

/** Monthly figures that are outcomes (shown in "Evidence we track"); the rest are reach and activity. */
const evidenceKeys = new Set(["Enquiries", "Tours", "Deposits", "Move-ins", "Occupancy", "Google rating"]);

export default async function ScorecardPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { as, access } = await sectionAccess("reports");
  if (!access) return <NotYours section="Reports" />;
  const canAuto = !!accessOf(as, "automations");
  // Activities staff open Reports on Engagement; the scorecard is a tab for them.
  if (access === "community" && (await searchParams).tab !== "scorecard") redirect("/staff/reports/engagement");
  const sc = await getStaffCommunity();
  const tabs = <ReportTabs access={access} />;
  if (!sc) return access === "full" ? <Leadership tabs={tabs} title="Monthly scorecard · All communities" /> : <PickCommunity screen="Reports" />;
  const { s } = sc;
  const m = scorecardMonths();
  const sourcesHelp = <Help label="About inquiry sources" align="end"><p>{m.month}, with {m.prev} in brackets.</p><p>Public event sign-ups count as inquiries.</p></Help>;

  // Sales: only the prospect numbers.
  if (access === "prospect-numbers") {
    const pn = prospectNumbers(s.slug);
    return (
      <>
        <PageHead title={`Prospect numbers · ${m.label}`} sub={`${s.brand.name}, compared with ${m.prev}`} />
        <div className="sx-grid g-2">
          <Card title="Prospect numbers" sub={`${m.month} and ${m.prev}`} action={<EvidenceNotes rows={pn.rows} />} pad={false}>
            <EvidenceTable rows={pn.rows} month={m.month} prev={m.prev} />
          </Card>
          <Card title="Where inquiries came from" sub={m.month} action={sourcesHelp}>
            <LeadsBySource sources={pn.sources} prevValues={pn.sourcesPrev} month={m.month} prev={m.prev} />
          </Card>
        </div>
      </>
    );
  }

  const { highlights, scoreRows, topPosts } = s;
  const sat = scorecardSurveys(s.slug);
  const ps = promises(s.slug);
  const kept = ps.filter((p) => p.status === "Kept").length;
  const ad = adoption(s.slug);
  const ev = evidence(s.slug);
  const activity = scoreRows.filter((r) => !evidenceKeys.has(r.k));
  return (
    <>
      <PageHead title={`Monthly scorecard · ${m.label}`} sub={`${s.brand.name}, compared with ${m.prev}`}>
        <ReportsActions month={m.month} to={`${s.people[s.roles.approver].name} and Wrenhaven`} next={nextFirst()} />
      </PageHead>
      {tabs}

      <div className="sx-grid g-21">
        <Card
          title={`Our ${ps.length} promises`}
          sub={`${kept} of ${ps.length} kept${ps.length - kept ? ` · ${ps.length - kept} at risk` : ""}`}
          action={<Help label="How promises are checked" align="end"><p>Each promise is checked every month from Kinlight’s own records: the approval log, delivery reports, uptime and the page history.</p><p>Nobody fills in a spreadsheet.</p></Help>}
          pad={false}
        >
          <div className="sx-table-wrap">
            <table className="sx-table rp-promises">
              <thead><tr><th>Promise</th><th>Status</th><th>Evidence</th></tr></thead>
              <tbody>
                {ps.map((p) => (
                  <tr key={p.code}>
                    <td><span className="sc-code">{p.code}</span> <b>{p.promise}</b><small>{p.target}</small></td>
                    <td className="rp-nowrap"><PromiseStatusMark status={p.status} /></td>
                    <td><small style={{ marginTop: 0 }}>{p.evidence}</small>{p.href && canAuto && <Link className="sx-link rp-ev-link" href={p.href}>{p.hrefLabel}</Link>}</td>
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
          <Card title="Top posts" sub="By reach">
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
        <AutoSummaryCard w={weekSummary(s.slug)} link={canAuto} />
        <Card title="Satisfaction" sub="Family and resident surveys, before go-live and now" action={<Help label="Where this comes from" align="end"><p>From the Family satisfaction and Resident satisfaction surveys in Surveys: their real answers, as percentages of the best score (the recommend question is out of 10).</p></Help>}>
          <ul className="su-sc">
            {[...sat.family.qs.map((q) => ({ ...q, who: "Families" })), ...sat.resident.qs.map((q) => ({ ...q, who: "Residents" }))].map((q) => (
              <li key={q.who + q.q}><span>{q.q}<small>{q.who}</small></span><b>{q.before}{q.now > 10 ? "%" : ""} → {q.now}{q.now > 10 ? "%" : ""}</b></li>
            ))}
          </ul>
          <p className="au-rep-link"><Link className="sx-link" href="/staff/reports/surveys">Survey results <Icon name="right" /></Link> · {sat.family.answered} of {sat.family.sent} families answered</p>
        </Card>
      </div>

      <div className="sx-grid g-2">
        <Card title="Adoption" sub="Is the team using it?" action={<Help label="About adoption" align="end"><p>Whether staff are adding photos and events, and whether families are reading them. Measured every month against the alpha’s targets.</p><p>Time saved comes from the team’s time diary.</p></Help>} pad={false}>
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
                      {a.href && canAuto && <Link className="sx-link rp-ev-link" href={a.href}>{a.hrefLabel}</Link>}
                    </td>
                    <td><small style={{ marginTop: 0 }}>{a.target}</small>{a.ok ? <span className="sc-status hit"><Icon name="check" /> On track</span> : <span className="sc-status miss"><Icon name="minus" /> Behind</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="Evidence we track" sub={`${m.month} and ${m.prev}`} action={<EvidenceNotes rows={ev} />} pad={false}>
          <EvidenceTable rows={ev} month={m.month} prev={m.prev} />
        </Card>
      </div>

      <div className="sx-grid g-2">
        <Card title="Reach and activity" sub={`${m.month} and ${m.prev}`} pad={false}>
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
        <Card title="Where inquiries came from" sub={m.month} action={sourcesHelp}>
          <LeadsBySource sources={s.enquirySources} prevValues={s.enquirySourcesPrev} month={m.month} prev={m.prev} />
        </Card>
      </div>
    </>
  );
}
