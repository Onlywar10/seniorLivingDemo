// All content for the demonstration community. Everything here is fictional.
// Today is Thursday 10 September 2026; the published week is Mon 7 – Sun 13 September.

export const community = {
  name: "Larkmoor House",
  tagline: "Assisted living and memory care on Fern Street in Millbrook Bend, Oregon. Family owned since 2009.",
  address: "1400 Fern Street, Millbrook Bend, OR 97xxx",
  phone: "(503) 555-0142",
  phoneHref: "tel:+15035550142",
  licence: "AL-1024-0417",
  licenceRenews: "30 June 2027",
  capacity: 96,
  census: 84,
  lastSurvey: "18 March 2026",
  careLevels: ["Assisted living", "Memory care"],
  frontDesk: "Staffed 6 am – 10 pm, nurse on site 24 hours",
  today: "Thursday 10 September 2026",
  todayShort: "Thursday 10 September",
  weekLabel: "Monday 7 – Sunday 13 September 2026",
  updatedAt: "Thursday 10 September, 6:55 am",
};

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

export type Category = "move" | "social" | "mind" | "faith" | "out";

export const categories: Record<Category, string> = {
  move: "Movement",
  social: "Social & music",
  mind: "Mind & making",
  faith: "Faith",
  out: "Outings",
};

export interface Event {
  time: string;
  name: string;
  room: string;
  cat: Category;
  note?: string;
}

export interface Day {
  name: string;
  date: string;
  iso: string;
  today?: boolean;
  events: Event[];
}

export const week: Day[] = [
  {
    name: "Monday", date: "7 Sep", iso: "2026-09-07",
    events: [
      { time: "9:30 am", name: "Chair yoga with Bev", room: "Wellness Room", cat: "move" },
      { time: "10:30 am", name: "Coffee & the headlines", room: "Bistro", cat: "social" },
      { time: "12:00 pm", name: "Labor Day cookout for families", room: "Courtyard", cat: "social" },
      { time: "2:30 pm", name: "Word games & trivia", room: "Library", cat: "mind" },
      { time: "6:30 pm", name: "Movie: Singin’ in the Rain", room: "Cinema Lounge", cat: "social" },
    ],
  },
  {
    name: "Tuesday", date: "8 Sep", iso: "2026-09-08",
    events: [
      { time: "9:30 am", name: "Walking club (weather permitting)", room: "Meet at Front Lobby", cat: "move" },
      { time: "10:30 am", name: "Larkmoor Singers rehearsal", room: "Garden Room", cat: "social" },
      { time: "1:00 pm", name: "Medical appointments bus", room: "Departs Front Lobby · book with Roy", cat: "out" },
      { time: "2:30 pm", name: "Watercolor with Ines", room: "Art Studio", cat: "mind" },
      { time: "4:00 pm", name: "Happy hour with pianist Del Mercer", room: "Bistro", cat: "social" },
    ],
  },
  {
    name: "Wednesday", date: "9 Sep", iso: "2026-09-09",
    events: [
      { time: "9:30 am", name: "Sit & be fit", room: "Wellness Room", cat: "move" },
      { time: "10:00 am", name: "Shopping bus: Fred’s Market & the pharmacy", room: "Departs Front Lobby", cat: "out" },
      { time: "11:00 am", name: "Catholic communion service", room: "Chapel", cat: "faith" },
      { time: "2:00 pm", name: "Bingo (prizes from the gift shop)", room: "Main Dining Room", cat: "social" },
      { time: "3:30 pm", name: "Memory Care: sensory garden hour", room: "Second-floor Terrace", cat: "mind" },
    ],
  },
  {
    name: "Thursday", date: "10 Sep", iso: "2026-09-10", today: true,
    events: [
      { time: "9:30 am", name: "Chair yoga with Bev", room: "Wellness Room", cat: "move" },
      { time: "10:30 am", name: "Current events with Daniel", room: "Library", cat: "mind" },
      { time: "1:30 pm", name: "Garden club: planting fall bulbs", room: "Courtyard raised beds", cat: "social" },
      { time: "3:00 pm", name: "Sing-along with the Larkmoor Singers", room: "Garden Room", cat: "social" },
      { time: "6:30 pm", name: "Cribbage & cards", room: "Bistro", cat: "social" },
    ],
  },
  {
    name: "Friday", date: "11 Sep", iso: "2026-09-11",
    events: [
      { time: "9:30 am", name: "Balance & strength (PT-led)", room: "Wellness Room", cat: "move" },
      { time: "10:30 am", name: "Book group: The Thursday Murder Club", room: "Library", cat: "mind" },
      { time: "2:00 pm", name: "Visit from Millbrook Bend Elementary 3rd grade", room: "Garden Room", cat: "social" },
      { time: "4:00 pm", name: "Happy hour: Oktoberfest preview", room: "Bistro", cat: "social" },
      { time: "6:30 pm", name: "Movie: Roman Holiday", room: "Cinema Lounge", cat: "social" },
    ],
  },
  {
    name: "Saturday", date: "12 Sep", iso: "2026-09-12",
    events: [
      { time: "9:00 am", name: "Pancake breakfast (families welcome, $6)", room: "Main Dining Room", cat: "social" },
      { time: "10:30 am", name: "Documentary & discussion", room: "Cinema Lounge", cat: "mind" },
      { time: "2:00 pm", name: "Ice cream social", room: "Courtyard", cat: "social" },
      { time: "3:30 pm", name: "College football on the big screen", room: "Cinema Lounge", cat: "social" },
    ],
  },
  {
    name: "Sunday", date: "13 Sep", iso: "2026-09-13",
    events: [
      { time: "9:30 am", name: "Bus to First Methodist", room: "Departs Front Lobby", cat: "faith" },
      { time: "10:30 am", name: "Interfaith service with Pastor Ruth Alvarez", room: "Chapel", cat: "faith" },
      { time: "12:00 pm", name: "Sunday roast (guest meals $12)", room: "Main Dining Room", cat: "social" },
      { time: "2:30 pm", name: "Jigsaw table & quiet reading", room: "Library", cat: "mind" },
    ],
  },
];

export const today = week.find((d) => d.today)!;

export type Diet = "V" | "GF" | "SF" | "Soft";
export const dietLabels: Record<Diet, string> = {
  V: "Vegetarian",
  GF: "Gluten free",
  SF: "Sugar-free option",
  Soft: "Mechanical-soft available",
};

export interface MenuItem { name: string; diet?: Diet[] }
export interface Meal { name: "Breakfast" | "Lunch" | "Dinner"; hours: string; items: MenuItem[] }
export interface DayMenu { day: string; date: string; today?: boolean; meals: Meal[] }

const breakfastAlways: MenuItem = { name: "Always available: cold cereal, toast, fruit, yogurt, juice, coffee, tea" };

export const weekMenu: DayMenu[] = [
  { day: "Monday", date: "7 Sep", meals: [
    { name: "Breakfast", hours: "7:30 – 9:00 am", items: [{ name: "Buttermilk pancakes, maple syrup, turkey bacon" }, { name: "Veggie omelette", diet: ["V", "GF"] }, breakfastAlways] },
    { name: "Lunch", hours: "11:45 am – 1:15 pm", items: [{ name: "Labor Day cookout: burgers, hot dogs, corn on the cob" }, { name: "Black bean burger", diet: ["V"] }, { name: "Potato salad, coleslaw, watermelon", diet: ["V", "GF"] }] },
    { name: "Dinner", hours: "4:45 – 6:15 pm", items: [{ name: "Chicken pot pie" }, { name: "Baked cod, rice pilaf, carrots", diet: ["GF", "Soft"] }, { name: "Brownie", diet: ["SF"] }] },
  ]},
  { day: "Tuesday", date: "8 Sep", meals: [
    { name: "Breakfast", hours: "7:30 – 9:00 am", items: [{ name: "Oatmeal with cinnamon apples", diet: ["V", "GF", "Soft"] }, { name: "Eggs to order, wheat toast" }, breakfastAlways] },
    { name: "Lunch", hours: "11:45 am – 1:15 pm", items: [{ name: "Chicken noodle soup" }, { name: "Turkey club on sourdough" }, { name: "Spinach and feta quiche", diet: ["V"] }, { name: "Rice pudding", diet: ["SF", "Soft"] }] },
    { name: "Dinner", hours: "4:45 – 6:15 pm", items: [{ name: "Meatloaf, mashed potatoes, green beans", diet: ["Soft"] }, { name: "Eggplant parmesan", diet: ["V"] }, { name: "Apple crisp", diet: ["SF"] }] },
  ]},
  { day: "Wednesday", date: "9 Sep", meals: [
    { name: "Breakfast", hours: "7:30 – 9:00 am", items: [{ name: "French toast, berries" }, { name: "Scrambled eggs, chicken sausage", diet: ["GF"] }, breakfastAlways] },
    { name: "Lunch", hours: "11:45 am – 1:15 pm", items: [{ name: "Minestrone", diet: ["V"] }, { name: "Tuna melt, kettle chips" }, { name: "Chef salad", diet: ["GF"] }, { name: "Chocolate pudding", diet: ["SF", "Soft"] }] },
    { name: "Dinner", hours: "4:45 – 6:15 pm", items: [{ name: "Roast turkey, stuffing, gravy", diet: ["Soft"] }, { name: "Shrimp stir-fry, jasmine rice", diet: ["GF"] }, { name: "Pumpkin pie" }] },
  ]},
  { day: "Thursday", date: "10 Sep", today: true, meals: [
    { name: "Breakfast", hours: "7:30 – 9:00 am", items: [{ name: "Steel-cut oats with brown sugar and berries", diet: ["V", "GF"] }, { name: "Scrambled eggs, turkey sausage, wheat toast" }, { name: "Seasonal fruit plate and yogurt", diet: ["V", "GF", "Soft"] }, breakfastAlways] },
    { name: "Lunch", hours: "11:45 am – 1:15 pm", items: [{ name: "Tomato basil soup", diet: ["V", "GF"] }, { name: "Grilled chicken Caesar wrap, kettle chips" }, { name: "Baked mac and cheese, steamed broccoli", diet: ["V", "Soft"] }, { name: "Peach cobbler", diet: ["SF"] }] },
    { name: "Dinner", hours: "4:45 – 6:15 pm", items: [{ name: "Herb-roasted pork loin, apple chutney, mashed potatoes", diet: ["GF", "Soft"] }, { name: "Pan-seared salmon, lemon rice, green beans", diet: ["GF"] }, { name: "Vegetable lasagne", diet: ["V"] }, { name: "Lemon pudding", diet: ["SF"] }] },
  ]},
  { day: "Friday", date: "11 Sep", meals: [
    { name: "Breakfast", hours: "7:30 – 9:00 am", items: [{ name: "Blueberry muffins, hard-boiled eggs" }, { name: "Cream of wheat", diet: ["V", "Soft"] }, breakfastAlways] },
    { name: "Lunch", hours: "11:45 am – 1:15 pm", items: [{ name: "Clam chowder" }, { name: "Fish tacos, lime slaw (new this month)" }, { name: "Bean and cheese burrito", diet: ["V"] }, { name: "Fruit cup", diet: ["V", "GF", "SF"] }] },
    { name: "Dinner", hours: "4:45 – 6:15 pm", items: [{ name: "Oktoberfest: bratwurst, sauerkraut, potato pancakes" }, { name: "Chicken schnitzel, spaetzle" }, { name: "Mushroom stroganoff", diet: ["V"] }, { name: "Black forest cake" }] },
  ]},
  { day: "Saturday", date: "12 Sep", meals: [
    { name: "Breakfast", hours: "7:30 – 9:30 am", items: [{ name: "Pancake breakfast with families, $6 guests" }, { name: "Yogurt parfait", diet: ["V", "GF"] }, breakfastAlways] },
    { name: "Lunch", hours: "11:45 am – 1:15 pm", items: [{ name: "Split pea soup", diet: ["V", "GF"] }, { name: "Grilled cheese and tomato" }, { name: "Cobb salad", diet: ["GF"] }, { name: "Ice cream social at 2 pm" }] },
    { name: "Dinner", hours: "4:45 – 6:15 pm", items: [{ name: "Beef stew, biscuits", diet: ["Soft"] }, { name: "Lemon herb chicken, roasted vegetables", diet: ["GF"] }, { name: "Vanilla custard", diet: ["SF", "Soft"] }] },
  ]},
  { day: "Sunday", date: "13 Sep", meals: [
    { name: "Breakfast", hours: "7:30 – 9:00 am", items: [{ name: "Cinnamon rolls" }, { name: "Eggs Benedict" }, breakfastAlways] },
    { name: "Lunch", hours: "12:00 – 1:30 pm", items: [{ name: "Sunday roast: beef, Yorkshire pudding, roast potatoes, gravy", diet: ["Soft"] }, { name: "Roast chicken", diet: ["GF"] }, { name: "Nut roast", diet: ["V"] }, { name: "Trifle", diet: ["SF"] }] },
    { name: "Dinner", hours: "4:45 – 6:00 pm", items: [{ name: "Soup and sandwich supper" }, { name: "Cottage cheese and fruit plate", diet: ["V", "GF", "Soft"] }] },
  ]},
];

export const todayMenu = weekMenu.find((d) => d.today)!;

export interface Photo { src: string; alt: string; caption: string; date: string; meta: string }

export const recentPhotos: Photo[] = [
  { src: "/photos/knitting.jpg", alt: "A caregiver helps two residents with knitting at a table", caption: "Knit & natter, Garden Room", date: "Wed 9 Sep", meta: "12 residents, 2 volunteers" },
  { src: "/photos/gardening.jpg", alt: "Two older women planting in a raised garden bed", caption: "Garden club at the new raised beds", date: "Thu 3 Sep", meta: "9 residents" },
  { src: "/photos/painting.jpg", alt: "An older woman working on a watercolour at a table", caption: "Watercolor with Ines: September skies", date: "Tue 8 Sep", meta: "11 residents, Art Studio" },
  { src: "/photos/dancing.jpg", alt: "An older couple dancing in a community hall", caption: "Happy hour with pianist Del Mercer", date: "Tue 8 Sep", meta: "38 residents, Bistro" },
  { src: "/photos/game.jpg", alt: "A group of seniors playing a ball game in a gym", caption: "Balloon volleyball, Wellness Room", date: "Fri 4 Sep", meta: "16 residents" },
  { src: "/photos/chess.jpg", alt: "Two older men playing chess", caption: "Chess and cribbage afternoon", date: "Thu 3 Sep", meta: "8 residents, Bistro" },
  { src: "/photos/tea.jpg", alt: "Three seniors sharing tea and pie", caption: "Labor Day cookout, dessert table", date: "Mon 7 Sep", meta: "46 residents, 19 family guests" },
  { src: "/photos/puzzle.jpg", alt: "Seniors doing a jigsaw over coffee", caption: "Sunday jigsaw table", date: "Sun 6 Sep", meta: "7 residents, Library" },
];

export interface Staff { initials: string; name: string; role: string; cred: string; years: number; call: string; ext: string; key?: boolean; photo: string }

export const staff: Staff[] = [
  { initials: "MO", name: "Marianne Okafor", photo: "/photos/staff-marianne.jpg", role: "Executive Director", cred: "Licensed Nursing Home Administrator (LNHA), MBA", years: 9, call: "move-in decisions, rates, any concern you couldn’t resolve with the team", ext: "101", key: true },
  { initials: "PR", name: "Priya Raghunathan", photo: "/photos/staff-priya.jpg", role: "Director of Nursing", cred: "Registered Nurse (RN, BSN)", years: 6, call: "medications, a change in your family member’s health, hospital returns; nurse line 24 h", ext: "120", key: true },
  { initials: "HS", name: "Hannah Steinberg", photo: "/photos/staff-hannah.jpg", role: "Memory Care Coordinator", cred: "Licensed Practical Nurse (LPN), Certified Dementia Practitioner (CDP)", years: 5, call: "anything on the second floor, care-plan meetings, behaviour changes", ext: "210", key: true },
  { initials: "TD", name: "Tom Delacroix", photo: "/photos/staff-tom.jpg", role: "Life Enrichment Director", cred: "Certified Therapeutic Recreation Specialist (CTRS)", years: 4, call: "the calendar, outings, volunteering, birthday parties", ext: "140" },
  { initials: "LB", name: "Luis Barrientos", photo: "/photos/staff-luis.jpg", role: "Dining Services Director", cred: "Certified Dietary Manager (CDM, CFPP)", years: 7, call: "diets, allergies, textures, guest meals, the menu cycle", ext: "150" },
  { initials: "DW", name: "Daniel Whitcombe", photo: "/photos/staff-daniel.jpg", role: "Family Liaison & Social Services", cred: "Licensed Clinical Social Worker (MSW, LCSW)", years: 2, call: "tours, paperwork, Medicaid and VA questions, family meetings", ext: "105", key: true },
  { initials: "GM", name: "Grace Mbeki", photo: "/photos/staff-grace.jpg", role: "Resident Care Coordinator, first floor", cred: "Licensed Practical Nurse (LPN)", years: 3, call: "daily care routines, laundry, caregiver assignments on the first floor", ext: "110" },
  { initials: "RC", name: "Roy Castellano", photo: "/photos/staff-roy.jpg", role: "Maintenance & Transportation", cred: "Commercial driver’s licence (CDL-P), EPA 608", years: 11, call: "the bus, apartment repairs, TV and thermostat", ext: "160" },
  { initials: "JP", name: "Jenna Park", photo: "/photos/staff-jenna.jpg", role: "Business Office Manager & HR", cred: "Certified Payroll Professional (CPP)", years: 5, call: "invoices, insurance paperwork, staff hiring", ext: "102" },
];

export const staffing = [
  { value: "1 : 7", label: "Caregiver to resident, days (6 am – 10 pm), assisted living" },
  { value: "1 : 5", label: "Caregiver to resident, days, memory care" },
  { value: "1 : 14", label: "Caregiver to resident, nights, both floors, plus one nurse on site" },
  { value: "5.2 yrs", label: "Average tenure across 61 staff · turnover last 12 months: 18%" },
];

export const rates = {
  effective: "1 July 2026",
  nextReview: "1 January 2027",
  apartments: [
    { type: "Studio", size: "380 sq ft", rate: 4650, availability: "2 available", wait: false },
    { type: "One bedroom", size: "540 sq ft", rate: 5450, availability: "1 available", wait: false },
    { type: "One bedroom, courtyard", size: "560 sq ft", rate: 5750, availability: "Waitlist (3)", wait: true },
    { type: "Two bedroom", size: "760 sq ft", rate: 6750, availability: "1 available", wait: false },
    { type: "Memory care suite", size: "320 sq ft", rate: 6100, availability: "1 available", wait: false },
    { type: "Memory care companion suite", size: "420 sq ft, shared", rate: 4900, availability: "Waitlist (1)", wait: true },
  ],
  careLevels: [
    { level: "Level 1", covers: "Reminders, escorts to meals, medication management, weekly check-in", rate: 650 },
    { level: "Level 2", covers: "Level 1 plus hands-on help with bathing and dressing, up to 45 min a day", rate: 1350 },
    { level: "Level 3", covers: "Level 2 plus two-person transfers, incontinence care, up to 90 min a day", rate: 2150 },
    { level: "Level 4", covers: "Extensive daily care, behavioural support, more than 90 min a day", rate: 2950 },
  ],
  oneTime: [
    { item: "Community fee (non-refundable)", price: "$3,500" },
    { item: "Pet deposit (refundable)", price: "$500" },
    { item: "Pre-move nursing assessment", price: "$0" },
  ],
  included: [
    "Three meals a day plus snacks, any diet on the menu",
    "Weekly housekeeping, linens and towel service",
    "All utilities, cable TV, Wi-Fi",
    "Scheduled bus: medical Tue/Thu, shopping Wed",
    "The full activity calendar and outings (except ticketed events)",
    "24-hour staff and emergency pendant",
  ],
  separate: [
    { item: "Personal laundry", price: "$60 / mo" },
    { item: "Incontinence supplies", price: "at cost" },
    { item: "Escort to appointments beyond the bus", price: "$35 / hr" },
    { item: "Salon, podiatry, private phone line", price: "vendor rates" },
    { item: "Guest meals", price: "$9 / $12" },
    { item: "Ticketed outings (theatre, ball games)", price: "at cost" },
  ],
};

export const quality = {
  imported: "4 September 2026",
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

export interface NewsItem { date: string; kind: "Notice" | "News"; title: string; body: string }

export const news: NewsItem[] = [
  { date: "Tue 8 Sep 2026", kind: "Notice", title: "Lift B out of service Tuesday 15 September, 9 to 11 am", body: "Annual inspection. Lift A and the second-floor ramp remain available; staff will help anyone who needs it." },
  { date: "Thu 3 Sep 2026", kind: "News", title: "Six new raised garden beds in the courtyard", body: "Built at wheelchair height by the Millbrook Bend Rotary. The garden club plants fall bulbs on Thursday afternoons; family members are welcome to bring gloves." },
  { date: "Tue 1 Sep 2026", kind: "News", title: "Flu and COVID vaccination clinic, Wednesday 23 September", body: "Fern Street Pharmacy will be in the Garden Room 10 am to 2 pm. Residents, staff and family members. Bring your insurance card; consent forms are at the front desk." },
  { date: "Sat 29 Aug 2026", kind: "News", title: "September menu cycle published", body: "Four weeks of menus with a large-print version are in the handbook documents. New this month: Friday fish tacos, by request of the residents’ council." },
  { date: "Fri 21 Aug 2026", kind: "News", title: "Welcome to Grace Mbeki, our new first-floor Resident Care Coordinator", body: "Grace joined us from a home-health agency in Salem and has been with Larkmoor as a med aide since 2023. Her extension is 110." },
];

export const audiences = {
  care: {
    tab: "I’m looking for care",
    line: "Have a look at this week’s activities and menus, meet the people who work here, and come and see us on a day that shows you what it is really like.",
    cta: "Book a tour this week",
    href: "/larkmoor-house/tour",
  },
  family: {
    tab: "My family member lives here",
    line: "Everything on this site is current as of Thursday 10 September, 6:55 am: today’s schedule, tonight’s dinner, who is on duty and how to reach them.",
    cta: "See today’s calendar",
    href: "/larkmoor-house/activities",
  },
  share: {
    tab: "I’m sending this to someone",
    line: "Sending this to a brother or sister who hasn’t been able to visit? This week’s calendar, the people who work here, the apartments and the state inspection record are all here.",
    cta: "Copy a link to this page",
    href: "#copy",
  },
} as const;

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

export type AudienceKey = keyof typeof audiences;

export const money = (n: number) => "$" + n.toLocaleString("en-US");

export const faqs = [
  { q: "Is there a waiting list?", a: "A few apartments are usually available and two types have a short list. Daniel can tell you on the phone what is free this month, and a tour does not commit you to anything." },
  { q: "Can my mother bring her cat?", a: "Yes. Cats and dogs under 25 lb live here with residents who can care for them, with current vaccinations and a refundable deposit. Two resident cats, Biscuit and Pearl, already live on the first floor." },
  { q: "What happens if her care needs change?", a: "The nurse reassesses every 90 days and after any hospital stay, and you get 14 days’ notice of any change to the care level. Moving from assisted living to the memory care floor happens inside the same building, with the same staff." },
  { q: "Can family visit whenever they like?", a: "Any day, 8 am to 8 pm, with no appointment. After 8 pm ring the bell and the night nurse lets you in. Guests can join any meal, and overnight stays of up to three nights are fine." },
  { q: "Is there a nurse at night?", a: "Yes. A licensed nurse is in the building 24 hours a day, and the night ratio is one caregiver to fourteen residents plus the nurse." },
  { q: "Do you accept Medicaid or long-term care insurance?", a: "We take private pay and long-term care insurance, and after two years of residency the Oregon Medicaid waiver for up to twelve apartments. Daniel can go through what applies to you." },
  { q: "How do I hear about things quickly?", a: "Sign up on the News page and urgent notices reach you by text, email and the app within a minute of being written, in the language you choose." },
];
