import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/i18n/Link";
import { getT } from "@/i18n/server";
import "./home.css";
import "@/components/brand/brand.css";
import { cats, money, tagLabels, type CalEvent, type LivingKey } from "@/data/shared";
import { yusm } from "@/data/tenfold";
import { homeCopy } from "@/data/communities/copy/home";
import { getCommunity } from "@/lib/community-server";
import { addDays, greeting, iso, longDate, nowMinutes, shortDate, fromIso, today } from "@/lib/clock";
import { Icon } from "@/components/Icon";
import { Dots } from "@/components/Logo";
import { TodayLive, type LiveEvent } from "@/components/brand/TodayLive";
import { TourBand } from "@/components/brand/TourBand";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  const copy = homeCopy[(await getCommunity()).slug];
  return {
    title: { absolute: t(copy.metaTitle) },
    description: t(copy.metaDescription),
  };
}

const live = (e: CalEvent): LiveEvent => ({ id: e.id, start: e.start, end: e.end, title: e.title, room: e.room, color: cats[e.cat].color, label: cats[e.cat].label, leader: e.leader });

const POUR = "Pour of the day: ";
const awardIcons = ["star", "sparkle", "heart"] as const;

export default async function Home() {
  const { t } = await getT();
  const c = await getCommunity();
  const { site, living, pricing, venues, awards } = c;
  const copy = homeCopy[c.slug];
  const d = today();
  const events = c.eventsOn(d).map(live);
  const tomorrow = c.eventsOn(addDays(d, 1), iso(d)).map(live);
  const menus = c.venueOrder.map((v) => c.menuFor(v, d));
  const soup = menus[0].soup;
  // Events & Adventures stories first, topped up with other community news.
  const recent = c.stories.filter((s) => s.date <= iso(d));
  const eaStories = [
    ...recent.filter((s) => s.kind === "Events & Adventures"),
    ...recent.filter((s) => s.kind !== "Events & Adventures" && s.kind !== "Careers"),
  ].slice(0, 3);
  const testimonials = c.testimonials.slice(0, 3);

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="hm-hero" aria-labelledby="hm-hero-h">
        <div className="hm-hero-bg">
          <Image src={copy.hero.photo} alt={t(copy.hero.alt)} fill priority sizes="100vw" />
        </div>
        <div className="wrap hm-hero-inner">
          <div className="hm-hero-text">
            <p className="eyebrow light rise">{t(copy.hero.eyebrow)}</p>
            <h1 id="hm-hero-h" className="rise rise-2">
              {t(copy.hero.title)}<em>{t(copy.hero.titleEm)}</em>
            </h1>
            <p className="hm-hero-lede rise rise-3">{t(copy.hero.lede)}</p>
            <div className="btn-row rise rise-4">
              <Link className="btn btn-lg" href="/tour">
                <Icon name="calendar" /> {t("Schedule a Tour")}
              </Link>
              <a className="btn btn-outline-light btn-lg" href={site.phoneHref} aria-label={t(`Call ${site.phone}`)}>
                <Icon name="phone" /> {site.phone}
              </a>
            </div>
          </div>
          <div className="hm-polaroids" aria-hidden="true">
            {copy.polaroids.map((p, n) => (
              <figure key={p.photo} className={`hm-pol hm-pol-${n + 1}`}>
                <span>
                  <Image src={p.photo} alt="" fill sizes="280px" />
                </span>
                <figcaption>{t(p.caption)}</figcaption>
              </figure>
            ))}
          </div>
        </div>
        {copy.heroAwards.length > 0 && (
          <div className="hm-hero-awards">
            <div className="wrap">
              <ul>
                {copy.heroAwards.map((a, n) => (
                  <li key={a}>
                    <Icon name={awardIcons[n % awardIcons.length]} /> <span>{t(a)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* ---------- Today ---------- */}
      <section className="sec hm-today tone-white" aria-labelledby="hm-today-h">
        <Dots size={260} style={{ right: -90, top: -40, opacity: 0.18 }} />
        <div className="wrap">
          <div className="hm-today-head">
            <div>
              <p className="eyebrow">{t(`Today at ${site.name}`)}</p>
              <h2 id="hm-today-h">
                <time dateTime={iso(d)}>{t(longDate(d))}</time>
              </h2>
            </div>
            <p className="hm-today-greet">{t(`${greeting()} from ${site.address.city}. Here’s what’s happening around the community.`)}</p>
          </div>
          <div className="hm-today-grid">
            <TodayLive events={events} tomorrow={tomorrow} tomorrowLabel={`Tomorrow, ${shortDate(addDays(d, 1))}`} serverNow={nowMinutes()} quiet={copy.quiet} wrapUp={copy.wrapUp} />
            <aside className="hm-menus" aria-labelledby="hm-menus-h">
              <div className="hm-menus-top">
                <h3 id="hm-menus-h">{t("On the menu today")}</h3>
                <Icon name="fork" />
              </div>
              <p className="hm-menu-soup">
                <span>{t("Soup of the day")}</span>
                <b>{t(soup.name)}</b>
                {soup.tags?.map((tag) => (
                  <abbr key={tag} className={`tag tag-${tag}`} title={t(tagLabels[tag])}>
                    {tag}
                  </abbr>
                ))}
              </p>
              <ul>
                {menus.map((m) => (
                  <li key={m.venue}>
                    <p className="hm-menu-venue">
                      <b>{venues[m.venue].name}</b>
                      <span>{t(venues[m.venue].hours)}</span>
                    </p>
                    <p className="hm-menu-k">{t(m.special.name.startsWith(POUR) ? "Pour of the day" : m.holiday ? m.holiday : "Chef’s special")}</p>
                    <p className="hm-menu-dish">
                      {t(m.special.name.startsWith(POUR) ? m.special.name.slice(POUR.length) : m.special.name)}
                      {m.special.tags?.map((tag) => (
                        <abbr key={tag} className={`tag tag-${tag}`} title={t(tagLabels[tag])}>
                          {tag}
                        </abbr>
                      ))}
                    </p>
                    {m.special.desc && <p className="hm-menu-desc">{t(m.special.desc)}</p>}
                  </li>
                ))}
              </ul>
              <Link className="btn btn-green btn-sm" href="/dining">
                {t("Today’s full menus ")}<Icon name="arrow" />
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
              <p className="eyebrow">{t("Living options")}</p>
              <h2 id="hm-living-h">
                {t("Real apartment homes, and support that ")}<em>{t("comes to you.")}</em>
              </h2>
            </div>
            <Link className="link-arrow" href="/floor-plans">
              {t("Floor plans & pricing ")}<Icon name="arrow" />
            </Link>
          </div>
          <div className="hm-living">
            {(Object.keys(living) as LivingKey[]).map((k, i) => {
              const l = living[k];
              return (
                <Link key={k} href={l.href} className={`hm-opt hm-opt-${i + 1}`}>
                  <span className="hm-opt-ph">
                    <Image src={l.photo} alt={t(l.alt)} fill sizes="(max-width: 860px) 100vw, 50vw" />
                  </span>
                  <span className="hm-opt-body">
                    <span className="hm-opt-from">{t(k === "assisted" ? `${money(pricing.assistedBase)} a month base fee, plus care plan` : l.from)}</span>
                    <h3>{t(l.name)}</h3>
                    <span className="hm-opt-lede">{t(l.lede)}</span>
                    <span className="link-arrow">
                      {t("Explore ")}{t(l.name)} <Icon name="arrow" />
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
              <p className="eyebrow">{t("Our philosophy")}</p>
              <h2 id="hm-yusm-h">
                {t("Life here is ")}<em>{t("YUSM.")}</em>
              </h2>
            </div>
            <p>{t(`Four words shape every class, menu, outing and conversation at ${site.name}: Youthful, Useful, Spontaneous and Mobile.`)}</p>
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
                <h3>{t(y.word)}</h3>
                <p>{t(y.text)}</p>
              </li>
            ))}
          </ol>
          <Link className="btn btn-light" href="/lifestyle#yusm">
            {t("What YUSM means here ")}<Icon name="arrow" />
          </Link>
        </div>
      </section>

      {/* ---------- Dining ---------- */}
      <section className="sec tone-sand" aria-labelledby="hm-dining-h">
        <div className="wrap">
          <div className="sec-head-row">
            <div className="sec-head">
              <p className="eyebrow">{t("Dining")}</p>
              <h2 id="hm-dining-h">
                {t("Three restaurants, ")}<em>{t("one table")}</em>{t(" for everyone.")}
              </h2>
              <p>{t(copy.diningIntro)}</p>
            </div>
            <Link className="link-arrow" href="/dining">
              {t("See today’s menus ")}<Icon name="arrow" />
            </Link>
          </div>
          <div className="hm-venues">
            {c.venueOrder.map((k) => {
              const v = venues[k];
              const ph = copy.venuePhotos[k];
              return (
                <article key={k} className="hm-venue">
                  <div className="hm-venue-ph">
                    <Image src={ph?.photo ?? v.photo} alt={t(ph?.alt ?? v.name)} fill sizes="(max-width: 860px) 100vw, 33vw" />
                  </div>
                  <div className="hm-venue-body">
                    <p className="hm-venue-kind">{t(v.kind)}</p>
                    <h3>{v.name}</h3>
                    <p>{t(v.blurb)}</p>
                    <p className="hm-venue-hours">
                      <Icon name="clock" /> <span>{t(`Open daily, ${v.hours}`)}</span>
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
              <p className="eyebrow">{t("Events & Adventures")}</p>
              <h2 id="hm-ea-h">
                {t("From everyday enjoyment to ")}<em>{t("bucket-list")}</em>{t(" moments.")}
              </h2>
            </div>
            <Link className="link-arrow" href="/events-adventures">
              {t("All Events & Adventures ")}<Icon name="arrow" />
            </Link>
          </div>
          <div className="br-stories">
            {eaStories.map((s) => (
              <Link key={s.slug} href={`/news/${s.slug}`} className="br-story">
                <span className="br-story-ph">
                  <Image src={s.photo} alt={t(s.alt)} fill sizes="(max-width: 860px) 100vw, 50vw" />
                </span>
                <span className="br-story-body">
                  <time dateTime={s.date}>{t(shortDate(fromIso(s.date)))}</time>
                  <h3>{t(s.title)}</h3>
                  <p>{t(s.dek)}</p>
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
            <p className="eyebrow">{t("Pricing")}</p>
            <h2 id="hm-price-h">
              {t("One monthly rent. ")}<em>{t("Almost everything included.")}</em>
            </h2>
            <dl className="hm-price-list">
              <div>
                <dt>{t("Independent Living")}</dt>
                <dd>{t(`From ${money(pricing.independent[0].from)} a month`)}</dd>
              </div>
              <div>
                <dt>{t("Assisted Living Services")}</dt>
                <dd>{t(`${money(pricing.assistedBase)} a month base fee, plus care plan`)}</dd>
              </div>
              <div>
                <dt>{t("Harbor Memory Care")}</dt>
                <dd>{t(`From ${money(pricing.harbor[0].from)} a month`)}</dd>
              </div>
            </dl>
            <div className="hm-second">
              <Icon name="users" />
              <p>
                <b>{t("No second-person fee.")}</b> <span>{t(`Couples save about ${money(pricing.secondPersonSaving)} a year compared with communities that charge one.`)}</span>
              </p>
            </div>
            <div className="btn-row">
              <Link className="btn btn-green" href="/floor-plans">
                {t("Floor plans & pricing")}
              </Link>
              <Link className="btn btn-ghost" href="/cost-comparison">
                {t("Compare your costs at home")}
              </Link>
            </div>
          </div>
          <div className="hm-included">
            <h3>{t("Included in your monthly rent")}</h3>
            <ul className="br-checks">
              {pricing.included.map((x) => (
                <li key={x}>
                  <Icon name="check" /> <span>{t(x)}</span>
                </li>
              ))}
              <li>
                <Icon name="paw" /> <span>{t("Pets welcome")}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- Testimonials & awards ---------- */}
      <section className="sec tone-sand" aria-labelledby="hm-words-h">
        <div className="wrap">
          <div className="sec-head center">
            <p className="eyebrow">{t("In their words")}</p>
            <h2 id="hm-words-h">
              {t("Ask anyone who ")}<em>{t("lives here.")}</em>
            </h2>
          </div>
          <div className="hm-quotes">
            {testimonials.map((q, i) => (
              <figure key={q.name} className={`hm-quote hm-quote-${i + 1}`}>
                <span className="hm-qmark" aria-hidden="true">
                  “
                </span>
                <blockquote>
                  <p>{t(q.quote)}</p>
                </blockquote>
                <figcaption>
                  <b data-no-translate>{q.name}</b>
                  <span>{t(q.relation)}</span>
                </figcaption>
              </figure>
            ))}
          </div>
          {awards.length > 0 && (
            <>
              <h2 className="vh">{t("Awards")}</h2>
              <ul className="br-awards hm-awards">
                {awards.map((a, i) => (
                  <li key={a.title} className="br-award">
                    <span className="br-award-ic">
                      <Icon name={awardIcons[i % awardIcons.length]} />
                    </span>
                    <h3>{t(a.title)}</h3>
                    <p>{t(a.detail)}</p>
                    <p className="src">{t(a.source)}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
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
              <h2 id="hm-stay-h">{t("Stay connected")}</h2>
              <p>{t("Get the monthly activity calendar, new menus and Events & Adventures stories in your inbox — or follow along on Facebook.")}</p>
            </div>
            <div className="btn-row">
              <Link className="btn btn-green" href="/stay-connected">
                {t("Sign up")}
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
