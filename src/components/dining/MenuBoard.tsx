"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { tagLabels, type DayMenu, type Dish, type Tag } from "@/data/shared";
import { useCommunity } from "@/lib/community";
import { diningCopy } from "@/data/communities/copy/dining";
import { fmtTime, nowMinutes } from "@/lib/clock";
import { useT } from "@/i18n/client";
import type { T } from "@/i18n/translate";
import { Icon } from "@/components/Icon";

export interface MenuDay { date: string; label: string; long: string; menus: DayMenu[] }

const TAGS: Tag[] = ["GF", "VG", "DF"];
function Tags({ tags, t }: { tags?: Tag[]; t: T }) {
  if (!tags?.length) return null;
  return (
    <span className="din-tags">
      {tags.map((tag) => (
        <abbr key={tag} className={`tag tag-${tag}`} title={t(tagLabels[tag])} aria-label={t(tagLabels[tag])}>{tag}</abbr>
      ))}
    </span>
  );
}

function DishRow({ d, t }: { d: Dish; t: T }) {
  return (
    <li className="din-dish">
      <div className="din-dish-top">
        <span className="din-dish-name">{t(d.name)}</span>
        <Tags tags={d.tags} t={t} />
      </div>
      {d.desc && <p className="din-dish-desc">{t(d.desc)}</p>}
    </li>
  );
}

/** Today’s menus for all three restaurants, with a day picker and dietary filter. */
export function MenuBoard({ days, extra, todayIso, nowMin }: { days: MenuDay[]; extra?: MenuDay; todayIso: string; nowMin: number }) {
  const { t } = useT();
  const c = useCommunity();
  const { venues } = c;
  const copy = diningCopy[c.slug];
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
  const fits = (d: Dish) => diet.every((tag) => d.tags?.includes(tag));
  const toggle = (tag: Tag) => setDiet((a) => (a.includes(tag) ? a.filter((x) => x !== tag) : [...a, tag]));

  return (
    <div className="din-board">
      <div className="din-controls">
        <div className="din-days" role="group" aria-label={t("Choose a day")}>
          {days.map((d) => (
            <button key={d.date} type="button" className={`din-day${d.date === todayIso ? " is-today" : ""}${d.date < todayIso ? " is-past" : ""}`} aria-pressed={sel === d.date} onClick={() => setSel(d.date)}>
              <span className="din-day-dow">{d.date === todayIso ? t("Today") : t(d.label.split(", ")[0])}</span>
              <span className="din-day-date">{t(d.label.split(", ")[1])}</span>
            </button>
          ))}
          {extra && (
            <button type="button" className="din-day din-day-holiday" aria-pressed={sel === extra.date} onClick={() => setSel(extra.date)}>
              <span className="din-day-dow">{t("Thanksgiving")}</span>
              <span className="din-day-date">{t(extra.label.split(", ")[1])}</span>
            </button>
          )}
        </div>
        <div className="din-diet">
          <div className="din-diet-btns" role="group" aria-label={t("Show only dishes that are")}>
            <span className="din-diet-label" aria-hidden="true"><Icon name="filter" />{t(" Show only")}</span>
            {TAGS.map((tag) => (
              <button key={tag} type="button" className={`din-diet-btn din-diet-${tag}`} aria-pressed={diet.includes(tag)} onClick={() => toggle(tag)}>
                <span className={`tag tag-${tag}`} aria-hidden="true">{tag}</span> {t(tagLabels[tag])}
              </button>
            ))}
            {diet.length > 0 && <button type="button" className="din-diet-clear" onClick={() => setDiet([])}>{t("Show everything")}</button>}
          </div>
        </div>
      </div>

      <p className="din-showing" aria-live="polite">
        <b>{t(isToday ? `Today, ${day.long.split(", ")[1]}` : day.long)}</b>
        {/* Listed in key order (not click order), so each combination has one dictionary entry. */}
        {diet.length > 0 && <>{t(" · showing ")}{t(TAGS.filter((tag) => diet.includes(tag)).map((tag) => tagLabels[tag].toLowerCase()).join(" and "))}{t(" dishes")}</>}
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
          const label = m.venue === copy.bar ? "At the bar today" : holiday ? "Holiday menu" : "Chef’s special";
          const ph = copy.venuePhotos[m.venue];
          return (
            <article key={m.venue} className={`din-venue din-venue-${m.venue}${holiday ? " is-holiday" : ""}`} aria-labelledby={`din-v-${m.venue}`}>
              <div className="din-venue-side">
                <div className="din-venue-photos">
                  <div className="din-ph din-ph-main"><Image src={v.photo} alt={t(ph?.alt ?? v.name)} fill sizes="(max-width: 960px) 66vw, 300px" /></div>
                  {ph && <div className="din-ph din-ph-2"><Image src={ph.second[0]} alt={t(ph.second[1])} fill sizes="(max-width: 960px) 34vw, 140px" /></div>}
                </div>
                <p className="din-kind">{t(v.kind)}</p>
                <h3 id={`din-v-${m.venue}`} className="din-venue-name">{t(v.name)}</h3>
                <p className="din-hours"><Icon name="clock" /> {t(hours)}</p>
                {status && <p className={`din-status${status.open ? " is-open" : ""}`}><span aria-hidden="true" /> {t(status.text)}</p>}
                <p className="din-blurb">{t(v.blurb)}</p>
              </div>

              <div className="din-venue-menu">
                <div className="din-feature">
                  <div className="din-special">
                    <p className="din-special-label"><Icon name="star" /> {t(label)}</p>
                    <p className="din-special-name">{t(m.special.name)} <Tags tags={m.special.tags} t={t} /></p>
                    {m.special.desc && <p className="din-special-desc">{t(m.special.desc)}</p>}
                  </div>
                  {!holiday && (
                    <div className="din-soup">
                      <p className="din-special-label"><Icon name="coffee" />{t(" Soup of the day")}</p>
                      <p className="din-soup-name">{t(m.soup.name)} <Tags tags={m.soup.tags} t={t} /></p>
                    </div>
                  )}
                </div>

                <div className="din-sections">
                  {m.sections.map((s) => {
                    const items = s.items.filter(fits);
                    return (
                      <section key={s.title} className="din-section">
                        <h4>{t(s.title)}{s.note && <span className="din-note">{t(s.note)}</span>}</h4>
                        {items.length ? (
                          <ul>{items.map((d) => <DishRow key={d.name} d={d} t={t} />)}</ul>
                        ) : (
                          <p className="din-none">{t("Ask your server — the kitchen is happy to adapt many dishes.")}</p>
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
        <p className="din-ask"><Icon name="info" />{t(" Ask your server about our daily special — and let us know about any allergies. The kitchen is happy to help.")}</p>
        <ul className="din-legend" aria-label={t("Dietary key")}>
          {TAGS.map((tag) => (
            <li key={tag}><span className={`tag tag-${tag}`} aria-hidden="true">{tag}</span> {t(tagLabels[tag])}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
