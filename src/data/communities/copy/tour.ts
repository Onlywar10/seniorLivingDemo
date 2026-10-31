// Community-specific copy for the Schedule a Tour page and the TourBooker.
// The host is the community's Community Relations Director (from `team`); these lines name them as published.
import type { CommunitySlug } from "@/lib/sites";

export interface TourCopy {
  /** A free lunch with an in-person tour: published by Alder Bend only. */
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
  "alder-bend": {
    lunchOnUs: true,
    metaDescription: "Book an in-person or video tour of Alder Bend in Fairhollow with Community Relations Director Priya Nandakumar. Lunch is on us.",
    lede: "Pick a time that works for you, in person or on video. Priya will walk you through the apartments and common spaces, introduce a few neighbors and take every question you have. Lunch is our treat.",
    hoursFact: " Tours daily, 9:00 am–5:00 pm",
    videoNote: "A live walk-through with Priya from wherever you are.",
    lunchNote: " Stay for lunch in Millpond Café or the Juniper Room after your tour.",
    expectVideo: [
      ["Priya calls you", "She’ll start the video call from her phone and walk you through the Lobby, the Perch and the courtyard live."],
      ["See an apartment", "We’ll visit an available apartment that suits what you’re looking for, and talk through floor plans and pricing."],
      ["Your questions", "Bring the whole family onto the call. Nothing is too small to ask."],
      ["Visit in person when you’re ready", "Many families follow a video tour with an in-person visit and lunch."],
    ],
    expectInPerson: [
      ["Arrive at the Lobby", "Park in the visitor spaces right outside the main entrance. The front desk will let Priya know you’re here."],
      ["See the community", "An available apartment, the Perch, the Fitness Center, the Art Studio and the courtyard — and whatever is happening that day."],
      ["Talk it through", "Pricing, availability, care options and timing. No pressure, and no decisions on the day."],
    ],
    expectLunch: ["Lunch is on us", "Join Priya for lunch in Millpond Café or the Juniper Room. Residents often stop by to say hello."],
    finding: ["On the east side of Fairhollow, a short drive from Old Town", "Free visitor parking at the main entrance", "Covered drop-off at the Lobby"],
  },
  "kestrel-point": {
    lunchOnUs: false,
    metaDescription: "Book an in-person or video tour of Kestrel Point in Rivermead with Community Relations Director Mateo Ruiz.",
    lede: "Pick a time that works for you, in person or on video. Mateo will walk you through the apartments and common spaces, introduce a few neighbors and take every question you have.",
    hoursFact: " Tours by appointment",
    videoNote: "A live walk-through with Mateo from wherever you are.",
    lunchNote: " Join us in Meadowbrook Cafe or the Juniper Room after your tour.",
    expectVideo: [
      ["Mateo calls you", "Mateo starts the video call and walks you through the Lobby, the Bistro and the courtyard live."],
      ["See an apartment", "We’ll visit an available apartment that suits what you’re looking for, and talk through floor plans and pricing."],
      ["Your questions", "Bring the whole family onto the call. Nothing is too small to ask."],
      ["Visit in person when you’re ready", "Many families follow a video tour with an in-person visit and lunch."],
    ],
    expectInPerson: [
      ["Arrive at the Lobby", "Park in the visitor spaces outside the main entrance. The front desk will let Mateo know you’re here."],
      ["See the community", "An available apartment, the Bistro, the Gym, the Art Studio and the courtyard — and whatever is happening that day."],
      ["Talk it through", "Pricing, availability, care options and timing. No pressure, and no decisions on the day."],
    ],
    expectLunch: ["Stay for lunch", "Join Mateo for lunch in Meadowbrook Cafe or the Juniper Room. Residents often stop by to say hello."],
    finding: ["In south Rivermead, a few minutes from the river", "Visitor parking outside the main entrance", "Secure gated access — if the gate is closed, call the front desk"],
  },
};
