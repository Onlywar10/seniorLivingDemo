// Building blocks for the Tenfold parent pages (Server Components). Pass `t` from getT().
import Image from "next/image";
import type { ReactNode } from "react";
import { communities, communitySlugs, type CommunitySlug } from "@/data/communities";
import { money } from "@/data/shared";
import { communityFacts } from "@/data/tenfold";
import { sitePath } from "@/lib/sites";
import type { Lang } from "@/i18n/config";

type T = (s: string) => string;

/** Everything the parent site shows about one open community, from its own data. */
export function summary(slug: CommunitySlug) {
  const c = communities[slug];
  const f = communityFacts[slug];
  const harborFrom = Math.min(...c.pricing.harbor.map((h) => h.from));
  return {
    slug,
    c,
    name: c.site.name,
    city: c.site.address.city,
    ...f,
    living: Object.values(c.living).map((l) => l.name),
    from: { independent: money(c.pricing.independentRange[0]), assisted: money(c.pricing.assistedBase), harbor: money(harborFrom) },
    planCount: c.plans.length,
  };
}

export const summaries = () => communitySlugs.map(summary);

/** A link into a community from the parent site, in the visitor's language: ("bruceville-point", "/dining"). */
export const intoCommunity = (lang: Lang, slug: CommunitySlug, path = "/") => sitePath(lang, null, path === "/" ? `/${slug}` : `/${slug}${path}`);

/** Inner-page hero for the parent site: breadcrumb, eyebrow, title, lede, photo with one oversized corner. */
export function TfHero({ t, href, eyebrow, title, lede, photo, alt = "", crumbs = [], children }: {
  t: T;
  href: (p: string) => string;
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  photo?: string;
  alt?: string;
  crumbs?: [string, string][];
  children?: ReactNode;
}) {
  return (
    <section className={`tf-phero ${photo ? "has-photo" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/img/brand/dots.svg" alt="" aria-hidden="true" className="tf-phero-dots" width={300} height={300} />
      <div className="wrap tf-phero-grid">
        <div>
          {crumbs.length > 0 && (
            <nav className="crumbs" aria-label={t("Breadcrumb")}>
              <a href={href("/")}>{t("Home")}</a>
              {crumbs.map(([label, to]) => (
                <span key={to}>
                  <span aria-hidden="true">/ </span>
                  <a href={href(to)}>{t(label)}</a>
                </span>
              ))}
            </nav>
          )}
          <p className="eyebrow rise">{t(eyebrow)}</p>
          <h1 className="rise rise-2">{title}</h1>
          {lede && <p className="lede rise rise-3">{lede}</p>}
          {children && <div className="rise rise-4 tf-phero-actions">{children}</div>}
        </div>
        {photo && (
          <div className="tf-ph tf-ph-hero rise rise-2">
            <Image src={photo} alt={alt && t(alt)} fill priority sizes="(max-width: 860px) 100vw, 50vw" />
          </div>
        )}
      </div>
    </section>
  );
}

/** Section heading: eyebrow, title with an italic word, optional lede. */
export function TfHead({ t, eyebrow, title, lede, id, center = false }: { t: T; eyebrow: string; title: ReactNode; lede?: string; id?: string; center?: boolean }) {
  return (
    <div className={`sec-head ${center ? "center" : ""}`}>
      <p className="eyebrow">{t(eyebrow)}</p>
      <h2 id={id}>{title}</h2>
      {lede && <p>{t(lede)}</p>}
    </div>
  );
}

/** Closing call to action: find a community or talk to us. */
export function TfCta({ t, href, title, lede, photo = "/img/friends-walking.jpg" }: { t: T; href: (p: string) => string; title?: ReactNode; lede?: string; photo?: string }) {
  return (
    <section className="tf-cta" aria-labelledby="tf-cta-h">
      <div className="wrap tf-cta-card">
        <div className="tf-cta-text">
          <p className="eyebrow light">{t("Come and see")}</p>
          <h2 id="tf-cta-h">
            {title ?? (
              <>
                {t("Find the community that ")}
                <em>{t("feels like home.")}</em>
              </>
            )}
          </h2>
          <p>{t(lede ?? "Visit Prairie City Landing in Folsom or Bruceville Point in Elk Grove. Every tour is personal, at a time that suits you.")}</p>
          <div className="btn-row">
            <a className="btn btn-light" href={href("/communities")}>
              {t("Find a community")}
            </a>
            <a className="btn btn-outline-light" href={href("/contact")}>
              {t("Contact us")}
            </a>
          </div>
        </div>
        <div className="tf-cta-ph">
          <Image src={photo} alt="" fill sizes="(max-width: 860px) 100vw, 40vw" />
        </div>
      </div>
    </section>
  );
}
