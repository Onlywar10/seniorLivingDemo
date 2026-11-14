// Every message the Kinlight alpha sends, as short animated workflows: one tab per audience (family, prospect, resident,
// staff), each a set of flows, each flow a few steps drawn as little scenes (Scenes.tsx). Steps that send something
// carry a preview (the phone screens, the printed sheet, or the live website). Each tab shows only what that person
// sees; a story involving two people lives in the tab of the person it starts with, and its hand-offs (`next`) point
// to where it carries on. Grounded in the vault's "Kinlight Alpha Interfaces" and "Kinlight Events and Activities
// (Alpha)", plus one deliberate change: residents who opt in get texts and email too. Server only.
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { LockScreen, SmsThread, Browser, type TourStep } from "@/components/phone/Phone";
import { familyStory, prospectStory, staffStory, StaffHead, family, keyEvents, prospectPicks, publicPick, upcomingEvents, first, enWhen, LOGO } from "@/components/phone/stories";
import { communities, type CommunitySlug } from "@/data/communities";
import { getStaffData } from "@/data/staff";
import { prospectMessages } from "@/data/staff/alpha";
import { addDays, dayShort, fmtTime, fromIso, iso, longDate, today } from "@/lib/clock";

import { queue } from "@/data/staff/portal";
import { familyEmails, prospectEmails, residentEmails, staffEmails, weekAheadFor } from "./emails";
import { Mail, Paper, moreScreens } from "./screens";
import type { Band, Frame, Preview, SceneKind, SiteAction } from "./types";

/* ---------------------------------------------------------------- timing: busier pictures and screens stay up longer */

/** How long each scene's animation needs to read (its last motion ends around these times, plus a beat). */
const sceneMs: Record<SceneKind, number> = {
  calendar: 1800, chart: 1900, home: 2000, call: 2100, talk: 2000, guide: 2000, fork: 2100, stop: 2300, bell: 2300, list: 2100,
  text: 2400, approve: 2100, route: 2300, print: 2300, slip: 2600, camera: 2400, build: 2300, qr: 2700, form: 2600,
  rsvp: 2700, reply: 2300, ways: 2900, translate: 2700, email: 2600, send: 2700, web: 2600, chat: 2500,
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
const frameMs = (f: Frame) => (f.kind === "site" ? siteMs(f.actions) : f.kind === "mail" ? 7500 : dwellFor(words(f.kind === "phone" ? f.step.screen : f.node)));

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
  const { barbecue } = keyEvents(slug);
  const { plan } = prospectPicks(slug);
  // The next event open to everyone on the website calendar (the holiday craft fair), which prospects sign up for.
  const fair = publicPick(slug);
  const fairWhen = `${dayShort(fromIso(fair.date))}, ${fmtTime(fair.start)}`;
  // The live website, played inside a desktop browser frame (paths are this community's own pages).
  const site = (path: string, actions: SiteAction[], chat = false): Preview => ({ frames: [{ kind: "site", path: `/${slug}${path}`, host: domain, actions, chat }] });
  // The website post for the weekly photo (the pumpkin carving at Alder Bend), else the newest post.
  const posts = c.publishedStories(iso(t));
  const post = posts.find((x) => /pumpkin/i.test(x.slug)) ?? posts[0];
  const laura = { name: "Laura Bennett", email: "laura.bennett@gmail.com", phone: "(916) 555-0186" };
  // The website's chat, answering from the community's own pages: what a day here is like, ending with a tour invitation.
  const ask = (q: string, wait: number): SiteAction[] => [
    { do: "type", sel: "#chat-q", value: q },
    { do: "click", sel: ".chat-send" },
    { do: "wait", ms: wait },
  ];
  const webChat = site("", [
    { do: "wait", ms: 600 },
    { do: "click", sel: ".chat-fab" },
    ...ask("What is daily life here really like?", 3800),
    { do: "point", sel: ".chat-list a.chat-cta:not([href^='tel:'])" },
  ], true);
  // A question the website can't answer: the chat asks them to give the community a call.
  const webChatCall = site("", [
    { do: "wait", ms: 600 },
    { do: "click", sel: ".chat-fab" },
    ...ask("Can I bring my piano?", 3400),
    { do: "point", sel: ".chat-list a.chat-cta[href^='tel:']" },
  ], true);
  const webSignup = site("/stay-connected", [
    { do: "scroll", sel: ".sc-form" },
    { do: "click", sel: ".sc-chan:has(input[value=both])" },
    { do: "scroll", sel: "#sc-name" },
    { do: "type", sel: "#sc-name", value: fam.f.contact },
    { do: "type", sel: "#sc-phone", value: fam.f.phone },
    { do: "type", sel: "#sc-email", value: fam.f.email },
    { do: "click", sel: "#sc-sms" },
    { do: "point", sel: ".sc-form button[type=submit]" },
  ]);
  const webTour = site("/tour", [
    { do: "scroll", sel: ".tr-days" },
    { do: "click", sel: ".tr-day:not(.full)", n: 1 },
    { do: "click", sel: ".tr-time:not(.taken)", n: 1 },
    { do: "scroll", sel: "#tr-name" },
    { do: "type", sel: "#tr-name", value: laura.name },
    { do: "type", sel: "#tr-phone", value: laura.phone },
    { do: "click", sel: "#tr-sms" },
    { do: "point", sel: ".tr-submit" },
  ]);
  const webPublic = site(`/calendar?view=today&date=${fair.date}`, [
    { do: "click", sel: ".cal-ev", text: fair.title },
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
  // The staff workspace, in the same desktop browser window, showing this community, signed in as the right person:
  // the events lead (Nora), the front desk (Bea) or the manager (Renata).
  type As = "events" | "manager" | "kitchen" | "desk";
  const team = (path: string, actions: SiteAction[], as: As = "events"): Preview => ({ frames: [{ kind: "site", path: `/staff${path}`, host: `${domain}/staff`, actions, staff: slug, as }] });
  // The cards a text alert opens: the photo post to approve, a family RSVP the resident said yes to, a resident who
  // hasn't answered, a new family member to check.
  const q = queue(slug);
  const cardOf = (kind: string, test: (x: (typeof q)[number]) => boolean = () => true) => q.find((x) => x.kind === kind && test(x))?.id ?? q[0].id;
  const newsCard = cardOf("post", (x) => x.kind === "post" && /news post/i.test(x.postKind));
  // Photos live on events: added when editing the event in Calendar, captioned by Kinlight.
  const tPost = team("/calendar?photos=1", [
    { do: "wait", ms: 1200 },
    { do: "scroll", sel: ".pc-photo-form .pt-shots button" },
    { do: "point", sel: ".pc-photo-form .pt-shots button", n: 0 },
    { do: "scroll", sel: ".pc-photo-post button" },
    { do: "point", sel: ".pc-photo-post button" },
  ]);
  const tMenus = team("/menus", [
    { do: "wait", ms: 900 },
    { do: "scroll", sel: "button.sx-btn-terra", text: "Publish menus" },
    { do: "point", sel: "button.sx-btn-terra", text: "Publish menus" },
  ], "kitchen");
  const tApprovePost = team(`/card/${newsCard}`, [
    { do: "wait", ms: 900 },
    { do: "point", sel: ".pt-q h3" },
    { do: "point", sel: ".pt-act button.sx-btn-primary" },
  ], "manager");
  // Something changed today: one quick form on Today. It goes to everyone booked and updates the website.
  const tCalEdit = team("/today", [
    { do: "wait", ms: 900 },
    { do: "scroll", sel: ".pt-changed" },
    { do: "click", sel: ".pt-changed button.sx-btn-terra" },
    { do: "wait", ms: 500 },
    { do: "click", sel: ".pt-chg-form .sx-seg button", text: "Running late" },
    { do: "point", sel: ".pt-chg-line" },
    { do: "click", sel: ".pt-chg-form button[type=submit]" },
    { do: "wait", ms: 600 },
    { do: "point", sel: ".pt-reach" },
    { do: "wait", ms: 1200 },
  ]);
  const tUrgent = team("/post?type=announcement", [
    { do: "wait", ms: 900 },
    { do: "click", sel: ".pt-urgent input" },
    { do: "type", sel: ".pt-form textarea", value: `Fire alarm test at 10:30 this morning. There’s no need to leave. Questions? Call the front desk at ${s.brand.phone}.` },
    { do: "scroll", sel: ".pt-submit button" },
    { do: "point", sel: ".pt-submit button" },
  ], "manager");
  const tSignups = team("/calendar", [
    { do: "wait", ms: 900 },
    { do: "click", sel: ".sx-seg button", text: "Month" },
    { do: "wait", ms: 600 },
    { do: "click", sel: ".ced-ev", text: "Family Barbecue" },
    { do: "wait", ms: 1000 },
    { do: "point", sel: ".pt-reqs li", n: 0 },
    { do: "wait", ms: 1200 },
  ]);
  // A resident's yes confirms the request on its own and the family is told: nobody approves it.
  const tSignupApprove = team("/calendar", [
    { do: "wait", ms: 900 },
    { do: "click", sel: ".sx-seg button", text: "Month" },
    { do: "wait", ms: 600 },
    { do: "click", sel: ".ced-ev", text: "Family Barbecue" },
    { do: "wait", ms: 1000 },
    { do: "scroll", sel: ".pt-reqs .al-steps li.done", n: 2 },
    { do: "point", sel: ".pt-reqs .al-steps li.done", n: 2 },
  ]);
  const tSignupAsk = team(`/card/${cardOf("ask", (x) => x.kind === "ask" && !x.lantern)}`, [
    { do: "wait", ms: 900 },
    { do: "point", sel: ".pt-asks li", n: 0 },
    { do: "point", sel: ".pt-act button.sx-btn-primary" },
  ]);
  const tSignupBook = team("/calendar", [
    { do: "wait", ms: 900 },
    { do: "click", sel: "button[aria-label='Next week']" },
    { do: "wait", ms: 500 },
    { do: "click", sel: ".ced-ev .cap", n: 0 },
    { do: "wait", ms: 1000 },
    { do: "scroll", sel: ".pt-desk" },
    { do: "point", sel: ".pt-desk button" },
  ]);
  const tAttend = team("/today", [
    { do: "wait", ms: 900 },
    { do: "click", sel: ".pt-sched-list button", n: 0 },
    { do: "wait", ms: 700 },
    { do: "click", sel: ".at-tap button", n: 0 },
    { do: "click", sel: ".at-tap button", n: 2 },
    { do: "click", sel: ".at-tap button", n: 3 },
    { do: "point", sel: ".sx-drawer button.sx-btn-primary", text: "Save attendance" },
  ]);
  const tFamilies = team("/people", [
    { do: "wait", ms: 700 },
    { do: "type", sel: ".pt-search input", value: fam.f.resident.split(" ").slice(-1)[0] },
    { do: "wait", ms: 600 },
    { do: "scroll", sel: ".pt-fam" },
    { do: "point", sel: ".pt-fam li", n: 0 },
    { do: "wait", ms: 900 },
  ]);
  const tImport = team("/people", [
    { do: "wait", ms: 700 },
    { do: "scroll", sel: ".pt-res.open button.sx-btn", text: "Invite a family member" },
    { do: "click", sel: ".pt-res.open button.sx-btn", text: "Invite a family member" },
    { do: "wait", ms: 500 },
    { do: "type", sel: ".pt-invite input", value: `Olivia ${fam.f.resident.split(" ").slice(-1)[0]}` },
    { do: "point", sel: ".pt-invite button[type=submit]" },
  ]);
  const tTours = team("/prospects", [
    { do: "wait", ms: 700 },
    { do: "scroll", sel: "#tours" },
    { do: "point", sel: ".pt-outcome", n: 0 },
    { do: "wait", ms: 900 },
  ], "desk");
  const tApartments = team("/prospects", [
    { do: "wait", ms: 700 },
    { do: "scroll", sel: ".pt-plans li", text: plan.code },
    { do: "click", sel: ".pt-plans li button", text: plan.code },
    { do: "wait", ms: 400 },
    { do: "point", sel: ".pt-plan-f button[type=submit]" },
  ], "desk");
  const tWaitlist = team("/prospects", [
    { do: "wait", ms: 700 },
    { do: "scroll", sel: ".pt-wait" },
    { do: "point", sel: ".pt-wait li", n: 0 },
  ], "desk");
  const tInbox = team(`/card/${cardOf("reply", (x) => x.kind === "reply" && x.for.includes("events"))}`, [
    { do: "wait", ms: 900 },
    { do: "point", sel: ".pt-quote" },
    { do: "click", sel: ".pt-q-h .pt-help summary" },
    { do: "point", sel: ".pt-help-body" },
    { do: "wait", ms: 900 },
  ]);
  const tTranslate = team(`/card/${cardOf("reply", (x) => x.kind === "reply" && x.for.includes("events") && x.lang !== "English")}`, [
    { do: "wait", ms: 900 },
    { do: "point", sel: ".pt-orig" },
    { do: "point", sel: ".pt-reply textarea" },
  ]);
  const tScore = team("/reports", [
    { do: "wait", ms: 1200 },
    { do: "scroll", sel: ".sx-card", n: 0 },
    { do: "wait", ms: 1200 },
  ], "manager");
  const tSurveys = team("/reports/surveys", [
    { do: "wait", ms: 1200 },
    { do: "scroll", sel: ".sx-card", n: 1 },
    { do: "wait", ms: 1200 },
  ], "manager");
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

  /* Families: the one-purpose pages behind the buttons in their texts and emails (nothing personal on them). */
  const brandTop = (
    <div className="ph-pl-brand">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={LOGO} alt="" />
      {name}
    </div>
  );
  const famRsvpText: TourStep = {
    label: "Replies to the text",
    caption: `Family events come with an invitation by text. ${me} replies with how many are coming; Kinlight reads the reply, checks it back (“Reply YES to confirm”) and asks ${mom} first.`,
    screen: (
      <SmsThread
        {...th(s, name)}
        bubbles={[
          { time: "Wednesday 10:00 AM", text: `Families welcome: ${barbecue.title}, ${enWhen(barbecue)} in the ${barbecue.room}. Want to join ${mom}? Reply with how many are coming.`, link: { title: `RSVP · ${barbecue.title}`, host: `${link}/rsvp` } },
          { me: true, text: `${fam.party} of us!` },
          { time: "10:02 AM", text: `RSVP ${fam.party} people for the ${barbecue.title}, ${enWhen(barbecue)}? Reply YES to confirm.` },
          { me: true, text: "YES" },
          { time: "10:03 AM", text: `Thanks, ${me}! We’ll check with ${mom} first, then confirm.` },
        ]}
      />
    ),
  };
  const famRsvpPage: TourStep = {
    label: "RSVP to a family event",
    caption: `Or the link in the text (or in ${mom}’s week) opens this page. ${me} says how many guests are coming, then taps RSVP. No login; events with a limit show the places left, events without one don’t.`,
    screen: (
      <Browser host={`${link}/rsvp`}>
        <div className="ph-pl">
          {brandTop}
          <div className="ph-pl-card">
            <span className="ph-pl-tag">Family event</span>
            <h4>{barbecue.title}</h4>
            <span className="ph-pl-meta">{enWhen(barbecue)} · {barbecue.room}</span>
            <p>Burgers, corn on the cob and lemonade with the residents, lawn games for the grandkids and live music.</p>
            <span className="ph-pl-meta">12 places left</span>
            <span className="ph-pl-meta">How many people are coming, in total?</span>
            <div className="ph-pl-step"><span>−</span><b>{fam.party} people (total)</b><span>+</span></div>
            <span className="ph-pl-btn">RSVP</span>
            <p className="phx-note">We’ll check with {mom} first, then text you.</p>
          </div>
        </div>
      </Browser>
    ),
  };
  // What the resident is signed up for in the next 7 days (sample bookings from the real calendar), and photos with them in.
  const weekAhead = weekAheadFor(slug);
  const snaps = s.photoPresets.filter((p) => p.people.some((x) => x.name === fam.f.resident && x.consent)).slice(0, 2);
  const shareAsk = `Hi ${mom}, ${me} would like to see what you’re signed up for each week, and photos of you that we share. Is that OK? Reply YES or NO. You can change your mind any time.`;
  const momShare: TourStep = {
    label: `${mom} agrees to share`,
    caption: `${mom} decides. ${me} only sees ${mom}’s week if ${mom} says yes. Asked in person if ${mom} has no phone.`,
    screen: <SmsThread {...th(s, name)} bubbles={[{ time: "Today 11:02 AM", text: shareAsk }, { me: true, text: "Yes, that’s fine" }, { time: "11:05 AM", text: `Thanks, ${mom}! Just tell the front desk if you change your mind.` }]} />,
  };
  const momWeek: TourStep = {
    label: `${mom}’s week`,
    caption: `${mom}’s own section of the Sunday email, only for family ${mom} has agreed to share with: what ${mom} is signed up for this week, photos of ${mom} from last week when staff posted some, and family events to join ${mom} at. No photos? That part is simply left out.`,
    screen: (
      <Mail name={name} domain={domain} to={me} subject={`This week at ${name}, and ${mom}’s week`} time="Sun 5:00 PM">
        <p className="ph-em-p">Hi {me}, here’s {mom}’s week, then everything else that’s on.</p>
        <p className="ph-em-h">{mom}’s week</p>
        <p className="ph-em-p"><b>Booked on</b></p>
        {weekAhead.map((e) => (
          <p className="ph-em-p phx-menu" key={e.id}>
            <b>{dayShort(fromIso(e.date)).split(",")[0]} {fmtTime(e.start)}:</b> {e.title}
          </p>
        ))}
        {snaps.length > 0 && <p className="ph-em-h">From last week</p>}
        {snaps.map((p) => (
          <div className="ph-em-item" key={p.k}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.src} alt="" />
            <span>
              <b>{p.title}</b>
              <small>{mom} was there</small>
            </span>
          </div>
        ))}
        <p className="ph-em-h">Join {mom}</p>
        <div className="ph-em-item">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/courtyard-bbq.jpg" alt="" />
          <span>
            <b>{barbecue.title}</b>
            <small>{enWhen(barbecue)} · {barbecue.room}</small>
          </span>
        </div>
        <p className="ph-em-p">Reply to our text with how many are coming, or tap RSVP.</p>
        <span className="ph-em-btn">RSVP</span>
        <div className="ph-em-foot">{mom} chose to share this with you. {mom} or the {name} team can turn it off at any time.</div>
      </Mail>
    ),
  };
  const momToggle: TourStep = {
    label: "On or off, any time",
    caption: `${mom} can stop sharing by telling staff or replying to a text, and staff can switch it off for one family member from the resident’s family list. The community news keeps coming either way.`,
    screen: (
      <div className="ph-staff">
        <StaffHead title="Family contacts" sub={`${name} · ${fam.f.resident}`} />
        <div className="ph-staff-body">
          <div className="ph-staff-card">
            <span className="ph-chip">{fam.f.relation} · joined</span>
            <h5>{fam.f.contact}</h5>
            <p>Community news: <b>On</b></p>
            <p>{mom}’s week (sign-ups and photos): <b>On</b> · {mom} agreed</p>
            <span className="ph-staff-btn ghost">Turn off {mom}’s week</span>
          </div>
        </div>
      </div>
    ),
  };
  const famUrgent: TourStep = {
    label: "Urgent news",
    caption: "Emergencies skip approval and go out within minutes. They say what is changing, never anyone’s health details.",
    time: "9:05",
    dark: true,
    screen: <LockScreen date={longDate(t)} time="9:05" wallpaper="/img/mother-daughter.jpg" notices={[{ app: "Messages", title: name, text: `Visiting is paused until Friday. Video calls can be booked with the front desk at ${s.brand.phone}. We’ll text you as soon as visits start again.`, time: "now" }]} />,
  };
  const famChange: TourStep = {
    label: "A change, by text",
    caption: `For community events and anything ${mom} is booked on. Sent the same day, as soon as ${first(boss.name)} approves it.`,
    time: "2:15",
    dark: true,
    screen: <LockScreen date={longDate(t)} time="2:15" wallpaper="/img/mother-daughter.jpg" notices={[{ app: "Messages", title: name, text: `Change for ${dayShort(fromIso(musical.date)).split(",")[0]}: ${musical.title} now starts at ${fmtTime(musical.start + 30)} (was ${fmtTime(musical.start)}). Families welcome as always.`, time: "now" }]} />,
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
      caption: "Every public sign-up gets a confirmation, and the team sees who’s coming.",
      screen: (
        <Mail name={name} domain={domain} to="Laura" subject={`You’re registered: ${fair.title}, ${dayShort(fromIso(fair.date))}`} time="8:31 PM">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="ph-em-photo" src="/img/courtyard-palms.jpg" alt="" />
          <p className="ph-em-p">Hi Laura, we’ve saved 2 places for you at the {fair.title}, {fairWhen}, in the {fair.room}.</p>
          <p className="ph-em-p">Free and open to everyone: browse the stalls, have a cider, and meet the residents and the team.</p>
          <span className="ph-em-btn">Add to calendar</span>
          <div className="ph-em-foot">{c.site.addressLine} · {s.brand.phone}</div>
        </Mail>
      ),
    },
    { label: "Reminder the day before", time: "4:00", dark: true, screen: <LockScreen date={longDate(addDays(fromIso(fair.date), -1))} time="4:00" wallpaper="/img/courtyard-palms.jpg" notices={[{ app: "Messages", title: name, text: `See you tomorrow at ${fmtTime(fair.start)} for the ${fair.title} at ${name}! Park by the main entrance. Plans changed? Reply here.`, time: "now" }]} /> },
  ];

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
  const posterPaper = (
    <Paper title={`Stay close to life at ${name}`} sub="QR poster · front desk and by each elevator" size="lg">
      <div className="fl-paper-qr" aria-hidden="true" />
      <p className="fl-paper-big">Events, menus and the week’s best moments from {name}, by text or email, in your language.</p>
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

  const photoLine = `${fam.photo.title} 📷`;
  const x = moreScreens(slug);
  const em = familyEmails(slug);
  const pe = prospectEmails(slug);
  const re = residentEmails(slug);
  const se = staffEmails(slug);
  const R = first(x.resident);
  return timed([
    {
      key: "family",
      label: "Families",
      tagline: "Text and email, plus one-purpose pages from a link. No app, no login, in their own language.",
      flows: [
        {
          id: "f-news",
          email: em.news,
          title: "Community news",
          hook: `The community’s week, for anyone who wants it: a highlight by text midweek and the whole week by email on Sunday. Families sign up on the website or with the QR poster. Staff post once.`,
          steps: [
            { id: "f-news-signup", scene: "web", label: "Signs up on the website", actor: "family", via: "Website form", when: "Or scans the QR poster", preview: join(webSignup, paperOf(posterPaper)) },
            { id: "f-news-text", scene: "text", label: "The week’s highlight", actor: "auto", when: "Midweek", text: photoLine, preview: pick(famSteps, 0, 1) },
            { id: "f-news-email", scene: "email", label: "The whole week", actor: "auto", with: true, when: "Sunday, 5 pm", text: `This week at ${name}`, preview: pick(famSteps, 4, 5) },
          ],
        },
        {
          id: "f-mine",
          email: em.mine,
          title: "Your loved one’s week",
          hook: `${mom}’s own section of the Sunday email: what ${mom} is booked on, and photos of ${mom} from last week when there are some. Only if ${mom} agrees, and ${mom} or staff can turn it off.`,
          steps: [
            { id: "f-mine-agree", scene: "reply", label: `${mom} agrees to share`, actor: "resident", when: "Or in person, if no phone", text: "Yes, that’s fine", preview: phones(momShare) },
            { id: "f-mine-week", scene: "email", label: `${mom}’s week`, actor: "auto", when: "Sunday, in the weekly email", text: `${mom}’s week`, preview: phones(momWeek) },
            { id: "f-mine-toggle", scene: "list", label: "On or off, any time", actor: "staff", via: "Text or staff workspace", when: `By ${mom} or by staff`, preview: phones(momToggle) },
          ],
        },
        {
          id: "f-change",
          email: em.change,
          title: "Hear about any alerts",
          hook: `When an event moves or plans change, families hear the same day. Emergencies go out within minutes.`,
          steps: [
            { id: "f-change-text", scene: "bell", label: "A change", actor: "auto", when: "If their resident is booked on it", text: `${musical.title}: new time`, preview: phones(famChange) },
            { id: "f-change-urgent", scene: "bell", label: "Urgent news", actor: "auto", when: "Within minutes, no approval needed", text: "Visiting paused until Friday", preview: phones(famUrgent) },
          ],
        },
        {
          id: "f-joinin",
          email: em.join,
          title: "Join your loved one at an event",
          hook: `Family events come with an invitation. ${me} replies to the text to RSVP (or taps the link in it). ${mom} is asked first, by text, and ${me} hears the answer.`,
          steps: [
            { id: "f-joinin-text", scene: "reply", label: "Replies to the text", actor: "family", when: "The invitation, midweek", text: `${fam.party} of us!`, preview: phones(famRsvpText) },
            { id: "f-joinin-rsvp", scene: "rsvp", label: "Or taps the link in it", actor: "family", via: "Action page", when: "The same RSVP, one tap", preview: phones(famRsvpPage) },
            { id: "f-joinin-ask", scene: "text", label: `${mom} is asked`, actor: "auto", via: "Text or email", when: "In person, if no phone", text: `${me} wants to join you`, preview: phones(x.resJoinAsk), next: { tab: "resident", flow: "r-join", text: `${mom}’s side` } },
            { id: "f-joinin-yes", scene: "reply", label: `${mom} says yes`, actor: "resident", lane: 0, text: "YES! 😊", preview: phones(x.resJoin) },
            { id: "f-joinin-confirmed", scene: "text", label: `${me} is confirmed`, actor: "auto", lane: 0, when: "With the details", text: "You’re confirmed 🎉", preview: phones(x.famJoinYes) },
            { id: "f-joinin-no", scene: "reply", label: `${mom} says no`, actor: "resident", lane: 1, text: "Not this time", preview: phones(x.resJoinNo) },
            { id: "f-joinin-kind", scene: "text", label: `${me} gets a kind no`, actor: "auto", lane: 1, when: "No reason given", text: "Maybe next time", preview: phones(x.famJoinNo) },
          ],
        },
      ],
    },
    {
      key: "prospect",
      label: "Prospects",
      tagline: "From a first look on the website to a call about an apartment. Public information only.",
      flows: [
        {
          id: "p-chat",
          title: "Ask the website a question",
          hook: "The website’s chat answers from the community’s own pages, at any hour and in the visitor’s language: what a day here is like, what’s on today, and an invitation to come and see. It’s the website answering, not staff; when it doesn’t know, it offers the phone number.",
          steps: [
            { id: "p-chat-en", scene: "chat", label: "Answered from the website, in any language", actor: "auto", when: "Any hour", text: "What is daily life here really like?", preview: webChat },
            { id: "p-chat-call", scene: "call", label: "Doesn’t know? “Give us a call”", actor: "auto", via: "Website chat", preview: webChatCall },
          ],
        },
        {
          id: "p-tour",
          title: "Book a tour",
          hook: "Pick a time on the website, no back-and-forth. The confirmation and a reminder the day before come by text.",
          steps: [
            { id: "p-tour-book", scene: "calendar", label: "Picks a time", actor: "prospect", via: "Website form", preview: webTour },
            { id: "p-tour-conf", scene: "text", label: "Tour confirmed", actor: "auto", when: "Straight away", text: "Tour booked ✓", preview: phones(proTour[0]), next: { tab: "staff", flow: "s-leads", text: "The front desk sees it" } },
            { id: "p-tour-rem", scene: "bell", label: "A reminder", actor: "auto", when: "The day before, 4 pm", text: "See you tomorrow!", preview: phones(proTour[1]) },
          ],
        },
        {
          id: "p-open",
          email: pe.open,
          title: "Come to public events",
          hook: "Some events are open to everyone, like a holiday craft fair. Anyone can sign up on the website, and the team sees who’s coming.",
          steps: [
            { id: "p-open-form", scene: "web", label: "Signs up on the website", actor: "prospect", via: "Website form", preview: webPublic },
            { id: "p-open-conf", scene: "email", label: "You’re registered", actor: "auto", when: "Straight away", text: fair.title, preview: phones(proOpen[0]), next: { tab: "staff", flow: "s-leads", text: "The front desk sees it" } },
            { id: "p-open-rem", scene: "bell", label: "A reminder", actor: "auto", when: "The day before", text: `See you at ${fmtTime(fair.start).replace(":00", "")}!`, preview: phones(proOpen[1]) },
          ],
        },
        {
          id: "p-wait",
          email: pe.wait,
          title: "Hear when an apartment opens",
          hook: "No apartment of the right kind free today? Join the waitlist and hear the moment one opens.",
          steps: [
            { id: "p-wait-join", scene: "list", label: "Joins the waitlist", actor: "prospect", via: "Website form", preview: webWaitlist },
            { id: "p-wait-on", scene: "text", label: "You’re on the list", actor: "auto", text: `${plan.code}: you’re on the list`, preview: pick(proSteps, 4) },
            { id: "p-wait-alert", scene: "text", label: `It’s open: call ${first(rep.name)}`, actor: "auto", when: "The moment staff mark it available", text: `${plan.code} is free!`, preview: pick(proSteps, 5) },
            { id: "p-wait-call", scene: "call", label: "Calls in", actor: "prospect", preview: pick(proSteps, 6) },
          ],
        },
      ],
    },
    {
      key: "resident",
      label: "Residents",
      tagline: "Their own plans by text and email if they opt in, and everything in large print. No app, no login.",
      note: "Residents opt in the same way families do, and reply STOP any time. Large print still goes to every door.",
      flows: [
        {
          id: "r-today",
          email: re.today,
          title: "Know what’s on today",
          hook: "Every morning, today’s activities by text for residents who opt in. The same calendar, menus and flyers are printed in large print for every door.",
          steps: [
            { id: "r-today-text", scene: "text", label: "Today’s activities", actor: "auto", when: "Every morning, 8 am", text: `Good morning, ${R}!`, preview: phones(x.resMorning) },
            { id: "r-today-print", scene: "print", label: "In large print too", actor: "auto", with: true, when: "Calendar, menus and flyers", preview: join(paperOf(calendarPaper), paperOf(menuPaper), paperOf(flyerPaper)) },
          ],
        },
        {
          id: "r-week",
          title: "Your week",
          hook: `Every Sunday, ${R}’s own week by text or email: what ${R} is booked on, trips with their departure times, and invites that match what ${R} enjoys. One word books a seat. The same week comes printed in large print.`,
          steps: [
            { id: "r-week-text", scene: "text", label: "Your week", actor: "auto", when: "Sunday, 8 am", text: `Your week, ${R}`, preview: phones(x.resWeekText) },
            { id: "r-week-print", scene: "print", label: "Printed too", actor: "auto", with: true, when: "Under the door on Monday", preview: paperOf(x.resWeek) },
          ],
        },
        {
          id: "r-signup",
          title: "Sign up for an activity",
          hook: "Activities with limited places are offered by text. If every place is taken, they hear so straight away, and they’re the first to know when a spot opens up.",
          steps: [
            { id: "r-signup-offer", scene: "text", label: "Limited places: want one?", actor: "auto", text: "Seats are limited", preview: phones(x.resOfferNote) },
            { id: "r-signup-yes", scene: "reply", label: "Replies YES", actor: "resident", text: "YES", preview: phones(x.resOfferAsk), next: { tab: "staff", flow: "s-signups", text: "Staff see it" } },
            { id: "r-signup-full", scene: "text", label: "No more places: we’ll let you know", actor: "auto", when: "Straight away", text: "Sorry, it’s full", preview: phones(x.resFull) },
            { id: "r-signup-opens", scene: "bell", label: "A spot opens up", actor: "auto", when: "The moment someone cancels", text: "A place opened up!", preview: phones(x.resPlaceOpens) },
          ],
        },
        {
          id: "r-invite",
          title: "A personal invite",
          hook: `When an activity matches what ${R} enjoys, ${R} gets a personal invite by text. One word books a seat.`,
          steps: [
            { id: "r-invite-text", scene: "text", label: "Invited by interest", actor: "auto", when: "The morning of", text: `${x.invEv.title}?`, preview: phones(x.resInviteNote) },
            { id: "r-invite-yes", scene: "reply", label: "Replies YES", actor: "resident", text: "YES", preview: phones(x.resInviteYes), next: { tab: "staff", flow: "s-signups", text: "Staff see who’s booked" } },
          ],
        },
        {
          id: "r-checkin",
          title: "Check in to an activity",
          hook: `${R} shows a check-in card at the door and staff scan it. No phone needed. Anyone without the card is tapped in.`,
          steps: [
            { id: "r-checkin-scan", scene: "qr", label: "Show the card", actor: "resident", when: `At ${x.ckEv.title}`, text: "You’re checked in", preview: phones(x.resCheckin), next: { tab: "staff", flow: "s-signups", text: "Staff see it" } },
          ],
        },
        {
          id: "r-alerts",
          email: re.alert,
          title: "Hear about any alerts",
          hook: "A reminder before anything they’re booked on, a change the moment staff send it, and urgent news within minutes.",
          steps: [
            { id: "r-alerts-hour", scene: "bell", label: "An hour before", actor: "auto", when: "Only if they’re booked", text: `In an hour: ${x.trip}`, preview: phones(x.resReminder) },
            { id: "r-alerts-change", scene: "bell", label: "A change", actor: "auto", when: "The moment staff send it", text: `${x.musical.title}: new time`, preview: phones(x.resChange) },
            { id: "r-alerts-urgent", scene: "bell", label: "Urgent news", actor: "auto", when: "Within minutes, no approval needed", text: "Fire alarm test at 10:30", preview: phones(x.resUrgent) },
          ],
        },
        {
          id: "r-join",
          email: re.join,
          title: "Your family wants to join you",
          hook: `${me} RSVPs to a family event. Nothing is confirmed until ${R} says yes; either way, ${me} is told kindly.`,
          steps: [
            { id: "r-join-ask", scene: "text", label: `“${me} would like to come”`, actor: "auto", via: "Text or email", when: "No phone? Staff ask in person", text: `${me} wants to join you`, preview: phones(x.resJoinAsk) },
            { id: "r-join-yes", scene: "reply", label: `${R} says yes`, actor: "resident", lane: 0, text: "YES! 😊", preview: phones(x.resJoin), next: { tab: "family", flow: "f-joinin", text: `What ${me} gets` } },
            { id: "r-join-no", scene: "reply", label: `${R} says no`, actor: "resident", lane: 1, text: "Not this time", preview: phones(x.resJoinNo) },
          ],
        },
        {
          id: "r-share",
          title: "Choose what your family sees",
          hook: `Family only see ${R}’s week if ${R} says yes. One text asks; one word answers.`,
          steps: [
            { id: "r-share-ask", scene: "text", label: `${R} is asked first`, actor: "auto", when: "Reply YES or NO", text: `${me} would like to know`, preview: phones(x.resShareNote), next: { tab: "family", flow: "f-mine", text: `What ${me} sees` } },
          ],
        },
      ],
    },
    {
      key: "staff",
      label: "Staff",
      tagline: "Everything staff do happens in the staff workspace. Every hand-off lands here.",
      flows: [
        {
          id: "s-post",
          email: se.post,
          title: "Post once, reach everyone",
          hook: "A Monday nudge, one photo and one sentence in the staff workspace, one approval, and it’s on the website, in the families’ email and in print. Calendars and menus work the same way: upload the PDF, or photograph the paper calendar or menu.",
          steps: [
            { id: "s-post-nudge", scene: "bell", label: "Monday’s nudge", actor: "auto", via: "Text or email", when: "Monday, 9 am", text: "Share one moment 📷", preview: pick(staffSteps, 0) },
            { id: "s-post-photo", scene: "camera", label: "Photos from an activity", actor: "staff", via: "Staff workspace", when: "Kinlight writes the caption", preview: join(tPost, tMenus) },
            { id: "s-post-approve", scene: "approve", label: "A manager approves", actor: "staff", via: "Staff workspace", preview: tApprovePost },
            { id: "s-post-where", scene: "send", label: "Everywhere at once", actor: "auto", text: `${families} families`, preview: join(pick(staffSteps, 5), webPost) },
            { id: "s-post-stale", scene: "email", label: "A page going stale", actor: "auto", when: "If a calendar or menu isn’t updated", text: "Menu: 9 days old", preview: phones(staffStale) },
          ],
        },
        {
          id: "s-change",
          email: se.approve,
          title: "Send a change or an alert",
          hook: "Something changed today? One quick form on Today: everyone booked on it and their families are told straight away, and the website updates. Emergencies go to everyone within minutes.",
          steps: [
            { id: "s-change-edit", scene: "bell", label: "Something changed", actor: "staff", via: "Staff workspace", lane: 0, when: "Moved, new room, running late, cancelled", preview: tCalEdit },
            { id: "s-change-told", scene: "send", label: "Everyone booked is told", actor: "auto", lane: 0, when: "Straight away, website too", text: "Straight away", preview: phones(famChange, x.resChange), next: { tab: "family", flow: "f-change", text: "What families get" } },
            { id: "s-change-emergency", scene: "bell", label: "An emergency", actor: "staff", via: "Staff workspace", lane: 1, when: "No approval needed", text: "Urgent", preview: tUrgent },
            { id: "s-change-now", scene: "send", label: "Everyone, within minutes", actor: "auto", lane: 1, text: "Within minutes", preview: phones(famUrgent, x.resUrgent), next: { tab: "resident", flow: "r-alerts", text: "What residents get" } },
          ],
        },
        {
          id: "s-signups",
          title: "Handle sign-ups",
          hook: "Family asked, resident answered, family told: a yes confirms it on its own. Residents who reply YES are booked here too, and attendance is a tap on the day.",
          steps: [
            { id: "s-signups-stages", scene: "list", label: "Every request, by stage", actor: "staff", via: "Staff workspace", preview: tSignups },
            { id: "s-signups-yes", scene: "approve", label: "Resident said yes: confirmed", actor: "staff", via: "Staff workspace", lane: 0, when: "Family told straight away, no approval", preview: tSignupApprove, next: { tab: "family", flow: "f-joinin", text: `${me} gets the answer` } },
            { id: "s-signups-ask", scene: "talk", label: "No answer: ask in person", actor: "staff", via: "In person", lane: 1, when: "Then tap their answer", preview: tSignupAsk },
            { id: "s-signups-book", scene: "list", label: "Book residents who said YES", actor: "staff", via: "Staff workspace", when: "Or signed up at the desk", preview: tSignupBook, next: { tab: "resident", flow: "r-signup", text: `${R} gets the details` } },
            { id: "s-signups-att", scene: "list", label: "Scan cards, then tap the rest", actor: "staff", via: "Staff workspace", when: "Feeds Reports", preview: tAttend },
          ],
        },
        {
          id: "s-contacts",
          email: se.invite,
          title: "Manage family contacts",
          hook: `Invite family at move-in and see what each person gets. News about a resident only goes to family the resident agreed to.`,
          steps: [
            { id: "s-contacts-invite", scene: "send", label: "Add family at move-in", actor: "staff", via: "Staff workspace", when: "Invites go out by text and email", text: "Invite sent", preview: tImport },
            { id: "s-contacts-list", scene: "list", label: "Everyone, and what they get", actor: "staff", via: "Staff workspace", preview: tFamilies },
          ],
        },
        {
          id: "s-leads",
          email: se.lead,
          title: "Questions, tours and the waitlist",
          hook: "The front desk’s part. Questions from the website arrive with one acknowledgement already sent, and a person answers; nothing follows up automatically. Tours booked online are counted on the day, and marking an apartment available tells the waitlist.",
          steps: [
            { id: "s-leads-alert", scene: "bell", label: "A question comes in", actor: "auto", via: "Alert", when: "Acknowledgement already sent", text: "Question: Laura", preview: phones(x.alertsSales) },
            { id: "s-leads-call", scene: "list", label: "Count the day’s tours", actor: "staff", when: "Did it happen?", preview: tTours },
            { id: "s-leads-mark", scene: "home", label: "Mark an apartment available", actor: "staff", via: "Staff workspace", preview: tApartments },
            { id: "s-leads-wait", scene: "send", label: "The waitlist is told", actor: "auto", text: `${plan.waitlist} on the list`, preview: tWaitlist, next: { tab: "prospect", flow: "p-wait", text: "What they get" } },
          ],
        },
        {
          id: "s-reply",
          title: "Replies from families and residents",
          hook: "Replies land in one inbox, showing who sent them, translated both ways. Everyone gets an automatic thank-you with the front-desk number; there’s no promised response time.",
          steps: [
            { id: "s-reply-in", scene: "route", label: "One inbox", actor: "auto", when: "Families and residents", text: "Can I bring the kids?", preview: tInbox },
            { id: "s-reply-ack", scene: "text", label: "An automatic thank-you", actor: "auto", with: true, when: "With the front-desk number", text: "Thanks! The team will see this", preview: phones(x.replyAck) },
            { id: "s-reply-tr", scene: "translate", label: "Other languages, translated", actor: "auto", text: "¿Puedo llevar a los niños?", text2: "Can I bring the kids?", preview: tTranslate },
            { id: "s-reply-thanks", scene: "bell", label: "Thank-yous reach the team", actor: "auto", via: "Alert", text: "Thank you! 💛", preview: phones(x.thanksNote) },
          ],
        },
        {
          id: "s-score",
          email: se.score,
          title: "See it working",
          hook: "Measurement, not messages: the monthly scorecard, the family and resident surveys, and a monthly staff pulse.",
          steps: [
            { id: "s-score-mail", scene: "email", label: "The monthly scorecard", actor: "auto", when: "The 1st of each month", text: `${month} scorecard`, preview: join(tScore, phones(staffScore)) },
            { id: "s-score-survey", scene: "chart", label: "Family and resident surveys", actor: "auto", via: "Text, email or paper", when: "Before go-live and at day 90", text: "How are we doing?", preview: join(tSurveys, phones(famSurvey, x.resSurvey), paperOf(surveyPaper)) },
            { id: "s-score-pulse", scene: "text", label: "Staff pulse", actor: "auto", when: "Monthly", text: "3 quick questions", preview: phones(staffPulse) },
          ],
        },
      ],
    },
  ]);
}
