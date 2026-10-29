"use client";

import Image from "next/image";
import Link from "next/link";
import { addTransitionType, startTransition, useEffect, useRef, useState, ViewTransition } from "react";
import type { Apartment } from "@/data/community";
import { FloorPlan } from "./FloorPlan";
import { Icon } from "./Icon";
import { WaitlistForm } from "./WaitlistForm";

const roomSlide = { "tour-next": "slide-from-right", "tour-prev": "slide-from-left", "tour-end": "fade-swap", default: "fade-swap" };

/** Room-by-room walk-through of one floor plan: a draggable panorama per room, hotspots, and a floor-plan map. */
export function VirtualTour({ apt }: { apt: Apartment }) {
  const rooms = apt.tour;
  const [i, setI] = useState(0);
  const [pan, setPan] = useState(0.15);
  const [spot, setSpot] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [dragging, setDragging] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; pan: number; moved: boolean } | null>(null);
  const room = rooms[i];

  // Each room opens with a slow look across it, like turning your head on arrival.
  // The view starts turned to the left (see go) and settles to the centre; under reduced motion the pan has no transition.
  useEffect(() => {
    const t = window.setTimeout(() => setPan(0.5), 60);
    return () => window.clearTimeout(t);
  }, [i]);

  // Moving to a later room slides the view in from the right, an earlier one from the left.
  const go = (n: number) => {
    if (n === i && !done) return;
    startTransition(() => {
      addTransitionType(n >= rooms.length ? "tour-end" : !done && n > i ? "tour-next" : "tour-prev");
      if (n >= rooms.length) {
        setDone(true);
        return;
      }
      setDone(false);
      setSpot(null);
      setPan(0.15);
      setI(Math.max(0, n));
    });
  };

  const goPlanRoom = (planRoom: number) => {
    const n = rooms.findIndex((r) => r.planRoom === planRoom);
    if (n >= 0) go(n);
  };

  return (
    <div className="vt">
      <div className="vt-main">
        <div
          ref={stage}
          className={`vt-stage ${dragging ? "is-drag" : ""}`}
          onPointerDown={(e) => {
            drag.current = { x: e.clientX, pan, moved: false };
            setDragging(true);
            (e.target as Element).setPointerCapture?.(e.pointerId);
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d || !stage.current) return;
            const dx = (e.clientX - d.x) / stage.current.clientWidth;
            if (Math.abs(dx) > 0.01) d.moved = true;
            setPan(Math.min(1, Math.max(0, d.pan - dx * 1.6)));
          }}
          onPointerUp={() => {
            drag.current = null;
            setDragging(false);
          }}
          onPointerCancel={() => {
            drag.current = null;
            setDragging(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setPan((p) => Math.max(0, p - 0.1));
            if (e.key === "ArrowRight") setPan((p) => Math.min(1, p + 0.1));
          }}
          tabIndex={0}
          role="img"
          aria-label={`${room.name}: ${room.alt}. Use the left and right arrow keys to look around.`}
        >
          <ViewTransition key={done ? "end" : room.key} enter={roomSlide} exit={roomSlide} default="none">
          {done ? (
            <div className="vt-end">
              <h2>That’s the {apt.name.toLowerCase()}.</h2>
              <p>The best way to know is to stand in one. Come and see it this week, or hear the day one comes free.</p>
              <div className="hero-actions">
                <Link className="btn btn-gold btn-lg" href="/larkmoor-house/tour">
                  <Icon name="calendar" /> Book an in-person tour
                </Link>
                <a className="btn btn-ghost btn-lg" href="#vt-alerts">
                  <Icon name="bell" /> Get availability alerts
                </a>
              </div>
              <button type="button" className="vt-again" onClick={() => go(0)}>
                Start the tour again
              </button>
            </div>
          ) : (
            <div className="vt-pano" style={{ transform: `translateX(${-pan * 33.333}%)` }} key={room.key}>
              <Image src={room.photo} alt="" fill priority sizes="150vw" />
              {room.hotspots.map((h, n) => (
                <button
                  key={h.label}
                  type="button"
                  className={`vt-hot ${spot === n ? "on" : ""}`}
                  // x is given relative to the centred view; the panorama is 1.5× the stage width
                  style={{ left: `${16.667 + h.x * 0.6667}%`, top: `${h.y}%` }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => setSpot(spot === n ? null : n)}
                  aria-expanded={spot === n}
                >
                  <span className="vt-dot" aria-hidden="true" />
                  <span className="vt-hot-label">{h.label}</span>
                  {spot === n && <span className="vt-tip">{h.text}</span>}
                </button>
              ))}
            </div>
          )}
          </ViewTransition>
          {!done && (
            <>
              <span className="vt-hint" aria-hidden="true">
                <Icon name="left" /> Drag to look around <Icon name="right" />
              </span>
              <span className="vt-room-tag">
                {i + 1} of {rooms.length} · {room.name}
              </span>
            </>
          )}
        </div>

        <div className="vt-steps" role="tablist" aria-label="Rooms">
          {rooms.map((r, n) => (
            <button key={r.key} type="button" role="tab" aria-selected={!done && n === i} onClick={() => go(n)}>
              <span className="vt-thumb">
                <Image src={r.photo} alt="" fill sizes="120px" />
              </span>
              <span>{r.name}</span>
            </button>
          ))}
        </div>
      </div>

      <aside className="vt-side">
        <div className="vt-map">
          <p className="vt-map-h">You are here</p>
          <FloorPlan plan={apt.key} title={apt.name} highlight={done ? undefined : room.planRoom} onRoom={goPlanRoom} />
        </div>
        {!done && (
          <div className="vt-text">
            <h2>{room.name}</h2>
            <p>{room.text}</p>
            <ul className="vt-feats">
              {room.hotspots.map((h, n) => (
                <li key={h.label}>
                  <button type="button" onClick={() => setSpot(n)}>
                    <span className="vt-dot" aria-hidden="true" /> {h.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="vt-nav">
          <button type="button" className="btn btn-outline" onClick={() => go(i - 1)} disabled={i === 0 && !done}>
            <Icon name="left" /> Back
          </button>
          <button type="button" className="btn btn-green" onClick={() => go(done ? 0 : i + 1)}>
            {done ? "Start again" : i === rooms.length - 1 ? "Finish" : `Next: ${rooms[i + 1].name}`} <Icon name="right" />
          </button>
        </div>
      </aside>

      <section className="vt-alerts" id="vt-alerts" aria-labelledby="vt-alerts-h">
        <div>
          <h2 id="vt-alerts-h">{apt.available ? `${apt.available} available now` : `Waitlist of ${apt.waitlist}`}</h2>
          <p>Starting at ${apt.from.toLocaleString("en-US")} a month. Get a text or email the day a {apt.name.toLowerCase()} comes free.</p>
          <Link className="btn btn-gold" href="/larkmoor-house/tour">
            <Icon name="calendar" /> Book an in-person tour
          </Link>
        </div>
        <WaitlistForm preset={apt.key} />
      </section>
    </div>
  );
}
