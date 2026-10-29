import type { Metadata } from "next";
import Link from "next/link";
import "@/components/brand/brand.css";
import { spaces } from "@/data/site";
import { venueOrder, venues } from "@/data/menus";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { Gallery } from "@/components/brand/Gallery";
import { TourBand } from "@/components/brand/TourBand";

export const metadata: Metadata = {
  title: "Amazing Spaces",
  description: "Take a photo tour of Prairie City Landing: three restaurants, a theatre, art studio, fitness center, salon, Club Room, Living Room library and a courtyard with a fire table and bocce.",
};

export default function Spaces() {
  const items = spaces.map((s) => ({ src: s.photo, alt: s.alt, title: s.name, caption: s.text, meta: s.hours ? `${s.kind} · ${s.hours}` : s.kind }));
  return (
    <>
      <PageHero
        eyebrow="Amazing Spaces"
        title={
          <>
            Room to <em>gather,</em> room to breathe.
          </>
        }
        lede="Amazing spaces get people out of their apartments. Take a tour of the places residents meet for coffee, class, cocktails and conversation."
        photo="/img/lobby-tall.jpg"
        alt="The double-height lobby with a sweeping staircase"
        crumbs={[
          ["Lifestyle", "/lifestyle"],
          ["Amazing Spaces", "/spaces"],
        ]}
      >
        <div className="btn-row">
          <Link className="btn" href="/tour">
            See them in person
          </Link>
        </div>
      </PageHero>

      <section className="sec-tight tone-white" aria-labelledby="br-hours-h">
        <div className="wrap">
          <h2 id="br-hours-h" className="vh">
            Restaurant hours
          </h2>
          <ul className="br-hours">
            {venueOrder.map((k) => (
              <li key={k}>
                <Icon name={k === "rendezvous" ? "coffee" : k === "cypress" ? "wine" : "fork"} />
                <p>
                  <b>{venues[k].name}</b>
                  <span className="muted small">{`Open daily, ${venues[k].hours}`}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="sec tone-cream" aria-labelledby="br-tour-spaces-h">
        <div className="wrap">
          <div className="sec-head-row">
            <div className="sec-head">
              <p className="eyebrow">Photo tour</p>
              <h2 id="br-tour-spaces-h">{`${spaces.length} places to make your own`}</h2>
              <p>Select any photo to see it larger.</p>
            </div>
            <Link className="link-arrow" href="/dining">
              Today’s menus <Icon name="arrow" />
            </Link>
          </div>
          <Gallery items={items} variant="cards" />
        </div>
      </section>

      <section className="sec-tight tone-sand" aria-labelledby="br-more-h">
        <div className="wrap">
          <div className="sec-head">
            <h2 id="br-more-h">More to discover outdoors</h2>
          </div>
          <Gallery
            items={[
              { src: "/img/courtyard-aerial.jpg", alt: "An aerial view of the courtyard’s paths, lawns and seating", title: "The courtyard from above" },
              { src: "/img/fire-table.jpg", alt: "The fire table and lounge seating at dusk", title: "Fire table" },
              { src: "/img/courtyard-bocce.jpg", alt: "The bocce court in the courtyard", title: "Bocce court" },
              { src: "/img/courtyard-bbq.jpg", alt: "Gas barbecues and shaded outdoor dining", title: "Barbecues & outdoor dining" },
              { src: "/img/harbor-garden.jpg", alt: "Harbor’s secured courtyard garden", title: "Harbor courtyard" },
              { src: "/img/exterior-evening.jpg", alt: "The courtyard with palms and umbrellas", title: "Palms & umbrellas" },
            ]}
          />
        </div>
      </section>

      <TourBand photo="/img/courtyard-dining.jpg" />
    </>
  );
}
