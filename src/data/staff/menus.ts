// The kitchen's week: next week's menus as Kinlight read them from what the chef uploaded, the two things it wasn't
// sure about, today's menus as they are live on the website, holiday menus waiting for the approver, and each
// restaurant's hours. Built from the community's own menus, so Alder Bend and Kestrel Point get their own restaurants.
// Server Components only.
import { communities, type CommunitySlug } from "@/data/communities";
import type { DayMenu, Venue } from "@/data/shared";
import { addDays, dayName, dayShort, dow, fmtTime, iso, shortDate, today } from "@/lib/clock";
import { getStaffData } from "./index";
import { atToday } from "./shared";

export interface MenuUpload { file: string; kind: "PDF" | "Document" | "Photo"; detail: string; at: string }
export interface MenuFlag {
  id: string;
  venue: string;
  date: string;
  /** Which dish on that day. */
  field: "special" | "soup";
  kind: "tag" | "unread";
  question: string;
  detail: string;
  dish: string;
  /** What the same line said a week earlier (the menus rotate weekly), offered as a one-tap answer. */
  lastWeek?: string;
}
export interface HolidayMenu { id: string; venue: string; venueName: string; date: string; label: string; name: string; desc?: string; items: string[]; by: string; sent: string }

export interface MenuWeek {
  community: string;
  domain: string;
  chef: string;
  chefFirst: string;
  approver: string;
  approverFirst: string;
  /** Next week: the days Kinlight read. */
  dates: string[];
  range: string;
  venues: { venue: Venue; bar: boolean; upload: MenuUpload; days: DayMenu[] }[];
  /** What's live on the website right now. */
  live: { date: string; label: string; published: string; menus: { venue: Venue; bar: boolean; menu: DayMenu }[] };
  flags: MenuFlag[];
  counts: { days: number; periods: number; specials: number; soups: number; tags: number; dishes: number };
  holidays: HolidayMenu[];
  sendsBy: string;
}

const first = (n: string) => n.split(" ")[0];

export function menuWeek(slug: CommunitySlug): MenuWeek {
  const c = communities[slug];
  const s = getStaffData(slug);
  const t = today();
  // Next week, Sunday to Saturday.
  const start = addDays(t, 7 - dow(t));
  const dates = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const chef = s.people[s.roles.menus].name;
  const approver = s.people[s.roles.approver].name;
  const isBar = (v: Venue) => /coffee/i.test(v.kind);
  const uploadedOn = dayShort(addDays(t, -1)).split(",")[0];

  const venues = c.venueOrder.map((k, i) => {
    const venue = c.venues[k];
    const days = dates.map((d) => c.menuFor(k, d));
    const name = venue.name.replace(/^The /, "");
    const upload: MenuUpload =
      i === 0
        ? { file: `${name} week of ${shortDate(start)}.pdf`, kind: "PDF", detail: "2 pages", at: `${uploadedOn}, 3:42 pm` }
        : i === 1
          ? { file: `${name} menu ${shortDate(start)}–${shortDate(dates[6])}.docx`, kind: "Document", detail: "1 page", at: `${uploadedOn}, 3:44 pm` }
          : { file: `Photo of the ${name} menu board`, kind: "Photo", detail: "Taken on a phone", at: `${uploadedOn}, 3:51 pm` };
    return { venue, bar: isBar(venue), upload, days };
  });

  // The two things Kinlight wasn't sure about: a smudged dietary tag on the PDF and a blurred line on the photo.
  const flags: MenuFlag[] = [];
  const fine = venues[0];
  const tagDay = fine.days.find((d) => (d.special.tags ?? []).some((x) => x === "GF" || x === "DF")) ?? fine.days[1];
  flags.push({
    id: "f-tag", venue: fine.venue.key, date: tagDay.date, field: "special", kind: "tag",
    question: "Is this “GF” or “DF”?", dish: tagDay.special.name,
    detail: `${dayName(dates[dates.findIndex((d) => iso(d) === tagDay.date)])}’s special. The tag beside it is smudged on the PDF.`,
  });
  const photoV = venues[venues.length - 1];
  const thu = photoV.days[4];
  flags.push({
    id: "f-soup", venue: photoV.venue.key, date: thu.date, field: "soup", kind: "unread",
    question: "Couldn’t read Thursday’s soup", dish: "",
    detail: "The photo is blurred across that line.",
    lastWeek: c.menuFor(photoV.venue.key, addDays(dates[4], -7)).soup.name,
  });

  const allDays = venues.flatMap((v) => v.days);
  const dishes = allDays.reduce((n, d) => n + 2 + d.sections.reduce((m, x) => m + x.items.length, 0), 0);
  const tags = allDays.reduce((n, d) => n + (d.special.tags?.length ?? 0) + (d.soup.tags?.length ?? 0) + d.sections.reduce((m, x) => m + x.items.reduce((k, it) => k + (it.tags?.length ?? 0), 0), 0), 0);
  const periods = venues.reduce((n, v) => n + v.days[0].sections.length, 0);

  // Holiday and special menus in the next five weeks, sent to the approver first.
  const holidays: HolidayMenu[] = [];
  for (let i = 0; i < 35; i++) {
    const d = addDays(t, i);
    for (const k of c.venueOrder) {
      const m = c.menuFor(k, d);
      if (!m.holiday) continue;
      holidays.push({
        id: `hol-${k}-${m.date}`, venue: k, venueName: c.venues[k].name, date: m.date, label: dayShort(d), name: m.special.name, desc: m.special.desc,
        items: m.sections.flatMap((x) => x.items.map((it) => it.name)).slice(0, 6), by: chef, sent: `${uploadedOn}, 3:55 pm`,
      });
    }
  }

  const fresh = s.freshness.find((f) => f.at !== undefined)?.at ?? 370;
  return {
    community: s.brand.name, domain: s.brand.domain, chef, chefFirst: first(chef), approver, approverFirst: first(approver),
    dates: dates.map(iso), range: `${shortDate(start)}–${shortDate(dates[6])}`, venues,
    live: { date: iso(t), label: dayShort(t), published: `${atToday(fresh)} by ${chef}`, menus: c.venueOrder.map((k) => ({ venue: c.venues[k], bar: isBar(c.venues[k]), menu: c.menuFor(k, t) })) },
    flags,
    counts: { days: 7, periods, specials: allDays.length, soups: allDays.length, tags, dishes },
    holidays,
    sendsBy: `${dayShort(start).split(",")[0]} at ${fmtTime(5 * 60)}`,
  };
}
