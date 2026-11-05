import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Overview } from "@/components/staff/Overview";
import { Avatar, Badge, Card, Delta, HBars, Kpi, LineChart, Meter, fmt, pctChange } from "@/components/staff/ui";
import { cats, isLantern } from "@/data/shared";
import { ago, atToday, dailyVisits, siteHref, staffPeople, user } from "@/data/staff";
import { getStaffCommunity } from "@/data/staff/server";
import { dayShort, fmtRange, fmtTime, greeting, iso, longDate, nowMinutes, today } from "@/lib/clock";

export const metadata: Metadata = { title: "Dashboard" };

export default async function Dashboard() {
  const sc = await getStaffCommunity();
  if (!sc) return <Overview screen="dashboard" />;
  const { s, c } = sc;
  const { activity, community, enquirySources, enquirySourcesPrev, weekKpis } = s;
  const { staffEventsBetween: eventsBetween, staffEventsOn: eventsOn } = c;
  const approver = s.people[s.roles.approver];
  const t = today();
  const now = nowMinutes();
  const todays = eventsOn(t).filter((e) => !isLantern(e) || e.cat !== "lantern");
  const lanternToday = eventsOn(t).filter((e) => e.cat === "lantern").length;
  const trips = eventsBetween(t, 8, iso(t))
    .flatMap((d) => d.events.filter((e) => e.cap && e.cat === "trips").map((e) => ({ ...e, d: d.date })))
    .slice(0, 6);
  const later = todays.filter((e) => (e.end ?? e.start + 60) >= now);
  const upcoming = later.length >= 3 ? later : todays.slice(-6);
  const earlier = todays.length - upcoming.length;
  const visits = dailyVisits(30, 0, s.visitScale);
  const prev = dailyVisits(30, 30, s.visitScale);
  const total = visits.reduce((n, v) => n + v.v, 0);
  const prevTotal = prev.reduce((n, v) => n + v.v, 0);
  const enq = enquirySources.reduce((n, s) => n + s.value, 0);
  const enqPrev = enquirySourcesPrev.reduce((n, s) => n + s, 0);

  return (
    <>
      <div className="sx-hello">
        <div>
          <h1>
            {greeting()}, <em>{user.first}</em>
          </h1>
          <p>
            {longDate(t)} · {todays.length} events on today’s calendar · {s.approvals.length} posts waiting for {approver.name.split(" ")[0]}
          </p>
        </div>
        <div className="sx-head-actions">
          <Link href="/staff/approvals" className="sx-btn">
            <Icon name="check" /> Approvals <Badge tone="accent">{s.approvals.length}</Badge>
          </Link>
          <Link href="/staff/publish" className="sx-btn sx-btn-primary">
            <Icon name="send" /> Post once, publish everywhere
          </Link>
        </div>
      </div>

      <div className="sx-kpis">
        <Kpi label="Families reached this week" value={<>{weekKpis.familiesReached}<small> / {community.families}</small></>} note={`${Math.round((weekKpis.familiesReached / community.families) * 100)}% opened at least one message`} href="/staff/families" />
        <Kpi label="Posts this week" value={weekKpis.postsThisWeek} delta={weekKpis.postsThisWeek - weekKpis.postsLastWeek} deltaSuffix="" note="vs last week" href="/staff/publish" />
        <Kpi label="Messages sent" value={fmt(weekKpis.messagesSent)} note={`${weekKpis.deliveredRate}% delivered · ${weekKpis.openRate}% opened`} href="/staff/messages" />
        <Kpi label="Open rate" value={`${weekKpis.openRate}%`} delta={weekKpis.openRate - weekKpis.openRateLast} deltaSuffix=" pts" note="vs last week" href="/staff/messages" />
        <Kpi label="Tours booked" value={weekKpis.toursBooked} delta={weekKpis.toursBooked - weekKpis.toursLast} deltaSuffix="" note="vs last week" href="/staff/tours" />
      </div>

      <div className="sx-grid g-21">
        <Card title="Website visits" sub="Last 30 days, all pages" action={<Link className="sx-btn sx-btn-sm" href="/staff/seo">Search report</Link>}>
          <div className="sx-visits-head">
            <span className="sx-bignum">{fmt(total)}</span>
            <Delta v={pctChange(total, prevTotal)} label="vs previous 30 days" />
          </div>
          <ul className="sx-legend">
            <li><i style={{ background: "var(--green)" }} />This period</li>
            <li style={{ color: "#b3a790" }}><i className="dash" />Previous 30 days</li>
          </ul>
          <LineChart
            label={`Daily website visits over the last 30 days, ${fmt(total)} in total, up ${pctChange(total, prevTotal)}% on the previous 30 days`}
            labels={visits.map((v) => v.label)}
            series={[
              { name: "Previous", values: prev.map((v) => v.v), color: "#c9bea8", dashed: true },
              { name: "Visits", values: visits.map((v) => v.v), color: "var(--green)", area: true },
            ]}
            height={230}
            every={7}
            ends={false}
          />
        </Card>

        <Card title="Website freshness" sub="Everything families see is current" action={<Badge tone="good"><Icon name="check" /> All current</Badge>}>
          <ul className="sx-list">
            {s.freshness.map((f) => (
              <Fresh key={f.title} title={f.title} detail={f.detail} when={f.at !== undefined ? atToday(f.at) : ago(f.mins ?? 0)} />
            ))}
          </ul>
        </Card>
      </div>

      <div className="sx-grid g-3">
        <Card title="Enquiries by source" sub={`This month · ${enq} enquiries`} action={<Delta v={pctChange(enq, enqPrev)} label="vs last month" />}>
          <HBars items={enquirySources.map((s, i) => ({ label: s.label, value: s.value, note: s.value > enquirySourcesPrev[i] ? `+${s.value - enquirySourcesPrev[i]}` : undefined }))} />
        </Card>

        <Card title="Trip sign-ups" sub="Capped outings in the next 7 days" action={<Link className="sx-btn sx-btn-sm" href="/staff/calendar">Calendar</Link>}>
          <ul className="sx-trips">
            {trips.map((e) => {
              const full = (e.taken ?? 0) >= (e.cap ?? 0);
              return (
                <li key={e.id}>
                  <div className="top">
                    <b>{e.title.replace(/^Bus Trip: /, "")}</b>
                    <span>
                      {e.taken}/{e.cap}
                    </span>
                  </div>
                  <Meter v={((e.taken ?? 0) / (e.cap ?? 1)) * 100} tone={full ? "var(--terra)" : "var(--green)"} label={`${e.taken} of ${e.cap} seats taken`} />
                  <small>
                    {dayShort(e.d)}, {fmtTime(e.start)} · {e.room}
                    {full ? ` · Full, ${e.waitlist} on the waitlist` : ` · ${(e.cap ?? 0) - (e.taken ?? 0)} seats left`}
                  </small>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card title={`Today at ${s.brand.name}`} sub={`${todays.length} events · plus ${lanternToday} in Lantern`} action={<Link className="sx-btn sx-btn-sm" href={siteHref(s.slug, "/calendar")} target="_blank">On the website</Link>}>
          <ul className="sx-today">
            {upcoming.slice(0, 9).map((e) => {
              const endM = e.end ?? e.start + 60;
              const cls = endM < now ? "past" : e.start <= now ? "now" : "";
              return (
                <li key={e.id} className={cls}>
                  <time>{fmtTime(e.start)}</time>
                  <span>
                    <span className="sx-dot" style={{ background: cats[e.cat].color }} aria-hidden="true" />
                    {e.title}
                    <small>
                      {e.room}
                      {e.end ? ` · ${fmtRange(e.start, e.end)}` : ""}
                      {cls === "now" ? " · On now" : ""}
                    </small>
                  </span>
                </li>
              );
            })}
          </ul>
          {upcoming.length > 9 && <p className="sx-note">+ {upcoming.length - 9} more later today</p>}
          {earlier > 0 && upcoming.length < todays.length && <p className="sx-note">{earlier} earlier today</p>}
        </Card>
      </div>

      <Card title="Recent activity" sub="What the team has posted, sent and approved">
        <ul className="sx-feed">
          {activity.map((a, i) => (
            <li key={i}>
              <Avatar who={a.who} />
              <div>
                <p>
                  <b>{staffPeople[a.who].name}</b> {a.text}
                  {a.tone === "wait" && (
                    <>
                      {" "}
                      <Badge tone="warn">Waiting for approval</Badge>
                    </>
                  )}
                </p>
                <time>{ago(a.mins)}</time>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

function Fresh({ title, detail, when }: { title: string; detail: string; when: string }) {
  return (
    <li className="sx-fresh">
      <span className="ok">
        <Icon name="check" />
      </span>
      <b>{title}</b>
      <Badge tone="good">{when}</Badge>
      <small>{detail}</small>
    </li>
  );
}
