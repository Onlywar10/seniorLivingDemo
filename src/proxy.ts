import { NextResponse, type NextRequest } from "next/server";
import { isLang, localePath, negotiate, stripLang, LANG_COOKIE, LANG_HEADER, SUGGEST_HEADER, type Lang } from "./i18n/config";
import { communityOf, COMMUNITY_HEADER } from "./lib/sites";

const YEAR = 60 * 60 * 24 * 365;

// Addresses from before the Wrenhaven parent site existed, when Alder Bend was the whole site.
// Pages the parent site also has (/about, /lifestyle, /contact, /living/independent-living…) now belong to the parent.
const LEGACY_AB = /^\/(living$|floor-plans|care-assessment|cost-comparison|calendar|dining|events-adventures|fitness|spaces|team|news|guides|faq|tour|stay-connected)(?=\/|$)/;

function remember(res: NextResponse, lang: Lang) {
  res.cookies.set(LANG_COOKIE, lang, { path: "/", maxAge: YEAR, sameSite: "lax" });
  return res;
}

/**
 * Routing for the public sites.
 * - Language: /es/… and /zh/… render the same pages in Spanish or Chinese (rewrite + a request header the pages read).
 *   /en/… and ?lang=xx are tidied into the canonical address and the choice is remembered. A plain address follows the
 *   remembered choice; with no choice yet it renders in English and, when the browser asks for Spanish or Chinese first,
 *   the page offers to switch.
 * - Community: /alder-bend/… and /kestrel-point/… are community sites; the rest is the Wrenhaven parent site.
 *   The community is passed to the page in a request header.
 */
export function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();
  const { pathname } = url;
  const first = pathname.split("/")[1];

  const asked = url.searchParams.get("lang");
  if (isLang(asked)) {
    url.searchParams.delete("lang");
    url.pathname = localePath(asked, pathname);
    return remember(NextResponse.redirect(url), asked);
  }

  if (first === "en") {
    url.pathname = stripLang(pathname);
    return remember(NextResponse.redirect(url), "en");
  }

  const bare = stripLang(pathname);
  if (LEGACY_AB.test(bare)) {
    url.pathname = localePath(isLang(first) ? first : "en", `/alder-bend${bare}`);
    return NextResponse.redirect(url, 308);
  }

  const headers = new Headers(req.headers);
  const community = communityOf(bare);
  if (community) headers.set(COMMUNITY_HEADER, community);
  else headers.delete(COMMUNITY_HEADER);

  if (first === "es" || first === "zh") {
    url.pathname = bare;
    headers.set(LANG_HEADER, first);
    headers.delete(SUGGEST_HEADER);
    const res = NextResponse.rewrite(url, { request: { headers } });
    return req.cookies.get(LANG_COOKIE)?.value === first ? res : remember(res, first);
  }

  const saved = req.cookies.get(LANG_COOKIE)?.value;
  if (saved === "es" || saved === "zh") {
    url.pathname = localePath(saved, pathname);
    return NextResponse.redirect(url);
  }

  headers.set(LANG_HEADER, "en");
  const suggest = saved ? null : negotiate(req.headers.get("accept-language"));
  if (suggest) headers.set(SUGGEST_HEADER, suggest);
  else headers.delete(SUGGEST_HEADER);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Everything except Next internals, the staff system and files (anything with a dot: images, icons, robots.txt).
  matcher: ["/((?!_next/|staff(?:/|$)|api/|.*\\.).*)"],
};
