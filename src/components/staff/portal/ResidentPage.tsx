"use client";

// A resident's page: who they are and their life in the community, opened from any name in the staff area.
// Their week (the default) is a timeline of what they came to and missed, invites and answers, photos, 1:1 visits and
// family requests. About holds interests, story, how they hear from us and consent. Family lists each family member
// with every message exchanged, both ways, and a Message button in their language. Notes are staff-only. Report shows
// participation over a date range, ready to print for a care conference. Changes stay in this browser.
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Interest } from "@/data/staff/engage";
import type { FamilyMember, FamilyStatus } from "@/data/staff/portal";
import type { Msg, Pending, ResidentProfile, TimelineItem } from "@/data/staff/resident";
import { Icon } from "../../Icon";
import { say, useDecide, useDecisions } from "../store";
import { Badge, HBars, Initials } from "../ui";
import { Drawer } from "./Drawer";
import { Help } from "./Help";
import { memberId } from "../residentHref";
import { FamilyLink } from "../ResidentLink";
import { Invite, WelcomeChecklist } from "./People";
import { Seats } from "./seats";

export type ResidentTab = "week" | "about" | "family" | "notes" | "report";
type IconName = Parameters<typeof Icon>[0]["name"];
const first = (n = "") => n.split(" ")[0];
const statusTone: Record<FamilyStatus, "good" | "info" | "warn" | "neutral"> = { Joined: "good", Invited: "info", "Waiting for a check": "warn", Stopped: "neutral" };
const kindIcon: Record<TimelineItem["kind"], IconName> = { came: "check", missed: "minus", invite: "sms", photo: "image", visit: "heart", request: "users", celebration: "star", booked: "calendar" };
const evHref = (e: { id: string; date: string }) => `/staff/calendar?event=${encodeURIComponent(e.id)}&date=${e.date}`;

export function ResidentPage({ p, me, community, interests, tab: initialTab, openWelcome, messageTo, member }: {
  p: ResidentProfile; me: string; community: string; interests: readonly Interest[]; tab: ResidentTab; openWelcome?: boolean; messageTo?: string;
  /** A family member's name was clicked somewhere: open Family, on them. */
  member?: string;
}) {
  const r0 = p.record;
  const [tab, setTab] = useState<ResidentTab>(messageTo || member ? "family" : initialTab);
  const [via, setVia] = useState<Via>("Text");
  // Clicking another family member's name on this same page: switch to Family and bring them into view.
  const [seenMember, setSeenMember] = useState(member);
  if (member !== seenMember) { setSeenMember(member); if (member) setTab("family"); }
  useEffect(() => {
    if (!member) return;
    const t = window.setTimeout(() => document.getElementById(memberId(member))?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    return () => window.clearTimeout(t);
  }, [member]);
  const message = (to: string | null, v?: Via) => { if (v) setVia(v); else if (to) setVia(channelsOf(rec, to)[0] ?? "Text"); setCompose(to); };
  const [rec, setRec] = useState(r0);
  const [eng, setEng] = useState(p.eng);
  const [timeline, setTimeline] = useState(p.timeline);
  const [upcoming, setUpcoming] = useState(p.upcoming);
  const [convos, setConvos] = useState(p.conversations);
  const [own, setOwn] = useState(p.own);
  const [notes, setNotes] = useState(p.notes);
  const [compose, setCompose] = useState<string | null>(messageTo && (messageTo === r0.name || r0.family.some((m) => m.name === messageTo)) ? messageTo : null);
  const [inviting, setInviting] = useState<boolean | ResidentProfile["suggestions"][number]>(false);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [visit, setVisit] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [welcome, setWelcome] = useState(!!openWelcome && !!p.welcome);
  const fn = first(rec.name);
  const canText = rec.channel !== "Print only";

  const send = (to: string, text: string, by: Via) => {
    const m: Msg = { id: `new-${Date.now()}`, me: true, who: first(me), text, when: "Just now", sort: 1, via: by, kind: "message" };
    if (to === rec.name) setOwn((o) => [...o, m]);
    else setConvos((c) => ({ ...c, [to]: [...(c[to] ?? []), m] }));
    setCompose(null);
    const lang = to === rec.name ? rec.lang : rec.family.find((x) => x.name === to)?.lang ?? "English";
    say(`Sent to ${first(to)} by ${m.via.toLowerCase()}${lang !== "English" ? `, in ${lang}` : ""}. Filed on ${fn}’s page.`);
  };

  const tabs: [ResidentTab, string, number?][] = [
    ["week", "Their week"], ["about", "About"], ["family", "Family", rec.family.length], ["notes", "Notes", notes.length], ["report", "Report"],
  ];
  const last30 = p.attended.filter((a) => a.date >= isoDaysAgo(p.today, 30)).length;

  return (
    <div className="rs">
      <header className="sx-card rs-head">
        <Initials name={rec.name} size={64} color={rec.lantern ? "var(--c-lantern, #8a5aa6)" : "var(--slate, #4c5b66)"} />
        <div className="rs-who">
          <h1>{rec.name}</h1>
          <p>
            {rec.lantern ? rec.apt : `Apt ${rec.apt}`}{p.area ? ` · ${p.area}` : ""}
            {p.careBy && <> · looked after by <b>{first(p.careBy)}</b></>}
          </p>
          <p className="rs-badges">
            {p.welcome && <Badge tone="accent">New · moved in {p.welcome.movedIn}</Badge>}
            {!rec.photoConsent && <Badge tone="bad">No photo consent</Badge>}
            {eng.lastDays >= 14 && <Badge tone="warn">Not out in {eng.lastDays} days</Badge>}
            <Badge tone="neutral">{last30} {last30 === 1 ? "activity" : "activities"} in 30 days</Badge>
          </p>
        </div>
        <div className="rs-quick" role="group" aria-label={`Quick actions for ${fn}`}>
          {!rec.lantern && <button type="button" className="sx-btn sx-btn-primary" onClick={() => setInviting(true)}><Icon name="calendar" /> Invite to an activity</button>}
          <button type="button" className="sx-btn" onClick={() => message(rec.family.find((m) => m.status === "Joined")?.name ?? rec.family[0]?.name ?? (canText ? rec.name : null))} disabled={!rec.family.length && !canText}><Icon name="sms" /> Message</button>
          <button type="button" className="sx-btn" onClick={() => setVisit(true)}><Icon name="heart" /> Log a 1:1 visit</button>
          <button type="button" className="sx-btn" onClick={() => { setTab("notes"); setNoteOpen(true); }}><Icon name="edit" /> Add a note</button>
        </div>
      </header>

      {p.welcome && (
        <button type="button" className="rs-welcome" onClick={() => setWelcome(true)}>
          <Icon name="spark" /> <span><b>Finish {fn}’s welcome</b> <small>{p.welcome.steps.filter((s) => !s.done).length} of {p.welcome.steps.length} steps left</small></span> <Icon name="right" />
        </button>
      )}

      <Waiting
        fn={fn} rec={rec} pending={p.pending} upcoming={upcoming}
        suggestions={p.suggestions.filter((s) => !skipped.has(s.id + s.date) && !upcoming.some((u) => u.event?.id === s.id && u.event?.date === s.date))}
        onInvite={(s) => setInviting(s)}
        onSkip={(s) => { setSkipped((x) => new Set(x).add(s.id + s.date)); say(`Not now. ${s.title} won’t be suggested for ${fn} again.`, () => setSkipped((x) => { const n = new Set(x); n.delete(s.id + s.date); return n; })); }}
        onAnswerInvite={(u, yes) => {
          const before = upcoming;
          setUpcoming((xs) => (yes ? xs.map((x) => (x.id === u.id ? { ...x, title: x.title.replace(/^Invited to/, "Said yes to"), detail: "Said yes in person" } : x)) : xs.filter((x) => x.id !== u.id)));
          say(yes ? `${fn} is booked on ${u.title.replace(/^Invited to /, "")}.` : `Noted: ${fn} would rather not.`, () => setUpcoming(before));
        }}
        onAskSuggestion={(s) => {
          setUpcoming((u) => [...u, { id: `ask-${s.id}`, date: s.date, when: s.when, kind: "invite" as const, title: `Said yes to ${s.title}`, detail: "Asked in person", event: { id: s.id, date: s.date } }].sort((a, b) => a.date.localeCompare(b.date)));
          say(`${fn} said yes in person. Booked on ${s.title}.`);
        }}
      />

      <nav className="rs-tabs" aria-label={`${fn}’s page`}>
        {tabs.map(([k, l, n]) => (
          <button key={k} type="button" aria-current={tab === k ? "page" : undefined} onClick={() => setTab(k)}>{l}{n !== undefined && <small>{n}</small>}</button>
        ))}
      </nav>

      {tab === "week" && <Week fn={fn} timeline={timeline} upcoming={upcoming} />}
      {tab === "about" && <About rec={rec} setRec={setRec} eng={eng} setEng={setEng} legal={p.legal} interests={interests} fn={fn} />}
      {tab === "family" && (
        <Family rec={rec} convos={convos} own={own} canText={canText} onMessage={message} focus={member}
          onPatch={(who, m) => setRec((r) => ({ ...r, family: m === null ? r.family.filter((x) => x.name !== who) : r.family.map((x) => (x.name === who ? { ...x, ...m } : x)) }))}
          onInvite={(m) => { setRec((r) => ({ ...r, family: [...r.family, m] })); say(`Invite sent to ${m.name} by ${m.channel.toLowerCase()}. One reminder in a few days, then it stops.`); }}
        />
      )}
      {tab === "notes" && <Notes fn={fn} notes={notes} open={noteOpen} setOpen={setNoteOpen} onAdd={(text) => { setNotes((n) => [{ id: `new-${Date.now()}`, when: "Just now", by: me, text }, ...n]); setNoteOpen(false); say("Note saved. Staff only."); }} />}
      {tab === "report" && <Report p={p} community={community} visits={eng.visits.length} />}

      {compose && <Compose key={compose} rec={rec} to={compose} via={via} setVia={setVia} setTo={(n) => message(n)} history={compose === rec.name ? own : convos[compose] ?? []} onSend={send} onClose={() => setCompose(null)} />}
      {inviting && (
        <InviteToActivity fn={fn} rec={rec} items={p.suggestions} start={inviting === true ? undefined : inviting} onClose={() => setInviting(false)}
          onSend={(s, text) => {
            setInviting(false);
            setUpcoming((u) => [...u, { id: `inv-${s.id}`, date: s.date, when: s.when, kind: "invite" as const, title: `Invited to ${s.title}`, detail: "Sent just now · no answer yet", event: { id: s.id, date: s.date } }].sort((a, b) => a.date.localeCompare(b.date)));
            setOwn((o) => [...o, { id: `inv-${s.id}`, me: true, who: first(me), text, when: "Just now", sort: 1, via: rec.channel === "Email" ? "Email" : "Text", kind: "message" }]);
            say(`Invite sent to ${fn}. A YES books them in.`);
          }}
        />
      )}
      {visit && (
        <VisitForm fn={fn} onClose={() => setVisit(false)} onSave={(note) => {
          setEng((e) => ({ ...e, visits: [{ date: "Today", by: me, note: note || "Visit" }, ...e.visits] }));
          setTimeline((t) => [{ id: `v-new-${Date.now()}`, date: p.today, when: "Today", kind: "visit" as const, title: "1:1 visit", detail: `${note || "Visit"} · ${first(me)}` }, ...t]);
          setVisit(false); setTab("week"); say(`1:1 visit with ${fn} logged. Counted in Reports, never sent to family.`);
        }} />
      )}
      {welcome && p.welcome && (
        <Drawer title={`Welcome ${fn}`} sub={`Moved in ${p.welcome.movedIn}`} onClose={() => setWelcome(false)}>
          <WelcomeChecklist w={p.welcome} r={rec} interests={interests} community={community} celebrate={eng.celebrate} onCelebrate={(yes) => setEng((e) => ({ ...e, celebrate: yes }))} onDone={(m) => say(m)} />
        </Drawer>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ waiting on them */

type Sugg = ResidentProfile["suggestions"][number];

/**
 * Everything waiting on this resident, in one place, coloured like Today's cards: family requests to ask them about
 * in person, ones they said yes to that staff approve for them, invites with no answer yet, and activities that match
 * what they like. Answering here answers the card on Today too.
 */
function Waiting({ fn, rec, pending, upcoming, suggestions, onInvite, onSkip, onAnswerInvite, onAskSuggestion }: {
  fn: string; rec: ResidentProfile["record"]; pending: Pending[]; upcoming: TimelineItem[]; suggestions: Sugg[];
  onInvite: (s: Sugg) => void; onSkip: (s: Sugg) => void; onAnswerInvite: (u: TimelineItem, yes: boolean) => void; onAskSuggestion: (s: Sugg) => void;
}) {
  const decided = useDecisions();
  const decide = useDecide();
  const open = pending.filter((x) => !decided[x.card]);
  const ask = open.filter((x) => x.kind === "ask");
  const approve = open.filter((x) => x.kind === "approve");
  const invites = upcoming.filter((u) => u.kind === "invite" && u.title.startsWith("Invited to"));
  const sugg = suggestions.slice(0, 4);
  const total = open.length + invites.length;
  const inPerson = rec.lantern || rec.channel === "Print only";
  const answer = (x: Pending, yes: boolean) => {
    decide(x.card, yes ? "approved" : "declined");
    const who = first(x.from);
    say(
      x.kind === "approve"
        ? yes ? `Approved. ${who} and ${fn} are told.` : `Declined. ${who} is told kindly.`
        : yes
          ? !!x.event.cap && (x.event.taken ?? 0) >= x.event.cap
            ? `${fn} said yes. ${x.event.title} is full, so ${fn} is on the waitlist and confirmed if a seat opens. ${who} is told.`
            : `${fn} said yes to ${x.event.title}. Approved; ${who} is told.`
          : `${fn} said no to ${x.event.title}. ${who} is told kindly.`,
      () => decide(x.card, null),
    );
  };
  const what = (x: Pending) => (x.request === "rsvp" ? <><FamilyLink name={x.from} resident={rec.name} /> would like to come{x.party > 1 ? ` (${x.party} people)` : ""}</> : <><FamilyLink name={x.from} resident={rec.name} /> asked for a seat for {fn}</>);
  const req = (x: Pending) => (
    <li key={x.id} className={`rs-wait-i p-${x.kind === "ask" ? "ask" : "act"}`}>
      <span className="rs-wait-t">
        <b>{what(x)}</b>
        <small><Link className="sx-link" href={evHref(x.event)}>{x.event.title}</Link> · {x.event.when} · {x.relation}</small>
        {x.note && <small className="rs-wait-note">“{x.note}”</small>}
        <Seats e={x.event} />
      </span>
      <span className="rs-wait-b">
        <button type="button" className="sx-btn sx-btn-sm sx-btn-primary" onClick={() => answer(x, true)}><Icon name="check" /> {x.kind === "ask" ? `${fn} said yes` : "Approve"}</button>
        <button type="button" className="sx-btn sx-btn-sm" onClick={() => answer(x, false)}><Icon name="x" /> {x.kind === "ask" ? "No" : "Decline"}</button>
      </span>
    </li>
  );
  return (
    <section id="waiting" className="sx-card sx-card-body rs-sec rs-wait" aria-labelledby="rs-wait-h">
      <header className="rs-sec-h">
        <h2 id="rs-wait-h">Waiting on {fn}</h2>
        <small>{total ? `${total} to answer` : "Nothing to answer"}</small>
        <Help label="About what’s waiting" align="end"><p>Family requests about {fn}, invites with no answer, and activities that match what {fn} likes. Answering here answers the card on Today too. {inPerson ? `${fn} isn’t texted, so everything is asked in person.` : `${fn} is asked by text first; anything without an answer comes here to ask in person.`}</p></Help>
      </header>
      {ask.length > 0 && (
        <div className="rs-wait-g">
          <h3><span className="pt-purp ask"><i aria-hidden="true" /> Ask {fn} in person</span></h3>
          <ul>{ask.map(req)}</ul>
        </div>
      )}
      {approve.length > 0 && (
        <div className="rs-wait-g">
          <h3><span className="pt-purp act"><i aria-hidden="true" /> {fn} said yes: approve for {fn}</span></h3>
          <ul>{approve.map(req)}</ul>
        </div>
      )}
      {invites.length > 0 && (
        <div className="rs-wait-g">
          <h3><span className="pt-purp ask"><i aria-hidden="true" /> Invites with no answer yet</span></h3>
          <ul>
            {invites.map((u) => (
              <li key={u.id} className="rs-wait-i p-ask">
                <span className="rs-wait-t"><b>{u.title.replace(/^Invited to /, "")}</b><small>{u.when} · {u.detail}</small></span>
                <span className="rs-wait-b">
                  <button type="button" className="sx-btn sx-btn-sm sx-btn-primary" onClick={() => onAnswerInvite(u, true)}><Icon name="check" /> {fn} said yes</button>
                  <button type="button" className="sx-btn sx-btn-sm" onClick={() => onAnswerInvite(u, false)}><Icon name="x" /> No</button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {sugg.length > 0 && (
        <div className="rs-wait-g">
          <h3>Suggested for {fn} <small>From what {fn} likes</small></h3>
          <ul>
            {sugg.map((s) => (
              <li key={s.id + s.date} className="rs-wait-i">
                <span className="rs-wait-t"><b>{s.title}</b><small>{s.when}{s.why ? ` · ${s.why}` : ""}</small></span>
                <span className="rs-wait-b">
                  {inPerson ? (
                    <button type="button" className="sx-btn sx-btn-sm" onClick={() => onAskSuggestion(s)}><Icon name="check" /> Asked: yes</button>
                  ) : (
                    <button type="button" className="sx-btn sx-btn-sm" onClick={() => onInvite(s)}><Icon name="send" /> Invite</button>
                  )}
                  <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => onSkip(s)}>Not now</button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!total && !sugg.length && <p className="pt-empty">Nothing waiting on {fn} right now.</p>}
    </section>
  );
}

type Via = "Text" | "Email";
/** How someone can be reached: Text if there's a mobile number, Email if there's an address (their preference first). */
function channelsOf(rec: ResidentProfile["record"], to: string): Via[] {
  if (to === rec.name) return rec.channel === "Print only" ? [] : rec.channel === "Email" ? ["Email"] : rec.channel === "Text" ? ["Text"] : ["Text", "Email"];
  const m = rec.family.find((x) => x.name === to);
  if (!m) return ["Text"];
  const out: Via[] = [];
  if (m.phone) out.push("Text");
  if (m.email) out.push("Email");
  return m.channel === "Email" ? out.reverse() : out;
}

/** n days before the community's today (from the server, so the page renders the same on the server and in the browser). */
const isoDaysAgo = (today: string, n: number) => { const d = new Date(`${today}T12:00:00Z`); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10); };

/* ------------------------------------------------------------ their week */

function Week({ fn, timeline, upcoming }: { fn: string; timeline: TimelineItem[]; upcoming: TimelineItem[] }) {
  const byDay = useMemo(() => {
    const m = new Map<string, TimelineItem[]>();
    timeline.forEach((x) => m.set(x.date, [...(m.get(x.date) ?? []), x]));
    return [...m.entries()];
  }, [timeline]);
  const came = timeline.filter((x) => x.kind === "came").length;
  const missed = timeline.filter((x) => x.kind === "missed").length;
  return (
    <div className="rs-grid">
      <section className="sx-card sx-card-body rs-sec" aria-labelledby="rs-week-h">
        <header className="rs-sec-h">
          <h2 id="rs-week-h">The last 7 days</h2>
          <small>{came} came · {missed} missed</small>
          <Help label="About their week" align="end"><p>From attendance, QR check-ins, invites, photos, 1:1 visits and family requests. Families are never told about attendance automatically.</p></Help>
        </header>
        {byDay.length === 0 ? <p className="pt-empty">Nothing yet. {fn}’s activities appear here once attendance is taken.</p> : (
          <ol className="rs-tl">
            {byDay.map(([d, items]) => (
              <li key={d}>
                <h3>{items[0].when.split(", ").slice(0, 2).join(", ")}</h3>
                <ul>{items.map((x) => <Line key={x.id} x={x} />)}</ul>
              </li>
            ))}
          </ol>
        )}
      </section>
      <section className="sx-card sx-card-body rs-sec" aria-labelledby="rs-up-h">
        <header className="rs-sec-h"><h2 id="rs-up-h">Coming up</h2></header>
        {upcoming.length ? <ul className="rs-tl-flat">{upcoming.map((x) => <Line key={x.id} x={x} showWhen />)}</ul> : <p className="pt-empty">Nothing booked yet. Try “Invite to an activity”.</p>}
      </section>
    </div>
  );
}

function Line({ x, showWhen = false }: { x: TimelineItem; showWhen?: boolean }) {
  const body = (
    <>
      <span className={`rs-ic k-${x.kind}`}><Icon name={kindIcon[x.kind]} /></span>
      <span className="rs-line-t">
        <b>{x.title}</b>
        <small>{showWhen ? `${x.when}${x.detail ? ` · ${x.detail}` : ""}` : x.detail}</small>
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {x.photo && <img className="rs-thumb" src={x.photo} alt="" />}
    </>
  );
  return <li className={`rs-line k-${x.kind}`}>{x.event ? <Link href={evHref(x.event)}>{body}</Link> : <div>{body}</div>}</li>;
}

/* ------------------------------------------------------------ about */

function About({ rec, setRec, eng, setEng, legal, interests, fn }: {
  rec: ResidentProfile["record"]; setRec: (f: (r: ResidentProfile["record"]) => ResidentProfile["record"]) => void;
  eng: ResidentProfile["eng"]; setEng: (f: (e: ResidentProfile["eng"]) => ResidentProfile["eng"]) => void; legal?: string; interests: readonly Interest[]; fn: string;
}) {
  const [editInts, setEditInts] = useState(false);
  const [story, setStory] = useState<string | null>(null);
  return (
    <section className="sx-card sx-card-body rs-sec">
      <dl className="pt-res-dl rs-about">
        <div>
          <dt>Interests <Help label="About interests"><p>Personal invites go out by text for events that match. {eng.invites.sent} sent in the last 30 days; {eng.invites.yes} said yes.</p></Help></dt>
          <dd>
            {editInts ? (
              <span className="sx-chips" role="group" aria-label="Interests">
                {interests.map((i) => <button key={i} type="button" aria-pressed={eng.interests.includes(i)} onClick={() => setEng((e) => ({ ...e, interests: e.interests.includes(i) ? e.interests.filter((x) => x !== i) : [...e.interests, i] }))}>{i}</button>)}
              </span>
            ) : <span className="pt-ints">{eng.interests.length ? eng.interests.map((i) => <span key={i}>{i}</span>) : "Not asked yet"}</span>}
            <button type="button" className="sx-link" onClick={() => { if (editInts) say("Interests saved."); setEditInts((x) => !x); }}>{editInts ? "Done" : "Change"}</button>
          </dd>
        </div>
        <div className="pt-story">
          <dt>Life story <Badge tone="neutral">Private</Badge> <Help label="About the life story"><p>Written with {fn}, for conversation, activity ideas and 1:1 visits. Never published or sent.</p></Help></dt>
          <dd>
            {story === null ? <span>{eng.story}</span> : <textarea className="sx-input" rows={3} value={story} onChange={(e) => setStory(e.target.value)} aria-label="Life story" />}
            <button type="button" className="sx-link" onClick={() => { if (story !== null) { setEng((e) => ({ ...e, story })); say("Life story saved."); setStory(null); } else setStory(eng.story); }}>{story === null ? "Edit" : "Save"}</button>
          </dd>
        </div>
        <div>
          <dt>How they hear from us <Help label="About their messages"><p>What’s on, their bookings, reminders and invites. Print only: large print at the door and the front desk.</p></Help></dt>
          <dd>{rec.channel}{rec.channel !== "Print only" ? ` · ${rec.lang}` : ""}</dd>
        </div>
        <div>
          <dt>Photo consent</dt>
          <dd><span>{rec.photoConsent ? <><Icon name="check" /> On file</> : <><Icon name="alert" /> None on file: photos with {fn} are held until they’re cropped out</>}</span></dd>
        </div>
        <div>
          <dt>Shares with family <Help label="About sharing with family"><p>Verified family see {fn}’s week and photos in their update. {fn} decides, and can turn it off by text or by telling staff.</p></Help></dt>
          <dd>
            <label className="sx-switch">
              <input type="checkbox" checked={rec.shares} onChange={(ev) => { const on = ev.target.checked; setRec((x) => ({ ...x, shares: on, family: x.family.map((m) => ({ ...m, access: on && m.status === "Joined" ? "Their resident" : "Community news" })) })); say(on ? `${fn}’s week is shared with their family again.` : `${fn}’s week is no longer shared. Family keep the community news.`); }} />
              {rec.shares ? "Their week and photos" : "Community news only"}
            </label>
          </dd>
        </div>
        <div>
          <dt>Happy to be celebrated</dt>
          <dd>
            <label className="sx-switch">
              <input type="checkbox" checked={eng.celebrate} onChange={(ev) => { const yes = ev.target.checked; setEng((e) => ({ ...e, celebrate: yes })); say(yes ? `${fn} is happy to be celebrated.` : `No birthday or welcome posts for ${fn}.`); }} />
              {eng.celebrate ? "Yes" : "No"}
            </label>
          </dd>
        </div>
        <div>
          <dt>Legal representative <Help label="About the legal representative"><p>From the move-in paperwork. Shown to staff only, so you know who to involve in a decision.</p></Help></dt>
          <dd>{legal ?? "None on file"}</dd>
        </div>
      </dl>
    </section>
  );
}

/* ------------------------------------------------------------ family, with every message */

function Family({ rec, convos, own, canText, onMessage, onPatch, onInvite, focus }: {
  rec: ResidentProfile["record"]; convos: Record<string, Msg[]>; own: Msg[]; canText: boolean;
  onMessage: (to: string, via?: Via) => void; onPatch: (who: string, m: Partial<FamilyMember> | null) => void; onInvite: (m: FamilyMember) => void;
  /** The family member someone clicked on, shown highlighted. */
  focus?: string;
}) {
  const fn = first(rec.name);
  /** Text and Email, each only when there's a number or address for it. */
  const sendBtns = (to: string, primary: boolean) => {
    const ch = channelsOf(rec, to);
    return (["Text", "Email"] as const).map((v) => (
      <button key={v} type="button" className={`sx-btn sx-btn-sm${primary && v === ch[0] ? " sx-btn-primary" : ""}`} disabled={!ch.includes(v)} title={ch.includes(v) ? undefined : `No ${v === "Text" ? "mobile number" : "email address"} on file`} onClick={() => onMessage(to, v)}>
        <Icon name={v === "Text" ? "sms" : "mail"} /> {v}
      </button>
    ));
  };
  return (
    <div className="rs-fam">
      {rec.family.length === 0 && <p className="sx-card sx-card-body pt-empty">No family added yet.</p>}
      {rec.family.map((m) => (
        <section key={m.name} id={memberId(m.name)} className={`sx-card sx-card-body rs-sec rs-member${focus === m.name ? " focus" : ""}`}>
          <header className="rs-member-h">
            <Initials name={m.name} size={36} />
            <span className="pt-fam-t">
              <b>{m.name}</b>
              <small>{m.relation} · prefers {m.channel.toLowerCase()} · {m.lang}{m.note ? ` · ${m.note}` : ""}</small>
              {(m.phone || m.email) && <small>{[m.phone, m.email].filter(Boolean).join(" · ")}</small>}
            </span>
            <span className="pt-fam-s"><Badge tone={statusTone[m.status]}>{m.status}</Badge><small>{m.access}</small></span>
            <span className="pt-fam-a">
              {m.status === "Joined" && sendBtns(m.name, true)}
              {m.status === "Waiting for a check" && <button type="button" className="sx-btn sx-btn-primary sx-btn-sm" onClick={() => { onPatch(m.name, { status: "Joined", access: rec.shares ? "Their resident" : "Community news", note: undefined }); say(`${m.name} verified. They now hear about ${fn}.`); }}><Icon name="check" /> Verify</button>}
              {m.status === "Invited" && <button type="button" className="sx-btn sx-btn-sm" onClick={() => say(`Invite sent again to ${m.name}. That’s the last reminder.`)}>Re-send invite</button>}
              <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => { onPatch(m.name, null); say(`${m.name} removed. They get nothing more from us.`); }}>Remove</button>
            </span>
          </header>
          <Thread msgs={convos[m.name] ?? []} lang={m.lang} empty={m.status === "Joined" ? "No messages yet." : m.status === "Stopped" ? "They stopped messages. Nothing is sent." : "Nothing until they join."} />
        </section>
      ))}
      {canText && (
        <section className="sx-card sx-card-body rs-sec rs-member">
          <header className="rs-member-h">
            <Initials name={rec.name} size={36} color="var(--slate)" />
            <span className="pt-fam-t"><b>{rec.name} (resident)</b><small>{rec.channel} · {rec.lang}</small></span>
            <span className="pt-fam-a">{sendBtns(rec.name, false)}</span>
          </header>
          <Thread msgs={own} lang={rec.lang} empty="No messages yet." />
        </section>
      )}
      <Invite resident={rec} onInvite={onInvite} />
    </div>
  );
}

function Thread({ msgs, lang, empty }: { msgs: Msg[]; lang: string; empty: string }) {
  const [all, setAll] = useState(false);
  if (!msgs.length) return <p className="sx-hint rs-thread-empty">{empty}</p>;
  const shown = all ? msgs : msgs.slice(-4);
  return (
    <div className="rs-thread">
      {msgs.length > 4 && <button type="button" className="sx-link" onClick={() => setAll((a) => !a)}>{all ? "Show recent only" : `Show all ${msgs.length} messages`}</button>}
      <ol>
        {shown.map((x) => (
          <li key={x.id} className={x.via === "Note" ? "note" : x.me ? (x.who === "Kinlight" ? "me auto" : "me staff") : "them"}>
            <p>{x.text}</p>
            {x.original && <p className="rs-orig" lang={lang === "Spanish" ? "es" : lang === "Russian" ? "ru" : lang === "Chinese" ? "zh" : undefined}>{x.original}</p>}
            <small>{x.who === "Kinlight" ? "Sent automatically by Kinlight" : x.who} · {x.via} · {x.when}</small>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Compose({ rec, to, via, setVia, setTo, history, onSend, onClose }: { rec: ResidentProfile["record"]; to: string; via: Via; setVia: (v: Via) => void; setTo: (n: string) => void; history: Msg[]; onSend: (to: string, text: string, via: Via) => void; onClose: () => void }) {
  const isRes = to === rec.name;
  const m = rec.family.find((x) => x.name === to);
  const lang = isRes ? rec.lang : m?.lang ?? "English";
  const ch = channelsOf(rec, to);
  const [text, setText] = useState("");
  const options = [...rec.family.filter((x) => x.status === "Joined").map((x) => ({ n: x.name, l: `${x.name} (${x.relation.toLowerCase()})` })), ...(rec.channel !== "Print only" ? [{ n: rec.name, l: `${rec.name} (resident)` }] : [])];
  return (
    <Drawer title={`Message ${first(to)}`} sub={`${via}${lang !== "English" ? ` · in ${lang}` : ""} · filed on ${first(rec.name)}’s page`} onClose={onClose}>
      <form className="sx-form rs-compose" onSubmit={(e) => { e.preventDefault(); if (text.trim()) onSend(to, text.trim(), via); }}>
        <div className="sx-seg" role="group" aria-label="Send by">
          {(["Text", "Email"] as const).map((v) => (
            <button key={v} type="button" aria-pressed={via === v} disabled={!ch.includes(v)} onClick={() => setVia(v)}><Icon name={v === "Text" ? "sms" : "mail"} /> {v}</button>
          ))}
        </div>
        {options.length > 1 && (
          <label>To
            <select value={to} onChange={(e) => { setTo(e.target.value); }}>{options.map((o) => <option key={o.n} value={o.n}>{o.l}</option>)}</select>
          </label>
        )}
        {history.length > 0 && <Thread msgs={history} lang={lang} empty="" />}
        <label>Your message
          <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder={`Hi ${first(to)}, …`} autoFocus />
        </label>
        {lang !== "English" && <p className="sx-hint"><Icon name="translate" /> Write in English: {first(to)} gets it in {lang}, and their reply comes back translated.</p>}
        <div className="pt-act">
          <button type="submit" className="sx-btn sx-btn-primary" disabled={!text.trim()}><Icon name="send" /> Send {via === "Email" ? "email" : "text"}</button>
          <button type="button" className="sx-btn" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Drawer>
  );
}

/* ------------------------------------------------------------ quick actions */

function InviteToActivity({ fn, rec, items, start, onSend, onClose }: { fn: string; rec: ResidentProfile["record"]; items: ResidentProfile["suggestions"]; start?: ResidentProfile["suggestions"][number]; onSend: (s: ResidentProfile["suggestions"][number], text: string) => void; onClose: () => void }) {
  const [pick, setPick] = useState<ResidentProfile["suggestions"][number] | null>(start ?? null);
  const [text, setText] = useState(start ? `${start.title}, ${start.when}. Would you like to come, ${fn}? Reply YES and you’re booked.` : "");
  const print = rec.channel === "Print only";
  return (
    <Drawer title={`Invite ${fn} to an activity`} sub="Matching their interests first" onClose={onClose}>
      {!pick ? (
        <ul className="rs-pick">
          {items.map((s) => (
            <li key={s.id + s.date}>
              <button type="button" onClick={() => { setPick(s); setText(`${s.title}, ${s.when}. Would you like to come, ${fn}? Reply YES and you’re booked.`); }}>
                <b>{s.title}</b><small>{s.when}{s.why ? ` · ${s.why}` : ""}</small>
              </button>
            </li>
          ))}
          {!items.length && <li className="pt-empty">Nothing coming up that matches. Try the calendar.</li>}
        </ul>
      ) : (
        <form className="sx-form" onSubmit={(e) => { e.preventDefault(); onSend(pick, text); }}>
          <label>{print ? `${fn} reads print only: this goes on a card at the door` : `The ${rec.channel === "Email" ? "email" : "text"} ${fn} gets${rec.lang !== "English" ? `, in ${rec.lang}` : ""}`}
            <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} />
          </label>
          <div className="pt-act">
            <button type="submit" className="sx-btn sx-btn-primary" disabled={!text.trim()}><Icon name={print ? "printer" : "send"} /> {print ? "Print the card" : "Send invite"}</button>
            <button type="button" className="sx-btn" onClick={() => setPick(null)}>Back</button>
          </div>
        </form>
      )}
    </Drawer>
  );
}

function VisitForm({ fn, onSave, onClose }: { fn: string; onSave: (note: string) => void; onClose: () => void }) {
  const [note, setNote] = useState("");
  return (
    <Drawer title={`1:1 visit with ${fn}`} sub="Counted in Reports. Never sent to family." onClose={onClose}>
      <form className="sx-form" onSubmit={(e) => { e.preventDefault(); onSave(note.trim()); }}>
        <div className="sx-chips" role="group" aria-label="What you did">
          {["Looked at old photos", "Walked to the garden", "Read the paper aloud", "Played cards", "Listened to music"].map((x) => <button key={x} type="button" aria-pressed={note === x} onClick={() => setNote(x)}>{x}</button>)}
        </div>
        <label>What did you do together?<input value={note} onChange={(e) => setNote(e.target.value)} /></label>
        <div className="pt-act">
          <button type="submit" className="sx-btn sx-btn-primary"><Icon name="check" /> Log visit</button>
          <button type="button" className="sx-btn" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Drawer>
  );
}

/* ------------------------------------------------------------ notes */

function Notes({ fn, notes, open, setOpen, onAdd }: { fn: string; notes: ResidentProfile["notes"]; open: boolean; setOpen: (b: boolean) => void; onAdd: (text: string) => void }) {
  const [text, setText] = useState("");
  return (
    <section className="sx-card sx-card-body rs-sec">
      <header className="rs-sec-h">
        <h2>Notes <Badge tone="neutral">Staff only</Badge></h2>
        <Help label="About notes" align="end"><p>For the team: what {fn} enjoys, who they like to sit with, what settles them. Never published or sent.</p><p>Health and care notes belong in the community’s care system, not here.</p></Help>
        {!open && <button type="button" className="sx-btn sx-btn-sm" onClick={() => setOpen(true)}><Icon name="plus" /> Add a note</button>}
      </header>
      {open && (
        <form className="sx-form rs-note-f" onSubmit={(e) => { e.preventDefault(); if (text.trim()) { onAdd(text.trim()); setText(""); } }}>
          <label><span className="vh">Note</span><textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder={`Something the team should know about ${fn}`} autoFocus /></label>
          <div className="pt-act">
            <button type="submit" className="sx-btn sx-btn-primary" disabled={!text.trim()}>Save note</button>
            <button type="button" className="sx-btn" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      )}
      <ul className="rs-notes">
        {notes.map((n) => <li key={n.id}><p>{n.text}</p><small>{n.by} · {n.when}</small></li>)}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------ participation report */

function Report({ p, community, visits }: { p: ResidentProfile; community: string; visits: number }) {
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const from = isoDaysAgo(p.today, days);
  const att = p.attended.filter((a) => a.date >= from);
  const off = p.offered.filter((a) => a.date >= from).length;
  const byCat = useMemo(() => {
    const m = new Map<string, { label: string; value: number; color: string }>();
    att.forEach((a) => { const x = m.get(a.cat) ?? { label: a.catLabel, value: 0, color: a.color }; x.value++; m.set(a.cat, x); });
    return [...m.values()].sort((a, b) => b.value - a.value);
  }, [att]);
  const weeks = Math.max(1, days / 7);
  return (
    <section className="sx-card sx-card-body rs-sec rs-report">
      <header className="rs-sec-h">
        <h2>Participation</h2>
        <div className="sx-seg" role="group" aria-label="Date range">
          {([7, 30, 90] as const).map((d) => <button key={d} type="button" aria-pressed={days === d} onClick={() => setDays(d)}>{d === 7 ? "7 days" : `${d} days`}</button>)}
        </div>
        <button type="button" className="sx-btn sx-btn-sm" onClick={() => window.print()}><Icon name="printer" /> Print for a care conference</button>
      </header>
      <p className="rs-print-h">{p.record.name} · {community} · last {days} days</p>
      <div className="rs-kpis">
        <div><b>{att.length}</b><small>activities attended</small></div>
        <div><b>{(att.length / weeks).toFixed(1)}</b><small>a week, on average</small></div>
        <div><b>{byCat.length}</b><small>{byCat.length === 1 ? "kind of activity" : "kinds of activity"}{off ? ` · ${off} on offer` : ""}</small></div>
        <div><b>{visits}</b><small>1:1 visits</small></div>
      </div>
      <h3>By category</h3>
      {byCat.length ? <HBars items={byCat.map((c) => ({ label: c.label, value: c.value }))} /> : <p className="pt-empty">No activities in this range.</p>}
      <h3>Every activity</h3>
      <ul className="rs-att">
        {[...att].reverse().slice(0, 40).map((a, i) => <li key={i}><span>{a.title}</span><small>{a.catLabel} · {new Date(a.date + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}</small></li>)}
      </ul>
      <p className="sx-hint">From attendance and QR check-ins. <Link className="sx-link" href={`/staff/reports/attendance?resident=${encodeURIComponent(p.record.name)}`}>Open in Reports</Link> for any dates, by activity or category, with export. Nothing here is sent to family automatically.</p>
    </section>
  );
}
