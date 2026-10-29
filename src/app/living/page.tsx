import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "@/components/brand/brand.css";
import { living, money, pricing, type LivingKey } from "@/data/site";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { LivingTabs } from "@/components/brand/LivingTabs";
import { TourBand } from "@/components/brand/TourBand";

export const metadata: Metadata = {
  title: "Living Options",
  description: "Independent Living from $5,950 a month, Assisted Living Services delivered in every apartment, and Harbor Memory Care at Prairie City Landing in Folsom, CA.",
};

const fromLine: Record<LivingKey, string> = {
  independent: `From ${money(pricing.independent[0].from)} a month`,
  assisted: `${money(pricing.assistedBase)} a month base support fee, plus care plan`,
  harbor: `From ${money(pricing.harbor[0].from)} a month`,
};

const compare: [string, Record<LivingKey, string>][] = [
  ["Your home", { independent: "Studio, one- and two-bedroom apartments up to 1,417 sq ft", assisted: "Stay in your own apartment, or choose a studio or one-bedroom near the Care Partner team", harbor: "Private studios in a secured neighborhood with its own courtyard" }],
  ["Monthly", { independent: fromLine.independent, assisted: fromLine.assisted, harbor: fromLine.harbor }],
  ["Support", { independent: "24-hour team on site and an emergency response system", assisted: "Medication management, personal care, escorts and provider coordination", harbor: "Care Partners trained in memory care, around the clock" }],
  ["Life & activities", { independent: "Events & Adventures, 25+ fitness classes a week, three restaurants", assisted: "Everything in Independent Living, with escorts to meals and activities", harbor: "Harbor’s own Events & Adventures and weekly outings, plus every community event" }],
  ["Led by", { independent: "Cynthia Bazin, Community Relations Director", assisted: "Jan McLennon, Resident Services Director", harbor: "Janelle Zweber, Harbor Memory Care Director" }],
];

export default function LivingPage() {
  const keys = Object.keys(living) as LivingKey[];
  return (
    <>
      <PageHero
        eyebrow="Living options"
        title={
          <>
            Choose how you live — and <em>never</em> have to move to get help.
          </>
        }
        lede="Luxury apartment homes for a truly independent lifestyle, Assisted Living Services delivered discreetly in every apartment, and Harbor, our memory care neighborhood."
        photo="/img/apt-dining.jpg"
        alt="A sunlit apartment dining area set for two"
        crumbs={[["Living Options", "/living"]]}
      >
        <div className="btn-row">
          <Link className="btn" href="/tour">
            Schedule a Tour
          </Link>
          <Link className="btn btn-ghost" href="/floor-plans">
            Floor Plans & Pricing
          </Link>
        </div>
      </PageHero>
      <LivingTabs />

      <section className="sec tone-cream" aria-label="The three living options">
        <div className="wrap">
          {keys.map((k, i) => {
            const l = living[k];
            return (
              <article key={k} className="br-opt">
                <div className="br-opt-ph">
                  <Image src={l.photo} alt={l.alt} fill sizes="(max-width: 860px) 100vw, 50vw" />
                </div>
                <div>
                  <p className="br-opt-num">{`0${i + 1}`}</p>
                  <h2>{l.name}</h2>
                  <p className="muted">{l.lede}</p>
                  <span className="br-from">{fromLine[k]}</span>
                  <ul className="br-checks">
                    {l.points.slice(0, 4).map((p) => (
                      <li key={p}>
                        <Icon name="check" /> <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                  <Link className="btn btn-green" href={l.href}>
                    Explore {l.name} <Icon name="arrow" />
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
            <p className="eyebrow">Side by side</p>
            <h2 id="br-cmp-h">
              Compare the <em>three options</em>
            </h2>
            <p>Every option includes housekeeping, utilities, internet and cable, maintenance, scheduled transportation and all three restaurants.</p>
          </div>
          <div className="br-tbl-scroll">
            <table className="br-price-tbl br-compare">
              <thead>
                <tr>
                  <th scope="col">
                    <span className="vh">Feature</span>
                  </th>
                  {keys.map((k) => (
                    <th key={k} scope="col">
                      {living[k].name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compare.map(([label, row]) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    {keys.map((k) => (
                      <td key={k}>{row[k]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="btn-row" style={{ marginTop: 28 }}>
            <Link className="btn btn-green" href="/care-assessment">
              Not sure which fits? Take the care assessment
            </Link>
            <Link className="btn btn-ghost" href="/cost-comparison">
              Compare your costs at home
            </Link>
          </div>
        </div>
      </section>

      <TourBand photo="/img/courtyard-lunch.jpg" />
    </>
  );
}
