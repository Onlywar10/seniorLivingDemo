import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/i18n/Link";
import { getT } from "@/i18n/server";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { storyDate } from "@/data/shared";
import { getCommunity } from "@/lib/community-server";
import { infoCopy } from "@/data/communities/copy/info";
import { iso, today } from "@/lib/clock";
import { ShareLinks } from "@/components/info/NewsList";
import { Monogram } from "@/components/info/bits";
import "@/components/info/info.css";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { t } = await getT();
  const s = (await getCommunity()).findStory(slug);
  if (!s) return { title: t("Story not found") };
  return { title: t(s.title), description: t(s.dek) };
}

/** Closing notes that point readers to the next step, by kind. */
const nextStep: Record<string, { text: string; href: string; label: string }> = {
  "Events & Adventures": { text: "See what’s coming up next on the activity calendar.", href: "/calendar", label: "Activity calendar" },
  News: { text: "Come and see the community for yourself.", href: "/tour", label: "Schedule a tour" },
  Dining: { text: "See this week’s menus from all three restaurants.", href: "/dining", label: "Dining & menus" },
  Wellness: { text: "More than 25 classes a week, open to every resident.", href: "/fitness", label: "Fitness" },
  Careers: { text: "See our open positions and benefits.", href: "/careers", label: "Careers" },
};

export default async function StoryPage({ params }: Props) {
  const { slug } = await params;
  const { t } = await getT();
  const c = await getCommunity();
  const { site, findStory, bodyOf, authorOf, publishedStories } = c;
  const s = findStory(slug);
  if (!s) notFound();
  const domain = site.email.split("@")[1];
  const body = bodyOf(s);
  const author = authorOf(s);
  const related = publishedStories(iso(today()))
    .filter((r) => r.slug !== s.slug)
    .sort((a, b) => Number(b.kind === s.kind) - Number(a.kind === s.kind))
    .slice(0, 3);
  const step = nextStep[s.kind];

  return (
    <>
      <article className="nw-article">
        <header className="nw-art-head tone-sand">
          <div className="wrap-narrow">
            <nav className="crumbs" aria-label={t("Breadcrumb")}>
              <Link href="/">{t("Home")}</Link>
              <span>
                <span aria-hidden="true">/ </span>
                <Link href="/news">{t("News")}</Link>
              </span>
            </nav>
            <p className="nw-meta">
              <span className="pill pill-terra">{t(s.kind)}</span> <time dateTime={s.date}>{t(storyDate(s.date))}</time>
            </p>
            <h1>{t(s.title)}</h1>
            <p className="nw-dek">{t(s.dek)}</p>
            <div className="nw-byline">
              <Monogram name={author === site.name ? site.short.split("").join(" ") : author} size={44} tone="var(--green)" />
              <span>
                {t("By ")}
                <b data-no-translate>{author}</b>
              </span>
            </div>
          </div>
        </header>
        <div className="wrap nw-art-photo-wrap">
          <div className="nw-art-photo">
            <Image src={s.photo} alt={t(s.alt)} fill priority sizes="(max-width: 1220px) 100vw, 1100px" />
          </div>
          {"credit" in s && s.credit && <p className="small muted" style={{ marginTop: 8 }}>{t(s.credit)}</p>}
        </div>
        <div className="wrap-narrow nw-body">
          {body.map((p, i) => (
            <p key={i} className={i === 0 ? "nw-first" : undefined}>
              {t(p)}
            </p>
          ))}
          {s.link && (
            <p style={{ marginTop: 28 }}>
              <a className="link-arrow" href={s.link} target="_blank" rel="noreferrer">
                {t("Read the original post")} <Icon name="arrow" />
              </a>
            </p>
          )}
          {step && (
            <aside className="nw-next">
              <p>{t(step.text)}</p>
              <Link className="link-arrow" href={step.href}>
                {t(step.label)} <Icon name="arrow" />
              </Link>
            </aside>
          )}
          <ShareLinks title={s.title} url={s.link ?? `https://${domain}/news/${s.slug}`} />
        </div>
      </article>

      <section className="sec tone-cream">
        <div className="wrap">
          <div className="sec-head-row">
            <div className="sec-head">
              <p className="eyebrow">{t("Keep reading")}</p>
              <h2>
                {t("More from ")}
                <em>{t(infoCopy[c.slug].newsPlace)}</em>
              </h2>
            </div>
            <Link className="link-arrow" href="/news">
              {t("All news")} <Icon name="arrow" />
            </Link>
          </div>
          <ul className="nw-grid">
            {related.map((r) => (
              <li key={r.slug} className="card nw-card">
                <Link href={`/news/${r.slug}`} className="nw-card-link">
                  <div className="card-photo">
                    <Image src={r.photo} alt={t(r.alt)} fill sizes="(max-width: 640px) 100vw, (max-width: 960px) 50vw, 33vw" />
                  </div>
                  <div className="card-pad">
                    <p className="nw-meta">
                      <span className="pill pill-terra">{t(r.kind)}</span> <time dateTime={r.date}>{t(storyDate(r.date))}</time>
                    </p>
                    <h3>{t(r.title)}</h3>
                    <p className="small muted">{t(r.dek)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
