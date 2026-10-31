// Community-specific copy for Purpose & Values (/about), All Are Welcome and the accessibility statement.
// Wrenhaven's purpose, values and name origin are shared (src/data/wrenhaven.ts); only photos and local details live here.
import type { CommunitySlug } from "@/lib/sites";

export interface AboutCopy {
  /** The community photo beside "Owned, designed, built and run by Wrenhaven." */
  placePhoto: [string, string];
  /** All Are Welcome: the ASL interpreter paragraph (followed by the phone number). */
  aslText: string;
  welcomeMetaDescription: string;
  accessMetaDescription: string;
  /** Accessibility statement, "In the community": [bold lead, rest of sentence with a leading space]. */
  accessInCommunity: [string, string][];
}

export const aboutCopy: Record<CommunitySlug, AboutCopy> = {
  "alder-bend": {
    placePhoto: ["/img/exterior-evening.jpg", "The Alder Bend courtyard with palms and umbrellas"],
    aslText: "American Sign Language interpreters are available for tours, care conferences and community events. Let us know when you book, or call ",
    welcomeMetaDescription: "Alder Bend welcomes everyone and is committed to diversity, equity and inclusion. ASL interpreters are available for tours, care conferences and events.",
    accessMetaDescription: "Alder Bend’s accessibility statement: our WCAG 2.1 AA goal, text size, contrast and language tools, ASL interpreters and large-print calendars.",
    accessInCommunity: [
      ["ASL interpreters", " are available for tours, care conferences and community events. Let us know when you book and we’ll arrange it."],
      ["Large-print calendars", " are available at the front desk every month, and we’re happy to mail one to family members."],
      ["Accessible buildings", " with elevators, wide corridors, accessible parking at the main entrance and a covered drop-off at the Lobby."],
      ["Assistive listening", " in the Theatre for movies, lectures and services. Ask an Ambassador for a receiver."],
    ],
  },
  "kestrel-point": {
    placePhoto: ["/img/courtyard-aerial.jpg", "A landscaped community courtyard"],
    aslText: "For residents and visitors who are deaf or hard of hearing, we arrange live or online American Sign Language interpreters when appropriate. Let us know when you book, or call ",
    welcomeMetaDescription: "Kestrel Point is a home for everyone: Wrenhaven values diversity, promotes equity and fosters inclusion. ASL interpreters and reasonable accommodations are available.",
    accessMetaDescription: "Kestrel Point’s accessibility statement: our WCAG 2.1 AA goal, text size, contrast and language tools, ASL interpreters and reasonable accommodations.",
    accessInCommunity: [
      ["ASL interpreters", " — live or online — are arranged for residents and visitors who are deaf or hard of hearing, when appropriate. Let us know when you book."],
      ["Reasonable accommodations", " for people with disabilities, including hearing impairment. Just ask the front desk team."],
    ],
  },
};
