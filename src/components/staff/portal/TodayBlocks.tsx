"use client";

// Today, for the person signed in, in three bands that are the same for everyone: "Needs you" (only what this person
// has to decide or do, by deadline, with one number), "Your day" (on now, up next and today's schedule for this role),
// and "When you have a minute" (at most three suggestions, and what Kinlight did this week). Today's activities show
// where each one is in the day (up next, on now, finished with attendance missing, done), who's leading, and open the
// event sheet (the same one Calendar opens): who's booked, attendance three ways, photos, and "Something changed".
// Then photos wanted, celebrations (one card, each previewed before it posts), residents we haven't seen lately
// (the invite shown before it sends), and new residents to welcome. Everything stays in this browser.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import type { CalEvent } from "@/data/staff/calEvents";
import type { Celebration, TodayActivity, Unseen, Welcome } from "@/data/staff/engage";
import { lite, type ConcernOwner, type QItem } from "@/data/staff/lite";
import type { NewEventSetup, PhotoKit } from "@/data/staff/post";
import type { DidItem } from "@/data/staff/week";
import { fmtTime } from "@/lib/clock";
import { Icon } from "../../Icon";
import { residentHref } from "../residentHref";
import { useEventBoard } from "../eventStore";
import { say, useLeaders, useNeedsCount } from "../store";
import { Badge } from "../ui";
import { Attendance } from "./Attendance";
import { Drawer } from "./Drawer";
import { EventSheet, leaderOf } from "./EventSheet";
import { Help } from "./Help";
import { QueueList, type QueueMe } from "./Queue";
import { Seats } from "./seats";

const first = (n = "") => n.split(" ")[0];

/** The calendar with one event's photos open. */
export const photosHref = (id: string) => `/staff/calendar?event=${encodeURIComponent(id)}&photos=1`;

function Card({ id, title, help, action, children, className = "" }: { id: string; title: ReactNode; help?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`sx-card pt-tcard ${className}`} aria-labelledby={id}>
      <header className="pt-tcard-h">
        <h2 id={id}>{title}</h2>
        {help && <Help label="About this" align="end">{help}</Help>}
        {action && <span className="pt-tcard-a">{action}</span>}
      </header>
      {children}
    </section>
  );
}

/* ------------------------------------------------------------ the whole of Today */

/** A thank-you that names this person, for "When you have a minute". */
export interface ThanksNote { id: string; from: string; relation: string; resident: string; text: string }

export interface TodayDeskProps {
  me: QueueMe;
  /** "Good morning", and today's date. */
  hello: { greeting: string; date: string };
  /** The activities team and the front desk run the activities. */
  team: boolean;
  /** Everything waiting on anyone in the community, routed; Today shows this person's share. */
  items: QItem[]; empty: string; owners: ConcernOwner[];
  /** Today's and tomorrow's events, as the event sheet shows them, and today's place in the day for each. */
  events: CalEvent[]; acts: TodayActivity[];
  /** What "Your day" shows from the calendar: the activities, the Lantern ones only, or none (built on the server instead). */
  dayActs: "all" | "lantern" | "none";
  residents: string[]; staff: string[]; todayIso: string;
  /** Lantern residents and everyone's interests, for "Invite someone else" in the sheet. */
  invite?: { lantern: string[]; interestsOf: Record<string, string[]> }; brand: { name: string; domain: string; phone: string }; kit?: PhotoKit;
  /** The add-event form's setup, for Edit in the event sheet. */
  setup?: NewEventSetup;
  /** "Who looks after whom" is on: who looks after each resident (first names), for invites. */
  careOf?: Record<string, string>;
  /** A care partner: the residents they look after, for quick attendance. */
  myResidents?: string[];
  /** The rest of "Your day", built for this role on the server (tours, menus, buses…). */
  day?: ReactNode;
  /** "When you have a minute": at most three suggestions for today, chosen on the server. */
  suggest: { welcomes: Welcome[]; unseen: Unseen[]; celebrations: Celebration[]; thanks: ThanksNote[] };
  /** What Kinlight did this week: one line, or the full card on Fridays. */
  did?: { items: DidItem[]; range: string; full: boolean };
  /** One line of this week's numbers, for the executive director. */
  numbers?: string;
}

export function TodayDesk(p: TodayDeskProps) {
  const router = useRouter();
  // Today and tomorrow, with this browser's changes (events added on Post, edits, moves and cancellations).
  const { events: evs, update, series } = useEventBoard(p.events);
  const [open, setOpen] = useState<{ id: string; date: string; photos?: boolean; attend?: boolean } | null>(null);
  const sheet = open ? evs.find((e) => e.id === open.id && e.date === open.date) : undefined;
  const openEvent = (id: string, date: string, photos = false, attend = false) => {
    if (evs.some((e) => e.id === id && e.date === date)) setOpen({ id, date, photos, attend });
    else router.push(`/staff/calendar?event=${encodeURIComponent(id)}&date=${date}${photos ? "&photos=1" : ""}`);
  };
  const todays = evs.filter((e) => e.date === p.todayIso);
  const dayEvents = p.dayActs === "lantern" ? todays.filter((e) => e.lantern) : todays;
  const n = useNeedsCount(lite(p.items), p.me.as);
  const s = p.suggest;
  const anySuggest = s.welcomes.length + s.unseen.length + s.celebrations.length + s.thanks.length > 0;

  return (
    <>
      <header className="pt-hello">
        <div>
          <h1>{p.hello.greeting}, <em>{p.me.first}</em></h1>
          <p>{p.hello.date} · {n ? <b className="pt-hello-n">{n === 1 ? "1 thing needs you today" : `${n} things need you today`}</b> : "Nothing needs you today"}</p>
        </div>
      </header>

      {/* Side by side: what needs you, and your day (the calendar, tours, menus) next to it. Stacked on a phone. */}
      <div className="pt-two">
      <QueueList items={p.items} empty={p.empty} me={p.me} owners={p.owners} openEvent={openEvent} />

      <section className="pt-band pt-band-day" aria-labelledby="pt-day-h">
        <h2 id="pt-day-h" className="pt-band-h">Your day</h2>
        {p.dayActs !== "none" && p.team && <NowNext events={dayEvents} acts={p.acts} me={p.me.name} open={openEvent} />}
        <div className="pt-day-grid">
          {p.myResidents && <QuickAttendance events={todays} acts={p.acts} mine={p.myResidents} />}
          {/* The activities team runs the calendar, so it comes first; everyone else sees their own day (tours, bookings) above it. */}
          {!p.team && p.day}
          {p.dayActs !== "none" && <Activities events={dayEvents} acts={p.acts} me={p.me.name} attendance={p.team} open={openEvent} title={p.dayActs === "lantern" ? "Lantern today" : undefined} />}
          {p.team && p.day}
        </div>
      </section>
      </div>

      {(anySuggest || p.did || p.numbers) && (
        <section className="pt-band pt-band-quiet" aria-labelledby="pt-min-h">
          <h2 id="pt-min-h" className="pt-band-h">When you have a minute <Help label="About this"><p>At most three suggestions a day. Anything you don’t get to is gone tomorrow, and new ones take its place. None of this counts toward the number at the top.</p></Help></h2>
          <div className="pt-day-grid">
            {s.thanks.length > 0 && <Thanks items={s.thanks} />}
            {s.celebrations.length > 0 && <Celebrations items={s.celebrations} />}
            {s.welcomes.length > 0 && <WelcomeList items={s.welcomes} />}
            {s.unseen.length > 0 && <NotSeen items={s.unseen} />}
          </div>
          {p.numbers && <p className="pt-numbers"><Icon name="chart" /> {p.numbers} <Link className="sx-link" href="/staff/reports">Reports</Link></p>}
          {p.did && <DidThisWeek items={p.did.items} range={p.did.range} full={p.did.full} />}
        </section>
      )}

      {sheet && (
        <EventSheet
          key={sheet.id + sheet.date}
          e={sheet}
          residents={p.residents}
          lantern={p.invite?.lantern}
          interestsOf={p.invite?.interestsOf}
          staff={p.staff}
          me={p.me.name}
          todayIso={p.todayIso}
          brand={p.brand}
          kit={p.kit}
          photoFocus={open?.photos}
          attendFocus={open?.attend}
          qrIn={(() => { const a = p.acts.find((x) => x.id === sheet.id); return a && a.state !== "later" && sheet.date === p.todayIso && !sheet.came ? (sheet.booked?.map((b) => b.name) ?? sheet.regulars ?? a.came).slice(0, a.qr) : []; })()}
          readOnly={!p.team && p.me.as !== "manager" && p.me.as !== "lantern"}
          onClose={() => setOpen(null)}
          setup={p.setup}
          careOf={p.careOf}
          onChange={update}
          onSeries={series}
          from="today"
        />
      )}
    </>
  );
}

/** A thank-you from a family that names you. */
function Thanks({ items }: { items: ThanksNote[] }) {
  return (
    <Card id="pt-ty-h" title="A thank-you for you" help={<p>From Feedback: a family named you. It’s already been shared with you; nothing to do unless you’d like to reply.</p>}>
      <ul className="pt-ty">
        {items.map((t) => (
          <li key={t.id}>
            <p className="pt-quote">“{t.text}”</p>
            <small>{t.from}, {t.relation.toLowerCase()} of {t.resident}</small>
          </li>
        ))}
      </ul>
      <p className="pt-tcard-f"><Link className="sx-link" href="/staff/feedback?tab=thanks">Reply in Feedback</Link></p>
    </Card>
  );
}

/* ------------------------------------------------------------ Kinlight did this for you */

/** One line that opens; on Fridays, the full summary card. */
export function DidThisWeek({ items, range, full }: { items: DidItem[]; range: string; full: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  const [shown, setShown] = useState(full);
  const cur = items.find((i) => i.k === open);
  const total = items.reduce((n, i) => n + (i.k === "newsletter" ? 1 : i.n), 0);
  if (!shown)
    return (
      <button type="button" className="pt-did-line" onClick={() => setShown(true)} aria-expanded="false">
        <Icon name="spark" /> <span><b>Kinlight did {total} things for you this week</b> <small>{range}</small></span> <Icon name="chev" />
      </button>
    );
  return (
    <section className="pt-did" aria-labelledby="pt-did-h">
      <header>
        <h2 id="pt-did-h"><Icon name="spark" /> Kinlight did this for you this week</h2>
        <small>{range}</small>
        {!full && <button type="button" className="sx-link pt-did-hide" onClick={() => setShown(false)}>Hide</button>}
      </header>
      <ul>
        {items.map((i) => (
          <li key={i.k}>
            <button type="button" aria-expanded={open === i.k} onClick={() => setOpen(open === i.k ? null : i.k)}>
              <b>{i.k === "newsletter" ? <Icon name="check" /> : i.n}</b>
              <span>{i.k === "newsletter" ? "Newsletter built" : i.label}</span>
            </button>
          </li>
        ))}
      </ul>
      {cur && (
        <div className="pt-did-list">
          <ul>{cur.list.map((x, n) => <li key={n}>{x}</li>)}</ul>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------ where each activity is in the day */

type Where = "now" | "next" | "later" | "missing" | "done";

function whereOf(e: CalEvent, a: TodayActivity | undefined, nextId?: string): Where {
  const st = a?.state ?? "later";
  if (e.cancelled) return "done";
  if (st === "now") return "now";
  if (st === "done") return e.came || a?.recorded ? "done" : "missing";
  return e.id === nextId ? "next" : "later";
}
const whereLabel: Record<Where, string> = { now: "On now", next: "Up next", later: "Later", missing: "Attendance missing", done: "Done" };

function useDay(events: CalEvent[], acts: TodayActivity[]) {
  const byId = new Map(acts.map((a) => [a.id, a]));
  const next = events.filter((e) => !e.cancelled && byId.get(e.id)?.state === "later").sort((a, b) => a.start - b.start)[0]?.id;
  return { byId, next };
}

function NowNext({ events, acts, me, open }: { events: CalEvent[]; acts: TodayActivity[]; me: string; open: (id: string, date: string) => void }) {
  const leaders = useLeaders();
  const { byId, next } = useDay(events, acts);
  const now = events.filter((e) => byId.get(e.id)?.state === "now" && !e.cancelled);
  const up = events.find((e) => e.id === next);
  const tiles = [...now.slice(0, 1), ...(up ? [up] : [])];
  if (!tiles.length) return null;
  return (
    <section className="pt-nownext" aria-label="Happening now">
      {tiles.map((e) => {
        const a = byId.get(e.id);
        const w = whereOf(e, a, next);
        const lead = leaderOf(e, leaders);
        const n = e.booked?.length ?? (e.people ?? []).filter((x) => x.status === "signed").length;
        return (
          <button key={e.id} type="button" className={`pt-nn ${w}`} onClick={() => open(e.id, e.date)}>
            <span className="pt-nn-w">{w === "now" ? <><i aria-hidden="true" /> On now</> : `Up next · ${fmtTime(e.start)}`}</span>
            <b>{e.title}</b>
            <small>{e.room} · {w === "now" && a ? `${a.qr} checked in by QR` : `${n} ${e.booked ? "booked" : "said yes"}`}{lead ? ` · ${lead === me ? "you’re leading" : `${first(lead)} leading`}` : ""}</small>
            <Seats e={e} />
            <span className="pt-nn-go">{w === "now" ? "Attendance, photos" : "Who’s coming"} <Icon name="right" /></span>
          </button>
        );
      })}
    </section>
  );
}

/* ------------------------------------------------------------ today's activities */

export function Activities({ events, acts, me, attendance, open, title = "Today’s activities" }: { events: CalEvent[]; acts: TodayActivity[]; me: string; attendance: boolean; open: (id: string, date: string, photos?: boolean, attend?: boolean) => void; title?: string }) {
  const leaders = useLeaders();
  const { byId, next } = useDay(events, acts);
  const shown = events.filter((e) => byId.has(e.id) || e.isNew);
  const isMine = (e: CalEvent) => leaderOf(e, leaders) === me;
  // The ones the signed-in person is leading come first, then everything else in time order.
  const list = [...shown.filter(isMine), ...shown.filter((e) => !isMine(e))];
  const myCount = shown.filter(isMine).length;
  return (
    <Card
      id="pt-sched-h"
      title={title}
      className="pt-sched"
      help={attendance ? <><p>Tap an activity for who’s booked, attendance (tap list, QR on a phone or tablet, or a photo of the sign-in sheet), photos, and “Something changed”.</p><p>Attendance feeds Reports and “what worked”. Families are never told about it automatically.</p></> : <p>What’s on today, to mention on a tour.</p>}
      action={attendance && myCount ? <small className="pt-tcard-n">{myCount} yours, at the top</small> : undefined}
    >
      <ol className="pt-sched-list pt-acts">
        {list.map((e, i) => {
          const a = byId.get(e.id);
          const w = whereOf(e, a, next);
          const lead = leaderOf(e, leaders);
          const came = e.came?.n ?? (a?.recorded ? a.qr + a.tapped : undefined);
          // Out of who said yes (or booked), the same number the activity sheet shows.
          const said = e.came?.of ?? e.booked?.length ?? ((e.people ?? []).filter((x) => x.status === "signed").length || a?.expected || 0);
          const of = Math.max(said, came ?? 0);
          return (
            <li key={e.id} className={`w-${w}${isMine(e) ? " mine" : ""}${attendance && i === myCount && myCount > 0 ? " first-other" : ""}`}>
              <time>{fmtTime(e.start)}</time>
              <div className="pt-act-b">
                <button type="button" className="pt-act-open" onClick={() => open(e.id, e.date)}>
                  <b>{e.cancelled ? <s>{e.title}</s> : e.title}</b>
                  <small>{e.room}{e.late ? ` · ${e.late} min late` : ""}</small>
                </button>
                <span className="pt-act-row">
                  {attendance && <span className={`pt-where ${w}`}>{w === "done" ? <><Icon name="check" /> {e.cancelled ? "Cancelled" : came !== undefined ? `${came}/${of} came` : "Done"}</> : whereLabel[w]}</span>}
                  {/* Your own activities keep Take attendance right on the list; everyone else's is inside the sheet. */}
                  {attendance && isMine(e) && w !== "done" && !e.cancelled && !e.came && <button type="button" className="sx-btn sx-btn-sm sx-btn-primary" onClick={() => open(e.id, e.date, false, true)}><Icon name="users" /> Take attendance</button>}
                  {attendance && lead && lead !== me && <small className="pt-lead-s">{first(lead)} leading</small>}
                  {!attendance && e.invites && w !== "done" && <small className="pt-inv">{e.invites.yes} said yes</small>}
                  {!e.cancelled && (w !== "done" || !!e.cap) && <Seats e={e} short={w === "done"} />}
                </span>
              </div>
            </li>
          );
        })}
        {list.length === 0 && <li className="pt-empty">Nothing on the calendar today.</li>}
      </ol>
      <p className="pt-tcard-f"><Link className="sx-link" href="/staff/calendar">The whole calendar</Link></p>
    </Card>
  );
}

/* ------------------------------------------------------------ photos wanted */

/** Every activity today that has started or finished and still wants photos, with how many are missing. Events that didn't ask for photos don't nag. */
export function PhotosWanted({ events, acts, open }: { events: CalEvent[]; acts: TodayActivity[]; open: (id: string, date: string, photos?: boolean) => void }) {
  const begun = new Map(acts.filter((a) => a.state !== "later").map((a) => [a.id, a.state]));
  const missing = (e: CalEvent) => Math.max(0, (e.wanted ?? 0) - (e.photos?.length ?? 0));
  const due = events.filter((e) => begun.has(e.id) && missing(e) > 0 && !e.cancelled).sort((a, b) => a.start - b.start);
  if (!due.length) return null;
  return (
    <Card id="pt-ph-h" title={<>Photos wanted <small className="pt-tcard-n">{due.length}</small></>} help={<p>Only activities marked “photos wanted” when they were added. Tagging is suggested from who came, consent is checked, and the caption is written for you.</p>}>
      <ul className="pt-ph">
        {due.map((e) => (
          <li key={e.id}>
            <span><b>{e.title}</b><small>{begun.get(e.id) === "now" ? "On now · " : `${fmtTime(e.start)} · `}{e.photos?.length ? `${e.photos.length} added, ${missing(e)} more wanted` : `${missing(e)} wanted, none yet`}</small></span>
            <button type="button" className="sx-btn sx-btn-sm sx-btn-primary" onClick={() => open(e.id, e.date, true)}><Icon name="image" /> Add photos</button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ------------------------------------------------------------ celebrations: one card, each previewed before it posts */

const celIcon = { birthday: "star", welcome: "heart", anniversary: "sparkle" } as const;
const celLabel = { birthday: "Birthday", welcome: "Welcome", anniversary: "Staff anniversary" } as const;

export function Celebrations({ items }: { items: Celebration[] }) {
  const [state, setState] = useState<Record<string, "posted" | "skipped">>({});
  const [text, setText] = useState<Record<string, string>>(() => Object.fromEntries(items.map((c) => [c.id, c.line])));
  const [open, setOpen] = useState<string | null>(null);
  if (!items.length) return null;
  const left = items.filter((c) => !state[c.id]).length;
  return (
    <Card
      id="pt-cel-h"
      title={<>Celebrations <small className="pt-tcard-n">{left ? `${left} this week` : "All done"}</small></>}
      help={<p>Only residents who are happy to be celebrated. Kinlight writes the line and checks photo consent. Posting puts it on the website, in the newsletter and on the lobby notice.</p>}
    >
      <ul className="pt-cel">
        {items.map((c) => (
          <li key={c.id} className={state[c.id] ?? ""}>
            <span className="pt-cel-i"><Icon name={celIcon[c.kind]} /></span>
            <div>
              <p className="pt-cel-h"><Link className="pt-name b" href={residentHref(c.who)}>{c.who}</Link> <small>{celLabel[c.kind]} · {c.when}</small></p>
              {state[c.id] ? (
                <p className="sx-hint">{state[c.id] === "posted" ? "Posted." : "Skipped."}</p>
              ) : open === c.id ? (
                <div className="pt-cel-prev">
                  <div className="pt-cel-card" aria-label="How it will look">
                    {c.consent === "none" ? <span className="pt-cel-nophoto">No photo</span> : <span className="pt-cel-av" aria-hidden="true">{c.who.split(" ").map((x) => x[0]).slice(0, 2).join("")}</span>}
                    <textarea rows={2} value={text[c.id]} onChange={(e) => setText((t) => ({ ...t, [c.id]: e.target.value }))} aria-label={`Celebration post for ${c.who}`} />
                  </div>
                  <p className="sx-hint">Website · newsletter · lobby notice. {c.note}</p>
                  <div className="pt-act">
                    <button type="button" className="sx-btn sx-btn-primary sx-btn-sm" onClick={() => { setState((s) => ({ ...s, [c.id]: "posted" })); setOpen(null); say(`Posted: ${first(c.who)}’s ${celLabel[c.kind].toLowerCase()}.`); }}><Icon name="send" /> Post</button>
                    <button type="button" className="sx-btn sx-btn-sm" onClick={() => setOpen(null)}>Not yet</button>
                  </div>
                </div>
              ) : (
                <div className="pt-act">
                  <button type="button" className="sx-btn sx-btn-sm" onClick={() => setOpen(c.id)}><Icon name="eye" /> Preview</button>
                  <button type="button" className="sx-link pt-second" onClick={() => { setState((s) => ({ ...s, [c.id]: "skipped" })); say("Skipped."); }}>Skip</button>
                  {c.consent === "none" && <Badge tone="warn">No photo</Badge>}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ------------------------------------------------------------ we haven't seen lately */

export function NotSeen({ items }: { items: Unseen[] }) {
  const [done, setDone] = useState<Record<string, string>>({});
  const [visit, setVisit] = useState<string | null>(null);
  const [invite, setInvite] = useState<{ name: string; text: string } | null>(null);
  const [note, setNote] = useState("");
  const [all, setAll] = useState(false);
  if (!items.length) return null;
  const shown = all ? items : items.slice(0, 3);
  return (
    <Card
      id="pt-seen-h"
      title="We haven’t seen lately"
      action={<Badge tone="neutral">Staff only</Badge>}
      help={<><p>Residents with no activities in two weeks. A person should notice, not an automatic text: they may be unwell or grieving. Families are never told automatically.</p><p><b>Coming in Beta:</b> automatic invites to residents who haven’t been out.</p></>}
    >
      <ul className="pt-seen">
        {shown.map((u) => (
          <li key={u.name}>
            <div className="pt-seen-t">
              <Link className="pt-name" href={residentHref(u.name)}>{u.name}</Link>
              <small>{u.days} days · likes {u.interests.slice(0, 2).join(", ").toLowerCase()}</small>
            </div>
            {done[u.name] ? (
              <p className="pt-seen-done"><Icon name="check" /> {done[u.name]}</p>
            ) : invite?.name === u.name ? (
              <form className="sx-form pt-visit" onSubmit={(e) => { e.preventDefault(); setDone((d) => ({ ...d, [u.name]: `Invite sent: “${invite.text}”` })); setInvite(null); say(`Invite sent to ${first(u.name)}.`); }}>
                <label><span className="sx-lbl">The text {first(u.name)} gets</span><textarea rows={3} value={invite.text} onChange={(e) => setInvite({ ...invite, text: e.target.value })} /></label>
                <div className="pt-act">
                  <button type="submit" className="sx-btn sx-btn-primary sx-btn-sm" disabled={!invite.text.trim()}><Icon name="send" /> Send invite</button>
                  <button type="button" className="sx-link pt-second" onClick={() => setInvite(null)}>Cancel</button>
                </div>
              </form>
            ) : visit === u.name ? (
              <form className="sx-form pt-visit" onSubmit={(e) => { e.preventDefault(); setDone((d) => ({ ...d, [u.name]: `1:1 visit logged${note ? `: “${note}”` : ""}.` })); setVisit(null); setNote(""); say("Visit logged."); }}>
                <label><span className="vh">What did you do together?</span><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What did you do together?" /></label>
                <div className="pt-act">
                  <button type="submit" className="sx-btn sx-btn-primary sx-btn-sm">Log visit</button>
                  <button type="button" className="sx-link pt-second" onClick={() => setVisit(null)}>Cancel</button>
                </div>
              </form>
            ) : (
              <div className="pt-act">
                {u.next && (
                  <button type="button" className="sx-btn sx-btn-primary sx-btn-sm" onClick={() => setInvite({ name: u.name, text: `${u.next!.title}, ${u.next!.when}. We’d love to see you there, ${first(u.name)}. Reply YES for a seat.` })}>
                    <Icon name="sms" /> Invite to {u.next.title}
                  </button>
                )}
                <button type="button" className="sx-link pt-second" onClick={() => { setDone((d) => ({ ...d, [u.name]: "Noted: you dropped by today." })); say("Noted."); }}>I dropped by</button>
                <button type="button" className="sx-link pt-second" onClick={() => setVisit(u.name)}>Log a 1:1 visit</button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {items.length > 3 && <p className="pt-tcard-f"><button type="button" className="sx-link" onClick={() => setAll((a) => !a)}>{all ? "Show fewer" : `See all ${items.length}`}</button></p>}
    </Card>
  );
}

/* ------------------------------------------------------------ welcome checklist */

export function WelcomeList({ items }: { items: Welcome[] }) {
  if (!items.length) return null;
  return (
    <Card id="pt-wel-h" title="Welcome" help={<p>New residents stay here until their welcome checklist is finished: their messages, interests, consent, inviting the family and a welcome post.</p>}>
      <ul className="pt-wel">
        {items.map((w) => {
          const n = w.steps.filter((s) => s.done).length;
          return (
            <li key={w.name}>
              <div className="pt-wel-t">
                <Link className="pt-name b" href={residentHref(w.name)}>{w.name}</Link>
                <span className="pt-wel-bar" aria-label={`${n} of ${w.steps.length} done`}><i style={{ width: `${(n / w.steps.length) * 100}%` }} /></span>
                <small>{n} of {w.steps.length} done</small>
              </div>
              <Link className="sx-btn sx-btn-sm" href={`${residentHref(w.name)}?welcome=1`}>Finish</Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/* ------------------------------------------------------------ a care partner's quick attendance */

/**
 * For a care partner: today's activities that have started (and the next one), with how many of their residents
 * usually come, and a quick tap list of just their residents. Saved in this browser.
 */
export function QuickAttendance({ events, acts, mine }: { events: CalEvent[]; acts: TodayActivity[]; mine: string[] }) {
  const [open, setOpen] = useState<CalEvent | null>(null);
  const [saved, setSaved] = useState<Record<string, number>>({});
  const { byId, next } = useDay(events, acts);
  const mineSet = new Set(mine);
  const theirs = (e: CalEvent) => [...new Set([...(e.people ?? []).filter((x) => x.status === "signed").map((x) => x.name), ...(e.booked ?? []).map((b) => b.name), ...(e.regulars ?? [])])].filter((n) => mineSet.has(n));
  // Started or next, and only where some of their residents usually come (or it's on now).
  const list = events.filter((e) => !e.cancelled && byId.has(e.id) && (byId.get(e.id)!.state !== "later" || e.id === next) && (theirs(e).length > 0 || byId.get(e.id)!.state === "now"));
  return (
    <Card id="pt-qa-h" title="Quick attendance" help={<p>Only your residents: tap who came. It counts toward the activity’s attendance in Reports. Families are never told about attendance automatically.</p>}>
      <ul className="pt-ph">
        {list.map((e) => {
          const n = theirs(e).length;
          const w = whereOf(e, byId.get(e.id), next);
          return (
            <li key={e.id}>
              <span><b>{e.title}</b><small>{fmtTime(e.start)} · {e.room} · {saved[e.id] !== undefined ? `${saved[e.id]} of yours came` : n ? `${n} of yours said yes` : "None of yours said yes"}</small></span>
              {saved[e.id] !== undefined ? <span className="pt-where done"><Icon name="check" /> Saved</span> : (
                <button type="button" className={`sx-btn sx-btn-sm${w === "now" || w === "missing" ? " sx-btn-primary" : ""}`} onClick={() => setOpen(e)}><Icon name="users" /> Take attendance</button>
              )}
            </li>
          );
        })}
        {!list.length && <li className="pt-empty">Nothing has started yet today.</li>}
      </ul>
      {open && (
        <Drawer title={open.title} sub={`${fmtTime(open.start)} · ${open.room} · your residents`} onClose={() => setOpen(null)}>
          <Attendance
            ev={{ id: open.id, title: open.title, when: fmtTime(open.start), place: open.room, lantern: open.lantern }}
            booked={theirs(open).length ? theirs(open) : mine.slice(0, 8)}
            bookedLabel="Your residents"
            everyone={mine}
            onSaved={(n) => { setSaved((s) => ({ ...s, [open.id]: n })); setOpen(null); say(`Attendance saved: ${n} of your residents came.`); }}
          />
        </Drawer>
      )}
    </Card>
  );
}
