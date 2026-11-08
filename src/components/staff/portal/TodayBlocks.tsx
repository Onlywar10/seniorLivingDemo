"use client";

// The blocks on Today besides "Needs you": what Kinlight prepared to check, today's activities (QR check-ins so far,
// Take attendance, and Add photos when one ends), Something changed, Celebrations, We haven't seen lately, and the
// welcome checklist for new residents. Everything stays in this browser.
import Link from "next/link";
import { useState } from "react";
import type { Celebration, TodayActivity, Unseen, Welcome } from "@/data/staff/engage";
import type { QItem } from "@/data/staff/portal";
import { Icon } from "../../Icon";
import { TakeAttendance } from "../alpha/Attendance";
import { Badge } from "../ui";
import { Drawer } from "./Drawer";
import { ReviewCard } from "./Queue";

const first = (n = "") => n.split(" ")[0];
type Done = { tone: "good" | "warn" | "info"; text: string };

/* ------------------------------------------------------------ ready to review */

export function ReadyToReview({ items }: { items: Extract<QItem, { kind: "review" }>[] }) {
  const [done, setDone] = useState<Record<string, Done>>({});
  if (!items.length) return null;
  return (
    <section className="pt-block" aria-labelledby="pt-rv-h">
      <header className="pt-block-h">
        <h2 id="pt-rv-h">Ready to review</h2>
        <p>Kinlight prepared these. Open one, change anything, or tap “Looks good”.</p>
      </header>
      <ol className="pt-qlist">
        {items.map((q) => (
          <li key={q.id}><ReviewCard r={q.r} done={done[q.id]} onDone={(d) => setDone((x) => ({ ...x, [q.id]: d }))} /></li>
        ))}
      </ol>
    </section>
  );
}

/* ------------------------------------------------------------ today's activities */

export function Activities({ events, attendance, photos }: { events: TodayActivity[]; attendance: boolean; photos: boolean }) {
  const [open, setOpen] = useState<TodayActivity | null>(null);
  const [saved, setSaved] = useState<Record<string, number>>({});
  const ended = events.filter((e) => e.justEnded).slice(-1)[0] ?? events.filter((e) => e.state === "done").slice(-1)[0];
  return (
    <section className="sx-card pt-sched" aria-labelledby="pt-sched-h">
      <header className="sx-card-head">
        <div>
          <h2 id="pt-sched-h">Today’s activities</h2>
          <p>{events.length} activities. {attendance ? "Residents with a phone check themselves in by scanning the QR sign; tap in everyone else." : "What’s on today, to mention on a tour."}</p>
        </div>
      </header>
      {photos && ended && (
        <div className="pt-justended">
          <Icon name="image" />
          <p><b>{ended.title} just finished.</b> Add photos? Kinlight suggests the {ended.came.length} people who came for tagging.</p>
          <Link className="sx-btn sx-btn-primary sx-btn-sm" href={`/staff/post?type=photos&event=${encodeURIComponent(ended.id)}`}><Icon name="upload" /> Add photos</Link>
        </div>
      )}
      <ol className="pt-sched-list pt-acts">
        {events.map((e) => {
          const n = saved[e.id] ?? (e.recorded ? e.qr + e.tapped : undefined);
          return (
            <li key={e.id} className={e.state}>
              <time>{e.time}</time>
              <span className="pt-sched-t">
                <b>{e.title}</b>
                <small>
                  {e.place}
                  {e.kind !== "resident" ? ` · ${e.kind === "public" ? "Public" : "Family"} event` : ""}
                  {e.cap ? ` · ${e.taken ?? 0} of ${e.cap} booked` : ""}
                </small>
                {attendance && e.state !== "later" && !e.lantern && (
                  <small className="pt-qr"><Icon name="grid" /> {e.qr} checked themselves in by QR{e.tapped ? ` · ${e.tapped} tapped in by staff` : ""}</small>
                )}
                {e.invites && e.state === "later" && <small className="pt-inv"><Icon name="spark" /> Invited {e.invites.invited} who like {e.invites.interests[0].toLowerCase()} · {e.invites.yes} said yes</small>}
                {e.reminder && e.state === "later" && <small className="pt-inv"><Icon name="bell" /> {e.reminder}</small>}
              </span>
              <span className="pt-sched-a">
                {e.state === "now" && <Badge tone="good">On now</Badge>}
                {attendance && e.state === "done" && n === undefined && <Badge tone="warn">Attendance not taken</Badge>}
                {attendance && (n !== undefined ? (
                  <span className="pt-came"><Icon name="check" /> {n} came</span>
                ) : (
                  <button type="button" className="sx-btn sx-btn-sm" onClick={() => setOpen(e)} aria-label={`Take attendance: ${e.title}, ${e.time}`}>
                    <Icon name="users" /> Take attendance
                  </button>
                ))}
                {photos && e.state === "done" && (
                  <Link className="sx-btn sx-btn-sm sx-btn-quiet" href={`/staff/post?type=photos&event=${encodeURIComponent(e.id)}`} aria-label={`Add photos: ${e.title}`}><Icon name="image" /> Photos</Link>
                )}
              </span>
            </li>
          );
        })}
        {events.length === 0 && <li className="pt-empty">Nothing on the calendar today.</li>}
      </ol>
      <p className="sx-hint pt-beta"><Badge tone="neutral">Coming in Beta</Badge> Today’s activities and menus on the lobby TVs.</p>
      {open && (
        <Drawer title="Take attendance" sub={`${open.title} · ${open.time} · ${open.place}`} onClose={() => setOpen(null)}>
          <TakeAttendance
            activities={[{ id: open.id, title: open.title, when: open.time, place: open.place, pool: open.pool, expected: open.expected }]}
            qr={open.lantern ? [] : open.came.slice(0, open.qr)}
            onSaved={(n) => setSaved((s) => ({ ...s, [open.id]: n }))}
          />
        </Drawer>
      )}
    </section>
  );
}

/* ------------------------------------------------------------ something changed */

type Change = "moved" | "room" | "late" | "cancelled";
const changeLabel: Record<Change, string> = { moved: "Moved", room: "New room", late: "Running late", cancelled: "Cancelled" };

export function SomethingChanged({ events, rooms, community, phone }: { events: TodayActivity[]; rooms: string[]; community: string; phone: string }) {
  // What's still to come today, then tomorrow's activities, so a change can always be sent ahead.
  const left = events.filter((e) => e.state !== "done");
  const [open, setOpen] = useState(false);
  const [id, setId] = useState(left[0]?.id ?? "");
  const [what, setWhat] = useState<Change>("late");
  const [mins, setMins] = useState("15");
  const [time, setTime] = useState("15:00");
  const [room, setRoom] = useState(rooms[0] ?? "");
  const [sent, setSent] = useState<string | null>(null);
  const e = left.find((x) => x.id === id);
  if (!left.length) return null;
  const fmt = (t: string) => { const [h, m] = t.split(":").map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`; };
  const line = !e ? "" :
    what === "late" ? `${e.title} is running about ${mins} minutes late ${e.day.toLowerCase()}. Same place: ${e.place}.` :
    what === "moved" ? `${e.title} now starts at ${fmt(time)} ${e.day.toLowerCase()}, in ${e.place}.` :
    what === "room" ? `${e.title} at ${e.time} has moved to ${room} ${e.day.toLowerCase()}.` :
    `${e.title} at ${e.time} is cancelled ${e.day.toLowerCase()}. We’re sorry. Questions? Call ${phone}.`;
  const booked = e ? (e.cap ? e.taken ?? 0 : e.invites?.yes ?? Math.round(e.expected * 0.6)) : 0;
  const families = Math.round(booked * 1.4);
  return (
    <section className="sx-card pt-changed" aria-labelledby="pt-chg-h">
      <header className="sx-card-head">
        <div>
          <h2 id="pt-chg-h">Something changed?</h2>
          <p>Moved, a new room, running late or cancelled. It goes to everyone booked and updates the website.</p>
        </div>
        {!open && !sent && <button type="button" className="sx-btn sx-btn-terra" onClick={() => setOpen(true)}><Icon name="alert" /> Something changed</button>}
      </header>
      {sent && (
        <div className="sx-card-body">
          <div className="sx-callout good" role="status">
            <Icon name="check" />
            <div>
              <p><b>Sent.</b> “{sent}”</p>
              <ul className="pt-reach">
                <li><Icon name="sms" /> {booked} residents booked on it, by text, email or a note under the door</li>
                <li><Icon name="users" /> {families} family members with their resident booked, in their own language</li>
                <li><Icon name="globe" /> The website calendar and the {community} home page</li>
                <li><Icon name="printer" /> The front desk has the notice to read out</li>
              </ul>
            </div>
          </div>
          <button type="button" className="sx-btn" onClick={() => { setSent(null); setOpen(true); }}>Another change</button>
        </div>
      )}
      {open && !sent && (
        <form className="sx-card-body sx-form pt-chg-form" onSubmit={(ev) => { ev.preventDefault(); setSent(line); setOpen(false); }}>
          <label>Which activity?
            <select value={id} onChange={(x) => setId(x.target.value)}>{left.map((x) => <option key={x.id} value={x.id}>{x.day} {x.time} · {x.title}</option>)}</select>
          </label>
          <div className="sx-seg" role="group" aria-label="What changed">
            {(Object.keys(changeLabel) as Change[]).map((k) => <button key={k} type="button" aria-pressed={what === k} onClick={() => setWhat(k)}>{changeLabel[k]}</button>)}
          </div>
          {what === "late" && <label>About how late?<select value={mins} onChange={(x) => setMins(x.target.value)}>{["10", "15", "20", "30", "45"].map((m) => <option key={m} value={m}>{m} minutes</option>)}</select></label>}
          {what === "moved" && <label>New time<input type="time" value={time} onChange={(x) => setTime(x.target.value)} step={300} /></label>}
          {what === "room" && <label>New room<select value={room} onChange={(x) => setRoom(x.target.value)}>{rooms.map((r) => <option key={r}>{r}</option>)}</select></label>}
          <p className="pt-chg-line"><Icon name="spark" /> Kinlight will send: “{line}”</p>
          <p className="sx-hint">To {booked} residents booked and {families} family members. No approval needed.</p>
          <div className="pt-act">
            <button type="submit" className="sx-btn sx-btn-terra pt-big"><Icon name="send" /> Send the change</button>
            <button type="button" className="sx-btn pt-big" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      )}
    </section>
  );
}

/* ------------------------------------------------------------ celebrations */

const celIcon = { birthday: "star", welcome: "heart", anniversary: "sparkle" } as const;
const celLabel = { birthday: "Birthday", welcome: "Welcome", anniversary: "Staff anniversary" } as const;

export function Celebrations({ items }: { items: Celebration[] }) {
  const [state, setState] = useState<Record<string, "posted" | "skipped">>({});
  const [text, setText] = useState<Record<string, string>>(() => Object.fromEntries(items.map((c) => [c.id, c.line])));
  if (!items.length) return null;
  return (
    <section className="sx-card" aria-labelledby="pt-cel-h">
      <header className="sx-card-head">
        <div>
          <h2 id="pt-cel-h">Celebrations</h2>
          <p>Kinlight wrote a line for each, with consent checked. One tap to post.</p>
        </div>
      </header>
      <ul className="pt-cel">
        {items.map((c) => (
          <li key={c.id} className={state[c.id] ?? ""}>
            <span className="pt-cel-i"><Icon name={celIcon[c.kind]} /></span>
            <div>
              <p className="pt-cel-h"><b>{c.who}</b> <small>{celLabel[c.kind]} · {c.when}</small></p>
              {state[c.id] ? (
                <p className="sx-hint">{state[c.id] === "posted" ? <><Icon name="check" /> Posted to the website, the newsletter and the lobby notice.</> : "Skipped."}</p>
              ) : (
                <>
                  <textarea rows={2} value={text[c.id]} onChange={(e) => setText((t) => ({ ...t, [c.id]: e.target.value }))} aria-label={`Celebration line for ${c.who}`} />
                  <p className={`pt-cel-c ${c.consent}`}><Icon name={c.consent === "none" ? "alert" : "check"} /> {c.note}</p>
                  <div className="pt-act">
                    <button type="button" className="sx-btn sx-btn-primary sx-btn-sm" onClick={() => setState((s) => ({ ...s, [c.id]: "posted" }))}><Icon name="send" /> Post</button>
                    <button type="button" className="sx-btn sx-btn-sm" onClick={() => setState((s) => ({ ...s, [c.id]: "skipped" }))}>Skip</button>
                  </div>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------ we haven't seen lately */

export function NotSeen({ items, me }: { items: Unseen[]; me: string }) {
  const [done, setDone] = useState<Record<string, string>>({});
  const [visit, setVisit] = useState<string | null>(null);
  const [note, setNote] = useState("");
  if (!items.length) return null;
  return (
    <section className="sx-card" aria-labelledby="pt-seen-h">
      <header className="sx-card-head">
        <div>
          <h2 id="pt-seen-h">We haven’t seen lately</h2>
          <p>No activities in two weeks. For staff only: families are never told automatically.</p>
        </div>
      </header>
      <ul className="pt-seen">
        {items.map((u) => (
          <li key={u.name}>
            <div className="pt-seen-t">
              <b>{u.name}</b>
              <small>Last came {u.days} days ago, to {u.lastActivity} · Likes {u.interests.join(", ").toLowerCase()}{u.visits ? ` · ${u.visits} 1:1 visit${u.visits === 1 ? "" : "s"} this month` : ""}</small>
            </div>
            {done[u.name] ? (
              <p className="pt-seen-done"><Icon name="check" /> {done[u.name]}</p>
            ) : visit === u.name ? (
              <form className="sx-form pt-visit" onSubmit={(e) => { e.preventDefault(); setDone((d) => ({ ...d, [u.name]: `1:1 visit logged${note ? `: “${note}”` : ""}. Counted in Reports.` })); setVisit(null); setNote(""); }}>
                <label>What did you do together? <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Looked at old photos" /></label>
                <div className="pt-act">
                  <button type="submit" className="sx-btn sx-btn-primary sx-btn-sm">Log visit</button>
                  <button type="button" className="sx-btn sx-btn-sm" onClick={() => setVisit(null)}>Cancel</button>
                </div>
              </form>
            ) : (
              <div className="pt-act">
                {u.next && (
                  <button type="button" className="sx-btn sx-btn-primary sx-btn-sm" title={`“${u.next.title} ${u.next.when}. We’d love to see you there, ${first(u.name)}. Reply YES for a seat. ${first(me)}”`} onClick={() => setDone((d) => ({ ...d, [u.name]: `Personal invite sent from you: “${u.next!.title}, ${u.next!.when}. We’d love to see you there, ${first(u.name)}. Reply YES for a seat.”` }))}>
                    <Icon name="sms" /> Invite to {u.next.title}
                  </button>
                )}
                <button type="button" className="sx-btn sx-btn-sm" onClick={() => setDone((d) => ({ ...d, [u.name]: `Noted: you dropped by today.` }))}>I dropped by</button>
                <button type="button" className="sx-btn sx-btn-sm" onClick={() => setVisit(u.name)}>Log a 1:1 visit</button>
              </div>
            )}
          </li>
        ))}
      </ul>
      <p className="sx-hint pt-beta"><Badge tone="neutral">Coming in Beta</Badge> Automatic invites to residents who haven’t been out, without staff.</p>
    </section>
  );
}

/* ------------------------------------------------------------ welcome checklist */

export function WelcomeList({ items }: { items: Welcome[] }) {
  if (!items.length) return null;
  return (
    <section className="sx-card" aria-labelledby="pt-wel-h">
      <header className="sx-card-head">
        <div>
          <h2 id="pt-wel-h">Welcome checklist</h2>
          <p>New residents stay here until their welcome is finished.</p>
        </div>
      </header>
      <ul className="pt-wel">
        {items.map((w) => {
          const n = w.steps.filter((s) => s.done).length;
          const next = w.steps.find((s) => !s.done);
          return (
            <li key={w.name}>
              <div className="pt-wel-t">
                <b>{w.name}</b>
                <small>Apt {w.apt} · moved in {w.movedIn}</small>
                <span className="pt-wel-bar" aria-label={`${n} of ${w.steps.length} done`}><i style={{ width: `${(n / w.steps.length) * 100}%` }} /></span>
                <small>{n} of {w.steps.length} done{next ? ` · Next: ${next.label.toLowerCase()}` : ""}</small>
              </div>
              <Link className="sx-btn sx-btn-sm sx-btn-primary" href={`/staff/people?welcome=${encodeURIComponent(w.name)}`}>Finish the welcome</Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
