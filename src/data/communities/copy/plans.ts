// Community-specific copy for Floor Plans & Pricing (src/app/[community]/floor-plans) and the virtual tour.
// Prices and plan codes come from each community's site.ts (plans, pricing, living, guides).
import type { Community } from "@/data/communities";
import { money } from "@/data/shared";
import type { TourPlace } from "@/components/plans/data";
import type { CommunitySlug } from "@/lib/sites";

/** A sentence in pieces: strings are translated one by one, `{ raw }` pieces (prices, names) are not. */
export type Frag = string | { raw: string };

export interface PlansCopy {
  /** The tour's Lantern entry stop. */
  lanternEntry: TourPlace["lanternEntry"];
  /** One line on the tools strip about the free guides. */
  guidesBlurb: string;
  /** Closing call to action; `who` is "Name, our Role" (or null when no one is named). */
  cta: (who: string | null) => string;
  /** The note under a Lantern plan's features. */
  lanternNote: (c: Community, director: string | null) => Frag[];
}

export const plansCopy: Record<CommunitySlug, PlansCopy> = {
  "alder-bend": {
    lanternEntry: {
      photo: "/img/lantern-living.jpg",
      alt: "Lantern’s living room with armchairs and a fireplace, just outside the residents’ rooms",
      caption: "Each Lantern room opens onto a small, bright neighborhood with a living room and fireplace of its own.",
      spots: [
        { x: 72, y: 48, label: "Fireplace lounge", text: "Where Lantern gathers: armchairs by the fire for morning coffee, old stories and family visits." },
        { x: 32, y: 62, label: "Easy to find your way", text: "A compact, secured neighborhood laid out with clear sight lines, so finding your own door is easy." },
        { x: 88, y: 26, label: "Care Partners close by", text: "Lantern’s own team is here day and night, always just a few steps away." },
      ],
    },
    guidesBlurb: "Nine free guides, from funding sources to VA Aid and Attendance.",
    cta: (who) => (who ? `${who}, will walk you through the apartments that are open now, and lunch is on us.` : "Our team will walk you through the apartments that are open now, and lunch is on us."),
    lanternNote: (c, director) => [
      " Lantern studios start at ",
      { raw: money(c.pricing.lantern[0].from) },
      " a month with a shared bath and ",
      { raw: money(c.pricing.lantern[1].from) },
      director ? ` with a private bath. Additional care levels are set by assessment with ${director}.` : " with a private bath. Additional care levels are set by assessment.",
    ],
  },
  "kestrel-point": {
    lanternEntry: {
      photo: "/img/lantern-living.jpg",
      alt: "Lantern’s shared living room with armchairs, just outside the residents’ apartments",
      caption: "Each Lantern apartment opens onto a secured neighborhood with living, dining and activity rooms of its own.",
      spots: [
        { x: 72, y: 48, label: "Shared living room", text: "Rooms for meals, activities and quiet time, right outside your door." },
        { x: 32, y: 62, label: "Something on all day", text: "Twelve hours of activities every day of the week, run by Lantern’s own activity team." },
        { x: 88, y: 26, label: "Care close by", text: "Lantern’s own team is on hand day and night." },
      ],
    },
    guidesBlurb: "Nine free guides, from Senior Living 101 to funding care.",
    cta: (who) => (who ? `${who}, will walk you through the apartments that are open now.` : "Our team will walk you through the apartments that are open now."),
    lanternNote: (c, director) => [
      " Lantern studios with a private bath start at ",
      { raw: money(c.pricing.lantern[0].from) },
      " a month, and one-bedrooms at ",
      { raw: money(c.pricing.lantern[1].from) },
      director ? `. Most care services are included, and additional care level rates are set by a personal assessment with ${director}.` : ". Most care services are included, and additional care level rates are set by a personal assessment.",
    ],
  },
};

/** What the virtual tour needs from the community. */
export const tourPlace = (c: Community): TourPlace => ({ city: c.site.address.city, lanternEntry: plansCopy[c.slug].lanternEntry });
