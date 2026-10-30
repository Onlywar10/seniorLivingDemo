// Community-specific copy for Amazing Spaces (src/app/[community]/spaces).
// Facts come from each community's site.ts (spaces) and menus.ts (venues).
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
  "prairie-city-landing": {
    metaDescription: "Take a photo tour of Prairie City Landing: three restaurants, a theatre, art studio, fitness center, salon, Club Room, Living Room library and a courtyard with a fire table and bocce.",
    heroPhoto: "/img/lobby-tall.jpg",
    heroAlt: "The double-height lobby with a sweeping staircase",
    outdoors: [
      { src: "/img/courtyard-aerial.jpg", alt: "An aerial view of the courtyard’s paths, lawns and seating", title: "The courtyard from above" },
      { src: "/img/fire-table.jpg", alt: "The fire table and lounge seating at dusk", title: "Fire table" },
      { src: "/img/courtyard-bocce.jpg", alt: "The bocce court in the courtyard", title: "Bocce court" },
      { src: "/img/courtyard-bbq.jpg", alt: "Gas barbecues and shaded outdoor dining", title: "Barbecues & outdoor dining" },
      { src: "/img/harbor-garden.jpg", alt: "Harbor’s secured courtyard garden", title: "Harbor courtyard" },
      { src: "/img/exterior-evening.jpg", alt: "The courtyard with palms and umbrellas", title: "Palms & umbrellas" },
    ],
    tourPhoto: "/img/courtyard-dining.jpg",
  },
  "bruceville-point": {
    metaDescription: "Take a photo tour of Bruceville Point: three restaurants, a theatre, art studio, gym, salon, Club Room and a courtyard with a bocce court, fire pit and gas BBQs.",
    heroPhoto: "/img/lobby.jpg", // TODO photo
    heroAlt: "A bright lobby with sofas",
    // TODO photo: stand-ins until Bruceville Point's own photos are added
    outdoors: [
      { src: "/img/courtyard-bocce.jpg", alt: "A bocce court in a landscaped courtyard", title: "Bocce court" },
      { src: "/img/fire-table.jpg", alt: "A fire pit with lounge seating at dusk", title: "Fire pit" },
      { src: "/img/courtyard-bbq.jpg", alt: "Gas barbecues and outdoor dining", title: "Barbecues & outdoor dining" },
      { src: "/img/courtyard-palms.jpg", alt: "Courtyard seating in sun and shade", title: "Raised planters & cutting garden" },
      { src: "/img/harbor-garden.jpg", alt: "A secure garden courtyard with raised planters", title: "Harbor courtyard & putting green" },
    ],
    tourPhoto: "/img/courtyard-dining.jpg", // TODO photo
  },
};
