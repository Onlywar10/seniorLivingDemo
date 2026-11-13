"use client";

// New survey, made like an event: start from a template, a past survey (with its last results), blank, or "Write it
// for me" (describe the goal; Kinlight drafts questions from its question bank, already in every language). Then the
// questions (six kinds, optional ones, a simple "only ask if…" rule), the settings (named or anonymous, a closing
// date, the thank-you), who it goes to (the same choices as announcements, with the count before sending), and when
// (now, a date, a repeat, or triggered by something). A new survey goes to the approver once; an approved template
// that hasn't been changed sends without asking again. Saved in this browser.
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { AudienceFacts } from "@/data/staff/surveys";
import { MSG_LANGS, type L } from "@/data/staff/autoText";
import { BANK, Q_TYPES, REPEATS, THANKS, TRIGGERS, draftFor, minutes, minutesLabel, typeLabel, type Area, type Audience, type QType, type Question, type Repeat, type Template, type Trigger } from "@/data/staff/surveyKit";
import type { StaffRole } from "@/data/staff/shared";
import { Icon } from "../../Icon";
import { say } from "../store";
import { useSurveyActions, useSurveys } from "../surveyStore";
import { Badge, Card } from "../ui";
import { Help } from "./Help";
import { SurveyPreview, type PreviewPeople } from "./SurveyPreview";

export interface PastSurvey { id: string; title: string; when: string; rate: number; questions: Question[]; area: Area; audience: Audience[]; topic: L; anonymous: boolean }
type Start = { kind: "template"; id: string } | { kind: "copy"; id: string } | { kind: "blank" } | { kind: "write"; goal: string };
type Linked = "" | `event:${string}` | `eat:${string}` | "newres" | "newfam";
type When = "now" | "date" | "repeat" | "trigger";

const AUD: { k: Audience; label: string }[] = [{ k: "families", label: "Families" }, { k: "residents", label: "Residents" }, { k: "staff", label: "Staff" }, { k: "prospects", label: "Recent prospects who toured" }];
const uid = () => `q${Date.now().toString(36)}${Math.round(Math.random() * 1e3)}`;
const copyQ = (q: Question): Question => ({ ...q, text: { ...q.text }, options: q.options?.map((o) => ({ ...o })), onlyIf: q.onlyIf ? { ...q.onlyIf, in: [...q.onlyIf.in] } : undefined });
const fresh = (en: string): L => ({ en, es: en, zh: en });

export function SurveyBuilder({ templates, past, facts, as, admin, me, approver, community, phone, domain, people, area: myArea, start: initial, todayIso }: {
  templates: Template[]; past: PastSurvey[]; facts: AudienceFacts; as: StaffRole; admin: boolean; me: string; approver: string;
  community: string; phone: string; domain: string; people: PreviewPeople; area: Area | "all"; start?: Start; todayIso: string;
}) {
  const router = useRouter();
  const act = useSurveyActions();
  const saved = useSurveys().templates;
  const allTemplates: Template[] = [...templates, ...saved.map((t) => ({ id: t.id, name: t.name, about: `Saved by ${t.by}`, area: t.area, audience: t.audience, questions: t.questions, topic: t.topic, savedBy: t.by }))];
  const [start, setStart] = useState<Start | null>(initial ?? null);
  const [goal, setGoal] = useState(initial?.kind === "write" ? initial.goal : "");
  const [base, setBase] = useState("");
  const [title, setTitle] = useState("");
  const [qs, setQs] = useState<Question[]>([]);
  const [topic, setTopic] = useState<L>(fresh("your experience"));
  const [area, setArea] = useState<Area>(myArea === "all" ? "community" : myArea);
  const [aud, setAud] = useState<Set<Audience>>(new Set(["families"]));
  const [areas, setAreas] = useState<Set<string>>(new Set(myArea === "lantern" ? ["Lantern"] : []));
  const [langs, setLangs] = useState<Set<string>>(new Set());
  const [ints, setInts] = useState<Set<string>>(new Set());
  const [linked, setLinked] = useState<Linked>(myArea === "dining" && facts.restaurants[0] ? `eat:${facts.restaurants[0].k}` : "");
  const [lanternWay, setLanternWay] = useState<"person" | "legal">("person");
  const [anon, setAnon] = useState(false);
  const [closes, setCloses] = useState(new Date(Date.parse(todayIso) + 10 * 864e5).toISOString().slice(0, 10));
  const [thanks, setThanks] = useState(THANKS.en.replace("{community}", community));
  const [when, setWhen] = useState<When>("now");
  const [date, setDate] = useState(new Date(Date.parse(todayIso) + 864e5).toISOString().slice(0, 10));
  const [time, setTime] = useState("10:00");
  const [repeat, setRepeat] = useState<Repeat>("6 months");
  const [trigger, setTrigger] = useState<Trigger>("after-event");
  const [reminder, setReminder] = useState(true);
  const [preview, setPreview] = useState(false);
  const [langView, setLangView] = useState(false);

  const load = (s: Start) => {
    setStart(s);
    if (s.kind === "template") {
      const t = allTemplates.find((x) => x.id === s.id)!;
      const q = t.questions.map(copyQ);
      setTitle(t.name); setQs(q); setBase(JSON.stringify(q)); setTopic(t.topic); setAud(new Set(t.audience)); setAnon(!!t.anonymous);
      if (myArea === "all") setArea(t.area);
      if (t.repeat) { setWhen("repeat"); setRepeat(t.repeat); } else if (t.trigger) { setWhen("trigger"); setTrigger(t.trigger); }
    } else if (s.kind === "copy") {
      const p = past.find((x) => x.id === s.id)!;
      const q = p.questions.map(copyQ);
      setTitle(p.title); setQs(q); setBase(JSON.stringify(q)); setTopic(p.topic); setAud(new Set(p.audience)); setAnon(p.anonymous);
      if (myArea === "all") setArea(p.area);
    } else if (s.kind === "blank") {
      setTitle(""); setQs([{ id: uid(), type: "rating", text: fresh(""), fresh: true }]); setBase(""); setTopic(fresh("your experience"));
    } else {
      const d = draftFor(s.goal);
      const q = d.questions.map(copyQ);
      setTitle(d.title); setQs(q); setBase(""); setAud(new Set(d.audience)); setTopic(fresh(d.title.toLowerCase()));
      if (myArea === "all") setArea(d.area);
    }
  };
  // A link from Surveys ("Use this template", "Copy") arrives with its start chosen.
  const [booted, setBooted] = useState(false);
  if (!booted && initial && initial.kind !== "write") { setBooted(true); load(initial); }

  const changed = JSON.stringify(qs) !== base;
  const fromApproved = (start?.kind === "template" || start?.kind === "copy") && !changed;
  const needsApproval = !admin && !fromApproved;
  const m = minutes(qs);

  /* ---------- who it goes to, counted before sending */
  const count = useMemo(() => {
    const out: string[] = [];
    let total = 0;
    const share = (n: number) => n;
    const lk = linked;
    if (lk.startsWith("event:")) {
      const e = facts.events.find((x) => `event:${x.id}` === lk);
      if (e) { out.push(`${e.came} who came to ${e.title}`); total += e.came; }
    } else if (lk.startsWith("eat:")) {
      const r = facts.restaurants.find((x) => `eat:${x.k}` === lk);
      if (r) { out.push(`${r.n} residents and guests who ate at ${r.name} this week`); total += r.n; }
    } else if (lk === "newres") { out.push(`${facts.newResidents} new residents in their first 30 days`); total += facts.newResidents; }
    else if (lk === "newfam") { out.push(`${facts.newFamilies} new families in their first 30 days`); total += facts.newFamilies; }
    else {
      const langTotal = facts.languages.reduce((n, l) => n + l.n, 0);
      const langShare = langs.size ? facts.languages.filter((l) => langs.has(l.k)).reduce((n, l) => n + l.n, 0) / langTotal : 1;
      const areaRes = areas.size ? facts.areas.filter((a) => areas.has(a.k) && a.k !== "Lantern").reduce((n, a) => n + a.n, 0) : facts.residents;
      const areaShare = areas.size ? facts.areas.filter((a) => areas.has(a.k)).reduce((n, a) => n + a.n, 0) / (facts.residents + facts.lantern) : 1;
      const intShare = ints.size ? Math.min(1, facts.interests.filter((i) => ints.has(i.k)).reduce((n, i) => n + i.share, 0)) : 1;
      if (aud.has("families")) {
        const n = Math.round(facts.families * langShare * areaShare * intShare);
        const post = Math.round(facts.familiesByPost * (n / facts.families));
        const es = langs.size && !langs.has("Spanish") ? 0 : Math.round((facts.languages.find((l) => l.k === "Spanish")?.n ?? 0) * areaShare * intShare);
        out.push(`${share(n)} families${es ? ` · ${es} in Spanish` : ""}${post ? ` · ${post} by post` : ""}`);
        total += n;
      }
      if (aud.has("residents")) {
        const n = Math.round(areaRes * langShare * intShare);
        if (n) { out.push(`${n} residents · ${Math.round(n * (facts.residentsOnPaper / facts.residents))} on paper or read aloud`); total += n; }
        if (!areas.size || areas.has("Lantern")) out.push(`${facts.lantern} Lantern residents: ${lanternWay === "person" ? "asked in person by the care team" : "sent to their legal representatives"}`);
      }
      if (aud.has("staff")) { out.push(`${facts.staff} staff`); total += facts.staff; }
      if (aud.has("prospects")) { out.push(`${facts.prospects} recent prospects`); total += facts.prospects; }
    }
    return { line: out.length ? `Goes to ${out.join(" · ")}` : "Choose who it’s for", total };
  }, [aud, areas, langs, ints, linked, lanternWay, facts]);

  const timing = when === "now" ? "Sends now (outside quiet hours)" : when === "date" ? `Sends ${date} at ${time}` : when === "repeat" ? REPEATS.find((r) => r.k === repeat)!.label : TRIGGERS.find((t) => t.k === trigger)!.label;

  /* ---------- questions */
  const setQ = (id: string, p: Partial<Question>) => setQs((xs) => xs.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const move = (i: number, d: -1 | 1) => setQs((xs) => { const n = [...xs]; const j = i + d; if (j < 0 || j >= n.length) return xs; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const addQ = (type: QType) => setQs((xs) => [...xs, { id: uid(), type, text: fresh(""), fresh: true, options: type === "one" || type === "many" ? [fresh("First choice"), fresh("Second choice")] : undefined }]);

  const submit = (draft: boolean) => {
    if (!title.trim() || !qs.length || qs.some((q) => !q.text.en.trim())) { say("Give it a title, and write every question first."); return; }
    const status = draft ? "draft" : needsApproval ? "waiting" : when === "repeat" ? "repeating" : when === "trigger" ? "automatic" : when === "date" ? "scheduled" : "open";
    act.add({
      id: `made-${Date.now().toString(36)}`, title: title.trim(), questions: qs, topic, area, audience: [...aud], audienceLabel: count.line.replace(/^Goes to /, ""), count: count.line,
      anonymous: anon, closes, thankYou: thanks, timing, reminder, status, by: me, at: "Just now",
      from: start?.kind === "template" ? `From the “${allTemplates.find((t) => t.id === (start as { id: string }).id)?.name}” template` : start?.kind === "copy" ? "Copied from a past survey" : start?.kind === "write" ? "Written with “Write it for me”" : "Started blank",
    });
    say(draft ? "Saved as a draft." : needsApproval ? `Sent to ${approver.split(" ")[0]} to approve, once. It shows on their Today, with the same preview.` : status === "open" ? `Sent. ${count.line}. Invitations follow the sending rules in Automations.` : `Set: ${timing.toLowerCase()}. It’s in Automations with its own switch.`);
    router.push("/staff/surveys");
  };

  /* ---------- the starting point */
  if (!start)
    return (
      <div className="su-start">
        <Card title="Start from a template" sub="Approved and ready to send">
          <ul className="su-tpls">
            {allTemplates.map((t) => (
              <li key={t.id}>
                <button type="button" onClick={() => load({ kind: "template", id: t.id })}>
                  <b>{t.name}</b>
                  <small>{t.about} · {t.questions.length} questions · {minutesLabel(t.questions).toLowerCase()}</small>
                  {t.savedBy ? <Badge tone="info">Saved by {t.savedBy}</Badge> : <Badge tone="good"><Icon name="check" /> Approved</Badge>}
                </button>
              </li>
            ))}
          </ul>
        </Card>
        <div className="sx-grid">
          <Card title="Copy a past survey" sub="With its last results">
            <ul className="su-tpls">
              {past.map((p) => (
                <li key={p.id}><button type="button" onClick={() => load({ kind: "copy", id: p.id })}><b>{p.title}</b><small>{p.when} · {p.rate}% replied</small></button></li>
              ))}
            </ul>
          </Card>
          <Card title="Write it for me" sub="Describe what you want to find out" action={<Help label="About Write it for me" align="end"><p>Kinlight drafts questions from its question bank, so each one is already written in every language. You edit them before anything is sent, and a new survey goes to the approver once.</p></Help>}>
            <form className="sx-form" onSubmit={(e) => { e.preventDefault(); if (goal.trim()) load({ kind: "write", goal }); }}>
              <label><span className="vh">What do you want to find out?</span><textarea value={goal} onChange={(e) => setGoal(e.target.value)} rows={3} placeholder="Find out why fewer residents come to evening events" /></label>
              <button type="submit" className="sx-btn sx-btn-primary" disabled={!goal.trim()}><Icon name="spark" /> Draft the questions</button>
            </form>
          </Card>
          <Card title="Start blank"><button type="button" className="sx-btn" onClick={() => load({ kind: "blank" })}><Icon name="plus" /> A blank survey</button></Card>
        </div>
      </div>
    );

  return (
    <div className="su-build">
      <div className="su-build-main">
        <Card title="The survey" sub={start.kind === "write" ? `Drafted from: “${goal}”. Edit anything.` : start.kind === "template" ? (changed ? "From a template, changed: goes to the approver once" : "From an approved template") : start.kind === "copy" ? "Copied from a past survey" : "Started blank"}
          action={<button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => setStart(null)}><Icon name="left" /> Start again</button>}>
          <div className="sx-form">
            <label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Dining experience" /></label>
            <p className={`su-est${qs.length > 10 ? " warn" : ""}`}><Icon name="clock" /> {minutesLabel(qs)} · {qs.length} {qs.length === 1 ? "question" : "questions"}{qs.length > 10 ? ". That’s a lot: surveys over 10 questions get far fewer answers." : ""}</p>
            <label className="sx-check"><input type="checkbox" checked={langView} onChange={(e) => setLangView(e.target.checked)} /> Show every language</label>
          </div>
          <ol className="su-qs">
            {qs.map((q, i) => {
              const earlier = qs.slice(0, i).filter((x) => x.type === "rating" || x.type === "yesno" || x.type === "one" || x.type === "nps");
              const src = q.onlyIf ? qs.find((x) => x.id === q.onlyIf!.q) : undefined;
              const choices: (string | number)[] = src?.type === "rating" ? [1, 2, 3, 4, 5] : src?.type === "yesno" ? ["Yes", "No"] : src?.type === "nps" ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] : src?.options?.map((o) => o.en) ?? [];
              return (
                <li key={q.id} className="su-q">
                  <div className="su-q-h">
                    <span className="su-q-n">{i + 1}</span>
                    <select aria-label={`Question ${i + 1}: kind`} value={q.type} onChange={(e) => { const type = e.target.value as QType; setQ(q.id, { type, options: type === "one" || type === "many" ? q.options ?? [fresh("First choice"), fresh("Second choice")] : undefined }); }}>
                      {Q_TYPES.map((t) => <option key={t.k} value={t.k}>{t.label}</option>)}
                    </select>
                    <span className="su-q-a">
                      <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
                      <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => move(i, 1)} disabled={i === qs.length - 1} aria-label="Move down">↓</button>
                      <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => setQs((xs) => xs.filter((x) => x.id !== q.id).map((x) => (x.onlyIf?.q === q.id ? { ...x, onlyIf: undefined } : x)))} aria-label={`Remove question ${i + 1}`}><Icon name="x" /></button>
                    </span>
                  </div>
                  <label className="su-q-t"><span className="vh">Question {i + 1}</span>
                    <input value={q.text.en} onChange={(e) => setQ(q.id, { text: fresh(e.target.value), fresh: true })} placeholder="Write the question once, in English" />
                  </label>
                  {langView && (
                    <dl className="su-langs">
                      {MSG_LANGS.filter((l) => l.k !== "en").map((l) => <div key={l.k}><dt>{l.label}</dt><dd lang={l.k}>{q.fresh ? <em>Kinlight translates this when it’s approved</em> : q.text[l.k]}</dd></div>)}
                    </dl>
                  )}
                  {(q.type === "one" || q.type === "many") && (
                    <ul className="su-opts">
                      {(q.options ?? []).map((o, k) => (
                        <li key={k}>
                          <input aria-label={`Choice ${k + 1}`} value={o.en} onChange={(e) => setQ(q.id, { fresh: true, options: q.options!.map((x, j) => (j === k ? fresh(e.target.value) : x)) })} />
                          <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" aria-label={`Remove choice ${k + 1}`} onClick={() => setQ(q.id, { options: q.options!.filter((_, j) => j !== k) })}><Icon name="x" /></button>
                        </li>
                      ))}
                      <li><button type="button" className="sx-link" onClick={() => setQ(q.id, { options: [...(q.options ?? []), fresh("")] })}><Icon name="plus" /> Add a choice</button></li>
                    </ul>
                  )}
                  <div className="su-q-f">
                    <label className="sx-check"><input type="checkbox" checked={!!q.optional} onChange={(e) => setQ(q.id, { optional: e.target.checked })} /> Optional</label>
                    {q.type === "rating" && (
                      <span className="sx-seg" role="group" aria-label="Shown as">
                        {(["faces", "stars"] as const).map((l) => <button key={l} type="button" aria-pressed={(q.look ?? "faces") === l} onClick={() => setQ(q.id, { look: l })}>{l === "faces" ? "Faces" : "Stars"}</button>)}
                      </span>
                    )}
                    {earlier.length > 0 && (
                      <label className="su-if">Only ask if
                        <select value={q.onlyIf?.q ?? ""} onChange={(e) => { const sq = qs.find((x) => x.id === e.target.value); setQ(q.id, { onlyIf: sq ? { q: sq.id, in: sq.type === "rating" ? [1, 2] : sq.type === "yesno" ? ["No"] : sq.type === "nps" ? [0, 1, 2, 3, 4, 5, 6] : [sq.options?.[0]?.en ?? ""] } : undefined }); }}>
                          <option value="">Always ask</option>
                          {earlier.map((x) => <option key={x.id} value={x.id}>{x.text.en.slice(0, 40) || typeLabel(x.type)}</option>)}
                        </select>
                      </label>
                    )}
                  </div>
                  {q.onlyIf && (
                    <div className="su-if-v" role="group" aria-label="is answered">
                      <span className="sx-hint">is answered</span>
                      {choices.map((c) => {
                        const on = q.onlyIf!.in.some((v) => String(v) === String(c));
                        return <button key={String(c)} type="button" className="su-chip" aria-pressed={on} onClick={() => setQ(q.id, { onlyIf: { q: q.onlyIf!.q, in: on ? q.onlyIf!.in.filter((v) => String(v) !== String(c)) : [...q.onlyIf!.in, c] } })}>{c}</button>;
                      })}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
          <div className="su-add" role="group" aria-label="Add a question">
            <span className="sx-hint">Add:</span>
            {Q_TYPES.map((t) => <button key={t.k} type="button" className="sx-btn sx-btn-sm" onClick={() => addQ(t.k)} title={t.hint}><Icon name="plus" /> {t.label}</button>)}
            <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => setQs((xs) => [...xs, copyQ({ ...BANK.better, id: uid() })])}>“What could we do better?”</button>
          </div>
          <p className="sx-hint"><Icon name="translate" /> Write each question once. Kinlight translates it into each family’s language, and the preview shows every one.</p>
        </Card>

        <Card title="Who it goes to" sub="The same choices as announcements">
          <div className="su-aud">
            <div className="sx-chips" role="group" aria-label="Groups">
              {AUD.map((g) => <button key={g.k} type="button" aria-pressed={aud.has(g.k)} onClick={() => setAud((s) => { const n = new Set(s); if (n.has(g.k)) n.delete(g.k); else n.add(g.k); return n; })}>{g.label}</button>)}
            </div>
            <details className="su-narrow" open={areas.size + langs.size + ints.size > 0}>
              <summary>Narrow it down</summary>
              <p className="sx-lbl">Care area</p>
              <div className="sx-chips">{facts.areas.map((a) => <button key={a.k} type="button" aria-pressed={areas.has(a.k)} onClick={() => setAreas((s) => { const n = new Set(s); if (n.has(a.k)) n.delete(a.k); else n.add(a.k); return n; })}>{a.k}</button>)}</div>
              <p className="sx-lbl">Language</p>
              <div className="sx-chips">{facts.languages.map((l) => <button key={l.k} type="button" aria-pressed={langs.has(l.k)} onClick={() => setLangs((s) => { const n = new Set(s); if (n.has(l.k)) n.delete(l.k); else n.add(l.k); return n; })}>{l.k}</button>)}</div>
              <p className="sx-lbl">Interest</p>
              <div className="sx-chips">{facts.interests.map((x) => <button key={x.k} type="button" aria-pressed={ints.has(x.k)} onClick={() => setInts((s) => { const n = new Set(s); if (n.has(x.k)) n.delete(x.k); else n.add(x.k); return n; })}>{x.k}</button>)}</div>
            </details>
            <label className="su-linked">People linked to something
              <select className="sx-input" value={linked} onChange={(e) => setLinked(e.target.value as Linked)}>
                <option value="">Nobody in particular</option>
                <optgroup label="Everyone who came to">{facts.events.map((e) => <option key={e.id} value={`event:${e.id}`}>{e.title} · {e.when}</option>)}</optgroup>
                <optgroup label="Everyone who ate at, this week">{facts.restaurants.map((r) => <option key={r.k} value={`eat:${r.k}`}>{r.name}</option>)}</optgroup>
                <optgroup label="Newcomers"><option value="newres">New residents, first 30 days</option><option value="newfam">New families, first 30 days</option></optgroup>
              </select>
            </label>
            <p className="su-count"><Icon name="users" /> <b>{count.line}</b></p>
            {aud.has("residents") && (!areas.size || areas.has("Lantern")) && (
              <fieldset className="su-lantern">
                <legend>Lantern residents are never surveyed by text</legend>
                <label className="sx-check"><input type="radio" name="lw" checked={lanternWay === "person"} onChange={() => setLanternWay("person")} /> The care team asks in person, with the read-aloud version</label>
                <label className="sx-check"><input type="radio" name="lw" checked={lanternWay === "legal"} onChange={() => setLanternWay("legal")} /> Send it to their legal representative instead</label>
              </fieldset>
            )}
          </div>
        </Card>

        <Card title="When it goes" action={<Help label="About sending" align="end"><p>Invitations follow the sending rules in Automations: no texts in quiet hours, no more than 3 texts a day per person, and each person’s language and way of hearing from us. A survey that sends on its own appears in Automations with its own switch, and every invitation is in the Automations log.</p></Help>}>
          <div className="sx-form">
            <div className="sx-seg" role="group" aria-label="When">
              {([["now", "Send now"], ["date", "Schedule"], ["repeat", "Repeat"], ["trigger", "When something happens"]] as [When, string][]).map(([k, l]) => <button key={k} type="button" aria-pressed={when === k} onClick={() => setWhen(k)}>{l}</button>)}
            </div>
            {when === "date" && <div className="sx-row"><label>Date<input type="date" value={date} min={todayIso} onChange={(e) => setDate(e.target.value)} /></label><label>Time<input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></label></div>}
            {when === "repeat" && <label>How often<select value={repeat} onChange={(e) => setRepeat(e.target.value as Repeat)}>{REPEATS.map((r) => <option key={r.k} value={r.k}>{r.label}</option>)}</select></label>}
            {when === "trigger" && <label>Send it<select value={trigger} onChange={(e) => setTrigger(e.target.value as Trigger)}>{TRIGGERS.map((t) => <option key={t.k} value={t.k}>{t.label}</option>)}</select></label>}
            <label className="sx-check"><input type="checkbox" checked={reminder} onChange={(e) => setReminder(e.target.checked)} /> One reminder after 3 days, to anyone who hasn’t answered</label>
          </div>
        </Card>
      </div>

      <aside className="su-build-side">
        <Card title="Settings">
          <div className="sx-form">
            <div className="sx-seg" role="group" aria-label="Named or anonymous">
              <button type="button" aria-pressed={!anon} onClick={() => setAnon(false)}>Named</button>
              <button type="button" aria-pressed={anon} onClick={() => setAnon(true)}>Anonymous</button>
            </div>
            <p className="sx-hint">{anon ? "Nobody sees who said what, and results only show once 5 or more have answered. A concern in a written answer is flagged in the results, never sent to Feedback with a name." : "Names go with answers, so a concern can become a Feedback item with an owner straight away."}</p>
            <label>Closes<input type="date" value={closes} min={todayIso} onChange={(e) => setCloses(e.target.value)} /></label>
            <label>Thank-you message<textarea value={thanks} onChange={(e) => setThanks(e.target.value)} rows={3} /></label>
            {myArea === "all" && (
              <label>Area<select value={area} onChange={(e) => setArea(e.target.value as Area)}>{(["community", "dining", "activities", "lantern", "staff"] as Area[]).map((a) => <option key={a} value={a}>{a === "community" ? "The whole community" : a.charAt(0).toUpperCase() + a.slice(1)}</option>)}</select></label>
            )}
            <button type="button" className="sx-btn sx-btn-sm" disabled={!title.trim() || !qs.length} onClick={() => { act.saveTemplate({ id: `t-mine-${Date.now().toString(36)}`, name: title.trim(), by: me.split(" ")[0], questions: qs, area, audience: [...aud], topic }); say(`Saved as a template: “${title.trim()}”. It’s with the others next time.`); }}><Icon name="layers" /> Save as template</button>
          </div>
        </Card>
        <Card title="Before it goes">
          <div className="su-go">
            <p className="sx-hint">{count.line}. {timing}. {m} {m === 1 ? "minute" : "minutes"}.</p>
            <button type="button" className="sx-btn" onClick={() => setPreview(true)} disabled={!qs.length}><Icon name="eye" /> Preview as…</button>
            {needsApproval ? (
              <p className="sx-callout info"><Icon name="info" /> <span>{fromApproved ? "" : `A new or changed survey goes to ${approver.split(" ")[0]} once before it first sends, like a post.`}</span></p>
            ) : fromApproved && !admin ? <p className="sx-hint"><Icon name="check" /> An approved template, unchanged: it sends without asking again.</p> : null}
            <button type="button" className="sx-btn sx-btn-primary" onClick={() => submit(false)}><Icon name="send" /> {needsApproval ? `Send to ${approver.split(" ")[0]} to approve` : when === "now" ? "Send now" : when === "date" ? "Schedule it" : "Turn it on"}</button>
            <button type="button" className="sx-btn sx-btn-quiet" onClick={() => submit(true)}>Save as a draft</button>
          </div>
        </Card>
      </aside>

      {preview && <SurveyPreview sv={{ id: "preview", title: title || "Untitled survey", questions: qs.filter((q) => q.text.en.trim()), topic, anonymous: anon, thankYou: thanks, closesLabel: closes }} community={community} phone={phone} domain={domain} people={people} me={me} onClose={() => setPreview(false)} />}
      {as === "lantern" && <span className="vh">Lantern surveys go to Lantern families, or are read aloud in person.</span>}
    </div>
  );
}
