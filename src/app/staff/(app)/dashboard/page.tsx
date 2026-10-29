import type { Metadata } from "next";
import Link from "next/link";
import { PageHead, Card, Kpi, LineChart, HBars, Badge, Score, fmt, pct } from "@/components/staff/ui";
import { Icon } from "@/components/Icon";
import { scope, sources, feed, weekTicks, stats, nameOf, user } from "@/data/staff";
import { greeting, longDate, today } from "@/lib/clock";

export const metadata: Metadata = { title: "Home" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const s = scope(c);
  const q = c ? `?c=${c}` : "";
  const freshCount = s.list.filter((x) => x.fresh !== "stale").length;
  return (
    <>
      <PageHead title={`${greeting()}, ${user.name.split(" ")[0]}`} sub={`${longDate(today())} · ${s.label} · last 7 days compared with the 7 before`}>
        <Link className="sx-btn" href={`/staff/scorecard${q}`}>
          <Icon name="star" /> Monthly scorecard
        </Link>
        <Link className="sx-btn sx-btn-primary" href={`/staff/publish${q}`}>
          <Icon name="plus" /> Post once
        </Link>
      </PageHead>

      <div className="sx-kpis">
        <Kpi label="Families reached" value={fmt(s.familiesReached)} note={`of ${fmt(s.families)} family contacts (${Math.round((s.familiesReached / s.families) * 100)}%)`} href={`/staff/families${q}`} />
        <Kpi label="Posts this week" value={s.posts} delta={12} note="calendar, menus, news, photos" href={`/staff/publish${q}`} />
        <Kpi label="Messages sent" value={fmt(s.sent)} note={`${s.openRate}% opened · ${s.replies} replies`} href={`/staff/messages${q}`} />
        <Kpi label="Tours booked" value={s.tours} delta={pct(s.tours, s.toursPrev)} href={`/staff/tours${q}`} />
        <Kpi label="New enquiries" value={s.enquiries} delta={14} href={`/staff/tours${q}`} />
        <Kpi label="Website visits" value={fmt(s.visits)} delta={pct(s.visits, s.visitsPrev)} spark={s.visitsTrend} href={`/staff/seo${q}`} />
      </div>

      <div className="sx-grid g-21">
        <Card title="Website visits" sub="Weekly, last 12 weeks" action={<Badge tone="good">▲ {pct(s.visitsTrend[11], s.visitsTrend[0])}% since the calendar went live daily</Badge>}>
          <LineChart
            labels={weekTicks()}
            series={
              c
                ? [{ name: s.label, values: s.visitsTrend, color: "var(--c1)" }]
                : stats.slice(0, 6).map((x, i) => ({ name: x.short, values: x.visitsTrend, color: `var(--c${i + 1})` }))
            }
          />
        </Card>
        <Card title="Website freshness" sub="Every calendar and menu up to date?" action={<Badge tone={freshCount === s.list.length ? "good" : "warn"}>{freshCount} of {s.list.length} current</Badge>}>
          <ul className="sx-list">
            {s.list.map((x) => (
              <li key={x.slug} className="sx-fresh">
                <b>{nameOf(x.slug)}</b>
                <Badge tone={x.fresh === "fresh" ? "good" : x.fresh === "due" ? "warn" : "bad"}>{x.fresh === "fresh" ? "Up to date" : x.fresh === "due" ? "Due soon" : "Out of date"}</Badge>
                <small>
                  Calendar {x.calendarUpdated} · Menu {x.menuUpdated}
                  {x.fresh === "stale" && (
                    <>
                      {" · "}
                      <Link href={`/staff/calendar?c=${x.slug}`}>Remind {x.ed.split(" ")[0]}</Link>
                    </>
                  )}
                </small>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="sx-grid g-3">
        <Card title="Enquiries by source" sub={`${s.enquiries} this week`}>
          <HBars items={sources.map((x) => ({ label: x.k, value: Math.max(1, Math.round(s.enquiries * x.share)) }))} />
        </Card>
        <Card title="Visibility" sub="How often you are found and recommended">
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <Score v={s.geo} />
              <div>
                <b>AI search score</b>
                <p className="sx-note" style={{ margin: 0 }}>
                  Recommended in 4 of 8 tracked answers; 3 wrong facts have fixes ready. <Link href={`/staff/geo${q}`}>See answers</Link>
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <span className="sx-score" style={{ width: 92, height: 92, background: "#f3f2ec" }}>
                <b>{s.seoPos.toFixed(1)}</b>
              </span>
              <div>
                <b>Average Google position</b>
                <p className="sx-note" style={{ margin: 0 }}>
                  For “assisted living” and “memory care” searches in your towns. <Link href={`/staff/seo${q}`}>See rankings</Link>
                </p>
              </div>
            </div>
          </div>
        </Card>
        <Card title="Today across the organisation" sub="Live">
          <ul className="sx-feed">
            {feed()
              .filter((f) => !c || f.where === nameOf(c))
              .map((f) => (
                <li key={f.when + f.who}>
                  <time>{f.when}</time>
                  <i className={f.tone} />
                  <span>
                    <b>{f.who}</b> {f.what} <small style={{ color: "var(--sx-ink-3)" }}>· {f.where}</small>
                  </span>
                </li>
              ))}
          </ul>
        </Card>
      </div>

      {!c && (
        <Card title="Communities at a glance" sub="This week" action={<Link className="sx-link" href="/staff/communities">All communities →</Link>} pad={false}>
          <div className="sx-table-wrap">
            <table className="sx-table">
              <thead>
                <tr>
                  <th>Community</th>
                  <th className="num">Families reached</th>
                  <th className="num">Posts</th>
                  <th className="num">Opened</th>
                  <th className="num">Tours</th>
                  <th className="num">Enquiries</th>
                  <th className="num">Visits</th>
                  <th>Website</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((x) => (
                  <tr key={x.slug}>
                    <td>
                      <Link href={`/staff/dashboard?c=${x.slug}`} className="sx-link">
                        {nameOf(x.slug)}
                      </Link>
                    </td>
                    <td className="num">
                      {x.familiesReached} / {x.families}
                    </td>
                    <td className="num">{x.posts}</td>
                    <td className="num">{x.openRate}%</td>
                    <td className="num">{x.tours}</td>
                    <td className="num">{x.enquiries}</td>
                    <td className="num">{fmt(x.visits)}</td>
                    <td>
                      <Badge tone={x.fresh === "fresh" ? "good" : x.fresh === "due" ? "warn" : "bad"}>{x.freshNote}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
