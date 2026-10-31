import type { Metadata } from "next";
import Image from "next/image";
import { getT } from "@/i18n/server";
import { Icon } from "@/components/Icon";
import { pillars } from "@/data/wrenhaven";
import { summaries, intoCommunity, TfCta, TfHead, TfHero } from "@/components/wrenhaven/parts";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: t("Lifestyle"),
    description: t("LIVE (Lively, Independent, Valued and Engaged) is the Wrenhaven idea behind chef-driven dining, Events & Adventures and more than 25 fitness classes a week."),
  };
}

export default async function LifestylePage() {
  const { t, href, lang } = await getT();
  const all = summaries();
  return (
    <>
      <TfHero
        t={t}
        href={href}
        crumbs={[["Lifestyle", "/lifestyle"]]}
        eyebrow="The Wrenhaven lifestyle"
        title={
          <>
            {t("More than a home: ")}
            <em>{t("a way of life")}</em>
          </>
        }
        lede={t("Every Wrenhaven calendar, menu and class starts from one idea: the years ahead should be lively, independent, valued and engaged.")}
        photo="/img/wine-toast.jpg"
        alt="Friends raising a glass together"
      />

      <section className="sec tone-cream" aria-labelledby="ls-live-h">
        <div className="wrap">
          <TfHead
            t={t}
            id="ls-live-h"
            eyebrow="LIVE"
            title={
              <>
                {t("Four words we ")}
                <em>{t("live by")}</em>
              </>
            }
            lede="Lively, Independent, Valued and Engaged. These four words shape every day in every Wrenhaven community."
          />
          <ol className="tf-live">
            {pillars.map((y) => (
              <li key={y.letter}>
                <div className="tf-live-ph">
                  <Image src={y.photo} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 960px) 50vw, 25vw" />
                  <span className="tf-live-letter" aria-hidden="true">
                    {y.letter}
                  </span>
                </div>
                <h3>{t(y.word)}</h3>
                <p>{t(y.text)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Events & Adventures */}
      <section className="sec tone-white" aria-labelledby="ls-ea-h">
        <div className="wrap tf-split">
          <div className="tf-split-ph">
            <div className="tf-ph">
              <Image src="/img/paddleboard.jpg" alt={t("Two residents sitting on a dock by a calm lake")} fill sizes="(max-width: 860px) 100vw, 45vw" />
            </div>
          </div>
          <div>
            <TfHead
              t={t}
              id="ls-ea-h"
              eyebrow="Events & Adventures"
              title={
                <>
                  {t("Plenty to do, ")}
                  <em>{t("nothing you have to")}</em>
                </>
              }
              lede="Clubs, classes, concerts, celebrations and trips out, planned by a dedicated Events & Adventures team. Lantern has a calendar of its own as well."
            />
            <div className="btn-row">
              {all.map((s) => (
                <a key={s.slug} className="btn btn-ghost btn-sm" href={intoCommunity(lang, s.slug, "/calendar")}>
                  <Icon name="calendar" /> {t(`${s.name} calendar`)}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dining */}
      <section className="sec tone-sand" aria-labelledby="ls-din-h">
        <div className="wrap">
          <TfHead
            t={t}
            id="ls-din-h"
            eyebrow="Dining"
            title={
              <>
                {t("Three restaurants, ")}
                <em>{t("one table for everyone")}</em>
              </>
            }
            lede="Each Wrenhaven community has three restaurants, from candlelit dinners to morning coffee and happy hour, and family and friends are always welcome."
          />
          <div className="tf-compare">
            {all.map((s) => (
              <article key={s.slug} className="tf-compare-card" aria-labelledby={`din-${s.slug}`}>
                <div className="tf-compare-body">
                  <p className="tf-comm-city">
                    <Icon name="pin" /> {s.city}, CA
                  </p>
                  <h3 id={`din-${s.slug}`}>{s.name}</h3>
                  <ul>
                    {s.c.venueOrder.map((v) => {
                      const venue = s.c.venues[v];
                      return (
                        <li key={v}>
                          <Icon name="fork" />
                          <span>
                            <b>{venue.name}</b> · {t(venue.kind)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="btn-row">
                    <a className="btn btn-green btn-sm" href={intoCommunity(lang, s.slug, "/dining")}>
                      {t("Today’s menus")}
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Fitness */}
      <section className="sec tone-white" aria-labelledby="ls-fit-h">
        <div className="wrap tf-split tf-split-rev">
          <div>
            <TfHead
              t={t}
              id="ls-fit-h"
              eyebrow="Fitness"
              title={
                <>
                  {t("Keep moving, ")}
                  <em>{t("keep going")}</em>
                </>
              }
              lede="More than 25 classes a week with a full-time Fitness Director, from strength and balance to walks in local parks."
            />
            <dl className="tf-mini-stats tf-mini-sand">
              {all.map((s) => (
                <div key={s.slug}>
                  <dt>{s.name}</dt>
                  <dd>
                    <a href={intoCommunity(lang, s.slug, "/fitness")}>{t("Fitness program")}</a>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="tf-split-ph">
            <div className="tf-ph">
              <Image src="/img/namaste.jpg" alt={t("A gentle yoga class")} fill sizes="(max-width: 860px) 100vw, 45vw" />
            </div>
          </div>
        </div>
      </section>

      {/* Per community */}
      <section className="sec tone-cream" aria-labelledby="ls-each-h">
        <div className="wrap">
          <TfHead
            t={t}
            id="ls-each-h"
            eyebrow="This week"
            title={
              <>
                {t("See what’s on ")}
                <em>{t("near you")}</em>
              </>
            }
          />
          <div className="tf-life-row" style={{ marginTop: 0 }}>
            {all.map((s) => (
              <div key={s.slug} className="tf-life-card">
                <div className="tf-life-ph">
                  <Image src={s.photo} alt={t(s.alt)} fill sizes="(max-width: 860px) 100vw, 33vw" />
                </div>
                <div className="tf-life-body">
                  <h3>{s.name}</h3>
                  <div className="tf-life-links">
                    <a href={intoCommunity(lang, s.slug, "/calendar")}>{t("Activity Calendar")}</a>
                    <a href={intoCommunity(lang, s.slug, "/dining")}>{t("Dining & Menus")}</a>
                    <a href={intoCommunity(lang, s.slug, "/events-adventures")}>{t("Events & Adventures")}</a>
                  </div>
                </div>
              </div>
            ))}
            <div className="tf-life-card">
              <div className="tf-life-ph">
                <Image src="/img/lantern-garden.jpg" alt={t("Lantern’s secure garden courtyard")} fill sizes="(max-width: 860px) 100vw, 33vw" />
              </div>
              <div className="tf-life-body">
                <h3>{t("Lantern Memory Care")}</h3>
                <p>{t("Activity programming with its own team, its own outings and a seat at every community event.")}</p>
                <div className="tf-life-links">
                  <a href={href("/living/lantern-memory-care")}>{t("About Lantern")}</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TfCta t={t} href={href} photo="/img/bocce.jpg" />
    </>
  );
}
