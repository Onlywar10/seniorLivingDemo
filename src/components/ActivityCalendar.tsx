"use client";

import Image from "next/image";
import Link from "next/link";
import { addTransitionType, startTransition, useState, ViewTransition } from "react";
import { categories, type Category, type Day, type Event } from "@/data/community";
import { Icon } from "./Icon";

const cats = Object.keys(categories) as Category[];

function EventCard({ e, past, big = false }: { e: Event; past?: boolean; big?: boolean }) {
  const showPhoto = past && e.photo;
  return (
    <li className={`ev ev-${e.cat} ${big ? "ev-big" : ""} ${past ? "ev-past" : ""}`}>
      {showPhoto && (
        <span className="ev-photo">
          <Image src={e.photo!} alt="" fill sizes={big ? "(max-width: 700px) 100vw, 220px" : "240px"} />
        </span>
      )}
      <div className="ev-body">
        <time className="ev-time">{e.time}</time>
        <b className="ev-name">{e.name}</b>
        <span className="ev-meta">
          <i className={`cat c-${e.cat}`} aria-hidden="true" />
          {categories[e.cat]}
          <span aria-hidden="true"> · </span>
          <Icon name="pin" /> {e.room}
        </span>
        <span className="ev-desc">{e.desc}</span>
        {showPhoto && e.attended && <span className="ev-att">Photo from the day · {e.attended}</span>}
      </div>
    </li>
  );
}

/** The full weekly calendar: today or the whole week, filterable by type. */
export function ActivityCalendar({ week, updated }: { week: Day[]; updated: string }) {
  const [view, setView] = useState<"today" | "week">("week");
  const [cat, setCat] = useState<Category | "">("");
  const ti = week.findIndex((d) => d.today);
  const [dayI, setDayI] = useState(ti);
  const filter = (es: Event[]) => (cat ? es.filter((e) => e.cat === cat) : es);
  const day = week[dayI];

  // Changes run as transitions so the calendar can slide (day to day) or crossfade (view and filter).
  const go = (type: string, fn: () => void) =>
    startTransition(() => {
      addTransitionType(type);
      fn();
    });
  const slide = {
    "day-next": "slide-from-right",
    "day-prev": "slide-from-left",
    default: "fade-swap",
  };

  return (
    <div className="acal">
      <div className="acal-bar">
        <div className="seg" role="tablist" aria-label="Calendar view">
          <button
            type="button"
            role="tab"
            aria-selected={view === "today"}
            onClick={() =>
              go("swap", () => {
                setView("today");
                setDayI(ti);
              })
            }
          >
            <Icon name="list" /> Day
          </button>
          <button type="button" role="tab" aria-selected={view === "week"} onClick={() => go("swap", () => setView("week"))}>
            <Icon name="grid" /> Week
          </button>
        </div>
        <div className="acal-filter" role="group" aria-label="Show activities of type">
          <button type="button" aria-pressed={cat === ""} onClick={() => go("swap", () => setCat(""))}>
            All
          </button>
          {cats.map((c) => (
            <button key={c} type="button" aria-pressed={cat === c} onClick={() => go("swap", () => setCat(cat === c ? "" : c))}>
              <i className={`cat c-${c}`} aria-hidden="true" />
              {categories[c]}
            </button>
          ))}
        </div>
      </div>
      <p className="acal-updated">
        <span className="dot" aria-hidden="true" /> Last updated {updated} by Tom Delacroix, Life Enrichment Director
      </p>

      <ViewTransition key={view + cat} enter="fade-swap" exit="fade-swap" default="none">
        {view === "week" ? (
          <div className="wk">
            {week.map((d) => {
              const es = filter(d.events);
              return (
                <section key={d.iso} className={`wk-day ${d.today ? "is-today" : ""} ${d.past ? "is-past" : ""}`} aria-label={d.long}>
                  <h3 className="wk-head">
                    <span className="wk-name">{d.name}</span>
                    <span className="wk-date">{d.date}</span>
                    {d.today && <span className="today-tag">Today</span>}
                  </h3>
                  {es.length ? (
                    <ol className="wk-list">
                      {es.map((e) => (
                        <EventCard key={e.time + e.name} e={e} past={d.past} />
                      ))}
                    </ol>
                  ) : (
                    <p className="wk-none">Nothing of this type</p>
                  )}
                </section>
              );
            })}
          </div>
        ) : (
          <div className="dayv">
            <div className="dayv-nav">
              <button type="button" className="btn btn-outline" disabled={dayI === 0} onClick={() => go("day-prev", () => setDayI(dayI - 1))} aria-label="Previous day">
                <Icon name="left" />
              </button>
              <h3>{day.today ? `Today, ${day.long}` : day.long}</h3>
              <button type="button" className="btn btn-outline" disabled={dayI === week.length - 1} onClick={() => go("day-next", () => setDayI(dayI + 1))} aria-label="Next day">
                <Icon name="right" />
              </button>
            </div>
            <ViewTransition key={day.iso} enter={slide} exit={slide} default="none">
              <div className="dayv-body">
                <ol className="dayv-list">
                  {filter(day.events).map((e) => (
                    <EventCard key={e.time + e.name} e={e} past={day.past} big />
                  ))}
                </ol>
                {filter(day.events).length === 0 && <p className="wk-none">Nothing of this type on this day. Choose “All” to see everything.</p>}
              </div>
            </ViewTransition>
          </div>
        )}
      </ViewTransition>

      <div className="acal-foot">
        <Link className="btn btn-outline" href="/larkmoor-house/stay-connected">
          <Icon name="sms" /> Get the calendar by text or email
        </Link>
        <button type="button" className="btn btn-outline" onClick={() => window.print()}>
          <Icon name="printer" /> Print large-print calendar
        </button>
      </div>
    </div>
  );
}
