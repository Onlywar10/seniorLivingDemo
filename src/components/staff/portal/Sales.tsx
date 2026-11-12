"use client";

// Prospects, for sales: this week's tours (and the outcome of each one, the one sales task the alpha asks for) and the
// waitlist, grouped by floor plan. Availability and prices live in Website → Apartments and prices (WebsiteApartments.tsx).
// The outcomes are kept by the Prospects list (ProspectInbox.tsx), so each one confirms with Undo. Changes stay in this browser.
import { Icon } from "../../Icon";
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
