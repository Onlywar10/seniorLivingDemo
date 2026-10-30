// Live menus for the three restaurants. Standing menus plus a daily rotation of soups and chef’s specials.
import { dow, iso } from "@/lib/clock";
import { tagLabels, type DayMenu, type Dish, type Section, type Tag, type Venue } from "@/data/shared";

export { tagLabels };
export type { DayMenu, Dish, Section, Tag, Venue };

export type VenueKey = "cypress" | "natoma" | "rendezvous";

export const venues: Record<VenueKey, Venue> = {
  cypress: { key: "cypress", name: "The Cypress Room", kind: "White-tablecloth dining", hours: "11:00 am–7:00 pm", open: 660, close: 1140, photo: "/img/cypress.jpg", blurb: "Seasonal, farm-to-table, and a new menu every week." },
  natoma: { key: "natoma", name: "Natoma Café", kind: "All-day California comfort food", hours: "7:00 am–7:00 pm", open: 420, close: 1140, photo: "/img/natoma.jpg", blurb: "Flapjacks at breakfast, fish tacos at lunch, a burger whenever you like." },
  rendezvous: { key: "rendezvous", name: "The Rendezvous", kind: "Coffeehouse & wine bar", hours: "7:00 am–7:00 pm", open: 420, close: 1140, photo: "/img/rendezvous.jpg", blurb: "Morning latte to pre-dinner wine — the community’s town hall." },
};

export const venueOrder: VenueKey[] = ["cypress", "natoma", "rendezvous"];

// Daily rotation, Sunday first.
const soups = ["Butternut Squash Bisque (VG, GF)", "Chicken Tortilla Soup (GF, DF)", "Minestrone (VG, DF)", "Loaded Baked Potato Soup", "Tomato Basil Bisque (VG)", "New England Clam Chowder", "Split Pea with Ham (GF, DF)"];

const cypressSpecials: Dish[] = [
  { name: "Slow-Roasted Prime Rib", desc: "Au jus, creamy horseradish, Yorkshire pudding", tags: ["DF"] },
  { name: "Pan-Seared Petrale Sole", desc: "Lemon caper beurre blanc, wild rice pilaf", tags: ["GF"] },
  { name: "Braised Short Rib", desc: "Red wine reduction over parmesan polenta", tags: ["GF"] },
  { name: "Wild Mushroom Risotto", desc: "Arborio rice, truffle oil, shaved parmesan", tags: ["VG", "GF"] },
  { name: "Herb-Crusted Pork Tenderloin", desc: "Apple-cider glaze, roasted sweet potatoes", tags: ["GF", "DF"] },
  { name: "Cioppino", desc: "San Francisco-style seafood stew, grilled sourdough", tags: ["DF"] },
  { name: "Chicken Marsala", desc: "Cremini mushrooms, Marsala wine sauce, buttered egg noodles" },
];

const natomaSpecials: Dish[] = [
  { name: "Country Benedict", desc: "Buttermilk biscuit, sausage gravy, two poached eggs" },
  { name: "Turkey Pot Pie", desc: "Flaky crust, garden vegetables, side salad" },
  { name: "French Dip", desc: "Shaved roast beef on a toasted roll, au jus, fries" },
  { name: "Southwest Chicken Bowl", desc: "Cilantro-lime rice, black beans, pico, avocado", tags: ["GF", "DF"] },
  { name: "Patty Melt", desc: "Grilled rye, Swiss, caramelised onions" },
  { name: "Fish & Chips", desc: "Beer-battered cod, house tartar, coleslaw", tags: ["DF"] },
  { name: "Huevos Rancheros", desc: "Corn tortillas, black beans, ranchero sauce, cotija", tags: ["VG", "GF"] },
];

const rendezvousPastry = ["Almond Croissant", "Pumpkin Bread", "Blueberry Scone", "Cinnamon Roll", "Lemon Poppyseed Muffin", "Apple Turnover", "Chocolate Croissant"];
const rendezvousPanini = [
  { name: "Caprese Panini", desc: "Fresh mozzarella, tomato, basil pesto", tags: ["VG"] as Tag[] },
  { name: "Turkey Pesto Panini", desc: "Roast turkey, provolone, sun-dried tomato pesto" },
  { name: "Cubano", desc: "Roast pork, ham, Swiss, pickles, mustard" },
  { name: "Roast Vegetable Panini", desc: "Zucchini, peppers, goat cheese", tags: ["VG"] as Tag[] },
  { name: "Italian Panini", desc: "Salami, capicola, provolone, giardiniera" },
  { name: "Chicken Pesto Panini", desc: "Grilled chicken, mozzarella, basil pesto" },
  { name: "Ham & Brie Panini", desc: "Black Forest ham, brie, fig jam" },
];
const happyHourBites = ["Bruschetta trio", "Spinach-artichoke dip with crostini", "Antipasto skewers", "Meatballs in marinara", "Baked brie with honey", "Shrimp cocktail shooters", "Caprese bites"];
const pours = ["Wise Villa Tempranillo", "Sierra foothills Zinfandel", "Sonoma Coast Chardonnay", "Lodi Old Vine Zinfandel", "Prosecco", "Napa Sauvignon Blanc", "Paso Robles Cabernet"];

function parseTags(s: string): Dish {
  const m = s.match(/^(.*?)\s*\(([A-Z, ]+)\)$/);
  return m ? { name: m[1], tags: m[2].split(",").map((x) => x.trim()) as Tag[] } : { name: s };
}

const thanksgiving: Section[] = [
  { title: "Thanksgiving Dinner · 11:00 am–3:00 pm, by reservation", items: [
    { name: "Roasted Butternut Squash Soup", desc: "Toasted pepitas, crème fraîche", tags: ["VG", "GF"] },
    { name: "Harvest Salad", desc: "Mixed greens, pears, candied pecans, cranberries, maple vinaigrette", tags: ["VG", "GF"] },
    { name: "Herb-Roasted Turkey", desc: "Sage pan gravy, cranberry-orange relish", tags: ["GF"] },
    { name: "Honey-Glazed Ham", desc: "Brown sugar and clove glaze", tags: ["GF", "DF"] },
    { name: "Wild Mushroom Wellington", desc: "For our vegetarian guests", tags: ["VG"] },
    { name: "Sides", desc: "Sourdough sage stuffing, Yukon gold mashed potatoes, candied yams, green beans almondine, Parker House rolls" },
    { name: "Desserts", desc: "Pumpkin pie with whipped cream, pecan pie, apple crisp with vanilla gelato" },
  ] },
];

/** The menu for one venue on one day. */
export function menuFor(venue: VenueKey, date: Date): DayMenu {
  const d = dow(date);
  const key = iso(date);
  const soup = parseTags(soups[d]);
  if (venue === "cypress") {
    const special = cypressSpecials[d];
    if (key === "2026-11-26") return { date: key, venue, special: { name: "Thanksgiving Dinner", desc: "Herb-roasted turkey with all the trimmings" }, soup, sections: thanksgiving, holiday: "Thanksgiving" };
    return {
      date: key, venue, special, soup,
      sections: [
        { title: "To Begin", items: [
          { name: "Soup of the Day", desc: soup.name, tags: soup.tags },
          { name: "Marinated Beet Salad", desc: "Roasted red and golden beets, goat cheese, candied walnuts, arugula, balsamic vinaigrette", tags: ["VG"] },
          { name: "Shrimp Cocktail", desc: "Four freshly poached prawns, house-made cocktail sauce", tags: ["GF"] },
        ] },
        { title: "Mains", items: [
          { name: "Flat Iron Steak", desc: "Flame-grilled 6 oz, green peppercorn sauce" },
          { name: "Chicken Piccata", desc: "Scallopini with lemon, white wine, capers, garlic and parsley" },
          { name: "Grilled Salmon Filet", desc: "Lemon herb butter" },
          { name: "Linguini Primavera", desc: "Seasonal vegetables, basil pesto, six garlic-lemon prawns", tags: ["VG", "DF"] },
        ] },
        { title: "Sides", items: [{ name: "Grilled asparagus" }, { name: "Roasted rosemary cauliflower" }, { name: "Linguini" }, { name: "Mashed potatoes" }, { name: "Baked potato" }] },
        { title: "Sweet Endings", items: [{ name: "Crème brûlée" }, { name: "Gelato", desc: "Vanilla bean, salted caramel or raspberry sorbetto" }] },
      ],
    };
  }
  if (venue === "natoma") {
    return {
      date: key, venue, special: natomaSpecials[d], soup,
      sections: [
        { title: "Breakfast", note: "7:00–10:30 am", items: [
          { name: "Steel-cut oatmeal or Cream of Wheat" },
          { name: "Fresh fruit yogurt parfait", tags: ["VG"] },
          { name: "Avocado toast with a fried egg", tags: ["VG"] },
          { name: "Buttermilk flapjack plate", tags: ["VG"] },
          { name: "Thick-sliced French toast", tags: ["VG"] },
          { name: "Vegetable scramble", tags: ["VG", "GF"] },
          { name: "Eggs your way", tags: ["GF"] },
          { name: "Sides", desc: "Bacon, Canadian bacon, sausage, hash brown, toast, egg, fruit, tomato, avocado" },
        ] },
        { title: "Salads & Soups", items: [
          { name: "Classic Caesar", tags: ["VG"] },
          { name: "Santa Fe", desc: "Grilled chicken, black beans, corn, tomato, avocado, tortilla strips, cilantro lime vinaigrette", tags: ["GF"] },
          { name: "Today’s soup", desc: soup.name, tags: soup.tags },
          { name: "Lunch combo", desc: "A cup of soup and a small salad" },
        ] },
        { title: "Sandwiches", note: "With fries, salad, soup or fruit", items: [
          { name: "The PCL Burger", desc: "On Max’s brioche bun · veggie patty available" },
          { name: "Grilled Chicken Club" },
          { name: "Compose your own sandwich" },
        ] },
        { title: "Plates", items: [
          { name: "The Omelette", tags: ["GF", "VG"] },
          { name: "Seared Pacific Cod Fish Tacos", tags: ["GF"] },
        ] },
      ],
    };
  }
  return {
    date: key, venue,
    special: { name: `Pour of the day: ${pours[d]}`, desc: `Happy hour bite: ${happyHourBites[d]}` },
    soup,
    sections: [
      { title: "Morning", note: "7:00–11:00 am", items: [
        { name: "Espresso, cappuccino & lattes", desc: "Oat, almond and whole milk" },
        { name: "Drip coffee & loose-leaf tea" },
        { name: `Pastry of the day: ${rendezvousPastry[d]}`, tags: ["VG"] },
        { name: "Biscotti & house granola bars", tags: ["VG"] },
      ] },
      { title: "Lunch", note: "11:00 am–2:00 pm", items: [
        { name: "Soup", desc: soup.name, tags: soup.tags },
        { name: "Side salad", desc: "Mixed greens, cherry tomatoes, balsamic", tags: ["VG", "GF", "DF"] },
        rendezvousPanini[d],
        { name: "Craft sodas", desc: "Root beer, cream soda, blood orange" },
      ] },
      { title: "Happy Hour", note: "Tuesdays & Fridays 3:00–4:00 pm with live music, plus special happy hours on the calendar", items: [
        { name: "Wine by the glass", desc: pours[d] },
        { name: "Cocktails & mocktails" },
        { name: "Complimentary snacks for friends and visitors", desc: happyHourBites[d] },
      ] },
    ],
  };
}

export const allMenus = (date: Date) => venueOrder.map((v) => menuFor(v, date));
