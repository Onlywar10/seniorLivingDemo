import type { Metadata } from "next";
import { VisitBand } from "@/components/VisitBand";
import Image from "next/image";
import Link from "@/i18n/Link";
import { getT } from "@/i18n/server";
import "@/components/brand/brand.css";
import { pillars } from "@/data/wrenhaven";
import { lifestyleCopy } from "@/data/communities/copy/lifestyle";
import { getCommunity } from "@/lib/community-server";
import { addDays, fmtTime, iso, nowMinutes, today } from "@/lib/clock";
import { cats } from "@/data/shared";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { TourBand } from "@/components/brand/TourBand";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: t("Lifestyle"),
    description: t(lifestyleCopy[(await getCommunity()).slug].metaDescription),
  };
}

export default async function Lifestyle() {
  const { t } = await getT();
  const c = await getCommunity();
  const { deeper, tiles, hero } = lifestyleCopy[c.slug];
  const d = today();
  // The same count as the Calendar and the homepage, and a short look at what's next (Calendar has the rest).
  const todays = c.eventsOn(d, iso(d));
  const n = todays.length;
  const now = nowMinutes();
  const next = [
    ...todays.filter((e) => (e.end ?? e.start + 60) > now).map((e) => ({ e, when: "Today" })),
    ...c.eventsOn(addDays(d, 1), iso(d)).map((e) => ({ e, when: "Tomorrow" })),
  ].slice(0, 4);
  return (
    <>
      <PageHero
        eyebrow="Lifestyle"
        title={
          <>
            {t("Your days, ")}<em>{t("your way.")}</em>
          </>
        }
        lede={`There are ${n} things on the calendar today alone. Join in, start something of your own, or just enjoy the courtyard. Up to you.`}
        photo={hero.photo}
        alt={hero.alt}
        crumbs={[["Lifestyle", "/lifestyle"]]}
      >
        <div className="btn-row">
          <Link className="btn" href="/calendar">
            <Icon name="calendar" /> {t("Today’s calendar")}
          </Link>
          <Link className="btn btn-ghost" href="#live">
            {t("What is LIVE?")}
          </Link>
        </div>
      </PageHero>

      <section className="sec-tight tone-white" aria-labelledby="ls-on-h">
        <div className="wrap ls-on">
          <h2 id="ls-on-h" className="ls-on-h">
            <Icon name="calendar" /> {t("What’s on")}
          </h2>
          <ul className="ls-on-l">
            {next.map(({ e, when }) => (
              <li key={e.id} style={{ "--cat": cats[e.cat].color } as React.CSSProperties}>
                <small>{t(when)} · {t(fmtTime(e.start))}</small>
                <b>{t(e.title)}</b>
              </li>
            ))}
          </ul>
          <Link className="link-arrow" href="/calendar">
            {t("See the full calendar")} <Icon name="arrow" />
          </Link>
        </div>
      </section>

      <section className="sec tone-cream" id="live" aria-labelledby="br-live-h">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">{t("What is LIVE?")}</p>
            <h2 id="br-live-h">
              {t("Lively. Independent. Valued. ")}<em>{t("Engaged.")}</em>
            </h2>
            <p>{t("LIVE is Wrenhaven Senior Living’s short answer to what makes a good life. We hold every class, menu, outing and conversation up against it, which is why no two weeks here are alike.")}</p>
          </div>
          <div className="br-live">
            {pillars.map((y, i) => {
              const x = deeper[y.letter] ?? Object.values(deeper)[i];
              return (
                <article key={y.letter} className="br-y">
                  <span className="br-y-letter" aria-hidden="true">
                    {y.letter}
                  </span>
                  <div>
                    <h3>{t(y.word)}</h3>
                    <p>
                      <strong>{t(y.text)}</strong>
                    </p>
                    <p>{t(x.more)}</p>
                    <ul>
                      {x.where.map(([label, href]) => (
                        <li key={label}>
                          <Link className="pill pill-terra" href={href}>
                            {t(label)} <Icon name="arrow" />
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
            <p className="eyebrow">{t("Explore")}</p>
            <h2 id="br-explore-h">
              {t("Find your ")}<em>{t("favorite")}</em>{t(" part of the day.")}
            </h2>
          </div>
          <div className="br-link-cards">
            {tiles.map((tile) => (
              <Link key={tile.href} href={tile.href} className="br-link-card">
                <Image src={tile.photo} alt="" fill sizes="(max-width: 640px) 100vw, 20vw" />
                <div>
                  <h3>{t(tile.title)}</h3>
                  <p>{t(tile.text)}</p>
                  <span className="go">
                    {t("Explore ")}<Icon name="arrow" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <TourBand photo="/img/wine-toast.jpg" />
      <VisitBand />
    </>
  );
}
