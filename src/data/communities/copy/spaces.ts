// Community-specific copy for Amazing Spaces (src/app/[community]/spaces).
// The rooms themselves are listed in each community's site.ts (spaces) and menus.ts (venues).
import type { CommunitySlug } from "@/lib/sites";

export interface SpacesCopy {
  metaDescription: string;
  heroPhoto: string;
  heroAlt: string;
  /** "More to discover outdoors" gallery. */
  outdoors: { src: string; alt: string; title: string }[];
  tourPhoto: string;
}

export const spacesCopy: Record<CommunitySlug, SpacesCopy> = {
  "alder-bend": {
    metaDescription: "Take a photo tour of Alder Bend: three restaurants, a theatre, art studio, fitness center, salon, Club Room, Living Room library and a courtyard with a fire table and bocce.",
    heroPhoto: "/img/lobby-tall.jpg",
    heroAlt: "The double-height lobby with a sweeping staircase",
    outdoors: [
      { src: "/img/courtyard-aerial.jpg", alt: "An aerial view of the courtyard’s paths, lawns and seating", title: "The courtyard from above" },
      { src: "/img/fire-table.jpg", alt: "The fire table and lounge seating at dusk", title: "Fire table" },
      { src: "/img/courtyard-bocce.jpg", alt: "The bocce court in the courtyard", title: "Bocce court" },
      { src: "/img/courtyard-bbq.jpg", alt: "Gas barbecues and shaded outdoor dining", title: "Barbecues & outdoor dining" },
      { src: "/img/lantern-garden.jpg", alt: "Lantern’s secured courtyard garden", title: "Lantern courtyard" },
      { src: "/img/exterior-evening.jpg", alt: "The courtyard with palms and umbrellas", title: "Palms & umbrellas" },
    ],
    tourPhoto: "/img/courtyard-dining.jpg",
  },
  "kestrel-point": {
    metaDescription: "Take a photo tour of Kestrel Point: three restaurants, a theatre, art studio, gym, salon, Club Room and a courtyard with a bocce court, fire pit and gas BBQs.",
    heroPhoto: "/img/lobby.jpg",
    heroAlt: "A bright lobby with sofas",
    outdoors: [
      { src: "/img/courtyard-bocce.jpg", alt: "A bocce court in a landscaped courtyard", title: "Bocce court" },
      { src: "/img/fire-table.jpg", alt: "A fire pit with lounge seating at dusk", title: "Fire pit" },
      { src: "/img/courtyard-bbq.jpg", alt: "Gas barbecues and outdoor dining", title: "Barbecues & outdoor dining" },
      { src: "/img/courtyard-palms.jpg", alt: "Courtyard seating in sun and shade", title: "Raised planters & cutting garden" },
      { src: "/img/lantern-garden.jpg", alt: "A secure garden courtyard with raised planters", title: "Lantern courtyard & putting green" },
    ],
    tourPhoto: "/img/courtyard-dining.jpg",
  },
};
