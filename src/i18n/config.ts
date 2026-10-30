// Site languages. English lives at the plain URL (/dining); the others under a prefix (/es/dining, /zh/dining).
// src/proxy.ts reads the prefix, remembers the choice in a cookie and tells the page which language to render.

export const locales = ["en", "es", "zh"] as const;
export type Lang = (typeof locales)[number];

export const isLang = (s: string | null | undefined): s is Lang => !!s && (locales as readonly string[]).includes(s);

/** The value for <html lang> and hreflang. */
export const htmlLang: Record<Lang, string> = { en: "en", es: "es", zh: "zh-Hans" };

/** Each language named in itself, for the switcher. */
export const langNames: Record<Lang, string> = { en: "English", es: "Español", zh: "中文" };

export const LANG_COOKIE = "pcl-lang";
/** Request headers set by the proxy for the page render. */
export const LANG_HEADER = "x-pcl-lang";
export const SUGGEST_HEADER = "x-pcl-lang-suggest";

const PREFIX = /^\/(en|es|zh)(?=\/|$|[?#])/;

/** "/zh/dining" → "/dining"; "/es" → "/" */
export function stripLang(path: string): string {
  const out = path.replace(PREFIX, "");
  return out === "" || out.startsWith("?") || out.startsWith("#") ? "/" + out : out;
}

/** The language a pathname is in: "/zh/dining" → "zh", "/dining" → "en". */
export function langFromPath(path: string): Lang {
  const m = path.match(PREFIX);
  return m && isLang(m[1]) ? m[1] : "en";
}

/** Site path in a language: ("zh", "/dining") → "/zh/dining". External links, anchors and the staff system are left alone. */
export function localePath(lang: Lang, path: string): string {
  if (!path.startsWith("/") || path.startsWith("//") || /^\/staff(?=\/|$|[?#])/.test(path) || /^\/(img|photos)\//.test(path)) return path;
  const bare = stripLang(path);
  if (lang === "en") return bare;
  return bare === "/" ? `/${lang}` : bare.startsWith("/?") || bare.startsWith("/#") ? `/${lang}${bare.slice(1)}` : `/${lang}${bare}`;
}

/**
 * The best site language for an Accept-Language header, or null when English comes first (or nothing matches).
 * Any Chinese (zh, zh-CN, zh-Hans, zh-TW…) maps to our Simplified Chinese.
 */
export function negotiate(header: string | null): Lang | null {
  if (!header) return null;
  const tags = header
    .split(",")
    .map((part, i) => {
      const [tag, ...params] = part.trim().toLowerCase().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      return { tag, q: q ? Number(q.slice(2)) || 0 : 1, i };
    })
    .filter((x) => x.tag && x.q > 0)
    .sort((a, b) => b.q - a.q || a.i - b.i);
  for (const { tag } of tags) {
    const base = tag.split("-")[0];
    if (base === "en") return null;
    if (base === "es" || base === "zh") return base;
  }
  return null;
}
