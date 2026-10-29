import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "@/components/brand/brand.css";
import { yusm } from "@/data/site";
import { eventsOn } from "@/data/calendar";
import { today } from "@/lib/clock";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { TourBand } from "@/components/brand/TourBand";

export const metadata: Metadata = {
  title: "Lifestyle",
  description: "Life at Prairie City Landing is YUSM — Youthful, Useful, Spontaneous and Mobile. Explore the activity calendar, dining, fitness, Events & Adventures and our amazing spaces.",
};

const deeper: Record<string, { more: string; where: [string, string][] }> = {
  Y: {
    more: "Youthful isn’t about age. It’s the feeling of learning something new, laughing until your sides hurt and trying the thing you always meant to. Visiting artists teach in the Art Studio, the Speaker Series brings authors and adventurers to the theatre, and the Friday happy hour has live music every week.",
    where: [["Art classes & clubs", "/calendar"], ["Amazing Spaces", "/spaces"]],
  },
  U: {
    more: "Everyone has something to give. Residents lead clubs, plant the raised beds, craft alongside the Folsom High School Senior Assistance Club and run the Resident Council. At the Friday Activity Meeting, residents shape next week’s calendar with our Events & Adventures Director.",
    where: [["Activity Meeting", "/calendar"], ["Purpose & Values", "/about"]],
  },
  S: {
    more: "Say yes to the unexpected. Join the bus to a Gold Rush-era mine, a wine tasting in the foothills or a last-minute lunch at a new restaurant — or skip it all for a quiet afternoon. Your day, your decisions.",
    where: [["Events & Adventures", "/events-adventures"], ["Upcoming trips", "/events-adventures#trips"]],
  },
  M: {
    more: "Fitness keeps you from ‘stepping back’ from life. Our full-time Fitness Director teaches more than 25 classes a week — from Better Balance and chair yoga to Zumba, tai chi and nature walks in local parks.",
    where: [["Fitness", "/fitness"], ["This week’s classes", "/fitness#classes"]],
  },
};

const tiles: { href: string; title: string; text: string; photo: string }[] = [
  { href: "/calendar", title: "Activity Calendar", text: "Classes, clubs, trips, music and movies, every day of the month.", photo: "/img/drum-circle.jpg" },
  { href: "/dining", title: "Dining", text: "Three restaurants with menus that change daily.", photo: "/img/dish-plated.jpg" },
  { href: "/events-adventures", title: "Events & Adventures", text: "Everyday enjoyment to once-in-a-lifetime bucket-list items.", photo: "/img/car-wash.jpg" },
  { href: "/fitness", title: "Fitness", text: "More than 25 classes a week with Jason Cherry.", photo: "/img/fitness-bike.jpg" },
  { href: "/spaces", title: "Amazing Spaces", text: "Theatre, salon, courtyard, art studio and more.", photo: "/img/fire-table.jpg" },
];

export default function Lifestyle() {
  const n = eventsOn(today()).length;
  return (
    <>
      <PageHero
        eyebrow="Lifestyle"
        title={
          <>
            Not just a home, but a <em>lifestyle.</em>
          </>
        }
        lede={`Today alone there are ${n} things happening on the calendar. Join in, start something new, or simply enjoy the view from the courtyard — it’s your call.`}
        photo="/img/lunar-new-year.jpg"
        alt="Residents celebrating Lunar New Year with lion dancers"
        crumbs={[["Lifestyle", "/lifestyle"]]}
      >
        <div className="btn-row">
          <Link className="btn" href="/calendar">
            <Icon name="calendar" /> Today’s calendar
          </Link>
          <Link className="btn btn-ghost" href="#yusm">
            What is YUSM?
          </Link>
        </div>
      </PageHero>

      <section className="sec tone-cream" id="yusm" aria-labelledby="br-yusm-h">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">What is YUSM?</p>
            <h2 id="br-yusm-h">
              Youthful. Useful. Spontaneous. <em>Mobile.</em>
            </h2>
            <p>YUSM is how Tenfold Senior Living thinks about a good life. It’s the lens we use for every class, menu, outing and conversation — and the reason no two weeks here look the same.</p>
          </div>
          <div className="br-yusm">
            {yusm.map((y) => {
              const x = deeper[y.letter];
              return (
                <article key={y.letter} className="br-y">
                  <span className="br-y-letter" aria-hidden="true">
                    {y.letter}
                  </span>
                  <div>
                    <h3>{y.word}</h3>
                    <p>
                      <strong>{y.text}</strong>
                    </p>
                    <p>{x.more}</p>
                    <ul>
                      {x.where.map(([label, href]) => (
                        <li key={label}>
                          <Link className="pill pill-terra" href={href}>
                            {label} <Icon name="arrow" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="br-y-ph">
                    <Image src={y.photo} alt="" fill sizes="(max-width: 960px) 100vw, 30vw" />
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="sec tone-sand" aria-labelledby="br-explore-h">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">Explore</p>
            <h2 id="br-explore-h">
              Find your <em>favorite</em> part of the day.
            </h2>
          </div>
          <div className="br-link-cards">
            {tiles.map((t) => (
              <Link key={t.href} href={t.href} className="br-link-card">
                <Image src={t.photo} alt="" fill sizes="(max-width: 640px) 100vw, 20vw" />
                <div>
                  <h3>{t.title}</h3>
                  <p>{t.text}</p>
                  <span className="go">
                    Explore <Icon name="arrow" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <TourBand photo="/img/wine-toast.jpg" />
    </>
  );
}
