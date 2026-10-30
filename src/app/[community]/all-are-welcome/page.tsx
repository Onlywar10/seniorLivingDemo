import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/i18n/Link";
import { getT } from "@/i18n/server";
import "@/components/brand/brand.css";
import { getCommunity } from "@/lib/community-server";
import { aboutCopy } from "@/data/communities/copy/about";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { TourBand } from "@/components/brand/TourBand";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  const c = await getCommunity();
  return {
    title: t("All Are Welcome"),
    description: t(aboutCopy[c.slug].welcomeMetaDescription),
  };
}

const icons = ["heart", "users", "sms", "access"] as const;

export default async function AllAreWelcome() {
  const { t } = await getT();
  const c = await getCommunity();
  const { site, welcome } = c;
  // SageCare is shown only where the community holds the certification.
  const sageCare = c.awards.some((a) => a.source === "SAGE" || /SageCare/i.test(a.title));
  return (
    <>
      <PageHero
        eyebrow="All are welcome"
        title={
          <>
            {t("A home for ")}
            <em>{t("everyone.")}</em>
          </>
        }
        lede={welcome.intro}
        photo="/img/couple-flowers.jpg"
        alt="A couple tending flowers together in the garden"
        crumbs={[
          ["About", "/about"],
          ["All Are Welcome", "/all-are-welcome"],
        ]}
      />

      <section className="sec tone-cream" aria-labelledby="br-commit-h">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">{t("Our commitment")}</p>
            <h2 id="br-commit-h">
              {t("Included, respected and ")}
              <em>{t("safe.")}</em>
            </h2>
          </div>
          <div className="grid-2">
            {welcome.points.map((p, i) => (
              <div key={p.title} className="br-feature">
                <Icon name={icons[i % icons.length]} />
                <h3>{t(p.title)}</h3>
                <p>{t(p.text)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {sageCare && (
      <section className="sec tone-green on-dark" aria-labelledby="br-sage-h">
        <div className="wrap br-split">
          <div>
            <p className="eyebrow">SageCare</p>
            <h2 id="br-sage-h">{t("Every team member, trained every year.")}</h2>
            <p style={{ color: "#d8e2d6", marginTop: 16 }}>
              {t(
                "SageCare is the LGBTQ+ cultural competency training from SAGE, the country’s largest organization dedicated to LGBTQ+ older adults. Many LGBTQ+ elders have spent decades hiding who they are from doctors, landlords and neighbours. We don’t want anyone to feel that way at home.",
              )}
            </p>
            <ul className="br-checks" style={{ marginTop: 20 }}>
              <li>
                <Icon name="check" /> <span>{t("Annual training for every team member, from Care Partners to the kitchen")}</span>
              </li>
              <li>
                <Icon name="check" /> <span>{t("Inclusive intake forms, with space for chosen names and pronouns")}</span>
              </li>
              <li>
                <Icon name="check" /> <span>{t("Partners and spouses welcomed as family in every care conversation")}</span>
              </li>
            </ul>
          </div>
          <div className="br-split-ph">
            <Image src="/img/couple-hands.jpg" alt={t("Two people holding hands across a café table")} fill sizes="(max-width: 860px) 100vw, 50vw" />
          </div>
        </div>
      </section>
      )}

      <section className="sec tone-white" aria-labelledby="br-asl-h">
        <div className="wrap grid-2" style={{ alignItems: "start" }}>
          <div>
            <p className="eyebrow">{t("ASL interpreters")}</p>
            <h2 id="br-asl-h">
              {t("Every conversation, ")}
              <em>{t("in your language.")}</em>
            </h2>
            <p className="muted" style={{ marginTop: 14 }}>
              {t(aboutCopy[c.slug].aslText)}
              {site.phone}
              {t(" and we’ll arrange it.")}
            </p>
            <div className="btn-row">
              <Link className="btn btn-green" href="/tour">
                {t("Book a tour with an interpreter")}
              </Link>
            </div>
          </div>
          <div>
            <p className="eyebrow">{t("Accessibility")}</p>
            <h2>{t("Easy to see, hear, reach and read.")}</h2>
            <p className="muted" style={{ marginTop: 14 }}>
              {t(
                "Our buildings, website and printed calendars are designed for everyone. Use the text size and contrast controls at the top of every page, or the language links to read this site in Spanish or Simplified Chinese (中文).",
              )}
            </p>
            <p className="muted">
              {t("If anything on this website is hard to use, email")}{" "}
              <a href={`mailto:${site.accessibilityEmail}`} data-no-translate>
                {site.accessibilityEmail}
              </a>
              .
            </p>
            <Link className="link-arrow" href="/accessibility">
              {t("Read our accessibility statement")} <Icon name="arrow" />
            </Link>
          </div>
        </div>
      </section>

      <TourBand photo="/img/friends-walking.jpg" />
    </>
  );
}
