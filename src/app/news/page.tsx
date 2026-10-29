import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Dots } from "@/components/Logo";
import { site } from "@/data/site";
import { authorOf, newsKinds, publishedStories, storyDate } from "@/data/articles";
import { iso, today } from "@/lib/clock";
import { NewsList } from "@/components/info/NewsList";
import "@/components/info/info.css";

export const metadata: Metadata = {
  title: "News",
  description: "Stories from Prairie City Landing: Events & Adventures, dining, wellness, community news and careers.",
};

export default function NewsPage() {
  const all = publishedStories(iso(today()));
  const [lead, ...rest] = all;
  const cards = rest.map((s) => ({ slug: s.slug, title: s.title, dek: s.dek, kind: s.kind, date: s.date, dateLabel: storyDate(s.date), photo: s.photo, alt: s.alt, author: authorOf(s) }));

  return (
    <>
      <section className="nw-hero tone-sand">
        <Dots size={280} style={{ right: -60, top: -60, opacity: 0.2 }} />
        <div className="wrap">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>
              <span aria-hidden="true">/ </span>
              <Link href="/news">News</Link>
            </span>
          </nav>
          <div className="nw-hero-head">
            <div>
              <p className="eyebrow">News</p>
              <h1>
                Life at <em>the Landing</em>
              </h1>
            </div>
            <a className="link-arrow" href={site.facebook} target="_blank" rel="noreferrer">
              <Icon name="facebook" /> More photos on Facebook
            </a>
          </div>
          <Link href={`/news/${lead.slug}`} className="nw-lead card">
            <div className="nw-lead-photo">
              <Image src={lead.photo} alt={lead.alt} fill priority sizes="(max-width: 860px) 100vw, 60vw" />
            </div>
            <div className="nw-lead-text">
              <p className="nw-meta">
                <span className="pill pill-terra">{lead.kind}</span> <time dateTime={lead.date}>{storyDate(lead.date)}</time>
              </p>
              <h2>{lead.title}</h2>
              <p className="muted">{lead.dek}</p>
              <span className="link-arrow">
                Read the story <Icon name="arrow" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      <section className="sec tone-cream">
        <div className="wrap">
          <h2 className="vh">More stories</h2>
          <NewsList items={cards} kinds={newsKinds} />
        </div>
      </section>
    </>
  );
}
