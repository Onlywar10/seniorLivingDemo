import type { Metadata } from "next";
import Image from "next/image";
import { getT } from "@/i18n/server";
import { Icon } from "@/components/Icon";
import { money } from "@/data/shared";
import { comingCommunities } from "@/data/wrenhaven";
import { summaries, intoCommunity, TfCta, TfHero } from "@/components/wrenhaven/parts";
import { InterestForm } from "@/components/wrenhaven/WrenhavenForms";
import { CommunityMap } from "@/components/wrenhaven/CommunityMap";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: t("Our Communities"),
    description: t("Alder Bend in Fairhollow and Kestrel Point in Rivermead, plus Thistle Ridge in Calder and Sorrel Hill, both planned to open in Fall 2027."),
  };
}

export default async function CommunitiesPage() {
  const { t, href, lang } = await getT();
  const all = summaries();
  return (
    <>
      <TfHero
        t={t}
        href={href}
        crumbs={[["Communities", "/communities"]]}
        eyebrow="Our communities"
        title={
          <>
            {t("Two communities today, ")}
            <em>{t("two more in 2027")}</em>
          </>
        }
        lede={t("Wrenhaven designs, builds and runs each of its communities itself, and every one offers Independent Living, Assisted Living Services in every apartment and Lantern Memory Care.")}
        photo="/img/courtyard-aerial.jpg"
        alt="A community courtyard from above"
      >
        <nav className="tf-jump" aria-label={t("Jump to a community")}>
          {all.map((s) => (
            <a key={s.slug} className="btn btn-ghost btn-sm" href={`#${s.slug}`}>
              {s.name}
            </a>
          ))}
          <a className="btn btn-ghost btn-sm" href="#coming">
            {t("Coming 2027")}
          </a>
        </nav>
      </TfHero>

      <section className="sec tone-cream" aria-label={t("Map of Wrenhaven communities in the United States")}>
        <div className="wrap">
          <CommunityMap t={t} href={href} lang={lang} />
        </div>
      </section>

      {all.map((s) => {
        const { site, pricing } = s.c;
        const go = (p: string) => intoCommunity(lang, s.slug, p);
        return (
          <section key={s.slug} id={s.slug} className="tf-comm-detail" aria-labelledby={`${s.slug}-h`}>
            <div className="wrap tf-comm-detail-grid">
              <div>
                <div className="tf-ph">
                  <Image src={s.photo} alt={t(s.alt)} fill sizes="(max-width: 960px) 100vw, 48vw" />
                </div>
                <dl className="tf-facts">
                  <div>
                    <dt>{t("Opened")}</dt>
                    <dd>{t(s.opened)}</dd>
                  </div>
                  <div>
                    <dt>{t("Apartments")}</dt>
                    <dd>{s.apartments.independentAssisted}</dd>
                  </div>
                  <div>
                    <dt>{t("Lantern apartments")}</dt>
                    <dd>{s.apartments.lantern}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <p className="tf-comm-city">
                  <Icon name="pin" /> {s.city}, CA
                  {s.first && <span className="pill pill-butter">{t("Wrenhaven’s first community")}</span>}
                </p>
                <h2 id={`${s.slug}-h`}>{site.name}</h2>
                <p className="muted">{t(site.tagline)}</p>
                <ul className="tf-comm-living">
                  {s.living.map((l) => (
                    <li key={l}>{t(l)}</li>
                  ))}
                </ul>
                <table className="tf-price-table">
                  <caption>{t("Monthly pricing")}</caption>
                  <tbody>
                    {pricing.independent.map((p) => (
                      <tr key={p.name}>
                        <th scope="row">{t(`Independent Living · ${p.name}`)}</th>
                        <td>{t(`from ${money(p.from)}`)}</td>
                      </tr>
                    ))}
                    <tr>
                      <th scope="row">{t("Assisted Living Services base support fee")}</th>
                      <td>{money(pricing.assistedBase)}</td>
                    </tr>
                    {pricing.lantern.map((p) => (
                      <tr key={p.name}>
                        <th scope="row">{t(`Lantern · ${p.name}`)}</th>
                        <td>{t(`from ${money(p.from)}`)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <ul className="tf-contact-list">
                  <li>
                    <Icon name="pin" />
                    <a href={site.mapsUrl} target="_blank" rel="noreferrer">
                      {site.addressLine}
                    </a>
                  </li>
                  <li>
                    <Icon name="phone" />
                    <a href={site.phoneHref}>{site.phone}</a>
                  </li>
                  <li>
                    <Icon name="mail" />
                    <a href={`mailto:${site.email}`}>{site.email}</a>
                  </li>
                  <li>
                    <Icon name="info" />
                    <span>{t(site.licence)}</span>
                  </li>
                </ul>
                <nav className="tf-comm-links" aria-label={t(`Explore ${site.name}`)}>
                  <a href={go("/floor-plans")}>{t("Floor Plans & Pricing")}</a>
                  <a href={go("/calendar")}>{t("Activity Calendar")}</a>
                  <a href={go("/dining")}>{t("Dining & Menus")}</a>
                  <a href={go("/spaces")}>{t("Amazing Spaces")}</a>
                  <a href={go("/team")}>{t("Our Team")}</a>
                </nav>
                <div className="btn-row">
                  <a className="btn" href={go("/tour")}>
                    {t("Schedule a Tour")}
                  </a>
                  <a className="btn btn-ghost" href={go("/")}>
                    {t(`Visit ${site.name}`)} <Icon name="arrow" />
                  </a>
                </div>
              </div>
            </div>
          </section>
        );
      })}

      <section id="coming" className="sec tone-sand" aria-labelledby="coming-h">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">{t("Coming 2027")}</p>
            <h2 id="coming-h">
              {t("Be first to hear about ")}
              <em>{t("our new communities")}</em>
            </h2>
            <p>{t("Both are planned to open in Fall 2027 with Independent Living and Assisted Living Services. Join an interest list for news, floor plans and first tour dates.")}</p>
          </div>
          {comingCommunities.map((c) => (
            <article key={c.key} id={c.key} className="tf-coming-detail" aria-labelledby={`${c.key}-h`}>
              <div>
                <span className="pill pill-terra">{t(`Planned opening ${c.planned}`)}</span>
                <h3 id={`${c.key}-h`}>{c.name}</h3>
                <p className="tf-comm-city">
                  <Icon name="pin" /> {c.city}, {c.state}
                </p>
                <dl className="tf-facts">
                  <div>
                    <dt>{t("Location")}</dt>
                    <dd style={{ fontSize: "1.05rem" }}>{t(c.crossStreets)}</dd>
                  </div>
                  <div>
                    <dt>{t("Apartments")}</dt>
                    <dd>{c.apartments}</dd>
                  </div>
                </dl>
                <ul className="tf-comm-living">
                  {c.living.map((l) => (
                    <li key={l}>{t(l)}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>{t(`Join the ${c.name} interest list`)}</h4>
                <InterestForm community={c.name} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <TfCta t={t} href={href} />
    </>
  );
}
