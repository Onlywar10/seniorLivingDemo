"use client";

import { useId, useState } from "react";
import { Icon } from "@/components/Icon";
import type { ServedDay, SubEntry } from "@/data/staff/menus";
import { say } from "../store";
import { Help } from "./Help";

/** Changes made after a menu went up: what changed, when, who. Today's changes from Live today come first. */
export function SubLog({ entries }: { entries: SubEntry[] }) {
  const hid = useId();
  const [all, setAll] = useState(false);
  const shown = all ? entries : entries.slice(0, 5);
  return (
    <section className="sx-card" aria-labelledby={hid}>
      <header className="sx-card-head">
        <div>
          <h2 id={hid}>Substitutions <Help label="About the substitution log"><p>Every swap or dish taken off at this restaurant after a menu went up, from Live today. Kept with the dated menus, so the record shows what was really served.</p></Help></h2>
          <p>What changed, when, who</p>
        </div>
      </header>
      <div className="sx-card-body">
        {entries.length === 0 ? <p className="sx-note" style={{ marginTop: 0 }}>No changes in the last 30 days.</p> : (
          <ul className="mn-subl">
            {shown.map((e) => (
              <li key={e.id}>
                <span className="mn-subl-w">{e.when}</span>
                <span><b>{e.what}</b><small>{e.venueName}{e.why ? ` · ${e.why}` : ""} · {e.by}</small></span>
              </li>
            ))}
          </ul>
        )}
        {entries.length > 5 && <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => setAll((x) => !x)}>{all ? "Show fewer" : `Show all ${entries.length}`}</button>}
      </div>
    </section>
  );
}

/** A dated copy of each day's menus as actually served, kept at least 30 days. */
export function Served({ days, today }: { days: ServedDay[]; today: SubEntry[] }) {
  const hid = useId();
  const [open, setOpen] = useState<string | null>(null);
  const [all, setAll] = useState(false);
  const shown = all ? days : days.slice(0, 7);
  return (
    <section className="sx-card" aria-labelledby={hid}>
      <header className="sx-card-head">
        <div>
          <h2 id={hid}>Served menus · last 30 days
            <Help label="Why these are kept" align="end">
              <p>California’s assisted living rules (Title 22) ask for menus written a week ahead and dated copies of what was served, kept for 30 days. Kinlight keeps each day’s menus as served, with any swaps, without anyone filing them.</p>
            </Help>
          </h2>
          <p>A dated copy of each day’s menu as actually served, swaps included · available to residents and families on request</p>
        </div>
        <button type="button" className="sx-btn sx-btn-sm" onClick={() => say("All 30 days saved as one PDF")}><Icon name="download" /> Download</button>
      </header>
      <div className="sx-card-body">
        {today.length > 0 && <p className="mn-ok" style={{ marginBottom: 8 }}><Icon name="edit" /> Today: {today.length} {today.length === 1 ? "change" : "changes"} so far, added tonight</p>}
        <ul className="mn-servl">
          {shown.map((d) => (
            <li key={d.date}>
              <button type="button" aria-expanded={open === d.date} onClick={() => setOpen((o) => (o === d.date ? null : d.date))}>
                <b>{d.label}</b>
                <span>{d.changes ? `${d.changes} ${d.changes === 1 ? "change" : "changes"}` : "As planned"}</span>
                <Icon name="chev" />
              </button>
              {open === d.date && (
                <div className="mn-servd">
                  {d.menus.map((m) => (
                    <div key={m.venue}>
                      {d.menus.length > 1 && <h4>{m.name}</h4>}
                      <ul>{m.lines.map((l) => <li key={l} className={l.startsWith("Changed:") ? "chg" : ""}>{l}</li>)}</ul>
                    </div>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
        {days.length > 7 && <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => setAll((x) => !x)}>{all ? "Show the last week" : `Show all ${days.length} days`}</button>}
      </div>
    </section>
  );
}
