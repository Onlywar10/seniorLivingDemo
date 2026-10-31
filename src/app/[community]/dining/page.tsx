import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/i18n/Link";
import { getT } from "@/i18n/server";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { Dots } from "@/components/Logo";
import { MenuBoard, type MenuDay } from "@/components/dining/MenuBoard";
import { LunchBooking, type BookDate } from "@/components/dining/LunchBooking";
import { getCommunity } from "@/lib/community-server";
import { diningCopy } from "@/data/communities/copy/dining";
import { addDays, dayShort, fmtRange, fromIso, iso, longDate, nowMinutes, sundayOf, today } from "@/lib/clock";
import "@/components/dining/dining.css";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  const c = await getCommunity();
  return {
    title: t("Dining & Menus"),
    description: t(diningCopy[c.slug].metaDescription),
  };
}

const THANKSGIVING = "2026-11-26";

export default async function DiningPage() {
  const { t } = await getT();
  const c = await getCommunity();
  const copy = diningCopy[c.slug];
  const { site, team, venues, allMenus, eventsOn } = c;
  const now = today();
  const todayIso = iso(now);
  const nowMin = nowMinutes();
  const sun = sundayOf(now);

  const days: MenuDay[] = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(sun, i);
    return { date: iso(d), label: dayShort(d), long: longDate(d), menus: allMenus(d) };
  });
  const tg = fromIso(THANKSGIVING);
  // The restaurant serving the holiday dinner: whichever venue's menu marks the day as a holiday.
  const tgVenueKey = c.venueOrder.find((v) => c.menuFor(v, tg).holiday);
  const tgVenue = tgVenueKey ? venues[tgVenueKey] : undefined;
  const daysToTg = Math.round((tg.getTime() - now.getTime()) / 86_400_000);
  const showTg = !!tgVenue && daysToTg >= 0 && daysToTg <= 42;
  const tgDay: MenuDay | undefined = showTg && !days.some((d) => d.date === THANKSGIVING)
    ? { date: THANKSGIVING, label: dayShort(tg), long: longDate(tg), menus: allMenus(tg) }
    : undefined;

  // This week's and next week's happy hours in the bar.
  const happy = Array.from({ length: 14 }, (_, i) => addDays(sun, i))
    .flatMap((d) => eventsOn(d, todayIso))
    .filter((e) => e.cat === "music" && e.room === copy.barRoom);

  // Lunch booking: the next 14 days (today too, while there’s still time).
  // Labels stay in English here; LunchBooking translates them where they render.
  const startOffset = nowMin < 12 * 60 + 30 ? 0 : 1;
  const bookDates: BookDate[] = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(now, i + startOffset);
    return { date: iso(d), label: i + startOffset === 0 ? `Today, ${longDate(d).split(", ")[1]}` : longDate(d) };
  });
  if (showTg) {
    if (!bookDates.some((b) => b.date === THANKSGIVING)) bookDates.push({ date: THANKSGIVING, label: "Thursday, November 26 — Thanksgiving Dinner", holiday: true });
    else bookDates.forEach((b) => { if (b.date === THANKSGIVING) { b.label += " — Thanksgiving Dinner"; b.holiday = true; } });
  }

  const chef = team.find((p) => p.role === "Culinary Director");
  const host = team.find((p) => p.role === "Dining Experience Director");
  const people = [chef, host].filter((p): p is NonNullable<typeof chef> => !!p);
  const lunchVenues = copy.lunchVenues.filter((k) => venues[k]).map((k) => ({ key: k, name: venues[k].name }));
  const hostFirst = host && !host.unnamed ? host.name.split(" ")[0] : null;

  return (
    <>
      <PageHero
        eyebrow="Dining"
        title={<>{t("Dining that feels like ")}<em>{t("going out")}</em></>}
        lede={copy.lede}
        photo={copy.heroPhoto}
        alt={copy.heroAlt}
        crumbs={[["Dining & Menus", "/dining"]]}
      >
        <div className="btn-row">
          <a className="btn btn-lg" href="#lunch">{t("Join us for lunch")}</a>
          <a className="btn btn-ghost btn-lg" href="#menus">{t("Today’s menus")}</a>
        </div>
      </PageHero>

      {showTg && tgVenue && (
        <section className="din-tg" aria-labelledby="din-tg-h">
          <div className="wrap din-tg-inner">
            <div className="din-tg-photo">
              <Image src="/img/turkey.jpg" alt={t("A roast turkey with all the trimmings")} fill sizes="(max-width: 760px) 100vw, 320px" />
            </div>
            <div className="din-tg-text">
              <p className="eyebrow light">{t(`Thursday, November 26 · ${tgVenue.name}`)}</p>
              <h2 id="din-tg-h">{t("Thanksgiving Dinner — ")}<em>{t("reserve your table")}</em></h2>
              <p>{t("Herb-roasted turkey with sage pan gravy, honey-glazed ham, sourdough sage stuffing and three kinds of pie. Served 11:00 am–3:00 pm, by reservation. Families are warmly welcome.")}</p>
              <div className="btn-row">
                <a className="btn btn-light" href="#lunch-thanksgiving">{t("Reserve your table")}</a>
                <a className="btn btn-outline-light" href="#menus-thanksgiving">{t("See the Thanksgiving menu")}</a>
              </div>
            </div>
            <p className="din-tg-count" aria-hidden="true"><b>{daysToTg}</b>{t(" days to go")}</p>
          </div>
        </section>
      )}

      <section id="menus" className="sec tone-cream din-menus" aria-labelledby="din-menus-h">
        <span id="menus-thanksgiving" className="din-anchor" />
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">{t("Live menus")}</p>
            <h2 id="din-menus-h">{t("What’s cooking ")}<em>{t("today")}</em></h2>
            <p>{t("Menus change daily and the Juniper Room’s dinner menu changes every week. Pick a day to see what’s on.")}</p>
          </div>
          <MenuBoard days={days} extra={tgDay} todayIso={todayIso} nowMin={nowMin} />
        </div>
      </section>

      <section className="sec tone-green din-hh" aria-labelledby="din-hh-h">
        <Dots size={260} style={{ right: -70, bottom: -60, opacity: 0.35 }} />
        <div className="wrap din-hh-grid">
          <div className="din-hh-photos">
            <div className="din-hh-ph din-hh-ph-1"><Image src={copy.happyPhotos[0][0]} alt={t(copy.happyPhotos[0][1])} fill sizes="(max-width: 860px) 60vw, 360px" /></div>
            <div className="din-hh-ph din-hh-ph-2"><Image src={copy.happyPhotos[1][0]} alt={t(copy.happyPhotos[1][1])} fill sizes="(max-width: 860px) 40vw, 240px" /></div>
          </div>
          <div>
            <p className="eyebrow light">{t(venues[copy.bar]?.name ?? copy.barRoom)}</p>
            <h2 id="din-hh-h">{t("Happy hour, ")}<em>{t("with live music")}</em></h2>
            <p className="din-hh-lede">{t(copy.happyLede)}</p>
            <ol className="din-hh-list">
              {happy.map((e) => {
                const past = e.date < todayIso || (e.date === todayIso && (e.end ?? e.start + 60) <= nowMin);
                return (
                  <li key={e.id} className={past ? "is-past" : e.date === todayIso ? "is-today" : ""}>
                    <span className="din-hh-date">{e.date === todayIso ? t("Today") : t(dayShort(fromIso(e.date)))}</span>
                    <span className="din-hh-title">{t(e.title.replace(/^Happy Hour:\s*/, ""))}</span>
                    <span className="din-hh-time">{t(fmtRange(e.start, e.end))}</span>
                  </li>
                );
              })}
            </ol>
            <Link className="link-arrow" href="/calendar?view=week">{t("See the full activity calendar ")}<Icon name="arrow" /></Link>
          </div>
        </div>
      </section>

      <section className="sec tone-white din-team" aria-labelledby="din-team-h">
        <div className="wrap din-team-grid">
          <div>
            <div className="sec-head">
              <p className="eyebrow">{t("The people behind the plate")}</p>
              <h2 id="din-team-h">{t("Cooked here, ")}<em>{t("for you")}</em></h2>
              <p>{t(copy.teamLede)}</p>
            </div>
            <ul className="din-people">
              {people.map((p) => (
                <li key={p.name} className="din-person">
                  <span className="din-mono" aria-hidden="true">{p.name.split(" ").map((w) => w[0]).join("")}</span>
                  <div>
                    {p.unnamed ? <h3>{t(p.role)}</h3> : <h3 data-no-translate>{p.name}</h3>}
                    {!p.unnamed && <p className="din-role">{t(p.role)}</p>}
                    <p>{t(p.bio)}</p>
                    {p.ext && <p className="small muted">{t("Call ")}{site.phone}{t(", ext. ")}{p.ext}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="din-mosaic">
            {copy.mosaic.map(([src, alt], i) => (
              <div key={src} className={`din-mosaic-ph din-mosaic-${i + 1}`}>
                <Image src={`/img/${src}`} alt={t(alt)} fill sizes="(max-width: 860px) 50vw, 280px" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="lunch" className="sec tone-sand din-lunch" aria-labelledby="din-lunch-h">
        <span id="lunch-thanksgiving" className="din-anchor" />
        <div className="wrap din-lunch-grid">
          <div className="din-lunch-intro">
            <p className="eyebrow">{t("Families & visitors")}</p>
            <h2 id="din-lunch-h">{t("Join us ")}<em>{t("for lunch")}</em></h2>
            <p>{t(copy.lunchLede)}</p>
            <ul className="din-lunch-points">
              <li><Icon name="clock" />{t(" Seatings from 11:30 am to 1:30 pm, every day")}</li>
              <li><Icon name="pin" />{t(" Check in at the front desk in the Lobby")}</li>
              <li><Icon name="phone" />{t(" Prefer to call? ")}<a href={site.phoneHref}>{site.phone}</a></li>
            </ul>
            <div className="din-lunch-ph">
              <Image src={copy.lunchPhoto[0]} alt={t(copy.lunchPhoto[1])} fill sizes="(max-width: 860px) 100vw, 480px" />
            </div>
          </div>
          <LunchBooking dates={bookDates} venues={lunchVenues} holidayVenue={tgVenueKey} holidayVenueName={tgVenue?.name} host={hostFirst} />
        </div>
      </section>
    </>
  );
}
