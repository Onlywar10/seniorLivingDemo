"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { kindLabel, type DiningRequest, type HolidayTally, type MealTally, type RequestKind, type RequestRule } from "@/data/staff/dining";
import { say } from "../store";
import { Badge } from "../ui";
import { Help } from "./Help";

const statusLabel: Record<DiningRequest["status"], { label: string; tone: "good" | "warn" | "info" | "neutral" | "accent" }> = {
  confirmed: { label: "Confirmed", tone: "good" },
  asked: { label: "Asked which seating", tone: "info" },
  waitlist: { label: "On the waitlist", tone: "info" },
  "waiting-resident": { label: "Asking the resident first", tone: "info" },
  "needs-person": { label: "Needs a person", tone: "warn" },
  "to-kitchen": { label: "Passed to the chef", tone: "accent" },
  logged: { label: "Thanked · logged", tone: "neutral" },
};

/**
 * Dining requests by text, for the culinary director and the front desk. Residents and families text in plain words;
 * Kinlight reads the message, checks the restaurant's rules, replies, reminds, and puts only what needs a person at the
 * top. Each meal's count goes to the kitchen the day before; the holiday has its own tally. No diets or balances: a
 * health message is passed to the kitchen as a conversation, and charges are only ever "a charge applies".
 */
export function DiningRequests({ requests, meals, holiday, rules, venueName, canAct, chefFirst }: {
  requests: DiningRequest[]; meals: MealTally[]; holiday?: HolidayTally; rules: RequestRule[]; venueName: string; canAct: boolean; chefFirst: string;
}) {
  const [handled, setHandled] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [kind, setKind] = useState<RequestKind | "all">("all");
  const [sent, setSent] = useState(false);
  const needs = requests.filter((r) => r.status === "needs-person" && !handled[r.id]);
  const kinds = [...new Set(requests.map((r) => r.kind))];
  const shown = requests.filter((r) => kind === "all" || r.kind === kind);
  const reply = (r: DiningRequest) => {
    const text = draft[r.id]?.trim();
    if (!text) return;
    setHandled((h) => ({ ...h, [r.id]: `Replied: “${text}”` }));
    say(`Sent to ${r.from.split(" ")[0]} by text`, () => setHandled((h) => { const n = { ...h }; delete n[r.id]; return n; }));
  };

  return (
    <section className="sx-card dr" aria-labelledby={`dr-h-${venueName}`}>
      <header className="sx-card-head">
        <div>
          <h2 id={`dr-h-${venueName}`}><Icon name="sms" /> Requests by text
            <Help label="How requests work" align="end">
              <p>Residents and families text in plain words: a table, a guest, Thanksgiving, “we’re coming too”. Kinlight reads it, checks the rules below, replies and reminds. Only what needs a person comes to you.</p>
              <p>Health stays out: a diet or allergy message goes to the kitchen as a conversation, and nothing about it is kept. Charges stay in the kitchen’s own system; Kinlight only ever says “a charge applies”.</p>
            </Help>
          </h2>
          <p>{venueName} · this week</p>
        </div>
        {needs.length ? <Badge tone="warn">{needs.length} need you</Badge> : <Badge tone="good"><Icon name="check" /> Nothing waiting</Badge>}
      </header>
      <div className="sx-card-body dr-body">
        {needs.length > 0 && (
          <div className="dr-needs">
            <h3 className="mn-h3" style={{ marginTop: 0 }}>Needs a person</h3>
            <ul>
              {needs.map((r) => (
                <li key={r.id}>
                  <div className="dr-from"><b>{r.from}</b><small>{r.fromLabel} · {r.at}</small></div>
                  <p className="dr-bubble in">{r.text}</p>
                  <p className="dr-why"><Icon name="info" /> {r.why}{r.beta && <> <Badge tone="info">Coming in Beta</Badge></>}</p>
                  <p className="dr-bubble out"><small>Kinlight replied</small>{r.reply}</p>
                  {canAct && (
                    <form className="mn-soup" onSubmit={(e) => { e.preventDefault(); reply(r); }}>
                      <label><span className="vh">Reply to {r.from}</span><input className="sx-input" value={draft[r.id] ?? ""} onChange={(e) => setDraft((d) => ({ ...d, [r.id]: e.target.value }))} placeholder={r.kind === "health" ? `Reply as Chef ${chefFirst}` : "Reply by text"} /></label>
                      <button type="submit" className="sx-btn sx-btn-primary" disabled={!draft[r.id]?.trim()}><Icon name="send" /> Send</button>
                      <button type="button" className="sx-btn sx-btn-quiet" onClick={() => setHandled((h) => ({ ...h, [r.id]: "Handled by phone" }))}>Handled by phone</button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="dr-grid">
          <div>
            <h3 className="mn-h3" style={{ marginTop: 0 }}>By meal
              <Help label="Counts for the kitchen"><p>Each meal’s count goes to the kitchen at 2 pm the day before: bookings, guests, to-go and any special requests. Walk-ins still welcome.</p></Help>
            </h3>
            <ul className="dr-meals">
              {meals.map((m) => (
                <li key={m.key}>
                  <b>{m.label}</b>
                  <span>{m.booked} booked · {m.guests} guests · {m.togo} to-go · {m.special} special {m.special === 1 ? "request" : "requests"}</span>
                  {m.seatings && <small>Seatings {m.seatings}</small>}
                </li>
              ))}
            </ul>
            {canAct && (sent
              ? <p className="mn-ok"><Icon name="check" /> Tomorrow’s counts sent to the kitchen</p>
              : <button type="button" className="sx-btn sx-btn-sm" onClick={() => { setSent(true); say("Tomorrow’s counts sent to the kitchen", () => setSent(false)); }}><Icon name="send" /> Send tomorrow’s counts now</button>)}
          </div>

          {holiday && (
            <div className="dr-hol">
              <h3 className="mn-h3" style={{ marginTop: 0 }}>{holiday.name} · {holiday.label}</h3>
              <p className="small">Booking opened {holiday.opens} · closes {holiday.closes} · up to {holiday.perApartment} guests per apartment</p>
              <ul className="dr-seat">
                {holiday.seatings.map((s) => (
                  <li key={s.time}>
                    <span><b>{s.time}</b> {s.booked} of {s.cap}</span>
                    <span className="dr-bar" aria-hidden="true"><i style={{ width: `${Math.min(100, (s.booked / s.cap) * 100)}%` }} /></span>
                    <small>{s.cap - s.booked} seats left</small>
                  </li>
                ))}
              </ul>
              <dl className="dr-hol-l">
                <div><dt>Guests</dt><dd>{holiday.guests.adults} adults · {holiday.guests.children} children</dd></div>
                <div><dt>Take-home plates</dt><dd>{holiday.takeout}</dd></div>
                <div><dt>Notes for the kitchen</dt><dd>{holiday.notes}, passed on with each booking</dd></div>
                <div><dt>Guest prices</dt><dd>{holiday.prices}, from the kitchen’s menu</dd></div>
              </dl>
            </div>
          )}
        </div>

        <div className="dr-list-h">
          <h3 className="mn-h3" style={{ margin: 0 }}>Every message</h3>
          <div className="sx-chips" role="group" aria-label="Kind of request">
            <button type="button" aria-pressed={kind === "all"} onClick={() => setKind("all")}>All</button>
            {kinds.map((k) => <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)}>{kindLabel[k]}</button>)}
          </div>
        </div>
        <ul className="dr-list">
          {shown.map((r) => {
            const st = handled[r.id] ? { label: handled[r.id], tone: "good" as const } : statusLabel[r.status];
            return (
              <li key={r.id}>
                <div className="dr-from"><b>{r.from}</b><small>{r.fromLabel} · {r.at}</small><span className="dr-kind">{kindLabel[r.kind]}{r.meal ? ` · ${r.meal}` : ""}</span></div>
                <p className="dr-bubble in">{r.text}</p>
                <p className="dr-check"><Icon name="check" /> Checked: {r.checked}</p>
                <p className="dr-bubble out"><small>Kinlight replied</small>{r.reply}</p>
                <span className="dr-st"><Badge tone={st.tone}>{st.label}</Badge>{r.beta && <Badge tone="info">Coming in Beta</Badge>}</span>
              </li>
            );
          })}
        </ul>

        <details className="dr-rules">
          <summary>The rules Kinlight checks</summary>
          <ul>
            {rules.map((r) => (
              <li key={r.kind}><b>{r.label}</b>{r.beta && <> <Badge tone="info">{r.beta}</Badge></>}<small> · exceptions go to {r.who}</small><span>{r.rules.join(" · ")}</span></li>
            ))}
          </ul>
        </details>
        <p className="dr-beta"><Badge tone="info">Coming in Beta</Badge> Private dining room bookings and ordering straight from the menu.</p>
      </div>
    </section>
  );
}
