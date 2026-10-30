import { notFound } from "next/navigation";
import { communities, type Community } from "@/data/communities";
import { getCommunitySlug } from "@/i18n/server";

/** For Server Components inside a community: `const c = await getCommunity();` (c.site, c.plans, c.eventsOn…). */
export async function getCommunity(): Promise<Community> {
  const slug = await getCommunitySlug();
  if (!slug) notFound();
  return communities[slug];
}
