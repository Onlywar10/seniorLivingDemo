"use client";

import { communities, type Community } from "@/data/communities";
import { usePath } from "@/i18n/client";
import { communityOf, withinCommunity } from "./sites";

/** The community of the current page, or null on the Tenfold parent site. */
export function useMaybeCommunity(): Community | null {
  const slug = communityOf(usePath());
  return slug ? communities[slug] : null;
}

/** For Client Components inside a community: `const c = useCommunity();` (c.site, c.plans, c.eventsOn…). */
export function useCommunity(): Community {
  const slug = communityOf(usePath());
  if (!slug) throw new Error("useCommunity() used outside a community page");
  return communities[slug];
}

/** The current path inside the community ("/bruceville-point/dining" → "/dining"), for active navigation states. */
export const useCommunityPath = () => withinCommunity(usePath());
