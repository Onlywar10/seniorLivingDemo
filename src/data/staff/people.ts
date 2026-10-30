// Who signs in, and every community's staff team. Kept apart from the operational records so
// client components (avatars, the shell) can import it without pulling in every community's data.
import type { PersonKey, StaffPerson } from "./shared";

/** The signed-in staff user. The same person whichever community they're looking at. */
export const user = {
  name: "Toni Glenn",
  first: "Toni",
  initials: "TG",
  role: "Events & Adventures Director",
  email: "tglenn@prairiecitylanding.com",
};

export const pclPeople: Record<PersonKey, StaffPerson> = {
  toni: { name: "Toni Glenn", initials: "TG", role: "Events & Adventures Director", color: "#ad4f36" },
  jason: { name: "Jason Cherry", initials: "JC", role: "Fitness Director", color: "#47704c" },
  cheryl: { name: "Cheryl Martin", initials: "CM", role: "Executive Director", color: "#2e4d33" },
  cynthia: { name: "Cynthia Bazin", initials: "CB", role: "Community Relations Director", color: "#4c87a2" },
  conrad: { name: "Conrad Caguimbal", initials: "CC", role: "Culinary Director", color: "#968b53" },
  mickei: { name: "Mickei Butler", initials: "MB", role: "Dining Experience Director", color: "#b0882a" },
  douglas: { name: "Douglas Wigner", initials: "DW", role: "Business Office Director", color: "#425968" },
  janelle: { name: "Janelle Zweber", initials: "JZ", role: "Harbor Memory Care Director", color: "#be4142" },
  jan: { name: "Jan McLennon", initials: "JM", role: "Resident Services Director", color: "#6b5aa6" },
  shirley: { name: "Shirley Richard", initials: "SR", role: "Lead Ambassador", color: "#7a6a3a" },
};

/** Bruceville Point's published team (src/data/communities/bruceville-point/site.ts `team`). */
export const bpPeople: Record<PersonKey, StaffPerson> = {
  marianne: { name: "Marianne Richardson", initials: "MR", role: "Executive Director", color: "#2e4d33" },
  jaime: { name: "Jaime Cervantes", initials: "JC", role: "Community Relations Director", color: "#4c87a2" },
  nicole: { name: "Nicole Grayson", initials: "NG", role: "Resident Services Director", color: "#6b5aa6" },
  amrita: { name: "Amrita Sapkota", initials: "AS", role: "Harbor Director", color: "#be4142" },
  timothy: { name: "Timothy Smith", initials: "TS", role: "Events and Adventures Director", color: "#ad4f36" },
  monica: { name: "Monica Thayer", initials: "MT", role: "Events and Adventures Assistant", color: "#c46a4a" },
  tina: { name: "Tina Trillo", initials: "TT", role: "Fitness Director", color: "#47704c" },
  danyale: { name: "Danyale Liberati Shaw", initials: "DS", role: "Dining Experience Director", color: "#b0882a" },
  eric: { name: "Eric Auclair", initials: "EA", role: "Culinary Director", color: "#968b53" },
  breah: { name: "Breah Taylor", initials: "BT", role: "Business Office Director", color: "#425968" },
  joe: { name: "Joe Mora", initials: "JM", role: "Maintenance Director", color: "#5b6b4a" },
  betty: { name: "Betty Phelps", initials: "BP", role: "Lead Ambassador", color: "#7a6a3a" },
};

/** Every staff person, across communities (keys are unique). */
export const staffPeople: Record<PersonKey, StaffPerson> = { ...pclPeople, ...bpPeople };
