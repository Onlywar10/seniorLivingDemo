import type { Metadata } from "next";
import { PageHead, Card, Kpi, LineChart, Badge, fmt, pct } from "@/components/staff/ui";
import { Icon } from "@/components/Icon";
import { keywords, seoTrend, gbp, vitals, attention, weekTicks, scope } from "@/data/staff";

export const metadata: Metadata = { title: "Search (SEO)" };

export default async function Seo({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const s = scope(c);
  const kw = keywords(c);
  const k = c ? 0.18 : 1;
  const clicks = seoTrend.clicks.map((v) => Math.round(v * k));
  const impr = seoTrend.impressions.map((v) => Math.round(v * k));
  const issues = c ? attention.filter((a) => a.where === s.label) : attention;
  return (
    <>
      <PageHead title="Search (SEO)" sub={`${s.label} · Google Search and Google Business Profile, last 28 days`}>
        <button className="sx-btn" type="button">
          <Icon name="download" /> Export report
        </button>
      </PageHead>

      <div className="sx-kpis">
        <Kpi label="Clicks from Google" value={fmt(clicks[11] * 4)} delta={pct(clicks[11], clicks[7])} spark={clicks} />
        <Kpi label="Impressions" value={fmt(impr[11] * 4)} delta={pct(impr[11], impr[7])} spark={impr} />
        <Kpi label="Average position" value={s.seoPos.toFixed(1)} delta={-18} invert note="lower is better" />
        <Kpi label="Business Profile views" value={fmt(Math.round(gbp.views * k))} delta={pct(gbp.views, gbp.viewsPrev)} />
        <Kpi label="Calls from Google" value={fmt(Math.round(gbp.calls * k))} delta={pct(gbp.calls, gbp.callsPrev)} />
        <Kpi label="Direction requests" value={fmt(Math.round(gbp.directions * k))} delta={pct(gbp.directions, gbp.directionsPrev)} />
      </div>

      <div className="sx-grid g-21">
        <Card title="Rankings for the searches that matter" sub="Position in Google, this week vs four weeks ago" pad={false}>
          <div className="sx-table-wrap">
            <table className="sx-table">
              <thead>
                <tr>
                  <th>Search</th>
                  <th className="num">Position</th>
                  <th className="num">Change</th>
                  <th className="num">Monthly searches</th>
                  <th className="num">Clicks</th>
                  <th className="num">Impressions</th>
                </tr>
              </thead>
              <tbody>
                {kw.map((r) => (
                  <tr key={r.q}>
                    <td>
                      <b>{r.q}</b>
                    </td>
                    <td className="num">
                      <Badge tone={r.pos <= 3 ? "good" : r.pos <= 6 ? "accent" : "warn"}>#{r.pos}</Badge>
                    </td>
                    <td className="num">{r.prev - r.pos > 0 ? <span className="sx-delta up">▲ {r.prev - r.pos}</span> : <span className="sx-delta flat">■ 0</span>}</td>
                    <td className="num">{fmt(r.vol)}</td>
                    <td className="num">{fmt(Math.round(r.clicks * (c ? 1 : 1.9)))}</td>
                    <td className="num">{fmt(Math.round(r.impr * (c ? 1 : 1.9)))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="Google Business Profile" sub="Last 28 days">
          <ul className="sx-list">
            <li className="sx-fresh">
              <b>Rating</b>
              <span>
                ★ {gbp.rating} · {gbp.reviews} reviews
              </span>
              <small>{gbp.newReviews} new reviews this month, all answered within a day</small>
            </li>
            <li className="sx-fresh">
              <b>Website clicks</b>
              <span>{fmt(Math.round(gbp.website * k))}</span>
              <small>
                <span className="sx-delta up">▲ {pct(gbp.website, gbp.websitePrev)}%</span> since weekly posts started
              </small>
            </li>
            <li className="sx-fresh">
              <b>Posts this month</b>
              <span>{c ? 9 : 52}</span>
              <small>Published automatically from the calendar and news</small>
            </li>
            <li className="sx-fresh">
              <b>Photos</b>
              <span>{c ? 64 : 388}</span>
              <small>Newest from this morning</small>
            </li>
          </ul>
        </Card>
      </div>

      <div className="sx-grid g-21">
        <Card title="Clicks and impressions" sub="Weekly, all tracked searches">
          <div className="sx-legend">
            <span>
              <i style={{ background: "var(--c1)" }} /> Clicks
            </span>
            <span>
              <i style={{ background: "var(--c2)" }} /> Impressions ÷ 20
            </span>
          </div>
          <LineChart
            labels={weekTicks()}
            series={[
              { name: "Clicks", values: clicks, color: "var(--c1)" },
              { name: "Impr. ÷ 20", values: impr.map((v) => Math.round(v / 20)), color: "var(--c2)" },
            ]}
          />
        </Card>
        <Card title="Page speed and site health" action={<Badge tone="good">All passing</Badge>}>
          <ul className="sx-list">
            {vitals.map((v) => (
              <li key={v.k} className="sx-fresh">
                <span>{v.k}</span>
                <b style={{ color: "var(--sx-good)" }}>{v.v}</b>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Pages that need attention" sub={`${issues.length} to fix · sorted by impact`} pad={false}>
        <div className="sx-table-wrap">
          <table className="sx-table">
            <thead>
              <tr>
                <th>Community</th>
                <th>Page</th>
                <th>Issue</th>
                <th>Suggested fix</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {issues.length ? (
                issues.map((a) => (
                  <tr key={a.where + a.page}>
                    <td>
                      <b>{a.where}</b>
                    </td>
                    <td>{a.page}</td>
                    <td>
                      <Badge tone={a.sev === "high" ? "bad" : a.sev === "med" ? "warn" : "neutral"}>{a.sev === "high" ? "High" : a.sev === "med" ? "Medium" : "Low"}</Badge> {a.issue}
                    </td>
                    <td>{a.fix}</td>
                    <td>
                      <button className="sx-btn" type="button">
                        Fix
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>Nothing needs attention. Every page is current and passing.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
