// Community-specific copy for the Our Team page (and the steward link on Careers).
import type { CommunitySlug } from "@/lib/sites";

type RegularIcon = "dumbbell" | "heart" | "sparkle" | "paw" | "music";

export interface TeamCopy {
  metaDescription: string;
  lede: string;
  /** Lede for the Team Steward of the Month block (only where a steward is published). */
  stewardLede: string | null;
  /** News story that explains why the team matters. */
  teamStory: string | null;
  regularsIntro: string;
  /** `unnamed`: a role, not a person (the role is the name). */
  regulars: { name: string; what: string; when: string; icon: RegularIcon; unnamed?: true }[];
  pet: { name: string; what: string; when: string } | null;
  councilPhotoAlt: string;
  councilNote: string;
}

export const teamCopy: Record<CommunitySlug, TeamCopy> = {
  "prairie-city-landing": {
    metaDescription: "Meet the leadership and department directors at Prairie City Landing, our Team Steward of the Month, instructors and Resident Council president.",
    lede: "Every director at Prairie City Landing works on site, knows residents by name and picks up the phone. Here’s who they are, and who to call about what.",
    stewardLede: "Residents and colleagues nominated Esther for her communication, cheerfulness and attentiveness. In their words:",
    teamStory: "a-great-place-to-work",
    regularsIntro: "Alongside our full-time team, these instructors and clergy are part of the week — plus one very good dog.",
    regulars: [
      { name: "Sonya", what: "Chair Yoga", when: "Sundays, 11:00 am · Fitness Center", icon: "dumbbell" },
      { name: "Shaun", what: "Sit To Be Fit", when: "Mon, Wed, Fri & Sat, 12:15 pm · Fitness Center", icon: "dumbbell" },
      { name: "Showen", what: "Tai Chi", when: "Fridays, 11:00 am · Fitness Center", icon: "dumbbell" },
      { name: "Rhea", what: "Zumba", when: "Saturdays, 11:30 am · Harbor", icon: "music" },
      { name: "Ava", what: "Brain Busters", when: "Saturdays, 3:00 pm · Natoma Café", icon: "sparkle" },
      { name: "Chaplain Dave", what: "Non-Denominational Service", when: "Sundays, 10:30 am · Theatre", icon: "heart" },
      { name: "Fr. Giovanni Gamas", what: "Catholic Mass, St. John the Baptist Catholic Church", when: "Monthly Mass in the Theatre", icon: "heart" },
    ],
    pet: { name: "Thor", what: "Therapy pet", when: "Pet Therapy in Harbor, Wednesdays at 2:00 pm, and regular visits to the 2nd Floor Lounge" },
    councilPhotoAlt: "Residents laughing together in the Rendezvous",
    councilNote: "The All-Resident Council Meeting is held monthly in the Theatre, and Executive Director Cheryl Martin hosts a Town Hall each month too. Ask Cynthia to introduce you to Bill on your tour.",
  },
  "bruceville-point": {
    metaDescription: "Meet the leadership and department directors at Bruceville Point, our instructors and Resident Council president.",
    lede: "Every director at Bruceville Point works on site and knows residents by name. Here’s who they are, and who to ask for about what.",
    stewardLede: null,
    teamStory: "people-make-all-the-difference",
    regularsIntro: "Alongside our full-time team, these instructors and visitors are part of the week.",
    regulars: [
      { name: "Tina Trillo", what: "Step Aerobics and Strength Training", when: "Step Aerobics Mondays & Wednesdays, 9:00 am · Gym", icon: "dumbbell" },
      { name: "Personal Trainer", what: "One-to-one training in the gym", when: "By appointment · Gym", icon: "dumbbell", unnamed: true },
      { name: "Visiting art instructor", what: "Occasional Art Studio classes", when: "Art Studio", icon: "sparkle", unnamed: true },
      { name: "Visiting chaplain", what: "Non-Denominational Service", when: "Sundays, 10:30 am · Theatre", icon: "heart", unnamed: true },
    ],
    pet: null,
    councilPhotoAlt: "Residents laughing together",
    councilNote: "Ask Jaime to introduce you to members of the Resident Council on your tour.",
  },
};
