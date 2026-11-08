import type { Metadata } from "next";
import { NotYours } from "@/components/staff/portal/NotYours";
import { sectionsFor } from "@/data/staff/shared";
import { getStaffRole as getRole } from "@/data/staff/server";
import { Icon } from "@/components/Icon";
import { ReportTabs } from "@/components/staff/portal/CalendarTabs";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { Badge, Card, Kpi, PageHead, fmt, pctChange } from "@/components/staff/ui";
import { scorecardMonths } from "@/data/staff";
import { getStaffCommunity } from "@/data/staff/server";

export const metadata: Metadata = { title: "Website and AI search" };

const accTone = { accurate: "good", partly: "warn", wrong: "bad" } as const;
const accLabel = { accurate: "Correct", partly: "Partly correct", wrong: "Wrong" } as const;
const fixTone = { fixed: "good", "in progress": "info", monitoring: "neutral" } as const;
const fixLabel = { fixed: "Fixed", "in progress": "We’re fixing it", monitoring: "Watching" } as const;

/** One summary page: how families find the community on Google and when they ask AI tools. Kinlight does the fixing. */
export default async function SearchPage() {
  const as = await getRole();
  if (!sectionsFor[as].includes("reports")) return <NotYours section="Reports" who={as === "sales" ? "sales" : as === "events" ? "the events team" : "your"} />;
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Website and AI search" />;
  const { s } = sc;
  const m = scorecardMonths();
  const correct = s.answers.filter((a) => a.accuracy === "accurate").length;
  const fixed = s.wrongFacts.filter((w) => w.status === "fixed").length;
  return (
    <>
      <PageHead title="Website and AI search" sub={`How families find ${s.brand.name} on Google, and what AI tools tell them, in ${m.month}. Fixing what AI tools say is Kinlight’s job: here’s what we found and what we fixed.`} />
      <ReportTabs />

      <div className="sx-kpis">
        <Kpi label="Average place on Google" value={s.seo.avgPos.toFixed(1)} note={`for the searches below, ${Math.abs(s.seo.avgPosDelta).toFixed(1)} places ${s.seo.avgPosDelta < 0 ? "higher" : "lower"} than last month`} />
        <Kpi label="People who saw you on Google" value={fmt(s.gbp.views)} delta={pctChange(s.gbp.views, s.gbp.viewsPrev)} note="vs last month" />
        <Kpi label="Calls from Google" value={s.gbp.calls} delta={pctChange(s.gbp.calls, s.gbp.callsPrev)} note={`${s.gbp.rating} stars, ${s.gbp.reviews} reviews`} />
        <Kpi label="AI answers that were correct" value={<>{correct}<small> / {s.answers.length}</small></>} note={`${fixed} wrong facts fixed this month`} />
      </div>

      <div className="sx-grid g-2">
        <Card title="When families search Google" sub="Where you show up for what people type" pad={false}>
          <div className="sx-table-wrap">
            <table className="sx-table">
              <thead><tr><th>Search</th><th className="num">Place</th><th>Since last month</th></tr></thead>
              <tbody>
                {s.rankings.slice(0, 8).map((r) => (
                  <tr key={r.q}>
                    <td><b>{r.q}</b></td>
                    <td className="num"><b>{r.pos}</b></td>
                    <td>{r.change > 0 ? `Up ${r.change}` : r.change < 0 ? `Down ${-r.change}` : "Same"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="When families ask AI tools" sub="What ChatGPT, Google, Perplexity and Gemini said when we asked">
          <ul className="pt-ai">
            {s.answers.slice(0, 6).map((a, i) => (
              <li key={a.engine + i}>
                <span><b>{a.engine}</b> <span className="sx-hint">“{a.prompt}”</span></span>
                <Badge tone={accTone[a.accuracy]}>{accLabel[a.accuracy]}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="What we found and fixed" sub="Wrong facts we found in AI answers, where they came from, and what Kinlight did about them. Nothing for you to do.">
        <ul className="pt-fixes">
          {s.wrongFacts.map((w) => (
            <li key={w.id}>
              <Badge tone={fixTone[w.status]}>{w.status === "fixed" && <Icon name="check" />} {fixLabel[w.status]}</Badge>
              <div>
                <p><b>They said:</b> {w.claim}</p>
                <p><b>The truth:</b> {w.truth}</p>
                <p className="sx-hint">Found in {w.engines.join(" and ")} · came from {w.source}</p>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
