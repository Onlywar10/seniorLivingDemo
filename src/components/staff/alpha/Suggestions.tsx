"use client";

// Resident suggestions: change a status, or make one an activity. Kept in this browser only.
import Link from "next/link";
import { useState } from "react";
import type { Suggestion } from "@/data/staff/alpha";
import { Icon } from "../../Icon";
import { Badge } from "../ui";

type Status = Suggestion["status"];
export type SuggestionRow = Suggestion & { ago: string; eventWhen?: string };

const statuses: Status[] = ["New", "Planned", "On the calendar", "Not this time"];
const tone = { New: "accent", Planned: "info", "On the calendar": "good", "Not this time": "neutral" } as const;

export function SuggestionList({ items, nextSlot }: { items: SuggestionRow[]; nextSlot: string }) {
  const [st, setSt] = useState<Record<string, Status>>({});
  const [made, setMade] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<Status | "All">("All");
  const status = (s: SuggestionRow) => st[s.id] ?? s.status;
  const shown = items.filter((s) => filter === "All" || status(s) === filter);
  const count = (f: Status) => items.filter((s) => status(s) === f).length;

  return (
    <section className="sx-card">
      <header className="sx-card-head">
        <div>
          <h2>Suggestions</h2>
          <p>From the paper slips in the Lobby and the QR code on every printed calendar. Most votes first within each status.</p>
        </div>
        <div className="sx-chips" role="group" aria-label="Show">
          {(["All", ...statuses] as const).map((f) => (
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {f} {f !== "All" && <span className="sx-hint">{count(f)}</span>}
            </button>
          ))}
        </div>
      </header>
      <div className="sx-card-body" style={{ paddingTop: 6 }}>
        <ul className="sg-list">
          {shown.map((s) => {
            const cur = status(s);
            return (
              <li key={s.id}>
                <span className="sg-votes" aria-label={`${s.votes} residents agree`}><b>{s.votes}</b><small>agree</small></span>
                <div>
                  <p className="sg-t">“{s.text}”</p>
                  <p className="sx-hint">
                    <Icon name={s.from === "QR code" ? "phoneapp" : "doc"} /> {s.from} · {s.who ?? "Anonymous"} · {s.ago}
                  </p>
                  {cur === "On the calendar" && (s.becameEvent || made[s.id]) && (
                    <p className="sg-ev">
                      <Icon name="calendar" /> {s.becameEvent ? <>Became <b>{s.becameEvent.title}</b>, {s.eventWhen}</> : <>Added to the calendar, {nextSlot}. Residents see “Your idea” on the printed calendar.</>}
                    </p>
                  )}
                  {cur === "Not this time" && s.note && <p className="sx-hint">{s.note}</p>}
                </div>
                <div className="sg-act">
                  <Badge tone={tone[cur]}>{cur}</Badge>
                  {cur !== "On the calendar" && cur !== "Not this time" && (
                    <button type="button" className="sx-btn sx-btn-sm sx-btn-primary" onClick={() => { setSt((x) => ({ ...x, [s.id]: "On the calendar" })); setMade((m) => ({ ...m, [s.id]: true })); }}>
                      <Icon name="plus" /> Make it an activity
                    </button>
                  )}
                  <label className="vh" htmlFor={`sg-${s.id}`}>Status</label>
                  <select id={`sg-${s.id}`} className="sx-input sg-sel" value={cur} onChange={(e) => setSt((x) => ({ ...x, [s.id]: e.target.value as Status }))}>
                    {statuses.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </li>
            );
          })}
        </ul>
        {shown.length === 0 && <p className="sx-empty">Nothing here.</p>}
        <p className="sx-note"><Link className="sx-link" href="/staff/calendar">Open the calendar</Link> to set the time and room for new activities.</p>
      </div>
    </section>
  );
}
