// The site map of the Wrenhaven family: the parent site at the root and one section per community
// (/alder-bend/…, /kestrel-point/…). Small and data-free, so src/proxy.ts can use it.
import { localePath, type Lang } from "@/i18n/config";

export const communitySlugs = ["alder-bend", "kestrel-point"] as const;
export type CommunitySlug = (typeof communitySlugs)[number];
export const isCommunity = (s: string | null | undefined): s is CommunitySlug => !!s && (communitySlugs as readonly string[]).includes(s);

/** Request header set by the proxy: the community the page belongs to (absent on parent pages). */
export const COMMUNITY_HEADER = "x-wh-community";

/** The community a (language-free) path belongs to: "/kestrel-point/dining" → "kestrel-point". */
export function communityOf(path: string): CommunitySlug | null {
  const first = path.split(/[/?#]/)[1];
  return isCommunity(first) ? first : null;
}

/** The path inside its community: "/kestrel-point/dining" → "/dining". */
export function withinCommunity(path: string): string {
  const c = communityOf(path);
  if (!c) return path;
  const rest = path.slice(c.length + 1);
  return rest === "" || rest.startsWith("?") || rest.startsWith("#") ? "/" + rest : rest;
}

/**
 * Where a link goes. Inside a community, site paths are community-relative ("/dining" → "/kestrel-point/dining");
 * "~/…" always means the Wrenhaven parent site ("~/communities" → "/communities"). Then the language prefix is added.
 */
export function sitePath(lang: Lang, community: CommunitySlug | null, path: string): string {
  let p = path;
  if (p.startsWith("~/")) p = p.slice(1);
  else if (community && p.startsWith("/") && !p.startsWith("//") && !communityOf(p) && !/^\/(staff|img|photos)(?=\/|$)/.test(p)) {
    p = p === "/" ? `/${community}` : p.startsWith("/?") || p.startsWith("/#") ? `/${community}${p.slice(1)}` : `/${community}${p}`;
  }
  return localePath(lang, p);
}
