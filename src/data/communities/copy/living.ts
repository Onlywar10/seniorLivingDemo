// Community-specific copy for the Living Options pages (src/app/[community]/living/*).
// Prices, plans and people come from each community's site.ts (living, pricing, plans, team, testimonials).
import type { Community } from "@/data/communities";
import type { LivingKey, TeamMember } from "@/data/shared";
import type { CommunitySlug } from "@/lib/sites";

/** The people the living pages, plans and tools point to, found by role (null when the community lists no one). */
export function keyPeople(c: Community) {
  const find = (re: RegExp): TeamMember | null => c.team.find((m) => re.test(m.role)) ?? null;
  return {
    relations: find(/^Community Relations Director$/),
    residentServices: find(/^Resident Services Director$/),
    lantern: find(/Lantern/),
    fitness: find(/^Fitness Director$/),
  };
}

/** "Priya" from "Priya Nandakumar"; null for an unnamed role. */
export const firstName = (m: TeamMember | null) => (m && !m.unnamed ? m.name.split(" ")[0] : null);

/** The phone line for a person: "(916) 555-0140, ext. 110", or just the main number. */
export const phoneWithExt = (c: Community, m: TeamMember | null) => (m?.ext ? `${c.site.phone}, ext. ${m.ext}` : c.site.phone);

type IconName = "star" | "fork" | "sun" | "spark" | "heart" | "globe";

export interface LivingCopy {
  overviewMeta: string;
  independentMeta: string;
  assistedMeta: string;
  lanternMeta: string;
  /** "Your home" row of the comparison table. Independent Living's is built from the plans. */
  compareHome: Omit<Record<LivingKey, string>, "independent">;
  compareIncluded: string;
  /** The Community Relations Director's card on the Independent Living page (default: their team bio). */
  relationsBio?: string;
  /** Assisted Living: why services come to you. */
  assistedWhy: string;
  /** An extra service card (AB's apartments near the team), if the community has one. */
  assistedExtra?: { title: string; text: string };
  /** The director's card on the Assisted Living page. */
  assistedBio?: string;
  assistedQuote?: string;
  lanternLede: string;
  lanternApproach: string;
  lanternEaLede: string;
  lanternOutings: { icon: IconName; label: string }[];
  lanternProgram: string[];
  /** Short checks under the Lantern programme. */
  lanternChecks: string[];
  lanternPricingNote: string;
  lanternBio?: string;
}

export const livingCopy: Record<CommunitySlug, LivingCopy> = {
  "alder-bend": {
    overviewMeta: "Independent Living from $5,950 a month, Assisted Living Services delivered in every apartment, and Lantern Memory Care at Alder Bend in Fairhollow, CA.",
    independentMeta: "Luxury Independent Living apartments up to 1,417 sq ft in Fairhollow, CA, from $5,950 a month. Full kitchens, in-apartment washer and dryer, no second-person fee, and pets welcome.",
    assistedMeta: "Assisted Living Services delivered discreetly in every apartment at Alder Bend, Fairhollow. $850 a month base support fee plus personal care by care plan — you never have to move.",
    lanternMeta: "Lantern Memory Care at Alder Bend, Fairhollow: a hopeful, busy neighborhood with its own Events & Adventures, an outing every week and a secured courtyard. Studios from $6,400 a month.",
    compareHome: {
      assisted: "Stay in your own apartment, or choose a studio or one-bedroom near the Care Partner team",
      lantern: "Private studios in a secured neighborhood with its own courtyard",
    },
    compareIncluded: "Every option includes housekeeping, utilities, internet and cable, maintenance, scheduled transportation and all three restaurants.",
    relationsBio: "Priya gives every tour, fields every question about apartments and prices, and helps families plan a move on their own timeline.",
    assistedWhy: "In a lot of places, needing more help means packing up for another wing, floor or building. At Alder Bend, the Wrenhaven resident services team brings that help to the apartment you already call home, so you keep your neighbors and your routines.",
    assistedExtra: { title: "Apartments near the team", text: "A small number of studios and one-bedrooms set up for assisted living, a short walk from the Care Partner team." },
    assistedBio: "Colleen leads the Care Partner team. She meets every new resident for the pre-move-in assessment, then writes each care plan with the family and the resident’s own doctors.",
    assistedQuote: "“People come in braced to talk about moving. We’d rather talk about what would make Tuesday easier.”",
    lanternLede: "Lantern is our secured memory care neighborhood: warm, bright and full of things to do, with a courtyard and an Events & Adventures program of its own, and a team that plans each day around what residents can still enjoy.",
    lanternApproach: "A diagnosis doesn’t get to write the day at Lantern. Residents bowl, eat out, garden, paint, sing and even paddle, alongside Care Partners who know their life stories and build on what they do well.",
    lanternEaLede: "Lantern runs an Events & Adventures program of its own, with an outing every week.",
    lanternOutings: [
      { icon: "star", label: "Bowling" },
      { icon: "fork", label: "Local restaurants" },
      { icon: "sun", label: "Golf" },
      { icon: "spark", label: "Camping" },
      { icon: "heart", label: "Visiting horses" },
      { icon: "globe", label: "Lake days" },
    ],
    lanternProgram: ["Live music", "Ceramics", "Pet therapy with Thor", "Therapeutic storytelling", "Literature review", "Gardening", "Museum outings", "Simplified fitness", "Reminiscence & photo albums", "Lantern Helpers"],
    lanternChecks: [
      "A simplified fitness program designed by our Fitness Director, Devin Marsh",
      "Real jobs to do each day, like setting tables, folding laundry and watering the garden",
      "A seat at every community event, from happy hour to the holiday parties",
    ],
    lanternPricingNote: "Lantern pricing includes care, meals in Lantern’s own dining room, housekeeping, laundry and the full Lantern program.",
    lanternBio: "Maribel runs Lantern on one question, asked about every resident and family: what would make today a good day?",
  },
  "kestrel-point": {
    overviewMeta: "Independent Living from $5,100 a month, Assisted Living Services delivered in every apartment, and Lantern Memory Care at Kestrel Point in Rivermead, CA.",
    independentMeta: "Luxury Independent Living apartments up to 1,184 sq ft in Rivermead, CA, from $5,100 a month. Full kitchens, in-apartment washer and dryer, no second-person fee, and pets welcome.",
    assistedMeta: "Assisted Living Services delivered privately in every apartment at Kestrel Point, Rivermead. $950 a month base support fee plus personal care by care plan — you never have to move.",
    lanternMeta: "Lantern Memory Care at Kestrel Point, Rivermead: 22 private apartments, activity programming 12 hours a day, outings beyond the community and a secure courtyard with a putting green. Studios from $8,750 a month.",
    compareHome: {
      assisted: "Stay in your own apartment — services come to you",
      lantern: "22 private apartments with private baths, in a secured neighborhood with its own courtyard",
    },
    compareIncluded: "Every option includes weekly housekeeping, utilities, internet and cable, all maintenance and a 24-hour team on site.",
    assistedWhy: "In a lot of places, needing more help means packing up for another wing, floor or building. At Kestrel Point, Assisted Living Services are available in every apartment: the Wrenhaven resident services team brings that help to the home you already have, so you keep your neighbors and your routines.",
    lanternLede: "Lantern is our secured memory care neighborhood of 22 private apartments, with a courtyard and putting green of its own, its own Events & Adventures calendar, and activities twelve hours a day, every day of the week.",
    lanternApproach: "A diagnosis doesn’t get to write the day at Lantern. Residents throw pots, garden, enjoy music, putt on the green and even paddle, with a team that looks for what’s still possible before anything else.",
    lanternEaLede: "Lantern keeps an Events & Adventures calendar of its own, with regular outings beyond the front gate.",
    lanternOutings: [
      { icon: "globe", label: "Museum outings" },
      { icon: "sun", label: "Golf" },
      { icon: "spark", label: "Camping" },
      { icon: "heart", label: "Visiting horses" },
      { icon: "star", label: "Lake days" },
    ],
    lanternProgram: ["Music", "Ceramics", "Pet therapy", "Therapeutic storytelling", "Literature review", "Gardening", "Museum outings", "Daily fitness classes"],
    lanternChecks: [
      "Daily fitness classes designed by our Fitness Director, Kara Lindqvist",
      "Meals cooked inside Lantern, with separate rooms for living, dining and activities",
      "Welcome at every community event",
    ],
    lanternPricingNote: "Lantern’s base rent already covers most care, including help with medications, bathing and getting to meals. Rates for additional care levels are set by a personal assessment.",
  },
};
