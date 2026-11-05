import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import { ProspectInbox, type Prospect } from "@/components/staff/ProspectInbox";
import { signupMessages, type ProspectCtx } from "@/components/staff/prospects";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { Avatar, Badge, Card, HBars, Kpi, PageHead } from "@/components/staff/ui";
import { ago, dayLabel, siteHref, staffPeople } from "@/data/staff";
import { eventRequests, prospectMessages, when } from "@/data/staff/alpha";
import { getStaffCommunity } from "@/data/staff/server";
import { fmtTime, nowMinutes } from "@/lib/clock";

export const metadata: Metadata = { title: "Tours & enquiries" };

export default async function ToursPage() {
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Tours & enquiries" />;
  const { s, c } = sc;
  const { enquiries, enquirySources, followUps, funnel, tours } = s;
  const now = nowMinutes();
  const upcoming = tours.filter((t) => t.days > 0 || t.time + 60 > now);
  const byDay = upcoming.reduce<Record<number, typeof tours>>((m, t) => ((m[t.days] ??= []).push(t), m), {});
  const thisWeek = tours.filter((t) => t.days < 7).length;
  const max = funnel[0].value;
  const rep = s.people[s.roles.tours].name;
  const ctx: ProspectCtx = { site: c.site.name, rep, phone: s.brand.phone, address: c.site.addressLine, domain: s.brand.domain };

  // Every prospect with the messages they received: inquiries (with their tour, if booked), tours booked directly,
  // and open house sign-ups from the website, which are leads too.
  const tourOf = (name: string) => tours.find((t) => t.who === name);
  const prospects: Prospect[] = [
    ...enquiries.map((e) => {
      const t = tourOf(e.name);
      return {
        id: `enq-${e.name}`, name: e.name, source: e.source, interest: e.interest, status: e.status, when: `Asked ${ago(e.mins)}`, note: e.msg,
        msgs: prospectMessages(s.slug, { name: e.name, interest: e.interest, mins: e.mins, tour: t ? { days: t.days, time: t.time } : undefined }),
      };
    }),
    ...eventRequests(s.slug)
      .filter((r) => r.kind === "public-signup")
      .filter((r, i, all) => all.findIndex((x) => x.from === r.from) === i)
      .map((r) => ({
        id: `pub-${r.id}`, name: r.from, source: "Website: Open House sign-up", interest: r.event.title, status: "New" as const,
        when: `Signed up ${ago(r.mins)} for ${when(r.event)}`, note: r.note, contact: [r.phone, r.email].filter(Boolean).join(" · "),
        msgs: signupMessages(ctx, { name: r.from, eventTitle: r.event.title, date: r.event.date, start: r.event.start, party: r.party, at: ago(r.mins) }),
      })),
    ...tours
      .filter((t) => !enquiries.some((e) => e.name === t.who))
      .map((t) => ({
        id: `tour-${t.who}`, name: t.who, source: t.source, interest: t.interest, status: "Tour booked" as const,
        when: `Tour ${t.days < 2 ? dayLabel(t.days).toLowerCase() : `on ${dayLabel(t.days)}`} at ${fmtTime(t.time)}`, note: t.note,
        msgs: prospectMessages(s.slug, { name: t.who, interest: t.interest, tour: { days: t.days, time: t.time } }),
      })),
  ];

  return (
    <>
      <PageHead title="Tours & enquiries" sub={`Every enquiry from the website, Google, AI search, open house sign-ups and referral partners, in one list for ${rep}, with the messages each one received.`}>
        <a className="sx-btn" href={siteHref(s.slug, "/contact")} target="_blank"><Icon name="globe" /> Tour booking page</a>
      </PageHead>
      <div className="sx-kpis">
        <Kpi label="Tours, next 7 days" value={thisWeek} note={`${tours.length} in the next two weeks`} />
        <Kpi label="New enquiries" value={enquiries.filter((e) => e.status === "New").length} note="waiting for a first reply" />
        <Kpi label="Average first reply" value={s.firstReply.value} delta={s.firstReply.delta} invert note="vs last month" />
        <Kpi label="Enquiry to tour" value={`${Math.round((funnel[1].value / funnel[0].value) * 100)}%`} note="last 90 days" />
      </div>

      <div className="sx-grid g-21">
        <Card title="Upcoming tours" sub="This week and next">
          {Object.entries(byDay).map(([d, list]) => (
            <div key={d}>
              <h3 className="tour-day">{dayLabel(Number(d))}</h3>
              {list.map((t) => (
                <div className="tour" key={t.who}>
                  <time>{fmtTime(t.time)}</time>
                  <div>
                    <b>{t.who}</b> <span className="sx-hint">for {t.for}</span>
                    <small>{t.interest} · {t.source}{t.lunch ? ` · Lunch in the ${s.tourLunch}` : ""}</small>
                    {t.note && <small>“{t.note}”</small>}
                  </div>
                  <span className="sx-name"><Avatar who={t.with} size={28} /><span className="sx-hint">{staffPeople[t.with].name.split(" ")[0]}</span></span>
                </div>
              ))}
            </div>
          ))}
        </Card>
        <div className="sx-grid">
          <Card title="Conversion" sub="Last 90 days">
            <div className="funnel">
              {funnel.map((f, i) => (
                <div className="funnel-row" key={f.label}>
                  <span>{f.label}</span>
                  <span className="funnel-bar" style={{ width: `${Math.max(12, (f.value / max) * 100)}%`, background: ["var(--green)", "var(--sky)", "var(--olive)", "var(--terra-deep)"][i] }}>{f.value}</span>
                  <small>{i ? `${Math.round((f.value / funnel[i - 1].value) * 100)}%` : ""}</small>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Follow-ups due">
            <ul className="sx-list">
              {followUps.map((f) => (
                <li key={f.who}>
                  <b>{f.who}</b> {f.overdue ? <Badge tone="bad">Overdue</Badge> : <Badge tone={f.due === 0 ? "warn" : "neutral"}>{dayLabel(f.due)}</Badge>}
                  <br /><span className="sx-hint">{f.what}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <div className="sx-grid g-21">
        <Card title="Enquiries and what they received" sub={`${prospects.length} prospects · choose one to see their phone`} pad={false}>
          <ProspectInbox prospects={prospects} slug={s.slug} ctx={ctx} />
        </Card>
        <Card title="Where enquiries come from" sub="This month · open house sign-ups count as leads">
          <HBars items={enquirySources.map((s) => ({ label: s.label, value: s.value }))} color="var(--sky)" />
        </Card>
      </div>
    </>
  );
}
