import { headers } from "next/headers";
import { isLang, LANG_HEADER, type Lang } from "./config";
import { translator, type Dict } from "./translate";
import { COMMUNITY_HEADER, isCommunity, sitePath, type CommunitySlug } from "@/lib/sites";
import { es } from "./es";
import { zh } from "./zh";

export const dictionaries: Record<Lang, Dict> = { en: {}, es, zh };

/** The language of the current request, as set by src/proxy.ts. */
export async function getLang(): Promise<Lang> {
  const l = (await headers()).get(LANG_HEADER);
  return isLang(l) ? l : "en";
}

/** The community of the current request (null on Wrenhaven parent pages), as set by src/proxy.ts. */
export async function getCommunitySlug(): Promise<CommunitySlug | null> {
  const c = (await headers()).get(COMMUNITY_HEADER);
  return isCommunity(c) ? c : null;
}

/**
 * For Server Components: `const { t, href, lang } = await getT();`
 * href("/dining") keeps the visitor's language and community; href("~/communities") goes to the parent site.
 */
export async function getT() {
  const [lang, community] = await Promise.all([getLang(), getCommunitySlug()]);
  return { lang, t: translator(lang, dictionaries[lang]), href: (path: string) => sitePath(lang, community, path) };
}
