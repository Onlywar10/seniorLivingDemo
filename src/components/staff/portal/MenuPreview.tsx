"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { courseLabels, cycleWeek, tagLabels, type CourseKey, type Dish, type MealPeriod, type Section, type Tag } from "@/data/shared";
import type { BoardVenue, HolidayMenu } from "@/data/staff/menus";
import { addDays, dayName, dow, fmtRange, fromIso, iso, monthGrid, monthName, shortDate } from "@/lib/clock";
import { Badge } from "../ui";
import { Help } from "./Help";
import type { CycleValue } from "./MenusCalendar";
import type { LiveMenu } from "./MenusToday";

const spell = (tags?: readonly Tag[]) => (tags ?? []).map((t) => tagLabels[t]).join(" · ");
type Item = { course: string; name: string; desc?: string; tags?: Tag[]; off?: boolean };
interface DayView {
  date: string;
  holiday?: string;
  meals: { label: string; time: string; items: Item[] }[];
  specials: Item[];
  /** One line for the monthly calendar and the newsletter. */
  headline?: string;
  changes: string[];
}
type Channel = "website" | "phone" | "newsletter" | "card" | "weekly" | "monthly" | "tv";
const CHANNELS: { key: Channel; label: string; beta?: boolean }[] = [
  { key: "website", label: "Website" },
  { key: "phone", label: "Phone" },
  { key: "newsletter", label: "Sunday newsletter" },
  { key: "card", label: "Large-print card" },
  { key: "weekly", label: "Weekly sheet" },
  { key: "monthly", label: "Monthly calendar" },
  { key: "tv", label: "Menu board / TV", beta: true },
];

/** One day of a restaurant's menu, from what's in Menus right now (edits, imports and today's swaps included). */
function dayView(v: BoardVenue, meals: MealPeriod[], cycle: CycleValue, daily: BoardVenue["daily"], live: LiveMenu | undefined, holidays: HolidayMenu[], date: string, todayIso: string): DayView {
  const hol = holidays.find((h) => h.date === date && h.venue === v.venue.key && h.status === "approved" && h.kind === "holiday");
  const out: DayView = { date, meals: [], specials: [], changes: [] };
  if (hol) return { ...out, holiday: hol.name, headline: hol.name, meals: [{ label: hol.name, time: hol.hours ?? "", items: hol.items.map((n) => ({ course: "", name: n })) }] };
  if (v.template === "cycle" && v.cycle) {
    const d = fromIso(date);
    const day = cycle.once[date] ?? cycle.days[cycleWeek(v.cycle, d)]?.[dow(d)] ?? [];
    out.meals = meals.map((p) => {
      const m = day.find((x) => x.period === p.key);
      const items: Item[] = (Object.entries(m?.courses ?? {}) as [CourseKey, Dish][]).filter(([, x]) => x?.name).map(([k, x]) => ({ course: courseLabels[k], name: x.name, desc: x.desc, tags: x.tags }));
      return { label: p.label, time: fmtRange(m?.start ?? p.start, m?.end ?? p.end), items };
    }).filter((m) => m.items.length);
    out.headline = out.meals[out.meals.length - 1]?.items[0]?.name;
  } else {
    const vals = daily.find((x) => x.date === date)?.values ?? {};
    out.specials = (v.slots ?? []).flatMap((s): Item[] => vals[s.key] ? [{ course: `${s.label}${s.period && s.period !== "All day" ? ` · ${s.period}` : ""}`, name: vals[s.key].name, desc: vals[s.key].desc, tags: vals[s.key].tags }] : []);
    if (!out.specials.length && v.template === "daily" && date > todayIso) out.specials = (v.slots ?? []).map((s) => ({ course: s.label, name: "Posted that morning" }));
    out.headline = out.specials[0]?.name;
  }
  // Today: what the kitchen swapped or took off since 5 am.
  if (date === todayIso && live) {
    out.changes = live.log;
    const all = [...out.meals.flatMap((x) => x.items), ...out.specials];
    for (const l of live.log) {
      const what = l.split(" · ")[0];
      const sw = what.match(/^(.*) instead of (.*)$/);
      const off = what.match(/^(.*) taken off$/);
      for (const it of all) {
        if (sw && it.name === sw[2]) { it.name = sw[1]; it.desc = undefined; it.tags = undefined; }
        if (off && it.name === off[1]) it.off = true;
      }
    }
  }
  return out;
}

/**
 * "Preview as": exactly what each audience gets from this restaurant's menu, built from the same data the kitchen
 * edits (so a change in the editor shows here at once): the website dining page, the phone (the morning text, a reply
 * to "What's for lunch?", a booking confirmation), the Sunday newsletter, the large-print card, the weekly sheet, the
 * monthly dining calendar, and the menu board (Beta).
 */
export function MenuPreview({ v, meals, cycle, standing, daily, live, holidays, todayIso, community, optIns, onClose }: {
  v: BoardVenue; meals: MealPeriod[]; cycle: CycleValue; standing: Section[]; daily: BoardVenue["daily"]; live?: LiveMenu; holidays: HolidayMenu[];
  todayIso: string; community: string; optIns: number; onClose: () => void;
}) {
  const [ch, setCh] = useState<Channel>("website");
  const [day, setDay] = useState(todayIso);
  const t0 = fromIso(todayIso);
  const week = Array.from({ length: 7 }, (_, i) => iso(addDays(t0, i)));
  const view = (d: string) => dayView(v, meals, cycle, daily, live, holidays, d, todayIso);
  const dv = view(day);
  const dLabel = (d: string) => `${dayName(fromIso(d))}, ${shortDate(fromIso(d))}`;
  const name = v.venue.name;
  const lunch = dv.meals.find((m) => /lunch/i.test(m.label)) ?? dv.meals[0];
  const dinner = dv.meals.find((m) => /dinner/i.test(m.label)) ?? dv.meals[dv.meals.length - 1];
  const lines = (m?: { items: Item[] }, n = 3) => (m?.items ?? []).filter((x) => !x.off).slice(0, n).map((x) => `${x.course && x.course !== "Entrée" && x.course !== "Alternate" ? `${x.course.toLowerCase()}: ` : ""}${x.name}`);
  /** "Fish tacos, or cottage cheese and fruit plate": the entrée and the alternate, as people say it. */
  const pair = (m?: { items: Item[] }) => { const e = m?.items.find((x) => x.course === "Entrée" && !x.off); const a = m?.items.find((x) => x.course === "Alternate" && !x.off); return [e?.name, a && `or ${a.name.charAt(0).toLowerCase()}${a.name.slice(1)}`].filter(Boolean).join(", "); };
  const upcoming = holidays.filter((h) => h.status === "approved" && h.venue === v.venue.key && h.date > todayIso).sort((a, b) => a.date.localeCompare(b.date))[0];

  const standingBlock = (
    <details className="mp-std">
      <summary>Always available: ask your server <small>({standing.reduce((n, s) => n + s.items.length, 0)} dishes)</small></summary>
      {standing.map((s) => (
        <div key={s.title}><b>{s.title}</b><ul>{s.items.map((it) => <li key={it.name}>{it.name}{it.tags?.length ? <em> {spell(it.tags)}</em> : null}</li>)}</ul></div>
      ))}
    </details>
  );
  const itemsOf = (d: DayView) => (
    <>
      {d.meals.map((m) => (
        <div key={m.label} className="mp-meal">
          <h5>{m.label} <small>{m.time}</small></h5>
          <ul>{m.items.map((it, i) => <li key={i} className={it.off ? "off" : ""}><small>{it.course}</small><b>{it.name}</b>{it.off && <em className="mp-off"> Off today</em>}{it.desc && <span>{it.desc}</span>}{it.tags?.length ? <em>{spell(it.tags)}</em> : null}</li>)}</ul>
        </div>
      ))}
      {d.specials.length > 0 && (
        <div className="mp-meal">
          <h5>{v.template === "daily" ? "Today’s board" : "Chef’s special"}</h5>
          <ul>{d.specials.map((it, i) => <li key={i}><small>{it.course}</small><b>{it.name}</b>{it.desc && <span>{it.desc}</span>}{it.tags?.length ? <em>{spell(it.tags)}</em> : null}</li>)}</ul>
        </div>
      )}
    </>
  );

  return (
    <section className="sx-card mp" aria-labelledby={`mp-h-${v.venue.key}`}>
      <header className="sx-card-head">
        <div>
          <h2 id={`mp-h-${v.venue.key}`}><Icon name="eye" /> Preview as
            <Help label="About previews"><p>Every view is built from the same menu you edit here, so a change shows in all of them at once. Nothing is typed twice.</p></Help>
          </h2>
          <p>{name} · {dLabel(day)}</p>
        </div>
        <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={onClose}><Icon name="x" /> Close</button>
      </header>
      <div className="sx-card-body">
        <div className="mp-bar">
          <div className="sx-tabs" role="tablist" aria-label="Preview as">
            {CHANNELS.map((c) => <button key={c.key} type="button" role="tab" aria-selected={ch === c.key} onClick={() => setCh(c.key)}>{c.label}{c.beta && <small className="mn-tabn"> · Beta</small>}</button>)}
          </div>
          <label className="mp-day">Day
            <select value={day} onChange={(e) => setDay(e.target.value)}>
              {week.map((d) => <option key={d} value={d}>{d === todayIso ? `Today, ${shortDate(fromIso(d))}` : dLabel(d)}</option>)}
            </select>
          </label>
        </div>

        <div className="mp-stage">
          {ch === "website" && (
            <div className="mp-web">
              <div className="mp-web-bar"><span /><span /><span /><b>{community.toLowerCase().replace(/\s+/g, "")}.example/dining</b></div>
              <div className="mp-web-body">
                <h4>{name}</h4>
                <div className="mp-days">{week.map((d) => <button key={d} type="button" aria-pressed={d === day} onClick={() => setDay(d)}>{d === todayIso ? "Today" : dayName(fromIso(d)).slice(0, 3)}</button>)}</div>
                {dv.holiday && <p className="mp-hol"><Icon name="star" /> {dv.holiday}: reply to your Sunday email or text {name} to reserve</p>}
                {itemsOf(dv)}
                {standingBlock}
                <p className="mp-book"><Icon name="sms" /> Text {name} to reserve, or reply to your Sunday email.</p>
              </div>
            </div>
          )}

          {ch === "phone" && (
            <div className="mp-phones">
              <figure className="mp-phone">
                <figcaption>“What’s for dinner”, each morning (opt-in)</figcaption>
                <div className="mp-sms"><p>Good morning! Today at {name}:</p>
                  {dv.meals.map((m) => <p key={m.label}><b>{m.label} {m.time}:</b> {pair(m) || lines(m, 2).join("; ")}</p>)}
                  {dv.specials.length > 0 && <p>{dv.specials.map((s) => `${s.course}: ${s.name}`).join("; ")}</p>}
                  <p>Always available: ask your server. Reply BOOK to reserve.</p></div>
              </figure>
              <figure className="mp-phone">
                <figcaption>A reply to “What’s for lunch?”</figcaption>
                <div className="mp-sms me"><p>What’s for lunch?</p></div>
                <div className="mp-sms"><p>{lunch ? `Lunch at ${name}, ${lunch.time}: ${[pair(lunch), ...lines(lunch, 4).filter((x) => /^(soup|dessert|starch|vegetable):/.test(x))].filter(Boolean).join("; ")}.` : dv.specials.length ? `At ${name} today: ${dv.specials.map((s) => s.name).join(", ")}.` : `${name} has no lunch today.`} Always available: ask your server.</p></div>
              </figure>
              <figure className="mp-phone">
                <figcaption>A resident’s booking confirmation</figcaption>
                <div className="mp-sms me"><p>Table for 2 at 5:30?</p></div>
                <div className="mp-sms"><p>You’re booked: a table for 2 at 5:30 pm, {dLabel(day)}, at {name}.{dinner ? ` On the menu: ${pair(dinner) || lines(dinner, 2).join(", ")}.` : ""} We’ll text a reminder 2 hours before. Reply CANCEL to cancel.</p></div>
              </figure>
            </div>
          )}

          {ch === "newsletter" && (
            <div className="mp-mail">
              <p className="mp-mail-k">Sunday newsletter · Dining this week</p>
              <h4>This week at {name}</h4>
              <ul>{week.slice(0, 7).map((d) => ({ d, x: view(d) })).filter((x) => x.x.headline).filter((_, i) => i % 2 === 0).slice(0, 3).map(({ d, x }) => <li key={d}><b>{dayName(fromIso(d))}:</b> {x.headline}</li>)}</ul>
              <p className="mp-mail-alt">Always available: ask your server.</p>
              {upcoming && (
                <div className="mp-mail-hol">
                  <b>{upcoming.name}</b> · {upcoming.label}{upcoming.hours ? ` · ${upcoming.hours}` : ""}
                  <p>{upcoming.items.slice(0, 4).join(" · ")}</p>
                  <p>Reply to this email or text {name} to book.{upcoming.booking ? ` ${upcoming.booking}.` : ""}</p>
                </div>
              )}
            </div>
          )}

          {ch === "card" && (
            <article className="mcard" aria-label="Large-print menu card">
              <header>
                <small>{community}</small>
                <h3>{name}</h3>
                <p>{dayName(fromIso(day))}, {monthName(fromIso(day))} {fromIso(day).getUTCDate()}{dv.holiday ? ` · ${dv.holiday}` : ""}</p>
              </header>
              <dl>
                {dv.meals.map((m) => <div key={m.label}><dt>{m.label} · {m.time}</dt><dd>{m.items.filter((x) => !x.off).slice(0, 2).map((x) => x.name).join(" or ")}{m.items.find((x) => x.course === "Soup") && <small>Soup: {m.items.find((x) => x.course === "Soup")!.name}</small>}</dd></div>)}
                {dv.specials.map((s) => <div key={s.course}><dt>{s.course}</dt><dd>{s.name}{s.tags?.length ? <em>{spell(s.tags)}</em> : null}</dd></div>)}
                <div><dt>Always available</dt><dd>Ask your server for anything on our everyday menu</dd></div>
              </dl>
              <footer>{meals.map((p) => `${p.label} ${fmtRange(p.start, p.end)}`).join(" · ")}</footer>
            </article>
          )}

          {ch === "weekly" && (
            <div className="mp-paper">
              <h4>{name} · week of {shortDate(fromIso(week[0]))}</h4>
              <table className="mp-week">
                <thead><tr><th />{week.map((d) => <th key={d}>{dayName(fromIso(d)).slice(0, 3)} {fromIso(d).getUTCDate()}</th>)}</tr></thead>
                <tbody>
                  {(v.template === "cycle" ? meals.map((p) => p.label) : ["Today’s menu"]).map((row) => (
                    <tr key={row}><th>{row}</th>{week.map((d) => { const x = view(d); const m = x.meals.find((y) => y.label === row); return <td key={d}>{x.holiday ? x.holiday : m ? m.items.slice(0, 2).map((i) => i.name).join(" / ") : x.specials.map((s) => s.name).slice(0, 2).join(" / ") || "—"}</td>; })}</tr>
                  ))}
                </tbody>
              </table>
              <p className="mp-paper-foot">Always available on the back · for the front desk, the dining room door and residents’ mailboxes</p>
            </div>
          )}

          {ch === "monthly" && (() => {
            const d0 = fromIso(day);
            const grid = monthGrid(d0.getUTCFullYear(), d0.getUTCMonth());
            return (
              <div className="mp-paper">
                <h4>{name} · {monthName(d0)} dining calendar</h4>
                <div className="mp-month">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((x) => <b key={x}>{x}</b>)}
                  {grid.flat().map((d) => { const di = iso(d); const inMonth = d.getUTCMonth() === d0.getUTCMonth(); const x = inMonth ? view(di) : null; return (
                    <span key={di} className={`${inMonth ? "" : "out"}${di === todayIso ? " td" : ""}${x?.holiday ? " hol" : ""}`}><small>{d.getUTCDate()}</small>{x?.headline}</span>
                  ); })}
                </div>
                <p className="mp-paper-foot">{v.template === "cycle" ? "Each day’s dinner entrée" : v.template === "standing" ? "Each day’s chef’s special" : "Each day’s board"} · printed for the front desk on the 25th</p>
              </div>
            );
          })()}

          {ch === "tv" && (
            <div className="mp-tv">
              <Badge tone="info">Coming in Beta</Badge>
              <div className="mp-tv-screen">
                <small>{community} · {dayName(fromIso(day))}</small>
                <b>{name}</b>
                {dv.meals.slice(-1).map((m) => <p key={m.label}>{m.label}: {lines(m, 2).join(" · ")}</p>)}
                {dv.specials.slice(0, 2).map((s) => <p key={s.course}>{s.course}: {s.name}</p>)}
              </div>
              <p className="sx-note">Lobby TVs and in-room TV, from the same menu, are coming in Beta.</p>
            </div>
          )}
        </div>

        {dv.changes.length > 0 && day === todayIso && <p className="mp-chg"><Icon name="edit" /> Changed today: {dv.changes.join(" · ")}</p>}
        <p className="mp-out"><Icon name="send" /> This goes out at 5:00 am to the website, the cards and {optIns} opted-in texts.</p>
      </div>
    </section>
  );
}
