"use client";

// Prospects, for sales: one list split into New (need a call), Tours this week, Event sign-ups and Everyone. Choosing a
// name opens a side panel with what they wrote, what Kinlight sent them automatically (on a phone: the instant reply
// text and email after an inquiry, the tour confirmation and the day-before reminder, or the thank-you after a public
// event sign-up), staff notes and a Call button. Open house sign-ups from the website in this browser join the list.
// Every change confirms at the bottom of the screen, with Undo, and stays in this browser.
import { useMemo, useState, useSyncExternalStore } from "react";
import { Icon } from "../Icon";
import { MailMessage, Phone, SmsThread } from "../phone/Phone";
import { Drawer } from "./portal/Drawer";
import { Tours, outcomeTone, type Outcome, type TourRow } from "./portal/Sales";
import { signupMessages, type ProspectCtx, type ProspectMessage } from "./prospects";
import { say } from "./store";
import { Badge } from "./ui";

export type ProspectStatus = "New" | "Contacted" | "Tour booked";

export interface Prospect {
  id: string;
  kind: "inquiry" | "signup" | "tour";
  name: string;
  source: string;
  interest: string;
  status: ProspectStatus;
  when: string;
  /** What they wrote to us: the inquiry itself, or what they put on the sign-up form. */
  wrote?: string;
  /** Staff notes already on file. */
  notes: string[];
  phone?: string;
  email?: string;
  /** Their tour, when one is booked ("Tour today at 2:00 pm"). */
  tour?: string;
  msgs: ProspectMessage[];
  fresh?: boolean;
}

const statusTone = { New: "accent", Contacted: "info", "Tour booked": "good" } as const;
const first = (n: string) => n.replace(/^The /, "").replace(/&.*$/, "").trim().split(" ")[0];
const tel = (p: string) => `tel:+1${p.replace(/\D/g, "")}`;
const nowStamp = () => new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).replace(" AM", " am").replace(" PM", " pm");

/* ------------------------------------------------------------ open house sign-ups from the public website (this browser) */

interface WebSignup { slug: string; eventId: string; eventTitle: string; date: string; start: number; name: string; phone: string; email: string; party: number; at: number }

const KEY = "wh-public-signups";
const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  window.addEventListener("focus", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("focus", cb);
  };
};
const read = () => {
  try {
    return localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
};
const stamp = (at: number) =>
  new Date(at).toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" }).replace(" AM", " am").replace(" PM", " pm");

/* ------------------------------------------------------------ the list */

type Tab = "new" | "tours" | "signups" | "all";
interface Note { id: number; text: string; at: string }
let noteSeq = 0;

export function ProspectInbox({ prospects, tours, slug, ctx }: { prospects: Prospect[]; tours: TourRow[]; slug: string; ctx: ProspectCtx }) {
  const raw = useSyncExternalStore(subscribe, read, () => "[]");
  const fresh = useMemo<Prospect[]>(() => {
    try {
      const list = JSON.parse(raw);
      if (!Array.isArray(list)) return [];
      return (list as WebSignup[])
        .filter((x) => x && x.slug === slug && x.name && x.eventTitle)
        .sort((a, b) => b.at - a.at)
        .map((x) => ({
          id: `web-${x.at}-${x.name}`,
          kind: "signup" as const,
          name: x.name,
          source: "Website: Open House sign-up",
          interest: x.eventTitle,
          status: "New" as const,
          when: `Signed up ${stamp(x.at)}`,
          wrote: x.party > 1 ? `Party of ${x.party}` : "Coming alone",
          notes: [],
          phone: x.phone || undefined,
          email: x.email || undefined,
          msgs: signupMessages(ctx, { name: x.name, eventTitle: x.eventTitle, date: x.date, start: x.start, party: x.party, at: stamp(x.at) }),
          fresh: true,
        }));
    } catch {
      return [];
    }
  }, [raw, slug, ctx]);

  const all = useMemo(() => [...fresh, ...prospects], [fresh, prospects]);
  const [tab, setTab] = useState<Tab>("new");
  const [openId, setOpenId] = useState<string | null>(null);
  const [statusOf, setStatusOf] = useState<Record<string, ProspectStatus>>({});
  const [outcome, setOutcome] = useState<Record<string, Outcome>>({});
  const [notes, setNotes] = useState<Record<string, Note[]>>({});

  const status = (p: Prospect) => statusOf[p.id] ?? p.status;
  const outcomeOf = (p: Prospect) => outcome[tours.find((t) => t.person === p.id)?.id ?? ""];
  const lists: Record<Tab, Prospect[]> = {
    new: all.filter((p) => p.kind === "inquiry" && status(p) === "New"),
    tours: [],
    signups: all.filter((p) => p.kind === "signup"),
    all,
  };
  const count: Record<Tab, number> = { new: lists.new.length, tours: tours.length, signups: lists.signups.length, all: all.length };
  const tabs: [Tab, string][] = [["new", "New (need a call)"], ["tours", "Tours this week"], ["signups", "Event sign-ups"], ["all", "Everyone"]];

  /* ---------- actions: each one confirms, with Undo */

  const setStatus = (id: string, to: ProspectStatus | undefined) =>
    setStatusOf((x) => {
      const n = { ...x };
      if (to) n[id] = to;
      else delete n[id];
      return n;
    });
  const markContacted = (p: Prospect, calling = false) => {
    const before = statusOf[p.id];
    setStatus(p.id, "Contacted");
    say(calling ? `Calling ${first(p.name)} · Marked as contacted` : `Marked ${first(p.name)} as contacted`, () => setStatus(p.id, before));
  };
  const call = (p: Prospect) => {
    if (status(p) === "New") window.setTimeout(() => markContacted(p, true), 400);
  };
  const recordOutcome = (t: TourRow, o: Outcome) => {
    setOutcome((x) => ({ ...x, [t.id]: o }));
    say(`${first(t.who)}’s tour: ${o}`, () =>
      setOutcome((x) => {
        const n = { ...x };
        delete n[t.id];
        return n;
      }),
    );
  };
  const addNote = (p: Prospect, text: string) => {
    const n: Note = { id: ++noteSeq, text, at: `Today, ${nowStamp()}` };
    setNotes((x) => ({ ...x, [p.id]: [...(x[p.id] ?? []), n] }));
    say("Note added", () => setNotes((x) => ({ ...x, [p.id]: (x[p.id] ?? []).filter((y) => y.id !== n.id) })));
  };

  const open = all.find((p) => p.id === openId);

  return (
    <div className="pq">
      <div className="sx-tabs pq-tabs" role="tablist" aria-label="Prospects">
        {tabs.map(([k, label]) => (
          <button key={k} type="button" role="tab" id={`pq-tab-${k}`} aria-controls="pq-panel" aria-selected={tab === k} onClick={() => setTab(k)}>
            {label} <span className="pq-count">{count[k]}</span>
          </button>
        ))}
      </div>

      <div className="pq-panel" id="pq-panel" role="tabpanel" aria-labelledby={`pq-tab-${tab}`}>
        {tab === "tours" ? (
          <div className="pq-tours">
            <Tours tours={tours} out={outcome} onOutcome={recordOutcome} onOpen={setOpenId} />
          </div>
        ) : lists[tab].length ? (
          <ul className="pq-list">
            {lists[tab].map((p) => {
              const st = status(p);
              const o = outcomeOf(p);
              return (
                <li key={p.id}>
                  <button type="button" className="pq-row" onClick={() => setOpenId(p.id)} aria-label={`Open ${p.name}`}>
                    <span className="pq-top">
                      <b>{p.name}</b>
                      {o ? <Badge tone={outcomeTone(o)}>{o}</Badge> : <Badge tone={statusTone[st]}>{st}</Badge>}
                    </span>
                    <span className="pq-sub">{p.interest} · {p.source}</span>
                    {p.wrote && <span className="pq-snip">“{p.wrote}”</span>}
                    <small>{p.tour ?? p.when}</small>
                  </button>
                  <span className="pq-acts">
                    {p.phone && <a className="sx-btn sx-btn-sm" href={tel(p.phone)} onClick={() => call(p)}><Icon name="phone" /> Call</a>}
                    {st === "New" && <button type="button" className="sx-btn sx-btn-sm" onClick={() => markContacted(p)}><Icon name="check" /> Mark as contacted</button>}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="sx-empty pq-empty">{tab === "new" ? "No one is waiting for a call." : "No sign-ups yet."}</p>
        )}
      </div>

      {open && (
        <PersonPanel
          key={open.id}
          p={open}
          status={status(open)}
          outcome={outcomeOf(open)}
          notes={notes[open.id] ?? []}
          ctx={ctx}
          onClose={() => setOpenId(null)}
          onCall={() => call(open)}
          onContacted={() => markContacted(open)}
          onNote={(text) => addNote(open, text)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------ one person: messages, notes and a Call button */

function PersonPanel({ p, status, outcome, notes, ctx, onClose, onCall, onContacted, onNote }: {
  p: Prospect; status: ProspectStatus; outcome?: Outcome; notes: Note[]; ctx: ProspectCtx;
  onClose: () => void; onCall: () => void; onContacted: () => void; onNote: (text: string) => void;
}) {
  const [view, setView] = useState<"text" | "email">("text");
  const [draft, setDraft] = useState("");
  const texts = p.msgs.filter((m) => m.channel === "Text");
  const email = p.msgs.find((m) => m.channel === "Email");
  const initials = ctx.site.split(" ").map((w) => w[0]).join("").slice(0, 2);

  return (
    <Drawer title={p.name} sub={`${p.interest} · ${p.source}`} onClose={onClose} wide>
      <div className="pq-d">
        <div className="pq-d-head">
          {outcome ? <Badge tone={outcomeTone(outcome)}>{outcome}</Badge> : <Badge tone={statusTone[status]}>{status}</Badge>}
          <span>{p.when}</span>
          {p.tour && <span>{p.tour}</span>}
        </div>
        <div className="pt-act">
          {p.phone ? (
            <a className="sx-btn sx-btn-primary" href={tel(p.phone)} onClick={onCall}><Icon name="phone" /> Call {p.phone}</a>
          ) : (
            <span className="sx-hint">No phone number on file</span>
          )}
          {p.email && <a className="sx-btn" href={`mailto:${p.email}`}><Icon name="mail" /> Email</a>}
          {status === "New" && <button type="button" className="sx-btn" onClick={onContacted}><Icon name="check" /> Mark as contacted</button>}
        </div>

        <section className="pq-d-sec" aria-labelledby="pq-msgs">
          <h3 id="pq-msgs">Messages</h3>
          {p.wrote && (
            <div className="pq-wrote">
              <small>{p.kind === "signup" ? "On the sign-up form" : `${first(p.name)} wrote`}</small>
              <p>“{p.wrote}”</p>
            </div>
          )}
          <div className="pq-phone">
            <div className="sx-seg" role="group" aria-label="Show">
              <button type="button" aria-pressed={view === "text"} onClick={() => setView("text")}>Texts ({texts.length})</button>
              <button type="button" aria-pressed={view === "email"} onClick={() => setView("email")} disabled={!email}>Email</button>
            </div>
            <Phone size="sm" time="9:41" label={`What ${p.name} received`}>
              {view === "email" && email ? (
                <MailMessage from={ctx.site} address={`hello@${ctx.domain}`} to={p.name} subject={email.subject ?? ""} time={email.at}>
                  <div className="ph-em">
                    <div className="ph-em-banner">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/img/brand/dots.png" alt="" />
                      {ctx.site}
                    </div>
                    {email.text.split("\n\n").map((para, i) => <p key={i} className="ph-em-p" style={{ whiteSpace: "pre-line" }}>{para}</p>)}
                    <span className="ph-em-btn">Book a tour</span>
                    <p className="ph-em-foot">{ctx.site} · {ctx.address} · {ctx.phone}</p>
                  </div>
                </MailMessage>
              ) : (
                <SmsThread name={ctx.site} sub={ctx.phone} initials={initials} bubbles={texts.map((m) => ({ time: m.at, text: m.text }))} />
              )}
            </Phone>
            <p className="sx-hint">Sent automatically by Kinlight</p>
          </div>
        </section>

        <section className="pq-d-sec" aria-labelledby="pq-notes">
          <h3 id="pq-notes">Notes</h3>
          {p.notes.length || notes.length ? (
            <ul className="pq-notes">
              {p.notes.map((n) => <li key={n}>{n}</li>)}
              {notes.map((n) => <li key={n.id}>{n.text}<small>{n.at}</small></li>)}
            </ul>
          ) : (
            <p className="sx-hint">No notes yet.</p>
          )}
          <form
            className="sx-form pq-note-add"
            onSubmit={(ev) => {
              ev.preventDefault();
              if (!draft.trim()) return;
              onNote(draft.trim());
              setDraft("");
            }}
          >
            <label><span className="vh">New note</span><textarea rows={2} value={draft} onChange={(ev) => setDraft(ev.target.value)} placeholder="How the call went, what to send next" /></label>
            <div className="pt-act"><button type="submit" className="sx-btn sx-btn-sm sx-btn-primary" disabled={!draft.trim()}><Icon name="plus" /> Add note</button></div>
          </form>
          <p className="sx-hint">Leave out health and personal details.</p>
        </section>
      </div>
    </Drawer>
  );
}
