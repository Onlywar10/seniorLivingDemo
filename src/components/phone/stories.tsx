// The phone screens behind the message workflows on /phones (src/components/flows/bands.tsx): a family's phone,
// a prospect's phone and a staff member's phone, each a list of PhoneTour steps the workflows pick previews from.
// Server Components only (they read the staff records in src/data/staff/alpha.ts). Everything comes from the community's own data, so Alder Bend and Kestrel Point
// each show their own people, families and events. Not in the alpha, so never shown here: social posting and signage.
import type { ReactNode } from "react";
import { Browser, LockScreen, MailInbox, MailMessage, SmsThread, type TourStep } from "./Phone";
import { ToEnd } from "./ToEnd";
import { communities, type CommunitySlug } from "@/data/communities";
import { nextSpecials } from "@/data/communities/specials";
import { kindOf, type CalEvent } from "@/data/shared";
import { getStaffData } from "@/data/staff";
import { attendance, eventRequests, sampleFamily } from "@/data/staff/alpha";
import { addDays, dayShort, fmtTime, fromIso, hash, iso, longDate, today } from "@/lib/clock";
import "./stories.css";

/* ------------------------------------------------------------ shared helpers */

export const first = (name: string) => name.split(" ")[0];
export const LOGO = "/img/brand/dots.png";

export const enWhen = (e: { date: string; start: number }) => `${dayShort(fromIso(e.date))}, ${fmtTime(e.start)}`;

/** The next event open to everyone (anyone can sign up on the website), for the community news. Falls back to the open house. */
export function publicPick(slug: CommunitySlug): { date: string; start: number; title: string; room: string } {
  const e = upcomingEvents(slug, 30).find((x) => kindOf(x) === "public" && !/open house/i.test(x.title));
  return e ? { date: e.date, start: e.start, title: e.title, room: e.room } : { date: nextSpecials().openHouse, start: 600, title: "Open House & Lunch", room: "Lobby" };
}

export function upcomingEvents(slug: CommunitySlug, days: number) {
  const t = today();
  return communities[slug].staffEventsBetween(t, days, iso(t)).flatMap((d) => d.events);
}

/** The real upcoming Family Barbecue (from the calendar), and a real upcoming outing with seats. */
export function keyEvents(slug: CommunitySlug) {
  const evs = upcomingEvents(slug, 22);
  const barbecue: Pick<CalEvent, "date" | "start" | "end" | "title" | "room"> = evs.find((e) => e.title === "Family Barbecue") ?? { date: nextSpecials().barbecue, start: 720, end: 870, title: "Family Barbecue", room: "Courtyard" };
  const trips = evs.filter((e) => kindOf(e) === "resident" && e.cat === "trips" && e.cap && !/shopping/i.test(e.title) && e.date > iso(addDays(today(), 2)));
  const outing = trips.find((e) => e.special) ?? trips.find((e) => /bus trip/i.test(e.title)) ?? trips[0] ?? evs.find((e) => e.cat === "trips")!;
  return { barbecue, outing };
}

/** The sample family, their personal link and the barbecue party (her and the two grandchildren). */
export function family(slug: CommunitySlug) {
  const s = getStaffData(slug);
  const f = sampleFamily(slug);
  const token = hash(f.contact + slug).toString(36).slice(0, 5);
  const photo = s.photoPresets.find((p) => p.people.some((x) => x.name === f.resident && x.consent)) ?? s.photoPresets[0];
  const momInPhoto = photo.people.some((x) => x.name === f.resident && x.consent);
  return { s, f, mom: first(f.resident), me: first(f.contact), link: `${s.brand.domain}/r/${token}`, party: 3, photo, momInPhoto };
}

export function StaffHead({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="ph-staff-head">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={LOGO} alt="" />
      <span>
        <b>{title}</b>
        <small>{sub}</small>
      </span>
    </div>
  );
}

/* ------------------------------------------------------------ 1. a family's phone */

export function familyStory(slug: CommunitySlug): TourStep[] {
  const c = communities[slug];
  const { s, f, mom, me, link, party, photo } = family(slug);
  const { barbecue, outing } = keyEvents(slug);
  const t = today();
  const nora = s.people[s.roles.calendar];
  const name = c.site.name;
  const venue = c.venues[c.venueOrder[0]];
  const menu = [0, 1, 2].map((i) => ({ d: addDays(t, i + 1), m: c.menuFor(c.venueOrder[0], addDays(t, i + 1)) }));
  const others = s.photoPresets.filter((p) => p !== photo).slice(0, 2);

  const pub = publicPick(slug);
  const weekly = `Hi ${me}, here’s the best of this week at ${name}: ${photo.title.toLowerCase()}. 📷\n\nComing up, open to everyone: ${pub.title}, ${enWhen(pub)}. Bring a friend! Details on our website:`;
  const reply = `Mom looks so happy! Can I bring my kids to the barbecue? They’re 6 and 9.`;
  const answer = `Of course, ${me}! Grandchildren are very welcome, and there are lawn games just for them. Tap your personal link to tell us how many are coming.`;
  const thread = (extra: { me?: boolean; text: ReactNode; time?: string }[], typing = false) => (
    <>
    {extra.length > 0 && <ToEnd />}
    <SmsThread
      name={name}
      sub="Text message"
      initials={s.brand.short}
      color="#2e4d33"
      typing={typing}
      bubbles={[
        { time: "Today 10:02 AM", text: weekly, img: photo.src, link: { title: pub.title, host: `${s.brand.domain}/calendar`, img: undefined } },
        ...extra,
      ]}
    />
    </>
  );

  return [
    {
      label: "A text arrives",
      time: "10:02",
      dark: true,
      caption: `${me}’s lock screen midweek. The highlight comes from ${name}’s own number, in each family’s own language.`,
      screen: (
        <LockScreen
          date={longDate(t)}
          time="10:02"
          wallpaper="/img/mother-daughter.jpg"
          notices={[{ app: "Messages", title: name, text: weekly.split("\n")[0], time: "now" }]}
        />
      ),
    },
    {
      label: "The weekly highlights",
      time: "10:03",
      caption: `The week’s community highlight, posted once by ${nora.name}, and the next family event. Every family gets the same text, in their own language.`,
      screen: thread([]),
    },
    {
      label: `${me} replies`,
      time: "10:09",
      caption: `When someone on the team answers, it comes back as a text from the same number.`,
      screen: thread([
        { me: true, text: reply, time: "10:06 AM" },
        { text: answer },
      ]),
    },
    {
      label: `What ${first(nora.name)} sees`,
      time: "10:07",
      caption: `The reply lands in ${first(nora.name)}’s inbox with who it’s from and which resident. If a family writes in another language, it’s translated both ways, so no one needs a translator.`,
      screen: (
        <div className="ph-staff">
          <ToEnd />
          <StaffHead title="Messages" sub={`${name} · ${nora.name}`} />
          <div className="ph-sms phx-staffsms">
            <div className="ph-sms-head">
              <span className="ph-avatar" style={{ background: "#4c87a2" }}>
                {f.contact.split(" ").map((w) => w[0]).join("").slice(0, 2)}
              </span>
              <b>{f.contact}</b>
              <small>
                {f.relation} of {f.resident}
              </small>
            </div>
            <div className="ph-sms-body">
              <div className="ph-msg">
                <span className="ph-msg-time">10:06 am</span>
                <div className="ph-bubble">{reply}</div>
              </div>
              <div className="ph-msg me">
                <div className="ph-bubble">{answer}</div>
                <span className="phx-sentas">Sent to {me} by text · Delivered</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      label: "The Sunday email",
      time: "5:04",
      caption: `On Sunday at 5 pm the weekly digest lands in ${me}’s inbox, next to everyday email.`,
      screen: (
        <MailInbox
          account="Inbox"
          rows={[
            { from: name, subject: `This week at ${name}`, preview: `This week’s photos, what’s coming up and this week’s menu.`, time: "5:00 PM", unread: true, highlight: true },
            { from: "Cedar Elementary", subject: "Reminder: picture day", preview: "School photos are on Thursday. Please send…", time: "3:12 PM", unread: true },
            { from: "Valley Pharmacy", subject: "Your prescription is ready", preview: "You can pick it up from 9:00 am tomorrow.", time: "11:40 AM" },
            { from: "Book club", subject: "November’s book", preview: "See you Tuesday at Lupe’s. Bring…", time: "Yesterday" },
          ]}
        />
      ),
    },
    {
      label: "The digest, opened",
      time: "5:06",
      caption: `The whole community’s week: photos, events open to everyone with a sign-up button, and the menu in ${venue.name}. Public news only, so it’s safe to forward. The same email goes to everyone on the list, each in their own language.`,
      screen: (
        <MailMessage from={name} address={`hello@${s.brand.domain}`} to={me} subject={`This week at ${name}`} time="5:00 PM">
          <div className="ph-em">
            <div className="ph-em-banner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO} alt="" />
              {name}
            </div>
            <p className="ph-em-p">Hi {me}, here’s what happened this week.</p>
            <p className="ph-em-h">This week’s photos</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="ph-em-photo" src={photo.src} alt="" />
            <p className="ph-em-p">{photo.title}.</p>
            {others.map((p) => (
              <div className="ph-em-item" key={p.k}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.src} alt="" />
                <span>
                  <b>{p.title}</b>
                  <small>See all photos</small>
                </span>
              </div>
            ))}
            <p className="ph-em-h">Open to everyone</p>
            <div className="ph-em-item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/lobby.jpg" alt="" />
              <span>
                <b>{pub.title}</b>
                <small>
                  {enWhen(pub)} · {pub.room}
                </small>
              </span>
            </div>
            <span className="ph-em-btn">Sign up</span>
            <p className="ph-em-h">This week’s menu · {venue.name}</p>
            {menu.map(({ d, m }) => (
              <p className="ph-em-p phx-menu" key={iso(d)}>
                <b>{dayShort(d).split(",")[0]}:</b> {m.special.name}
                {m.soup?.name ? ` · Soup: ${m.soup.name}` : ""}
              </p>
            ))}
            <div className="ph-em-foot">
              You get this email because you signed up for {name}’s news. Change language or channel · Unsubscribe
            </div>
          </div>
        </MailMessage>
      ),
    },
    {
      label: "The personal link",
      time: "5:08",
      caption: `The RSVP button opens ${me}’s personal link: no app, no login. ${me} says ${party} are coming to the barbecue, asks for a seat for ${mom} on the outing (staff check with ${mom} first), and can change language or channel, or unsubscribe, at the bottom.`,
      screen: (
        <Browser host={link}>
          <div className="ph-pl">
            <div className="ph-pl-brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO} alt="" />
              {name}
            </div>
            <p className="ph-pl-hi">
              Hi {me} · family of {mom}
            </p>
            <div className="ph-pl-card">
              <span className="ph-pl-tag">Family event</span>
              <h4>Family Barbecue</h4>
              <span className="ph-pl-meta">
                {enWhen(barbecue)} · {barbecue.room}
              </span>
              <p>Burgers, corn on the cob and lemonade with the residents, lawn games for the grandkids and live music.</p>
              <div className="ph-pl-step">
                <span>−</span>
                <b>
                  {party} people, not counting {mom}
                </b>
                <span>+</span>
              </div>
              <span className="ph-pl-btn">RSVP</span>
            </div>
            <div className="ph-pl-card">
              <span className="ph-pl-tag">Outing</span>
              <h4>{outing.title}</h4>
              <span className="ph-pl-meta">{enWhen(outing)}</span>
              <span className="ph-pl-btn alt">Ask for a seat for {mom}</span>
              <p className="phx-note">We’ll ask {mom} first and let you know by text.</p>
            </div>
            <div className="ph-pl-card">
              <h4>Your preferences</h4>
              <span className="ph-pl-meta">Language</span>
              <div className="ph-pl-opts phx-opts-row">
                <span className="ph-pl-opt on">English ✓</span>
                <span className="ph-pl-opt">Español</span>
                <span className="ph-pl-opt">中文</span>
              </div>
              <span className="ph-pl-meta">How to hear from us</span>
              <div className="ph-pl-opts">
                <span className="ph-pl-opt on">Text and email ✓</span>
                <span className="ph-pl-opt">Text only</span>
                <span className="ph-pl-opt">Email only</span>
              </div>
              <span className="phx-unsub">Unsubscribe</span>
            </div>
            <p className="ph-pl-small">This link is just for you. No password needed.</p>
          </div>
        </Browser>
      ),
    },
    {
      label: "Confirmed by text",
      time: "11:15",
      caption: `${mom} said yes to both by text, ${first(nora.name)} approved them on the go, and ${me} gets one text with the details. If ${mom} says no, ${me} is told that too, kindly.`,
      screen: (
        <>
        <ToEnd />
        <SmsThread
          name={name}
          sub="Text message"
          initials={s.brand.short}
          color="#2e4d33"
          bubbles={[
            { me: true, text: reply, time: "Sunday 10:06 AM" },
            { text: answer },
            {
              time: "Today 11:14 AM",
              text: `All set, ${me}! Your RSVP for the Family Barbecue is confirmed: ${party} people plus ${mom}, ${enWhen(barbecue)}, in the ${barbecue.room}.\n\nAnd good news: we asked ${mom} and she said yes to ${outing.title} (${enWhen(outing)}). Her seat is saved.`,
            },
            { me: true, text: "Thank you so much! 🙏" },
          ]}
        />
        </>
      ),
    },
  ];
}

/* ------------------------------------------------------------ 2. a prospect's phone */

/** The waitlisted floor plan the prospect asks about (one with no apartment free today), and the guide she downloads. */
export function prospectPicks(slug: CommunitySlug) {
  const c = communities[slug];
  const plan = c.plans.find((p) => p.kind === "independent" && p.available === 0 && p.waitlist > 0) ?? c.plans.find((p) => p.available === 0) ?? c.plans[0];
  const guide = c.guides.find((g) => /cost/i.test(g.title)) ?? c.guides[0];
  return { plan, guide };
}

export function prospectStory(slug: CommunitySlug): TourStep[] {
  const c = communities[slug];
  const s = getStaffData(slug);
  const rep = s.people[s.roles.tours];
  const name = c.site.name;
  const { plan, guide } = prospectPicks(slug);
  const planName = `${plan.name} (${plan.code})`;
  const t = today();
  const call = `Call ${first(rep.name)} at ${s.brand.phone}`;
  const textHead = { name, sub: "Text message", initials: s.brand.short, color: "#2e4d33" };

  const onList = `${name}: you’re on the list for the ${planName}. ${plan.waitlist === 1 ? "There is 1 person" : `There are ${plan.waitlist} people`} ahead of you. We’ll text you the moment one opens up. Reply STOP to opt out.`;
  const opened = `Good news, Laura! A ${plan.name} (${plan.code}) has just opened up at ${name}. You’re next on the list, and we’ll hold it for you for 48 hours. ${call} to see it or reserve it.`;
  const monthAgo = addDays(t, -34);
  // Public news only: events anyone can come to and the menu. Nothing from the families’ update.
  const publicEvents = upcomingEvents(slug, 30).filter((e) => kindOf(e) === "public" && !/open house/i.test(e.title)).slice(0, 2);
  const venue = c.venues[c.venueOrder[0]];
  const dish = c.menuFor(c.venueOrder[0], addDays(t, 1)).special.name;

  return [
    {
      label: "A free guide",
      time: "9:41",
      caption: `9:41 pm. Laura is reading ${name}’s free senior living guides. She asks for “${guide.title}” and joins the mailing list to get it.`,
      screen: (
        <Browser host={`${s.brand.domain}/guides`}>
          <div className="ph-pl">
            <div className="ph-pl-brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO} alt="" />
              {name}
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="ph-em-photo" src={guide.photo} alt="" />
            <div className="ph-pl-card phx-form">
              <span className="ph-pl-tag">Free guide</span>
              <h4>{guide.title}</h4>
              <label>
                Your name<span>Laura Bennett</span>
              </label>
              <label>
                Email<span>laura.bennett@gmail.com</span>
              </label>
              <span className="ph-pl-btn">Send me the guide</span>
            </div>
          </div>
        </Browser>
      ),
    },
    {
      label: "The guide arrives",
      time: "9:42",
      caption: `The guide lands in her inbox a minute later, with a welcome to ${name}’s mailing list.`,
      screen: (
        <MailMessage from={name} address={`hello@${s.brand.domain}`} to="Laura" subject={`Your guide: ${guide.title}`} time="9:42 PM">
          <div className="ph-em">
            <div className="ph-em-banner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO} alt="" />
              {name}
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="ph-em-photo" src={guide.photo} alt="" />
            <p className="ph-em-p">Hi Laura, here’s your copy of “{guide.title}”. We hope it helps.</p>
            <span className="ph-em-btn">Read the guide</span>
            <p className="ph-em-p">Once a month we’ll send you what’s new at {name}: events, the menu, and which apartments are available. You can unsubscribe at any time.</p>
            <div className="ph-em-foot">
              {c.site.addressLine} · {s.brand.phone} · Unsubscribe
            </div>
          </div>
        </MailMessage>
      ),
    },
    {
      label: "Community news",
      time: "9:00",
      caption: `Every Sunday, by email only, the list gets ${name}’s public news: events anyone can come to, a dish from the menu, life at the community and apartment availability. Never a resident’s name or a family photo.`,
      screen: (
        <MailMessage from={name} address={`hello@${s.brand.domain}`} to="Laura" subject={`This week at ${name}`} time={`${dayShort(monthAgo).split(", ")[1]}`}>
          <div className="ph-em">
            <div className="ph-em-banner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO} alt="" />
              {name}
            </div>
            <p className="ph-em-p">Hi Laura, here’s what’s happening this month.</p>
            <p className="ph-em-h">Open to the public</p>
            <div className="ph-em-item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/courtyard-palms.jpg" alt="" />
              <span>
                <b>Open House &amp; Lunch</b>
                <small>Tours of the model apartments, and lunch on us · sign up on our website</small>
              </span>
            </div>
            {publicEvents.map((e) => (
              <div className="ph-em-item" key={e.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/img/lobby.jpg" alt="" />
                <span>
                  <b>{e.title}</b>
                  <small>{enWhen(e)} · everyone welcome</small>
                </span>
              </div>
            ))}
            <p className="ph-em-h">From the kitchen</p>
            <p className="ph-em-p">This week in {venue.name}: {dish}.</p>
            <p className="ph-em-h">Life at {name}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="ph-em-photo" src="/img/courtyard-dining.jpg" alt="" />
            <p className="ph-em-p">Lunch has moved out to the courtyard while the afternoons stay warm.</p>
            <p className="ph-em-h">Apartments</p>
            <div className="ph-em-item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/apt-living.jpg" alt="" />
              <span>
                <b>{planName}</b>
                <small>
                  {plan.beds ? `${plan.beds} bedroom` : "Studio"}
                  {plan.sqft ? ` · ${plan.sqft.toLocaleString("en-US")} sq ft` : ""} · Waitlist
                </small>
              </span>
            </div>
            <span className="ph-em-btn">Get availability alerts</span>
            <div className="ph-em-foot">
              {c.site.addressLine} · {s.brand.phone} · Unsubscribe
            </div>
          </div>
        </MailMessage>
      ),
    },
    {
      label: "She joins the waitlist",
      time: "9:04",
      caption: `On the floor plans page, the ${plan.name} has no apartment free today. Laura asks to be texted when one opens up.`,
      screen: (
        <Browser host={`${s.brand.domain}/floor-plans`}>
          <div className="ph-pl">
            <div className="ph-pl-brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO} alt="" />
              {name}
            </div>
            <div className="ph-pl-card phx-form">
              <span className="ph-pl-tag">Waitlist</span>
              <h4>{planName}</h4>
              <span className="ph-pl-meta">
                {plan.beds ? `${plan.beds} bedroom` : "Studio"}
                {plan.sqft ? ` · ${plan.sqft.toLocaleString("en-US")} sq ft` : ""}
                {plan.from ? ` · from ${"$" + plan.from.toLocaleString("en-US")}/month` : ""}
              </span>
              <span className="ph-pl-meta">Get availability alerts</span>
              <div className="ph-pl-opts phx-opts-row">
                <span className="ph-pl-opt on">Text ✓</span>
                <span className="ph-pl-opt">Email</span>
              </div>
              <label>
                Mobile<span>(916) 555-0186</span>
              </label>
              <span className="ph-pl-btn">Notify me</span>
            </div>
          </div>
        </Browser>
      ),
    },
    {
      label: "You’re on the list",
      time: "9:05",
      caption: `A text confirms she’s on the list and where she stands. ${rep.name}, ${rep.role}, sees her on the waitlist too.`,
      screen: <SmsThread {...textHead} bubbles={[{ time: `${dayShort(monthAgo)} 9:05 AM`, text: onList }]} />,
    },
    {
      label: "An apartment opens up",
      time: "10:12",
      dark: true,
      caption: `Weeks later, the moment a ${plan.name} opens up, Laura gets a text.`,
      screen: <LockScreen date={longDate(t)} time="10:12" wallpaper="/img/courtyard-palms.jpg" notices={[{ app: "Messages", title: name, text: opened, time: "now" }]} />,
    },
    {
      label: "She calls",
      time: "10:13",
      caption: `The text asks her to call ${rep.name} to see it or reserve it. ${first(rep.name)} picks up knowing which apartment she wants.`,
      screen: (
        <>
          <ToEnd />
          <SmsThread
            {...textHead}
            bubbles={[
              { time: `${dayShort(monthAgo)} 9:05 AM`, text: onList },
              { time: "Today 10:12 AM", text: opened },
              { me: true, text: "Calling now!" },
            ]}
          />
        </>
      ),
    },
  ];
}

/* ------------------------------------------------------------ 3. a staff member's phone */

export function staffStory(slug: CommunitySlug): TourStep[] {
  const c = communities[slug];
  const s = getStaffData(slug);
  const name = c.site.name;
  const me = s.people[s.roles.calendar];
  const boss = s.people[s.roles.approver];
  const fam = family(slug);

  // The coming week, as the reminder lists it: the notable events, one per day.
  const week = upcomingEvents(slug, 7).filter((e) => e.special || e.cat === "trips" || e.cat === "music" || kindOf(e) !== "resident");
  const seen = new Set<string>();
  const list = week.filter((e) => (seen.has(e.date) ? false : (seen.add(e.date), true))).slice(0, 5);

  const preset = s.photoPresets.find((p) => p.people.some((x) => !x.consent)) ?? s.photoPresets[0];
  const flagged = preset.people.find((x) => !x.consent);
  const ok = preset.people.filter((x) => x.consent);
  const sentence = preset.k === "pumpkins" ? "Pumpkin carving in the Courtyard: so many great ideas, and a few very serious judges." : preset.caption;
  const families = s.community.families;

  const att = attendance(slug);
  const plain = (e: { kind: string; lantern?: boolean; title: string }) => e.kind === "resident" && !e.lantern && !/lantern|trip/i.test(e.title);
  const activity = att.todayLeft.find(plain) ?? att.rows.map((r) => r.event).find(plain) ?? att.rows[0]?.event;
  const pool = s.residentNames;
  const names = Array.from({ length: 10 }, (_, i) => pool[(hash(activity?.id ?? slug) + i * 7) % pool.length]).filter((n, i, a) => a.indexOf(n) === i);
  const here = names.filter((_, i) => i % 4 !== 3);

  const rsvp = eventRequests(slug).find((r) => r.kind === "family-rsvp" && r.status === "waiting");
  const rsvpParty = rsvp && rsvp.from === fam.f.contact ? fam.party : rsvp?.party ?? 2;
  const faces = [
    { x: 18, y: 30 },
    { x: 42, y: 22 },
    { x: 64, y: 34 },
    { x: 84, y: 26 },
  ];

  return [
    {
      label: "Monday’s nudge",
      time: "9:00",
      caption: `Every Monday ${first(me.name)} gets one text: share one moment from this week, with the week’s events listed so she knows what to photograph.`,
      screen: (
        <SmsThread
          name="Kinlight"
          sub={`for ${name}`}
          initials="K"
          color="#1f2f4a"
          bubbles={[
            {
              time: "Today 9:00 AM",
              text: `Hi ${first(me.name)}! Share one moment from this week 📷\n\nComing up:\n${list.map((e) => `• ${enWhen(e)} · ${e.title}`).join("\n")}\n\nTap to post a photo:`,
              link: { title: `Post a moment · ${name}`, host: "kinlight.example/post" },
            },
          ]}
        />
      ),
    },
    {
      label: "One photo, one sentence",
      time: "2:41",
      caption: "She takes a photo (or picks one from her camera roll) and writes one sentence. That’s the whole job.",
      screen: (
        <div className="ph-staff">
          <StaffHead title="Post a moment" sub={`${name} · ${me.name}`} />
          <div className="ph-staff-body">
            <div className="ph-staff-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="ph-staff-photo" src={preset.src} alt="" />
              <div className="ph-staff-row">
                <span className="ph-staff-btn ghost">Take photo</span>
                <span className="ph-staff-btn ghost">Choose photo</span>
              </div>
            </div>
            <div className="ph-staff-card">
              <h5>One sentence</h5>
              <p className="phx-typed live">{sentence}</p>
            </div>
            <span className="ph-staff-btn">Next: check photo consent</span>
          </div>
        </div>
      ),
    },
    {
      label: "The photo-consent check",
      time: "2:42",
      caption: flagged
        ? `Faces are matched to the consent list. ${flagged.name} has no photo consent on file, so the photo can’t go out as it is: crop her out, or send it to ${boss.name} to decide.`
        : "Faces are matched to the consent list before anything goes out.",
      screen: (
        <div className="ph-staff">
          <StaffHead title="Photo consent" sub={`${preset.people.length} people found`} />
          <div className="ph-staff-body">
            <div className="ph-staff-card">
              <div className="phx-facemap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="ph-staff-photo" src={preset.src} alt="" />
                {preset.people.map((p, i) => (
                  <i key={p.name} className={p.consent ? "" : "no"} style={{ left: `${faces[i % 4].x}%`, top: `${faces[i % 4].y}%` }} />
                ))}
              </div>
              <div className="ph-faces">
                {preset.people.map((p) => (
                  <span key={p.name} className={`ph-face${p.consent ? "" : " no"}`}>
                    <i>{p.consent ? "✓" : "!"}</i>
                    {p.name}
                  </span>
                ))}
              </div>
              {flagged && <p>{first(flagged.name)} has no photo consent on file.</p>}
            </div>
            <span className="ph-staff-btn green">Crop {flagged ? first(flagged.name) : "them"} out</span>
            <span className="ph-staff-btn ghost">Send to {first(boss.name)} to decide</span>
          </div>
        </div>
      ),
    },
    {
      label: "Sent for approval",
      time: "2:43",
      caption: `Cropped, and sent to ${boss.name} for approval. Nothing with a resident’s face goes out without it (promise D7: zero sends without approval).`,
      screen: (
        <div className="ph-staff">
          <StaffHead title="Sent for approval" sub={`Waiting for ${boss.name}`} />
          <div className="ph-staff-body">
            <div className="ph-staff-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="ph-staff-photo phx-cropped" src={preset.src} alt="" />
              <p className="phx-typed">{sentence}</p>
              <div className="ph-faces">
                {ok.map((p) => (
                  <span key={p.name} className="ph-face">
                    <i>✓</i>
                    {p.name}
                  </span>
                ))}
              </div>
              {flagged && <span className="ph-chip">{first(flagged.name)} cropped out</span>}
            </div>
            <div className="ph-staff-card">
              <h5>Will go to</h5>
              <p>Website news · {families} families by text, in their languages · Sunday’s digest · Print</p>
              <span className="ph-chip warn">Waiting for {first(boss.name)}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      label: `${first(boss.name)} approves, on the go`,
      time: "2:58",
      caption: `This is ${boss.name}’s phone (${boss.role}). She sees the post, the consent check and where it will go, and approves between meetings.`,
      screen: (
        <div className="ph-staff">
          <StaffHead title="Approvals" sub={`${boss.name} · ${boss.role}`} />
          <div className="ph-staff-body">
            <div className="ph-staff-card">
              <span className="ph-chip">Photo post from {me.name} · 15 min ago</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="ph-staff-photo phx-cropped" src={preset.src} alt="" />
              <p className="phx-typed">{sentence}</p>
              <span className="ph-chip good">
                Photo consent: {ok.length} of {ok.length} ✓{flagged ? ` (${first(flagged.name)} cropped out)` : ""}
              </span>
            </div>
            <div className="ph-staff-row">
              <span className="ph-staff-btn ghost">Edit</span>
              <span className="ph-staff-btn green">Approve</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      label: "Where it went",
      time: "3:01",
      caption: `Back on ${first(me.name)}’s phone: one post, every channel, within minutes (promises D4 and D5).`,
      screen: (
        <div className="ph-staff">
          <StaffHead title="Posted" sub={`Approved by ${boss.name} · 2:58 pm`} />
          <div className="ph-staff-body">
            <ul className="phx-where">
              <li>
                <i>✓</i>
                <span>
                  <b>On the website</b>
                  <small>News and photos, {s.brand.domain} · live at 2:59 pm</small>
                </span>
              </li>
              <li>
                <i>✓</i>
                <span>
                  <b>Sent to {families} families</b>
                  <small>By text and email, in {s.languages.length} languages · {s.weekKpis.deliveredRate}% delivered</small>
                </span>
              </li>
              <li>
                <i>✓</i>
                <span>
                  <b>In this week’s digest</b>
                  <small>Goes out Sunday at 5:00 pm</small>
                </span>
              </li>
              <li>
                <i>✓</i>
                <span>
                  <b>Ready to print</b>
                  <small>Large-print photo page for the front desk</small>
                </span>
              </li>
            </ul>
            <span className="ph-staff-btn ghost">Post another moment</span>
          </div>
        </div>
      ),
    },
    {
      label: "Attendance, with a tap",
      time: activity ? fmtTime(activity.start).split(" ")[0] : "1:05",
      caption: `During ${activity?.title ?? "an activity"}, she taps who’s there and saves. The count feeds the monthly scorecard; no sign-in sheet to type up later.`,
      screen: (
        <div className="ph-staff">
          <StaffHead title={activity?.title ?? "Activity"} sub={activity ? `${dayShort(fromIso(activity.date))} · ${fmtTime(activity.start)} · ${activity.place}` : name} />
          <div className="ph-staff-body">
            <div className="phx-count">
              <b>{here.length}</b> here · tap a name to mark them
            </div>
            <ul className="ph-tap-list">
              {names.map((n) => (
                <li key={n} className={here.includes(n) ? "on" : ""}>
                  {n}
                  <span className="ph-tick">{here.includes(n) ? "✓" : ""}</span>
                </li>
              ))}
            </ul>
            <span className="ph-staff-btn green">Save attendance ({here.length})</span>
            <p className="phx-note">This week so far: {att.week.visits} visits across {att.week.activities} activities.</p>
          </div>
        </div>
      ),
    },
    {
      label: "An RSVP, approved on the go",
      time: "3:20",
      caption: rsvp
        ? `A family RSVP is waiting: ${rsvp.from} for the ${rsvp.event.title}. One tap to approve, and the family is told by text in their language.`
        : "A family RSVP is waiting. One tap to approve, and the family is told by text.",
      screen: (
        <div className="ph-staff">
          <StaffHead title="Sign-ups" sub={`${name} · ${me.name}`} />
          <div className="ph-staff-body">
            {rsvp && (
              <div className="ph-staff-card">
                <span className="ph-chip warn">Family RSVP · waiting</span>
                <h5>{rsvp.event.title}</h5>
                <p>
                  {enWhen(rsvp.event)} · {rsvp.event.place}
                </p>
                <p>
                  <b>{rsvp.from}</b> ({rsvp.relation?.toLowerCase()} of {rsvp.resident}) · party of {rsvpParty} plus {first(rsvp.resident ?? "")}
                </p>
                {rsvp.note && <p>“{rsvp.note}”</p>}
                <p>
                  Via {rsvp.via.toLowerCase()}
                  {rsvp.lang && rsvp.lang !== "English" ? ` · reads in ${rsvp.lang}` : ""}
                </p>
                <div className="ph-staff-row">
                  <span className="ph-staff-btn ghost">Ask</span>
                  <span className="ph-staff-btn green">Approve</span>
                </div>
              </div>
            )}
            <div className="phx-toast">
              ✓ Approved. {rsvp ? first(rsvp.from) : "The family"} was told by text{rsvp?.lang && rsvp.lang !== "English" ? `, in ${rsvp.lang}` : ""}.
            </div>
            <p className="phx-note">
              Waiting: {eventRequests(slug).filter((r) => r.status === "waiting" && r.kind === "family-rsvp").length - 1} more RSVPs ·{" "}
              {eventRequests(slug).filter((r) => r.status === "waiting" && r.kind === "seat-request").length} seat request
            </p>
          </div>
        </div>
      ),
    },
  ];
}
