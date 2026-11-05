"use client";

import { useState } from "react";
import type { DayMenu, Dish, Tag, Venue } from "@/data/shared";
import { dayName, fromIso, monthName } from "@/lib/clock";
import { Icon } from "../Icon";
import { Badge } from "./ui";

const TAGS: Tag[] = ["GF", "VG", "DF"];
const tagName: Record<Tag, string> = { GF: "Gluten free", VG: "Vegetarian", DF: "Dairy free" };

/**
 * `barKey`: the coffeehouse and wine bar, whose daily special is a pour and a bite.
 * Publishing updates the website dining page, the weekly family digest and the large-print menu cards.
 */
export function MenuEditor({ menus, todayIso, lastPublished, barKey, publisher, domain, community, digest }: { menus: { venue: Venue; days: DayMenu[] }[]; todayIso: string; lastPublished: string; barKey?: string; publisher: string; domain: string; community: string; digest: string }) {
  const [v, setV] = useState(0);
  const [di, setDi] = useState(0);
  const [data, setData] = useState(menus);
  const [dirty, setDirty] = useState(false);
  const [pub, setPub] = useState<"idle" | "busy" | "done">("idle");
  const [stamp, setStamp] = useState(lastPublished);

  const venue = data[v].venue;
  const m = data[v].days[di];
  const d = fromIso(m.date);
  const update = (fn: (m: DayMenu) => DayMenu) => {
    setData((x) => x.map((vv, i) => (i !== v ? vv : { ...vv, days: vv.days.map((dm, j) => (j === di ? fn(dm) : dm)) })));
    setDirty(true);
    setPub("idle");
  };
  const setDish = (k: "special" | "soup", patch: Partial<Dish>) => update((mm) => ({ ...mm, [k]: { ...mm[k], ...patch } }));
  const toggleTag = (k: "special" | "soup", t: Tag) => {
    const cur = m[k].tags ?? [];
    setDish(k, { tags: cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t] });
  };

  return (
    <>
      <div className="sx-tabs" role="tablist" aria-label="Restaurant">
        {data.map((x, i) => (
          <button key={x.venue.key} role="tab" aria-selected={v === i} onClick={() => { setV(i); }}>
            <Icon name={x.venue.key === barKey ? "coffee" : "fork"} /> {x.venue.name}
          </button>
        ))}
      </div>

      <div className="med-days" role="group" aria-label="Day">
        {data[v].days.map((dm, j) => {
          const dd = fromIso(dm.date);
          return (
            <button key={dm.date} type="button" aria-pressed={di === j} className={dm.holiday ? "hol" : ""} onClick={() => setDi(j)}>
              <small>{dm.date === todayIso ? "Today" : dayName(dd).slice(0, 3)}</small>
              <b>{dd.getUTCDate()}</b>{dm.holiday && <span className="vh"> {dm.holiday}</span>}
              <small>{monthName(dd).slice(0, 3)}</small>
            </button>
          );
        })}
      </div>

      <div className="med">
        <section className="sx-card">
          <header className="sx-card-head">
            <div>
              <h2>{venue.name} · {dayName(d)}, {monthName(d)} {d.getUTCDate()}</h2>
              <p>{venue.kind} · {venue.hours}</p>
            </div>
            {m.holiday ? <Badge tone="good"><Icon name="check" /> {m.holiday} menu ready</Badge> : <Badge tone={dirty ? "warn" : "good"}>{dirty ? "Unpublished changes" : "Published"}</Badge>}
          </header>
          <div className="sx-card-body sx-form">
            {(["special", "soup"] as const).map((k) => (
              <fieldset key={k} style={{ border: "1px solid var(--sx-line)", borderRadius: 10, padding: "10px 12px 12px", margin: 0, display: "grid", gap: 8 }}>
                <legend className="sx-lbl" style={{ padding: "0 4px" }}>{k === "special" ? (venue.key === barKey ? "Pour and bite of the day" : "Daily special") : "Soup of the day"}</legend>
                <label>
                  <span className="vh">{k === "special" ? "Special" : "Soup"} name</span>
                  <input value={m[k].name} onChange={(e) => setDish(k, { name: e.target.value })} />
                </label>
                {k === "special" && (
                  <label>
                    <span className="vh">Description</span>
                    <input value={m.special.desc ?? ""} onChange={(e) => setDish("special", { desc: e.target.value })} placeholder="Description" />
                  </label>
                )}
                <div className="med-tags" role="group" aria-label="Dietary tags">
                  {TAGS.map((t) => (
                    <button key={t} type="button" aria-pressed={(m[k].tags ?? []).includes(t)} onClick={() => toggleTag(k, t)} title={tagName[t]}>
                      {t} <span className="vh">{tagName[t]}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}
            <div className="med-sec">
              {m.sections.map((s) => (
                <div key={s.title}>
                  <h3>{s.title}{s.note ? ` · ${s.note}` : ""}</h3>
                  {s.items.map((it) => (
                    <div key={it.name} className="med-item">
                      <span>
                        <b>{it.name}</b>
                        {it.desc && <small>{it.desc}</small>}
                      </span>
                      <span className="med-tags" aria-label="Dietary tags">
                        {(it.tags ?? []).map((t) => <Badge key={t} tone="good">{t}</Badge>)}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="sx-grid">
          <section className="sx-card">
            <header className="sx-card-head">
              <div>
                <h2>Publish</h2>
                <p>Last published {pub === "done" ? "just now" : stamp} by {publisher}</p>
              </div>
            </header>
            <div className="sx-card-body" style={{ display: "grid", gap: 12 }}>
              <button
                type="button"
                className="sx-btn sx-btn-terra sx-btn-lg"
                disabled={pub === "busy"}
                onClick={() => { setPub("busy"); window.setTimeout(() => { setPub("done"); setDirty(false); setStamp("just now"); }, 900); }}
              >
                <Icon name="send" /> {pub === "busy" ? "Publishing…" : "Publish menus"}
              </button>
              {pub === "done" && (
                <div className="sx-callout good" role="status">
                  <Icon name="check" />
                  <p>Live on {domain}/dining, in this week’s family digest, and the large-print menu cards are ready to print.</p>
                </div>
              )}
              <ul className="sx-list">
                <li className="sx-fresh"><span className="ok"><Icon name="check" /></span><b>Website dining page</b><Badge tone="good">Live</Badge></li>
                <li className="sx-fresh"><span className="ok"><Icon name="check" /></span><b>Weekly family digest</b><Badge tone="info">{digest}</Badge></li>
                <li className="sx-fresh"><span className="ok"><Icon name="check" /></span><b>Large-print menu cards</b><Badge tone="good">Ready to print</Badge></li>
              </ul>
            </div>
          </section>

          <section className="sx-card">
            <header className="sx-card-head">
              <div><h2>Printed menu card</h2><p>Large print · letter · 18 pt, for tables and the front desk</p></div>
              <button type="button" className="sx-btn sx-btn-sm" onClick={() => window.print()}><Icon name="printer" /> Print</button>
            </header>
            <div className="sx-card-body">
              <article className="mcard" aria-label="Printed menu card preview">
                <header>
                  <small>{community}</small>
                  <h3>{venue.name}</h3>
                  <p>{dayName(d)}, {monthName(d)} {d.getUTCDate()}{m.holiday ? ` · ${m.holiday}` : ""}</p>
                </header>
                <dl>
                  <div><dt>{m.holiday ? m.holiday : venue.key === barKey ? "Today’s pour and bite" : "Chef’s special"}</dt><dd>{m.special.name}{m.special.desc && <small>{m.special.desc}</small>}{m.special.tags?.length ? <em>{m.special.tags.map((t) => tagName[t]).join(" · ")}</em> : null}</dd></div>
                  <div><dt>Soup of the day</dt><dd>{m.soup.name}{m.soup.tags?.length ? <em>{m.soup.tags.map((t) => tagName[t]).join(" · ")}</em> : null}</dd></div>
                </dl>
                <footer>{venue.hours}</footer>
              </article>
              <p className="sx-note" style={{ marginBottom: 0 }}>Dietary tags are spelled out in full, never abbreviated. The same menu is on {domain}/dining and in the weekly digest.</p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
