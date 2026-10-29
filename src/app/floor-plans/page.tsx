import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Dots } from "@/components/Logo";
import { PageHero } from "@/components/PageHero";
import { PlanBrowser } from "@/components/plans/PlanBrowser";
import { living, money, plans, pricing, site, type PlanKind } from "@/data/site";
import "@/components/plans/plans.css";

export const metadata: Metadata = {
  title: "Floor Plans & Pricing",
  description: `Studio, one- and two-bedroom apartments from ${money(pricing.independentRange[0])} a month, Assisted Living Services in every apartment, and Harbor Memory Care. No second-person fee.`,
};

const KINDS: PlanKind[] = ["independent", "assisted", "harbor"];

export default async function FloorPlansPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const initialKind = KINDS.includes(type as PlanKind) ? (type as PlanKind) : "all";
  const availableNow = plans.reduce((s, p) => s + p.available, 0);

  return (
    <>
      <PageHero
        eyebrow="Floor Plans & Pricing"
        title={
          <>
            Room to live, <em>right-sized</em>
          </>
        }
        lede="Real apartment homes up to 1,417 square feet, with full kitchens, your own washer and dryer, and one simple monthly rent that covers almost everything else."
        photo="/img/apt-living.jpg"
        alt="An open-plan apartment with a white sofa, kitchen peninsula and big windows"
        crumbs={[["Living Options", "/living"], ["Floor Plans & Pricing", "/floor-plans"]]}
      >
        <div className="btn-row">
          <Link href="/tour" className="btn btn-lg">
            <Icon name="calendar" /> Schedule a Tour
          </Link>
          <a href={site.phoneHref} className="btn btn-ghost btn-lg">
            <Icon name="phone" /> {site.phone}
          </a>
        </div>
        <p className="fp-hero-note">
          <span className="fp-live-dot" aria-hidden="true" /> {availableNow} apartments available now
        </p>
      </PageHero>

      {/* Pricing summary */}
      <section className="sec-tight tone-cream fp-pricing" aria-labelledby="fp-pricing-h">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">Monthly pricing</p>
            <h2 id="fp-pricing-h">
              Simple, <em>all-in</em> monthly rent
            </h2>
          </div>
          <div className="fp-price-grid">
            <article className="fp-pc fp-pc-il">
              <h3>Independent Living</h3>
              <p className="fp-pc-range">
                {money(pricing.independentRange[0])}–{money(pricing.independentRange[1])}
                <span> a month</span>
              </p>
              <ul className="fp-pc-list">
                {pricing.independent.map((r) => (
                  <li key={r.name}>
                    <span>{r.name}</span>
                    <b>from {money(r.from)}</b>
                  </li>
                ))}
              </ul>
              <Link href="/living/independent-living" className="link-arrow">
                About Independent Living <Icon name="arrow" />
              </Link>
            </article>
            <article className="fp-pc fp-pc-al">
              <h3>{living.assisted.name}</h3>
              <p className="fp-pc-range">
                {money(pricing.assistedBase)}
                <span> a month base support fee</span>
              </p>
              <ul className="fp-pc-list">
                <li>
                  <span>Personal care</span>
                  <b>by care plan</b>
                </li>
                <li>
                  <span>Additional care levels</span>
                  <b>by assessment</b>
                </li>
                <li>
                  <span>Where</span>
                  <b>in every apartment</b>
                </li>
              </ul>
              <Link href="/living/assisted-living" className="link-arrow">
                About Assisted Living <Icon name="arrow" />
              </Link>
            </article>
            <article className="fp-pc fp-pc-hb">
              <h3>{living.harbor.name}</h3>
              <p className="fp-pc-range">
                from {money(pricing.harbor[0].from)}
                <span> a month</span>
              </p>
              <ul className="fp-pc-list">
                {pricing.harbor.map((r) => (
                  <li key={r.name}>
                    <span>{r.name}</span>
                    <b>from {money(r.from)}</b>
                  </li>
                ))}
                <li>
                  <span>Additional care levels</span>
                  <b>by assessment</b>
                </li>
              </ul>
              <Link href="/living/harbor-memory-care" className="link-arrow">
                About Harbor <Icon name="arrow" />
              </Link>
            </article>
          </div>

          <div className="fp-couples">
            <Dots size={150} style={{ right: -30, top: -40, opacity: 0.5 }} />
            <div className="fp-couples-big" aria-hidden="true">
              $0
            </div>
            <div>
              <h3>No second-person fee</h3>
              <p>Couples share one monthly rent. Compared with communities that charge for a second person, that’s about {money(pricing.secondPersonSaving)} a year back in your pocket.</p>
            </div>
            <Link href="/cost-comparison" className="btn btn-light">
              Compare your costs <Icon name="arrow" />
            </Link>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="sec tone-sand" id="plans" aria-labelledby="fp-plans-h">
        <div className="wrap">
          <div className="sec-head-row">
            <div className="sec-head">
              <p className="eyebrow">Floor plans</p>
              <h2 id="fp-plans-h">
                Choose a plan, then <em>step inside</em>
              </h2>
              <p>Every plan has a virtual tour. If the one you love is on the waitlist, we’ll let you know the moment it opens up.</p>
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
              <Image src="/img/apt-kitchen.jpg" alt="A kitchen with stainless appliances, pendant lights and a solid-surface island" fill sizes="(max-width: 900px) 70vw, 30vw" />
            </div>
            <div className="fp-inc-ph fp-inc-ph-b">
              <Image src="/img/apt-bath.jpg" alt="A bright bathroom with a walk-in shower and grab bar" fill sizes="(max-width: 900px) 50vw, 20vw" />
            </div>
          </div>
          <div>
            <p className="eyebrow">Included in every apartment</p>
            <h2>
              One rent, <em>everything</em> taken care of
            </h2>
            <div className="fp-inc-cols">
              <div>
                <h3 className="fp-inc-h">In your home</h3>
                <ul className="fp-ticks">
                  {living.independent.points.slice(1, 7).map((t) => (
                    <li key={t}>
                      <Icon name="check" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="fp-inc-h">In your monthly rent</h3>
                <ul className="fp-ticks">
                  {pricing.included.map((t) => (
                    <li key={t}>
                      <Icon name="check" />
                      {t}
                    </li>
                  ))}
                  <li>
                    <Icon name="paw" />
                    Pets welcome
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
                <b>Care Assessment</b>
                <span>Ten friendly questions to find the right fit, in about three minutes.</span>
              </span>
              <Icon name="arrow" />
            </Link>
            <Link href="/cost-comparison" className="fp-tool">
              <span className="fp-tool-ic">
                <Icon name="chart" />
              </span>
              <span>
                <b>Cost Comparison</b>
                <span>See what staying at home really costs, line by line.</span>
              </span>
              <Icon name="arrow" />
            </Link>
            <Link href="/guides" className="fp-tool">
              <span className="fp-tool-ic">
                <Icon name="doc" />
              </span>
              <span>
                <b>Senior Living Guides</b>
                <span>Nine free guides, from funding sources to VA Aid and Attendance.</span>
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
            <h2>See your favorite plan in person</h2>
            <p className="muted">Cynthia Bazin, our Community Relations Director, will walk you through the apartments that are open now, and lunch is on us.</p>
          </div>
          <div className="btn-row">
            <Link href="/tour" className="btn btn-light btn-lg">
              <Icon name="calendar" /> Schedule a Tour
            </Link>
            <a href={site.phoneHref} className="btn btn-outline-light btn-lg">
              <Icon name="phone" /> Call {site.phone}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
