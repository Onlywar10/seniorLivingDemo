import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "@/components/brand/brand.css";
import { fitness, instructors } from "@/data/site";
import { eventsBetween, eventsOn } from "@/data/calendar";
import { dayName, fmtTime, fromIso, iso, monthName, today } from "@/lib/clock";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { Monogram, PersonCard } from "@/components/brand/Monogram";
import { WeekEvents } from "@/components/brand/WeekEvents";
import { TourBand } from "@/components/brand/TourBand";
import { Gallery } from "@/components/brand/Gallery";

export const metadata: Metadata = {
  title: "Fitness",
  description: "More than 25 fitness classes a week at Prairie City Landing, led by full-time Fitness Director Jason Cherry: Better Balance, chair yoga, tai chi, Zumba, nature walks and the monthly Healthy Happy Hour.",
};

const icon = (i: number) => (["sun", "pin", "music", "spark", "heart", "wand", "sparkle", "dumbbell"] as const)[i % 8];

export default function Fitness() {
  const d = today();
  const week = eventsBetween(d, 7, iso(d)).map((x) => ({ date: iso(x.date), events: x.events.filter((e) => e.cat === "fitness") }));
  const classCount = week.reduce((n, x) => n + x.events.length, 0);
  const hhDate = fromIso("2026-11-18");
  const hh = eventsOn(hhDate).find((e) => e.title.startsWith("Healthy Happy Hour"));
  const fitInstructors = instructors.filter((i) => ["Sonya", "Shaun", "Showen", "Rhea"].includes(i.name));

  return (
    <>
      <PageHero
        eyebrow="Fitness"
        title={
          <>
            Keep moving. <em>Keep living.</em>
          </>
        }
        lede={fitness.intro}
        photo="/img/fitness-barbell.jpg"
        alt="A resident lifting a dumbbell during a strength class"
        crumbs={[
          ["Lifestyle", "/lifestyle"],
          ["Fitness", "/fitness"],
        ]}
      >
        <div className="btn-row">
          <Link className="btn" href="#classes">
            This week’s classes
          </Link>
          <Link className="btn btn-ghost" href="/calendar">
            Full calendar
          </Link>
        </div>
      </PageHero>

      <section className="sec tone-white" aria-labelledby="br-jason-h">
        <div className="wrap br-split">
          <div>
            <p className="eyebrow">Meet your Fitness Director</p>
            <h2 id="br-jason-h">
              Fitness is better <em>with friends.</em>
            </h2>
            <div className="br-person-card" style={{ marginTop: 24, boxShadow: "none", background: "var(--cream)" }}>
              <PersonCard name="Jason Cherry" role="Fitness Director" tone={0}>
                <p className="br-person-bio">Jason is full-time on site and teaches more than 25 classes a week. He is the author of “Social Fitness”, and leads the Monday nature walks and the monthly Healthy Happy Hour.</p>
                <Link className="link-arrow" href="/news/social-fitness">
                  Read “Social Fitness” <Icon name="arrow" />
                </Link>
              </PersonCard>
            </div>
            <div className="br-stat-row">
              <div className="br-stat">
                <b>25+</b>
                <span>classes every week</span>
              </div>
              <div className="br-stat">
                <b>{classCount}</b>
                <span>classes on the calendar in the next 7 days</span>
              </div>
              <div className="br-stat">
                <b>1</b>
                <span>full-time Fitness Director on site</span>
              </div>
            </div>
          </div>
          <div className="br-split-ph tall">
            <Image src="/img/fitness-bike.jpg" alt="A team member coaching a resident on a recumbent bike" fill sizes="(max-width: 860px) 100vw, 50vw" />
          </div>
        </div>
      </section>

      <section className="sec-tight tone-sand" aria-labelledby="br-hl-h">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">Highlights</p>
            <h2 id="br-hl-h">More than a gym</h2>
          </div>
          <ul className="br-hl">
            {fitness.highlights.map((h, i) => (
              <li key={h}>
                <Icon name={icon(i)} />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {hh && (
        <section className="sec-tight tone-cream" aria-labelledby="br-hh-h">
          <div className="wrap">
            <div className="br-event-card">
              <div className="br-cal-chip" aria-hidden="true">
                <span>{monthName(hhDate).slice(0, 3)}</span>
                <b>{hhDate.getUTCDate()}</b>
                <i>{dayName(hhDate)}</i>
              </div>
              <div>
                <p className="eyebrow">Monthly favorite</p>
                <h2 id="br-hh-h" className="h3" style={{ fontSize: "clamp(1.5rem, 2.6vw, 2rem)" }}>
                  {hh.title}
                </h2>
                <p>{`${dayName(hhDate)}, ${monthName(hhDate)} ${hhDate.getUTCDate()} · ${fmtTime(hh.start)} · ${hh.room}`}</p>
                <p>Music, nutritious snacks and choreography — a happy hour that counts as a workout. Everyone is welcome, whatever your fitness level.</p>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="sec tone-white" id="classes" aria-labelledby="br-classes-h">
        <div className="wrap">
          <div className="sec-head-row">
            <div className="sec-head">
              <p className="eyebrow">This week</p>
              <h2 id="br-classes-h">Fitness classes, next 7 days</h2>
              <p>Drop in to any class — no sign-up needed unless it shows a seat count.</p>
            </div>
            <Link className="btn btn-green" href="/calendar">
              <Icon name="calendar" /> Full calendar
            </Link>
          </div>
          <WeekEvents days={week} showSeats />
        </div>
      </section>

      <section className="sec-tight tone-sand" aria-labelledby="br-instr-h">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">Instructors</p>
            <h2 id="br-instr-h">Familiar faces, every week</h2>
          </div>
          <ul className="br-instr">
            {fitInstructors.map((p, i) => (
              <li key={p.name}>
                <Monogram name={p.name} size={56} tone={i + 1} />
                <p>
                  <b data-no-translate>{p.name}</b>
                  <span>{p.what}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="sec-tight tone-cream" aria-labelledby="br-fgal-h">
        <div className="wrap">
          <h2 id="br-fgal-h" className="vh">
            Fitness photos
          </h2>
          <Gallery
            items={[
              { src: "/img/fitness-center.jpg", alt: "The fitness center with exercise machines", title: "The Fitness Center" },
              { src: "/img/namaste.jpg", alt: "A resident in a seated yoga pose outdoors", title: "Mindful meditation" },
              { src: "/img/trail-walk.jpg", alt: "Residents on a nature walk", title: "Monday nature walks" },
              { src: "/img/bocce-women.jpg", alt: "Two residents playing bocce in the courtyard", title: "Bocce in the courtyard" },
              { src: "/img/gym.jpg", alt: "The class studio set up with chairs", title: "The class studio" },
              { src: "/img/friends-walking.jpg", alt: "Residents walking and laughing together in the park", title: "Walk to End Alzheimer’s" },
            ]}
          />
        </div>
      </section>

      <TourBand photo="/img/trail-walk.jpg" title={<>Try a class <em>on us.</em></>} text="Join Jason for a class when you visit, then stay for lunch in one of our three restaurants." />
    </>
  );
}
