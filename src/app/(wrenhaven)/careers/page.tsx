import type { Metadata } from "next";
import Image from "next/image";
import { getT } from "@/i18n/server";
import { Icon } from "@/components/Icon";
import { benefits, corporate, values } from "@/data/wrenhaven";
import { summaries, intoCommunity, TfHead, TfHero } from "@/components/wrenhaven/parts";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: t("Careers"),
    description: t("Work at Wrenhaven Senior Living in Fairhollow and Rivermead: a 401K with match, 15 days of paid time off, tuition assistance, a free daily meal and a team where you are seen and appreciated."),
  };
}

export default async function CareersPage() {
  const { t, href, lang } = await getT();
  const all = summaries();
  return (
    <>
      <TfHero
        t={t}
        href={href}
        crumbs={[["Careers", "/careers"]]}
        eyebrow="Careers at Wrenhaven"
        title={
          <>
            {t("Where team members are ")}
            <em>{t("seen and appreciated")}</em>
          </>
        }
        lede={t("Care Partners, chefs, servers, housekeepers, drivers, fitness and activity teams: every role shapes a resident’s day. Join a team that lives its values.")}
        photo="/img/care-laugh.jpg"
        alt="A Care Partner laughing with a resident"
      >
        <div className="btn-row">
          <a className="btn" href="#openings">
            {t("See open roles")}
          </a>
        </div>
      </TfHero>

      <section className="sec tone-cream" aria-labelledby="cr-ben-h">
        <div className="wrap">
          <TfHead
            t={t}
            id="cr-ben-h"
            eyebrow="Benefits"
            title={
              <>
                {t("Benefits for ")}
                <em>{t("every Wrenhaven team member")}</em>
              </>
            }
          />
          <ul className="tf-benefits">
            {benefits.map((b) => (
              <li key={b.title}>
                <Icon name={b.icon} />
                <span>{t(b.title)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="sec tone-white" aria-labelledby="cr-val-h">
        <div className="wrap tf-split">
          <div className="tf-split-ph">
            <div className="tf-ph">
              <Image src="/img/chef-kitchen.jpg" alt={t("A chef at work in the kitchen")} fill sizes="(max-width: 860px) 100vw, 45vw" />
            </div>
          </div>
          <div>
            <TfHead
              t={t}
              id="cr-val-h"
              eyebrow="How we work"
              title={
                <>
                  {t("Values you can ")}
                  <em>{t("feel")}</em>
                </>
              }
              lede="We hire for curiosity and compassion, and we train for everything else."
            />
            <ul className="tf-checks">
              {values.map((v) => (
                <li key={v.key}>
                  <Icon name="check" />
                  <span>
                    <b>{t(v.name)}</b> · {t(v.text)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="openings" className="sec tone-sand" aria-labelledby="cr-open-h">
        <div className="wrap">
          <TfHead
            t={t}
            id="cr-open-h"
            eyebrow="Open roles"
            title={
              <>
                {t("Find your role ")}
                <em>{t("near you")}</em>
              </>
            }
            lede="Each community posts its own openings and accepts applications directly."
          />
          <div className="tf-compare">
            {all.map((s) => (
              <article key={s.slug} className="tf-compare-card" aria-labelledby={`cr-${s.slug}`}>
                <div className="tf-comm-ph">
                  <Image src={s.photo} alt={t(s.alt)} fill sizes="(max-width: 760px) 100vw, 50vw" />
                </div>
                <div className="tf-compare-body">
                  <p className="tf-comm-city">
                    <Icon name="pin" /> {s.city}, CA
                  </p>
                  <h3 id={`cr-${s.slug}`}>{s.name}</h3>
                  <p className="muted" style={{ margin: 0 }}>
                    {t(s.c.careers.openings.length === 1 ? "1 open role" : `${s.c.careers.openings.length} open roles`)}
                  </p>
                  <ul>
                    {s.c.careers.openings.slice(0, 4).map((o) => (
                      <li key={o.title}>
                        <Icon name="check" />
                        <span>
                          {t(o.title)} · {t(o.type)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="btn-row">
                    <a className="btn btn-green btn-sm" href={intoCommunity(lang, s.slug, "/careers")}>
                      {t(`Careers at ${s.name}`)}
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <p className="muted" style={{ marginTop: 28 }}>
            {t("Questions about working at Wrenhaven? Email ")}
            <a href={`mailto:${corporate.careersEmail}`}>{corporate.careersEmail}</a>.
          </p>
        </div>
      </section>
    </>
  );
}
