// Each website page as blocks, built from the community's real public content: the words people write become text,
// image and list blocks; what fills itself (floor plans, menus, the calendar, the team, contact details) becomes a
// live block with a short preview of what it shows today. Server only (reads every community's data).
import { communities, type CommunitySlug } from "@/data/communities";
import { money, planKindLabel } from "@/data/shared";
import { dayShort, fmtTime, iso, today } from "@/lib/clock";
import type { Block, LiveRow, LiveSource, MediaItem } from "./blocks";

let n = 0;
const id = (p: string) => `${p}-${(n++).toString(36)}`;

const P = (html: string, x: Partial<Extract<Block, { type: "paragraph" }>> = {}): Block => ({ id: id("p"), type: "paragraph", html, ...x });
const H = (html: string, level: 2 | 3 | 4 = 2): Block => ({ id: id("h"), type: "heading", html, level });
const L = (items: string[]): Block => ({ id: id("l"), type: "list", items });
const IMG = (src: string, alt: string, caption = "", align: "none" | "wide" | "full" = "wide"): Block => ({ id: id("i"), type: "image", src, alt, caption, align });
const BTN = (...b: [string, string][]): Block => ({ id: id("b"), type: "buttons", buttons: b.map(([text, href], i) => ({ text, href, style: i === 0 ? "fill" : "outline" })) });

export function pageBlocks(slug: CommunitySlug, pageId: string, text: string): Block[] {
  n = 0;
  const c = communities[slug];
  const t = today();
  const days = c.eventsBetween(t, 10, iso(t));
  const evts = days.flatMap((d) => d.events.map((e) => ({ ...e, d: d.date })));
  const ev = (filter: (e: (typeof evts)[number]) => boolean, k = 4): LiveRow[] =>
    evts.filter(filter).slice(0, k).map((e) => ({ t: e.title, s: `${dayShort(e.d)} · ${fmtTime(e.start)}` }));
  const live = (source: LiveSource, title: string, from: string, href: string, updates: string, rows: LiveRow[]): Block =>
    ({ id: id("live"), type: "live", source, title, from, href, updates, rows });

  const plans = (kind: string) =>
    c.plans.filter((p) => p.kind === kind).slice(0, 4).map((p) => ({ t: p.name, s: `${p.beds ? `${p.beds} bed` : "Studio"}${p.from ? ` · from ${money(p.from)}/mo` : ""}` }));
  const tour: [string, string] = ["Book a tour", "/tour"];

  const living = (k: "independent" | "assisted" | "lantern") => {
    const l = c.living[k];
    return [
      IMG(l.photo, l.alt, "", "wide"),
      P(text, { size: "large" }),
      H("What’s included"),
      L(l.points),
      k === "lantern"
        ? live("lantern", "Lantern events", "Calendar", "/staff/calendar", "Shows name, day and time only", ev((e) => e.cat === "lantern", 3).length ? ev((e) => e.cat === "lantern", 3) : [{ t: "Music and memory", s: "Daily · 10:30 am" }])
        : live(k === "independent" ? "plans" : "care", k === "independent" ? "Floor plans and prices" : "Care levels and prices", "Apartments and prices", "/staff/website#apartments", "When a price or availability changes",
          plans(k).length ? plans(k) : [{ t: planKindLabel[k], s: l.from }]),
      BTN(tour, ["Call us", "/contact"]),
    ];
  };

  const venues = c.venueOrder.map((k) => c.venues[k]).filter(Boolean);
  const menus = c.allMenus(t);

  switch (pageId) {
    case "independent":
    case "assisted":
    case "lantern":
      return living(pageId);
    case "dining":
      return [
        IMG(venues[0]?.photo ?? "/img/juniper.jpg", `${venues[0]?.name ?? "The restaurant"} set for dinner`, "", "wide"),
        P(`${venues.length} places to eat, one kitchen team. Every meal is cooked here, and residents help choose what’s on the menu.`, { size: "large" }),
        { id: id("cols"), type: "columns", cols: venues.map((v) => ({ heading: v.name, html: `${v.blurb} <em>${v.hours}</em>` })) },
        live("menu", "Today’s menu", "Menus", "/staff/menus", "Every morning, for every restaurant",
          venues.map((v) => ({ t: v.name, s: menus.find((m) => m.venue === v.key)?.special.name ?? "Chef’s special" }))),
        BTN(["Join us for lunch", "/tour"]),
      ];
    case "lifestyle": {
      const q = c.testimonials[0];
      return [
        IMG("/img/lifestyle.jpg", "Residents laughing together in the courtyard", "", "wide"),
        P(text, { size: "large" }),
        H("This week"),
        live("calendar", "The calendar", "Calendar", "/staff/calendar", "Shows the next few days, never seats or pickup points", ev(() => true, 4)),
        ...(q ? [{ id: id("q"), type: "quote", html: q.quote, cite: `${q.name}, ${q.relation}` } as Block] : []),
        live("news", "Recent news", "Post and Calendar photos", "/staff/calendar", "When photos or an announcement go out",
          c.publishedStories(iso(t)).slice(0, 3).map((s) => ({ t: s.title, s: s.kind, img: s.photo }))),
      ];
    }
    case "events-adventures":
      return [
        IMG("/img/amazon-trip.jpg", "Residents on a day trip", "", "full"),
        P(text, { size: "large" }),
        H("Coming up"),
        live("trips", "Upcoming trips", "Calendar", "/staff/calendar", "When the calendar changes", ev((e) => e.cat === "trips", 4).length ? ev((e) => e.cat === "trips", 4) : ev(() => true, 3)),
        H("Recent adventures"),
        live("gallery", "Photo albums", "Event photos", "/staff/calendar?photos=1", "After each event with photos",
          c.stories.filter((s) => s.photo).slice(0, 3).map((s) => ({ t: s.title, img: s.photo }))),
        BTN(["See the whole calendar", "/calendar"]),
      ];
    case "fitness":
      return [
        IMG("/img/fitness-center.jpg", "The fitness center", "", "wide"),
        P(text, { size: "large" }),
        L(c.fitness.highlights),
        H("Classes this week"),
        live("classes", "Class times", "Calendar", "/staff/calendar", "When the calendar changes", ev((e) => e.cat === "fitness", 4)),
      ];
    case "faq":
      return [
        P(`The questions families ask us most. Can’t find yours? Call us any time.`, { size: "large" }),
        ...c.faqs.slice(0, 5).flatMap((f) => [H(f.q, 3), P(f.a)]),
        { id: id("sep"), type: "separator" },
        BTN(["Ask us a question", "/contact"]),
      ];
    case "contact":
      return [
        P(`Come and see us. We’re easy to find, and there’s always someone at the front desk.`, { size: "large" }),
        live("contact", "Phone numbers, hours and address", "Settings → Community details", "/staff/settings", "When Settings change",
          [...c.phones.slice(0, 3).map((p) => ({ t: p.label, s: p.number })), ...c.visiting.slice(0, 1).map((v) => ({ t: v.label, s: v.value }))]),
        ...c.directions.slice(0, 3).flatMap((d) => [H(d.title, 3), P(d.text)]),
      ];
    case "team":
      return [
        P(text, { size: "large" }),
        live("team", "The team", "Settings → Team", "/staff/settings", "When someone joins or changes role",
          c.team.filter((m) => !m.unnamed).slice(0, 6).map((m) => ({ t: m.name, s: m.role, img: m.photo }))),
        P(`Not sure who to ask? The front desk will put you through.`),
      ];
    default:
      return [P(text)];
  }
}

/** Pictures for the image block and the media library. */
export function mediaLibrary(slug: CommunitySlug): MediaItem[] {
  const c = communities[slug];
  const seen = new Set<string>();
  const out: MediaItem[] = [];
  const add = (src?: string, alt?: string) => { if (src && !seen.has(src)) { seen.add(src); out.push({ src, alt: alt ?? "" }); } };
  Object.values(c.living).forEach((l) => add(l.photo, l.alt));
  c.venueOrder.forEach((k) => add(c.venues[k]?.photo, c.venues[k]?.name));
  c.spaces.forEach((s) => add(s.photo, s.alt));
  c.stories.forEach((s) => add(s.photo, s.alt));
  [["/img/lifestyle.jpg", "Residents laughing together"], ["/img/fitness-center.jpg", "The fitness center"], ["/img/amazon-trip.jpg", "Residents on a day trip"], ["/img/courtyard-bbq.jpg", "A barbecue in the courtyard"], ["/img/gardening.jpg", "Residents gardening"]].forEach(([s, a]) => add(s, a));
  return out.slice(0, 30);
}
