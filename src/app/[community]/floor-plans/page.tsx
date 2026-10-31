import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/i18n/Link";
import { getT } from "@/i18n/server";
import { Icon } from "@/components/Icon";
import { Dots } from "@/components/Logo";
import { PageHero } from "@/components/PageHero";
import { PlanBrowser } from "@/components/plans/PlanBrowser";
import { money, type PlanKind } from "@/data/shared";
import { getCommunity } from "@/lib/community-server";
import { keyPeople } from "@/data/communities/copy/living";
import { plansCopy } from "@/data/communities/copy/plans";
import "@/components/plans/plans.css";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  const { pricing } = await getCommunity();
  return {
    title: t("Floor Plans & Pricing"),
    description: t(`Studio, one- and two-bedroom apartments from ${money(pricing.independentRange[0])} a month, Assisted Living Services in every apartment, and Lantern Memory Care. No second-person fee.`),
  };
}

const KINDS: PlanKind[] = ["independent", "assisted", "lantern"];

export default async function FloorPlansPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const { t } = await getT();
  const c = await getCommunity();
  const { living, plans, pricing, site } = c;
  const copy = plansCopy[c.slug];
  const initialKind = KINDS.includes(type as PlanKind) && plans.some((p) => p.kind === type) ? (type as PlanKind) : "all";
  const maxSqft = Math.max(...plans.filter((p) => p.kind === "independent").map((p) => p.sqft ?? 0));
  const contact = keyPeople(c).relations;
  const who = contact && !contact.unnamed ? `${contact.name}, our ${contact.role}` : null;
  const availableNow = plans.reduce((s, p) => s + p.available, 0);

  return (
    <>
      <PageHero
        eyebrow="Floor Plans & Pricing"
        title={
          <>
            {t("Room to live, ")}<em>{t("right-sized")}</em>
          </>
        }
        lede={`Real apartment homes up to ${maxSqft.toLocaleString("en-US")} square feet, with full kitchens, your own washer and dryer, and one simple monthly rent that covers almost everything else.`}
        photo="/img/apt-living.jpg"
        alt="An open-plan apartment with a white sofa, kitchen peninsula and big windows"
        crumbs={[["Living Options", "/living"], ["Floor Plans & Pricing", "/floor-plans"]]}
      >
        <div className="btn-row">
          <Link href="/tour" className="btn btn-lg">
            <Icon name="calendar" /> {t("Schedule a Tour")}
          </Link>
          <a href={site.phoneHref} className="btn btn-ghost btn-lg">
            <Icon name="phone" /> {site.phone}
          </a>
        </div>
        <p className="fp-hero-note">
          <span className="fp-live-dot" aria-hidden="true" /> {availableNow}{t(" apartments available now")}
        </p>
      </PageHero>

      {/* Pricing summary */}
      <section className="sec-tight tone-cream fp-pricing" aria-labelledby="fp-pricing-h">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">{t("Monthly pricing")}</p>
            <h2 id="fp-pricing-h">
              {t("Simple, ")}<em>{t("all-in")}</em>{t(" monthly rent")}
            </h2>
          </div>
          <div className="fp-price-grid">
            <article className="fp-pc fp-pc-il">
              <h3>{t("Independent Living")}</h3>
              <p className="fp-pc-range">
                {money(pricing.independentRange[0])}–{money(pricing.independentRange[1])}
                <span>{t(" a month")}</span>
              </p>
              <ul className="fp-pc-list">
                {pricing.independent.map((r) => (
                  <li key={r.name}>
                    <span>{t(r.name)}</span>
                    <b>{t("from ")}{money(r.from)}</b>
                  </li>
                ))}
              </ul>
              <Link href="/living/independent-living" className="link-arrow">
                {t("About Independent Living ")}<Icon name="arrow" />
              </Link>
            </article>
            <article className="fp-pc fp-pc-al">
              <h3>{t(living.assisted.name)}</h3>
              <p className="fp-pc-range">
                {money(pricing.assistedBase)}
                <span>{t(" a month base support fee")}</span>
              </p>
              <ul className="fp-pc-list">
                <li>
                  <span>{t("Personal care")}</span>
                  <b>{t("by care plan")}</b>
                </li>
                <li>
                  <span>{t("Additional care levels")}</span>
                  <b>{t("by assessment")}</b>
                </li>
                <li>
                  <span>{t("Where")}</span>
                  <b>{t("in every apartment")}</b>
                </li>
              </ul>
              <Link href="/living/assisted-living" className="link-arrow">
                {t("About Assisted Living ")}<Icon name="arrow" />
              </Link>
            </article>
            <article className="fp-pc fp-pc-hb">
              <h3>{t(living.lantern.name)}</h3>
              <p className="fp-pc-range">
                {t("from ")}{money(pricing.lantern[0].from)}
                <span>{t(" a month")}</span>
              </p>
              <ul className="fp-pc-list">
                {pricing.lantern.map((r) => (
                  <li key={r.name}>
                    <span>{t(r.name)}</span>
                    <b>{t("from ")}{money(r.from)}</b>
                  </li>
                ))}
                <li>
                  <span>{t("Additional care levels")}</span>
                  <b>{t("by assessment")}</b>
                </li>
              </ul>
              <Link href="/living/lantern-memory-care" className="link-arrow">
                {t("About Lantern ")}<Icon name="arrow" />
              </Link>
            </article>
          </div>

          <div className="fp-couples">
            <Dots size={150} style={{ right: -30, top: -40, opacity: 0.5 }} />
            <div className="fp-couples-big" aria-hidden="true">
              $0
            </div>
            <div>
              <h3>{t("No second-person fee")}</h3>
              <p>{t("Couples share one monthly rent. Compared with communities that charge for a second person, that’s about ")}{money(pricing.secondPersonSaving)}{t(" a year back in your pocket.")}</p>
            </div>
            <Link href="/cost-comparison" className="btn btn-light">
              {t("Compare your costs ")}<Icon name="arrow" />
            </Link>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="sec tone-sand" id="plans" aria-labelledby="fp-plans-h">
        <div className="wrap">
          <div className="sec-head-row">
            <div className="sec-head">
              <p className="eyebrow">{t("Floor plans")}</p>
              <h2 id="fp-plans-h">
                {t("Choose a plan, then ")}<em>{t("step inside")}</em>
              </h2>
              <p>{t("Every plan has a virtual tour. If the one you love is on the waitlist, we’ll let you know the moment it opens up.")}</p>
            </div>
          </div>
          <PlanBrowser plans={plans} initialKind={initialKind} />
        </div>
      </section>

      {/* Included */}
      <section className="sec tone-white fp-inc">
        <div className="wrap fp-inc-grid">
          <div className="fp-inc-photos">
            <div className="fp-inc-ph fp-inc-ph-a">
              <Image src="/img/apt-kitchen.jpg" alt={t("A kitchen with stainless appliances, pendant lights and a solid-surface island")} fill sizes="(max-width: 900px) 70vw, 30vw" />
            </div>
            <div className="fp-inc-ph fp-inc-ph-b">
              <Image src="/img/apt-bath.jpg" alt={t("A bright bathroom with a walk-in shower and grab bar")} fill sizes="(max-width: 900px) 50vw, 20vw" />
            </div>
          </div>
          <div>
            <p className="eyebrow">{t("Included in every apartment")}</p>
            <h2>
              {t("One rent, ")}<em>{t("everything")}</em>{t(" taken care of")}
            </h2>
            <div className="fp-inc-cols">
              <div>
                <h3 className="fp-inc-h">{t("In your home")}</h3>
                <ul className="fp-ticks">
                  {living.independent.points.slice(1, 7).map((x) => (
                    <li key={x}>
                      <Icon name="check" />
                      {t(x)}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="fp-inc-h">{t("In your monthly rent")}</h3>
                <ul className="fp-ticks">
                  {pricing.included.map((x) => (
                    <li key={x}>
                      <Icon name="check" />
                      {t(x)}
                    </li>
                  ))}
                  <li>
                    <Icon name="paw" />
                    {t("Pets welcome")}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Planning tools */}
      <section className="sec-tight tone-cream">
        <div className="wrap">
          <div className="fp-tools">
            <Link href="/care-assessment" className="fp-tool">
              <span className="fp-tool-ic">
                <Icon name="heart" />
              </span>
              <span>
                <b>{t("Care Assessment")}</b>
                <span>{t("Ten friendly questions to find the right fit, in about three minutes.")}</span>
              </span>
              <Icon name="arrow" />
            </Link>
            <Link href="/cost-comparison" className="fp-tool">
              <span className="fp-tool-ic">
                <Icon name="chart" />
              </span>
              <span>
                <b>{t("Cost Comparison")}</b>
                <span>{t("See what staying at home really costs, line by line.")}</span>
              </span>
              <Icon name="arrow" />
            </Link>
            <Link href="/guides" className="fp-tool">
              <span className="fp-tool-ic">
                <Icon name="doc" />
              </span>
              <span>
                <b>{t("Senior Living Guides")}</b>
                <span>{t(copy.guidesBlurb)}</span>
              </span>
              <Icon name="arrow" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="sec-tight tone-green fp-cta">
        <Dots size={240} style={{ left: -70, bottom: -90, opacity: 0.35 }} />
        <div className="wrap fp-cta-in">
          <div>
            <h2>{t("See your favorite plan in person")}</h2>
            <p className="muted">{t(copy.cta(who))}</p>
          </div>
          <div className="btn-row">
            <Link href="/tour" className="btn btn-light btn-lg">
              <Icon name="calendar" /> {t("Schedule a Tour")}
            </Link>
            <a href={site.phoneHref} className="btn btn-outline-light btn-lg">
              <Icon name="phone" /> {t("Call ")}{site.phone}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
