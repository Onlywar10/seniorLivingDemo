import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BrandHero } from "@/components/BrandHero";
import { LocationFinder } from "@/components/LocationFinder";
import { Reveal } from "@/components/Reveal";
import { Icon } from "@/components/Icon";
import { group, communities, shared, groupFaqs } from "@/data/group";
import { testimonials } from "@/data/community";

export const metadata: Metadata = {
  title: { absolute: "Larkmoor Senior Living · Six communities in Oregon and Washington" },
  description: "Family-owned assisted living, memory care and independent living in Millbrook Bend, Salem, Eugene, Astoria, Bend and Vancouver. Find the community nearest you.",
};

const careCards = [
  { name: "Independent living", where: "Ashby Grove and Fernhill", text: "Your own apartment or cottage, meals if you want them, and the calendar, the bus and the nurse on hand when you do.", photo: "/photos/walking.jpg", alt: "A couple walking along a garden path" },
  { name: "Assisted living", where: "All six homes", text: "Help with what you need and not with what you don’t, three meals a day, and a care level reassessed every 90 days.", photo: "/photos/couch.jpg", alt: "A couple laughing on their sofa" },
  { name: "Memory care", where: "Larkmoor House, Ashby Grove, Willow Bend and Maple Court", text: "A secure household with its own garden, one caregiver to five residents by day, and a programme built around each person’s habits.", photo: "/photos/hands.jpg", alt: "Two residents holding hands with a caregiver" },
];

export default function GroupHome() {
  const quotes = testimonials.slice(0, 3);
  const residents = communities.reduce((n, c) => n + c.residents, 0);
  return (
    <>
      <BrandHero />

      <Reveal className="home-sec tone-linen" id="find">
        <div className="wrap">
          <div className="intro">
            <h2>Find the home nearest you</h2>
            <p>
              Six communities, {residents} residents, one way of doing things. Search by town or zip code, or filter by the kind of care you are looking for.
            </p>
          </div>
          <LocationFinder />
        </div>
      </Reveal>

      <Reveal className="home-sec tone-ivory" id="shared">
        <div className="wrap">
          <div className="sec-head center">
            <h2>What every Larkmoor home shares</h2>
            <p>Each home has its own Executive Director, kitchen and character. These six things are the same everywhere.</p>
          </div>
          <ul className="shared">
            {shared.map((s, i) => (
              <li key={s.title}>
                <span className="step-n" aria-hidden="true">
                  {i + 1}
                </span>
                <b>{s.title}</b>
                <span>{s.text}</span>
              </li>
            ))}
          </ul>
          <div className="hero-actions center">
            <Link className="btn btn-gold btn-lg" href="/larkmoor-house">
              See Larkmoor House, our first home <Icon name="arrow" />
            </Link>
          </div>
        </div>
      </Reveal>

      <Reveal className="home-sec tone-sage" id="care">
        <div className="wrap">
          <div className="sec-head">
            <h2>Three kinds of care</h2>
            <p>Not every home offers all three. The finder above shows which does what.</p>
          </div>
          <div className="care-grid care-grid-3">
            {careCards.map((c) => (
              <article key={c.name} className="care-card">
                <div className="care-photo">
                  <Image src={c.photo} alt={c.alt} fill sizes="(max-width: 900px) 100vw, 33vw" />
                </div>
                <div className="care-body">
                  <h3>{c.name}</h3>
                  <p className="muted small">{c.where}</p>
                  <p>{c.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal className="home-sec tone-linen quotes-sec">
        <div className="wrap">
          <div className="sec-head center">
            <h2>What families tell us</h2>
          </div>
          <ul className="quotes quotes-3">
            {quotes.map((t) => (
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
                    <span>{t.relation}, Larkmoor House</span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      <Reveal className="home-sec tone-ivory faq-sec" id="faq">
        <div className="wrap">
          <div className="sec-head center">
            <h2>Questions families ask first</h2>
          </div>
          <div className="faq">
            {groupFaqs.map((f, i) => (
              <details key={f.q} className="faq-item" open={i === 0}>
                <summary>
                  <span>{f.q}</span>
                  <Icon name="chev" className="chev" />
                </summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </Reveal>

      <section className="cta-band" aria-labelledby="gcta-h">
        <div className="wrap cta-inner">
          <div>
            <h2 id="gcta-h">Start with a phone call</h2>
            <p>The central office will tell you which homes have space for the care you need, and put you through to the right Executive Director.</p>
            <div className="hero-actions">
              <a className="btn btn-gold btn-lg" href={group.phoneHref}>
                <Icon name="phone" />
                Call {group.phone}
              </a>
              <a className="btn btn-ghost btn-lg" href="#find">
                <Icon name="pin" />
                Find a location
              </a>
            </div>
          </div>
          <ul className="trust">
            <li>
              <b>Family owned since {group.founded}</b>
              <span className="muted-on-dark">One family, six homes, no outside investors</span>
            </li>
            <li>
              <b>{residents} residents across six homes</b>
              <span className="muted-on-dark">Millbrook Bend, Salem, Eugene, Astoria, Bend and Vancouver</span>
            </li>
            <li>
              <b>Every inspection record published</b>
              <Link href="/larkmoor-house/inspection-record">See Larkmoor House’s record</Link>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
