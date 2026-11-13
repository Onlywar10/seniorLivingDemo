// The Website section: the pages people write and look after, each with an owner and an update rhythm; apartments and
// prices; galleries built from event photos; resources (created and edited here, looked after by the executive
// director); the blocks that update themselves; languages; and the pages
// Kinlight set up at launch. Built from one community's public content and staff data, so Alder Bend and Kestrel
// Point get the same screen with their own pages and people. Server Components only (it reads every community's data).
import { careLogin } from "./areas";
import { communities, type CommunitySlug } from "@/data/communities";
import { planKindLabel } from "@/data/shared";
import { addDays, dayShort, fromIso, hash, iso, today } from "@/lib/clock";
import { ago, getStaffData, planRows } from "./index";
import type { Block } from "./blocks";
import { pageBlocks } from "./pageBlocks";
import { fitnessKey, type StaffData, type StaffRole } from "./shared";

export type Rhythm = "Weekly" | "Monthly" | "Every 3 months" | "Every 6 months" | "Every year";
const rhythmDays: Record<Rhythm, number> = { Weekly: 7, Monthly: 30, "Every 3 months": 90, "Every 6 months": 180, "Every year": 365 };

export type PageGroup = "Community pages" | "FAQs" | "Contact" | "Meet our team";

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
  /** The page as blocks, for the block editor. */
  blocks: Block[];
}

const first = (n = "") => n.split(" ")[0];

/** The person who holds each role in this community. */
export function roleHolder(s: StaffData, as: StaffRole) {
  const key = ({ events: s.roles.calendar, sales: s.roles.tours, manager: s.roles.approver, kitchen: s.roles.menus, desk: s.roles.desk, caregiver: careLogin[s.slug], lantern: s.roles.lantern, fitness: fitnessKey(s) })[as];
  return { key, ...s.people[key] };
}

function page(s: StaffData, p: Omit<SitePage, "ownerName" | "ownerTitle" | "updated" | "dueIn" | "stale" | "blocks"> & { days: number }): SitePage {
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
    blocks: pageBlocks(s.slug, p.id, p.text),
  };
}

/** Every page people write, with its owner and rhythm. Resources are in `siteResources`. */
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
    P({ id: "fitness", title: "Fitness", group: "Community pages", path: "/fitness", ownerRole: "fitness", rhythm: "Weekly", days: 6, text: c.fitness.intro, fills: "Class times come from the calendar." }),
    P({ id: "faq", title: "FAQs", group: "FAQs", path: "/faq", ownerRole: "manager", rhythm: "Every 3 months", days: 23 + h, text: `${c.faqs.length} questions families ask most, with short answers. ${c.faqs[0]?.q ?? ""} ${c.faqs[0]?.a ?? ""}`.trim(), fills: "Kinlight suggests new questions from what families ask in replies and chat." }),
    P({ id: "contact", title: "Info & directions", group: "Contact", path: "/contact", ownerRole: "desk", rhythm: "Every 3 months", days: 30 + h, text: c.directions[0]?.text ?? "", fills: "Phone numbers, hours and the address come from Settings → Community details." }),
    P({ id: "team", title: "Meet our team", group: "Meet our team", path: "/team", ownerRole: "manager", rhythm: "Every 3 months", days: 52 + h, text: `${c.team.length} people with a photo and a few lines each, so families know who they’re talking to.`, fills: "Names and job titles come from Settings → Team." }),
  ];
}

/** Things that update themselves, with their owner and rhythm, for the Freshness list. */
export function liveSources(slug: CommunitySlug) {
  const s = getStaffData(slug);
  const R = (as: StaffRole) => roleHolder(s, as);
  return [
    { id: "menus", title: "Menus", rhythm: "Weekly" as Rhythm, ownerRole: "kitchen" as StaffRole, ownerName: R("kitchen").name, state: "Filled from the templates", stale: false, href: "/staff/menus" },
    { id: "calendar", title: "Activity calendar", rhythm: "Monthly" as Rhythm, ownerRole: "events" as StaffRole, ownerName: R("events").name, state: "Next month due in 2 weeks", stale: false, href: "/staff/calendar" },
    { id: "news", title: "Photos and news", rhythm: "Weekly" as Rhythm, ownerRole: "events" as StaffRole, ownerName: R("events").name, state: "Last photos yesterday", stale: false, href: "/staff/post?type=photo" },
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

/**
 * The price change waiting for the administrator: the same request as the "Pricing change" card on Today (its id is
 * that card's id, so approving it in either place clears both). From and to come from the request itself.
 */
export function pendingPrice(slug: CommunitySlug) {
  const s = getStaffData(slug);
  const a = s.approvals.find((x) => x.kind === "Pricing change" && x.diff);
  const code = a && /\(([^)]+)\)/.exec(a.title)?.[1];
  const p = code ? plansForWebsite(slug).find((x) => x.code === code) : undefined;
  if (!a?.diff || !p) return null;
  const num = (x: string) => Number(x.replace(/\D/g, ""));
  const by = s.people[a.by];
  return { id: `post-${a.id}`, code: p.code, name: p.name, from: num(a.diff[0]), to: num(a.diff[1]), by: by?.name ?? a.by, byYou: a.by === s.roles.tours, ago: ago(a.mins), why: a.detail };
}

export interface Gallery { id: string; title: string; cover: string; photos: number; heldBack: number; when: string; featured: boolean }

/** Event photos Kinlight makes albums from, by the event's name. Anything else has no album. */
const albumCovers: { re: RegExp; preset?: string; src?: string }[] = [
  { re: /pumpkin carving/i, preset: "pumpkins" },
  { re: /s.mores|marshmallow/i, preset: "marshmallows" },
  { re: /veteran/i, preset: "flag" },
  { re: /bocce/i, src: "/img/bocce.jpg" },
  { re: /cooking lesson/i, src: "/img/chef-kitchen.jpg" },
];

/**
 * Albums built automatically from the photos of events that have already happened (the last four weeks of the
 * calendar), newest first, with each event's real date. Only photos with consent on file are used.
 */
export function galleries(slug: CommunitySlug): Gallery[] {
  const s = getStaffData(slug);
  const c = communities[slug];
  const t = today();
  const seen = new Set<string>();
  const out: Gallery[] = [];
  const past = c.staffEventsBetween(addDays(t, -28), 28, iso(t)).flatMap((d) => d.events).filter((e) => e.date < iso(t) && !e.lantern).reverse();
  for (const e of past) {
    const m = albumCovers.find((x) => x.re.test(e.title));
    const preset = m?.preset ? s.photoPresets.find((p) => p.k === m.preset) : undefined;
    const cover = preset?.src ?? m?.src;
    if (!m || !cover || seen.has(m.re.source)) continue;
    seen.add(m.re.source);
    out.push({
      id: `g-${e.id}`, title: e.title, cover, photos: 8 + (hash(e.id) % 14), heldBack: preset ? preset.people.filter((x) => !x.consent).length : 0,
      when: dayShort(fromIso(e.date)), featured: out.length === 0,
    });
  }
  return out;
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

/* ------------------------------------------------------------ resources */

export type ResourceKind = "visiting" | "transport" | "policy" | "welcome" | "other";
export const resourceKinds: { k: ResourceKind; label: string; title: string; months: number; owner: StaffRole; path: string }[] = [
  { k: "visiting", label: "Visiting hours", title: "Visiting hours", months: 3, owner: "desk", path: "visiting-hours" },
  { k: "transport", label: "Transport schedule", title: "Transport schedule", months: 1, owner: "events", path: "transport" },
  { k: "policy", label: "A policy", title: "Guest meal policy", months: 12, owner: "manager", path: "guest-meals" },
  { k: "welcome", label: "Welcome pack", title: "Welcome pack for new residents", months: 6, owner: "manager", path: "welcome" },
  { k: "other", label: "Something else", title: "", months: 6, owner: "manager", path: "" },
];

export interface SiteResource {
  id: string;
  title: string;
  kind: ResourceKind;
  /** What it says, typed in. A file can stand in for it. */
  text: string;
  file?: string;
  ownerRole: StaffRole;
  ownerName: string;
  updated: string;
  /** The review date, as an ISO day. */
  review: string;
  /** "/r/visiting-hours": the short link Kinlight uses in messages. */
  slug: string;
  /** Where it shows on the public site. */
  path: string;
}

export interface ResourceSetup {
  items: SiteResource[];
  owners: { role: StaffRole; name: string; title: string }[];
  domain: string;
  todayIso: string;
}

/** Pages or files that rarely change: visiting hours, the transport schedule, policies, the welcome pack. */
export function siteResources(slug: CommunitySlug): ResourceSetup {
  const s = getStaffData(slug);
  const c = communities[slug];
  const t = today();
  const h = hash(slug) % 5;
  const name = c.site.name;
  const R = (as: StaffRole) => roleHolder(s, as);
  const mk = (id: string, kind: ResourceKind, title: string, text: string, days: number, dueIn: number, path: string, file?: string): SiteResource => {
    const k = resourceKinds.find((x) => x.k === kind)!;
    return {
      id, title, kind, text, file, ownerRole: k.owner, ownerName: R(k.owner).name,
      updated: days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`,
      review: iso(addDays(t, dueIn)), slug: k.path || id, path,
    };
  };
  const items = [
    mk("visiting", "visiting", "Visiting hours", c.visiting.map((v) => `${v.label}: ${v.value}`).join(". ") + ".", 88, 2, "/contact"),
    mk("transport", "transport", "Transport schedule", "The community bus runs to shops and appointments on weekdays. Trips out are on the calendar, with the time to meet in the lobby. Ask the front desk to book a seat.", 18 + h, 12 - h, "/events-adventures"),
    mk("policy", "policy", "Policies: guests, pets and smoking", `Guests are welcome any time and can stay for short visits. Pets are welcome with a short agreement. ${name} is smoke-free inside and on the grounds.`, 140 + h, 225 - h, "/faq"),
    mk("welcome", "welcome", "Welcome pack", `A short guide for new residents and families: who to call, mealtimes, how messages from ${name} work, and how to share photos with family.`, 64 + h, 116 - h, "/guides", "Welcome pack.pdf"),
  ].map((r) => (r.kind === "policy" ? { ...r, slug: "policies" } : r));
  const roles: StaffRole[] = ["manager", "desk", "events", "kitchen"];
  return {
    items,
    owners: roles.map((r) => ({ role: r, name: R(r).name, title: R(r).role })).filter((o, i, a) => a.findIndex((x) => x.name === o.name) === i),
    domain: s.brand.domain,
    todayIso: iso(t),
  };
}

export const firstName = first;
