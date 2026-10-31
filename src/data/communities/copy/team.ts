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
  "alder-bend": {
    metaDescription: "Meet the leadership and department directors at Alder Bend, our Team Steward of the Month, instructors and Resident Council president.",
    lede: "Every director at Alder Bend has an office down the hall, knows residents by name and answers their own phone. Meet them here, and find out who to call about what.",
    stewardLede: "Lucia was nominated by residents and coworkers alike, who singled out how clearly she communicates, how cheerful she is and how much she notices. Here’s what they wrote:",
    teamStory: "a-great-place-to-work",
    regularsIntro: "Our full-time team has help from these instructors and visiting clergy, who are part of every week here. So is one very good dog.",
    regulars: [
      { name: "Sonya", what: "Chair Yoga", when: "Sundays, 11:00 am · Fitness Center", icon: "dumbbell" },
      { name: "Shaun", what: "Sit To Be Fit", when: "Mon, Wed, Fri & Sat, 12:15 pm · Fitness Center", icon: "dumbbell" },
      { name: "Mei", what: "Tai Chi", when: "Fridays, 11:00 am · Fitness Center", icon: "dumbbell" },
      { name: "Rhea", what: "Zumba", when: "Saturdays, 11:30 am · Lantern", icon: "music" },
      { name: "Ava", what: "Brain Busters", when: "Saturdays, 3:00 pm · Millpond Café", icon: "sparkle" },
      { name: "Chaplain Miriam", what: "Non-Denominational Service", when: "Sundays, 10:30 am · Theatre", icon: "heart" },
      { name: "Fr. Daniel Brennan", what: "Catholic Mass with a visiting priest", when: "Monthly Mass in the Theatre", icon: "heart" },
    ],
    pet: { name: "Thor", what: "Therapy pet", when: "Pet Therapy in Lantern, Wednesdays at 2:00 pm, and regular visits to the 2nd Floor Lounge" },
    councilPhotoAlt: "Residents laughing together in the Perch",
    councilNote: "The All-Resident Council meets in the Theatre once a month, and Executive Director Renata Holloway holds a monthly Town Hall as well. On your tour, ask Priya to introduce you to Walt.",
  },
  "kestrel-point": {
    metaDescription: "Meet the leadership and department directors at Kestrel Point, our instructors and Resident Council president.",
    lede: "Every director at Kestrel Point works here in the building and knows residents by name. Meet them here, and find out who to ask for about what.",
    stewardLede: null,
    teamStory: "people-make-all-the-difference",
    regularsIntro: "Our full-time team has help from these instructors and regular visitors, who are part of every week here.",
    regulars: [
      { name: "Kara Lindqvist", what: "Step Aerobics and Strength Training", when: "Step Aerobics Mondays & Wednesdays, 9:00 am · Gym", icon: "dumbbell" },
      { name: "Personal Trainer", what: "One-to-one training in the gym", when: "By appointment · Gym", icon: "dumbbell", unnamed: true },
      { name: "Visiting art instructor", what: "Occasional Art Studio classes", when: "Art Studio", icon: "sparkle", unnamed: true },
      { name: "Visiting chaplain", what: "Non-Denominational Service", when: "Sundays, 10:30 am · Theatre", icon: "heart", unnamed: true },
    ],
    pet: null,
    councilPhotoAlt: "Residents laughing together",
    councilNote: "On your tour, ask Mateo to introduce you to Bernie and the rest of the Resident Council.",
  },
};
