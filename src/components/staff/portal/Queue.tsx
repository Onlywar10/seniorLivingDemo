"use client";

// "Needs you": everything waiting on the signed-in person, as cards with what they need to decide and one tap.
// The same card opens on its own from a staff text alert (/staff/card/[id]). Decisions stay in this browser only.
import Link from "next/link";
import { useState } from "react";
import type { QItem } from "@/data/staff/portal";
import { Icon } from "../../Icon";
import { Badge } from "../ui";

type Done = { tone: "good" | "warn" | "info"; text: string };
const first = (n = "") => n.split(" ")[0];
const party = (n: number) => (n === 1 ? "1 person" : `${n} people`);

const label: Record<QItem["kind"], string> = {
  post: "Approve a post",
  rsvp: "Family RSVP",
  seat: "Seat request",
  ask: "Ask in person",
  inquiry: "New inquiry",
  reply: "Family reply",
  verify: "New family member",
  stale: "Page going stale",
};
const icon: Record<QItem["kind"], Parameters<typeof Icon>[0]["name"]> = {
  post: "check", rsvp: "users", seat: "bus", ask: "users", inquiry: "phone", reply: "sms", verify: "heart", stale: "clock",
};

export function QueueList({ items, empty }: { items: QItem[]; empty: string }) {
  const [done, setDone] = useState<Record<string, Done>>({});
  const left = items.filter((q) => !done[q.id]).length;
  return (
    <section className="pt-needs" aria-labelledby="pt-needs-h">
      <header className="pt-needs-h">
        <h2 id="pt-needs-h">Needs you</h2>
        <span className={`pt-count${left ? "" : " zero"}`} aria-live="polite">{left ? `${left} waiting` : "All done"}</span>
      </header>
      {items.length === 0 && <p className="pt-empty"><Icon name="check" /> {empty}</p>}
      <ol className="pt-qlist">
        {items.map((q) => (
          <li key={q.id}>
            <QueueCard q={q} done={done[q.id]} onDone={(d) => setDone((x) => ({ ...x, [q.id]: d }))} onUndo={() => setDone((x) => { const n = { ...x }; delete n[q.id]; return n; })} />
          </li>
        ))}
      </ol>
    </section>
  );
}

export function QueueCard({ q, done, onDone, onUndo, solo = false }: { q: QItem; done?: Done; onDone: (d: Done) => void; onUndo: () => void; solo?: boolean }) {
  const [reply, setReply] = useState(q.kind === "reply" ? q.suggestion ?? "" : "");
  if (done)
    return (
      <article className={`pt-q pt-q-done ${done.tone}`} aria-label={`${label[q.kind]}: done`}>
        <Icon name={done.tone === "good" ? "check" : done.tone === "warn" ? "x" : "check"} />
        <p>{done.text}</p>
        {!solo && <button type="button" className="sx-link pt-undo" onClick={onUndo}>Undo</button>}
      </article>
    );

  const head = (title: string, sub?: string) => (
    <header className="pt-q-h">
      <span className={`pt-tag k-${q.kind}`}><Icon name={icon[q.kind]} /> {label[q.kind]}</span>
      <span className="pt-ago">{q.ago}</span>
      <h3>{title}</h3>
      {sub && <p className="pt-q-sub">{sub}</p>}
    </header>
  );

  switch (q.kind) {
    case "post":
      return (
        <article className="pt-q">
          {head(q.title, `${q.postKind} from ${q.by}, ${q.byRole}`)}
          <div className="pt-q-body">
            {q.photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="pt-q-photo" src={q.photo} alt="" />
            )}
            <div>
              <p>{q.detail}</p>
              {q.diff && (
                <p className="pt-diff"><s>{q.diff[0]}</s> <Icon name="arrow" /> <b>{q.diff[1]}</b></p>
              )}
              {q.note && <p className="pt-quote">“{q.note}”</p>}
              <p className="pt-facts">{q.channels.map((c) => <span key={c}>{c}</span>)}</p>
            </div>
          </div>
          <div className="pt-act">
            <button type="button" className="sx-btn sx-btn-primary pt-big" onClick={() => onDone({ tone: "good", text: `Approved and published: “${q.title}”. ${first(q.by)} has been told.` })}><Icon name="check" /> Approve</button>
            <button type="button" className="sx-btn pt-big" onClick={() => onDone({ tone: "warn", text: `Sent back to ${first(q.by)} with a note. Nothing went out.` })}>Send back</button>
          </div>
        </article>
      );

    case "rsvp":
    case "seat": {
      const e = q.event;
      return (
        <article className="pt-q">
          {head(
            q.kind === "rsvp" ? `${q.from} RSVPed for ${party(q.party)}` : `A seat for ${q.resident}`,
            q.kind === "rsvp" ? `${q.relation} of ${q.resident}` : `Asked by ${q.from}, ${q.relation.toLowerCase()}`,
          )}
          <p className="pt-event"><b>{e.title}</b> · {e.when} · {e.place}</p>
          <p className="pt-facts">
            <span className="good"><Icon name="check" /> {q.said}</span>
            {e.seatsLeft !== undefined && <span className={e.seatsLeft ? "" : "warn"}>{e.seatsLeft ? `${e.seatsLeft} of ${e.cap} seats left` : `Full · ${e.waitlist ?? 0} waiting`}</span>}
            <span><Icon name="translate" /> {q.lang}</span>
          </p>
          {q.note && <p className="pt-quote">“{q.note}”</p>}
          <div className="pt-act">
            <button type="button" className="sx-btn sx-btn-primary pt-big" onClick={() => onDone({ tone: "good", text: `Approved. ${first(q.from)} gets the confirmation by ${q.how} in ${q.lang}, and ${first(q.resident)} by text.` })}><Icon name="check" /> Approve</button>
            <button type="button" className="sx-btn pt-big" onClick={() => onDone({ tone: "warn", text: `Declined. ${first(q.from)} is told kindly by ${q.how}, in ${q.lang}.` })}>Decline</button>
          </div>
        </article>
      );
    }

    case "ask": {
      const e = q.event;
      const res = first(q.resident);
      return (
        <article className="pt-q">
          {head(`Ask ${q.resident}`, q.request === "rsvp" ? `${q.from} (${q.relation.toLowerCase()}) wants to bring ${party(q.party)} to ${e.title}` : `${q.from} (${q.relation.toLowerCase()}) asked for a seat for ${res} on ${e.title}`)}
          <p className="pt-event"><b>{e.title}</b> · {e.when} · {e.place}</p>
          <p className="pt-facts"><span className="warn"><Icon name="clock" /> {q.asked}</span></p>
          <p className="pt-hint">Ask {res} in person, then tap the answer. {q.from.split(" ")[0]} hears the outcome either way.</p>
          <div className="pt-act">
            <button type="button" className="sx-btn sx-btn-primary pt-big" onClick={() => onDone({ tone: "good", text: `${res} said yes. ${q.request === "rsvp" ? "RSVP approved" : "Seat confirmed"}; ${first(q.from)} is told by ${q.how} in ${q.lang}.` })}><Icon name="check" /> {res} said yes</button>
            <button type="button" className="sx-btn pt-big" onClick={() => onDone({ tone: "warn", text: `${res} said no. ${first(q.from)} gets a kind no by ${q.how}, with no reason given.` })}>{res} said no</button>
          </div>
        </article>
      );
    }

    case "inquiry":
      return (
        <article className="pt-q">
          {head(`Call ${q.name}`, `${q.interest} · ${q.source}`)}
          <p className="pt-quote">“{q.msg}”</p>
          <p className="pt-facts"><span className="good"><Icon name="check" /> {q.replied}</span></p>
          <div className="pt-act">
            <a className="sx-btn sx-btn-primary pt-big" href={`tel:+1${q.phone.replace(/\D/g, "")}`} onClick={() => window.setTimeout(() => onDone({ tone: "info", text: `Called ${q.name}. Note the outcome in Prospects.` }), 400)}><Icon name="phone" /> Call {q.phone}</a>
            <button type="button" className="sx-btn pt-big" onClick={() => onDone({ tone: "info", text: `${q.name} marked as contacted.` })}>Done</button>
          </div>
        </article>
      );

    case "reply":
      return (
        <article className="pt-q">
          {head(`${q.from} replied`, `${q.relation} of ${q.resident} · ${q.lang}`)}
          <p className="pt-quote">“{q.text}”</p>
          {q.original && <p className="pt-orig" lang={q.lang === "Spanish" ? "es" : undefined}>{q.original}</p>}
          <p className="pt-hint"><Icon name="info" /> Why it came to you: {q.why} The AI answered {q.handled} other replies this week on its own.</p>
          <label className="pt-reply">
            <span>Your reply{q.lang !== "English" ? `, sent in ${q.lang}` : ""}</span>
            <textarea rows={3} value={reply} onChange={(e) => setReply(e.target.value)} />
          </label>
          <div className="pt-act">
            <button type="button" className="sx-btn sx-btn-primary pt-big" disabled={!reply.trim()} onClick={() => onDone({ tone: "good", text: `Reply sent to ${first(q.from)}${q.lang !== "English" ? `, translated into ${q.lang}` : ""}.` })}><Icon name="send" /> Send</button>
            <button type="button" className="sx-btn pt-big" onClick={() => onDone({ tone: "info", text: `Marked done. No reply sent to ${first(q.from)}.` })}>Done</button>
          </div>
        </article>
      );

    case "verify":
      return (
        <article className="pt-q">
          {head(`Check ${q.name}`, `Says: ${q.says}`)}
          <p className="pt-facts">
            <span>{q.via}</span>
            <span className="good"><Icon name="check" /> {q.agreed}</span>
            <span><Icon name="phone" /> {q.phone}</span>
          </p>
          <p className="pt-hint">Until you check, {first(q.name)} gets community news only. Once verified, {first(q.name)} hears about {first(q.resident)} too.</p>
          <div className="pt-act">
            <button type="button" className="sx-btn sx-btn-primary pt-big" onClick={() => onDone({ tone: "good", text: `${q.name} verified. ${first(q.name)} now hears about ${first(q.resident)}.` })}><Icon name="check" /> Verify</button>
            <button type="button" className="sx-btn pt-big" onClick={() => onDone({ tone: "warn", text: `Not verified. ${q.name} keeps community news only.` })}>Not family</button>
          </div>
        </article>
      );

    case "stale":
      return (
        <article className="pt-q">
          {head(`${q.page} page going stale`, q.due)}
          <p>{q.detail}</p>
          <div className="pt-act">
            <Link className="sx-btn sx-btn-primary pt-big" href={q.href}><Icon name="upload" /> Update it</Link>
            <button type="button" className="sx-btn pt-big" onClick={() => onDone({ tone: "info", text: `${q.page}: reminder cleared for today.` })}>Done</button>
          </div>
        </article>
      );
  }
}

/** The card on its own, opened from a staff text alert. */
export function SoloCard({ q }: { q: QItem }) {
  const [done, setDone] = useState<Done | undefined>();
  return (
    <>
      <QueueCard q={q} solo done={done} onDone={setDone} onUndo={() => setDone(undefined)} />
      {done && (
        <p className="pt-solo-next">
          <Badge tone="good">Done</Badge> <Link className="sx-link" href="/staff/today">See everything else waiting for you</Link>
        </p>
      )}
    </>
  );
}
