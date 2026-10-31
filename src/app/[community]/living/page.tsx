import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/i18n/Link";
import { getT } from "@/i18n/server";
import "@/components/brand/brand.css";
import { money, type LivingKey } from "@/data/shared";
import { getCommunity } from "@/lib/community-server";
import { keyPeople, livingCopy } from "@/data/communities/copy/living";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { LivingTabs } from "@/components/brand/LivingTabs";
import { TourBand } from "@/components/brand/TourBand";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  const c = await getCommunity();
  return {
    title: t("Living Options"),
    description: t(livingCopy[c.slug].overviewMeta),
  };
}

export default async function LivingPage() {
  const { t } = await getT();
  const c = await getCommunity();
  const { living, pricing } = c;
  const copy = livingCopy[c.slug];
  const keys = Object.keys(living) as LivingKey[];
  const fromLine: Record<LivingKey, string> = {
    independent: `From ${money(pricing.independent[0].from)} a month`,
    assisted: `${money(pricing.assistedBase)} a month base support fee, plus care plan`,
    lantern: `From ${money(pricing.lantern[0].from)} a month`,
  };
  const maxSqft = Math.max(...c.plans.filter((p) => p.kind === "independent").map((p) => p.sqft ?? 0));
  const people = keyPeople(c);
  const led = (m: (typeof people)["relations"]) => (m ? (m.unnamed ? m.role : `${m.name}, ${m.role}`) : "");
  const compare: [string, Record<LivingKey, string>][] = [
    ["Your home", { independent: `Studio, one- and two-bedroom apartments up to ${maxSqft.toLocaleString("en-US")} sq ft`, ...copy.compareHome }],
    ["Monthly", { independent: fromLine.independent, assisted: fromLine.assisted, lantern: fromLine.lantern }],
    ["Support", { independent: "24-hour team on site and an emergency response system", assisted: "Medication management, personal care, escorts and provider coordination", lantern: "Care Partners trained in memory care, around the clock" }],
    ["Life & activities", { independent: "Events & Adventures, 25+ fitness classes a week, three restaurants", assisted: "Everything in Independent Living, with escorts to meals and activities", lantern: "Lantern’s own Events & Adventures and weekly outings, plus every community event" }],
    ["Led by", { independent: led(people.relations), assisted: led(people.residentServices), lantern: led(people.lantern) }],
  ];
  return (
    <>
      <PageHero
        eyebrow="Living options"
        title={
          <>
            {t("Choose how you live — and ")}<em>{t("never")}</em>{t(" have to move to get help.")}
          </>
        }
        lede="Spacious apartment homes for living on your own terms, Assisted Living Services brought quietly to any apartment, and Lantern, our memory care neighborhood."
        photo="/img/apt-dining.jpg"
        alt="A sunlit apartment dining area set for two"
        crumbs={[["Living Options", "/living"]]}
      >
        <div className="btn-row">
          <Link className="btn" href="/tour">
            {t("Schedule a Tour")}
          </Link>
          <Link className="btn btn-ghost" href="/floor-plans">
            {t("Floor Plans & Pricing")}
          </Link>
        </div>
      </PageHero>
      <LivingTabs />

      <section className="sec tone-cream" aria-label={t("The three living options")}>
        <div className="wrap">
          {keys.map((k, i) => {
            const l = living[k];
            return (
              <article key={k} className="br-opt">
                <div className="br-opt-ph">
                  <Image src={l.photo} alt={t(l.alt)} fill sizes="(max-width: 860px) 100vw, 50vw" />
                </div>
                <div>
                  <p className="br-opt-num">{`0${i + 1}`}</p>
                  <h2>{t(l.name)}</h2>
                  <p className="muted">{t(l.lede)}</p>
                  <span className="br-from">{t(fromLine[k])}</span>
                  <ul className="br-checks">
                    {l.points.slice(0, 4).map((p) => (
                      <li key={p}>
                        <Icon name="check" /> <span>{t(p)}</span>
                      </li>
                    ))}
                  </ul>
                  <Link className="btn btn-green" href={l.href}>
                    {t("Explore ")}{t(l.name)} <Icon name="arrow" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="sec tone-white" aria-labelledby="br-cmp-h">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">{t("Side by side")}</p>
            <h2 id="br-cmp-h">
              {t("Compare the ")}<em>{t("three options")}</em>
            </h2>
            <p>{t(copy.compareIncluded)}</p>
          </div>
          <div className="br-tbl-scroll">
            <table className="br-price-tbl br-compare">
              <thead>
                <tr>
                  <th scope="col">
                    <span className="vh">{t("Feature")}</span>
                  </th>
                  {keys.map((k) => (
                    <th key={k} scope="col">
                      {t(living[k].name)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compare.map(([label, row]) => (
                  <tr key={label}>
                    <th scope="row">{t(label)}</th>
                    {keys.map((k) => (
                      <td key={k}>{t(row[k])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="btn-row" style={{ marginTop: 28 }}>
            <Link className="btn btn-green" href="/care-assessment">
              {t("Not sure which fits? Take the care assessment")}
            </Link>
            <Link className="btn btn-ghost" href="/cost-comparison">
              {t("Compare your costs at home")}
            </Link>
          </div>
        </div>
      </section>

      <TourBand photo="/img/courtyard-lunch.jpg" />
    </>
  );
}
