import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { SectionBar } from "@/components/SectionBar";
import { Lead, PageCta } from "@/components/Story";
import { quality, community } from "@/data/community";

export const metadata: Metadata = { title: "State inspection record" };

export default function QualityPage() {
  return (
    <>
      <PageHeader
        title="Our state inspection record"
        intro="Every licensed community in Oregon is surveyed by the state. Here is our full record, including the year we were cited and what we did about it."
        stamp={`Imported from the state register ${quality.imported}`}
        module="quality"
        photo="/photos/entrance.jpg"
        alt="A resident with a walker at the front entrance, greeted by staff"
      />
      <div className="wrap page-body">
        <Lead title="Three days in March" photo="/photos/building-garden.jpg" alt="Larkmoor House from the courtyard garden" caption="The courtyard, March 2026" flip>
          <p>
            Two state surveyors arrived unannounced on Wednesday 18 March and stayed until Friday. They watched a medication round, ate lunch in the dining room, read care plans, checked the fire log, and interviewed fourteen residents on their own, with the door closed. They found nothing to cite.
          </p>
          <p>
            In February 2023 they did find something: three as-needed doses with no initials on the record. Nobody was harmed and the doses had been given, but the paperwork was wrong. We retrained every med aide, added a second daily check by the nurse, and the state verified the fix two weeks later. It is in the table below because it should be.
          </p>
        </Lead>

        <section aria-labelledby="qs-h">
          <SectionBar id="qs-h" title="At a glance" />
          <div className="panel">
            <ul className="q-summary">
              {quality.summary.map((q) => (
                <li key={q.k}>
                  <span className="k">{q.k}</span>
                  <span className={`v ${q.ok ? "ok" : ""}`}>{q.v}</span>
                  <span className="s">{q.s}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="hist-h">
          <SectionBar id="hist-h" title="Survey history" sub="2021 to 2026" />
          <div className="panel">
            <div className="card scroll">
              <table className="hist">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Type</th>
                    <th scope="col">Result</th>
                    <th scope="col">What happened</th>
                    <th scope="col">Corrected</th>
                  </tr>
                </thead>
                <tbody>
                  {quality.history.map((h) => (
                    <tr key={h.date} className={h.ok ? "" : "flag"}>
                      <td>
                        <time>{h.date}</time>
                      </td>
                      <td>{h.type}</td>
                      <td className={h.ok ? "ok" : "cite"}>{h.result}</td>
                      <td>{h.detail}</td>
                      <td>
                        {h.corrected ? (
                          <>
                            <b>{h.corrected}</b>
                            <br />
                            <span className="small muted">{h.correctedDetail}</span>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="src">
              Source: Oregon Department of Human Services, Aging and People with Disabilities, facility licensing register. You can look up licence {community.licence} yourself; if the register and this page ever disagree, the register is right and please tell us.
            </p>
          </div>
        </section>
      </div>
      <PageCta title="Ask us anything about it" text="Marianne is happy to walk through any survey with you on a tour, or over the phone." />
    </>
  );
}
