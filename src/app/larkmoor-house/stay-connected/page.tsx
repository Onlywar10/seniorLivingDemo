import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { SectionBar } from "@/components/SectionBar";
import { SubscribeForm } from "@/components/SubscribeForm";
import { Icon } from "@/components/Icon";
import { Quote, PageCta } from "@/components/Story";
import { getToday, getTodayMenu } from "@/data/community";

export const metadata: Metadata = { title: "Stay connected" };

export default function StayConnectedPage() {
  const today = getToday();
  const dinner = getTodayMenu().meals.find((m) => m.name === "Dinner")!;
  return (
    <>
      <PageHeader
        title="Stay connected"
        intro="The week’s calendar, the menus and the news, sent to your phone or inbox in the language you read best. For families and friends of everyone who lives here."
        photo="/photos/talking.jpg"
        alt="A resident chatting with a family member"
      />
      <div className="wrap page-body">
        <section aria-labelledby="sc-h">
          <SectionBar id="sc-h" title="Sign up" sub="Takes a minute; change or stop any time" />
          <div className="panel">
            <div className="split">
              <SubscribeForm />
              <div className="sc-preview" aria-label="What a text looks like">
                <p className="sc-preview-h">What you receive</p>
                <div className="phone">
                  <div className="phone-top">
                    <b>Larkmoor House</b>
                    <span>Text message</span>
                  </div>
                  <div className="bubble">
                    <b>Today at Larkmoor:</b> {today.events.slice(0, 3).map((e) => `${e.time} ${e.name}`).join(" · ")}. Dinner {dinner.hours}: {dinner.items[0].name}. Full week: larkmoorhouse.com/week
                  </div>
                  <div className="bubble bubble-es" lang="es">
                    <b>Hoy en Larkmoor:</b> {today.events.length} actividades, la primera a las {today.events[0].time.replace(" am", " a. m.")}. Cena de 4:45 a 6:15 p. m. Semana completa: larkmoorhouse.com/semana
                  </div>
                </div>
                <ul className="checklist">
                  <li>
                    <Icon name="check" />
                    <span>In English, Spanish, Vietnamese, Chinese, Tagalog, Russian or Korean, chosen by you.</span>
                  </li>
                  <li>
                    <Icon name="check" />
                    <span>A large-print printable calendar each month, if you would rather post it to someone.</span>
                  </li>
                  <li>
                    <Icon name="check" />
                    <span>Urgent notices, such as a change to visiting, within minutes, day or night.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        <Quote who="Walter Reyes" />
      </div>
      <PageCta />
    </>
  );
}
