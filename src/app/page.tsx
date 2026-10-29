import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "./home.css";
import "@/components/brand/brand.css";
import { awards, living, money, pricing, site, stories, testimonials, yusm, type LivingKey } from "@/data/site";
import { cats, eventsOn, type CalEvent } from "@/data/calendar";
import { menuFor, tagLabels, venues, type VenueKey } from "@/data/menus";
import { addDays, greeting, iso, longDate, nowMinutes, shortDate, fromIso, today } from "@/lib/clock";
import { Icon } from "@/components/Icon";
import { Dots } from "@/components/Logo";
import { TodayLive, type LiveEvent } from "@/components/brand/TodayLive";
import { TourBand } from "@/components/brand/TourBand";

export const metadata: Metadata = {
  title: { absolute: "Prairie City Landing · Luxury Senior Living in Folsom, CA" },
  description:
    "Sacramento County’s award-winning luxury senior living community in Folsom, CA. Independent Living from $5,950 a month, Assisted Living Services and Harbor Memory Care. Not just a home, but a lifestyle.",
};

const live = (e: CalEvent): LiveEvent => ({ id: e.id, start: e.start, end: e.end, title: e.title, room: e.room, color: cats[e.cat].color, label: cats[e.cat].label, leader: e.leader });

const venueLine: VenueKey[] = ["rendezvous", "cypress", "natoma"];
const venueAlt: Record<VenueKey, string> = {
  rendezvous: "The Rendezvous bar with its espresso machine and wine shelves",
  cypress: "The Cypress Room set with white tablecloths",
  natoma: "Natoma Café’s sunny dining area",
};

export default function Home() {
  const d = today();
  const events = eventsOn(d).map(live);
  const tomorrow = eventsOn(addDays(d, 1), iso(d)).map(live);
  const menus = venueLine.map((v) => menuFor(v, d));
  const soup = menus[0].soup;
  const eaStories = stories.filter((s) => s.kind === "Events & Adventures").slice(0, 3);

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="hm-hero" aria-labelledby="hm-hero-h">
        <div className="hm-hero-bg">
          <Image src="/img/exterior.jpg" alt="Prairie City Landing’s front entrance under a blue Folsom sky" fill priority sizes="100vw" />
        </div>
        <div className="wrap hm-hero-inner">
          <div className="hm-hero-text">
            <p className="eyebrow light rise">Folsom, California</p>
            <h1 id="hm-hero-h" className="rise rise-2">
              Not just a home, but a <em>lifestyle.</em>
            </h1>
            <p className="hm-hero-lede rise rise-3">Sacramento County’s award-winning luxury senior living community.</p>
            <div className="btn-row rise rise-4">
              <Link className="btn btn-lg" href="/tour">
                <Icon name="calendar" /> Schedule a Tour
              </Link>
              <a className="btn btn-outline-light btn-lg" href={site.phoneHref} aria-label={`Call ${site.phone}`}>
                <Icon name="phone" /> {site.phone}
              </a>
            </div>
          </div>
          <div className="hm-polaroids" aria-hidden="true">
            <figure className="hm-pol hm-pol-1">
              <span>
                <Image src="/img/paddleboard.jpg" alt="" fill sizes="280px" />
              </span>
              <figcaption>Stand-up paddling</figcaption>
            </figure>
            <figure className="hm-pol hm-pol-2">
              <span>
                <Image src="/img/rendezvous-dance.jpg" alt="" fill sizes="280px" />
              </span>
              <figcaption>Happy hour at The Rendezvous</figcaption>
            </figure>
            <figure className="hm-pol hm-pol-3">
              <span>
                <Image src="/img/beekeeping.jpg" alt="" fill sizes="280px" />
              </span>
              <figcaption>Beekeeping day</figcaption>
            </figure>
          </div>
        </div>
        <div className="hm-hero-awards">
          <div className="wrap">
            <ul>
              <li>
                <Icon name="star" /> <span>Best of Folsom · 8 years running</span>
              </li>
              <li>
                <Icon name="sparkle" /> <span>CALA Outstanding Executive Director</span>
              </li>
              <li>
                <Icon name="heart" /> <span>SageCare Certified</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- Today ---------- */}
      <section className="sec hm-today tone-white" aria-labelledby="hm-today-h">
        <Dots size={260} style={{ right: -90, top: -40, opacity: 0.18 }} />
        <div className="wrap">
          <div className="hm-today-head">
            <div>
              <p className="eyebrow">Today at Prairie City Landing</p>
              <h2 id="hm-today-h">
                <time dateTime={iso(d)}>{longDate(d)}</time>
              </h2>
            </div>
            <p className="hm-today-greet">{`${greeting()} from Folsom. Here’s what’s happening around the community.`}</p>
          </div>
          <div className="hm-today-grid">
            <TodayLive events={events} tomorrow={tomorrow} tomorrowLabel={`Tomorrow, ${shortDate(addDays(d, 1))}`} serverNow={nowMinutes()} />
            <aside className="hm-menus" aria-labelledby="hm-menus-h">
              <div className="hm-menus-top">
                <h3 id="hm-menus-h">On the menu today</h3>
                <Icon name="fork" />
              </div>
              <p className="hm-menu-soup">
                <span>Soup of the day</span>
                <b>{soup.name}</b>
                {soup.tags?.map((t) => (
                  <abbr key={t} className={`tag tag-${t}`} title={tagLabels[t]}>
                    {t}
                  </abbr>
                ))}
              </p>
              <ul>
                {menus.map((m) => (
                  <li key={m.venue}>
                    <p className="hm-menu-venue">
                      <b>{venues[m.venue].name}</b>
                      <span>{venues[m.venue].hours}</span>
                    </p>
                    <p className="hm-menu-k">{m.venue === "rendezvous" ? "Pour of the day" : m.holiday ? m.holiday : "Chef’s special"}</p>
                    <p className="hm-menu-dish">
                      {m.venue === "rendezvous" ? m.special.name.replace("Pour of the day: ", "") : m.special.name}
                      {m.special.tags?.map((t) => (
                        <abbr key={t} className={`tag tag-${t}`} title={tagLabels[t]}>
                          {t}
                        </abbr>
                      ))}
                    </p>
                    {m.special.desc && <p className="hm-menu-desc">{m.special.desc}</p>}
                  </li>
                ))}
              </ul>
              <Link className="btn btn-green btn-sm" href="/dining">
                Today’s full menus <Icon name="arrow" />
              </Link>
            </aside>
          </div>
        </div>
      </section>

      {/* ---------- Living options ---------- */}
      <section className="sec tone-cream" aria-labelledby="hm-living-h">
        <div className="wrap">
          <div className="sec-head-row">
            <div className="sec-head">
              <p className="eyebrow">Living options</p>
              <h2 id="hm-living-h">
                Real apartment homes, and support that <em>comes to you.</em>
              </h2>
            </div>
            <Link className="link-arrow" href="/floor-plans">
              Floor plans & pricing <Icon name="arrow" />
            </Link>
          </div>
          <div className="hm-living">
            {(Object.keys(living) as LivingKey[]).map((k, i) => {
              const l = living[k];
              return (
                <Link key={k} href={l.href} className={`hm-opt hm-opt-${i + 1}`}>
                  <span className="hm-opt-ph">
                    <Image src={l.photo} alt={l.alt} fill sizes="(max-width: 860px) 100vw, 50vw" />
                  </span>
                  <span className="hm-opt-body">
                    <span className="hm-opt-from">{k === "assisted" ? `${money(pricing.assistedBase)} a month base fee, plus care plan` : l.from}</span>
                    <h3>{l.name}</h3>
                    <span className="hm-opt-lede">{l.lede}</span>
                    <span className="link-arrow">
                      Explore {l.name} <Icon name="arrow" />
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------- YUSM ---------- */}
      <section className="sec tone-green on-dark hm-yusm" aria-labelledby="hm-yusm-h">
        <Dots size={340} style={{ left: -120, bottom: -120, opacity: 0.18 }} />
        <div className="wrap">
          <div className="hm-yusm-head">
            <div>
              <p className="eyebrow">Our philosophy</p>
              <h2 id="hm-yusm-h">
                Life here is <em>YUSM.</em>
              </h2>
            </div>
            <p>Four words shape every class, menu, outing and conversation at Prairie City Landing: Youthful, Useful, Spontaneous and Mobile.</p>
          </div>
          <ol className="hm-yusm-grid">
            {yusm.map((y) => (
              <li key={y.letter}>
                <span className="hm-y-ph">
                  <Image src={y.photo} alt="" fill sizes="(max-width: 640px) 100vw, 25vw" />
                  <span className="hm-y-letter" aria-hidden="true">
                    {y.letter}
                  </span>
                </span>
                <h3>{y.word}</h3>
                <p>{y.text}</p>
              </li>
            ))}
          </ol>
          <Link className="btn btn-light" href="/lifestyle#yusm">
            What YUSM means here <Icon name="arrow" />
          </Link>
        </div>
      </section>

      {/* ---------- Dining ---------- */}
      <section className="sec tone-sand" aria-labelledby="hm-dining-h">
        <div className="wrap">
          <div className="sec-head-row">
            <div className="sec-head">
              <p className="eyebrow">Dining</p>
              <h2 id="hm-dining-h">
                Three restaurants, <em>one table</em> for everyone.
              </h2>
              <p>Every menu is designed by Culinary Director Conrad Caguimbal. Eat when you like, where you like, with whoever you like.</p>
            </div>
            <Link className="link-arrow" href="/dining">
              See today’s menus <Icon name="arrow" />
            </Link>
          </div>
          <div className="hm-venues">
            {venueLine.map((k) => {
              const v = venues[k];
              return (
                <article key={k} className="hm-venue">
                  <div className="hm-venue-ph">
                    <Image src={k === "rendezvous" ? "/img/rendezvous-bar.jpg" : k === "cypress" ? "/img/cypress-people.jpg" : v.photo} alt={venueAlt[k]} fill sizes="(max-width: 860px) 100vw, 33vw" />
                  </div>
                  <div className="hm-venue-body">
                    <p className="hm-venue-kind">{v.kind}</p>
                    <h3>{v.name}</h3>
                    <p>{v.blurb}</p>
                    <p className="hm-venue-hours">
                      <Icon name="clock" /> <span>{`Open daily, ${v.hours}`}</span>
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------- Events & Adventures ---------- */}
      <section className="sec tone-cream" aria-labelledby="hm-ea-h">
        <div className="wrap">
          <div className="sec-head-row">
            <div className="sec-head">
              <p className="eyebrow">Events & Adventures</p>
              <h2 id="hm-ea-h">
                From everyday enjoyment to <em>bucket-list</em> moments.
              </h2>
            </div>
            <Link className="link-arrow" href="/events-adventures">
              All Events & Adventures <Icon name="arrow" />
            </Link>
          </div>
          <div className="br-stories">
            {eaStories.map((s) => (
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

      {/* ---------- Pricing ---------- */}
      <section className="sec tone-white hm-price" aria-labelledby="hm-price-h">
        <div className="wrap hm-price-grid">
          <div>
            <p className="eyebrow">Pricing</p>
            <h2 id="hm-price-h">
              One monthly rent. <em>Almost everything included.</em>
            </h2>
            <dl className="hm-price-list">
              <div>
                <dt>Independent Living</dt>
                <dd>{`From ${money(pricing.independent[0].from)} a month`}</dd>
              </div>
              <div>
                <dt>Assisted Living Services</dt>
                <dd>{`${money(pricing.assistedBase)} a month base fee, plus care plan`}</dd>
              </div>
              <div>
                <dt>Harbor Memory Care</dt>
                <dd>{`From ${money(pricing.harbor[0].from)} a month`}</dd>
              </div>
            </dl>
            <div className="hm-second">
              <Icon name="users" />
              <p>
                <b>No second-person fee.</b> <span>{`Couples save about ${money(pricing.secondPersonSaving)} a year compared with communities that charge one.`}</span>
              </p>
            </div>
            <div className="btn-row">
              <Link className="btn btn-green" href="/floor-plans">
                Floor plans & pricing
              </Link>
              <Link className="btn btn-ghost" href="/cost-comparison">
                Compare your costs at home
              </Link>
            </div>
          </div>
          <div className="hm-included">
            <h3>Included in your monthly rent</h3>
            <ul className="br-checks">
              {pricing.included.map((x) => (
                <li key={x}>
                  <Icon name="check" /> <span>{x}</span>
                </li>
              ))}
              <li>
                <Icon name="paw" /> <span>Pets welcome</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- Testimonials & awards ---------- */}
      <section className="sec tone-sand" aria-labelledby="hm-words-h">
        <div className="wrap">
          <div className="sec-head center">
            <p className="eyebrow">In their words</p>
            <h2 id="hm-words-h">
              Ask anyone who <em>lives here.</em>
            </h2>
          </div>
          <div className="hm-quotes">
            {testimonials.map((t, i) => (
              <figure key={t.name} className={`hm-quote hm-quote-${i + 1}`}>
                <span className="hm-qmark" aria-hidden="true">
                  “
                </span>
                <blockquote>
                  <p>{t.quote}</p>
                </blockquote>
                <figcaption>
                  <b data-no-translate>{t.name}</b>
                  <span>{t.relation}</span>
                </figcaption>
              </figure>
            ))}
          </div>
          <h2 className="vh">Awards</h2>
          <ul className="br-awards hm-awards">
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
        </div>
      </section>

      {/* ---------- Stay connected ---------- */}
      <section className="sec-tight tone-cream" aria-labelledby="hm-stay-h">
        <div className="wrap">
          <div className="hm-stay">
            <span className="hm-stay-ic">
              <Icon name="mail" />
            </span>
            <div>
              <h2 id="hm-stay-h">Stay connected</h2>
              <p>Get the monthly activity calendar, new menus and Events & Adventures stories in your inbox — or follow along on Facebook.</p>
            </div>
            <div className="btn-row">
              <Link className="btn btn-green" href="/stay-connected">
                Sign up
              </Link>
              <a className="btn btn-ghost" href={site.facebook} target="_blank" rel="noreferrer">
                <Icon name="facebook" /> Facebook
              </a>
            </div>
          </div>
        </div>
      </section>

      <TourBand />
    </>
  );
}
