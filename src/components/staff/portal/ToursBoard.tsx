"use client";

// Tours (front desk and executive director): every tour booked, by day. Who's coming and who it's for, how to reach
// them, the kind of living and the floor plan they asked about, and whether they came. A check-in counts a tour by
// itself (the visitor replies HERE to their reminder, or the desk taps Arrived); a tour that passed with no check-in
// asks: came, or a no-show? What the visitor told us when booking only: no staff notes about them.
import { useState } from "react";
import { Icon } from "../../Icon";
import { say } from "../store";
import { Badge } from "../ui";

export interface TourRow {
  id: string; who: string; forWhom: string; day: string; dayKey: number; time: string; living: string;
  plan?: { code: string; name: string; href: string }; lunch: boolean; source: string; host?: string; phone: string;
  /** Today only: has it started, has it finished, and did they check in. */
  started: boolean; ended: boolean; checkedIn?: string;
}

type Mark = "came" | "no-show";
type Show = "upcoming" | "today" | "all";

export function ToursBoard({ rows }: { rows: TourRow[] }) {
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [show, setShow] = useState<Show>("upcoming");
  const set = (r: TourRow, m: Mark | null, text: string) => {
    setMarks((x) => { const n = { ...x }; if (m) n[r.id] = m; else delete n[r.id]; return n; });
    if (m) say(text, () => setMarks((x) => { const n = { ...x }; delete n[r.id]; return n; }));
  };
  const today = rows.filter((r) => r.dayKey === 0);
  const counted = today.filter((r) => r.checkedIn || marks[r.id] === "came").length;
  const waiting = today.filter((r) => r.ended && !r.checkedIn && !marks[r.id]).length;
  // Upcoming: still to come, plus any of today's that still need an answer.
  const shown = rows.filter((r) => show === "all" || (show === "today" ? r.dayKey === 0 : r.dayKey > 0 || !r.ended || (!r.checkedIn && !marks[r.id])));
  const days = [...new Set(shown.map((r) => r.day))];

  return (
    <div className="tr">
      <ul className="tr-sum" aria-label="Tour numbers">
        <li><b>{today.length}</b><span>today</span></li>
        <li><b>{rows.filter((r) => r.dayKey > 0 && r.dayKey < 7).length}</b><span>in the next 7 days</span></li>
        <li><b>{counted}</b><span>counted today</span></li>
        <li className={waiting ? "warn" : undefined}><b>{waiting}</b><span>{waiting === 1 ? "needs an answer" : "need an answer"}</span></li>
      </ul>

      <div className="tr-bar">
        <div className="sx-seg" role="group" aria-label="Show">
          <button type="button" aria-pressed={show === "upcoming"} onClick={() => setShow("upcoming")}>Upcoming</button>
          <button type="button" aria-pressed={show === "today"} onClick={() => setShow("today")}>Today</button>
          <button type="button" aria-pressed={show === "all"} onClick={() => setShow("all")}>All booked</button>
        </div>
        <p className="sx-hint">Visitors book on the website, the tour page or in the chat, and get a confirmation and a reminder automatically.</p>
      </div>

      {!shown.length && <p className="pt-empty">No tours to show.</p>}
      {days.map((d) => (
        <section key={d} className="tr-day" aria-label={d}>
          <h2>{d}</h2>
          <ul>
            {shown.filter((r) => r.day === d).map((r) => {
              const m = marks[r.id];
              return (
                <li key={r.id} className={`sx-card tr-row${r.ended && !r.checkedIn && !m ? " ask" : ""}`}>
                  <time>{r.time}</time>
                  <div className="tr-who">
                    <h3>{r.who}</h3>
                    <p>For {r.forWhom}</p>
                    <dl>
                      <div><dt>Looking at</dt><dd><Badge tone="info">{r.living}</Badge>{r.plan ? <> <a className="sx-link" href={r.plan.href} target="_blank" rel="noopener">{r.plan.name} ({r.plan.code})</a></> : <span className="sx-hint"> No floor plan chosen</span>}</dd></div>
                      <div><dt>Booked through</dt><dd>{r.source}</dd></div>
                      <div><dt>Contact</dt><dd><a className="sx-link" href={`tel:+1${r.phone.replace(/\D/g, "")}`}><Icon name="phone" /> {r.phone}</a></dd></div>
                      {(r.host || r.lunch) && <div><dt>On the day</dt><dd>{[r.host ? `With ${r.host}` : "", r.lunch ? "Staying for lunch" : ""].filter(Boolean).join(" · ")}</dd></div>}
                    </dl>
                  </div>
                  <div className="tr-att">
                    <span className="sx-lbl">Attendance</span>
                    {r.dayKey > 0 ? (
                      <Badge tone="neutral">Upcoming</Badge>
                    ) : r.checkedIn ? (
                      <Badge tone="good"><Icon name="check" /> {r.checkedIn}</Badge>
                    ) : m ? (
                      <span className="tr-done">
                        <Badge tone={m === "came" ? "good" : "neutral"}><Icon name={m === "came" ? "check" : "x"} /> {m === "came" ? "Came · counted" : "No-show"}</Badge>
                        <button type="button" className="sx-link" onClick={() => set(r, null, "")}>Undo</button>
                      </span>
                    ) : r.ended ? (
                      <span className="tr-ask">
                        <small>No check-in</small>
                        <span className="sx-seg" role="group" aria-label={`Did ${r.who} come?`}>
                          <button type="button" onClick={() => set(r, "came", `Counted: ${r.who}’s tour.`)}>They came</button>
                          <button type="button" onClick={() => set(r, "no-show", `Noted: ${r.who} was a no-show.`)}>No-show</button>
                        </span>
                      </span>
                    ) : (
                      <button type="button" className="sx-btn sx-btn-sm sx-btn-primary" onClick={() => set(r, "came", `${r.who} is here. The tour is counted.`)}><Icon name="check" /> {r.started ? "Arrived" : "Arrived early"}</button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
