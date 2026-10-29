import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { Dots } from "@/components/Logo";
import { MenuBoard, type MenuDay } from "@/components/dining/MenuBoard";
import { LunchBooking, type BookDate } from "@/components/dining/LunchBooking";
import { eventsOn } from "@/data/calendar";
import { allMenus } from "@/data/menus";
import { site, team } from "@/data/site";
import { addDays, dayShort, fmtRange, fromIso, iso, longDate, nowMinutes, sundayOf, today } from "@/lib/clock";
import "@/components/dining/dining.css";

export const metadata: Metadata = {
  title: "Dining & Menus",
  description:
    "Today’s menus at The Cypress Room, Natoma Café and The Rendezvous at Prairie City Landing in Folsom, CA — chef’s specials, soup of the day, gluten-free, vegetarian and dairy-free choices, happy hours with live music, and lunch reservations for families and guests.",
};

const THANKSGIVING = "2026-11-26";

export default async function DiningPage() {
  const t = today();
  const todayIso = iso(t);
  const nowMin = nowMinutes();
  const sun = sundayOf(t);

  const days: MenuDay[] = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(sun, i);
    return { date: iso(d), label: dayShort(d), long: longDate(d), menus: allMenus(d) };
  });
  const tg = fromIso(THANKSGIVING);
  const daysToTg = Math.round((tg.getTime() - t.getTime()) / 86_400_000);
  const showTg = daysToTg >= 0 && daysToTg <= 42;
  const tgDay: MenuDay | undefined = showTg && !days.some((d) => d.date === THANKSGIVING)
    ? { date: THANKSGIVING, label: dayShort(tg), long: longDate(tg), menus: allMenus(tg) }
    : undefined;

  // This week's and next week's happy hours in The Rendezvous.
  const happy = Array.from({ length: 14 }, (_, i) => addDays(sun, i))
    .flatMap((d) => eventsOn(d, todayIso))
    .filter((e) => e.cat === "music" && e.room === "The Rendezvous");

  // Lunch booking: the next 14 days (today too, while there’s still time).
  const startOffset = nowMin < 12 * 60 + 30 ? 0 : 1;
  const bookDates: BookDate[] = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(t, i + startOffset);
    return { date: iso(d), label: i + startOffset === 0 ? `Today, ${longDate(d).split(", ")[1]}` : longDate(d) };
  });
  if (showTg && !bookDates.some((b) => b.date === THANKSGIVING)) bookDates.push({ date: THANKSGIVING, label: "Thursday, November 26 — Thanksgiving Dinner", holiday: true });
  else bookDates.forEach((b) => { if (b.date === THANKSGIVING) { b.label += " — Thanksgiving Dinner"; b.holiday = true; } });

  const conrad = team.find((p) => p.name === "Conrad Caguimbal");
  const mickei = team.find((p) => p.name === "Mickei Butler");
  const people = [conrad, mickei].filter(Boolean) as NonNullable<typeof conrad>[];

  return (
    <>
      <PageHero
        eyebrow="Dining"
        title={<>Dining that feels like <em>going out</em></>}
        lede="White-tablecloth dinners in The Cypress Room, California comfort food all day at Natoma Café, and lattes, panini and a glass of wine in The Rendezvous. Every menu is designed here, by our own culinary team."
        photo="/img/cypress-people.jpg"
        alt="Residents sharing a meal at a white-tablecloth table in The Cypress Room"
        crumbs={[["Dining & Menus", "/dining"]]}
      >
        <div className="btn-row">
          <a className="btn btn-lg" href="#lunch">Join us for lunch</a>
          <a className="btn btn-ghost btn-lg" href="#menus">Today’s menus</a>
        </div>
      </PageHero>

      {showTg && (
        <section className="din-tg" aria-labelledby="din-tg-h">
          <div className="wrap din-tg-inner">
            <div className="din-tg-photo">
              <Image src="/img/turkey.jpg" alt="A roast turkey with all the trimmings" fill sizes="(max-width: 760px) 100vw, 320px" />
            </div>
            <div className="din-tg-text">
              <p className="eyebrow light">Thursday, November 26 · The Cypress Room</p>
              <h2 id="din-tg-h">Thanksgiving Dinner — <em>reserve your table</em></h2>
              <p>Herb-roasted turkey with sage pan gravy, honey-glazed ham, sourdough sage stuffing and three kinds of pie. Served 11:00 am–3:00 pm, by reservation. Families are warmly welcome.</p>
              <div className="btn-row">
                <a className="btn btn-light" href="#lunch-thanksgiving">Reserve your table</a>
                <a className="btn btn-outline-light" href="#menus-thanksgiving">See the Thanksgiving menu</a>
              </div>
            </div>
            <p className="din-tg-count" aria-hidden="true"><b>{daysToTg}</b> days to go</p>
          </div>
        </section>
      )}

      <section id="menus" className="sec tone-cream din-menus" aria-labelledby="din-menus-h">
        <span id="menus-thanksgiving" className="din-anchor" />
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">Live menus</p>
            <h2 id="din-menus-h">What’s cooking <em>today</em></h2>
            <p>Menus change daily and the Cypress Room’s dinner menu changes every week. Pick a day to see what’s on.</p>
          </div>
          <MenuBoard days={days} extra={tgDay} todayIso={todayIso} nowMin={nowMin} />
        </div>
      </section>

      <section className="sec tone-green din-hh" aria-labelledby="din-hh-h">
        <Dots size={260} style={{ right: -70, bottom: -60, opacity: 0.35 }} />
        <div className="wrap din-hh-grid">
          <div className="din-hh-photos">
            <div className="din-hh-ph din-hh-ph-1"><Image src="/img/wine-toast.jpg" alt="Friends raising glasses of wine at happy hour" fill sizes="(max-width: 860px) 60vw, 360px" /></div>
            <div className="din-hh-ph din-hh-ph-2"><Image src="/img/cocktail.jpg" alt="A cocktail on the bar at The Rendezvous" fill sizes="(max-width: 860px) 40vw, 240px" /></div>
          </div>
          <div>
            <p className="eyebrow light">The Rendezvous</p>
            <h2 id="din-hh-h">Happy hour, <em>with live music</em></h2>
            <p className="din-hh-lede">Every Tuesday and Friday, 3:00–4:00 pm. Cocktails, mocktails, wine by the glass and complimentary snacks for friends and visitors — bring the family.</p>
            <ol className="din-hh-list">
              {happy.map((e) => {
                const past = e.date < todayIso || (e.date === todayIso && (e.end ?? e.start + 60) <= nowMin);
                return (
                  <li key={e.id} className={past ? "is-past" : e.date === todayIso ? "is-today" : ""}>
                    <span className="din-hh-date">{e.date === todayIso ? "Today" : dayShort(fromIso(e.date))}</span>
                    <span className="din-hh-title">{e.title.replace(/^Happy Hour:\s*/, "")}</span>
                    <span className="din-hh-time">{fmtRange(e.start, e.end)}</span>
                  </li>
                );
              })}
            </ol>
            <Link className="link-arrow" href="/calendar?view=week">See the full activity calendar <Icon name="arrow" /></Link>
          </div>
        </div>
      </section>

      <section className="sec tone-white din-team" aria-labelledby="din-team-h">
        <div className="wrap din-team-grid">
          <div>
            <div className="sec-head">
              <p className="eyebrow">The people behind the plate</p>
              <h2 id="din-team-h">Cooked here, <em>for you</em></h2>
              <p>Our menus are written in our own kitchen — and residents help shape them at Conversations with Chef, held in Natoma Café.</p>
            </div>
            <ul className="din-people">
              {people.map((p) => (
                <li key={p.name} className="din-person">
                  <span className="din-mono" aria-hidden="true">{p.name.split(" ").map((w) => w[0]).join("")}</span>
                  <div>
                    <h3 data-no-translate>{p.name}</h3>
                    <p className="din-role">{p.role}</p>
                    <p>{p.bio}</p>
                    {p.ext && <p className="small muted">Call {site.phone}, ext. {p.ext}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="din-mosaic">
            {[
              ["dish-plated.jpg", "A plated entrée with seasonal vegetables"],
              ["dish-salmon.jpg", "Grilled salmon filet with lemon herb butter"],
              ["dish-caprese.jpg", "Caprese salad with fresh mozzarella and basil"],
              ["dish-dessert.jpg", "A plated dessert"],
              ["latte.jpg", "A latte with foam art from The Rendezvous"],
            ].map(([src, alt], i) => (
              <div key={src} className={`din-mosaic-ph din-mosaic-${i + 1}`}>
                <Image src={`/img/${src}`} alt={alt} fill sizes="(max-width: 860px) 50vw, 280px" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="lunch" className="sec tone-sand din-lunch" aria-labelledby="din-lunch-h">
        <span id="lunch-thanksgiving" className="din-anchor" />
        <div className="wrap din-lunch-grid">
          <div className="din-lunch-intro">
            <p className="eyebrow">Families & visitors</p>
            <h2 id="din-lunch-h">Join us <em>for lunch</em></h2>
            <p>The best way to get to know Prairie City Landing is over a meal. Visiting a loved one, or thinking about a move? Book a table in The Cypress Room or Natoma Café and we’ll take care of the rest.</p>
            <ul className="din-lunch-points">
              <li><Icon name="clock" /> Seatings from 11:30 am to 1:30 pm, every day</li>
              <li><Icon name="pin" /> Check in at the front desk in the Lobby</li>
              <li><Icon name="phone" /> Prefer to call? <a href={site.phoneHref}>{site.phone}</a></li>
            </ul>
            <div className="din-lunch-ph">
              <Image src="/img/natoma-2.jpg" alt="Natoma Café’s sunny dining room" fill sizes="(max-width: 860px) 100vw, 480px" />
            </div>
          </div>
          <LunchBooking dates={bookDates} />
        </div>
      </section>
    </>
  );
}
