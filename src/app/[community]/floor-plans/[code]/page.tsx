import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/i18n/Link";
import { getT } from "@/i18n/server";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Dots } from "@/components/Logo";
import { AlertSignup } from "@/components/plans/AlertSignup";
import { FloorPlan } from "@/components/plans/FloorPlan";
import { VirtualTour } from "@/components/plans/VirtualTour";
import { availability, bathLabel, bedLabel, findPlan, interestFor, tourStops, wrapBalcony } from "@/components/plans/data";
import { money, planKindLabel } from "@/data/shared";
import { getCommunity } from "@/lib/community-server";
import { firstName, keyPeople } from "@/data/communities/copy/living";
import { plansCopy, tourPlace } from "@/data/communities/copy/plans";
import "@/components/plans/plans.css";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const p = findPlan((await getCommunity()).plans, code);
  const { t } = await getT();
  if (!p) return { title: t("Floor plan not found") };
  return {
    title: `${p.code} ${t(p.name)} · ${t("Floor Plan & Virtual Tour")}`,
    description: [
      `${t(bedLabel(p))}${bathLabel(p) ? `, ${t(bathLabel(p)!).toLowerCase()}` : ""}${p.sqft ? `, ${t(`${p.sqft} sq ft`)}` : ""}.`,
      p.from ? t(`From ${money(p.from)} a month.`) : t("Price on request."),
      t("Take the virtual tour."),
    ].join(" "),
  };
}

const kindHref = { independent: "/living/independent-living", assisted: "/living/assisted-living", lantern: "/living/lantern-memory-care" } as const;

export default async function PlanPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const c = await getCommunity();
  const { living, plans, pricing, site } = c;
  const p = findPlan(plans, code);
  if (!p) notFound();
  const { t } = await getT();
  const people = keyPeople(c);
  const contact = people.relations && !people.relations.unnamed ? people.relations : null;
  const said = (m: typeof contact) => (m && !m.unnamed ? `${m.name}, our ${m.role}` : null);
  const lanternNote = plansCopy[c.slug].lanternNote(c, said(people.lantern));
  const stops = tourStops(p, tourPlace(c));
  const a = availability(p);
  const others = [...plans.filter((o) => o.code !== p.code && o.kind === p.kind), ...plans.filter((o) => o.kind !== p.kind)].slice(0, 4);
  const tourHref = `/tour?interest=${interestFor[p.kind]}&plan=${p.code}`;

  return (
    <>
      <section className="fpd-head tone-sand">
        <Dots size={240} style={{ right: -90, top: -70, opacity: 0.18 }} />
        <div className="wrap">
          <nav className="crumbs" aria-label={t("Breadcrumb")}>
            <Link href="/">{t("Home")}</Link>
            <span>
              <span aria-hidden="true">/ </span>
              <Link href="/floor-plans">{t("Floor Plans & Pricing")}</Link>
            </span>
            <span>
              <span aria-hidden="true">/ </span>
              <Link href={`/floor-plans/${p.code}`}>{p.code}</Link>
            </span>
          </nav>
          <div className="fpd-title">
            <div>
              <p className="eyebrow">{t(planKindLabel[p.kind])}</p>
              <h1>
                <span className="fpd-code" data-no-translate>
                  {p.code}
                </span>{" "}
                {t(p.name)}
              </h1>
              <ul className="fp-facts fp-facts-lg">
                <li>{t(bedLabel(p))}</li>
                {bathLabel(p) && <li>{t(bathLabel(p)!)}</li>}
                {p.sqft && <li>{p.sqft.toLocaleString("en-US")}{t(" sq ft")}</li>}
                {p.balcony && <li>{t(wrapBalcony(p) ? "Wrap-around balcony" : "Private balcony")}</li>}
              </ul>
            </div>
            <div className="fpd-price">
              {p.from ? (
                <>
                  <span>{t("From")}</span>
                  <strong>{money(p.from)}</strong>
                  <span>{t("a month")}</span>
                </>
              ) : (
                <strong className="fp-price-req">{t("Price on request")}</strong>
              )}
              <span className={`fp-badge fp-badge-${a.tone}`}>
                <span className="fp-badge-dot" aria-hidden="true" />
                {t(a.text)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="sec-tight tone-sand fpd-tour" id="tour" aria-labelledby="vt-h">
        <div className="wrap">
          <h2 id="vt-h" className="vh">
            {t("Virtual tour")}
          </h2>
          <VirtualTour plan={p} stops={stops} />
        </div>
      </section>

      <section className="sec tone-cream">
        <div className="wrap fpd-grid">
          <div className="fpd-main">
            <h2>
              {t("The ")}<em>{p.code}</em>{t(" floor plan")}
            </h2>
            {p.render && (
              <figure className="fpd-render">
                <Image src={p.render} alt={`${p.code} · ${t("Furnished 3D floor plan")}`} width={1100} height={900} sizes="(max-width: 860px) 100vw, 60vw" />
                <figcaption className="small muted">{t("Furnished 3D floor plan")}</figcaption>
              </figure>
            )}
            <div className="fpd-plan">
              <FloorPlan plan={p} t={t} />
            </div>
            <p className="small muted">{t(`Dimensions are approximate. Layouts vary slightly from apartment to apartment, so ${firstName(contact) ?? "our team"} can show you the exact homes that are open.`)}</p>

            <h3 className="fpd-h3">{t("Features")}</h3>
            <ul className="fp-ticks fpd-feats">
              {p.features.map((f) => (
                <li key={f}>
                  <Icon name="check" />
                  {t(f)}
                </li>
              ))}
            </ul>

            <h3 className="fpd-h3">{t("Included in your monthly rent")}</h3>
            <ul className="fp-ticks fpd-feats">
              {pricing.included.map((f) => (
                <li key={f}>
                  <Icon name="check" />
                  {t(f)}
                </li>
              ))}
            </ul>
            {p.kind === "independent" && (
              <p className="fpd-note">
                <Icon name="heart" />{t(" No second-person fee. Couples save about ")}{money(pricing.secondPersonSaving)}{t(" a year, and ")}{t(living.assisted.name)}{t(" can come to you here if you ever need them, at ")}{money(pricing.assistedBase)}{t(" a month base plus personal care by care plan.")}
              </p>
            )}
            {p.kind === "assisted" && (
              <p className="fpd-note">
                <Icon name="heart" />{t(" Add ")}{t(living.assisted.name)}{t(" for a ")}{money(pricing.assistedBase)}{t(said(people.residentServices) ? ` monthly base support fee, plus personal care by care plan. ${said(people.residentServices)}, completes a pre-move-in assessment with you and your family.` : " monthly base support fee, plus personal care by care plan. Our Resident Services Director completes a pre-move-in assessment with you and your family.")}
              </p>
            )}
            {p.kind === "lantern" && (
              <p className="fpd-note">
                <Icon name="heart" />
                {lanternNote.map((f, i) => (typeof f === "string" ? <span key={i}>{t(f)}</span> : <span key={i}>{f.raw}</span>))}
              </p>
            )}
          </div>

          <aside className="fpd-side">
            <div className="fpd-card">
              <p className="eyebrow">{t("Availability")}</p>
              <p className="fpd-avail">
                <span className={`fp-badge fp-badge-${a.tone}`}>
                  <span className="fp-badge-dot" aria-hidden="true" />
                  {t(a.text)}
                </span>
              </p>
              <p className="small muted">
                {p.available > 0
                  ? t(`Open now and ready to reserve. Join the alert list and we’ll tell you if another ${p.code} opens up.`)
                  : t(`We’ll let you know the moment an ${p.code} opens up. There’s no obligation.`)}
              </p>
              <AlertSignup code={p.code} open />
              <div className="fpd-actions">
                <Link href={tourHref} className="btn">
                  <Icon name="calendar" /> {t("Schedule a Tour")}
                </Link>
                <a href={site.phoneHref} className="btn btn-ghost">
                  <Icon name="phone" /> {t("Call ")}{site.phone}
                </a>
              </div>
              {contact && (
                <p className="small muted fpd-who">
                  {t("Ask for ")}<span data-no-translate>{contact.name}</span>{t(`, ${contact.role}.`)}
                </p>
              )}
            </div>
            <div className="fpd-links">
              <Link href={kindHref[p.kind]} className="link-arrow">
                {t(`About ${living[p.kind].name} `)}<Icon name="arrow" />
              </Link>
              <Link href="/care-assessment" className="link-arrow">
                {t("Take the Care Assessment ")}<Icon name="arrow" />
              </Link>
              <Link href="/cost-comparison" className="link-arrow">
                {t("Compare costs with staying at home ")}<Icon name="arrow" />
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="sec tone-sand" aria-labelledby="fpd-others">
        <div className="wrap">
          <div className="sec-head-row">
            <div className="sec-head">
              <p className="eyebrow">{t("Keep looking")}</p>
              <h2 id="fpd-others">{t("Other floor plans")}</h2>
            </div>
            <Link href="/floor-plans#plans" className="link-arrow">
              {t("All floor plans ")}<Icon name="arrow" />
            </Link>
          </div>
          <ul className="fpd-others">
            {others.map((o) => {
              const oa = availability(o);
              return (
                <li key={o.code}>
                  <Link href={`/floor-plans/${o.code}`} className="fpd-other">
                    <FloorPlan plan={o} compact t={t} />
                    <span className="fpd-other-t">
                      <b>
                        <span data-no-translate>{o.code}</span> {t(o.name)}
                      </b>
                      <span>
                        {t(bedLabel(o))}
                        {o.sqft ? t(` · ${o.sqft.toLocaleString("en-US")} sq ft`) : ""}
                      </span>
                      <span className="fpd-other-p">{t(o.from ? `From ${money(o.from)}` : "Price on request")}</span>
                      <span className={`fp-badge fp-badge-${oa.tone}`}>
                        <span className="fp-badge-dot" aria-hidden="true" />
                        {t(oa.text)}
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
