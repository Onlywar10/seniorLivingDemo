import type { Metadata } from "next";
import "@/app/staff/reports.css";
import { Icon } from "@/components/Icon";
import { ReportTabs } from "@/components/staff/portal/CalendarTabs";
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

const concernTone: Record<ConcernStatus, "good" | "warn" | "bad"> = { Open: "bad", "In progress": "warn", Resolved: "good" };

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
      <PageHead title="Families" sub={`How ${s.brand.name}’s families heard from the community in ${m.month}: who was reached, who opened and replied, the thank-yous and concerns, and which replies the AI handled on its own.`} />
      <ReportTabs access={access} />

      <div className="sx-kpis">
        <Kpi label="Families reached" value={<>{f.reached.now}<small> / {f.families}</small></>} delta={f.reached.prev ? pctChange(f.reached.now, f.reached.prev) : undefined} note="opened at least one message this month" />
        <Kpi label="Opening" value={`${f.openRate.now}%`} delta={f.openRate.prev ? f.openRate.now - f.openRate.prev : undefined} deltaSuffix=" pts" note="of messages sent were opened" />
        <Kpi label="Replies" value={fmt(f.sends.replied)} note={`to ${f.sends.count} sends, ${fmt(f.sends.sent)} messages`} />
        <Kpi label="Concerns" value={<>{f.concernsResolved}<small> of {f.concernsOpened} resolved</small></>} note={`${f.thankYous.length} thank-yous passed on`} />
      </div>

      <div className="sx-grid g-2">
        <Card title="Family concerns" sub="Opened this month and who owns each one. A concern stays open until its owner marks it resolved.">
          <ul className="sx-list rp-concerns">
            {f.concerns.map((c) => (
              <li key={c.id}>
                <span className="rp-row">
                  <b>{c.topic}</b>
                  <Badge tone={concernTone[c.status]}>{c.status === "Resolved" && <Icon name="check" />} {c.status}</Badge>
                </span>
                <span className="rp-quote">“{c.text}”</span>
                <small className="rp-block">{c.from}, {c.relation.toLowerCase()} of {c.resident} · owner {c.ownerName} · {c.ago}</small>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Thank-yous" sub="Kinlight passes each one to the person it’s about">
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

      <Card title="Replies the AI handled, and the ones it passed to staff" sub="Clear answers to Kinlight’s own questions (yes, no, a number, which event) become actions after a confirmation. Open questions, concerns, and anything about care, health or billing go to a person.">
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
        <p className="sx-hint rp-p">STOP is always handled without the AI.</p>
      </Card>
    </>
  );
}
