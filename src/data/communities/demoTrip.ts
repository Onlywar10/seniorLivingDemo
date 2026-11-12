// A sample off-campus trip, always on the calendar two days from today, so the demo shows one end to end: a bus trip
// with two stops, limited seats (most taken), a written description and a plan of the day. It appears on the public
// calendar (by name and time only: it's a resident outing), in the staff Calendar, on residents' week pages and in
// Post's previews. Invented; safe on the server and in the browser.
import type { CalEvent } from "@/data/shared";
import { addDays, iso, today } from "@/lib/clock";
import { searchPlaces, type Place } from "@/lib/places";
import type { PlanStep } from "@/lib/eventPlan";

const TITLE = "Bus Trip: Lakeview Park and Lunch at the Copper Kettle";
export const isDemoTrip = (id: string) => id.endsWith("-demo-trip-lakeview");

/** The day it's on: two days from today. */
export const demoTripDate = () => iso(addDays(today(), 2));

/** The trip as the calendar has it, for one community. */
export function demoTrip(leader?: string): CalEvent {
  const date = demoTripDate();
  return {
    id: `${date}-demo-trip-lakeview`, date, start: 9 * 60 + 30, end: 14 * 60, title: TITLE, room: "Off campus", cat: "trips", kind: "resident",
    cap: 12, taken: 9, leader, special: true,
    desc: "A morning by the water and lunch out. We walk (or roll) the flat boardwalk at Lakeview Park, then sit down to lunch at the Copper Kettle Diner. Wheelchair-accessible bus; staff come along the whole way. Bring a sun hat and a light jacket.",
  };
}

const find = (name: string): Place => searchPlaces(name)[0];
/** Where it goes, in order. */
export const demoTripStops = (): Place[] => [find("Lakeview Park"), find("Copper Kettle")].filter(Boolean);

/** What happens through the day. */
export const demoTripPlan = (): PlanStep[] => [
  { at: 9 * 60 + 30, what: "Meet in the lobby; staff check everyone in" },
  { at: 9 * 60 + 45, what: "The bus leaves" },
  { at: 10 * 60 + 10, what: "Lakeview Park: an easy walk on the boardwalk, benches all the way" },
  { at: 11 * 60 + 15, what: "Coffee by the lake and the duck pond" },
  { at: 11 * 60 + 50, what: "On to the Copper Kettle Diner" },
  { at: 12 * 60, what: "Lunch: order anything from the menu (it’s included)" },
  { at: 13 * 60 + 15, what: "Back on the bus" },
  { at: 14 * 60, what: "Home again" },
];
