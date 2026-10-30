// Community-specific copy for the Fitness page (src/app/[community]/fitness).
// Facts come from each community's site.ts (fitness, team, instructors) and calendar.ts.
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
  "prairie-city-landing": {
    metaDescription: "More than 25 fitness classes a week at Prairie City Landing, led by full-time Fitness Director Jason Cherry: Better Balance, chair yoga, tai chi, Zumba, nature walks and the monthly Healthy Happy Hour.",
    classesPerWeek: "25+",
    directorBio: "Jason is full-time on site and teaches more than 25 classes a week. He is the author of “Social Fitness”, and leads the Monday nature walks and the monthly Healthy Happy Hour.",
    directorStory: { slug: "social-fitness", label: "Read “Social Fitness” " },
    monthly: { date: "2026-11-18", titleStarts: "Healthy Happy Hour", text: "Music, nutritious snacks and choreography — a happy hour that counts as a workout. Everyone is welcome, whatever your fitness level." },
    instructorNames: ["Sonya", "Shaun", "Showen", "Rhea"],
    gallery: [
      { src: "/img/fitness-center.jpg", alt: "The fitness center with exercise machines", title: "The Fitness Center" },
      { src: "/img/namaste.jpg", alt: "A resident in a seated yoga pose outdoors", title: "Mindful meditation" },
      { src: "/img/trail-walk.jpg", alt: "Residents on a nature walk", title: "Monday nature walks" },
      { src: "/img/bocce-women.jpg", alt: "Two residents playing bocce in the courtyard", title: "Bocce in the courtyard" },
      { src: "/img/gym.jpg", alt: "The class studio set up with chairs", title: "The class studio" },
      { src: "/img/friends-walking.jpg", alt: "Residents walking and laughing together in the park", title: "Walk to End Alzheimer’s" },
    ],
  },
  "bruceville-point": {
    metaDescription: "More than 25 fitness classes a week at Bruceville Point, led by full-time Fitness Director Tina Trillo: Step Aerobics, strength training, sit and stretch, bocce, disc golf, axe throwing and outings to local trails and parks.",
    classesPerWeek: "25+",
    instructorNames: [],
    // TODO photo: stand-ins until Bruceville Point's own photos are added
    gallery: [
      { src: "/img/fitness-center.jpg", alt: "A gym with exercise machines", title: "The Gym" },
      { src: "/img/gym.jpg", alt: "A class floor set up with chairs", title: "Group exercise" },
      { src: "/img/trail-walk.jpg", alt: "Residents on a nature walk", title: "Outings to local trails and parks" },
      { src: "/img/bocce-women.jpg", alt: "Two residents playing bocce in the courtyard", title: "Bocce on the courtyard court" },
      { src: "/img/namaste.jpg", alt: "A resident in a seated stretch outdoors", title: "Mindfulness" },
    ],
  },
};
