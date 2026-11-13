"use client";

// Automations: everything Kinlight sends by itself, in one place. A calm line about the week; "How Kinlight sends"
// (quiet hours, the daily limit, the pause switch for a bad day); every automation grouped by what it's for, each
// with its switch, a preview in three languages, a test to yourself and its wording; the log of what went out; what
// went wrong; what's due in the next 24 hours; and the record of every change. Changes stay in this browser.
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import type { AutoView, ChangeRecord, Problem, Upcoming, WeekSummary } from "@/data/staff/automations";
import { GROUPS, MSG_LANGS, STATUS_LABEL, dayOf, fillIn, placeholdersIn, smsCount, whenOf, type LogRow, type MsgLang, type Status } from "@/data/staff/autoText";
import type { StaffRole } from "@/data/staff/shared";
import { Icon } from "../../Icon";
import { DEFAULT_RULES, useAuto, useAutoActions, type AutoState } from "../autoStore";
import { FamilyLink, ResidentLink } from "../ResidentLink";
import { say } from "../store";
import { Badge, XIcon, fmt } from "../ui";
import { LogLines } from "./AutoLog";
import { Drawer } from "./Drawer";
import { Help } from "./Help";

export type DeskTab = "list" | "log" | "problems" | "next" | "changes";
const first = (n = "") => n.split(" ")[0];
const hm = (min: number) => { const h = Math.floor(min / 60) % 24, m = min % 60; return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`; };
const inQuiet = (min: number, from: number, to: number) => { const m = ((min % 1440) + 1440) % 1440; return from > to ? m >= from || m < to : m >= from && m < to; };

interface Props {
  tab: DeskTab;
  filter: { auto?: string; person?: string; status?: string };
  me: string; as: StaffRole; admin: boolean; approver: string; community: string;
  list: AutoView[]; rows: LogRow[]; summary: WeekSummary; problems: Problem[]; upcoming: Upcoming[]; history: ChangeRecord[];
  todayIso: string; now: number;
}

export function AutomationsDesk(p: Props) {
  const [tab, setTab] = useState<DeskTab>(p.tab);
  const st = useAuto();
  const act = useAutoActions(p.me);
  const names = useMemo(() => Object.fromEntries(p.list.map((a) => [a.id, a.name])), [p.list]);
  const open = p.problems.filter((x) => !st.done[x.id]).length;
  const go = (t: DeskTab) => {
    setTab(t);
    try { const u = new URL(window.location.href); u.searchParams.set("tab", t); window.history.replaceState(null, "", u); } catch { /* the tab still changes */ }
  };
  const [preview, setPreview] = useState<AutoView | null>(null);

  return (
    <div className="au">
      <Summary s={p.summary} admin={p.admin} community={p.community} />
      {st.pause && <PausedBanner pause={st.pause} admin={p.admin} onResume={() => { const before = act.snapshot(); act.resume(); say("Everything is sending again. Anything held during the pause goes out now, inside quiet hours rules.", () => act.restore(before)); }} />}
      <nav className="sx-tabs au-tabs" aria-label="Automations">
        {([["list", "Automations"], ["log", "Log"], ["problems", "Problems"], ["next", "Next 24 hours"], ["changes", "Changes"]] as [DeskTab, string][]).map(([k, l]) => (
          <button key={k} type="button" aria-current={tab === k ? "page" : undefined} onClick={() => go(k)}>
            {l}
            {k === "problems" && open > 0 && <span className="au-tab-n">{open}<span className="vh"> to look at</span></span>}
          </button>
        ))}
      </nav>
      {tab === "list" && <ListTab {...p} st={st} act={act} onPreview={setPreview} />}
      {tab === "log" && <LogTab {...p} names={names} />}
      {tab === "problems" && <ProblemsTab {...p} st={st} act={act} names={names} />}
      {tab === "next" && <NextTab {...p} st={st} act={act} names={names} onPreview={(id) => setPreview(p.list.find((a) => a.id === id) ?? null)} />}
      {tab === "changes" && <ChangesTab history={p.history} fresh={st.changes} names={names} />}
      {preview && <Preview a={preview} st={st} onClose={() => setPreview(null)} />}
    </div>
  );
}

/* ------------------------------------------------------------ the week, in one line */

function Summary({ s, admin, community }: { s: WeekSummary; admin: boolean; community: string }) {
  const max = Math.max(...s.days.map((d) => d.n), 1);
  return (
    <section className="sx-card au-sum" aria-label="This week">
      <div className="au-sum-h">
        <p>
          <b>This week{admin ? "" : ", yours"}:</b> {fmt(s.total)} automatic messages · {s.deliveredPct}% delivered · {s.failed} failed · {s.optedOut} opted out · {s.handled} replies handled
        </p>
        <Help label="About these numbers" align="end">
          <p>Every message {community} sent without anyone pressing send, in the last 7 days: reminders, invites, confirmations, the morning menu and replies to clear answers.</p>
          <p>“Delivered” counts texts the phone company confirmed and emails that reached the inbox. “Replies handled” are clear answers (YES, a number) Kinlight acted on. Anything else waits for a person in Communications.</p>
          <p>Posts, the newsletter and announcements aren’t counted here: they’re in Post and Newsletter.</p>
        </Help>
      </div>
      <ol className="au-days" aria-label="Messages each day">
        {s.days.map((d) => (
          <li key={d.label}>
            <span className="au-day-l">{d.label}</span>
            <span className="au-day-bar" aria-hidden="true"><i style={{ height: `${Math.max(8, (d.n / max) * 100)}%` }} /></span>
            <b>{fmt(d.n)}</b>
            <small>{d.failed ? `${d.failed} failed` : "all arrived"}</small>
          </li>
        ))}
      </ol>
    </section>
  );
}

function PausedBanner({ pause, admin, onResume }: { pause: NonNullable<AutoState["pause"]>; admin: boolean; onResume: () => void }) {
  return (
    <div className="sx-callout au-paused" role="status">
      <XIcon name="pause" />
      <p><b>Paused by {first(pause.by)} at {pause.at}, until {pause.until}.</b> “{pause.reason}” Reminders, invites and news wait; anything due is sent after the pause, or dropped if it’s out of date. Urgent notices, STOP and HELP, and answers to people who just wrote still send.</p>
      {admin && <button type="button" className="sx-btn sx-btn-sm" onClick={onResume}>Resume now</button>}
    </div>
  );
}

/* ------------------------------------------------------------ the list */

type Act = ReturnType<typeof useAutoActions>;

function ListTab({ list, st, act, admin, as, approver, onPreview }: Props & { st: AutoState; act: Act; onPreview: (a: AutoView) => void }) {
  const [off, setOff] = useState<AutoView | null>(null);
  const [edit, setEdit] = useState<AutoView | null>(null);
  const groups = GROUPS.map((g) => ({ g, items: list.filter((a) => a.group === g.k) })).filter((x) => x.items.length);
  const isOn = (a: AutoView) => !!a.locked || !st.off[a.id];
  const can = (a: AutoView) => !a.locked && (admin || a.owner === as);
  const onCount = list.filter(isOn).length;
  return (
    <>
      <Rules admin={admin} st={st} act={act} />
      <p className="au-count">{onCount} of {list.length} on. Each one only reaches people who chose that kind of message, in their own language and their own way.</p>
      {groups.map(({ g, items }) => (
        <section key={g.k} className="au-group" aria-labelledby={`au-g-${g.k}`}>
          <header>
            <h2 id={`au-g-${g.k}`}>{g.label}</h2>
            <p>{g.note}</p>
          </header>
          <ul>
            {items.map((a) => (
              <AutoCard
                key={a.id} a={a} on={isOn(a)} can={can(a)} admin={admin} st={st} paused={!!st.pause && a.group !== "emergency" && a.group !== "required"}
                onSwitch={(v) => {
                  if (!v) { setOff(a); return; }
                  const before = act.snapshot();
                  act.turnOn(a.id);
                  say(`${a.name} is on again. Recorded.`, () => act.restore(before));
                }}
                onPreview={() => onPreview(a)}
                onTest={() => say(`Test sent to you ${a.channel === "Email" ? "by email" : a.channel === "Text" ? "by text" : "by text and email"}, in English, marked TEST. It isn’t counted or logged.`)}
                onEdit={() => setEdit(a)}
                onApprove={() => { act.approveWording(a.id); say(`New wording approved. “${a.name}” sends with it from now on, translated for each family.`); }}
                onSendBack={() => { act.dropWording(a.id); say(`Sent back to ${first(st.wording[a.id]?.by)}. The current wording keeps sending.`); }}
              />
            ))}
          </ul>
        </section>
      ))}
      {off && <TurnOff a={off} onClose={() => setOff(null)} onConfirm={(reason) => { const before = act.snapshot(); act.turnOff(off.id, reason); setOff(null); say(`${off.name} is off. Recorded with your reason.`, () => act.restore(before)); }} />}
      {edit && <EditWording a={edit} current={st.wording[edit.id]?.text ?? edit.text.en} admin={admin} approver={approver} onClose={() => setEdit(null)} onSave={(text) => { act.saveWording(edit.id, text, admin, first(approver)); setEdit(null); say(admin ? `Saved. “${edit.name}” sends with the new wording from now on.` : `Sent to ${first(approver)} to approve, once. Until then the current wording keeps sending.`); }} />}
      <p className="sx-hint au-foot">Kinlight only sends facts from the calendar, menus, bookings and records. It never adds anything about health, care or bills: those go to a person.</p>
    </>
  );
}

function Channel({ c }: { c: AutoView["channel"] }) {
  return (
    <span className="au-chs">
      {c !== "Email" && <span><Icon name="sms" /> Text</span>}
      {c !== "Text" && <span><Icon name="mail" /> Email</span>}
    </span>
  );
}

function AutoCard({ a, on, can, admin, st, paused, onSwitch, onPreview, onTest, onEdit, onApprove, onSendBack }: {
  a: AutoView; on: boolean; can: boolean; admin: boolean; st: AutoState; paused: boolean;
  onSwitch: (v: boolean) => void; onPreview: () => void; onTest: () => void; onEdit: () => void; onApprove: () => void; onSendBack: () => void;
}) {
  const off = st.off[a.id];
  const w = st.wording[a.id];
  const wording = w?.status === "approved" ? `Wording changed by ${first(w.by)} · approved by ${first(w.approvedBy)}, ${w.approvedAt}` : a.wording;
  return (
    <li className={`sx-card au-card${on ? "" : " off"}`}>
      <div className="au-card-main">
        <h3>{a.name}</h3>
        <p className="au-fires">{a.fires}</p>
        <dl className="au-facts">
          <div><dt>Who</dt><dd>{a.who}</dd></div>
          <div><dt>How</dt><dd><Channel c={a.channel} /></dd></div>
          <div><dt>When</dt><dd>{a.when}<small>{a.quiet}</small></dd></div>
          <div><dt>Last 7 days</dt><dd>{a.week ? `${fmt(a.week)} sent` : "None this week"}</dd></div>
        </dl>
        <p className="au-state">
          {on ? (
            paused ? <><Badge tone="warn"><XIcon name="pause" /> Paused</Badge> Waiting until the pause ends</> : <><Badge tone="good"><Icon name="check" /> On</Badge> {a.reach.charAt(0).toUpperCase() + a.reach.slice(1)}</>
          ) : (
            <><Badge tone="neutral">Off</Badge> Turned off by {first(off?.by)}, {off?.at}: “{off?.reason}”</>
          )}
        </p>
        {wording && <p className="au-wording"><Icon name="edit" /> {wording}</p>}
        {w?.status === "waiting" && (
          <div className="au-waiting">
            <p><Icon name="clock" /> New wording from {first(w.by)} is waiting for approval. The current wording keeps sending until then.</p>
            <blockquote>{w.text}</blockquote>
            {admin && (
              <span className="au-acts">
                <button type="button" className="sx-btn sx-btn-primary sx-btn-sm" onClick={onApprove}><Icon name="check" /> Approve wording</button>
                <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={onSendBack}>Send back</button>
              </span>
            )}
          </div>
        )}
        <div className="au-acts">
          <button type="button" className="sx-btn sx-btn-sm" onClick={onPreview}><Icon name="eye" /> Preview</button>
          <button type="button" className="sx-btn sx-btn-sm" onClick={onTest}><Icon name="send" /> Send me a test</button>
          {can && <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={onEdit}><Icon name="edit" /> Change wording</button>}
          {a.links?.map((l) => <Link key={l.href} className="sx-link au-link" href={l.href}>{l.label} <Icon name="right" /></Link>)}
        </div>
        {admin && <p className="sx-hint au-owner">Owner: {a.ownerName}</p>}
      </div>
      <div className="au-switch">
        {a.locked ? (
          <span className="au-lock" title={a.locked === "law" ? "Required by law" : "Always on: safety"}>
            <XIcon name="lock" />
            <span>{a.locked === "law" ? "Required by law" : "Always on: safety"}</span>
          </span>
        ) : (
          <label className="sx-switch">
            <input type="checkbox" checked={on} disabled={!can} onChange={(e) => onSwitch(e.target.checked)} aria-label={`${a.name}: ${on ? "on" : "off"}`} />
            <span className="au-switch-l">{on ? "On" : "Off"}</span>
          </label>
        )}
      </div>
    </li>
  );
}

function TurnOff({ a, onClose, onConfirm }: { a: AutoView; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  return (
    <Drawer title={`Turn off “${a.name}”?`} sub="Nothing else changes. You can turn it back on any time." onClose={onClose}
      foot={<div className="pt-act"><button type="button" className="sx-btn sx-btn-terra" disabled={!reason.trim()} onClick={() => onConfirm(reason.trim())}>Turn off anyway</button><button type="button" className="sx-btn" onClick={onClose}>Keep it on</button></div>}>
      <div className="sx-form">
        <p className="sx-callout"><Icon name="alert" /> <span><b>What will happen:</b> {a.impact}</span></p>
        <p className="sx-hint">Last 7 days it sent {fmt(a.week)} {a.week === 1 ? "message" : "messages"}. People’s own choices stay as they are, so turning it on again picks up where it left off.</p>
        <label>Why are you turning it off? <span className="sx-hint">A short reason, kept in the record with your name.</span>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="The menu board is down; we’ll text swaps by hand today" maxLength={200} autoFocus />
        </label>
      </div>
    </Drawer>
  );
}

/* ------------------------------------------------------------ how Kinlight sends */

function Rules({ admin, st, act }: { admin: boolean; st: AutoState; act: Act }) {
  const r = st.rules ?? DEFAULT_RULES;
  const [draft, setDraft] = useState(r);
  const [pausing, setPausing] = useState(false);
  const dirty = draft.quietFrom !== r.quietFrom || draft.quietTo !== r.quietTo || draft.perDay !== r.perDay;
  const hours = Array.from({ length: 24 }, (_, h) => h * 60);
  return (
    <section className="sx-card au-rules" aria-labelledby="au-rules-h">
      <header className="sx-card-head">
        <div>
          <h2 id="au-rules-h">How Kinlight sends</h2>
          <p>Rules for every automation{admin ? "" : ". Set by the administrator"}</p>
        </div>
        <Help label="About these rules" align="end">
          <p>These apply to every automation at once. Quiet hours and the daily limit never hold back an urgent notice, a STOP or HELP answer, or an answer to someone who just wrote to us.</p>
          <p>Combining: if someone would get a fourth text in a day, the extra ones go together in one (“Two things from the community: …”).</p>
        </Help>
      </header>
      <ul className="au-rule-list">
        <li>
          <Icon name="clock" />
          <span>
            <b>Quiet hours:</b> no texts from{" "}
            {admin ? (
              <>
                <select aria-label="Quiet hours start" value={draft.quietFrom} onChange={(e) => setDraft({ ...draft, quietFrom: +e.target.value })}>{hours.filter((h) => h >= 18 * 60).map((h) => <option key={h} value={h}>{hm(h)}</option>)}</select>
                {" "}to{" "}
                <select aria-label="Quiet hours end" value={draft.quietTo} onChange={(e) => setDraft({ ...draft, quietTo: +e.target.value })}>{hours.filter((h) => h >= 6 * 60 && h <= 10 * 60).map((h) => <option key={h} value={h}>{hm(h)}</option>)}</select>
              </>
            ) : <>{hm(r.quietFrom)} to {hm(r.quietTo)}</>}
            , except emergencies and answers to someone who just wrote. Anything due then waits until {hm(draft.quietTo)}.
          </span>
        </li>
        <li>
          <Icon name="sms" />
          <span>
            <b>No more than</b>{" "}
            {admin ? (
              <select aria-label="Texts a day per person" value={draft.perDay} onChange={(e) => setDraft({ ...draft, perDay: +e.target.value })}>{[2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}</select>
            ) : r.perDay}{" "}
            <b>texts a day per person.</b> Extra ones are combined into one (“Two things for tomorrow: …”).
          </span>
        </li>
        <li><Icon name="translate" /><span><b>Each person’s language and way of hearing from us</b> are always used. <Badge tone="neutral">Always</Badge></span></li>
        <li><Icon name="heart" /><span><b>Lantern residents are never texted for requests.</b> Those go to “Ask in person” or the legal representative. <Badge tone="neutral">Always</Badge></span></li>
        <li><Icon name="lock" /><span><b>Health, billing and care are never answered automatically.</b> Those go to staff. <Badge tone="neutral">Always</Badge></span></li>
      </ul>
      <div className="au-rules-foot">
        {admin ? (
          <>
            {dirty && <button type="button" className="sx-btn sx-btn-primary sx-btn-sm" onClick={() => { act.setRules(draft, `Quiet hours ${hm(draft.quietFrom)} to ${hm(draft.quietTo)}; ${draft.perDay} texts a day per person`); say("Saved. Every automation follows the new rules. Recorded."); }}><Icon name="check" /> Save rules</button>}
            {st.pause ? (
              <span className="sx-hint">Paused until {st.pause.until}.</span>
            ) : (
              <button type="button" className="sx-btn sx-btn-sm au-pause-btn" onClick={() => setPausing(true)}><XIcon name="pause" /> Pause all non-urgent automations</button>
            )}
            <Help label="About pausing" align="end"><p>For a bad day: a power cut, a death in the community. Reminders, invites and news stop until the time you set. Urgent notices, STOP and HELP, and answers to people who just wrote still go.</p></Help>
          </>
        ) : (
          <span className="sx-hint">Only the administrator can change these, or pause everything for a bad day.</span>
        )}
      </div>
      {pausing && <PauseForm onClose={() => setPausing(false)} onPause={(reason, until) => { const before = act.snapshot(); act.pause(reason, until); setPausing(false); say(`Paused until ${until}. Recorded with your reason.`, () => act.restore(before)); }} />}
    </section>
  );
}

function PauseForm({ onClose, onPause }: { onClose: () => void; onPause: (reason: string, until: string) => void }) {
  const [reason, setReason] = useState("");
  const options = ["8:00 am tomorrow", "Noon tomorrow", "The end of tomorrow", "8:00 am in two days"];
  const [until, setUntil] = useState(options[0]);
  return (
    <Drawer title="Pause all non-urgent automations" sub="For a bad day. Urgent notices still send." onClose={onClose}
      foot={<div className="pt-act"><button type="button" className="sx-btn sx-btn-terra" disabled={!reason.trim()} onClick={() => onPause(reason.trim(), until)}><XIcon name="pause" /> Pause</button><button type="button" className="sx-btn" onClick={onClose}>Cancel</button></div>}>
      <div className="sx-form">
        <p className="sx-callout info"><Icon name="info" /> <span>Reminders, invites, news and confirmations wait. Urgent notices, STOP and HELP, and answers to someone who just wrote keep going.</span></p>
        <label>Why? <span className="sx-hint">Kept in the record, and shown to anyone who opens Automations.</span>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Power cut; the lifts are out" maxLength={200} autoFocus />
        </label>
        <label>Until
          <select value={until} onChange={(e) => setUntil(e.target.value)}>{options.map((o) => <option key={o}>{o}</option>)}</select>
        </label>
        <p className="sx-hint">Planning a pause ahead of time (a holiday, a building move): <Badge tone="info">Coming in Beta</Badge></p>
      </div>
    </Drawer>
  );
}

/* ------------------------------------------------------------ preview, test, wording */

function Bubble({ text, subject, email, lang, community }: { text: string; subject?: string; email: boolean; lang: MsgLang; community: string }) {
  const l = lang === "en" ? undefined : lang;
  if (email)
    return (
      <div className="au-mail" lang={l}>
        <div className="au-mail-h"><small>From</small> {community} <small>Subject</small> <b>{subject ?? community}</b></div>
        <div className="au-mail-b"><p>{text}</p><small>{community} · Reply STOP to stop emails · Unsubscribe</small></div>
      </div>
    );
  return (
    <div className="au-phone" lang={l}>
      <div className="au-phone-top"><b>{community}</b>Text message</div>
      <p className="au-sms">{text}</p>
    </div>
  );
}

function Count({ text }: { text: string }) {
  const c = smsCount(text);
  return (
    <p className={`au-chars${c.parts > 1 ? " warn" : ""}`}>
      {c.chars} characters · {c.parts === 1 ? "1 text" : `${c.parts} texts`}{!c.plain ? " (accents or Chinese: 70 to a text)" : ""}
      {c.parts > 1 && <><br /><Icon name="alert" /> This would split into {c.parts} texts. Most phones join them, but some show them out of order.</>}
    </p>
  );
}

function Preview({ a, st, onClose }: { a: AutoView; st: AutoState; onClose: () => void }) {
  const [lang, setLang] = useState<MsgLang>("en");
  const [ch, setCh] = useState<"Text" | "Email">(a.channel === "Email" ? "Email" : "Text");
  const w = st.wording[a.id];
  const newEn = w?.status === "approved" ? fillIn(w.text, a.sampleVars) : null;
  const text = lang === "en" && newEn ? newEn : a.sample[lang];
  const subject = a.sampleSubject?.[lang];
  const community = a.sampleVars.community ?? "";
  return (
    <Drawer title={a.name} sub={`${a.who} · ${a.when}`} onClose={onClose}>
      <div className="au-prev">
        <div className="au-prev-bar">
          <div className="sx-seg" role="group" aria-label="Language">
            {MSG_LANGS.map((l) => <button key={l.k} type="button" aria-pressed={lang === l.k} onClick={() => setLang(l.k)} lang={l.k}>{l.label}</button>)}
          </div>
          {a.channel === "Text + email" && (
            <div className="sx-seg" role="group" aria-label="Channel">
              {(["Text", "Email"] as const).map((c) => <button key={c} type="button" aria-pressed={ch === c} onClick={() => setCh(c)}><Icon name={c === "Text" ? "sms" : "mail"} /> {c}</button>)}
            </div>
          )}
        </div>
        <Bubble text={text} subject={subject} email={ch === "Email"} lang={lang} community={community} />
        {ch === "Text" && <Count text={text} />}
        {lang !== "en" && newEn && <p className="sx-hint">Kinlight translates the new wording into {MSG_LANGS.find((l) => l.k === lang)?.name} for each family. Shown: the translation in use today.</p>}
        <p className="sx-hint">With sample details from this week. Each person gets it in their own language (also Russian, Tagalog and Vietnamese), by text, email or both, as they chose.</p>
        {a.variants && (
          <div className="au-variants">
            <h3>It also sends</h3>
            {Object.entries(a.variants).map(([k, v]) => (
              <figure key={k}>
                <figcaption>{v.label}</figcaption>
                <p lang={lang === "en" ? undefined : lang}>{fillIn(v.text[lang], a.sampleVars)}</p>
              </figure>
            ))}
            {lang !== "en" && <p className="sx-hint">Names, events and times are filled in for each person.</p>}
          </div>
        )}
      </div>
    </Drawer>
  );
}

function EditWording({ a, current, admin, approver, onClose, onSave }: { a: AutoView; current: string; admin: boolean; approver: string; onClose: () => void; onSave: (text: string) => void }) {
  const [text, setText] = useState(current);
  const ref = useRef<HTMLTextAreaElement>(null);
  const filled = fillIn(text, a.sampleVars);
  const used = placeholdersIn(text);
  const unknown = used.filter((u) => !a.placeholders.includes(u));
  const missing = a.placeholders.filter((u) => !used.includes(u) && u !== "first name");
  const insert = (ph: string) => {
    const el = ref.current;
    const tok = `{${ph}}`;
    if (!el) { setText((t) => `${t}${tok}`); return; }
    const s = el.selectionStart ?? text.length, e = el.selectionEnd ?? text.length;
    const next = text.slice(0, s) + tok + text.slice(e);
    setText(next);
    window.requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + tok.length, s + tok.length); });
  };
  const email = a.channel === "Email";
  return (
    <Drawer title={`Wording: ${a.name}`} sub={admin ? "You approve wording, so it applies when you save." : `Goes to ${first(approver)} once to approve. After that it sends on its own again.`} onClose={onClose} wide
      foot={<div className="pt-act"><button type="button" className="sx-btn sx-btn-primary" disabled={!text.trim() || text === current || unknown.length > 0} onClick={() => onSave(text.trim())}><Icon name={admin ? "check" : "send"} /> {admin ? "Save wording" : `Send to ${first(approver)}`}</button><button type="button" className="sx-btn" onClick={onClose}>Cancel</button></div>}>
      <div className="sx-form au-edit">
        <label htmlFor="au-edit-t">In English</label>
        <div className="au-chips" role="group" aria-label="Insert a detail">
          {a.placeholders.map((ph) => <button key={ph} type="button" onClick={() => insert(ph)}>{`{${ph}}`}</button>)}
        </div>
        <textarea id="au-edit-t" ref={ref} value={text} onChange={(e) => setText(e.target.value)} rows={5} />
        {unknown.length > 0 && <p className="sx-callout"><Icon name="alert" /> <span>Kinlight doesn’t know {unknown.map((u) => `{${u}}`).join(", ")}. Use the details above, so every message is filled from the calendar, menus and records.</span></p>}
        {missing.length > 0 && !unknown.length && <p className="sx-hint">Not used: {missing.map((u) => `{${u}}`).join(", ")}. That’s fine if it still makes sense without them.</p>}
        <div className="au-edit-prev">
          <span className="sx-lbl">How it reads, with this week’s details</span>
          <Bubble text={filled} email={email} lang="en" community={a.sampleVars.community ?? ""} />
          {!email && <Count text={filled} />}
        </div>
        <p className="sx-hint"><Icon name="translate" /> Kinlight translates it into each family’s language when it’s approved. Writing the Spanish or Chinese yourself: <Badge tone="info">Coming in Beta</Badge></p>
      </div>
    </Drawer>
  );
}

/* ------------------------------------------------------------ the log */

function LogTab({ rows, names, admin, list, filter, community, todayIso }: Props & { names: Record<string, string> }) {
  const [q, setQ] = useState("");
  const [person, setPerson] = useState(filter.person ?? "");
  const [auto, setAuto] = useState(filter.auto && names[filter.auto] ? filter.auto : "");
  const [status, setStatus] = useState<Status | "">(filter.status && filter.status in STATUS_LABEL ? (filter.status as Status) : "");
  const [day, setDay] = useState("");
  const [limit, setLimit] = useState(50);
  const days = useMemo(() => [...new Set(rows.map((r) => dayOf(r.at, todayIso)))], [rows, todayIso]);
  const people = useMemo(() => [...new Set(rows.map((r) => r.to))].sort(), [rows]);
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) =>
      (!person || r.to === person) && (!auto || r.auto === auto) && (!status || r.status === status) && (!day || dayOf(r.at, todayIso) === day) &&
      (!s || `${r.to} ${r.rel} ${r.text} ${r.original ?? ""} ${names[r.auto] ?? ""} ${r.reply?.text ?? ""}`.toLowerCase().includes(s)));
  }, [rows, q, person, auto, status, day, names, todayIso]);
  const any = q || person || auto || status || day;
  const exportCsv = () => {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const head = ["When", "To", "Relationship", "Automation", "Channel", "Language", "What happened", "Subject", "Message", "In their language", "Reply", "Why it failed"];
    const lines = shown.map((r) => [whenOf(r.at, todayIso), r.to, r.rel, names[r.auto] ?? r.auto, r.ch, r.lang, STATUS_LABEL[r.status], r.subject ?? "", r.text, r.original ?? "", r.reply?.text ?? "", r.fail ?? ""].map(esc).join(","));
    const blob = new Blob(["﻿" + [head.map(esc).join(","), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${community.toLowerCase().replace(/\s+/g, "-")}-automatic-messages-${todayIso}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    say(`Exported ${fmt(shown.length)} messages to a spreadsheet.`);
  };
  return (
    <section className="au-logtab" aria-label="Log">
      <div className="sx-card sx-card-body au-filters">
        <label className="au-f-q"><span className="vh">Search</span><input className="sx-input" type="search" value={q} onChange={(e) => { setQ(e.target.value); setLimit(50); }} placeholder="Search a name, an event or a word" /></label>
        <label><span className="vh">Person</span>
          <input className="sx-input" list="au-people" value={person} onChange={(e) => { setPerson(e.target.value); setLimit(50); }} placeholder="Anyone" aria-label="Person" />
          <datalist id="au-people">{people.map((n) => <option key={n} value={n} />)}</datalist>
        </label>
        <label><span className="vh">Automation</span>
          <select className="sx-input" value={auto} onChange={(e) => { setAuto(e.target.value); setLimit(50); }} aria-label="Automation">
            <option value="">Every automation</option>
            {list.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </label>
        <label><span className="vh">What happened</span>
          <select className="sx-input" value={status} onChange={(e) => { setStatus(e.target.value as Status | ""); setLimit(50); }} aria-label="What happened">
            <option value="">Any result</option>
            {(Object.keys(STATUS_LABEL) as Status[]).map((k) => <option key={k} value={k}>{STATUS_LABEL[k]}</option>)}
          </select>
        </label>
        <label><span className="vh">Day</span>
          <select className="sx-input" value={day} onChange={(e) => { setDay(e.target.value); setLimit(50); }} aria-label="Day">
            <option value="">Last 7 days</option>
            {days.map((d) => <option key={d}>{d}</option>)}
          </select>
        </label>
        <div className="au-f-a">
          {any && <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => { setQ(""); setPerson(""); setAuto(""); setStatus(""); setDay(""); }}>Clear</button>}
          {admin && <button type="button" className="sx-btn sx-btn-sm" onClick={exportCsv} disabled={!shown.length}><Icon name="download" /> Export to a spreadsheet</button>}
        </div>
      </div>
      <p className="au-count">{any ? `${fmt(shown.length)} of ${fmt(rows.length)} messages` : `${fmt(rows.length)} messages in the last 7 days`}, newest first. Open one to see exactly what was sent, and any reply.</p>
      <div className="sx-card au-log-card">
        <LogLines rows={shown.slice(0, limit)} names={names} todayIso={todayIso} empty="No messages match." />
      </div>
      {shown.length > limit && <p><button type="button" className="sx-btn sx-btn-sm" onClick={() => setLimit((l) => l + 50)}>Show {Math.min(50, shown.length - limit)} more</button></p>}
    </section>
  );
}

/* ------------------------------------------------------------ problems */

function ProblemsTab({ problems, st, act, admin, names }: Props & { st: AutoState; act: Act; names: Record<string, string> }) {
  const [fixing, setFixing] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const open = problems.filter((x) => !st.done[x.id]);
  const done = problems.filter((x) => st.done[x.id]);
  const mark = (x: Problem, what: string) => { act.done(x.id, what); say(what, () => act.undone(x.id)); };
  const icon = (k: Problem["kind"]) => (k === "reply" ? "sms" : k === "bounced" ? "mail" : k === "unreachable" ? "users" : k === "opted-out" ? "minus" : "alert");
  const who = (x: Problem) => (x.rel === "Resident" ? <ResidentLink name={x.who} /> : x.resident && !x.rel.startsWith("Prospect") && !x.rel.startsWith("On the waitlist") ? <FamilyLink name={x.who} resident={x.resident} /> : <b>{x.who}</b>);
  return (
    <section aria-label="Problems" className="au-probs">
      <p className="au-count">
        {open.length ? `${open.length} to look at` : "Nothing to look at."} Failed texts, bounced emails, opt-outs this week and replies the AI couldn’t handle, each with its owner.
        {" "}A family that can’t be reached also goes to the resident’s owner on Today{admin ? <>, by the rules in <Link className="sx-link" href="/staff/settings">Settings → Approvals and alerts</Link></> : ""}.
      </p>
      {!open.length && <p className="pt-empty"><Icon name="check" /> Every message this week arrived, or has been dealt with.</p>}
      <ul className="au-prob-list">
        {open.map((x) => (
          <li key={x.id} className={`sx-card au-prob k-${x.kind}`}>
            <span className="au-prob-i" aria-hidden="true"><Icon name={icon(x.kind)} /></span>
            <div className="au-prob-b">
              <h3>{x.title}</h3>
              <p>{x.detail}</p>
              <small>{who(x)} · {x.rel} · {x.when} · Owner: {x.ownerName}{x.auto ? ` · ${names[x.auto] ?? ""}` : ""}</small>
              {fixing === x.id && (
                <form className="au-fix" onSubmit={(e) => { e.preventDefault(); if (!value.trim()) return; setFixing(null); setValue(""); mark(x, x.kind === "bounced" ? `Email updated for ${x.who}. Kinlight will use it from the next message.` : `Number updated for ${x.who}. Kinlight will try again from the next message.`); }}>
                  <label><span className="vh">{x.kind === "bounced" ? "New email" : "New mobile number"}</span><input className="sx-input" value={value} onChange={(e) => setValue(e.target.value)} inputMode={x.kind === "bounced" ? "email" : "tel"} placeholder={x.kind === "bounced" ? x.email : x.phone} autoFocus /></label>
                  <button type="submit" className="sx-btn sx-btn-primary sx-btn-sm" disabled={!value.trim()}>Save</button>
                  <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => setFixing(null)}>Cancel</button>
                </form>
              )}
            </div>
            <div className="au-prob-a">
              {x.action === "fix" && fixing !== x.id && <button type="button" className="sx-btn sx-btn-primary sx-btn-sm" onClick={() => { setFixing(x.id); setValue(""); }}><Icon name="edit" /> {x.kind === "bounced" ? "Fix the email" : "Fix the number"}</button>}
              {x.action === "call" && <a className="sx-btn sx-btn-primary sx-btn-sm" href={`tel:+1${(x.phone ?? "").replace(/\D/g, "")}`} onClick={() => window.setTimeout(() => mark(x, `Called ${first(x.who)}. Marked done.`), 400)}><Icon name="phone" /> Call them</a>}
              {x.action === "open" && x.href && <Link className="sx-btn sx-btn-primary sx-btn-sm" href={x.href}><Icon name="sms" /> Open the conversation</Link>}
              {x.action === "done" && <button type="button" className="sx-btn sx-btn-sm" onClick={() => mark(x, `Done. ${first(x.who)} stays opted out unless they reply START.`)}><Icon name="check" /> Done</button>}
              {x.action !== "done" && <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => mark(x, "Marked done.")}>Done</button>}
            </div>
          </li>
        ))}
      </ul>
      {done.length > 0 && (
        <details className="au-done">
          <summary>Done ({done.length})</summary>
          <ul>{done.map((x) => <li key={x.id}><span><b>{x.title}</b> · {st.done[x.id]}</span><button type="button" className="sx-link" onClick={() => act.undone(x.id)}>Undo</button></li>)}</ul>
        </details>
      )}
    </section>
  );
}

/* ------------------------------------------------------------ the next 24 hours */

function NextTab({ upcoming, st, act, names, list, admin, as, todayIso, onPreview }: Props & { st: AutoState; act: Act; names: Record<string, string>; onPreview: (id: string) => void }) {
  const r = st.rules ?? DEFAULT_RULES;
  const defs = new Map(list.map((a) => [a.id, a]));
  return (
    <section aria-label="Next 24 hours" className="au-next">
      <p className="au-count">What’s due to send in the next 24 hours. Catch a mistake before it goes: preview it, or hold one send.</p>
      {!upcoming.length && <p className="pt-empty">Nothing due in the next 24 hours.</p>}
      <ol className="sx-card au-next-list">
        {upcoming.map((u) => {
          const a = defs.get(u.auto);
          const off = a && !a.locked && st.off[a.id];
          const paused = !!st.pause && a?.group !== "emergency" && a?.group !== "required";
          const held = st.held[u.id];
          const quiet = inQuiet(u.at, r.quietFrom, r.quietTo);
          const can = admin || a?.owner === as;
          return (
            <li key={u.id} className={off || held || paused ? "stopped" : undefined}>
              <span className="au-next-t">{whenOf(u.at, todayIso).replace(/^Today, /, "Today ").replace(/^Tomorrow, /, "Tomorrow ")}</span>
              <span className="au-next-w">
                <b>{u.what}</b>
                <small>{names[u.auto] ?? u.auto}{u.note ? ` · ${u.note}` : ""}</small>
                {quiet && <small className="au-q"><Icon name="clock" /> In quiet hours: waits until {hm(r.quietTo)}</small>}
              </span>
              <span className="au-next-a">
                {off ? <Badge tone="neutral">Off · won’t send</Badge> : held ? <><Badge tone="warn">Held by {first(held)}</Badge>{can && <button type="button" className="sx-link" onClick={() => { act.release(u.id); say("Released. It sends on time."); }}>Release</button>}</> : paused ? <Badge tone="warn">Paused · won’t send</Badge> : (
                  <>
                    <button type="button" className="sx-btn sx-btn-sm" onClick={() => onPreview(u.auto)}><Icon name="eye" /> Preview</button>
                    {can && <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => { act.hold(u.id, u.auto, u.what); say(`Held: ${u.what}. Nothing else changes.`, () => act.release(u.id)); }}>Hold this send</button>}
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ------------------------------------------------------------ the record */

function ChangesTab({ history, fresh, names }: { history: ChangeRecord[]; fresh: ChangeRecord[]; names: Record<string, string> }) {
  const all = [...fresh, ...history];
  const what = (c: ChangeRecord) => {
    const n = c.auto ? `“${names[c.auto] ?? c.auto}”` : "";
    switch (c.did) {
      case "off": return c.reason?.startsWith("Held one send") ? `held one send of ${n}` : `turned off ${n}`;
      case "on": return `turned on ${n}`;
      case "wording": return `changed the wording of ${n}`;
      case "rules": return "changed how Kinlight sends";
      case "pause": return "paused all non-urgent automations";
      case "resume": return "resumed all automations";
      case "stopped": return "stopped every automatic message about a resident";
    }
  };
  return (
    <section aria-label="Changes" className="au-changes">
      <p className="au-count">Every change, with who made it, when, and why. Kept for the life of the community’s account.</p>
      <ol className="sx-card au-change-list">
        {all.map((c) => (
          <li key={c.id}>
            <span className="au-ch-at">{c.at}</span>
            <span>
              <b>{c.by}</b> {what(c)}
              {c.reason && !c.reason.startsWith("Held one send") && <q>{c.reason}</q>}
              {c.reason?.startsWith("Held one send") && <small>{c.reason.replace("Held one send: ", "")}</small>}
              {c.note && <small>{c.note}</small>}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
