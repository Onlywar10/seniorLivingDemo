import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { getCommunity } from "@/lib/community-server";
import type { Community } from "@/data/communities";
import { infoCopy } from "@/data/communities/copy/info";
import { addDays, dow, fmtTime, today } from "@/lib/clock";
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

const perks = [
  { icon: "calendar", title: "The week ahead", text: "Trips, live music and special events, so you know what to ask about on your next call." },
  { icon: "fork", title: "What’s for dinner", text: "" }, // text from the community's copy
  { icon: "image", title: "Photos & news", text: "New albums from trips and happy hours — you might spot someone you know." },
  { icon: "translate", title: "In your language", text: "English, Español, 中文, Tagalog, Tiếng Việt and Русский." },
] as const;

export default async function StayConnectedPage() {
  const { t } = await getT();
  const c = await getCommunity();
  const copy = infoCopy[c.slug];
  return (
    <>
      <PageHero
        crumbs={[["Stay Connected", "/stay-connected"]]}
        eyebrow="For families"
        title={
          <>
            {t("Never miss ")}
            <em>{t("a moment")}</em>
          </>
        }
        lede="Get the activity calendar, menus and photos by text or email, in your language. It takes a minute, and you can stop any time."
        photo="/img/mother-daughter.jpg"
        alt="A mother and her adult daughter smiling together"
      />

      <section className="sec-tight tone-white">
        <div className="wrap">
          <ul className="sc-perks">
            {perks.map((p) => (
              <li key={p.title}>
                <span className="sc-perk-ico">
                  <Icon name={p.icon} />
                </span>
                <div>
                  <h2 className="sc-perk-h">{t(p.title)}</h2>
                  <p className="small muted">{t(p.icon === "fork" ? copy.dinnerPerk : p.text)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="sec tone-cream">
        <div className="wrap sc-layout">
          <div className="card card-pad sc-card">
            <h2 className="sc-h">{t("Sign up")}</h2>
            <StayConnectedForm preview={weekPreview(c.eventsOn)} />
          </div>
          <aside className="sc-side">
            <div className="sc-side-photo">
              <Image src="/img/grandkid-parade.jpg" alt={t("A grandchild and grandparent enjoying a parade together")} fill sizes="(max-width: 960px) 100vw, 380px" />
            </div>
            {copy.paper && (
              <div className="card card-pad">
                <h3>{t("Prefer paper?")}</h3>
                <p className="small">{t(copy.paper)}</p>
              </div>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}
