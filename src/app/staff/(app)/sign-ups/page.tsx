import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { FamilyRsvps, PublicSignups, ResidentBookings, SeatRequests, type Req } from "@/components/staff/alpha/SignUps";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { Badge, Card, Kpi, Meter, PageHead } from "@/components/staff/ui";
import { eventKindLabel } from "@/data/shared";
import { ago } from "@/data/staff";
import { cappedEvents, eventList, eventRequests, replyChannel, when, type EventRequest } from "@/data/staff/alpha";
import { getStaffCommunity } from "@/data/staff/server";
import "../../alpha.css";

export const metadata: Metadata = { title: "Sign-ups & RSVPs" };

export default async function SignUpsPage() {
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Sign-ups & RSVPs" />;
  const { s } = sc;
  const slug = s.slug;
  const reqs = eventRequests(slug);
  const full = (r: EventRequest): Req => ({ ...r, ago: ago(r.mins), when: when(r.event), ...replyChannel(slug, r.from) });
  const rsvps = reqs.filter((r) => r.kind === "family-rsvp" && r.status === "waiting").map(full);
  const rsvpsDone = reqs.filter((r) => r.kind === "family-rsvp" && r.status !== "waiting");
  const seats = reqs.filter((r) => r.kind === "seat-request").map(full);
  const booked = reqs.filter((r) => r.kind === "resident-booking").map(full);
  const pub = reqs.filter((r) => r.kind === "public-signup").map(full);
  const capped = cappedEvents(slug, 10);
  const bookable = capped.filter((e) => e.kind === "resident").map((e) => ({ ...e, when: when(e) }));
  const panels = capped.slice(0, 6);
  const calName = s.people[s.roles.calendar].name;

  return (
    <>
      <PageHead title="Sign-ups & RSVPs" sub={`Every sign-up for every event, by kind. Family RSVPs and seat requests go to ${calName}; each one counts on the monthly scorecard.`}>
        <Link href="/staff/calendar" className="sx-btn"><Icon name="calendar" /> Calendar</Link>
      </PageHead>

      <div className="sx-kpis">
        <Kpi label="Family RSVPs waiting" value={rsvps.length} note={`${rsvpsDone.length} confirmed this month`} />
        <Kpi label="Seat requests open" value={seats.filter((r) => r.status === "waiting" || r.status === "checking").length} note={`${seats.length} in the last three weeks`} />
        <Kpi label="Residents booked in person" value={booked.length} note="straight onto the list" />
        <Kpi label="Public sign-ups" value={pub.length} note="each one a sales lead" href="/staff/tours" />
      </div>

      <div className="al-kinds">
        <span><Badge tone="accent">{eventKindLabel.public}</Badge> Open sign-up on the website. No approval; every sign-up is a lead.</span>
        <span><Badge tone="info">{eventKindLabel.family}</Badge> Families RSVP from their personal link. Approve within 1 business day.</span>
        <span><Badge tone="good">{eventKindLabel.resident}</Badge> Residents sign up in person. Families ask for a seat; check with the resident first.</span>
      </div>

      <div className="sx-grid g-2">
        <FamilyRsvps items={rsvps} />
        <SeatRequests items={seats} />
      </div>

      <Card title="Upcoming events with limited seats" sub="Seats, waitlists, who’s going and where to meet. Only staff see this.">
        <div className="al-events">
          {panels.map((e) => {
            const list = eventList(slug, e);
            const left = Math.max(0, (e.cap ?? 0) - (e.taken ?? 0));
            const names = [...list.residents, ...list.requests.map((r) => (r.kind === "family-rsvp" ? `${r.from} (+${r.party - 1})`.replace(" (+0)", "") : r.resident ?? r.from))];
            return (
              <article key={e.id} className="al-ev">
                <header>
                  <b>{e.title}</b>
                  <Badge tone={e.kind === "public" ? "accent" : e.kind === "family" ? "info" : "good"}>{eventKindLabel[e.kind]}</Badge>
                </header>
                <p className="sx-hint">{when(e)} · <Icon name="pin" /> {e.cat === "trips" ? `Leaves from ${e.place}` : e.place}</p>
                <div className="al-ev-seats">
                  <span><b>{e.taken ?? 0}</b> of {e.cap} taken</span>
                  <span>{left ? `${left} left` : <Badge tone="warn">Full</Badge>}</span>
                  {!!e.waitlist && <span>{e.waitlist} on the waitlist</span>}
                </div>
                <Meter v={((e.taken ?? 0) / (e.cap ?? 1)) * 100} tone={left ? "var(--green)" : "var(--terra)"} label={`${e.taken} of ${e.cap} seats taken`} />
                <details>
                  <summary>Who’s going ({names.length})</summary>
                  <ul className="al-names">
                    {names.map((n, i) => <li key={n + i}>{n}</li>)}
                  </ul>
                </details>
              </article>
            );
          })}
          {panels.length === 0 && <p className="sx-empty">No events with limited seats in the next 10 days.</p>}
        </div>
      </Card>

      <div className="sx-grid g-2">
        <ResidentBookings items={booked} residents={s.residentNames} events={bookable} />
        <PublicSignups items={pub} slug={slug} />
      </div>
    </>
  );
}
