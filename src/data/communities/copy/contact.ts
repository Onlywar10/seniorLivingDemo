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
  "alder-bend": {
    metaDescription: "Address, directions, phone numbers, visiting hours and a department directory for Alder Bend, 120 Alder Bend Way, Fairhollow, CA 95921.",
    lede: "On the east side of Fairhollow, a short drive from Old Town and the shores of Millpond Lake. Visitors are always welcome.",
    heroPhoto: "/img/exterior.jpg",
    heroAlt: "The front entrance of Alder Bend",
    localPress: "Fairhollow Courier or Calder Valley Living",
    faqMetaDescription: "Answers about living at Alder Bend: what’s included, care, pets, visiting, parking, mail, moving in and the community fee.",
  },
  "kestrel-point": {
    metaDescription: "Address, directions, phone numbers, visiting information and who to ask for at Kestrel Point, 4400 Kestrel Point Drive, Rivermead, CA 95934.",
    lede: "In south Rivermead, a few minutes from the river and the Meadowbrook Wildlife Refuge, and about twenty minutes from downtown Calder. Visitors are always welcome.",
    heroPhoto: "/img/exterior.jpg",
    heroAlt: "The front entrance of the community",
    localPress: null,
    faqMetaDescription: "Answers about living at Kestrel Point: what’s included, care, pets, visiting, parking, Lantern and moving in.",
  },
};
