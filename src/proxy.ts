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
 *   /en/… and ?lang=xx are tidied into the canonical address. A plain (unprefixed) address always renders in English:
 *   the language only changes when the visitor picks one. The cookie only records that a choice was made, so a
 *   first-time visitor whose browser asks for Spanish or Chinese first is offered the switch until they choose.
 * - Community: /alder-bend/… and /kestrel-point/… are community sites; the rest is the Wrenhaven parent site.
 *   The community is passed to the page in a request header.
 */
export function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();
  const { pathname } = url;

  // The staff workspace inside a /phones clip: ?c=<community>&as=<person> shows that community, signed in as that
  // person, for this request only, without touching the visitor's own staff cookies.
  if (pathname === "/staff" || pathname.startsWith("/staff/")) return staffView(req);
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

  headers.set(LANG_HEADER, "en");
  const suggest = saved ? null : negotiate(req.headers.get("accept-language"));
  if (suggest) headers.set(SUGGEST_HEADER, suggest);
  else headers.delete(SUGGEST_HEADER);
  return NextResponse.next({ request: { headers } });
}

function staffView(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const c = q.get("c");
  const as = q.get("as");
  if (!c && !as) return NextResponse.next();
  const jar = new Map(req.cookies.getAll().map((k) => [k.name, k.value]));
  if (c && /^[a-z-]+$/.test(c)) jar.set("wh-staff-community", c);
  if (as && /^(events|sales|manager|kitchen|desk)$/.test(as)) jar.set("wh-staff-as", as);
  const headers = new Headers(req.headers);
  headers.set("cookie", [...jar].map(([k, v]) => `${k}=${v}`).join("; "));
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Everything except Next internals, the staff system, the /kinlight and /phones screens (not part of the public site)
  // and files (anything with a dot: images, icons, robots.txt).
  matcher: ["/((?!_next/|staff(?:/|$)|kinlight(?:/|$)|phones(?:/|$)|api/|.*\\.).*)", "/staff", "/staff/:path*"],
};
