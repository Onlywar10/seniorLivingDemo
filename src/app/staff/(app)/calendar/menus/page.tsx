import type { Metadata } from "next";
import { MenuEditor } from "@/components/staff/MenuEditor";
import { CalendarTabs } from "@/components/staff/portal/CalendarTabs";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { PageHead } from "@/components/staff/ui";
import { atToday, nextDigest } from "@/data/staff";
import { getStaffCommunity } from "@/data/staff/server";
import { addDays, fromIso, iso, today } from "@/lib/clock";

export const metadata: Metadata = { title: "Menus" };

export default async function MenusPage() {
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Menus" />;
  const { s, c } = sc;
  const { menuFor, venueOrder, venues } = c;
  // The coffeehouse and wine bar: its special is a pour and a bite.
  const barKey = venueOrder.find((v) => /coffee/i.test(venues[v].kind));
  const t = today();
  const dates = Array.from({ length: 7 }, (_, i) => addDays(t, i));
  const tg = fromIso("2026-11-26");
  if (tg > dates[dates.length - 1]) dates.push(tg);
  const menus = venueOrder.map((v) => ({ venue: venues[v], days: dates.map((d) => menuFor(v, d)) }));
  return (
    <>
      <PageHead title="Calendar" sub="The menus for every restaurant. Upload the PDF or photograph the paper menu, check it, and publish." />
      <CalendarTabs />
      <MenuEditor
        menus={menus}
        todayIso={iso(t)}
        lastPublished={atToday(s.freshness.find((f) => f.at !== undefined)?.at ?? 370)}
        barKey={barKey}
        publisher={s.people[s.roles.menus].name}
        domain={s.brand.domain}
        community={s.brand.name}
        digest={nextDigest()}
      />
    </>
  );
}
