// Who signs in, and every community's staff team. Kept apart from the operational records so
// client components (avatars, the shell) can import it without pulling in every community's data.
import type { PersonKey, StaffPerson } from "./shared";

/** The signed-in staff user. The same person whichever community they're looking at. */
export const user = {
  name: "Nora Castellano",
  first: "Nora",
  initials: "NC",
  role: "Events & Adventures Director",
  email: "ncastellano@alderbend.example",
};

export const abPeople: Record<PersonKey, StaffPerson> = {
  nora: { name: "Nora Castellano", initials: "NC", role: "Events & Adventures Director", color: "#ad4f36" },
  devin: { name: "Devin Marsh", initials: "DM", role: "Fitness Director", color: "#47704c" },
  renata: { name: "Renata Holloway", initials: "RH", role: "Executive Director", color: "#2e4d33" },
  priya: { name: "Priya Nandakumar", initials: "PN", role: "Community Relations Director", color: "#4c87a2" },
  rafael: { name: "Rafael Domingo", initials: "RD", role: "Culinary Director", color: "#968b53" },
  simone: { name: "Simone Archer", initials: "SA", role: "Dining Experience Director", color: "#b0882a" },
  leonard: { name: "Leonard Fisk", initials: "LF", role: "Business Office Director", color: "#425968" },
  maribel: { name: "Maribel Ortiz", initials: "MO", role: "Lantern Memory Care Director", color: "#be4142" },
  colleen: { name: "Colleen Ashby", initials: "CA", role: "Resident Services Director", color: "#6b5aa6" },
  opal: { name: "Opal Merriweather", initials: "OM", role: "Lead Ambassador", color: "#7a6a3a" },
  bea: { name: "Bea Okafor", initials: "BO", role: "Front Desk Concierge", color: "#8a5a7a" },
  // Care partners: each looks after the residents of one floor (Settings → Who looks after whom).
  kenji: { name: "Kenji Watanabe", initials: "KW", role: "Care Partner, First floor", color: "#3f7d7a" },
  lena: { name: "Lena Hart", initials: "LH", role: "Care Partner, Second floor", color: "#7d5a3f" },
};

/** Kestrel Point's published team (src/data/communities/kestrel-point/site.ts `team`). */
export const kpPeople: Record<PersonKey, StaffPerson> = {
  joanna: { name: "Joanna Kessel", initials: "JK", role: "Executive Director", color: "#2e4d33" },
  mateo: { name: "Mateo Ruiz", initials: "MR", role: "Community Relations Director", color: "#4c87a2" },
  tessa: { name: "Tessa Morrow", initials: "TM", role: "Resident Services Director", color: "#6b5aa6" },
  anjali: { name: "Anjali Rao", initials: "AR", role: "Lantern Director", color: "#be4142" },
  grant: { name: "Grant Ellison", initials: "GE", role: "Events and Adventures Director", color: "#ad4f36" },
  callie: { name: "Callie Brooks", initials: "CB", role: "Events and Adventures Assistant", color: "#c46a4a" },
  kara: { name: "Kara Lindqvist", initials: "KL", role: "Fitness Director", color: "#47704c" },
  celeste: { name: "Celeste Okonkwo", initials: "CO", role: "Dining Experience Director", color: "#b0882a" },
  julien: { name: "Julien Marchand", initials: "JM", role: "Culinary Director", color: "#968b53" },
  imani: { name: "Imani Price", initials: "IP", role: "Business Office Director", color: "#425968" },
  ray: { name: "Ray Castillo", initials: "RC", role: "Maintenance Director", color: "#5b6b4a" },
  june: { name: "June Tolliver", initials: "JT", role: "Lead Ambassador", color: "#7a6a3a" },
  luis: { name: "Luis Ferrer", initials: "LF", role: "Front Desk Concierge", color: "#8a5a7a" },
  sofia: { name: "Sofia Mendes", initials: "SM", role: "Care Partner, A wing", color: "#3f7d7a" },
  darnell: { name: "Darnell Price", initials: "DP", role: "Care Partner, B wing", color: "#7d5a3f" },
};

/** Every staff person, across communities (keys are unique). */
export const staffPeople: Record<PersonKey, StaffPerson> = { ...abPeople, ...kpPeople };
