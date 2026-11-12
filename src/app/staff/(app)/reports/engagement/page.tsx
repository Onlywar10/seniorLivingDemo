import type { Metadata } from "next";
import Link from "next/link";
import "@/app/staff/reports.css";
import { Icon } from "@/components/Icon";
import { ReportTabs } from "@/components/staff/portal/CalendarTabs";
import { Help } from "@/components/staff/portal/Help";
import { NotYours } from "@/components/staff/portal/NotYours";
import { mayOpen } from "@/components/staff/portal/ReportsNav";
import { ComingLater, NotThisReport } from "@/components/staff/portal/ReportsParts";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { Badge, Card, Kpi, PageHead, fmt, pctChange } from "@/components/staff/ui";
import { scorecardMonths } from "@/data/staff";
import { sectionAccess } from "@/data/staff/access";
import type { Attended } from "@/data/staff/engage";
import { engagementReport } from "@/data/staff/reports";
import { getStaffCommunity } from "@/data/staff/server";

export const metadata: Metadata = { title: "Engagement" };

function Attendance({ rows, max }: { rows: Attended[]; max: number }) {
  return (
    <ul className="rp-att">
      {rows.map((r) => (
        <li key={r.title}>
          <span className="rp-att-t"><b>{r.title}</b><small>{r.sessions} {r.sessions === 1 ? "session" : "sessions"} · {r.trend > 0 ? `up ${r.trend}` : r.trend < 0 ? `down ${-r.trend}` : "same as"} on last month</small></span>
          <span className="rp-att-v"><b>{r.avg}</b><small>a session</small></span>
          <span className="rp-att-bar" aria-hidden="true"><i style={{ width: `${(r.avg / max) * 100}%` }} /></span>
        </li>
      ))}
    </ul>
  );
}

export default async function EngagementPage() {
  const { access } = await sectionAccess("reports");
  if (!access) return <NotYours section="Reports" />;
  if (!mayOpen(access, "engagement")) return <NotThisReport title="Engagement" access={access} />;
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Engagement" />;
  const { s } = sc;
  const m = scorecardMonths();
  const e = engagementReport(s.slug);
  const max = Math.max(1, ...e.worked.most.map((r) => r.avg));
  const reachedPct = Math.round((e.reached / Math.max(1, e.residents)) * 100);

  return (
    <>
      <PageHead title="Engagement" sub={`${s.brand.name}, the last four weeks`}>
        <Help label="How engagement is counted" align="end"><p>Counted from attendance, QR check-ins and the visit notes staff log in People. Nobody fills in a spreadsheet.</p><p>A resident is reached if they came to an activity or had a 1:1 visit.</p></Help>
      </PageHead>
      <ReportTabs access={access} />

      <div className="sx-kpis">
        <Kpi label="Residents reached" value={<>{e.reached}<small> / {e.residents}</small></>} delta={pctChange(e.reached, e.reachedPrev)} note={`${reachedPct}% of residents`} />
        <Kpi label="Activity visits" value={fmt(e.visits)} delta={pctChange(e.visits, e.visitsPrev)} note={`${e.sessions} activities`} />
        <Kpi label="Checked in by QR" value={`${e.checkIns.qrPct}%`} note={`${fmt(e.checkIns.qr)} by QR, ${fmt(e.checkIns.staff)} by staff`} />
        <Kpi label="1:1 visits" value={e.oneToOne.length} note={`with ${e.oneToOneResidents} residents`} />
      </div>

      <div className="sx-grid g-2">
        <Card title="Most attended" sub={`Average a session, ${m.month}`}>
          <Attendance rows={e.worked.most} max={max} />
        </Card>
        <Card title="Least attended" sub="Ran at least twice" action={<Help label="About least attended" align="end"><p>Worth a new time, a new room, or a rest.</p></Help>}>
          <Attendance rows={e.worked.least} max={max} />
        </Card>
      </div>

      <div className="sx-grid g-2">
        <Card title="QR versus staff check-ins" action={<Help label="About check-ins" align="end"><p>A resident with a phone scans the sign at the activity; staff tap everyone else in.</p><p>Each scan counts under the phone number we already know: no login. Lantern residents are always checked in by staff.</p></Help>}>
          <div className="rp-split" role="img" aria-label={`${e.checkIns.qrPct}% by QR, ${100 - e.checkIns.qrPct}% by staff`}>
            <i style={{ width: `${e.checkIns.qrPct}%` }} />
          </div>
          <ul className="sx-legend rp-split-l">
            <li><i style={{ background: "var(--green-deep)" }} />By QR · {fmt(e.checkIns.qr)}</li>
            <li><i style={{ background: "#cdbfa5" }} />By staff · {fmt(e.checkIns.staff)}</li>
          </ul>
        </Card>
        <Card title="1:1 visits" sub="Logged in People" action={<span className="rp-acts"><Badge tone="neutral">Staff only</Badge><Help label="About 1:1 visits" align="end"><p>Private: never sent to families.</p></Help></span>}>
          <ul className="sx-list rp-visits">
            {e.oneToOne.slice(0, 6).map((v, i) => (
              <li key={v.resident + i}>
                <b>{v.resident}</b>{v.lantern && <span className="sx-hint"> · Lantern</span>}
                <small>{v.date} · {v.by} · {v.note}</small>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="sx-grid g-2">
        <Card title="We haven’t seen lately" sub="No activities in two weeks" action={<span className="rp-acts"><Help label="About we haven’t seen lately" align="end"><p>Staff send a warm invite or drop by. Families are never told automatically: someone who stops coming out may be unwell or grieving, and a person should notice.</p></Help><Link href="/staff/people" className="sx-btn sx-btn-sm">People <Icon name="arrow" /></Link></span>}>
          {e.unseen.length ? (
            <ul className="sx-list">
              {e.unseen.map((u) => (
                <li key={u.name}>
                  <b>{u.name}</b> <span className="sx-hint">· {u.days} days · last came to {u.lastActivity}</span>
                  <small className="rp-block">{u.visits ? `${u.visits} ${u.visits === 1 ? "visit" : "visits"} logged` : "No visit logged yet"}{u.next ? ` · next match: ${u.next.title}, ${u.next.when}` : ""}</small>
                </li>
              ))}
            </ul>
          ) : <p className="sx-hint">Everyone has been out in the last two weeks.</p>}
        </Card>
        <Card title="Personal invites" sub="Last 30 days" action={<Help label="About personal invites" align="end"><p>A text to a resident when an event matches their interests: “Bridge Club tonight at 7. Want a seat? Reply YES.”</p></Help>}>
          <div className="rp-big">
            <span><b>{fmt(e.invites.sent)}</b><small>invites sent</small></span>
            <span><b>{fmt(e.invites.yes)}</b><small>said yes</small></span>
            <span><b>{Math.round((e.invites.yes / Math.max(1, e.invites.sent)) * 100)}%</b><small>replied yes</small></span>
          </div>
        </Card>
      </div>

      <ComingLater when="Coming in Beta" title="Engagement scores and alerts">
        <p>A score for each resident and for {s.brand.name}, and an alert when someone shows signs of pulling back.</p>
        <p>For now, “we haven’t seen lately” lists residents for staff to check on in person.</p>
      </ComingLater>
    </>
  );
}
