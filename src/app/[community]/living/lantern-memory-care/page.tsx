import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/i18n/Link";
import { getT } from "@/i18n/server";
import "@/components/brand/brand.css";
import { isLantern, money } from "@/data/shared";
import { getCommunity } from "@/lib/community-server";
import { firstName, keyPeople, livingCopy, phoneWithExt } from "@/data/communities/copy/living";
import { iso, today } from "@/lib/clock";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { LivingTabs } from "@/components/brand/LivingTabs";
import { TourBand } from "@/components/brand/TourBand";
import { PersonCard } from "@/components/brand/Monogram";
import { WeekEvents } from "@/components/brand/WeekEvents";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: t("Lantern Memory Care"),
    description: t(livingCopy[(await getCommunity()).slug].lanternMeta),
  };
}

export default async function Lantern() {
  const { t } = await getT();
  const c = await getCommunity();
  const { living, plans, pricing, site, testimonials } = c;
  const copy = livingCopy[c.slug];
  const director = keyPeople(c).lantern;
  const directorFirst = firstName(director);
  const h = living.lantern;
  const d = today();
  const week = c.eventsBetween(d, 7, iso(d)).map((x) => ({ date: iso(x.date), events: x.events.filter(isLantern) }));
  const lanternPlans = plans.filter((p) => p.kind === "lantern");
  const familyQuote = testimonials.find((x) => /lantern/i.test(x.relation));

  return (
    <>
      <PageHero
        eyebrow="Lantern Memory Care"
        title={
          <>
            {t("Good days, ")}<em>{t("on purpose.")}</em>
          </>
        }
        lede={copy.lanternLede}
        photo={h.photo}
        alt={h.alt}
        crumbs={[
          ["Living Options", "/living"],
          ["Lantern Memory Care", h.href],
        ]}
      >
        <div className="btn-row">
          <Link className="btn" href="/tour">
            {t("Visit Lantern")}
          </Link>
          <a className="btn btn-ghost" href={site.phoneHref}>
            <Icon name="phone" /> {site.phone}
          </a>
        </div>
      </PageHero>
      <LivingTabs current="lantern" />

      <section className="sec tone-green on-dark" aria-labelledby="br-turn-h">
        <div className="wrap">
          <h2 id="br-turn-h" className="vh">
            {t("Our approach")}
          </h2>
          <div className="br-turn">
            <s>{t("‘not anymore’")}</s>
            <Icon name="arrow" />
            <strong>{t("‘why not today?’")}</strong>
          </div>
          <p style={{ marginTop: 28, fontSize: "1.15rem", color: "#d8e2d6", maxWidth: "62ch" }}>
            {t(copy.lanternApproach)}
          </p>
        </div>
      </section>

      <section className="sec tone-cream" aria-labelledby="br-hea-h">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">{t("Lantern Events & Adventures")}</p>
            <h2 id="br-hea-h">
              {t("Weekly outings, ")}<em>{t("real adventures.")}</em>
            </h2>
            <p>{t(copy.lanternEaLede)}</p>
          </div>
          <ul className="br-outings">
            {copy.lanternOutings.map((o) => (
              <li key={o.label} className="br-outing">
                <span className="br-outing-ic">
                  <Icon name={o.icon} />
                </span>
                <p>{t(o.label)}</p>
              </li>
            ))}
          </ul>
          <div className="br-split" style={{ marginTop: "clamp(40px, 6vw, 72px)" }}>
            <div className="br-split-ph">
              <Image src="/img/paddleboard.jpg" alt={t("Two residents sharing a laugh on the lake dock")} fill sizes="(max-width: 860px) 100vw, 50vw" />
            </div>
            <div>
              <h3>{t("Every day at Lantern")}</h3>
              <ul className="br-prog" style={{ margin: "16px 0 24px" }}>
                {copy.lanternProgram.map((p) => (
                  <li key={p}>{t(p)}</li>
                ))}
              </ul>
              <ul className="br-checks">
                {copy.lanternChecks.map((x) => (
                  <li key={x}>
                    <Icon name="check" /> <span>{t(x)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="sec tone-white" aria-labelledby="br-hweek-h">
        <div className="wrap">
          <div className="sec-head-row">
            <div className="sec-head">
              <p className="eyebrow">{t("This week at Lantern")}</p>
              <h2 id="br-hweek-h">{t("From the Lantern calendar")}</h2>
            </div>
            <Link className="btn btn-green" href="/calendar?view=lantern">
              <Icon name="calendar" /> {t("Full Lantern calendar")}
            </Link>
          </div>
          <WeekEvents days={week} />
        </div>
      </section>

      <section className="sec tone-sand" aria-labelledby="br-hprice-h">
        <div className="wrap br-split">
          <div>
            <p className="eyebrow">{t("Lantern pricing")}</p>
            <h2 id="br-hprice-h">{t(`Studios from ${money(pricing.lantern[0].from)} a month`)}</h2>
            <p className="muted">{t(copy.lanternPricingNote)}</p>
            <div className="br-tbl-scroll" style={{ marginTop: 20 }}>
              <table className="br-price-tbl">
                <thead>
                  <tr>
                    <th scope="col">{t(pricing.lantern.every((p) => /studio/i.test(p.name)) ? "Studio" : "Apartment")}</th>
                    <th scope="col">{t("From")}</th>
                  </tr>
                </thead>
                <tbody>
                  {pricing.lantern.map((p) => (
                    <tr key={p.name}>
                      <th scope="row">{t(p.name)}</th>
                      <td className="num">{t(`${money(p.from)} a month`)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="small muted" style={{ marginTop: 14 }}>
              {t(`${lanternPlans.filter((p) => p.available > 0).length} Lantern rooms available now. `)}
              <Link href="/floor-plans">{t("See Lantern floor plans")}</Link>
            </p>
          </div>
          <div style={{ display: "grid", gap: 20 }}>
            {director && !director.unnamed && (
              <div className="br-person-card">
                <PersonCard name={director.name} role={director.role} tone={5}>
                  <p className="br-person-bio">{t(copy.lanternBio ?? director.bio)}</p>
                  <a className="btn btn-sm btn-ghost" href={site.phoneHref}>
                    <Icon name="phone" /> <span>{t(phoneWithExt(c, director))}</span>
                  </a>
                </PersonCard>
              </div>
            )}
            {familyQuote && (
              <figure className="br-person-card" style={{ margin: 0 }}>
                <blockquote style={{ margin: 0 }}>
                  <p className="br-quote" style={{ fontSize: "1.35rem" }}>{t(`“${familyQuote.quote}”`)}</p>
                </blockquote>
                <figcaption className="br-cite">
                  <span data-no-translate>{familyQuote.name}</span>, {t(familyQuote.relation)}
                </figcaption>
              </figure>
            )}
          </div>
        </div>
      </section>

      <TourBand photo="/img/lantern-garden.jpg" title={<>{t("Come and ")}<em>{t("see Lantern.")}</em></>} text={directorFirst ? `Meet ${directorFirst}, see the courtyard and spend some time with the Lantern team. We’ll answer every question, at your pace.` : "See the courtyard and spend some time with the Lantern team. We’ll answer every question, at your pace."} />
    </>
  );
}
