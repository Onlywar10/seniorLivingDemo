import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "@/components/brand/brand.css";
import { site, stories } from "@/data/site";
import { eventsBetween, seatsLeft } from "@/data/calendar";
import { dayName, fmtTime, fromIso, iso, monthName, shortDate, today } from "@/lib/clock";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { PersonCard } from "@/components/brand/Monogram";
import { Seats } from "@/components/brand/WeekEvents";
import { Gallery } from "@/components/brand/Gallery";
import { TourBand } from "@/components/brand/TourBand";

export const metadata: Metadata = {
  title: "Events & Adventures",
  description: "From everyday enjoyment to once-in-a-lifetime bucket list items: trips, outings, parties and adventures at Prairie City Landing in Folsom, CA.",
};

const photos = [
  { src: "/img/car-wash.jpg", alt: "Residents in swimsuits and sunhats washing a convertible", title: "The charity car wash", caption: "Grandmas in bikinis, sponges in hand — and a line of cars around the block." },
  { src: "/img/beekeeping.jpg", alt: "A group of residents in white beekeeping suits", title: "Beekeeping day", caption: "Suits on, veils down, and a very close look at a working hive." },
  { src: "/img/paddleboard.jpg", alt: "A resident holding a paddle beside a paddleboard on the lake", title: "Stand-up paddling", caption: "Proof that it’s never too late to try something new." },
  { src: "/img/drum-circle.jpg", alt: "Residents playing drums in a circle in the courtyard", title: "Drum circle", caption: "Friday afternoons in the courtyard — no experience necessary." },
  { src: "/img/bocce.jpg", alt: "Two residents playing bocce on the courtyard court", title: "Bocce tournament", caption: "Friendly rivalry on our own court." },
  { src: "/img/lunar-new-year.jpg", alt: "Lion dancers visiting residents for Lunar New Year", title: "Lunar New Year", caption: "The lion dancers came to us." },
  { src: "/img/wine-pong.jpg", alt: "A resident tossing a ball at cups of wine", title: "Wine pong", caption: "Our take on a classic, at The Rendezvous." },
  { src: "/img/pool-hall.jpg", alt: "Four residents holding pool cues and drinks", title: "Night at the pool hall", caption: "The gentlemen’s outing that became a monthly tradition." },
  { src: "/img/grandkid-parade.jpg", alt: "Grandchildren in costume parading along the path", title: "The grandkid parade", caption: "Costumes, candy and a very proud audience." },
  { src: "/img/gardening.jpg", alt: "A resident tending the raised garden beds", title: "In the garden", caption: "The raised planters supply herbs for the kitchen." },
  { src: "/img/marshmallows.jpg", alt: "Marshmallows toasting over the courtyard fire table", title: "Marshmallows & camp stories", caption: "S’mores and tall tales around the fire table." },
  { src: "/img/chef-kitchen.jpg", alt: "The chef demonstrating a dish in the kitchen", title: "Conversations with Chef", caption: "Behind the scenes with Culinary Director Conrad Caguimbal’s kitchen." },
];

export default function EventsAdventures() {
  const d = today();
  const featured = stories.filter((s) => s.kind === "Events & Adventures").slice(0, 3);
  const trips = eventsBetween(d, 35, iso(d))
    .flatMap((x) => x.events)
    .filter((e) => e.cat === "trips" && !/^Shopping/.test(e.title) && e.title !== "Harbor Outing")
    .slice(0, 10);

  return (
    <>
      <PageHero
        eyebrow="Events & Adventures"
        title={
          <>
            From everyday enjoyment to <em>once-in-a-lifetime.</em>
          </>
        }
        lede="Events & Adventures covers everything from everyday enjoyment to once-in-a-lifetime bucket list items — planned with residents, not just for them."
        photo="/img/car-wash.jpg"
        alt="Residents in swimsuits washing a convertible at the charity car wash"
        crumbs={[
          ["Lifestyle", "/lifestyle"],
          ["Events & Adventures", "/events-adventures"],
        ]}
      >
        <div className="btn-row">
          <Link className="btn" href="#trips">
            Upcoming trips
          </Link>
          <Link className="btn btn-ghost" href="/calendar">
            Activity calendar
          </Link>
        </div>
      </PageHero>

      <section className="sec tone-white" aria-labelledby="br-cando-h">
        <div className="wrap br-split">
          <div>
            <p className="eyebrow">The can-do spirit</p>
            <h2 id="br-cando-h">
              If you can dream it, <em>we’ll plan it.</em>
            </h2>
            <p className="muted" style={{ marginTop: 14 }}>
              Our residents have a can-do spirit that surprises everyone, including themselves — <span className="br-bikini">like grandmas in bikinis</span> running the charity car wash. Every Friday at the Activity Meeting, residents and our Events & Adventures Director go over next week’s calendar, pitch new ideas and settle the details over drinks and appetizers.
            </p>
          </div>
          <div className="br-person-card">
            <PersonCard name="Toni Glenn" role="Events & Adventures Director" tone={1}>
              <p className="br-person-bio">Toni plans everything from Monday trivia to Gold Rush-era mine tours, and runs the Friday Activity Meeting where residents shape next week’s calendar.</p>
              <p className="br-person-bio">“My favorite word is yes. My second favorite is ‘bus leaves at 9:30’.”</p>
              <Link className="link-arrow" href="/team">
                Meet the team <Icon name="arrow" />
              </Link>
            </PersonCard>
          </div>
        </div>
      </section>

      <section className="sec tone-cream" aria-labelledby="br-feat-h">
        <div className="wrap">
          <div className="sec-head-row">
            <div className="sec-head">
              <p className="eyebrow">Recent adventures</p>
              <h2 id="br-feat-h">Stories from the community</h2>
            </div>
            <Link className="link-arrow" href="/news">
              All news <Icon name="arrow" />
            </Link>
          </div>
          <div className="br-stories">
            {featured.map((s) => (
              <Link key={s.slug} href={`/news/${s.slug}`} className="br-story">
                <span className="br-story-ph">
                  <Image src={s.photo} alt={s.alt} fill sizes="(max-width: 860px) 100vw, 50vw" />
                </span>
                <span className="br-story-body">
                  <time dateTime={s.date}>{shortDate(fromIso(s.date))}</time>
                  <h3>{s.title}</h3>
                  <p>{s.dek}</p>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="sec tone-white" id="trips" aria-labelledby="br-trips-h">
        <div className="wrap">
          <div className="sec-head-row">
            <div className="sec-head">
              <p className="eyebrow">On the bus</p>
              <h2 id="br-trips-h">
                Upcoming <em>trips & outings</em>
              </h2>
              <p>All trips leave from the Lobby. Seats are limited — sign up at the front desk or with Toni.</p>
            </div>
            <Link className="btn btn-green" href="/calendar">
              <Icon name="calendar" /> Full calendar
            </Link>
          </div>
          <ul className="br-trips">
            {trips.map((e) => {
              const date = fromIso(e.date);
              const left = seatsLeft(e);
              return (
                <li key={e.id} className="br-trip">
                  <div className="br-trip-date">
                    <span>{e.date === iso(d) ? "Today" : dayName(date).slice(0, 3)}</span>
                    <b>{date.getUTCDate()}</b>
                    <span style={{ color: "var(--ink-3)" }}>{monthName(date).slice(0, 3)}</span>
                  </div>
                  <div>
                    <p className="br-trip-title">{e.title}</p>
                    <p className="br-trip-meta">
                      <span>{`${fmtTime(e.start)} · ${e.room}`}</span>
                      {e.cost && <span>{e.cost}</span>}
                      {left !== undefined && <Seats e={e} />}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="sec tone-sand" aria-labelledby="br-pumpkin-h">
        <div className="wrap">
          <div className="br-pumpkin">
            <div className="br-pumpkin-ph">
              <Image src="/img/pumpkins.jpg" alt="Two glowing jack-o’-lanterns carved by residents" fill sizes="(max-width: 860px) 100vw, 50vw" />
            </div>
            <div className="br-pumpkin-body">
              <p className="eyebrow">Halloween in the courtyard</p>
              <h2 id="br-pumpkin-h">
                Our pumpkin carvers <em>never disappoint.</em>
              </h2>
              <p className="muted" style={{ marginTop: 14 }}>
                Every October, residents bring their best ideas to the courtyard for pumpkin carving — and the creations go up on our Facebook page for family and friends to admire. Vote for your favorite in the comments.
              </p>
              <a className="btn btn-green" href={site.facebook} target="_blank" rel="noreferrer">
                <Icon name="facebook" /> See them on Facebook
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="sec tone-cream" aria-labelledby="br-photos-h">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">Photo album</p>
            <h2 id="br-photos-h">
              A few of our <em>favorite</em> days
            </h2>
          </div>
          <Gallery items={photos} />
        </div>
      </section>

      <TourBand photo="/img/wine-toast.jpg" title={<>Come along for <em>the ride.</em></>} text="Visit, see the calendar for yourself and meet the residents who make every adventure happen." />
    </>
  );
}
