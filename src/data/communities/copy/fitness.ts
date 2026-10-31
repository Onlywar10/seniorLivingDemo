// Community-specific copy for the Fitness page (src/app/[community]/fitness).
// People and classes are listed in each community's site.ts (fitness, team, instructors) and calendar.ts.
import type { CommunitySlug } from "@/lib/sites";

export interface FitnessCopy {
  metaDescription: string;
  /** Headline figure for classes a week. */
  classesPerWeek: string;
  /** The Fitness Director's card text (default: their team bio). */
  directorBio?: string;
  /** A story by the Fitness Director, if there is one. */
  directorStory?: { slug: string; label: string };
  /** A monthly signature class to feature, found on the calendar by title. */
  monthly?: { date: string; titleStarts: string; text: string };
  /** Instructors (by name in `instructors`) shown under "Familiar faces"; the section hides when empty. */
  instructorNames: string[];
  gallery: { src: string; alt: string; title: string }[];
}

export const fitnessCopy: Record<CommunitySlug, FitnessCopy> = {
  "alder-bend": {
    metaDescription: "Over 25 classes a week at Alder Bend with our full-time Fitness Director, Devin Marsh: balance work, chair yoga, tai chi, Zumba, Monday nature walks and a monthly Healthy Happy Hour.",
    classesPerWeek: "25+",
    directorBio: "Devin is here full-time and teaches more than 25 classes a week. He believes the best workout is one you do with friends, which is why he wrote “Social Fitness” for our news page. You’ll find him leading the Monday nature walks and the monthly Healthy Happy Hour.",
    directorStory: { slug: "social-fitness", label: "Read “Social Fitness” " },
    monthly: { date: "2026-11-18", titleStarts: "Healthy Happy Hour", text: "Good music, healthy snacks and some easy choreography: the only happy hour that counts as exercise. Come as you are, at any fitness level." },
    instructorNames: ["Sonya", "Shaun", "Mei", "Rhea"],
    gallery: [
      { src: "/img/fitness-center.jpg", alt: "The fitness center with exercise machines", title: "The Fitness Center" },
      { src: "/img/namaste.jpg", alt: "A resident in a seated yoga pose outdoors", title: "Mindful meditation" },
      { src: "/img/trail-walk.jpg", alt: "Residents on a nature walk", title: "Monday nature walks" },
      { src: "/img/bocce-women.jpg", alt: "Two residents playing bocce in the courtyard", title: "Bocce in the courtyard" },
      { src: "/img/gym.jpg", alt: "The class studio set up with chairs", title: "The class studio" },
      { src: "/img/friends-walking.jpg", alt: "Residents walking and laughing together in the park", title: "Calder Valley Memory Walk" },
    ],
  },
  "kestrel-point": {
    metaDescription: "Over 25 classes a week at Kestrel Point with our full-time Fitness Director, Kara Lindqvist: step aerobics, strength training, sit and stretch, bocce, disc golf, axe throwing and walks along the river.",
    classesPerWeek: "25+",
    instructorNames: [],
    gallery: [
      { src: "/img/fitness-center.jpg", alt: "A gym with exercise machines", title: "The Gym" },
      { src: "/img/gym.jpg", alt: "A class floor set up with chairs", title: "Group exercise" },
      { src: "/img/trail-walk.jpg", alt: "Residents on a nature walk", title: "Walks along the river" },
      { src: "/img/bocce-women.jpg", alt: "Two residents playing bocce in the courtyard", title: "Bocce on the courtyard court" },
      { src: "/img/namaste.jpg", alt: "A resident in a seated stretch outdoors", title: "Mindfulness" },
    ],
  },
};
