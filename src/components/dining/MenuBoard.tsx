"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { tagLabels, venues, type DayMenu, type Dish, type Tag } from "@/data/menus";
import { fmtTime, nowMinutes } from "@/lib/clock";
import { Icon } from "@/components/Icon";

export interface MenuDay { date: string; label: string; long: string; menus: DayMenu[] }

const TAGS: Tag[] = ["GF", "VG", "DF"];
const second: Record<string, [string, string]> = {
  cypress: ["/img/dish-salmon.jpg", "Grilled salmon filet with lemon herb butter"],
  natoma: ["/img/dish-french-toast.jpg", "Thick-sliced French toast with berries"],
  rendezvous: ["/img/rendezvous-bar.jpg", "The Rendezvous bar with its espresso machine and wine shelves"],
};
const mainPhotoAlt: Record<string, string> = {
  cypress: "The Cypress Room set with white tablecloths",
  natoma: "Natoma Café’s sunny dining area",
  rendezvous: "The Rendezvous coffeehouse with café tables",
};

function Tags({ tags }: { tags?: Tag[] }) {
  if (!tags?.length) return null;
  return (
    <span className="din-tags">
      {tags.map((t) => (
        <abbr key={t} className={`tag tag-${t}`} title={tagLabels[t]} aria-label={tagLabels[t]}>{t}</abbr>
      ))}
    </span>
  );
}

function DishRow({ d }: { d: Dish }) {
  return (
    <li className="din-dish">
      <div className="din-dish-top">
        <span className="din-dish-name">{d.name}</span>
        <Tags tags={d.tags} />
      </div>
      {d.desc && <p className="din-dish-desc">{d.desc}</p>}
    </li>
  );
}

/** Today’s menus for all three restaurants, with a day picker and dietary filter. */
export function MenuBoard({ days, extra, todayIso, nowMin }: { days: MenuDay[]; extra?: MenuDay; todayIso: string; nowMin: number }) {
  const [sel, setSel] = useState(todayIso);
  const [diet, setDiet] = useState<Tag[]>([]);
  const [now, setNow] = useState(nowMin);

  useEffect(() => {
    const id = setInterval(() => setNow(nowMinutes()), 30_000);
    const onHash = () => { if (window.location.hash === "#menus-thanksgiving" && extra) setSel(extra.date); };
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => { clearInterval(id); window.removeEventListener("hashchange", onHash); };
  }, [extra]);

  const all = extra ? [...days, extra] : days;
  const day = all.find((d) => d.date === sel) ?? days[0];
  const isToday = day.date === todayIso;
  const fits = (d: Dish) => diet.every((t) => d.tags?.includes(t));
  const toggle = (t: Tag) => setDiet((a) => (a.includes(t) ? a.filter((x) => x !== t) : [...a, t]));

  return (
    <div className="din-board">
      <div className="din-controls">
        <div className="din-days" role="group" aria-label="Choose a day">
          {days.map((d) => (
            <button key={d.date} type="button" className={`din-day${d.date === todayIso ? " is-today" : ""}${d.date < todayIso ? " is-past" : ""}`} aria-pressed={sel === d.date} onClick={() => setSel(d.date)}>
              <span className="din-day-dow">{d.date === todayIso ? "Today" : d.label.split(", ")[0]}</span>
              <span className="din-day-date">{d.label.split(", ")[1]}</span>
            </button>
          ))}
          {extra && (
            <button type="button" className="din-day din-day-holiday" aria-pressed={sel === extra.date} onClick={() => setSel(extra.date)}>
              <span className="din-day-dow">Thanksgiving</span>
              <span className="din-day-date">{extra.label.split(", ")[1]}</span>
            </button>
          )}
        </div>
        <div className="din-diet">
          <div className="din-diet-btns" role="group" aria-label="Show only dishes that are">
            <span className="din-diet-label" aria-hidden="true"><Icon name="filter" /> Show only</span>
            {TAGS.map((t) => (
              <button key={t} type="button" className={`din-diet-btn din-diet-${t}`} aria-pressed={diet.includes(t)} onClick={() => toggle(t)}>
                <span className={`tag tag-${t}`} aria-hidden="true">{t}</span> {tagLabels[t]}
              </button>
            ))}
            {diet.length > 0 && <button type="button" className="din-diet-clear" onClick={() => setDiet([])}>Show everything</button>}
          </div>
        </div>
      </div>

      <p className="din-showing" aria-live="polite">
        <b>{isToday ? `Today, ${day.long.split(", ")[1]}` : day.long}</b>
        {diet.length > 0 && <> · showing {diet.map((t) => tagLabels[t].toLowerCase()).join(" and ")} dishes</>}
      </p>

      <div className="din-venues">
        {day.menus.map((m) => {
          const v = venues[m.venue];
          const holiday = m.holiday;
          const open = holiday ? 660 : v.open;
          const close = holiday ? 900 : v.close;
          const hours = holiday ? "11:00 am–3:00 pm, by reservation" : v.hours;
          let status: { text: string; open: boolean } | null = null;
          if (isToday) {
            if (now < open) status = { text: `Opens at ${fmtTime(open)}`, open: false };
            else if (now < close) status = { text: `Open now · until ${fmtTime(close)}`, open: true };
            else status = { text: `Closed · opens ${fmtTime(v.open)} tomorrow`, open: false };
          }
          const label = m.venue === "rendezvous" ? "At the bar today" : holiday ? "Holiday menu" : "Chef’s special";
          return (
            <article key={m.venue} className={`din-venue din-venue-${m.venue}${holiday ? " is-holiday" : ""}`} aria-labelledby={`din-v-${m.venue}`}>
              <div className="din-venue-side">
                <div className="din-venue-photos">
                  <div className="din-ph din-ph-main"><Image src={v.photo} alt={mainPhotoAlt[m.venue]} fill sizes="(max-width: 960px) 66vw, 300px" /></div>
                  <div className="din-ph din-ph-2"><Image src={second[m.venue][0]} alt={second[m.venue][1]} fill sizes="(max-width: 960px) 34vw, 140px" /></div>
                </div>
                <p className="din-kind">{v.kind}</p>
                <h3 id={`din-v-${m.venue}`} className="din-venue-name">{v.name}</h3>
                <p className="din-hours"><Icon name="clock" /> {hours}</p>
                {status && <p className={`din-status${status.open ? " is-open" : ""}`}><span aria-hidden="true" /> {status.text}</p>}
                <p className="din-blurb">{v.blurb}</p>
              </div>

              <div className="din-venue-menu">
                <div className="din-feature">
                  <div className="din-special">
                    <p className="din-special-label"><Icon name="star" /> {label}</p>
                    <p className="din-special-name">{m.special.name} <Tags tags={m.special.tags} /></p>
                    {m.special.desc && <p className="din-special-desc">{m.special.desc}</p>}
                  </div>
                  {!holiday && (
                    <div className="din-soup">
                      <p className="din-special-label"><Icon name="coffee" /> Soup of the day</p>
                      <p className="din-soup-name">{m.soup.name} <Tags tags={m.soup.tags} /></p>
                    </div>
                  )}
                </div>

                <div className="din-sections">
                  {m.sections.map((s) => {
                    const items = s.items.filter(fits);
                    return (
                      <section key={s.title} className="din-section">
                        <h4>{s.title}{s.note && <span className="din-note">{s.note}</span>}</h4>
                        {items.length ? (
                          <ul>{items.map((d) => <DishRow key={d.name} d={d} />)}</ul>
                        ) : (
                          <p className="din-none">Ask your server — the kitchen is happy to adapt many dishes.</p>
                        )}
                      </section>
                    );
                  })}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="din-foot">
        <p className="din-ask"><Icon name="info" /> Ask your server about our daily special — and let us know about any allergies. The kitchen is happy to help.</p>
        <ul className="din-legend" aria-label="Dietary key">
          {TAGS.map((t) => (
            <li key={t}><span className={`tag tag-${t}`} aria-hidden="true">{t}</span> {tagLabels[t]}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
