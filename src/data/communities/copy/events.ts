// Events & Adventures and Activity Calendar copy that differs between communities.
// Bruceville Point lines come from brucevillepoint.com (/events-adventures/, /memory-care/) and its data files.
// BP photos are stand-ins from public/img. // TODO photo
import type { CommunitySlug } from "@/lib/sites";
import type { GalleryItem } from "@/components/brand/Gallery";

export interface EventsCopy {
  metaDescription: string;
  hero: { photo: string; alt: string };
  /** "The can-do spirit" paragraph: text before the highlight, the highlight, text after. */
  canDo: [string, string, string];
  /** A line from the Events & Adventures Director, if one is published. */
  directorQuote?: string;
  gallery: GalleryItem[];
}

export interface CalendarCopy {
  metaDescription: string;
  /** "What’s on at …" */
  titleEm: string;
  harborLede: string;
  photo: { src: string; alt: string };
}

export const eventsCopy: Record<CommunitySlug, EventsCopy> = {
  "prairie-city-landing": {
    metaDescription: "From everyday enjoyment to once-in-a-lifetime bucket list items: trips, outings, parties and adventures at Prairie City Landing in Folsom, CA.",
    hero: { photo: "/img/car-wash.jpg", alt: "Residents in swimsuits washing a convertible at the charity car wash" },
    canDo: [
      "Our residents have a can-do spirit that surprises everyone, including themselves — ",
      "like grandmas in bikinis",
      " running the charity car wash. Every Friday at the Activity Meeting, residents and our Events & Adventures Director go over next week’s calendar, pitch new ideas and settle the details over drinks and appetizers.",
    ],
    directorQuote: "“My favorite word is yes. My second favorite is ‘bus leaves at 9:30’.”",
    gallery: [
      { src: "/img/car-wash.jpg", alt: "Residents in swimsuits and sunhats washing a convertible", title: "The charity car wash", caption: "Grandmas in bikinis, sponges in hand — and a line of cars around the block." },
      { src: "/img/beekeeping.jpg", alt: "A group of residents in white beekeeping suits", title: "Beekeeping day", caption: "Suits on, veils down, and a very close look at a working hive." },
      { src: "/img/paddleboard.jpg", alt: "A resident holding a paddle beside a paddleboard on the lake", title: "Stand-up paddling", caption: "Proof that it’s never too late to try something new." },
      { src: "/img/drum-circle.jpg", alt: "Residents playing drums in a circle in the courtyard", title: "Drum circle", caption: "Friday afternoons in the courtyard — no experience necessary." },
      { src: "/img/bocce.jpg", alt: "Two residents playing bocce on the courtyard court", title: "Bocce tournament", caption: "Friendly rivalry on our own court." },
      { src: "/img/lunar-new-year.jpg", alt: "Lion dancers visiting residents for Lunar New Year", title: "Lunar New Year", caption: "The lion dancers came to us." },
      { src: "/img/wine-pong.jpg", alt: "A resident tossing a ball at cups of wine", title: "Wine pong", caption: "Our take on a classic, at The Rendezvous." },
      { src: "/img/pool-hall.jpg", alt: "Four residents holding pool cues and drinks", title: "Night at the pool hall", caption: "The gentlemen’s outing that became a monthly tradition." },
      { src: "/img/grandkid-parade.jpg", alt: "Grandchildren in costume parading along the path", title: "The grandkid parade", caption: "Costumes, candy and a very proud audience." },
      { src: "/img/gardening.jpg", alt: "A resident tending the raised garden beds", title: "In the garden", caption: "The raised planters supply herbs for the kitchen." },
      { src: "/img/marshmallows.jpg", alt: "Marshmallows toasting over the courtyard fire table", title: "Marshmallows & camp stories", caption: "S’mores and tall tales around the fire table." },
      { src: "/img/chef-kitchen.jpg", alt: "The chef demonstrating a dish in the kitchen", title: "Conversations with Chef", caption: "Behind the scenes with Culinary Director Conrad Caguimbal’s kitchen." },
    ],
  },
  "bruceville-point": {
    metaDescription: "From everyday enjoyment to once-in-a-lifetime bucket list items: trips, outings, parties and adventures at Bruceville Point in Elk Grove, CA.",
    hero: { photo: "/img/courtyard-bbq.jpg", alt: "Gas barbecues and shaded outdoor dining" }, // TODO photo
    canDo: [
      "Our residents have a can-do spirit that surprises everyone, including themselves — ",
      "like the resident who toured the Aerospace Museum",
      " and found planes he once flew. Every Friday at the Activity Meeting, residents and our Events & Adventures Director go over next week’s calendar, pitch new ideas and settle the details over drinks and appetizers.",
    ],
    gallery: [
      { src: "/img/art-studio.jpg", alt: "An art studio with long work tables and easels", title: "Paint and Sip", caption: "Every month, residents, families and Care Partners put down their usual roles and pick up a brush." }, // TODO photo
      { src: "/img/courtyard-bbq.jpg", alt: "Gas barbecues and shaded outdoor dining", title: "Courtyard BBQ", caption: "Gas grills, shade and the whole community at the table." }, // TODO photo
      { src: "/img/friends-walking.jpg", alt: "Residents walking and laughing together in the park", title: "An afternoon in the park", caption: "A sunny outing with the Fitness Director that felt like old times." }, // TODO photo
      { src: "/img/bocce-women.jpg", alt: "Two residents playing bocce in the courtyard", title: "Bocce tournament", caption: "Friendly rivalry on our own court." }, // TODO photo
      { src: "/img/theatre.jpg", alt: "A theatre with tiered armchairs and a large screen", title: "Movie night", caption: "Popcorn and a big screen in the Theatre." }, // TODO photo
      { src: "/img/wine-toast.jpg", alt: "Friends raising glasses of wine at happy hour", title: "A toast", caption: "Happy hour in the Bistro, every day." }, // TODO photo
      { src: "/img/gardening.jpg", alt: "A resident tending the raised garden beds", title: "In the garden", caption: "Herbs and vegetables from the courtyard’s raised planters." }, // TODO photo
      { src: "/img/marshmallows.jpg", alt: "Marshmallows toasting over the courtyard fire table", title: "Around the fire pit", caption: "Evenings in the courtyard, with friends and family." }, // TODO photo
    ],
  },
};

export const calendarCopy: Record<CommunitySlug, CalendarCopy> = {
  "prairie-city-landing": {
    metaDescription:
      "Today’s classes, clubs, bus trips and happy hours at Prairie City Landing in Folsom, CA. Browse by day, week or month, filter by interest, sign up for trips online and print a large-print calendar.",
    titleEm: "the Landing",
    harborLede: "Harbor keeps its own gentle daily rhythm — gardening, ceramics, storytelling, pet therapy with Thor and a weekly outing — and Harbor residents are invited to every community event too.",
    photo: { src: "/img/drum-circle.jpg", alt: "Residents playing hand drums together at Friday’s Drum Circle" },
  },
  "bruceville-point": {
    metaDescription:
      "Today’s classes, clubs, bus trips and happy hours at Bruceville Point in Elk Grove, CA. Browse by day, week or month, filter by interest, sign up for trips online and print a large-print calendar.",
    titleEm: "Bruceville Point",
    harborLede: "Harbor keeps its own activity calendar, 12 hours a day — ceramics, music, pet therapy, storytelling, gardening and a weekly outing — and Harbor residents are invited to every community event too.",
    photo: { src: "/img/bocce-women.jpg", alt: "Two residents playing bocce in the courtyard" }, // TODO photo
  },
};
