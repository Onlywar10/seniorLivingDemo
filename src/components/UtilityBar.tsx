"use client";

import { usePrefs, type TextSize } from "@/lib/prefs";
import { community } from "@/data/community";
import { group } from "@/data/group";

const sizes: { v: TextSize; label: string; aria: string }[] = [
  { v: "md", label: "A", aria: "Standard text" },
  { v: "lg", label: "A", aria: "Large text" },
  { v: "xl", label: "A", aria: "Extra large text" },
];

/** Thin bar above the header: licence, text size, contrast and language. */
export function UtilityBar({ community: isCommunity }: { community: boolean }) {
  const { text, setText, contrast, setContrast, lang, setLang } = usePrefs();
  return (
    <div className="utility">
      <div className="wrap utility-inner">
        <p className="utility-lic">{isCommunity ? community.licenceLine : `Family owned since ${group.founded} · six licensed communities`}</p>
        <div className="utility-tools">
          <div className="u-group" role="group" aria-label="Text size">
            <span className="u-label">Text size</span>
            {sizes.map((s, i) => (
              <button key={s.v} type="button" className={`u-size u-size-${i}`} aria-pressed={text === s.v} aria-label={s.aria} onClick={() => setText(s.v)}>
                {s.label}
              </button>
            ))}
          </div>
          <button type="button" className="u-btn" aria-pressed={contrast} onClick={() => setContrast(!contrast)}>
            <span className="u-contrast" aria-hidden="true" />
            High contrast
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
