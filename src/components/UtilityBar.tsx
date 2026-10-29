"use client";

import { usePrefs, type TextSize } from "@/lib/prefs";
import { site } from "@/data/site";
import { Icon } from "./Icon";

const sizes: { v: TextSize; aria: string }[] = [
  { v: "md", aria: "Standard text" },
  { v: "lg", aria: "Large text" },
  { v: "xl", aria: "Extra large text" },
];

/** Thin bar above the header: licence, address, text size, contrast and language. */
export function UtilityBar() {
  const { text, setText, contrast, setContrast, lang, setLang } = usePrefs();
  return (
    <div className="utility">
      <div className="wrap utility-inner">
        <p className="utility-lic">
          <span>{site.licence}</span>
          <a className="u-hide" href={site.mapsUrl} target="_blank" rel="noreferrer">
            <Icon name="pin" /> {site.addressLine}
          </a>
        </p>
        <div className="utility-tools">
          <div className="u-group" role="group" aria-label="Text size">
            <span className="u-label">Text size</span>
            {sizes.map((s, i) => (
              <button key={s.v} type="button" className={`u-size u-size-${i}`} aria-pressed={text === s.v} aria-label={s.aria} onClick={() => setText(s.v)}>
                A
              </button>
            ))}
          </div>
          <button type="button" className="u-btn" aria-pressed={contrast} onClick={() => setContrast(!contrast)}>
            <Icon name="eye" /> High contrast
          </button>
          <div className="u-group" role="group" aria-label="Language" data-no-translate>
            <button type="button" className="u-btn" aria-pressed={lang === "en"} lang="en" onClick={() => setLang("en")}>
              English
            </button>
            <button type="button" className="u-btn" aria-pressed={lang === "es"} lang="es" onClick={() => setLang("es")}>
              Español
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
