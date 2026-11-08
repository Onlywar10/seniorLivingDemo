// The phone screens and printed sheets the message workflows need beyond the phone stories (stories.tsx): a resident's
// own texts and emails (residents who opt in hear about their own events, and about family who want to join them),
// the family's "we’ll check with the resident first" step, the prospect's instant inquiry reply, and the staff screens where
// every hand-off lands. Server only: everything comes from the community's own data, so Kestrel Point gets its own.
import type { ReactNode } from "react";
import { LockScreen, MailMessage, SmsThread, type TourStep } from "@/components/phone/Phone";
import { family, keyEvents, prospectPicks, upcomingEvents, first, enWhen, StaffHead, LOGO } from "@/components/phone/stories";
import { communities, type CommunitySlug } from "@/data/communities";
import { kindOf } from "@/data/shared";
import { getStaffData } from "@/data/staff";
import { prospectMessages } from "@/data/staff/alpha";
import { addDays, dayShort, fmtTime, fromIso, iso, longDate, today } from "@/lib/clock";

/** "Veterans Day: Bus Trip to the Veterans Day Parade" → "Bus Trip to the Veterans Day Parade". */
const short = (title: string) => (title.split(":").pop() ?? title).trim();
const day = (d: string) => dayShort(fromIso(d)).split(",")[0];

export function Paper({ title, sub, children, size = "md" }: { title: string; sub: string; children: ReactNode; size?: "md" | "lg" }) {
  return (
    <div className={`fl-paper fl-paper-${size}`}>
      <div className="fl-paper-head">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO} alt="" />
        <span>
          <b>{title}</b>
          <small>{sub}</small>
        </span>
      </div>
      {children}
    </div>
  );
}

export function Mail({ name, domain, to, subject, time, children }: { name: string; domain: string; to: string; subject: string; time: string; children: ReactNode }) {
  return (
    <MailMessage from={name} address={`hello@${domain}`} to={to} subject={subject} time={time}>
      <div className="ph-em">
        <div className="ph-em-banner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO} alt="" />
          {name}
        </div>
        {children}
      </div>
    </MailMessage>
  );
}

/** A request's journey: family asked → resident answered → staff approved → family told. */
function Stages({ items }: { items: { label: string; state: "done" | "now" | "todo" | "no" }[] }) {
  return (
    <ol className="fl-stages">
      {items.map((it) => (
        <li key={it.label} className={`is-${it.state}`}>
          <i>{it.state === "done" ? "✓" : it.state === "no" ? "×" : ""}</i>
          {it.label}
        </li>
      ))}
    </ol>
  );
}

export function moreScreens(slug: CommunitySlug) {
  const c = communities[slug];
  const s = getStaffData(slug);
  const name = c.site.name;
  const domain = s.brand.domain;
  const t = today();
  const nora = s.people[s.roles.calendar];
  const rep = s.people[s.roles.tours];
  const fam = family(slug);
  const { f, me, mom, party } = fam;
  const resident = f.resident;
  const { barbecue, outing } = keyEvents(slug);
  const { plan } = prospectPicks(slug);
  const th = { name, sub: "Text message", initials: s.brand.short, color: "#2e4d33" };
  const trip = short(outing.title);
  const tripWhen = `${day(outing.date)} ${fmtTime(outing.start)}`;
  const meet = fmtTime(outing.start - 15);
  const going = Math.max(4, (outing.taken ?? 9) + 1);

  // Today's activities, as the morning text lists them (nothing private: names, times and rooms only).
  const todays = upcomingEvents(slug, 1).filter((e) => e.date === iso(t) && !e.lantern && kindOf(e) !== "family").slice(0, 4);
  const soon = upcomingEvents(slug, 10);
  const musical = soon.find((e) => e.cat === "music") ?? soon[0];
  // The resident's idea that made the calendar: a real upcoming activity.
  const later = soon.filter((e) => e.date >= iso(addDays(t, 3)) && kindOf(e) === "resident");
  const idea = later.find((e) => /movie|matinee|trivia|karaoke|poetry|sing/i.test(e.title)) ?? later[0] ?? soon[0];
  // Another resident, whose family RSVP nobody has answered yet (staff ask in person).
  const other = s.residentNames.find((n) => n !== resident && !n.startsWith(first(resident))) ?? "Harold Jensen";
  const otherFam = s.contacts.find((x) => x.resident === other)?.contact ?? `${other.split(" ").slice(-1)[0]} family`;

  /* ---------------------------------------------------------------- a resident's phone */

  const morning = `Good morning, ${mom}! Today at ${name}:\n${todays.map((e) => `• ${fmtTime(e.start)} ${e.title} (${e.room})`).join("\n")}\n\nReply STOP to stop these texts.`;
  const offer = `${name}: seats are limited on the ${trip}, ${tripWhen}. Want one? Reply YES and the activities team will confirm.`;
  const booked = `You’re booked, ${mom}! ${trip}, ${enWhen(outing)}.\n\nPickup: the bus leaves the ${outing.room} at ${fmtTime(outing.start)}. Please be there by ${meet}.\nBring: a warm jacket and comfortable shoes. Water is on the bus.\n${going} neighbours are going. Questions? Ask ${first(nora.name)} at the front desk.`;
  const resMorning: TourStep = {
    label: "This morning’s text",
    time: "8:00",
    dark: true,
    caption: `${resident} opted in for texts. At 8 am, today’s activities arrive. The same list is printed for every door.`,
    screen: <LockScreen date={longDate(t)} time="8:00" wallpaper="/img/gardening.jpg" notices={[{ app: "Messages", title: name, text: morning, time: "now" }]} />,
  };
  const resOffer: TourStep = {
    label: "A seat on the outing?",
    time: "9:30",
    caption: `Outings with limited seats are offered by text. ${mom} replies YES, and the activities team confirms with the private details: pickup time, place and what to bring.`,
    screen: <SmsThread {...th} bubbles={[{ time: "Today 9:30 AM", text: offer }, { me: true, text: "YES" }, { time: "9:41 AM", text: booked }]} />,
  };
  const resReminder: TourStep = {
    label: "An hour before",
    time: fmtTime(outing.start - 60).split(" ")[0],
    dark: true,
    caption: "A reminder an hour before anything booked, with the pickup point. Only the resident and their own family get these details.",
    screen: (
      <LockScreen
        date={longDate(fromIso(outing.date))}
        time={fmtTime(outing.start - 60).split(" ")[0]}
        wallpaper="/img/gardening.jpg"
        notices={[{ app: "Messages", title: name, text: `In an hour: ${trip}. The bus leaves the ${outing.room} at ${fmtTime(outing.start)}. See you there, ${mom}!`, time: "now" }]}
      />
    ),
  };
  const resChange: TourStep = {
    label: "A change",
    time: "11:20",
    dark: true,
    caption: "Changes and cancellations reach residents right away, and their families too when it’s something their resident is booked on.",
    screen: (
      <LockScreen
        date={longDate(t)}
        time="11:20"
        wallpaper="/img/gardening.jpg"
        notices={[{ app: "Messages", title: name, text: `Change for ${day(musical.date)}: ${musical.title} now starts at ${fmtTime(musical.start + 30)} (was ${fmtTime(musical.start)}), still in the ${musical.room}.`, time: "now" }]}
      />
    ),
  };
  const famAsk = `${me} would like to come to the ${barbecue.title} with you on ${dayShort(fromIso(barbecue.date))}, with ${party} guests. Is that OK? Reply YES or NO.`;
  const resJoinAsk: TourStep = {
    label: `${me} wants to join`,
    time: "5:20",
    caption: `${me} RSVPed to a family event. Before anything is confirmed, ${mom} is asked: the resident decides. The question is the same whether the event has a limit on places or not.`,
    screen: <SmsThread {...th} bubbles={[{ time: "Today 5:20 PM", text: famAsk }]} />,
  };
  const resJoin: TourStep = {
    label: `${mom} says yes`,
    time: "5:24",
    caption: `${mom} replies YES, and ${me} gets the good news.`,
    screen: <SmsThread {...th} bubbles={[{ time: "Today 5:20 PM", text: famAsk }, { me: true, text: "YES! 😊" }, { time: "5:24 PM", text: `Thanks, ${mom}! We’ll let ${me} know.` }]} />,
  };
  const resJoinNo: TourStep = {
    label: "Or no",
    time: "5:24",
    caption: `If ${mom} would rather not, that’s the end of it. ${me} is told kindly, and nothing is booked.`,
    screen: <SmsThread {...th} bubbles={[{ time: "Today 5:20 PM", text: famAsk }, { me: true, text: "Not this time, thank you" }, { time: "5:24 PM", text: `No problem, ${mom}. We’ll let ${me} know.` }]} />,
  };
  const pending = `Thanks, ${me}! We’ve got your RSVP for the ${barbecue.title} (${party} guests). We’ll check with ${mom} first and text you the answer.`;
  const famJoinYes: TourStep = {
    label: "Yes",
    time: "5:25",
    caption: `${mom} said yes, so ${me} is confirmed, with the details.`,
    screen: <SmsThread {...th} bubbles={[{ time: "Today 5:09 PM", text: pending }, { time: "5:25 PM", text: `Good news, ${me}! ${mom} is looking forward to it. You’re confirmed for the ${barbecue.title}: ${party} guests plus ${mom}, ${enWhen(barbecue)}, in the ${barbecue.room}.` }, { me: true, text: "Wonderful, thank you! 🙏" }]} />,
  };
  const famJoinNo: TourStep = {
    label: "Or a kind no",
    time: "5:25",
    caption: `If ${mom} would rather not, ${me} is told kindly. No reason is given.`,
    screen: <SmsThread {...th} bubbles={[{ time: "Today 5:09 PM", text: pending }, { time: "5:25 PM", text: `Hi ${me}, we asked ${mom} about the ${barbecue.title}, and ${mom} would rather not this time, so we haven’t added you. We’ll let you know about the next family event.` }]} />,
  };
  const resIdea: TourStep = {
    label: "Your idea made the calendar",
    time: "2:10",
    dark: true,
    caption: "When a suggestion becomes an activity, the resident who suggested it hears first.",
    screen: (
      <LockScreen date={longDate(t)} time="2:10" wallpaper="/img/gardening.jpg" notices={[{ app: "Messages", title: name, text: `Your idea made the calendar, ${mom}! ${idea.title}, ${enWhen(idea)}, in the ${idea.room}. Thank you for suggesting it.`, time: "now" }]} />
    ),
  };
  const resSurvey: TourStep = {
    label: "The resident survey",
    time: "10:00",
    caption: "By text and email for residents who opted in. Everyone else gets it on paper, or staff read it aloud.",
    screen: (
      <SmsThread
        {...th}
        bubbles={[{ time: "Today 10:00 AM", text: `Hi ${mom}, how are we doing? Three quick questions about the calendar and activities (2 minutes). Prefer paper? Ask at the front desk.`, link: { title: `Resident survey · ${name}`, host: `${domain}/survey` } }]}
      />
    ),
  };
  const resWeek = (
    <Paper title={`${resident} · your week`} sub="Large print · 18 pt · slipped under the door on Monday" size="lg">
      <ul className="fl-paper-list">
        {[outing, musical, barbecue]
          .slice()
          .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
          .map((e) => (
            <li key={e.title}>
              <b>{day(e.date)} {fromIso(e.date).getUTCDate()}</b>
              <span>{fmtTime(e === outing ? outing.start - 15 : e.start)}</span>
              <span>
                {e.title}
                {e === outing ? ` · meet in the ${outing.room}` : e === barbecue ? ` · with ${me} and ${party} guests` : ""}
              </span>
            </li>
          ))}
      </ul>
      <p className="fl-paper-foot">Just for you. Changes? Ask {first(nora.name)} or the front desk · {s.brand.phone}</p>
    </Paper>
  );

  /* ---------------------------------------------------------------- the family, while the resident is asked */

  const famPending: TourStep = {
    label: `“We’ll check with ${mom} first”`,
    time: "5:09",
    caption: `Straight after ${me} RSVPs. Nothing is confirmed until ${mom} says yes.`,
    screen: (
      <SmsThread
        {...th}
        bubbles={[{ time: "Today 5:09 PM", text: `Thanks, ${me}! We’ve got your RSVP for the ${barbecue.title} (${party} guests). We’ll check with ${mom} first and text you the answer.` }]}
      />
    ),
  };
  const spanish = s.threads.find((x) => x.lang !== "English" && x.msgs.some((m) => !m.me && m.original));
  const spQ = spanish?.msgs.find((m) => !m.me && m.original);
  const spA = spanish ? s.suggestions[spanish.id] : undefined;
  const famOwnLang: TourStep | undefined =
    spanish && spQ?.original && spA
      ? {
          label: "In their own language",
          time: "10:31",
          caption: `${spanish.from} writes in ${spanish.lang} and gets the answer in ${spanish.lang}. Staff read and write English; the translation happens in between.`,
          screen: <SmsThread {...th} bubbles={[{ me: true, text: spQ.original, time: "Today 10:22 AM" }, { text: spA, time: "10:31 AM" }]} />,
        }
      : undefined;


  /* ---------------------------------------------------------------- residents: personal invites and QR check-in */

  // A personal invite: the event matches the resident's interests, so Kinlight texts them. One word books it.
  const invEv = soon.find((e) => /bridge|bingo|club|trivia|card/i.test(e.title) && kindOf(e) === "resident" && !e.lantern) ?? musical;
  const invWhen = invEv.date === iso(t) ? (invEv.start >= 17 * 60 ? "tonight" : "today") : day(invEv.date);
  const invite = `${short(invEv.title)} ${invWhen} at ${fmtTime(invEv.start).replace(":00", "")}, ${mom}. Want a seat? Reply YES.`;
  const resInviteNote: TourStep = {
    label: "A personal invite",
    time: "8:30",
    dark: true,
    caption: `${mom} likes ${/bingo|trivia|card|bridge|club/i.test(invEv.title) ? "cards and games" : "music"}, so Kinlight sends a personal invite when a matching activity is on. Staff wrote nothing.`,
    screen: <LockScreen date={longDate(t)} time="8:30" wallpaper="/img/gardening.jpg" notices={[{ app: "Messages", title: name, text: invite, time: "now" }]} />,
  };
  const resInviteYes: TourStep = {
    label: "One word books it",
    time: "8:34",
    caption: `${mom} replies YES and is booked. Kinlight confirms with the time and place, and reminds ${mom} before it starts.`,
    screen: <SmsThread {...th} bubbles={[{ time: "Today 8:30 AM", text: invite }, { me: true, text: "YES" }, { time: "8:34 AM", text: `You’re booked, ${mom}! ${short(invEv.title)}, ${day(invEv.date)} at ${fmtTime(invEv.start)}${invEv.room ? `, ${invEv.room}` : ""}. We’ll remind you an hour before.` }]} />,
  };

  // QR check-in: a sign at each activity. Scanning it checks the resident in under the number we know. No login.
  const ckEv = todays.find((e) => e.cat === "fitness") ?? todays[0] ?? musical;
  const resCheckin: TourStep = {
    label: "Scan to check in",
    time: fmtTime(ckEv.start).replace(/ (am|pm)$/, ""),
    caption: `A QR sign at the door of every activity. ${mom} scans it with the phone camera and is checked in, from the number we already know. No app, no login.`,
    screen: (
      <div className="fl-checkin">
        <div className="fl-checkin-top">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO} alt="" /> {name}
        </div>
        <div className="fl-checkin-ok" aria-hidden="true">✓</div>
        <b>You’re checked in to {short(ckEv.title)}</b>
        <p>{fmtTime(ckEv.start)}{ckEv.room ? ` · ${ckEv.room}` : ""}</p>
        <small>Checked in as {mom}, from your phone number. Not you? Tell a member of staff.</small>
        <span className="fl-checkin-next">Enjoy the class, {mom}!</span>
      </div>
    ),
  };

  /* ---------------------------------------------------------------- residents: full outings, alerts, sharing, replies */

  const resOfferNote: TourStep = {
    label: "Limited places",
    time: "9:30",
    dark: true,
    caption: `Activities with limited places are offered by text, to every resident who opted in.`,
    screen: <LockScreen date={longDate(t)} time="9:30" wallpaper="/img/gardening.jpg" notices={[{ app: "Messages", title: name, text: offer, time: "now" }]} />,
  };
  const resOfferAsk: TourStep = {
    label: "A place on the outing?",
    time: "9:30",
    caption: `Activities with limited places are offered by text. ${mom} replies YES; the activities team confirms.`,
    screen: <SmsThread {...th} bubbles={[{ time: "Today 9:30 AM", text: offer }, { me: true, text: "YES" }]} />,
  };
  const resFull: TourStep = {
    label: "It’s full",
    time: "9:31",
    caption: `Every place is already taken, so ${mom} is told straight away and goes on the list. Nobody on staff has to remember.`,
    screen: <SmsThread {...th} bubbles={[{ time: "Today 9:30 AM", text: offer }, { me: true, text: "YES" }, { time: "9:31 AM", text: `Sorry, ${mom}, there are no more places on the ${trip}. We’ll let you know if a spot opens up!` }]} />,
  };
  const resPlaceOpens: TourStep = {
    label: "A place opens",
    time: "3:10",
    dark: true,
    caption: `Someone cancels, and the first person on the list is offered the place by text.`,
    screen: <LockScreen date={longDate(t)} time="3:10" wallpaper="/img/gardening.jpg" notices={[{ app: "Messages", title: name, text: `Good news, ${mom}: a place opened up on the ${trip}, ${tripWhen}. Reply YES to take it.`, time: "now" }]} />,
  };
  const resUrgent: TourStep = {
    label: "Urgent news",
    time: "9:05",
    dark: true,
    caption: "Emergencies skip approval and go out within minutes, to every resident who opted in, with the same notice at the front desk.",
    screen: <LockScreen date={longDate(t)} time="9:05" wallpaper="/img/gardening.jpg" notices={[{ app: "Messages", title: name, text: `Fire alarm test at 10:30 this morning. There’s no need to leave your apartment. Questions? Call the front desk at ${s.brand.phone}.`, time: "now" }]} />,
  };
  const sib = `Ellen ${f.contact.split(" ").slice(-1)[0]}`;
  const resShareNote: TourStep = {
    label: `${mom} is asked`,
    time: "11:02",
    dark: true,
    caption: `${me} asked to see ${mom}’s week. Nothing is shared until ${mom} says yes.`,
    screen: <LockScreen date={longDate(t)} time="11:02" wallpaper="/img/gardening.jpg" notices={[{ app: "Messages", title: name, text: `Hi ${mom}, ${me} would like to know about your day-to-day life here at ${name}. If you’d like ${me} to have access, reply YES. If not, reply NO.`, time: "now" }]} />,
  };
  const resShareAsk: TourStep = {
    label: `${mom} is asked`,
    time: "11:02",
    caption: `${me} asked to see ${mom}’s week. ${mom} decides, by text or in person.`,
    screen: <SmsThread {...th} bubbles={[{ time: "Today 11:02 AM", text: `Hi ${mom}, ${me} would like to see what you’re signed up for each week, and photos of you that we share. Is that OK? Reply YES or NO. You can change your mind any time.` }, { me: true, text: "Yes, that’s fine" }, { time: "11:05 AM", text: `Thanks, ${mom}! Just tell us if you change your mind.` }]} />,
  };
  const resShareRep: TourStep = {
    label: "Or their legal representative",
    time: "11:02",
    caption: `In memory care, the resident’s legal representative may answer instead. Here ${me} holds that role, and ${sib} has asked to see ${mom}’s week.`,
    screen: <SmsThread {...th} bubbles={[{ time: "Today 11:02 AM", text: `Hi ${me}, as ${mom}’s legal representative: ${sib} would like to see what ${mom} is signed up for each week, and photos of ${mom} that we share. Is that OK? Reply YES or NO.` }, { me: true, text: "YES" }, { time: "11:06 AM", text: `Thank you, ${me}. We’ll start sending ${sib} ${mom}’s week.` }]} />,
  };
  const resShareOff: TourStep = {
    label: "Turn it off any time",
    time: "4:40",
    caption: `${mom} can stop sharing with a reply, or by telling staff. Community news keeps coming either way.`,
    screen: <SmsThread {...th} bubbles={[{ me: true, time: "Today 4:40 PM", text: `Please stop sending ${me} my week` }, { time: "4:41 PM", text: `Done, ${mom}. ${me} won’t get your week any more, but will still get the community news. You can turn it back on any time.` }]} />,
  };
  const replyAck: TourStep = {
    label: "An automatic thank-you",
    time: "8:14",
    caption: `Every reply, from a resident or a family member, gets the same automatic answer straight away. No promised response time; urgent or care questions go to the front desk.`,
    screen: <SmsThread {...th} bubbles={[{ time: "Today 8:00 AM", text: morning }, { me: true, time: "8:13 AM", text: "Is the hairdresser in on Friday?" }, { time: "8:14 AM", text: `Thanks, ${mom}! The team will see your message. For anything urgent or about your care, call the front desk at ${s.brand.phone}.` }]} />,
  };
  const thanksNote: TourStep = {
    label: "A thank-you reaches the team",
    time: "10:07",
    dark: true,
    caption: "Thank-yous go to the person who shared the photo. Small, and good for the team.",
    screen: <LockScreen date={longDate(t)} time="10:07" wallpaper="/img/courtyard-palms.jpg" notices={[{ app: "Kinlight", title: `${f.contact} said thank you`, text: `“Thank you for the photos from this week! 💛” · family of ${resident}`, time: "now" }]} />,
  };

  /* ---------------------------------------------------------------- staff: each resident's family contacts */

  const contactsInvite: TourStep = {
    label: "Invite at move-in",
    time: "2:30",
    caption: `Staff add each contact from the move-in paperwork. One invite, one reminder a few days later, then it stops.`,
    screen: (
      <div className="ph-staff">
        <StaffHead title="Family contacts" sub={`${name} · ${resident}`} />
        <div className="ph-staff-body">
          <div className="ph-staff-card">
            <span className="ph-chip">{f.relation} · invited</span>
            <h5>{f.contact}</h5>
            <p>{f.phone} · English · text and email</p>
            <span className="ph-staff-btn ghost">Re-send invite</span>
          </div>
          <span className="ph-staff-btn">+ Add a family member</span>
          <div className="phx-toast">✓ Invite sent to {me} by text and email.</div>
        </div>
      </div>
    ),
  };
  const contactsVerify: TourStep = {
    label: "Check a self sign-up",
    time: "2:34",
    caption: `${sib} signed up from the QR poster. ${sib} gets community news now; news about ${mom} waits until staff check and ${mom} agrees.`,
    screen: (
      <div className="ph-staff">
        <StaffHead title="Family contacts" sub={`${name} · ${resident}`} />
        <div className="ph-staff-body">
          <div className="ph-staff-card">
            <span className="ph-chip warn">Signed up · waiting for a check</span>
            <h5>{sib}</h5>
            <p>Says: daughter of {resident}</p>
            <p>Gets: community news only</p>
            <div className="ph-staff-row">
              <span className="ph-staff-btn ghost">Not family</span>
              <span className="ph-staff-btn green">Verified · ask {mom}</span>
            </div>
          </div>
        </div>
      </div>
    ),
  };
  const contactsList: TourStep = {
    label: "Everyone, at a glance",
    time: "2:40",
    caption: `Each person’s status and what they get. Sharing ${mom}’s week can be switched off for one person in a tap.`,
    screen: (
      <div className="ph-staff">
        <StaffHead title="Family contacts" sub={`${name} · ${resident}`} />
        <div className="ph-staff-body">
          <div className="ph-staff-card">
            <span className="ph-chip">{f.relation} · joined</span>
            <h5>{f.contact}</h5>
            <p>Community news · {mom}’s week: <b>On</b></p>
            <span className="ph-staff-btn ghost">Turn off {mom}’s week</span>
          </div>
          <div className="ph-staff-card">
            <span className="ph-chip">Daughter · joined</span>
            <h5>{sib}</h5>
            <p>Community news · {mom}’s week: <b>On</b> · {mom} agreed</p>
            <span className="ph-staff-btn ghost">Turn off {mom}’s week</span>
          </div>
        </div>
      </div>
    ),
  };

  /* ---------------------------------------------------------------- the prospect's instant reply */

  const msgs = prospectMessages(slug, { name: "Laura Bennett", interest: "Independent Living" });
  const proInstantText: TourStep = {
    label: "An instant text",
    time: "9:52",
    caption: "Within a minute, at any hour, by text and email. The staff alert says so too, so nobody sends a second “thanks for asking”.",
    screen: <SmsThread {...th} bubbles={[{ time: "Today 9:52 PM", text: msgs[0].text }]} />,
  };
  const proInstantMail: TourStep = {
    label: "And an email",
    time: "9:52",
    caption: `From ${name}’s own address, with the menu, calendar and floor plans to look at tonight.`,
    screen: (
      <Mail name={name} domain={domain} to="Laura" subject={msgs[1].subject ?? `Thank you for your interest in ${name}`} time="9:52 PM">
        {msgs[1].text.split("\n\n").map((p) => (
          <p className="ph-em-p" key={p.slice(0, 20)}>
            {p}
          </p>
        ))}
        <span className="ph-em-btn">See this week’s menu</span>
        <div className="ph-em-foot">
          {c.site.addressLine} · {s.brand.phone}
        </div>
      </Mail>
    ),
  };

  /* ---------------------------------------------------------------- staff: where every hand-off lands */

  const alertsSales: TourStep = {
    label: "Inquiries and tours",
    time: "9:53",
    dark: true,
    caption: `Prospect alerts go to ${rep.name}: who, what they want, and that the instant reply already went.`,
    screen: (
      <LockScreen
        date={longDate(t)}
        time="9:53"
        wallpaper="/img/lantern-garden.jpg"
        notices={[
          { app: "Kinlight", title: `New inquiry · ${name}`, text: "Laura Bennett, Independent Living for her mother. Instant reply sent. Call her by tomorrow morning.", time: "now" },
          { app: "Kinlight", title: "Tour booked", text: `Laura Bennett · ${dayShort(addDays(t, 2))}, 10:00 am with ${first(rep.name)}`, time: "2m ago" },
          { app: "Kinlight", title: "Open house sign-up", text: "A new lead: 2 places for the Open House & Lunch.", time: "1h ago" },
        ]}
      />
    ),
  };
  const alertsResidents: TourStep = {
    label: "Residents’ answers",
    time: "5:25",
    dark: true,
    caption: `${first(nora.name)} hears the moment a resident answers, and when someone hasn’t, so staff can ask in person.`,
    screen: (
      <LockScreen
        date={longDate(t)}
        time="5:25"
        wallpaper="/img/lantern-garden.jpg"
        notices={[
          { app: "Kinlight", title: `${mom} said YES`, text: `${me}’s RSVP for the ${barbecue.title} (${party} guests). Ready for you to approve.`, time: "now" },
          { app: "Kinlight", title: `${mom} replied YES`, text: `To the ${trip}. Ready to book.`, time: "8m ago" },
          { app: "Kinlight", title: `No answer from ${other}`, text: `${otherFam} would like to join ${first(other)} at the ${barbecue.title}. Ask ${first(other)} in person.`, time: "1h ago" },
        ]}
      />
    ),
  };
  const requestsStages: TourStep = {
    label: "Every request, by stage",
    time: "5:30",
    caption: "Each family request shows where it is. A resident without a phone is asked in person, and staff tap the answer.",
    screen: (
      <div className="ph-staff">
        <StaffHead title="Sign-ups" sub={`${name} · ${nora.name}`} />
        <div className="ph-staff-body">
          <div className="ph-staff-card">
            <span className="ph-chip warn">Family RSVP · ready to approve</span>
            <h5>{barbecue.title}</h5>
            <p>
              <b>{f.contact}</b> · {party} guests with {resident}
            </p>
            <Stages items={[{ label: `${me} asked`, state: "done" }, { label: `${mom} said yes`, state: "done" }, { label: "Approve", state: "now" }, { label: `${me} told`, state: "todo" }]} />
            <span className="ph-staff-btn green">Approve and tell {me}</span>
          </div>
          <div className="ph-staff-card">
            <span className="ph-chip">Family RSVP · no answer yet</span>
            <h5>{barbecue.title}</h5>
            <p>
              <b>{otherFam}</b> would like to join {other}
            </p>
            <Stages items={[{ label: "Family asked", state: "done" }, { label: "Ask in person", state: "now" }, { label: "Approve", state: "todo" }, { label: "Family told", state: "todo" }]} />
            <div className="ph-staff-row">
              <span className="ph-staff-btn ghost">{first(other)} said no</span>
              <span className="ph-staff-btn">{first(other)} said yes</span>
            </div>
          </div>
        </div>
      </div>
    ),
  };
  const bookResident: TourStep = {
    label: "Book a resident",
    time: "10:14",
    caption: `Residents who reply YES land on the list, ready to confirm. Anyone who signs up at the desk is added with one tap. Confirming sends them the pickup details.`,
    screen: (
      <div className="ph-staff">
        <StaffHead title={trip} sub={`${enWhen(outing)} · ${outing.room}`} />
        <div className="ph-staff-body">
          <div className="phx-count">
            <b>{going}</b> of {outing.cap ?? 18} seats
          </div>
          <div className="ph-staff-card">
            <span className="ph-chip warn">Replied YES by text</span>
            <h5>{resident}</h5>
            <span className="ph-staff-btn green">Confirm seat</span>
          </div>
          <span className="ph-staff-btn ghost">+ Add a resident who signed up at the desk</span>
          <div className="phx-toast">✓ Booked. {mom} has the pickup details{f.sms ? `, and ${me} was told` : ""}.</div>
        </div>
      </div>
    ),
  };
  const markOpen: TourStep = {
    label: "Mark it available",
    time: "10:11",
    caption: `One switch on the apartment. Everyone on the ${plan.name} waitlist gets a text, in order, and the website updates.`,
    screen: (
      <div className="ph-staff">
        <StaffHead title="Apartments" sub={`${name} · ${rep.name}`} />
        <div className="ph-staff-body">
          <div className="ph-staff-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="ph-staff-photo" src="/img/apt-living.jpg" alt="" />
            <h5>
              {plan.name} ({plan.code})
            </h5>
            <p>Waitlist: {plan.waitlist} {plan.waitlist === 1 ? "person" : "people"}</p>
            <span className="ph-staff-btn green">Mark available and tell the waitlist</span>
          </div>
          <div className="phx-toast">✓ {plan.waitlist} texted. Calls go to {first(rep.name)}.</div>
        </div>
      </div>
    ),
  };

  return {
    resident,
    trip,
    musical,
    idea,
    resMorning,
    resOffer,
    resReminder,
    resChange,
    resJoin,
    resJoinAsk,
    resOfferNote,
    resOfferAsk,
    resInviteNote,
    resInviteYes,
    resCheckin,
    invEv,
    ckEv,
    resFull,
    resPlaceOpens,
    resUrgent,
    resShareNote,
    resShareAsk,
    resShareRep,
    resShareOff,
    replyAck,
    thanksNote,
    contactsInvite,
    contactsVerify,
    contactsList,
    resJoinNo,
    famJoinYes,
    famJoinNo,
    resIdea,
    resSurvey,
    resWeek,
    famPending,
    famOwnLang,
    proInstantText,
    proInstantMail,
    alertsSales,
    alertsResidents,
    requestsStages,
    bookResident,
    markOpen,
  };
}
