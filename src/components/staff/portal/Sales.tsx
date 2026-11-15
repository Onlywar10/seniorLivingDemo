"use client";

// Apartments (the front desk): this week's tours, counted (did it happen? that's all), and the waitlist, grouped by
// floor plan. Tours, the outcome list (Tours) and ProspectInbox are sales, hidden in the alpha. Availability and prices live in Website → Apartments and prices (WebsiteApartments.tsx).
// The outcomes are kept by the Prospects list (ProspectInbox.tsx), so each one confirms with Undo. Changes stay in this browser.
import { useState } from "react";
import { Icon } from "../../Icon";
import { say } from "../store";
import { Badge } from "../ui";

export interface TourRow { id: string; who: string; forWhom: string; interest: string; source: string; day: string; time: string; done: boolean; with: string; /** The person's id in the Prospects list, to open their panel. */ person: string }

export const outcomes = ["Moved in", "Still deciding", "Chose elsewhere"] as const;
export type Outcome = (typeof outcomes)[number];
export const outcomeTone = (o: Outcome) => (o === "Chose elsewhere" ? "neutral" : o === "Still deciding" ? "info" : "good");

export function Tours({ tours, out, onOutcome, onOpen }: { tours: TourRow[]; out: Record<string, Outcome>; onOutcome: (t: TourRow, o: Outcome) => void; onOpen: (person: string) => void }) {
  if (!tours.length) return <p className="sx-empty">No tours booked this week.</p>;
  return (
    <ul className="pt-tours">
      {tours.map((t, i) => {
        const head = i === 0 || t.day !== tours[i - 1].day;
        const o = out[t.id];
        return (
          <li key={t.id}>
            {head && <h3 className="tour-day">{t.day}</h3>}
            <div className={`pt-tour${t.done ? " done" : ""}`}>
              <time>{t.time}</time>
              <span>
                <span><button type="button" className="pq-name" onClick={() => onOpen(t.person)}>{t.who}</button> <span className="sx-hint">for {t.forWhom}</span></span>
                <small>{t.interest} · {t.source} · with {t.with}</small>
              </span>
              {t.done && (
                <span className="pt-outcome">
                  {o ? (
                    <Badge tone={outcomeTone(o)}><Icon name="check" /> {o}</Badge>
                  ) : (
                    <>
                      <span className="sx-hint">How did it go?</span>
                      <span className="sx-seg" role="group" aria-label={`Outcome of ${t.who}’s tour`}>
                        {outcomes.map((x) => <button key={x} type="button" onClick={() => onOutcome(t, x)}>{x}</button>)}
                      </span>
                    </>
                  )}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------ waitlist */

export interface WaitRow { name: string; waited: string; since: string }
export interface WaitPlan { code: string; name: string; open: number; rows: WaitRow[] }

/** The waitlist by floor plan, longest waiting first. Names and how long they've waited only: no notes. */
export function Waitlist({ plans }: { plans: WaitPlan[] }) {
  if (!plans.length) return <p className="sx-empty">No one is on the waitlist.</p>;
  return (
    <div className="pq-wait">
      {plans.map((p) => (
        <section key={p.code} className="pq-wait-plan" aria-label={`${p.name} waitlist`}>
          <h3>
            <span>{p.name} <small>{p.code}</small></span>
            <span className="pq-wait-c">{p.rows.length} waiting{p.open ? <Badge tone="good">{p.open} open</Badge> : null}</span>
          </h3>
          <ol className="pt-wait">
            {p.rows.map((w, i) => (
              <li key={w.name}>
                <span className="pt-wait-n">{i + 1}</span>
                <span><b>{w.name}</b><small>Since {w.since}</small></span>
                <span className="pt-wait-p">{w.waited}</span>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------ tour count (front desk) */

export interface TourCountRow { id: string; who: string; interest: string; source: string; day: string; time: string; done: boolean; /** "Checked in 10:24 am": counted automatically. */ checkedIn?: string }

/** This week's tours, booked through the website chat and the tour page. A check-in counts a tour by itself; one with
 * no check-in asks whether they came. No notes about the visitor. */
export function TourCount({ tours, month }: { tours: TourCountRow[]; month: { label: string; now: number; prev: number; prevLabel: string } }) {
  const [came, setCame] = useState<Record<string, boolean>>({});
  const counted = Object.values(came).filter(Boolean).length;
  const mark = (t: TourCountRow, v: boolean) => {
    setCame((c) => ({ ...c, [t.id]: v }));
    say(v ? `Counted: ${t.who}’s tour. ${month.label}: ${month.now + counted + 1} tours.` : `Noted: ${t.who} was a no-show.`, () => setCame((c) => { const n = { ...c }; delete n[t.id]; return n; }));
  };
  return (
    <>
      <ul className="fb-sum ap-tour-sum" aria-label="Tour numbers">
        <li><span><b>{month.now + counted}</b><span>tours in {month.label}</span></span></li>
        <li><span><b>{month.prev}</b><span>in {month.prevLabel}</span></span></li>
        <li><span><b>{tours.length}</b><span>booked this week</span></span></li>
      </ul>
      {!tours.length ? <p className="sx-empty">No tours booked this week.</p> : (
        <ul className="pt-tours">
          {tours.map((t, i) => (
            <li key={t.id}>
              {(i === 0 || t.day !== tours[i - 1].day) && <h3 className="tour-day">{t.day}</h3>}
              <div className={`pt-tour${t.done ? " done" : ""}`}>
                <time>{t.time}</time>
                <span><b>{t.who}</b><small>{t.interest} · {t.source}</small></span>
                {t.checkedIn && !(t.id in came) && <span className="pt-outcome"><Badge tone="good"><Icon name="check" /> {t.checkedIn} · counted</Badge></span>}
                {t.done && !t.checkedIn && (
                  <span className="pt-outcome">
                    {t.id in came ? (
                      <Badge tone={came[t.id] ? "good" : "neutral"}><Icon name={came[t.id] ? "check" : "x"} /> {came[t.id] ? "Counted" : "No-show"}</Badge>
                    ) : (
                      <span className="sx-seg" role="group" aria-label={`No check-in for ${t.who}: did they come?`}>
                        <button type="button" onClick={() => mark(t, true)}>They came</button>
                        <button type="button" onClick={() => mark(t, false)}>No-show</button>
                      </span>
                    )}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/** Today on the front desk: tap Arrived when a visitor walks in, and the tour counts itself. */
export function TourArrived({ who, checkedIn, started, ended }: { who: string; checkedIn?: string; started: boolean; ended: boolean }) {
  const [here, setHere] = useState(false);
  if (checkedIn) return <Badge tone="good"><Icon name="check" /> {checkedIn}</Badge>;
  if (here) return <Badge tone="good"><Icon name="check" /> Arrived</Badge>;
  if (ended) return <Badge tone="warn">No check-in</Badge>;
  return <button type="button" className="sx-btn sx-btn-sm" onClick={() => { setHere(true); say(`${who} is here. The tour is counted.`, () => setHere(false)); }}>{started ? "Arrived" : "Arrived early"}</button>;
}
