import type { Metadata } from "next";
import Image from "next/image";
import { getT } from "@/i18n/server";
import { Icon } from "@/components/Icon";
import { corporate } from "@/data/wrenhaven";
import { summaries, intoCommunity, TfCta, TfHead, TfHero } from "@/components/wrenhaven/parts";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: t("All Are Welcome"),
    description: t("Wrenhaven Senior Living works to create compassionate communities that value diversity, promote equity and foster inclusion. ASL interpreters are available in every community."),
  };
}

const points = [
  { icon: "heart", title: "Diversity, broadly understood", text: "Race, ethnicity, age, ability, gender identity and expression, sexual orientation, socioeconomic status and life experience all belong here." },
  { icon: "users", title: "Equity", text: "We work to remove barriers, so every resident gets the support they need to thrive." },
  { icon: "sms", title: "ASL interpreters", text: "For residents and visitors who are deaf or hard of hearing, we arrange live or online American Sign Language interpreters when appropriate." },
  { icon: "access", title: "Accommodations", text: "We make reasonable accommodations for people with disabilities, including hearing impairment. Just ask the front desk team." },
] as const;

export default async function AllAreWelcome() {
  const { t, href, lang } = await getT();
  const all = summaries();
  return (
    <>
      <TfHero
        t={t}
        href={href}
        crumbs={[
          ["About Wrenhaven", "/about"],
          ["All Are Welcome", "/all-are-welcome"],
        ]}
        eyebrow="All are welcome"
        title={
          <>
            {t("A home for ")}
            <em>{t("everyone.")}</em>
          </>
        }
        lede={t("Wrenhaven works to create compassionate communities that value diversity, promote equity and foster inclusion, among residents, families and team members.")}
        photo="/img/couple-flowers.jpg"
        alt="A couple tending flowers together in the garden"
      />

      <section className="sec tone-cream" aria-labelledby="aw-commit-h">
        <div className="wrap">
          <TfHead
            t={t}
            id="aw-commit-h"
            eyebrow="Our commitment"
            title={
              <>
                {t("Included, respected and ")}
                <em>{t("safe.")}</em>
              </>
            }
          />
          <ul className="tf-features">
            {points.map((p) => (
              <li key={p.title}>
                <span className="tf-feature-ico">
                  <Icon name={p.icon} />
                </span>
                <div>
                  <h3>{t(p.title)}</h3>
                  <p>{t(p.text)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="sec tone-white" aria-labelledby="aw-asl-h">
        <div className="wrap tf-split">
          <div>
            <TfHead
              t={t}
              id="aw-asl-h"
              eyebrow="ASL interpreters"
              title={
                <>
                  {t("Every conversation, ")}
                  <em>{t("in your language.")}</em>
                </>
              }
              lede="American Sign Language interpreters are available for tours and community events. Let the community know when you book and they’ll arrange it."
            />
            <div className="btn-row">
              {all.map((s) => (
                <a key={s.slug} className="btn btn-ghost btn-sm" href={intoCommunity(lang, s.slug, "/all-are-welcome")}>
                  {t(`All are welcome at ${s.name}`)}
                </a>
              ))}
            </div>
            <p className="muted" style={{ marginTop: 22 }}>
              {t("Every Wrenhaven team member completes LGBTQ+ inclusive care training each year.")}
            </p>
          </div>
          <div className="tf-split-ph">
            <div className="tf-ph">
              <Image src="/img/couple-hands.jpg" alt={t("Two people holding hands across a café table")} fill sizes="(max-width: 860px) 100vw, 45vw" />
            </div>
          </div>
        </div>
      </section>

      <section className="sec-tight tone-sand" aria-labelledby="aw-acc-h">
        <div className="wrap-narrow">
          <p className="eyebrow">{t("Accessibility")}</p>
          <h2 id="aw-acc-h">{t("Easy to see, hear, reach and read.")}</h2>
          <p className="muted" style={{ marginTop: 14 }}>
            {t("Our buildings, website and printed calendars are designed for everyone. Use the text size and contrast controls at the top of every page, or the language links to read this site in Spanish or Simplified Chinese (中文).")}
          </p>
          <p className="muted">
            {t("If anything on this website is hard to use, email")}{" "}
            <a href={`mailto:${corporate.email}`} data-no-translate>
              {corporate.email}
            </a>
            .
          </p>
          <a className="link-arrow" href={href("/accessibility")}>
            {t("Read our accessibility statement")} <Icon name="arrow" />
          </a>
        </div>
      </section>

      <TfCta t={t} href={href} photo="/img/friends-walking.jpg" />
    </>
  );
}
