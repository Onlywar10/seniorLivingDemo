import type { Metadata } from "next";
import "@/app/staff/reports.css";
import "@/app/staff/prospects.css";
import Link from "next/link";
import { NotYours } from "@/components/staff/portal/NotYours";
import { sectionsFor } from "@/data/staff/shared";
import { getStaffRole as getRole } from "@/data/staff/server";
import { Icon } from "@/components/Icon";
import { ProspectInbox, type Prospect } from "@/components/staff/ProspectInbox";
import { Help } from "@/components/staff/portal/Help";
import { signupMessages, type ProspectCtx } from "@/components/staff/prospects";
import { Waitlist, type TourRow, type WaitPlan } from "@/components/staff/portal/Sales";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { Badge, Card, PageHead } from "@/components/staff/ui";
import { ago, dayLabel, siteHref, staffPeople } from "@/data/staff";
import { eventRequests, prospectMessages, when } from "@/data/staff/alpha";
import { availability } from "@/data/staff/portal";
import { getStaffCommunity } from "@/data/staff/server";
import { addDays, fmtTime, hash, nowMinutes, shortDate, today } from "@/lib/clock";

export const metadata: Metadata = { title: "Prospects" };

/** How long someone has waited, in plain words. */
const waited = (days: number) => (days < 14 ? `${days} day${days === 1 ? "" : "s"}` : days < 60 ? `${Math.floor(days / 7)} weeks` : `${Math.floor(days / 30)} months`);

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
  // The same number the inquiry card on Today calls (phoneFor in portal.ts), stable for the name.
  const phoneFor = (name: string) => `${s.brand.phone.slice(0, 5)} 555-0${String(100 + (hash(name) % 899)).padStart(3, "0")}`;
  const tourText = (t: { days: number; time: number }) => `Tour ${t.days < 2 ? dayLabel(t.days).toLowerCase() : `on ${dayLabel(t.days)}`} at ${fmtTime(t.time)}`;

  // Every prospect with the messages they were sent automatically: inquiries (and their tour, if booked), public
  // event sign-ups (each one a lead) and tours booked directly. A new inquiry's message is what they wrote; once
  // someone has been in touch, it's the staff note on file.
  const tourOf = (name: string) => tours.find((t) => t.who === name);
  const prospects: Prospect[] = [
    ...enquiries.map((e): Prospect => {
      const t = tourOf(e.name);
      return {
        // "Nurturing" is a follow-up sequence, which belongs to the operator's sales system or Full House: show it as contacted.
        id: `enq-${e.name}`, kind: "inquiry", name: e.name, source: e.source, interest: e.interest, status: e.status === "Nurturing" ? "Contacted" : e.status, when: `Asked ${ago(e.mins)}`,
        wrote: e.status === "New" ? e.msg : undefined, notes: e.status === "New" ? [] : [e.msg], phone: phoneFor(e.name), tour: t ? tourText(t) : undefined,
        msgs: prospectMessages(s.slug, { name: e.name, interest: e.interest, mins: e.mins, tour: t ? { days: t.days, time: t.time } : undefined }),
      };
    }),
    ...eventRequests(s.slug)
      .filter((r) => r.kind === "public-signup")
      .filter((r, i, all) => all.findIndex((x) => x.from === r.from) === i)
      .map((r): Prospect => ({
        id: `pub-${r.id}`, kind: "signup", name: r.from, source: `Website: ${r.event.title} sign-up`, interest: r.event.title, status: "New",
        when: `Signed up ${ago(r.mins)} for ${when(r.event)}`, wrote: [r.note, r.party > 1 ? `Party of ${r.party}` : "Coming alone"].filter(Boolean).join(" · "),
        notes: [], phone: r.phone, email: r.email,
        msgs: signupMessages(ctx, { name: r.from, eventTitle: r.event.title, date: r.event.date, start: r.event.start, party: r.party, at: ago(r.mins) }),
      })),
    ...tours
      .filter((t) => !enquiries.some((e) => e.name === t.who))
      .map((t): Prospect => ({
        id: `tour-${t.who}`, kind: "tour", name: t.who, source: t.source, interest: t.interest, status: "Tour booked",
        when: tourText(t), notes: [], phone: phoneFor(t.who),
        msgs: prospectMessages(s.slug, { name: t.who, interest: t.interest, tour: { days: t.days, time: t.time } }),
      })),
  ];

  // Tours, soonest first; today's that have finished ask for the outcome. No notes: health and personal details stay out of sales records.
  const tourRows: TourRow[] = tours
    .filter((t) => t.days < 7)
    .map((t) => ({
      id: t.who, who: t.who, forWhom: t.for, interest: t.interest, source: t.source, day: dayLabel(t.days), time: fmtTime(t.time), done: t.days === 0 && t.time + 60 <= now,
      with: staffPeople[t.with]?.name.split(" ")[0] ?? "", person: enquiries.some((e) => e.name === t.who) ? `enq-${t.who}` : `tour-${t.who}`,
    }));

  // The waitlist by floor plan, longest waiting first. Names and how long they've waited only: no notes or deposits.
  const plans = availability(s.slug);
  const waitPlans: WaitPlan[] = [...new Set(s.waitlist.map((w) => w.plan))]
    .map((code) => {
      const p = plans.find((x) => x.code === code);
      return {
        code, name: p?.name ?? code, open: p?.available ?? 0,
        rows: s.waitlist.filter((w) => w.plan === code).sort((a, b) => b.joinedDays - a.joinedDays).map((w) => ({ name: w.name, waited: waited(w.joinedDays), since: shortDate(addDays(today(), -w.joinedDays)) })),
      };
    })
    .sort((a, b) => b.rows.length - a.rows.length);

  return (
    <>
      <PageHead title="Prospects" sub="Inquiries, tours and the waitlist">
        <a className="sx-btn" href={siteHref(s.slug, "/tour")} target="_blank" rel="noopener"><Icon name="globe" /> Tour booking page</a>
      </PageHead>

      <Card title="Inquiries and tours" sub="Choose a name to see their messages and notes" action={<Help label="About inquiries" align="end"><p>Every inquiry gets an instant reply by text and email, day or night, and {rep} is told within 5 minutes. Open someone to see exactly what they were sent.</p><p>After each tour, tap how it went. It’s how we see what the website does for tours, in the evidence on the scorecard.</p></Help>} pad={false}>
        <ProspectInbox prospects={prospects} tours={tourRows} slug={s.slug} ctx={ctx} />
      </Card>

      <div className="sx-grid g-21">
        <Card id="waitlist" title="Waitlist" sub={`${s.waitlist.length} people, by floor plan`} action={<Help label="About the waitlist" align="end"><p>Names and how long they’ve waited only, with no notes, so health and personal details stay out of sales records.</p><p>Marking a plan open in Website → Apartments and prices alerts its waitlist.</p></Help>}>
          <Waitlist plans={waitPlans} />
          <p className="sx-note"><Link className="sx-link" href="/staff/website#apartments">Apartments and prices</Link></p>
        </Card>
        <Card title="Where inquiries go" action={<Help label="About the hand-off" align="end"><p>Every inquiry also goes to {s.brand.name}’s own sales system, if you have one, with what it was sent.</p><p>Conversion funnels, follow-up sequences, deposits and occupancy tracking come in Full House. Until then they stay in your sales system.</p></Help>}>
          <ul className="sx-list">
            <li><b>Your sales system</b><small className="rp-block">Every inquiry, with what it was sent</small></li>
            <li><b>Funnels, follow-ups and occupancy</b> <Badge tone="neutral">Coming in Full House</Badge></li>
          </ul>
        </Card>
      </div>
    </>
  );
}
