import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { SectionBar } from "@/components/SectionBar";
import { SubscribeForm } from "@/components/SubscribeForm";
import { Lead, Steps, PageCta } from "@/components/Story";
import { news } from "@/data/community";

export const metadata: Metadata = { title: "News" };

const howNotices = [
  { title: "Something changes", text: "An outbreak, a lift out of service, a change to visiting. The Executive Director or the nurse on duty writes three lines." },
  { title: "It goes up here", text: "The notice appears at the top of every page on this site within a minute." },
  { title: "It goes to you", text: "By text, email and the app, in the language you chose when you signed up." },
  { title: "It is updated", text: "Every notice says when the next update is due, and it comes when it says it will." },
  { title: "It comes down", text: "When it is over, the notice expires and the page goes back to normal." },
];

export default function NewsPage() {
  return (
    <>
      <PageHeader
        title="News"
        intro="Community news most weeks, and urgent notices the moment they are written, on this site and to every family contact by email, text and the app."
        module="alerts"
        photo="/photos/garden-bench.jpg"
        alt="A bench in the walled terrace garden"
      />
      <div className="wrap page-body">
        <Lead title="New this month: six raised beds" photo="/photos/gardening.jpg" alt="Two residents planting at the new raised beds" caption="The courtyard, Thursday 3 September">
          <p>
            The Millbrook Bend Rotary built them at wheelchair height over two Saturdays in August, and the garden club had bulbs in the ground by the first Thursday of September. Family members are welcome to bring gloves.
          </p>
          <p>
            Also this month: the flu clinic on Wednesday 23 September, fish tacos on Fridays, and Grace Mbeki joining as first-floor care coordinator. The full list is below.
          </p>
        </Lead>

        <section aria-labelledby="news-list-h">
          <SectionBar id="news-list-h" title="Community news" />
          <div className="panel">
            <ul className="news">
              {news.map((n) => (
                <li key={n.title}>
                  <time>{n.date}</time>
                  <div>
                    <b>
                      <span className={`kind kind-${n.kind.toLowerCase()}`}>{n.kind}</span>
                      {n.title}
                    </b>
                    <p>{n.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="alerts-h" id="alerts">
          <SectionBar id="alerts-h" title="When something urgent happens" sub="No notices right now" />
          <div className="panel">
            <Steps steps={howNotices} />
          </div>
        </section>

        <section aria-labelledby="signup-h">
          <SectionBar id="signup-h" title="Get notices by text and email" sub="Free for family and friends of residents" />
          <div className="panel">
            <div className="split">
              <SubscribeForm />
              <div className="prose">
                <p>Urgent notices reach you within a minute of being written. Routine news comes as a weekly digest on Fridays. You can choose the language you receive them in and stop at any time.</p>
                <p style={{ margin: 0 }}>We never share contact details, and a resident can ask us to remove any contact from their list.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
      <PageCta />
    </>
  );
}
