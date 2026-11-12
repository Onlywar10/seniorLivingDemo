import type { Metadata } from "next";
import Link from "@/i18n/Link";
import { getT } from "@/i18n/server";
import "@/components/brand/brand.css";
import "@/components/info/info.css";
import { getCommunity } from "@/lib/community-server";
import { eventsCopy } from "@/data/communities/copy/events";
import { galleries } from "@/data/staff/website";
import { getStaffData } from "@/data/staff";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { Gallery, type GalleryItem } from "@/components/brand/Gallery";
import { TourBand } from "@/components/brand/TourBand";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  const { site } = await getCommunity();
  return { title: t("Photo albums"), description: t(`Photo albums from events and outings at ${site.name}, added by our team after each one.`) };
}

/**
 * The community's own photo albums: one per event, built by Kinlight from the photos staff add after it (the same
 * albums as Website → Galleries in the staff workspace). Residents are never named here, and only residents who have
 * agreed to photos appear; photos with anyone else in them are held back before anything is published.
 */
export default async function PhotosPage() {
  const { t } = await getT();
  const c = await getCommunity();
  const s = getStaffData(c.slug);
  const albums = galleries(c.slug);
  const captionOf = (title: string) => s.photoPresets.find((p) => title.toLowerCase().includes(p.label.toLowerCase().split(" ")[0]))?.caption;
  const items: GalleryItem[] = albums.map((g) => ({
    src: g.cover,
    alt: g.title,
    title: g.title,
    caption: captionOf(g.title),
    meta: `${g.when} · ${g.photos} photos`,
  }));
  const favorites = eventsCopy[c.slug].gallery;
  return (
    <>
      <PageHero
        crumbs={[["Photo albums", "/photos"]]}
        eyebrow="Photos"
        title={<>{t("Our ")}<em>{t("photo albums")}</em></>}
        lede="After every event, our team adds the photos here, one album per event. Families who sign up hear when a new album is ready."
      >
        <div className="btn-row">
          <Link className="btn" href="/stay-connected">
            <Icon name="mail" /> {t("Get new albums by text or email")}
          </Link>
          <Link className="btn btn-ghost" href="/calendar">
            <Icon name="calendar" /> {t("What’s coming up")}
          </Link>
        </div>
      </PageHero>

      <section className="sec tone-white" aria-labelledby="ph-recent-h">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">{t("The last four weeks")}</p>
            <h2 id="ph-recent-h">{t("Recent ")}<em>{t("albums")}</em></h2>
          </div>
          {items.length ? <Gallery items={items} variant="cards" /> : <p className="muted">{t("New albums appear here after each event.")}</p>}
          <p className="ph-privacy">
            <Icon name="lock" />
            <span>{t("We never name residents in our albums, and only residents who have agreed to photos appear. If someone in a photo hasn’t agreed, the photo stays with our team.")}</span>
          </p>
        </div>
      </section>

      <section className="sec tone-cream" aria-labelledby="ph-fav-h">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">{t("Through the year")}</p>
            <h2 id="ph-fav-h">{t("A few of our ")}<em>{t("favorite")}</em>{t(" days")}</h2>
          </div>
          <Gallery items={favorites} />
        </div>
      </section>

      <TourBand photo="/img/friends-laugh.jpg" title={<>{t("See it for ")}<em>{t("yourself.")}</em></>} text="Come for a tour and lunch, and meet the people in these photos." />
    </>
  );
}
