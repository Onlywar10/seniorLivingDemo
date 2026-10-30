// Community-specific copy for the planning tools: Care Assessment and Cost Comparison
// (src/app/[community]/care-assessment, cost-comparison and src/components/tools/*).
// Prices come from c.pricing, people from c.team, restaurants from c.venues.
import type { CommunitySlug } from "@/lib/sites";

export interface ToolsCopy {
  /** Care Assessment: "Things you'll love", by answer to "What would make life better?" (dining is built from the restaurants). */
  wants: Record<"fitness" | "trips" | "arts" | "garden" | "pets" | "faith" | "chores", string>;
  /** Care Assessment: added after "You mentioned wanting more company." */
  social: string;
  /** Cost Comparison: what covers a household line at the community, where it differs from the shared wording. */
  covers: Partial<Record<"food" | "car" | "gym" | "fun", string>>;
  /** Cost Comparison: what the rent buys when it costs more than home ("That’s $X a year, and it buys …"). */
  buys: string;
  /** Cost Comparison: when the two come out the same. */
  same: string;
  /** Cost Comparison: what the money guides cover, after "Our 9 senior living guides cover ". Odd items are untranslated separators. */
  guidesCover: string[];
}

export const toolsCopy: Record<CommunitySlug, ToolsCopy> = {
  "prairie-city-landing": {
    wants: {
      fitness: "More than 25 fitness classes a week with Jason Cherry, our full-time Fitness Director",
      trips: "Events & Adventures outings every week, from wineries to Gold Rush-era mine tours",
      arts: "Art Studio classes with visiting artists, plus live music on the calendar every week",
      garden: "Raised planters and a cutting garden in the courtyard",
      pets: "Dogs and cats welcome, with their own outdoor area in the courtyard",
      faith: "Religious services in the Theatre, and faith gatherings on the calendar",
      chores: "Weekly housekeeping, all maintenance and handyman services included",
    },
    social: " Here, friends are as close as the Rendezvous: morning coffee, happy hour, Monday trivia and the Friday Activity Meeting, where residents shape next week’s calendar.",
    covers: {},
    buys: "three restaurants, a 24-hour team, weekly housekeeping, transportation and a calendar full of things to do",
    same: "And at Prairie City Landing, the housekeeping, maintenance, transportation and calendar come with it.",
    guidesCover: ["understanding the cost of senior living", ", ", "ten senior living funding sources", "", ", insurance options and VA Aid and Attendance. Download any of them, free."],
  },
  "bruceville-point": {
    wants: {
      fitness: "More than 25 fitness classes a week with Tina Trillo, our full-time Fitness Director",
      trips: "Events & Adventures outings, from museum tours to park walks, axe throwing and disc golf",
      arts: "Art Studio classes with visiting instructors, plus the monthly Paint and Sip",
      garden: "Raised planters for herbs and vegetables and a cutting garden of lavender and tea roses in the courtyard",
      pets: "Dogs and cats welcome, with their own exercise area in the courtyard",
      faith: "A Non-Denominational Service with a visiting chaplain",
      chores: "Weekly housekeeping, all maintenance and handyman services included",
    },
    social: " Here, friends are as close as the Bistro: morning coffee, a daily happy hour and Bingo in the Bistro every week.",
    covers: {
      food: "Three restaurants on site",
      car: "Outings with our drivers, departing from the Lobby",
      gym: "25+ fitness classes a week on site",
      fun: "Events & Adventures on the calendar",
    },
    buys: "a 24-hour team, weekly housekeeping, all maintenance, utilities and a calendar full of things to do",
    same: "And at Bruceville Point, the housekeeping, maintenance, utilities and calendar come with it.",
    guidesCover: ["funding care, senior living 101 and the family decision toolkit. Download any of them, free."],
  },
};
