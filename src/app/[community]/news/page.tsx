import type { Metadata } from "next";
import { VisitBand } from "@/components/VisitBand";
import Image from "next/image";
import Link from "@/i18n/Link";
import { getT } from "@/i18n/server";
import { Icon } from "@/components/Icon";
import { Dots } from "@/components/Logo";
import { newsKinds, storyDate } from "@/data/shared";
import { getCommunity } from "@/lib/community-server";
import { infoCopy } from "@/data/communities/copy/info";
import { iso, today } from "@/lib/clock";
import { NewsList } from "@/components/info/NewsList";
import "@/components/info/info.css";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  const { site } = await getCommunity();
  return {
    title: t("News"),
    description: t(`Stories from ${site.name}: Events & Adventures, dining, wellness, community news and careers.`),
  };
}

export default async function NewsPage() {
  const { t } = await getT();
  const c = await getCommunity();
  const { publishedStories, authorOf } = c;
  const all = publishedStories(iso(today()));
  const [lead, ...rest] = all;
  const cards = rest.map((s) => ({ slug: s.slug, title: s.title, dek: s.dek, kind: s.kind, date: s.date, dateLabel: storyDate(s.date), photo: s.photo, alt: s.alt, author: authorOf(s) }));

  return (
    <>
      <section className="nw-hero tone-sand">
        <Dots size={280} style={{ right: -60, top: -60, opacity: 0.2 }} />
        <div className="wrap">
          <nav className="crumbs" aria-label={t("Breadcrumb")}>
            <Link href="/">{t("Home")}</Link>
            <span>
              <span aria-hidden="true">/ </span>
              <Link href="/news">{t("News")}</Link>
            </span>
          </nav>
          <div className="nw-hero-head">
            <div>
              <p className="eyebrow">{t("News")}</p>
              <h1>
                {t("Life at ")}
                <em>{t(infoCopy[c.slug].newsPlace)}</em>
              </h1>
            </div>
            <Link className="link-arrow" href="/photos">
              <Icon name="image" /> {t("All photo albums")}
            </Link>
          </div>
          <Link href={`/news/${lead.slug}`} className="nw-lead card">
            <div className="nw-lead-photo">
              <Image src={lead.photo} alt={t(lead.alt)} fill priority sizes="(max-width: 860px) 100vw, 60vw" />
            </div>
            <div className="nw-lead-text">
              <p className="nw-meta">
                <span className="pill pill-terra">{t(lead.kind)}</span> <time dateTime={lead.date}>{t(storyDate(lead.date))}</time>
              </p>
              <h2>{t(lead.title)}</h2>
              <p className="muted">{t(lead.dek)}</p>
              <span className="link-arrow">
                {t("Read the story")} <Icon name="arrow" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      <section className="sec tone-cream">
        <div className="wrap">
          <h2 className="vh">{t("More stories")}</h2>
          <NewsList items={cards} kinds={newsKinds} />
        </div>
      </section>
      <VisitBand />
    </>
  );
}
