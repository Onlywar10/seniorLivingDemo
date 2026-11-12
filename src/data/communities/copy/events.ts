// Events & Adventures and Activity Calendar copy that differs between communities.
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
  lanternLede: string;
  photo: { src: string; alt: string };
}

export const eventsCopy: Record<CommunitySlug, EventsCopy> = {
  "alder-bend": {
    metaDescription: "Small pleasures and big adventures: day trips, outings, parties and the occasional dare at Alder Bend in Fairhollow, CA.",
    hero: { photo: "/img/car-wash.jpg", alt: "Residents in swimsuits washing a convertible at the charity car wash" },
    canDo: [
      "Residents here have a habit of surprising everyone, themselves included — ",
      "like the swimsuit-and-sunhat crew",
      " who ran this summer’s charity car wash. On Fridays at the Activity Meeting, residents and our Events & Adventures Director look over the coming week, trade new ideas and sort out the details over drinks and snacks.",
    ],
    directorQuote: "“Most of my job is saying ‘why not?’ The rest is making sure the bus leaves on time.”",
    gallery: [
      { src: "/img/car-wash.jpg", alt: "Residents in swimsuits and sunhats washing a convertible", title: "The charity car wash", caption: "Sponges, buckets, sunhats, and a line of cars down the street." },
      { src: "/img/beekeeping.jpg", alt: "A group of residents in white beekeeping suits", title: "Beekeeping day", caption: "Suits zipped, veils on, and a close-up look inside a working hive." },
      { src: "/img/paddleboard.jpg", alt: "Two residents laughing together on the dock at Millpond Lake", title: "Lake days", caption: "Morning coffee on the dock at Millpond Lake." },
      { src: "/img/drum-circle.jpg", alt: "Residents playing drums in a circle in the courtyard", title: "Drum circle", caption: "Friday afternoons in the courtyard. No rhythm required." },
      { src: "/img/bocce.jpg", alt: "Two residents playing bocce on the courtyard court", title: "Bocce tournament", caption: "Friendly rivalry on our own court." },
      { src: "/img/lunar-new-year.jpg", alt: "Lion dancers visiting residents for Lunar New Year", title: "Lunar New Year", caption: "A visit from the lion dancers, right in the Lobby." },
      { src: "/img/wine-pong.jpg", alt: "A resident tossing a ball at cups of wine", title: "Wine pong", caption: "A grown-up twist on an old party game, at The Perch." },
      { src: "/img/pool-hall.jpg", alt: "Four residents holding pool cues and drinks", title: "Night at the pool hall", caption: "It started as a one-off night out. Now it’s on the calendar every month." },
      { src: "/img/grandkid-parade.jpg", alt: "Grandchildren in costume parading along the path", title: "The grandkid parade", caption: "Costumes, candy and a crowd of beaming grandparents." },
      { src: "/img/gardening.jpg", alt: "A resident tending the raised garden beds", title: "In the garden", caption: "Herbs from the raised planters end up in the kitchen." },
      { src: "/img/marshmallows.jpg", alt: "Marshmallows toasting over the courtyard fire table", title: "Marshmallows & camp stories", caption: "S’mores and slightly exaggerated stories by the fire table." },
      { src: "/img/chef-kitchen.jpg", alt: "The chef demonstrating a dish in the kitchen", title: "Conversations with Chef", caption: "A look behind the kitchen door with Culinary Director Rafael Domingo." },
    ],
  },
  "kestrel-point": {
    metaDescription: "Small pleasures and big adventures: day trips, outings, parties and the occasional dare at Kestrel Point in Rivermead, CA.",
    hero: { photo: "/img/courtyard-bbq.jpg", alt: "Gas barbecues and shaded outdoor dining" },
    canDo: [
      "Residents here have a habit of surprising everyone, themselves included — ",
      "like the first-timers at axe throwing",
      " who now want a league of their own. On Fridays at the Activity Meeting, residents and our Events & Adventures Director look over the coming week, trade new ideas and sort out the details over drinks and snacks.",
    ],
    gallery: [
      { src: "/img/art-studio.jpg", alt: "An art studio with long work tables and easels", title: "Paint and Sip", caption: "Once a month, residents, families and Care Partners leave their usual roles at the door and pick up a brush." },
      { src: "/img/courtyard-bbq.jpg", alt: "Gas barbecues and shaded outdoor dining", title: "Courtyard BBQ", caption: "Grills going, plenty of shade and everyone at one long table." },
      { src: "/img/friends-walking.jpg", alt: "Residents walking and laughing together in the park", title: "An afternoon at the refuge", caption: "A sunny walk at Meadowbrook with the Fitness Director, binoculars optional." },
      { src: "/img/bocce-women.jpg", alt: "Two residents playing bocce in the courtyard", title: "Bocce tournament", caption: "Friendly rivalry on our own court." },
      { src: "/img/theatre.jpg", alt: "A theatre with tiered armchairs and a large screen", title: "Movie night", caption: "Popcorn, the big screen and the comfy seats in the Theatre." },
      { src: "/img/wine-toast.jpg", alt: "Friends raising glasses of wine at happy hour", title: "A toast", caption: "Happy hour at the Bistro, a daily ritual." },
      { src: "/img/gardening.jpg", alt: "A resident tending the raised garden beds", title: "In the garden", caption: "Herbs and vegetables, grown in the courtyard’s raised planters." },
      { src: "/img/marshmallows.jpg", alt: "Marshmallows toasting over the courtyard fire table", title: "Around the fire pit", caption: "Courtyard evenings with friends and family." },
    ],
  },
};

export const calendarCopy: Record<CommunitySlug, CalendarCopy> = {
  "alder-bend": {
    metaDescription:
      "Today’s classes, clubs, bus trips and happy hours at Alder Bend in Fairhollow, CA. Browse by day, week or month, filter by interest, add events to your phone and print a large-print calendar.",
    titleEm: "Alder Bend",
    lanternLede: "Lantern has its own unhurried rhythm: gardening, ceramics, storytelling, visits from Thor the therapy dog and an outing every week. Lantern residents are welcome at every community event as well.",
    photo: { src: "/img/drum-circle.jpg", alt: "Residents playing hand drums together at Friday’s Drum Circle" },
  },
  "kestrel-point": {
    metaDescription:
      "Today’s classes, clubs, bus trips and happy hours at Kestrel Point in Rivermead, CA. Browse by day, week or month, filter by interest, add events to your phone and print a large-print calendar.",
    titleEm: "Kestrel Point",
    lanternLede: "Lantern runs its own activity calendar, twelve hours a day: ceramics, music, pet therapy, storytelling, gardening and an outing every week. Lantern residents are welcome at every community event as well.",
    photo: { src: "/img/bocce-women.jpg", alt: "Two residents playing bocce in the courtyard" },
  },
};
