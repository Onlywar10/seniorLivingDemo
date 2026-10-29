import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { community, testimonials } from "@/data/community";
import { Icon } from "./Icon";
import { Reveal } from "./Reveal";

/** A scene-setting passage beside a photograph. `flip` puts the photo on the left. */
export function Lead({ title, children, photo, alt, caption, flip = false }: { title: string; children: ReactNode; photo: string; alt: string; caption?: string; flip?: boolean }) {
  return (
    <Reveal className={`lead ${flip ? "flip" : ""}`}>
      <div className="lead-text">
        <h2>{title}</h2>
        {children}
      </div>
      <figure className="lead-photo">
        <Image src={photo} alt={alt} fill sizes="(max-width: 900px) 100vw, 46vw" />
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
    </Reveal>
  );
}

/** One pull quote from the testimonials, by name. */
export function Quote({ who }: { who: string }) {
  const t = testimonials.find((x) => x.name === who) ?? testimonials[0];
  return (
    <Reveal className="pull">
      <blockquote>
        <p>“{t.quote}”</p>
        <footer>
          <span className="who-photo">
            <Image src={t.photo} alt="" fill sizes="56px" />
          </span>
          <span>
            <b>{t.name}</b>
            <span>{t.relation}</span>
          </span>
        </footer>
      </blockquote>
    </Reveal>
  );
}

/** Closing band for every detail page. */
export function PageCta({ title = "Come and see it for yourself", text = "Tours any day, 9 to 6. Come during an activity and stay for lunch if you like." }: { title?: string; text?: string }) {
  return (
    <section className="cta-band cta-band-page" aria-labelledby="pcta-h">
      <div className="wrap cta-inner">
        <div>
          <h2 id="pcta-h">{title}</h2>
          <p>{text}</p>
        </div>
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
      </div>
    </section>
  );
}

/** A short numbered sequence, for "what a tour is like" or "how a notice reaches you". */
export function Steps({ steps }: { steps: { title: string; text: string }[] }) {
  return (
    <ol className="steps">
      {steps.map((s, i) => (
        <li key={s.title}>
          <span className="step-n" aria-hidden="true">
            {i + 1}
          </span>
          <div>
            <b>{s.title}</b>
            <span>{s.text}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
