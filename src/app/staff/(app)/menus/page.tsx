import type { Metadata } from "next";
import { MenuEditor } from "@/components/staff/MenuEditor";
import { PageHead } from "@/components/staff/ui";
import { menuFor, venueOrder, venues } from "@/data/menus";
import { atToday } from "@/data/staff";
import { addDays, fromIso, iso, today } from "@/lib/clock";

export const metadata: Metadata = { title: "Menus" };

export default function MenusPage() {
  const t = today();
  const dates = Array.from({ length: 7 }, (_, i) => addDays(t, i));
  const tg = fromIso("2026-11-26");
  if (tg > dates[dates.length - 1]) dates.push(tg);
  const menus = venueOrder.map((v) => ({ venue: venues[v], days: dates.map((d) => menuFor(v, d)) }));
  return (
    <>
      <PageHead title="Menus" sub="Daily specials and soups for all three restaurants. Publishing updates the website dining page and the digital signage in the Lobby, Natoma Café and The Rendezvous." />
      <MenuEditor menus={menus} todayIso={iso(t)} lastPublished={atToday(370)} />
    </>
  );
}
