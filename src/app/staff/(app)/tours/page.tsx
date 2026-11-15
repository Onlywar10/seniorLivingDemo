import type { Metadata } from "next";
import Link from "next/link";
import "@/app/staff/prospects.css";
import { Icon } from "@/components/Icon";
import { Help } from "@/components/staff/portal/Help";
import { NotYours } from "@/components/staff/portal/NotYours";
import { ToursBoard, type TourRow } from "@/components/staff/portal/ToursBoard";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { PageHead } from "@/components/staff/ui";
import { communities } from "@/data/communities";
import { sectionAccess } from "@/data/staff/access";
import { siteHref } from "@/data/staff";
import { getStaffCommunity } from "@/data/staff/server";
import { tourCheckIns } from "@/data/staff/shared";
import { addDays, dayName, fmtTime, hash, monthName, nowMinutes, today } from "@/lib/clock";

export const metadata: Metadata = { title: "Tours" };

const dayLabel = (n: number) => { const d = addDays(today(), n); return n === 0 ? "Today" : n === 1 ? "Tomorrow" : `${dayName(d)}, ${monthName(d)} ${d.getUTCDate()}`; };

/** Every tour booked: who, for whom, what they want to see, how to reach them, and attendance. Front desk and the
 *  executive director. Kinlight doesn't do sales in the alpha: no pipeline, no follow-ups, no notes about visitors. */
export default async function ToursPage() {
  const { access } = await sectionAccess("tours");
  if (!access) return <NotYours section="Tours" />;
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Tours" />;
  const { s } = sc;
  const c = communities[s.slug];
  const now = nowMinutes();
  const ins = tourCheckIns(s.tours, now);
  const area = s.brand.phone.slice(0, 5);
  const rows: TourRow[] = s.tours
    .slice()
    .sort((a, b) => a.days - b.days || a.time - b.time)
    .map((t) => {
      const p = t.plan ? c.plans.find((x) => x.code === t.plan) : undefined;
      const ci = ins.get(t.who);
      return {
        id: t.who, who: t.who, forWhom: t.for, day: dayLabel(t.days), dayKey: t.days, time: fmtTime(t.time), living: t.interest,
        plan: p ? { code: p.code, name: p.name, href: siteHref(s.slug, "/floor-plans") } : undefined,
        lunch: !!t.lunch, source: t.source, host: s.people[t.with]?.name.split(" ")[0], phone: `${area} 555-0${String(100 + (hash(t.who) % 899)).padStart(3, "0")}`,
        started: t.days === 0 && t.time <= now, ended: t.days === 0 && t.time + 60 <= now, checkedIn: ci ? `Checked in ${fmtTime(ci.at)}` : undefined,
      };
    });
  return (
    <>
      <PageHead title="Tours" sub="Every tour booked: who’s coming, what they’d like to see, and whether they came.">
        <Help label="How tours work" align="end">
          <p>Visitors book themselves on the website, the tour page or in the chat. Kinlight confirms the tour, reminds them the day before, and thanks them afterwards.</p>
          <p>A tour counts itself when the visitor checks in: they reply HERE to their reminder, or you tap Arrived. Only a tour with no check-in asks you whether they came or it was a no-show. That’s the tour number on the monthly scorecard.</p>
          <p>Only what the visitor told us when booking. No notes about them, and no follow-ups: a question they ask comes to the front desk as a conversation.</p>
        </Help>
        <a className="sx-btn" href={siteHref(s.slug, "/tour")} target="_blank" rel="noopener"><Icon name="globe" /> Tour booking page</a>
        <Link className="sx-btn" href="/staff/prospects"><Icon name="list" /> Apartments</Link>
      </PageHead>
      <ToursBoard rows={rows} />
    </>
  );
}
