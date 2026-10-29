import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Hero } from "@/components/Hero";
import { Reveal } from "@/components/Reveal";
import { ModuleLabel } from "@/components/ModuleLabel";
import { Icon } from "@/components/Icon";
import { StayInTouch } from "@/components/StayInTouch";
import { TodayLive } from "@/components/TodayLive";
import { Count } from "@/components/Count";
import { community, getToday, getTodayMenu, getRecentPhotos, staff, testimonials, careLevelsHome, faqs } from "@/data/community";

const pillarTiles = () => [
  { href: "/larkmoor-house/activities", label: "Activities", line: `${getToday().events.length} things on today, the whole week published`, photo: "/photos/dancing.jpg", alt: "An older couple dancing in the Bistro at happy hour" },
  { href: "/larkmoor-house/dining", label: "Dining", line: "Three meals a day from our own kitchen, menus a week ahead", photo: "/photos/dining-three.jpg", alt: "Three residents laughing over lunch" },
  { href: "/larkmoor-house/apartments", label: "Apartments", line: "Floor plans, prices, availability and a virtual tour of each", photo: "/photos/couch.jpg", alt: "A couple at home on their sofa" },
  { href: "/larkmoor-house/team", label: "Care team", line: "Named nurses and directors, and who to call about what", photo: "/photos/nurse.jpg", alt: "A nurse with a resident" },
  { href: "/larkmoor-house/handbook", label: "Family handbook", line: "Visiting, pets, transport, guest meals and more", photo: "/photos/walking.jpg", alt: "A resident walking outside with a family member" },
  { href: "/larkmoor-house/news", label: "News", line: "What’s new, and urgent notices by text, email and app", photo: "/photos/tea.jpg", alt: "Residents sharing tea and pie" },
];

export const metadata: Metadata = { title: { absolute: "Larkmoor House · Assisted Living & Memory Care · Millbrook Bend, Oregon" } };

export default function Home() {
  const today = getToday();
  const recentPhotos = getRecentPhotos();
  const dinner = getTodayMenu().meals.find((m) => m.name === "Dinner")!;
  const people = staff.filter((s) => ["Marianne Okafor", "Priya Raghunathan", "Daniel Whitcombe"].includes(s.name));

  return (
    <>
      <Hero />

      <Reveal className="home-sec tone-linen" id="welcome">
        <div className="wrap">
          <div className="intro">
            <h2>A quiet street, a full week</h2>
            <p>
              Eighty-four people live here, in their own apartments, with a nurse in the building day and night and something on every day of the week. Have a look around: this week’s activities, the menus, the people who work here, the apartments and the family handbook.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-gold" href="/larkmoor-house/tour">
                <Icon name="calendar" />
                Book a tour
              </Link>
              <a className="btn btn-outline" href={community.phoneHref}>
                <Icon name="phone" />
                {community.phone}
              </a>
            </div>
          </div>
          <ul className="pillars">
            {pillarTiles().map((p) => (
              <li key={p.href}>
                <Link href={p.href}>
                  <span className="pillar-photo">
                    <Image src={p.photo} alt={p.alt} fill sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw" />
                  </span>
                  <span className="pillar-text">
                    <b>{p.label}</b>
                    <span>{p.line}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      <Reveal className="home-sec tone-ivory">
        <div className="wrap">
          <ModuleLabel k="daily-life" />
          <div className="sec-head">
            <h2>What’s going on this week?</h2>
            <p>What residents are doing today, and what is for dinner. Updated {community.updatedAt}.</p>
          </div>
          <div className="week-grid">
            <div className="mosaic">
              {recentPhotos.slice(0, 5).map((p, i) => (
                <figure key={p.src} className={`mosaic-item m${i + 1}`}>
                  <Image src={p.src} alt={p.alt} fill sizes="(max-width: 900px) 50vw, 30vw" />
                  <figcaption>
                    {p.caption} · {p.date}
                  </figcaption>
                </figure>
              ))}
            </div>
            <div className="today-col">
              <h3>Today, {community.todayShort}</h3>
              <TodayLive events={today.events.map(({ time, name, room }) => ({ time, name, room }))} />
              <p className="exit">
                <Link href="/larkmoor-house/activities">
                  This week’s full calendar <Icon name="arrow" />
                </Link>
              </p>
              <h3>Dinner tonight, {dinner.hours}</h3>
              <ul className="plain">
                {dinner.items.slice(0, 3).map((it) => (
                  <li key={it.name}>{it.name}</li>
                ))}
              </ul>
              <p className="exit">
                <Link href="/larkmoor-house/dining">
                  Menu for the week <Icon name="arrow" />
                </Link>
              </p>
              <p className="exit">
                <Link className="btn btn-gold" href="/larkmoor-house/tour">
                  Come for lunch on a tour
                </Link>
              </p>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal className="home-sec tone-sage quotes-sec">
        <div className="wrap">
          <ModuleLabel k="stories" />
          <div className="sec-head center">
            <h2>What families tell us</h2>
          </div>
          <ul className="quotes">
            {testimonials.map((t) => (
              <li key={t.name}>
                <blockquote>
                  <p>“{t.quote}”</p>
                </blockquote>
                <div className="who">
                  <span className="who-photo">
                    <Image src={t.photo} alt="" fill sizes="64px" />
                  </span>
                  <span>
                    <b>{t.name}</b>
                    <span>
                      {t.relation} · {t.since}
                    </span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <div className="hero-actions center">
            <Link className="btn btn-gold btn-lg" href="/larkmoor-house/tour">
              <Icon name="calendar" />
              Book a tour and meet them
            </Link>
            <a className="btn btn-outline btn-lg" href={community.phoneHref}>
              <Icon name="phone" />
              Or call {community.phone}
            </a>
          </div>
        </div>
      </Reveal>

      <Reveal className="home-sec tone-linen">
        <div className="wrap">
          <ModuleLabel k="costs" />
          <div className="sec-head">
            <h2>Two kinds of care, one building</h2>
            <p>Your own apartment on the first floor, or a secure household on the second. Both with the same kitchen, the same calendar and the same nurses.</p>
          </div>
          <div className="care-grid">
            {careLevelsHome.map((c) => (
              <article key={c.name} className="care-card">
                <div className="care-photo">
                  <Image src={c.photo} alt={c.alt} fill sizes="(max-width: 900px) 100vw, 50vw" />
                </div>
                <div className="care-body">
                  <h3>{c.name}</h3>
                  <p>{c.blurb}</p>
                  <ul className="checklist">
                    {c.points.map((pt) => (
                      <li key={pt}>
                        <Icon name="check" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="care-actions">
                    <Link className="btn btn-gold" href="/larkmoor-house/tour">
                      Book a tour
                    </Link>
                    <Link href="/larkmoor-house/apartments" className="exit-link">
                      See the apartments <Icon name="arrow" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal className="home-sec tone-ivory people-sec">
        <div className="wrap">
          <ModuleLabel k="care-team" />
          <div className="people-grid">
            <div className="people-photo">
              <Image src="/photos/entrance.jpg" alt="A resident with a walker at the front entrance, greeted by staff" fill sizes="(max-width: 900px) 100vw, 45vw" />
            </div>
            <div>
              <h2>You will meet the people who actually run the place</h2>
              <p>On a tour you sit down with Daniel, our family liaison, and one of the nurses, and you are welcome to stop and talk to anyone you pass.</p>
              <ul className="people">
                {people.map((s) => (
                  <li key={s.name}>
                    <span className="people-photo-sm">
                      <Image src={s.photo} alt="" fill sizes="56px" />
                    </span>
                    <span>
                      <b>{s.name}</b>
                      <span>
                        {s.role} · {s.years} years here
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="hero-actions">
                <a className="btn btn-gold" href={community.phoneHref}>
                  <Icon name="phone" />
                  Call and ask for Daniel
                </a>
                <Link href="/larkmoor-house/team" className="exit-link">
                  The whole care team <Icon name="arrow" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal className="home-sec tone-linen touch-sec">
        <div className="wrap">
          <StayInTouch />
        </div>
      </Reveal>

      <Reveal className="home-sec tone-sage faq-sec">
        <div className="wrap">
          <div className="sec-head center">
            <h2>Questions families ask first</h2>
          </div>
          <div className="faq">
            {faqs.map((f, i) => (
              <details key={f.q} className="faq-item" open={i === 0}>
                <summary>
                  <span>{f.q}</span>
                  <Icon name="chev" className="chev" />
                </summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
          <div className="hero-actions center">
            <a className="btn btn-outline btn-lg" href={community.phoneHref}>
              <Icon name="phone" />
              Ask us anything: {community.phone}
            </a>
          </div>
        </div>
      </Reveal>

      <section className="cta-band" aria-labelledby="cta-h">
        <div className="wrap cta-inner">
          <div>
            <h2 id="cta-h">See for yourself. Tours any day, 9 to 6.</h2>
            <p>Come during an activity and stay for lunch if you like. Bring your questions and whoever else needs to see the place.</p>
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
          <ul className="trust">
            <li>
              <b>No deficiencies, state survey {community.lastSurvey}</b>
              <Link href="/larkmoor-house/inspection-record">Read the full inspection record</Link>
            </li>
            <li>
              <b>Licence {community.licence}</b>
              <Link href="/larkmoor-house/inspection-record">Oregon assisted living, memory care endorsed</Link>
            </li>
            <li>
              <b>
                <Count n={community.census} /> residents, <Count n={community.capacity} /> apartments
              </b>
              <Link href="/larkmoor-house/apartments">The apartments and availability</Link>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
