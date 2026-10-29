import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "@/components/brand/brand.css";
import { living, money, plans, pricing, site } from "@/data/site";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { LivingTabs } from "@/components/brand/LivingTabs";
import { TourBand } from "@/components/brand/TourBand";
import { PersonCard } from "@/components/brand/Monogram";

export const metadata: Metadata = {
  title: "Assisted Living Services",
  description: "Assisted Living Services delivered discreetly in every apartment at Prairie City Landing, Folsom. $850 a month base support fee plus personal care by care plan — you never have to move.",
};

const services: { icon: "doc" | "heart" | "users" | "phone" | "check" | "home"; title: string; text: string }[] = [
  { icon: "doc", title: "Medication management", text: "Med Techs order, store and give medications on schedule, and keep your care plan current with your doctors." },
  { icon: "heart", title: "Personal care", text: "Help with bathing, dressing and grooming, given with dignity and on your timetable." },
  { icon: "users", title: "Escorts", text: "A Care Partner to walk with you to meals, classes, happy hour and appointments." },
  { icon: "phone", title: "Provider coordination", text: "We talk with your physicians, pharmacy, therapists and home health so nothing falls through the cracks." },
  { icon: "check", title: "Assessment-based services", text: "Additional services are added after a pre-move-in assessment and reviewed as needs change." },
  { icon: "home", title: "Apartments near the team", text: "A limited number of studios and one-bedrooms tailored for assisted living, close to the Care Partner team." },
];

export default function AssistedLiving() {
  const al = living.assisted;
  const alPlans = plans.filter((p) => p.kind === "assisted");
  return (
    <>
      <PageHero
        eyebrow="Assisted Living Services"
        title={
          <>
            Help that comes to you, so you <em>never have to move.</em>
          </>
        }
        lede={al.lede}
        photo={al.photo}
        alt={al.alt}
        crumbs={[
          ["Living Options", "/living"],
          ["Assisted Living Services", al.href],
        ]}
      >
        <div className="btn-row">
          <Link className="btn" href="/care-assessment">
            Start a care assessment
          </Link>
          <a className="btn btn-ghost" href={site.phoneHref}>
            <Icon name="phone" /> {site.phone}
          </a>
        </div>
      </PageHero>
      <LivingTabs current="assisted" />

      <section className="sec tone-cream" aria-labelledby="br-move-h">
        <div className="wrap br-split">
          <div>
            <p className="eyebrow">Your apartment, your life</p>
            <h2 id="br-move-h">
              Available in <em>every</em> apartment.
            </h2>
            <p className="muted">Many communities ask residents to move to a different building, floor or wing when they need more help. At Prairie City Landing, support is delivered discreetly by the Tenfold resident services team, right where you already live — next to the neighbours you know, with the routines you love.</p>
            <div className="br-stat-row">
              <div className="br-stat">
                <b>0</b>
                <span>moves required to receive care</span>
              </div>
              <div className="br-stat">
                <b>24/7</b>
                <span>team on site, every day of the year</span>
              </div>
              <div className="br-stat">
                <b>{money(pricing.assistedBase)}</b>
                <span>a month base support fee</span>
              </div>
            </div>
          </div>
          <div className="br-split-ph">
            <Image src="/img/care-outdoors.jpg" alt="A Care Partner walking with a resident in the garden" fill sizes="(max-width: 860px) 100vw, 50vw" />
          </div>
        </div>
      </section>

      <section className="sec tone-sand" aria-labelledby="br-svc-h">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">Services</p>
            <h2 id="br-svc-h">
              What Assisted Living Services <em>include</em>
            </h2>
          </div>
          <div className="br-feature-grid">
            {services.map((s) => (
              <div key={s.title} className="br-feature">
                <Icon name={s.icon} />
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec tone-white" aria-labelledby="br-alprice-h">
        <div className="wrap br-split">
          <div>
            <p className="eyebrow">Pricing</p>
            <h2 id="br-alprice-h">
              Simple, <em>transparent</em> pricing.
            </h2>
            <p className="muted">Your monthly rent stays the same. Assisted Living Services add a base support fee and a personal care fee set by your care plan — you only pay for the help you use.</p>
            <dl className="br-dl">
              <div>
                <dt>Base support fee</dt>
                <dd>{`${money(pricing.assistedBase)} a month`}</dd>
              </div>
              <div>
                <dt>Personal care</dt>
                <dd>By care plan</dd>
              </div>
              {alPlans.map((p) => (
                <div key={p.code}>
                  <dt>
                    <Link href={`/floor-plans/${p.code}`}>{p.name}</Link>
                  </dt>
                  <dd>{p.from ? `From ${money(p.from)}/mo` : "Call"}</dd>
                </div>
              ))}
            </dl>
            <div className="btn-row">
              <Link className="btn btn-green" href="/care-assessment">
                Start a care assessment
              </Link>
              <Link className="btn btn-ghost" href="/floor-plans">
                Floor plans
              </Link>
            </div>
          </div>
          <div className="br-person-card" style={{ alignSelf: "center" }}>
            <PersonCard name="Jan McLennon" role="Resident Services Director" tone={0}>
              <p className="br-person-bio">Jan leads the Care Partner team, completes every pre-move-in assessment and builds each resident’s care plan together with families and healthcare providers.</p>
              <p className="br-person-bio">“Families often expect a big conversation about moving. Here it’s a conversation about what would make your days easier.”</p>
              <a className="btn btn-sm btn-ghost" href={site.phoneHref}>
                <Icon name="phone" /> <span>{`${site.phone}, ext. 120`}</span>
              </a>
            </PersonCard>
          </div>
        </div>
      </section>

      <TourBand photo="/img/care-laugh.jpg" title={<>Let’s talk about <em>what would help.</em></>} text="Visit, meet Jan and the Care Partner team, and we’ll walk through an assessment together — no pressure and no obligation." />
    </>
  );
}
