import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import { GeoFixes } from "@/components/staff/GeoFixes";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { Badge, Card, Delta, LineChart, Score } from "@/components/staff/ui";
import { ago, siteHref } from "@/data/staff";
import { getStaffCommunity } from "@/data/staff/server";
import { addDays, shortDate, today } from "@/lib/clock";

export const metadata: Metadata = { title: "AI search (GEO)" };

const accTone = { accurate: "good", partly: "warn", wrong: "bad" } as const;
const accLabel = { accurate: "Accurate", partly: "Partly right", wrong: "Wrong" };

export default async function Geo() {
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="AI search (GEO)" />;
  const { s } = sc;
  const { answers, engines, geoTrend, wrongFacts } = s;
  const engineColor = Object.fromEntries(engines.map((e) => [e.k, e.color]));
  const t = today();
  const weeks = geoTrend.map((_, i) => shortDate(addDays(t, (i - 11) * 7)));
  const score = geoTrend[geoTrend.length - 1];
  const prompts = [...new Set(answers.map((a) => a.prompt))];
  const acc = answers.filter((a) => a.accuracy === "accurate").length;
  const rec = answers.filter((a) => a.recommended).length;
  const open = wrongFacts.filter((w) => w.status !== "fixed").length;

  return (
    <>
      <header className="sx-head">
        <div>
          <h1>AI search (GEO)</h1>
          <p>What ChatGPT, Google AI Overviews, Perplexity and Gemini tell families about {s.brand.name}. We ask 48 questions every day and check the answers against the website.</p>
        </div>
        <div className="sx-head-actions">
          <span className="sx-hint">Last checked {ago(60 * 2)}</span>
        </div>
      </header>

      <div className="sx-grid g-12">
        <Card title="AI visibility score" sub={`How often ${s.brand.short} is named, recommended and described correctly (0–100)`}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
            <Score v={score} size={112} label="AI visibility score" />
            <div>
              <Delta v={score - geoTrend[geoTrend.length - 5]} suffix=" pts" label="in 4 weeks" />
              <p className="sx-note" style={{ marginTop: 6 }}>
                Up from {geoTrend[0]} twelve weeks ago, when the live calendar, daily menus and FAQ went up.
              </p>
            </div>
          </div>
          <ul className="sx-list" style={{ marginTop: 10 }}>
            <li><b>{acc} of {answers.length}</b> answers below are fully accurate</li>
            <li><b>{rec} of {answers.length}</b> recommend {s.brand.name}</li>
            <li><b>{open}</b> wrong facts still being corrected</li>
          </ul>
        </Card>
        <Card title="Visibility over time" sub="Weekly score across all four AI engines">
          <LineChart label={`AI visibility score rising from ${geoTrend[0]} to ${score} over 12 weeks`} labels={weeks} series={[{ name: "Score", values: geoTrend, color: "var(--terra-deep)", area: true }]} height={230} every={2} />
        </Card>
      </div>

      <div className="eng-scores">
        {engines.map((e) => (
          <div key={e.k}>
            <Score v={e.score} size={64} label={`${e.k} visibility`} />
            <span>
              <b>{e.k}</b>
              <small>
                <Delta v={e.score - e.prev} suffix=" pts" /> in 12 weeks
              </small>
            </span>
          </div>
        ))}
      </div>

      <Card title="Facts AI is getting wrong, and how we’re fixing them" sub="Each fix is a page on the website that AI engines can read and cite." id="wrong">
        <GeoFixes facts={wrongFacts.map((w) => ({ ...w, when: ago(w.mins), fixHref: siteHref(s.slug, w.fixUrl) }))} />
      </Card>

      <Card title="What AI says about us" sub="Latest answers to the questions families ask most">
        {prompts.map((p) => (
          <div key={p}>
            <h3 className="tour-day" style={{ marginTop: 14 }}>“{p}”</h3>
            {answers
              .filter((a) => a.prompt === p)
              .map((a) => (
                <div className="geo-ans" key={a.engine + p}>
                  <div className="geo-q">
                    <span className="eng" style={{ background: engineColor[a.engine] }}>
                      {a.engine}
                    </span>
                    <Badge tone={accTone[a.accuracy]}>{accLabel[a.accuracy]}</Badge>
                    {a.recommended ? (
                      <Badge tone="good">
                        <Icon name="star" /> {a.position ? `Recommended #${a.position}` : `Names ${s.brand.short}`}
                      </Badge>
                    ) : (
                      <Badge tone="neutral">Not recommended</Badge>
                    )}
                  </div>
                  <blockquote className={`geo-a ${a.accuracy}`}>{a.text}</blockquote>
                  <div className="geo-flags">
                    {a.cites && (
                      <span>
                        <Icon name="link" /> Cites {a.cites}
                      </span>
                    )}
                    {a.competitors.length > 0 && <span>Also mentions: {a.competitors.join("; ")}</span>}
                    <span>Checked {ago(a.mins)}</span>
                  </div>
                </div>
              ))}
          </div>
        ))}
      </Card>
    </>
  );
}
