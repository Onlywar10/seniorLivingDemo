import type { Metadata } from "next";
import Image from "next/image";
import { getT } from "@/i18n/server";
import { Icon } from "@/components/Icon";
import { apartmentFeatures, comingCommunities, purpose, values, yusm } from "@/data/tenfold";
import { summaries, intoCommunity, TfCta, TfHead } from "@/components/tenfold/parts";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: { absolute: t("Tenfold Senior Living · Different By Design") },
    description: t("Luxury senior living in Folsom and Elk Grove, California: spacious apartments, Assisted Living Services in every apartment, Harbor Memory Care and a lifestyle that keeps you youthful, useful, spontaneous and mobile."),
  };
}

const featureIcons = { kitchen: "fork", peninsula: "coffee", windows: "sun", furniture: "home", closets: "layers", laundry: "sparkle" } as const;

export default async function TenfoldHome() {
  const { t, href, lang } = await getT();
  const all = summaries();
  const total = all.reduce((n, s) => n + s.apartments.independentAssisted + s.apartments.harbor, 0);
  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="tf-hero" aria-labelledby="tf-hero-h">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/brand/dots.svg" alt="" aria-hidden="true" className="tf-hero-dots" width={360} height={360} />
        <div className="wrap tf-hero-grid">
          <div className="tf-hero-text">
            <p className="eyebrow rise">{t("Tenfold Senior Living")}</p>
            <h1 id="tf-hero-h" className="rise rise-2">
              {t("Different ")}
              <em>{t("By Design")}</em>
            </h1>
            <p className="lede rise rise-3">
              {t("Luxury senior living communities in Folsom and Elk Grove, California, designed so older adults choose how they live: spacious apartment homes, support that comes to you, and a calendar full of things you actually want to do.")}
            </p>
            <div className="btn-row rise rise-4">
              <a className="btn btn-lg" href={href("/communities")}>
                {t("Find a community")}
              </a>
              <a className="btn btn-ghost btn-lg" href={href("/about")}>
                {t("Why Tenfold")}
              </a>
            </div>
            <dl className="tf-hero-stats rise rise-4">
              <div>
                <dt>{t("Communities open")}</dt>
                <dd>{all.length}</dd>
              </div>
              <div>
                <dt>{t("Apartment homes")}</dt>
                <dd>{total}</dd>
              </div>
              <div>
                <dt>{t("Opening in 2027")}</dt>
                <dd>{comingCommunities.length}</dd>
              </div>
            </dl>
          </div>
          <div className="tf-hero-ph rise rise-2">
            <div className="tf-ph tf-ph-big">
              <Image src="/img/courtyard-dining.jpg" alt={t("Residents dining together in a sunny courtyard")} fill priority sizes="(max-width: 860px) 100vw, 55vw" />
            </div>
            <div className="tf-ph tf-ph-small">
              <Image src="/img/friends-laugh.jpg" alt={t("Two friends sharing a laugh")} fill sizes="(max-width: 860px) 40vw, 22vw" />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Communities ---------- */}
      <section className="sec tone-cream" aria-labelledby="tf-comm-h">
        <div className="wrap">
          <TfHead
            t={t}
            id="tf-comm-h"
            eyebrow="Our communities"
            title={
              <>
                {t("Choose your ")}
                <em>{t("community")}</em>
              </>
            }
            lede="Two open communities in Sacramento County, each with Independent Living, Assisted Living Services and Harbor Memory Care."
          />
          <div className="tf-comm-grid">
            {all.map((s) => (
              <a key={s.slug} className="tf-comm-card" href={intoCommunity(lang, s.slug)}>
                <div className="tf-comm-ph">
                  <Image src={s.photo} alt={t(s.alt)} fill sizes="(max-width: 860px) 100vw, 50vw" />
                  <span className="tf-comm-badge">{t(`Opened ${s.openedYear}`)}</span>
                </div>
                <div className="tf-comm-body">
                  <p className="tf-comm-city">
                    <Icon name="pin" /> {s.city}, CA
                  </p>
                  <h3>{s.name}</h3>
                  <p className="tf-comm-counts">
                    {t(`${s.apartments.independentAssisted} Independent & Assisted Living apartments`)} · {t(`${s.apartments.harbor} Harbor apartments`)}
                  </p>
                  <ul className="tf-comm-living">
                    {s.living.map((l) => (
                      <li key={l}>{t(l)}</li>
                    ))}
                  </ul>
                  <dl className="tf-comm-prices">
                    <div>
                      <dt>{t("Independent Living")}</dt>
                      <dd>{t(`from ${s.from.independent}/mo`)}</dd>
                    </div>
                    <div>
                      <dt>{t("Harbor Memory Care")}</dt>
                      <dd>{t(`from ${s.from.harbor}/mo`)}</dd>
                    </div>
                  </dl>
                  <span className="link-arrow">
                    {t(`Visit ${s.name}`)} <Icon name="arrow" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Apartments ---------- */}
      <section className="sec tone-white" aria-labelledby="tf-apt-h">
        <div className="wrap tf-split">
          <div className="tf-split-ph">
            <div className="tf-ph tf-ph-tall">
              <Image src="/img/apt-kitchen.jpg" alt={t("A full-size kitchen with stainless steel appliances and a peninsula")} fill sizes="(max-width: 860px) 100vw, 45vw" />
            </div>
          </div>
          <div>
            <TfHead
              t={t}
              id="tf-apt-h"
              eyebrow="Your apartment"
              title={
                <>
                  {t("Spacious ")}
                  <em>{t("Luxury")}</em>
                  {t(" Apartments")}
                </>
              }
              lede="Real apartment homes, not rooms. Bring the dining table, the sectional and the art you love."
            />
            <ul className="tf-features">
              {apartmentFeatures.map((f) => (
                <li key={f.key}>
                  <span className="tf-feature-ico">
                    <Icon name={featureIcons[f.key]} />
                  </span>
                  <div>
                    <h3>{t(f.title)}</h3>
                    <p>{t(f.text)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- Assisted Living Services ---------- */}
      <section className="sec tone-green on-dark" aria-labelledby="tf-als-h">
        <div className="wrap tf-split tf-split-rev">
          <div>
            <p className="eyebrow">{t("Assisted Living Services")}</p>
            <h2 id="tf-als-h">
              {t("Support that comes to ")}
              <em className="tf-em-light">{t("your door.")}</em>
            </h2>
            <p className="tf-lede-dark">
              {t("Assisted Living Services are available in every apartment, so residents can age in place. If your needs change, the help comes to you: you never have to move to get it.")}
            </p>
            <ul className="tf-checks">
              <li>
                <Icon name="check" /> <span>{t("Medication management and personal care")}</span>
              </li>
              <li>
                <Icon name="check" /> <span>{t("Escorts to meals, activities and appointments")}</span>
              </li>
              <li>
                <Icon name="check" /> <span>{t("Coordination with your healthcare providers")}</span>
              </li>
              <li>
                <Icon name="check" /> <span>{t("A team on site 24 hours, with an emergency response system in every apartment")}</span>
              </li>
            </ul>
            <a className="btn btn-light" href={href("/living/assisted-living")}>
              {t("About Assisted Living Services")}
            </a>
          </div>
          <div className="tf-split-ph">
            <div className="tf-ph">
              <Image src="/img/care-chat.jpg" alt={t("A Care Partner chatting with a resident on her sofa")} fill sizes="(max-width: 860px) 100vw, 45vw" />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Harbor ---------- */}
      <section className="sec tone-sand" aria-labelledby="tf-harbor-h">
        <div className="wrap tf-split">
          <div className="tf-split-ph">
            <div className="tf-ph">
              <Image src="/img/harbor-garden.jpg" alt={t("Harbor’s secure garden courtyard")} fill sizes="(max-width: 860px) 100vw, 45vw" />
            </div>
          </div>
          <div>
            <TfHead
              t={t}
              id="tf-harbor-h"
              eyebrow="Harbor Memory Care"
              title={
                <>
                  {t("Where ‘we can’t’ becomes ")}
                  <em>{t("‘how can we?’")}</em>
                </>
              }
              lede="Harbor is a home-like, secured neighborhood within each community, with its own courtyard, its own activity team and its own Events & Adventures calendar."
            />
            <dl className="tf-mini-stats">
              {all.map((s) => (
                <div key={s.slug}>
                  <dt>{s.name}</dt>
                  <dd>
                    {t(`${s.apartments.harbor} Harbor apartments`)} · {t(`from ${s.from.harbor}/mo`)}
                  </dd>
                </div>
              ))}
            </dl>
            <a className="btn btn-green" href={href("/living/harbor-memory-care")}>
              {t("Discover Harbor Memory Care")}
            </a>
          </div>
        </div>
      </section>

      {/* ---------- Lifestyle ---------- */}
      <section className="sec tone-cream" aria-labelledby="tf-life-h">
        <div className="wrap">
          <TfHead
            t={t}
            center
            id="tf-life-h"
            eyebrow="The lifestyle"
            title={
              <>
                {t("Youthful, Useful, Spontaneous ")}
                <em>{t("and Mobile")}</em>
              </>
            }
            lede="YUSM is the philosophy behind every Tenfold calendar, menu and class. It’s how we help residents keep living fully."
          />
          <ol className="tf-yusm">
            {yusm.map((y) => (
              <li key={y.letter}>
                <div className="tf-yusm-ph">
                  <Image src={y.photo} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 960px) 50vw, 25vw" />
                  <span className="tf-yusm-letter" aria-hidden="true">
                    {y.letter}
                  </span>
                </div>
                <h3>{t(y.word)}</h3>
                <p>{t(y.text)}</p>
              </li>
            ))}
          </ol>
          <div className="tf-life-row">
            {[
              { icon: "fork", title: "Chef-driven dining", text: "Three restaurants in every community, from white-tablecloth dinners to coffee and happy hour.", photo: "/img/dish-plated.jpg" },
              { icon: "bus", title: "Events & Adventures", text: "Clubs, classes, concerts and outings beyond the community.", photo: "/img/paddleboard.jpg" },
              { icon: "dumbbell", title: "Fitness", text: "More than 25 classes a week with a full-time Fitness Director.", photo: "/img/fitness-center.jpg" },
            ].map((x) => (
              <div key={x.title} className="tf-life-card">
                <div className="tf-life-ph">
                  <Image src={x.photo} alt="" fill sizes="(max-width: 860px) 100vw, 33vw" />
                </div>
                <div className="tf-life-body">
                  <Icon name={x.icon as "fork"} />
                  <h3>{t(x.title)}</h3>
                  <p>{t(x.text)}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="center">
            <a className="link-arrow" href={href("/lifestyle")}>
              {t("Explore the lifestyle")} <Icon name="arrow" />
            </a>
          </p>
        </div>
      </section>

      {/* ---------- Autonomy ---------- */}
      <section className="sec tone-white tf-autonomy" aria-labelledby="tf-auto-h">
        <div className="wrap tf-split">
          <div>
            <TfHead
              t={t}
              id="tf-auto-h"
              eyebrow="Your life, your way"
              title={
                <>
                  {t("Living with ")}
                  <em>{t("true autonomy")}</em>
                </>
              }
            />
            <p className="tf-big">
              {t("Your apartment, your schedule, your choices. Cook in your own kitchen or dine in one of our restaurants, join an outing or enjoy a quiet afternoon, and come and go as you please.")}
            </p>
            <p className="muted">
              {t("No second-person fee for couples, Assisted Living Services if and when you want them, and a team that listens before it acts. That’s what we mean by Different By Design.")}
            </p>
          </div>
          <div className="tf-split-ph">
            <div className="tf-ph">
              <Image src="/img/coffee-woman.jpg" alt={t("A resident enjoying a coffee by the window")} fill sizes="(max-width: 860px) 100vw, 45vw" />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Purpose & values ---------- */}
      <section className="sec tone-sand" aria-labelledby="tf-val-h">
        <div className="wrap">
          <div className="tf-purpose">
            <p className="eyebrow">{t("Our purpose")}</p>
            <blockquote id="tf-val-h">{t(purpose)}</blockquote>
          </div>
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
          <p className="center">
            <a className="link-arrow" href={href("/about")}>
              {t("About Tenfold")} <Icon name="arrow" />
            </a>
          </p>
        </div>
      </section>

      {/* ---------- Coming 2027 ---------- */}
      <section className="sec tone-cream" aria-labelledby="tf-coming-h">
        <div className="wrap">
          <TfHead
            t={t}
            id="tf-coming-h"
            eyebrow="Coming 2027"
            title={
              <>
                {t("Two new communities, ")}
                <em>{t("planned for Fall 2027")}</em>
              </>
            }
            lede="Join an interest list to hear first about floor plans, pricing and opening dates."
          />
          <div className="tf-coming-grid">
            {comingCommunities.map((c) => (
              <a key={c.key} className="tf-coming-card" href={href(`/communities#${c.key}`)}>
                <span className="pill pill-terra">{t(`Planned opening ${c.planned}`)}</span>
                <h3>{c.name}</h3>
                <p className="tf-comm-city">
                  <Icon name="pin" /> {c.city}, {c.state} · {t(c.crossStreets)}
                </p>
                <p className="muted">
                  {c.living.map((l) => t(l)).join(" · ")} · {t(`${c.apartments} apartments`)}
                </p>
                <span className="link-arrow">
                  {t("Join the interest list")} <Icon name="arrow" />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <TfCta t={t} href={href} />
    </>
  );
}
