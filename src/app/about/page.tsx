import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "@/components/brand/brand.css";
import { awards, nameOrigin, purpose, site, values } from "@/data/site";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { Dots } from "@/components/Logo";
import { TourBand } from "@/components/brand/TourBand";

export const metadata: Metadata = {
  title: "Purpose & Values",
  description: "Prairie City Landing is owned, designed, built and run by Tenfold Senior Living. Our purpose, our six values, and the awards that recognize our team.",
};

export default function About() {
  return (
    <>
      <PageHero
        eyebrow="Purpose & Values"
        title={
          <>
            Each gives to each, <em>tenfold.</em>
          </>
        }
        lede="Prairie City Landing is a Tenfold Senior Living community. We own it, designed it, built it and run it — so the people who make decisions here are the people you see in the hallway."
        photo="/img/friends-laugh.jpg"
        alt="Two residents laughing together on a sofa"
        crumbs={[["About", "/about"]]}
      />

      <section className="sec tone-white" aria-labelledby="br-purpose-h" style={{ position: "relative", overflow: "hidden" }}>
        <Dots size={280} style={{ right: -100, top: -60, opacity: 0.2 }} />
        <div className="wrap center" style={{ position: "relative" }}>
          <p className="eyebrow">Our purpose</p>
          <h2 id="br-purpose-h" className="vh">
            Our purpose
          </h2>
          <p className="br-purpose">{purpose}</p>
        </div>
      </section>

      <section className="sec tone-cream" aria-labelledby="br-values-h">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">Our values</p>
            <h2 id="br-values-h">
              Six values, <em>lived daily.</em>
            </h2>
            <p>They guide how we hire, how we plan the calendar and how we answer every request — from residents, families and each other.</p>
          </div>
          <ul className="br-values">
            {values.map((v) => (
              <li key={v.key} className="br-value">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={v.icon} alt="" width={76} height={76} />
                <h3>{v.name}</h3>
                <p>{v.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="sec tone-green on-dark" aria-labelledby="br-name-h" style={{ position: "relative", overflow: "hidden" }}>
        <Dots size={360} style={{ right: -120, bottom: -140, opacity: 0.22 }} />
        <div className="wrap br-split" style={{ position: "relative" }}>
          <div>
            <p className="eyebrow">Where the name comes from</p>
            <h2 id="br-name-h">Why “Tenfold”?</h2>
            <figure style={{ margin: "26px 0 0" }}>
              <blockquote style={{ margin: 0 }}>
                <p className="br-quote">
                  “Each gives to each, and like the star gets back its gift in <em>tenfold pay.</em>”
                </p>
              </blockquote>
              <figcaption className="br-cite" data-no-translate>
                {nameOrigin.author}
              </figcaption>
            </figure>
            <p style={{ marginTop: 24, color: "#d8e2d6" }}>The California poet’s line captures what we see every day: when residents and team members give to one another, everyone gets back far more than they gave.</p>
          </div>
          <div className="br-split-ph">
            <Image src="/img/care-laugh.jpg" alt="A Care Partner and resident sharing a laugh" fill sizes="(max-width: 860px) 100vw, 50vw" />
          </div>
        </div>
      </section>

      <section className="sec tone-sand" aria-labelledby="br-tenfold-h">
        <div className="wrap br-split rev">
          <div className="br-split-ph">
            <Image src="/img/exterior-evening.jpg" alt="The Prairie City Landing courtyard with palms and umbrellas" fill sizes="(max-width: 860px) 100vw, 50vw" />
          </div>
          <div>
            <div style={{ display: "inline-block", background: "var(--green-deep)", borderRadius: 16, padding: "16px 22px", marginBottom: 22 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/brand/tenfold-white.png" alt="Tenfold Senior Living" className="br-tenfold-logo" style={{ margin: 0, width: 180 }} />
            </div>
            <h2 id="br-tenfold-h">
              Owned, designed, built and <em>run by Tenfold.</em>
            </h2>
            <p className="muted" style={{ marginTop: 14 }}>
              Tenfold Senior Living is a Northern California family of communities. We don’t hand our buildings to an outside manager: the same team that designed Prairie City Landing runs it every day, and answers to the residents who live here.
            </p>
            <p className="muted">
              Our sister community,{" "}
              <a href={site.sister.url} target="_blank" rel="noreferrer">
                {site.sister.name}
              </a>
              , welcomes residents in {site.sister.city}.
            </p>
            <div className="btn-row" style={{ marginTop: 20 }}>
              <Link className="btn btn-green" href="/team">
                Meet our team
              </Link>
              <a className="btn btn-ghost" href={site.tenfoldUrl} target="_blank" rel="noreferrer">
                Tenfold Senior Living <Icon name="arrow" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="sec tone-white" aria-labelledby="br-awards-h">
        <div className="wrap">
          <div className="sec-head center">
            <p className="eyebrow">Recognition</p>
            <h2 id="br-awards-h">
              Award-winning, <em>year after year.</em>
            </h2>
          </div>
          <ul className="br-awards">
            {awards.map((a, i) => (
              <li key={a.title} className="br-award">
                <span className="br-award-ic">
                  <Icon name={i === 0 ? "star" : i === 1 ? "sparkle" : "heart"} />
                </span>
                <h3>{a.title}</h3>
                <p>{a.detail}</p>
                <p className="src">{a.source}</p>
              </li>
            ))}
          </ul>
          <p className="center" style={{ marginTop: 28 }}>
            <Link className="link-arrow" href="/all-are-welcome">
              All are welcome here <Icon name="arrow" />
            </Link>
          </p>
        </div>
      </section>

      <TourBand />
    </>
  );
}
