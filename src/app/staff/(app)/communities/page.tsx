import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHead, Card, Badge } from "@/components/staff/ui";
import { ShareAcross } from "@/components/staff/ShareAcross";
import { Icon } from "@/components/Icon";
import { communities } from "@/data/group";
import { stats } from "@/data/staff";

export const metadata: Metadata = { title: "Communities" };

const sharedThisMonth = [
  ["Flu clinic for families", "News", "Central office", "6 of 6"],
  ["Fall four-week menu cycle", "Menu", "Ashby Grove", "3 of 6"],
  ["Veterans Day tea", "Activity idea", "Maple Court", "6 of 6"],
  ["Large-print calendar template", "Template", "Central office", "6 of 6"],
];

export default function CommunitiesPage() {
  return (
    <>
      <PageHead title="Communities" sub="All six at a glance. Open one to work in it, or share content across them.">
        <ShareAcross />
      </PageHead>
      <div className="sx-comm">
        {communities.map((c) => {
          const s = stats.find((x) => x.slug === c.slug)!;
          return (
            <article key={c.slug} className="sx-cc">
              <div className="sx-cc-photo">
                <Image src={c.photo} alt="" fill sizes="400px" />
                <Badge tone={s.fresh === "fresh" ? "good" : s.fresh === "due" ? "warn" : "bad"}>{s.freshNote}</Badge>
              </div>
              <div className="sx-cc-body">
                <h3>
                  {c.name}
                  <small>
                    {c.city}, {c.state} · {c.care.join(", ")} · ED {c.director}
                  </small>
                </h3>
                <div className="sx-cc-stats">
                  <div>
                    <b>{s.occupancy}%</b>
                    <span>occupied</span>
                  </div>
                  <div>
                    <b>{s.tours}</b>
                    <span>tours this week</span>
                  </div>
                  <div>
                    <b>{s.geo}</b>
                    <span>AI visibility</span>
                  </div>
                  <div>
                    <b>{s.familiesReached}</b>
                    <span>families reached</span>
                  </div>
                  <div>
                    <b>{s.openRate}%</b>
                    <span>opened</span>
                  </div>
                  <div>
                    <b>★ {s.rating}</b>
                    <span>{s.reviews} reviews</span>
                  </div>
                </div>
                <div className="sx-cc-actions">
                  <Link className="sx-btn sx-btn-primary" href={`/staff/dashboard?c=${c.slug}`}>
                    Open
                  </Link>
                  <Link className="sx-btn" href={c.href ?? "/"} target="_blank">
                    <Icon name="globe" /> Website
                  </Link>
                  <Link className="sx-btn" href={`/staff/publish?c=${c.slug}`}>
                    <Icon name="send" /> Post
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <Card title="Shared across communities this month" pad={false}>
        <div className="sx-table-wrap">
          <table className="sx-table">
            <tbody>
              {sharedThisMonth.map(([a, b, cc, d]) => (
                <tr key={a}>
                  <td>
                    <b>{a}</b>
                  </td>
                  <td>
                    <Badge tone="neutral">{b}</Badge>
                  </td>
                  <td>From {cc}</td>
                  <td className="num">Used by {d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
