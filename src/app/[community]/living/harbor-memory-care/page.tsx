import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/i18n/Link";
import { getT } from "@/i18n/server";
import "@/components/brand/brand.css";
import { isHarbor, money } from "@/data/shared";
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
    title: t("Harbor Memory Care"),
    description: t(livingCopy[(await getCommunity()).slug].harborMeta),
  };
}

export default async function Harbor() {
  const { t } = await getT();
  const c = await getCommunity();
  const { living, plans, pricing, site, testimonials } = c;
  const copy = livingCopy[c.slug];
  const director = keyPeople(c).harbor;
  const directorFirst = firstName(director);
  const h = living.harbor;
  const d = today();
  const week = c.eventsBetween(d, 7, iso(d)).map((x) => ({ date: iso(x.date), events: x.events.filter(isHarbor) }));
  const harborPlans = plans.filter((p) => p.kind === "harbor");
  const linda = testimonials.find((x) => /harbor/i.test(x.relation));

  return (
    <>
      <PageHero
        eyebrow="Harbor Memory Care"
        title={
          <>
            {t("An environment of ")}<em>{t("youthful optimism.")}</em>
          </>
        }
        lede={copy.harborLede}
        photo={h.photo}
        alt={h.alt}
        crumbs={[
          ["Living Options", "/living"],
          ["Harbor Memory Care", h.href],
        ]}
      >
        <div className="btn-row">
          <Link className="btn" href="/tour">
            {t("Visit Harbor")}
          </Link>
          <a className="btn btn-ghost" href={site.phoneHref}>
            <Icon name="phone" /> {site.phone}
          </a>
        </div>
      </PageHero>
      <LivingTabs current="harbor" />

      <section className="sec tone-green on-dark" aria-labelledby="br-turn-h">
        <div className="wrap">
          <h2 id="br-turn-h" className="vh">
            {t("Our approach")}
          </h2>
          <div className="br-turn">
            <s>{t("‘we can’t’")}</s>
            <Icon name="arrow" />
            <strong>{t("‘how can we…’")}</strong>
          </div>
          <p style={{ marginTop: 28, fontSize: "1.15rem", color: "#d8e2d6", maxWidth: "62ch" }}>
            {t(copy.harborApproach)}
          </p>
        </div>
      </section>

      <section className="sec tone-cream" aria-labelledby="br-hea-h">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">{t("Harbor Events & Adventures")}</p>
            <h2 id="br-hea-h">
              {t("Weekly outings, ")}<em>{t("real adventures.")}</em>
            </h2>
            <p>{t(copy.harborEaLede)}</p>
          </div>
          <ul className="br-outings">
            {copy.harborOutings.map((o) => (
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
              <Image src="/img/paddleboard.jpg" alt={t("A resident and team member stand-up paddling on the lake")} fill sizes="(max-width: 860px) 100vw, 50vw" />
            </div>
            <div>
              <h3>{t("Every day at Harbor")}</h3>
              <ul className="br-prog" style={{ margin: "16px 0 24px" }}>
                {copy.harborProgram.map((p) => (
                  <li key={p}>{t(p)}</li>
                ))}
              </ul>
              <ul className="br-checks">
                {copy.harborChecks.map((x) => (
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
              <p className="eyebrow">{t("This week at Harbor")}</p>
              <h2 id="br-hweek-h">{t("From the Harbor calendar")}</h2>
            </div>
            <Link className="btn btn-green" href="/calendar?view=harbor">
              <Icon name="calendar" /> {t("Full Harbor calendar")}
            </Link>
          </div>
          <WeekEvents days={week} showSeats />
        </div>
      </section>

      <section className="sec tone-sand" aria-labelledby="br-hprice-h">
        <div className="wrap br-split">
          <div>
            <p className="eyebrow">{t("Harbor pricing")}</p>
            <h2 id="br-hprice-h">{t(`Studios from ${money(pricing.harbor[0].from)} a month`)}</h2>
            <p className="muted">{t(copy.harborPricingNote)}</p>
            <div className="br-tbl-scroll" style={{ marginTop: 20 }}>
              <table className="br-price-tbl">
                <thead>
                  <tr>
                    <th scope="col">{t(pricing.harbor.every((p) => /studio/i.test(p.name)) ? "Studio" : "Apartment")}</th>
                    <th scope="col">{t("From")}</th>
                  </tr>
                </thead>
                <tbody>
                  {pricing.harbor.map((p) => (
                    <tr key={p.name}>
                      <th scope="row">{t(p.name)}</th>
                      <td className="num">{t(`${money(p.from)} a month`)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="small muted" style={{ marginTop: 14 }}>
              {t(`${harborPlans.filter((p) => p.available > 0).length} Harbor rooms available now. `)}
              <Link href="/floor-plans">{t("See Harbor floor plans")}</Link>
            </p>
          </div>
          <div style={{ display: "grid", gap: 20 }}>
            {director && !director.unnamed && (
              <div className="br-person-card">
                <PersonCard name={director.name} role={director.role} tone={5}>
                  <p className="br-person-bio">{t(copy.harborBio ?? director.bio)}</p>
                  <a className="btn btn-sm btn-ghost" href={site.phoneHref}>
                    <Icon name="phone" /> <span>{t(phoneWithExt(c, director))}</span>
                  </a>
                </PersonCard>
              </div>
            )}
            {linda && (
              <figure className="br-person-card" style={{ margin: 0 }}>
                <blockquote style={{ margin: 0 }}>
                  <p className="br-quote" style={{ fontSize: "1.35rem" }}>{t(`“${linda.quote}”`)}</p>
                </blockquote>
                <figcaption className="br-cite">
                  <span data-no-translate>{linda.name}</span>, {t(linda.relation)}
                </figcaption>
              </figure>
            )}
          </div>
        </div>
      </section>

      <TourBand photo="/img/harbor-garden.jpg" title={<>{t("Come and ")}<em>{t("see Harbor.")}</em></>} text={directorFirst ? `Meet ${directorFirst}, see the courtyard and spend some time with the Harbor team. We’ll answer every question, at your pace.` : "See the courtyard and spend some time with the Harbor team. We’ll answer every question, at your pace."} />
    </>
  );
}
