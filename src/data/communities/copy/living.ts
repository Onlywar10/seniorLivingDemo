// Community-specific copy for the Living Options pages (src/app/[community]/living/*).
// Facts come from each community's site.ts (living, pricing, plans, team, testimonials) and its website.
import type { Community } from "@/data/communities";
import type { LivingKey, TeamMember } from "@/data/shared";
import type { CommunitySlug } from "@/lib/sites";

/** The people the living pages, plans and tools point to, found by role (null when the community lists no one). */
export function keyPeople(c: Community) {
  const find = (re: RegExp): TeamMember | null => c.team.find((m) => re.test(m.role)) ?? null;
  return {
    relations: find(/^Community Relations Director$/),
    residentServices: find(/^Resident Services Director$/),
    harbor: find(/Harbor/),
    fitness: find(/^Fitness Director$/),
  };
}

/** "Cynthia" from "Cynthia Bazin"; null for an unnamed role. */
export const firstName = (m: TeamMember | null) => (m && !m.unnamed ? m.name.split(" ")[0] : null);

/** The phone line for a person: "(916) 458-0303, ext. 110", or just the main number. */
export const phoneWithExt = (c: Community, m: TeamMember | null) => (m?.ext ? `${c.site.phone}, ext. ${m.ext}` : c.site.phone);

type IconName = "star" | "fork" | "sun" | "spark" | "heart" | "globe";

export interface LivingCopy {
  overviewMeta: string;
  independentMeta: string;
  assistedMeta: string;
  harborMeta: string;
  /** "Your home" row of the comparison table. Independent Living's is built from the plans. */
  compareHome: Omit<Record<LivingKey, string>, "independent">;
  compareIncluded: string;
  /** The Community Relations Director's card on the Independent Living page (default: their team bio). */
  relationsBio?: string;
  /** Assisted Living: why services come to you. */
  assistedWhy: string;
  /** An extra service card (PCL's apartments near the team), if the community has one. */
  assistedExtra?: { title: string; text: string };
  /** The director's card on the Assisted Living page. */
  assistedBio?: string;
  assistedQuote?: string;
  harborLede: string;
  harborApproach: string;
  harborEaLede: string;
  harborOutings: { icon: IconName; label: string }[];
  harborProgram: string[];
  /** Short checks under the Harbor programme. */
  harborChecks: string[];
  harborPricingNote: string;
  harborBio?: string;
}

export const livingCopy: Record<CommunitySlug, LivingCopy> = {
  "prairie-city-landing": {
    overviewMeta: "Independent Living from $5,950 a month, Assisted Living Services delivered in every apartment, and Harbor Memory Care at Prairie City Landing in Folsom, CA.",
    independentMeta: "Luxury Independent Living apartments up to 1,417 sq ft in Folsom, CA, from $5,950 a month. Full kitchens, in-apartment washer and dryer, no second-person fee, and pets welcome.",
    assistedMeta: "Assisted Living Services delivered discreetly in every apartment at Prairie City Landing, Folsom. $850 a month base support fee plus personal care by care plan — you never have to move.",
    harborMeta: "Harbor Memory Care at Prairie City Landing, Folsom: an environment of youthful optimism, with its own Events & Adventures, weekly outings and a secured courtyard. Studios from $6,400 a month.",
    compareHome: {
      assisted: "Stay in your own apartment, or choose a studio or one-bedroom near the Care Partner team",
      harbor: "Private studios in a secured neighborhood with its own courtyard",
    },
    compareIncluded: "Every option includes housekeeping, utilities, internet and cable, maintenance, scheduled transportation and all three restaurants.",
    relationsBio: "Cynthia leads every tour, answers every question about apartments and pricing, and helps families plan a move at their own pace.",
    assistedWhy: "Many communities ask residents to move to a different building, floor or wing when they need more help. At Prairie City Landing, support is delivered discreetly by the Tenfold resident services team, right where you already live — next to the neighbours you know, with the routines you love.",
    assistedExtra: { title: "Apartments near the team", text: "A limited number of studios and one-bedrooms tailored for assisted living, close to the Care Partner team." },
    assistedBio: "Jan leads the Care Partner team, completes every pre-move-in assessment and builds each resident’s care plan together with families and healthcare providers.",
    assistedQuote: "“Families often expect a big conversation about moving. Here it’s a conversation about what would make your days easier.”",
    harborLede: "Harbor is our secured memory care neighborhood — home-like, bright and busy, with its own courtyard, its own Events & Adventures and a team that starts every day by asking what’s possible.",
    harborApproach: "At Harbor, a diagnosis doesn’t decide what a day looks like. Residents go bowling, eat out, garden, paint, sing and paddle — with Care Partners who know their stories and plan around their strengths.",
    harborEaLede: "Harbor has its own Events & Adventures program, with an outing every week.",
    harborOutings: [
      { icon: "star", label: "Bowling" },
      { icon: "fork", label: "Local restaurants" },
      { icon: "sun", label: "Golf" },
      { icon: "spark", label: "Camping" },
      { icon: "heart", label: "Visiting horses" },
      { icon: "globe", label: "Stand-up paddling" },
    ],
    harborProgram: ["Live music", "Ceramics", "Pet therapy with Thor", "Therapeutic storytelling", "Literature review", "Gardening", "Museum outings", "Simplified fitness", "Reminiscence & photo albums", "Harbor Helpers"],
    harborChecks: [
      "A simplified fitness program designed by our Fitness Director, Jason Cherry",
      "Purposeful roles in everyday life — setting tables, folding, tending the garden",
      "Invited to every community event, from happy hour to the holiday parties",
    ],
    harborPricingNote: "Harbor pricing includes care, meals in Harbor’s own dining room, housekeeping, laundry and the full Harbor program.",
    harborBio: "Janelle runs Harbor with an eye for possibility — turning ‘we can’t’ into ‘how can we…’ for every resident and family.",
  },
  "bruceville-point": {
    overviewMeta: "Independent Living from $5,100 a month, Assisted Living Services delivered in every apartment, and Harbor Memory Care at Bruceville Point in Elk Grove, CA.",
    independentMeta: "Luxury Independent Living apartments up to 1,184 sq ft in Elk Grove, CA, from $5,100 a month. Full kitchens, in-apartment washer and dryer, no second-person fee, and pets welcome.",
    assistedMeta: "Assisted Living Services delivered privately in every apartment at Bruceville Point, Elk Grove. $950 a month base support fee plus personal care by care plan — you never have to move.",
    harborMeta: "Harbor Memory Care at Bruceville Point, Elk Grove: 22 private apartments, activity programming 12 hours a day, outings beyond the community and a secure courtyard with a putting green. Studios from $8,750 a month.",
    compareHome: {
      assisted: "Stay in your own apartment — services come to you",
      harbor: "22 private apartments with private baths, in a secured neighborhood with its own courtyard",
    },
    compareIncluded: "Every option includes weekly housekeeping, utilities, internet and cable, all maintenance and a 24-hour team on site.",
    assistedWhy: "Many communities ask residents to move to a different building, floor or wing when they need more help. At Bruceville Point, Assisted Living Services are available in every apartment, delivered privately by the Tenfold resident services team, right where you already live — next to the neighbours you know, with the routines you love.",
    harborLede: "Harbor is our secured memory care neighborhood of 22 private apartments — home-like, with its own courtyard and putting green, its own Events & Adventures calendar and activity programming 12 hours a day, 7 days a week.",
    harborApproach: "At Harbor, a diagnosis doesn’t decide what a day looks like. Residents make ceramics, garden, listen to music, play golf and even paddle — with a team that turns ‘we can’t’ into ‘how can we…?’ every day.",
    harborEaLede: "Harbor has its own Events & Adventures calendar, with outings beyond the community.",
    harborOutings: [
      { icon: "globe", label: "Museum outings" },
      { icon: "sun", label: "Golf" },
      { icon: "spark", label: "Camping" },
      { icon: "heart", label: "Visiting horses" },
      { icon: "star", label: "Stand-up paddling" },
    ],
    harborProgram: ["Music", "Ceramics", "Pet therapy", "Therapeutic storytelling", "Literature review", "Gardening", "Museum outings", "Daily fitness classes"],
    harborChecks: [
      "Daily fitness classes designed by our Fitness Director, Tina Trillo",
      "Meals prepared within Harbor, with separate living, dining and activity spaces",
      "Welcome at every community event",
    ],
    harborPricingNote: "Most care services, such as help with medications, bathing and escorts to meals, are included in Harbor’s base rent. Additional care level rates are set by a personal assessment.",
  },
};
