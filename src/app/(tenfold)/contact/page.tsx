import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { Icon } from "@/components/Icon";
import { corporate } from "@/data/tenfold";
import { summaries, intoCommunity, TfHead, TfHero } from "@/components/tenfold/parts";
import { EnquiryForm } from "@/components/tenfold/TenfoldForms";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: t("Contact"),
    description: t("Contact Tenfold Senior Living: our corporate office in Bend, Oregon, and tours and information at Prairie City Landing in Folsom and Bruceville Point in Elk Grove."),
  };
}

export default async function ContactPage() {
  const { t, href, lang } = await getT();
  const all = summaries();
  return (
    <>
      <TfHero
        t={t}
        href={href}
        crumbs={[["Contact", "/contact"]]}
        eyebrow="Contact"
        title={
          <>
            {t("We’d love to ")}
            <em>{t("hear from you")}</em>
          </>
        }
        lede={t("To arrange a tour or ask about an apartment, call the community directly. For anything else, the Tenfold office is here to help.")}
      />

      <section className="sec tone-cream" aria-labelledby="ct-comm-h">
        <div className="wrap">
          <TfHead
            t={t}
            id="ct-comm-h"
            eyebrow="Visit a community"
            title={
              <>
                {t("Tours and ")}
                <em>{t("information")}</em>
              </>
            }
          />
          <div className="tf-compare">
            {all.map((s) => {
              const { site } = s.c;
              return (
                <article key={s.slug} className="tf-compare-card" aria-labelledby={`ct-${s.slug}`}>
                  <div className="tf-compare-body">
                    <p className="tf-comm-city">
                      <Icon name="pin" /> {s.city}, CA
                    </p>
                    <h3 id={`ct-${s.slug}`}>{site.name}</h3>
                    <ul className="tf-contact-list" style={{ margin: 0 }}>
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
                        <Icon name="clock" />
                        <span>{t(site.hoursOffice)}</span>
                      </li>
                    </ul>
                    <div className="btn-row">
                      <a className="btn btn-sm" href={intoCommunity(lang, s.slug, "/tour")}>
                        {t("Schedule a Tour")}
                      </a>
                      <a className="btn btn-ghost btn-sm" href={intoCommunity(lang, s.slug, "/contact")}>
                        {t("Info & Directions")}
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="sec tone-white" aria-labelledby="ct-form-h">
        <div className="wrap tf-contact-grid">
          <div className="tf-office">
            <p className="eyebrow">{t("Corporate office")}</p>
            <h2>{corporate.name}</h2>
            <ul className="tf-contact-list">
              <li>
                <Icon name="pin" />
                <a href={corporate.mapsUrl} target="_blank" rel="noreferrer">
                  {corporate.addressLine}
                </a>
              </li>
              <li>
                <Icon name="phone" />
                <a href={corporate.phoneHref}>{corporate.phone}</a>
              </li>
              <li>
                <Icon name="mail" />
                <a href={`mailto:${corporate.email}`}>{corporate.email}</a>
              </li>
            </ul>
            <p style={{ margin: 0 }}>
              {t("Looking for work? See ")}
              <a href={href("/careers")}>{t("careers at Tenfold")}</a>.
            </p>
          </div>
          <div className="tf-form-card">
            <h2 id="ct-form-h">
              {t("Send us a ")}
              <em>{t("message")}</em>
            </h2>
            <p className="muted">{t("Tell us a little about what you’re looking for and we’ll point you to the right person.")}</p>
            <EnquiryForm communities={all.map((s) => ({ slug: s.slug, name: s.name }))} />
          </div>
        </div>
      </section>
    </>
  );
}
