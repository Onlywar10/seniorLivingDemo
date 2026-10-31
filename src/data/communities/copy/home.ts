// Community home page copy: the prose that differs between communities.
// Prices quoted here match each community's site.ts.
import type { CommunitySlug } from "@/lib/sites";

export interface HomeCopy {
  metaTitle: string;
  metaDescription: string;
  hero: { photo: string; alt: string; eyebrow: string; title: string; titleEm: string; lede: string };
  /** Small captioned photos beside the hero headline. */
  polaroids: { photo: string; caption: string }[];
  /** Short highlights for the strip under the hero. Empty hides the strip. */
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
  "alder-bend": {
    metaTitle: "Alder Bend · Luxury Senior Living in Fairhollow, CA",
    metaDescription:
      "Senior living by Millpond Lake in Fairhollow, CA. Independent Living from $5,950 a month, Assisted Living Services and Lantern Memory Care. Come for the apartment, stay for the life.",
    hero: {
      photo: "/img/exterior.jpg",
      alt: "Alder Bend’s front entrance under a blue Fairhollow sky",
      eyebrow: "Fairhollow, California",
      title: "Come for the apartment. ",
      titleEm: "Stay for the life.",
      lede: "Apartment homes, three restaurants and a full calendar, a few minutes from Millpond Lake.",
    },
    polaroids: [
      { photo: "/img/paddleboard.jpg", caption: "Lake days" },
      { photo: "/img/perch-dance.jpg", caption: "Happy hour at The Perch" },
      { photo: "/img/beekeeping.jpg", caption: "Beekeeping day" },
    ],
    heroAwards: ["Open since 2017", "Three restaurants on site", "25+ fitness classes a week"],
    quiet: "Nothing on the calendar just now. Grab a coffee at The Perch, a book from the Living Room, or a bench in the courtyard.",
    wrapUp: "That’s a wrap for today’s calendar. The Perch and Millpond Café are open until 7:00 pm.",
    diningIntro: "Culinary Director Rafael Domingo writes every menu. Dine when you’re hungry, wherever you like, with whoever you like.",
    venuePhotos: {
      perch: { photo: "/img/perch-bar.jpg", alt: "The Perch bar with its espresso machine and wine shelves" },
      juniper: { photo: "/img/juniper-people.jpg", alt: "The Juniper Room set with white tablecloths" },
      millpond: { alt: "Millpond Café’s sunny dining area" },
    },
  },
  "kestrel-point": {
    metaTitle: "Kestrel Point · Luxury Senior Living in Rivermead, CA",
    metaDescription:
      "Senior living by the river in Rivermead, CA. Independent Living from $5,100 a month, Assisted Living Services and Lantern Memory Care. Newly built, and ready for you.",
    hero: {
      photo: "/img/courtyard-palms.jpg",
      alt: "A sunny courtyard with palms, lawn and outdoor seating",
      eyebrow: "Rivermead, California",
      title: "Room to settle in. ",
      titleEm: "Reasons to head out.",
      lede: "The Calder Valley’s newest senior living community, built in 2021 on the south side of Rivermead.",
    },
    polaroids: [
      { photo: "/img/art-studio.jpg", caption: "Paint and Sip" },
      { photo: "/img/trail-walk.jpg", caption: "Refuge walks" },
      { photo: "/img/bocce-women.jpg", caption: "Bocce in the courtyard" },
    ],
    heroAwards: [],
    quiet: "Nothing on the calendar just now. Grab a coffee at The Bistro, a book in the Lobby, or a lap of the walking paths.",
    wrapUp: "That’s a wrap for today’s calendar. Meadowbrook Cafe and The Bistro are open until 7:00 pm.",
    diningIntro: "Culinary Director Julien Marchand writes every menu. Dine when you’re hungry, wherever you like, with whoever you like.",
    venuePhotos: {
      juniper: { alt: "A dining room set with white tablecloths" },
      meadowbrook: { alt: "Residents gathered at outdoor tables under orange umbrellas and palms" },
      bistro: { photo: "/img/kp/bistro.jpg", alt: "The Bistro’s fireside lounge, with armchairs by a two-sided fireplace and café tables beyond" },
    },
  },
};
