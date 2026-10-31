"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type TextSize = "md" | "lg" | "xl";

interface Prefs {
  text: TextSize;
  contrast: boolean;
  setText: (v: TextSize) => void;
  setContrast: (v: boolean) => void;
}

const Ctx = createContext<Prefs>({ text: "md", contrast: false, setText: () => {}, setContrast: () => {} });

const KEY = "wh.prefs";

/** Reader preferences: text size and high contrast. Remembered per browser. (The language is in the URL.) */
export function PrefsProvider({ children }: { children: ReactNode }) {
  const [text, setText] = useState<TextSize>("md");
  const [contrast, setContrast] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? "{}");
      if (saved.text) setText(saved.text);
      if (saved.contrast) setContrast(true);
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    html.dataset.text = text;
    html.dataset.contrast = contrast ? "high" : "normal";
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ text, contrast }));
    } catch {}
  }, [text, contrast, loaded]);

  return <Ctx.Provider value={{ text, contrast, setText, setContrast }}>{children}</Ctx.Provider>;
}

export const usePrefs = () => useContext(Ctx);
