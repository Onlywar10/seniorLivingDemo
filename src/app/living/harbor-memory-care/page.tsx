import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "@/components/brand/brand.css";
import { living, money, plans, pricing, site, testimonials } from "@/data/site";
import { eventsBetween, isHarbor } from "@/data/calendar";
import { iso, today } from "@/lib/clock";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { LivingTabs } from "@/components/brand/LivingTabs";
import { TourBand } from "@/components/brand/TourBand";
import { PersonCard } from "@/components/brand/Monogram";
import { WeekEvents } from "@/components/brand/WeekEvents";

export const metadata: Metadata = {
  title: "Harbor Memory Care",
  description: "Harbor Memory Care at Prairie City Landing, Folsom: an environment of youthful optimism, with its own Events & Adventures, weekly outings and a secured courtyard. Studios from $6,400 a month.",
};

const outings: { icon: "star" | "fork" | "sun" | "spark" | "heart" | "globe"; label: string }[] = [
  { icon: "star", label: "Bowling" },
  { icon: "fork", label: "Local restaurants" },
  { icon: "sun", label: "Golf" },
  { icon: "spark", label: "Camping" },
  { icon: "heart", label: "Visiting horses" },
  { icon: "globe", label: "Stand-up paddling" },
];

const program = ["Live music", "Ceramics", "Pet therapy with Thor", "Therapeutic storytelling", "Literature review", "Gardening", "Museum outings", "Simplified fitness", "Reminiscence & photo albums", "Harbor Helpers"];

export default function Harbor() {
  const h = living.harbor;
  const d = today();
  const week = eventsBetween(d, 7, iso(d)).map((x) => ({ date: iso(x.date), events: x.events.filter(isHarbor) }));
  const harborPlans = plans.filter((p) => p.kind === "harbor");
  const linda = testimonials.find((t) => t.name === "Linda");

  return (
    <>
      <PageHero
        eyebrow="Harbor Memory Care"
        title={
          <>
            An environment of <em>youthful optimism.</em>
          </>
        }
        lede="Harbor is our secured memory care neighborhood — home-like, bright and busy, with its own courtyard, its own Events & Adventures and a team that starts every day by asking what’s possible."
        photo={h.photo}
        alt={h.alt}
        crumbs={[
          ["Living Options", "/living"],
          ["Harbor Memory Care", h.href],
        ]}
      >
        <div className="btn-row">
          <Link className="btn" href="/tour">
            Visit Harbor
          </Link>
          <a className="btn btn-ghost" href={site.phoneHref}>
            <Icon name="phone" /> {site.phone}
          </a>
        </div>
      </PageHero>
      <LivingTabs current="harbor" />

      <section className="sec tone-green on-dark" aria-labelledby="br-turn-h">
        <div className="wrap">
          <h2 id="br-turn-h" className="vh">
            Our approach
          </h2>
          <div className="br-turn">
            <s>‘we can’t’</s>
            <Icon name="arrow" />
            <strong>‘how can we…’</strong>
          </div>
          <p style={{ marginTop: 28, fontSize: "1.15rem", color: "#d8e2d6", maxWidth: "62ch" }}>
            At Harbor, a diagnosis doesn’t decide what a day looks like. Residents go bowling, eat out, garden, paint, sing and paddle — with Care Partners who know their stories and plan around their strengths.
          </p>
        </div>
      </section>

      <section className="sec tone-cream" aria-labelledby="br-hea-h">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">Harbor Events & Adventures</p>
            <h2 id="br-hea-h">
              Weekly outings, <em>real adventures.</em>
            </h2>
            <p>Harbor has its own Events & Adventures program, with an outing every week.</p>
          </div>
          <ul className="br-outings">
            {outings.map((o) => (
              <li key={o.label} className="br-outing">
                <span className="br-outing-ic">
                  <Icon name={o.icon} />
                </span>
                <p>{o.label}</p>
              </li>
            ))}
          </ul>
          <div className="br-split" style={{ marginTop: "clamp(40px, 6vw, 72px)" }}>
            <div className="br-split-ph">
              <Image src="/img/paddleboard.jpg" alt="A resident and team member stand-up paddling on the lake" fill sizes="(max-width: 860px) 100vw, 50vw" />
            </div>
            <div>
              <h3>Every day at Harbor</h3>
              <ul className="br-prog" style={{ margin: "16px 0 24px" }}>
                {program.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <ul className="br-checks">
                <li>
                  <Icon name="check" /> <span>A simplified fitness program designed by our Fitness Director, Jason Cherry</span>
                </li>
                <li>
                  <Icon name="check" /> <span>Purposeful roles in everyday life — setting tables, folding, tending the garden</span>
                </li>
                <li>
                  <Icon name="check" /> <span>Invited to every community event, from happy hour to the holiday parties</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="sec tone-white" aria-labelledby="br-hweek-h">
        <div className="wrap">
          <div className="sec-head-row">
            <div className="sec-head">
              <p className="eyebrow">This week at Harbor</p>
              <h2 id="br-hweek-h">From the Harbor calendar</h2>
            </div>
            <Link className="btn btn-green" href="/calendar?view=harbor">
              <Icon name="calendar" /> Full Harbor calendar
            </Link>
          </div>
          <WeekEvents days={week} showSeats />
        </div>
      </section>

      <section className="sec tone-sand" aria-labelledby="br-hprice-h">
        <div className="wrap br-split">
          <div>
            <p className="eyebrow">Harbor pricing</p>
            <h2 id="br-hprice-h">{`Studios from ${money(pricing.harbor[0].from)} a month`}</h2>
            <p className="muted">Harbor pricing includes care, meals in Harbor’s own dining room, housekeeping, laundry and the full Harbor program.</p>
            <div className="br-tbl-scroll" style={{ marginTop: 20 }}>
              <table className="br-price-tbl">
                <thead>
                  <tr>
                    <th scope="col">Studio</th>
                    <th scope="col">From</th>
                  </tr>
                </thead>
                <tbody>
                  {pricing.harbor.map((p) => (
                    <tr key={p.name}>
                      <th scope="row">{p.name}</th>
                      <td className="num">{`${money(p.from)} a month`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="small muted" style={{ marginTop: 14 }}>
              {`${harborPlans.filter((p) => p.available > 0).length} Harbor rooms available now. `}
              <Link href="/floor-plans">See Harbor floor plans</Link>
            </p>
          </div>
          <div style={{ display: "grid", gap: 20 }}>
            <div className="br-person-card">
              <PersonCard name="Janelle Zweber" role="Harbor Memory Care Director" tone={5}>
                <p className="br-person-bio">Janelle runs Harbor with an eye for possibility — turning ‘we can’t’ into ‘how can we…’ for every resident and family.</p>
                <a className="btn btn-sm btn-ghost" href={site.phoneHref}>
                  <Icon name="phone" /> <span>{`${site.phone}, ext. 130`}</span>
                </a>
              </PersonCard>
            </div>
            {linda && (
              <figure className="br-person-card" style={{ margin: 0 }}>
                <blockquote style={{ margin: 0 }}>
                  <p className="br-quote" style={{ fontSize: "1.35rem" }}>{`“${linda.quote}”`}</p>
                </blockquote>
                <figcaption className="br-cite">
                  <span data-no-translate>{linda.name}</span>, {linda.relation}
                </figcaption>
              </figure>
            )}
          </div>
        </div>
      </section>

      <TourBand photo="/img/harbor-garden.jpg" title={<>Come and <em>see Harbor.</em></>} text="Meet Janelle, see the courtyard and spend some time with the Harbor team. We’ll answer every question, at your pace." />
    </>
  );
}
