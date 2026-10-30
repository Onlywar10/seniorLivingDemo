// Bruceville Point’s activity calendar. Weekly program plus dated events (November 2026 is the published month).
// Mirrors src/data/calendar.ts (Prairie City Landing) export for export.
//
// SHAPE DIFFERENCES FROM src/data/calendar.ts
// - `rooms`: different keys and names, for Bruceville Point’s spaces:
//   theater, fitness ("Gym"), art, lobby, bistro, stonelakes, cypress, club, courtyard,
//   bocce, harbor, harborCourtyard. PCL’s rendezvous, natoma, living and lounge2 do not exist here.
// - Everything else (`Cat`, `cats`, `filters`, `CalEvent`, `eventsOn`, `eventsBetween`,
//   `isHarbor`, `seatsLeft`) has the same shape; the types and shared helpers are imported.
//
// SOURCES: published on brucevillepoint.com — weekly Bingo in the Bistro, the monthly Paint and
// Sip, Step Aerobics and other classes, axe throwing, bocce, disc golf, the Aerospace Museum
// tour, park outings, Harbor’s ceramics, music, pet therapy, storytelling, literature review,
// gardening and outings, and the monthly cooking lesson with the Dining Experience Director.
// The week-by-week timetable, the destinations and the dated events are written programme
// content in the same structure as PCL’s. Leaders are given by role, never by invented name.

import { addDays, dow, fromIso, hash, iso } from "@/lib/clock";
import { cats, filters, isHarbor, seatsLeft, type CalEvent, type Cat } from "@/data/shared";

export { cats, filters, isHarbor, seatsLeft };
export type { CalEvent, Cat };

export const rooms = {
  theater: "Theatre",
  fitness: "Gym",
  art: "Art Studio",
  lobby: "Lobby",
  bistro: "The Bistro",
  stonelakes: "Stone Lakes Cafe",
  cypress: "Cypress Room",
  club: "Club Room",
  courtyard: "Courtyard",
  bocce: "Bocce Court",
  harbor: "Harbor",
  harborCourtyard: "Harbor Courtyard",
} as const;

type Seed = Omit<CalEvent, "id" | "date">;
const t = (h: number, m = 0) => h * 60 + m;

const FD = "Fitness Director";
const EA = "Events & Adventures Director";
const EAA = "Events & Adventures Assistant";

// ---------- Weekly program (0 = Sunday) ----------
const weekly: Record<number, Seed[]> = {
  0: [
    { start: t(10, 30), title: "Non-Denominational Service", leader: "Visiting chaplain", room: rooms.theater, cat: "faith" },
    { start: t(11), end: t(11, 45), title: "Sit and Stretch", room: rooms.fitness, cat: "fitness" },
    { start: t(13), end: t(13, 30), title: "Catholic Communion", room: rooms.theater, cat: "faith" },
    { start: t(14), title: "Sunday Matinee", room: rooms.theater, cat: "movies" },
    { start: t(18), title: "Sunday Evening Cinema", room: rooms.theater, cat: "movies" },
  ],
  1: [
    { start: t(9), end: t(9, 45), title: "Step Aerobics", leader: FD, room: rooms.fitness, cat: "fitness" },
    { start: t(9, 30), title: "Shopping Trip", room: rooms.lobby, cat: "trips", cap: 12 },
    { start: t(10), end: t(10, 45), title: "Better Balance", room: rooms.fitness, cat: "fitness" },
    { start: t(10), title: "Morning Trivia", leader: EA, room: rooms.theater, cat: "clubs" },
    { start: t(11), title: "Mindfulness Moment", leader: FD, room: rooms.theater, cat: "fitness" },
    { start: t(12, 15), end: t(13, 15), title: "Strength Training", leader: FD, room: rooms.fitness, cat: "fitness" },
    { start: t(13), end: t(14), title: "Bridge Club", room: rooms.art, cat: "clubs" },
    { start: t(13), title: "Bus Trip: Nature Walk", leader: FD, desc: "A gentle walk at Elk Grove Regional Park or along the Laguna Creek Trail.", room: rooms.lobby, cat: "trips", cap: 18 },
    { start: t(15), end: t(15, 45), title: "Resistance Bands", room: rooms.fitness, cat: "fitness" },
    { start: t(19), title: "Evening Movie", room: rooms.theater, cat: "movies" },
  ],
  2: [
    { start: t(9), end: t(9, 45), title: "Resistance Bands", room: rooms.fitness, cat: "fitness" },
    { start: t(9, 30), title: "Shopping Trip", room: rooms.lobby, cat: "trips", cap: 14 },
    { start: t(10), end: t(11), title: "Bible Study", room: rooms.art, cat: "faith" },
    { start: t(10), end: t(10, 45), title: "Line Dancing", room: rooms.fitness, cat: "fitness" },
    { start: t(11), end: t(12), title: "Bocce on the Court", desc: "Teams drawn on the day — beginners welcome.", room: rooms.bocce, cat: "fitness", cap: 12 },
    { start: t(13), title: "Garden Club", desc: "Planting and tending the courtyard’s raised beds and cutting garden.", room: rooms.courtyard, cat: "clubs" },
    { start: t(13), end: t(13, 45), title: "Seated Dance", room: rooms.fitness, cat: "fitness" },
    { start: t(14), end: t(14, 30), title: "Better Balance", room: rooms.fitness, cat: "fitness" },
    { start: t(14), title: "Card Games", room: rooms.art, cat: "clubs" },
    { start: t(15), end: t(16), title: "Happy Hour with Live Music", room: rooms.bistro, cat: "music" },
    { start: t(18), title: "Documentary Movie", room: rooms.theater, cat: "movies" },
    { start: t(18), end: t(19), title: "Mexican Train Dominoes", room: rooms.stonelakes, cat: "clubs" },
  ],
  3: [
    { start: t(9), end: t(9, 45), title: "Step Aerobics", leader: FD, room: rooms.fitness, cat: "fitness" },
    { start: t(10), end: t(10, 45), title: "Better Balance", room: rooms.fitness, cat: "fitness" },
    { start: t(10), title: "Group Crossword", room: rooms.art, cat: "clubs" },
    { start: t(10, 30), title: "Catholic Rosary", room: rooms.theater, cat: "faith" },
    { start: t(11), end: t(11, 30), title: "Harbor Stretch & Breathe", leader: FD, room: rooms.harbor, cat: "fitness", cap: 12, harbor: true },
    { start: t(12, 15), end: t(13, 15), title: "Strength Training", leader: FD, room: rooms.fitness, cat: "fitness" },
    { start: t(13), end: t(14), title: "Poker Club", room: rooms.club, cat: "clubs" },
    { start: t(14, 30), end: t(15, 30), title: "Bingo", leader: EAA, desc: "Our weekly game — residents are in it to win it.", room: rooms.bistro, cat: "clubs" },
    { start: t(18), title: "Evening Movie", room: rooms.theater, cat: "movies" },
  ],
  4: [
    { start: t(9), end: t(9, 45), title: "Resistance Bands", room: rooms.fitness, cat: "fitness" },
    { start: t(10), end: t(10, 45), title: "Line Dancing", room: rooms.fitness, cat: "fitness" },
    { start: t(10, 30), title: "Disc Golf & Olympic Rings", leader: FD, desc: "Outdoor games that are harder than they look.", room: rooms.courtyard, cat: "fitness", cap: 10 },
    { start: t(13), end: t(14), title: "Hand & Foot Club", room: rooms.art, cat: "clubs" },
    { start: t(13), end: t(13, 45), title: "Seated Dance", room: rooms.fitness, cat: "fitness" },
    { start: t(15), end: t(15, 30), title: "Better Balance", room: rooms.fitness, cat: "fitness" },
    { start: t(15), title: "Word Games", room: rooms.bistro, cat: "clubs" },
    { start: t(18), end: t(19), title: "Pinochle Night", room: rooms.club, cat: "clubs" },
    { start: t(19), title: "Evening Movie", room: rooms.theater, cat: "movies" },
  ],
  5: [
    { start: t(9), end: t(10), title: "Friday Stretch", room: rooms.theater, cat: "fitness" },
    { start: t(10), end: t(10, 45), title: "Seated Cardio", room: rooms.fitness, cat: "fitness" },
    { start: t(10), title: "Group Crossword", room: rooms.art, cat: "clubs" },
    { start: t(11), end: t(11, 45), title: "Tai Chi", room: rooms.fitness, cat: "fitness" },
    { start: t(12, 15), end: t(13, 15), title: "Strength Training", leader: FD, room: rooms.fitness, cat: "fitness" },
    { start: t(13), end: t(14), title: "Bridge Club", room: rooms.art, cat: "clubs" },
    { start: t(14), end: t(14, 45), title: "Axe Throwing", leader: FD, desc: "Soft-tip axes, a lot of cheering.", room: rooms.courtyard, cat: "fitness", cap: 10 },
    { start: t(14, 45), end: t(15, 45), title: "Activity Meeting", desc: "Go over next week’s events and changes, then drinks and appetizers.", leader: EA, room: rooms.bistro, cat: "community" },
    { start: t(15), end: t(16), title: "Happy Hour with Live Music", room: rooms.bistro, cat: "music" },
    { start: t(18), title: "Evening Movie", room: rooms.theater, cat: "movies" },
  ],
  6: [
    { start: t(9, 30), title: "Group Crossword", room: rooms.art, cat: "clubs" },
    { start: t(9, 30), title: "Saturday Bus Trip", room: rooms.lobby, cat: "trips", cap: 14 },
    { start: t(11, 30), title: "Music & Movement in Harbor", room: rooms.harbor, cat: "fitness", harbor: true },
    { start: t(12, 15), end: t(13, 30), title: "Sit and Stretch", room: rooms.fitness, cat: "fitness" },
    { start: t(13), end: t(15), title: "Hand & Foot Game Club", room: rooms.art, cat: "clubs" },
    { start: t(13, 30), end: t(14, 30), title: "Scrabble Club", room: rooms.club, cat: "clubs" },
    { start: t(14), title: "Saturday Classic Film", room: rooms.theater, cat: "movies" },
    { start: t(15), title: "Brain Games", leader: EAA, room: rooms.stonelakes, cat: "clubs" },
    { start: t(18), title: "Evening Movie", room: rooms.theater, cat: "movies" },
  ],
};

// Harbor’s own daily rhythm, alongside the shared calendar (activity programming 12 hours a day).
const harborDaily: Record<number, Seed[]> = {
  0: [{ start: t(10), title: "Harbor Sunday Hymns & Coffee", room: rooms.harbor, cat: "harbor" }, { start: t(14, 30), title: "Courtyard Stroll & Putting Green", room: rooms.harborCourtyard, cat: "harbor" }],
  1: [{ start: t(10), title: "Morning Paper & Literature Review", room: rooms.harbor, cat: "harbor" }, { start: t(14), title: "Ceramics", room: rooms.harbor, cat: "harbor" }],
  2: [{ start: t(10, 30), title: "Gardening in the Harbor Courtyard", room: rooms.harborCourtyard, cat: "harbor" }, { start: t(14), title: "Therapeutic Storytelling", room: rooms.harbor, cat: "harbor" }],
  3: [{ start: t(14), title: "Pet Therapy Visit", room: rooms.harbor, cat: "harbor" }],
  4: [{ start: t(9, 30), end: t(10, 15), title: "Harbor Helpers: Folding & Table Setting", desc: "Being useful means living with purpose.", room: rooms.harbor, cat: "harbor" }, { start: t(14), title: "Live Music in Harbor", room: rooms.harbor, cat: "music" }],
  5: [{ start: t(10, 30), title: "Harbor Outing", desc: "Weekly adventure — this month: a museum visit, a local restaurant and a drive out to see the cranes.", room: rooms.lobby, cat: "trips", cap: 8 }, { start: t(14, 30), title: "Ceramics", room: rooms.harbor, cat: "harbor" }],
  6: [{ start: t(10), title: "Harbor Fitness Class", room: rooms.harbor, cat: "fitness" }, { start: t(15, 30), title: "Reminiscence & Photo Albums", room: rooms.harbor, cat: "harbor" }],
};

// ---------- Dated events ----------
type Dated = Seed & { replaces?: string; retitle?: { from: string; to: string; desc?: string; cap?: number } };
const dated: Record<string, Dated[]> = {
  // Late October 2026
  "2026-10-27": [{ start: t(15), end: t(16), title: "Happy Hour: Acoustic Guitar", room: rooms.bistro, cat: "music", replaces: "Happy Hour with Live Music" }],
  "2026-10-28": [{ start: t(14), end: t(15), title: "Pumpkin Carving around the Fire Pit", desc: "Bring your best idea — the creations go up on Facebook Friday.", room: rooms.courtyard, cat: "community", special: true }],
  "2026-10-29": [{ start: t(10, 30), title: "Harbor Pumpkin Painting", room: rooms.harborCourtyard, cat: "harbor", harbor: true, special: true }],
  "2026-10-30": [{ start: t(15), end: t(16), title: "Halloween Happy Hour: Costumes Encouraged", desc: "Live music, costume parade and prizes.", room: rooms.bistro, cat: "music", replaces: "Happy Hour with Live Music", special: true }],
  "2026-10-31": [
    { start: t(16), end: t(17, 30), title: "Trick-or-Treat Hallway for Grandkids", desc: "Residents hand out treats; families welcome.", room: "All floors", cat: "community", special: true },
    { start: t(9, 30), title: "Bus Trip: Apple Hill Orchards", room: rooms.lobby, cat: "trips", cap: 14, replaces: "Saturday Bus Trip", special: true },
  ],

  // November 2026 (published calendar)
  "2026-11-01": [{ start: t(15), end: t(16), title: "Sunday Strings: Violin Duo", room: rooms.stonelakes, cat: "music", special: true }],
  "2026-11-02": [
    { start: t(9, 30), title: "Shopping: Elk Grove Marketplace", room: rooms.lobby, cat: "trips", cap: 12, replaces: "Shopping Trip" },
    { start: t(14), end: t(15), title: "Speaker Series: The History of Elk Grove", room: rooms.theater, cat: "community", special: true },
    { start: t(15), title: "Día de los Muertos Commemoration", room: rooms.bistro, cat: "community", special: true },
  ],
  "2026-11-03": [
    { start: t(9, 30), title: "Shopping: Raley’s", room: rooms.lobby, cat: "trips", cap: 14, replaces: "Shopping Trip" },
    { start: t(14), end: t(14, 45), title: "Cooking Lesson with the Dining Experience Director", desc: "This month: apple crisp with cinnamon gelato. Tasting included.", leader: "Dining Experience Director", room: rooms.stonelakes, cat: "community", special: true },
    { start: t(15), end: t(16), title: "Happy Hour: Jazz Trio", room: rooms.bistro, cat: "music", replaces: "Happy Hour with Live Music" },
  ],
  "2026-11-04": [
    { start: t(10, 30), title: "Catholic Mass", leader: "Visiting priest", room: rooms.theater, cat: "faith", replaces: "Catholic Rosary" },
    { start: t(11, 30), end: t(12, 30), title: "Fall Wreath Making", desc: "Using lavender and dried flowers from the cutting garden.", room: rooms.art, cat: "clubs", cap: 12, special: true },
    { start: t(15), title: "Monthly Events & Adventures Staff & Resident Meeting", room: rooms.theater, cat: "community", special: true },
    { start: t(16), title: "Dinner Trip: Old Town Elk Grove", room: rooms.lobby, cat: "trips", cap: 15, special: true },
  ],
  "2026-11-05": [
    { start: t(9), title: "Donuts, Muffins & Coffee", room: rooms.bistro, cat: "community", special: true },
    { start: t(12), title: "Lunch Trip with Harbor: Local Diner", room: rooms.lobby, cat: "trips", cap: 13, harbor: true, special: true },
    { start: t(15), title: "Bocce Tournament: Round One", leader: FD, room: rooms.bocce, cat: "fitness", special: true },
  ],
  "2026-11-06": [
    { start: t(9, 30), title: "Bus Trip: Aerospace Museum of California, McClellan Park", desc: "A guided tour — bring your stories if you flew any of them.", room: rooms.lobby, cat: "trips", cap: 16, special: true },
    { start: t(15), end: t(16), title: "Happy Hour: Country Classics", room: rooms.bistro, cat: "music", replaces: "Happy Hour with Live Music" },
    { start: t(18), end: t(19), title: "S’mores & Stories at the Fire Pit", room: rooms.courtyard, cat: "community", special: true },
  ],
  "2026-11-07": [
    { start: t(8), title: "Bus Trip: Sandhill Cranes at Stone Lakes National Wildlife Refuge", desc: "The cranes are back for the winter. Binoculars on board.", room: rooms.lobby, cat: "trips", cap: 14, replaces: "Saturday Bus Trip" },
    { start: t(14), title: "Classic Film: “It’s a Wonderful Life”", room: rooms.theater, cat: "movies", replaces: "Saturday Classic Film" },
  ],
  "2026-11-08": [{ start: t(13, 30), title: "SF 49ers vs Las Vegas Raiders", room: rooms.theater, cat: "movies", replaces: "Sunday Matinee" }],
  "2026-11-09": [
    { start: t(9, 30), title: "Shopping: Target, Laguna", room: rooms.lobby, cat: "trips", cap: 12, replaces: "Shopping Trip" },
    { start: t(11), title: "Town Hall with the Executive Director", leader: "Executive Director", room: rooms.theater, cat: "community", special: true, replaces: "Mindfulness Moment" },
    { start: t(14, 45), title: "Quarter Bingo", room: rooms.bistro, cat: "clubs", special: true },
  ],
  "2026-11-10": [{ start: t(15), end: t(16), title: "Happy Hour: Piano Standards", room: rooms.bistro, cat: "music", replaces: "Happy Hour with Live Music" }],
  "2026-11-11": [
    { start: t(9, 30), title: "Veterans Day: Flag Ceremony in the Courtyard", room: rooms.courtyard, cat: "community", special: true },
    { start: t(11), end: t(13), title: "Veterans’ Lunch", room: rooms.stonelakes, cat: "community", special: true },
    { start: t(14), end: t(15), title: "Veterans’ & Families Only Ceremony", room: rooms.theater, cat: "community", special: true },
  ],
  "2026-11-12": [
    { start: t(10, 30), title: "Shopping: Dollar Store", room: rooms.lobby, cat: "trips", cap: 12, special: true },
    { start: t(11, 30), title: "Armchair Travel: Japan", room: rooms.theater, cat: "community", special: true },
    { start: t(14), end: t(15), title: "Nutrition Talk: Eating for Energy", leader: FD, room: rooms.theater, cat: "community", special: true },
    { start: t(15), title: "Memory Support Group", room: rooms.club, cat: "community", harbor: true, special: true },
  ],
  "2026-11-13": [
    { start: t(14), end: t(16), title: "Paint and Sip", desc: "Our monthly favorite — residents, families and Care Partners welcome.", room: rooms.art, cat: "clubs", cap: 16, special: true },
    { start: t(15), end: t(16), title: "Happy Hour: Motown Night", room: rooms.bistro, cat: "music", replaces: "Happy Hour with Live Music" },
    { start: t(16), title: "Fast Food Friday: Burgers in Laguna", room: rooms.lobby, cat: "trips", cap: 14, special: true },
  ],
  "2026-11-14": [
    { start: t(9, 30), title: "Bus Trip: Old Sacramento & California State Railroad Museum", room: rooms.lobby, cat: "trips", cap: 14, replaces: "Saturday Bus Trip" },
    { start: t(14), title: "Harbor Sing-Along", room: rooms.harbor, cat: "music", harbor: true, special: true },
  ],
  "2026-11-16": [
    { start: t(9, 30), title: "Shopping: Trader Joe’s", room: rooms.lobby, cat: "trips", cap: 12, replaces: "Shopping Trip" },
    { start: t(14), title: "Ceramics Open Studio", room: rooms.art, cat: "clubs", special: true },
    { start: t(15), end: t(16), title: "Birthday Happy Hour", room: rooms.bistro, cat: "music", special: true },
  ],
  "2026-11-17": [
    { start: t(9, 30), title: "Shopping: Raley’s", room: rooms.lobby, cat: "trips", cap: 14, replaces: "Shopping Trip" },
    { start: t(18), title: "Fire Pit & “A Charlie Brown Thanksgiving”", room: rooms.courtyard, cat: "movies", special: true, replaces: "Documentary Movie" },
  ],
  "2026-11-18": [
    { start: t(10), title: "Bus Trip: Cosumnes River Preserve Boardwalk", leader: FD, room: rooms.lobby, cat: "trips", cap: 14, special: true },
    { start: t(14), title: "Tech Help: Phones, Tablets & Video Calls", room: rooms.theater, cat: "community", special: true },
  ],
  "2026-11-19": [
    { start: t(10, 30), title: "Harbor Art Afternoon", room: rooms.harbor, cat: "clubs", harbor: true, special: true },
    { start: t(11), end: t(12), title: "Resident Council Meeting", leader: "Resident Council President", room: rooms.theater, cat: "community", special: true },
  ],
  "2026-11-20": [{ start: t(10, 45), title: "Bus Trip: Wine Tasting in Lodi & Lunch", room: rooms.lobby, cat: "trips", cap: 12, special: true }],
  "2026-11-21": [
    { start: t(11), title: "Bocce Tournament: Finals", leader: FD, room: rooms.bocce, cat: "fitness", special: true },
    { start: t(13, 30), end: t(15), title: "Dessert Soirée", room: rooms.cypress, cat: "community", special: true },
  ],
  "2026-11-22": [{ start: t(13, 30), title: "SF 49ers vs Minnesota Vikings", room: rooms.theater, cat: "movies", replaces: "Sunday Matinee" }],
  "2026-11-23": [
    { start: t(9, 30), title: "Shopping: Elk Grove Marketplace", room: rooms.lobby, cat: "trips", cap: 12, replaces: "Shopping Trip" },
    { start: t(13, 30), title: "Bus Trip: Crocker Art Museum", room: rooms.lobby, cat: "trips", cap: 14, special: true },
  ],
  "2026-11-24": [
    { start: t(9, 30), title: "Shopping: Costco", room: rooms.lobby, cat: "trips", cap: 14, replaces: "Shopping Trip" },
    { start: t(15), end: t(16), title: "Happy Hour: Harvest Songs", room: rooms.bistro, cat: "music", replaces: "Happy Hour with Live Music" },
  ],
  "2026-11-25": [
    { start: t(14), end: t(15), title: "Monthly Resident Photo Slide Show", room: rooms.theater, cat: "community", special: true },
    { start: t(15), end: t(16), title: "Gratitude Tree", desc: "Add a leaf for what you’re thankful for this year.", room: rooms.bistro, cat: "community", special: true },
  ],
  "2026-11-26": [
    { start: t(8, 30), title: "Macy’s Thanksgiving Day Parade & Continental Breakfast", room: rooms.theater, cat: "community", special: true },
    { start: t(11, 30), title: "Armchair Travel: Plymouth, Massachusetts", room: rooms.theater, cat: "community", special: true },
  ],
  "2026-11-27": [
    { start: t(9), title: "Shopping: Target, Laguna", room: rooms.lobby, cat: "trips", cap: 14, special: true },
    { start: t(15), end: t(16), title: "Happy Hour: Leftover Pie Social", room: rooms.bistro, cat: "music", replaces: "Happy Hour with Live Music" },
  ],
  "2026-11-28": [{ start: t(9, 30), title: "Bus Trip: Old Town Elk Grove Holiday Shopping", room: rooms.lobby, cat: "trips", cap: 14, replaces: "Saturday Bus Trip" }],
  "2026-11-29": [{ start: t(13, 30), title: "SF 49ers vs Seattle Seahawks", room: rooms.theater, cat: "movies", replaces: "Sunday Matinee" }],
  "2026-11-30": [
    { start: t(9, 30), title: "Shopping: Walmart", room: rooms.lobby, cat: "trips", cap: 12, replaces: "Shopping Trip" },
    { start: t(13, 30), end: t(14, 30), title: "Book Club", room: rooms.club, cat: "clubs", special: true },
    { start: t(14, 45), title: "Prize Bingo", room: rooms.bistro, cat: "clubs", special: true },
  ],
};

/** Thanksgiving: the weekly classes take the day off. */
const quietDays = new Set(["2026-11-26"]);
const quietKeep = new Set(["Evening Movie"]);

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);

function seats(id: string, cap: number, date: string, todayIso: string) {
  // Further-out trips are less full; a few popular ones are full with a waitlist.
  const h = hash(id);
  const daysOut = Math.max(0, (fromIso(date).getTime() - fromIso(todayIso).getTime()) / 86_400_000);
  const fill = Math.min(1, 0.45 + ((h % 55) / 100) - Math.min(daysOut, 28) * 0.012);
  let taken = Math.max(1, Math.round(cap * fill));
  if (h % 7 === 0 && daysOut < 18) taken = cap;
  const waitlist = taken >= cap ? 1 + (h % 4) : 0;
  return { taken: Math.min(cap, taken), waitlist };
}

/** All events on one day, sorted by start time. `todayIso` controls seat counts (defaults to the date itself). */
export function eventsOn(date: Date, todayIso = iso(date)): CalEvent[] {
  const key = iso(date);
  const wd = dow(date);
  const extra = dated[key] ?? [];
  const replaced = new Set(extra.map((e) => e.replaces).filter(Boolean));
  let base: Seed[] = [...weekly[wd], ...harborDaily[wd].map((e) => ({ ...e, harbor: true }))].filter((e) => !replaced.has(e.title));
  if (quietDays.has(key)) base = base.filter((e) => quietKeep.has(e.title));
  const all = [...base, ...extra.map(({ replaces: _r, retitle: _t, ...e }) => e)];
  return all
    .map((e) => {
      const id = `bp-${key}-${slug(e.title)}-${e.start}`;
      const s = e.cap ? seats(id, e.cap, key, todayIso) : {};
      return { ...e, ...s, id, date: key } as CalEvent;
    })
    .sort((a, b) => a.start - b.start || a.title.localeCompare(b.title));
}

/** Events for a run of days. */
export function eventsBetween(start: Date, days: number, todayIso?: string) {
  return Array.from({ length: days }, (_, i) => {
    const d = addDays(start, i);
    return { date: d, events: eventsOn(d, todayIso) };
  });
}
