"use client";

// Surveys: what's running, what repeats or sends on its own, drafts and what's waiting for approval, the templates,
// and past surveys. Surveys made or changed in this browser show alongside the community's own.
import Link from "next/link";
import { useState } from "react";
import type { Area, Template } from "@/data/staff/surveyKit";
import { Icon } from "../../Icon";
import { say } from "../store";
import { useSurveyActions, useSurveys, type MadeSurvey } from "../surveyStore";
import { Badge, Card } from "../ui";
import { Help } from "./Help";
import { SurveyPreview, type PreviewPeople } from "./SurveyPreview";

export interface SurveyRow {
  id: string; title: string; status: string; owner: string; area: Area; audience: string; when: string; rate: number; answered: number; sendsTo: number;
  avg?: string; trend?: string; anonymous: boolean; note?: string; mine: boolean;
}
const tone: Record<string, "good" | "warn" | "info" | "neutral" | "accent"> = { open: "good", repeating: "info", automatic: "info", scheduled: "neutral", waiting: "warn", draft: "neutral", closed: "neutral" };
const label: Record<string, string> = { open: "Open", repeating: "Repeats", automatic: "Sends on its own", scheduled: "Scheduled", waiting: "Waiting for approval", draft: "Draft", closed: "Closed" };

export function SurveyList({ rows, templates, admin, approver, me, community, phone, domain, people }: { rows: SurveyRow[]; templates: Template[]; admin: boolean; approver: string; me: string; community: string; phone: string; domain: string; people: PreviewPeople }) {
  const st = useSurveys();
  const act = useSurveyActions();
  const [preview, setPreview] = useState<MadeSurvey | null>(null);
  const patched = rows.map((r) => ({ ...r, status: st.patches[r.id]?.status ?? r.status }));
  const running = patched.filter((r) => r.status === "open" || r.status === "repeating" || r.status === "automatic" || r.status === "scheduled");
  const pending = patched.filter((r) => r.status === "waiting" || r.status === "draft");
  const past = patched.filter((r) => r.status === "closed");
  const made = st.made;
  const row = (r: SurveyRow) => (
    <li key={r.id} className="sx-card su-row">
      <div>
        <h3><Link href={`/staff/surveys/${r.id}`}>{r.title}</Link></h3>
        <p>{r.audience} · {r.when}</p>
        <small>{r.owner}{r.anonymous ? " · anonymous" : ""}{r.note ? ` · ${r.note}` : ""}</small>
      </div>
      <div className="su-row-n">
        {r.sendsTo > 0 && r.status !== "waiting" && r.status !== "draft" ? <><b>{r.rate}%</b><small>{r.answered} of {r.sendsTo} answered</small></> : <small>{r.sendsTo ? `Goes to ${r.sendsTo}` : ""}</small>}
        {r.avg && <small>{r.avg}{r.trend ? ` · ${r.trend}` : ""}</small>}
      </div>
      <div className="su-row-a">
        <Badge tone={tone[r.status] ?? "neutral"}>{label[r.status] ?? r.status}</Badge>
        <Link className="sx-btn sx-btn-sm" href={`/staff/surveys/${r.id}`}>{r.status === "waiting" && admin ? "Review and approve" : "Open"}</Link>
      </div>
    </li>
  );
  return (
    <div className="su-home">
      {made.length > 0 && (
        <section aria-labelledby="su-made-h">
          <h2 id="su-made-h" className="su-h">Made here</h2>
          <ul className="su-rows">
            {made.map((m) => (
              <li key={m.id} className="sx-card su-row">
                <div>
                  <h3>{m.title}</h3>
                  <p>{m.count.replace(/^Goes to /, "To ")} · {m.timing}</p>
                  <small>{m.by} · {m.at} · {m.from} · {m.questions.length} questions{m.anonymous ? " · anonymous" : ""}</small>
                </div>
                <div className="su-row-n"><small>{m.status === "waiting" ? `Waiting for ${approver.split(" ")[0]}` : ""}</small></div>
                <div className="su-row-a">
                  <Badge tone={tone[m.status] ?? "neutral"}>{label[m.status] ?? m.status}</Badge>
                  <button type="button" className="sx-btn sx-btn-sm" onClick={() => setPreview(m)}><Icon name="eye" /> Preview</button>
                  {admin && m.status === "waiting" && <button type="button" className="sx-btn sx-btn-primary sx-btn-sm" onClick={() => { act.update(m.id, { status: m.timing.startsWith("Every") ? "repeating" : m.timing.startsWith("The day") || m.timing.startsWith("30") ? "automatic" : "open" }); say(`Approved. “${m.title}” sends now, by the rules in Automations.`); }}><Icon name="check" /> Approve</button>}
                  {(m.status === "draft" || m.status === "waiting") && <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => { const before = act.snapshot(); act.remove(m.id); say("Deleted.", () => act.restore(before)); }}>Delete</button>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      {pending.length > 0 && (
        <section aria-labelledby="su-pend-h">
          <h2 id="su-pend-h" className="su-h">Drafts and waiting for approval</h2>
          <ul className="su-rows">{pending.map(row)}</ul>
        </section>
      )}
      <section aria-labelledby="su-run-h">
        <h2 id="su-run-h" className="su-h">Running <Help label="About running surveys"><p>Open surveys close on their date. Repeating ones send again on their schedule; “Sends on its own” ones go when something happens (the day after a bus trip, 30 days after move-in). Each one that sends on its own is in Automations, with its switch.</p></Help></h2>
        <ul className="su-rows">{running.map(row)}</ul>
      </section>
      <div className="sx-grid g-2">
        <Card title="Templates" sub="Approved: they send without asking again" action={<Link className="sx-btn sx-btn-sm" href="/staff/surveys/new"><Icon name="plus" /> New survey</Link>}>
          <ul className="su-tlist">
            {[...templates, ...st.templates.map((t) => ({ id: t.id, name: t.name, about: `Saved by ${t.by}`, savedBy: t.by, questions: t.questions }))].map((t) => (
              <li key={t.id}><span><b>{t.name}</b><small>{t.about} · {t.questions.length} questions</small></span><Link className="sx-link" href={`/staff/surveys/new?template=${t.id}`}>Use</Link></li>
            ))}
          </ul>
        </Card>
        <Card title="Past surveys" sub="Copy one, like a past event">
          <ul className="su-tlist">
            {past.map((r) => <li key={r.id}><span><b>{r.title}</b><small>{r.when} · {r.rate}% replied</small></span><Link className="sx-link" href={`/staff/surveys/new?copy=${r.id}`}>Copy</Link></li>)}
            {!past.length && <li className="sx-hint">Nothing closed yet.</li>}
          </ul>
        </Card>
      </div>
      {preview && <SurveyPreview sv={{ id: preview.id, title: preview.title, questions: preview.questions, topic: preview.topic, anonymous: preview.anonymous, thankYou: preview.thankYou, closesLabel: preview.closes }} community={community} phone={phone} domain={domain} people={people} me={me} onClose={() => setPreview(null)} />}
    </div>
  );
}
