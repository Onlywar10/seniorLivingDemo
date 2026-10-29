import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { site } from "@/data/site";
import { eventsOn } from "@/data/calendar";
import { addDays, dow, fmtTime, hash, iso, longDate, MONTHS, today, WEEKDAYS } from "@/lib/clock";
import { TourBooker, type Interest, type TourDay } from "@/components/info/TourBooker";
import "@/components/info/info.css";

export const metadata: Metadata = {
  title: "Schedule a Tour",
  description: "Book an in-person or video tour of Prairie City Landing in Folsom with Community Relations Director Cynthia Bazin. Lunch is on us.",
};

const WEEKDAY_SLOTS = [9, 10, 11, 12, 13, 14, 15, 16].map((h) => h * 60);
const SUNDAY_SLOTS = [11, 12, 13, 14].map((h) => h * 60);

function tourDays(): TourDay[] {
  const t = today();
  return Array.from({ length: 21 }, (_, i) => {
    const d = addDays(t, i + 1);
    const key = iso(d);
    const sunday = dow(d) === 0;
    const busy = i < 4 ? 5 : i < 10 ? 3 : 2; // nearer days are busier
    const slots = (sunday ? SUNDAY_SLOTS : WEEKDAY_SLOTS).map((min) => ({
      min,
      label: fmtTime(min),
      taken: hash(`tour-${key}-${min}`) % 10 < busy,
    }));
    const happening = eventsOn(d)
      .filter((e) => e.start >= 9 * 60 && e.start <= 16 * 60 && !e.harbor && e.cat !== "harbor" && (e.special || e.cat === "music" || e.cat === "trips"))
      .slice(0, 3)
      .map((e) => ({ time: fmtTime(e.start), title: e.title }));
    return {
      iso: key,
      wd: WEEKDAYS[dow(d)].slice(0, 3),
      day: d.getUTCDate(),
      mon: MONTHS[d.getUTCMonth()].slice(0, 3),
      long: longDate(d),
      sunday,
      slots,
      happening,
    };
  });
}

function toInterest(v: string | string[] | undefined): Interest {
  const s = (Array.isArray(v) ? v[0] : v ?? "").toLowerCase();
  if (s.startsWith("independent")) return "independent";
  if (s.startsWith("assisted")) return "assisted";
  if (s.startsWith("harbor") || s.startsWith("memory")) return "harbor";
  return "unsure";
}

export default async function TourPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const initial = toInterest(sp.interest);

  return (
    <>
      <PageHero
        crumbs={[["Schedule a Tour", "/tour"]]}
        eyebrow="Come see us"
        title={
          <>
            Visit, look around, <em>stay for lunch</em>
          </>
        }
        lede="Choose a time that suits you, in person or by video. Cynthia will show you the apartments and the spaces, introduce you to a few residents, and answer every question — and lunch is on us."
      >
        <ul className="tr-hero-facts">
          <li>
            <Icon name="clock" /> Tours daily, 9:00 am–5:00 pm
          </li>
          <li>
            <Icon name="fork" /> Lunch on us
          </li>
          <li>
            <Icon name="phone" /> <a href={site.phoneHref}>{site.phone}</a>
          </li>
        </ul>
      </PageHero>
      <section className="sec-tight tone-cream">
        <div className="wrap">
          <TourBooker
            days={tourDays()}
            initialInterest={initial}
            address={site.addressLine}
            mapsUrl={site.mapsUrl}
            phone={site.phone}
            phoneHref={site.phoneHref}
          />
        </div>
      </section>
    </>
  );
}
