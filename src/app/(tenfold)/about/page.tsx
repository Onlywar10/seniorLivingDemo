import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { Icon } from "@/components/Icon";
import { comingCommunities, leadership, nameOrigin, purpose, values } from "@/data/tenfold";
import { summaries, TfCta, TfHead, TfHero } from "@/components/tenfold/parts";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: t("About Tenfold"),
    description: t("Tenfold Senior Living’s purpose, six values, the poem behind our name and the founders who have been developing senior living since 1992."),
  };
}

export default async function AboutPage() {
  const { t, href } = await getT();
  const all = summaries();
  return (
    <>
      <TfHero
        t={t}
        href={href}
        crumbs={[["About Tenfold", "/about"]]}
        eyebrow="About Tenfold"
        title={
          <>
            {t("Communities where you ")}
            <em>{t("choose how you live")}</em>
          </>
        }
        lede={t(purpose)}
        photo="/img/mother-daughter.jpg"
        alt="A mother and daughter sharing a moment together"
      />

      <section className="sec tone-cream" aria-labelledby="ab-val-h">
        <div className="wrap">
          <TfHead
            t={t}
            id="ab-val-h"
            eyebrow="Our values"
            title={
              <>
                {t("Six values, ")}
                <em>{t("every day")}</em>
              </>
            }
            lede="They guide how we hire, how we plan and how we treat each other, from the front desk to the kitchen."
          />
          <ul className="tf-values">
            {values.map((v) => (
              <li key={v.key}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={v.icon} alt="" width={64} height={64} />
                <h3>{t(v.name)}</h3>
                <p>{t(v.text)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="sec tone-green on-dark" aria-labelledby="ab-name-h">
        <div className="wrap tf-origin">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/brand/dots.png" alt="" width={220} height={220} />
          <div>
            <p className="eyebrow">{t("Our name")}</p>
            <h2 id="ab-name-h" className="vh">
              {t("Where the name Tenfold comes from")}
            </h2>
            <blockquote>“{t(nameOrigin.quote)}”</blockquote>
            <p>
              <cite>{nameOrigin.author}</cite>
            </p>
            <p style={{ color: "#d8e2d6" }}>
              {t("Our name comes from these lines by the poet Joaquin Miller. What we give to each other comes back many times over: residents, families and team members alike.")}
            </p>
          </div>
        </div>
      </section>

      <section className="sec tone-white" aria-labelledby="ab-lead-h">
        <div className="wrap">
          <TfHead
            t={t}
            id="ab-lead-h"
            eyebrow="Leadership"
            title={
              <>
                {t("The people behind ")}
                <em>{t("Tenfold")}</em>
              </>
            }
          />
          <div className="tf-leaders">
            {leadership.map((p) => (
              <article key={p.name} className="tf-leader" aria-labelledby={`lead-${p.name.split(" ")[0]}`}>
                <span className="tf-leader-mono" aria-hidden="true">
                  {p.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")}
                </span>
                <h3 id={`lead-${p.name.split(" ")[0]}`}>{p.name}</h3>
                <p className="tf-leader-role">{t(p.role)}</p>
                {p.bio.map((b) => (
                  <p key={b}>{t(b)}</p>
                ))}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="sec tone-sand" aria-labelledby="ab-story-h">
        <div className="wrap">
          <TfHead
            t={t}
            id="ab-story-h"
            eyebrow="Our story"
            title={
              <>
                {t("Growing, ")}
                <em>{t("one community at a time")}</em>
              </>
            }
          />
          <ol className="tf-timeline">
            {all.map((s) => (
              <li key={s.slug}>
                <b>{s.openedYear}</b>
                <p>
                  {t(`${s.name} opens in ${s.city}${s.first ? ", Tenfold’s first community" : ""}.`)}
                </p>
              </li>
            ))}
            <li>
              <b>2027</b>
              <p>{t(`${comingCommunities.map((c) => c.name).join(" and ")} are planned to open in Fall 2027.`)}</p>
            </li>
          </ol>
          <p style={{ marginTop: 32 }}>
            <a className="link-arrow" href={href("/communities")}>
              {t("Explore our communities")} <Icon name="arrow" />
            </a>
            <span aria-hidden="true"> · </span>
            <a className="link-arrow" href={href("/all-are-welcome")}>
              {t("All are welcome")} <Icon name="arrow" />
            </a>
          </p>
        </div>
      </section>

      <TfCta t={t} href={href} />
    </>
  );
}
