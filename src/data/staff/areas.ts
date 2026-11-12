// "Who I look after": an optional layer the administrator turns on in Settings. Each resident has an area (a floor, a
// wing, or Lantern) and the staff member who looks after that area; everything to do with a resident (asks in person,
// invites, "we haven't seen lately", welcome checklists, family requests) then goes to that person. Lantern residents
// always go to the Lantern team. Strictly engagement and communication: no medication, care plans or clinical notes,
// which belong in the community's own care systems. Off by default; when it's off nothing here changes any screen.
import type { CommunitySlug } from "@/data/communities";
import { hash } from "@/lib/clock";
import { getStaffData } from "./index";
import type { PersonKey } from "./shared";

export { AREAS_COOKIE, ASSIGN_COOKIE } from "./shared";

export interface Area { key: string; name: string; lead: PersonKey; lantern?: boolean; note: string }
export interface Placement { name: string; apt: string; area: Area | null; lead: PersonKey | null; lantern: boolean; reason?: string }
/** The administrator's switch, and anyone they placed by hand. */
export interface AreaState { on: boolean; placed: Record<string, string> }

/** The care partner who signs in as the light "caregiver" role in each community. */
export const careLogin: Record<CommunitySlug, PersonKey> = { "alder-bend": "kenji", "kestrel-point": "sofia" };

export function areasOf(slug: CommunitySlug): Area[] {
  const s = getStaffData(slug);
  return slug === "alder-bend"
    ? [
        { key: "f1", name: "First floor", lead: "kenji", note: "Apartments 1100 to 1499" },
        { key: "f2", name: "Second floor", lead: "lena", note: "Apartments 2100 to 2499" },
        { key: "f3", name: "Third floor", lead: s.roles.calendar, note: "Apartments 3100 to 3499" },
        { key: "lantern", name: "Lantern", lead: s.roles.lantern, lantern: true, note: "The memory care neighborhood: the Lantern team" },
      ]
    : [
        { key: "a", name: "A wing", lead: "sofia", note: "Apartments A100 to A399" },
        { key: "b", name: "B wing", lead: "darnell", note: "Apartments B100 to B399" },
        { key: "c", name: "C wing", lead: s.roles.calendar, note: "Apartments C100 to C399" },
        { key: "lantern", name: "Lantern", lead: s.roles.lantern, lantern: true, note: "The memory care neighborhood: the Lantern team" },
      ];
}

/** Residents not yet placed in an area: new move-ins, and someone who changed apartments. */
const notPlaced: Record<CommunitySlug, Record<string, string>> = {
  "alder-bend": { "Marvin Achterberg": "Moved in 2 days ago", "Florence Pike": "Changed apartments last week" },
  "kestrel-point": { "Desmond Pryor": "Moved in 3 days ago", "Myrtle Vance": "Changed apartments last week" },
};
const moveIns: Record<CommunitySlug, Record<string, string>> = {
  "alder-bend": { "Marvin Achterberg": "3112", "Lucille Varga": "1226" },
  "kestrel-point": { "Desmond Pryor": "C204", "Ingrid Solberg": "A112" },
};

/** Where every resident lives and who looks after them. */
export function placements(slug: CommunitySlug, placed: Record<string, string> = {}): Placement[] {
  const s = getStaffData(slug);
  const areas = areasOf(slug);
  const lantern = areas.find((a) => a.lantern)!;
  const rooms = areas.filter((a) => !a.lantern);
  const apts = new Map<string, string>(s.contacts.map((c) => [c.resident, c.apt]));
  Object.entries(moveIns[slug]).forEach(([n, a]) => apts.set(n, a));
  const names = [...new Set([...s.residentNames, ...s.lanternNames, ...Object.keys(moveIns[slug])])];
  const ab = slug === "alder-bend";
  return names.map((name) => {
    const h = hash(name);
    const isL = s.lanternNames.includes(name) || /^Lantern/.test(apts.get(name) ?? "");
    const home = rooms[h % rooms.length];
    const apt = apts.get(name) ?? (isL ? `Lantern ${1 + (h % 20)}` : ab ? `${rooms.indexOf(home) + 1}${1 + (h % 4)}${String(1 + (h % 29)).padStart(2, "0")}` : `${home.key.toUpperCase()}${1 + (h % 3)}${String(1 + (h % 29)).padStart(2, "0")}`);
    const byApt = isL ? lantern : ab ? rooms[Number(apt[0]) - 1] : rooms.find((a) => a.key === apt[0].toLowerCase());
    const hand = placed[name] ? areas.find((a) => a.key === placed[name]) : undefined;
    // Lantern residents always go to the Lantern team.
    const area = isL ? lantern : hand ?? (notPlaced[slug][name] ? null : byApt ?? home);
    return { name, apt, area, lead: area?.lead ?? null, lantern: isL, reason: area ? undefined : notPlaced[slug][name] };
  });
}

export const placementOf = (slug: CommunitySlug, name: string, placed?: Record<string, string>) => placements(slug, placed).find((p) => p.name === name);
/** The residents one staff member looks after. */
export const residentsOf = (slug: CommunitySlug, key: PersonKey, placed?: Record<string, string>) => placements(slug, placed).filter((p) => p.lead === key);

/**
 * Recent notes about a resident, written by whoever looks after them: what they enjoyed, what they'd like to try,
 * who they'd like to sit with. Engagement only, never health or care (that lives in the care system).
 */
export function residentNotes(slug: CommunitySlug, name: string, by: string): { when: string; by: string; text: string }[] {
  const h = hash(name + slug);
  const f = name.split(" ")[0];
  const pool = [
    `${f} enjoyed Trivia this week and wants to bring a friend next time.`,
    `Talked about the grandchildren visiting at Thanksgiving; ${f} would like a quiet table for lunch that day.`,
    `${f} asked to be told first about the next bus trip.`,
    `Brought in old photos of the family farm; would love to share them at Coffee & Conversation.`,
    `${f} is happy to help hand out the song sheets on Fridays.`,
    `Mentioned missing the garden at home; invited ${f} to the planter beds on Saturday.`,
    `${f} prefers mornings; afternoons are for a nap and a phone call with family.`,
  ];
  return [pool[h % pool.length], pool[(h + 3) % pool.length]].map((text, i) => ({ text, by, when: i ? "Last week" : ["Yesterday", "Mon", "This morning"][h % 3] }));
}
