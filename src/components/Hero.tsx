"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { community } from "@/data/community";
import { Icon } from "./Icon";
import { ModuleLabel } from "./ModuleLabel";

const SLIDE_MS = 6500;

const slides = [
  { src: "/photos/building-garden.jpg", alt: "Larkmoor House from the courtyard garden, with the path to the Garden Room terrace" },
  { src: "/photos/building-hedges.jpg", alt: "The garden gate and hedges on the Fern Street side" },
  { src: "/photos/dining-group.jpg", alt: "Residents sharing lunch in the Main Dining Room" },
  { src: "/photos/building-porch.jpg", alt: "The porch on the Fern Street side, with chairs set out for the afternoon" },
];

export function Hero() {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setI((n) => (n + 1) % slides.length), SLIDE_MS);
    return () => clearTimeout(t);
  }, [i]);

  return (
    <section className="hero" aria-labelledby="hero-h">
      <div className="hero-slides" aria-hidden="true">
        {slides.map((s, n) => (
          <div key={s.src} className={`slide ${n === i ? "on" : ""}`}>
            <Image src={s.src} alt="" fill priority={n === 0} sizes="100vw" />
          </div>
        ))}
      </div>
      <p className="vh">{slides[i].alt}</p>
      <div className="hero-dots">
        {slides.map((s, n) => (
          <button key={s.src} type="button" className={n === i ? "on" : undefined} onClick={() => setI(n)} aria-label={`Photo ${n + 1} of ${slides.length}`} aria-current={n === i}>
            <span style={{ animationDuration: `${SLIDE_MS}ms` }} />
          </button>
        ))}
      </div>
      <div className="hero-content">
        <div className="wrap">
          <ModuleLabel k="profile" />
        </div>
        <p className="hero-name">{community.name}</p>
        <h1 id="hero-h">Welcome home.</h1>
        <p className="hero-sub">Assisted living and memory care on Fern Street in Millbrook Bend, Oregon. Family owned since 2009.</p>
        <div className="hero-actions">
          <Link className="btn btn-gold btn-lg" href="/larkmoor-house/tour">
            <Icon name="calendar" />
            Book a tour
          </Link>
          <a className="btn btn-ghost btn-lg" href={community.phoneHref}>
            <Icon name="phone" />
            Call {community.phone}
          </a>
        </div>
        <a className="scroll-cue" href="#welcome">
          <span>Scroll for more</span>
          <Icon name="chev" />
        </a>
      </div>
    </section>
  );
}
