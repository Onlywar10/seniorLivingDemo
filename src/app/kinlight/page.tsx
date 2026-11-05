import type { PromiseStatus } from "@/data/staff/alpha";
import { ACCEPTANCE, ADOPTION, ONBOARDING, PROMISES, orgs, replyLeft, switchDate, tickets, wrenhavenAnswers, type KCommunity } from "./data";

const mark: Record<PromiseStatus, { sym: string; cls: string }> = {
  Kept: { sym: "✓", cls: "ok" },
  "At risk": { sym: "!", cls: "warn" },
  Missed: { sym: "✕", cls: "bad" },
  "Not due yet": { sym: "·", cls: "na" },
};

function Status({ s }: { s: PromiseStatus }) {
  const m = mark[s];
  return (
    <span className={`kl-dot ${m.cls}`} title={s}>
      <span aria-hidden="true">{m.sym}</span>
      <span className="kl-sr">{s}</span>
    </span>
  );
}

const stage = (c: KCommunity) => (c.day >= 0 ? `Day ${c.day} of 90` : `Go-live in ${-c.day} days`);
const kept = (c: KCommunity) => c.promises.filter((p) => p === "Kept").length;
const due = (c: KCommunity) => c.promises.filter((p) => p !== "Not due yet").length;

function outlook(c: KCommunity) {
  if (c.day < 0) return { text: "Free months start at go-live", cls: "na" };
  if (c.promises.includes("Missed")) return { text: "A promise was missed: nothing owed", cls: "bad" };
  const price = c.plan === "Full" ? "$649" : "$349";
  if (c.promises.includes("At risk")) return { text: `At risk; on track for ${price}/mo`, cls: "warn" };
  return { text: `On track: ${price}/mo from month 4`, cls: "ok" };
}

export default function KinlightPage() {
  const all = orgs();
  const comms = all.flatMap((o) => o.communities.map((c) => ({ ...c, org: o.name, fictional: o.fictional })));
  const live = comms.filter((c) => c.day >= 0);
  const onboarding = comms.filter((c) => c.day < 0);
  const promisesDue = live.reduce((n, c) => n + due(c), 0);
  const promisesKept = live.reduce((n, c) => n + kept(c), 0);
  const tix = tickets();
  const open = tix.filter((t) => t.status === "Open");
  const aiErrors = live.reduce((n, c) => n + c.ai.errors, 0);
  const minUp = Math.min(...live.map((c) => c.uptime));
  const answers = wrenhavenAnswers();

  return (
    <main className="kl-main">
      <section className="kl-hero">
        <div>
          <p className="kl-eyebrow">Alpha · what we watch across every pilot</p>
          <h1>Is every promise being kept, at every community?</h1>
          <p className="kl-lede">
            {all.length} organisations, {comms.length} communities. Wrenhaven Senior Living’s two communities use their real records; the other organisations are fictional examples.
          </p>
        </div>
        <aside className="kl-offer">
          <b>The offer</b>
          <p>3 months free. If every promise was kept, 9 more months at $649 per community per month (Website-only $349). If a promise is missed, they owe nothing.</p>
        </aside>
      </section>

      <section className="kl-kpis" aria-label="Summary">
        <div>
          <span>Communities</span>
          <b>{comms.length}</b>
          <small>
            {live.length} live · {onboarding.length} onboarding
          </small>
        </div>
        <div>
          <span>Promises kept so far</span>
          <b>
            {promisesKept}/{promisesDue}
          </b>
          <small>{live.filter((c) => c.promises.some((p) => p === "At risk" || p === "Missed")).length} communities need attention</small>
        </div>
        <div>
          <span>Support waiting on us</span>
          <b>{open.length}</b>
          <small>Reply within 2 business days</small>
        </div>
        <div>
          <span>AI-answer errors open</span>
          <b>{aiErrors}</b>
          <small>ChatGPT, Gemini, Google AI</small>
        </div>
        <div>
          <span>Lowest uptime, 30 days</span>
          <b>{minUp.toFixed(2)}%</b>
          <small>Promise: 99.5%</small>
        </div>
      </section>

      <section className="kl-sec" id="pilots">
        <h2>Pilot organisations and communities</h2>
        <div className="kl-orgs">
          {all.map((o) => (
            <article className="kl-card" key={o.name}>
              <header className="kl-card-h">
                <div>
                  <h3>{o.name}</h3>
                  <p>
                    {o.region} · {o.communities.length} {o.communities.length === 1 ? "community" : "communities"}
                  </p>
                </div>
                {o.fictional ? <span className="kl-tag">Fictional example</span> : <span className="kl-tag real">Real records</span>}
              </header>
              <div className="kl-scroll">
                <table className="kl-table">
                  <thead>
                    <tr>
                      <th>Community</th>
                      <th>Plan</th>
                      <th>Stage</th>
                      <th>Promises</th>
                      <th>If the alpha ended today</th>
                    </tr>
                  </thead>
                  <tbody>
                    {o.communities.map((c) => {
                      const out = outlook(c);
                      return (
                        <tr key={c.name}>
                          <td>
                            <b>{c.name}</b>
                            <small>{c.city}</small>
                          </td>
                          <td className="kl-nowrap">{c.plan}</td>
                          <td className="kl-nowrap">
                            {stage(c)}
                            {c.day >= 0 && <span className="kl-bar" style={{ ["--p" as string]: `${Math.min(100, (c.day / 90) * 100)}%` }} aria-hidden="true" />}
                          </td>
                          <td className="kl-nowrap">{c.day >= 0 ? `${kept(c)} of ${due(c)} kept` : "Not started"}</td>
                          <td>
                            <span className={`kl-pill ${out.cls}`}>{out.text}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="kl-sec" id="onboarding">
        <h2>Onboarding: the first 30 days</h2>
        <p className="kl-sub">Build beside the old site, load content and contacts, register texting, train staff, take baselines, then switch the domain. The switch is day 0 of the 90-day alpha.</p>
        <div className="kl-stack">
          <div className="kl-card">
            <div className="kl-scroll">
              <table className="kl-table kl-steps">
                <thead>
                  <tr>
                    <th>Community</th>
                    {ONBOARDING.map((s, i) => (
                      <th key={s} title={s}>
                        <span className="kl-th-n">{i + 1}</span>
                        <span className="kl-th-t">{s}</span>
                      </th>
                    ))}
                    <th>Acceptance list</th>
                  </tr>
                </thead>
                <tbody>
                  {[...onboarding, ...live.slice().sort((a, b) => a.day - b.day)].map((c) => (
                    <tr key={c.name}>
                      <td>
                        <b>{c.name}</b>
                        <small>{c.day < 0 ? c.blocker : `Switched ${switchDate(c.day)}`}</small>
                      </td>
                      {ONBOARDING.map((s, i) => (
                        <td key={s} className="kl-c">
                          <span className={`kl-dot ${i < c.onboarded ? "ok" : i === c.onboarded ? "warn" : "na"}`}>
                            <span aria-hidden="true">{i < c.onboarded ? "✓" : i === c.onboarded ? "…" : "·"}</span>
                            <span className="kl-sr">{i < c.onboarded ? "Done" : i === c.onboarded ? "In progress" : "Not started"}</span>
                          </span>
                        </td>
                      ))}
                      <td className="kl-nowrap">{c.signed ? (<>Signed by {c.signed.by}<small>{c.signed.date}</small></>) : "Not yet"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="kl-card kl-pad">
            <h3>The signed acceptance list</h3>
            <p className="kl-sub">Signed by the community’s Executive Director at go-live. D1 counts as kept only when every line is checked within 30 days.</p>
            <ol className="kl-accept">
              {ACCEPTANCE.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="kl-sec" id="promises">
        <h2>The 11 promises, per community</h2>
        <p className="kl-sub">
          <Status s="Kept" /> kept · <Status s="At risk" /> at risk · <Status s="Missed" /> missed · <Status s="Not due yet" /> not due yet
        </p>
        <div className="kl-card">
          <div className="kl-scroll">
            <table className="kl-table kl-matrix">
              <thead>
                <tr>
                  <th>Community</th>
                  <th>Day</th>
                  {PROMISES.map((p) => (
                    <th key={p.code} title={p.name}>
                      {p.code}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {live.map((c) => (
                  <tr key={c.name}>
                    <td>
                      <b>{c.name}</b>
                      <small>{c.org}</small>
                    </td>
                    <td>{c.day}/90</td>
                    {c.promises.map((p, i) => (
                      <td key={i} className="kl-c">
                        <Status s={p} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <ul className="kl-notes">
          {live
            .filter((c) => c.promiseNote)
            .map((c) => (
              <li key={c.name}>
                <b>{c.name}.</b> {c.promiseNote}
              </li>
            ))}
        </ul>
        <details className="kl-key">
          <summary>What each promise means</summary>
          <ol>
            {PROMISES.map((p) => (
              <li key={p.code}>
                <b>{p.code}</b> {p.name}
              </li>
            ))}
          </ol>
        </details>

        <h3 className="kl-h3">Adoption measures (tracked, not promised)</h3>
        <div className="kl-card">
          <div className="kl-scroll">
            <table className="kl-table kl-matrix">
              <thead>
                <tr>
                  <th>Community</th>
                  {ADOPTION.map((a) => (
                    <th key={a.code} title={a.name}>
                      {a.code}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {live.map((c) => (
                  <tr key={c.name}>
                    <td>
                      <b>{c.name}</b>
                    </td>
                    {c.adoption.map((ok, i) => (
                      <td key={i} className="kl-c">
                        <Status s={ok ? "Kept" : "At risk"} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="kl-sub">
          {ADOPTION.map((a) => `${a.code} ${a.name}`).join(" · ")}
        </p>
      </section>

      <section className="kl-sec" id="support">
        <h2>Support and feedback</h2>
        <p className="kl-sub">From the feedback button in every staff screen, email and champion calls. We reply within 2 business days.</p>
        <div className="kl-grid2">
          <div className="kl-card">
            <div className="kl-scroll">
              <table className="kl-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>From</th>
                    <th>Status</th>
                    <th>Reply due</th>
                  </tr>
                </thead>
                <tbody>
                  {tix.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <b>{t.text}</b>
                        <small>
                          {t.id} · {t.kind} · {t.hoursAgo < 24 ? `${t.hoursAgo} h ago` : `${Math.round(t.hoursAgo / 24)} days ago`}
                        </small>
                      </td>
                      <td>
                        {t.from}
                        <small>
                          {t.org} · {t.community}
                        </small>
                      </td>
                      <td>
                        <span className={`kl-pill ${t.status === "Open" ? "warn" : "ok"}`}>{t.status}</span>
                      </td>
                      <td>{t.status === "Open" ? `${replyLeft(t.hoursAgo)} business hours left` : "Answered"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="kl-card kl-pad">
            <h3>Champion calls, every 2 weeks</h3>
            <ul className="kl-calls">
              {all.map((o) => (
                <li key={o.name}>
                  <b>{o.name}</b>
                  <span>
                    with {o.champion} · next in {o.nextCall} {o.nextCall === 1 ? "day" : "days"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="kl-sec" id="ai">
        <h2>AI-answer monitoring</h2>
        <p className="kl-sub">What ChatGPT, Gemini and Google’s AI answers say about each community, checked weekly. Errors are flagged and corrected at the source; the monthly report goes to the community (D9).</p>
        <div className="kl-card">
          <div className="kl-scroll">
            <table className="kl-table">
              <thead>
                <tr>
                  <th>Community</th>
                  <th>ChatGPT</th>
                  <th>Gemini</th>
                  <th>Google AI</th>
                  <th>Errors open</th>
                </tr>
              </thead>
              <tbody>
                {live.map((c) => (
                  <tr key={c.name}>
                    <td>
                      <b>{c.name}</b>
                      {c.ai.latest && <small>Latest: {c.ai.latest}</small>}
                    </td>
                    <td>{c.ai.chatgpt}</td>
                    <td>{c.ai.gemini}</td>
                    <td>{c.ai.google}</td>
                    <td>
                      <span className={`kl-pill ${c.ai.errors ? "warn" : "ok"}`}>{c.ai.errors ? `${c.ai.errors} flagged` : "None"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="kl-grid2">
          {answers.map((a) => (
            <div className="kl-card kl-pad" key={a.name}>
              <h3>{a.name}: wrong answers found</h3>
              <ul className="kl-wrong">
                {a.wrong.map((w) => (
                  <li key={w.claim}>
                    <span className={`kl-pill ${w.status === "fixed" ? "ok" : "warn"}`}>{w.status}</span>
                    <b>{w.claim}</b>
                    <small>
                      Truth: {w.truth} · {w.engines}
                    </small>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="kl-sub">Scores are visibility out of 100: how often the community is named, and named correctly, for its key questions.</p>
      </section>

      <section className="kl-sec" id="uptime">
        <h2>Uptime and speed</h2>
        <p className="kl-sub">Promise D10: 99.5% or better. Checked every minute from three regions.</p>
        <div className="kl-card">
          <div className="kl-scroll">
            <table className="kl-table">
              <thead>
                <tr>
                  <th>Community</th>
                  <th>Uptime, 30 days</th>
                  <th>Response p50</th>
                  <th>Response p95</th>
                  <th>Incidents</th>
                </tr>
              </thead>
              <tbody>
                {live.map((c) => (
                  <tr key={c.name}>
                    <td>
                      <b>{c.name}</b>
                    </td>
                    <td>
                      <span className={`kl-pill ${c.uptime >= 99.5 ? "ok" : "bad"}`}>{c.uptime.toFixed(2)}%</span>
                    </td>
                    <td>{c.p50} ms</td>
                    <td>{c.p95} ms</td>
                    <td>{c.incidents || "None"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="kl-sec" id="moves">
        <h2>Site wizard and site moves</h2>
        <p className="kl-sub">Every old page address is crawled and redirected before the switch, and the new site is scanned for accessibility (D2).</p>
        <div className="kl-card">
          <div className="kl-scroll">
            <table className="kl-table">
              <thead>
                <tr>
                  <th>Community</th>
                  <th>Moving from</th>
                  <th>Redirects</th>
                  <th>Broken</th>
                  <th>Accessibility scan</th>
                  <th>Domain</th>
                </tr>
              </thead>
              <tbody>
                {[...onboarding, ...live].map((c) => (
                  <tr key={c.name}>
                    <td>
                      <b>{c.name}</b>
                    </td>
                    <td>{c.move.from}</td>
                    <td>
                      {c.move.redirects} of {c.move.total}
                    </td>
                    <td>{c.move.broken}</td>
                    <td>
                      <span className={`kl-pill ${c.move.a11y === "Passed" ? "ok" : c.move.a11y === "Scheduled" ? "na" : "warn"}`}>{c.move.a11y}</span>
                    </td>
                    <td>{c.day >= 0 ? `Switched ${switchDate(c.day)}` : `Switch in ${-c.day} days`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <footer className="kl-foot">Kinlight · internal team view · alpha cohort</footer>
    </main>
  );
}
