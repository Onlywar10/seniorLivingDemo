"use client";

// Prospects, for sales: upcoming tours (and the outcome of each one, the one sales task the alpha asks for) and the
// waitlist in order. Availability and prices moved to Website → Apartments and prices (WebsiteApartments.tsx).
// Changes stay in this browser.
import { useState } from "react";
import { Icon } from "../../Icon";
import { Badge } from "../ui";

export interface TourRow { id: string; who: string; forWhom: string; interest: string; source: string; day: string; time: string; done: boolean; with: string }
export interface WaitRow { name: string; plan: string; since: string }

const outcomes = ["Moved in", "Still deciding", "Chose elsewhere"] as const;

export function Tours({ tours }: { tours: TourRow[] }) {
  const [out, setOut] = useState<Record<string, string>>({});
  return (
    <ul className="pt-tours">
      {tours.map((t, i) => {
        const head = i === 0 || t.day !== tours[i - 1].day;
        return (
          <li key={t.id}>
            {head && <h3 className="tour-day">{t.day}</h3>}
            <div className={`pt-tour${t.done ? " done" : ""}`}>
              <time>{t.time}</time>
              <span>
                <b>{t.who}</b> <span className="sx-hint">for {t.forWhom}</span>
                <small>{t.interest} · {t.source} · with {t.with}</small>
              </span>
              {t.done && (
                <span className="pt-outcome">
                  {out[t.id] ? (
                    <Badge tone={out[t.id] === "Chose elsewhere" ? "neutral" : "good"}><Icon name="check" /> {out[t.id]}</Badge>
                  ) : (
                    <>
                      <span className="sx-hint">How did it go?</span>
                      <span className="sx-seg" role="group" aria-label={`Outcome of ${t.who}’s tour`}>
                        {outcomes.map((o) => <button key={o} type="button" onClick={() => setOut((x) => ({ ...x, [t.id]: o }))}>{o}</button>)}
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

export function Waitlist({ rows }: { rows: WaitRow[] }) {
  return (
    <ol className="pt-wait">
      {rows.map((w, i) => (
        <li key={w.name}>
          <span className="pt-wait-n">{i + 1}</span>
          <span><b>{w.name}</b><small>Since {w.since}</small></span>
          <Badge tone="info">{w.plan}</Badge>
        </li>
      ))}
    </ol>
  );
}
