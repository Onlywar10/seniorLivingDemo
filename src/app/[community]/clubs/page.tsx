import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/i18n/Link";
import { getT } from "@/i18n/server";
import "@/components/brand/brand.css";
import "@/components/info/info.css";
import { getCommunity } from "@/lib/community-server";
import { clubs } from "@/data/communities/copy/clubs";
import type { CalEvent } from "@/data/shared";
import { dayName, fmtTime, fromIso, iso, shortDate, today } from "@/lib/clock";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { TourBand } from "@/components/brand/TourBand";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  const { site } = await getCommunity();
  return { title: t("Clubs & Groups"), description: t(`Clubs and groups at ${site.name}: what they do, when they meet and how to join.`) };
}

const PLURAL = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];

/** "Tuesdays and Fridays · 2:00 pm" from a club's next meetings (days in week order; a time only if it never changes). */
function pattern(evs: CalEvent[]): { days: string[]; time?: string } {
  const days = [...new Set(evs.map((e) => fromIso(e.date).getUTCDay()))].sort((a, b) => a - b).map((d) => PLURAL[d]);
  const times = [...new Set(evs.map((e) => e.start))];
  return { days, time: times.length === 1 ? fmtTime(times[0]) : undefined };
}

/**
 * Every club and group with its own section: what it does, when it meets, who runs it, how to join, and its next
 * dates from the calendar. One page per community, with an anchor per club (/clubs#bridge).
 */
export default async function ClubsPage() {
  const { t } = await getT();
  const c = await getCommunity();
  const d = today();
  const coming = c.eventsBetween(d, 35, iso(d)).flatMap((x) => x.events);
  const list = clubs[c.slug].map((club) => ({ club, evs: coming.filter((e) => club.match.test(e.title)) }));
  return (
    <>
      <PageHero
        crumbs={[["Lifestyle", "/lifestyle"], ["Clubs & Groups", "/clubs"]]}
        eyebrow="Clubs & Groups"
        title={<>{t("Find ")}<em>{t("your people")}</em></>}
        lede="Clubs run by residents and by our team, from bridge to flower arranging. Most need no sign-up: just come along."
      >
        <ul className="cl-jump" aria-label={t("Clubs & Groups")}>
          {list.map(({ club }) => (
            <li key={club.slug}><a href={`#${club.slug}`}>{t(club.name)}</a></li>
          ))}
        </ul>
      </PageHero>

      <section className="sec tone-white" aria-label={t("Clubs & Groups")}>
        <div className="wrap cl-list">
          {list.map(({ club, evs }) => {
            const p = pattern(evs);
            return (
              <article key={club.slug} id={club.slug} className="cl-club" aria-labelledby={`cl-${club.slug}`}>
                <div className="cl-ph">
                  <Image src={club.photo} alt="" fill sizes="(max-width: 860px) 100vw, 320px" />
                </div>
                <div className="cl-body">
                  <h2 id={`cl-${club.slug}`}>{t(club.name)}</h2>
                  <p>{t(club.what)}</p>
                  <dl className="cl-facts">
                    <div>
                      <dt><Icon name="clock" /> {t("When it meets")}</dt>
                      <dd>
                        {p.days.length ? <>{p.days.map((x, i) => <span key={x}>{i ? (i === p.days.length - 1 ? t(" and ") : ", ") : ""}{t(x)}</span>)}{p.time ? <> · {t(p.time)}</> : null}</> : t("See the calendar for the next date")}
                      </dd>
                    </div>
                    <div>
                      <dt><Icon name="users" /> {t("Who runs it")}</dt>
                      <dd>{t(club.runBy)}</dd>
                    </div>
                    <div>
                      <dt><Icon name="check" /> {t("How to join")}</dt>
                      <dd>{t(club.join)}{club.families && <span className="cl-fam"><Icon name="heart" /> {t("Families welcome")}</span>}</dd>
                    </div>
                  </dl>
                  {evs.length > 0 && (
                    <div className="cl-next">
                      <h3>{t("Next dates")}</h3>
                      <ul>
                        {evs.slice(0, 4).map((e) => (
                          <li key={e.id}>{t(`${dayName(fromIso(e.date)).slice(0, 3)}, ${shortDate(fromIso(e.date))}`)} · {t(fmtTime(e.start))}{e.title !== club.name && <> · {t(e.title)}</>}</li>
                        ))}
                      </ul>
                      <Link className="link-arrow" href={`/calendar?view=month&cat=${evs[0].cat}`}>
                        {t("On the calendar")} <Icon name="arrow" />
                      </Link>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="sec-tight tone-cream" aria-labelledby="cl-start-h">
        <div className="wrap cl-start">
          <h2 id="cl-start-h">{t("Want to start a club?")}</h2>
          <p>{t("Bring the idea to the weekly Activity Meeting, or tell the front desk. Our team helps with the room, the supplies and a spot on the calendar.")}</p>
        </div>
      </section>

      <TourBand photo="/img/friends-laugh.jpg" title={<>{t("Come and ")}<em>{t("join in.")}</em></>} text="Visit, sit in on a club and stay for lunch." />
    </>
  );
}

