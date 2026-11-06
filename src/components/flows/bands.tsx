// Every message the Kinlight alpha sends, as short animated workflows: one tab per audience (family, prospect, resident,
// staff), each a set of flows, each flow a few steps drawn as little scenes (Scenes.tsx). Steps that send something
// carry a preview (the phone screens, or the printed sheet for residents). Grounded in the vault's
// "Kinlight Alpha Interfaces" and "Kinlight Events and Activities (Alpha)": residents get no texts, emails or app in
// alpha, families have no portal (personal-link pages only). Server only: it reads the community's staff records.
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { LockScreen, MailMessage, SmsThread, Browser, type TourStep } from "@/components/phone/Phone";
import { familyStory, prospectStory, staffStory, family, keyEvents, prospectPicks, upcomingEvents, first, enWhen, LOGO } from "@/components/phone/stories";
import { communities, type CommunitySlug } from "@/data/communities";
import { nextSpecials } from "@/data/communities/specials";
import { getStaffData } from "@/data/staff";
import { prospectMessages } from "@/data/staff/alpha";
import { addDays, dayShort, fmtTime, fromIso, iso, longDate, today } from "@/lib/clock";

import type { Band, Frame, Preview, SceneKind, SiteAction } from "./types";

/* ---------------------------------------------------------------- timing: busier pictures and screens stay up longer */

/** How long each scene's animation needs to read (its last motion ends around these times, plus a beat). */
const sceneMs: Record<SceneKind, number> = {
  calendar: 1800, chart: 1900, home: 2000, call: 2100, talk: 2000, guide: 2000, fork: 2100, stop: 2300, bell: 2300, list: 2100,
  text: 2400, approve: 2100, route: 2300, print: 2300, slip: 2600, camera: 2400, build: 2300, qr: 2700, form: 2600,
  rsvp: 2700, reply: 2300, translate: 2700, email: 2600, send: 2700, web: 2600, chat: 2500,
};

/** Words a reader has to take in on a screen, found by walking the rendered elements. */
function words(node: ReactNode): number {
  if (typeof node === "string") return node.split(/\s+/).filter(Boolean).length;
  if (typeof node === "number") return 1;
  if (Array.isArray(node)) return node.reduce((n: number, c) => n + words(c), 0);
  if (!isValidElement(node)) return 0;
  const props = (node as ReactElement<Record<string, unknown>>).props;
  let n = words(props.children as ReactNode);
  for (const [k, v] of Object.entries(props)) {
    if (k === "children") continue;
    if (typeof v === "string" && /^(text|title|subject|preview|date)$/.test(k)) n += words(v);
    if (Array.isArray(v)) n += v.reduce((m: number, x) => m + (typeof x === "object" && x ? words(Object.values(x as object).filter((y) => typeof y === "string" || isValidElement(y)) as ReactNode) : 0), 0);
  }
  return n;
}
/** About 3.5 words a second while presenting, between 2.8 and 9 seconds a screen. */
const dwellFor = (n: number) => Math.round(Math.min(9000, Math.max(2800, 1400 + n * 280)));

/** How long the visitor's actions on the website take to play, plus a moment to look at the result. */
function siteMs(actions: SiteAction[]) {
  const each = (a: SiteAction) => (a.do === "wait" ? a.ms : a.do === "type" ? 500 + a.value.length * 55 : a.do === "scroll" ? 1100 : 1000);
  return actions.reduce((n, a) => n + each(a), 0) + 2200;
}
const frameMs = (f: Frame) => (f.kind === "site" ? siteMs(f.actions) : dwellFor(words(f.kind === "phone" ? f.step.screen : f.node)));

function timed(bands: Band[]): Band[] {
  for (const b of bands)
    for (const f of b.flows)
      for (const st of f.steps) {
        st.sceneMs = sceneMs[st.scene];
        const p: Preview | undefined = st.preview;
        if (p) p.dwell = p.frames.map(frameMs);
      }
  return bands;
}

const phones = (...steps: TourStep[]): Preview => ({ frames: steps.map((step) => ({ kind: "phone", step })) });
const paperOf = (node: ReactNode): Preview => ({ frames: [{ kind: "paper", node }] });
const join = (...ps: Preview[]): Preview => ({ frames: ps.flatMap((p) => p.frames) });

const th = (s: { brand: { short: string } }, name: string) => ({ name, sub: "Text message", initials: s.brand.short, color: "#2e4d33" });

function Paper({ title, sub, children, size = "md" }: { title: string; sub: string; children: ReactNode; size?: "md" | "lg" }) {
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

function Mail({ name, domain, to, subject, time, children }: { name: string; domain: string; to: string; subject: string; time: string; children: ReactNode }) {
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

export function buildBands(slug: CommunitySlug): Band[] {
  const c = communities[slug];
  const s = getStaffData(slug);
  const name = c.site.name;
  const domain = s.brand.domain;
  const t = today();
  const rep = s.people[s.roles.tours];
  const nora = s.people[s.roles.calendar];
  const boss = s.people[s.roles.approver];
  const chef = s.people[s.roles.menus];
  const fam = family(slug);
  const { me, mom, link } = fam;
  const { barbecue, outing } = keyEvents(slug);
  const { plan, guide } = prospectPicks(slug);
  const openHouse = { date: nextSpecials().openHouse, start: 600 };
  // The live website, played inside a desktop browser frame (paths are this community's own pages).
  const site = (path: string, actions: SiteAction[], chat = false): Preview => ({ frames: [{ kind: "site", path: `/${slug}${path}`, host: domain, actions, chat }] });
  // The website post for the weekly photo (the pumpkin carving at Alder Bend), else the newest post.
  const posts = c.publishedStories(iso(t));
  const post = posts.find((x) => /pumpkin/i.test(x.slug)) ?? posts[0];
  const laura = { name: "Laura Bennett", email: "laura.bennett@gmail.com", phone: "(916) 555-0186" };
  const webGuide = site("/guides", [
    { do: "scroll", sel: ".inf-guide", text: guide.title },
    { do: "click", sel: ".inf-guide .btn", text: guide.title },
    { do: "type", sel: "#gd-name", value: laura.name },
    { do: "type", sel: "#gd-email", value: laura.email },
    { do: "point", sel: "form button[type=submit]" },
  ]);
  // The website's chat, answering from the community's own pages: tonight's dinner, then a price question in Spanish.
  const ask = (q: string, wait: number): SiteAction[] => [
    { do: "type", sel: "#chat-q", value: q },
    { do: "click", sel: ".chat-send" },
    { do: "wait", ms: wait },
  ];
  const webChat = site("", [
    { do: "wait", ms: 600 },
    { do: "click", sel: ".chat-fab" },
    ...ask("What’s for dinner tonight?", 3600),
  ], true);
  const webChatEs = site("", [
    { do: "wait", ms: 600 },
    { do: "click", sel: ".chat-fab" },
    ...ask("¿Cuánto cuesta vivir aquí?", 4200),
  ], true);
  // A question the website can't answer: the chat asks them to give the community a call.
  const webChatCall = site("", [
    { do: "wait", ms: 600 },
    { do: "click", sel: ".chat-fab" },
    ...ask("Can I bring my piano?", 3400),
    { do: "point", sel: ".chat-list a.chat-cta[href^='tel:']" },
  ], true);
  const webTour = site("/tour", [
    { do: "scroll", sel: ".tr-days" },
    { do: "click", sel: ".tr-day:not(.full)", n: 1 },
    { do: "click", sel: ".tr-time:not(.taken)", n: 1 },
    { do: "scroll", sel: "#tr-name" },
    { do: "type", sel: "#tr-name", value: laura.name },
    { do: "type", sel: "#tr-phone", value: laura.phone },
    { do: "point", sel: ".tr-submit" },
  ]);
  const webOpenHouse = site(`/calendar?view=today&date=${openHouse.date}`, [
    { do: "click", sel: ".cal-ev", text: "Open House" },
    { do: "type", sel: ".cal-rsvp input[name=name]", value: laura.name },
    { do: "type", sel: ".cal-rsvp input[name=email]", value: laura.email },
    { do: "point", sel: ".cal-rsvp button[type=submit]" },
  ]);
  const webWaitlist = site("/floor-plans", [
    { do: "scroll", sel: ".fp-alert-btn", text: plan.code },
    { do: "click", sel: ".fp-alert-btn", text: plan.code },
    { do: "type", sel: ".fp-alert input", value: laura.phone },
    { do: "point", sel: ".fp-alert button[type=submit]" },
  ]);
  const webPost = site(`/news/${post.slug}`, [
    { do: "wait", ms: 1200 },
    { do: "scroll", sel: "article p, main p", n: 2 },
    { do: "wait", ms: 1200 },
  ]);
  const famSteps = familyStory(slug);
  const proSteps = prospectStory(slug);
  const staffSteps = staffStory(slug);
  const pick = (steps: TourStep[], ...i: number[]) => phones(...i.map((n) => steps[n]));
  const families = s.community.families;
  const soon = upcomingEvents(slug, 10);
  const musical = soon.find((e) => e.cat === "music") ?? soon[0];
  const msgs = prospectMessages(slug, { name: "Laura Bennett", interest: "Independent Living", tour: { days: 2, time: 600 } });
  const [, , tourConf, tourRemind] = msgs;
  const month = t.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  const cal = soon.slice(0, 7);
  const menuDays = [0, 1, 2].map((i) => ({ d: addDays(t, i), m: c.menuFor(c.venueOrder[0], addDays(t, i)) }));
  const venue = c.venues[c.venueOrder[0]];

  /* -------------------------------------------------------- previews written here (the rest reuse the phone stories) */

  const famSignup: TourStep = {
    label: "The family sign-up page",
    caption: "Behind the QR poster and the “add a family member” link. Consent is built in; no password.",
    screen: (
      <Browser host={`${domain}/family`}>
        <div className="ph-pl">
          <div className="ph-pl-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO} alt="" />
            {name}
          </div>
          <div className="ph-pl-card phx-form">
            <h4>Get the weekly update</h4>
            <label>Your name<span>{fam.f.contact}</span></label>
            <label>Your family member<span>{fam.f.resident}</span></label>
            <label>Mobile<span>{fam.f.phone}</span></label>
            <span className="ph-pl-meta">Language</span>
            <div className="ph-pl-opts phx-opts-row">
              <span className="ph-pl-opt on">English ✓</span>
              <span className="ph-pl-opt">Español</span>
            </div>
            <span className="ph-pl-meta">How to hear from us</span>
            <div className="ph-pl-opts">
              <span className="ph-pl-opt on">Text and email ✓</span>
            </div>
            <p className="phx-note">☑ I agree to receive texts from {name}. Message rates may apply. Reply STOP to stop.</p>
            <span className="ph-pl-btn">Sign me up</span>
          </div>
        </div>
      </Browser>
    ),
  };
  const famWelcome: TourStep = {
    label: "Welcome text",
    caption: "Straight away, in the language they chose.",
    screen: <SmsThread {...th(s, name)} bubbles={[{ time: "Today 7:12 PM", text: `Welcome, ${me}! You’ll get ${name}’s weekly highlights here and the full update by email on Sundays. Your personal link for RSVPs and settings: ${link}\n\nReply STOP to opt out.` }]} />,
  };
  const famChange: TourStep = {
    label: "A change, by text",
    caption: `Sent as soon as ${first(boss.name)} approves it. Emergencies skip the approval.`,
    time: "2:15",
    dark: true,
    screen: <LockScreen date={longDate(t)} time="2:15" wallpaper="/img/mother-daughter.jpg" notices={[{ app: "Messages", title: name, text: `Change for ${dayShort(fromIso(musical.date)).split(",")[0]}: ${musical.title} now starts at ${fmtTime(musical.start + 30)} (was ${fmtTime(musical.start)}). Families welcome as always.`, time: "now" }]} />,
  };
  const famStop: TourStep = {
    label: "Opting out by text",
    caption: "STOP turns off texts from this community only. The email keeps coming unless they unsubscribe there too.",
    screen: <SmsThread {...th(s, name)} bubbles={[{ me: true, text: "STOP", time: "Today 8:40 PM" }, { text: `You won’t get any more texts from ${name}. You’ll still get the Sunday email; to change that, use your link: ${link}. Reply START to rejoin.` }]} />,
  };
  const famSeatNo: TourStep = {
    label: "If the answer is no",
    caption: "The family is told either way, kindly.",
    screen: <SmsThread {...th(s, name)} bubbles={[{ time: "Today 11:14 AM", text: `Hi ${me}, we asked ${mom} about ${outing.title} (${enWhen(outing)}). She’d rather stay in that day, so we haven’t booked a seat. We’ll keep you posted on the next one!` }]} />,
  };
  const famSurvey: TourStep = {
    label: "The family survey",
    caption: "Before go-live and again at day 90. The same questions both times, so the change shows on the scorecard.",
    screen: <SmsThread {...th(s, name)} bubbles={[{ time: "Today 10:00 AM", text: `Hi ${me}, how are we doing at keeping you in the loop about ${mom}? Five quick questions, 2 minutes:`, link: { title: `Family survey · ${name}`, host: `${domain}/survey` } }]} />,
  };

  const proTour: TourStep[] = [
    { label: "Tour confirmed", caption: "Straight away, with the address and how to change it.", screen: <SmsThread {...th(s, name)} bubbles={[{ time: "Today 9:52 PM", text: tourConf.text }, { me: true, text: "Thank you! See you then." }]} /> },
    { label: "Reminder the day before", caption: "4 pm the afternoon before: where to park and who to ask for.", time: "4:00", dark: true, screen: <LockScreen date={longDate(addDays(t, 1))} time="4:00" wallpaper="/img/courtyard-palms.jpg" notices={[{ app: "Messages", title: name, text: tourRemind.text, time: "now" }]} /> },
  ];
  const proOpen: TourStep[] = [
    {
      label: "You’re registered",
      caption: "Every public sign-up gets a confirmation, and lands with the sales team as a lead.",
      screen: (
        <Mail name={name} domain={domain} to="Laura" subject={`You’re registered: Open House & Lunch, ${dayShort(fromIso(openHouse.date))}`} time="8:31 PM">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="ph-em-photo" src="/img/courtyard-palms.jpg" alt="" />
          <p className="ph-em-p">Hi Laura, we’ve saved 2 places for you at the Open House & Lunch on {dayShort(fromIso(openHouse.date))}, 10:00 am to 1:00 pm.</p>
          <p className="ph-em-p">Walk through the model apartments, meet {first(rep.name)} and the team, and stay for lunch on us.</p>
          <span className="ph-em-btn">Add to calendar</span>
          <div className="ph-em-foot">{c.site.addressLine} · {s.brand.phone}</div>
        </Mail>
      ),
    },
    { label: "Reminder the day before", time: "4:00", dark: true, screen: <LockScreen date={longDate(addDays(fromIso(openHouse.date), -1))} time="4:00" wallpaper="/img/courtyard-palms.jpg" notices={[{ app: "Messages", title: name, text: `See you tomorrow at 10:00 am for the Open House & Lunch at ${name}! Park by the main entrance. Plans changed? Reply here.`, time: "now" }]} /> },
  ];

  const staffAlerts: TourStep = {
    label: "Staff alerts",
    caption: "Each alert goes to the person who owns it, by text, email or in the workspace, as they choose on the Alerts screen.",
    time: "9:49",
    dark: true,
    screen: (
      <LockScreen
        date={longDate(t)}
        time="9:49"
        wallpaper="/img/lantern-garden.jpg"
        notices={[
          { app: "Kinlight", title: `New inquiry · ${name}`, text: "Laura Bennett, Independent Living for her mother. Instant reply sent. Call her by tomorrow morning.", time: "now" },
          { app: "Kinlight", title: "Tour booked", text: `Laura Bennett · ${dayShort(addDays(t, 2))}, 10:00 am with ${first(rep.name)}`, time: "2m ago" },
          { app: "Kinlight", title: "RSVP waiting", text: `${fam.f.contact}: ${fam.party} people for the Family Barbecue. Approve within 1 business day.`, time: "1h ago" },
          { app: "Kinlight", title: "Seat request", text: `${fam.f.contact} asks for a seat for ${mom} on ${outing.title}. Check with ${mom} first.`, time: "1h ago" },
        ]}
      />
    ),
  };
  const staffStale: TourStep = {
    label: "Page going stale",
    caption: "Each page has an owner and a rhythm (menus weekly, calendar monthly). The owner hears about it before families notice.",
    screen: (
      <Mail name="Kinlight" domain="kinlight.example" to={first(chef.name)} subject={`${name}: the dining menu hasn’t changed in 9 days`} time="8:00 AM">
        <p className="ph-em-p">Hi {first(chef.name)}, the {venue.name} menu on {name}’s website was last updated 9 days ago. Menus are due every week.</p>
        <p className="ph-em-p">Snap a photo of next week’s menu and the workspace will read it in.</p>
        <span className="ph-em-btn">Update the menu</span>
      </Mail>
    ),
  };
  const staffScore: TourStep = {
    label: "The monthly scorecard",
    caption: "One page, emailed as a PDF on the 1st to the executive director and the COO. The day-90 results report comes the same way.",
    screen: (
      <Mail name="Kinlight" domain="kinlight.example" to={first(boss.name)} subject={`${name} · ${month} scorecard`} time="7:00 AM">
        <p className="ph-em-p">Hi {first(boss.name)}, here’s {name}’s scorecard for {month}.</p>
        <div className="fl-score">
          <span><b>{s.weekKpis.deliveredRate}%</b> messages delivered</span>
          <span><b>{families}</b> families reached</span>
          <span><b>11 / 11</b> promises on track</span>
          <span><b>0</b> stale pages</span>
        </div>
        <span className="ph-em-btn">Open the PDF</span>
      </Mail>
    ),
  };
  const staffPulse: TourStep = {
    label: "Monthly staff pulse",
    caption: "Three questions once a month: is posting getting easier?",
    screen: <SmsThread name="Kinlight" sub={`for ${name}`} initials="K" color="#1f2f4a" bubbles={[{ time: "Today 3:00 PM", text: `Hi ${first(nora.name)}, 3 quick questions about this month (1 minute):`, link: { title: "Staff pulse", host: "kinlight.example/pulse" } }]} />,
  };

  const calendarPaper = (
    <Paper title={`${name} · ${month} activities`} sub="Large print · 16 pt · every door and the Lobby" size="lg">
      <ul className="fl-paper-list">
        {cal.map((e) => (
          <li key={e.id}>
            <b>{dayShort(fromIso(e.date)).split(",")[0]} {fromIso(e.date).getUTCDate()}</b>
            <span>{fmtTime(e.start)}</span>
            <span>{e.title}</span>
          </li>
        ))}
      </ul>
      <p className="fl-paper-foot">Sign up with the activities team · Front desk {s.brand.phone}</p>
    </Paper>
  );
  const menuPaper = (
    <Paper title={`This week’s menus · ${venue.name}`} sub="Large print · 18 pt · tables and front desk">
      <ul className="fl-paper-list fl-paper-menu">
        {menuDays.map(({ d, m }) => (
          <li key={d.toISOString()}>
            <b>{dayShort(d).split(",")[0]}</b>
            <span>{m.special.name}</span>
            <span>{m.soup?.name ?? ""}</span>
          </li>
        ))}
      </ul>
    </Paper>
  );
  const flyerPaper = (
    <Paper title="Family Barbecue" sub={`${dayShort(fromIso(barbecue.date))} · ${fmtTime(barbecue.start)} · ${barbecue.room}`} size="lg">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="fl-paper-photo" src="/img/courtyard-bbq.jpg" alt="" />
      <p className="fl-paper-big">Burgers, lemonade and live music. Bring your family!</p>
      <p className="fl-paper-foot">Large print · 24 pt · front desk and elevators</p>
    </Paper>
  );
  const slipPaper = (
    <Paper title="What would you like to see?" sub="Suggestion slip · drop it at the front desk, or scan the code">
      <div className="fl-paper-lines"><span /><span /><span /></div>
      <p className="fl-paper-foot">Name (optional) ______________ &nbsp; ▣ Scan to send it from a phone</p>
    </Paper>
  );
  const posterPaper = (
    <Paper title="Get the weekly update" sub="QR poster · front desk and by each elevator" size="lg">
      <div className="fl-paper-qr" aria-hidden="true" />
      <p className="fl-paper-big">Photos, events and menus from {name}, by text or email, in your language.</p>
      <p className="fl-paper-foot">Scan with your phone camera. No app, no password.</p>
    </Paper>
  );
  const surveyPaper = (
    <Paper title="How are we doing?" sub="Resident survey · printed in large print, or read aloud by staff">
      <ol className="fl-paper-q">
        <li>Do you know what’s happening this week? ☐ Yes ☐ Sometimes ☐ No</li>
        <li>Is the calendar easy to read? ☐ Yes ☐ Sometimes ☐ No</li>
        <li>What would you like more of? ____________</li>
      </ol>
    </Paper>
  );

  /* -------------------------------------------------------- the bands */

  const photoLine = fam.momInPhoto ? `${mom} at pumpkin carving 📷` : "This week’s best moment 📷";
  return timed([
    {
      key: "family",
      label: "Families",
      tagline: "Text, email and a personal link. No app, no login, in their own language.",
      flows: [
        {
          id: "f-join",
          title: "Joining",
          hook: "From a poster in the lobby to the weekly update.",
          steps: [
            { id: "f-join-page", scene: "form", label: "Signs up with consent", actor: "family", preview: phones(famSignup) },
            { id: "f-join-welcome", scene: "text", label: "Welcome text", actor: "auto", when: "Instantly", text: `Welcome, ${me}! 👋`, preview: phones(famWelcome) },
          ],
        },
        {
          id: "f-weekly",
          title: "Weekly highlights",
          hook: "One photo from the week, straight to their phone.",
          steps: [
            { id: "f-weekly-text", scene: "text", label: "Lands as a text", actor: "auto", when: "Weekday morning, once a manager approves", text: photoLine, preview: pick(famSteps, 0, 1) },
          ],
        },
        {
          id: "f-reply",
          title: "Replies",
          hook: "Families just reply. The right person answers.",
          steps: [
            { id: "f-reply-send", scene: "reply", label: "Family replies", actor: "family", text: "Can I bring the kids?" },
            { id: "f-reply-route", scene: "route", label: "Routed to the right person", actor: "auto" },
            { id: "f-reply-answer", scene: "text", label: "Answer by text", actor: "staff", when: "Minutes later", text: "Of course! 🎉", preview: pick(famSteps, 2, 3) },
            { id: "f-reply-tr", scene: "translate", label: "Any language, translated", actor: "auto", text: "¿Puedo llevar a los niños?", text2: "Can I bring the kids?" },
          ],
        },
        {
          id: "f-change",
          title: "Changes & urgent news",
          hook: "Post the change once. Everyone hears.",
          steps: [
            { id: "f-change-text", scene: "bell", label: "Texted right away", actor: "auto", when: "Once approved; emergencies skip the wait", text: `${musical.title}: new time`, preview: phones(famChange) },
          ],
        },
        {
          id: "f-digest",
          title: "The Sunday email",
          hook: "The whole week, built for you, from your own address.",
          steps: [
            { id: "f-digest-send", scene: "email", label: "Lands in their inbox", actor: "auto", when: "Sunday 5 pm, reviewed by staff", text: `${mom}’s week`, preview: pick(famSteps, 4, 5) },
          ],
        },
        {
          id: "f-rsvp",
          title: "Family event RSVP",
          hook: `The ${barbecue.title}, from their own link.`,
          steps: [
            { id: "f-rsvp-link", scene: "rsvp", label: "RSVPs on their link", actor: "family", preview: pick(famSteps, 6) },
            { id: "f-rsvp-approve", scene: "approve", label: "Staff approve", actor: "staff", when: "Within 1 day" },
            { id: "f-rsvp-ok", scene: "text", label: "Confirmed", actor: "auto", text: "You’re all set! 🍔", preview: pick(famSteps, 7) },
          ],
        },
        {
          id: "f-seat",
          title: "A seat on an outing",
          hook: "Families ask. The resident decides.",
          steps: [
            { id: "f-seat-ask", scene: "form", label: `“A seat for ${mom}?”`, actor: "family", preview: pick(famSteps, 6) },
            { id: "f-seat-check", scene: "talk", label: "Staff ask the resident", actor: "staff" },
            { id: "f-seat-answer", scene: "fork", label: "Yes or no, they’re told", actor: "staff", preview: phones(famSteps[7], famSeatNo) },
          ],
        },
        {
          id: "f-prefs",
          title: "Opting out",
          hook: "Their choice, per channel, any time.",
          steps: [
            { id: "f-prefs-stop", scene: "stop", label: "Replies STOP", actor: "family", preview: phones(famStop) },
            { id: "f-prefs-link", scene: "form", label: "Or changes it on their link", actor: "family", preview: pick(famSteps, 6) },
          ],
        },
        {
          id: "f-survey",
          title: "Family survey",
          hook: "Same questions at the start and at day 90.",
          steps: [
            { id: "f-survey-send", scene: "text", label: "A survey link", actor: "auto", text: "How are we doing?", preview: phones(famSurvey) },
            { id: "f-survey-page", scene: "form", label: "Two minutes", actor: "family" },
            { id: "f-survey-score", scene: "chart", label: "On the scorecard", actor: "auto" },
          ],
        },
      ],
    },
    {
      key: "prospect",
      label: "Prospects",
      tagline: "From a first look on the website to a call about an apartment.",
      flows: [
        {
          id: "p-guide",
          title: "Free guide",
          hook: "A guide today, the community’s news every month.",
          steps: [
            { id: "p-guide-ask", scene: "guide", label: "Asks for a guide", actor: "prospect", preview: webGuide },
            { id: "p-guide-mail", scene: "email", label: "Guide arrives", actor: "auto", when: "Instantly", text: "Your free guide", preview: pick(proSteps, 1) },
            { id: "p-guide-news", scene: "email", label: "Monthly news", actor: "auto", when: "Every month", text: `This month at ${name}`, preview: pick(proSteps, 2) },
          ],
        },
        {
          id: "p-inquiry",
          title: "Asking the chat",
          hook: "Answers from the website, any hour, in their language.",
          steps: [
            { id: "p-inq-en", scene: "chat", label: "Answered automatically", actor: "auto", when: "Instantly, any hour", text: "What’s for dinner tonight?", preview: webChat },
            { id: "p-inq-es", scene: "translate", label: "In their language too", actor: "auto", text: "¿Cuánto cuesta?", text2: "How much is it?", preview: webChatEs },
            { id: "p-inq-call", scene: "call", label: "No answer? “Give us a call”", actor: "auto", preview: webChatCall },
          ],
        },
        {
          id: "p-tour",
          title: "Booking a tour",
          hook: "No back-and-forth.",
          steps: [
            { id: "p-tour-book", scene: "calendar", label: "Picks a time online", actor: "prospect", preview: webTour },
            { id: "p-tour-conf", scene: "text", label: "Confirmed", actor: "auto", when: "Instantly", text: "Tour booked ✓", preview: phones(proTour[0]) },
            { id: "p-tour-rem", scene: "bell", label: "Reminder", actor: "auto", when: "Day before", text: "See you tomorrow!", preview: phones(proTour[1]) },
          ],
        },
        {
          id: "p-open",
          title: "Open house",
          hook: "The only events with a public sign-up. Each one is a lead.",
          steps: [
            { id: "p-open-form", scene: "web", label: "Signs up on the website", actor: "prospect", preview: webOpenHouse },
            { id: "p-open-conf", scene: "email", label: "You’re registered", actor: "auto", text: "Open House & Lunch", preview: phones(proOpen[0]) },
            { id: "p-open-rem", scene: "bell", label: "Reminder", actor: "auto", when: "Day before", text: "See you at 10!", preview: phones(proOpen[1]) },
            { id: "p-open-lead", scene: "list", label: "Sales follow up", actor: "staff" },
          ],
        },
        {
          id: "p-wait",
          title: "Apartment waitlist",
          hook: "Hear the moment the right apartment opens.",
          steps: [
            { id: "p-wait-join", scene: "list", label: "Joins the waitlist", actor: "prospect", preview: webWaitlist },
            { id: "p-wait-on", scene: "text", label: "You’re on the list", actor: "auto", text: `${plan.code}: you’re on the list`, preview: pick(proSteps, 4) },
            { id: "p-wait-free", scene: "home", label: "One opens up", actor: "staff" },
            { id: "p-wait-alert", scene: "text", label: "Texted instantly", actor: "auto", text: `${plan.code} is free! Call ${first(rep.name)}`, preview: pick(proSteps, 5) },
            { id: "p-wait-call", scene: "call", label: "Calls in", actor: "prospect", preview: pick(proSteps, 6) },
          ],
        },
      ],
    },
    {
      key: "resident",
      label: "Residents",
      tagline: "Paper and people: large print, and the activities team in person.",
      note: "No texts, email or app for residents in alpha. Their app comes in beta.",
      flows: [
        {
          id: "r-print",
          title: "Calendars & menus",
          hook: "Post once. The large-print copies make themselves.",
          steps: [
            { id: "r-print-cal", scene: "print", label: "Large-print calendar", actor: "auto", when: "Monthly", preview: paperOf(calendarPaper) },
            { id: "r-print-menu", scene: "print", label: "Large-print menus", actor: "auto", when: "Weekly", preview: paperOf(menuPaper) },
          ],
        },
        {
          id: "r-flyer",
          title: "Event flyers",
          hook: "Every event prints its own flyer.",
          steps: [
            { id: "r-flyer-print", scene: "print", label: "Flyer at the front desk", actor: "auto", preview: paperOf(flyerPaper) },
          ],
        },
        {
          id: "r-signup",
          title: "Activities & outings",
          hook: "Signed up in person. Never on a public page.",
          steps: [
            { id: "r-signup-book", scene: "list", label: "Added at the front desk", actor: "staff" },
            { id: "r-signup-att", scene: "list", label: "Attendance tapped", actor: "staff", preview: pick(staffSteps, 6) },
          ],
        },
        {
          id: "r-suggest",
          title: "Suggestions",
          hook: "Residents shape the calendar.",
          steps: [
            { id: "r-suggest-slip", scene: "slip", label: "Fills a slip", actor: "resident", preview: paperOf(slipPaper) },
            { id: "r-suggest-list", scene: "route", label: "Reaches the team", actor: "auto" },
            { id: "r-suggest-cal", scene: "calendar", label: "On next month’s calendar", actor: "staff" },
          ],
        },
        {
          id: "r-survey",
          title: "Resident survey",
          hook: "On paper, or read aloud.",
          steps: [
            { id: "r-survey-paper", scene: "print", label: "Printed survey", actor: "staff", preview: paperOf(surveyPaper) },
            { id: "r-survey-score", scene: "chart", label: "On the scorecard", actor: "auto" },
          ],
        },
        {
          id: "r-poster",
          title: "Bringing families in",
          hook: "A poster by the elevator signs families up.",
          steps: [
            { id: "r-poster-print", scene: "print", label: "QR poster", actor: "auto", preview: paperOf(posterPaper) },
            { id: "r-poster-scan", scene: "qr", label: "Families scan it", actor: "family", preview: phones(famSignup) },
          ],
        },
      ],
    },
    {
      key: "staff",
      label: "Staff",
      tagline: "Post once from a phone. It goes everywhere.",
      flows: [
        {
          id: "s-post",
          title: "The weekly post",
          hook: "One nudge, one photo, every channel.",
          steps: [
            { id: "s-post-nudge", scene: "bell", label: "Monday nudge", actor: "auto", when: "Monday, 9 am", text: "Share one moment 📷", preview: pick(staffSteps, 0) },
            { id: "s-post-photo", scene: "camera", label: "Photo + one line", actor: "staff", preview: pick(staffSteps, 1, 2) },
            { id: "s-post-approve", scene: "approve", label: "Approved on the go", actor: "staff", preview: pick(staffSteps, 3, 4) },
            { id: "s-post-where", scene: "send", label: "Everywhere at once", actor: "auto", text: `${families} families`, preview: join(pick(staffSteps, 5), webPost) },
          ],
        },
        {
          id: "s-alerts",
          title: "Alerts",
          hook: "Each one goes to the person who owns it.",
          steps: [
            { id: "s-alert-inq", scene: "bell", label: "New inquiry", actor: "auto", text: "New inquiry: Laura", preview: phones(staffAlerts) },
            { id: "s-alert-tour", scene: "bell", label: "Tour booked", actor: "auto", text: "Tour booked: Thu 10 am", preview: phones(staffAlerts) },
            { id: "s-alert-rsvp", scene: "bell", label: "RSVP waiting", actor: "auto", text: "RSVP waiting: 3 people", preview: pick(staffSteps, 7) },
            { id: "s-alert-stale", scene: "email", label: "Page going stale", actor: "auto", text: "Menu: 9 days old", preview: phones(staffStale) },
          ],
        },
        {
          id: "s-reply",
          title: "Family replies",
          hook: "One inbox, every language.",
          steps: [
            { id: "s-reply-in", scene: "route", label: "Reply comes to you", actor: "auto", text: "Can I bring the kids?", preview: pick(famSteps, 3) },
            { id: "s-reply-answer", scene: "reply", label: "Just reply", actor: "staff", text: "Of course! 🎉" },
            { id: "s-reply-tr", scene: "translate", label: "Other languages arrive translated", actor: "auto", text: "¿Puedo llevar a los niños?", text2: "Can I bring the kids?" },
          ],
        },
        {
          id: "s-events",
          title: "Events & attendance",
          hook: "Create once. The kind decides who sees it.",
          steps: [
            { id: "s-events-rsvp", scene: "approve", label: "Approve RSVPs", actor: "staff", preview: pick(staffSteps, 7) },
            { id: "s-events-att", scene: "list", label: "Tap who came", actor: "staff", preview: pick(staffSteps, 6) },
            { id: "s-events-score", scene: "chart", label: "Counts on the scorecard", actor: "auto" },
          ],
        },
        {
          id: "s-avail",
          title: "Apartment availability",
          hook: "One change tells the whole waitlist.",
          steps: [
            { id: "s-avail-mark", scene: "home", label: "Mark it available", actor: "staff" },
            { id: "s-avail-send", scene: "send", label: "Waitlist told", actor: "auto", text: `${plan.waitlist} on the list` },
            { id: "s-avail-call", scene: "call", label: "Take the calls", actor: "staff" },
          ],
        },
        {
          id: "s-score",
          title: "Scorecard",
          hook: "Proof every month, in one page.",
          steps: [
            { id: "s-score-mail", scene: "email", label: "Emailed on the 1st", actor: "auto", text: `${month} scorecard`, preview: phones(staffScore) },
            { id: "s-score-pulse", scene: "text", label: "Staff pulse", actor: "auto", text: "3 quick questions", preview: phones(staffPulse) },
          ],
        },
      ],
    },
  ]);
}
