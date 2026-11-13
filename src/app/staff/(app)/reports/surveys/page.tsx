import type { Metadata } from "next";
import Link from "next/link";
import "@/app/staff/reports.css";
import "@/app/staff/surveys.css";
import { Icon } from "@/components/Icon";
import { ReportTabs } from "@/components/staff/portal/CalendarTabs";
import { Help } from "@/components/staff/portal/Help";
import { NotYours } from "@/components/staff/portal/NotYours";
import { mayOpen } from "@/components/staff/portal/ReportsNav";
import { NotThisReport } from "@/components/staff/portal/ReportsParts";
import { SurveyDownloads } from "@/components/staff/portal/SurveyDownloads";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { Badge, Card, Delta, Kpi, PageHead } from "@/components/staff/ui";
import { communities } from "@/data/communities";
import { sectionAccess } from "@/data/staff/access";
import { getStaffCommunity } from "@/data/staff/server";
import { accessOf } from "@/data/staff/shared";
import { results, surveyById, surveysOf, trend, type Answer, type Survey } from "@/data/staff/surveys";
import { communitySlugs } from "@/lib/sites";

export const metadata: Metadata = { title: "Surveys" };

const fill = (s: string, community: string, event?: string) => s.replace("{community}", community).replace("{event}", event ?? "the event");

/** Every survey's results: response rate, each question's average, the recommend score, results by group (only where
 *  5 or more answered), the trend over each send, and themes from written answers, each linked to its answers. */
export default async function SurveyResultsPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { as, access } = await sectionAccess("reports");
  if (!access) return <NotYours section="Reports" />;
  if (!mayOpen(access, "surveys")) return <NotThisReport title="Surveys" access={access} />;
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Surveys" />;
  const { s, c } = sc;
  const list = surveysOf(s.slug).filter((x) => x.answered > 0);
  const id = (await searchParams).id;
  const sv: Survey = (id && list.find((x) => x.id === id)) || list[0];
  const r = results(sv);
  const tr = trend(sv);
  const prev = sv.history[sv.history.length - 1];
  const npsQ = r.qs.find((x) => x.nps);
  const canSurveys = !!accessOf(as, "surveys");
  const ev = sv.event;
  const textQs = sv.questions.filter((q) => q.type === "text");
  const written = (a: Answer) => Object.entries(a.answers).filter(([k]) => textQs.some((x) => x.id === k)).map(([, v]) => String(v)).join(" ");
  // The same template, side by side across communities.
  const across = access === "full"
    ? communitySlugs.map((slug) => { const x = surveyById(slug, sv.id); return x && x.answered ? { name: communities[slug].site.name, rate: results(x).rate, avg: results(x).avg } : null; }).filter((x): x is { name: string; rate: number; avg: number } => !!x)
    : [];
  const head = ["Answered", "Group", "How", "Language", ...(sv.anonymous ? [] : ["Name"]), ...sv.questions.map((q) => fill(q.text.en, c.site.name, ev))];
  const rows = sv.answers.map((a) => [a.at, a.group, a.channel, a.lang, ...(sv.anonymous ? [] : [a.who ?? ""]), ...sv.questions.map((q) => { const v = a.answers[q.id]; return Array.isArray(v) ? v.join("; ") : v === undefined ? "" : String(v); })]);

  return (
    <>
      <PageHead title="Surveys" sub={`${s.brand.name}: every survey’s results`}>
        <Help label="Where results go" align="end"><p>The family and resident satisfaction surveys are the monthly scorecard’s survey evidence. Results are built only from real answers, and a group is never shown with fewer than 5 answers.</p></Help>
        {canSurveys && <Link href="/staff/surveys" className="sx-btn"><Icon name="list" /> Surveys</Link>}
      </PageHead>
      <ReportTabs access={access} />
      <nav className="su-pick" aria-label="Survey">
        {list.map((x) => <Link key={x.id} href={`/staff/reports/surveys?id=${x.id}`} className={`su-pick-l${x.id === sv.id ? " on" : ""}`} aria-current={x.id === sv.id ? "page" : undefined}>{x.title}</Link>)}
      </nav>

      <div className="su-res-h">
        <div>
          <h2>{sv.title}{ev && sv.status === "automatic" ? `: ${ev}` : ""}</h2>
          <p className="sx-hint">{sv.goesTo}{sv.sentLabel ? ` · sent ${sv.sentLabel}` : ""}{sv.anonymous ? " · anonymous" : " · named"}</p>
        </div>
        <span className="su-res-a">{(sv.id === "family" || sv.id === "resident") && <Badge tone="info">On the scorecard</Badge>}<SurveyDownloads name={`${s.brand.name} ${sv.title}`} head={head} rows={rows} /></span>
      </div>

      {r.hidden ? (
        <p className="pt-empty"><Icon name="lock" /> Fewer than 5 answers so far. An anonymous survey shows nothing until 5 people have answered.</p>
      ) : (
        <>
          <div className="sx-kpis">
            <Kpi label="Replied" value={`${r.rate}%`} delta={prev ? r.rate - Math.round((prev.answered / prev.sent) * 100) : undefined} deltaSuffix=" pts" note={`${sv.answered} of ${sv.sendsTo}`} />
            {r.avg > 0 && <Kpi label="Average, 1 to 5" value={r.avg.toFixed(1)} delta={tr.length > 1 ? Number((tr[tr.length - 1].avg - tr[tr.length - 2].avg).toFixed(1)) : undefined} deltaSuffix="" note={tr.length > 1 ? `since ${tr[tr.length - 2].label.split(" · ")[0]}` : undefined} />}
            {npsQ?.nps && <Kpi label="Would recommend" value={npsQ.nps.score > 0 ? `+${npsQ.nps.score}` : String(npsQ.nps.score)} note={`${npsQ.avg?.toFixed(1)} out of 10 · ${npsQ.nps.promoters} would, ${npsQ.nps.detractors} wouldn’t`} />}
            <Kpi label="Needed a person" value={String(r.flagged.length)} note="concerns, care flags and thank-yous" />
          </div>

          <div className="sx-grid g-21">
            <Card title="Each question" sub={prev ? `With what changed since ${prev.label.split(" · ")[0]}` : undefined} action={<Help label="About these numbers" align="end"><p>Averages are out of 5. Yes or no shows the share who said yes. “Only ask if…” questions count only the people they were asked.</p></Help>}>
              <ul className="su-qres">
                {r.qs.map((x) => {
                  const before = prev?.perQ[x.q.id];
                  return (
                    <li key={x.q.id}>
                      <p><b>{fill(x.q.text.en, c.site.name, ev)}</b>{x.q.onlyIf && <small> (only if {x.q.onlyIf.in.join(" or ")})</small>}</p>
                      {x.q.type === "rating" && x.avg !== undefined && <div className="su-bar"><span><i style={{ width: `${(x.avg / 5) * 100}%` }} /></span><b>{x.avg.toFixed(1)}</b>{before !== undefined && <Delta v={Number((x.avg - before).toFixed(1))} suffix="" />}<small>{x.n} answered</small></div>}
                      {x.q.type === "nps" && x.nps && <div className="su-bar"><span><i style={{ width: `${((x.avg ?? 0) / 10) * 100}%` }} /></span><b>{x.avg?.toFixed(1)}</b>{before !== undefined && <Delta v={Number(((x.avg ?? 0) - before).toFixed(1))} suffix="" />}<small>out of 10 · score {x.nps.score > 0 ? "+" : ""}{x.nps.score}</small></div>}
                      {x.yes !== undefined && <div className="su-bar"><span><i style={{ width: `${x.yes}%` }} /></span><b>{x.yes}% yes</b>{before !== undefined && <Delta v={x.yes - before} suffix=" pts" />}<small>{x.n} answered</small></div>}
                      {x.options && <ul className="su-opt-res">{x.options.map((o) => <li key={o.label}><span>{o.label}</span><span className="su-bar-s"><i style={{ width: `${(o.n / Math.max(1, x.n)) * 100}%` }} /></span><b>{o.n}</b></li>)}</ul>}
                      {x.texts && <small>{x.texts.length} written answers</small>}
                    </li>
                  );
                })}
              </ul>
            </Card>
            <div className="sx-grid">
              {tr.length > 1 && (
                <Card title="Over each send" sub={`${tr[0].avg.toFixed(1)} → ${tr[tr.length - 1].avg.toFixed(1)} since ${tr[0].label.split(" ")[0]}`}>
                  <ol className="su-trend">
                    {tr.map((t) => <li key={t.label}><span>{t.label}</span><span className="su-bar-s"><i style={{ width: `${(t.avg / 5) * 100}%` }} /></span><b>{t.avg.toFixed(1)}</b><small>{t.rate}% replied</small></li>)}
                  </ol>
                </Card>
              )}
              <Card title="By group" action={<Help label="About groups" align="end"><p>A group shows only when 5 or more people in it answered, so nobody can be picked out.</p></Help>}>
                <ul className="su-groups">
                  {sv.byGroup.map((g) => {
                    const ans = sv.answers.filter((a) => a.group === g.label);
                    const vs = ans.flatMap((a) => sv.questions.filter((q) => q.type === "rating").map((q) => Number(a.answers[q.id]))).filter((v) => v > 0);
                    const avg = vs.length ? vs.reduce((m, v) => m + v, 0) / vs.length : 0;
                    return g.answered < 5
                      ? <li key={g.label}><span>{g.label}</span><small>Fewer than 5 answered: hidden</small></li>
                      : <li key={g.label}><span>{g.label}</span><span className="su-g-bar"><i style={{ width: `${(g.answered / Math.max(1, g.sent)) * 100}%` }} /></span><b>{avg ? avg.toFixed(1) : g.answered}</b><small>{g.answered} answered</small></li>;
                  })}
                </ul>
              </Card>
              {across.length > 1 && (
                <Card title="All communities" sub={`${sv.templateName ?? sv.title}, the same template`}>
                  <ul className="su-groups">{across.map((x) => <li key={x.name}><span>{x.name}</span><span className="su-g-bar"><i style={{ width: `${x.rate}%` }} /></span><b>{x.avg ? x.avg.toFixed(1) : "–"}</b><small>{x.rate}% replied</small></li>)}</ul>
                </Card>
              )}
            </div>
          </div>

          {r.themes.length > 0 && (
            <Card title="What people wrote" sub="Grouped by what they mention. Each theme opens to the answers behind it." action={<Help label="About themes" align="end"><p>Kinlight groups written answers by what they mention. Nothing is invented: every theme links to its answers, translated into English with the original kept.{sv.anonymous ? " This survey is anonymous: no names." : ""}</p></Help>}>
              <ul className="su-themes">
                {r.themes.map((t) => (
                  <li key={t.name}>
                    <p><b>{t.name}:</b> {t.n} mentions{t.mostly ? `, mostly ${t.mostly}` : ""}</p>
                    <ul className="su-quotes">{t.quotes.map((q) => <li key={q.id}>“{written(q)}”{!sv.anonymous && q.who && <small> · {q.who.split(" ")[0]}, {q.rel?.toLowerCase()}</small>}</li>)}</ul>
                    <details>
                      <summary>All {t.n} answers</summary>
                      <ul className="su-quotes">{sv.answers.filter((a) => t.ids.includes(a.id)).map((a) => <li key={a.id}>“{written(a)}”{a.original && <small> ({a.lang}: “{a.original}”)</small>}{!sv.anonymous && a.who && <small> · {a.who}</small>}</li>)}</ul>
                    </details>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {r.flagged.length > 0 && (
            <Card title="Flagged" sub="Answers that needed a person">
              <ul className="sx-list su-flags">
                {r.flagged.map((a) => (
                  <li key={a.id}>
                    <Badge tone={a.flag!.kind === "concern" ? "warn" : a.flag!.kind === "care" ? "bad" : "good"}>{a.flag!.kind === "concern" ? "Concern" : a.flag!.kind === "care" ? "Care: flag only" : "Thank-you"}</Badge>
                    <p>{a.flag!.kind === "care" ? "A health question about a resident. Passed to the care team; not shown or kept here." : `“${written(a)}”`}</p>
                    <small>{sv.anonymous || a.flag!.kind === "care" ? "Anonymous here" : a.who} · {a.flag!.note}</small>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </>
  );
}
