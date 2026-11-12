import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/i18n/Link";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { getCommunity } from "@/lib/community-server";
import type { Community } from "@/data/communities";
import { kindOf, type CalEvent } from "@/data/shared";
import { addDays, dayName, dow, fmtTime, fromIso, iso, shortDate, today } from "@/lib/clock";
import { StayConnectedForm, type PreviewItem } from "@/components/info/StayConnected";
import "@/components/info/info.css";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  const { site } = await getCommunity();
  return {
    title: t("Stay Connected"),
    description: t(`Get the ${site.name} activity calendar, menus, photos and news by text or email, in English, Español, 中文, Tagalog, Tiếng Việt or Русский.`),
  };
}

/** Highlights for the next seven days: one-off events first, then trips and live music. */
function weekPreview(eventsOn: Community["eventsOn"]): PreviewItem[] {
  const t = today();
  const out: PreviewItem[] = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(t, i);
    const evs = eventsOn(d);
    const rank = (c: (typeof evs)[number]) => (c.special ? 0 : c.cat === "trips" && !/Shopping Trip/.test(c.title) ? 1 : c.cat === "music" ? 2 : 9);
    const best = evs.filter((e) => rank(e) < 9 && !e.lantern && e.cat !== "lantern").sort((a, b) => rank(a) - rank(b) || a.start - b.start).slice(0, 1);
    best.forEach((e) => out.push({ wd: dow(d), md: `${d.getUTCMonth() + 1}/${d.getUTCDate()}`, time: fmtTime(e.start), title: e.title }));
  }
  return out;
}

/** What a sample resident might be booked on in the coming week, a trip with its departure, and two invites by interest. */
function sampleWeek(c: Community) {
  const t = today();
  const all = c.eventsBetween(addDays(t, 1), 7, iso(t)).flatMap((x) => x.events).filter((e) => !e.lantern && e.cat !== "lantern" && e.cat !== "faith" && e.start >= 9 * 60);
  const trip = all.find((e) => e.cat === "trips" && !/^Shopping/.test(e.title));
  const booked = [...(trip ? [trip] : []), ...all.filter((e) => e !== trip && (e.cat === "clubs" || e.cat === "music")).filter((e, i, a) => a.findIndex((y) => y.date === e.date) === i).slice(0, 2)]
    .sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start);
  const invites = all.filter((e) => !booked.includes(e) && !/^Shopping/.test(e.title) && e.cat !== "trips" && (e.cat === "community" || e.cat === "music" || e.cat === "clubs" || e.special)).filter((e, i, a) => a.findIndex((y) => y.title === e.title) === i).slice(0, 2);
  const familyEvent = c.eventsBetween(t, 28, iso(t)).flatMap((x) => x.events).find((e) => kindOf(e) === "family");
  return { booked, trip, invites, familyEvent };
}
const when = (e: CalEvent) => `${dayName(fromIso(e.date)).slice(0, 3)} ${shortDate(fromIso(e.date))}, ${fmtTime(e.start)}`;

const outcomes = [
  { icon: "mail", title: "Community news", text: "A highlight by text midweek, and the whole week by email on Sunday: what’s on, the menus and new photo albums." },
  { icon: "heart", title: "Your parent’s week", text: "Their own section in the Sunday email: photos they’re in and the outings they’re booked on. Only if your resident chooses to share." },
  { icon: "bell", title: "Alerts", text: "Weather, closures, and changes to events you’re coming to, the same day." },
  { icon: "users", title: "Join your parent at an event", text: "Family events come with an invitation. Reply to the text to RSVP; we check with your resident first, then confirm." },
] as const;

const beta = [
  { title: "A private page for each resident and their family", text: "Their week, bookings and photos in one place, behind a sign-in." },
  { title: "Family photos and messages to your resident", text: "Text a photo or a note, and it reaches their highlights or their printed card." },
  { title: "A lead family contact", text: "One family member helps manage who is connected. Your resident still approves." },
  { title: "Attendance summaries", text: "A short note of the activities your resident joined each month." },
];

export default async function StayConnectedPage() {
  const { t } = await getT();
  const c = await getCommunity();
  const { site } = c;
  const domain = site.email.split("@")[1];
  const wk = sampleWeek(c);
  const album = c.stories.find((s) => /pumpkin/i.test(s.slug))?.photo ?? "/img/pumpkins.jpg";
  return (
    <>
      <PageHero
        crumbs={[["For families", "/stay-connected"]]}
        eyebrow="For families"
        title={
          <>
            {t("Stay close, ")}
            <em>{t("without an app")}</em>
          </>
        }
        lede="News, photos and invitations by text or email, in your language. No app, no login, and you can stop any time."
        photo="/img/mother-daughter.jpg"
        alt="A mother and her adult daughter smiling together"
      >
        <div className="btn-row">
          <Link className="btn" href="#sign-up">
            <Icon name="mail" /> {t("Sign up for family updates")}
          </Link>
          <Link className="btn btn-ghost" href="/photos">
            <Icon name="image" /> {t("Photo albums")}
          </Link>
        </div>
      </PageHero>

      {/* ---------------------------------------------------------------- what you get */}
      <section className="sec tone-white" aria-labelledby="sc-get-h">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">{t("What you’ll get")}</p>
            <h2 id="sc-get-h">{t("Four things, ")}<em>{t("by text and email")}</em></h2>
          </div>
          <ol className="sc-out">
            {outcomes.map((o, i) => (
              <li key={o.title}>
                <span className="sc-out-n" aria-hidden="true">{i + 1}</span>
                <span className="sc-perk-ico"><Icon name={o.icon} /></span>
                <h3>{t(o.title)}</h3>
                <p>{t(o.text)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------------------------------------------------------- sign up */}
      <section className="sec tone-cream" id="sign-up" aria-labelledby="sc-signup-h">
        <div className="wrap sc-layout">
          <div className="card card-pad sc-card">
            <h2 className="sc-h" id="sc-signup-h">{t("Sign up")}</h2>
            <StayConnectedForm preview={weekPreview(c.eventsOn)} />
          </div>
          <aside className="sc-side">
            <div className="card card-pad sc-next">
              <h3>{t("What happens after you sign up")}</h3>
              <ol>
                <li>{t("A welcome message arrives, and community news starts that week.")}</li>
                <li>{t("If you gave your resident’s name, our team checks with your resident before anything personal is shared.")}</li>
                <li>{t("Once they agree, their week joins your Sunday email, and you can RSVP to family events.")}</li>
              </ol>
              <p className="small muted">{t("No resident’s name? You get community news only. You can add it later by calling the front desk.")}</p>
            </div>
            <div className="card card-pad sc-paper">
              <h3><Icon name="printer" /> {t("Prefer paper?")}</h3>
              <p className="small">{t("The large-print calendar is at the front desk each month, and we’ll post one to you.")}</p>
              <a className="link-arrow" href={site.phoneHref}>{t("Call ")}{site.phone} <Icon name="arrow" /></a>
            </div>
            <div className="sc-side-photo">
              <Image src="/img/grandkid-parade.jpg" alt={t("A grandchild and grandparent enjoying a parade together")} fill sizes="(max-width: 960px) 100vw, 380px" />
            </div>
          </aside>
        </div>
      </section>

      {/* ---------------------------------------------------------------- samples: the family section and the resident's own week */}
      <section className="sec tone-white" aria-labelledby="sc-sample-h">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">{t("Something personal, without an app")}</p>
            <h2 id="sc-sample-h">{t("What a week ")}<em>{t("looks like")}</em></h2>
            <p>{t("Two examples from this week’s calendar. Real names and photos only ever go to the family a resident has approved.")}</p>
          </div>
          <div className="sc-samples">
            <figure className="sc-sample">
              <figcaption>
                <b>{t("For families: “Mom’s week”")}</b>
                <span>{t("Her section of the Sunday email, if she chooses to share")}</span>
              </figcaption>
              <div className="sc-mail" data-sample>
                <p className="sc-mail-sub">{t("This week at ")}{site.name}</p>
                <p className="sc-mail-from">{site.name} &lt;hello@{domain}&gt;</p>
                <h4>{t("Mom’s week")}</h4>
                <p className="sc-mail-k">{t("She’s booked on")}</p>
                <ul>
                  {wk.booked.map((e) => <li key={e.id}><b>{t(when(e))}</b> {t(e.title)}</li>)}
                </ul>
                <p className="sc-mail-k">{t("Photos she’s in")}</p>
                <div className="sc-mail-ph">
                  <Image src={album} alt="" width={120} height={80} />
                  <span>{t("From last week’s album")}</span>
                </div>
                {wk.familyEvent && (
                  <>
                    <p className="sc-mail-k">{t("Join her")}</p>
                    <p><b>{t(wk.familyEvent.title)}</b><br />{t(when(wk.familyEvent))}</p>
                    <p className="sc-mail-cta">{t("Reply to our text with how many are coming. We’ll check with her, then confirm.")}</p>
                  </>
                )}
              </div>
            </figure>

            <figure className="sc-sample">
              <figcaption>
                <b>{t("For residents: “Your week”")}</b>
                <span>{t("A Sunday text (or email) for residents who sign up")}</span>
              </figcaption>
              <div className="sc-phone sc-phone-static">
                <div className="sc-phone-top">
                  <span className="sc-phone-av">{site.short}</span>
                  <b>{site.name}</b>
                  <small>{t("Text message")}</small>
                </div>
                <div className="sc-bubble">
                  <p>{t("Good morning! Your week:")}</p>
                  <ul>
                    {wk.booked.map((e) => (
                      <li key={e.id}>
                        <b>{t(when(e))}</b> {t(e.title)}
                        {e === wk.trip && <> {t(`(the bus leaves at ${fmtTime(e.start - 15)})`)}</>}
                      </li>
                    ))}
                  </ul>
                  {wk.invites.length > 0 && (
                    <>
                      <p>{t("You might enjoy:")}</p>
                      <ul>
                        {wk.invites.map((e) => <li key={e.id}><b>{t(when(e))}</b> {t(e.title)}</li>)}
                      </ul>
                      <p>{t("Reply YES to join.")}</p>
                    </>
                  )}
                </div>
              </div>
            </figure>
          </div>
          <p className="small muted sc-print-note">
            <Icon name="printer" /> {t("Every resident also gets a large-print “your week” sheet, whether or not they use a phone.")}
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------------- what comes later */}
      <section className="sec tone-sand" aria-labelledby="sc-beta-h">
        <div className="wrap">
          <div className="sec-head-row">
            <div className="sec-head">
              <p className="eyebrow">{t("What comes later")}</p>
              <h2 id="sc-beta-h">{t("Coming ")}<em>{t("in Beta")}</em></h2>
            </div>
          </div>
          <ul className="sc-beta">
            {beta.map((b) => (
              <li key={b.title}>
                <span className="sc-beta-tag">{t("Coming in Beta")}</span>
                <h3>{t(b.title)}</h3>
                <p>{t(b.text)}</p>
              </li>
            ))}
          </ul>
          <p className="sc-see">
            <a className="link-arrow" href={`/phones?c=${c.slug}`}>
              {t("See what you’ll receive")} <Icon name="arrow" />
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
