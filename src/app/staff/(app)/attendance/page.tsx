import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { TakeAttendance } from "@/components/staff/alpha/Attendance";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { Badge, Card, HBars, Kpi, Meter, PageHead } from "@/components/staff/ui";
import { cats } from "@/data/shared";
import { attendance, when } from "@/data/staff/alpha";
import { getStaffCommunity } from "@/data/staff/server";
import { hash } from "@/lib/clock";
import "../../alpha.css";

export const metadata: Metadata = { title: "Attendance" };

const methodTone = { "Tap list": "good", "Photo of sign-in sheet": "info", "Not taken yet": "warn" } as const;

export default async function AttendancePage() {
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Attendance" />;
  const { s } = sc;
  const { rows, todayLeft, week } = attendance(s.slug);
  const taken = rows.filter((r) => r.method !== "Not taken yet");
  const rate = taken.length ? Math.round((taken.reduce((n, r) => n + r.came, 0) / taken.reduce((n, r) => n + r.expected, 0)) * 100) : 0;
  const activities = todayLeft.map((e) => {
    const pool = e.lantern || e.cat === "lantern" ? s.lanternNames : s.residentNames;
    const h = hash(e.id);
    const n = Math.min(pool.length, 16 + (h % 8));
    return {
      id: e.id, title: e.title, when: when(e).split(", ").pop() ?? "", place: e.place,
      pool: Array.from({ length: n }, (_, i) => pool[(h + i * 5) % pool.length]).filter((x, i, a) => a.indexOf(x) === i),
      expected: e.cap ? e.taken ?? e.cap : 8 + (h % 18),
    };
  });
  // Best-attended categories this week, for "what works".
  const byCat = Object.entries(
    taken.reduce<Record<string, number>>((m, r) => ((m[r.event.cat ?? "community"] = (m[r.event.cat ?? "community"] ?? 0) + r.came), m), {})
  )
    .map(([k, v]) => ({ label: cats[k as keyof typeof cats]?.label ?? k, value: v }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <>
      <PageHead title="Attendance" sub="Who came to what, taken on a phone at the door. Counts feed the monthly scorecard and the library’s “what works”." />

      <div className="sx-kpis">
        <Kpi label="Activities counted this week" value={week.activities} note={week.missing ? `${week.missing} still to take` : "none missing"} />
        <Kpi label="Resident visits" value={week.visits} note="this week, all activities" />
        <Kpi label="Residents reached" value={<>{week.residentsReached}<small> / {s.community.residents}</small></>} note="came to at least one" />
        <Kpi label="Turnout" value={`${rate}%`} note="of expected, this week" />
      </div>

      <div className="sx-grid g-21">
        <Card title="Take attendance" sub={`Today’s activities still to take · ${todayLeft.length} left`}>
          <TakeAttendance activities={activities} />
        </Card>
        <div className="sx-grid">
          <Card title="Best attended this week" sub="By category, resident visits">
            {byCat.length ? <HBars items={byCat} /> : <p className="sx-empty">Nothing counted yet this week.</p>}
          </Card>
          <Card title="Where the counts go">
            <ul className="sx-list">
              <li><b>Monthly scorecard</b><br /><span className="sx-hint">Activity visits and residents reached, compared with last month.</span></li>
              <li><b>Library: what works</b><br /><span className="sx-hint">Each activity idea shows how well it was attended here and across Wrenhaven.</span> <Link className="sx-link" href="/staff/library">Library</Link></li>
              <li><b>Family digest</b><br /><span className="sx-hint">“32 residents came to the Fall Festival” in Sunday’s email, never names.</span></li>
            </ul>
          </Card>
        </div>
      </div>

      <Card title="The past week" sub={`${rows.length} activities · newest first`} pad={false}>
        <div className="sx-table-wrap">
          <table className="sx-table">
            <thead><tr><th>Activity</th><th>Day</th><th className="num">Came</th><th>Of expected</th><th>Method</th><th>By</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.event.id + r.event.date}>
                  <td>
                    <span className="sx-dot" style={{ background: cats[r.event.cat ?? "community"].color }} aria-hidden="true" /> <b>{r.event.title}</b>
                    <small>{r.event.place}</small>
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>{when(r.event)}</td>
                  <td className="num">{r.method === "Not taken yet" ? "–" : <b>{r.came}</b>}<span className="sx-hint"> / {r.expected}</span></td>
                  <td style={{ minWidth: 110 }}>{r.method !== "Not taken yet" && <Meter v={(r.came / r.expected) * 100} label={`${r.came} of ${r.expected}`} />}</td>
                  <td><Badge tone={methodTone[r.method]}>{r.method === "Photo of sign-in sheet" && <Icon name="image" />}{r.method}</Badge></td>
                  <td style={{ whiteSpace: "nowrap" }}>{r.method === "Not taken yet" ? <span className="sx-hint">Due</span> : r.by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
