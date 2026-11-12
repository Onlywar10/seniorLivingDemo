import type { Metadata } from "next";
import Image from "next/image";
import type { ReactNode } from "react";
import { getT } from "@/i18n/server";
import { Icon } from "@/components/Icon";
import { communities } from "@/data/communities";
import { money } from "@/data/shared";
import { apartmentFeatures } from "@/data/wrenhaven";
import { intoCommunity, summaries } from "@/components/wrenhaven/parts";
import { FitChooser, type FitCommunity } from "./FitChooser";
import "./home-c.css";

// An alternative Wrenhaven homepage for families doing the research: the decision first. A fit chooser,
// a side-by-side comparison, care levels, costs and what's included, FAQs, then next steps.
// Reached only by its address; nothing links here.

export const metadata: Metadata = {
  title: { absolute: "Wrenhaven Senior Living · Compare Communities, Care and Costs" },
  description: "Compare Alder Bend in Fairhollow and Kestrel Point in Rivermead side by side: prices, apartments, Assisted Living Services, Lantern Memory Care and what the monthly rent includes.",
  robots: { index: false, follow: false },
};

const restaurantKinds = ["Restaurant", "All-day café", "Coffeehouse & wine bar"];

export default async function HomeCompare() {
  const { t, href, lang } = await getT();
  const all = summaries().map((s) => {
    const c = s.c;
    const ilPlans = c.plans.filter((p) => p.kind === "independent");
    const sizes = ilPlans.flatMap((p) => (p.sqft ? [p.sqft] : []));
    return {
      ...s,
      ed: c.team.find((m) => m.role === "Executive Director"),
      crd: c.team.find((m) => m.role === "Community Relations Director"),
      restaurants: c.spaces.filter((x) => restaurantKinds.includes(x.kind)).map((x) => x.name),
      ilRange: `${money(c.pricing.independentRange[0])}–${money(c.pricing.independentRange[1])}`,
      sizes: sizes.length ? `${Math.min(...sizes).toLocaleString("en-US")}–${Math.max(...sizes).toLocaleString("en-US")} sq ft` : "",
      ilPlanCount: ilPlans.length,
      couplesSave: money(c.pricing.secondPersonSaving),
    };
  });

  const fit: FitCommunity[] = all.map((s) => ({
    slug: s.slug,
    name: s.name,
    city: s.city,
    from: { independent: s.c.living.independent.from, assisted: s.c.living.assisted.from, lantern: s.c.living.lantern.from },
    couplesSave: s.couplesSave,
    links: { plans: intoCommunity(lang, s.slug, "/floor-plans"), assessment: intoCommunity(lang, s.slug, "/care-assessment"), tour: intoCommunity(lang, s.slug, "/tour") },
    phone: s.c.site.phone,
    phoneHref: s.c.site.phoneHref,
    contact: s.crd?.name ?? "Community Relations",
  }));

  const rows: [string, (s: (typeof all)[number]) => ReactNode][] = [
    ["Location", (s) => `${s.city}, CA`],
    ["Opened", (s) => t(s.opened)],
    ["Getting there", (s) => t(s.c.site.location[3])],
    ["Independent & Assisted Living apartments", (s) => s.apartments.independentAssisted],
    ["Apartment sizes", (s) => t(`${s.sizes} · ${s.ilPlanCount} floor plans`)],
    ["Independent Living rent", (s) => t(`${s.ilRange} a month`)],
    ["Assisted Living Services", (s) => t(`${s.from.assisted} a month base fee, plus personal care by care plan`)],
    ["Lantern Memory Care", (s) => t(`${s.apartments.lantern} apartments · from ${s.from.lantern} a month`)],
    ["Second-person fee", (s) => t(`None: couples save about ${s.couplesSave} a year`)],
    ["Restaurants on site", (s) => s.restaurants.join(", ")],
    ["Pets", () => t("Cats and dogs welcome")],
    ["Executive Director", (s) => s.ed?.name ?? ""],
    ["State license", (s) => t(s.c.site.licence)],
  ];

  const [ab, kp] = all;
  const faqs = communities["alder-bend"].faqs.map((f, i) => ({ q: f.q, answers: all.map((s) => ({ name: s.name, a: s.c.faqs.find((x) => x.q === f.q)?.a ?? s.c.faqs[i]?.a ?? "" })) }));

  const jump = [
    ["#hc-fit-h", "Find the right fit"],
    ["#hc-compare-h", "Compare communities"],
    ["#hc-care-h", "Care levels"],
    ["#hc-cost-h", "Costs & what’s included"],
    ["#hc-faq-h", "FAQs"],
  ];

  return (
    <div className="hc">
      {/* ---------- Hero ---------- */}
      <section className="hc-hero" aria-labelledby="hc-hero-h">
        <div className="hc-wrap hc-hero-grid">
          <div>
            <p className="eyebrow">{t("For families")}</p>
            <h1 id="hc-hero-h">
              {t("Helping a parent choose? ")}
              <em>{t("Start with the facts.")}</em>
            </h1>
            <p className="hc-lede">
              {t("Prices, apartments, care and the answers families ask for most, for both Wrenhaven communities on one page. No forms to fill in first.")}
            </p>
            <nav className="hc-jump" aria-label={t("On this page")}>
              {jump.map(([to, label]) => (
                <a key={to} href={to}>
                  {t(label)}
                </a>
              ))}
            </nav>
          </div>
          <div className="hc-hero-side">
            <div className="hc-hero-ph">
              <Image src="/img/mother-daughter.jpg" alt={t("A mother and her grown daughter laughing together in a garden")} fill priority sizes="(max-width: 900px) 100vw, 40vw" />
            </div>
            <ul className="hc-quick" aria-label={t("Quick answers")}>
              <li>
                <b>{t("No second-person fee")}</b>
                <span>{t(`Couples save about ${ab.couplesSave} a year at ${ab.name} and ${kp.couplesSave} at ${kp.name}.`)}</span>
              </li>
              <li>
                <b>{t("No move if needs change")}</b>
                <span>{t(`Assisted Living Services come to any apartment, with a base fee of ${ab.from.assisted} a month at ${ab.name} or ${kp.from.assisted} at ${kp.name}.`)}</span>
              </li>
              <li>
                <b>{t("Pets welcome")}</b>
                <span>{t("Cats and dogs are part of both communities.")}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- Fit chooser ---------- */}
      <section className="hc-sec" aria-labelledby="hc-fit-h">
        <div className="hc-wrap">
          <div className="hc-head">
            <p className="eyebrow">{t("Three questions")}</p>
            <h2 id="hc-fit-h">{t("Find the right fit")}</h2>
            <p>{t("Not sure where to begin? Tell us a little and we’ll point you to the right living option and community.")}</p>
          </div>
          <FitChooser communities={fit} />
        </div>
      </section>

      {/* ---------- Compare ---------- */}
      <section className="hc-sec hc-tone" aria-labelledby="hc-compare-h">
        <div className="hc-wrap">
          <div className="hc-head">
            <p className="eyebrow">{t("Side by side")}</p>
            <h2 id="hc-compare-h">{t("Compare the communities")}</h2>
            <p>{t("Both offer Independent Living, Assisted Living Services and Lantern Memory Care. Here is how they differ.")}</p>
          </div>
          <table className="hc-table">
            <caption className="vh">{t("Alder Bend and Kestrel Point compared")}</caption>
            <thead>
              <tr>
                <td />
                {all.map((s) => (
                  <th key={s.slug} scope="col">
                    <span className="hc-th-ph">
                      <Image src={s.slug === "alder-bend" ? "/img/perch.jpg" : "/img/kp/bistro.jpg"} alt="" fill sizes="(max-width: 700px) 100vw, 30vw" />
                    </span>
                    <a href={intoCommunity(lang, s.slug)}>{s.name}</a>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, cell]) => (
                <tr key={label}>
                  <th scope="row">{t(label)}</th>
                  {all.map((s) => (
                    <td key={s.slug} data-label={s.name}>
                      {cell(s)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="hc-table-cta">
                <th scope="row">{t("Talk to")}</th>
                {all.map((s) => (
                  <td key={s.slug} data-label={s.name}>
                    <span className="hc-talk">
                      {s.crd && <span className="hc-who">{t(`${s.crd.name}, Community Relations Director`)}</span>}
                      <a href={s.c.site.phoneHref}>
                        <Icon name="phone" /> {s.c.site.phone}
                      </a>
                    </span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------- Care levels ---------- */}
      <section className="hc-sec" aria-labelledby="hc-care-h">
        <div className="hc-wrap">
          <div className="hc-head">
            <p className="eyebrow">{t("Care levels")}</p>
            <h2 id="hc-care-h">{t("Three levels of support, one home")}</h2>
            <p>{t("Start in Independent Living. If more help is needed later, it comes to the apartment, and Lantern is there for memory care.")}</p>
          </div>
          <ol className="hc-ladder">
            <li>
              <span className="hc-ladder-no">1</span>
              <h3>{t("Independent Living")}</h3>
              <p className="hc-for">{t("For: managing well, ready for less upkeep and more company.")}</p>
              <ul className="hc-ticks">
                {apartmentFeatures.slice(0, 4).map((f) => (
                  <li key={f.key}>
                    <Icon name="check" /> {t(f.title)}
                  </li>
                ))}
              </ul>
              <dl className="hc-from">
                {all.map((s) => (
                  <div key={s.slug}>
                    <dt>{s.name}</dt>
                    <dd>{t(`from ${s.from.independent}/mo`)}</dd>
                  </div>
                ))}
              </dl>
              <a className="link-arrow" href={href("/living/independent-living")}>
                {t("About Independent Living")} <Icon name="arrow" />
              </a>
            </li>
            <li>
              <span className="hc-ladder-no">2</span>
              <h3>{t("Assisted Living Services")}</h3>
              <p className="hc-for">{t("For: help with medication, personal care or getting to meals and appointments.")}</p>
              <ul className="hc-ticks">
                {["Delivered in any apartment, so no move", "Medication management and personal care", "Escorts to meals, activities and appointments", "Coordination with your healthcare providers"].map((x) => (
                  <li key={x}>
                    <Icon name="check" /> {t(x)}
                  </li>
                ))}
              </ul>
              <dl className="hc-from">
                {all.map((s) => (
                  <div key={s.slug}>
                    <dt>{s.name}</dt>
                    <dd>{t(`${s.from.assisted}/mo base fee + care plan`)}</dd>
                  </div>
                ))}
              </dl>
              <a className="link-arrow" href={href("/living/assisted-living")}>
                {t("About Assisted Living Services")} <Icon name="arrow" />
              </a>
            </li>
            <li>
              <span className="hc-ladder-no">3</span>
              <h3>{t("Lantern Memory Care")}</h3>
              <p className="hc-for">{t("For: memory loss that calls for a secure, calm setting.")}</p>
              <ul className="hc-ticks">
                {["A secure neighborhood with its own courtyard", "Its own activity team and Events & Adventures calendar", "Outings beyond the community", "Welcome at every community event"].map((x) => (
                  <li key={x}>
                    <Icon name="check" /> {t(x)}
                  </li>
                ))}
              </ul>
              <dl className="hc-from">
                {all.map((s) => (
                  <div key={s.slug}>
                    <dt>{s.name}</dt>
                    <dd>{t(`from ${s.from.lantern}/mo`)}</dd>
                  </div>
                ))}
              </dl>
              <a className="link-arrow" href={href("/living/lantern-memory-care")}>
                {t("About Lantern Memory Care")} <Icon name="arrow" />
              </a>
            </li>
          </ol>
        </div>
      </section>

      {/* ---------- Costs and what's included ---------- */}
      <section className="hc-sec hc-tone" aria-labelledby="hc-cost-h">
        <div className="hc-wrap">
          <div className="hc-head">
            <p className="eyebrow">{t("Costs")}</p>
            <h2 id="hc-cost-h">{t("What it costs, and what that covers")}</h2>
            <p>{t("Starting monthly rents by apartment type. Each community’s floor plans page has every plan, size and price.")}</p>
          </div>
          <div className="hc-costs">
            {all.map((s) => (
              <article key={s.slug} className="hc-cost" aria-labelledby={`hc-cost-${s.slug}`}>
                <h3 id={`hc-cost-${s.slug}`}>{s.name}</h3>
                <table className="hc-price">
                  <caption className="vh">{t(`Starting monthly rents at ${s.name}`)}</caption>
                  <tbody>
                    {s.c.pricing.independent.map((p) => (
                      <tr key={`il-${p.name}`}>
                        <th scope="row">
                          {t(p.name)} <span className="hc-kind">{t("Independent Living")}</span>
                        </th>
                        <td>{t(`from ${money(p.from)}`)}</td>
                      </tr>
                    ))}
                    {s.c.pricing.lantern.map((p) => (
                      <tr key={`l-${p.name}`}>
                        <th scope="row">
                          {t(p.name)} <span className="hc-kind">{t("Lantern Memory Care")}</span>
                        </th>
                        <td>{t(`from ${money(p.from)}`)}</td>
                      </tr>
                    ))}
                    <tr>
                      <th scope="row">
                        {t("Assisted Living Services")} <span className="hc-kind">{t("Base fee, plus personal care by care plan")}</span>
                      </th>
                      <td>{money(s.c.pricing.assistedBase)}</td>
                    </tr>
                  </tbody>
                </table>
                <h4>{t("Included in the monthly rent")}</h4>
                <ul className="hc-ticks">
                  {s.c.pricing.included.map((x) => (
                    <li key={x}>
                      <Icon name="check" /> {t(x)}
                    </li>
                  ))}
                </ul>
                <div className="btn-row">
                  <a className="btn btn-sm" href={intoCommunity(lang, s.slug, "/floor-plans")}>
                    {t("Floor plans & pricing")}
                  </a>
                  <a className="btn btn-sm btn-ghost" href={intoCommunity(lang, s.slug, "/cost-comparison")}>
                    {t("Compare with living at home")}
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- FAQs ---------- */}
      <section className="hc-sec" aria-labelledby="hc-faq-h">
        <div className="hc-wrap hc-faq-grid">
          <div className="hc-head">
            <p className="eyebrow">{t("FAQs")}</p>
            <h2 id="hc-faq-h">{t("What families ask us most")}</h2>
            <p>{t("Answered for each community, so you can see where they differ.")}</p>
            <div className="hc-faq-ph">
              <Image src="/img/care-outdoors.jpg" alt="" fill sizes="(max-width: 900px) 100vw, 30vw" />
            </div>
          </div>
          <div className="hc-faqs">
            {faqs.map((f) => (
              <details key={f.q}>
                <summary>
                  {t(f.q)} <Icon name="plus" />
                </summary>
                <dl>
                  {f.answers.map((x) => (
                    <div key={x.name}>
                      <dt>{x.name}</dt>
                      <dd>{t(x.a)}</dd>
                    </div>
                  ))}
                </dl>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Next steps ---------- */}
      <section className="hc-sec hc-steps-sec" aria-labelledby="hc-steps-h">
        <div className="hc-wrap">
          <div className="hc-head">
            <p className="eyebrow light">{t("Next steps")}</p>
            <h2 id="hc-steps-h">{t("When you’re ready, here is how it goes")}</h2>
          </div>
          <ol className="hc-steps">
            <li>
              <h3>{t("Have a conversation")}</h3>
              <p>{t("Call the Community Relations Director. They’ll talk through apartments, prices and timing, on your timeline.")}</p>
              <ul>
                {all.map((s) => (
                  <li key={s.slug}>
                    <a href={s.c.site.phoneHref}>
                      <Icon name="phone" /> {s.name} · {s.c.site.phone}
                    </a>
                  </li>
                ))}
              </ul>
            </li>
            <li>
              <h3>{t("Visit in person")}</h3>
              <p>{t("Every tour is personal, at a time that suits you. Bring your parent, or come on your own first.")}</p>
              <ul>
                {all.map((s) => (
                  <li key={s.slug}>
                    <a href={intoCommunity(lang, s.slug, "/tour")}>{t(`Book a tour at ${s.name}`)}</a>
                  </li>
                ))}
              </ul>
            </li>
            <li>
              <h3>{t("Plan the care")}</h3>
              <p>{t("If some help is needed, a personal assessment before move-in shapes the care plan, and the Resident Services Director adjusts it as needs change.")}</p>
              <ul>
                {all.map((s) => (
                  <li key={s.slug}>
                    <a href={intoCommunity(lang, s.slug, "/care-assessment")}>{t(`Care assessment for ${s.name}`)}</a>
                  </li>
                ))}
              </ul>
            </li>
          </ol>
          <p className="hc-guides">
            <Icon name="doc" /> {t("Still weighing it up? Read our free guides, from “Is Senior Living the Right Choice?” to “Understanding the Cost of Senior Living”.")}{" "}
            <a href={intoCommunity(lang, "alder-bend", "/guides")}>{t("Senior Living Guides")}</a>
          </p>
        </div>
      </section>
    </div>
  );
}
