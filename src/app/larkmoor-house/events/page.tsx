import type { Metadata } from "next";
import Image from "next/image";
import { PageHeader } from "@/components/PageHeader";
import { SectionBar } from "@/components/SectionBar";
import { Rsvp } from "@/components/Rsvp";
import { Icon } from "@/components/Icon";
import { Quote, PageCta } from "@/components/Story";
import { getPublicEvents } from "@/data/community";

export const metadata: Metadata = { title: "Open house and family events" };

export default function EventsPage() {
  const events = getPublicEvents();
  return (
    <>
      <PageHeader
        title="Open house and family events"
        intro="Everyone is welcome at these: families of residents, neighbours, and anyone thinking about a move for themselves or someone they love."
        photo="/photos/dining-group.jpg"
        alt="Residents and families sharing a meal in the Main Dining Room"
      />
      <div className="wrap page-body">
        <section aria-labelledby="ev-h">
          <SectionBar id="ev-h" title="Coming up" sub="RSVP so the kitchen knows how many to expect" />
          <div className="panel">
            <ul className="pevents">
              {events.map((e) => (
                <li key={e.slug} className="pevent" id={e.slug}>
                  <figure className="pevent-photo">
                    <Image src={e.photo} alt={e.alt} fill sizes="(max-width: 900px) 100vw, 40vw" />
                  </figure>
                  <div className="pevent-body">
                    <p className="pevent-when">
                      <Icon name="calendar" /> {e.when} · {e.time}
                    </p>
                    <h3>{e.title}</h3>
                    <p className="pevent-where">
                      <Icon name="pin" /> {e.where}, Larkmoor House
                    </p>
                    <p>{e.text}</p>
                    <Rsvp title={e.title} when={e.when} spaces={e.spaces} going={e.going} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
        <Quote who="Karen Whitfield" />
      </div>
      <PageCta title="Can’t make it?" text="Book a tour on any day that suits you instead. Tours run 9 to 6, every day." />
    </>
  );
}
