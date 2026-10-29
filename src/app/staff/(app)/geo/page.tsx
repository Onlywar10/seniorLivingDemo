import type { Metadata } from "next";
import { PageHead, Card, Kpi, LineChart, Badge, Score } from "@/components/staff/ui";
import { Icon } from "@/components/Icon";
import { engines, geoTrend, geoAnswers, wrongFacts, weekTicks, scope } from "@/data/staff";

export const metadata: Metadata = { title: "AI search (GEO)" };

const color = ["var(--c1)", "var(--c3)", "var(--c6)", "var(--c5)"];

export default async function Geo({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const s = scope(c);
  const answers = geoAnswers(c);
  const wrong = wrongFacts(c);
  const adj = s.geo - 72;
  const gain = Math.round(engines.reduce((t, e) => t + geoTrend[e][11] - geoTrend[e][0], 0) / engines.length);
  const mentioned = answers.filter((a) => a.mentioned).length;
  const recommended = answers.filter((a) => a.recommended).length;
  const accurate = answers.filter((a) => a.accurate === "yes").length;
  return (
    <>
      <PageHead title="AI search (GEO)" sub={`${s.label} · what ChatGPT, Google AI Overviews, Perplexity and Gemini tell families. Checked every morning at 5 am.`}>
        <button className="sx-btn" type="button">
          <Icon name="plus" /> Track a question
        </button>
      </PageHead>

      <div className="sx-grid g-12">
        <Card title="AI visibility score" sub="Mentioned, recommended and accurate, across 4 engines">
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <Score v={s.geo} size={120} />
            <div>
              <p style={{ margin: 0 }}>
                <span className="sx-delta up">▲ {gain} points</span> in 12 weeks
              </p>
              <p className="sx-note">Since the calendar, menus, prices and visiting hours were published as structured, dated pages.</p>
            </div>
          </div>
        </Card>
        <div className="sx-kpis">
          <Kpi label="Answers that mention you" value={`${mentioned} of ${answers.length}`} note="tracked family questions" />
          <Kpi label="Answers that recommend you" value={`${recommended} of ${answers.length}`} delta={50} />
          <Kpi label="Accurate and current" value={`${accurate} of ${answers.length}`} note={`${answers.length - accurate} answers have wrong or old facts`} />
          <Kpi label="Families from AI search" value={c ? "4" : "19"} delta={58} note="enquiries this month" />
        </div>
      </div>

      <div className="eng-scores">
        {engines.map((e, i) => {
          const v = geoTrend[e][11] + adj;
          return (
            <div key={e}>
              <Score v={v} size={64} />
              <span>
                <b>{e}</b>
                <small>
                  <span className="sx-delta up">▲ {geoTrend[e][11] - geoTrend[e][7]}</span> in 4 weeks
                </small>
              </span>
              <span style={{ width: 10, height: 10, background: color[i], marginLeft: "auto" }} />
            </div>
          );
        })}
      </div>

      <Card title="Visibility over time" sub="Score by engine, weekly">
        <LineChart labels={weekTicks()} max={100} yFmt={(n) => String(n)} series={engines.map((e, i) => ({ name: e.replace("Google AI Overviews", "AI Overviews"), values: geoTrend[e].map((v) => v + adj), color: color[i] }))} />
      </Card>

      <div className="sx-grid g-2">
        <Card title="What AI is saying" sub="The real answers to questions families ask" action={<Badge tone="info">8 questions tracked</Badge>}>
          {answers.map((a) => (
            <article key={a.engine + a.prompt} className="geo-ans">
              <div className="geo-q">
                <span className={`eng eng-${a.engine.split(" ")[0]}`}>{a.engine}</span>
                <span>“{a.prompt}”</span>
              </div>
              <p className={`geo-a ${a.accurate}`}>{a.answer}</p>
              <div className="geo-flags">
                <Badge tone={a.accurate === "yes" ? "good" : a.accurate === "partly" ? "warn" : "bad"}>{a.accurate === "yes" ? "Accurate" : a.accurate === "partly" ? "Partly accurate" : "Inaccurate"}</Badge>
                <Badge tone={a.current ? "good" : "warn"}>{a.current ? "Current" : "Out of date"}</Badge>
                {a.mentioned && <Badge tone="neutral">Mentioned</Badge>}
                {a.recommended && <Badge tone="accent">★ Recommended</Badge>}
                <span>Sources: {a.cites.join(", ")}</span>
                <span>· {a.checked}</span>
              </div>
            </article>
          ))}
        </Card>
        <Card title="Facts AI is getting wrong" sub="With the fix, ready to go" action={<Badge tone="bad">{wrong.filter((w) => !w.status.startsWith("Fixed")).length} open</Badge>}>
          {wrong.map((w) => (
            <article key={w.claim} className="wrong">
              <div className="geo-q">
                <span className={`eng eng-${w.engine.split(" ")[0]}`}>{w.engine}</span>
                <Badge tone={w.status.startsWith("Fixed") ? "good" : w.status === "Submitted" ? "info" : "warn"}>{w.status}</Badge>
              </div>
              <span className="wrong-claim">
                Says: <s>{w.claim}</s>
              </span>
              <span className="wrong-truth">Actually: {w.truth}</span>
              <span className="sx-note" style={{ margin: 0 }}>
                Where it comes from: {w.source}
              </span>
              <div className="wrong-fix">
                <Icon name="wand" />
                <span>{w.fix}</span>
              </div>
              {!w.status.startsWith("Fixed") && (
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="sx-btn sx-btn-primary" type="button">
                    Apply fix
                  </button>
                  <button className="sx-btn" type="button">
                    Review first
                  </button>
                </div>
              )}
            </article>
          ))}
        </Card>
      </div>
    </>
  );
}
