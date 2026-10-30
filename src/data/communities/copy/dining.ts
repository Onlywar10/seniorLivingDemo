// Community-specific copy for the Dining page (src/app/[community]/dining) and its menu board / lunch booking.
// Facts come from each community's menus.ts, calendar.ts and site.ts.
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
  "prairie-city-landing": {
    metaDescription: "Today’s menus at The Cypress Room, Natoma Café and The Rendezvous at Prairie City Landing in Folsom, CA — chef’s specials, soup of the day, gluten-free, vegetarian and dairy-free choices, happy hours with live music, and lunch reservations for families and guests.",
    lede: "White-tablecloth dinners in The Cypress Room, California comfort food all day at Natoma Café, and lattes, panini and a glass of wine in The Rendezvous. Every menu is designed here, by our own culinary team.",
    heroPhoto: "/img/cypress-people.jpg",
    heroAlt: "Residents sharing a meal at a white-tablecloth table in The Cypress Room",
    bar: "rendezvous",
    barRoom: "The Rendezvous",
    happyLede: "Every Tuesday and Friday, 3:00–4:00 pm. Cocktails, mocktails, wine by the glass and complimentary snacks for friends and visitors — bring the family.",
    happyPhotos: [
      ["/img/wine-toast.jpg", "Friends raising glasses of wine at happy hour"],
      ["/img/cocktail.jpg", "A cocktail on the bar at The Rendezvous"],
    ],
    teamLede: "Our menus are written in our own kitchen — and residents help shape them at Conversations with Chef, held in Natoma Café.",
    mosaic: [
      ["dish-plated.jpg", "A plated entrée with seasonal vegetables"],
      ["dish-salmon.jpg", "Grilled salmon filet with lemon herb butter"],
      ["dish-caprese.jpg", "Caprese salad with fresh mozzarella and basil"],
      ["dish-dessert.jpg", "A plated dessert"],
      ["latte.jpg", "A latte with foam art from The Rendezvous"],
    ],
    lunchVenues: ["cypress", "natoma"],
    lunchLede: "The best way to get to know Prairie City Landing is over a meal. Visiting a loved one, or thinking about a move? Book a table in The Cypress Room or Natoma Café and we’ll take care of the rest.",
    lunchPhoto: ["/img/natoma-2.jpg", "Natoma Café’s sunny dining room"],
    venuePhotos: {
      cypress: { alt: "The Cypress Room set with white tablecloths", second: ["/img/dish-salmon.jpg", "Grilled salmon filet with lemon herb butter"] },
      natoma: { alt: "Natoma Café’s sunny dining area", second: ["/img/dish-french-toast.jpg", "Thick-sliced French toast with berries"] },
      rendezvous: { alt: "The Rendezvous coffeehouse with café tables", second: ["/img/rendezvous-bar.jpg", "The Rendezvous bar with its espresso machine and wine shelves"] },
    },
  },
  "bruceville-point": {
    metaDescription: "Today’s menus at The Cypress Room, Stone Lakes Cafe and The Bistro at Bruceville Point in Elk Grove, CA — chef’s specials, soup of the day, gluten-free, vegetarian and dairy-free choices, a daily happy hour, and lunch reservations for families and guests.",
    lede: "White-tablecloth dining in The Cypress Room, California-casual comfort food all day at Stone Lakes Cafe, and espresso, panini and a daily happy hour in The Bistro. Every menu is designed here, by our own culinary team.",
    heroPhoto: "/img/cypress-people.jpg", // TODO photo
    heroAlt: "Residents sharing a meal at a white-tablecloth table",
    bar: "bistro",
    barRoom: "The Bistro",
    happyLede: "Happy hour every day in The Bistro, with live music on Tuesdays and Fridays, 3:00–4:00 pm. Cocktails, mocktails, wine by the glass and complimentary snacks for friends and visitors — bring the family.",
    happyPhotos: [
      ["/img/wine-toast.jpg", "Friends raising glasses of wine at happy hour"], // TODO photo
      ["/img/cocktail.jpg", "A cocktail on the bar at The Bistro"], // TODO photo
    ],
    teamLede: "Our menus are written in our own kitchen — and each month our Dining Experience Director gives residents a cooking lesson.",
    mosaic: [
      ["dish-plated.jpg", "A plated entrée with seasonal vegetables"],
      ["dish-salmon.jpg", "Grilled salmon filet with lemon herb butter"],
      ["dish-caprese.jpg", "Caprese salad with fresh mozzarella and basil"],
      ["dish-dessert.jpg", "A plated dessert"],
      ["latte.jpg", "A latte with foam art"],
    ],
    lunchVenues: ["cypress", "stonelakes"],
    lunchLede: "The best way to get to know Bruceville Point is over a meal. Visiting a loved one, or thinking about a move? Book a table in The Cypress Room or Stone Lakes Cafe and we’ll take care of the rest.",
    lunchPhoto: ["/img/outdoor-dining.jpg", "A sunny café dining area"], // TODO photo
    venuePhotos: {
      cypress: { alt: "A dining room set with white tablecloths", second: ["/img/dish-salmon.jpg", "Grilled salmon filet with lemon herb butter"] },
      stonelakes: { alt: "A sunny café dining area", second: ["/img/dish-avocado-toast.jpg", "Avocado toast with a poached egg"] },
      bistro: { alt: "A coffeehouse bar with espresso machine and wine shelves", second: ["/img/latte.jpg", "A latte with foam art"] },
    },
  },
};
