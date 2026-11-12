import type { Metadata } from "next";
import { NotYours } from "@/components/staff/portal/NotYours";
import "@/app/staff/reports.css";
import { mayOpen } from "@/components/staff/portal/ReportsNav";
import { NotThisReport } from "@/components/staff/portal/ReportsParts";
import { sectionAccess } from "@/data/staff/access";
import { ReportTabs } from "@/components/staff/portal/CalendarTabs";
import { Help } from "@/components/staff/portal/Help";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { Badge, Card, Delta, Kpi, PageHead } from "@/components/staff/ui";
import { surveys, type SurveyQ } from "@/data/staff/alpha";
import { getStaffCommunity } from "@/data/staff/server";

export const metadata: Metadata = { title: "Surveys" };

/** Before vs now for one question, as two bars on a shared scale. */
function BeforeNow({ q }: { q: SurveyQ }) {
  const scale = q.before <= 10 && q.now <= 10 ? 10 : 100;
  const show = (v: number) => (scale === 10 ? v.toFixed(1) : `${v}%`);
  const diff = Number((q.now - q.before).toFixed(1));
  return (
    <li className="sv-q">
      <p className="sv-q-t">
        <b>{q.q}</b>
        {q.aim && <span className="sx-hint"> · aim {q.aim}</span>}
      </p>
      <div className="sv-bars" role="img" aria-label={`Before ${show(q.before)}, now ${show(q.now)}`}>
        <span className="sv-l">Before</span>
        <span className="sv-track"><span className="sv-bar before" style={{ width: `${(q.before / scale) * 100}%` }} /></span>
        <span className="sv-v">{show(q.before)}</span>
        <span className="sv-l">Now</span>
        <span className="sv-track"><span className="sv-bar" style={{ width: `${(q.now / scale) * 100}%` }} /></span>
        <span className="sv-v"><b>{show(q.now)}</b></span>
      </div>
      <Delta v={diff} suffix={scale === 10 ? "" : " pts"} label="since before go-live" />
    </li>
  );
}

export default async function SurveysPage() {
  const { access } = await sectionAccess("reports");
  if (!access) return <NotYours section="Reports" />;
  if (!mayOpen(access, "surveys")) return <NotThisReport title="Surveys" access={access} />;
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Surveys" />;
  const { s } = sc;
  const { family, staff, resident } = surveys(s.slug);
  const famRate = Math.round((family.answered / family.sent) * 100);
  const staffRate = Math.round((staff.answered / staff.sent) * 100);
  const nps = family.qs.find((q) => q.q.includes("recommend"));

  return (
    <>
      <PageHead title="Surveys" sub={`${s.brand.name}, before go-live and now`}>
        <Help label="Where results go" align="end"><p>The family survey (“I know what’s happening”, “I feel part of the community”) and the staff pulse go on the monthly scorecard as evidence: before go-live against day 90, and in the day-90 results report.</p></Help>
        <Link href="/staff/reports" className="sx-btn"><Icon name="chart" /> Monthly scorecard</Link>
      </PageHead>
      <ReportTabs access={access} />
      <div className="sx-kpis">
        <Kpi label="Family survey response" value={`${famRate}%`} note={`${family.answered} of ${family.sent} families`} />
        <Kpi label="Would recommend (0–10)" value={nps ? nps.now.toFixed(1) : "–"} delta={nps ? Number((nps.now - nps.before).toFixed(1)) : undefined} deltaSuffix="" note="since before go-live" />
        <Kpi label="Staff pulse response" value={`${staffRate}%`} note={`${staff.answered} of ${staff.sent} staff`} />
        <Kpi label="Residents surveyed" value={resident.answered} note="one to one" />
      </div>

      <div className="sx-grid g-21">
        <Card title={family.title} sub={family.when} action={<Badge tone="info">On the scorecard</Badge>}>
          <ul className="sv-qs">
            {family.qs.map((q) => <BeforeNow key={q.q} q={q} />)}
          </ul>
        </Card>
        <Card title="What families wrote" sub="In English" action={<Help label="About translations" align="end"><p>Translated into English; the original is kept underneath.</p></Help>}>
          <ul className="sx-list">
            {family.comments.map((c) => (
              <li key={c.text}>
                <p className="sv-c">“{c.en ?? c.text}”</p>
                {c.en && <p className="sx-hint"><Icon name="translate" /> {c.lang}: “{c.text}”</p>}
                {!c.en && <p className="sx-hint">{c.lang}</p>}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="sx-grid g-2">
        <Card title={staff.title} sub={staff.when} action={<Badge tone="info">On the scorecard</Badge>}>
          <div className="sx-table-wrap">
            <table className="sx-table">
              <thead><tr><th>Question (1–5)</th>{staff.months.map((m) => <th key={m} className="num">{m}</th>)}</tr></thead>
              <tbody>
                {staff.qs.map((q) => (
                  <tr key={q.q}>
                    <td>{q.q}</td>
                    {q.vals.map((v, i) => (
                      <td key={i} className="num">
                        {i === q.vals.length - 1 ? <b>{v.toFixed(1)}</b> : v.toFixed(1)}
                        <span className="sv-mini" aria-hidden="true"><span style={{ width: `${(v / 5) * 100}%` }} /></span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="sx-list sv-staff-c">
            {staff.comments.map((c) => <li key={c} className="sx-hint">“{c}”</li>)}
          </ul>
        </Card>
        <Card title={resident.title} sub={`${resident.answered} residents`} action={<Help label="How residents are asked" align="end"><p>Printed, or staff read each question aloud and note the answer.</p></Help>}>
          <ul className="sv-qs">
            {resident.qs.map((q) => <BeforeNow key={q.q} q={q} />)}
          </ul>
        </Card>
      </div>
    </>
  );
}
