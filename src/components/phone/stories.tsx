// The three phone walk-throughs shown in sales meetings: a family's phone, a prospect's phone and a staff member's phone.
// Server Components only (they read the staff records in src/data/staff/alpha.ts); each story is a list of PhoneTour
// steps, and <PhoneStory> renders one. Everything comes from the community's own data, so Alder Bend and Kestrel Point
// each show their own people, families and events. Not in the alpha, so never shown here: social posting and signage.
import type { ReactNode } from "react";
import { Browser, LockScreen, MailInbox, MailMessage, PhoneTour, SmsThread, type TourStep } from "./Phone";
import { ToEnd } from "./ToEnd";
import { communities, type CommunitySlug } from "@/data/communities";
import { nextSpecials } from "@/data/communities/specials";
import { kindOf, type CalEvent } from "@/data/shared";
import { getStaffData } from "@/data/staff";
import { attendance, eventRequests, prospectMessages, sampleFamily } from "@/data/staff/alpha";
import { addDays, dayShort, fmtTime, fromIso, hash, iso, longDate, today } from "@/lib/clock";
import "./stories.css";

export const STORIES = ["family", "prospect", "staff"] as const;
export type StoryKey = (typeof STORIES)[number];
export const isStory = (v: unknown): v is StoryKey => typeof v === "string" && (STORIES as readonly string[]).includes(v);

export const storyMeta: Record<StoryKey, { tab: string; title: string; who: (slug: CommunitySlug) => string; intro: string }> = {
  family: {
    tab: "Family",
    title: "A family’s phone",
    who: (slug) => {
      const f = sampleFamily(slug);
      return `${f.contact}, whose mother ${f.resident.split(" ")[0]} lives at ${communities[slug].site.name}.`;
    },
    intro: "The weekly text, the Sunday email and a personal link, with no app and no password. Families who read another language get all of it in their own language, translated automatically.",
  },
  prospect: {
    tab: "Prospect",
    title: "A prospect’s phone",
    who: (slug) => `Laura Bennett, looking at Assisted Living for her father. She finds ${communities[slug].site.name} on Google late one evening.`,
    intro: "An instant reply day or night, a tour booked online, and a confirmation and a reminder without anyone lifting a finger.",
  },
  staff: {
    tab: "Staff",
    title: "A staff member’s phone",
    who: (slug) => {
      const s = getStaffData(slug);
      const p = s.people[s.roles.calendar];
      return `${p.name}, ${p.role}. Everything she needs to do between activities, from her phone.`;
    },
    intro: "The weekly nudge, a photo post with the consent check, approval on the go, attendance and RSVPs.",
  },
};

/* ------------------------------------------------------------ shared helpers */

const first = (name: string) => name.split(" ")[0];
const LOGO = "/img/brand/dots.png";

const enWhen = (e: { date: string; start: number }) => `${dayShort(fromIso(e.date))}, ${fmtTime(e.start)}`;

function upcomingEvents(slug: CommunitySlug, days: number) {
  const t = today();
  return communities[slug].staffEventsBetween(t, days, iso(t)).flatMap((d) => d.events);
}

/** The real upcoming Family Barbecue (from the calendar), and a real upcoming outing with seats. */
function keyEvents(slug: CommunitySlug) {
  const evs = upcomingEvents(slug, 22);
  const barbecue: Pick<CalEvent, "date" | "start" | "end" | "title" | "room"> = evs.find((e) => e.title === "Family Barbecue") ?? { date: nextSpecials().barbecue, start: 720, end: 870, title: "Family Barbecue", room: "Courtyard" };
  const trips = evs.filter((e) => kindOf(e) === "resident" && e.cat === "trips" && e.cap && !/shopping/i.test(e.title) && e.date > iso(addDays(today(), 2)));
  const outing = trips.find((e) => e.special) ?? trips.find((e) => /bus trip/i.test(e.title)) ?? trips[0] ?? evs.find((e) => e.cat === "trips")!;
  return { barbecue, outing };
}

/** The sample family, their personal link and the barbecue party (her and the two grandchildren). */
function family(slug: CommunitySlug) {
  const s = getStaffData(slug);
  const f = sampleFamily(slug);
  const token = hash(f.contact + slug).toString(36).slice(0, 5);
  const photo = s.photoPresets.find((p) => p.people.some((x) => x.name === f.resident && x.consent)) ?? s.photoPresets[0];
  const momInPhoto = photo.people.some((x) => x.name === f.resident && x.consent);
  return { s, f, mom: first(f.resident), me: first(f.contact), link: `${s.brand.domain}/r/${token}`, party: 3, photo, momInPhoto };
}

function StaffHead({ title, sub }: { title: string; sub: string }) {
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
  const { s, f, mom, me, link, party, photo, momInPhoto } = family(slug);
  const { barbecue, outing } = keyEvents(slug);
  const t = today();
  const nora = s.people[s.roles.calendar];
  const name = c.site.name;
  const venue = c.venues[c.venueOrder[0]];
  const menu = [0, 1, 2].map((i) => ({ d: addDays(t, i + 1), m: c.menuFor(c.venueOrder[0], addDays(t, i + 1)) }));
  const others = s.photoPresets.filter((p) => p !== photo).slice(0, 2);
  const photoLine = momInPhoto ? `${mom} at ${photo.title.toLowerCase()}` : photo.title.toLowerCase();

  const weekly = `Hi ${me}, here’s the best of this week at ${name}: ${photoLine}. 📷\n\nComing up: Family Barbecue, ${enWhen(barbecue)}, in the ${barbecue.room}. RSVP and see more photos on your personal link:`;
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
        { time: "Today 10:02 AM", text: weekly, img: photo.src, link: { title: `${mom}’s week at ${name}`, host: link, img: undefined } },
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
      caption: `${me}’s lock screen on a weekday morning. The weekly highlights text comes from ${name}’s own number. Families who read another language get it in their own language, translated automatically.`,
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
      caption: `One photo of ${mom} from this week (photo consent is on file), the next family event and ${me}’s personal link. Written once by ${nora.name}.`,
      screen: thread([]),
    },
    {
      label: `${me} replies`,
      time: "10:09",
      caption: `${me} just replies to the text. The answer comes back a few minutes later, from the same number.`,
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
            { from: name, subject: `${mom}’s week at ${name}`, preview: `This week’s photos, the Family Barbecue and this week’s menu.`, time: "5:00 PM", unread: true, highlight: true },
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
      caption: `This week’s photos, the upcoming family events with an RSVP button, and this week’s menu in ${venue.name}. The same email goes out to every family, each in their own language.`,
      screen: (
        <MailMessage from={name} address={`hello@${s.brand.domain}`} to={me} subject={`${mom}’s week at ${name}`} time="5:00 PM">
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
            <p className="ph-em-p">{momInPhoto ? `${mom} at ${photo.title.toLowerCase()}.` : `${photo.title}.`}</p>
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
            <p className="ph-em-h">Coming up</p>
            <div className="ph-em-item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/courtyard-bbq.jpg" alt="" />
              <span>
                <b>Family Barbecue</b>
                <small>
                  {enWhen(barbecue)} · {barbecue.room}
                </small>
              </span>
            </div>
            <span className="ph-em-btn">RSVP</span>
            <div className="ph-em-item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/vineyard.jpg" alt="" />
              <span>
                <b>{outing.title}</b>
                <small>{enWhen(outing)}</small>
              </span>
            </div>
            <span className="ph-em-btn phx-em-btn-alt">Ask for a seat for {mom}</span>
            <p className="ph-em-h">This week’s menu · {venue.name}</p>
            {menu.map(({ d, m }) => (
              <p className="ph-em-p phx-menu" key={iso(d)}>
                <b>{dayShort(d).split(",")[0]}:</b> {m.special.name}
                {m.soup?.name ? ` · Soup: ${m.soup.name}` : ""}
              </p>
            ))}
            <div className="ph-em-foot">
              You get this email because you’re family of {mom}. Change language or channel · Unsubscribe
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
      caption: `${first(nora.name)} approves the RSVP from her phone, checks with ${mom} at lunch, and ${me} gets one text confirming both.`,
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

export function prospectStory(slug: CommunitySlug): TourStep[] {
  const c = communities[slug];
  const s = getStaffData(slug);
  const rep = s.people[s.roles.tours];
  const name = c.site.name;
  const city = c.site.address.city;
  const prospect = "Laura Bennett";
  const msgs = prospectMessages(slug, { name: prospect, interest: "Assisted Living", tour: { days: 2, time: 600 } });
  const [txt, mail, conf, remind] = msgs;
  const t = today();
  const tourDay = addDays(t, 2);
  const textHead = { name, sub: "Text message", initials: s.brand.short, color: "#2e4d33" };

  return [
    {
      label: "She searches on Google",
      time: "9:41",
      caption: `9:41 pm. Laura searches for assisted living near ${city}. ${name}’s Google Business Profile and website are accurate and current (promise D9).`,
      screen: (
        <Browser host="google.com">
          <div className="phx-search">
            <div className="phx-search-box">assisted living near {city}</div>
            <div className="phx-result phx-result-top">
              <small>{s.brand.domain}</small>
              <b>{name} · Assisted Living Services in {city}</b>
              <span className="phx-stars">
                {s.gbp.rating.toFixed(1)} ★★★★★ <small>({s.gbp.reviews} reviews)</small>
              </span>
              <p>Help with medications, dressing and bathing, delivered in your own apartment. See this week’s menu and activity calendar, floor plans with starting prices, and book a tour online.</p>
              <span className="phx-chips">
                <i>Book a tour</i>
                <i>Call</i>
                <i>Directions</i>
              </span>
            </div>
            <div className="phx-result">
              <small>seniorliving-directory.example</small>
              <b>Assisted living in {city}, CA: compare 14 options</b>
            </div>
          </div>
        </Browser>
      ),
    },
    {
      label: "She asks a question",
      time: "9:47",
      caption: "She fills in the inquiry form on the website. Nobody is in the office at this hour.",
      screen: (
        <Browser host={`${s.brand.domain}/contact`}>
          <div className="ph-pl">
            <div className="ph-pl-brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO} alt="" />
              {name}
            </div>
            <div className="ph-pl-card phx-form">
              <h4>Ask us anything</h4>
              <label>
                Your name<span>{prospect}</span>
              </label>
              <label>
                Mobile<span>(916) 555-0186</span>
              </label>
              <label>
                Email<span>laura.bennett@gmail.com</span>
              </label>
              <label>
                Interested in<span>Assisted Living · for my father</span>
              </label>
              <label>
                Message
                <span className="phx-area">My dad is 84 and needs help with his medications and getting dressed in the morning. Is that included? We’d like to visit soon.</span>
              </label>
              <span className="ph-pl-btn">Send</span>
            </div>
          </div>
        </Browser>
      ),
    },
    {
      label: "An instant reply, by text",
      time: "9:48",
      caption: `Within a minute, day or night: a text with ${first(rep.name)}’s name and a link to book a tour. ${rep.name} is told about Laura at the same time (promise D8: instant reply, team told within 5 minutes).`,
      screen: <SmsThread {...textHead} bubbles={[{ time: "Today 9:48 PM", text: txt.text }]} />,
    },
    {
      label: "…and by email",
      time: "9:49",
      caption: "The email answers the questions everyone has: this week’s menu, the activity calendar, floor plans with starting prices.",
      screen: (
        <MailMessage from={name} address={`hello@${s.brand.domain}`} to="Laura" subject={mail.subject ?? ""} time="9:48 PM">
          <div className="ph-em">
            <div className="ph-em-banner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO} alt="" />
              {name}
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="ph-em-photo" src="/img/care-chat.jpg" alt="" />
            {mail.text.split("\n\n").map((p, i) => (
              <p className="ph-em-p phx-pre" key={i}>
                {p}
              </p>
            ))}
            <p className="ph-em-h">For you</p>
            <div className="phx-em-links">
              <span>This week’s menu</span>
              <span>Activity calendar</span>
              <span>Floor plans and starting prices</span>
            </div>
            <span className="ph-em-btn">Book a tour</span>
            <div className="ph-em-foot">
              {c.site.addressLine} · {s.brand.phone}
            </div>
          </div>
        </MailMessage>
      ),
    },
    {
      label: "She books a tour",
      time: "9:51",
      caption: `She picks a time that suits her on the website. It goes straight into ${first(rep.name)}’s calendar; no back-and-forth.`,
      screen: (
        <Browser host={`${s.brand.domain}/tour`}>
          <div className="ph-pl">
            <div className="ph-pl-brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO} alt="" />
              {name}
            </div>
            <div className="ph-pl-card">
              <h4>Book a tour</h4>
              <p>
                With {rep.name}, {rep.role}. Lunch is on us.
              </p>
              <span className="ph-pl-meta">Day</span>
              <div className="phx-slots">
                {[1, 2, 3].map((n) => (
                  <span key={n} className={n === 2 ? "on" : ""}>
                    {dayShort(addDays(t, n)).split(",")[0]}
                    <b>{addDays(t, n).getUTCDate()}</b>
                  </span>
                ))}
              </div>
              <span className="ph-pl-meta">Time</span>
              <div className="ph-pl-opts">
                <span className="ph-pl-opt on">10:00 am ✓</span>
                <span className="ph-pl-opt">11:30 am</span>
                <span className="ph-pl-opt">2:00 pm</span>
              </div>
              <span className="ph-pl-btn">Book {dayShort(tourDay)}, 10:00 am</span>
            </div>
          </div>
        </Browser>
      ),
    },
    {
      label: "Tour confirmed by text",
      time: "9:52",
      caption: "The confirmation arrives straight away, with the address and how to change it.",
      screen: (
        <>
          <ToEnd />
          <SmsThread {...textHead} bubbles={[{ time: "Today 9:48 PM", text: txt.text }, { time: "9:52 PM", text: conf.text }, { me: true, text: "Thank you! See you then." }]} />
        </>
      ),
    },
    {
      label: "A reminder the day before",
      time: "4:00",
      dark: true,
      caption: `The afternoon before, a reminder: where to park and who to ask for. ${first(rep.name)} meets a prospect who already knows the menu, the calendar and the prices.`,
      screen: <LockScreen date={longDate(addDays(t, 1))} time="4:00" wallpaper="/img/courtyard-palms.jpg" notices={[{ app: "Messages", title: name, text: remind.text, time: "now" }]} />,
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

const builders: Record<StoryKey, (slug: CommunitySlug) => TourStep[]> = { family: familyStory, prospect: prospectStory, staff: staffStory };

/** One phone walk-through, ready to tap through. */
export function PhoneStory({ slug, story, size = "md", title }: { slug: CommunitySlug; story: StoryKey; size?: "sm" | "md" | "lg"; title?: string }) {
  return <PhoneTour key={`${slug}-${story}`} steps={builders[story](slug)} size={size} title={title} />;
}
