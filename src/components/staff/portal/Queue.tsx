"use client";

// "Needs you": everything waiting on the signed-in person, as cards with what they need to decide and one tap.
// Similar items are grouped ("6 barbecue RSVPs, residents all said yes: approve all"), with a filter by kind.
// The same card opens on its own from a staff text alert (/staff/card/[id]). Decisions stay in this browser only.
import Link from "next/link";
import { useMemo, useState } from "react";
import type { QItem } from "@/data/staff/portal";
import { Icon } from "../../Icon";
import { Badge } from "../ui";

type Done = { tone: "good" | "warn" | "info"; text: string };
type Kind = QItem["kind"];
type Rsvp = Extract<QItem, { kind: "rsvp" | "seat" }>;
const first = (n = "") => n.split(" ")[0];
const party = (n: number) => (n === 1 ? "1 person" : `${n} people`);

const label: Record<Kind, string> = {
  post: "Approve a post",
  rsvp: "Family RSVP",
  seat: "Seat request",
  ask: "Ask in person",
  inquiry: "New inquiry",
  reply: "Reply for you",
  verify: "New family member",
  stale: "Page going stale",
  concern: "Family concern",
  review: "Ready to review",
};
const icon: Record<Kind, Parameters<typeof Icon>[0]["name"]> = {
  post: "check", rsvp: "users", seat: "bus", ask: "users", inquiry: "phone", reply: "sms", verify: "heart", stale: "clock", concern: "alert", review: "eye",
};

/** The filter a card belongs to. */
const filterOf = (k: Kind) => (k === "rsvp" || k === "seat" || k === "ask" ? "requests" : k === "post" ? "approvals" : k === "reply" || k === "concern" ? "replies" : "other");
const filterLabel: Record<string, string> = { all: "All", requests: "Family requests", approvals: "Posts to approve", replies: "Replies and concerns", other: "Other" };

type Row = { kind: "one"; q: QItem } | { kind: "group"; id: string; items: Rsvp[] };

/** Groups three or more RSVPs for the same event that residents have all said yes to, unless it's full. */
function group(items: QItem[]): Row[] {
  const byEvent = new Map<string, Rsvp[]>();
  items.forEach((q) => { if (q.kind === "rsvp" && !q.full) byEvent.set(q.event.id, [...(byEvent.get(q.event.id) ?? []), q]); });
  const grouped = new Set([...byEvent.values()].filter((g) => g.length >= 3).flat().map((q) => q.id));
  const rows: Row[] = [];
  const seen = new Set<string>();
  for (const q of items) {
    if (!grouped.has(q.id)) { rows.push({ kind: "one", q }); continue; }
    const ev = (q as Rsvp).event.id;
    if (seen.has(ev)) continue;
    seen.add(ev);
    rows.push({ kind: "group", id: `group-${ev}`, items: byEvent.get(ev)! });
  }
  return rows;
}

export function QueueList({ items, empty, reviews = 0 }: { items: QItem[]; empty: string; /** Things to review, counted in the one waiting number. */ reviews?: number }) {
  const [done, setDone] = useState<Record<string, Done>>({});
  const [f, setF] = useState("all");
  const left = items.filter((q) => !done[q.id]).length + reviews;
  const filters = useMemo(() => ["all", ...["requests", "approvals", "replies", "other"].filter((k) => items.some((q) => filterOf(q.kind) === k))], [items]);
  const rows = group(items.filter((q) => f === "all" || filterOf(q.kind) === f));
  const mark = (id: string, d: Done) => setDone((x) => ({ ...x, [id]: d }));
  const undo = (id: string) => setDone((x) => { const n = { ...x }; delete n[id]; return n; });
  return (
    <section className="pt-needs" aria-labelledby="pt-needs-h">
      <header className="pt-needs-h">
        <h2 id="pt-needs-h">Needs you</h2>
        <span className={`pt-count${left ? "" : " zero"}`} aria-live="polite">{left ? `${left} waiting` : "All done"}</span>
      </header>
      {filters.length > 2 && (
        <div className="sx-chips pt-qfilter" role="group" aria-label="Show">
          {filters.map((k) => (
            <button key={k} type="button" aria-pressed={f === k} onClick={() => setF(k)}>
              {filterLabel[k]} <small>{k === "all" ? items.length : items.filter((q) => filterOf(q.kind) === k).length}</small>
            </button>
          ))}
        </div>
      )}
      {items.length === 0 && <p className="pt-empty"><Icon name="check" /> {empty}</p>}
      <ol className="pt-qlist">
        {rows.map((r) =>
          r.kind === "one" ? (
            <li key={r.q.id}>
              <QueueCard q={r.q} done={done[r.q.id]} onDone={(d) => mark(r.q.id, d)} onUndo={() => undo(r.q.id)} />
            </li>
          ) : (
            <li key={r.id}>
              <GroupCard items={r.items} done={done} onDone={mark} onUndo={undo} />
            </li>
          ),
        )}
      </ol>
    </section>
  );
}

/** Several RSVPs for one event, residents all said yes: approve them together, or open them one by one. */
function GroupCard({ items, done, onDone, onUndo }: { items: Rsvp[]; done: Record<string, Done>; onDone: (id: string, d: Done) => void; onUndo: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const e = items[0].event;
  const todo = items.filter((q) => !done[q.id]);
  const people = items.reduce((n, q) => n + q.party, 0);
  if (!todo.length)
    return (
      <article className="pt-q pt-q-done good">
        <Icon name="check" />
        <p>All {items.length} RSVPs for {e.title} are done. Each family is told by text or email, in their own language.</p>
        <button type="button" className="sx-link pt-undo" onClick={() => items.forEach((q) => onUndo(q.id))}>Undo</button>
      </article>
    );
  return (
    <article className="pt-q pt-group">
      <header className="pt-q-h">
        <span className="pt-tag k-rsvp"><Icon name="users" /> {items.length} family RSVPs</span>
        <span className="pt-ago">{items[0].ago}</span>
        <h3>{todo.length} {e.title} RSVPs, residents all said yes</h3>
        <p className="pt-q-sub">{e.when} · {e.place} · {people} people in all</p>
      </header>
      <ul className="pt-group-list">
        {items.map((q) => (
          <li key={q.id} className={done[q.id] ? "done" : undefined}>
            <span><b>{q.from}</b> <small>{q.relation} of {q.resident} · {party(q.party)}</small></span>
            {done[q.id] ? <Badge tone={done[q.id].tone === "good" ? "good" : "neutral"}>{done[q.id].tone === "good" ? "Approved" : "Declined"}</Badge> : <Badge tone="good"><Icon name="check" /> {first(q.resident)} said yes</Badge>}
          </li>
        ))}
      </ul>
      {items.some((q) => q.note) && <p className="pt-hint"><Icon name="info" /> {items.filter((q) => q.note).map((q) => `${first(q.from)}: “${q.note}”`).join(" · ")}</p>}
      <div className="pt-act">
        <button type="button" className="sx-btn sx-btn-primary pt-big" onClick={() => todo.forEach((q) => onDone(q.id, { tone: "good", text: `Approved. ${first(q.from)} is told by ${q.how} in ${q.lang}.` }))}>
          <Icon name="check" /> Approve all {todo.length}
        </button>
        <button type="button" className="sx-btn pt-big" aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? "Hide" : "One by one"}</button>
      </div>
      {open && (
        <ol className="pt-qlist pt-group-each">
          {todo.map((q) => (
            <li key={q.id}><QueueCard q={q} onDone={(d) => onDone(q.id, d)} onUndo={() => onUndo(q.id)} /></li>
          ))}
        </ol>
      )}
    </article>
  );
}

export function QueueCard({ q, done, onDone, onUndo, solo = false }: { q: QItem; done?: Done; onDone: (d: Done) => void; onUndo: () => void; solo?: boolean }) {
  const [reply, setReply] = useState(q.kind === "reply" ? q.suggestion ?? "" : "");
  const [showAI, setShowAI] = useState(false);
  if (done)
    return (
      <article className={`pt-q pt-q-done ${done.tone}`} aria-label={`${label[q.kind]}: done`}>
        <Icon name={done.tone === "warn" ? "x" : "check"} />
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
            {e.seatsLeft !== undefined && <span className={e.seatsLeft ? "" : "warn"}>{e.seatsLeft ? `${e.seatsLeft} of ${e.cap} seats left` : `Full · ${e.waitlist ?? 0} on the waitlist`}</span>}
            <span><Icon name="translate" /> {q.lang}</span>
          </p>
          {q.note && <p className="pt-quote">“{q.note}”</p>}
          {q.full ? (
            <>
              <p className="pt-hint"><Icon name="info" /> It’s full, so approving would overbook it. Add {first(q.resident)} to the waitlist: if a seat opens, it’s confirmed automatically and {first(q.from)} and {first(q.resident)} are told.</p>
              <div className="pt-act">
                <button type="button" className="sx-btn sx-btn-primary pt-big" onClick={() => onDone({ tone: "info", text: `${first(q.resident)} is number ${(e.waitlist ?? 0) + 1} on the waitlist. ${first(q.from)} is told by ${q.how}; if a seat opens it’s confirmed automatically.` })}><Icon name="list" /> Add to waitlist</button>
                <button type="button" className="sx-btn pt-big" onClick={() => onDone({ tone: "warn", text: `Declined. ${first(q.from)} is told kindly by ${q.how}, in ${q.lang}.` })}>Decline</button>
              </div>
            </>
          ) : (
            <div className="pt-act">
              <button type="button" className="sx-btn sx-btn-primary pt-big" onClick={() => onDone({ tone: "good", text: `Approved. ${first(q.from)} gets the confirmation by ${q.how} in ${q.lang}, and ${first(q.resident)} by text.` })}><Icon name="check" /> Approve</button>
              <button type="button" className="sx-btn pt-big" onClick={() => onDone({ tone: "warn", text: `Declined. ${first(q.from)} is told kindly by ${q.how}, in ${q.lang}.` })}>Decline</button>
            </div>
          )}
        </article>
      );
    }

    case "ask": {
      const e = q.event;
      const res = first(q.resident);
      const what = q.request === "rsvp" ? `${q.from} (${q.relation.toLowerCase()}) wants to bring ${party(q.party)} to ${e.title}` : `${q.from} (${q.relation.toLowerCase()}) asked for a seat for ${res} on ${e.title}`;
      return (
        <article className="pt-q">
          {head(`Ask ${q.resident}`, what)}
          <p className="pt-event"><b>{e.title}</b> · {e.when} · {e.place}</p>
          <p className="pt-facts">
            {q.lantern ? <span className="warn"><Icon name="heart" /> Lantern</span> : <span className="warn"><Icon name="clock" /> {q.asked}</span>}
          </p>
          <p className="pt-hint">
            <Icon name="info" />
            {q.lantern
              ? q.rep
                ? `${q.asked} Or ${q.rep.name} (${q.rep.relation.toLowerCase()}, legal representative) can decide.`
                : q.asked
              : `Ask ${res} in person, then tap the answer.`}{" "}
            {first(q.from)} hears the outcome either way.
          </p>
          <div className="pt-act">
            <button type="button" className="sx-btn sx-btn-primary pt-big" onClick={() => onDone({ tone: "good", text: `${res} said yes. ${q.request === "rsvp" ? "RSVP approved" : "Seat confirmed"}; ${first(q.from)} is told by ${q.how} in ${q.lang}.` })}><Icon name="check" /> {res} said yes</button>
            <button type="button" className="sx-btn pt-big" onClick={() => onDone({ tone: "warn", text: `${res} said no. ${first(q.from)} gets a kind no by ${q.how}, with no reason given.` })}>{res} said no</button>
            {q.rep && <button type="button" className="sx-btn pt-big" onClick={() => onDone({ tone: "info", text: `Asked ${q.rep!.name} by text, as ${res}’s legal representative. Their answer comes back here.` })}>Ask {first(q.rep.name)} instead</button>}
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
            <a className="sx-btn sx-btn-primary pt-big" href={`tel:+1${q.phone.replace(/\D/g, "")}`} onClick={() => window.setTimeout(() => onDone({ tone: "info", text: `Called ${q.name}. Note how it went in Prospects.` }), 400)}><Icon name="phone" /> Call {q.phone}</a>
            <button type="button" className="sx-btn pt-big" onClick={() => onDone({ tone: "info", text: `${q.name} marked as contacted.` })}>Done</button>
          </div>
        </article>
      );

    case "reply":
      return (
        <article className="pt-q">
          {head(`${q.from} wrote`, `${q.relation} of ${q.resident} · ${q.lang}`)}
          <p className="pt-quote">“{q.text}”</p>
          {q.original && <p className="pt-orig" lang={q.lang === "Spanish" ? "es" : undefined}>{q.original}</p>}
          <p className="pt-hint"><Icon name="info" /> Why it came to you: {q.why}</p>
          <label className="pt-reply">
            <span>Your reply{q.lang !== "English" ? `, sent in ${q.lang}` : ""}</span>
            <textarea rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply" />
          </label>
          {q.suggestion && (
            <p className="pt-src"><Icon name="spark" /> Kinlight drafted this only from {q.sources.join("; ")}. Change anything before you send.</p>
          )}
          {!q.suggestion && <p className="pt-src"><Icon name="info" /> No draft: nothing in the calendar or records answers this, so it’s yours to write.</p>}
          <div className="pt-act">
            <button type="button" className="sx-btn sx-btn-primary pt-big" disabled={!reply.trim()} onClick={() => onDone({ tone: "good", text: `Reply sent to ${first(q.from)}${q.lang !== "English" ? `, translated into ${q.lang}` : ""}.` })}><Icon name="send" /> Send</button>
            <button type="button" className="sx-btn pt-big" onClick={() => onDone({ tone: "info", text: `Marked done. No reply sent to ${first(q.from)}.` })}>Done</button>
          </div>
          {q.handled.length > 0 && (
            <div className="pt-ai">
              <button type="button" className="sx-link" aria-expanded={showAI} onClick={() => setShowAI((x) => !x)}>
                The AI handled {q.handled.length} replies on its own this week: see them
              </button>
              {showAI && (
                <>
                  <p className="sx-hint">Only clear answers to Kinlight’s own questions, each confirmed before anything happened. Open questions, concerns, care, health and billing always come to staff. STOP is handled without the AI.</p>
                  <ul className="pt-ai-list">
                    {q.handled.map((h, i) => (
                      <li key={i}>
                        <small>{h.ago} · {h.from}{h.relation !== "Resident" ? `, ${h.relation.toLowerCase()}` : " (resident)"}</small>
                        <span><b>Kinlight asked</b> {h.asked}</span>
                        <span><b>They replied</b> “{h.reply}”</span>
                        <span className="pt-ai-did"><Icon name="check" /> {h.did}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
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
            <Link className="sx-btn sx-btn-primary pt-big" href={q.href}><Icon name="edit" /> Update it</Link>
            <button type="button" className="sx-btn pt-big" onClick={() => onDone({ tone: "info", text: `${q.page}: reminder cleared for today.` })}>Done</button>
          </div>
        </article>
      );

    case "concern": {
      const c = q.c;
      return (
        <article className="pt-q pt-concern">
          {head(`${c.from} has a concern`, `${c.relation} of ${c.resident} · ${c.topic} · ${c.status}`)}
          <p className="pt-quote">“{c.text}”</p>
          <p className="pt-facts">
            <span className="warn"><Icon name="alert" /> Never answered by AI</span>
            <span>Owner: {c.ownerName}</span>
          </p>
          <p className="pt-hint"><Icon name="info" /> {c.how}. It stays open until someone marks it resolved.</p>
          <div className="pt-act">
            <a className="sx-btn sx-btn-primary pt-big" href="tel:" onClick={(e) => { e.preventDefault(); onDone({ tone: "info", text: `Marked “we called ${first(c.from)}”. It stays open in Feedback until it’s resolved.` }); }}><Icon name="phone" /> I called {first(c.from)}</a>
            <button type="button" className="sx-btn pt-big" onClick={() => onDone({ tone: "good", text: `Resolved. ${first(c.from)}’s concern is closed and counted in Reports.` })}>Mark resolved</button>
            <Link className="sx-btn pt-big" href="/staff/feedback">Open in Feedback</Link>
          </div>
        </article>
      );
    }

    case "review":
      return <ReviewCard r={q.r} done={done} onDone={onDone} />;
  }
}

/** Something Kinlight prepared for a person to check: open it, change it if needed, or "Looks good". */
export function ReviewCard({ r, done, onDone }: { r: Extract<QItem, { kind: "review" }>["r"]; done?: Done; onDone: (d: Done) => void }) {
  if (done) return <article className={`pt-q pt-q-done ${done.tone}`}><Icon name="check" /><p>{done.text}</p></article>;
  const ic = { newsletter: "mail", import: "calendar", menus: "fork", captions: "image" } as const;
  const after = { newsletter: "It sends Sunday at 5 pm.", import: "The events are on the calendar, the website and the printed calendar.", menus: "They publish day by day to the website, the newsletter and the large-print cards.", captions: "The photos are in the event gallery and this week’s newsletter." }[r.kind];
  return (
    <article className="pt-q pt-review">
      <header className="pt-q-h">
        <span className="pt-tag k-review"><Icon name={ic[r.kind]} /> Ready to review</span>
        <span className="pt-ago">{r.due}</span>
        <h3>{r.title}</h3>
        <p className="pt-q-sub"><Icon name="spark" /> {r.detail}</p>
      </header>
      {r.flagged > 0 && <p className="pt-facts"><span className="warn"><Icon name="alert" /> {r.flagged} to check</span></p>}
      <div className="pt-act">
        <Link className="sx-btn pt-big" href={`${r.href}${r.href.includes("?") ? "&" : "?"}from=card`}><Icon name="eye" /> Open</Link>
        <button type="button" className="sx-btn sx-btn-primary pt-big" disabled={r.flagged > 0} title={r.flagged > 0 ? "Open it to check the flagged items first" : undefined} onClick={() => onDone({ tone: "good", text: `Looks good. ${after}` })}><Icon name="check" /> Looks good</button>
      </div>
    </article>
  );
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
