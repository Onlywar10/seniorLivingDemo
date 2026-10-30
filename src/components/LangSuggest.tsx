"use client";

import { useState } from "react";
import { useT, usePath } from "@/i18n/client";
import { htmlLang, localePath, LANG_COOKIE } from "@/i18n/config";
import { Icon } from "./Icon";

// Written in the language being offered: the visitor may not read English.
const COPY = {
  es: { line: "Este sitio también está en español.", go: "Ver en español", stay: "Seguir en inglés" },
  zh: { line: "本网站提供简体中文版。", go: "切换到中文", stay: "继续使用英文" },
};

/** Offers the visitor's browser language on their first English page. Dismissing it keeps English. */
export function LangSuggest() {
  const { lang, suggest } = useT();
  const path = usePath();
  const [hidden, setHidden] = useState(false);
  if (hidden || lang !== "en" || !suggest || suggest === "en") return null;
  const c = COPY[suggest];
  const stay = () => {
    document.cookie = `${LANG_COOKIE}=en; path=/; max-age=31536000; samesite=lax`;
    setHidden(true);
  };
  return (
    <div className="lang-suggest" lang={htmlLang[suggest]} role="region" aria-label={c.line}>
      <div className="wrap lang-suggest-inner">
        <Icon name="globe" />
        <p>{c.line}</p>
        <a className="btn btn-sm" href={localePath(suggest, path)}>
          {c.go}
        </a>
        <button type="button" className="lang-suggest-stay" onClick={stay}>
          {c.stay}
        </button>
      </div>
    </div>
  );
}
