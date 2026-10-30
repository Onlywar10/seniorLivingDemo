import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/i18n/Link";
import { getT } from "@/i18n/server";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { purpose } from "@/data/tenfold";
import { getCommunity } from "@/lib/community-server";
import { teamCopy } from "@/data/communities/copy/team";
import { CareersApply } from "@/components/info/Forms";
import "@/components/info/info.css";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  const { site } = await getCommunity();
  return {
    title: t("Careers"),
    description: t(`Join the team at ${site.name} in ${site.address.city}. Open positions for Care Partners, Med Techs, cooks, servers and more, with medical, 401(k) match, tuition assistance and a free meal every shift.`),
  };
}

export default async function CareersPage() {
  const { t } = await getT();
  const c = await getCommunity();
  const { site, careers, steward } = c;
  const slug = teamCopy[c.slug].teamStory;
  const story = slug ? c.findStory(slug) : undefined;
  return (
    <>
      <PageHero
        crumbs={[["About", "/about"], ["Careers", "/careers"]]}
        eyebrow="Careers"
        title={
          <>
            {t("Work where you’re ")}
            <em>{t("appreciated")}</em>
          </>
        }
        lede={careers.intro}
        photo="/img/care-outdoors.jpg"
        alt="A Care Partner walking with a resident outdoors"
      >
        <div className="btn-row">
          <a className="btn" href="#openings">
            {t("See open positions")}
          </a>
          <a className="btn btn-ghost" href={`mailto:${site.careersEmail}`}>
            <Icon name="mail" /> {site.careersEmail}
          </a>
        </div>
      </PageHero>

      <section className="sec-tight tone-white">
        <div className="wrap cr-purpose">
          <p className="cr-quote">{t(purpose)}</p>
          <p className="small muted">{t("Our purpose, shared by every Tenfold Senior Living community")}</p>
        </div>
      </section>

      <section className="sec tone-cream">
        <div className="wrap cr-benefits">
          <div>
            <p className="eyebrow">{t("Benefits")}</p>
            <h2>
              {t("Taking care of the people ")}
              <em>{t("who take care")}</em>
            </h2>
            <p className="muted">{t("Full-time team members are eligible for the full benefits package. Ask our recruiter about part-time eligibility.")}</p>
            <div className="cr-ben-photo">
              {/* Bruceville Point publishes a photo of its own dining team; elsewhere a kitchen photo. */}
              {c.slug === "bruceville-point" ? (
                <Image src="/img/bp/server.jpg" alt={t("A smiling server carrying a tray of water glasses in the kitchen")} fill sizes="(max-width: 860px) 100vw, 40vw" style={{ objectPosition: "50% 25%" }} />
              ) : (
                <Image src="/img/chef-kitchen.jpg" alt={t("A chef plating food in the kitchen")} fill sizes="(max-width: 860px) 100vw, 40vw" />
              )}
            </div>
          </div>
          <ul className="cr-ben-list">
            {careers.benefits.map((b) => (
              <li key={b}>
                <Icon name="check" /> {t(b)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="sec tone-sand">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">{t("How hiring works")}</p>
            <h2>
              {t("Four steps, ")}
              <em>{t("no runaround")}</em>
            </h2>
          </div>
          <ol className="cr-steps">
            {careers.steps.map((s, i) => (
              <li key={s.title}>
                <span className="cr-step-n">{i + 1}</span>
                <h3>{t(s.title)}</h3>
                <p className="small">{t(s.text)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="sec tone-cream" id="openings">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">{t("Open positions")}</p>
            <h2>
              {t("Join us in ")}
              <em>{site.address.city}</em>
            </h2>
            <p>
              {t(`All positions are at ${site.name}, `)}
              {site.addressLine}.
            </p>
          </div>
          <CareersApply openings={careers.openings} applyUrl={careers.applyUrl} generalInterestUrl={careers.generalInterestUrl} />
        </div>
      </section>

      <section className="sec tone-white">
        <div className="wrap cr-story">
          {story && (
            <Link href={`/news/${story.slug}`} className="card cr-story-card">
              <div className="cr-story-photo">
                <Image src={story.photo} alt={t(story.alt)} fill sizes="(max-width: 860px) 100vw, 45vw" />
              </div>
              <div className="card-pad">
                <p className="eyebrow">{t("From our news")}</p>
                <h2 className="cr-story-h">{t(story.title)}</h2>
                <p className="muted">{t(story.dek)}</p>
                <span className="link-arrow">
                  {t("Read the story")} <Icon name="arrow" />
                </span>
              </div>
            </Link>
          )}
          {steward ? (
            <div className="cr-steward card card-pad">
              <Icon name="star" />
              <p className="small">
                <b>{t(steward.title)}:</b> <span data-no-translate>{steward.name}</span>, {t(steward.role)}, {t(steward.month)}.
              </p>
              <Link className="link-arrow" href="/team">
                {t("Meet our team")} <Icon name="arrow" />
              </Link>
            </div>
          ) : careers.quotes?.length ? (
            <div className="cr-steward card card-pad">
              <Icon name="heart" />
              <p className="small">
                <b>{t("In our team’s words:")}</b>{" "}
                {careers.quotes.map((q, i) => (
                  <span key={q.name}>
                    {i > 0 && " "}“{t(q.quote)}” <span data-no-translate>— {q.name}</span>
                  </span>
                ))}
              </p>
              <Link className="link-arrow" href="/team">
                {t("Meet our team")} <Icon name="arrow" />
              </Link>
            </div>
          ) : null}
          <div className="cr-contact card card-pad">
            <h3>{t("Questions about working here?")}</h3>
            <p className="small">
              {t("Email ")}
              <a href={`mailto:${site.careersEmail}`}>{site.careersEmail}</a>
              {t(" and our recruiter will get back to you.")}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
