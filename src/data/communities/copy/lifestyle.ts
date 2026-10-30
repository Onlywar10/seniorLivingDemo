// Lifestyle page copy that differs between communities.
// Bruceville Point lines are drawn from its data files and brucevillepoint.com (/events-adventures/, /fitness/).
// BP photos are stand-ins from public/img. // TODO photo
import type { CommunitySlug } from "@/lib/sites";

export interface LifestyleCopy {
  metaDescription: string;
  hero: { photo: string; alt: string };
  /** YUSM letter → the longer explanation and where to see it. */
  deeper: Record<string, { more: string; where: [string, string][] }>;
  tiles: { href: string; title: string; text: string; photo: string }[];
}

export const lifestyleCopy: Record<CommunitySlug, LifestyleCopy> = {
  "prairie-city-landing": {
    metaDescription:
      "Life at Prairie City Landing is YUSM — Youthful, Useful, Spontaneous and Mobile. Explore the activity calendar, dining, fitness, Events & Adventures and our amazing spaces.",
    hero: { photo: "/img/lunar-new-year.jpg", alt: "Residents celebrating Lunar New Year with lion dancers" },
    deeper: {
      Y: {
        more: "Youthful isn’t about age. It’s the feeling of learning something new, laughing until your sides hurt and trying the thing you always meant to. Visiting artists teach in the Art Studio, the Speaker Series brings authors and adventurers to the theatre, and the Friday happy hour has live music every week.",
        where: [["Art classes & clubs", "/calendar"], ["Amazing Spaces", "/spaces"]],
      },
      U: {
        more: "Everyone has something to give. Residents lead clubs, plant the raised beds, craft alongside the Folsom High School Senior Assistance Club and run the Resident Council. At the Friday Activity Meeting, residents shape next week’s calendar with our Events & Adventures Director.",
        where: [["Activity Meeting", "/calendar"], ["Purpose & Values", "/about"]],
      },
      S: {
        more: "Say yes to the unexpected. Join the bus to a Gold Rush-era mine, a wine tasting in the foothills or a last-minute lunch at a new restaurant — or skip it all for a quiet afternoon. Your day, your decisions.",
        where: [["Events & Adventures", "/events-adventures"], ["Upcoming trips", "/events-adventures#trips"]],
      },
      M: {
        more: "Fitness keeps you from ‘stepping back’ from life. Our full-time Fitness Director teaches more than 25 classes a week — from Better Balance and chair yoga to Zumba, tai chi and nature walks in local parks.",
        where: [["Fitness", "/fitness"], ["This week’s classes", "/fitness#classes"]],
      },
    },
    tiles: [
      { href: "/calendar", title: "Activity Calendar", text: "Classes, clubs, trips, music and movies, every day of the month.", photo: "/img/drum-circle.jpg" },
      { href: "/dining", title: "Dining", text: "Three restaurants with menus that change daily.", photo: "/img/dish-plated.jpg" },
      { href: "/events-adventures", title: "Events & Adventures", text: "Everyday enjoyment to once-in-a-lifetime bucket-list items.", photo: "/img/car-wash.jpg" },
      { href: "/fitness", title: "Fitness", text: "More than 25 classes a week with Jason Cherry.", photo: "/img/fitness-bike.jpg" },
      { href: "/spaces", title: "Amazing Spaces", text: "Theatre, salon, courtyard, art studio and more.", photo: "/img/fire-table.jpg" },
    ],
  },
  "bruceville-point": {
    metaDescription:
      "Life at Bruceville Point is YUSM — Youthful, Useful, Spontaneous and Mobile. Explore the activity calendar, dining, fitness, Events & Adventures and our amazing spaces.",
    hero: { photo: "/img/friends-walking.jpg", alt: "Residents walking and laughing together in the park" }, // TODO photo
    deeper: {
      Y: {
        more: "Youthful isn’t about age. It’s the feeling of learning something new, laughing until your sides hurt and trying the thing you always meant to. Visiting instructors teach in the Art Studio, the monthly Paint and Sip brings residents, families and Care Partners together at the easel, and happy hour in the Bistro has live music.",
        where: [["Art classes & clubs", "/calendar"], ["Amazing Spaces", "/spaces"]],
      },
      U: {
        more: "Everyone has something to give. Residents lead clubs, plant the courtyard’s raised beds and serve on the Resident Council. At the Friday Activity Meeting, residents shape next week’s calendar with our Events & Adventures Director.",
        where: [["Activity Meeting", "/calendar"], ["Purpose & Values", "/about"]],
      },
      S: {
        more: "Say yes to the unexpected. Join the bus to the Aerospace Museum of California, a sunny afternoon in a local park or a last-minute lunch out — or skip it all for a quiet afternoon. Your day, your decisions.",
        where: [["Events & Adventures", "/events-adventures"], ["Upcoming trips", "/events-adventures#trips"]],
      },
      M: {
        more: "Fitness keeps you from ‘stepping back’ from life. Our full-time Fitness Director teaches more than 25 classes a week — from Step Aerobics and Better Balance to strength training, bocce and disc golf.",
        where: [["Fitness", "/fitness"], ["This week’s classes", "/fitness#classes"]],
      },
    },
    tiles: [
      { href: "/calendar", title: "Activity Calendar", text: "Classes, clubs, trips, music and movies, every day of the month.", photo: "/img/theatre.jpg" }, // TODO photo
      { href: "/dining", title: "Dining", text: "Three restaurants with menus that change daily.", photo: "/img/dish-plated.jpg" }, // TODO photo
      { href: "/events-adventures", title: "Events & Adventures", text: "Everyday enjoyment to once-in-a-lifetime bucket-list items.", photo: "/img/courtyard-bbq.jpg" }, // TODO photo
      { href: "/fitness", title: "Fitness", text: "More than 25 classes a week with Tina Trillo.", photo: "/img/fitness-center.jpg" }, // TODO photo
      { href: "/spaces", title: "Amazing Spaces", text: "Theatre, salon, courtyard, art studio and more.", photo: "/img/courtyard-palms.jpg" }, // TODO photo
    ],
  },
};
