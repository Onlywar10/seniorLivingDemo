import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { SectionBar } from "@/components/SectionBar";
import { Icon } from "@/components/Icon";
import { Lead, Quote, PageCta } from "@/components/Story";
import { handbook, community } from "@/data/community";

export const metadata: Metadata = { title: "Family handbook" };

export default function HandbookPage() {
  return (
    <>
      <PageHeader
        title="Family handbook"
        intro={`The practical answers for people who love someone here. If it is not on this page, the front desk will know: ${community.phone}, 6 am to 10 pm.`}
        stamp={`Reviewed ${handbook.reviewed}`}
        module="handbook"
        photo="/photos/walking.jpg"
        alt="A resident walking along the garden path with a family member"
      />
      <div className="wrap page-body">
        <Lead title="Visiting is not an appointment" photo="/photos/couch.jpg" alt="A couple laughing together on the sofa in their apartment" caption="A one-bedroom on the courtyard side, Sunday afternoon" flip>
          <p>
            Karen Whitfield comes on Tuesdays after work and stays for the choir. Her brother comes on Saturdays with the dog, who is allowed in the courtyard and knows it. Neither of them books, signs in or rings ahead; they say hello at the front desk and walk through.
          </p>
          <p>
            Everything else on this page works the same way: the answer is usually yes, and the front desk knows the exceptions.
          </p>
        </Lead>

        <section aria-labelledby="topics-h">
          <SectionBar id="topics-h" title="Living here, day to day" />
          <div className="panel">
            <dl className="hb">
              {handbook.topics.map((t) => (
                <div key={t.title}>
                  <dt>{t.title}</dt>
                  <dd>
                    <p>{t.body}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <Quote who="Karen Whitfield" />

        <section aria-labelledby="documents" id="documents">
          <SectionBar id="documents-h" title="Documents" sub="Every file is checked for screen-reader tags before it goes up" />
          <div className="panel">
            <ul className="docs">
              {handbook.documents.map((d) => (
                <li key={d.title}>
                  <a href="#documents">
                    <Icon name="doc" />
                    <span>
                      <b>{d.title}</b>
                      <span>{d.meta}</span>
                    </span>
                    <span className="dl">
                      <Icon name="download" />
                      Download
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
      <PageCta title="Bring the whole family" text="Tours are for everyone who will be visiting. Grandchildren and dogs included." />
    </>
  );
}
