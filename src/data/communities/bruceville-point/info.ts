// Bruceville Point visitor information, FAQs, guide summaries and directory details for the About pages.
// Mirrors src/data/info.ts (Prairie City Landing) export for export.
//
// SHAPE DIFFERENCES FROM src/data/info.ts
// - `whoToCall[].ext` is `string | null`. No extensions are published; every entry is `null`
//   and callers should dial the main line.
// - `guideSummaries` follows Bruceville Point’s own `guides` list (nine Tenfold guides with
//   different titles from PCL’s), in the same order.
// - `FaqItem`, `FaqGroup` and `telHref` are imported unchanged.
//
// SOURCES: phone numbers, emails and the 24-hour on-site team are published
// (brucevillepoint.com and the Tenfold communities page for (916) 249-2792). Office and tour
// hours are not published, so `visiting` gives no hours that the site does not state.
// Directions are written from the map location (Backer Ranch Road, just west of Bruceville
// Road, south of Elk Grove Boulevard); they are approximate and point to the map link.
// FAQ answers are written from published facts; guide summaries are written content.

import { telHref, type FaqGroup, type FaqItem } from "@/data/shared";
import { faqs, site } from "./site";

export { telHref };
export type { FaqGroup, FaqItem };

export const phones = [
  { label: "Main line & tours", number: site.phone, note: "Front desk and Community Relations" },
  { label: "Also listed", number: site.phonesAlso[0], note: "Listed for Bruceville Point on the Tenfold communities page" },
];

export const emails = [
  { label: "General enquiries", address: site.email },
  { label: "Careers", address: site.careersEmail },
  { label: "Accessibility", address: site.accessibilityEmail },
];

export const visiting = [
  { label: "Tours", value: "By appointment — book online or call (916) 226-5300" },
  { label: "Visitors", value: "Welcome — please sign in at the front desk" },
  { label: "After hours", value: "Our team is on site 24 hours a day" },
  { label: "Harbor", value: "Families welcome; please check in at the Harbor door" },
  { label: "Business office", value: "Weekdays — call the main line" },
];

export const directions = [
  { title: "From Sacramento (I-5 South)", text: "Take I-5 South to the Elk Grove Boulevard exit and head east for about three miles. Turn right onto Bruceville Road, then right onto Backer Ranch Road. We are on Backer Ranch Road, just off Bruceville Road." },
  { title: "From Highway 99", text: "Take the Elk Grove Boulevard exit and head west for about three miles. Turn left onto Bruceville Road, then right onto Backer Ranch Road." },
  { title: "From Sacramento International Airport", text: "About 25 to 30 minutes. Take I-5 South through Sacramento to the Elk Grove Boulevard exit, and follow the directions above." },
  { title: "Parking", text: "Visitor parking is outside the main entrance. The community has secure gated access, so if the gate is closed, call the front desk on the main line." },
];

export const nearby = [
  "Just off Bruceville Road, a few blocks south of Elk Grove Boulevard",
  "Minutes from Old Town Elk Grove and Elk Grove Regional Park",
  "A short drive to Stone Lakes National Wildlife Refuge and the Cosumnes River Preserve",
  "About 25 minutes from downtown Sacramento and Sacramento International Airport (SMF)",
];

/** Who to call about what. No extensions are published, so call the main line and ask for the person. */
export const whoToCall: { topic: string; name: string; ext: string | null }[] = [
  { topic: "Tours, apartments, pricing and move-ins", name: "Jaime Cervantes", ext: null },
  { topic: "Care plans, assessments and medications", name: "Nicole Grayson", ext: null },
  { topic: "Harbor Memory Care", name: "Amrita Sapkota", ext: null },
  { topic: "Trips, the calendar and Events & Adventures", name: "Timothy Smith", ext: null },
  { topic: "Fitness classes and personal training", name: "Tina Trillo", ext: null },
  { topic: "Lunch and private dining reservations", name: "Danyale Liberati Shaw", ext: null },
  { topic: "Billing, leases and statements", name: "Breah Taylor", ext: null },
  { topic: "Anything else — or a concern", name: "Marianne Richardson", ext: null },
];

const pick = (...qs: string[]) => qs.map((q) => faqs.find((f) => f.q.startsWith(q))!).filter(Boolean);

export const faqGroups: FaqGroup[] = [
  {
    title: "Living here",
    items: [
      ...pick("What’s included", "Is there a second-person", "Are pets", "Do you provide transportation"),
      { q: "Can I bring my own furniture?", a: "Yes, and we hope you will. Apartments are scaled for full-sized furniture, so your home feels like yours. Jaime can share floor plans with measurements to help you plan." },
      { q: "Can I keep my car?", a: "Of course. Covered parking is available, and the community has secure gated access with coded entry." },
      { q: "Do apartments have balconies?", a: "Select apartments have a balcony or patio. Ask Jaime which ones are available now." },
    ],
  },
  {
    title: "Care and support",
    items: [
      ...pick("If I need more help", "What is Harbor", "Are you licensed"),
      { q: "Is there a team on site at night?", a: "Yes. Our team is on site 24 hours a day, and every apartment has an emergency response system. The Resident Services Director coordinates with each resident’s own doctors and healthcare providers." },
      { q: "What happens in a pre-move-in assessment?", a: "Our Resident Services Director meets with you (and family, if you like) to understand your health, routines and preferences. It is a conversation, not a test, and it shapes the services that suit you from the first day." },
    ],
  },
  {
    title: "Visiting",
    items: [
      { q: "When can family visit?", a: "Family and friends are welcome. Please sign in at the front desk; our team is on site 24 hours." },
      ...pick("Can my family join me"),
      { q: "Can I host a party?", a: "Yes. The Club Room can be reserved for private parties, with catering available and an adjacent patio. Families also use the courtyard’s gas BBQs." },
      { q: "Can I visit a resident in Harbor?", a: "Yes. Families are welcome in Harbor. It is a secured neighborhood, so please check in at the Harbor door and a team member will let you in." },
    ],
  },
  {
    title: "Tours and moving in",
    items: [
      ...pick("How do I schedule a tour"),
      { q: "What does the move-in process look like?", a: "After your tour, Jaime helps you choose an apartment and reserve it. If you are considering Assisted Living Services or Harbor, our Resident Services Director completes a personal assessment before move-in. Then we agree a move-in date that suits you." },
      { q: "How quickly can I move in?", a: "It depends on the apartment you choose. Jaime can tell you exactly what is available today." },
      { q: "Is there a sister community?", a: "Yes. Prairie City Landing in Folsom is also owned and operated by Tenfold Senior Living." },
    ],
  },
];

/** Short reading versions of the downloadable guides, in the same order as `guides`. */
export const guideSummaries: { lede: string; points: string[] }[] = [
  {
    lede: "The questions families ask most often about senior living, answered plainly.",
    points: ["What independent living, assisted living and memory care each include", "What monthly rent covers, and what costs extra", "How care is assessed and added", "What to ask on a tour"],
  },
  {
    lede: "How Tenfold’s signature programs — Events & Adventures, fitness, dining and YUSM — shape everyday life.",
    points: ["Events & Adventures, from weekly Bingo to museum tours", "A full-time Fitness Director and more than 25 classes a week", "Three restaurants, each with its own menu", "Youthful, Useful, Spontaneous and Mobile"],
  },
  {
    lede: "Independent living is a lifestyle with services, not a level of care. Here are the facts.",
    points: ["Apartment homes with full kitchens and your own washer and dryer", "Housekeeping, maintenance and utilities included", "Dining, fitness and Events & Adventures", "Support available later, without another move"],
  },
  {
    lede: "Assisted living is help with daily life, delivered where you already live.",
    points: ["Medication management and personal care", "Escorts to meals, activities and appointments", "Coordination with your healthcare providers", "How the base support fee and care plans work"],
  },
  {
    lede: "Memory care is a secured, specialized neighborhood with purposeful days. Here is what to look for.",
    points: ["Signs it may be time to consider memory care", "Secure spaces that still feel like home", "Daily programming designed for people living with dementia", "How families stay involved"],
  },
  {
    lede: "New to senior living? Start here.",
    points: ["The difference between the kinds of senior living", "How communities are licensed in California", "Typical costs and what they replace", "Questions to ask yourself before you tour"],
  },
  {
    lede: "Most families pay for senior living with a combination of sources. This guide walks through them.",
    points: ["Savings, pensions and Social Security", "The sale or rental of a home", "Long-term care insurance and veterans benefits", "When to involve a financial planner or elder law attorney"],
  },
  {
    lede: "Staying at home and moving to a community both have costs. This guide helps you weigh them honestly.",
    points: ["The hidden costs of staying home: upkeep, isolation, care", "What a good day looks like — and whether it’s still happening", "Safety and support", "Moving while it is still your choice"],
  },
  {
    lede: "A practical toolkit for families making a decision together.",
    points: ["How to start the conversation early", "Don’t parent your parent", "Checklists for tours and assessments", "Keeping everyone’s voice in the decision"],
  },
];
