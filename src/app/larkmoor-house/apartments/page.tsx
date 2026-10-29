import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { SectionBar } from "@/components/SectionBar";
import { FloorPlan } from "@/components/FloorPlan";
import { Icon } from "@/components/Icon";
import { WaitlistForm } from "@/components/WaitlistForm";
import { Lead, Quote, PageCta } from "@/components/Story";
import { apartments, community, money } from "@/data/community";

export const metadata: Metadata = { title: "Apartments" };

const amenities = [
  { photo: "/photos/dining-group.jpg", alt: "The Main Dining Room at lunch", name: "Main Dining Room", line: "Three meals a day, tables of four and six, a private dining room for family birthdays." },
  { photo: "/photos/tea.jpg", alt: "Residents with tea and pie in the Bistro", name: "The Bistro", line: "Coffee, soup and sandwiches between meals, happy hour on Tuesday and Friday." },
  { photo: "/photos/gardening.jpg", alt: "Residents at the raised garden beds", name: "The courtyard", line: "Raised beds at wheelchair height, a covered walk all the way round, and the garden club on Thursdays." },
  { photo: "/photos/painting.jpg", alt: "A watercolour in progress in the Art Studio", name: "Art Studio and Library", line: "North light in the studio; the library has large-print books, a jigsaw table and the Thursday current-events group." },
  { photo: "/photos/game.jpg", alt: "Balloon volleyball in the Wellness Room", name: "Wellness Room", line: "Chair yoga, balance classes and the physical therapist’s visits." },
  { photo: "/photos/building-porch.jpg", alt: "The front porch with chairs set out", name: "The porch and the Chapel", line: "Chairs on the Fern Street porch for the afternoon sun; the Chapel holds services on Wednesday and Sunday." },
];

export default function ApartmentsPage() {
  const free = apartments.reduce((n, a) => n + a.available, 0);
  return (
    <>
      <PageHeader
        title="The apartments"
        intro="Studios, one-bedrooms, companion suites and memory care suites, every one with a window you would want to sit by. Bring your own furniture; we bring everything else."
        stamp={`${free} apartments available today`}
        module="costs"
        photo="/photos/building-garden.jpg"
        alt="The courtyard garden path between the apartment wings"
      />
      <div className="wrap page-body">
        <section aria-labelledby="plans-h">
          <SectionBar id="plans-h" title="Floor plans, prices and availability" sub={`Updated ${community.updatedAt}`} />
          <div className="panel">
            <ul className="apts2">
              {apartments.map((a) => (
                <li key={a.key} className="apt2" id={a.key}>
                  <div className="apt2-media">
                    <Link href={`/larkmoor-house/apartments/${a.key}/tour`} className="apt2-photo" aria-label={`Take a virtual tour of the ${a.name}`}>
                      <Image src={a.photo} alt={a.alt} fill sizes="(max-width: 900px) 100vw, 46vw" />
                      <span className="apt2-play">
                        <Icon name="play" /> Virtual tour
                      </span>
                    </Link>
                    <div className="apt2-plan">
                      <FloorPlan plan={a.key} title={a.name} />
                    </div>
                  </div>
                  <div className="apt2-body">
                    <div className="apt2-top">
                      <h3>{a.name}</h3>
                      <span className={`avail ${a.available ? "" : "wait"}`}>{a.available ? `${a.available} available` : `Waitlist (${a.waitlist})`}</span>
                    </div>
                    <p className="apt2-price">
                      <span>Starting at</span> <b>{money(a.from)}</b> <span>a month</span>
                    </p>
                    <dl className="apt-facts">
                      <div>
                        <dt>Size</dt>
                        <dd>{a.size}</dd>
                      </div>
                      <div>
                        <dt>Floor</dt>
                        <dd>{a.floor}</dd>
                      </div>
                      <div>
                        <dt>View</dt>
                        <dd>{a.view}</dd>
                      </div>
                      <div>
                        <dt>Care</dt>
                        <dd>{a.care}</dd>
                      </div>
                    </dl>
                    <p>{a.rooms}</p>
                    <ul className="checklist">
                      {a.features.map((f) => (
                        <li key={f}>
                          <Icon name="check" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="apt2-actions">
                      <Link className="btn btn-gold" href={`/larkmoor-house/apartments/${a.key}/tour`}>
                        <Icon name="play" /> Take a virtual tour
                      </Link>
                      <Link className="btn btn-outline" href="/larkmoor-house/tour">
                        Book an in-person tour
                      </Link>
                      {!a.available && (
                        <a className="exit-link" href="#alerts">
                          Join the waitlist <Icon name="arrow" />
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <p className="panel-foot">
              <span>Prices are the monthly apartment rate and include three meals a day, housekeeping, utilities, Wi-Fi and the full activity calendar. Care is added by level after a free nursing assessment, from {money(650)} a month. Rates effective 1 July 2026.</span>
            </p>
          </div>
        </section>

        <section aria-labelledby="alerts-h" id="alerts">
          <SectionBar id="alerts-h" title="Join the waitlist or get availability alerts" sub="We text or email the day an apartment comes free" />
          <div className="panel">
            <div className="split">
              <WaitlistForm />
              <div className="prose">
                <p>Tell us which apartments you are interested in and how soon. When one comes free, you hear the same day, before it is listed anywhere else.</p>
                <p>Joining the waitlist is free and does not commit you to anything. Daniel Whitcombe, our family liaison, keeps the list and will call you to introduce himself.</p>
                <p className="small muted" style={{ margin: 0 }}>
                  Currently waiting: {apartments.filter((a) => a.waitlist).map((a) => `${a.name} (${a.waitlist})`).join(", ")}.
                </p>
              </div>
            </div>
          </div>
        </section>

        <Lead title="Moving in with your own furniture" photo="/photos/living-dance.jpg" alt="A couple dancing in their brightly furnished living room" caption="A one-bedroom on the Fern Street side">
          <p>
            Dorothy Lindqvist brought her sideboard, her reading chair and forty years of photographs, and the maintenance team hung every one of them on her first afternoon. The apartments come with the kitchen, the bathroom and the emergency pendant; the rest is yours to arrange.
          </p>
          <p>First-floor apartments look onto the courtyard or the trees on Fern Street. The second floor is a secure memory care household with its own walled terrace garden.</p>
        </Lead>

        <Quote who="Walter Reyes" />

        <section aria-labelledby="amen-h">
          <SectionBar id="amen-h" title="Beyond your front door" />
          <div className="panel">
            <ul className="amenities">
              {amenities.map((m) => (
                <li key={m.name}>
                  <figure>
                    <Image src={m.photo} alt={m.alt} fill sizes="(max-width: 700px) 100vw, 33vw" />
                  </figure>
                  <b>{m.name}</b>
                  <span>{m.line}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
      <PageCta title="See an apartment this week" text="Daniel will show you two or three that are free now, and go through the rates and the care assessment with you on the day." />
    </>
  );
}
