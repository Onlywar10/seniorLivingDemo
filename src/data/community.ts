// All content for Larkmoor House. Dates are computed from today (see src/lib/clock.ts),
// so the published week, the menus and the news always read as current.

import { addDays, dayShort, iso, longDate, mondayOf, rel, today as todayDate, weekLabel, weekdayIndex, WEEKDAYS, shortDate } from "@/lib/clock";

export const community = {
  name: "Larkmoor House",
  slug: "larkmoor-house",
  town: "Millbrook Bend",
  state: "Oregon",
  tagline: "Assisted living and memory care on Fern Street in Millbrook Bend, Oregon. Family owned since 2009.",
  address: "1400 Fern Street, Millbrook Bend, OR 97xxx",
  phone: "(503) 555-0142",
  phoneHref: "tel:+15035550142",
  email: "hello@larkmoorhouse.com",
  licence: "AL-1024-0417",
  licenceLine: "Oregon assisted living facility licence AL-1024-0417 · memory care endorsed",
  licenceRenews: "30 June 2027",
  capacity: 96,
  census: 84,
  lastSurvey: "18 March 2026",
  careLevels: ["Assisted living", "Memory care"],
  frontDesk: "Staffed 6 am – 10 pm, nurse on site 24 hours",
  get today() {
    return `${longDate(todayDate())} ${todayDate().getUTCFullYear()}`;
  },
  get todayShort() {
    return longDate(todayDate());
  },
  get weekLabel() {
    return weekLabel(mondayOf(todayDate()));
  },
  get updatedAt() {
    return `today, 6:55 am`;
  },
};

/* ---------------------------------------------------------------- activities */

export type Category = "fitness" | "social" | "arts" | "outings" | "faith" | "memory";

export const categories: Record<Category, string> = {
  fitness: "Fitness",
  social: "Social",
  arts: "Arts & learning",
  outings: "Outings",
  faith: "Faith",
  memory: "Memory care",
};

export interface Event {
  time: string;
  name: string;
  room: string;
  cat: Category;
  desc: string;
  note?: string;
  /** shown once the event is over */
  photo?: string;
  attended?: string;
}

export interface Day {
  name: string;
  date: string;
  long: string;
  iso: string;
  today?: boolean;
  past?: boolean;
  events: Event[];
}

const template: Event[][] = [
  // Monday
  [
    { time: "9:30 am", name: "Chair yoga with Bev", room: "Wellness Room", cat: "fitness", desc: "Gentle seated stretches and breathing to Bev’s Glenn Miller record. Chairs with arms for anyone who wants them.", photo: "/photos/game.jpg", attended: "18 residents" },
    { time: "10:30 am", name: "Coffee & the headlines", room: "Bistro", cat: "social", desc: "Daniel reads the morning’s news aloud and the Bistro argues about it. Coffee and pastries from the kitchen." },
    { time: "11:00 am", name: "Reminiscence circle", room: "Second-floor Lounge", cat: "memory", desc: "Old photographs and objects from the memory box to start conversations. Small group, led by Hannah." },
    { time: "2:30 pm", name: "Word games & trivia", room: "Library", cat: "arts", desc: "Teams of four, large-print answer cards, and a jar of toffees for the winners.", photo: "/photos/puzzle.jpg", attended: "14 residents" },
    { time: "6:30 pm", name: "Movie night: Singin’ in the Rain", room: "Cinema Lounge", cat: "social", desc: "Subtitles on, popcorn from the kitchen, the lights dimmed but not off." },
  ],
  // Tuesday
  [
    { time: "9:30 am", name: "Walking club", room: "Meet at the Front Lobby", cat: "fitness", desc: "Two laps of the courtyard covered walk, or round the block on Fern Street if it is dry. Walkers and wheelchairs welcome; a caregiver comes along.", photo: "/photos/walking.jpg", attended: "11 residents" },
    { time: "10:30 am", name: "Larkmoor Singers rehearsal", room: "Garden Room", cat: "social", desc: "The house choir, open to anyone who can hold a song sheet. This month: songs from the musicals." },
    { time: "1:00 pm", name: "Medical appointments bus", room: "Departs the Front Lobby", cat: "outings", desc: "Appointments within 15 miles. Wheelchair lift on board. Book with Roy (ext. 160) by noon the day before." },
    { time: "2:30 pm", name: "Watercolor with Ines", room: "Art Studio", cat: "arts", desc: "A local artist teaches one simple painting each week. All materials provided; no experience needed.", photo: "/photos/painting.jpg", attended: "11 residents" },
    { time: "3:30 pm", name: "Music & movement", room: "Second-floor Lounge", cat: "memory", desc: "Familiar songs with scarves and shakers, for residents of the memory care household." },
    { time: "4:00 pm", name: "Happy hour with pianist Del Mercer", room: "Bistro", cat: "social", desc: "Del takes requests from the Great American Songbook. Wine, beer and mocktails; families very welcome.", photo: "/photos/dancing.jpg", attended: "38 residents, 9 guests" },
  ],
  // Wednesday
  [
    { time: "9:30 am", name: "Sit & be fit", room: "Wellness Room", cat: "fitness", desc: "Seated strength work with light hand weights and resistance bands." },
    { time: "10:00 am", name: "Shopping bus: Fred’s Market & the pharmacy", room: "Departs the Front Lobby", cat: "outings", desc: "An hour at Fred’s and a stop at Fern Street Pharmacy. Roy helps carry the bags in.", photo: "/photos/talking.jpg", attended: "9 residents" },
    { time: "11:00 am", name: "Communion service", room: "Chapel", cat: "faith", desc: "Father Tom from St Mary’s brings communion. All are welcome to sit in." },
    { time: "2:00 pm", name: "Bingo", room: "Main Dining Room", cat: "social", desc: "Large-print cards and prizes from the gift shop. Caller: Tom, with commentary." },
    { time: "3:30 pm", name: "Sensory garden hour", room: "Second-floor Terrace", cat: "memory", desc: "Herbs to rub, birds to watch and tea outside on the walled terrace, weather permitting.", photo: "/photos/garden-bench.jpg", attended: "8 residents" },
  ],
  // Thursday
  [
    { time: "9:30 am", name: "Chair yoga with Bev", room: "Wellness Room", cat: "fitness", desc: "Gentle seated stretches and breathing. The best-attended class of the week." },
    { time: "10:30 am", name: "Current events with Daniel", room: "Library", cat: "arts", desc: "One big story, discussed properly, with maps and the newspaper on the table." },
    { time: "1:30 pm", name: "Garden club", room: "Courtyard raised beds", cat: "social", desc: "Planting, weeding and picking at the wheelchair-height beds. Family members are welcome to bring gloves.", photo: "/photos/gardening.jpg", attended: "9 residents" },
    { time: "2:00 pm", name: "Baking together", room: "Second-floor Kitchen", cat: "memory", desc: "Scones or cookies for the afternoon tea trolley, measured and mixed together." },
    { time: "3:00 pm", name: "Sing-along with the Larkmoor Singers", room: "Garden Room", cat: "social", desc: "Song sheets in large print, tea afterwards." },
    { time: "6:30 pm", name: "Cribbage & cards", room: "Bistro", cat: "social", desc: "Cribbage, rummy and a long-running bridge four. Tables set up by 6:15.", photo: "/photos/chess.jpg", attended: "12 residents" },
  ],
  // Friday
  [
    { time: "9:30 am", name: "Balance & strength", room: "Wellness Room", cat: "fitness", desc: "Led by our visiting physical therapist. Fall prevention without anyone calling it that." },
    { time: "10:30 am", name: "Book group", room: "Library", cat: "arts", desc: "This month: The Thursday Murder Club. Large-print and audio copies at the front desk." },
    { time: "2:00 pm", name: "Visit from Millbrook Bend Elementary", room: "Garden Room", cat: "social", desc: "The third grade come to read, draw and ask questions. The most requested afternoon of the month." },
    { time: "4:00 pm", name: "Happy hour", room: "Bistro", cat: "social", desc: "Live guitar from the Hendersons. Families welcome." },
    { time: "6:30 pm", name: "Movie night: Roman Holiday", room: "Cinema Lounge", cat: "social", desc: "Subtitles on and popcorn from the kitchen." },
  ],
  // Saturday
  [
    { time: "9:00 am", name: "Pancake breakfast with families", room: "Main Dining Room", cat: "social", desc: "Bring the grandchildren. Guests $6, paid at the front desk.", photo: "/photos/dining-three.jpg", attended: "41 residents, 23 guests" },
    { time: "10:30 am", name: "Documentary & discussion", room: "Cinema Lounge", cat: "arts", desc: "A short documentary with tea and a conversation afterwards." },
    { time: "2:00 pm", name: "Scenic drive to Silver Falls", room: "Departs the Front Lobby", cat: "outings", desc: "An afternoon drive with a stop for ice cream. Twelve seats; sign up at the front desk." },
    { time: "3:30 pm", name: "College football on the big screen", room: "Cinema Lounge", cat: "social", desc: "Snacks, the big screen and strong opinions." },
  ],
  // Sunday
  [
    { time: "9:30 am", name: "Bus to First Methodist", room: "Departs the Front Lobby", cat: "faith", desc: "To the 10 o’clock service and back by 11:45." },
    { time: "10:30 am", name: "Interfaith service with Pastor Ruth Alvarez", room: "Chapel", cat: "faith", desc: "A short service of readings, hymns and prayer, open to all faiths and none." },
    { time: "12:00 pm", name: "Sunday roast", room: "Main Dining Room", cat: "social", desc: "The busiest lunch of the week. Guest meals $12; tell the front desk by 10 am." },
    { time: "2:30 pm", name: "Jigsaw table & quiet reading", room: "Library", cat: "arts", desc: "A 1,000-piece puzzle on the go and the week’s papers." },
    { time: "3:00 pm", name: "Hand massage & music", room: "Second-floor Lounge", cat: "memory", desc: "A calm Sunday afternoon with lotion, music and company." },
  ],
];

/** The current week, Monday to Sunday, with today and past days flagged. */
export function getWeek(): Day[] {
  const t = todayDate();
  const mon = mondayOf(t);
  const ti = weekdayIndex(t);
  return template.map((events, i) => {
    const d = addDays(mon, i);
    return {
      name: WEEKDAYS[i],
      date: shortDate(d),
      long: longDate(d),
      iso: iso(d),
      today: i === ti || undefined,
      past: i < ti || undefined,
      events,
    };
  });
}

export const getToday = () => getWeek().find((d) => d.today)!;

/* ---------------------------------------------------------------- dining */

export type Diet = "V" | "LS" | "Soft" | "GF";
export const dietLabels: Record<Diet, string> = {
  V: "Vegetarian",
  LS: "Low sodium",
  Soft: "Soft diet",
  GF: "Gluten free",
};

export interface MenuItem { name: string; diet?: Diet[] }
export interface Meal { name: "Breakfast" | "Lunch" | "Dinner"; hours: string; items: MenuItem[] }
export interface DayMenu { day: string; date: string; today?: boolean; meals: Meal[] }

export const serviceHours = [
  { meal: "Breakfast", hours: "7:30 – 9:00 am", where: "Main Dining Room", note: "Continental from 6:30 am in the Bistro" },
  { meal: "Lunch", hours: "11:45 am – 1:15 pm", where: "Main Dining Room", note: "Sunday roast 12:00 – 1:30 pm" },
  { meal: "Dinner", hours: "4:45 – 6:15 pm", where: "Main Dining Room", note: "Tray service to apartments on request" },
  { meal: "Bistro", hours: "9:00 am – 7:00 pm", where: "The Bistro", note: "Coffee, soup, sandwiches and snacks" },
];

const always: MenuItem = { name: "Always available: cereal, toast, fruit, yogurt, juice, coffee, tea", diet: ["V"] };
const B = "7:30 – 9:00 am", L = "11:45 am – 1:15 pm", D = "4:45 – 6:15 pm";

const menuTemplate: Meal[][] = [
  [
    { name: "Breakfast", hours: B, items: [{ name: "Buttermilk pancakes, maple syrup, turkey bacon" }, { name: "Veggie omelette", diet: ["V", "GF", "LS"] }, always] },
    { name: "Lunch", hours: L, items: [{ name: "Chicken and wild rice soup", diet: ["GF", "Soft"] }, { name: "Turkey club on sourdough" }, { name: "Black bean burger, sweet potato fries", diet: ["V"] }] },
    { name: "Dinner", hours: D, items: [{ name: "Chicken pot pie", diet: ["Soft"] }, { name: "Baked cod, rice pilaf, carrots", diet: ["GF", "LS", "Soft"] }, { name: "Brownie or fresh fruit" }] },
  ],
  [
    { name: "Breakfast", hours: B, items: [{ name: "Oatmeal with cinnamon apples", diet: ["V", "GF", "LS", "Soft"] }, { name: "Eggs to order, wheat toast" }, always] },
    { name: "Lunch", hours: L, items: [{ name: "Chicken noodle soup", diet: ["Soft"] }, { name: "Spinach and feta quiche, side salad", diet: ["V"] }, { name: "Rice pudding", diet: ["V", "Soft"] }] },
    { name: "Dinner", hours: D, items: [{ name: "Meatloaf, mashed potatoes, green beans", diet: ["Soft"] }, { name: "Eggplant parmesan", diet: ["V"] }, { name: "Apple crisp" }] },
  ],
  [
    { name: "Breakfast", hours: B, items: [{ name: "French toast, berries", diet: ["V"] }, { name: "Scrambled eggs, chicken sausage", diet: ["GF"] }, always] },
    { name: "Lunch", hours: L, items: [{ name: "Minestrone", diet: ["V", "LS"] }, { name: "Tuna melt, kettle chips" }, { name: "Chef salad", diet: ["GF"] }] },
    { name: "Dinner", hours: D, items: [{ name: "Roast turkey, stuffing, gravy", diet: ["Soft"] }, { name: "Shrimp stir-fry, jasmine rice", diet: ["GF", "LS"] }, { name: "Pumpkin pie" }] },
  ],
  [
    { name: "Breakfast", hours: B, items: [{ name: "Steel-cut oats with brown sugar and berries", diet: ["V", "GF", "LS"] }, { name: "Scrambled eggs, turkey sausage, wheat toast" }, { name: "Seasonal fruit plate and yogurt", diet: ["V", "GF", "Soft"] }] },
    { name: "Lunch", hours: L, items: [{ name: "Tomato basil soup", diet: ["V", "GF"] }, { name: "Grilled chicken Caesar wrap" }, { name: "Baked mac and cheese, steamed broccoli", diet: ["V", "Soft"] }] },
    { name: "Dinner", hours: D, items: [{ name: "Herb-roasted pork loin, apple chutney, mashed potatoes", diet: ["GF", "Soft"] }, { name: "Pan-seared salmon, lemon rice, green beans", diet: ["GF", "LS"] }, { name: "Vegetable lasagne", diet: ["V"] }, { name: "Lemon pudding", diet: ["Soft"] }] },
  ],
  [
    { name: "Breakfast", hours: B, items: [{ name: "Blueberry muffins, hard-boiled eggs" }, { name: "Cream of wheat", diet: ["V", "LS", "Soft"] }, always] },
    { name: "Lunch", hours: L, items: [{ name: "Clam chowder" }, { name: "Fish tacos, lime slaw" }, { name: "Bean and cheese burrito", diet: ["V"] }] },
    { name: "Dinner", hours: D, items: [{ name: "Beef stroganoff, egg noodles", diet: ["Soft"] }, { name: "Lemon herb chicken, roasted vegetables", diet: ["GF", "LS"] }, { name: "Mushroom risotto", diet: ["V", "GF", "Soft"] }, { name: "Black forest cake" }] },
  ],
  [
    { name: "Breakfast", hours: "7:30 – 9:30 am", items: [{ name: "Pancake breakfast with families ($6 guests)", diet: ["V"] }, { name: "Yogurt parfait", diet: ["V", "GF"] }, always] },
    { name: "Lunch", hours: L, items: [{ name: "Split pea soup", diet: ["V", "GF", "Soft"] }, { name: "Grilled cheese and tomato", diet: ["V"] }, { name: "Cobb salad", diet: ["GF"] }] },
    { name: "Dinner", hours: D, items: [{ name: "Beef stew, biscuits", diet: ["Soft"] }, { name: "Baked chicken thighs, wild rice", diet: ["GF", "LS"] }, { name: "Vanilla custard", diet: ["V", "Soft"] }] },
  ],
  [
    { name: "Breakfast", hours: B, items: [{ name: "Cinnamon rolls", diet: ["V"] }, { name: "Eggs Benedict" }, always] },
    { name: "Lunch", hours: "12:00 – 1:30 pm", items: [{ name: "Sunday roast: beef, Yorkshire pudding, roast potatoes, gravy", diet: ["Soft"] }, { name: "Roast chicken", diet: ["GF", "LS"] }, { name: "Nut roast", diet: ["V"] }, { name: "Trifle" }] },
    { name: "Dinner", hours: "4:45 – 6:00 pm", items: [{ name: "Soup and sandwich supper" }, { name: "Cottage cheese and fruit plate", diet: ["V", "GF", "Soft"] }] },
  ],
];

export function getWeekMenu(): DayMenu[] {
  return getWeek().map((d, i) => ({ day: d.name, date: d.date, today: d.today, meals: menuTemplate[i] }));
}
export const getTodayMenu = () => getWeekMenu().find((d) => d.today)!;

/* ---------------------------------------------------------------- photos */

export interface Photo { src: string; alt: string; caption: string; date: string; meta: string }

const photoSeed = [
  { src: "/photos/knitting.jpg", alt: "A caregiver helps two residents with knitting at a table", caption: "Knit & natter, Garden Room", ago: 1, meta: "12 residents, 2 volunteers" },
  { src: "/photos/gardening.jpg", alt: "Two older women planting in a raised garden bed", caption: "Garden club at the raised beds", ago: 5, meta: "9 residents" },
  { src: "/photos/painting.jpg", alt: "An older woman working on a watercolour at a table", caption: "Watercolor with Ines", ago: 2, meta: "11 residents, Art Studio" },
  { src: "/photos/dancing.jpg", alt: "An older couple dancing in a community hall", caption: "Happy hour with pianist Del Mercer", ago: 2, meta: "38 residents, Bistro" },
  { src: "/photos/game.jpg", alt: "A group of seniors playing a ball game in a gym", caption: "Balloon volleyball, Wellness Room", ago: 4, meta: "16 residents" },
  { src: "/photos/chess.jpg", alt: "Two older men playing chess", caption: "Chess and cribbage afternoon", ago: 5, meta: "8 residents, Bistro" },
  { src: "/photos/tea.jpg", alt: "Three seniors sharing tea and pie", caption: "Family afternoon tea", ago: 3, meta: "46 residents, 19 family guests" },
  { src: "/photos/puzzle.jpg", alt: "Seniors doing a jigsaw over coffee", caption: "Sunday jigsaw table", ago: 6, meta: "7 residents, Library" },
];

export function getRecentPhotos(): Photo[] {
  return photoSeed.map((p) => ({ src: p.src, alt: p.alt, caption: p.caption, meta: p.meta, date: dayShort(rel(-p.ago)) }));
}

/* ---------------------------------------------------------------- care team */

export interface Staff { initials: string; name: string; role: string; cred: string; years: number; call: string; ext: string; key?: boolean; photo: string; bio: string }

export const staff: Staff[] = [
  { initials: "MO", name: "Marianne Okafor", photo: "/photos/staff-marianne.jpg", role: "Executive Director", cred: "Licensed administrator, MBA", years: 9, bio: "Ran a 120-bed nursing home in Portland before coming home to Millbrook Bend; eats lunch in the dining room most days.", call: "move-in decisions, rates, any concern you couldn’t resolve with the team", ext: "101", key: true },
  { initials: "PR", name: "Priya Raghunathan", photo: "/photos/staff-priya.jpg", role: "Director of Nursing", cred: "Registered Nurse (RN, BSN)", years: 6, bio: "Twelve years on a hospital cardiac ward; her rule is that families hear from us before they hear from anyone else.", call: "medications, a change in health, hospital returns; nurse line 24 h", ext: "120", key: true },
  { initials: "HS", name: "Hannah Steinberg", photo: "/photos/staff-hannah.jpg", role: "Memory Care Coordinator", cred: "LPN, Certified Dementia Practitioner", years: 5, bio: "Builds every second-floor day around the habits each resident already had, from the newspaper to the 4 pm cup of tea.", call: "anything on the second floor, care-plan meetings, behaviour changes", ext: "210", key: true },
  { initials: "TD", name: "Tom Delacroix", photo: "/photos/staff-tom.jpg", role: "Life Enrichment Director", cred: "Certified Therapeutic Recreation Specialist", years: 4, bio: "Writes the calendar, calls the bingo and has never once let a Friday go by without music.", call: "the calendar, outings, volunteering, birthday parties", ext: "140" },
  { initials: "LB", name: "Luis Barrientos", photo: "/photos/staff-luis.jpg", role: "Dining Services Director", cred: "Certified Dietary Manager", years: 7, bio: "Buys from three local farms every week and will put your family recipe on the menu within the month.", call: "diets, allergies, textures, guest meals, the menu cycle", ext: "150" },
  { initials: "DW", name: "Daniel Whitcombe", photo: "/photos/staff-daniel.jpg", role: "Family Liaison & Social Services", cred: "Licensed Clinical Social Worker", years: 2, bio: "The first person most families meet; he answers every enquiry himself, usually the same day.", call: "tours, paperwork, Medicaid and VA questions, family meetings", ext: "105", key: true },
  { initials: "GM", name: "Grace Mbeki", photo: "/photos/staff-grace.jpg", role: "Resident Care Coordinator", cred: "Licensed Practical Nurse (LPN)", years: 3, bio: "Started here as a med aide in 2023 and now runs care on the first floor, one resident at a time.", call: "daily care routines, laundry, caregiver assignments", ext: "110" },
  { initials: "RC", name: "Roy Castellano", photo: "/photos/staff-roy.jpg", role: "Maintenance & Transportation", cred: "Commercial driver’s licence (CDL-P)", years: 11, bio: "Drives the bus, hangs the pictures on moving day and fixes most things before you finish describing them.", call: "the bus, apartment repairs, TV and thermostat", ext: "160" },
  { initials: "JP", name: "Jenna Park", photo: "/photos/staff-jenna.jpg", role: "Business Office Manager", cred: "Certified Payroll Professional", years: 5, bio: "Keeps invoices plain, insurance paperwork moving and the front office running to time.", call: "invoices, insurance paperwork, staff hiring", ext: "102" },
];

export const staffing = [
  { value: "1 : 7", label: "Caregiver to resident, days (6 am – 10 pm), assisted living" },
  { value: "1 : 5", label: "Caregiver to resident, days, memory care" },
  { value: "1 : 14", label: "Caregiver to resident, nights, both floors, plus one nurse on site" },
  { value: "5.2 yrs", label: "Average tenure across 61 staff · turnover last 12 months: 18%" },
];

/* ---------------------------------------------------------------- apartments */

export type PlanKey = "studio" | "one" | "companion" | "suite";

export interface TourRoom {
  key: string;
  name: string;
  photo: string;
  alt: string;
  /** which room on the floor plan to highlight (index into plans[plan].rooms) */
  planRoom: number;
  text: string;
  hotspots: { x: number; y: number; label: string; text: string }[];
}

export interface Apartment {
  key: PlanKey;
  name: string;
  size: string;
  sqft: number;
  floor: string;
  view: string;
  care: string;
  from: number;
  available: number;
  waitlist: number;
  photo: string;
  alt: string;
  rooms: string;
  features: string[];
  tour: TourRoom[];
}

const view = (planRoom: number): TourRoom => ({
  key: "view",
  name: "View from the window",
  photo: "/photos/building-garden.jpg",
  alt: "The courtyard garden seen from a first-floor window",
  planRoom,
  text: "The courtyard garden and the covered walk, with the garden club’s raised beds below. Afternoon sun from about two o’clock.",
  hotspots: [
    { x: 30, y: 62, label: "Raised beds", text: "Wheelchair-height beds; garden club meets Thursdays at 1:30." },
    { x: 72, y: 40, label: "Covered walk", text: "A level, covered path all the way round the courtyard, lit at night." },
  ],
});

export const apartments: Apartment[] = [
  {
    key: "studio",
    name: "Studio",
    size: "380 sq ft",
    sqft: 380,
    floor: "First floor",
    view: "Courtyard or Fern Street",
    care: "Assisted living, care levels 1 to 4",
    from: 4650,
    available: 2,
    waitlist: 0,
    photo: "/photos/apt-living.jpg",
    alt: "A bright studio apartment with a sofa, kitchenette and large window",
    rooms: "One open room for living and sleeping, a kitchenette, a walk-in closet and a bathroom with a walk-in shower and seat.",
    features: ["Walk-in shower with seat and grab bars", "Kitchenette with fridge and microwave", "Emergency call pendant and pull cords", "Individual heating and cooling"],
    tour: [
      { key: "entry", name: "Entry", photo: "/photos/apt-entry.jpg", alt: "The apartment entry with a chest of drawers and a sofa beyond", planRoom: 3, text: "A wide, level entry with room to turn a walker, a lit memory box by the door and the closet on your right.", hotspots: [{ x: 18, y: 48, label: "Lever handles", text: "Lever handles on every door, easy with arthritic hands." }, { x: 70, y: 62, label: "Storage", text: "Walk-in closet with adjustable rails at two heights." }] },
      { key: "living", name: "Living area", photo: "/photos/apt-living.jpg", alt: "The studio living area with sofa, table and window", planRoom: 0, text: "Living and sleeping in one bright room, 18 by 12 feet. Most residents put the bed by the wall and a reading chair by the window.", hotspots: [{ x: 62, y: 30, label: "Natural light", text: "A full-height window, south facing on the courtyard side." }, { x: 22, y: 70, label: "Emergency call", text: "Pull cord by the bed and a pendant worn at all times; a caregiver answers in minutes." }] },
      { key: "kitchen", name: "Kitchenette", photo: "/photos/apt-kitchen.jpg", alt: "A kitchenette counter with fruit and a microwave", planRoom: 2, text: "A fridge, microwave, sink and cupboards at a reachable height. No stove, by design; three meals a day come from the kitchen.", hotspots: [{ x: 76, y: 38, label: "Microwave at counter height", text: "No reaching overhead for hot food." }, { x: 34, y: 60, label: "Easy-reach cupboards", text: "Pull-down shelves in the upper cupboards." }] },
      { key: "bath", name: "Bathroom", photo: "/photos/apt-bath.jpg", alt: "A bathroom with a glass walk-in shower", planRoom: 1, text: "A level walk-in shower with a fold-down seat, a raised toilet and non-slip flooring throughout.", hotspots: [{ x: 28, y: 44, label: "Walk-in shower", text: "No step or lip; a fold-down seat and a hand-held shower." }, { x: 52, y: 56, label: "Grab bars", text: "Grab bars at the toilet, the shower and the sink." }, { x: 84, y: 30, label: "Emergency call", text: "A second pull cord within reach of the floor." }] },
      view(0),
    ],
  },
  {
    key: "one",
    name: "One bedroom",
    size: "540 to 560 sq ft",
    sqft: 540,
    floor: "First floor",
    view: "Fern Street, or the courtyard on the garden side",
    care: "Assisted living, care levels 1 to 4",
    from: 5450,
    available: 1,
    waitlist: 3,
    photo: "/photos/apt-living-2.jpg",
    alt: "A one-bedroom living room with plants, a sofa and a reading chair",
    rooms: "A separate bedroom, a living room with space for your own sofa and chairs, a kitchenette with a fridge and microwave, and a bathroom with a walk-in shower.",
    features: ["Separate bedroom with door", "Walk-in shower with seat and grab bars", "Room for your own sofa and dining table", "Emergency call pendant and pull cords"],
    tour: [
      { key: "entry", name: "Entry", photo: "/photos/apt-entry.jpg", alt: "The apartment entry with a chest of drawers", planRoom: 4, text: "A level entry with the coat closet and a lit shelf by the door for keys and post.", hotspots: [{ x: 18, y: 48, label: "Lever handles", text: "Lever handles throughout." }, { x: 70, y: 62, label: "Storage", text: "Coat closet and a linen cupboard." }] },
      { key: "living", name: "Living room", photo: "/photos/apt-living-2.jpg", alt: "A living room with plants and a sofa", planRoom: 0, text: "Fifteen by thirteen feet, room for your own sofa, two chairs and a small dining table by the window.", hotspots: [{ x: 50, y: 22, label: "Natural light", text: "Two windows on the courtyard side." }, { x: 80, y: 70, label: "Emergency call", text: "A pull cord in every room." }] },
      { key: "bedroom", name: "Bedroom", photo: "/photos/apt-bedroom.jpg", alt: "A bedroom with a made bed and a bedside lamp", planRoom: 1, text: "A separate bedroom with a door, space for a queen bed and a dresser, and a night light on the way to the bathroom.", hotspots: [{ x: 70, y: 40, label: "Night lighting", text: "Low motion lights from the bed to the bathroom." }, { x: 28, y: 64, label: "Emergency call", text: "Pull cord at the bedside." }] },
      { key: "kitchen", name: "Kitchenette", photo: "/photos/apt-kitchen.jpg", alt: "A kitchenette counter with fruit", planRoom: 2, text: "Fridge, microwave, sink and reachable cupboards.", hotspots: [{ x: 76, y: 38, label: "Counter-height microwave", text: "No reaching overhead." }] },
      { key: "bath", name: "Bathroom", photo: "/photos/apt-bath.jpg", alt: "A bathroom with a walk-in shower", planRoom: 3, text: "A level walk-in shower with a seat, grab bars and non-slip floor.", hotspots: [{ x: 28, y: 44, label: "Walk-in shower", text: "No step, fold-down seat, hand-held shower." }, { x: 52, y: 56, label: "Grab bars", text: "At the toilet, shower and sink." }] },
      view(0),
    ],
  },
  {
    key: "companion",
    name: "Companion suite",
    size: "420 sq ft, shared",
    sqft: 420,
    floor: "First or second floor",
    view: "The courtyard or the walled terrace garden",
    care: "Assisted living or memory care",
    from: 3950,
    available: 0,
    waitlist: 2,
    photo: "/photos/apt-bedroom-2.jpg",
    alt: "A bright bedroom in a companion suite",
    rooms: "Two private bedrooms with a shared bathroom and sitting area. Each resident has their own bedroom, furniture and memory box.",
    features: ["Two private bedrooms", "Shared roll-in shower with grab bars", "Shared sitting area by the window", "The lowest monthly rate in the building"],
    tour: [
      { key: "entry", name: "Entry and sitting area", photo: "/photos/apt-living-3.jpg", alt: "A bright sitting area with armchairs", planRoom: 4, text: "The shared sitting area by the door, with two armchairs and a small table.", hotspots: [{ x: 40, y: 30, label: "Natural light", text: "Floor-to-ceiling windows on the garden side." }] },
      { key: "bedroom", name: "Bedroom A", photo: "/photos/apt-bedroom-2.jpg", alt: "A bright bedroom", planRoom: 0, text: "Each resident has their own bedroom with a door, their own bed and furniture.", hotspots: [{ x: 66, y: 36, label: "Window", text: "Every bedroom has its own window." }, { x: 24, y: 70, label: "Emergency call", text: "Pull cord at the bedside." }] },
      { key: "bath", name: "Shared bathroom", photo: "/photos/apt-bath.jpg", alt: "A bathroom with a walk-in shower", planRoom: 3, text: "A roll-in shower with a seat and grab bars, shared by the two bedrooms.", hotspots: [{ x: 28, y: 44, label: "Roll-in shower", text: "Level entry for a shower chair." }, { x: 52, y: 56, label: "Grab bars", text: "At the toilet, shower and sink." }] },
      view(0),
    ],
  },
  {
    key: "suite",
    name: "Memory care suite",
    size: "320 sq ft",
    sqft: 320,
    floor: "Second floor, secure",
    view: "The walled terrace garden",
    care: "Memory care, care level 2 and above included",
    from: 6100,
    available: 1,
    waitlist: 0,
    photo: "/photos/apt-suite.jpg",
    alt: "A calm memory care suite with a bed, lamp and window",
    rooms: "A bedroom with a sitting area by the window, a bathroom with a roll-in shower, and a memory box by the door with photographs to help find the way home.",
    features: ["Memory box by the door", "Roll-in shower with grab bars", "Motion night lighting", "Secure household with its own garden"],
    tour: [
      { key: "entry", name: "Entry and memory box", photo: "/photos/apt-entry.jpg", alt: "The suite entry", planRoom: 2, text: "A lit memory box by the door holds photographs and a few favourite things, so each resident knows their own door.", hotspots: [{ x: 22, y: 40, label: "Memory box", text: "A glass-fronted box by the door, filled by the family." }, { x: 70, y: 62, label: "Storage", text: "Closet with simplified, labelled drawers." }] },
      { key: "bedroom", name: "Bedroom and sitting area", photo: "/photos/apt-suite.jpg", alt: "A calm bedroom with a window", planRoom: 0, text: "A calm room with the bed away from the door and a chair by the window.", hotspots: [{ x: 26, y: 30, label: "Natural light", text: "Daylight matters for sleep; every suite looks onto the terrace garden." }, { x: 70, y: 66, label: "Night lighting", text: "Motion lights from the bed to the bathroom." }, { x: 88, y: 44, label: "Emergency call", text: "Quiet sensors as well as a pull cord." }] },
      { key: "bath", name: "Bathroom", photo: "/photos/apt-bath.jpg", alt: "A bathroom with a walk-in shower", planRoom: 1, text: "A roll-in shower with a seat, contrasting grab bars and a raised toilet.", hotspots: [{ x: 28, y: 44, label: "Roll-in shower", text: "Level entry, fold-down seat." }, { x: 52, y: 56, label: "Grab bars", text: "In a contrasting colour so they are easy to see." }] },
      { key: "view", name: "View from the window", photo: "/photos/garden-bench.jpg", alt: "A bench in the walled terrace garden", planRoom: 0, text: "The walled terrace garden, open from breakfast to dusk with a caregiver outside.", hotspots: [{ x: 50, y: 60, label: "Walled garden", text: "Safe paths that loop back to the door, so no walk ends at a dead end." }] },
    ],
  },
];

export const money = (n: number) => "$" + n.toLocaleString("en-US");

/* ---------------------------------------------------------------- events for the public */

export interface PublicEvent { slug: string; title: string; when: string; date: string; time: string; where: string; text: string; photo: string; alt: string; spaces: number; going: number }

export function getPublicEvents(): PublicEvent[] {
  const t = todayDate();
  // next Saturday at least two days out, then the following fortnight
  const sat = addDays(t, ((5 - weekdayIndex(t) + 7) % 7) + (weekdayIndex(t) >= 4 ? 7 : 0));
  const thu = addDays(mondayOf(t), 10);
  const tue = addDays(mondayOf(t), 15);
  return [
    { slug: "open-house", title: "Autumn open house", when: longDate(sat), date: iso(sat), time: "11 am – 2 pm", where: "The whole building", text: "Walk round at your own pace, see three furnished apartments, meet the nurses and stay for lunch on us. No appointment needed; RSVP so the kitchen knows how many to expect.", photo: "/photos/building-porch.jpg", alt: "The front porch with chairs set out", spaces: 60, going: 34 },
    { slug: "family-night", title: "Family night: supper and the Larkmoor Singers", when: longDate(thu), date: iso(thu), time: "5:30 – 7:30 pm", where: "Main Dining Room and Garden Room", text: "Supper with your family member, then a short concert from the house choir. Children very welcome.", photo: "/photos/dining-group.jpg", alt: "Residents and families sharing supper", spaces: 80, going: 52 },
    { slug: "memory-talk", title: "Understanding memory loss: an evening for families", when: longDate(tue), date: iso(tue), time: "6:00 – 7:15 pm", where: "Library", text: "Hannah Steinberg, our Memory Care Coordinator, on what changes to expect and how to talk about them. Open to anyone caring for someone at home.", photo: "/photos/hands.jpg", alt: "Hands held across a table", spaces: 30, going: 17 },
  ];
}

/* ---------------------------------------------------------------- notices and news */

export const urgentNotice = {
  title: "Visiting ends at 6 pm today",
  body: "A high-wind warning is in force from 6 pm. Families already here are welcome to stay; please plan to arrive before 5 pm. Normal hours resume tomorrow at 8 am.",
  posted: "Posted 11:20 am by Marianne Okafor",
};

export interface NewsItem { date: string; kind: "Notice" | "News"; title: string; body: string }

export function getNews(): NewsItem[] {
  return [
    { date: `${dayShort(rel(0))}, 11:20 am`, kind: "Notice", title: urgentNotice.title, body: urgentNotice.body },
    { date: dayShort(rel(-2)), kind: "Notice", title: `Lift B out of service ${longDate(rel(5))}, 9 to 11 am`, body: "Annual inspection. Lift A and the second-floor ramp remain available; staff will help anyone who needs it." },
    { date: dayShort(rel(-4)), kind: "News", title: "Six new raised garden beds in the courtyard", body: "Built at wheelchair height by the Millbrook Bend Rotary. The garden club meets at them on Thursday afternoons; family members are welcome to bring gloves." },
    { date: dayShort(rel(-6)), kind: "News", title: `Flu and COVID vaccination clinic, ${longDate(rel(8))}`, body: "Fern Street Pharmacy will be in the Garden Room 10 am to 2 pm for residents, staff and family members. Bring your insurance card; consent forms are at the front desk." },
    { date: dayShort(rel(-9)), kind: "News", title: "New this month: Friday fish tacos", body: "Added to the menu cycle at the request of the residents’ council. The four-week cycle, with a large-print version, is in the family handbook." },
    { date: dayShort(rel(-13)), kind: "News", title: "Welcome to Grace Mbeki, Resident Care Coordinator", body: "Grace has been with Larkmoor as a med aide since 2023 and now leads care on the first floor. Her extension is 110." },
  ];
}

export type Lane = "fast" | "approval" | "urgent";

export type ModuleKey =
  | "profile"
  | "audience"
  | "daily-life"
  | "care-team"
  | "costs"
  | "quality"
  | "handbook"
  | "alerts"
  | "stories";

export interface ModuleMeta {
  key: ModuleKey;
  number?: number;
  name: string;
  editor: string;
  contentType: string;
  lane: Lane;
  laneNote: string;
}

export const modules: Record<ModuleKey, ModuleMeta> = {
  profile: {
    key: "profile",
    name: "Community profile",
    editor: "Executive Director",
    contentType: "Organisation record: name, licence, capacity, current census, care levels, contacts",
    lane: "approval",
    laneNote: "Census and licence status sync nightly from the operations system.",
  },
  audience: {
    key: "audience",
    name: "Audience framing",
    editor: "Marketing (three short lines and three button labels, nothing else)",
    contentType: "Framing: one contextual sentence and one action per audience",
    lane: "approval",
    laneNote: "The content beneath the switcher is identical for all three audiences. Only this line and the button change.",
  },
  "daily-life": {
    key: "daily-life",
    number: 1,
    name: "Daily Life",
    editor: "Tom Delacroix, Life Enrichment Director (calendar, photos) · Luis Barrientos, Dining Services Director (menu)",
    contentType: "Event (time, room, category, recurrence, cancellation) · Menu (meal, service hours, items, dietary flags) · Photo (caption, date, attendance, consent flag)",
    lane: "fast",
    laneNote: "Publishes immediately on an approved template. A stale calendar is worse than no calendar, so this module is deliberately not gated.",
  },
  "care-team": {
    key: "care-team",
    number: 2,
    name: "Care Team",
    editor: "HR (Jenna Park). Names, roles, start dates and credentials sync from the staff record; the “call me about” line is written by each person.",
    contentType: "Staff profile: role, credential (verified against licence register), start date, responsibilities, contact route. Ratios computed from the schedule.",
    lane: "approval",
    laneNote: "Executive Director approves; departures unpublish automatically the day the record closes.",
  },
  costs: {
    key: "costs",
    number: 3,
    name: "Costs & Inclusions",
    editor: "Marianne Okafor, Executive Director",
    contentType: "Rate table, versioned and effective-dated: apartment types × base rate, care-level band, one-time fees, inclusions, exclusions",
    lane: "approval",
    laneNote: "Owner sign-off; a change is scheduled with its effective date and appears on that date, not before.",
  },
  quality: {
    key: "quality",
    number: 4,
    name: "Quality Record",
    editor: "Marianne Okafor, Executive Director. Survey rows are imported from the state licensing register and cannot be edited; only the plain-language column is written here.",
    contentType: "Survey record (date, type, result, citation, correction verified) · Licence (number, status, capacity, renewal) · Endorsement",
    lane: "approval",
    laneNote: "Approval for the commentary; imported facts publish on sync so the page can never be more flattering than the register.",
  },
  handbook: {
    key: "handbook",
    number: 5,
    name: "Family Handbook",
    editor: "Operations (Jenna Park, with Roy Castellano for transport)",
    contentType: "Policy page (topic, current text, last reviewed) · Document (file, version, size, owner, review-by date, accessibility check)",
    lane: "approval",
    laneNote: "Executive Director approves. Unglamorous, and it is what most calls to the front desk are about.",
  },
  stories: {
    key: "stories",
    name: "Resident & family stories",
    editor: "Daniel Whitcombe, Family Liaison. Each quote is recorded with the speaker’s written consent and a review date.",
    contentType: "Testimonial: quote, speaker, relationship, photo consent, date given, expiry",
    lane: "approval",
    laneNote: "Executive Director approves. Quotes expire after two years unless the speaker renews them.",
  },
  alerts: {
    key: "alerts",
    number: 6,
    name: "Alerts & News",
    editor: "Marianne Okafor, Executive Director; Priya Raghunathan may issue urgent notices after hours",
    contentType: "Notice (urgent: outbreak, closure, visiting change; pinned site-wide and expires) · News post (routine)",
    lane: "urgent",
    laneNote: "Urgent notices bypass approval and go out by email, text and app in each recipient’s language. Routine news needs approval.",
  },
};

export const quality = {
  imported: "the 1st of this month",
  plain: [
    "The state inspects us every year without warning. The last full inspection, in March 2026, found nothing to correct.",
    "In five years we have had one citation, in February 2023, for missing initials on a medication record. Nobody was harmed; it was fixed and checked by the state within 14 days.",
    "Two complaints were made to the state in five years. Both were investigated and neither was found to be true.",
    "Our licence is active until June 2027, for up to 96 residents, with a separate approval for memory care.",
  ],
  summary: [
    { k: "Most recent survey", v: "No deficiencies", ok: true, s: "Annual licensing survey, 18 March 2026" },
    { k: "Licence", v: "AL-1024-0417", s: "Assisted living facility, active. Licensed capacity 96. Renews 30 June 2027." },
    { k: "Memory care endorsement", v: "Current", ok: true, s: "Second floor, 22 apartments. Last endorsement review 18 March 2026." },
    { k: "Voluntary accreditation", v: "None held", s: "We are asked about this. Oregon’s state survey is the inspection that matters, and it is published in full below." },
    { k: "Staffing ratio (days)", v: "1 : 7 · 1 : 5", s: "Assisted living · memory care. From the actual August roster." },
    { k: "Complaints to the state, 5 yrs", v: "2", s: "Both investigated, neither substantiated. Listed below." },
  ],
  history: [
    { date: "18 Mar 2026", type: "Annual licensing survey", result: "No deficiencies", ok: true, detail: "Full survey over three days including memory care endorsement review, medication pass observation and 14 resident interviews.", corrected: "" },
    { date: "2 Apr 2025", type: "Annual licensing survey", result: "No deficiencies", ok: true, detail: "Full survey. Surveyor noted the dining programme and the published calendar as strengths.", corrected: "" },
    { date: "11 Sep 2024", type: "Complaint investigation", result: "Not substantiated", ok: true, detail: "A family member reported a delayed call-light response. Call-light logs for the 30 days reviewed showed an average response of 6 minutes; the state closed the complaint.", corrected: "" },
    { date: "27 Mar 2024", type: "Annual licensing survey", result: "No deficiencies", ok: true, detail: "Full survey.", corrected: "" },
    { date: "14 Feb 2023", type: "Annual licensing survey", result: "1 citation", ok: false, detail: "Medication administration records for two residents were missing caregiver initials for three as-needed doses over one week (OAR 411-054-0055). No resident was harmed and the doses were given. We retrained all med aides, added a second daily record check by the nurse, and the state verified the fix on its return visit.", corrected: "14 days", correctedDetail: "Plan accepted 21 Feb, verified 28 Feb 2023" },
    { date: "19 Jan 2022", type: "Annual licensing survey", result: "No deficiencies", ok: true, detail: "Full survey.", corrected: "" },
    { date: "3 Nov 2021", type: "Complaint investigation", result: "Not substantiated", ok: true, detail: "Anonymous complaint about visiting restrictions during the COVID-19 period. The state found the restrictions matched its own guidance in force at the time.", corrected: "" },
  ],
};

export const handbook = {
  reviewed: "1 August 2026",
  topics: [
    { title: "Visiting hours", short: "Any day, 8 am to 8 pm. After 8 pm, ring the bell.", body: "Any day, 8 am to 8 pm, no appointment needed. After 8 pm ring the bell; the night nurse will let you in. Overnight stays in your family member’s apartment are fine for up to three nights, just tell the front desk. During an outbreak we post a notice at the top of every page and it takes precedence." },
    { title: "Pets", short: "Cats and dogs under 25 lb may live here; visiting dogs welcome on a lead.", body: "Cats and dogs under 25 lb may live with residents who can care for them, with current vaccinations and a $500 refundable deposit. Visiting dogs are welcome on a lead in the courtyard and first-floor common areas, not in dining rooms. Two resident cats, Biscuit and Pearl, live on the first floor." },
    { title: "Transport", short: "Medical bus Tue/Thu from 8:30 am; shopping bus Wed 10 am. Book with Roy.", body: "The bus does medical appointments within 15 miles on Tuesdays and Thursdays from 8:30 am, and the shopping run on Wednesdays at 10 am. Book with Roy (ext. 160) by noon the day before. Wheelchair lift on board. Outside those hours we can arrange a paid escort at $35 an hour." },
    { title: "Guest meals", short: "$9, or $12 for the Sunday roast. Tell the front desk by 10 am.", body: "Join your family member for any meal: $9, or $12 for the Sunday roast, added to the monthly invoice. Tell the front desk by 10 am so the kitchen sets a place. Private dining room for up to 12 is free to reserve for birthdays; give Luis a week’s notice." },
    { title: "Mail and packages", short: "Letters to apartments by 2 pm; packages signed for at the front desk.", body: "Address mail to the resident’s name and apartment number at 1400 Fern Street. Letters are delivered to apartments by 2 pm. Packages are signed for at the front desk and logged; we call the resident, and we can open and put things away if that has been agreed in the care plan." },
    { title: "What to bring", short: "Your own furniture, photographs and clothes, labelled. We supply the rest.", body: "Bring the furniture, photographs and pictures that make it home; Roy hangs pictures and mounts the TV on moving day. Clothes for a week or two, labelled with an iron-on name tag (we can do this for you). A list of medications and the pharmacy you use, insurance cards, and power of attorney or advance directive papers if you have them. Linens, towels, the emergency pendant and Wi-Fi are provided." },
    { title: "Care reassessments", short: "Every 90 days and after any hospital stay, with 14 days’ notice of any change.", body: "Priya or one of the nurses reassesses care every 90 days, after any hospital stay, and whenever the family or the resident asks. You are invited to the care-plan meeting in person or by phone, and you get 14 days’ written notice before any change to the care level or the monthly rate. If you disagree with an assessment, ask for a second one; it is free." },
    { title: "Raising a concern", short: "Department lead, then Marianne (ext. 101), then the state ombudsman.", body: "First, the department lead (see the care team). Second, Marianne Okafor, Executive Director, ext. 101, who will respond within one business day. Third, the Oregon Long-Term Care Ombudsman, an independent state advocate: 1-800-555-0142. The ombudsman’s poster is by the lift on each floor, and residents’ council meets the first Tuesday of the month." },
  ],
  documents: [
    { title: "Resident & Family Handbook 2026", meta: "PDF, 1.2 MB · version 6 · updated 1 Aug 2026" },
    { title: "Residency agreement (sample)", meta: "PDF, 640 KB · the full contract, with the rate schedule attached" },
    { title: "September menu cycle, all four weeks", meta: "PDF, 310 KB · large-print version included" },
    { title: "Emergency and evacuation plan", meta: "PDF, 480 KB · reviewed with the fire marshal 12 May 2026" },
    { title: "Visitor and infection-control policy", meta: "PDF, 190 KB · reviewed 1 Aug 2026" },
    { title: "Paying for care: Medicaid, VA and insurance", meta: "PDF, 220 KB · Spanish and Russian versions available" },
  ],
};

export interface Testimonial { quote: string; name: string; relation: string; photo: string; since: string }

export const testimonials: Testimonial[] = [
  {
    quote: "We toured four places and Mum chose this one at lunch, before we had even seen the apartment. She has been here fourteen months and sings with the choir on Tuesdays.",
    name: "Karen Whitfield",
    relation: "Daughter of a resident",
    photo: "/photos/portrait-karen.jpg",
    since: "Family since 2025",
  },
  {
    quote: "I moved in for the food, honestly. I stayed for the garden club and the people at my table. My son checks the calendar online and knows what I did before I ring him.",
    name: "Dorothy Lindqvist",
    relation: "Resident, first floor",
    photo: "/photos/portrait-dorothy.jpg",
    since: "Resident since 2024",
  },
  {
    quote: "The nurse called me before the hospital did. When Dad went back in for a night, Priya had already spoken to the ward. That is the phone call you want.",
    name: "James Okonkwo",
    relation: "Son of a resident, memory care",
    photo: "/photos/portrait-james.jpg",
    since: "Family since 2023",
  },
  {
    quote: "I live in Denver, so I can’t drop in. I look at Thursday’s calendar, I see the photos on Friday, and I know my brother is not sitting in his room.",
    name: "Walter Reyes",
    relation: "Brother of a resident",
    photo: "/photos/portrait-walter.jpg",
    since: "Family since 2025",
  },
];

export interface CareLevel { name: string; blurb: string; from: number; photo: string; alt: string; points: string[] }

export const careLevelsHome: CareLevel[] = [
  {
    name: "Assisted living",
    blurb: "Your own apartment, three meals a day, help with what you need and not with what you don’t. Seventy-four apartments on the first floor around the courtyard.",
    from: 4650,
    photo: "/photos/couch.jpg",
    alt: "An older couple laughing together on a sofa in their apartment",
    points: ["Studios, one- and two-bedrooms around the courtyard", "Care levels 1 to 4, reassessed every 90 days", "Bus to appointments Tuesday and Thursday"],
  },
  {
    name: "Memory care",
    blurb: "A secure second floor with 22 apartments, a walled terrace garden, one caregiver to five residents by day and a programme built around each person’s own habits.",
    from: 6100,
    photo: "/photos/hands.jpg",
    alt: "Two older women holding hands with a younger woman",
    points: ["Private and companion suites off a walled terrace garden", "Certified Dementia Practitioner on the floor", "State memory care endorsement, reviewed March 2026"],
  },
];



export const faqs = [
  { q: "Is there a waiting list?", a: "A few apartments are usually available and two types have a short list. Daniel can tell you on the phone what is free this month, and a tour does not commit you to anything." },
  { q: "Can my mother bring her cat?", a: "Yes. Cats and dogs under 25 lb live here with residents who can care for them, with current vaccinations and a refundable deposit. Two resident cats, Biscuit and Pearl, already live on the first floor." },
  { q: "What happens if her care needs change?", a: "The nurse reassesses every 90 days and after any hospital stay, and you get 14 days’ notice of any change to the care level. Moving from assisted living to the memory care floor happens inside the same building, with the same staff." },
  { q: "Can family visit whenever they like?", a: "Any day, 8 am to 8 pm, with no appointment. After 8 pm ring the bell and the night nurse lets you in. Guests can join any meal, and overnight stays of up to three nights are fine." },
  { q: "Is there a nurse at night?", a: "Yes. A licensed nurse is in the building 24 hours a day, and the night ratio is one caregiver to fourteen residents plus the nurse." },
  { q: "Do you accept Medicaid or long-term care insurance?", a: "We take private pay and long-term care insurance, and after two years of residency the Oregon Medicaid waiver for up to twelve apartments. Daniel can go through what applies to you." },
  { q: "How do I hear about things quickly?", a: "Sign up on the News page and urgent notices reach you by text, email and the app within a minute of being written, in the language you choose." },
];
