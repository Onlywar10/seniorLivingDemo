"use client";

// "Needs you": everything waiting on a person, sorted by deadline (this morning's trip before a reply that can wait
// until tomorrow), with today's at the top. Every card follows the same pattern: who and what, one line of context,
// one main button, one secondary button, and "?" for the reasoning. Cards anyone on the team can pick up have
// "Take it", so two people don't both act. Acting slides the card away with a short "Approved · Undo". Residents to
// ask in person are gathered into "My rounds", a list to carry on the phone. The same card opens on its own from a
// staff text alert (/staff/card/[id]). Decisions stay in this browser only.
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { ConcernStatus } from "@/data/staff/engage";
import type { ConcernOwner, QItem, RsvpItem } from "@/data/staff/portal";
import type { StaffRole } from "@/data/staff/shared";
import { GROUP_LABEL, counts, dueText, groupOf, type Group } from "@/data/staff/signals";
import { addDays, dayShort, fmtTime, nowMinutes, today } from "@/lib/clock";
import { Icon } from "../../Icon";
import { FamilyLink, ResidentLink } from "../ResidentLink";
import { residentHref } from "../residentHref";
import { onToday, say, useConcernPatches, useDecide, useDecisions, useMoveCard, usePatchConcern, useResetConcern, useTodayState } from "../store";
import { Badge } from "../ui";
import { Drawer } from "./Drawer";
import { Help } from "./Help";

type Kind = QItem["kind"];
type IconName = Parameters<typeof Icon>[0]["name"];
const first = (n = "") => n.split(" ")[0];
const party = (n: number) => (n === 1 ? "1 person" : `${n} people`);
const tel = (p: string) => `tel:+1${p.replace(/\D/g, "")}`;

const label: Record<Kind, string> = {
  post: "To approve", rsvp: "Family RSVP", seat: "Seat request", group: "Family RSVPs", ask: "Ask in person", inquiry: "New inquiry",
  reply: "Message to answer", verify: "New family member", stale: "Page to update", concern: "Concern", review: "Ready to review", task: "",
};
/**
 * What a card asks of you, by colour: go and ask a resident in person, or act for a resident (approve what they said
 * yes to). Everything else keeps the plain card.
 */
const purposeOf = (k: Kind): "ask" | "act" | undefined => (k === "ask" ? "ask" : k === "rsvp" || k === "seat" || k === "group" ? "act" : undefined);
const purposeLabel = { ask: "Ask a resident in person", act: "Act for a resident" } as const;

const icon: Record<Kind, IconName> = {
  post: "check", rsvp: "users", seat: "bus", group: "users", ask: "users", inquiry: "phone", reply: "sms", verify: "heart", stale: "clock", concern: "alert", review: "eye", task: "check",
};

/** Who's signed in, and the first names of whoever holds each role. */
export interface QueueMe { as: StaffRole; name: string; first: string; names: Record<StaffRole, string> }

/** What a card does when it's acted on: the confirmation, and whether it leaves the list. */
type Act = (text: string, opts?: { stay?: boolean; undo?: () => void }) => void;

/* ------------------------------------------------------------ the list */

export function QueueList({ items, empty, me, owners = [], openEvent, replies = 0 }: {
  items: QItem[]; empty: string; me: QueueMe; owners?: ConcernOwner[];
  /** Conversations waiting on this person in Communications. */
  replies?: number;
  /** Opens the event sheet in place (Today); without it, the event opens in Calendar. */
  openEvent?: (id: string, date: string) => void;
}) {
  const patches = useConcernPatches();
  const { moves } = useTodayState();
  const move = useMoveCard();
  const [leaving, setLeaving] = useState<Set<string>>(new Set());
  const [taken, setTaken] = useState<Set<string>>(new Set());
  const [rounds, setRounds] = useState(false);
  const [show, setShow] = useState<"all" | "ask" | "act">("all");
  const nowM = useNow();

  // Decided anywhere (an approval on Website clears it here too); a concern resolved in Feedback leaves too.
  const decided = useDecisions();
  const isDecided = (q: QItem) => (q.kind === "ask" ? requestsOf(q).every((r) => decided[r.card]) : !!decided[q.id]);
  const mine = items.filter((q) => onToday(q, me.as, moves) || leaving.has(q.id));
  const live = mine.filter((q) => !(isDecided(q) && !leaving.has(q.id)) && !(q.kind === "concern" && patches[q.c.id]?.status === "Resolved"));
  const grouped = live.map((q) => ({ q, g: groupOf(q.due ?? 0, nowM) })).filter((x): x is { q: QItem; g: Group } => x.g !== null);
  const n = grouped.filter((x) => counts(x.g)).length;
  const purposes = (["ask", "act"] as const).filter((p) => grouped.some((x) => purposeOf(x.q.kind) === p));
  const visible = grouped.filter((x) => show === "all" || purposeOf(x.q.kind) === show);
  const groups = (["late", "hour", "today", "week"] as Group[]).map((g) => ({ g, items: visible.filter((x) => x.g === g).map((x) => x.q) }));
  const asks = live.filter((q): q is Extract<QItem, { kind: "ask" }> => q.kind === "ask");
  const nextUp = grouped.find((x) => x.g === "week")?.q;

  const finish = (q: QItem): Act => (text, opts = {}) => {
    if (opts.stay) { say(text); return; }
    const late = (q.due ?? 0) < nowM;
    setLeaving((s) => new Set(s).add(q.id));
    window.setTimeout(() => {
      move(q.id, { done: true }, { signal: q.signal ?? q.kind, who: me.as, kind: "done", overdue: late });
      setLeaving((s) => { const x = new Set(s); x.delete(q.id); return x; });
    }, 280);
    say(`Done · ${text}`, () => { move(q.id, null); opts.undo?.(); });
  };
  const snooze = (q: QItem, until: number, label: string) => {
    move(q.id, { until }, { signal: q.signal ?? q.kind, who: me.as, kind: "snoozed" });
    say(`Snoozed until ${label}.`, () => move(q.id, null));
  };
  const reassign = (q: QItem, to: StaffRole) => {
    move(q.id, { to }, { signal: q.signal ?? q.kind, who: me.as, kind: "reassigned" });
    say(`Handed to ${me.names[to]}. It’s on their Today now.`, () => move(q.id, null));
  };

  const card = (q: QItem) => (
    <li key={q.id} className={leaving.has(q.id) ? "pt-leaving" : undefined}>
      <QueueCard
        q={q} me={me} owners={owners} openEvent={openEvent} now={nowM}
        taken={taken.has(q.id)}
        onTake={() => { setTaken((s) => new Set(s).add(q.id)); say("It’s yours. The team sees you took it."); }}
        act={finish(q)}
        onSnooze={(until, label) => snooze(q, until, label)}
        onReassign={(to) => reassign(q, to)}
      />
    </li>
  );

  return (
    <section className="pt-needs" aria-labelledby="pt-needs-h">
      <header className="pt-needs-h">
        <h2 id="pt-needs-h">Needs you</h2>
        <span className={`pt-count${n ? "" : " zero"}`} aria-live="polite">{n ? `${n} today` : "Clear for today"}</span>
        <Help label="About Needs you">
          <p>Only what you have to decide or do yourself, due this week. Kinlight does everything else on its own, like putting someone on a waitlist when an event is full.</p>
          <p>Overdue first, then the next hour, today and this week; inside each, the oldest first. The number counts overdue and today only: it’s the same in the menu and in any text alert.</p>
          <p>Who gets what is set in Settings → Approvals and alerts.</p>
        </Help>
      </header>

      {(purposes.length > 0 || asks.length > 0 || replies > 0) && (
        <div className="pt-qbar">
          {purposes.length > 0 && (
            <div className="pt-show" role="group" aria-label="Show">
              <span>Show:</span>
              <button type="button" aria-pressed={show === "all"} onClick={() => setShow("all")}>Everything</button>
              {purposes.map((p) => <button key={p} type="button" className={`pt-purp ${p}`} aria-pressed={show === p} onClick={() => setShow(show === p ? "all" : p)}><i aria-hidden="true" /> {purposeLabel[p]}</button>)}
            </div>
          )}
          {asks.length > 0 && <button type="button" className="sx-btn sx-btn-sm pt-rounds-btn" onClick={() => setRounds(true)}><Icon name="users" /> My rounds</button>}
          {replies > 0 && <Link className="sx-btn sx-btn-sm" href="/staff/messages"><Icon name="sms" /> {replies === 1 ? "1 of your messages needs" : `${replies} of your messages need`} a reply</Link>}
        </div>
      )}

      {grouped.length === 0 ? (
        <p className="pt-empty pt-alldone"><Icon name="check" /> <span><b>You’re clear for today.</b> {items.length ? "New things appear here the moment they arrive." : empty}</span></p>
      ) : (
        <>
          {n === 0 && <p className="pt-empty pt-alldone"><Icon name="check" /> <span><b>You’re clear for today.</b>{nextUp ? <> Next: {titleOf(nextUp)}, {dueText(nextUp.due ?? 0, nowM, fmtTime, (o) => dayShort(addDays(today(), o))).replace(/^Due /, "").toLowerCase()}.</> : null}</span></p>}
          {groups.map((g) => g.items.length > 0 && (
            <div key={g.g}>
              <h3 className={`pt-qgroup g-${g.g}`}>{GROUP_LABEL[g.g]} <small>{g.items.length}</small></h3>
              <ol className="pt-qlist">{g.items.map(card)}</ol>
            </div>
          ))}
        </>
      )}

      {rounds && (
        <Rounds
          asks={asks}
          me={me}
          onClose={() => setRounds(false)}
          onAnswer={(q, text) => finish(q)(text)}
        />
      )}
    </section>
  );
}

/** Minutes since midnight, kept current. */
function useNow() {
  const [now, setNow] = useState(() => nowMinutes());
  useEffect(() => { const id = window.setInterval(() => setNow(nowMinutes()), 30_000); return () => window.clearInterval(id); }, []);
  return now;
}

/** A card's subject in a few words, for "Next: …". */
function titleOf(q: QItem): string {
  switch (q.kind) {
    case "post": return `approve ${q.title}`;
    case "rsvp": case "seat": return `${first(q.from)}’s request for ${q.event.title}`;
    case "group": return `${q.items.length} RSVPs for ${q.event.title}`;
    case "ask": return `ask ${q.resident}`;
    case "inquiry": return `call ${q.name}`;
    case "reply": return `reply to ${first(q.from)}`;
    case "verify": return `check ${q.name}`;
    case "stale": return q.page;
    case "concern": return `${first(q.c.from)}’s concern`;
    case "review": return q.r.title;
    case "task": return q.title;
  }
}

/* ------------------------------------------------------------ one card */

export function QueueCard({ q, me, owners = [], taken = false, onTake, act, openEvent, now, onSnooze, onReassign }: {
  q: QItem; me?: QueueMe; owners?: ConcernOwner[]; taken?: boolean; onTake?: () => void; act: Act; openEvent?: (id: string, date: string) => void;
  /** Minutes since midnight, for "Due in 40 min". */
  now?: number;
  onSnooze?: (until: number, label: string) => void; onReassign?: (to: StaffRole) => void;
}) {
  const decide = useDecide();
  const due = q.due ?? 0;
  const nowM = now ?? nowMinutes();
  const g = groupOf(due, nowM);
  const urgent = g === "late" || g === "hour" || g === "today";
  const overdue = g === "late";
  const when = dueText(due, nowM, fmtTime, (o) => dayShort(addDays(today(), o)));
  const ev = (e: { id: string; date: string; title: string; when: string }) =>
    openEvent ? (
      <button type="button" className="sx-link pt-evlink" onClick={() => openEvent(e.id, e.date)}>{e.title}</button>
    ) : (
      <Link className="sx-link pt-evlink" href={`/staff/calendar?event=${encodeURIComponent(e.id)}&date=${e.date}`}>{e.title}</Link>
    );

  const frame = (title: ReactNode, context: ReactNode, help: ReactNode, body: ReactNode, main: ReactNode, second?: ReactNode, extra?: ReactNode) => (
    <article className={`pt-q k-${q.kind}${purposeOf(q.kind) ? ` p-${purposeOf(q.kind)}` : ""}`}>
      <header className="pt-q-h">
        <span className={`pt-tag k-${q.kind}`}><Icon name={q.kind === "task" ? q.icon : icon[q.kind]} /> {q.kind === "task" ? q.type : label[q.kind]}</span>
        <span className={`pt-due${urgent ? " today" : ""}${overdue ? " late" : ""}`}><Icon name="clock" /> {when}</span>
        <Help label="Why this came to you" align="end">{q.why && <p><b>{q.why}.</b></p>}{help}<p className="pt-help-ago">Arrived {q.ago.replace(/^\w/, (x) => x.toLowerCase())}.</p></Help>
      </header>
      <h3>{title}</h3>
      {context && <p className="pt-q-sub">{context}</p>}
      {q.ifNot && <p className="pt-ifnot">{q.dueLabel ? `${q.dueLabel.replace(/^\w/, (x) => x.toUpperCase())}, ` : ""}{q.ifNot}</p>}
      {body}
      {(main || second) && (
        <div className="pt-act">
          {main}
          {second}
        </div>
      )}
      {extra}
      {(onSnooze || onReassign) && <Later me={me} now={nowM} onSnooze={onSnooze} onReassign={onReassign} />}
      {me && <Whose q={q} me={me} taken={taken} onTake={onTake} />}
    </article>
  );

  switch (q.kind) {
    case "post":
      return <PostCard q={q} frame={frame} act={act} />;

    case "group":
      return <GroupCard q={q} frame={frame} act={act} ev={ev} />;

    case "rsvp":
    case "seat": {
      const e = q.event;
      const done = (d: "approved" | "declined", text: string) => { decide(q.id, d); act(text, { undo: () => decide(q.id, null) }); };
      return frame(
        q.kind === "rsvp" ? <><FamilyLink name={q.from} resident={q.resident} />: {party(q.party)} for {ev(e)}</> : <>A seat for <ResidentLink name={q.resident} /> on {ev(e)}</>,
        <>{e.when} · {first(q.resident)} said yes{q.full ? " · Full" : e.seatsLeft !== undefined ? ` · ${e.seatsLeft} seats left` : ""}{q.note ? ` · “${q.note}”` : ""}</>,
        <p>{q.said}. {q.full ? `It’s full, so approving would overbook it. On the waitlist, ${first(q.resident)} is confirmed automatically if a seat opens.` : `Approving tells ${first(q.from)} by ${q.how}, in ${q.lang}.`}</p>,
        null,
        q.full ? (
          <button type="button" className="sx-btn sx-btn-primary pt-big" onClick={() => done("approved", `Added to the waitlist. ${first(q.from)} is told.`)}><Icon name="list" /> Add to waitlist</button>
        ) : (
          <button type="button" className="sx-btn sx-btn-primary pt-big" onClick={() => done("approved", `Approved. ${first(q.from)} and ${first(q.resident)} are told.`)}><Icon name="check" /> Approve</button>
        ),
        <button type="button" className="sx-btn pt-second" onClick={() => done("declined", `Declined. ${first(q.from)} is told kindly.`)}>Decline</button>,
        <WaitingLink name={q.resident} />,
      );
    }

    case "ask":
      return <AskCard q={q} frame={frame} act={act} me={me} ev={ev} />;

    case "inquiry":
      return frame(
        <>Call {q.name}</>,
        `${q.interest} · ${q.source}`,
        <p>{q.replied}. Call within the day, while they’re keen.</p>,
        <p className="pt-quote">“{q.msg}”</p>,
        <a className="sx-btn sx-btn-primary pt-big" href={tel(q.phone)} onClick={() => window.setTimeout(() => act(`Called ${first(q.name)}. Note how it went in Prospects.`), 400)}><Icon name="phone" /> Call {q.phone}</a>,
        <button type="button" className="sx-btn pt-second" onClick={() => act(`${first(q.name)} marked as contacted.`)}>Already contacted</button>,
      );

    case "reply":
      return <ReplyCard q={q} frame={frame} act={act} />;

    case "verify":
      return frame(
        <>Check {q.name}</>,
        `Says ${q.says.replace(/^\w/, (x) => x.toLowerCase())} · ${q.via.replace(/^\w/, (x) => x.toLowerCase())}`,
        <p>{q.via}; {q.agreed}. Until you check, {first(q.name)} gets community news only. Once verified, {first(q.name)} hears about {first(q.resident)} too.</p>,
        null,
        <button type="button" className="sx-btn sx-btn-primary pt-big" onClick={() => act(`Verified. ${first(q.name)} now hears about ${first(q.resident)}.`)}><Icon name="check" /> Verify</button>,
        <a className="sx-btn pt-second" href={tel(q.phone)}><Icon name="phone" /> Call {q.phone}</a>,
        <button type="button" className="sx-link pt-third" onClick={() => act(`Not verified. ${first(q.name)} keeps community news only.`)}>Not family</button>,
      );

    case "stale":
      return frame(
        <>{q.page}</>,
        q.detail,
        <p>Each page has an owner and a rhythm; Kinlight reminds the owner before it goes stale.</p>,
        null,
        <Link className="sx-btn sx-btn-primary pt-big" href={q.href}><Icon name="edit" /> Update it</Link>,
        undefined,
      );

    case "concern":
      return <ConcernCard q={q} frame={frame} act={act} me={me} owners={owners} />;

    case "task":
      return frame(
        <>{q.title}</>,
        q.context,
        <p>{q.help}</p>,
        q.lines?.length ? <ul className="pt-task-lines">{q.lines.slice(0, 6).map((l, i) => <li key={i}>{l}</li>)}{q.lines.length > 6 && <li className="sx-hint">and {q.lines.length - 6} more</li>}</ul> : q.quote ? <p className="pt-quote">“{q.quote}”</p> : null,
        q.main.href ? (
          <Link className="sx-btn sx-btn-primary pt-big" href={q.main.href} onClick={() => q.main.done && window.setTimeout(() => act(q.main.done!), 300)}>{q.main.label}</Link>
        ) : (
          <button type="button" className="sx-btn sx-btn-primary pt-big" onClick={() => act(q.main.done ?? "Done.")}><Icon name="check" /> {q.main.label}</button>
        ),
        q.second ? (q.second.href ? <Link className="sx-btn pt-second" href={q.second.href}>{q.second.label}</Link> : <button type="button" className="sx-btn pt-second" onClick={() => act(q.second!.done ?? "Done.")}>{q.second.label}</button>) : undefined,
      );

    case "review": {
      const r = q.r;
      const ic = { newsletter: "mail", import: "calendar", menus: "fork", captions: "image" } as const;
      const after = { newsletter: "It sends Sunday at 5 pm.", import: "The events are on the calendar.", menus: "They publish day by day.", captions: "The photos are in the gallery and the newsletter." }[r.kind];
      const href = `${r.href}${r.href.includes("?") ? "&" : "?"}from=card`;
      return frame(
        <><Icon name={ic[r.kind]} /> {r.title}</>,
        r.flagged > 0 ? `Kinlight prepared it · ${r.flagged} to check` : "Kinlight prepared it · nothing flagged",
        <p>{r.detail} Nothing here goes out before its time.</p>,
        null,
        r.flagged > 0 ? (
          <Link className="sx-btn sx-btn-primary pt-big" href={href}><Icon name="eye" /> Check {r.flagged}</Link>
        ) : (
          <button type="button" className="sx-btn sx-btn-primary pt-big" onClick={() => act(`Looks good. ${after}`)}><Icon name="check" /> Looks good</button>
        ),
        <Link className="sx-btn pt-second" href={href}>Open</Link>,
      );
    }
  }
}

/** The two small actions on every card: snooze until a time, or hand it to someone else. */
function Later({ me, now, onSnooze, onReassign }: { me?: QueueMe; now: number; onSnooze?: (until: number, label: string) => void; onReassign?: (to: StaffRole) => void }) {
  const [open, setOpen] = useState<null | "snooze" | "reassign">(null);
  const at = (m: number) => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime() + m * 60_000; };
  const opts: [string, number][] = [
    ["an hour from now", at(now + 60)],
    ...(now < 14 * 60 ? [["2:00 pm today", at(14 * 60)] as [string, number]] : now < 17 * 60 ? [["5:00 pm today", at(17 * 60)] as [string, number]] : []),
    ["tomorrow at 8:00 am", at(1440 + 8 * 60)],
  ];
  const others = me ? (Object.keys(me.names) as StaffRole[]).filter((r) => r !== me.as) : [];
  return (
    <div className="pt-later-row">
      {onSnooze && <button type="button" className="sx-link" aria-expanded={open === "snooze"} onClick={() => setOpen(open === "snooze" ? null : "snooze")}><Icon name="clock" /> Snooze</button>}
      {onReassign && others.length > 0 && <button type="button" className="sx-link" aria-expanded={open === "reassign"} onClick={() => setOpen(open === "reassign" ? null : "reassign")}><Icon name="users" /> Reassign</button>}
      {open === "snooze" && onSnooze && (
        <div className="pt-later-opts" role="group" aria-label="Snooze until">
          {opts.map(([l, t]) => <button key={l} type="button" className="sx-btn sx-btn-sm" onClick={() => { setOpen(null); onSnooze(t, l); }}>Until {l}</button>)}
        </div>
      )}
      {open === "reassign" && onReassign && me && (
        <div className="pt-later-opts" role="group" aria-label="Hand it to">
          {others.map((r) => <button key={r} type="button" className="sx-btn sx-btn-sm" onClick={() => { setOpen(null); onReassign(r); }}>{me.names[r]}</button>)}
        </div>
      )}
    </div>
  );
}

type Frame = (title: ReactNode, context: ReactNode, help: ReactNode, body: ReactNode, main: ReactNode, second?: ReactNode, extra?: ReactNode) => ReactNode;

/** Whose card it is: yours, someone else's, or anyone's ("Take it"). */
function Whose({ q, me, taken, onTake }: { q: QItem; me: QueueMe; taken: boolean; onTake?: () => void }) {
  // "Who looks after whom" is on: the resident is yours (or not placed in an area yet, so it comes to the administrator).
  if (q.area) return <p className="pt-whose pt-whose-mine"><Icon name="heart" /> {/^Not placed/.test(q.area) ? <>Not in an area yet · <Link className="sx-link" href="/staff/settings">Place them in Settings</Link></> : <>Your resident · {q.area}</>}</p>;
  if (q.team)
    return (
      <p className="pt-whose">
        {taken ? <><Icon name="check" /> You took this</> : <><Icon name="users" /> Anyone on the team {onTake && <button type="button" className="sx-btn sx-btn-sm" onClick={onTake}>Take it</button>}</>}
      </p>
    );
  if (q.kind === "concern") return null;
  if (q.owner && q.owner !== me.as) return <p className="pt-whose"><Icon name="users" /> {me.names[q.owner]}’s</p>;
  return null;
}

/* ------------------------------------------------------------ approvals: the flyer or photos full size, send back with a reason */

const backReasons = ["Photo needs consent", "Wrong date or time", "Price to check", "Spelling", "Too long"];

function PostCard({ q, frame, act }: { q: Extract<QItem, { kind: "post" }>; frame: Frame; act: Act }) {
  const decide = useDecide();
  const [big, setBig] = useState(false);
  const [back, setBack] = useState(false);
  const [why, setWhy] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const by = first(q.by);
  return (
    <>
      {frame(
        <>{q.title}</>,
        `${q.postKind} from ${by} · goes to ${q.channels.length} places`,
        <><p>Resident photos, prices and special menus wait for approval. Approving publishes it: {q.channels.join(", ").toLowerCase()}.</p>{q.note && <p>{by}’s note: “{q.note}”</p>}</>,
        <div className="pt-q-body">
          {q.photo && (
            <button type="button" className="pt-q-photo" onClick={() => setBig(true)} aria-label={`Open ${q.postKind.toLowerCase()} full size`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={q.photo} alt="" />
              <span><Icon name="eye" /> Full size</span>
            </button>
          )}
          <div>
            <p>{q.detail}</p>
            {q.diff && <p className="pt-diff"><s>{q.diff[0]}</s> <Icon name="arrow" /> <b>{q.diff[1]}</b></p>}
          </div>
        </div>,
        <button type="button" className="sx-btn sx-btn-primary pt-big" onClick={() => { decide(q.id, "approved"); act(`Approved and published. ${by} is told.`, { undo: () => decide(q.id, null) }); }}><Icon name="check" /> Approve</button>,
        <button type="button" className="sx-btn pt-second" aria-expanded={back} onClick={() => setBack((b) => !b)}>Send back</button>,
        back ? (
          <form className="pt-back sx-form" onSubmit={(e) => { e.preventDefault(); decide(q.id, "declined"); act(`Sent back to ${by}${why.length ? `: ${why.join(", ").toLowerCase()}` : ""}. Nothing went out.`, { undo: () => decide(q.id, null) }); }}>
            <span className="sx-lbl">Why? {by} sees this.</span>
            <div className="sx-chips" role="group" aria-label="Reasons">
              {backReasons.map((r) => (
                <button key={r} type="button" aria-pressed={why.includes(r)} onClick={() => setWhy((w) => (w.includes(r) ? w.filter((x) => x !== r) : [...w, r]))}>{r}</button>
              ))}
            </div>
            <label><span className="vh">A note for {by}</span><textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder={`A note for ${by} (optional)`} /></label>
            <div className="pt-act">
              <button type="submit" className="sx-btn sx-btn-primary" disabled={!why.length && !note.trim()}><Icon name="send" /> Send back to {by}</button>
              <button type="button" className="sx-btn" onClick={() => setBack(false)}>Cancel</button>
            </div>
          </form>
        ) : undefined,
      )}
      {big && q.photo && <Lightbox src={q.photo} title={q.title} sub={`${q.postKind} · ${q.detail}`} onClose={() => setBig(false)} />}
    </>
  );
}

export function Lightbox({ src, title, sub, onClose }: { src: string; title: string; sub?: string; onClose: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="pt-lightbox" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <figure>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={title} />
        <figcaption><b>{title}</b>{sub && <span>{sub}</span>}</figcaption>
      </figure>
      <button type="button" className="pt-lightbox-x" onClick={onClose} aria-label="Close" autoFocus><Icon name="x" /></button>
    </div>
  );
}

/* ------------------------------------------------------------ replies: quick answers, a call, or no reply needed */

function ReplyCard({ q, frame, act }: { q: Extract<QItem, { kind: "reply" }>; frame: Frame; act: Act }) {
  // One suggestion, ready to send or edit. The others are a tap away; promises (a seat, a table) are staff's to add.
  const [text, setText] = useState(q.quick[0] ?? "");
  const [others, setOthers] = useState(false);
  const fam = first(q.from);
  return frame(
    <><FamilyLink name={q.from} resident={q.resident} /></>,
    <>{q.relation} of <ResidentLink name={q.resident} bold={false} />{q.lang !== "English" ? ` · writes in ${q.lang}` : ""} · <Link className="sx-link" href={`${residentHref(q.resident)}?tab=family`}>Messages</Link></>,
    <>
      <p>{q.why}</p>
      {q.sources.length > 0 && <p>The suggested reply uses only: {q.sources.join("; ")}. It never promises anything; add that yourself if you can.</p>}
      {q.handled.length > 0 && (
        <>
          <p><b>The AI handled {q.handled.length} other replies this week</b>: clear answers to Kinlight’s own questions, each confirmed first and filed in that family’s messages in People.</p>
          <ul>{q.handled.map((h, i) => <li key={i}>{h.from}: “{h.reply}”. {h.did}</li>)}</ul>
        </>
      )}
    </>,
    <>
      <p className="pt-quote">“{q.text}”</p>
      {q.original && <p className="pt-orig" lang={q.lang === "Spanish" ? "es" : undefined}>{q.original}</p>}
      <label className="pt-reply">
        <span className="sx-lbl">Suggested reply{q.lang !== "English" ? `, sent in ${q.lang}` : ""}</span>
        <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a reply" />
      </label>
      {q.quick.length > 1 && (
        <div className="pt-quick-more">
          <button type="button" className="sx-link" aria-expanded={others} onClick={() => setOthers((o) => !o)}>{others ? "Hide other replies" : `Other replies (${q.quick.length - 1})`}</button>
          {others && (
            <div className="pt-quick" role="group" aria-label="Other replies">
              {q.quick.map((x, i) => (
                <button key={i} type="button" aria-pressed={text === x} onClick={() => setText(x)}>{x}</button>
              ))}
              <button type="button" className="pt-quick-own" onClick={() => setText("")}><Icon name="edit" /> Start blank</button>
            </div>
          )}
        </div>
      )}
    </>,
    <button type="button" className="sx-btn sx-btn-primary pt-big" disabled={!text.trim()} onClick={() => act(`Reply sent to ${fam}${q.lang !== "English" ? `, in ${q.lang}` : ""}. Filed in ${first(q.resident)}’s family messages.`)}><Icon name="send" /> Send</button>,
    <a className="sx-btn pt-second" href={tel(q.phone)} onClick={() => window.setTimeout(() => act(`Called ${fam}. Marked as answered.`), 400)}><Icon name="phone" /> Call</a>,
    <button type="button" className="sx-link pt-third" onClick={() => act("No reply needed. Marked done.")}>No reply needed</button>,
  );
}

/* ------------------------------------------------------------ concerns: reply, call, in progress, reassign, resolve */

function ConcernCard({ q, frame, act, me, owners }: { q: Extract<QItem, { kind: "concern" }>; frame: Frame; act: Act; me?: QueueMe; owners: ConcernOwner[] }) {
  const patches = useConcernPatches();
  const patch = usePatchConcern();
  const reset = useResetConcern();
  const p = patches[q.c.id];
  const c = { ...q.c, ...p };
  const [mode, setMode] = useState<null | "reply" | "owner">(null);
  const [val, setVal] = useState("");
  const fam = first(c.from);
  const myName = me?.first ?? "You";
  const log = (line: string, status?: ConcernStatus, extra: Partial<typeof c> = {}) => {
    const before = p;
    patch(c.id, { status: status ?? (c.status === "Open" ? "In progress" : c.status), log: [...c.log, line], ...extra });
    return () => reset(c.id, before);
  };
  const owned = me && c.ownerName.startsWith(me.first) ? "you" : c.ownerName;
  return frame(
    <><FamilyLink name={c.from} resident={c.resident} /> <small className="pt-apt">· {c.topic}</small></>,
    <>{c.relation} of <ResidentLink name={c.resident} bold={false} /> · owner: <b>{owned}</b> · <Badge tone={c.status === "In progress" ? "info" : "warn"}>{c.status}</Badge></>,
    <><p>{c.how}. Concerns are never answered by the AI and stay open until someone marks them resolved, here or in Feedback.</p><ol className="fb-log">{c.log.map((l, i) => <li key={i}>{l}</li>)}</ol></>,
    <>
      <p className="pt-quote">“{c.text}”</p>
      {mode === "reply" && (
        <form className="pt-back sx-form" onSubmit={(e) => { e.preventDefault(); if (!val.trim()) return; const undo = log(`${myName} replied by text: “${val.trim()}”`); setMode(null); setVal(""); act(`Reply sent to ${fam}. Still open until it’s resolved.`, { stay: true, undo }); }}>
          <label><span className="vh">Your reply to {fam}</span><textarea rows={3} value={val} onChange={(e) => setVal(e.target.value)} placeholder={`Hi ${fam}, I’m so sorry about this. Here’s what we’re doing…`} autoFocus /></label>
          <div className="pt-act"><button type="submit" className="sx-btn sx-btn-primary" disabled={!val.trim()}><Icon name="send" /> Send reply</button><button type="button" className="sx-btn" onClick={() => setMode(null)}>Cancel</button></div>
        </form>
      )}
      {mode === "owner" && (
        <form className="pt-back sx-form" onSubmit={(e) => {
          e.preventDefault();
          const o = owners.find((x) => x.key === val);
          if (!o) return;
          const undo = log(`${myName} passed it to ${o.name}. ${first(o.name)} got an alert.`, undefined, { owner: o.key, ownerName: o.name });
          setMode(null);
          act(`Passed to ${first(o.name)}. They got an alert.`, { undo });
        }}>
          <label>Pass it to
            <select value={val} onChange={(e) => setVal(e.target.value)} required>
              <option value="">Choose who</option>
              {owners.filter((o) => o.key !== c.owner).map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          </label>
          <div className="pt-act"><button type="submit" className="sx-btn sx-btn-primary" disabled={!val}><Icon name="users" /> Reassign</button><button type="button" className="sx-btn" onClick={() => setMode(null)}>Cancel</button></div>
        </form>
      )}
    </>,
    <button type="button" className="sx-btn sx-btn-primary pt-big" aria-expanded={mode === "reply"} onClick={() => { setMode(mode === "reply" ? null : "reply"); setVal(""); }}><Icon name="sms" /> Reply</button>,
    <a className="sx-btn pt-second" href={tel(q.phone)} onClick={() => { const undo = log(`${myName} called ${fam}.`); act(`Noted: you called ${fam}.`, { stay: true, undo }); }}><Icon name="phone" /> Call {q.phone}</a>,
    <div className="pt-more">
      {c.status !== "In progress" && <button type="button" className="sx-link" onClick={() => { const undo = log(`${myName} is on it.`, "In progress"); act("Marked in progress.", { stay: true, undo }); }}>In progress</button>}
      <button type="button" className="sx-link" aria-expanded={mode === "owner"} onClick={() => { setMode(mode === "owner" ? null : "owner"); setVal(""); }}>Reassign</button>
      <button type="button" className="sx-link" onClick={() => { const undo = log(`${fam} was told by ${myName}. Marked resolved.`, "Resolved"); act("Resolved. Updated in Feedback too.", { undo }); }}>Mark resolved</button>
    </div>,
  );
}

/* ------------------------------------------------------------ RSVPs residents all said yes to: one card */

function GroupCard({ q, frame, act, ev }: { q: Extract<QItem, { kind: "group" }>; frame: Frame; act: Act; ev: (e: { id: string; date: string; title: string; when: string }) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const [out, setOut] = useState<Set<string>>(new Set());
  const left = q.items.filter((x) => !out.has(x.id));
  const people = left.reduce((n, x) => n + x.party, 0);
  return frame(
    <>{left.length} family RSVPs for {ev(q.event)}</>,
    `${q.event.when} · residents all said yes · ${people} people`,
    <p>Each resident said yes by text first. Approving tells every family in their own language, by the way they like to hear.</p>,
    open ? (
      <ul className="pt-group-list">
        {q.items.map((x: RsvpItem) => (
          <li key={x.id} className={out.has(x.id) ? "done" : undefined}>
            <span><FamilyLink name={x.from} resident={x.resident} /> <small>{x.relation} of <ResidentLink name={x.resident} bold={false} /> · {party(x.party)}{x.note ? ` · “${x.note}”` : ""}</small></span>
            <button type="button" className="sx-link" onClick={() => setOut((s) => { const n = new Set(s); if (n.has(x.id)) n.delete(x.id); else n.add(x.id); return n; })}>{out.has(x.id) ? "Include" : "Leave out"}</button>
          </li>
        ))}
      </ul>
    ) : null,
    <button type="button" className="sx-btn sx-btn-primary pt-big" disabled={!left.length} onClick={() => act(`${left.length} RSVPs approved. Each family is told.`)}><Icon name="check" /> Approve all {left.length}</button>,
    <button type="button" className="sx-btn pt-second" aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? "Hide the list" : "See who"}</button>,
  );
}

/* ------------------------------------------------------------ asking a resident in person: one answer per request */

type Ask = Extract<QItem, { kind: "ask" }>;
type EventLineLite = { id: string; date: string; title: string; when: string };
type AskReq = { card: string; request: "rsvp" | "seat"; from: string; event: EventLineLite; party: number };
const requestsOf = (q: Ask): AskReq[] => [{ card: q.id, request: q.request, from: q.from, event: q.event, party: q.party }, ...q.more];

/** The way from a card to everything waiting on that resident: family requests, invites, suggestions. */
function WaitingLink({ name }: { name: string }) {
  return <Link className="sx-link pt-waitlink" href={`${residentHref(name)}#waiting`}>Everything waiting on {first(name)} <Icon name="right" /></Link>;
}

/**
 * What happens after the resident's yes. The alpha rule: the resident says yes, then staff approve. Family requests
 * are approved by the activities team, so when that's you, your tap is both.
 */
function afterYes(me?: QueueMe) {
  if (!me || me.as === "events") return { you: true, line: "You approve family requests, so tapping Yes approves it too. The family is told in their language." };
  return { you: false, line: `A yes goes to ${me.names.events} to approve. A no goes to the family kindly.` };
}

/** One resident's questions, each with its own Yes and No. Calls onDone once every one is answered. */
function AskList({ q, me, ev, onDone }: { q: Ask; me?: QueueMe; ev?: (e: EventLineLite) => ReactNode; onDone: (text: string) => void }) {
  const decided = useDecisions();
  const decide = useDecide();
  // Questions already answered on the resident's page don't come back here.
  const [all] = useState(() => requestsOf(q).filter((r) => !decided[r.card]));
  const [a, setA] = useState<Record<number, "yes" | "no">>({});
  const res = first(q.resident);
  const ap = afterYes(me);
  const answer = (i: number, v: "yes" | "no") => {
    const next = { ...a, [i]: v };
    setA(next);
    const d = v === "yes" ? "approved" : "declined";
    if (Object.keys(next).length < all.length) { decide(all[i].card, d); say(`${res} said ${v} to ${all[i].event.title}.`); return; }
    const yes = all.filter((_, k) => next[k] === "yes").length;
    const no = all.length - yes;
    const parts = [yes ? (ap.you ? `${yes} approved` : `${yes} sent to ${me?.names.events} to approve`) : "", no ? `${no} declined kindly` : ""].filter(Boolean);
    // Leave first, then record the last answer, so the card slides away instead of vanishing.
    onDone(`${res} answered: ${parts.join(", ")}.${ap.you ? " Families are told." : ""}`);
    decide(all[i].card, d);
  };
  return (
    <ul className="pt-asks">
      {all.map((r, i) => (
        <li key={i} className={a[i] ? `done ${a[i]}` : undefined}>
          <span className="pt-asks-q">
            <b>{r.request === "rsvp" ? <><FamilyLink name={r.from} resident={q.resident} /> would like to come{r.party > 1 ? ` (${party(r.party)})` : ""}</> : <><FamilyLink name={r.from} resident={q.resident} /> asked for a seat</>}</b>
            <small>{ev ? ev(r.event) : r.event.title} · {r.event.when}</small>
          </span>
          {a[i] ? (
            <span className="pt-rounds-a"><Icon name={a[i] === "yes" ? "check" : "x"} /> {res} said {a[i]}{a[i] === "yes" ? (ap.you ? " · approved" : ` · with ${me?.names.events} to approve`) : ""}</span>
          ) : (
            <span className="pt-rounds-b">
              <button type="button" className="sx-btn sx-btn-sm sx-btn-primary" onClick={() => answer(i, "yes")}><Icon name="check" /> Yes</button>
              <button type="button" className="sx-btn sx-btn-sm" onClick={() => answer(i, "no")}><Icon name="x" /> No</button>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function AskCard({ q, frame, act, me, ev }: { q: Ask; frame: Frame; act: Act; me?: QueueMe; ev: (e: EventLineLite) => ReactNode }) {
  const res = first(q.resident);
  const n = requestsOf(q).length;
  return frame(
    <>Ask <ResidentLink name={q.resident} />{q.apt ? <small className="pt-apt"> · {q.apt}</small> : null}</>,
    <>{n > 1 ? `${n} questions for ${res}` : "1 question"} · {q.asked}</>,
    <p>{q.lantern ? `Lantern residents aren’t asked by text, so ask ${res} in person.` : `${res} was asked by text and hasn’t answered, so ask in person.`} {afterYes(me).line} It’s also on “My rounds”.</p>,
    <AskList q={q} me={me} ev={ev} onDone={(t) => act(t)} />,
    null,
    undefined,
    <WaitingLink name={q.resident} />,
  );
}

/* ------------------------------------------------------------ my rounds: everyone to ask in person, one list */

function Rounds({ asks, me, onClose, onAnswer }: { asks: Ask[]; me: QueueMe; onClose: () => void; onAnswer: (q: Ask, text: string) => void }) {
  const [done, setDone] = useState<Set<string>>(new Set());
  const order = useMemo(() => [...asks].sort((a, b) => (a.apt ?? "").localeCompare(b.apt ?? "")), [asks]);
  const left = order.filter((q) => !done.has(q.id)).length;
  return (
    <Drawer title="My rounds" sub={left ? `${left} ${left === 1 ? "resident" : "residents"} to ask in person, in apartment order` : "Everyone asked"} onClose={onClose}>
      <p className="sx-hint">{afterYes(me).line}</p>
      <ol className="pt-rounds">
        {order.map((q) => {
          const n = requestsOf(q).length;
          return (
            <li key={q.id} className={done.has(q.id) ? "done" : undefined}>
              <div className="pt-rounds-t">
                <ResidentLink name={q.resident} />
                <small>{[q.apt ? `Apt ${q.apt}` : "", q.lantern ? "Lantern" : "", n > 1 ? `${n} questions` : "1 question"].filter(Boolean).join(" · ")}</small>
              </div>
              <AskList q={q} me={me} onDone={(t) => { setDone((d) => new Set(d).add(q.id)); onAnswer(q, t); }} />
            </li>
          );
        })}
      </ol>
    </Drawer>
  );
}

/* ------------------------------------------------------------ the card on its own, from a staff text alert */

export function SoloCard({ q }: { q: QItem }) {
  const [done, setDone] = useState<string | null>(null);
  if (done)
    return (
      <>
        <article className="pt-q pt-q-done good"><Icon name="check" /><p>{done}</p><button type="button" className="sx-link pt-undo" onClick={() => setDone(null)}>Undo</button></article>
        <p className="pt-solo-next"><Badge tone="good">Done</Badge> <Link className="sx-link" href="/staff/today">See everything else waiting for you</Link></p>
      </>
    );
  return <QueueCard q={q} act={(text, o) => (o?.stay ? say(text) : setDone(text))} />;
}
