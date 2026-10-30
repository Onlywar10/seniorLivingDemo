import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/i18n/Link";
import { getT } from "@/i18n/server";
import "@/components/brand/brand.css";
import { money } from "@/data/shared";
import { getCommunity } from "@/lib/community-server";
import { firstName, keyPeople, livingCopy } from "@/data/communities/copy/living";
import { bedLabel } from "@/components/plans/data";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { LivingTabs } from "@/components/brand/LivingTabs";
import { TourBand } from "@/components/brand/TourBand";
import { Gallery } from "@/components/brand/Gallery";
import { PersonCard } from "@/components/brand/Monogram";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: t("Independent Living"),
    description: t(livingCopy[(await getCommunity()).slug].independentMeta),
  };
}

const apartmentPhotos = [
  { src: "/img/apt-living.jpg", alt: "A bright living room open to the kitchen", title: "Room for a sectional", meta: "Living room" },
  { src: "/img/apt-kitchen.jpg", alt: "A full-size kitchen with stainless appliances and a peninsula", title: "A real kitchen", meta: "Full-size, stainless appliances" },
  { src: "/img/apt-bedroom.jpg", alt: "A bedroom with a large window and soft light", title: "Oversized windows", meta: "Bedroom" },
  { src: "/img/apt-dining.jpg", alt: "A dining area set for guests", title: "A full dining set", meta: "Dining" },
  { src: "/img/apt-bath.jpg", alt: "A bathroom with a walk-in shower", title: "Walk-in showers", meta: "Bathroom" },
  { src: "/img/apt-bedroom-2.jpg", alt: "A second bedroom with a blue feature wall", title: "Space for guests", meta: "Second bedroom" },
];

export default async function IndependentLiving() {
  const { t } = await getT();
  const c = await getCommunity();
  const { living, plans, pricing, site } = c;
  const il = living.independent;
  const contact = keyPeople(c).relations;
  const first = firstName(contact);
  const ilPlans = plans.filter((p) => p.kind === "independent");
  return (
    <>
      <PageHero
        eyebrow="Independent Living"
        title={
          <>
            {t("A truly ")}<em>{t("independent")}</em>{t(" lifestyle.")}
          </>
        }
        lede={il.lede}
        photo="/img/apt-1br.jpg"
        alt="A one-bedroom apartment with a view from the living room into the bedroom"
        crumbs={[
          ["Living Options", "/living"],
          ["Independent Living", il.href],
        ]}
      >
        <div className="btn-row">
          <Link className="btn" href="/tour">
            {t("Schedule a Tour")}
          </Link>
          <Link className="btn btn-ghost" href="/floor-plans">
            {t("See floor plans")}
          </Link>
        </div>
      </PageHero>
      <LivingTabs current="independent" />

      <section className="sec tone-cream" aria-labelledby="br-apt-h">
        <div className="wrap">
          <div className="br-split">
            <div>
              <p className="eyebrow">{t("Your apartment")}</p>
              <h2 id="br-apt-h">
                {t("Real apartment homes, ")}<em>{t("not rooms.")}</em>
              </h2>
              <p className="muted">{t("Bring the sectional, the dining table and the art you love. Every apartment is designed for living the way you always have — with more time for the things you enjoy.")}</p>
              <ul className="br-checks" style={{ marginTop: 22 }}>
                {il.points.slice(0, 7).map((p) => (
                  <li key={p}>
                    <Icon name="check" /> <span>{t(p)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="br-split-ph tall">
              <Image src="/img/apt-kitchen.jpg" alt={t("A kitchen with stainless appliances, pendant lights and a breakfast bar")} fill sizes="(max-width: 860px) 100vw, 50vw" />
            </div>
          </div>
        </div>
      </section>

      <section className="sec-tight tone-sand" aria-labelledby="br-gal-h">
        <div className="wrap">
          <div className="sec-head">
            <h2 id="br-gal-h">{t("Step inside")}</h2>
          </div>
          <Gallery items={apartmentPhotos} />
        </div>
      </section>

      <section className="sec tone-white" aria-labelledby="br-price-h">
        <div className="wrap">
          <div className="sec-head-row">
            <div className="sec-head">
              <p className="eyebrow">{t("Pricing")}</p>
              <h2 id="br-price-h">
                {t(`From ${money(pricing.independentRange[0])} to ${money(pricing.independentRange[1])} a month`)}
              </h2>
              <p>{t(`One monthly rent covers your apartment, services and amenities. Availability changes weekly — ${first ?? "our team"} can tell you what’s open today.`)}</p>
            </div>
            <Link className="link-arrow" href="/floor-plans">
              {t("All floor plans ")}<Icon name="arrow" />
            </Link>
          </div>
          <div className="br-tbl-scroll">
            <table className="br-price-tbl">
              <thead>
                <tr>
                  <th scope="col">{t("Floor plan")}</th>
                  <th scope="col">{t("Bed / bath")}</th>
                  <th scope="col">{t("Size")}</th>
                  <th scope="col">{t("From")}</th>
                  <th scope="col">{t("Availability")}</th>
                </tr>
              </thead>
              <tbody>
                {ilPlans.map((p) => (
                  <tr key={p.code}>
                    <th scope="row">
                      <Link href={`/floor-plans/${p.code}`}>{t(p.name)}</Link> <span className="muted small" data-no-translate>{p.code}</span>
                    </th>
                    <td>{p.baths === null ? t(bedLabel(p)) : t(`${p.beds === 0 ? "Studio" : `${p.beds} bed`} · ${p.baths} bath`)}</td>
                    <td className="num">{p.sqft ? t(`${p.sqft.toLocaleString("en-US")} sq ft`) : "—"}</td>
                    <td className="num">{p.from ? t(`${money(p.from)}/mo`) : t("Call")}</td>
                    <td>{p.available > 0 ? <span className="pill">{t(p.available === 1 ? "1 available" : `${p.available} available`)}</span> : <span className="pill pill-butter">{t(`Waitlist · ${p.waitlist}`)}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid-2" style={{ marginTop: 32 }}>
            <div className="br-callout">
              <Icon name="users" />
              <p>
                <b>{t("No second-person fee")}</b>
                <span>{t(`Couples pay one monthly rent. That’s about ${money(pricing.secondPersonSaving)} a year saved compared with communities that charge for a second resident.`)}</span>
              </p>
            </div>
            <div className="br-callout" style={{ background: "var(--green-tint)" }}>
              <Icon name="paw" />
              <p>
                <b>{t("Pets welcome")}</b>
                <span>{t("Dogs and cats are part of the family here, with their own outdoor area in the courtyard.")}</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="sec tone-cream" aria-labelledby="br-inc-h">
        <div className="wrap br-split rev">
          <div className="br-split-ph">
            <Image src="/img/courtyard-lunch.jpg" alt={t("Residents enjoying lunch together on the courtyard patio")} fill sizes="(max-width: 860px) 100vw, 50vw" />
          </div>
          <div>
            <p className="eyebrow">{t("Included")}</p>
            <h2 id="br-inc-h">
              {t("Everything you need, ")}<em>{t("nothing to manage.")}</em>
            </h2>
            <ul className="br-checks" style={{ marginTop: 22 }}>
              {pricing.included.map((x) => (
                <li key={x}>
                  <Icon name="check" /> <span>{t(x)}</span>
                </li>
              ))}
            </ul>
            <p className="muted small" style={{ marginTop: 20 }}>
              {t("If you need more support later, ")}<Link href="/living/assisted-living">{t("Assisted Living Services")}</Link>{t(" come to your apartment — you never have to move.")}
            </p>
          </div>
        </div>
      </section>

      {contact && !contact.unnamed && (
        <section className="sec-tight tone-white" aria-labelledby="br-contact-h">
          <div className="wrap">
            <h2 id="br-contact-h" className="vh">
              {t("Your contact")}
            </h2>
            <div className="br-person-card">
              <PersonCard name={contact.name} role={contact.role} tone={1}>
                <p className="br-person-bio">{t(livingCopy[c.slug].relationsBio ?? contact.bio)}</p>
                <div className="btn-row">
                  <a className="btn btn-sm btn-green" href={site.phoneHref}>
                    <Icon name="phone" /> {site.phone}
                  </a>
                  <Link className="btn btn-sm btn-ghost" href="/contact">
                    {t("Send a message")}
                  </Link>
                </div>
              </PersonCard>
            </div>
          </div>
        </section>
      )}

      <TourBand photo="/img/apt-living.jpg" />
    </>
  );
}
