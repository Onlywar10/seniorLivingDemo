import type { Metadata } from "next";
import Link from "@/i18n/Link";
import { getT } from "@/i18n/server";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { telHref } from "@/data/shared";
import { getCommunity } from "@/lib/community-server";
import { contactCopy } from "@/data/communities/copy/contact";
import { EnquiryForm } from "@/components/info/Forms";
import { Monogram } from "@/components/info/bits";
import "@/components/info/info.css";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  const c = await getCommunity();
  return {
    title: t("Info & Directions"),
    description: t(contactCopy[c.slug].metaDescription),
  };
}

export default async function ContactPage() {
  const { t } = await getT();
  const c = await getCommunity();
  const { site, team, directions, emails, nearby, phones, visiting } = c;
  const copy = contactCopy[c.slug];
  // With published extensions, the directory lists them; otherwise it lists the named directors to ask for.
  const hasExt = team.some((m) => m.ext);
  const directory = hasExt ? team.filter((m) => m.ext) : team.filter((m) => !m.unnamed && m.dept !== "Resident Council");
  return (
    <>
      <PageHero
        crumbs={[["Info & Directions", "/contact"]]}
        eyebrow="Info & Directions"
        title={
          <>
            {t("Find us in ")}
            <em>{site.address.city}</em>
          </>
        }
        lede={copy.lede}
        photo={copy.heroPhoto}
        alt={copy.heroAlt}
      >
        <div className="btn-row">
          <a className="btn" href={site.mapsUrl} target="_blank" rel="noreferrer">
            <Icon name="pin" /> {t("Get directions")}
          </a>
          <a className="btn btn-ghost" href={site.phoneHref}>
            <Icon name="phone" /> {site.phone}
          </a>
        </div>
      </PageHero>

      <section className="sec tone-cream">
        <div className="wrap ct-top">
          <div className="ct-map card">
            <iframe
              src={site.mapsEmbed}
              title={t(`Map showing ${site.name} at ${site.address.street}, ${site.address.city}`)}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <div className="ct-map-foot">
              <div>
                <b>{site.name}</b>
                <address>{site.addressLine}</address>
              </div>
              <a className="link-arrow" href={site.mapsUrl} target="_blank" rel="noreferrer">
                {t("Open in Google Maps")} <Icon name="arrow" />
              </a>
            </div>
          </div>
          <div className="ct-dir">
            <h2>{t("Getting here")}</h2>
            <ul className="ct-nearby">
              {nearby.map((n) => (
                <li key={n}>
                  <Icon name="pin" /> {t(n)}
                </li>
              ))}
            </ul>
            <div className="ct-routes">
              {directions.map((d) => (
                <div key={d.title}>
                  <h3>{t(d.title)}</h3>
                  <p className="small">{t(d.text)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="sec tone-white">
        <div className="wrap ct-reach">
          <div>
            <p className="eyebrow">{t("Call or write")}</p>
            <h2>
              {t("We’re ")}
              <em>{t("easy")}</em>
              {t(" to reach")}
            </h2>
            <ul className="ct-phones">
              {phones.map((p) => (
                <li key={p.label}>
                  <span className="ct-ico">
                    <Icon name="phone" />
                  </span>
                  <div>
                    <span className="ct-label">{t(p.label)}</span>
                    <a className="ct-big" href={telHref(p.number)}>
                      {p.number}
                    </a>
                    <span className="small muted">{t(p.note)}</span>
                  </div>
                </li>
              ))}
            </ul>
            <ul className="ct-emails">
              {emails.map((e) => (
                <li key={e.label}>
                  <span className="ct-ico">
                    <Icon name="mail" />
                  </span>
                  <div>
                    <span className="ct-label">{t(e.label)}</span>
                    <a href={`mailto:${e.address}`}>{e.address}</a>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="ct-hours card card-pad">
            <h3>
              <Icon name="clock" /> {t("Hours")}
            </h3>
            <dl>
              {visiting.map((v) => (
                <div key={v.label}>
                  <dt>{t(v.label)}</dt>
                  <dd>{t(v.value)}</dd>
                </div>
              ))}
            </dl>
            <p className="small muted ct-lic">{t(site.licence)}</p>
          </div>
        </div>
      </section>

      <section className="sec tone-sand" id="enquire">
        <div className="wrap ct-enq">
          <div className="ct-enq-intro">
            <p className="eyebrow">{t("Ask us anything")}</p>
            <h2>
              {t("Send us a ")}
              <em>{t("note")}</em>
            </h2>
            <p className="muted">
              {t("Pricing, availability, care, pets, a question you’d rather not ask on the phone — it all comes straight to our Community Relations team.")}
            </p>
            <div className="ct-alt">
              <Link className="link-arrow" href="/tour">
                {t("Schedule a tour instead")} <Icon name="arrow" />
              </Link>
              <Link className="link-arrow" href="/faq">
                {t("Read the FAQs")} <Icon name="arrow" />
              </Link>
            </div>
          </div>
          <div className="card card-pad">
            <EnquiryForm phone={site.phone} />
          </div>
        </div>
      </section>

      <section className="sec tone-cream">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">{t("Department directory")}</p>
            <h2>
              {t("Reach the ")}
              <em>{t("right")}</em>
              {t(" person")}
            </h2>
            <p>
              {t("Call ")}
              {site.phone}
              {t(hasExt ? " and dial the extension, or ask the front desk to put you through." : " and ask the front desk to put you through.")}
            </p>
          </div>
          <ul className="ct-directory">
            {directory.map((m) => (
              <li key={m.name}>
                <Monogram name={m.name} size={48} />
                <div>
                  <b data-no-translate>{m.name}</b>
                  <span className="small muted">{t(m.role)}</span>
                </div>
                <span className="ct-dept small">{t(m.dept)}</span>
                {m.ext ? (
                  <a className="ct-ext" href={`${site.phoneHref},${m.ext}`} aria-label={t(`Call ${m.name}, extension ${m.ext}`)}>
                    {t("ext. ")}
                    {m.ext}
                  </a>
                ) : (
                  <a className="ct-ext" href={site.phoneHref} aria-label={t(`Call the front desk and ask for ${m.name}`)}>
                    {t("Call")}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
