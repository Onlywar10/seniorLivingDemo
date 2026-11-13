"use client";

// One survey while it runs: how many have answered (by group), the reminder schedule, and the actions: send a
// reminder now, extend the closing date, close early. The approval card (with the same "Preview as" the builder has),
// paper answers scanned in by photo, and reading it aloud with a resident. Changes stay in this browser.
import Link from "next/link";
import { useState } from "react";
import type { L } from "@/data/staff/autoText";
import type { Question } from "@/data/staff/surveyKit";
import { Icon } from "../../Icon";
import { SurveyRunner } from "../../survey/SurveyRunner";
import { say } from "../store";
import { useSurveyActions, useSurveys } from "../surveyStore";
import { Badge, Card } from "../ui";
import { Drawer } from "./Drawer";
import { Help } from "./Help";
import { PrintedSurvey, SurveyPreview, type PreviewPeople } from "./SurveyPreview";

export interface DeskSurvey {
  id: string; title: string; status: string; anonymous: boolean; questions: Question[]; topic: L; thankYou: L; closesLabel?: string; event?: string;
  ownerName: string; audienceLabel: string; goesTo: string; sentLabel?: string; reminderNote: string; whenLine: string;
  sendsTo: number; answered: number; byGroup: { label: string; sent: number; answered: number }[];
  ways: string[]; approval?: { by: string; to: string; at: string }; approvedNote?: string; started: string; goal?: string;
}

export function SurveyDesk({ sv, admin, canManage, me, community, phone, domain, people, links, residents, flagged }: {
  sv: DeskSurvey; admin: boolean; canManage: boolean; me: string; community: string; phone: string; domain: string; people: PreviewPeople;
  links: { who: string; note: string; href: string }[]; residents: { name: string; lantern: boolean }[];
  flagged: { kind: string; note: string; text: string; who?: string }[];
}) {
  const st = useSurveys();
  const act = useSurveyActions();
  const p = st.patches[sv.id] ?? {};
  const status = p.status ?? sv.status;
  const added = p.added ?? { paper: 0, aloud: 0 };
  const answered = sv.answered + added.paper + added.aloud;
  const rate = sv.sendsTo ? Math.round((answered / sv.sendsTo) * 100) : 0;
  const [preview, setPreview] = useState(false);
  const [extend, setExtend] = useState(false);
  const [closing, setClosing] = useState(false);
  const [paper, setPaper] = useState(false);
  const [aloud, setAloud] = useState(false);
  const [print, setPrint] = useState(false);
  const open = status === "open";
  const waiting = status === "waiting";
  const hideGroups = sv.anonymous;
  return (
    <div className="su-desk">
      {waiting && (
        <section className="sx-card su-approve" aria-labelledby="su-ap-h">
          <div>
            <h2 id="su-ap-h"><Icon name="clock" /> Waiting for {sv.approval?.to.split(" ")[0]} to approve</h2>
            <p>{sv.approval?.by} wrote it {sv.started === "write" ? `with “Write it for me” (“${sv.goal}”)` : ""} · {sv.approval?.at}. It goes to the approver once; after that it sends on its own.</p>
            <p className="sx-hint">{sv.goesTo} · {sv.whenLine} · {sv.questions.length} questions{sv.anonymous ? " · anonymous" : ""}</p>
          </div>
          <div className="su-approve-a">
            <button type="button" className="sx-btn" onClick={() => setPreview(true)}><Icon name="eye" /> Preview as…</button>
            {admin ? (
              <>
                <button type="button" className="sx-btn sx-btn-primary" onClick={() => { act.patch(sv.id, { status: "open", approvedBy: me, log: [`Approved by ${me}`] }); say(`Approved. “${sv.title}” sends at 10:00 am, by the sending rules in Automations. ${sv.approval?.by.split(" ")[0]} has been told.`); }}><Icon name="check" /> Approve</button>
                <button type="button" className="sx-btn sx-btn-quiet" onClick={() => { act.patch(sv.id, { status: "draft", log: [`Sent back by ${me}`] }); say(`Sent back to ${sv.approval?.by.split(" ")[0]} as a draft.`); }}>Send back</button>
              </>
            ) : <span className="sx-hint">Only {sv.approval?.to.split(" ")[0]} can approve it.</span>}
          </div>
        </section>
      )}

      <div className="sx-kpis su-kpis">
        <div className="sx-kpi"><span className="sx-kpi-l">Answered</span><span className="sx-kpi-v">{status === "waiting" || status === "draft" ? "–" : `${rate}%`}</span><span className="sx-kpi-n">{answered} of {sv.sendsTo}</span></div>
        <div className="sx-kpi"><span className="sx-kpi-l">Status</span><span className="sx-kpi-v su-kpi-s">{status === "open" ? "Open" : status === "closed" ? "Closed" : status === "repeating" ? "Repeats" : status === "automatic" ? "On its own" : status === "waiting" ? "To approve" : "Draft"}</span><span className="sx-kpi-n">{p.closesLabel ? `Now closes ${p.closesLabel}` : sv.closesLabel ? `Closes ${sv.closesLabel}` : sv.whenLine}</span></div>
        <div className="sx-kpi"><span className="sx-kpi-l">Reminder</span><span className="sx-kpi-v su-kpi-s">{p.reminders ? "Sent again" : "Scheduled"}</span><span className="sx-kpi-n">{p.reminders ? `${p.reminders} sent by hand today` : sv.reminderNote}</span></div>
        <div className="sx-kpi"><span className="sx-kpi-l">How people answer</span><span className="sx-kpi-v su-kpi-s">{sv.ways.join(", ")}</span><span className="sx-kpi-n">{added.paper ? `${added.paper} paper added` : ""}{added.paper && added.aloud ? " · " : ""}{added.aloud ? `${added.aloud} read aloud added` : ""}</span></div>
      </div>

      {canManage && (
        <div className="su-actions">
          <button type="button" className="sx-btn" onClick={() => setPreview(true)}><Icon name="eye" /> Preview as…</button>
          {open && <button type="button" className="sx-btn" onClick={() => { act.patch(sv.id, { reminders: (p.reminders ?? 0) + 1, log: [`Reminder sent by ${me}`] }); say(`Reminder sent to the ${Math.max(0, sv.sendsTo - answered)} who haven’t answered. Quiet hours and the 3-a-day limit still apply; it’s in the Automations log.`); }}><Icon name="bell" /> Send a reminder now</button>}
          {open && <button type="button" className="sx-btn" onClick={() => setExtend(true)}><Icon name="calendar" /> Extend the closing date</button>}
          {open && <button type="button" className="sx-btn sx-btn-quiet" onClick={() => setClosing(true)}>Close early</button>}
          <button type="button" className="sx-btn" onClick={() => setPrint(true)}><Icon name="printer" /> Printed copy</button>
          {sv.ways.includes("Paper") && <button type="button" className="sx-btn" onClick={() => setPaper(true)}><Icon name="image" /> Add paper answers</button>}
          <button type="button" className="sx-btn" onClick={() => setAloud(true)}><Icon name="users" /> Read it aloud</button>
          <Link className="sx-btn sx-btn-quiet" href={`/staff/reports/surveys?id=${sv.id}`}><Icon name="chart" /> Results</Link>
        </div>
      )}

      <div className="sx-grid g-2">
        <Card title="Answered so far, by group" action={<Help label="About groups" align="end"><p>{sv.anonymous ? "An anonymous survey only shows a group once 5 or more people in it have answered, so nobody can be identified." : "Counts only. Answers are in Reports."}</p></Help>}>
          <ul className="su-groups">
            {sv.byGroup.map((g) => (hideGroups && g.answered < 5 ? (
              <li key={g.label}><span>{g.label}</span><small>Fewer than 5: hidden to keep it anonymous</small></li>
            ) : (
              <li key={g.label}><span>{g.label}</span><span className="su-g-bar" aria-hidden="true"><i style={{ width: `${Math.min(100, (g.answered / Math.max(1, g.sent)) * 100)}%` }} /></span><b>{g.answered}</b><small>of {g.sent}</small></li>
            )))}
            {!sv.byGroup.length && <li className="sx-hint">No answers yet.</li>}
            {added.paper + added.aloud > 0 && <li><span>Added here</span><span /><b>{added.paper + added.aloud}</b><small>paper and read aloud</small></li>}
          </ul>
        </Card>
        <Card title="Answers that need a person" action={<Help label="What happens to these" align="end"><p>A concern in a named survey becomes a Feedback item with an owner straight away. In an anonymous survey it stays anonymous and is only flagged here and in the results. Health and care answers go to the care team as a flag only: nothing is kept here as a care record. Thank-yous that name staff go to them.</p></Help>}>
          <ul className="sx-list su-flags">
            {flagged.map((f, i) => (
              <li key={i}>
                <Badge tone={f.kind === "concern" ? "warn" : f.kind === "care" ? "bad" : "good"}>{f.kind === "concern" ? "Concern" : f.kind === "care" ? "Care: flag only" : "Thank-you"}</Badge>
                <p>{f.kind === "care" ? "A health question about a resident." : `“${f.text}”`}</p>
                <small>{f.who ?? "Anonymous"} · {f.note}</small>
              </li>
            ))}
            {!flagged.length && <li className="sx-hint">Nothing so far.</li>}
          </ul>
          {flagged.some((f) => f.kind === "concern" && f.who) && <Link className="sx-link" href="/staff/feedback#concerns">Open in Feedback <Icon name="right" /></Link>}
        </Card>
      </div>

      {links.length > 0 && (
        <Card title="Open the survey page as someone would" sub="Real personal links: no login, in their language" action={<Help label="About these links" align="end"><p>Each invitation carries a link like these. It knows who it’s for, or is anonymous if the survey is, and picks up where they stopped. Closed or already-answered links say so politely.</p></Help>}>
          <ul className="su-links">{links.map((l) => <li key={l.href}><a className="sx-link" href={l.href} target="_blank" rel="noopener">{l.who}</a> <small>{l.note}</small></li>)}</ul>
        </Card>
      )}

      {preview && <SurveyPreview sv={{ id: sv.id, title: sv.title, questions: sv.questions, topic: sv.topic, anonymous: sv.anonymous, thankYou: sv.thankYou, closesLabel: sv.closesLabel, event: sv.event }} community={community} phone={phone} domain={domain} people={people} me={me} onClose={() => setPreview(false)} />}
      {extend && <ExtendForm onClose={() => setExtend(false)} onSave={(d) => { act.patch(sv.id, { closesLabel: d, log: [`Closing date moved to ${d} by ${me}`] }); setExtend(false); say(`It now closes ${d}. Anyone who hasn’t answered can still use their link.`); }} />}
      {closing && (
        <Drawer title="Close it early?" sub={`${answered} of ${sv.sendsTo} have answered.`} onClose={() => setClosing(false)}
          foot={<div className="pt-act"><button type="button" className="sx-btn sx-btn-terra" onClick={() => { act.patch(sv.id, { status: "closed", log: [`Closed early by ${me}`] }); setClosing(false); say("Closed. Links now say so politely, and the results are final in Reports."); }}>Close it now</button><button type="button" className="sx-btn" onClick={() => setClosing(false)}>Keep it open</button></div>}>
          <p>Anyone who opens their link after this sees a polite note that it has closed. The reminder won’t go.</p>
        </Drawer>
      )}
      {print && (
        <Drawer title="Printed copy" sub="Large print, for the front desk and anyone who prefers paper" onClose={() => setPrint(false)} wide foot={<div className="pt-act"><button type="button" className="sx-btn sx-btn-primary" onClick={() => window.print()}><Icon name="printer" /> Print</button></div>}>
          <PrintedSurvey sv={{ id: sv.id, title: sv.title, questions: sv.questions, topic: sv.topic, anonymous: sv.anonymous, thankYou: sv.thankYou, closesLabel: sv.closesLabel, event: sv.event }} community={community} phone={phone} seed={sv.id} />
        </Drawer>
      )}
      {paper && <PaperScan sv={sv} onClose={() => setPaper(false)} onAdd={(n) => { act.patch(sv.id, { added: { ...added, paper: added.paper + n }, log: [`${n} paper answers added by ${me}`] }); setPaper(false); say(`${n} paper ${n === 1 ? "answer" : "answers"} added, marked “Paper”. They join the results like any other.`); }} />}
      {aloud && <ReadAloud sv={sv} residents={residents} community={community} phone={phone} onClose={() => setAloud(false)} onDone={(who) => { act.patch(sv.id, { added: { ...added, aloud: added.aloud + 1 }, log: [`Read aloud with ${who} by ${me}`] }); say(`Saved${sv.anonymous ? "" : ` for ${who}`}, marked “Read aloud”.`); }} />}
    </div>
  );
}

function ExtendForm({ onClose, onSave }: { onClose: () => void; onSave: (d: string) => void }) {
  const t = new Date();
  const opts = [3, 5, 7, 14].map((n) => { const d = new Date(t.getTime() + n * 864e5); return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }); });
  const [d, setD] = useState(opts[2]);
  return (
    <Drawer title="Extend the closing date" onClose={onClose} foot={<div className="pt-act"><button type="button" className="sx-btn sx-btn-primary" onClick={() => onSave(d)}>Save</button><button type="button" className="sx-btn" onClick={onClose}>Cancel</button></div>}>
      <div className="sx-form"><label>Close it on<select value={d} onChange={(e) => setD(e.target.value)}>{opts.map((o) => <option key={o}>{o}</option>)}</select></label><p className="sx-hint">Nobody is messaged about the new date. The reminder keeps its own schedule.</p></div>
    </Drawer>
  );
}

/** Scanning paper answers in by photo: what Kinlight read, next to the photo, asking only about what was unclear. */
function PaperScan({ sv, onClose, onAdd }: { sv: DeskSurvey; onClose: () => void; onAdd: (n: number) => void }) {
  const [page, setPage] = useState(0);
  const [unclear, setUnclear] = useState<"" | "3" | "4">("");
  const [hand, setHand] = useState("The fish was dry on Tuesday.");
  const [files, setFiles] = useState<string[]>([]);
  const dining = sv.questions.some((q) => q.id === "food");
  const pages = [
    { reads: dining ? [["How was the food?", "4 · Good", "clear"], ["How was the service?", "3 or 4?", "unclear"], ["Which meal do you usually come to?", "Dinner", "clear"], ["What would you like to see more of?", "Fish, Soups", "clear"], ["Anything else about dining?", hand, "hand"]] : sv.questions.slice(0, 4).map((q, i) => [q.text.en, i === 1 ? "3 or 4?" : "4 · Good", i === 1 ? "unclear" : "clear"]) },
    { reads: dining ? [["How was the food?", "5 · Excellent", "clear"], ["How was the service?", "5 · Excellent", "clear"], ["Which meal do you usually come to?", "Lunch", "clear"], ["What would you like to see more of?", "Vegetarian dishes", "clear"], ["Anything else about dining?", "(left blank)", "clear"]] : sv.questions.slice(0, 4).map((q) => [q.text.en, "5 · Excellent", "clear"]) },
  ];
  const ready = !!unclear;
  return (
    <Drawer title="Add paper answers" sub="Photograph completed copies; Kinlight reads the ticks and handwriting" onClose={onClose} wide
      foot={<div className="pt-act"><button type="button" className="sx-btn sx-btn-primary" disabled={!ready} onClick={() => onAdd(pages.length)}><Icon name="check" /> Add {pages.length} answers, marked “Paper”</button><button type="button" className="sx-btn" onClick={onClose}>Cancel</button></div>}>
      <div className="su-scan">
        <label className="sx-btn su-upload"><Icon name="upload" /> Photograph pages<input type="file" accept="image/*" capture="environment" multiple className="vh" onChange={(e) => { const fs = [...(e.target.files ?? [])].map((f) => f.name); setFiles(fs); }} /></label>
        {files.length > 0 && <p className="sx-callout info"><Icon name="info" /> <span>{files.length} photos chosen. In this demo, Kinlight’s reading is shown with the sample pages below.</span></p>}
        <div className="sx-seg" role="group" aria-label="Page">{pages.map((_, i) => <button key={i} type="button" aria-pressed={page === i} onClick={() => setPage(i)}>Page {i + 1}{i === 0 && !ready ? " · 1 to check" : ""}</button>)}</div>
        <div className="su-scan-g">
          <PaperPhoto dining={dining} page={page} sv={sv} />
          <div>
            <h3>What Kinlight read <Badge tone="info">Sample</Badge></h3>
            <ul className="su-read">
              {pages[page].reads.map(([q, a, kind]) => (
                <li key={q} className={kind}>
                  <span>{q}</span>
                  {kind === "unclear" ? (
                    <span className="su-unclear">
                      <b>A smudged tick between 3 and 4. Which was it?</b>
                      <span className="sx-seg" role="group" aria-label="Which answer">{(["3", "4"] as const).map((v) => <button key={v} type="button" aria-pressed={unclear === v} onClick={() => setUnclear(v)}>{v === "3" ? "3 · Okay" : "4 · Good"}</button>)}</span>
                    </span>
                  ) : kind === "hand" ? (
                    <label className="su-hand"><small>Handwriting, as read. Fix anything that’s wrong:</small><input className="sx-input" value={hand} onChange={(e) => setHand(e.target.value)} /></label>
                  ) : <b><Icon name="check" /> {a}</b>}
                </li>
              ))}
            </ul>
            <p className="sx-hint">Only the unclear answer needs you. Everything else joins the results as read, marked “Paper”.</p>
          </div>
        </div>
      </div>
    </Drawer>
  );
}

/** A photographed paper copy (the sample): slightly askew, ticks in pen, one smudged. */
function PaperPhoto({ dining, page, sv }: { dining: boolean; page: number; sv: DeskSurvey }) {
  const qs = dining ? ["How was the food?", "How was the service?", "Which meal do you usually come to?", "What would you like to see more of?", "Anything else about dining?"] : sv.questions.slice(0, 4).map((q) => q.text.en);
  const ticks = page === 0 ? [3, -1, 2] : [4, 4, 1];
  return (
    <figure className="su-photo" aria-label={`Photo of a completed paper survey, page ${page + 1}`}>
      <svg viewBox="0 0 300 390" role="img" aria-hidden="true">
        <defs><filter id="su-shadow"><feDropShadow dx="2" dy="4" stdDeviation="5" floodOpacity="0.25" /></filter></defs>
        <rect x="0" y="0" width="300" height="390" fill="#7c6a55" />
        <g transform="rotate(-2.5 150 195)" filter="url(#su-shadow)">
          <rect x="22" y="18" width="256" height="350" fill="#fbfaf5" />
          <text x="36" y="44" fontSize="9" fontWeight="700" fill="#33495a">{dining ? "DINING EXPERIENCE" : sv.title.toUpperCase()}</text>
          <rect x="230" y="28" width="34" height="34" fill="none" stroke="#222" strokeWidth="2" />
          <rect x="236" y="34" width="8" height="8" fill="#222" /><rect x="250" y="34" width="8" height="8" fill="#222" /><rect x="236" y="48" width="8" height="8" fill="#222" />
          {qs.map((q, i) => {
            const y = 78 + i * 56;
            const isText = i === qs.length - 1 && dining;
            return (
              <g key={q}>
                <text x="36" y={y} fontSize="8.5" fill="#26343c">{i + 1}. {q}</text>
                {isText ? (
                  <>
                    <line x1="36" y1={y + 22} x2="262" y2={y + 22} stroke="#bbb" />
                    <line x1="36" y1={y + 38} x2="262" y2={y + 38} stroke="#bbb" />
                    {page === 0 && <text x="40" y={y + 19} fontSize="11" fill="#1d3f8a" fontFamily="'Segoe Script','Bradley Hand',cursive" transform={`rotate(-1 40 ${y + 19})`}>The fish was dry on Tuesday.</text>}
                  </>
                ) : (
                  [0, 1, 2, 3, 4].map((k) => (
                    <g key={k}>
                      <rect x={40 + k * 44} y={y + 10} width="11" height="11" fill="none" stroke="#555" />
                      <text x={54 + k * 44} y={y + 19} fontSize="7" fill="#555">{k + 1}</text>
                      {ticks[i] === k && <path d={`M${41 + k * 44} ${y + 15} l4 5 l8 -10`} stroke="#1d3f8a" strokeWidth="2" fill="none" />}
                      {ticks[i] === -1 && (k === 2 || k === 3) && <path d={`M${k === 2 ? 46 + k * 44 : 38 + k * 44} ${y + 16} l4 4 l7 -9`} stroke="#1d3f8a" strokeWidth="2" fill="none" opacity="0.55" />}
                    </g>
                  ))
                )}
              </g>
            );
          })}
          {page === 0 && <ellipse cx="160" cy="146" rx="26" ry="9" fill="#1d3f8a" opacity="0.12" />}
        </g>
      </svg>
      <figcaption>Page {page + 1} of 2, photographed at the front desk</figcaption>
    </figure>
  );
}

/** Reading it aloud: staff open the same survey page, go through it with a resident, and tap their answers. */
function ReadAloud({ sv, residents, community, phone, onClose, onDone }: { sv: DeskSurvey; residents: { name: string; lantern: boolean }[]; community: string; phone: string; onClose: () => void; onDone: (who: string) => void }) {
  const [who, setWho] = useState("");
  const r = residents.find((x) => x.name === who);
  return (
    <Drawer title="Read it aloud" sub="Go through it together and tap their answers. Saved as “Read aloud”." onClose={onClose} wide>
      <div className="su-aloud">
        <label className="sx-lbl">With
          <select className="sx-input" value={who} onChange={(e) => setWho(e.target.value)}>
            <option value="">Choose a resident</option>
            <optgroup label="Lantern">{residents.filter((x) => x.lantern).map((x) => <option key={x.name}>{x.name}</option>)}</optgroup>
            <optgroup label="Residents">{residents.filter((x) => !x.lantern).map((x) => <option key={x.name}>{x.name}</option>)}</optgroup>
          </select>
        </label>
        {r?.lantern && <p className="sx-callout info"><Icon name="heart" /> <span>Lantern: take your time, read each question slowly, and point to the faces. If {who.split(" ")[0]} can’t answer today, stop: nothing is saved, and the survey can go to their legal representative instead.</span></p>}
        {sv.anonymous && who && <p className="sx-hint">This survey is anonymous: their answers are saved without their name.</p>}
        {who && <div className="su-phone-frame wide"><SurveyRunner key={who} title={sv.event ? `${sv.title}: ${sv.event}` : sv.title} community={community} phone={phone} questions={sv.questions} lang="en" anonymous={sv.anonymous} thankYou={sv.thankYou.en.replace("{community}", community)} vars={{ event: sv.event ?? "" }} mode="aloud" onFinish={() => onDone(who)} /></div>}
      </div>
    </Drawer>
  );
}
