"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { stripLang, type Lang } from "./config";
import { translator, type Dict, type T } from "./translate";
import { communityOf, sitePath } from "@/lib/sites";

interface Ctx {
  lang: Lang;
  t: T;
  href: (path: string) => string;
  /** The language the visitor's browser asks for, when it isn't the page's (English pages only). */
  suggest: Lang | null;
}

const LangCtx = createContext<Ctx>({ lang: "en", t: (s) => s, href: (p) => p, suggest: null });

/** Gives Client Components the page language. The dictionary is sent only for non-English pages. */
export function LangProvider({ lang, dict, suggest, children }: { lang: Lang; dict: Dict; suggest: Lang | null; children: ReactNode }) {
  // The community comes from the address, so it stays right across client-side navigation between sites.
  const community = communityOf(stripLang(usePathname() ?? "/"));
  const t = useMemo(() => translator(lang, dict), [lang, dict]);
  const value = useMemo(() => ({ lang, t, href: (p: string) => sitePath(lang, community, p), suggest }), [lang, t, community, suggest]);
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

/**
 * For Client Components: `const { t, href, lang } = useT();`
 * href("/dining") keeps the visitor's language and community; href("~/communities") goes to the parent site.
 */
export const useT = () => useContext(LangCtx);

/** The current path without its language prefix ("/zh/kestrel-point/dining" → "/kestrel-point/dining"), for the language switcher. */
export const usePath = () => stripLang(usePathname() ?? "/");
