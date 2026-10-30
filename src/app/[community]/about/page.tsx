import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/i18n/Link";
import { getT } from "@/i18n/server";
import "@/components/brand/brand.css";
import { nameOrigin, purpose, values } from "@/data/tenfold";
import { getCommunity } from "@/lib/community-server";
import { aboutCopy } from "@/data/communities/copy/about";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { Dots } from "@/components/Logo";
import { TourBand } from "@/components/brand/TourBand";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  const { site, awards } = await getCommunity();
  return {
    title: t("Purpose & Values"),
    description: t(`${site.name} is owned, designed, built and run by Tenfold Senior Living. Our purpose, our six values${awards.length ? ", and the awards that recognize our team" : " and where our name comes from"}.`),
  };
}

export default async function About() {
  const { t } = await getT();
  const c = await getCommunity();
  const { site, awards } = c;
  const copy = aboutCopy[c.slug];
  return (
    <>
      <PageHero
        eyebrow="Purpose & Values"
        title={
          <>
            {t("Each gives to each, ")}
            <em>{t("tenfold.")}</em>
          </>
        }
        lede={`${site.name} is a Tenfold Senior Living community. We own it, designed it, built it and run it — so the people who make decisions here are the people you see in the hallway.`}
        photo="/img/friends-laugh.jpg"
        alt="Two residents laughing together on a sofa"
        crumbs={[["About", "/about"]]}
      />

      <section className="sec tone-white" aria-labelledby="br-purpose-h" style={{ position: "relative", overflow: "hidden" }}>
        <Dots size={280} style={{ right: -100, top: -60, opacity: 0.2 }} />
        <div className="wrap center" style={{ position: "relative" }}>
          <p className="eyebrow">{t("Our purpose")}</p>
          <h2 id="br-purpose-h" className="vh">
            {t("Our purpose")}
          </h2>
          <p className="br-purpose">{t(purpose)}</p>
        </div>
      </section>

      <section className="sec tone-cream" aria-labelledby="br-values-h">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">{t("Our values")}</p>
            <h2 id="br-values-h">
              {t("Six values, ")}
              <em>{t("lived daily.")}</em>
            </h2>
            <p>{t("They guide how we hire, how we plan the calendar and how we answer every request — from residents, families and each other.")}</p>
          </div>
          <ul className="br-values">
            {values.map((v) => (
              <li key={v.key} className="br-value">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={v.icon} alt="" width={76} height={76} />
                <h3>{t(v.name)}</h3>
                <p>{t(v.text)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="sec tone-green on-dark" aria-labelledby="br-name-h" style={{ position: "relative", overflow: "hidden" }}>
        <Dots size={360} style={{ right: -120, bottom: -140, opacity: 0.22 }} />
        <div className="wrap br-split" style={{ position: "relative" }}>
          <div>
            <p className="eyebrow">{t("Where the name comes from")}</p>
            <h2 id="br-name-h">{t("Why “Tenfold”?")}</h2>
            <figure style={{ margin: "26px 0 0" }}>
              <blockquote style={{ margin: 0 }}>
                <p className="br-quote">
                  {t("“Each gives to each, and like the star gets back its gift in ")}
                  <em>{t("tenfold pay.")}</em>”
                </p>
              </blockquote>
              <figcaption className="br-cite" data-no-translate>
                {nameOrigin.author}
              </figcaption>
            </figure>
            <p style={{ marginTop: 24, color: "#d8e2d6" }}>
              {t("The California poet’s line captures what we see every day: when residents and team members give to one another, everyone gets back far more than they gave.")}
            </p>
          </div>
          <div className="br-split-ph">
            <Image src="/img/care-laugh.jpg" alt={t("A Care Partner and resident sharing a laugh")} fill sizes="(max-width: 860px) 100vw, 50vw" />
          </div>
        </div>
      </section>

      <section className="sec tone-sand" aria-labelledby="br-tenfold-h">
        <div className="wrap br-split rev">
          <div className="br-split-ph">
            <Image src={copy.placePhoto[0]} alt={t(copy.placePhoto[1])} fill sizes="(max-width: 860px) 100vw, 50vw" />
          </div>
          <div>
            <div style={{ display: "inline-block", background: "var(--green-deep)", borderRadius: 16, padding: "16px 22px", marginBottom: 22 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/brand/tenfold-white.png" alt={t("Tenfold Senior Living")} className="br-tenfold-logo" style={{ margin: 0, width: 180 }} />
            </div>
            <h2 id="br-tenfold-h">
              {t("Owned, designed, built and ")}
              <em>{t("run by Tenfold.")}</em>
            </h2>
            <p className="muted" style={{ marginTop: 14 }}>
              {t(`Tenfold Senior Living is a Northern California family of communities. We don’t hand our buildings to an outside manager: the same team that designed ${site.name} runs it every day, and answers to the residents who live here.`)}
            </p>
            <p className="muted">
              {t("Our sister community, ")}
              <a href={site.sister.url} target="_blank" rel="noreferrer">
                {site.sister.name}
              </a>
              {t(", welcomes residents in ")}
              {site.sister.city}.
            </p>
            <div className="btn-row" style={{ marginTop: 20 }}>
              <Link className="btn btn-green" href="/team">
                {t("Meet our team")}
              </Link>
              <a className="btn btn-ghost" href={site.tenfoldUrl} target="_blank" rel="noreferrer">
                Tenfold Senior Living <Icon name="arrow" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {awards.length > 0 ? (
      <section className="sec tone-white" aria-labelledby="br-awards-h">
        <div className="wrap">
          <div className="sec-head center">
            <p className="eyebrow">{t("Recognition")}</p>
            <h2 id="br-awards-h">
              {t("Award-winning, ")}
              <em>{t("year after year.")}</em>
            </h2>
          </div>
          <ul className="br-awards">
            {awards.map((a, i) => (
              <li key={a.title} className="br-award">
                <span className="br-award-ic">
                  <Icon name={i === 0 ? "star" : i === 1 ? "sparkle" : "heart"} />
                </span>
                <h3>{t(a.title)}</h3>
                <p>{t(a.detail)}</p>
                <p className="src">{t(a.source)}</p>
              </li>
            ))}
          </ul>
          <p className="center" style={{ marginTop: 28 }}>
            <Link className="link-arrow" href="/all-are-welcome">
              {t("All are welcome here")} <Icon name="arrow" />
            </Link>
          </p>
        </div>
      </section>
      ) : (
        <section className="sec-tight tone-white">
          <p className="center">
            <Link className="link-arrow" href="/all-are-welcome">
              {t("All are welcome here")} <Icon name="arrow" />
            </Link>
          </p>
        </section>
      )}

      <TourBand />
    </>
  );
}
