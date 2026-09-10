import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { SectionBar } from "@/components/SectionBar";
import { DayPicker } from "@/components/DayPicker";
import { Icon } from "@/components/Icon";
import { PhotoCard } from "@/components/lists";
import { Lead, Quote, PageCta } from "@/components/Story";
import { community, recentPhotos } from "@/data/community";

export const metadata: Metadata = { title: "Activities this week" };

const regulars = [
  { when: "Weekday mornings, 9:30", what: "Movement: chair yoga, walking club, balance and strength", where: "Wellness Room" },
  { when: "Tuesday and Friday, 4:00", what: "Happy hour with live music", where: "Bistro" },
  { when: "Wednesday, 10:00", what: "Shopping bus to Fred’s Market and the pharmacy", where: "Departs Front Lobby" },
  { when: "Wednesday, 11:00 and Sunday, 10:30", what: "Communion and the interfaith service", where: "Chapel" },
  { when: "Thursday, 1:30", what: "Garden club at the raised beds", where: "Courtyard" },
  { when: "Most evenings, 6:30", what: "A film in the Cinema Lounge or cards in the Bistro", where: "" },
];

export default function ActivitiesPage() {
  return (
    <>
      <PageHeader
        title="Activities this week"
        intro="Pick a day to see what is on, with the time and the room. Family members are welcome at everything."
        stamp={`Updated ${community.updatedAt}`}
        module="daily-life"
        photo="/photos/dancing.jpg"
        alt="Residents dancing in the Bistro during Tuesday happy hour"
      />
      <div className="wrap page-body">
        <Lead title="A Thursday, start to finish" photo="/photos/gardening.jpg" alt="Two residents planting bulbs at the raised beds" caption="Garden club, Thursday 1:30, the courtyard">
          <p>
            Bev’s chair yoga fills the Wellness Room by half past nine, mostly because she plays the same Glenn Miller record every week and nobody wants to miss it. Daniel reads the headlines in the Library at half past ten, with strong opinions from the back row.
          </p>
          <p>
            After lunch the garden club plants fall bulbs at the raised beds, then the Larkmoor Singers rehearse in the Garden Room, and by half past six the cribbage board is out in the Bistro. Tom, our Life Enrichment Director, writes the week so that every day has somewhere to be.
          </p>
        </Lead>

        <section aria-labelledby="week-h">
          <SectionBar id="week-h" title={community.weekLabel} />
          <div className="panel">
            <div className="act-grid">
              <DayPicker />
              <aside className="act-side">
                <figure className="act-photo">
                  <Image src="/photos/game.jpg" alt="Balloon volleyball in the Wellness Room" fill sizes="(max-width: 900px) 100vw, 34vw" />
                </figure>
                <h3>Come on a day that shows you the place</h3>
                <p>Tuesday and Friday afternoons are lively; Thursday morning is quiet and good for talking to the nurses.</p>
                <div className="hero-actions">
                  <Link className="btn btn-gold" href="/larkmoor-house/tour">
                    <Icon name="calendar" />
                    Book a tour
                  </Link>
                  <a className="btn btn-outline" href={community.phoneHref}>
                    <Icon name="phone" />
                    Call us
                  </a>
                </div>
                <p className="small muted" style={{ marginTop: 18 }}>
                  Memory care residents have a parallel programme on the second floor; ask Hannah Steinberg (ext. 210) for this week’s sheet. Bus outings: book with Roy (ext. 160) by noon the day before.
                </p>
              </aside>
            </div>
          </div>
        </section>

        <Quote who="Dorothy Lindqvist" />

        <section aria-labelledby="reg-h">
          <SectionBar id="reg-h" title="Every week" sub="The rhythms that do not change" />
          <div className="panel">
            <ul className="regulars">
              {regulars.map((r) => (
                <li key={r.when}>
                  <b>{r.when}</b>
                  <span>{r.what}</span>
                  {r.where && <span className="muted">{r.where}</span>}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="photos-h">
          <SectionBar id="photos-h" title="Recent photos" sub="Residents pictured have signed photo consent" />
          <div className="panel">
            <div className="photos photos-3">
              {recentPhotos.slice(0, 6).map((p) => (
                <PhotoCard key={p.src} p={p} />
              ))}
            </div>
          </div>
        </section>
      </div>
      <PageCta title="Come to a happy hour" text="Tuesday and Friday at four in the Bistro. Book a tour for that afternoon and stay for it." />
    </>
  );
}
