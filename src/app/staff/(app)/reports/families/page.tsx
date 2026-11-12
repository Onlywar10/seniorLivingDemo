import type { Metadata } from "next";
import "@/app/staff/reports.css";
import { Icon } from "@/components/Icon";
import { ReportTabs } from "@/components/staff/portal/CalendarTabs";
import { Help } from "@/components/staff/portal/Help";
import { NotYours } from "@/components/staff/portal/NotYours";
import { mayOpen } from "@/components/staff/portal/ReportsNav";
import { NotThisReport } from "@/components/staff/portal/ReportsParts";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { Badge, Card, Kpi, PageHead, fmt, pctChange } from "@/components/staff/ui";
import { scorecardMonths } from "@/data/staff";
import { sectionAccess } from "@/data/staff/access";
import type { ConcernStatus } from "@/data/staff/engage";
import { familiesReport } from "@/data/staff/reports";
import { getStaffCommunity } from "@/data/staff/server";

export const metadata: Metadata = { title: "Families" };

const concernTone: Record<ConcernStatus, "good" | "warn" | "bad" | "neutral"> = { Open: "bad", "In progress": "warn", Resolved: "good", "Passed to the care team": "neutral" };

export default async function FamiliesPage() {
  const { access } = await sectionAccess("reports");
  if (!access) return <NotYours section="Reports" />;
  if (!mayOpen(access, "families")) return <NotThisReport title="Families" access={access} />;
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Families" />;
  const { s } = sc;
  const m = scorecardMonths();
  const f = familiesReport(s.slug);
  const aiPct = Math.round((f.ai.handled / Math.max(1, f.ai.handled + f.ai.toStaff)) * 100);

  return (
    <>
      <PageHead title="Families" sub={`${s.brand.name}, ${m.month}`} />
      <ReportTabs access={access} />

      <div className="sx-kpis">
        <Kpi label="Families reached" value={<>{f.reached.now}<small> / {f.families}</small></>} delta={f.reached.prev ? pctChange(f.reached.now, f.reached.prev) : undefined} note="opened at least one message this month" />
        <Kpi label="Opening" value={`${f.openRate.now}%`} delta={f.openRate.prev ? f.openRate.now - f.openRate.prev : undefined} deltaSuffix=" pts" note="of messages sent were opened" />
        <Kpi label="Replies" value={fmt(f.sends.replied)} note={`to ${f.sends.count} sends, ${fmt(f.sends.sent)} messages`} />
        <Kpi label="Concerns resolved" value={<>{f.concernsResolved}<small> / {f.concernsOwned}</small></>} note={`${f.concernsPassed} passed to the care team`} />
      </div>

      <div className="sx-grid g-2">
        <Card title="Family concerns" sub={`${f.concernsOpened} this month`} action={<Help label="About family concerns" align="end"><p>Each concern has an owner and stays open until they mark it resolved. Concerns are never answered by the AI.</p><p>Care concerns are passed to the care team straight away and recorded in the community’s own care system. Kinlight keeps only who it went to and when, so they aren’t counted as open or resolved here.</p></Help>}>
          <ul className="sx-list rp-concerns">
            {f.concerns.map((c) => (
              <li key={c.id}>
                <span className="rp-row">
                  <b>{c.topic}</b>
                  <Badge tone={concernTone[c.status]}>{c.status === "Resolved" && <Icon name="check" />} {c.status}</Badge>
                </span>
                {c.care ? (
                  <small className="rp-block">{c.from}, {c.relation.toLowerCase()} of {c.resident} · to {c.care.team} · {c.care.at}</small>
                ) : (
                  <>
                    <span className="rp-quote">“{c.text}”</span>
                    <small className="rp-block">{c.from}, {c.relation.toLowerCase()} of {c.resident} · {c.ownerName} · {c.ago}</small>
                  </>
                )}
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Thank-yous" sub={`${f.thankYous.length} this month`} action={<Help label="About thank-yous" align="end"><p>Kinlight passes each one to the person it’s about.</p></Help>}>
          <ul className="sx-list">
            {f.thankYous.map((t) => (
              <li key={t.id}>
                <span className="rp-quote">“{t.text}”</span>
                <small className="rp-block">{t.from} · for {t.staffName} · {t.passed ? "passed on" : "not passed on yet"} · {t.ago}</small>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Replies the AI handled" sub={m.month} action={<Help label="What the AI may handle" align="end"><p>Clear answers to Kinlight’s own questions (yes, no, a number, which event) become actions after a confirmation.</p><p>Open questions, concerns, and anything about care, health or billing go to a person. STOP is always handled without the AI.</p></Help>}>
        <div className="rp-split" role="img" aria-label={`${aiPct}% handled by the AI, ${100 - aiPct}% passed to staff`}>
          <i style={{ width: `${aiPct}%` }} />
        </div>
        <ul className="sx-legend rp-split-l">
          <li><i style={{ background: "var(--green-deep)" }} />Handled on its own · {fmt(f.ai.handled)}</li>
          <li><i style={{ background: "#cdbfa5" }} />Passed to staff · {fmt(f.ai.toStaff)}</li>
        </ul>
        <div className="sx-table-wrap">
          <table className="sx-table rp-ai">
            <thead><tr><th>Kinlight asked</th><th>They replied</th><th>What happened</th></tr></thead>
            <tbody>
              {f.ai.examples.map((h, i) => (
                <tr key={i}>
                  <td>{h.asked}<small>{h.from} · {h.relation} · {h.ago}</small></td>
                  <td><b>“{h.reply}”</b></td>
                  <td>{h.did}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
