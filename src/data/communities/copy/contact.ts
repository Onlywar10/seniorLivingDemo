// Community-specific copy for Info & Directions, FAQs, the enquiry form and other contact points.
import type { CommunitySlug } from "@/lib/sites";

export interface ContactCopy {
  metaDescription: string;
  lede: string;
  heroPhoto: string;
  heroAlt: string;
  /** "How did you hear about us?": the local press option, if any. */
  localPress: string | null;
  faqMetaDescription: string;
}

export const contactCopy: Record<CommunitySlug, ContactCopy> = {
  "prairie-city-landing": {
    metaDescription: "Address, directions, phone numbers, visiting hours and a department directory for Prairie City Landing, 645 Willard Drive, Folsom, CA 95630.",
    lede: "Just off US-50 next to Folsom High School, minutes from historic downtown Folsom. Visitors are always welcome.",
    heroPhoto: "/img/exterior.jpg",
    heroAlt: "The front entrance of Prairie City Landing",
    localPress: "Folsom Telegraph or Style Magazine",
    faqMetaDescription: "Answers about living at Prairie City Landing: what’s included, care, pets, visiting, parking, mail, moving in and the community fee.",
  },
  "bruceville-point": {
    metaDescription: "Address, directions, phone numbers, visiting information and who to ask for at Bruceville Point, 9730 Backer Ranch Road, Elk Grove, CA 95757.",
    lede: "Just off Bruceville Road, a few blocks south of Elk Grove Boulevard, minutes from Old Town Elk Grove. Visitors are always welcome.",
    heroPhoto: "/img/exterior.jpg", // TODO photo
    heroAlt: "The front entrance of the community",
    localPress: null,
    faqMetaDescription: "Answers about living at Bruceville Point: what’s included, care, pets, visiting, parking, Harbor and moving in.",
  },
};
