// Visitor information, FAQs, guide summaries and directory details for the About pages.
import { telHref, type FaqGroup, type FaqItem } from "@/data/shared";
import { faqs, site } from "./site";

export { telHref };
export type { FaqGroup, FaqItem };

export const phones = [
  { label: "Main line & tours", number: site.phone, note: "Front desk, seven days a week" },
  { label: "Lantern Memory Care", number: site.phonesAlso[0], note: "Lantern nurses’ station and Lantern families" },
  { label: "Business office", number: site.phonesAlso[1], note: "Billing, leases and statements, Mon–Fri" },
];

export const emails = [
  { label: "General enquiries", address: site.email },
  { label: "Careers", address: site.careersEmail },
  { label: "Accessibility", address: site.accessibilityEmail },
];

export const visiting = [
  { label: "Tours", value: "Daily, 9:00 am–5:00 pm" },
  { label: "Visitors", value: "Welcome any time — please sign in at the front desk" },
  { label: "Front desk", value: "Staffed 7:00 am–9:00 pm daily" },
  { label: "After hours", value: "Ring the Lobby call box; our team is on site 24 hours" },
  { label: "Lantern", value: "Families welcome daily; please check in at the Lantern door" },
  { label: "Business office", value: "Monday–Friday, 9:00 am–5:00 pm" },
];

export const directions = [
  { title: "From Calder (Millpond Parkway East)", text: "Head east out of Calder on the Millpond Parkway toward Fairhollow. Take the Lakeview Road exit, turn left and continue north. Turn right on Quarry Hill Road, then left on Alder Bend Way. We are on your right, next to Fairhollow High School." },
  { title: "From Calder Regional Airport", text: "About 40 minutes. Follow the Airport Expressway south into Calder, join the Millpond Parkway heading east, and follow the directions above." },
  { title: "From Old Town Fairhollow", text: "Just a few minutes. Take Front Street south, turn left on Quarry Hill Road and left on Alder Bend Way." },
  { title: "Parking", text: "Free visitor parking right outside the main entrance, with accessible spaces closest to the door. Covered drop-off at the Lobby." },
];

export const nearby = [
  "Just off the Millpond Parkway, next to Fairhollow High School",
  "Minutes from Old Town Fairhollow and the Millpond Lake shore",
  "Close to Millpond Marketplace and Fairhollow Community Hospital",
  "About 40 minutes from Calder Regional Airport",
];

/** Who to call about what. Extensions are on the main line. */
export const whoToCall = [
  { topic: "Tours, apartments, pricing and move-ins", name: "Priya Nandakumar", ext: "110" },
  { topic: "Care plans, assessments and medications", name: "Colleen Ashby", ext: "120" },
  { topic: "Lantern Memory Care", name: "Maribel Ortiz", ext: "130" },
  { topic: "Trips, the calendar and Events & Adventures", name: "Nora Castellano", ext: "140" },
  { topic: "Fitness classes and physical therapy", name: "Devin Marsh", ext: "150" },
  { topic: "Lunch and private dining reservations", name: "Simone Archer", ext: "160" },
  { topic: "Billing, leases and statements", name: "Leonard Fisk", ext: "170" },
  { topic: "Anything else — or a concern", name: "Renata Holloway", ext: "101" },
];

const pick = (...qs: string[]) => qs.map((q) => faqs.find((f) => f.q.startsWith(q))!).filter(Boolean);

export const faqGroups: FaqGroup[] = [
  {
    title: "Living here",
    items: [
      ...pick("What’s included", "Is there a second-person", "Are pets", "Do you provide transportation"),
      { q: "Can I bring my own furniture?", a: "Yes, and we hope you will. Apartments are unfurnished so they feel like yours. Our apartments have room for a sectional and a full dining set, and Priya can share floor plans with measurements to help you plan." },
      { q: "Can I keep my car?", a: "Of course. Residents are welcome to keep a car, and resident parking is available on site. Many residents find they drive less once they discover the scheduled transportation." },
      { q: "How does mail work?", a: "Every apartment has its own locking mailbox in the Lobby, with a full street address. The front desk signs for packages and lets you know when something arrives." },
    ],
  },
  {
    title: "Care and support",
    items: [
      ...pick("If I need more help", "What is Lantern", "Are you licensed"),
      { q: "Is there a nurse on site?", a: "Resident Services Director Colleen Ashby leads a team of Med Techs and Care Partners, and someone from our team is on site around the clock. Colleen works directly with each resident’s own doctors and healthcare providers." },
      { q: "What happens in a pre-move-in assessment?", a: "Colleen sits down with you, and your family if you wish, to learn about your health, your daily routine and what you prefer. It is a friendly chat rather than an exam, and it becomes a care plan that fits you from day one." },
    ],
  },
  {
    title: "Visiting",
    items: [
      { q: "What are visiting hours?", a: "There are none — family and friends are welcome any time. Please sign in at the front desk, which is staffed 7:00 am–9:00 pm. After hours, ring the Lobby call box and our team will let you in." },
      ...pick("Can my family join me"),
      { q: "Can guests stay overnight?", a: "Yes. Guests are welcome to stay in your apartment for short visits; just let the front desk know so we can welcome them. For longer stays, talk to the Business Office." },
      { q: "Where do visitors park?", a: "Free visitor parking is right outside the main entrance, with accessible spaces closest to the door and a covered drop-off at the Lobby." },
      { q: "Can I visit a resident in Lantern?", a: "Yes. Families are welcome in Lantern every day. Lantern is a secured neighborhood, so please check in at the Lantern door and a team member will let you in." },
    ],
  },
  {
    title: "Tours and moving in",
    items: [
      ...pick("How do I schedule a tour"),
      { q: "What does the move-in process look like?", a: "After your tour, Priya helps you choose an apartment and reserve it. If you are considering Assisted Living Services or Lantern, Colleen completes a pre-move-in assessment. Then we agree a move-in date that suits you, and our team helps with everything from the floor plan to introductions on your first night." },
      { q: "Is there a deposit or community fee?", a: "Yes, there is a one-time community fee when you reserve an apartment. The amount depends on the apartment and the level of support, and Priya will walk you through the community fee and any current offers during your visit." },
      { q: "How quickly can I move in?", a: "It depends on the apartment you choose. Some apartments are ready now; others have a short waitlist. Priya can tell you exactly what is available today." },
      { q: "Do you help with downsizing and moving?", a: "Yes. We can recommend local senior move managers and movers who know the community well, and our team makes sure your apartment is ready and welcoming on the day." },
    ],
  },
];

/** Short reading versions of the downloadable guides, in the same order as `guides`. */
export const guideSummaries: { lede: string; points: string[] }[] = [
  {
    lede: "Many families wait for a crisis before they talk about senior living. This guide helps you have the conversation earlier, on your own terms.",
    points: ["Signs that home is getting harder: isolation, missed meals, home upkeep, medications", "What a good day looks like — and whether it’s still happening", "How to talk about it with a parent without taking over", "Questions to ask on a tour"],
  },
  {
    lede: "Independent living, assisted living and memory care are designed for different needs. Knowing the difference makes the choice clearer.",
    points: ["Independent living: a lifestyle with services, no care required", "Assisted living: help with daily activities, delivered where you live", "Memory care: a secured, specialised neighborhood with purposeful days", "How care levels can change over time without another move"],
  },
  {
    lede: "Monthly rent can look high next to a paid-off mortgage — until you add up everything it replaces.",
    points: ["Housing, utilities, internet and cable, maintenance and housekeeping", "Meals, transportation, fitness and activities", "Care costs and how they are priced", "A worksheet to compare your current monthly costs"],
  },
  {
    lede: "Most families pay for senior living with a combination of sources. Here are ten worth knowing about.",
    points: ["Savings, pensions and Social Security", "The sale or rental of a home", "Long-term care insurance and life insurance options", "Veterans benefits, bridge loans and annuities"],
  },
  {
    lede: "Practical tips for planning ahead and making your budget go further.",
    points: ["Start the conversation before you need to decide", "Gather statements and policies in one place", "Ask about what is included, so you don’t pay twice", "When to involve a financial planner or elder law attorney"],
  },
  {
    lede: "Insurance can help with some senior living costs, but not all. This guide explains what is typically covered.",
    points: ["What Medicare does and does not cover", "Long-term care insurance: benefit triggers and elimination periods", "Life insurance conversions and accelerated benefits", "Questions to ask your insurer"],
  },
  {
    lede: "Aid and Attendance is a VA pension benefit that can help wartime veterans and surviving spouses pay for care.",
    points: ["Who may qualify: service, income and care need", "Which care costs can count", "Documents to gather before you apply", "Where to find accredited help with the application"],
  },
  {
    lede: "Safety is one of the main reasons families choose senior living. These are the seven ways a good community provides it.",
    points: ["Team on site 24 hours and an emergency response system", "Secure entry and camera surveillance", "Apartments designed to prevent falls", "Medication management, fitness and social connection"],
  },
  {
    lede: "Loneliness affects health as much as diet and exercise. Here is how senior living makes staying social easy.",
    points: ["Why social connection matters as we age", "How to meet people in your first month", "Clubs, classes, trips and shared meals", "Ways families can stay part of everyday life"],
  },
];
