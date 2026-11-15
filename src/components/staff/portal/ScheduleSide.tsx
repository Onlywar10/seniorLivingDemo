"use client";

// Beside Post's Time tab: the community's calendar, so a time can be picked with the day in view. Opens on the day
// chosen in the form, and switches to the week or the month. The new event shows in place, with a room clash flagged.
// A panel at the side, not over the form: the form stays usable while it's open.
import { useEffect, useEffectEvent, useState } from "react";
import type { Busy } from "@/data/staff/post";
import { addDays, dayName, fmtRange, fmtTime, fromIso, iso, monthName } from "@/lib/clock";
import { Icon } from "../../Icon";

type View = "day" | "week" | "month";
export interface DraftSlot { title: string; date: string; start: number; end: number; room: string; dates: string[] }

const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const sundayOf = (d: Date) => addDays(d, -d.getUTCDay());

export function ScheduleSide({ busy, draft, todayIso, onPick, onClose, inDrawer = false }: { busy: Busy[]; draft: DraftSlot; todayIso: string; onPick: (date: string) => void; onClose: () => void; /** The form is in a slide-out (Calendar → Add): sit beside it, not behind it. */ inDrawer?: boolean }) {
  const [view, setView] = useState<View>("day");
  const [at, setAt] = useState(draft.date);
  // Follow the form: a new day chosen there opens here.
  const [seen, setSeen] = useState(draft.date);
  if (draft.date !== seen) { setSeen(draft.date); setAt(draft.date); }

  // The page makes room for the panel on a wide screen, and gets it back on close.
  // Escape closes it; the latest onClose is read when the key is pressed, so this runs once, not on every keystroke.
  const close = useEffectEvent(() => onClose());
  useEffect(() => {
    if (!inDrawer) document.body.classList.add("po-cal-open");
    const k = (ev: KeyboardEvent) => { if (ev.key === "Escape") close(); };
    window.addEventListener("keydown", k);
    return () => { document.body.classList.remove("po-cal-open"); window.removeEventListener("keydown", k); };
  }, [inDrawer]);

  const d = fromIso(at);
  const known = busy.map((b) => b.date).sort();
  const first = known[0], last = known[known.length - 1];
  const loaded = (x: string) => !first || (x >= first && x <= last);
  const on = (x: string) => busy.filter((b) => b.date === x).sort((a, b) => a.start - b.start);
  const mine = (x: string) => (draft.title || draft.start ? draft.dates.includes(x) : false);
  const clashes = (b: Busy) => b.room === draft.room && b.start < draft.end && b.end > draft.start;
  const step = (n: number) => setAt(iso(view === "day" ? addDays(d, n) : view === "week" ? addDays(d, 7 * n) : new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1))));
  const label = view === "day" ? `${dayName(d)}, ${monthName(d)} ${d.getUTCDate()}`
    : view === "week" ? (() => { const s = sundayOf(d), e = addDays(s, 6); return `${monthName(s).slice(0, 3)} ${s.getUTCDate()} – ${monthName(e).slice(0, 3)} ${e.getUTCDate()}`; })()
    : `${monthName(d)} ${d.getUTCFullYear()}`;
  const newOne = { title: draft.title || "Your event", start: draft.start, end: draft.end, room: draft.room };

  /** One day's events, with the new one in its place. */
  const dayList = (x: string, compact = false) => {
    const evs = on(x);
    const rows: ({ mine: true } | { mine: false; b: Busy })[] = evs.map((b) => ({ mine: false as const, b }));
    if (mine(x)) {
      const i = rows.findIndex((r) => !r.mine && r.b.start > draft.start);
      rows.splice(i < 0 ? rows.length : i, 0, { mine: true });
    }
    if (!rows.length) return <p className="sc-none">{loaded(x) ? "Nothing on yet" : "Not in the calendar yet"}</p>;
    return (
      <ul className={`sc-list${compact ? " compact" : ""}`}>
        {rows.map((r, i) => r.mine ? (
          <li key={`mine-${i}`} className="mine"><span className="sc-t">{compact ? fmtTime(newOne.start) : fmtRange(newOne.start, newOne.end)}</span><span><b>{newOne.title}</b>{!compact && <small>{newOne.room} · the event you’re adding</small>}</span></li>
        ) : (
          <li key={r.b.title + r.b.start + i} className={mine(x) && clashes(r.b) ? "clash" : undefined}>
            <span className="sc-t">{compact ? fmtTime(r.b.start) : fmtRange(r.b.start, r.b.end)}</span>
            <span><b>{r.b.title}</b>{!compact && <small>{r.b.room}{mine(x) && clashes(r.b) ? " · same room, same time" : ""}</small>}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <aside className={`sc-side${inDrawer ? " in-drawer" : ""}`} aria-label="The calendar">
      <header className="sc-h">
        <h2><Icon name="calendar" /> The calendar</h2>
        <button type="button" className="sx-x" onClick={onClose} aria-label="Close the calendar"><Icon name="x" /></button>
      </header>
      <div className="sc-bar">
        <div className="sx-seg" role="group" aria-label="View">
          {(["day", "week", "month"] as const).map((v) => <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}>{v === "day" ? "Day" : v === "week" ? "Week" : "Month"}</button>)}
        </div>
        <div className="sc-nav">
          <button type="button" className="sx-btn sx-btn-sm" onClick={() => step(-1)} aria-label="Earlier"><Icon name="left" /></button>
          <b>{label}</b>
          <button type="button" className="sx-btn sx-btn-sm" onClick={() => step(1)} aria-label="Later"><Icon name="right" /></button>
        </div>
        {at !== draft.date && <button type="button" className="sx-link sc-back" onClick={() => setAt(draft.date)}>Back to {dayName(fromIso(draft.date))}, {monthName(fromIso(draft.date)).slice(0, 3)} {fromIso(draft.date).getUTCDate()}</button>}
      </div>

      <div className="sc-b">
        {view === "day" && (
          <>
            {dayList(at)}
            {at !== draft.date && at >= todayIso && <button type="button" className="sx-btn sx-btn-sm sc-use" onClick={() => onPick(at)}><Icon name="check" /> Put the event on this day</button>}
          </>
        )}

        {view === "week" && (
          <ol className="sc-week">
            {Array.from({ length: 7 }, (_, i) => iso(addDays(sundayOf(d), i))).map((x) => (
              <li key={x} className={`${x === draft.date ? "sel" : ""}${x === todayIso ? " today" : ""}`}>
                <button type="button" className="sc-wd" onClick={() => { setAt(x); setView("day"); }}>
                  <b>{dayName(fromIso(x))}</b> <span>{monthName(fromIso(x)).slice(0, 3)} {fromIso(x).getUTCDate()}</span>
                </button>
                {dayList(x, true)}
              </li>
            ))}
          </ol>
        )}

        {view === "month" && (() => {
          const m0 = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
          const start = sundayOf(m0);
          const cells = Array.from({ length: 42 }, (_, i) => addDays(start, i)).filter((c, i) => i < 35 || c.getUTCMonth() === m0.getUTCMonth());
          return (
            <div className="sc-month" role="grid" aria-label={label}>
              {WD.map((w) => <span key={w} className="sc-mh" role="columnheader">{w}</span>)}
              {cells.map((c) => {
                const x = iso(c);
                const n = on(x).length;
                const out = c.getUTCMonth() !== m0.getUTCMonth();
                return (
                  <button key={x} type="button" role="gridcell" className={`sc-day${out ? " out" : ""}${x === draft.date ? " sel" : ""}${x === todayIso ? " today" : ""}${mine(x) ? " mine" : ""}`} onClick={() => { setAt(x); setView("day"); }} aria-label={`${dayName(c)}, ${monthName(c)} ${c.getUTCDate()}: ${loaded(x) ? `${n} ${n === 1 ? "event" : "events"}` : "not loaded"}${mine(x) ? ", your event" : ""}`}>
                    <span>{c.getUTCDate()}</span>
                    {loaded(x) && n > 0 && <small>{n}</small>}
                  </button>
                );
              })}
            </div>
          );
        })()}
      </div>
      <p className="sc-foot sx-hint">Tap a day to see it. Your event is highlighted; a clash is the same room at the same time.</p>
    </aside>
  );
}
