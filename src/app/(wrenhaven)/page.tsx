import type { Metadata } from "next";
import Image from "next/image";
import { getT } from "@/i18n/server";
import { Icon } from "@/components/Icon";
import { comingCommunities } from "@/data/wrenhaven";
import { summaries, intoCommunity, TfCta, TfHead } from "@/components/wrenhaven/parts";
import { CommunityMap } from "@/components/wrenhaven/CommunityMap";
import { ExampleChat } from "@/components/wrenhaven/ExampleChat";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: { absolute: t("Wrenhaven Senior Living · Find Your Community") },
    description: t("Wrenhaven senior living communities in Northern California, with Independent Living, Assisted Living Services and Lantern Memory Care. Find a community near you, see its menus, calendar and apartments, and book a tour."),
  };
}

// The parent site's front door. Its one job: help a family find the Wrenhaven community they want to look at.
// Everything about daily life, apartments, care and prices lives on each community's own site.
const offers = [
  { icon: "home", title: "Independent Living", text: "Your own apartment, with dining, activities and the help you choose." },
  { icon: "heart", title: "Assisted Living Services", text: "Care that comes to your apartment, so you never have to move to get it." },
  { icon: "sparkle", title: "Lantern Memory Care", text: "A calm, secure neighborhood with its own team, garden and calendar." },
] as const;

export default async function WrenhavenHome() {
  const { t, href, lang } = await getT();
  const all = summaries();
  return (
    <>
      {/* ---------- Hero: one job, finding a community ---------- */}
      <section className="tf-hero" aria-labelledby="tf-hero-h">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/brand/dots.svg" alt="" aria-hidden="true" className="tf-hero-dots" width={360} height={360} />
        <div className="wrap tf-hero-grid">
          <div className="tf-hero-text">
            <p className="eyebrow rise">{t("Wrenhaven Senior Living")}</p>
            <h1 id="tf-hero-h" className="rise rise-2">
              {t("Find your ")}
              <em>{t("Wrenhaven community")}</em>
            </h1>
            <p className="lede rise rise-3">
              {t("Independent Living, Assisted Living Services and Lantern Memory Care in Northern California. Pick a community to see its apartments, menus, calendar and prices, and to book a tour.")}
            </p>
            <div className="btn-row rise rise-4">
              <a className="btn btn-lg" href="#find">
                <Icon name="pin" /> {t("Find a community")}
              </a>
              <a className="btn btn-ghost btn-lg" href={href("/contact")}>
                {t("Talk to us")}
              </a>
            </div>
            <p className="tf-hero-note rise rise-4">
              {t(`${all.length} communities open · ${comingCommunities.length} opening in 2027`)}
            </p>
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

      {/* ---------- Find a community: the map ---------- */}
      <section className="sec tone-cream" aria-labelledby="tf-find-h">
        <div className="wrap">
          <TfHead
            t={t}
            id="tf-find-h"
            eyebrow="Find a community"
            title={
              <>
                {t("Where ")}
                <em>{t("we are")}</em>
              </>
            }
            lede="Tap a community on the map to visit it. Each one has its own website, with today’s menus, this week’s calendar, apartments, prices and tours."
          />
          <CommunityMap t={t} href={href} lang={lang} />
        </div>
      </section>

      {/* ---------- What every community offers, in one line each ---------- */}
      <section className="sec tone-white tf-offers" aria-labelledby="tf-offers-h">
        <div className="wrap">
          <h2 id="tf-offers-h" className="tf-offers-h">{t("Every Wrenhaven community offers")}</h2>
          <ul className="tf-offers-list">
            {offers.map((o) => (
              <li key={o.title}>
                <span className="tf-feature-ico"><Icon name={o.icon} /></span>
                <div>
                  <h3>{t(o.title)}</h3>
                  <p>{t(o.text)}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="center">
            <a className="btn btn-green" href="#find">
              <Icon name="pin" /> {t("Find a community near you")}
            </a>
          </p>
        </div>
      </section>

      {/* ---------- Example chat ---------- */}
      <section className="sec tone-sand" aria-labelledby="tf-chat-h">
        <div className="wrap tf-split">
          <div>
            <TfHead
              t={t}
              id="tf-chat-h"
              eyebrow="Questions, answered"
              title={
                <>
                  {t("Ask us ")}
                  <em>{t("anything")}</em>
                </>
              }
              lede="Every Wrenhaven website has a chat that answers straight from that community’s own pages: prices, apartments, tonight’s dinner, today’s activities and upcoming events."
            />
            <ul className="tf-checks">
              <li>
                <Icon name="check" /> <span>{t("Answers in a multitude of languages")}</span>
              </li>
              <li>
                <Icon name="check" /> <span>{t("Links to the page each answer comes from")}</span>
              </li>
              <li>
                <Icon name="check" /> <span>{t("Offers a call back from a real person when you want one")}</span>
              </li>
            </ul>
            <p className="muted">{t("Try it: pick a suggested question or type your own.")}</p>
          </div>
          <ExampleChat
            communities={all.map((s) => ({
              name: s.name,
              city: s.city,
              independent: s.from.independent,
              assisted: s.from.assisted,
              lantern: s.from.lantern,
              home: intoCommunity(lang, s.slug),
              plans: intoCommunity(lang, s.slug, "/floor-plans"),
            }))}
          />
        </div>
      </section>

      <TfCta
        t={t}
        href={href}
        title={
          <>
            {t("See it ")}
            <em>{t("for yourself.")}</em>
          </>
        }
        lede={`Visit ${all.map((s) => s.name).join(" or ")}. Every tour is personal, at a time that suits you.`}
      />
    </>
  );
}
