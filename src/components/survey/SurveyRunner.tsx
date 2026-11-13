"use client";

// The survey page: what someone sees when they open the link in their text or email. No login: the link knows who
// it's for (or nobody, if the survey is anonymous). One question at a time, large type, big buttons and a progress
// bar, in their language, with "only ask if…" questions shown only when they apply. Leaving and coming back picks up
// where they stopped. The same page is used for "Preview as" (nothing saved) and by staff reading a survey aloud
// with a resident (their taps are the resident's answers).
import { useEffect, useMemo, useState } from "react";
import type { MsgLang } from "@/data/staff/autoText";
import { asks, pageText, type Question } from "@/data/staff/surveyKit";
import "./survey.css";

export type Answers = Record<string, string | number | string[]>;
const FACES = ["😞", "🙁", "😐", "🙂", "😀"];

export function SurveyRunner({ title, community, phone, questions, lang, anonymous, thankYou, vars = {}, mode = "live", storageKey, closed, alreadyDone, closesLabel, onFinish, compact = false }: {
  title: string; community: string; phone: string; questions: Question[]; lang: MsgLang; anonymous: boolean; thankYou: string;
  vars?: Record<string, string>;
  /** live: a real link (answers kept, place remembered). preview: staff looking, nothing saved. aloud: staff reading it to a resident. */
  mode?: "live" | "preview" | "aloud";
  storageKey?: string; closed?: boolean; alreadyDone?: boolean; closesLabel?: string;
  onFinish?: (a: Answers) => void;
  /** Inside a preview phone frame. */
  compact?: boolean;
}) {
  const [answers, setAnswers] = useState<Answers>({});
  const [i, setI] = useState(-1);
  const [done, setDone] = useState(false);
  const [resumed, setResumed] = useState(false);
  const fill = (s: string) => s.replace(/\{(community|event)\}/g, (_, k) => (k === "community" ? community : vars.event ?? "the event"));
  const T = (k: Parameters<typeof pageText>[0], v: Record<string, string | number> = {}) => pageText(k, lang, v);

  // Pick up where they stopped (real links only).
  useEffect(() => {
    if (mode !== "live" || !storageKey) return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const s = JSON.parse(raw) as { answers: Answers; i: number; done?: boolean };
      // Restoring saved progress from the browser after the first render: an external system, read once.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnswers(s.answers ?? {});
      setI(s.i ?? -1);
      setDone(!!s.done);
      setResumed(!s.done && (s.i ?? -1) >= 0);
    } catch { /* storage is a convenience only */ }
  }, [mode, storageKey]);
  const save = (a: Answers, at: number, d = false) => {
    if (mode !== "live" || !storageKey) return;
    try { window.localStorage.setItem(storageKey, JSON.stringify({ answers: a, i: at, done: d })); } catch { /* fine */ }
  };

  const shown = useMemo(() => questions.filter((q) => asks(q, answers)), [questions, answers]);
  const q = i >= 0 ? shown[i] : undefined;
  const total = shown.length;
  const val = q ? answers[q.id] : undefined;
  const has = val !== undefined && val !== "" && !(Array.isArray(val) && !val.length);
  const set = (v: string | number | string[]) => { if (!q) return; const a = { ...answers, [q.id]: v }; setAnswers(a); save(a, i); };
  const go = (to: number) => {
    if (to >= total) { setDone(true); save(answers, i, true); onFinish?.(answers); return; }
    setI(to); save(answers, to); setResumed(false);
  };
  const auto = (v: string | number) => { set(v); if (q && q.type !== "many" && q.type !== "text") window.setTimeout(() => go(i + 1), mode === "aloud" ? 150 : 260); };

  const head = (
    <header className="sr-head">
      <p className="sr-brand">{community}</p>
      <h1>{fill(title)}</h1>
    </header>
  );
  const cls = `sr${compact ? " sr-compact" : ""}${mode === "aloud" ? " sr-aloud" : ""}`;

  if (closed && mode === "live") return <main className={cls}>{head}<p className="sr-note">{T("closed", { phone })}</p></main>;
  if ((alreadyDone || done) && mode === "live" && !done) return <main className={cls}>{head}<p className="sr-note">{T("done")}</p></main>;
  if (done)
    return (
      <main className={cls}>
        {head}
        <div className="sr-thanks"><span aria-hidden="true">✓</span><p>{fill(thankYou)}</p></div>
        {mode !== "live" && <button type="button" className="sr-btn ghost" onClick={() => { setAnswers({}); setI(-1); setDone(false); }}>{mode === "aloud" ? "Next resident" : "Start again"}</button>}
      </main>
    );

  if (i < 0)
    return (
      <main className={cls}>
        {head}
        <p className="sr-note">{anonymous ? T("anon") : T("named")}</p>
        {closesLabel && <p className="sr-small">{T("closes", { date: closesLabel })}</p>}
        <button type="button" className="sr-btn" onClick={() => go(0)}>{T("start")}</button>
      </main>
    );

  const pct = Math.round((i / Math.max(1, total)) * 100);
  return (
    <main className={cls}>
      <p className="sr-brand">{community}</p>
      <div className="sr-progress" role="progressbar" aria-valuenow={i + 1} aria-valuemin={1} aria-valuemax={total} aria-label={T("of", { n: i + 1, total })}><i style={{ width: `${Math.max(6, pct)}%` }} /></div>
      <p className="sr-small">{T("of", { n: i + 1, total })}{q?.optional ? ` · ${T("optional")}` : ""}</p>
      {resumed && <p className="sr-resumed">{T("resume")}</p>}
      {mode === "aloud" && <p className="sr-aloud-tip">{T("readAloud")}</p>}
      {q && (
        <fieldset className="sr-q" key={q.id}>
          <legend>{fill(q.text[lang] || q.text.en)}</legend>
          {q.fresh && lang !== "en" && <p className="sr-small">Kinlight translates this question when the survey is approved.</p>}
          {q.type === "rating" && (
            <div className={`sr-rate${q.look === "stars" ? " stars" : ""}`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" aria-pressed={val === n} onClick={() => auto(n)}>
                  <span aria-hidden="true">{q.look === "stars" ? "★".repeat(n) : FACES[n - 1]}</span>
                  <small>{T(`r${n}` as Parameters<typeof pageText>[0])}</small>
                </button>
              ))}
            </div>
          )}
          {q.type === "yesno" && (
            <div className="sr-two">
              {(["Yes", "No"] as const).map((v) => <button key={v} type="button" aria-pressed={val === v} onClick={() => auto(v)}>{T(v === "Yes" ? "yes" : "no")}</button>)}
            </div>
          )}
          {q.type === "nps" && (
            <>
              <div className="sr-nps">{Array.from({ length: 11 }, (_, n) => <button key={n} type="button" aria-pressed={val === n} onClick={() => auto(n)}>{n}</button>)}</div>
              <p className="sr-ends"><span>{T("notLikely")}</span><span>{T("veryLikely")}</span></p>
            </>
          )}
          {(q.type === "one" || q.type === "many") && (
            <div className="sr-opts">
              {q.type === "many" && <p className="sr-small">{T("several")}</p>}
              {(q.options ?? []).map((o) => {
                const on = q.type === "one" ? val === o.en : Array.isArray(val) && val.includes(o.en);
                return (
                  <button key={o.en} type="button" aria-pressed={on} onClick={() => (q.type === "one" ? auto(o.en) : set(on ? (val as string[]).filter((x) => x !== o.en) : [...((val as string[]) ?? []), o.en]))}>
                    <span className="sr-box" aria-hidden="true">{on ? "✓" : ""}</span>{o[lang] || o.en}
                  </button>
                );
              })}
            </div>
          )}
          {q.type === "text" && <textarea value={typeof val === "string" ? val : ""} onChange={(e) => set(e.target.value)} placeholder={T("type")} rows={4} lang={lang} />}
        </fieldset>
      )}
      <div className="sr-nav">
        {i > 0 && <button type="button" className="sr-btn ghost" onClick={() => go(i - 1)}>{T("back")}</button>}
        {q && (has || q.type === "many" || q.type === "text" ? (
          <button type="button" className="sr-btn" onClick={() => go(i + 1)} disabled={!has && !q.optional && q.type !== "many"}>{i + 1 >= total ? T("finish") : T("next")}</button>
        ) : q.optional ? (
          <button type="button" className="sr-btn ghost" onClick={() => go(i + 1)}>{T("skip")}</button>
        ) : null)}
      </div>
      {mode === "preview" && <p className="sr-small sr-prev-note">Preview: answers aren’t saved.</p>}
    </main>
  );
}
