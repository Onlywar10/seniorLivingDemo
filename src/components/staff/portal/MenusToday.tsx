"use client";

import { useEffect, useId, useState } from "react";
import { Icon } from "@/components/Icon";
import { tagLabels, type DayMenu, type Tag, type Venue } from "@/data/shared";
import type { MenuBoard, SubEntry } from "@/data/staff/menus";
import { fmtTime, nowMinutes } from "@/lib/clock";
import { say } from "../store";
import { Help } from "./Help";

const spell = (tags?: Tag[]) => (tags ?? []).map((t) => tagLabels[t]).join(" · ");

/** One restaurant's menu as it is on the website today, with what the kitchen took off or swapped since 5 am. */
export interface LiveMenu { venue: Venue; bar: boolean; menu: DayMenu; off: { special?: boolean; soup?: boolean }; log: string[] }
/** Which dish: the special, the soup, or an item in a meal period ("2:4" is section 2, item 4). */
type DishKey = "special" | "soup" | `${number}:${number}`;

const nameOf = (m: DayMenu, k: DishKey) => {
  if (k === "special" || k === "soup") return m[k].name;
  const [i, j] = k.split(":").map(Number);
  return m.sections[i]?.items[j]?.name ?? "";
};

/**
 * Today's menus as they are live on the website. The kitchen can change today ("we're out of the short rib"): swap a
 * dish for another, or take it off. The dining page and every community page show the change at once; Undo puts it
 * back. A new dish has no dietary tags until someone adds them. `canEdit`: the kitchen and the administrator.
 * Each change also goes to the substitution log (`onLog`), with what changed, when and who.
 */
export function LiveToday({ week, times, canEdit, me, diningHref, homeHref, onLog, booked = [], onMenus, startOut }: {
  week: MenuBoard; times?: string; canEdit: boolean; me: string; diningHref: string; homeHref: string; onLog: (e: SubEntry | null) => void;
  /** Who is booked or ordered for today's meal: each gets a short text when a dish is swapped or taken off. */
  booked?: { name: string; who: string }[];
  /** Today's menus as changed, for the restaurant's preview. */
  onMenus?: (m: LiveMenu[]) => void;
  /** Open the "We're out of something" form straight away (from Today's quick action). */
  startOut?: boolean;
}) {
  const hid = useId();
  const [menus, setMenus] = useState<LiveMenu[]>(() => week.live.menus.map((m) => ({ ...m, off: {}, log: [] })));
  const [told, setTold] = useState<{ line: string; text: string; people: { name: string; who: string }[] }[]>([]);
  useEffect(() => { onMenus?.(menus); }, [menus, onMenus]);
  const [open, setOpen] = useState<string | null>(startOut && canEdit ? week.live.menus[0]?.venue.key ?? null : null);
  const [form, setForm] = useState<{ dish: DishKey; instead: string }>({ dish: "special", instead: "" });

  const apply = (vk: string, how: "swap" | "remove") => {
    const before = menus;
    const cur = menus.find((m) => m.venue.key === vk);
    if (!cur) return;
    const old = nameOf(cur.menu, form.dish);
    const instead = form.instead.trim();
    if (!old || (how === "swap" && !instead)) return;
    const at = fmtTime(nowMinutes());
    const line = how === "swap" ? `${instead} instead of ${old}` : `${old} taken off`;
    setMenus((ms) => ms.map((m) => {
      if (m.venue.key !== vk) return m;
      const k = form.dish;
      let menu = m.menu;
      const off = { ...m.off };
      if (k === "special" || k === "soup") {
        if (how === "swap") { menu = { ...menu, [k]: { name: instead } }; off[k] = false; }
        else off[k] = true;
      } else {
        const [i, j] = k.split(":").map(Number);
        menu = {
          ...menu,
          sections: menu.sections.map((sct, si) => (si !== i ? sct : { ...sct, items: how === "swap" ? sct.items.map((it, ij) => (ij === j ? { name: instead } : it)) : sct.items.filter((_, ij) => ij !== j) })),
        };
      }
      return { ...m, menu, off, log: [...m.log, `${line} · ${me}, ${at}`] };
    }));
    const id = `sub-now-${vk}-${cur.log.length}`;
    onLog({ id, date: week.live.date, when: `Today, ${at}`, venue: vk, venueName: cur.venue.name, what: line, by: me });
    // Everyone booked or ordered for the meal hears straight away, with the alternative.
    const text = how === "swap"
      ? `${cur.venue.name}: we’re out of the ${old} today. The chef suggests ${instead} instead. Anything else from the always-available menu too: just ask your server.`
      : `${cur.venue.name}: the ${old} is off today’s menu. Anything from the always-available menu instead: just ask your server.`;
    if (booked.length) setTold((x) => [{ line, text, people: booked }, ...x]);
    setOpen(null);
    setForm({ dish: "special", instead: "" });
    say(`${how === "swap" ? `${instead} instead of ${old}` : `${old} is off today’s menu`}: on the website, the cards and the morning text now${booked.length ? `, and ${booked.length} people who booked were texted` : ""}`, () => { setMenus(before); onLog(null); setTold((x) => x.slice(1)); });
  };

  return (
    <section className="sx-card mn-live" id={`mn-live-${week.live.menus[0]?.venue.key ?? "all"}`} aria-labelledby={hid}>
      <header className="sx-card-head">
        <div>
          <h2 id={hid}><span className="mn-dot" aria-hidden="true" /> Live today
            <Help label="Where today’s menus show">
              <p>Shown automatically on <a className="sx-link" href={diningHref} target="_blank" rel="noreferrer">the dining page</a> and in the “Today’s menu” block on <a className="sx-link" href={homeHref} target="_blank" rel="noreferrer">every community page</a>.</p>
              <p>Out of something? The kitchen can change today: swap a dish or take it off, and the website shows it at once. Tomorrow’s menu replaces it at 5:00 am.</p>
              <p>Every change goes in the substitution log and on the dated record of what was served.</p>
            </Help>
          </h2>
          <p>{week.live.label} · published {week.live.published}</p>
          {startOut && <span id="out" />}
        </div>
        <a className="sx-btn sx-btn-sm sx-btn-quiet" href={diningHref} target="_blank" rel="noreferrer"><Icon name="globe" /> Dining page</a>
      </header>
      <div className="sx-card-body">
        <ul className={`mn-today${menus.length === 1 ? " one" : ""}`}>
          {menus.map(({ venue, bar, menu, off, log }) => (
            <li key={venue.key}>
              <h3><Icon name={bar ? "coffee" : "fork"} /> {venue.name}</h3>
              <small>{times ?? venue.hours}</small>
              <p>
                <span className="mn-k">{menu.holiday ?? (bar ? "Pour and bite" : "Chef’s special")}</span>
                {off.special ? <span className="mn-off"><s>{menu.special.name}</s> Off today</span> : <b>{menu.special.name}</b>}
                {!off.special && menu.special.desc && <span className="mn-desc">{menu.special.desc}</span>}
                {!off.special && menu.special.tags?.length ? <em>{spell(menu.special.tags)}</em> : null}
              </p>
              <p>
                <span className="mn-k">Soup</span>
                {off.soup ? <span className="mn-off"><s>{menu.soup.name}</s> Off today</span> : <b>{menu.soup.name}</b>}
                {!off.soup && menu.soup.tags?.length ? <em>{spell(menu.soup.tags)}</em> : null}
              </p>
              <p className="mn-alt"><Icon name="fork" /> Always available: ask your server for anything on {venue.name}’s everyday menu.</p>
              {told.length > 0 && told.map((x, i) => (
                <details key={i} className="mn-told">
                  <summary><Icon name="sms" /> Texted {x.people.length} people booked for today: {x.line}</summary>
                  <p className="mn-told-msg">“{x.text}”</p>
                  <ul>{x.people.map((p) => <li key={p.name}><b>{p.name}</b> · {p.who}</li>)}</ul>
                </details>
              ))}
              {log.length > 0 && (
                <ul className="mn-log" aria-label={`Changed today at ${venue.name}`}>
                  {log.map((l, i) => <li key={i}><Icon name="edit" /> {l}</li>)}
                </ul>
              )}
              {canEdit && (open === venue.key ? (
                <form className="sx-form mn-swap" onSubmit={(e) => { e.preventDefault(); apply(venue.key, "swap"); }}>
                  <label>Which dish
                    <select value={form.dish} onChange={(e) => setForm((f) => ({ ...f, dish: e.target.value as DishKey }))}>
                      {!off.special && <option value="special">{menu.special.name}</option>}
                      {!off.soup && <option value="soup">Soup: {menu.soup.name}</option>}
                      {menu.sections.map((sct, i) => (
                        <optgroup key={sct.title} label={sct.title}>
                          {sct.items.map((it, j) => <option key={it.name + j} value={`${i}:${j}`}>{it.name}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </label>
                  <label>Instead <small>(leave empty to take it off)</small>
                    <input value={form.instead} onChange={(e) => setForm((f) => ({ ...f, instead: e.target.value }))} placeholder="What you’re serving instead" />
                  </label>
                  <p className="pt-act">
                    <button type="submit" className="sx-btn sx-btn-primary sx-btn-sm" disabled={!form.instead.trim()}><Icon name="check" /> Swap it</button>
                    <button type="button" className="sx-btn sx-btn-sm" onClick={() => apply(venue.key, "remove")}><Icon name="x" /> Take it off</button>
                    <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => setOpen(null)}>Cancel</button>
                  </p>
                </form>
              ) : (
                <button type="button" className="sx-btn sx-btn-sm mn-today-change" onClick={() => { setOpen(venue.key); setForm({ dish: !off.special ? "special" : !off.soup ? "soup" : "0:0", instead: "" }); }}><Icon name="edit" /> We’re out of something</button>
              ))}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
