// Where a resident's page lives. Every resident name in the staff area links here, so a resident opens the same way
// from Today, the activity sheet, attendance, Feedback, search and People.
export const residentHref = (name: string, tab?: string) => `/staff/people/${encodeURIComponent(name)}${tab ? `?tab=${tab}` : ""}`;

/** Where a family member lives: their resident's page, Family tab, scrolled to them. */
export const memberId = (name: string) => `fam-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
export const familyHref = (resident: string, member: string) => `${residentHref(resident, "family")}&member=${encodeURIComponent(member)}#${memberId(member)}`;
