import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import { LibraryGrid, PrintList } from "@/components/staff/alpha/Library";
import { CalendarThumb, QrPoster } from "@/components/staff/alpha/PrintPreview";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { Card, Kpi, PageHead } from "@/components/staff/ui";
import { library, printItems } from "@/data/staff/alpha";
import { getStaffCommunity } from "@/data/staff/server";
import { hash } from "@/lib/clock";
import "../../alpha.css";

export const metadata: Metadata = { title: "Library & print" };

export default async function LibraryPage() {
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Library & print" />;
  const { s, c } = sc;
  const items = library.map((i) => {
    if (i.kind !== "Activity idea") return i;
    const h = hash(i.id + s.slug);
    const runs = h % 4;
    return { ...i, here: runs ? `Run ${runs === 1 ? "once" : `${runs} times`} at ${s.brand.name}, ${12 + (h % 14)} residents on average` : `Not tried at ${s.brand.name} yet` };
  });
  const prints = printItems(s.slug);
  const ideas = library.filter((i) => i.kind === "Activity idea").length;

  return (
    <>
      <PageHead title="Library & print" sub="Activity ideas that worked across Wrenhaven, ready-made templates, and everything residents read on paper." />
      <div className="sx-kpis">
        <Kpi label="Activity ideas" value={ideas} note="rated by activity teams, with attendance" />
        <Kpi label="Templates" value={library.length - ideas} note="posts, flyers, calendars and menus" />
        <Kpi label="Ready to print" value={prints.length} note={`${prints.reduce((n, p) => n + p.copies, 0)} copies this month`} />
        <Kpi label="Large print" value="16–24 pt" note="every printed page" />
      </div>

      <Card title="Content library" sub="Ratings and “what worked” come from attendance and the teams who ran them">
        <LibraryGrid items={items} />
      </Card>

      <div className="sx-grid g-21" id="print">
        <Card title="Print" sub="Filled in from this week’s calendar and menus; nothing to retype">
          <PrintList items={prints} printer="the front-desk printer" />
        </Card>
        <Card title="Print preview" sub="QR poster and large-print calendar">
          <div className="pr-previews">
            <figure>
              <QrPoster name={c.site.name} domain={s.brand.domain} />
              <figcaption className="sx-hint"><Icon name="printer" /> QR poster · Tabloid · front desk and elevators</figcaption>
            </figure>
            <figure>
              <CalendarThumb c={c} />
              <figcaption className="sx-hint"><Icon name="calendar" /> Activity calendar · Tabloid · 16 pt</figcaption>
            </figure>
          </div>
        </Card>
      </div>
    </>
  );
}
