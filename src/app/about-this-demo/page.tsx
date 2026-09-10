import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { SectionBar } from "@/components/SectionBar";
import { LaneTag } from "@/components/ModuleLabel";
import { modules } from "@/data/community";

export const metadata: Metadata = { title: "About this demonstration" };

const order = ["daily-life", "care-team", "costs", "quality", "handbook", "alerts"] as const;

export default function AboutDemoPage() {
  return (
    <>
      <PageHeader
        title="About this demonstration"
        intro="Larkmoor House is fictional. Every name, number, price and date on this site was written for this demonstration; the phone numbers are 555 numbers. The structure is the point."
      />
      <div className="wrap page-body">
        <section aria-labelledby="arg-h">
          <SectionBar id="arg-h" title="The argument" />
          <div className="panel prose">
            <p>
              Almost every senior living website is a brochure: a hero photograph, a promise of a “robust activity calendar”, and a lead form. The real information, what happens on a Tuesday, who works there, what it costs, what the state found, is either in a PDF, on a resident-built site on another domain, or not published at all.
            </p>
            <p>
              This site argues that in senior living <b>the information is the sales asset</b>. A real, dated calendar is un-fakeable: a community with thin programming cannot publish one. A stock photo is a promise; this week’s schedule is evidence. So the home page is a short pitch built from this week’s real content, and every section exits to the full record or to a tour rather than to a form.
            </p>
            <p style={{ margin: 0 }}>
              The publishing model is borrowed from school district websites, which already publish calendars, menus, staff directories, documents and alerts continuously to a community that belongs to them. It is adapted here as six content modules, each with a different owner inside the building and its own publishing lane. That ownership split is why this needs a governed platform, not a website builder.
            </p>
          </div>
        </section>

        <section aria-labelledby="look-h">
          <SectionBar id="look-h" title="What to look for" />
          <div className="panel prose">
            <ol style={{ paddingLeft: "1.4em", display: "grid", gap: 8 }}>
              <li>
                <b>Switch on the module structure</b> by pressing Ctrl+Shift+M on any page, or by adding <code>?structure=on</code> to the address (and <code>?structure=off</code> to clear it). Every section on every page is labelled with its module, its editor, the content type underneath and whether it publishes immediately or needs approval.
              </li>
              <li>
                <b>Start at the group site</b> on the home page: the operator with a location finder and the standards every home shares. Only Larkmoor House has a full community site; the other five homes are listed and reachable by phone, and their web addresses return a not-found page.
              </li>
              <li>
                <b>Read the calendar.</b> Real times, named rooms, this week’s dates. This is the module that cannot be faked.
              </li>
              <li>
                <b>Find the 2023 citation</b> in the <Link href="/larkmoor-house/inspection-record">inspection record</Link>, corrected in 14 days. An all-clean history reads as marketing; a small problem fixed quickly is what makes the clean years credible.
              </li>
              <li>
                <b>Notice what is missing:</b> no lead form on the home page. Every button leads to a tour or to a full record; the only form on the site is on the tour page, where a real community would put it.
              </li>
            </ol>
          </div>
        </section>

        <section aria-labelledby="mods-h">
          <SectionBar id="mods-h" title="The six modules and who owns them" />
          <div className="panel">
            <div className="card scroll">
              <table className="mod-table">
                <thead>
                  <tr>
                    <th scope="col">Module</th>
                    <th scope="col">Owner inside the building</th>
                    <th scope="col">Content types</th>
                    <th scope="col">Lane</th>
                  </tr>
                </thead>
                <tbody>
                  {order.map((k) => {
                    const m = modules[k];
                    return (
                      <tr key={k}>
                        <td>
                          {m.number} · {m.name}
                        </td>
                        <td>{m.editor}</td>
                        <td>{m.contentType}</td>
                        <td>
                          <LaneTag lane={m.lane} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="panel-foot">
              <span>Accessibility is a product requirement, not a style choice: see the <Link href="/accessibility">accessibility statement</Link>, which is also where the platform’s school-district origin shows.</span>
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
