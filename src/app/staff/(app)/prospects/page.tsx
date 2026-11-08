import type { Metadata } from "next";
import { NotYours } from "@/components/staff/portal/NotYours";
import { sectionsFor } from "@/data/staff/shared";
import { getStaffRole as getRole } from "@/data/staff/server";
import { Icon } from "@/components/Icon";
import { ProspectInbox, type Prospect } from "@/components/staff/ProspectInbox";
import { signupMessages, type ProspectCtx } from "@/components/staff/prospects";
import { Availability, Tours, Waitlist, type TourRow } from "@/components/staff/portal/Sales";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { Card, PageHead } from "@/components/staff/ui";
import { ago, dayLabel, siteHref, staffPeople } from "@/data/staff";
import { eventRequests, prospectMessages, when } from "@/data/staff/alpha";
import { availability, waitlistInOrder } from "@/data/staff/portal";
import { getStaffCommunity } from "@/data/staff/server";
import { fmtTime, nowMinutes } from "@/lib/clock";

export const metadata: Metadata = { title: "Prospects" };

export default async function ProspectsPage() {
  const as = await getRole();
  if (!sectionsFor[as].includes("prospects")) return <NotYours section="Prospects" who={as === "sales" ? "sales" : as === "events" ? "the events team" : "your"} />;
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Prospects" />;
  const { s, c } = sc;
  const { enquiries, tours } = s;
  const now = nowMinutes();
  const rep = s.people[s.roles.tours].name;
  const ctx: ProspectCtx = { site: c.site.name, rep, phone: s.brand.phone, address: c.site.addressLine, domain: s.brand.domain };

  // Every prospect with the messages they were sent automatically: inquiries (and their tour, if booked), public
  // event sign-ups (each one a lead) and tours booked directly.
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
        id: `pub-${r.id}`, name: r.from, source: `Website: ${r.event.title} sign-up`, interest: r.event.title, status: "New" as const,
        when: `Signed up ${ago(r.mins)} for ${when(r.event)}`, contact: [r.phone, r.email].filter(Boolean).join(" · "),
        msgs: signupMessages(ctx, { name: r.from, eventTitle: r.event.title, date: r.event.date, start: r.event.start, party: r.party, at: ago(r.mins) }),
      })),
    ...tours
      .filter((t) => !enquiries.some((e) => e.name === t.who))
      .map((t) => ({
        id: `tour-${t.who}`, name: t.who, source: t.source, interest: t.interest, status: "Tour booked" as const,
        when: `Tour ${t.days < 2 ? dayLabel(t.days).toLowerCase() : `on ${dayLabel(t.days)}`} at ${fmtTime(t.time)}`,
        msgs: prospectMessages(s.slug, { name: t.who, interest: t.interest, tour: { days: t.days, time: t.time } }),
      })),
  ];

  // Tours, soonest first; today's that have finished ask for the outcome. No notes: health and personal details stay out of sales records.
  const tourRows: TourRow[] = tours
    .filter((t) => t.days < 7)
    .map((t) => ({ id: t.who, who: t.who, forWhom: t.for, interest: t.interest, source: t.source, day: dayLabel(t.days), time: fmtTime(t.time), done: t.days === 0 && t.time + 60 <= now, with: staffPeople[t.with]?.name.split(" ")[0] ?? "" }));

  return (
    <>
      <PageHead title="Prospects" sub={`Inquiries, tours, apartments and the waitlist, for ${rep}. Every inquiry got an instant reply; you take it from there.`}>
        <a className="sx-btn" href={siteHref(s.slug, "/tour")} target="_blank" rel="noopener"><Icon name="globe" /> Tour booking page</a>
      </PageHead>

      <div className="sx-grid g-21">
        <Card title="Inquiries" sub={`${prospects.length} people · choose one to see what they were sent`} pad={false}>
          <ProspectInbox prospects={prospects} slug={s.slug} ctx={ctx} />
        </Card>
        <Card title="Tours this week" sub="Record how each one went: it’s how we see what the website does for tours.">
          <Tours tours={tourRows} />
        </Card>
      </div>

      <div className="sx-grid g-2">
        <Card title="Availability" sub="Mark a floor plan open with its starting price. It updates the website and texts everyone on that plan’s waitlist.">
          <Availability plans={availability(s.slug)} />
        </Card>
        <Card title="Waitlist" sub="In order, longest waiting first. Names and the plan they want only.">
          <Waitlist rows={waitlistInOrder(s.slug)} />
        </Card>
      </div>
    </>
  );
}
