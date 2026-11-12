import type { Metadata } from "next";
import { VisitBand } from "@/components/VisitBand";
import Image from "next/image";
import Link from "@/i18n/Link";
import { getT } from "@/i18n/server";
import "@/components/brand/brand.css";
import { eventsCopy } from "@/data/communities/copy/events";
import { getCommunity } from "@/lib/community-server";
import { dayName, fmtTime, fromIso, iso, monthName, shortDate, today } from "@/lib/clock";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { PersonCard } from "@/components/brand/Monogram";
import { Gallery } from "@/components/brand/Gallery";
import { TourBand } from "@/components/brand/TourBand";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: t("Events & Adventures"),
    description: t(eventsCopy[(await getCommunity()).slug].metaDescription),
  };
}

export default async function EventsAdventures() {
  const { t } = await getT();
  const c = await getCommunity();
  const copy = eventsCopy[c.slug];
  const d = today();
  // Events & Adventures stories first, topped up with other community news.
  const recent = c.stories.filter((s) => s.date <= iso(d));
  const featured = [
    ...recent.filter((s) => s.kind === "Events & Adventures"),
    ...recent.filter((s) => s.kind !== "Events & Adventures" && s.kind !== "Careers"),
  ].slice(0, 3);
  // The Events & Adventures Director, when the community publishes one by name.
  const director = c.team.find((m) => m.dept === "Events & Adventures" && /Director/.test(m.role) && !m.unnamed);
  const first = director?.name.split(" ")[0];
  const trips = c.eventsBetween(d, 35, iso(d))
    .flatMap((x) => x.events)
    .filter((e) => e.cat === "trips" && !/^Shopping/.test(e.title) && e.title !== "Lantern Outing")
    .slice(0, 10);

  return (
    <>
      <PageHero
        eyebrow="Events & Adventures"
        title={
          <>
            {t("Small pleasures. ")}<em>{t("Big adventures.")}</em>
          </>
        }
        lede="Events & Adventures runs from the everyday to the unforgettable, and residents help plan all of it."
        photo={copy.hero.photo}
        alt={copy.hero.alt}
        crumbs={[
          ["Lifestyle", "/lifestyle"],
          ["Events & Adventures", "/events-adventures"],
        ]}
      >
        <div className="btn-row">
          <Link className="btn" href="#trips">
            {t("Upcoming trips")}
          </Link>
          <Link className="btn btn-ghost" href="/calendar?view=month&cat=trips">
            {t("Trips on the calendar")}
          </Link>
        </div>
      </PageHero>

      <section className="sec tone-white" aria-labelledby="br-cando-h">
        <div className={director ? "wrap br-split" : "wrap"}>
          <div>
            <p className="eyebrow">{t("The can-do spirit")}</p>
            <h2 id="br-cando-h">
              {t("Bring the idea. ")}<em>{t("We’ll book the bus.")}</em>
            </h2>
            <p className="muted" style={{ marginTop: 14 }}>
              {t(copy.canDo[0])}<span className="br-bikini">{t(copy.canDo[1])}</span>{t(copy.canDo[2])}
            </p>
          </div>
          {director && (
            <div className="br-person-card">
              <PersonCard name={director.name} role={director.role} tone={1}>
                <p className="br-person-bio">{t(director.bio)}</p>
                {copy.directorQuote && <p className="br-person-bio">{t(copy.directorQuote)}</p>}
                <Link className="link-arrow" href="/team">
                  {t("Meet the team ")}<Icon name="arrow" />
                </Link>
              </PersonCard>
            </div>
          )}
        </div>
      </section>

      <section className="sec tone-cream" aria-labelledby="br-feat-h">
        <div className="wrap">
          <div className="sec-head-row">
            <div className="sec-head">
              <p className="eyebrow">{t("Recent adventures")}</p>
              <h2 id="br-feat-h">{t("Stories from the community")}</h2>
            </div>
            <Link className="link-arrow" href="/news">
              {t("All news ")}<Icon name="arrow" />
            </Link>
          </div>
          <div className="br-stories">
            {featured.map((s) => (
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

      <section className="sec tone-white" id="trips" aria-labelledby="br-trips-h">
        <div className="wrap">
          <div className="sec-head-row">
            <div className="sec-head">
              <p className="eyebrow">{t("On the bus")}</p>
              <h2 id="br-trips-h">
                {t("Upcoming ")}<em>{t("trips & outings")}</em>
              </h2>
              <p>{t(first ? `Residents: reply YES to the invite text, or sign up with ${first} and the activities team. Families: reply to your text to ask for a seat; we check with your resident first.` : "Residents: reply YES to the invite text, or sign up with the activities team. Families: reply to your text to ask for a seat; we check with your resident first.")}</p>
            </div>
            <Link className="btn btn-green" href="/calendar?view=month&cat=trips">
              <Icon name="calendar" /> {t("All trips on the calendar")}
            </Link>
          </div>
          <ul className="br-trips">
            {trips.map((e) => {
              const date = fromIso(e.date);
              return (
                <li key={e.id} className="br-trip">
                  <div className="br-trip-date">
                    <span>{t(e.date === iso(d) ? "Today" : dayName(date).slice(0, 3))}</span>
                    <b>{date.getUTCDate()}</b>
                    <span style={{ color: "var(--ink-3)" }}>{t(monthName(date).slice(0, 3))}</span>
                  </div>
                  <div>
                    <p className="br-trip-title">{t(e.title)}</p>
                    {e.desc && <p className="br-trip-desc">{t(e.desc)}</p>}
                    <p className="br-trip-meta">
                      <span>{t(fmtTime(e.start))}</span>
                      {e.cost && <span>{t(e.cost)}</span>}
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
              <Image src="/img/pumpkins.jpg" alt={t("Two glowing jack-o’-lanterns carved by residents")} fill sizes="(max-width: 860px) 100vw, 50vw" />
            </div>
            <div className="br-pumpkin-body">
              <p className="eyebrow">{t("Halloween in the courtyard")}</p>
              <h2 id="br-pumpkin-h">
                {t("Our pumpkin carvers ")}<em>{t("never disappoint.")}</em>
              </h2>
              <p className="muted" style={{ marginTop: 14 }}>
                {t("Each October the courtyard turns into a carving workshop, and the finished pumpkins go into this year’s photo album for family and friends to see.")}
              </p>
              <Link className="btn btn-green" href="/photos">
                <Icon name="image" /> {t("See the photos")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="sec tone-cream" aria-labelledby="br-photos-h">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">{t("Photo album")}</p>
            <h2 id="br-photos-h">
              {t("A few of our ")}<em>{t("favorite")}</em>{t(" days")}
            </h2>
          </div>
          <Gallery items={copy.gallery} />
          <p style={{ marginTop: 20 }}>
            <Link className="link-arrow" href="/photos">
              {t("All photo albums")} <Icon name="arrow" />
            </Link>
          </p>
        </div>
      </section>

      <TourBand photo="/img/wine-toast.jpg" title={<>{t("Come along for ")}<em>{t("the ride.")}</em></>} text="Visit, see the calendar for yourself and meet the residents who make every adventure happen." />
      <VisitBand />
    </>
  );
}
