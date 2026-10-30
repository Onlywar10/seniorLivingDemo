// Community-specific copy for the Schedule a Tour page and the TourBooker.
// The host is the community's Community Relations Director (from `team`); these lines name them as published.
import type { CommunitySlug } from "@/lib/sites";

export interface TourCopy {
  /** A free lunch with an in-person tour: published by Prairie City Landing only. */
  lunchOnUs: boolean;
  metaDescription: string;
  lede: string;
  /** Hero fact with a leading space (it follows an icon). */
  hoursFact: string;
  videoNote: string;
  /** Follows "Lunch is on us." / "Stay for lunch." with a leading space. */
  lunchNote: string;
  expectVideo: [string, string][];
  expectInPerson: [string, string][];
  /** Inserted after the second in-person step when the visitor stays for lunch. */
  expectLunch: [string, string];
  finding: string[];
}

export const tourCopy: Record<CommunitySlug, TourCopy> = {
  "prairie-city-landing": {
    lunchOnUs: true,
    metaDescription: "Book an in-person or video tour of Prairie City Landing in Folsom with Community Relations Director Cynthia Bazin. Lunch is on us.",
    lede: "Choose a time that suits you, in person or by video. Cynthia will show you the apartments and the spaces, introduce you to a few residents, and answer every question — and lunch is on us.",
    hoursFact: " Tours daily, 9:00 am–5:00 pm",
    videoNote: "A live walk-through with Cynthia from wherever you are.",
    lunchNote: " Stay for lunch in Natoma Café or the Cypress Room after your tour.",
    expectVideo: [
      ["Cynthia calls you", "She’ll start the video call from her phone and walk you through the Lobby, the Rendezvous and the courtyard live."],
      ["See an apartment", "We’ll visit an available apartment that suits what you’re looking for, and talk through floor plans and pricing."],
      ["Your questions", "Bring the whole family onto the call. Nothing is too small to ask."],
      ["Visit in person when you’re ready", "Many families follow a video tour with an in-person visit and lunch."],
    ],
    expectInPerson: [
      ["Arrive at the Lobby", "Park in the visitor spaces right outside the main entrance. The front desk will let Cynthia know you’re here."],
      ["See the community", "An available apartment, the Rendezvous, the Fitness Center, the Art Studio and the courtyard — and whatever is happening that day."],
      ["Talk it through", "Pricing, availability, care options and timing. No pressure, and no decisions on the day."],
    ],
    expectLunch: ["Lunch is on us", "Join Cynthia for lunch in Natoma Café or the Cypress Room. Residents often stop by to say hello."],
    finding: ["Just off US-50, next to Folsom High School", "Free visitor parking at the main entrance", "Covered drop-off at the Lobby"],
  },
  "bruceville-point": {
    lunchOnUs: false,
    metaDescription: "Book an in-person or video tour of Bruceville Point in Elk Grove with Community Relations Director Jaime Cervantes.",
    lede: "Choose a time that suits you, in person or by video. Jaime will show you the apartments and the spaces, introduce you to a few residents, and answer every question.",
    hoursFact: " Tours by appointment",
    videoNote: "A live walk-through with Jaime from wherever you are.",
    lunchNote: " Join us in Stone Lakes Cafe or the Cypress Room after your tour.",
    expectVideo: [
      ["Jaime calls you", "Jaime starts the video call and walks you through the Lobby, the Bistro and the courtyard live."],
      ["See an apartment", "We’ll visit an available apartment that suits what you’re looking for, and talk through floor plans and pricing."],
      ["Your questions", "Bring the whole family onto the call. Nothing is too small to ask."],
      ["Visit in person when you’re ready", "Many families follow a video tour with an in-person visit and lunch."],
    ],
    expectInPerson: [
      ["Arrive at the Lobby", "Park in the visitor spaces outside the main entrance. The front desk will let Jaime know you’re here."],
      ["See the community", "An available apartment, the Bistro, the Gym, the Art Studio and the courtyard — and whatever is happening that day."],
      ["Talk it through", "Pricing, availability, care options and timing. No pressure, and no decisions on the day."],
    ],
    expectLunch: ["Stay for lunch", "Join Jaime for lunch in Stone Lakes Cafe or the Cypress Room. Residents often stop by to say hello."],
    finding: ["Just off Bruceville Road, a few blocks south of Elk Grove Boulevard", "Visitor parking outside the main entrance", "Secure gated access — if the gate is closed, call the front desk"],
  },
};
