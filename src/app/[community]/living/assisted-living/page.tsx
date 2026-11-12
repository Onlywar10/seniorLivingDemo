import type { Metadata } from "next";
import { VisitBand } from "@/components/VisitBand";
import Image from "next/image";
import Link from "@/i18n/Link";
import { getT } from "@/i18n/server";
import "@/components/brand/brand.css";
import { money } from "@/data/shared";
import { getCommunity } from "@/lib/community-server";
import { firstName, keyPeople, livingCopy, phoneWithExt } from "@/data/communities/copy/living";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { LivingTabs } from "@/components/brand/LivingTabs";
import { TourBand } from "@/components/brand/TourBand";
import { PersonCard } from "@/components/brand/Monogram";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: t("Assisted Living Services"),
    description: t(livingCopy[(await getCommunity()).slug].assistedMeta),
  };
}

const services: { icon: "doc" | "heart" | "users" | "phone" | "check" | "home"; title: string; text: string }[] = [
  { icon: "doc", title: "Medication management", text: "Med Techs order, store and give medications on schedule, and keep your care plan current with your doctors." },
  { icon: "heart", title: "Personal care", text: "Help with bathing, dressing and grooming, given with dignity and on your timetable." },
  { icon: "users", title: "Escorts", text: "A Care Partner to walk with you to meals, classes, happy hour and appointments." },
  { icon: "phone", title: "Provider coordination", text: "We talk with your physicians, pharmacy, therapists and home health so nothing falls through the cracks." },
  { icon: "check", title: "Assessment-based services", text: "Additional services are added after a pre-move-in assessment and reviewed as needs change." },
];

export default async function AssistedLiving() {
  const { t } = await getT();
  const c = await getCommunity();
  const { living, plans, pricing, site } = c;
  const copy = livingCopy[c.slug];
  const director = keyPeople(c).residentServices;
  const directorFirst = firstName(director);
  const list = copy.assistedExtra ? [...services, { icon: "home" as const, ...copy.assistedExtra }] : services;
  const al = living.assisted;
  const alPlans = plans.filter((p) => p.kind === "assisted");
  return (
    <>
      <PageHero
        eyebrow="Assisted Living Services"
        title={
          <>
            {t("Help that comes to you, so you ")}<em>{t("never have to move.")}</em>
          </>
        }
        lede={al.lede}
        photo={al.photo}
        alt={al.alt}
        crumbs={[
          ["Living Options", "/living"],
          ["Assisted Living Services", al.href],
        ]}
      >
        <div className="btn-row">
          <Link className="btn" href="/care-assessment">
            {t("Start a care assessment")}
          </Link>
          <a className="btn btn-ghost" href={site.phoneHref}>
            <Icon name="phone" /> {site.phone}
          </a>
        </div>
      </PageHero>
      <LivingTabs current="assisted" />

      <section className="sec tone-cream" aria-labelledby="br-move-h">
        <div className="wrap br-split">
          <div>
            <p className="eyebrow">{t("Your apartment, your life")}</p>
            <h2 id="br-move-h">
              {t("Available in ")}<em>{t("every")}</em>{t(" apartment.")}
            </h2>
            <p className="muted">{t(copy.assistedWhy)}</p>
            <div className="br-stat-row">
              <div className="br-stat">
                <b>0</b>
                <span>{t("moves required to receive care")}</span>
              </div>
              <div className="br-stat">
                <b>24/7</b>
                <span>{t("team on site, every day of the year")}</span>
              </div>
              <div className="br-stat">
                <b>{money(pricing.assistedBase)}</b>
                <span>{t("a month base support fee")}</span>
              </div>
            </div>
          </div>
          <div className="br-split-ph">
            <Image src="/img/care-outdoors.jpg" alt={t("A Care Partner walking with a resident in the garden")} fill sizes="(max-width: 860px) 100vw, 50vw" />
          </div>
        </div>
      </section>

      <section className="sec tone-sand" aria-labelledby="br-svc-h">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">{t("Services")}</p>
            <h2 id="br-svc-h">
              {t("What Assisted Living Services ")}<em>{t("include")}</em>
            </h2>
          </div>
          <div className="br-feature-grid">
            {list.map((s) => (
              <div key={s.title} className="br-feature">
                <Icon name={s.icon} />
                <h3>{t(s.title)}</h3>
                <p>{t(s.text)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec tone-white" aria-labelledby="br-alprice-h">
        <div className="wrap br-split">
          <div>
            <p className="eyebrow">{t("Pricing")}</p>
            <h2 id="br-alprice-h">
              {t("Simple, ")}<em>{t("transparent")}</em>{t(" pricing.")}
            </h2>
            <p className="muted">{t("Your monthly rent stays the same. Assisted Living Services add a base support fee and a personal care fee set by your care plan — you only pay for the help you use.")}</p>
            <dl className="br-dl">
              <div>
                <dt>{t("Base support fee")}</dt>
                <dd>{t(`${money(pricing.assistedBase)} a month`)}</dd>
              </div>
              <div>
                <dt>{t("Personal care")}</dt>
                <dd>{t("By care plan")}</dd>
              </div>
              {alPlans.map((p) => (
                <div key={p.code}>
                  <dt>
                    <Link href={`/floor-plans/${p.code}`}>{t(p.name)}</Link>
                  </dt>
                  <dd>{p.from ? t(`From ${money(p.from)}/mo`) : t("Call")}</dd>
                </div>
              ))}
            </dl>
            <div className="btn-row">
              <Link className="btn btn-green" href="/care-assessment">
                {t("Start a care assessment")}
              </Link>
              <Link className="btn btn-ghost" href="/floor-plans">
                {t("Floor plans")}
              </Link>
            </div>
          </div>
          {director && !director.unnamed && (
            <div className="br-person-card" style={{ alignSelf: "center" }}>
              <PersonCard name={director.name} role={director.role} tone={0}>
                <p className="br-person-bio">{t(copy.assistedBio ?? director.bio)}</p>
                {copy.assistedQuote && <p className="br-person-bio">{t(copy.assistedQuote)}</p>}
                <a className="btn btn-sm btn-ghost" href={site.phoneHref}>
                  <Icon name="phone" /> <span>{t(phoneWithExt(c, director))}</span>
                </a>
              </PersonCard>
            </div>
          )}
        </div>
      </section>

      <TourBand photo="/img/care-laugh.jpg" title={<>{t("Let’s talk about ")}<em>{t("what would help.")}</em></>} text={directorFirst ? `Visit, meet ${directorFirst} and the Care Partner team, and we’ll walk through an assessment together — no pressure and no obligation.` : "Visit, meet the Care Partner team, and we’ll walk through an assessment together — no pressure and no obligation."} />
      <VisitBand />
    </>
  );
}
