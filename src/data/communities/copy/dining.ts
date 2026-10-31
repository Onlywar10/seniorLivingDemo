// Community-specific copy for the Dining page (src/app/[community]/dining) and its menu board / lunch booking.
// Menus, hours and happy hours come from each community's menus.ts, calendar.ts and site.ts.
import type { CommunitySlug } from "@/lib/sites";

export interface DiningCopy {
  metaDescription: string;
  lede: string;
  heroPhoto: string;
  heroAlt: string;
  /** The coffeehouse & wine bar: its menu card shows "At the bar today", and its happy hours are listed. */
  bar: string;
  /** The calendar room name of the bar, used to find its happy hours. */
  barRoom: string;
  happyLede: string;
  happyPhotos: [string, string][];
  teamLede: string;
  mosaic: [string, string][];
  /** Restaurants that take lunch reservations, in order. */
  lunchVenues: string[];
  lunchLede: string;
  lunchPhoto: [string, string];
  /** Per venue: alt text for its main photo, and a second photo with alt text. */
  venuePhotos: Record<string, { alt: string; second: [string, string] }>;
}

export const diningCopy: Record<CommunitySlug, DiningCopy> = {
  "alder-bend": {
    metaDescription: "Today’s menus at The Juniper Room, Millpond Café and The Perch at Alder Bend in Fairhollow, CA — chef’s specials, soup of the day, gluten-free, vegetarian and dairy-free choices, happy hours with live music, and lunch reservations for families and guests.",
    lede: "Dinner on white linen in The Juniper Room, all-day California comfort food at Millpond Café, and a latte, a panini or a glass of wine at The Perch. Our own chefs write every menu, right here in our kitchen.",
    heroPhoto: "/img/juniper-people.jpg",
    heroAlt: "Residents sharing a meal at a white-tablecloth table in The Juniper Room",
    bar: "perch",
    barRoom: "The Perch",
    happyLede: "Tuesdays and Fridays, 3:00–4:00 pm. Cocktails, mocktails, wine by the glass and snacks on the house for friends and visitors, so bring the family.",
    happyPhotos: [
      ["/img/wine-toast.jpg", "Friends raising glasses of wine at happy hour"],
      ["/img/cocktail.jpg", "A cocktail on the bar at The Perch"],
    ],
    teamLede: "Our chefs plan every menu in-house, and residents have their say at Conversations with Chef in Millpond Café.",
    mosaic: [
      ["dish-plated.jpg", "A plated entrée with seasonal vegetables"],
      ["dish-salmon.jpg", "Grilled salmon filet with lemon herb butter"],
      ["dish-caprese.jpg", "Caprese salad with fresh mozzarella and basil"],
      ["dish-dessert.jpg", "A plated dessert"],
      ["latte.jpg", "A latte with foam art from The Perch"],
    ],
    lunchVenues: ["juniper", "millpond"],
    lunchLede: "Nothing tells you more about Alder Bend than sharing a meal here. Coming to see someone you love, or weighing a move? Reserve a table at The Juniper Room or Millpond Café and leave the rest to us.",
    lunchPhoto: ["/img/millpond-2.jpg", "Millpond Café’s sunny dining room"],
    venuePhotos: {
      juniper: { alt: "The Juniper Room set with white tablecloths", second: ["/img/dish-salmon.jpg", "Grilled salmon filet with lemon herb butter"] },
      millpond: { alt: "Millpond Café’s sunny dining area", second: ["/img/dish-french-toast.jpg", "Thick-sliced French toast with berries"] },
      perch: { alt: "The Perch coffeehouse with café tables", second: ["/img/perch-bar.jpg", "The Perch bar with its espresso machine and wine shelves"] },
    },
  },
  "kestrel-point": {
    metaDescription: "Today’s menus at The Juniper Room, Meadowbrook Cafe and The Bistro at Kestrel Point in Rivermead, CA — chef’s specials, soup of the day, gluten-free, vegetarian and dairy-free choices, a daily happy hour, and lunch reservations for families and guests.",
    lede: "Dinner on white linen in The Juniper Room, relaxed California comfort food all day at Meadowbrook Cafe, and espresso, panini and happy hour every day at The Bistro. Our own chefs write every menu, right here in our kitchen.",
    heroPhoto: "/img/juniper-people.jpg",
    heroAlt: "Residents sharing a meal at a white-tablecloth table",
    bar: "bistro",
    barRoom: "The Bistro",
    happyLede: "Happy hour is a daily habit at The Bistro, with live music on Tuesdays and Fridays, 3:00–4:00 pm. Cocktails, mocktails, wine by the glass and snacks on the house for friends and visitors, so bring the family.",
    happyPhotos: [
      ["/img/wine-toast.jpg", "Friends raising glasses of wine at happy hour"],
      ["/img/cocktail.jpg", "A cocktail on the bar at The Bistro"],
    ],
    teamLede: "Our chefs plan every menu in-house, and once a month our Dining Experience Director teaches residents a cooking class.",
    mosaic: [
      ["dish-plated.jpg", "A plated entrée with seasonal vegetables"],
      ["dish-salmon.jpg", "Grilled salmon filet with lemon herb butter"],
      ["dish-caprese.jpg", "Caprese salad with fresh mozzarella and basil"],
      ["dish-dessert.jpg", "A plated dessert"],
      ["latte.jpg", "A latte with foam art"],
    ],
    lunchVenues: ["juniper", "meadowbrook"],
    lunchLede: "Nothing tells you more about Kestrel Point than sharing a meal here. Coming to see someone you love, or weighing a move? Reserve a table at The Juniper Room or Meadowbrook Cafe and leave the rest to us.",
    lunchPhoto: ["/img/outdoor-dining.jpg", "A sunny café dining area"],
    venuePhotos: {
      juniper: { alt: "A dining room set with white tablecloths", second: ["/img/dish-salmon.jpg", "Grilled salmon filet with lemon herb butter"] },
      meadowbrook: { alt: "A sunny café dining area", second: ["/img/dish-avocado-toast.jpg", "Avocado toast with a poached egg"] },
      bistro: { alt: "A coffeehouse bar with espresso machine and wine shelves", second: ["/img/latte.jpg", "A latte with foam art"] },
    },
  },
};
