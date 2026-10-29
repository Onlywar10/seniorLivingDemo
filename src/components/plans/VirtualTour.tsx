"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import type { Plan } from "@/data/site";
import { FloorPlan } from "./FloorPlan";
import type { Stop } from "./data";

/** Room-by-room tour with a live floor-plan map and tappable hotspots. */
export function VirtualTour({ plan, stops }: { plan: Plan; stops: Stop[] }) {
  const [i, setI] = useState(0);
  const [spot, setSpot] = useState<number | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const stop = stops[i];
  const n = stops.length;

  const go = useCallback(
    (to: number) => {
      setI(((to % n) + n) % n);
      setSpot(null);
    },
    [n]
  );

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select")) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(i + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(i - 1);
      } else if (e.key === "Escape" && spot !== null) {
        setSpot(null);
      }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [go, i, spot]);

  const mapKey = plan.rooms.some((r) => r[0] === stop.key) ? stop.key : null;
  const selectable = stops.map((s) => s.key);
  const toStop = (key: string) => {
    const idx = stops.findIndex((s) => s.key === key);
    if (idx >= 0) go(idx);
  };

  return (
    <div className="vt" ref={root} role="region" aria-roledescription="virtual tour" aria-label={`Virtual tour of the ${plan.code}`}>
      <div className="vt-stage">
        <div className="vt-photo" key={stop.photo + i}>
          <Image src={stop.photo} alt={stop.alt} fill sizes="(max-width: 980px) 100vw, 68vw" priority={i === 0} />
        </div>
        <div className="vt-shade" aria-hidden="true" />

        {stop.spots.map((s, k) => {
          const open = spot === k;
          const pid = `vt-spot-${i}-${k}`;
          return (
            <div
              key={k}
              className={`vt-spot ${open ? "is-open" : ""} ${s.x > 58 ? "flip-x" : ""} ${s.y > 62 ? "flip-y" : ""}`}
              style={{ left: `${s.x}%`, top: `${s.y}%` }}
            >
              <button
                type="button"
                className="vt-dot"
                aria-expanded={open}
                aria-controls={pid}
                onClick={() => setSpot(open ? null : k)}
              >
                <span className="vh">{s.label}</span>
                <Icon name={open ? "x" : "plus"} />
              </button>
              <div className="vt-pop" id={pid} role="note" hidden={!open}>
                <b>{s.label}</b>
                <span>{s.text}</span>
              </div>
            </div>
          );
        })}

        <div className="vt-top">
          <span className="vt-counter" aria-live="polite">
            Room {i + 1} of {n} · <strong>{stop.title}</strong>
          </span>
          <span className="vt-hint">
            <Icon name="plus" /> Tap the dots to look closer
          </span>
        </div>

        <div className="vt-nav">
          <button type="button" className="vt-arrow" onClick={() => go(i - 1)} aria-label={`Previous room: ${stops[(i - 1 + n) % n].title}`}>
            <Icon name="left" />
          </button>
          <button type="button" className="vt-arrow" onClick={() => go(i + 1)} aria-label={`Next room: ${stops[(i + 1) % n].title}`}>
            <Icon name="right" />
          </button>
        </div>
      </div>

      <aside className="vt-side">
        <div className="vt-map">
          <p className="vt-map-h">
            <Icon name="pin" /> You are in the <strong>{stop.title.toLowerCase()}</strong>
          </p>
          <FloorPlan plan={plan} active={mapKey} onSelect={toStop} selectable={selectable} compact label={`Map of the ${plan.code}. Choose a room to go there.`} />
        </div>
        <p className="vt-caption">{stop.caption}</p>
      </aside>
      <div className="vt-strip">
        <ol className="vt-rooms" aria-label="Rooms on this tour">
            {stops.map((s, k) => (
              <li key={s.key}>
                <button type="button" aria-current={k === i ? "step" : undefined} onClick={() => go(k)}>
                  <span className="vt-rooms-n">{k + 1}</span>
                  {s.title}
                </button>
              </li>
            ))}
          </ol>
          <p className="vt-keys">Use the left and right arrow keys to move between rooms.</p>
      </div>
    </div>
  );
}
