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
  "alder-bend": {
    newsPlace: "Alder Bend",
    guidesMetaDescription: "Free, plain-English guides for families: comparing care options, what senior living costs, ways to pay for it, insurance, VA Aid and Attendance, home safety and staying social.",
    dinnerPerk: "The daily specials from the Juniper Room and Millpond Café.",
    paper: "Each month’s large-print calendar is waiting at the front desk, and we’ll gladly post one to you. Just mention it when you call.",
  },
  "kestrel-point": {
    newsPlace: "Kestrel Point",
    guidesMetaDescription: "Free Wrenhaven guides for families: independent living, assisted living and memory care explained, paying for care, staying at home, and deciding together.",
    dinnerPerk: "The daily specials from the Juniper Room and Meadowbrook Cafe.",
    paper: null,
  },
};
