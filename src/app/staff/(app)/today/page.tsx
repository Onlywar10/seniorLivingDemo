import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { OpenCommunity } from "@/components/staff/portal/OpenCommunity";
import { QueueList } from "@/components/staff/portal/Queue";
import { Activities, Celebrations, NotSeen, ReadyToReview, SomethingChanged, WelcomeList } from "@/components/staff/portal/TodayBlocks";
import { Badge } from "@/components/staff/ui";
import { communities } from "@/data/communities";
import { getStaffData } from "@/data/staff";
import { celebrations, concerns, todayActivities, unseen, welcomes } from "@/data/staff/engage";
import { queueFor, viewer, weekAhead, type QItem } from "@/data/staff/portal";
import { getStaffCommunity, getStaffRole } from "@/data/staff/server";
import { accessOf, type StaffRole } from "@/data/staff/shared";
import { greeting, longDate, today } from "@/lib/clock";
import { communitySlugs } from "@/lib/sites";

export const metadata: Metadata = { title: "Today" };

const emptyFor: Record<StaffRole, string> = {
  events: "Nothing waiting. New RSVPs, replies and sign-ups appear here.",
  sales: "Nothing waiting. New inquiries appear here the moment they arrive.",
  manager: "Nothing waiting for your approval.",
  kitchen: "Nothing waiting. Menus to check appear here.",
  desk: "Nothing waiting. Residents to ask in person appear here.",
};

export default async function TodayPage() {
  const as = await getStaffRole();
  const sc = await getStaffCommunity();
  if (!sc) return <AllCommunities as={as} />;
  const { s, c } = sc;
  const me = viewer(s.slug, as);
  const all = queueFor(s.slug, as);
  const reviews = all.filter((q): q is Extract<QItem, { kind: "review" }> => q.kind === "review");
  const items = all.filter((q) => q.kind !== "review");
  const acts = todayActivities(s.slug);
  const { familiesReached } = s.weekKpis;

  // What each person sees besides "Needs you". A salesperson never sees attendance; the kitchen gets its menus;
  // the activities team and front desk get everything about today's activities and residents.
  const team = as === "events" || as === "desk";
  const week = as === "manager" ? weekAhead(s.slug) : [];
  const reports = accessOf(as, "reports");

  return (
    <div className="pt-today">
      <header className="pt-hello">
        <div>
          <h1>{greeting()}, <em>{me.first}</em></h1>
          <p>{longDate(today())}</p>
        </div>
        {accessOf(as, "post") ? (
          <Link href="/staff/post" className="sx-btn sx-btn-terra sx-btn-lg pt-post">
            <Icon name="plus" /> Post something
          </Link>
        ) : as === "kitchen" ? (
          <Link href="/staff/menus" className="sx-btn sx-btn-terra sx-btn-lg pt-post">
            <Icon name="upload" /> Upload menus
          </Link>
        ) : null}
      </header>

      <p className="pt-result">
        <Icon name="check" />
        <span>
          <b>{familiesReached} of {s.community.families} families</b> reached this week
          {reports && <> · <Link className="sx-link" href="/staff/reports">See Reports</Link></>}
        </span>
      </p>

      <div className="pt-today-grid">
        <div className="pt-main">
          <QueueList items={items} empty={emptyFor[as]} reviews={reviews.length} />
          <ReadyToReview items={reviews} />
          {team && <WelcomeList items={welcomes(s.slug)} />}
          {as === "events" && <NotSeen items={unseen(s.slug)} me={me.name} />}
        </div>
        <div className="pt-side">
          {as !== "kitchen" && <Activities events={acts} attendance={team} photos={team} />}
          {team && <SomethingChanged events={[...acts, ...todayActivities(s.slug, 1)]} rooms={Object.values(c.rooms)} community={s.brand.name} phone={s.brand.phone} />}
          {(team || as === "manager") && <Celebrations items={celebrations(s.slug)} />}
          {as === "kitchen" && (
            <section className="sx-card" aria-labelledby="pt-menu-h">
              <header className="sx-card-head">
                <div>
                  <h2 id="pt-menu-h">Live on the website today</h2>
                  <p>Today’s menus, on the dining page and every community page.</p>
                </div>
                <Link href="/staff/menus" className="sx-btn sx-btn-sm">Menus</Link>
              </header>
              <ul className="pt-week">
                {c.venueOrder.map((v) => {
                  const m = c.menuFor(v, today());
                  return (
                    <li key={v}>
                      <span><b>{c.venues[v].name}</b><small>{c.venues[v].hours}</small></span>
                      <span><Badge tone="good">Live</Badge><small>Special: {m.special.name}</small></span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
          {week.length > 0 && (
            <section className="sx-card" aria-labelledby="pt-week-h">
              <header className="sx-card-head">
                <div>
                  <h2 id="pt-week-h">The week ahead</h2>
                  <p>What families and visitors will notice.</p>
                </div>
                <Link href="/staff/calendar" className="sx-btn sx-btn-sm">Calendar</Link>
              </header>
              <ul className="pt-week">
                {week.map((w) => (
                  <li key={w.id}>
                    <span><b>{w.title}</b><small>{w.when}</small></span>
                    <span>
                      {w.kind !== "resident" && <Badge tone={w.kind === "public" ? "accent" : "info"}>{w.kind === "public" ? "Public" : "Family"}</Badge>}
                      <small>{w.note}</small>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

/** "All communities": every community side by side, with what's waiting for this person in each. */
function AllCommunities({ as }: { as: StaffRole }) {
  const me = viewer(communitySlugs[0], as);
  return (
    <div className="pt-today">
      <header className="pt-hello">
        <div>
          <h1>{greeting()}, <em>{me.first}</em></h1>
          <p>{longDate(today())} · All communities</p>
        </div>
        {accessOf(as, "post") === "full" && (
          <Link href="/staff/post?type=announcement" className="sx-btn sx-btn-terra sx-btn-lg pt-post">
            <Icon name="plus" /> Post to every community
          </Link>
        )}
      </header>
      <div className="sx-grid g-2">
        {communitySlugs.map((slug) => {
          const s = getStaffData(slug);
          const site = communities[slug].site;
          const q = queueFor(slug, as);
          const open = concerns(slug).filter((x) => x.status !== "Resolved").length;
          return (
            <section key={slug} className="sx-card pt-allc" aria-label={site.name}>
              <header className="sx-card-head">
                <div>
                  <h2>{site.name}</h2>
                  <p>{site.address.city}</p>
                </div>
                <OpenCommunity slug={slug} name={site.name} />
              </header>
              <ul className="pt-week">
                <li><span><b>Waiting for you</b></span><span><b>{q.length}</b></span></li>
                <li><span><b>Posts to approve</b></span><span>{s.approvals.length}</span></li>
                <li><span><b>Family concerns open</b></span><span>{open}</span></li>
                <li><span><b>Families reached this week</b></span><span>{s.weekKpis.familiesReached} of {s.community.families}</span></li>
              </ul>
            </section>
          );
        })}
      </div>
      {accessOf(as, "reports") === "full" && (
        <p><Link className="sx-btn" href="/staff/reports/communities"><Icon name="chart" /> Every community side by side, in Reports</Link></p>
      )}
    </div>
  );
}
