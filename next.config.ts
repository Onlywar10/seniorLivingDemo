import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep every page out of search engines and AI crawlers.
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, noimageindex" }] }];
  },
};

export default nextConfig;
