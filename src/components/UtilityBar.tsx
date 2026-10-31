"use client";

import { usePrefs, type TextSize } from "@/lib/prefs";
import { useMaybeCommunity } from "@/lib/community";
import { useT, usePath } from "@/i18n/client";
import { htmlLang, langNames, localePath, locales } from "@/i18n/config";
import { Icon } from "./Icon";

const sizes: { v: TextSize; aria: string }[] = [
  { v: "md", aria: "Standard text" },
  { v: "lg", aria: "Large text" },
  { v: "xl", aria: "Extra large text" },
];

/** Thin bar above the header: licence and address (community pages), text size, contrast and language. Used on every public site. */
export function UtilityBar() {
  const { text, setText, contrast, setContrast } = usePrefs();
  const { t, lang } = useT();
  // On the Wrenhaven parent site there is no licence or address to show.
  const community = useMaybeCommunity();
  const path = usePath();
  return (
    <div className="utility">
      <div className="wrap utility-inner">
        <p className="utility-lic">
          {community ? (
            <>
              <span>{t(community.site.licence)}</span>
              <a className="u-hide" href={community.site.mapsUrl} target="_blank" rel="noreferrer">
                <Icon name="pin" /> {community.site.addressLine}
              </a>
            </>
          ) : (
            <span>{t("Luxury senior living in Fairhollow and Rivermead, California")}</span>
          )}
        </p>
        <div className="utility-tools">
          <div className="u-group" role="group" aria-label={t("Text size")}>
            <span className="u-label">{t("Text size")}</span>
            {sizes.map((s, i) => (
              <button key={s.v} type="button" className={`u-size u-size-${i}`} aria-pressed={text === s.v} aria-label={t(s.aria)} onClick={() => setText(s.v)}>
                A
              </button>
            ))}
          </div>
          <button type="button" className="u-btn" aria-pressed={contrast} onClick={() => setContrast(!contrast)}>
            <Icon name="eye" /> {t("High contrast")}
          </button>
          {/* Each language is named in itself. A full page load, so the whole page renders in the new language. */}
          <nav className="u-group" aria-label={t("Language")}>
            <Icon name="globe" />
            {locales.map((l) => (
              <a key={l} className="u-btn" href={l === "en" ? `/en${path === "/" ? "" : path}` : localePath(l, path)} hrefLang={htmlLang[l]} lang={htmlLang[l]} aria-current={l === lang ? "true" : undefined}>
                {langNames[l]}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
