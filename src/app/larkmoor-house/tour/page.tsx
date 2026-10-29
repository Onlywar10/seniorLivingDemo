import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { SectionBar } from "@/components/SectionBar";
import { TourBooking, type TourDay } from "@/components/TourBooking";
import { EventList } from "@/components/lists";
import { Lead, Steps, Quote } from "@/components/Story";
import { community, getWeek } from "@/data/community";
import { addDays, dayName, longDate, shortDate, iso, today } from "@/lib/clock";

export const metadata: Metadata = { title: "Book a tour" };

const tourSteps = [
  { title: "Arrive", text: "Park in the bays by the front door. Daniel meets you in the lobby; there is nothing to sign." },
  { title: "Coffee in the Bistro", text: "Ten minutes to talk about who the visit is for and what matters most." },
  { title: "The apartments", text: "Two or three, furnished by the people who live in them, with the door open when they say so." },
  { title: "Lunch, if you like", text: "At a table with residents, not in an office. The menu is on this site." },
  { title: "Sit down with a nurse", text: "Care level, cost and timing, answered plainly. Take the answers home; nothing has to be decided that day." },
];

function tourDays(): TourDay[] {
  const hl: Record<string, string> = { Tuesday: "Happy hour 4 pm", Friday: "School visit 2 pm", Saturday: "Pancakes 9 am", Sunday: "Sunday roast" };
  return Array.from({ length: 10 }, (_, n) => {
    const d = addDays(today(), n + 1);
    return { iso: iso(d), dow: dayName(d).slice(0, 3), date: shortDate(d), long: longDate(d), highlight: hl[dayName(d)] };
  });
}

export default function TourPage() {
  const friday = getWeek()[4];
  return (
    <>
      <PageHeader
        title="Come and see a Tuesday"
        intro="Tours run about an hour. Come during an activity rather than between them; the calendar is on this site so you can pick one."
        stamp="Tours any day, 9 am – 6 pm"
        photo="/photos/building-porch.jpg"
        alt="The front porch with chairs set out in the afternoon sun"
      />
      <div className="wrap page-body">
        <section aria-labelledby="how-h">
          <SectionBar id="how-h" title="What a tour is like" />
          <div className="panel">
            <Steps steps={tourSteps} />
          </div>
        </section>

        <section aria-labelledby="book-h">
          <SectionBar id="book-h" title="Book a tour" sub={`Or call ${community.phone} and ask for Daniel`} />
          <div className="panel">
            <div className="split">
              <TourBooking days={tourDays()} />
              <div className="prose">
                <h3>Good days to come this week</h3>
                <p>Friday has the elementary school visit and live music at happy hour; Saturday starts with the family pancake breakfast at 9 am.</p>
                <EventList events={friday.events.slice(2, 4)} />
                <p style={{ marginTop: 14 }}>
                  <Link href="/larkmoor-house/activities">See the whole week</Link>
                </p>
              </div>
            </div>
          </div>
        </section>

        <Quote who="Karen Whitfield" />

        <Lead title="Finding us" photo="/photos/building-garden.jpg" alt="Larkmoor House from the courtyard garden" caption="1400 Fern Street" flip>
          <p>{community.address}. Turn in at the green sign on Fern Street; visitor parking is on the right, with four accessible bays by the front door. The front desk is staffed 6 am to 10 pm.</p>
          <p>Bus route 12 stops outside. From Millbrook Bend General it is eleven minutes by car.</p>
        </Lead>
      </div>
    </>
  );
}
