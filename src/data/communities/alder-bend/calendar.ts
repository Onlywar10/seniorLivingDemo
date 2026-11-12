// The activity calendar. Weekly program plus dated events (November 2026 is the published month).
import { addDays, dow, fromIso, hash, iso } from "@/lib/clock";
import { cats, filters, isLantern, seatsLeft, type CalEvent, type Cat } from "@/data/shared";
import { specialsOn } from "../specials";

export { cats, filters, isLantern, seatsLeft };
export type { CalEvent, Cat };

export const rooms = {
  theater: "Media/Theater Room",
  fitness: "Fitness Center",
  art: "Art Studio",
  lobby: "Lobby",
  perch: "The Perch",
  millpond: "Millpond Café",
  juniper: "Juniper Dining Room",
  club: "Club Room",
  living: "Living Room",
  courtyard: "Courtyard",
  lantern: "Lantern",
  lounge2: "2nd Floor Lounge",
} as const;

type Seed = Omit<CalEvent, "id" | "date">;
const t = (h: number, m = 0) => h * 60 + m;

// ---------- Weekly program (0 = Sunday) ----------
const weekly: Record<number, Seed[]> = {
  0: [
    { start: t(10, 30), title: "Non-Denominational Service", leader: "Chaplain Miriam", room: rooms.theater, cat: "faith" },
    { start: t(11), end: t(11, 45), title: "Chair Yoga", leader: "Sonya", room: rooms.fitness, cat: "fitness" },
    { start: t(13), end: t(13, 30), title: "Catholic Mass", room: rooms.theater, cat: "faith" },
    { start: t(14), title: "Sunday Matinee", room: rooms.theater, cat: "movies" },
    { start: t(18), title: "Sunday Evening Cinema", room: rooms.theater, cat: "movies" },
  ],
  1: [
    { start: t(9), end: t(9, 45), title: "Cardio Fitness", room: rooms.fitness, cat: "fitness" },
    { start: t(9, 30), title: "Shopping Trip", room: rooms.lobby, cat: "trips", cap: 12 },
    { start: t(10), end: t(10, 45), title: "Better Balance", room: rooms.fitness, cat: "fitness" },
    { start: t(10), title: "Trivia with Nora", leader: "Nora Castellano", room: rooms.theater, cat: "clubs" },
    { start: t(11), title: "Meditation", room: rooms.theater, cat: "fitness" },
    { start: t(12, 15), end: t(13, 15), title: "Sit To Be Fit", leader: "Shaun", room: rooms.fitness, cat: "fitness" },
    { start: t(13), end: t(14), title: "Bridge Club", room: rooms.art, cat: "clubs" },
    { start: t(13), title: "Bus Trip: Nature Walk with Devin", leader: "Devin Marsh", desc: "Explore the scenic trails of Fairhollow and see local wildlife.", room: rooms.lobby, cat: "trips", cap: 18 },
    { start: t(13), title: "Switch Bowling League: “The Lucky Strikes”", room: rooms.theater, cat: "clubs", cap: 4 },
    { start: t(15), end: t(15, 45), title: "Better Balance + Strength", room: rooms.fitness, cat: "fitness" },
    { start: t(19), title: "Evening Movie", room: rooms.theater, cat: "movies" },
  ],
  2: [
    { start: t(9), end: t(9, 45), title: "Resistance Bands", room: rooms.fitness, cat: "fitness" },
    { start: t(9, 30), title: "Shopping Trip", room: rooms.lobby, cat: "trips", cap: 14 },
    { start: t(10), end: t(11), title: "Bible Study", room: rooms.art, cat: "faith" },
    { start: t(10), end: t(10, 45), title: "Let’s Line Dance", room: rooms.fitness, cat: "fitness" },
    { start: t(11, 30), title: "Switch Bowling: “The Cool Chicks”", desc: "Come cheer them on!", room: rooms.theater, cat: "clubs", cap: 4 },
    { start: t(13), title: "Petal Pushers Flower Club", desc: "Blooms & Blossoms floral centerpiece decorating.", room: rooms.art, cat: "clubs" },
    { start: t(13), end: t(13, 45), title: "Seated Dance", room: rooms.fitness, cat: "fitness" },
    { start: t(14), end: t(14, 30), title: "Better Balance", room: rooms.fitness, cat: "fitness" },
    { start: t(14), title: "Card Game 65", room: rooms.art, cat: "clubs" },
    { start: t(15), end: t(16), title: "Happy Hour with Live Music", room: rooms.perch, cat: "music" },
    { start: t(18), title: "Documentary Movie", room: rooms.theater, cat: "movies" },
    { start: t(18), end: t(19), title: "Pegs & Jokers", room: rooms.millpond, cat: "clubs" },
  ],
  3: [
    { start: t(9), end: t(9, 45), title: "Circuit Playground", room: rooms.fitness, cat: "fitness" },
    { start: t(10), end: t(10, 45), title: "Better Balance", room: rooms.fitness, cat: "fitness" },
    { start: t(10), title: "Wordle / Group Crossword", room: rooms.art, cat: "clubs" },
    { start: t(10, 30), title: "Catholic Communion", room: rooms.theater, cat: "faith" },
    { start: t(11), end: t(11, 30), title: "Stretch Breathe Relax with Devin", leader: "Devin Marsh", room: rooms.lantern, cat: "fitness", cap: 12, lantern: true },
    { start: t(12, 15), end: t(13, 15), title: "Sit To Be Fit", leader: "Shaun", room: rooms.fitness, cat: "fitness" },
    { start: t(13), end: t(14), title: "Pinochle Club", room: rooms.art, cat: "clubs" },
    { start: t(15), end: t(15, 45), title: "Better Balance + Strength", room: rooms.fitness, cat: "fitness" },
    { start: t(18), title: "Evening Movie", room: rooms.theater, cat: "movies" },
  ],
  4: [
    { start: t(9), end: t(9, 45), title: "Resistance Bands", room: rooms.fitness, cat: "fitness" },
    { start: t(10), title: "Catholic Rosary", room: rooms.theater, cat: "faith" },
    { start: t(10), end: t(10, 45), title: "Let’s Line Dance", room: rooms.fitness, cat: "fitness" },
    { start: t(13), end: t(14), title: "Hand & Foot Club", room: rooms.art, cat: "clubs" },
    { start: t(13), end: t(13, 45), title: "Seated Dance", room: rooms.fitness, cat: "fitness" },
    { start: t(15), end: t(15, 30), title: "Better Balance", room: rooms.fitness, cat: "fitness" },
    { start: t(15), title: "Word in a Word", room: rooms.perch, cat: "clubs" },
    { start: t(18), end: t(19), title: "Poker Club", room: rooms.club, cat: "clubs" },
    { start: t(19), title: "Evening Movie", room: rooms.theater, cat: "movies" },
  ],
  5: [
    { start: t(9), end: t(10), title: "Friday Stretch", room: rooms.theater, cat: "fitness" },
    { start: t(10), end: t(10, 45), title: "Seated Cardio", room: rooms.fitness, cat: "fitness" },
    { start: t(10), title: "Wordle / Group Crossword", room: rooms.art, cat: "clubs" },
    { start: t(11), end: t(11, 45), title: "Tai Chi", leader: "Mei", room: rooms.fitness, cat: "fitness" },
    { start: t(12, 15), end: t(13, 15), title: "Sit To Be Fit", leader: "Shaun", room: rooms.fitness, cat: "fitness" },
    { start: t(13), end: t(14), title: "Bridge Club", room: rooms.art, cat: "clubs" },
    { start: t(13), end: t(13, 30), title: "Drum Circle", room: rooms.fitness, cat: "music" },
    { start: t(14), end: t(14, 45), title: "Better Balance + Strength", room: rooms.fitness, cat: "fitness" },
    { start: t(14, 45), end: t(15, 45), title: "Activity Meeting", desc: "Go over next week’s events and changes, then drinks and appetizers.", leader: "Nora Castellano", room: rooms.perch, cat: "community" },
    { start: t(15), end: t(16), title: "Happy Hour with Live Music", room: rooms.perch, cat: "music" },
    { start: t(18), title: "Evening Movie", room: rooms.theater, cat: "movies" },
  ],
  6: [
    { start: t(9, 30), title: "Wordle / Crossword", room: rooms.art, cat: "clubs" },
    { start: t(9, 30), title: "Saturday Bus Trip", room: rooms.lobby, cat: "trips", cap: 14 },
    { start: t(11, 30), title: "Zumba with Rhea", leader: "Rhea", room: rooms.lantern, cat: "fitness", lantern: true },
    { start: t(12, 15), end: t(13, 30), title: "Sit To Be Fit", leader: "Shaun", room: rooms.fitness, cat: "fitness" },
    { start: t(13), end: t(15), title: "Hand & Foot Game Club", room: rooms.art, cat: "clubs" },
    { start: t(13, 30), end: t(14, 30), title: "Scrabble Club", room: rooms.living, cat: "clubs" },
    { start: t(14), title: "TV Mini-Series: Letters from the Front", room: rooms.theater, cat: "movies" },
    { start: t(15), title: "Brain Busters with Ava", leader: "Ava", room: rooms.millpond, cat: "clubs" },
    { start: t(18), title: "Evening Movie", room: rooms.theater, cat: "movies" },
  ],
};

// Lantern’s own daily rhythm, alongside the shared calendar.
const lanternDaily: Record<number, Seed[]> = {
  0: [{ start: t(10), title: "Lantern Sunday Hymns & Coffee", room: rooms.lantern, cat: "lantern" }, { start: t(14, 30), title: "Courtyard Stroll & Garden Check", room: rooms.lantern, cat: "lantern" }],
  1: [{ start: t(10), title: "Morning Paper & Literature Review", room: rooms.lantern, cat: "lantern" }, { start: t(14), title: "Ceramics", room: rooms.lantern, cat: "lantern" }],
  2: [{ start: t(10, 30), title: "Gardening Club in the Lantern Courtyard", room: rooms.lantern, cat: "lantern" }, { start: t(14), title: "Therapeutic Storytelling", room: rooms.lantern, cat: "lantern" }],
  3: [{ start: t(14), title: "Pet Therapy with Thor", room: rooms.lantern, cat: "lantern" }],
  4: [{ start: t(9, 30), end: t(10, 15), title: "Lantern Helpers: Folding & Table Setting", desc: "Being useful means living with purpose.", room: rooms.lantern, cat: "lantern" }, { start: t(14), title: "Live Music in Lantern", room: rooms.lantern, cat: "music" }],
  5: [{ start: t(10, 30), title: "Lantern Outing", desc: "Weekly adventure — this month: bowling, a local restaurant and a museum visit.", room: rooms.lobby, cat: "trips", cap: 8 }, { start: t(14, 30), title: "Ceramics", room: rooms.lantern, cat: "lantern" }],
  6: [{ start: t(10), title: "Simplified Fitness with the Care Partners", room: rooms.lantern, cat: "fitness" }, { start: t(15, 30), title: "Reminiscence & Photo Albums", room: rooms.lantern, cat: "lantern" }],
};

// ---------- Dated events ----------
type Dated = Seed & { replaces?: string; retitle?: { from: string; to: string; desc?: string; cap?: number } };
const dated: Record<string, Dated[]> = {
  // Late October 2026
  "2026-10-27": [{ start: t(15), end: t(16), title: "Happy Hour: Wes on Guitar", room: rooms.perch, cat: "music", replaces: "Happy Hour with Live Music" }],
  "2026-10-28": [{ start: t(14), end: t(15), title: "Pumpkin Carving in the Courtyard", desc: "Bring your best idea — the creations go into the photo album Friday.", room: rooms.courtyard, cat: "community", special: true }],
  "2026-10-29": [{ start: t(10, 30), title: "Lantern Pumpkin Painting", room: rooms.lantern, cat: "lantern", lantern: true, special: true }],
  "2026-10-30": [{ start: t(15), end: t(16), title: "Halloween Happy Hour: Costumes Encouraged", desc: "Live music, costume parade and prizes.", room: rooms.perch, cat: "music", replaces: "Happy Hour with Live Music", special: true }],
  "2026-10-31": [
    { start: t(16), end: t(17, 30), title: "Trick-or-Treat Hallway for Grandkids", kind: "family", desc: "Residents hand out treats; families welcome.", room: "All floors", cat: "community", special: true },
    { start: t(9, 30), title: "Bus Trip: Juniper Hills Apple Orchards", room: rooms.lobby, cat: "trips", cap: 14, replaces: "Saturday Bus Trip", special: true },
  ],

  // November 2026 (published calendar)
  "2026-11-01": [{ start: t(15), end: t(16), title: "Live Music with Lorenzo on Violin", room: rooms.millpond, cat: "music", special: true }],
  "2026-11-02": [
    { start: t(9, 30), title: "Shopping: Millpond Marketplace", room: rooms.lobby, cat: "trips", cap: 12, replaces: "Shopping Trip" },
    { start: t(14), end: t(15), title: "Speaker Series: Captain Elaine Brooks, “Around the World Under Sail”", room: rooms.theater, cat: "community", special: true },
    { start: t(15), title: "Día de los Muertos Commemoration", room: rooms.perch, cat: "community", special: true },
  ],
  "2026-11-03": [
    { start: t(9, 30), title: "Shopping: Fairhollow Fresh Market", room: rooms.lobby, cat: "trips", cap: 14, replaces: "Shopping Trip" },
    { start: t(14), end: t(14, 45), title: "Conversations with Chef", leader: "Rafael Domingo", room: rooms.millpond, cat: "community", special: true },
    { start: t(15), end: t(16), title: "Happy Hour: Wes on Guitar", room: rooms.perch, cat: "music", replaces: "Happy Hour with Live Music" },
  ],
  "2026-11-04": [
    { start: t(10, 30), title: "Catholic Mass with St. Columba’s", leader: "Fr. Daniel Brennan", room: rooms.theater, cat: "faith", replaces: "Catholic Communion" },
    { start: t(11, 30), end: t(12, 30), title: "Fall Arts & Crafts with the Calder Arts Collective", desc: "New!", room: rooms.theater, cat: "clubs", cap: 12, special: true },
    { start: t(15), title: "Monthly Events & Adventures Staff & Resident Meeting", room: rooms.theater, cat: "community", special: true },
    { start: t(16), title: "Dinner Trip: The Copper Kettle, Old Town Fairhollow", room: rooms.lobby, cat: "trips", cap: 15, special: true },
  ],
  "2026-11-05": [
    { start: t(9), title: "Donuts, Muffins & Coffee", room: rooms.perch, cat: "community", special: true },
    { start: t(12), title: "Lunch Trip with Lantern: Lakeside Grill", room: rooms.lobby, cat: "trips", cap: 13, lantern: true, special: true },
    { start: t(15), title: "Devin’s AB Bucks Auction", leader: "Devin Marsh", room: rooms.theater, cat: "community", special: true },
  ],
  "2026-11-06": [
    { start: t(9, 30), title: "Bus Trip: Calder Air & Space Museum", room: rooms.lobby, cat: "trips", cap: 16, special: true },
    { start: t(15), end: t(16), title: "Happy Hour: The Millpond Ramblers", room: rooms.perch, cat: "music", replaces: "Happy Hour with Live Music" },
    { start: t(18), end: t(19), title: "Roasted Marshmallows & Camp Stories", room: rooms.courtyard, cat: "community", special: true },
  ],
  "2026-11-07": [
    { start: t(9, 30), title: "Bus Trip: Juniper Hills Pottery Open House", room: rooms.lobby, cat: "trips", cap: 7, replaces: "Saturday Bus Trip" },
    { start: t(14), title: "TV: Letters from the Front, Episodes 17 & 18", room: rooms.theater, cat: "movies", replaces: "TV Mini-Series: Letters from the Front" },
  ],
  "2026-11-08": [{ start: t(13, 30), title: "Sunday Football on the Big Screen", room: rooms.theater, cat: "movies", replaces: "Sunday Matinee" }],
  "2026-11-09": [
    { start: t(9, 30), title: "Shopping: Harvest Foods", room: rooms.lobby, cat: "trips", cap: 12, replaces: "Shopping Trip" },
    { start: t(10), end: t(11), title: "YouTube Fun: “Ghost Towns of the Gold Rush”", room: rooms.theater, cat: "movies", special: true },
    { start: t(11), title: "Town Hall with the Executive Director", leader: "Renata Holloway", room: rooms.theater, cat: "community", special: true, replaces: "Meditation" },
    { start: t(14, 45), title: "Quarter Bingo", room: rooms.theater, cat: "clubs", special: true },
  ],
  "2026-11-10": [{ start: t(15), end: t(16), title: "Happy Hour: The Bluebell Trio", room: rooms.perch, cat: "music", replaces: "Happy Hour with Live Music" }],
  "2026-11-11": [
    { start: t(7, 30), title: "Veterans Day: Bus Trip to the Veterans Day Parade", room: rooms.lobby, cat: "trips", cap: 18, special: true },
    { start: t(11), end: t(13), title: "Veterans’ Lunch", room: rooms.millpond, cat: "community", special: true },
    { start: t(14), end: t(15), title: "Veterans’ & Families Only Ceremony", room: rooms.theater, cat: "community", special: true },
  ],
  "2026-11-12": [
    { start: t(10, 30), title: "Shopping: Dollar Store", room: rooms.lobby, cat: "trips", cap: 12, special: true },
    { start: t(11, 30), title: "Armchair Travel: Egypt", room: rooms.theater, cat: "community", special: true },
    { start: t(14), end: t(15), title: "Heartwarming Story Readings", room: rooms.living, cat: "community", special: true },
    { start: t(15), title: "Memory Support Group", room: rooms.club, cat: "community", lantern: true, special: true },
  ],
  "2026-11-13": [
    { start: t(11), end: t(12, 30), title: "Knitting Club", room: rooms.art, cat: "clubs", special: true },
    { start: t(15), end: t(16), title: "Happy Hour: Rosalind on Keys", room: rooms.perch, cat: "music", replaces: "Happy Hour with Live Music" },
    { start: t(16), title: "Fast Food Friday: Burger Barn, Millpond Marketplace", room: rooms.lobby, cat: "trips", cap: 14, special: true },
  ],
  "2026-11-14": [
    { start: t(9, 30), title: "Bus Trip: Juniper Hills Scenic Drive & Lunch", room: rooms.lobby, cat: "trips", cap: 14, replaces: "Saturday Bus Trip" },
    { start: t(14), title: "Music with Hank Delrio", room: rooms.lantern, cat: "music", lantern: true, special: true },
    { start: t(14), title: "TV: Letters from the Front, Episodes 19 & 20", room: rooms.theater, cat: "movies", replaces: "TV Mini-Series: Letters from the Front" },
  ],
  "2026-11-16": [
    { start: t(9, 30), title: "Shopping: Old Town Gift Shops", room: rooms.lobby, cat: "trips", cap: 12, replaces: "Shopping Trip" },
    { start: t(14), title: "Buttons & Bookmarks with Thor!", room: rooms.lounge2, cat: "clubs", special: true },
    { start: t(15), end: t(16), title: "Birthday Happy Hour with Marco", room: rooms.perch, cat: "music", special: true },
  ],
  "2026-11-17": [
    { start: t(9, 30), title: "Shopping: Fairhollow Fresh Market", room: rooms.lobby, cat: "trips", cap: 14, replaces: "Shopping Trip" },
    { start: t(18), title: "Roasted Marshmallows & a Thanksgiving Movie", room: rooms.courtyard, cat: "movies", special: true, replaces: "Documentary Movie" },
  ],
  "2026-11-18": [
    { start: t(14), title: "Tech Corner with Devin & Nora", room: rooms.theater, cat: "community", special: true },
    { start: t(15), title: "Healthy Happy Hour with Devin & Priya!", desc: "Music, nutritious snacks and choreography.", room: rooms.perch, cat: "music", special: true },
  ],
  "2026-11-19": [
    { start: t(10, 30), title: "Make Things Interesting Art", room: rooms.lantern, cat: "clubs", lantern: true, special: true },
    { start: t(11), end: t(12), title: "All-Resident Council Meeting", leader: "Walt Pemberton", room: rooms.theater, cat: "community", special: true },
  ],
  "2026-11-20": [{ start: t(10, 45), title: "Bus Trip: Wine Tasting at Larkspur Cellars & Lunch", room: rooms.lobby, cat: "trips", cap: 12, special: true }],
  "2026-11-21": [
    { start: t(11), title: "Craft with Fairhollow High School Senior Assistance Club", room: rooms.art, cat: "clubs", special: true },
    { start: t(13, 30), end: t(15), title: "Dessert Soirée", room: rooms.juniper, cat: "community", special: true },
  ],
  "2026-11-22": [{ start: t(13, 30), title: "Sunday Football on the Big Screen", room: rooms.theater, cat: "movies", replaces: "Sunday Matinee" }],
  "2026-11-23": [
    { start: t(9, 30), title: "Shopping: Harvest Foods", room: rooms.lobby, cat: "trips", cap: 12, replaces: "Shopping Trip" },
    { start: t(10), end: t(11), title: "YouTube Fun", room: rooms.theater, cat: "movies", special: true },
    { start: t(13, 30), title: "Bus Trip: Calder Candy Works", room: rooms.lobby, cat: "trips", cap: 14, special: true },
  ],
  "2026-11-24": [
    { start: t(9, 30), title: "Shopping: Calder Co-op Grocery", room: rooms.lobby, cat: "trips", cap: 14, replaces: "Shopping Trip" },
    { start: t(15), end: t(16), title: "Happy Hour with Juliette", room: rooms.perch, cat: "music", replaces: "Happy Hour with Live Music" },
  ],
  "2026-11-25": [
    { start: t(14), end: t(15), title: "Monthly Resident Photo Slide Show", room: rooms.theater, cat: "community", special: true },
    { start: t(15), end: t(16), title: "“This Is Your Life” Interviews", room: rooms.theater, cat: "community", special: true },
  ],
  "2026-11-26": [
    { start: t(8, 15), title: "Thanksgiving: Bus Trip to the Fairhollow Turkey Trot", room: rooms.lobby, cat: "trips", cap: 14, cost: "$$", special: true },
    { start: t(8, 30), title: "Thanksgiving Day Parade on TV & Continental Breakfast", room: rooms.theater, cat: "community", special: true },
    { start: t(11, 30), title: "Armchair Travel: Massachusetts", room: rooms.theater, cat: "community", special: true },
  ],
  "2026-11-27": [
    { start: t(9), title: "Shopping: Calder Commons", room: rooms.lobby, cat: "trips", cap: 14, special: true },
    { start: t(15), end: t(16), title: "Happy Hour: Cal on Piano", room: rooms.perch, cat: "music", replaces: "Happy Hour with Live Music" },
  ],
  "2026-11-28": [{ start: t(9, 30), title: "Bus Trip: Old Town Farmers’ Market & Artisan Holiday Bazaar", room: rooms.lobby, cat: "trips", cap: 14, replaces: "Saturday Bus Trip" }],
  "2026-11-29": [{ start: t(13, 30), title: "Sunday Football on the Big Screen", room: rooms.theater, cat: "movies", replaces: "Sunday Matinee" }],
  "2026-11-30": [
    { start: t(9, 30), title: "Shopping: Riverside Plaza", room: rooms.lobby, cat: "trips", cap: 12, replaces: "Shopping Trip" },
    { start: t(13, 30), end: t(14, 30), title: "Book Club", room: rooms.living, cat: "clubs", special: true },
    { start: t(14, 45), title: "Prize Bingo", room: rooms.theater, cat: "clubs", special: true },
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
  let base: Seed[] = [...weekly[wd], ...lanternDaily[wd].map((e) => ({ ...e, lantern: true }))].filter((e) => !replaced.has(e.title));
  if (quietDays.has(key)) base = base.filter((e) => quietKeep.has(e.title));
  // The weekly shopping trips run Monday and Tuesday; on dated shopping days the destination replaces the generic title.
  const all = [...base, ...extra.map(({ replaces: _r, retitle: _t, ...e }) => e), ...specialsOn(key, { openHouseRoom: "Lobby and model apartments", barbecueRoom: rooms.courtyard, lunchAt: "the Juniper Dining Room" })];
  return all
    .map((e) => {
      const id = `${key}-${slug(e.title)}-${e.start}`;
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
