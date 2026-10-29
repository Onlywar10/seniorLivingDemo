"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { group } from "@/data/group";
import { Icon } from "./Icon";

const SLIDE_MS = 6500;

const slides = [
  { src: "/photos/home-ashby.jpg", alt: "Ashby Grove and its gardens from above" },
  { src: "/photos/building-garden.jpg", alt: "Larkmoor House from the courtyard garden" },
  { src: "/photos/home-fernhill.jpg", alt: "Fernhill’s front garden in bloom" },
  { src: "/photos/home-maple.jpg", alt: "Maple Court’s stone frontage with climbing roses" },
];

export function BrandHero() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setI((n) => (n + 1) % slides.length), SLIDE_MS);
    return () => clearTimeout(t);
  }, [i]);

  return (
    <section className="hero" aria-labelledby="bhero-h">
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
        <p className="hero-name">{group.name}</p>
        <h1 id="bhero-h">Welcome to Larkmoor.</h1>
        <p className="hero-sub">{group.tagline}</p>
        <div className="hero-actions">
          <a className="btn btn-gold btn-lg" href="#find">
            <Icon name="pin" />
            Find a location
          </a>
          <a className="btn btn-ghost btn-lg" href={group.phoneHref}>
            <Icon name="phone" />
            Call {group.phone}
          </a>
        </div>
        <Link className="scroll-cue" href="#find">
          <span>Scroll for more</span>
          <Icon name="chev" />
        </Link>
      </div>
    </section>
  );
}
