import type { Metadata } from "next";
import { PageHead, Card, Badge } from "@/components/staff/ui";
import { Icon } from "@/components/Icon";
import { stats, nameOf } from "@/data/staff";
import { monthName, today } from "@/lib/clock";

export const metadata: Metadata = { title: "Monthly scorecard" };

type Row = { k: string; get: (s: (typeof stats)[number]) => number; fmt: (n: number) => string; low?: boolean };

const rows: Row[] = [
  { k: "Occupancy", get: (s) => s.occupancy, fmt: (n) => `${n}%` },
  { k: "Move-ins", get: (s) => s.moveIns, fmt: String },
  { k: "Tours", get: (s) => s.tours * 4 + 2, fmt: String },
  { k: "Enquiries", get: (s) => s.enquiries * 4, fmt: String },
  { k: "First reply (minutes)", get: (s) => s.responseMins, fmt: String, low: true },
  { k: "Website visits", get: (s) => s.visits * 4, fmt: (n) => n.toLocaleString() },
  { k: "Calendar and menus on time", get: (s) => (s.fresh === "stale" ? 61 : s.fresh === "due" ? 93 : 100), fmt: (n) => `${n}%` },
  { k: "Posts", get: (s) => s.posts * 4, fmt: String },
  { k: "Families reached", get: (s) => Math.round((s.familiesReached / s.families) * 100), fmt: (n) => `${n}%` },
  { k: "Message open rate", get: (s) => s.openRate, fmt: (n) => `${n}%` },
  { k: "Google position (avg)", get: (s) => s.seoPos, fmt: (n) => n.toFixed(1), low: true },
  { k: "AI visibility score", get: (s) => s.geo, fmt: String },
  { k: "Google rating", get: (s) => s.rating, fmt: (n) => `★ ${n}` },
];

export default function Scorecard() {
  const month = monthName(today());
  return (
    <>
      <PageHead title={`Monthly scorecard · ${month}`} sub="All six communities side by side. Best in each row in green, the one to help in red.">
        <button className="sx-btn" type="button">
          <Icon name="download" /> Download PDF for the board
        </button>
      </PageHead>
      <Card pad={false}>
        <div className="sx-table-wrap">
          <table className="sx-table">
            <thead>
              <tr>
                <th>{month} to date</th>
                {stats.map((s) => (
                  <th key={s.slug} className="num">
                    {nameOf(s.slug)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const vals = stats.map(r.get);
                const best = r.low ? Math.min(...vals) : Math.max(...vals);
                const worst = r.low ? Math.max(...vals) : Math.min(...vals);
                return (
                  <tr key={r.k}>
                    <td>
                      <b>{r.k}</b>
                    </td>
                    {vals.map((v, i) => (
                      <td key={stats[i].slug} className={`num ${v === best ? "best" : v === worst ? "worst" : ""}`}>
                        {r.fmt(v)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="sx-grid g-3">
        <Card title="Most improved">
          <p style={{ margin: 0 }}>
            <b>Larkmoor House</b> · tours up 50% and AI visibility up 31 points since the daily calendar went live.
          </p>
        </Card>
        <Card title="Needs help">
          <p style={{ margin: 0 }}>
            <b>Harbor View</b> · calendar and menus 8 days old; first reply 96 minutes. <Badge tone="bad">Call booked with Colleen, Friday</Badge>
          </p>
        </Card>
        <Card title="Share what works">
          <p style={{ margin: 0 }}>
            Ashby Grove’s Thursday photo post gets the highest open rate (84%). <a className="sx-link" href="/staff/library">Shared to the library</a>
          </p>
        </Card>
      </div>
    </>
  );
}
