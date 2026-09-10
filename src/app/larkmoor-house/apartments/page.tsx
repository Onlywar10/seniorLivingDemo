import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { SectionBar } from "@/components/SectionBar";
import { FloorPlan } from "@/components/FloorPlan";
import { Lead, Quote, PageCta } from "@/components/Story";

export const metadata: Metadata = { title: "Apartments" };

const apartments = [
  {
    key: "studio" as const,
    name: "Studio",
    size: "380 sq ft",
    floor: "First floor",
    view: "Courtyard or Fern Street",
    care: "Assisted living, care levels 1 to 4",
    rooms: "One open room for living and sleeping, a kitchenette, a walk-in closet and a bathroom with a walk-in shower and seat.",
    good: "Someone who wants less to look after and likes being near the Bistro and the front lobby.",
  },
  {
    key: "one" as const,
    name: "One bedroom",
    size: "540 to 560 sq ft",
    floor: "First floor",
    view: "Fern Street, or the courtyard on the garden side",
    care: "Assisted living, care levels 1 to 4",
    rooms: "A separate bedroom, a living room with space for your own sofa and chairs, a kitchenette with a fridge and microwave, and a bathroom with a walk-in shower.",
    good: "Most residents. Room for a visiting grandchild on the sofa and a table by the window.",
  },
  {
    key: "two" as const,
    name: "Two bedroom",
    size: "760 sq ft",
    floor: "First floor, corners of the building",
    view: "Two aspects: courtyard and the trees on Fern Street",
    care: "Assisted living, care levels 1 to 4",
    rooms: "Two bedrooms, two bathrooms, a living and dining room and a kitchen with a full-size fridge. Windows on two sides.",
    good: "Couples, or one person who wants a study, a sewing room or a guest room for family who stay over.",
  },
  {
    key: "suite" as const,
    name: "Memory care suite",
    size: "320 sq ft",
    floor: "Second floor, secure",
    view: "The walled terrace garden",
    care: "Memory care, care level 2 and above included",
    rooms: "A bedroom with a sitting area by the window, a bathroom with a roll-in shower, and a memory box by the door with photographs to help find the way home.",
    good: "One person who does best with their own quiet room and the door open to the household.",
  },
  {
    key: "companion" as const,
    name: "Memory care companion suite",
    size: "420 sq ft, shared",
    floor: "Second floor, secure",
    view: "The walled terrace garden",
    care: "Memory care, care level 2 and above included",
    rooms: "Two bedrooms with a shared bathroom and sitting area. Each resident has their own bedroom, furniture and memory box.",
    good: "Two friends, a couple who both need memory care, or someone who is happier with company close by.",
  },
];

const amenities = [
  { photo: "/photos/dining-group.jpg", alt: "The Main Dining Room at lunch", name: "Main Dining Room", line: "Three meals a day, tables of four and six, a private dining room for family birthdays." },
  { photo: "/photos/tea.jpg", alt: "Residents with tea and pie in the Bistro", name: "The Bistro", line: "Coffee, soup and sandwiches between meals, happy hour on Tuesday and Friday." },
  { photo: "/photos/gardening.jpg", alt: "Residents at the raised garden beds", name: "The courtyard", line: "Raised beds at wheelchair height, a covered walk all the way round, and the garden club on Thursdays." },
  { photo: "/photos/painting.jpg", alt: "A watercolour in progress in the Art Studio", name: "Art Studio and Library", line: "North light in the studio; the library has large-print books, a jigsaw table and the Thursday current-events group." },
  { photo: "/photos/game.jpg", alt: "Balloon volleyball in the Wellness Room", name: "Wellness Room", line: "Chair yoga, balance classes and the physiotherapist’s visits, with the equipment kept out of sight." },
  { photo: "/photos/building-porch.jpg", alt: "The front porch with chairs set out", name: "The porch and the Chapel", line: "Chairs on the Fern Street porch for the afternoon sun; the Chapel holds services on Wednesday and Sunday and is open all day." },
];

export default function ApartmentsPage() {
  return (
    <>
      <PageHeader
        title="The apartments"
        intro="Ninety-six apartments over two floors, from studios to two-bedrooms, every one with a window you would want to sit by. Bring your own furniture; we bring everything else."
        stamp="Floor plans are schematic, drawn to the same scale"
        module="costs"
        moduleNote="Apartment records carry a floor plan, aspect, floor and the care level they serve. Rates live in the same record but are shown on request rather than published here."
        photo="/photos/building-garden.jpg"
        alt="The courtyard garden path between the apartment wings"
      />
      <div className="wrap page-body">
        <Lead title="Moving in with your own furniture" photo="/photos/living-dance.jpg" alt="A couple dancing in their brightly furnished living room" caption="A two-bedroom on the Fern Street side">
          <p>
            Dorothy Lindqvist brought her sideboard, her reading chair and forty years of photographs, and the maintenance team hung every one of them on her first afternoon. The apartments come with the kitchen, the bathroom and the emergency pendant; the rest is yours to arrange.
          </p>
          <p>
            First-floor apartments look onto the courtyard or the trees on Fern Street. The second floor is a secure memory care household with its own walled terrace garden.
          </p>
        </Lead>

        <section aria-labelledby="views-h">
          <SectionBar id="views-h" title="Rooms with a view" />
          <div className="panel">
            <div className="photo-row">
              <figure>
                <Image src="/photos/building-garden.jpg" alt="The courtyard garden between the apartment wings" fill sizes="(max-width: 760px) 100vw, 33vw" />
                <figcaption>Courtyard side: the garden and the covered walk</figcaption>
              </figure>
              <figure>
                <Image src="/photos/building-hedges.jpg" alt="The hedged path and garden gate on the Fern Street side" fill sizes="(max-width: 760px) 100vw, 33vw" />
                <figcaption>Fern Street side: the big trees and the porch</figcaption>
              </figure>
              <figure>
                <Image src="/photos/garden-bench.jpg" alt="A bench in the walled terrace garden" fill sizes="(max-width: 760px) 100vw, 33vw" />
                <figcaption>Second floor: the walled terrace garden</figcaption>
              </figure>
            </div>
            <p className="panel-foot">
              <span>Every apartment has a kitchenette or kitchen, a bathroom with a walk-in or roll-in shower and a seat, an emergency pendant, individual heating and cooling, and cable and Wi-Fi included. Pets under 25 lb are welcome.</span>
            </p>
          </div>
        </section>

        <section aria-labelledby="plans-h">
          <SectionBar id="plans-h" title="Floor plans" sub="Five apartment types" />
          <div className="panel">
            <ul className="apts">
              {apartments.map((a) => (
                <li key={a.key} className="apt">
                  <div className="apt-plan">
                    <FloorPlan plan={a.key} title={a.name} />
                  </div>
                  <div className="apt-body">
                    <h3>{a.name}</h3>
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
                    <p className="muted">
                      <b>Good for:</b> {a.good}
                    </p>
                    <Link className="btn btn-outline" href="/larkmoor-house/tour">
                      See one on a tour
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

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
      <PageCta title="See an apartment this week" text="A few are available this month. Daniel will show you two or three and go through availability and rates with you on the day." />
    </>
  );
}
