// Community-specific copy for Floor Plans & Pricing (src/app/[community]/floor-plans) and the virtual tour.
// Facts come from each community's site.ts (plans, pricing, living, guides) and its website.
import type { Community } from "@/data/communities";
import { money } from "@/data/shared";
import type { TourPlace } from "@/components/plans/data";
import type { CommunitySlug } from "@/lib/sites";

/** A sentence in pieces: strings are translated one by one, `{ raw }` pieces (prices, names) are not. */
export type Frag = string | { raw: string };

export interface PlansCopy {
  /** The tour's Harbor entry stop. */
  harborEntry: TourPlace["harborEntry"];
  /** One line on the tools strip about the free guides. */
  guidesBlurb: string;
  /** Closing call to action; `who` is "Name, our Role" (or null when no one is named). */
  cta: (who: string | null) => string;
  /** The note under a Harbor plan's features. */
  harborNote: (c: Community, director: string | null) => Frag[];
}

export const plansCopy: Record<CommunitySlug, PlansCopy> = {
  "prairie-city-landing": {
    harborEntry: {
      photo: "/img/harbor-living.jpg",
      alt: "Harbor’s living room with armchairs and a fireplace, just outside the residents’ rooms",
      caption: "Every Harbor room opens onto a bright, home-like neighborhood with its own living room and fireplace.",
      spots: [
        { x: 72, y: 48, label: "Fireplace lounge", text: "The heart of Harbor: armchairs by the fire for coffee, stories and visits with family." },
        { x: 32, y: 62, label: "Easy to find your way", text: "A small, secured neighborhood with clear sight lines, so everyone can find their way home." },
        { x: 88, y: 26, label: "Care Partners close by", text: "Harbor’s own team is on hand day and night, never more than a few steps away." },
      ],
    },
    guidesBlurb: "Nine free guides, from funding sources to VA Aid and Attendance.",
    cta: (who) => (who ? `${who}, will walk you through the apartments that are open now, and lunch is on us.` : "Our team will walk you through the apartments that are open now, and lunch is on us."),
    harborNote: (c, director) => [
      " Harbor studios start at ",
      { raw: money(c.pricing.harbor[0].from) },
      " a month with a shared bath and ",
      { raw: money(c.pricing.harbor[1].from) },
      director ? ` with a private bath. Additional care levels are set by assessment with ${director}.` : " with a private bath. Additional care levels are set by assessment.",
    ],
  },
  "bruceville-point": {
    harborEntry: {
      photo: "/img/harbor-living.jpg", // TODO photo
      alt: "Harbor’s shared living room with armchairs, just outside the residents’ apartments",
      caption: "Every Harbor apartment opens onto a home-like, secured neighborhood with its own living, dining and activity spaces.",
      spots: [
        { x: 72, y: 48, label: "Shared living room", text: "Separate living, dining and activity spaces, just outside your door." },
        { x: 32, y: 62, label: "Something on all day", text: "Activity programming 12 hours a day, 7 days a week, led by a dedicated activity team." },
        { x: 88, y: 26, label: "Care close by", text: "Harbor’s own team is on hand day and night." },
      ],
    },
    guidesBlurb: "Nine free guides, from Senior Living 101 to funding care.",
    cta: (who) => (who ? `${who}, will walk you through the apartments that are open now.` : "Our team will walk you through the apartments that are open now."),
    harborNote: (c, director) => [
      " Harbor studios with a private bath start at ",
      { raw: money(c.pricing.harbor[0].from) },
      " a month, and one-bedrooms at ",
      { raw: money(c.pricing.harbor[1].from) },
      director ? `. Most care services are included, and additional care level rates are set by a personal assessment with ${director}.` : ". Most care services are included, and additional care level rates are set by a personal assessment.",
    ],
  },
};

/** What the virtual tour needs from the community. */
export const tourPlace = (c: Community): TourPlace => ({ city: c.site.address.city, harborEntry: plansCopy[c.slug].harborEntry });
