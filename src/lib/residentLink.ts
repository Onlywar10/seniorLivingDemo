// A resident's personal link to their week page (an action page): /w/<community>/<token>. The token is made from the
// resident's name, so the same person always gets the same link, and it shows nothing that identifies them beyond a
// first name. Safe on the server and in the browser.
import { hash } from "./clock";

export const weekToken = (name: string) =>
  `${(name.split(" ")[0] ?? "").toLowerCase().replace(/[^a-z]/g, "")}-${(hash(`week:${name}`) % 46656).toString(36).padStart(3, "0")}`;

/** "/w/alder-bend/dorothy-k3f" */
export const weekHref = (slug: string, name: string) => `/w/${slug}/${weekToken(name)}`;
