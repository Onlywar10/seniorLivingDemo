import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Dots } from "@/components/Logo";
import { AlertSignup } from "@/components/plans/AlertSignup";
import { FloorPlan } from "@/components/plans/FloorPlan";
import { VirtualTour } from "@/components/plans/VirtualTour";
import { availability, bathLabel, bedLabel, findPlan, interestFor, tourStops } from "@/components/plans/data";
import { living, money, planKindLabel, plans, pricing, site } from "@/data/site";
import "@/components/plans/plans.css";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const p = findPlan(code);
  if (!p) return { title: "Floor plan not found" };
  return {
    title: `${p.code} ${p.name} · Floor Plan & Virtual Tour`,
    description: `${bedLabel(p)}, ${bathLabel(p).toLowerCase()}${p.sqft ? `, ${p.sqft} sq ft` : ""}. ${p.from ? `From ${money(p.from)} a month.` : "Price on request."} Take the virtual tour.`,
  };
}

const kindHref = { independent: "/living/independent-living", assisted: "/living/assisted-living", harbor: "/living/harbor-memory-care" } as const;

export default async function PlanPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const p = findPlan(code);
  if (!p) notFound();
  const stops = tourStops(p);
  const a = availability(p);
  const others = [...plans.filter((o) => o.code !== p.code && o.kind === p.kind), ...plans.filter((o) => o.kind !== p.kind)].slice(0, 4);
  const tourHref = `/tour?interest=${interestFor[p.kind]}&plan=${p.code}`;

  return (
    <>
      <section className="fpd-head tone-sand">
        <Dots size={240} style={{ right: -90, top: -70, opacity: 0.18 }} />
        <div className="wrap">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>
              <span aria-hidden="true">/ </span>
              <Link href="/floor-plans">Floor Plans & Pricing</Link>
            </span>
            <span>
              <span aria-hidden="true">/ </span>
              <Link href={`/floor-plans/${p.code}`}>{p.code}</Link>
            </span>
          </nav>
          <div className="fpd-title">
            <div>
              <p className="eyebrow">{planKindLabel[p.kind]}</p>
              <h1>
                <span className="fpd-code" data-no-translate>
                  {p.code}
                </span>{" "}
                {p.name}
              </h1>
              <ul className="fp-facts fp-facts-lg">
                <li>{bedLabel(p)}</li>
                <li>{bathLabel(p)}</li>
                {p.sqft && <li>{p.sqft.toLocaleString("en-US")} sq ft</li>}
                {p.balcony && <li>{p.code === "NC6" ? "Wrap-around balcony" : "Private balcony"}</li>}
              </ul>
            </div>
            <div className="fpd-price">
              {p.from ? (
                <>
                  <span>From</span>
                  <strong>{money(p.from)}</strong>
                  <span>a month</span>
                </>
              ) : (
                <strong className="fp-price-req">Price on request</strong>
              )}
              <span className={`fp-badge fp-badge-${a.tone}`}>
                <span className="fp-badge-dot" aria-hidden="true" />
                {a.text}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="sec-tight tone-sand fpd-tour" id="tour" aria-labelledby="vt-h">
        <div className="wrap">
          <h2 id="vt-h" className="vh">
            Virtual tour
          </h2>
          <VirtualTour plan={p} stops={stops} />
        </div>
      </section>

      <section className="sec tone-cream">
        <div className="wrap fpd-grid">
          <div className="fpd-main">
            <h2>
              The <em>{p.code}</em> floor plan
            </h2>
            <div className="fpd-plan">
              <FloorPlan plan={p} />
            </div>
            <p className="small muted">Dimensions are approximate. Layouts vary slightly from apartment to apartment, so Cynthia can show you the exact homes that are open.</p>

            <h3 className="fpd-h3">Features</h3>
            <ul className="fp-ticks fpd-feats">
              {p.features.map((f) => (
                <li key={f}>
                  <Icon name="check" />
                  {f}
                </li>
              ))}
            </ul>

            <h3 className="fpd-h3">Included in your monthly rent</h3>
            <ul className="fp-ticks fpd-feats">
              {pricing.included.map((f) => (
                <li key={f}>
                  <Icon name="check" />
                  {f}
                </li>
              ))}
            </ul>
            {p.kind === "independent" && (
              <p className="fpd-note">
                <Icon name="heart" /> No second-person fee. Couples save about {money(pricing.secondPersonSaving)} a year, and {living.assisted.name} can come to you here if you ever need them, at {money(pricing.assistedBase)} a month base plus personal care by care plan.
              </p>
            )}
            {p.kind === "assisted" && (
              <p className="fpd-note">
                <Icon name="heart" /> Add {living.assisted.name} for a {money(pricing.assistedBase)} monthly base support fee, plus personal care by care plan. Jan McLennon, our Resident Services Director, completes a pre-move-in assessment with you and your family.
              </p>
            )}
            {p.kind === "harbor" && (
              <p className="fpd-note">
                <Icon name="heart" /> Harbor studios start at {money(pricing.harbor[0].from)} a month with a shared bath and {money(pricing.harbor[1].from)} with a private bath. Additional care levels are set by assessment with Janelle Zweber, our Harbor Memory Care Director.
              </p>
            )}
          </div>

          <aside className="fpd-side">
            <div className="fpd-card">
              <p className="eyebrow">Availability</p>
              <p className="fpd-avail">
                <span className={`fp-badge fp-badge-${a.tone}`}>
                  <span className="fp-badge-dot" aria-hidden="true" />
                  {a.text}
                </span>
              </p>
              <p className="small muted">
                {p.available > 0
                  ? `Open now and ready to reserve. Join the alert list and we’ll tell you if another ${p.code} opens up.`
                  : `We’ll let you know the moment an ${p.code} opens up. There’s no obligation.`}
              </p>
              <AlertSignup code={p.code} open />
              <div className="fpd-actions">
                <Link href={tourHref} className="btn">
                  <Icon name="calendar" /> Schedule a Tour
                </Link>
                <a href={site.phoneHref} className="btn btn-ghost">
                  <Icon name="phone" /> Call {site.phone}
                </a>
              </div>
              <p className="small muted fpd-who">
                Ask for <span data-no-translate>Cynthia Bazin</span>, Community Relations Director.
              </p>
            </div>
            <div className="fpd-links">
              <Link href={kindHref[p.kind]} className="link-arrow">
                About {living[p.kind].name} <Icon name="arrow" />
              </Link>
              <Link href="/care-assessment" className="link-arrow">
                Take the Care Assessment <Icon name="arrow" />
              </Link>
              <Link href="/cost-comparison" className="link-arrow">
                Compare costs with staying at home <Icon name="arrow" />
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="sec tone-sand" aria-labelledby="fpd-others">
        <div className="wrap">
          <div className="sec-head-row">
            <div className="sec-head">
              <p className="eyebrow">Keep looking</p>
              <h2 id="fpd-others">Other floor plans</h2>
            </div>
            <Link href="/floor-plans#plans" className="link-arrow">
              All floor plans <Icon name="arrow" />
            </Link>
          </div>
          <ul className="fpd-others">
            {others.map((o) => {
              const oa = availability(o);
              return (
                <li key={o.code}>
                  <Link href={`/floor-plans/${o.code}`} className="fpd-other">
                    <FloorPlan plan={o} compact />
                    <span className="fpd-other-t">
                      <b>
                        <span data-no-translate>{o.code}</span> {o.name}
                      </b>
                      <span>
                        {bedLabel(o)}
                        {o.sqft ? ` · ${o.sqft.toLocaleString("en-US")} sq ft` : ""}
                      </span>
                      <span className="fpd-other-p">{o.from ? `From ${money(o.from)}` : "Price on request"}</span>
                      <span className={`fp-badge fp-badge-${oa.tone}`}>
                        <span className="fp-badge-dot" aria-hidden="true" />
                        {oa.text}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </>
  );
}
