// Community-specific copy for News, Guides and Stay Connected.
import type { CommunitySlug } from "@/lib/sites";

export interface InfoCopy {
  /** "Life at …" / "More from …" on the news pages. */
  newsPlace: string;
  guidesMetaDescription: string;
  /** Stay Connected: "What's for dinner" perk text. */
  dinnerPerk: string;
  /** Stay Connected: the "Prefer paper?" card, where printed calendars are offered. */
  paper: string | null;
}

export const infoCopy: Record<CommunitySlug, InfoCopy> = {
  "prairie-city-landing": {
    newsPlace: "the Landing",
    guidesMetaDescription: "Free guides to choosing and paying for senior living: care options, costs, funding sources, insurance, VA Aid and Attendance, safety and staying social.",
    dinnerPerk: "The daily specials from the Cypress Room and Natoma Café.",
    paper: "Large-print calendars are at the front desk every month, and we’re happy to mail one to you. Just ask when you call.",
  },
  "bruceville-point": {
    newsPlace: "Bruceville Point",
    guidesMetaDescription: "Free Tenfold guides to choosing and paying for senior living: independent living, assisted living, memory care, funding care, staying at home and making the decision as a family.",
    dinnerPerk: "The daily specials from the Cypress Room and Stone Lakes Cafe.",
    paper: null,
  },
};
