"use client";

// A resident's week: the action page behind the link in their Sunday text. A plain list of the week's activities, each
// with its time: the ones picked for them first (whatever the day), then everything else a day at a time. Each opens
// to show where, the description, what happens during it, and an "I'll go" button that books them straight away.
// When it's full the button is greyed out and says so. The same page is shown on Post as a preview, with the new
// event in it.
import { addDays, dayName, fmtRange, fmtTime, fromIso, iso, shortDate } from "@/lib/clock";
import type { PlanStep } from "@/lib/eventPlan";
import { Icon } from "../Icon";
import "./week.css";

export interface WeekItem {
  key: string; date: string; start: number; end?: number; title: string; room: string; desc?: string;
  /** What happens, step by step. */
  plan: PlanStep[];
  cap?: number; taken?: number;
  /** The resident's interests it matches (empty: not picked for them). */
  picked: string[];
  going: boolean;
  /** Just added on Post (the preview marks it). */
  isNew?: boolean;
}

export function WeekPage({ brand, first, weekFrom, todayIso, nowMin = -1, items, onGo, onCancel, phone, openKey, preview = false }: {
  brand: string; first: string; weekFrom: string; todayIso: string; nowMin?: number; items: WeekItem[];
  onGo: (x: WeekItem) => void; onCancel: (x: WeekItem) => void; phone?: string;
  /** Open this one to begin with (the new event, in Post's preview). */
  openKey?: string; preview?: boolean;
}) {
  const from = fromIso(weekFrom);
  const days = Array.from({ length: 7 }, (_, i) => iso(addDays(from, i))).filter((d) => d >= todayIso);
  const left = (x: WeekItem) => x.date > todayIso || (x.date === todayIso && (nowMin < 0 || (x.end ?? x.start + 60) > nowMin));
  const shown = items.filter(left).sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start);
  // The ones picked for them come first, whatever day they're on; everything else follows a day at a time.
  const picked = shown.filter((x) => x.picked.length > 0);
  const rest = shown.filter((x) => x.picked.length === 0);
  const going = shown.filter((x) => x.going).length;
  const dayLabel = (d: string) => (d === todayIso ? "Today" : dayName(fromIso(d)));

  const card = (x: WeekItem, withDay: boolean) => {
    const full = x.cap !== undefined && (x.taken ?? 0) >= x.cap && !x.going;
    const seats = x.cap !== undefined ? Math.max(0, x.cap - (x.taken ?? 0)) : undefined;
    return (
      <li key={x.key} className={`wk-item${x.picked.length ? " is-pick" : ""}${x.going ? " is-going" : ""}${full ? " is-full" : ""}${x.isNew ? " is-new" : ""}`}>
        <details open={x.key === openKey || undefined}>
          <summary>
            <span className="wk-main">
              <span className="wk-time">{withDay ? `${dayLabel(x.date)} · ` : ""}{fmtRange(x.start, x.end)}</span>
              <span className="wk-name">{x.title}</span>
            </span>
            <span className="wk-tags">
              {x.isNew && <span className="wk-tag wk-tag-new">New</span>}
              {x.going ? <span className="wk-tag wk-tag-go"><Icon name="check" /> Going</span> : full ? <span className="wk-tag wk-tag-full">Full</span> : null}
            </span>
            <Icon name="chev" />
          </summary>
          <div className="wk-more">
            <p className="wk-when"><Icon name="clock" /> {dayLabel(x.date)}, {shortDate(fromIso(x.date))} · {fmtRange(x.start, x.end)}{x.room ? <> · {x.room}</> : null}</p>
            {x.desc && <p className="wk-desc">{x.desc}</p>}
            {x.plan.length > 0 && (
              <div className="wk-plan">
                <h3>What you’ll do</h3>
                <ol>
                  {x.plan.map((s, i) => <li key={i}><time>{fmtTime(s.at)}</time><span>{s.what}</span></li>)}
                </ol>
              </div>
            )}
            {x.picked.length > 0 && <p className="wk-why"><Icon name="star" /> Picked for you because you enjoy {x.picked.map((i) => i.toLowerCase()).join(" and ")}.</p>}
            {x.cap !== undefined && <p className="wk-seats">{full ? `Full: all ${x.cap} seats are taken.` : x.going ? "Your seat is saved." : `${seats} of ${x.cap} seats left.`}</p>}
            {x.going ? (
              <div className="wk-act">
                <span className="wk-done"><Icon name="check" /> You’re going</span>
                <button type="button" className="wk-link" onClick={() => onCancel(x)}>I can’t make it after all</button>
              </div>
            ) : (
              <div className="wk-act">
                <button type="button" className="wk-go" disabled={full} onClick={() => onGo(x)}>{full ? "Full" : "I’ll go"}</button>
                {full && <span className="wk-hint">Ask at the front desk to join the waitlist.</span>}
              </div>
            )}
          </div>
        </details>
      </li>
    );
  };

  return (
    <div className={`wk${preview ? " wk-preview" : ""}`}>
      <header className="wk-head">
        <p className="wk-brand">{brand}</p>
        <h1>Your week, {first}</h1>
        <p className="wk-sub">{shortDate(from)} – {shortDate(addDays(from, 6))}. Tap an activity to see what happens, and tap <b>I’ll go</b> to save your place.</p>
        {going > 0 && <p className="wk-sum"><span className="wk-sum-go"><Icon name="check" /> You’re going to {going}</span></p>}
      </header>

      {picked.length > 0 && (
        <section className="wk-day wk-picks">
          <h2><Icon name="star" /> Picked for you</h2>
          <ul className="wk-list">{picked.map((x) => card(x, true))}</ul>
        </section>
      )}

      {picked.length > 0 && rest.length > 0 && <h2 className="wk-rest-h">Everything else this week</h2>}
      {days.map((d) => {
        const list = rest.filter((x) => x.date === d);
        if (!list.length) return null;
        return (
          <section key={d} className="wk-day">
            <h2>{dayLabel(d)} <small>{shortDate(fromIso(d))}</small></h2>
            <ul className="wk-list">{list.map((x) => card(x, false))}</ul>
          </section>
        );
      })}
      {shown.length === 0 && <p className="wk-empty">Nothing else is on this week.</p>}

      <footer className="wk-foot">
        <p>Questions? Call the front desk{phone ? <> at <b>{phone}</b></> : null}, or reply to our text.</p>
        <p className="wk-small">This link is just for you. No password needed.</p>
      </footer>
    </div>
  );
}
