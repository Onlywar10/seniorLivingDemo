"use client";

// Sign-ups & RSVPs: the queues staff work through. Decisions are kept in this browser only.
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import type { EventRef, EventRequest } from "@/data/staff/alpha";
import { Icon } from "../../Icon";
import { Badge, Initials } from "../ui";

export type Req = EventRequest & { ago: string; when: string; how: string; lang: string };

const first = (n = "") => n.split(" ")[0];
const party = (n: number) => (n === 1 ? "1 person" : `${n} people`);

/* ------------------------------------------------------------ family RSVPs */

export function FamilyRsvps({ items }: { items: Req[] }) {
  const [state, setState] = useState<Record<string, "ok" | "no">>({});
  const waiting = items.filter((r) => !state[r.id]).length;
  return (
    <section className="sx-card">
      <header className="sx-card-head">
        <div>
          <h2>Family RSVPs waiting <Badge tone={waiting ? "accent" : "good"}>{waiting ? `${waiting} waiting` : "All done"}</Badge></h2>
          <p>Families RSVP from the personal link in their text or email. Approve within 1 business day; they get a confirmation in their language.</p>
        </div>
      </header>
      <div className="sx-card-body" style={{ paddingTop: 4 }}>
        {items.length === 0 && <p className="sx-empty"><Icon name="check" /> No family RSVPs waiting.</p>}
        {items.map((r) => {
          const s = state[r.id];
          return (
            <article key={r.id} className="al-req">
              <Initials name={r.from} size={34} color="var(--sky)" />
              <div className="al-req-b">
                <p className="al-req-t"><b>{r.from}</b> <span className="sx-hint">{r.relation} of {r.resident}</span></p>
                <p className="al-req-e"><b>{r.event.title}</b> · {r.when} · {r.event.place}</p>
                <p className="al-req-m">
                  <Badge tone="info"><Icon name="users" /> {party(r.party)}</Badge>
                  <Badge tone="neutral">{r.via}</Badge>
                  <Badge tone="neutral"><Icon name="translate" /> {r.lang}</Badge>
                  <span className="sx-hint">{r.ago}</span>
                </p>
                {r.note && <p className="al-note">“{r.note}”</p>}
              </div>
              <div className="al-req-a">
                {s === "ok" ? (
                  <span className="al-done good" role="status"><Icon name="check" /> Approved · confirmation sent by {r.how} in {r.lang}</span>
                ) : s === "no" ? (
                  <span className="al-done warn" role="status"><Icon name="x" /> Declined · {first(r.from)} told by {r.how}</span>
                ) : (
                  <>
                    <button type="button" className="sx-btn sx-btn-primary sx-btn-sm" onClick={() => setState((x) => ({ ...x, [r.id]: "ok" }))}><Icon name="check" /> Approve</button>
                    <button type="button" className="sx-btn sx-btn-sm" onClick={() => setState((x) => ({ ...x, [r.id]: "no" }))}>Decline</button>
                    <span className="sx-hint">{first(r.from)} gets a confirmation by {r.how} in {r.lang}</span>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ seat requests */

type Seat = "waiting" | "checking" | "confirmed" | "declined";

export function SeatRequests({ items }: { items: Req[] }) {
  const [state, setState] = useState<Record<string, Seat>>({});
  const st = (r: Req): Seat => state[r.id] ?? r.status;
  const set = (id: string, v: Seat) => setState((x) => ({ ...x, [id]: v }));
  const open = items.filter((r) => st(r) === "waiting" || st(r) === "checking").length;
  return (
    <section className="sx-card">
      <header className="sx-card-head">
        <div>
          <h2>Seat requests from families <Badge tone={open ? "accent" : "good"}>{open ? `${open} open` : "All done"}</Badge></h2>
          <p>A family asks for a seat for their loved one. Check with the resident first, then confirm or decline. The family is told either way.</p>
        </div>
      </header>
      <div className="sx-card-body" style={{ paddingTop: 4 }}>
        {items.length === 0 && <p className="sx-empty"><Icon name="check" /> No seat requests.</p>}
        {items.map((r) => {
          const s = st(r);
          const res = first(r.resident);
          const left = (r.event.cap ?? 0) - (r.event.taken ?? 0);
          return (
            <article key={r.id} className="al-req">
              <Initials name={r.resident ?? r.from} size={34} color="var(--olive)" />
              <div className="al-req-b">
                <p className="al-req-t"><b>{r.resident}</b> <span className="sx-hint">asked by {r.from}, {r.relation?.toLowerCase()}</span></p>
                <p className="al-req-e"><b>{r.event.title}</b> · {r.when} · leaves from {r.event.place}</p>
                <p className="al-req-m">
                  <Badge tone={left > 0 ? "good" : "warn"}>{left > 0 ? `${left} seats left` : `Full · ${r.event.waitlist ?? 0} waiting`}</Badge>
                  <Badge tone="neutral"><Icon name="translate" /> {r.lang}</Badge>
                  <span className="sx-hint">{r.ago}</span>
                </p>
                {r.note && s === r.status && <p className="al-note">{r.note}</p>}
                <ol className="al-steps" aria-label="Progress">
                  <li className="done">Asked</li>
                  <li className={s === "waiting" ? "now" : "done"}>Checking with {res}</li>
                  <li className={s === "confirmed" || s === "declined" ? "done" : ""}>{s === "declined" ? "Declined" : "Confirmed"}</li>
                  <li className={s === "confirmed" || s === "declined" ? "done" : ""}>Family told</li>
                </ol>
              </div>
              <div className="al-req-a">
                {s === "waiting" && (
                  <button type="button" className="sx-btn sx-btn-primary sx-btn-sm" onClick={() => set(r.id, "checking")}><Icon name="users" /> Check with {res}</button>
                )}
                {s === "checking" && (
                  <>
                    <span className="sx-hint">Checking with {res}</span>
                    <button type="button" className="sx-btn sx-btn-primary sx-btn-sm" onClick={() => set(r.id, "confirmed")}><Icon name="check" /> {res} said yes</button>
                    <button type="button" className="sx-btn sx-btn-sm" onClick={() => set(r.id, "declined")}>{res} said no</button>
                  </>
                )}
                {s === "confirmed" && <span className="al-done good" role="status"><Icon name="check" /> Confirmed · {res} is on the list · family told by {r.how}</span>}
                {s === "declined" && <span className="al-done warn" role="status"><Icon name="x" /> Declined · family told by {r.how}</span>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ residents booked in person */

export function ResidentBookings({ items, residents, events }: { items: Req[]; residents: string[]; events: (EventRef & { when: string })[] }) {
  const [added, setAdded] = useState<{ id: string; name: string; title: string; when: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [who, setWho] = useState(residents[0] ?? "");
  const [ev, setEv] = useState(events[0]?.id ?? "");
  const book = () => {
    const e = events.find((x) => x.id === ev);
    if (!e || !who) return;
    setAdded((a) => [{ id: `${e.id}-${who}-${a.length}`, name: who, title: e.title, when: e.when }, ...a]);
    setOpen(false);
  };
  return (
    <section className="sx-card">
      <header className="sx-card-head">
        <div>
          <h2>Residents booked in person</h2>
          <p>Residents sign up with staff and go straight onto the list. No approval needed.</p>
        </div>
        <button type="button" className="sx-btn sx-btn-sm" aria-expanded={open} onClick={() => setOpen((o) => !o)}><Icon name="plus" /> Book a resident</button>
      </header>
      <div className="sx-card-body" style={{ paddingTop: 8 }}>
        {open && (
          <div className="sx-form al-book">
            <label>
              Resident
              <select value={who} onChange={(e) => setWho(e.target.value)}>
                {residents.map((n) => <option key={n}>{n}</option>)}
              </select>
            </label>
            <label>
              Activity
              <select value={ev} onChange={(e) => setEv(e.target.value)}>
                {events.map((e) => <option key={e.id} value={e.id}>{e.title} · {e.when}</option>)}
              </select>
            </label>
            <button type="button" className="sx-btn sx-btn-primary" onClick={book}><Icon name="check" /> Book</button>
          </div>
        )}
        <ul className="sx-list">
          {added.map((a) => (
            <li key={a.id} className="al-row">
              <Initials name={a.name} size={28} />
              <span><b>{a.name}</b><small>{a.title} · {a.when}</small></span>
              <Badge tone="good"><Icon name="check" /> Booked just now</Badge>
            </li>
          ))}
          {items.map((r) => (
            <li key={r.id} className="al-row">
              <Initials name={r.from} size={28} />
              <span><b>{r.from}</b><small>{r.event.title} · {r.when}</small></span>
              <span className="sx-hint">{r.ago}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ public sign-ups (leads) */

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

function fmtTime(min: number) {
  const h = Math.floor(min / 60), m = min % 60;
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
}
function whenOf(date: string, start: number) {
  const d = new Date(date + "T00:00:00Z");
  return `${d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}, ${fmtTime(start)}`;
}
function since(at: number) {
  const m = Math.max(1, Math.round((Date.now() - at) / 60000));
  return m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} days ago`;
}

export function PublicSignups({ items, slug }: { items: Req[]; slug: string }) {
  const raw = useSyncExternalStore(subscribe, read, () => "[]");
  const fresh = useMemo<WebSignup[]>(() => {
    try {
      const list = JSON.parse(raw);
      return Array.isArray(list) ? (list as WebSignup[]).filter((x) => x && x.slug === slug && x.name).sort((a, b) => b.at - a.at) : [];
    } catch {
      return [];
    }
  }, [raw, slug]);
  return (
    <section className="sx-card">
      <header className="sx-card-head">
        <div>
          <h2>Public sign-ups <Badge tone={fresh.length ? "accent" : "neutral"}>{fresh.length ? `${fresh.length} new` : `${items.length} this month`}</Badge></h2>
          <p>Open house sign-ups from the website. No approval needed; every one is a sales lead in Tours &amp; enquiries.</p>
        </div>
        <Link href="/staff/tours" className="sx-btn sx-btn-sm">Tours &amp; enquiries</Link>
      </header>
      <div className="sx-card-body" style={{ paddingTop: 8 }}>
        <ul className="sx-list">
          {fresh.map((f) => (
            <li key={`${f.at}-${f.name}`} className="al-row al-new">
              <Initials name={f.name} size={28} color="var(--terra)" />
              <span>
                <b>{f.name}</b> <Badge tone="accent">New</Badge>
                <small>{f.eventTitle} · {whenOf(f.date, f.start)} · {party(f.party)}</small>
                <small>{[f.phone, f.email].filter(Boolean).join(" · ")}</small>
              </span>
              <span className="al-row-r">
                <Link href="/staff/tours" className="sx-badge sx-info">Lead</Link>
                <span className="sx-hint">{since(f.at)}</span>
              </span>
            </li>
          ))}
          {items.map((r) => (
            <li key={r.id} className="al-row">
              <Initials name={r.from} size={28} />
              <span>
                <b>{r.from}</b>
                <small>{r.event.title} · {r.when} · {party(r.party)} · {r.note}</small>
                <small>{[r.phone, r.email].filter(Boolean).join(" · ")}</small>
              </span>
              <span className="al-row-r">
                <Link href="/staff/tours" className="sx-badge sx-info">Lead</Link>
                <span className="sx-hint">{r.ago}</span>
              </span>
            </li>
          ))}
        </ul>
        {items.length === 0 && fresh.length === 0 && <p className="sx-empty">No open house in the next three weeks.</p>}
      </div>
    </section>
  );
}
