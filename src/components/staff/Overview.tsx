// The Wrenhaven-wide overview: one card per community, side by side, on the dashboard and the scorecard.
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { allSummaries, scorecardMonths, user } from "@/data/staff";
import { greeting, longDate, today } from "@/lib/clock";
import { OpenCommunity } from "./StaffCommunity";
import { Badge, Card, Delta, Meter, fmt, pctChange } from "./ui";

export function Overview({ screen }: { screen: "dashboard" | "scorecard" }) {
  const sums = allSummaries();
  const total = (k: "toursThisWeek" | "enquiries" | "waitlist" | "approvals" | "unread" | "apartments" | "families") => sums.reduce((n, s) => n + s[k], 0);
  const occ = sums.reduce((n, s) => n + s.occupancy * s.apartments, 0) / total("apartments");
  const m = scorecardMonths();
  return (
    <>
      <div className="sx-hello">
        <div>
          <h1>
            {screen === "dashboard" ? (
              <>
                {greeting()}, <em>{user.first}</em>
              </>
            ) : (
              <>Monthly scorecard · {m.label}</>
            )}
          </h1>
          <p>
            {screen === "dashboard" ? `${longDate(today())} · ` : ""}All Wrenhaven communities · {sums.length} communities, {total("apartments")} apartments, {fmt(total("families"))} families
          </p>
        </div>
      </div>

      <div className="sx-kpis">
        <div className="sx-kpi"><span className="sx-kpi-l">Occupancy, all communities</span><span className="sx-kpi-v">{occ.toFixed(1)}%</span><span className="sx-kpi-n">weighted by apartments</span></div>
        <div className="sx-kpi"><span className="sx-kpi-l">Tours, next 7 days</span><span className="sx-kpi-v">{total("toursThisWeek")}</span><span className="sx-kpi-n">across {sums.length} communities</span></div>
        <div className="sx-kpi"><span className="sx-kpi-l">Enquiries this month</span><span className="sx-kpi-v">{total("enquiries")}</span><span className="sx-kpi-n"><Delta v={pctChange(total("enquiries"), sums.reduce((n, s) => n + s.enquiriesPrev, 0))} /> vs last month</span></div>
        <div className="sx-kpi"><span className="sx-kpi-l">Waiting for approval</span><span className="sx-kpi-v">{total("approvals")}</span><span className="sx-kpi-n">{total("unread")} unread family replies</span></div>
      </div>

      <div className="ov-grid">
        {sums.map((s) => (
          <Card
            key={s.slug}
            className="ov-card"
            title={<>{s.name} <small>{s.city}</small></>}
            action={<OpenCommunity slug={s.slug} name={s.name} />}
          >
            <dl className="ov-stats">
              <div>
                <dt>Occupancy</dt>
                <dd>
                  {s.occupancy.toFixed(1)}% <small>of {s.apartments}</small>
                  <Meter v={s.occupancy} tone="var(--green)" label={`${s.occupancy.toFixed(1)}% occupied`} />
                </dd>
              </div>
              <div>
                <dt>Tours this week</dt>
                <dd>{s.toursThisWeek}</dd>
              </div>
              <div>
                <dt>Enquiries this month</dt>
                <dd>{s.enquiries} <small>{s.newEnquiries} new</small></dd>
              </div>
              <div>
                <dt>Waitlist</dt>
                <dd>{s.waitlist} <small>households</small></dd>
              </div>
              <div>
                <dt>Pending approvals</dt>
                <dd>{s.approvals ? <Badge tone="accent">{s.approvals} waiting</Badge> : <Badge tone="good">None</Badge>}</dd>
              </div>
              <div>
                <dt>Unread messages</dt>
                <dd>{s.unread ? <Badge tone="warn">{s.unread} unread</Badge> : <Badge tone="good">None</Badge>}</dd>
              </div>
              {screen === "scorecard" && (
                <>
                  <div>
                    <dt>Families reached</dt>
                    <dd>{s.familiesReached} <small>of {s.families}</small></dd>
                  </div>
                  <div>
                    <dt>AI search visibility</dt>
                    <dd>{s.visibility} <small>/ 100</small></dd>
                  </div>
                  <div>
                    <dt>Message open rate</dt>
                    <dd>{s.openRate}%</dd>
                  </div>
                  <div>
                    <dt>Google rating</dt>
                    <dd>{s.rating.toFixed(1)}</dd>
                  </div>
                </>
              )}
            </dl>
          </Card>
        ))}
      </div>

      <Card title="Side by side" sub="Open a community to see its full screens" pad={false}>
        <div className="sx-table-wrap">
          <table className="sx-table">
            <thead>
              <tr>
                <th>Community</th>
                <th className="num">Occupancy</th>
                <th className="num">Tours this week</th>
                <th className="num">Enquiries</th>
                <th className="num">Waitlist</th>
                <th className="num">Approvals</th>
                <th className="num">Unread</th>
                <th><span className="vh">Open</span></th>
              </tr>
            </thead>
            <tbody>
              {sums.map((s) => (
                <tr key={s.slug}>
                  <td><b>{s.name}</b><small>{s.city}</small></td>
                  <td className="num">{s.occupancy.toFixed(1)}%</td>
                  <td className="num">{s.toursThisWeek}</td>
                  <td className="num">{s.enquiries}</td>
                  <td className="num">{s.waitlist}</td>
                  <td className="num">{s.approvals}</td>
                  <td className="num">{s.unread}</td>
                  <td><OpenCommunity slug={s.slug} name={s.name} className="sx-btn sx-btn-sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="sx-note">
        <Icon name="info" /> Each community’s team sees only its own screens. <Link className="sx-link" href="/" target="_blank">Wrenhaven Senior Living website</Link>
      </p>
    </>
  );
}
