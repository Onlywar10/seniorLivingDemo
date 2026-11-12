// Places for off-campus events. MOCK: in the product this is a map search (Google Places or Mapbox geocoding) and a
// real drive-time lookup. Here it searches a fixed list of invented places near the communities, and drive times come
// from a stable hash, so the same place always takes the same time. Safe on the server and in the browser.
import { hash } from "./clock";

export interface Place {
  /** A stable id (the search result's id in the real API). */
  id: string;
  name: string;
  address: string;
  /** "Museum", "Restaurant", "Park"… */
  kind: string;
  /** Minutes by bus from the community (mock). */
  mins: number;
  /** Where it sits on the mock map, 0–100 each way (the community is at 50, 50). */
  x: number; y: number;
}

const RAW: [string, string, string][] = [
  ["Fairhollow Botanical Garden", "1200 Arbor Way, Fairhollow, CA", "Garden"],
  ["Rivermead Historical Museum", "45 Mill Street, Rivermead, CA", "Museum"],
  ["Harvest Foods Market", "880 Orchard Road, Fairhollow, CA", "Grocery store"],
  ["Dollar Store, Valley Plaza", "Valley Plaza, 210 Main Street, Fairhollow, CA", "Store"],
  ["Juniper Hills Scenic Drive", "Juniper Hills Road, Fairhollow, CA", "Scenic drive"],
  ["Lakeview Park and Boardwalk", "3 Lakeview Drive, Rivermead, CA", "Park"],
  ["The Copper Kettle Diner", "77 Depot Street, Rivermead, CA", "Restaurant"],
  ["Rivermead Performing Arts Center", "500 Theater Lane, Rivermead, CA", "Theater"],
  ["Sunrise Orchard and Farm Stand", "12 County Road 9, Fairhollow, CA", "Farm"],
  ["Fairhollow Public Library", "300 Library Lane, Fairhollow, CA", "Library"],
  ["Westgate Shopping Center", "1500 Westgate Boulevard, Rivermead, CA", "Shopping center"],
  ["Bayside Aquarium", "9 Harbor Point, Rivermead, CA", "Aquarium"],
  ["Holloway Winery Tasting Room", "4410 Vineyard Road, Fairhollow, CA", "Winery"],
  ["St. Anne's Holiday Lights", "St. Anne's Church, 18 Chapel Street, Fairhollow, CA", "Seasonal"],
  ["Olive Grove Café", "62 Plaza Court, Fairhollow, CA", "Café"],
  ["Rivermead Senior Center", "250 Elm Avenue, Rivermead, CA", "Community center"],
];

const toPlace = (name: string, address: string, kind: string): Place => {
  const h = hash(name);
  return { id: `pl-${h.toString(36)}`, name, address, kind, mins: 8 + (h % 33), x: 10 + (h % 81), y: 10 + ((h >> 7) % 81) };
};
const PLACES: Place[] = RAW.map(([n, a, k]) => toPlace(n, a, k));

/** MOCK of the map search: places whose name, address or kind match, best first. */
export function searchPlaces(q: string): Place[] {
  const t = q.trim().toLowerCase();
  if (t.length < 2) return [];
  const words = t.split(/\s+/);
  return PLACES
    .map((p) => ({ p, s: words.filter((w) => `${p.name} ${p.address} ${p.kind}`.toLowerCase().includes(w)).length + (p.name.toLowerCase().startsWith(t) ? 2 : 0) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.p.mins - b.p.mins)
    .slice(0, 6)
    .map((x) => x.p);
}

/** A place staff typed that the search didn't find (the real API would still find an address for it). */
export const customPlace = (text: string): Place => ({ ...toPlace(text.trim(), "Address to confirm", "Custom stop"), name: text.trim() });

/** "Lakeview Park" or "Lakeview Park, then The Copper Kettle Diner" */
export const placesText = (ps: { name: string }[]) => (ps.length < 2 ? ps.map((p) => p.name).join("") : `${ps.slice(0, -1).map((p) => p.name).join(", ")}, then ${ps[ps.length - 1].name}`);

/** The room name used for an event that leaves the community. */
export const OFF_CAMPUS = "Off campus";
