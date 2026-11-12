// Menus for the three restaurants, built from how the kitchen plans each one (staff Menus → the menu templates):
// - The Juniper Room: a four-week Fall/Winter cycle menu (only the special and soup rotate) on top of a standing menu;
// - Millpond Café: one always-available menu, with a chef's special added each day;
// - The Perch: daily specials (pour, happy hour bite, pastry, panini, soup) around a few standing drinks and snacks.
// Every page that shows a menu reads menuFor(), so the website, newsletter and print follow the templates.
import { dow, iso } from "@/lib/clock";
import { cycleWeek, tagLabels, type CycleDish, type DayMenu, type Dish, type MenuCycle, type MenuPlan, type Section, type Tag, type Venue } from "@/data/shared";

export { tagLabels };
export type { DayMenu, Dish, Section, Tag, Venue };

export type VenueKey = "juniper" | "millpond" | "perch";

export const venues: Record<VenueKey, Venue> = {
  juniper: { key: "juniper", name: "The Juniper Room", kind: "White-tablecloth dining", hours: "11:00 am–7:00 pm", open: 660, close: 1140, photo: "/img/juniper.jpg", blurb: "Seasonal, farm-to-table, and a new menu every week." },
  millpond: { key: "millpond", name: "Millpond Café", kind: "All-day California comfort food", hours: "7:00 am–7:00 pm", open: 420, close: 1140, photo: "/img/millpond.jpg", blurb: "Flapjacks at breakfast, fish tacos at lunch, a burger whenever you like." },
  perch: { key: "perch", name: "The Perch", kind: "Coffeehouse & wine bar", hours: "7:00 am–7:00 pm", open: 420, close: 1140, photo: "/img/perch.jpg", blurb: "Morning latte to pre-dinner wine — the community’s town hall." },
};

export const venueOrder: VenueKey[] = ["juniper", "millpond", "perch"];

// The kitchen's soups, Sunday first. Each cycle week serves them in its own order.
const soups = ["Butternut Squash Bisque (VG, GF)", "Chicken Tortilla Soup (GF, DF)", "Minestrone (VG, DF)", "Loaded Baked Potato Soup", "Tomato Basil Bisque (VG)", "New England Clam Chowder", "Split Pea with Ham (GF, DF)"];
const soupOrder = [3, 0, 5, 1];
// The same soups in Lantern wording.
const plainSoup: Record<string, string> = { "Butternut Squash Bisque": "Squash soup", "Chicken Tortilla Soup": "Chicken soup", Minestrone: "Vegetable soup", "Loaded Baked Potato Soup": "Potato soup", "Tomato Basil Bisque": "Tomato soup", "New England Clam Chowder": "Clam chowder", "Split Pea with Ham": "Pea soup with ham" };

function parseTags(s: string): Dish {
  const m = s.match(/^(.*?)\s*\(([A-Z, ]+)\)$/);
  return m ? { name: m[1], tags: m[2].split(",").map((x) => x.trim()) as Tag[] } : { name: s };
}

// The Juniper Room's Fall/Winter cycle: four weeks of specials, Sunday first. Week 2 is the week of Nov 8, 2026.
const juniperWeeks: CycleDish[][] = [
  [
    { name: "Roast Chicken with Root Vegetables", desc: "Thyme jus, carrots, parsnips, fingerling potatoes", tags: ["GF", "DF"], plain: "Roast chicken and vegetables" },
    { name: "Baked Cod Florentine", desc: "Spinach, lemon cream, rice pilaf", tags: ["GF"], plain: "Baked fish with spinach and rice" },
    { name: "Beef Stroganoff", desc: "Cremini mushrooms, sour cream sauce, buttered egg noodles", plain: "Beef and noodles" },
    { name: "Butternut Squash Lasagna", desc: "Sage béchamel, ricotta, toasted pepitas", tags: ["VG"], plain: "Squash lasagna" },
    { name: "Yankee Pot Roast", desc: "Braised chuck, carrots, pearl onions, mashed potatoes", tags: ["GF"], plain: "Pot roast with mashed potatoes" },
    { name: "Shrimp and Grits", desc: "Stone-ground grits, Cajun cream, scallions", tags: ["GF"], plain: "Shrimp and soft grits" },
    { name: "Turkey Meatloaf", desc: "Tomato glaze, green beans, mashed potatoes", plain: "Meatloaf and green beans" },
  ],
  [
    { name: "Slow-Roasted Prime Rib", desc: "Au jus, creamy horseradish, Yorkshire pudding", tags: ["DF"], plain: "Roast beef" },
    { name: "Pan-Seared Petrale Sole", desc: "Lemon caper beurre blanc, wild rice pilaf", tags: ["GF"], plain: "Baked fish and rice" },
    { name: "Braised Short Rib", desc: "Red wine reduction over parmesan polenta", tags: ["GF"], plain: "Beef with soft polenta" },
    { name: "Wild Mushroom Risotto", desc: "Arborio rice, truffle oil, shaved parmesan", tags: ["VG", "GF"], plain: "Creamy mushroom rice" },
    { name: "Herb-Crusted Pork Tenderloin", desc: "Apple-cider glaze, roasted sweet potatoes", tags: ["GF", "DF"], plain: "Pork with sweet potatoes" },
    { name: "Cioppino", desc: "San Francisco-style seafood stew, grilled sourdough", tags: ["DF"], plain: "Fish stew with bread" },
    { name: "Chicken Marsala", desc: "Cremini mushrooms, Marsala wine sauce, buttered egg noodles", plain: "Chicken with mushrooms and noodles" },
  ],
  [
    { name: "Roast Turkey Breast", desc: "Sage gravy, cornbread stuffing, cranberry relish", plain: "Roast turkey with gravy" },
    { name: "Lemon Herb Halibut", desc: "Roasted fennel, pearl couscous", tags: ["DF"], plain: "Baked fish with couscous" },
    { name: "Coq au Vin", desc: "Chicken braised in red wine, mushrooms, mashed potatoes", tags: ["GF"], plain: "Chicken in red wine sauce" },
    { name: "Eggplant Parmesan", desc: "Marinara, mozzarella, spaghetti", tags: ["VG"], plain: "Eggplant with tomato sauce and cheese" },
    { name: "Pork Chop with Apples", desc: "Sautéed apples, braised red cabbage", tags: ["GF", "DF"], plain: "Pork chop with apples" },
    { name: "Beef Tips over Rice", desc: "Mushroom gravy, steamed green beans", plain: "Beef and rice" },
    { name: "Dungeness Crab Cakes", desc: "Remoulade, slaw, roasted potatoes", plain: "Crab cakes", finger: true },
  ],
  [
    { name: "Braised Lamb Shank", desc: "Rosemary jus, white bean ragout", tags: ["GF", "DF"], plain: "Lamb with white beans" },
    { name: "Chicken Cordon Bleu", desc: "Ham, Swiss, Dijon cream, wild rice", plain: "Chicken with ham and cheese" },
    { name: "Seared Scallops", desc: "Brown butter, cauliflower purée", tags: ["GF"], plain: "Scallops with soft cauliflower" },
    { name: "Stuffed Bell Peppers", desc: "Rice, black beans, corn, tomato, cheddar", tags: ["VG", "GF"], plain: "Stuffed peppers" },
    { name: "Swedish Meatballs", desc: "Lingonberry, cream gravy, egg noodles", plain: "Meatballs and noodles", finger: true },
    { name: "Grilled Mahi-Mahi", desc: "Mango salsa, coconut rice", tags: ["GF", "DF"], plain: "Grilled fish with rice" },
    { name: "Chicken and Dumplings", desc: "Slow-simmered with carrots, celery and herb dumplings", plain: "Chicken and dumplings" },
  ],
];

export const juniperCycle: MenuCycle = {
  season: "Fall/Winter", nextSeason: "Spring/Summer",
  anchor: "2026-10-04", weeks: 4, starts: "2026-10-04", ends: "2027-03-27", nextDue: "2027-03-01",
  specials: juniperWeeks,
  soups: soupOrder.map((o) => soups.map((_, d) => { const x = parseTags(soups[(d + o) % 7]); return { ...x, plain: plainSoup[x.name] ?? x.name }; })),
  periods: ["Lunch and dinner, 11:00 am–7:00 pm"],
};

/** The kitchen's soup of the day: from the Juniper Room's cycle, served in every restaurant. */
const soupOn = (date: Date): Dish => { const x = juniperCycle.soups[cycleWeek(juniperCycle, date)][dow(date)]; return x.tags ? { name: x.name, tags: x.tags } : { name: x.name }; };

// Millpond's chef's special, one a day, sent by text.
const millpondSpecials: Dish[] = [
  { name: "Country Benedict", desc: "Buttermilk biscuit, sausage gravy, two poached eggs" },
  { name: "Turkey Pot Pie", desc: "Flaky crust, garden vegetables, side salad" },
  { name: "French Dip", desc: "Shaved roast beef on a toasted roll, au jus, fries" },
  { name: "Southwest Chicken Bowl", desc: "Cilantro-lime rice, black beans, pico, avocado", tags: ["GF", "DF"] },
  { name: "Patty Melt", desc: "Grilled rye, Swiss, caramelised onions" },
  { name: "Fish & Chips", desc: "Beer-battered cod, house tartar, coleslaw", tags: ["DF"] },
  { name: "Huevos Rancheros", desc: "Corn tortillas, black beans, ranchero sauce, cotija", tags: ["VG", "GF"] },
];

// The Perch's daily slots, filled each morning from a photo of the board.
const perchPastry = ["Almond Croissant", "Pumpkin Bread", "Blueberry Scone", "Cinnamon Roll", "Lemon Poppyseed Muffin", "Apple Turnover", "Chocolate Croissant"];
const perchPanini = [
  { name: "Caprese Panini", desc: "Fresh mozzarella, tomato, basil pesto", tags: ["VG"] as Tag[] },
  { name: "Turkey Pesto Panini", desc: "Roast turkey, provolone, sun-dried tomato pesto" },
  { name: "Cubano", desc: "Roast pork, ham, Swiss, pickles, mustard" },
  { name: "Roast Vegetable Panini", desc: "Zucchini, peppers, goat cheese", tags: ["VG"] as Tag[] },
  { name: "Italian Panini", desc: "Salami, capicola, provolone, giardiniera" },
  { name: "Chicken Pesto Panini", desc: "Grilled chicken, mozzarella, basil pesto" },
  { name: "Ham & Brie Panini", desc: "Black Forest ham, brie, fig jam" },
];
const happyHourBites = ["Bruschetta trio", "Spinach-artichoke dip with crostini", "Antipasto skewers", "Meatballs in marinara", "Baked brie with honey", "Shrimp cocktail shooters", "Caprese bites"];
const pours = ["Larkspur Cellars Tempranillo", "Juniper Hills Zinfandel", "Sonoma Coast Chardonnay", "Calder River Old Vine Zinfandel", "Prosecco", "Napa Sauvignon Blanc", "Paso Robles Cabernet"];

// ---------------------------------------------------------------- the standing (always-available) menus

const juniperStanding: Section[] = [
  { title: "To Begin", items: [
    { name: "Soup of the Day", desc: "From the cycle" },
    { name: "Marinated Beet Salad", desc: "Roasted red and golden beets, goat cheese, candied walnuts, arugula, balsamic vinaigrette", tags: ["VG"] },
    { name: "Shrimp Cocktail", desc: "Four freshly poached prawns, house-made cocktail sauce", tags: ["GF"] },
  ] },
  { title: "Mains", items: [
    { name: "Flat Iron Steak", desc: "Flame-grilled 6 oz, green peppercorn sauce" },
    { name: "Chicken Piccata", desc: "Scallopini with lemon, white wine, capers, garlic and parsley" },
    { name: "Grilled Salmon Filet", desc: "Lemon herb butter" },
    // The menu the kitchen gave said "Vegetarian · Dairy free"; prawns and pesto say otherwise, so the tags wait for the chef.
    { name: "Linguini Primavera", desc: "Seasonal vegetables, basil pesto, six garlic-lemon prawns" },
  ] },
  { title: "Sides", items: [{ name: "Grilled asparagus" }, { name: "Roasted rosemary cauliflower" }, { name: "Linguini" }, { name: "Mashed potatoes" }, { name: "Baked potato" }] },
  { title: "Sweet Endings", items: [{ name: "Crème brûlée" }, { name: "Gelato", desc: "Vanilla bean, salted caramel or raspberry sorbetto" }] },
];

const millpondStanding: Section[] = [
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
    { name: "Today’s soup", desc: "The kitchen’s soup of the day" },
    { name: "Lunch combo", desc: "A cup of soup and a small salad" },
  ] },
  { title: "Sandwiches", note: "With fries, salad, soup or fruit", items: [
    { name: "The AB Burger", desc: "On a house-baked brioche bun · veggie patty available" },
    { name: "Grilled Chicken Club" },
    { name: "Compose your own sandwich" },
  ] },
  { title: "Plates", items: [
    { name: "The Omelette", tags: ["GF", "VG"] },
    { name: "Seared Pacific Cod Fish Tacos", tags: ["GF"] },
  ] },
];

const perchStanding: Section[] = [
  { title: "Morning", note: "7:00–11:00 am", items: [
    { name: "Espresso, cappuccino & lattes", desc: "Oat, almond and whole milk" },
    { name: "Drip coffee & loose-leaf tea" },
    { name: "Biscotti & house granola bars", tags: ["VG"] },
  ] },
  { title: "Lunch", note: "11:00 am–2:00 pm", items: [
    { name: "Side salad", desc: "Mixed greens, cherry tomatoes, balsamic", tags: ["VG", "GF", "DF"] },
    { name: "Craft sodas", desc: "Root beer, cream soda, blood orange" },
  ] },
  { title: "Happy Hour", note: "Tuesdays & Fridays 3:00–4:00 pm with live music, plus special happy hours on the calendar", items: [
    { name: "Cocktails & mocktails" },
  ] },
];

/** How the kitchen plans each restaurant (staff Menus). */
export const menuPlan: MenuPlan = {
  juniper: {
    template: "cycle", standing: juniperStanding, standingChanged: "2026-10-04", cycle: juniperCycle,
    holds: [{ dish: "Linguini Primavera", tags: ["VG", "DF"], why: ["six garlic-lemon prawns: not vegetarian", "basil pesto: usually made with parmesan"], maybe: [{ tag: "DF", if: "the pesto has no cheese" }] }],
    lantern: { finger: ["Chicken tenders", "Cheese and tomato sandwich quarters", "Fresh fruit pieces", "Steamed carrot sticks"] },
  },
  millpond: {
    template: "standing", standing: millpondStanding, standingChanged: "2026-10-03",
    slots: [{ key: "special", label: "Chef’s special", period: "All day" }], via: "text",
  },
  perch: {
    template: "daily", standing: perchStanding, standingChanged: "2026-09-12", via: "photo",
    slots: [
      { key: "pastry", label: "Pastry of the day", period: "Morning" },
      { key: "panini", label: "Panini of the day", period: "Lunch" },
      { key: "soup", label: "Soup of the day", period: "Lunch" },
      { key: "pour", label: "Pour of the day", period: "Happy hour" },
      { key: "bite", label: "Happy hour bite", period: "Happy hour" },
    ],
  },
};

/** A restaurant's daily items for a date, as the kitchen sent them: Millpond's chef's special, the Perch's board. */
export function slotsFor(venue: string, date: Date): Record<string, Dish> {
  const d = dow(date);
  if (venue === "millpond") return { special: millpondSpecials[d] };
  if (venue !== "perch") return {};
  return { pastry: { name: perchPastry[d], tags: ["VG"] }, panini: perchPanini[d], soup: soupOn(date), pour: { name: pours[d] }, bite: { name: happyHourBites[d] } };
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

/** The menu for one venue on one day: the template's standing menu plus that day's rotating or daily items. */
export function menuFor(venue: VenueKey, date: Date): DayMenu {
  const d = dow(date);
  const key = iso(date);
  const soup = soupOn(date);
  const withSoup = (sections: Section[], name: string) => sections.map((s) => ({ ...s, items: s.items.map((it) => (it.name === name ? { ...it, desc: soup.name, tags: soup.tags } : it)) }));
  if (venue === "juniper") {
    if (key === "2026-11-26") return { date: key, venue, special: { name: "Thanksgiving Dinner", desc: "Herb-roasted turkey with all the trimmings" }, soup, sections: thanksgiving, holiday: "Thanksgiving" };
    const c = juniperCycle.specials[cycleWeek(juniperCycle, date)][d];
    const special: Dish = c.tags ? { name: c.name, desc: c.desc, tags: c.tags } : { name: c.name, desc: c.desc };
    return { date: key, venue, special, soup, sections: withSoup(juniperStanding, "Soup of the Day") };
  }
  if (venue === "millpond") return { date: key, venue, special: millpondSpecials[d], soup, sections: withSoup(millpondStanding, "Today’s soup") };
  const s = slotsFor("perch", date);
  const [morning, lunch, happy] = perchStanding;
  return {
    date: key, venue,
    special: { name: `Pour of the day: ${s.pour.name}`, desc: `Happy hour bite: ${s.bite.name}` },
    soup,
    sections: [
      { ...morning, items: [morning.items[0], morning.items[1], { name: `Pastry of the day: ${s.pastry.name}`, tags: s.pastry.tags }, morning.items[2]] },
      { ...lunch, items: [{ name: "Soup", desc: soup.name, tags: soup.tags }, lunch.items[0], s.panini, lunch.items[1]] },
      { ...happy, items: [{ name: "Wine by the glass", desc: s.pour.name }, happy.items[0], { name: "Complimentary snacks for friends and visitors", desc: s.bite.name }] },
    ],
  };
}

export const allMenus = (date: Date) => venueOrder.map((v) => menuFor(v, date));
