"use client";

import { useState } from "react";
import { categories, week } from "@/data/community";
import { Icon } from "./Icon";

/** One day at a time: seven day buttons, today selected by default. */
export function DayPicker() {
  const [i, setI] = useState(week.findIndex((d) => d.today));
  const day = week[i];

  return (
    <div className="daypick">
      <div className="daypick-tabs" role="tablist" aria-label="Day of the week">
        {week.map((d, n) => (
          <button
            key={d.iso}
            role="tab"
            id={`day-${d.iso}`}
            aria-selected={n === i}
            aria-controls="day-panel"
            tabIndex={n === i ? 0 : -1}
            className={d.today ? "is-today" : ""}
            onClick={() => setI(n)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") setI((i + 1) % week.length);
              if (e.key === "ArrowLeft") setI((i - 1 + week.length) % week.length);
            }}
          >
            <span className="dp-name">{d.name.slice(0, 3)}</span>
            <span className="dp-date">{d.date}</span>
          </button>
        ))}
      </div>
      <div className="daypick-panel" id="day-panel" role="tabpanel" aria-labelledby={`day-${day.iso}`}>
        <h3>
          {day.name} {day.date}
          {day.today && <span className="today-tag">Today</span>}
        </h3>
        <ol className="daylist">
          {day.events.map((e) => (
            <li key={e.time + e.name}>
              <time dateTime={`${day.iso}T${e.time}`}>{e.time}</time>
              <div>
                <span className="dl-name">{e.name}</span>
                <span className="dl-meta">
                  <i className={`cat c-${e.cat}`} aria-hidden="true" />
                  {categories[e.cat]}
                  {e.note ? (
                    <>
                      {" · "}
                      <span className="note">{e.note}</span>
                    </>
                  ) : (
                    <>
                      {" · "}
                      <Icon name="pin" /> {e.room}
                    </>
                  )}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
