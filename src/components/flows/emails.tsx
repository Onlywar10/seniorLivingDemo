// The email a family actually gets for each use case on the Families tab, drawn full size as an email (not on a phone):
// the community news, their resident's week, a change, and an RSVP confirmation. Server only: everything comes from the
// community's own data, so Kestrel Point gets its own.
import type { ReactNode } from "react";
import { family, first, keyEvents, prospectPicks, publicPick, upcomingEvents, enWhen, LOGO } from "@/components/phone/stories";
import { prospectMessages } from "@/data/staff/alpha";
import { communities, type CommunitySlug } from "@/data/communities";
import { kindOf } from "@/data/shared";
import { getStaffData } from "@/data/staff";
import { addDays, dayShort, fmtTime, fromIso, iso, today } from "@/lib/clock";
import type { FlowEmail } from "./types";

const dayOf = (d: string) => dayShort(fromIso(d)).split(",")[0];

/** A sample of what the resident is signed up for in the next week: one activity on each of four days, no services. */
export function weekAheadFor(slug: CommunitySlug) {
  return upcomingEvents(slug, 7)
    .filter((e) => !e.lantern && e.cat !== "faith" && e.start >= 600)
    .filter((e, i, a) => a.findIndex((y) => y.date === e.date) === i)
    .filter((_, i) => i % 2 === 0)
    .slice(0, 4);
}

function EmailDoc({ from, domain, to, subject, when, name, foot, children }: { from: string; domain: string; to: string; subject: string; when: string; name: string; foot: ReactNode; children: ReactNode }) {
  return (
    <article className="em-doc">
      <header className="em-meta">
        <h3>{subject}</h3>
        <span>
          <b>{from}</b> &lt;hello@{domain}&gt;
        </span>
        <span>To: {to}</span>
        <span className="em-when">{when}</span>
      </header>
      <div className="em-canvas">
        <div className="em-body">
          <div className="em-banner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO} alt="" />
            {name}
          </div>
          {children}
          <footer className="em-foot">{foot}</footer>
        </div>
      </div>
    </article>
  );
}

/** `who`: send the community newsletter to someone other than the sample family member (a prospect, say). */
export function familyEmails(slug: CommunitySlug, who?: { name: string; email: string }): Record<"news" | "mine" | "change" | "join", FlowEmail> {
  const c = communities[slug];
  const s = getStaffData(slug);
  const name = c.site.name;
  const domain = s.brand.domain;
  const t = today();
  const fam = family(slug);
  const { f, me, mom, link, party, photo } = fam;
  const to = `${f.contact} <${f.email}>`;
  const { barbecue } = keyEvents(slug);
  const pub = publicPick(slug);
  const soon = upcomingEvents(slug, 10);
  const musical = soon.find((e) => e.cat === "music") ?? soon[0];
  const venue = c.venues[c.venueOrder[0]];
  const menu = [0, 1, 2].map((i) => ({ d: addDays(t, i + 1), m: c.menuFor(c.venueOrder[0], addDays(t, i + 1)) }));
  const others = s.photoPresets.filter((p) => p !== photo).slice(0, 2);
  const cal = soon.filter((e) => !e.lantern && kindOf(e) !== "family" && e.cat !== "faith").filter((e, i, a) => a.findIndex((y) => y.date === e.date) === i).slice(0, 5);
  const snaps = s.photoPresets.filter((p) => p.people.some((x) => x.name === f.resident && x.consent)).slice(0, 2);
  const address = `${c.site.addressLine} · ${s.brand.phone}`;
  const settings = (
    <>
      <p>{address}</p>
      <p>
        You get this email because you’re family of {mom} at {name}. <u>Change language or channel</u> · <u>Unsubscribe</u>
      </p>
    </>
  );
  const publicFoot = (
    <>
      <p>{address}</p>
      <p>
        You get this email because you signed up for {name}’s news. <u>Change language or channel</u> · <u>Unsubscribe</u>
      </p>
    </>
  );
  const sundayWhen = `Sunday, 5:00 PM`;

  const news: FlowEmail = {
    label: "The community newsletter",
    subject: `This week at ${name}`,
    node: (
      <EmailDoc from={name} domain={domain} to={who ? `${who.name} <${who.email}>` : to} subject={`This week at ${name}`} when={sundayWhen} name={name} foot={publicFoot}>
        <section className="em-sec">
          <p>Hi {who ? first(who.name) : me}, here’s the best of this week at {name}. Everything here is open to the public, so feel free to forward it.</p>
        </section>
        <figure className="em-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.src} alt="" />
          <figcaption>{photo.title}</figcaption>
        </figure>
        <section className="em-sec">
          <h4>More from this week</h4>
          <div className="em-grid">
            {others.map((p) => (
              <figure key={p.k}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.src} alt="" />
                <figcaption>{p.title}</figcaption>
              </figure>
            ))}
          </div>
        </section>
        <section className="em-sec">
          <h4>Open to everyone</h4>
          <div className="em-card em-event">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/courtyard-palms.jpg" alt="" />
            <div>
              <b>{pub.title}</b>
              <span>
                {enWhen(pub)} · {pub.room}
              </span>
              <span className="em-btn">Sign up</span>
              <span className="em-quiet">Bring a friend: anyone can come.</span>
            </div>
          </div>
        </section>
        <section className="em-sec">
          <h4>On the calendar</h4>
          <ul className="em-list">
            {cal.map((e) => (
              <li key={e.id}>
                <b>
                  {dayOf(e.date)} {fmtTime(e.start)}
                </b>
                <span>{e.title}</span>
              </li>
            ))}
          </ul>
          <span className="em-link">See the full calendar on {domain}</span>
        </section>
        <section className="em-sec">
          <h4>This week’s menu · {venue.name}</h4>
          <ul className="em-list">
            {menu.map(({ d, m }) => (
              <li key={iso(d)}>
                <b>{dayShort(d).split(",")[0]}</b>
                <span>
                  {m.special.name}
                  {m.soup?.name ? ` · Soup: ${m.soup.name}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </EmailDoc>
    ),
  };

  const week = weekAheadFor(slug);
  const mine: FlowEmail = {
    label: `${mom}’s week`,
    subject: `${mom}’s week at ${name}`,
    node: (
      <EmailDoc
        from={name}
        domain={domain}
        to={to}
        subject={`${mom}’s week at ${name}`}
        when="Monday, 8:00 AM"
        name={name}
        foot={
          <>
            <p>
              {mom} chose to share this with you. {mom} or the {name} team can turn it off at any time; the community news keeps coming either way.
            </p>
            {settings}
          </>
        }
      >
        <section className="em-sec">
          <p>Hi {me}, here’s what {mom} is signed up for this week.</p>
        </section>
        <section className="em-sec">
          <h4>This week</h4>
          <ul className="em-list">
            {week.map((e) => (
              <li key={e.id}>
                <b>
                  {dayOf(e.date)} {fmtTime(e.start)}
                </b>
                <span>
                  {e.title}
                  {e.room ? ` · ${e.room}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
        {snaps.length > 0 && (
          <section className="em-sec">
            <h4>From last week</h4>
            <div className="em-grid">
              {snaps.map((p) => (
                <figure key={p.k}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.src} alt="" />
                  <figcaption>{p.title}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}
        <section className="em-sec">
          <h4>Join {mom}</h4>
          <div className="em-card em-event em-join">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/courtyard-bbq.jpg" alt="" />
            <div>
              <b>{barbecue.title}</b>
              <span>
                {enWhen(barbecue)} · {barbecue.room}
              </span>
              <span className="em-btn">RSVP</span>
              <span className="em-quiet">We’ll check with {mom} first, then let you know.</span>
            </div>
          </div>
        </section>
      </EmailDoc>
    ),
  };

  const changeSubject = `Change: ${musical.title} now starts at ${fmtTime(musical.start + 30)}`;
  const change: FlowEmail = {
    label: "A change",
    subject: changeSubject,
    node: (
      <EmailDoc from={name} domain={domain} to={to} subject={changeSubject} when="Today, 2:15 PM" name={name} foot={settings}>
        <section className="em-sec">
          <p>Hi {me}, a quick change to this week’s calendar.</p>
          <div className="em-card em-change">
            <b>{musical.title}</b>
            <span>{dayShort(fromIso(musical.date))}</span>
            <span>
              <s>{fmtTime(musical.start)}</s> → <b>{fmtTime(musical.start + 30)}</b>
            </span>
            <span>{musical.room}</span>
          </div>
          <p>Families are welcome as always. The calendar on our website is already up to date.</p>
          <p className="em-quiet">Questions? Call the front desk at {s.brand.phone}.</p>
        </section>
      </EmailDoc>
    ),
  };

  const joinSubject = `You’re confirmed: ${barbecue.title}, ${dayOf(barbecue.date)}`;
  const join: FlowEmail = {
    label: "RSVP confirmed",
    subject: joinSubject,
    node: (
      <EmailDoc from={name} domain={domain} to={to} subject={joinSubject} when="Today, 5:25 PM" name={name} foot={settings}>
        <figure className="em-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/courtyard-bbq.jpg" alt="" />
        </figure>
        <section className="em-sec">
          <p>
            Good news, {me}! {mom} is looking forward to it. You’re confirmed for the {barbecue.title}.
          </p>
          <div className="em-card em-details">
            <span>
              <small>When</small>
              {enWhen(barbecue)}
            </span>
            <span>
              <small>Where</small>
              {barbecue.room}, {name}
            </span>
            <span>
              <small>Who</small>
              {party} guests, plus {mom}
            </span>
          </div>
          <p>Burgers, corn on the cob and lemonade with the residents, lawn games for the grandkids and live music. Park by the main entrance and sign in at the front desk.</p>
          <span className="em-btn">Add to calendar</span>
          <p className="em-quiet">
            Plans changed? <u>Update your RSVP</u> ({link}/rsvp).
          </p>
        </section>
      </EmailDoc>
    ),
  };

  return { news, mine, change, join };
}

/* ---------------------------------------------------------------- prospects */

export function prospectEmails(slug: CommunitySlug): Record<"inquiry" | "tour" | "open" | "wait" | "news", FlowEmail> {
  const c = communities[slug];
  const s = getStaffData(slug);
  const name = c.site.name;
  const domain = s.brand.domain;
  const rep = s.people[s.roles.tours];
  const laura = { name: "Laura Bennett", email: "laura.bennett@gmail.com" };
  const to = `${laura.name} <${laura.email}>`;
  const { plan } = prospectPicks(slug);
  const msgs = prospectMessages(slug, { name: laura.name, interest: "Independent Living", tour: { days: 2, time: 600 } });
  const tourDay = dayShort(addDays(today(), 2));
  const fair = publicPick(slug);
  const foot = (
    <>
      <p>
        {c.site.addressLine} · {s.brand.phone}
      </p>
      <p>You get this email because you contacted {name}. <u>Unsubscribe</u></p>
    </>
  );
  const card = (rows: [string, ReactNode][]) => (
    <div className="em-card em-details">
      {rows.map(([k, v]) => (
        <span key={k}>
          <small>{k}</small>
          {v}
        </span>
      ))}
    </div>
  );

  const inquirySubject = msgs[1].subject ?? `Thank you for your interest in ${name}`;
  const inquiry: FlowEmail = {
    label: "The acknowledgement",
    subject: inquirySubject,
    node: (
      <EmailDoc from={name} domain={domain} to={to} subject={inquirySubject} when="Today, 9:52 PM" name={name} foot={foot}>
        <section className="em-sec">
          {msgs[1].text.split("\n\n").map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
          <span className="em-btn">This week’s menu</span> <span className="em-btn em-btn-alt">Activity calendar</span> <span className="em-btn em-btn-alt">Floor plans and prices</span>
        </section>
      </EmailDoc>
    ),
  };

  const tourSubject = `Your tour is booked: ${tourDay} at 10:00 am`;
  const tour: FlowEmail = {
    label: "Tour confirmed",
    subject: tourSubject,
    node: (
      <EmailDoc from={name} domain={domain} to={to} subject={tourSubject} when="Today, 9:52 PM" name={name} foot={foot}>
        <figure className="em-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/courtyard-palms.jpg" alt="" />
        </figure>
        <section className="em-sec">
          <p>Hi Laura, we’re looking forward to showing you around.</p>
          {card([
            ["When", `${tourDay}, 10:00 am (about an hour)`],
            ["Where", c.site.addressLine],
            ["With", `${rep.name}, ${rep.role}`],
          ])}
          <p>Lunch is on us. Park by the main entrance and ask for {first(rep.name)} at the front desk. We’ll text you a reminder the afternoon before.</p>
          <span className="em-btn">Add to calendar</span> <span className="em-btn em-btn-alt">Change the time</span>
        </section>
      </EmailDoc>
    ),
  };

  const openSubject = `You’re registered: ${fair.title}, ${dayShort(fromIso(fair.date))}`;
  const openHouse: FlowEmail = {
    label: "You’re registered",
    subject: openSubject,
    node: (
      <EmailDoc from={name} domain={domain} to={to} subject={openSubject} when="Today, 8:31 PM" name={name} foot={foot}>
        <figure className="em-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/courtyard-palms.jpg" alt="" />
        </figure>
        <section className="em-sec">
          <p>Hi Laura, we’ve saved 2 places for you.</p>
          {card([
            ["When", `${dayShort(fromIso(fair.date))}, ${fmtTime(fair.start)}`],
            ["Where", `The ${fair.room}, ${c.site.addressLine}`],
            ["What", "Free and open to everyone. Meet the residents and the team"],
          ])}
          <span className="em-btn">Add to calendar</span>
          <p className="em-quiet">Bring anyone you like. Plans changed? Just reply to this email.</p>
        </section>
      </EmailDoc>
    ),
  };

  const waitSubject = `A ${plan.name} just opened up at ${name}`;
  const wait: FlowEmail = {
    label: "An apartment opens",
    subject: waitSubject,
    node: (
      <EmailDoc from={name} domain={domain} to={to} subject={waitSubject} when="Today, 11:20 AM" name={name} foot={foot}>
        <section className="em-sec">
          <p>Good news, Laura! A {plan.name} ({plan.code}) has just opened up, and you’re next on the list.</p>
          {card([
            ["Apartment", `${plan.name} (${plan.code})`],
            ["Held for you", "48 hours"],
            ["Call", `${rep.name} · ${s.brand.phone}`],
          ])}
          <span className="em-btn">See the floor plan</span> <span className="em-btn em-btn-alt">Book a visit</span>
        </section>
      </EmailDoc>
    ),
  };

  return { inquiry, tour, open: openHouse, wait, news: familyEmails(slug, laura).news };
}

/* ---------------------------------------------------------------- residents */

export function residentEmails(slug: CommunitySlug): Record<"today" | "booked" | "alert" | "join", FlowEmail> {
  const c = communities[slug];
  const s = getStaffData(slug);
  const name = c.site.name;
  const domain = s.brand.domain;
  const t = today();
  const { f, me, mom, party } = family(slug);
  const nora = s.people[s.roles.calendar];
  const to = f.resident;
  const { barbecue, outing } = keyEvents(slug);
  const trip = (outing.title.split(":").pop() ?? outing.title).trim();
  const soon = upcomingEvents(slug, 7).filter((e) => !e.lantern && kindOf(e) !== "family");
  const byDay = [0, 1, 2, 3, 4].map((i) => {
    const d = iso(addDays(t, i));
    return { d, evs: soon.filter((e) => e.date === d).slice(0, 3) };
  });
  const musical = upcomingEvents(slug, 10).find((e) => e.cat === "music") ?? soon[0];
  const foot = (
    <>
      <p>
        {c.site.addressLine} · Front desk {s.brand.phone}
      </p>
      <p>You get this email because you asked for {name}’s news by email. Large-print copies are at the front desk. <u>Unsubscribe</u></p>
    </>
  );
  const card = (rows: [string, ReactNode][]) => (
    <div className="em-card em-details">
      {rows.map(([k, v]) => (
        <span key={k}>
          <small>{k}</small>
          {v}
        </span>
      ))}
    </div>
  );

  const today_: FlowEmail = {
    label: "This week’s activities",
    subject: `This week at ${name}`,
    node: (
      <EmailDoc from={name} domain={domain} to={to} subject={`This week at ${name}`} when="Monday, 7:00 AM" name={name} foot={foot}>
        <section className="em-sec">
          <p>Good morning, {mom}! Here’s what’s on this week. Reply YES to anything with limited places and we’ll save you one.</p>
          {byDay.map(({ d, evs }) => (
            <div key={d}>
              <h4>{dayShort(fromIso(d))}</h4>
              <ul className="em-list">
                {evs.map((e) => (
                  <li key={e.id}>
                    <b>{fmtTime(e.start)}</b>
                    <span>
                      {e.title}
                      {e.room ? ` · ${e.room}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      </EmailDoc>
    ),
  };

  const bookedSubject = `You’re booked: ${trip}`;
  const booked: FlowEmail = {
    label: "You’re booked",
    subject: bookedSubject,
    node: (
      <EmailDoc from={name} domain={domain} to={to} subject={bookedSubject} when="Today, 9:41 AM" name={name} foot={foot}>
        <section className="em-sec">
          <p>You’re booked, {mom}! These details are just for you and your family.</p>
          {card([
            ["When", enWhen(outing)],
            ["Pickup", `The bus leaves the ${outing.room} at ${fmtTime(outing.start)}. Please be there by ${fmtTime(outing.start - 15)}.`],
            ["Bring", "A warm jacket and comfortable shoes. Water is on the bus."],
          ])}
          <p>Questions? Ask {first(nora.name)} at the front desk. We’ll remind you an hour before.</p>
          <span className="em-btn em-btn-alt">I can’t go any more</span>
        </section>
      </EmailDoc>
    ),
  };

  const alertSubject = `Change: ${musical.title} now starts at ${fmtTime(musical.start + 30)}`;
  const alert: FlowEmail = {
    label: "A change",
    subject: alertSubject,
    node: (
      <EmailDoc from={name} domain={domain} to={to} subject={alertSubject} when="Today, 11:20 AM" name={name} foot={foot}>
        <section className="em-sec">
          <p>Hi {mom}, a change to something you’re signed up for.</p>
          <div className="em-card em-change">
            <b>{musical.title}</b>
            <span>{dayShort(fromIso(musical.date))}</span>
            <span>
              <s>{fmtTime(musical.start)}</s> → <b>{fmtTime(musical.start + 30)}</b>
            </span>
            <span>{musical.room}</span>
          </div>
          <p className="em-quiet">The printed calendar at the front desk is updated too.</p>
        </section>
      </EmailDoc>
    ),
  };

  const joinSubject = `${me} would like to join you at the ${barbecue.title}`;
  const join: FlowEmail = {
    label: `${me} wants to join you`,
    subject: joinSubject,
    node: (
      <EmailDoc from={name} domain={domain} to={to} subject={joinSubject} when="Today, 5:20 PM" name={name} foot={foot}>
        <figure className="em-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/courtyard-bbq.jpg" alt="" />
        </figure>
        <section className="em-sec">
          <p>
            Hi {mom}, {me} would like to come to the {barbecue.title} with you, with {party} people in total. Is that OK?
          </p>
          {card([
            ["When", enWhen(barbecue)],
            ["Where", barbecue.room],
          ])}
          <span className="em-btn">Yes, that’s lovely</span> <span className="em-btn em-btn-alt">Not this time</span>
          <p className="em-quiet">Whatever you choose, we’ll let {me} know kindly. You can also tell the front desk.</p>
        </section>
      </EmailDoc>
    ),
  };

  return { today: today_, booked, alert, join };
}

/* ---------------------------------------------------------------- staff */

export function staffEmails(slug: CommunitySlug): Record<"post" | "approve" | "invite" | "lead" | "score", FlowEmail> {
  const c = communities[slug];
  const s = getStaffData(slug);
  const name = c.site.name;
  const domain = s.brand.domain;
  const t = today();
  const nora = s.people[s.roles.calendar];
  const boss = s.people[s.roles.approver];
  const desk = s.people[s.roles.desk];
  const { f, me, mom } = family(slug);
  const soon = upcomingEvents(slug, 7).filter((e) => !e.lantern && (e.special || e.cat === "trips" || e.cat === "music")).slice(0, 4);
  const musical = upcomingEvents(slug, 10).find((e) => e.cat === "music") ?? soon[0];
  const month = t.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  const kin = "kinlight.example";
  const kinFoot = <p>Kinlight for {name} · <u>Notification settings</u></p>;

  const post: FlowEmail = {
    label: "The weekly posting reminder",
    subject: "Share one moment from this week 📷",
    node: (
      <EmailDoc from="Kinlight" domain={kin} to={`${nora.name}`} subject="Share one moment from this week 📷" when="Monday, 9:00 AM" name={name} foot={kinFoot}>
        <section className="em-sec">
          <p>Hi {first(nora.name)}, one photo and one sentence is all it takes. It goes to the website, the families’ Sunday email and the printed calendar at once.</p>
          <h4>Coming up this week</h4>
          <ul className="em-list">
            {soon.map((e) => (
              <li key={e.id}>
                <b>{enWhen(e).split(",")[0]}</b>
                <span>{e.title}</span>
              </li>
            ))}
          </ul>
          <span className="em-btn">Post a photo</span>
          <p className="em-quiet">Calendar or menu changed? Upload the PDF, or photograph the paper copy, and it’s read in for you.</p>
        </section>
      </EmailDoc>
    ),
  };

  const approveSubject = `Approval needed: ${musical.title} moves to ${fmtTime(musical.start + 30)}`;
  const approve: FlowEmail = {
    label: "The approval request",
    subject: approveSubject,
    node: (
      <EmailDoc from="Kinlight" domain={kin} to={boss.name} subject={approveSubject} when="Today, 2:05 PM" name={name} foot={kinFoot}>
        <section className="em-sec">
          <p>
            Hi {first(boss.name)}, {first(nora.name)} changed an event. Once you approve, families and booked residents are told the same day, each in their own language.
          </p>
          <div className="em-card em-change">
            <b>{musical.title}</b>
            <span>{dayShort(fromIso(musical.date))}</span>
            <span>
              <s>{fmtTime(musical.start)}</s> → <b>{fmtTime(musical.start + 30)}</b>
            </span>
          </div>
          <span className="em-btn">Approve and send</span> <span className="em-btn em-btn-alt">Edit first</span>
          <p className="em-quiet">Emergencies don’t wait for approval: they go out straight away.</p>
        </section>
      </EmailDoc>
    ),
  };

  const invite: FlowEmail = {
    label: "The move-in invite",
    subject: `${name} would like to send you news about ${mom}`,
    node: (
      <EmailDoc from={name} domain={domain} to={`${f.contact} <${f.email}>`} subject={`${name} would like to send you news about ${mom}`} when="Today, 2:30 PM" name={name} foot={<p>{c.site.addressLine} · {s.brand.phone}</p>}>
        <section className="em-sec">
          <p>
            Hi {me}, welcome to {name}. We’d like to send you our weekly news, and what {mom} is up to, by text or email, in your language.
          </p>
          <span className="em-btn">Join</span>
          <p className="em-quiet">No app and no password. Nothing is sent until you say yes, and you can stop any time.</p>
        </section>
      </EmailDoc>
    ),
  };

  const lead: FlowEmail = {
    label: "The front-desk alert",
    subject: "A question: Laura Bennett · Independent Living",
    node: (
      <EmailDoc from="Kinlight" domain={kin} to={desk.name} subject="A question: Laura Bennett · Independent Living" when="Today, 9:52 PM" name={name} foot={kinFoot}>
        <section className="em-sec">
          <p>Hi {first(desk.name)}, a question came in from the website. It’s in Communications for you to answer.</p>
          <div className="em-card em-details">
            <span><small>Who</small>Laura Bennett · (916) 555-0186 · laura.bennett@gmail.com</span>
            <span><small>Interested in</small>Independent Living, this spring</span>
            <span><small>Message</small>“My mother is looking at Independent Living. What’s available this spring?”</span>
            <span><small>Already sent</small>✓ The acknowledgement by text and email</span>
          </div>
          <span className="em-btn">Reply to Laura</span> <span className="em-btn em-btn-alt">Call Laura</span>
        </section>
      </EmailDoc>
    ),
  };

  const score: FlowEmail = {
    label: "The monthly scorecard",
    subject: `${name} · ${month} scorecard`,
    node: (
      <EmailDoc from="Kinlight" domain={kin} to={boss.name} subject={`${name} · ${month} scorecard`} when="1st, 7:00 AM" name={name} foot={kinFoot}>
        <section className="em-sec">
          <p>Hi {first(boss.name)}, here’s {name}’s scorecard for {month}.</p>
          <div className="em-card em-details">
            <span><small>Messages delivered</small>{s.weekKpis.deliveredRate}%</span>
            <span><small>Families reached</small>{s.community.families}</span>
            <span><small>Promises on track</small>11 of 11</span>
            <span><small>Stale pages</small>0</span>
            <span><small>Family survey</small>“I know what’s happening”: up 18 points since go-live</span>
          </div>
          <span className="em-btn">Open the PDF</span>
        </section>
      </EmailDoc>
    ),
  };

  return { post, approve, invite, lead, score };
}
