import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { QueueList } from "@/components/staff/portal/Queue";
import { Schedule } from "@/components/staff/portal/Schedule";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { Badge } from "@/components/staff/ui";
import { queueFor, schedule, viewer, weekAhead } from "@/data/staff/portal";
import { getStaffCommunity, getStaffRole } from "@/data/staff/server";
import { greeting, longDate, today } from "@/lib/clock";

export const metadata: Metadata = { title: "Today" };

const emptyFor = { events: "Nothing waiting. New RSVPs, replies and sign-ups appear here.", sales: "Nothing waiting. New inquiries appear here the moment they arrive.", manager: "Nothing waiting for your approval." } as const;

export default async function TodayPage() {
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Today" />;
  const { s } = sc;
  const as = await getStaffRole();
  const me = viewer(s.slug, as);
  const items = queueFor(s.slug, as);
  const events = schedule(s.slug);
  const week = as === "manager" ? weekAhead(s.slug) : [];
  const { familiesReached } = s.weekKpis;

  return (
    <div className="pt-today">
      <header className="pt-hello">
        <div>
          <h1>{greeting()}, <em>{me.first}</em></h1>
          <p>{longDate(today())}</p>
        </div>
        <Link href="/staff/post" className="sx-btn sx-btn-terra sx-btn-lg pt-post">
          <Icon name="plus" /> Post something
        </Link>
      </header>

      <p className="pt-result">
        <Icon name="check" /> <span><b>{familiesReached} of {s.community.families} families</b> reached this week</span>
      </p>

      <div className="pt-today-grid">
        <QueueList items={items} empty={emptyFor[as]} />
        <div className="pt-side">
          <Schedule events={events} />
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
