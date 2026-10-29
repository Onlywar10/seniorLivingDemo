"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { translateTree, restoreTree } from "./translate";

export type TextSize = "md" | "lg" | "xl";
export type Lang = "en" | "es";

interface Prefs {
  text: TextSize;
  contrast: boolean;
  lang: Lang;
  setText: (v: TextSize) => void;
  setContrast: (v: boolean) => void;
  setLang: (v: Lang) => void;
}

const Ctx = createContext<Prefs>({ text: "md", contrast: false, lang: "en", setText: () => {}, setContrast: () => {}, setLang: () => {} });

const KEY = "larkmoor.prefs";

/** Reader preferences: text size, high contrast and site language. Remembered per browser. */
export function PrefsProvider({ children }: { children: ReactNode }) {
  const [text, setText] = useState<TextSize>("md");
  const [contrast, setContrast] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? "{}");
      if (saved.text) setText(saved.text);
      if (saved.contrast) setContrast(true);
      const q = new URLSearchParams(window.location.search).get("lang");
      if (q === "es" || q === "en") setLang(q);
      else if (saved.lang) setLang(saved.lang);
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    html.dataset.text = text;
    html.dataset.contrast = contrast ? "high" : "normal";
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ text, contrast, lang }));
    } catch {}
  }, [text, contrast, lang, loaded]);

  // Translation: swap visible text in place and keep doing so as the page changes.
  useEffect(() => {
    const html = document.documentElement;
    html.lang = lang;
    if (lang === "en") {
      restoreTree(document.body);
      return;
    }
    let raf = 0;
    const run = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => translateTree(document.body));
    };
    run();
    const mo = new MutationObserver(run);
    mo.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["placeholder", "aria-label"] });
    return () => {
      mo.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [lang]);

  return <Ctx.Provider value={{ text, contrast, lang, setText, setContrast, setLang }}>{children}</Ctx.Provider>;
}

export const usePrefs = () => useContext(Ctx);
