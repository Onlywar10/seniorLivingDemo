// Live menus for Kestrel Point’s three restaurants. Standing menus plus a daily rotation of soups and chef’s specials.
// Mirrors the Alder Bend menus module export for export. Fictional example content.
//
// SHAPE DIFFERENCES FROM src/data/menus.ts
// - `VenueKey` is "juniper" | "meadowbrook" | "bistro" (AB: "juniper" | "millpond" | "perch").
//   The Juniper Room, Meadowbrook Cafe and the Bistro.
// - `Venue` and `DayMenu` are redeclared locally only because their `key` / `venue` field uses
//   the local `VenueKey`. Their fields are otherwise identical.
// - `Tag`, `tagLabels`, `Dish` and `Section` are imported unchanged.
//
// Venues: the Juniper Room (11:00 am–7:00 pm, white tablecloth, weekly seasonal menu), Meadowbrook
// Cafe (7:00 am–7:00 pm, casual comfort food and a daily chef’s special) and the Bistro
// (7:00 am–7:00 pm, coffee and pastry, patio lunch, daily happy hour). No prices are shown, as for AB.

import { dow, iso } from "@/lib/clock";
import { tagLabels, type Dish, type Section, type Tag } from "@/data/shared";

export { tagLabels };
export type { Dish, Section, Tag };

export type VenueKey = "juniper" | "meadowbrook" | "bistro";
export interface Venue { key: VenueKey; name: string; kind: string; hours: string; open: number; close: number; photo: string; blurb: string }

export const venues: Record<VenueKey, Venue> = {
  juniper: { key: "juniper", name: "The Juniper Room", kind: "White-tablecloth dining", hours: "11:00 am–7:00 pm", open: 660, close: 1140, photo: "/img/juniper-2.jpg", blurb: "A seasonally inspired weekly menu of local, market-fresh ingredients — and dessert." },
  meadowbrook: { key: "meadowbrook", name: "Meadowbrook Cafe", kind: "All-day California-casual", hours: "7:00 am–7:00 pm", open: 420, close: 1140, photo: "/img/outdoor-dining.jpg", blurb: "Modern comfort food all day: soups, salads, sandwiches, pasta and a daily chef’s special." },
  bistro: { key: "bistro", name: "The Bistro", kind: "Coffeehouse & wine bar", hours: "7:00 am–7:00 pm", open: 420, close: 1140, photo: "/img/kp/bistro.jpg", blurb: "Morning coffee to happy hour — the community’s ‘town hall’." },
};

export const venueOrder: VenueKey[] = ["juniper", "meadowbrook", "bistro"];

// Daily rotation, Sunday first.
const soups = ["Roasted Tomato Basil (VG, GF)", "Chicken Pozole Verde (GF, DF)", "Italian Wedding Soup (DF)", "Cream of Mushroom (VG)", "Lentil & Vegetable (VG, GF, DF)", "Corn & Potato Chowder (VG, GF)", "Chicken Noodle (DF)"];

const juniperSpecials: Dish[] = [
  { name: "Roast Leg of Lamb", desc: "Rosemary jus, garlic smashed potatoes, glazed carrots", tags: ["GF", "DF"] },
  { name: "Pan-Roasted Halibut", desc: "Lemon beurre blanc, farro with spring peas", tags: [] },
  { name: "Beef Bourguignon", desc: "Slow-braised in red wine, pearl onions, buttered noodles" },
  { name: "Butternut Squash Ravioli", desc: "Brown butter, sage, toasted hazelnuts", tags: ["VG"] },
  { name: "Valley Asparagus & Chicken Roulade", desc: "Prosciutto, fontina, Marsala cream", tags: ["GF"] },
  { name: "Seared Scallops", desc: "Sweet corn purée, crispy pancetta, arugula", tags: ["GF"] },
  { name: "Grilled Pork Chop", desc: "Apple-mustard glaze, roasted root vegetables", tags: ["GF", "DF"] },
];

const meadowbrookSpecials: Dish[] = [
  { name: "Chicken & Waffles", desc: "Buttermilk fried chicken, maple butter" },
  { name: "Baked Ziti", desc: "Italian sausage, ricotta, marinara, garlic bread" },
  { name: "Meatloaf Plate", desc: "Mashed potatoes, mushroom gravy, green beans" },
  { name: "Chicken Enchiladas Verdes", desc: "Tomatillo sauce, Spanish rice, black beans", tags: ["GF"] },
  { name: "Pasta Primavera", desc: "Penne, seasonal vegetables, garlic olive oil, parmesan", tags: ["VG"] },
  { name: "Fish Tacos", desc: "Grilled cod, cabbage slaw, chipotle crema, corn tortillas", tags: ["GF"] },
  { name: "Turkey Club Melt", desc: "Sourdough, bacon, Swiss, tomato, avocado" },
];

const bistroPastry = ["Almond Croissant", "Pumpkin Loaf", "Blueberry Scone", "Morning Bun", "Lemon Poppyseed Muffin", "Pear Danish", "Chocolate Croissant"];
const bistroPanini = [
  { name: "Caprese Panini", desc: "Fresh mozzarella, tomato, basil pesto", tags: ["VG"] as Tag[] },
  { name: "Turkey & Provolone Panini", desc: "Roast turkey, provolone, roasted red peppers" },
  { name: "Italian Panini", desc: "Salami, mortadella, provolone, olive tapenade" },
  { name: "Roast Vegetable Panini", desc: "Eggplant, zucchini, peppers, goat cheese", tags: ["VG"] as Tag[] },
  { name: "Chicken Pesto Panini", desc: "Grilled chicken, mozzarella, basil pesto" },
  { name: "Prosciutto & Fig Panini", desc: "Prosciutto, fig jam, fontina, arugula" },
  { name: "Tuna Melt Panini", desc: "Albacore, white cheddar, tomato" },
];
const happyHourBites = ["Bruschetta trio", "Warm olives and marcona almonds", "Antipasto skewers", "Arancini with marinara", "Baked brie with honey", "Spinach-artichoke dip with crostini", "Caprese bites"];
const pours = ["Juniper Hills Old Vine Zinfandel", "Calder River Chenin Blanc", "Juniper Hills Barbera", "Prosecco", "Sonoma Coast Chardonnay", "Juniper Hills Estate Zinfandel", "Paso Robles Cabernet"];

function parseTags(s: string): Dish {
  const m = s.match(/^(.*?)\s*\(([A-Z, ]+)\)$/);
  return m ? { name: m[1], tags: m[2].split(",").map((x) => x.trim()) as Tag[] } : { name: s };
}

export interface DayMenu { date: string; venue: VenueKey; special: Dish; soup: Dish; sections: Section[]; holiday?: string }

const thanksgiving: Section[] = [
  { title: "Thanksgiving Dinner · 11:00 am–3:00 pm, by reservation", items: [
    { name: "Roasted Butternut Squash Soup", desc: "Toasted pepitas, crème fraîche", tags: ["VG", "GF"] },
    { name: "Autumn Salad", desc: "Mixed greens, pears, candied pecans, dried cranberries, maple vinaigrette", tags: ["VG", "GF"] },
    { name: "Herb-Roasted Turkey", desc: "Sage pan gravy, cranberry-orange relish", tags: ["GF"] },
    { name: "Honey-Glazed Ham", desc: "Brown sugar and clove glaze", tags: ["GF", "DF"] },
    { name: "Wild Mushroom Wellington", desc: "For our vegetarian guests", tags: ["VG"] },
    { name: "Sides", desc: "Sourdough sage stuffing, Yukon gold mashed potatoes, candied yams, green beans almondine, dinner rolls" },
    { name: "Desserts", desc: "Pumpkin pie with whipped cream, pecan pie, apple crisp with vanilla gelato" },
  ] },
];

/** The menu for one venue on one day. */
export function menuFor(venue: VenueKey, date: Date): DayMenu {
  const d = dow(date);
  const key = iso(date);
  const soup = parseTags(soups[d]);
  if (venue === "juniper") {
    const special = juniperSpecials[d];
    if (key === "2026-11-26") return { date: key, venue, special: { name: "Thanksgiving Dinner", desc: "Herb-roasted turkey with all the trimmings" }, soup, sections: thanksgiving, holiday: "Thanksgiving" };
    return {
      date: key, venue, special, soup,
      sections: [
        { title: "To Begin", items: [
          { name: "Soup of the Day", desc: soup.name, tags: soup.tags },
          { name: "Roasted Pear Salad", desc: "Butter lettuce, gorgonzola, candied pecans, champagne vinaigrette", tags: ["VG", "GF"] },
          { name: "Crab Cake", desc: "Remoulade, lemon, micro greens" },
        ] },
        { title: "Mains", items: [
          { name: "New York Strip", desc: "Grilled 8 oz, red wine demi-glace", tags: ["GF"] },
          { name: "Chicken Saltimbocca", desc: "Sage, prosciutto, white wine pan sauce" },
          { name: "Grilled Salmon Filet", desc: "Lemon dill butter", tags: ["GF"] },
          { name: "Mushroom Risotto", desc: "Arborio rice, seasonal mushrooms, parmesan", tags: ["VG", "GF"] },
        ] },
        { title: "Sides", items: [{ name: "Roasted asparagus" }, { name: "Honey-glazed carrots" }, { name: "Wild rice pilaf" }, { name: "Mashed potatoes" }, { name: "Baked potato" }] },
        { title: "Sweet Endings", items: [{ name: "Crème brûlée" }, { name: "Seasonal fruit tart" }, { name: "Gelato", desc: "Vanilla bean, chocolate or lemon sorbetto" }] },
      ],
    };
  }
  if (venue === "meadowbrook") {
    return {
      date: key, venue, special: meadowbrookSpecials[d], soup,
      sections: [
        { title: "Breakfast", note: "7:00–10:30 am", items: [
          { name: "Steel-cut oatmeal or Cream of Wheat" },
          { name: "Greek yogurt parfait with house granola", tags: ["VG"] },
          { name: "Avocado toast with a poached egg", tags: ["VG"] },
          { name: "Buttermilk pancakes", tags: ["VG"] },
          { name: "Cinnamon French toast", tags: ["VG"] },
          { name: "Garden scramble", tags: ["VG", "GF"] },
          { name: "Eggs your way", tags: ["GF"] },
          { name: "Sides", desc: "Bacon, chicken-apple sausage, hash browns, toast, fruit, tomato, avocado" },
        ] },
        { title: "Salads & Soups", items: [
          { name: "Classic Caesar", tags: ["VG"] },
          { name: "Cobb Salad", desc: "Grilled chicken, bacon, egg, avocado, blue cheese, tomato", tags: ["GF"] },
          { name: "Today’s soup", desc: soup.name, tags: soup.tags },
          { name: "Lunch combo", desc: "A cup of soup and half a sandwich or small salad" },
        ] },
        { title: "Sandwiches", note: "With fries, salad, soup or fruit", items: [
          { name: "The Kestrel Burger", desc: "On a brioche bun · veggie patty available" },
          { name: "French Dip" },
          { name: "Compose your own sandwich" },
        ] },
        { title: "Pasta & Plates", items: [
          { name: "Spaghetti & Meatballs" },
          { name: "Fettuccine Alfredo", desc: "Add grilled chicken or shrimp", tags: ["VG"] },
          { name: "The Omelette", tags: ["GF", "VG"] },
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
        { name: `Pastry of the day: ${bistroPastry[d]}`, tags: ["VG"] },
        { name: "Biscotti", tags: ["VG"] },
      ] },
      { title: "On the Patio", note: "11:00 am–2:00 pm", items: [
        { name: "Soup", desc: soup.name, tags: soup.tags },
        { name: "Side salad", desc: "Mixed greens, cherry tomatoes, balsamic", tags: ["VG", "GF", "DF"] },
        bistroPanini[d],
        { name: "Craft sodas", desc: "Root beer, cream soda, blood orange" },
      ] },
      { title: "Happy Hour", note: "Daily, with live music on Tuesdays & Fridays 3:00–4:00 pm", items: [
        { name: "Wine by the glass", desc: pours[d] },
        { name: "Cocktails & mocktails" },
        { name: "Complimentary snacks for friends and visitors", desc: happyHourBites[d] },
      ] },
    ],
  };
}

export const allMenus = (date: Date) => venueOrder.map((v) => menuFor(v, date));
