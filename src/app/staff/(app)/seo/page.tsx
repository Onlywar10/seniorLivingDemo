import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { Badge, Card, Delta, Kpi, LineChart, Spark, fmt, pctChange } from "@/components/staff/ui";
import { ago, siteHref } from "@/data/staff";
import { getStaffCommunity } from "@/data/staff/server";
import { addDays, shortDate, today } from "@/lib/clock";

export const metadata: Metadata = { title: "Search (SEO)" };

export default async function Seo() {
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Search (SEO)" />;
  const { s, c: com } = sc;
  const { gbp, rankings, reviewsRecent, searchWeekly, topPages, vitals } = s;
  const t = today();
  const weeks = searchWeekly.clicks.map((_, i) => shortDate(addDays(t, (i - 11) * 7)));
  const c = searchWeekly.clicks, im = searchWeekly.impressions;
  const last4 = (a: number[]) => a.slice(-4).reduce((n, v) => n + v, 0);
  const prev4 = (a: number[]) => a.slice(-8, -4).reduce((n, v) => n + v, 0);
  const ctr = (last4(c) / last4(im)) * 100;
  const avgPos = s.seo.avgPos;

  return (
    <>
      <header className="sx-head">
        <div>
          <h1>Search (SEO)</h1>
          <p>How {s.brand.name} shows up on Google. Last 28 days, compared with the 28 days before.</p>
        </div>
        <div className="sx-head-actions">
          <Badge tone="good"><Icon name="check" /> Google Search Console connected</Badge>
        </div>
      </header>

      <div className="sx-kpis">
        <Kpi label="Clicks from Google" value={fmt(last4(c))} delta={pctChange(last4(c), prev4(c))} note="vs previous 28 days" spark={c} />
        <Kpi label="Impressions" value={fmt(last4(im))} delta={pctChange(last4(im), prev4(im))} note={`times ${s.brand.short} appeared in results`} spark={im} />
        <Kpi label="Click-through rate" value={`${ctr.toFixed(1)}%`} delta={s.seo.ctrDelta} deltaSuffix=" pts" note="local average is 2.1%" />
        <Kpi label="Average position" value={avgPos.toFixed(1)} delta={s.seo.avgPosDelta} deltaSuffix="" invert note="across tracked searches" />
      </div>

      <Card title="Google rankings" sub={`Where ${s.brand.domain} ranks for the searches families actually type. Trend shows the last 12 weeks.`} pad={false}>
        <div className="sx-table-wrap">
          <table className="sx-table">
            <thead>
              <tr>
                <th>Search</th>
                <th className="num">Position</th>
                <th>Change</th>
                <th>12-week trend</th>
                <th className="num">Monthly searches</th>
                <th>Ranking page</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((r) => (
                <tr key={r.q}>
                  <td>
                    <b>{r.q}</b>
                  </td>
                  <td className="num">
                    <b style={{ fontSize: 17 }}>{r.pos}</b>
                    {r.pos <= 3 && <small>Top 3</small>}
                  </td>
                  <td>{r.change === 0 ? <Delta v={0} /> : <Delta v={r.change} suffix="" label={r.change === 1 ? "place" : "places"} />}</td>
                  <td style={{ color: r.change > 0 ? "var(--green)" : "var(--slate)" }}>
                    <Spark values={r.hist} invert w={90} h={26} />
                  </td>
                  <td className="num">{fmt(r.volume)}</td>
                  <td>
                    <a className="sx-link" href={siteHref(s.slug, r.url)} target="_blank" rel="noopener">
                      {r.url}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="sx-grid g-2">
        <Card title="Clicks" sub="Weekly clicks from Google search">
          <LineChart label={`Weekly clicks from Google, rising from ${c[0]} to ${c[c.length - 1]} over 12 weeks`} labels={weeks} series={[{ name: "Clicks", values: c, color: "var(--green)", area: true }]} height={200} every={2} />
        </Card>
        <Card title="Impressions" sub="Weekly appearances in Google results">
          <LineChart
            label={`Weekly impressions, rising from ${fmt(im[0])} to ${fmt(im[im.length - 1])} over 12 weeks`}
            labels={weeks}
            series={[{ name: "Impressions", values: im, color: "var(--sky)", area: true }]}
            height={200}
            every={2}
            yFmt={(n) => (n >= 1000 ? `${n / 1000}k` : String(n))}
          />
        </Card>
      </div>

      <div className="sx-grid g-21">
        <Card title="Google Business Profile" sub={`${com.site.name} · ${com.site.address.street}, ${com.site.address.city} · last 28 days`}>
          <div className="sx-kpis" style={{ marginBottom: 14, gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))" }}>
            <Kpi label="Profile views" value={fmt(gbp.views)} delta={pctChange(gbp.views, gbp.viewsPrev)} />
            <Kpi label="Calls" value={gbp.calls} delta={pctChange(gbp.calls, gbp.callsPrev)} />
            <Kpi label="Direction requests" value={gbp.directions} delta={pctChange(gbp.directions, gbp.directionsPrev)} />
            <Kpi label="Website clicks" value={gbp.clicks} delta={pctChange(gbp.clicks, gbp.clicksPrev)} />
          </div>
          <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
            <span className="sx-bignum">{gbp.rating}</span>
            <span>
              <span style={{ color: "var(--butter)", letterSpacing: 2 }} aria-hidden="true">
                ★★★★★
              </span>
              <br />
              <span className="sx-hint">
                {gbp.reviews} Google reviews · {gbp.newReviews} new this month, all answered
              </span>
            </span>
          </div>
          {reviewsRecent.length > 0 && <ul className="sx-list">
            {reviewsRecent.map((r) => (
              <li key={r.name}>
                <b>{r.name}</b> <span aria-label={`${r.stars} stars`}>{"★".repeat(r.stars)}</span> <span className="sx-hint">· {ago(r.mins)}</span>
                <p style={{ margin: "3px 0 0", color: "var(--sx-ink-2)" }}>“{r.text}”</p>
                <span className="sx-hint">
                  <Icon name="check" /> Replied by {s.people[s.roles.gbpReplies].name}
                </span>
              </li>
            ))}
          </ul>}
        </Card>

        <div className="sx-grid">
          <Card title="Site health" action={<Badge tone="good">Healthy</Badge>}>
            <ul className="sx-list">
              {vitals.map((v) => (
                <li key={v.k} className="sx-fresh">
                  <span className="ok">
                    <Icon name="check" />
                  </span>
                  <b>{v.k}</b>
                  <b>{v.v}</b>
                  <small>{v.note} · mobile, real visitors</small>
                </li>
              ))}
              <li className="sx-fresh">
                <span className="ok"><Icon name="check" /></span>
                <b>Pages indexed</b>
                <b>{s.seo.pagesIndexed} of {s.seo.pagesIndexed}</b>
                <small>Sitemap updated automatically when anything is published</small>
              </li>
              <li className="sx-fresh">
                <span className="ok"><Icon name="check" /></span>
                <b>Structured data</b>
                <b>0 errors</b>
                <small>Events, menus, FAQs and local business details</small>
              </li>
              <li className="sx-fresh">
                <span className="ok"><Icon name="check" /></span>
                <b>Mobile and accessibility</b>
                <b>100</b>
                <small>Lighthouse accessibility score, home page</small>
              </li>
            </ul>
          </Card>
        </div>
      </div>

      <Card title="Pages with the most search traffic" sub="Clicks from Google, last 28 days" pad={false}>
        <div className="sx-table-wrap">
          <table className="sx-table">
            <thead>
              <tr>
                <th>Page</th>
                <th className="num">Clicks</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {topPages.map((p) => (
                <tr key={p.url}>
                  <td>
                    <b>{p.title}</b>
                    <small>{p.url}</small>
                  </td>
                  <td className="num">{fmt(p.clicks)}</td>
                  <td>
                    <Delta v={p.change} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
