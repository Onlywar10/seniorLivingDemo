// The attendance record for Reports: every activity session in the last 90 days with who came, its category and the
// residents it was for. The report builder groups it by activity, resident, category or area for any date range,
// and exports it (the record state surveyors ask for). The counts per activity are the same as the activity sheets;
// the counts per resident are the same as each resident's page. Server only.
import { communities, type CommunitySlug } from "@/data/communities";
import { categoryOf } from "@/data/shared";
import { addDays, iso, nowMinutes, today } from "@/lib/clock";
import { engagement } from "./engage";
import { getStaffData } from "./index";
import { attendeesOf, counts, participationKeep } from "./resident";

export interface Session { d: string; t: string; c: string; a: string; n: number; of: number; who: number[] }
export interface AttendanceData { today: string; residents: string[]; sessions: Session[] }

export function attendanceData(slug: CommunitySlug, days = 90): AttendanceData {
  const s = getStaffData(slug);
  const c = communities[slug];
  const t = today();
  const tIso = iso(t);
  const now = nowMinutes();
  const residents = [...s.residentNames, ...s.lanternNames].filter((n, i, a) => a.indexOf(n) === i).sort((a, b) => a.split(" ").slice(-1)[0].localeCompare(b.split(" ").slice(-1)[0]));
  const idx = new Map(residents.map((n, i) => [n, i]));
  const keep = participationKeep(slug);
  const eng = engagement(slug);
  const sessions: Session[] = [];
  for (const d of c.staffEventsBetween(addDays(t, -(days - 1)), days, tIso)) {
    const back = Math.round((t.getTime() - d.date.getTime()) / 864e5);
    for (const e of d.events) {
      if (e.cat === "movies" || e.cat === "faith") continue;
      if (e.date === tIso && (e.end ?? e.start + 60) > now) continue;
      const lantern = !!e.lantern || e.cat === "lantern";
      const list = attendeesOf(slug, { ...e, lantern });
      const who = list.filter((n) => counts(n, e, keep[n] ?? 0) && !((eng[n]?.lastDays ?? 0) >= 7 && back < (eng[n]?.lastDays ?? 0))).map((n) => idx.get(n)!).filter((x) => x !== undefined);
      const of = e.cap ? e.taken ?? e.cap : list.length + 3;
      sessions.push({ d: e.date, t: e.title, c: categoryOf(e), a: lantern ? "Lantern" : "All residents", n: list.length, of, who });
    }
  }
  return { today: tIso, residents, sessions };
}
