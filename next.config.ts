import type { NextConfig } from "next";

// The staff workspace was reorganised by job (Today, Post, Calendar, Menus, People, Prospects, Reports, Settings).
// Old addresses still work: each one goes to where that job lives now.
const staffMoves: [string, string][] = [
  ["dashboard", "today"],
  ["alerts", "today"],
  ["approvals", "today"],
  ["publish", "post"],
  ["photo-post", "post?type=photo"],
  ["calendar/menus", "menus"],
  ["sign-ups", "calendar"],
  ["attendance", "today"],
  ["suggestions", "calendar"],
  ["families", "people"],
  ["tours", "prospects"],
  ["apartments", "prospects"],
  ["scorecard", "reports"],
  ["surveys", "reports/surveys"],
  ["seo", "reports/search"],
  ["geo", "reports/search"],
  ["leadership", "reports/communities"],
  ["team", "settings"],
  ["library", "settings"],
];

const nextConfig: NextConfig = {
  // Keep every page out of search engines and AI crawlers.
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, noimageindex" }] }];
  },
  async redirects() {
    return staffMoves.map(([from, to]) => ({ source: `/staff/${from}`, destination: `/staff/${to}`, permanent: false }));
  },
};

export default nextConfig;
