import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Avatar, Badge, Card, Delta, HBars, Kpi, LineChart, Meter, fmt, pctChange } from "@/components/staff/ui";
import { cats, eventsBetween, eventsOn, isHarbor } from "@/data/calendar";
import { activity, ago, atToday, community, dailyVisits, enquirySources, enquirySourcesPrev, staffPeople, user, weekKpis } from "@/data/staff";
import { dayShort, fmtRange, fmtTime, greeting, iso, longDate, nowMinutes, today } from "@/lib/clock";

export const metadata: Metadata = { title: "Dashboard" };

export default function Dashboard() {
  const t = today();
  const now = nowMinutes();
  const todays = eventsOn(t).filter((e) => !isHarbor(e) || e.cat !== "harbor");
  const harborToday = eventsOn(t).filter((e) => e.cat === "harbor").length;
  const trips = eventsBetween(t, 8, iso(t))
    .flatMap((d) => d.events.filter((e) => e.cap && e.cat === "trips").map((e) => ({ ...e, d: d.date })))
    .slice(0, 6);
  const later = todays.filter((e) => (e.end ?? e.start + 60) >= now);
  const upcoming = later.length >= 3 ? later : todays.slice(-6);
  const earlier = todays.length - upcoming.length;
  const visits = dailyVisits(30);
  const prev = dailyVisits(30, 30);
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
            {longDate(t)} · {todays.length} events on today’s calendar · 4 posts waiting for Cheryl
          </p>
        </div>
        <div className="sx-head-actions">
          <Link href="/staff/approvals" className="sx-btn">
            <Icon name="check" /> Approvals <Badge tone="accent">4</Badge>
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
            <Fresh title="Activity calendar" detail="Current through November 30 · published by Toni Glenn" when={ago(60 * 190)} />
            <Fresh title="Today’s menus, all three restaurants" detail="Published by Conrad Caguimbal" when={atToday(370)} />
            <Fresh title="Last photo post" detail="Happy Hour: Jeremy on Guitar · 12 photos" when={ago(60 * 21)} />
            <Fresh title="Apartment availability" detail="8 available · synced with the business office" when={ago(118)} />
            <Fresh title="News" detail="Walk to End Alzheimer’s · 14 photos" when={ago(60 * 28)} />
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

        <Card title="Today at Prairie City Landing" sub={`${todays.length} events · plus ${harborToday} in Harbor`} action={<Link className="sx-btn sx-btn-sm" href="/calendar" target="_blank">On the website</Link>}>
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
