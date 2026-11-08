// The Website section: the pages people write and look after, each with an owner and an update rhythm; apartments and
// prices; galleries built from event photos; resources; the blocks that update themselves; languages; and the pages
// Kinlight set up at launch. Built from one community's public content and staff data, so Alder Bend and Kestrel
// Point get the same screen with their own pages and people. Server Components only (it reads every community's data).
import { communities, type CommunitySlug } from "@/data/communities";
import { planKindLabel } from "@/data/shared";
import { addDays, dayShort, hash, today } from "@/lib/clock";
import { getStaffData, planRows } from "./index";
import type { StaffData, StaffRole } from "./shared";

export type Rhythm = "Weekly" | "Monthly" | "Every 3 months" | "Every 6 months" | "Every year";
const rhythmDays: Record<Rhythm, number> = { Weekly: 7, Monthly: 30, "Every 3 months": 90, "Every 6 months": 180, "Every year": 365 };

export type PageGroup = "Community pages" | "FAQs" | "Contact" | "Meet our team" | "Resources";

export interface SitePage {
  id: string;
  title: string;
  group: PageGroup;
  /** Where it lives on the public site, e.g. "/dining". */
  path: string;
  /** The role that owns it (who can edit it and gets its "going stale" alert). */
  ownerRole: StaffRole;
  ownerName: string;
  ownerTitle: string;
  rhythm: Rhythm;
  updated: string;
  /** Days until it's due for a look; going stale at 2 or fewer. */
  dueIn: number;
  stale: boolean;
  /** The words people write. Everything else on the page fills itself. */
  text: string;
  /** What fills itself on this page, so nobody has to. */
  fills?: string;
}

const first = (n = "") => n.split(" ")[0];

/** The person who holds each role in this community. */
export function roleHolder(s: StaffData, as: StaffRole) {
  const key = ({ events: s.roles.calendar, sales: s.roles.tours, manager: s.roles.approver, kitchen: s.roles.menus, desk: s.roles.desk })[as];
  return { key, ...s.people[key] };
}

function page(s: StaffData, p: Omit<SitePage, "ownerName" | "ownerTitle" | "updated" | "dueIn" | "stale"> & { days: number }): SitePage {
  const o = roleHolder(s, p.ownerRole);
  const dueIn = rhythmDays[p.rhythm] - p.days;
  const { days, ...rest } = p;
  return {
    ...rest,
    ownerName: o.name,
    ownerTitle: o.role,
    updated: days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`,
    dueIn,
    stale: dueIn <= 2,
  };
}

/** Every page and resource people write, with its owner and rhythm. */
export function sitePages(slug: CommunitySlug): SitePage[] {
  const s = getStaffData(slug);
  const c = communities[slug];
  const name = c.site.name;
  const venues = c.venueOrder.map((k) => c.venues[k]).filter(Boolean);
  const h = hash(slug) % 5;
  const P = (x: Parameters<typeof page>[1]) => page(s, x);
  return [
    P({ id: "independent", title: c.living.independent.name, group: "Community pages", path: c.living.independent.href, ownerRole: "manager", rhythm: "Every 6 months", days: 41 + h, text: c.living.independent.lede, fills: "Floor plans and starting prices come from Apartments and prices." }),
    P({ id: "assisted", title: c.living.assisted.name, group: "Community pages", path: c.living.assisted.href, ownerRole: "manager", rhythm: "Every 6 months", days: 63 + h, text: c.living.assisted.lede, fills: "Care levels and starting prices come from Apartments and prices." }),
    P({ id: "lantern", title: c.living.lantern.name, group: "Community pages", path: c.living.lantern.href, ownerRole: "manager", rhythm: "Every 6 months", days: 88 + h, text: c.living.lantern.lede, fills: "Lantern events show by name, day and time only." }),
    P({ id: "dining", title: "Dining", group: "Community pages", path: "/dining", ownerRole: "kitchen", rhythm: "Monthly", days: 12 + h, text: `${venues.length} places to eat, one kitchen team: ${venues.map((v) => `${v.name} (${v.blurb.replace(/\.$/, "").toLowerCase()})`).join("; ")}.`, fills: "Today’s menu for each restaurant and the hours come from Menus." }),
    P({ id: "lifestyle", title: "Life here", group: "Community pages", path: "/lifestyle", ownerRole: "events", rhythm: "Monthly", days: 9 + h, text: `Something on every day at ${name}: clubs, classes, trips, music and faith, planned with residents and open to their families.`, fills: "The calendar and recent news update themselves." }),
    P({ id: "events-adventures", title: "Events & Adventures", group: "Community pages", path: "/events-adventures", ownerRole: "events", rhythm: "Monthly", days: 16 + h, text: `Trips out every week and something special every month, from lake days to theatre matinees. Families are welcome on many of them.`, fills: "Upcoming trips come from the calendar; photos from the galleries." }),
    P({ id: "fitness", title: "Fitness", group: "Community pages", path: "/fitness", ownerRole: "events", rhythm: "Weekly", days: 6, text: c.fitness.intro, fills: "Class times come from the calendar." }),
    P({ id: "faq", title: "FAQs", group: "FAQs", path: "/faq", ownerRole: "manager", rhythm: "Every 3 months", days: 23 + h, text: `${c.faqs.length} questions families ask most, with short answers. ${c.faqs[0]?.q ?? ""} ${c.faqs[0]?.a ?? ""}`.trim(), fills: "Kinlight suggests new questions from what families ask in replies and chat." }),
    P({ id: "contact", title: "Info & directions", group: "Contact", path: "/contact", ownerRole: "desk", rhythm: "Every 3 months", days: 30 + h, text: c.directions[0]?.text ?? "", fills: "Phone numbers, hours and the address come from Settings → Community details." }),
    P({ id: "team", title: "Meet our team", group: "Meet our team", path: "/team", ownerRole: "manager", rhythm: "Every 3 months", days: 52 + h, text: `${c.team.length} people with a photo and a few lines each, so families know who they’re talking to.`, fills: "Names and job titles come from Settings → Team." }),
    // Resources: pages or files that rarely change.
    P({ id: "visiting", title: "Visiting hours", group: "Resources", path: "/contact", ownerRole: "desk", rhythm: "Every 3 months", days: 20 + h, text: c.visiting.map((v) => `${v.label}: ${v.value}`).join(". ") + "." }),
    P({ id: "transport", title: "Transport schedule", group: "Resources", path: "/events-adventures", ownerRole: "events", rhythm: "Monthly", days: 18 + h, text: `The community bus runs to shops and appointments on weekdays. Trips out are on the calendar, with the time to meet in the lobby. Ask the front desk to book a seat.` }),
    P({ id: "policies", title: "Policies: guests, pets and smoking", group: "Resources", path: "/faq", ownerRole: "manager", rhythm: "Every year", days: 140 + h, text: `Guests are welcome any time and can stay for short visits. Pets are welcome with a short agreement. ${name} is smoke-free inside and on the grounds.` }),
    P({ id: "welcome", title: "Welcome pack", group: "Resources", path: "/guides", ownerRole: "manager", rhythm: "Every 6 months", days: 64 + h, text: `A short guide for new residents and families: who to call, mealtimes, how messages from ${name} work, and how to share photos with family.` }),
  ];
}

/** Things that update themselves, with their owner and rhythm, for the Freshness list. */
export function liveSources(slug: CommunitySlug) {
  const s = getStaffData(slug);
  const R = (as: StaffRole) => roleHolder(s, as);
  return [
    { id: "menus", title: "Menus", rhythm: "Weekly" as Rhythm, ownerRole: "kitchen" as StaffRole, ownerName: R("kitchen").name, state: "This week’s menus are in. They publish day by day.", stale: false, href: "/staff/menus" },
    { id: "calendar", title: "Activity calendar", rhythm: "Monthly" as Rhythm, ownerRole: "events" as StaffRole, ownerName: R("events").name, state: "Current to the end of the month. Next month’s import is due in 2 weeks.", stale: false, href: "/staff/calendar" },
    { id: "news", title: "Photos and news", rhythm: "Weekly" as Rhythm, ownerRole: "events" as StaffRole, ownerName: R("events").name, state: "Last photos posted yesterday.", stale: false, href: "/staff/post?type=photo" },
  ];
}

export interface PlanInfo {
  code: string; name: string; kind: string; care: string; beds: number; baths: number | null; sqft?: number;
  from: number; available: number; waiting: number; features: string[]; photos: number; render: boolean;
}

/** Floor plans with what's included, care level, starting price, availability and photos. */
export function plansForWebsite(slug: CommunitySlug): PlanInfo[] {
  const s = getStaffData(slug);
  return planRows(slug).map((p) => ({
    code: p.code, name: p.name, kind: p.kind, care: planKindLabel[p.kind], beds: p.beds, baths: p.baths, sqft: p.sqft,
    from: p.from ?? 0, available: p.available, waiting: s.waitlist.filter((w) => w.plan === p.code).length,
    features: p.features, photos: 3 + (hash(p.code) % 6), render: Boolean(p.render),
  }));
}

/** A price change sales asked for, waiting for the administrator. */
export function pendingPrice(slug: CommunitySlug) {
  const s = getStaffData(slug);
  const p = plansForWebsite(slug).find((x) => x.from > 0 && x.available > 0 && x.kind === "independent");
  if (!p) return null;
  return { code: p.code, name: p.name, from: p.from, to: Math.round((p.from * 1.025) / 5) * 5, by: roleHolder(s, "sales").name, ago: "Yesterday" };
}

export interface Gallery { id: string; title: string; cover: string; photos: number; heldBack: number; when: string; featured: boolean }

/** Albums built automatically from event photos. Only photos with consent on file are used. */
export function galleries(slug: CommunitySlug): Gallery[] {
  const s = getStaffData(slug);
  const c = communities[slug];
  const t = today();
  const fromPosts = s.photoPresets.map((p, i) => ({
    id: `g-${p.k}`, title: p.label, cover: p.src, photos: 8 + (hash(p.k) % 14), heldBack: p.people.filter((x) => !x.consent).length,
    when: dayShort(addDays(t, -(1 + i * 4))), featured: i === 0,
  }));
  const fromStories = c.stories.filter((x) => x.photo).slice(0, 3).map((x, i) => ({
    id: `g-${x.slug}`, title: x.title, cover: x.photo, photos: 6 + (hash(x.slug) % 10), heldBack: 0,
    when: dayShort(addDays(t, -(14 + i * 9))), featured: false,
  }));
  return [...fromPosts, ...fromStories];
}

/** Languages the site and event pages are in, besides English, by how many families read them. */
export function siteLanguages(slug: CommunitySlug) {
  const s = getStaffData(slug);
  return s.languages.filter((l) => l.k !== "English").map((l) => {
    const t = s.translations.find((x) => x.lang === l.k);
    return { lang: l.k, families: l.n, sample: t ? t.tpl.reminder?.replace("{event}", s.composerEvent.split(",")[0]) : undefined };
  });
}

/** The pages Kinlight set up at launch. */
export function requiredPages(slug: CommunitySlug) {
  const c = communities[slug];
  return [
    { title: "State licence number", detail: c.site.licence, path: "/" , where: "In the footer of every page" },
    { title: "Privacy policy", detail: "What the site collects and how families’ details are kept private", path: "/privacy", where: "Linked from every page" },
    { title: "Accessibility statement", detail: "How the site meets accessibility standards, and who to call for help", path: "/accessibility", where: "Linked from every page" },
  ];
}

export const firstName = first;
