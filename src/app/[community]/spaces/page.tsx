import type { Metadata } from "next";
import Link from "@/i18n/Link";
import { getT } from "@/i18n/server";
import "@/components/brand/brand.css";
import { getCommunity } from "@/lib/community-server";
import { spacesCopy } from "@/data/communities/copy/spaces";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { Gallery } from "@/components/brand/Gallery";
import { TourBand } from "@/components/brand/TourBand";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: t("Amazing Spaces"),
    description: t(spacesCopy[(await getCommunity()).slug].metaDescription),
  };
}

export default async function Spaces() {
  const { t } = await getT();
  const c = await getCommunity();
  const { spaces, venues, venueOrder } = c;
  const copy = spacesCopy[c.slug];
  const items = spaces.map((s) => ({ src: s.photo, alt: s.alt, title: s.name, caption: s.text, meta: s.hours ? `${s.kind} · ${s.hours}` : s.kind }));
  return (
    <>
      <PageHero
        eyebrow="Amazing Spaces"
        title={
          <>
            {t("Room to ")}<em>{t("gather,")}</em>{t(" room to breathe.")}
          </>
        }
        lede="Good rooms bring people together. Take a look around the places where residents meet for coffee, classes, cocktails and a chat."
        photo={copy.heroPhoto}
        alt={copy.heroAlt}
        crumbs={[
          ["Lifestyle", "/lifestyle"],
          ["Amazing Spaces", "/spaces"],
        ]}
      >
        <div className="btn-row">
          <Link className="btn" href="/tour">
            {t("See them in person")}
          </Link>
        </div>
      </PageHero>

      <section className="sec-tight tone-white" aria-labelledby="br-hours-h">
        <div className="wrap">
          <h2 id="br-hours-h" className="vh">
            {t("Restaurant hours")}
          </h2>
          <ul className="br-hours">
            {venueOrder.map((k) => (
              <li key={k}>
                <Icon name={/coffee/i.test(venues[k].kind) ? "coffee" : /tablecloth/i.test(venues[k].kind) ? "wine" : "fork"} />
                <p>
                  <b>{venues[k].name}</b>
                  <span className="muted small">{t(`Open daily, ${venues[k].hours}`)}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="sec tone-cream" aria-labelledby="br-tour-spaces-h">
        <div className="wrap">
          <div className="sec-head-row">
            <div className="sec-head">
              <p className="eyebrow">{t("Photo tour")}</p>
              <h2 id="br-tour-spaces-h">{t(`${spaces.length} places to make your own`)}</h2>
              <p>{t("Select any photo to see it larger.")}</p>
            </div>
            <Link className="link-arrow" href="/dining">
              {t("Today’s menus ")}<Icon name="arrow" />
            </Link>
          </div>
          <Gallery items={items} variant="cards" />
        </div>
      </section>

      <section className="sec-tight tone-sand" aria-labelledby="br-more-h">
        <div className="wrap">
          <div className="sec-head">
            <h2 id="br-more-h">{t("More to discover outdoors")}</h2>
          </div>
          <Gallery items={copy.outdoors} />
        </div>
      </section>

      <TourBand photo={copy.tourPhoto} />
    </>
  );
}
