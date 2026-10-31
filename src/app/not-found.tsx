import { getT } from "@/i18n/server";
import { Icon } from "@/components/Icon";
import { WrenhavenChrome } from "@/components/wrenhaven/WrenhavenChrome";
import { summaries, intoCommunity } from "@/components/wrenhaven/parts";

/** The 404 for anything outside a community: the Wrenhaven chrome and a way back to each community. */
export default async function NotFound() {
  const { t, href, lang } = await getT();
  return (
    <WrenhavenChrome>
      <section className="tf-phero tf-404">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/brand/dots.svg" alt="" aria-hidden="true" className="tf-phero-dots" width={300} height={300} />
        <div className="wrap tf-phero-grid">
          <p className="eyebrow">{t("Page not found")}</p>
          <h1>
            {t("We can’t find ")}
            <em>{t("that page.")}</em>
          </h1>
          <p className="lede">{t("It may have moved, or the address may be mistyped. These will take you somewhere good:")}</p>
          <div className="btn-row">
            {summaries().map((s) => (
              <a key={s.slug} className="btn btn-green" href={intoCommunity(lang, s.slug)}>
                {s.name} <Icon name="arrow" />
              </a>
            ))}
            <a className="btn btn-ghost" href={href("/")}>
              {t("Wrenhaven home")}
            </a>
          </div>
        </div>
      </section>
    </WrenhavenChrome>
  );
}
