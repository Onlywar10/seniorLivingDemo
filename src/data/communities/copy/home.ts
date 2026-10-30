// Community home page copy: the prose that differs between communities.
// Bruceville Point lines come from brucevillepoint.com (home page, October 2026) and its data files.
// BP photos are stand-ins from public/img. // TODO photo
import type { CommunitySlug } from "@/lib/sites";

export interface HomeCopy {
  metaTitle: string;
  metaDescription: string;
  hero: { photo: string; alt: string; eyebrow: string; title: string; titleEm: string; lede: string };
  /** Small captioned photos beside the hero headline. */
  polaroids: { photo: string; caption: string }[];
  /** Short award labels for the strip under the hero. Empty hides the strip. */
  heroAwards: string[];
  /** TodayLive: shown when nothing is on right now. */
  quiet: string;
  /** TodayLive: shown once the day's calendar is done (before 7 pm). */
  wrapUp: string;
  diningIntro: string;
  /** Per venue key: a better photo than the venue's own, and its alt text. */
  venuePhotos: Record<string, { photo?: string; alt: string }>;
}

export const homeCopy: Record<CommunitySlug, HomeCopy> = {
  "prairie-city-landing": {
    metaTitle: "Prairie City Landing · Luxury Senior Living in Folsom, CA",
    metaDescription:
      "Sacramento County’s award-winning luxury senior living community in Folsom, CA. Independent Living from $5,950 a month, Assisted Living Services and Harbor Memory Care. Not just a home, but a lifestyle.",
    hero: {
      photo: "/img/exterior.jpg",
      alt: "Prairie City Landing’s front entrance under a blue Folsom sky",
      eyebrow: "Folsom, California",
      title: "Not just a home, but a ",
      titleEm: "lifestyle.",
      lede: "Sacramento County’s award-winning luxury senior living community.",
    },
    polaroids: [
      { photo: "/img/paddleboard.jpg", caption: "Stand-up paddling" },
      { photo: "/img/rendezvous-dance.jpg", caption: "Happy hour at The Rendezvous" },
      { photo: "/img/beekeeping.jpg", caption: "Beekeeping day" },
    ],
    heroAwards: ["Best of Folsom · 8 years running", "CALA Outstanding Executive Director", "SageCare Certified"],
    quiet: "A quiet moment — coffee at The Rendezvous, a book in the Living Room, or a stroll in the courtyard.",
    wrapUp: "That’s a wrap for today’s calendar. The Rendezvous and Natoma Café are open until 7:00 pm.",
    diningIntro: "Every menu is designed by Culinary Director Conrad Caguimbal. Eat when you like, where you like, with whoever you like.",
    venuePhotos: {
      rendezvous: { photo: "/img/rendezvous-bar.jpg", alt: "The Rendezvous bar with its espresso machine and wine shelves" },
      cypress: { photo: "/img/cypress-people.jpg", alt: "The Cypress Room set with white tablecloths" },
      natoma: { alt: "Natoma Café’s sunny dining area" },
    },
  },
  "bruceville-point": {
    metaTitle: "Bruceville Point · Luxury Senior Living in Elk Grove, CA",
    metaDescription:
      "Sacramento County’s newest luxury senior living community in Elk Grove, CA. Independent Living from $5,100 a month, Assisted Living Services and Harbor Memory Care. Different By Design.",
    hero: {
      photo: "/img/courtyard-palms.jpg", // TODO photo
      alt: "A sunny courtyard with palms, lawn and outdoor seating",
      eyebrow: "Elk Grove, California",
      title: "Not just a home, but a ",
      titleEm: "life you love.",
      lede: "Sacramento County’s newest luxury senior living community.",
    },
    polaroids: [
      { photo: "/img/art-studio.jpg", caption: "Paint and Sip" }, // TODO photo
      { photo: "/img/trail-walk.jpg", caption: "Park outings" }, // TODO photo
      { photo: "/img/bocce-women.jpg", caption: "Bocce in the courtyard" }, // TODO photo
    ],
    heroAwards: [],
    quiet: "A quiet moment — coffee at The Bistro, a book in the Lobby, or a stroll along the walking paths.",
    wrapUp: "That’s a wrap for today’s calendar. Stone Lakes Cafe and The Bistro are open until 7:00 pm.",
    diningIntro: "Every menu is designed by Culinary Director Eric Auclair. Eat when you like, where you like, with whoever you like.",
    venuePhotos: {
      cypress: { alt: "A dining room set with white tablecloths" },
      stonelakes: { alt: "Residents gathered at outdoor tables under orange umbrellas and palms" },
      bistro: { photo: "/img/bp/bistro.jpg", alt: "The Bistro’s fireside lounge, with armchairs by a two-sided fireplace and café tables beyond" },
    },
  },
};
