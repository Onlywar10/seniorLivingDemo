// Lifestyle page copy that differs between communities.
import type { CommunitySlug } from "@/lib/sites";

export interface LifestyleCopy {
  metaDescription: string;
  hero: { photo: string; alt: string };
  /**
   * LIVE letter (L, I, V, E, matching `pillars` in src/data/wrenhaven.ts) → the longer explanation and where to see it.
   * Listed in pillar order: the Lifestyle page falls back to position if a letter isn't found.
   */
  deeper: Record<string, { more: string; where: [string, string][] }>;
  tiles: { href: string; title: string; text: string; photo: string }[];
}

export const lifestyleCopy: Record<CommunitySlug, LifestyleCopy> = {
  "alder-bend": {
    metaDescription:
      "Life at Alder Bend is LIVE: Lively, Independent, Valued and Engaged. See the activity calendar, dining, fitness, Events & Adventures and the spaces residents share.",
    hero: { photo: "/img/lunar-new-year.jpg", alt: "Residents celebrating Lunar New Year with lion dancers" },
    deeper: {
      L: {
        more: "Lively has nothing to do with your birthday. It’s picking up a new skill, a good belly laugh, finally trying the thing you kept putting off. Visiting artists teach in the Art Studio, the Speaker Series brings travelers and writers to the Theatre, and Friday happy hour always has a live band.",
        where: [["Art classes & clubs", "/calendar"], ["Amazing Spaces", "/spaces"]],
      },
      I: {
        more: "Your days are yours to plan. Hop on the bus to the Copper Creek Mine, spend an afternoon tasting in the Juniper Hills, try the new place in Old Town for lunch, or stay home with a book. Nobody here keeps a schedule for you.",
        where: [["Events & Adventures", "/events-adventures"], ["Upcoming trips", "/events-adventures#trips"]],
      },
      V: {
        more: "A lifetime of know-how doesn’t retire. Residents run clubs, tend the raised beds, make crafts with students from Fairhollow’s schools and sit on the Resident Council. Each Friday at the Activity Meeting, they plan the coming week alongside our Events & Adventures Director.",
        where: [["Activity Meeting", "/calendar"], ["Purpose & Values", "/about"]],
      },
      E: {
        more: "Staying active keeps you in the middle of things. Our full-time Fitness Director leads more than 25 classes a week, from balance work and chair yoga to Zumba, tai chi and Monday walks around Millpond Lake.",
        where: [["Fitness", "/fitness"], ["This week’s classes", "/fitness#classes"]],
      },
    },
    tiles: [
      { href: "/calendar", title: "Activity Calendar", text: "Classes, clubs, outings, music and movies, every day of the month.", photo: "/img/drum-circle.jpg" },
      { href: "/dining", title: "Dining", text: "Three restaurants, with menus that change every day.", photo: "/img/dish-plated.jpg" },
      { href: "/events-adventures", title: "Events & Adventures", text: "Little pleasures every day, and the occasional big adventure.", photo: "/img/car-wash.jpg" },
      { href: "/fitness", title: "Fitness", text: "Over 25 classes a week with Devin Marsh.", photo: "/img/fitness-bike.jpg" },
      { href: "/spaces", title: "Amazing Spaces", text: "A theatre, salon, courtyard, art studio and more.", photo: "/img/fire-table.jpg" },
    ],
  },
  "kestrel-point": {
    metaDescription:
      "Life at Kestrel Point is LIVE: Lively, Independent, Valued and Engaged. See the activity calendar, dining, fitness, Events & Adventures and the spaces residents share.",
    hero: { photo: "/img/friends-walking.jpg", alt: "Residents walking and laughing together in the park" },
    deeper: {
      L: {
        more: "Lively has nothing to do with your birthday. It’s picking up a new skill, a good belly laugh, finally trying the thing you kept putting off. Visiting instructors teach in the Art Studio, the monthly Paint and Sip puts residents, families and Care Partners side by side at the easel, and happy hour in the Bistro comes with live music.",
        where: [["Art classes & clubs", "/calendar"], ["Amazing Spaces", "/spaces"]],
      },
      I: {
        more: "Your days are yours to plan. Take the bus to a museum in Calder, spend a sunny afternoon at the Meadowbrook Wildlife Refuge, go out for a spur-of-the-moment lunch, or stay home with a book. Nobody here keeps a schedule for you.",
        where: [["Events & Adventures", "/events-adventures"], ["Upcoming trips", "/events-adventures#trips"]],
      },
      V: {
        more: "A lifetime of know-how doesn’t retire. Residents run clubs, plant the courtyard’s raised beds and sit on the Resident Council. Each Friday at the Activity Meeting, they plan the coming week alongside our Events & Adventures Director.",
        where: [["Activity Meeting", "/calendar"], ["Purpose & Values", "/about"]],
      },
      E: {
        more: "Staying active keeps you in the middle of things. Our full-time Fitness Director leads more than 25 classes a week, from step aerobics and balance work to strength training, bocce and disc golf.",
        where: [["Fitness", "/fitness"], ["This week’s classes", "/fitness#classes"]],
      },
    },
    tiles: [
      { href: "/calendar", title: "Activity Calendar", text: "Classes, clubs, outings, music and movies, every day of the month.", photo: "/img/theatre.jpg" },
      { href: "/dining", title: "Dining", text: "Three restaurants, with menus that change every day.", photo: "/img/dish-plated.jpg" },
      { href: "/events-adventures", title: "Events & Adventures", text: "Little pleasures every day, and the occasional big adventure.", photo: "/img/courtyard-bbq.jpg" },
      { href: "/fitness", title: "Fitness", text: "Over 25 classes a week with Kara Lindqvist.", photo: "/img/fitness-center.jpg" },
      { href: "/spaces", title: "Amazing Spaces", text: "A theatre, salon, courtyard, art studio and more.", photo: "/img/courtyard-palms.jpg" },
    ],
  },
};
