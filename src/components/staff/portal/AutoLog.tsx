"use client";

// The log of what Kinlight sent on its own: one line per message (when, who, which automation, how, what happened),
// opening to the exact message and any reply. Automations shows the whole week with filters; each resident's page in
// People shows the same lines for them and their family ("We never got that").
import { useState } from "react";
import { STATUS_LABEL, whenOf, type LogRow, type Status } from "@/data/staff/autoText";
import { Icon } from "../../Icon";
import { Badge } from "../ui";
import { Drawer } from "./Drawer";

const tone: Record<Status, "good" | "warn" | "bad" | "neutral" | "info" | "accent"> = { sent: "neutral", delivered: "good", opened: "good", replied: "info", failed: "bad", "opted-out": "warn" };
export function StatusBadge({ s }: { s: Status }) {
  return <Badge tone={tone[s]}>{s === "failed" ? <Icon name="alert" /> : s === "delivered" || s === "opened" ? <Icon name="check" /> : null} {STATUS_LABEL[s]}</Badge>;
}

const htmlLang = (l: string) => (l === "Spanish" ? "es" : l === "Chinese" ? "zh" : l === "Russian" ? "ru" : l === "Vietnamese" ? "vi" : l === "Tagalog" ? "tl" : undefined);

/** One message in full: exactly what was sent, in their language, what happened, and any reply. */
export function RowDetail({ r, name, todayIso, onClose }: { r: LogRow; name: string; todayIso: string; onClose: () => void }) {
  const steps: [string, string][] = [];
  steps.push(["Sent", whenOf(r.at, todayIso)]);
  if (r.status === "failed") steps.push(["Not delivered", r.fail ?? ""]);
  else if (r.status !== "sent") steps.push(["Delivered", r.ch === "Email" ? "To their inbox" : "To their phone"]);
  if (r.status === "opened") steps.push(["Opened", "They opened the email"]);
  if (r.reply) steps.push([r.status === "opted-out" ? "Opted out" : "Replied", whenOf(r.reply.at, todayIso)]);
  return (
    <Drawer title={name} sub={`To ${r.to} · ${r.rel} · ${r.ch}${r.lang !== "English" ? ` · ${r.lang}` : ""}`} onClose={onClose}>
      <div className="au-detail">
        {r.asked && <div className="au-bubble them"><p>{r.asked}</p><small>{r.to.split(" ")[0]} asked</small></div>}
        <div className={`au-bubble${r.ch === "Email" ? " mail" : ""}`}>
          {r.subject && <p className="au-subject">{r.subject}</p>}
          {r.original ? (
            <>
              <p lang={htmlLang(r.lang)}>{r.original}</p>
              <p className="au-en"><small>In English</small>{r.text}</p>
            </>
          ) : (
            <p>{r.text}</p>
          )}
          <small>Sent automatically by Kinlight{r.combined ? " · combined: the daily limit" : ""}{!r.original && r.lang !== "English" && !r.combined ? ` · sent in ${r.lang}, English shown` : ""}</small>
        </div>
        {r.reply && (
          <div className="au-bubble them">
            <p>{r.reply.text}</p>
            <small>{r.to.split(" ")[0]} replied · {whenOf(r.reply.at, todayIso)}</small>
          </div>
        )}
        {r.reply?.handled && <p className="au-handled"><Icon name="spark" /> {r.reply.handled}</p>}
        {r.status === "opted-out" && <p className="au-handled"><Icon name="lock" /> STOP is always answered at once, without the AI. Nothing more is texted to this number unless they reply START.</p>}
        <ol className="au-steps" aria-label="What happened">
          {steps.map(([k, v]) => <li key={k} className={k === "Not delivered" ? "bad" : undefined}><b>{k}</b><span>{v}</span></li>)}
        </ol>
        <p className="sx-hint">Only what was sent is kept here. Nothing about health or care is ever added.</p>
      </div>
    </Drawer>
  );
}

/** The lines themselves. `names` turns an automation id into its name. */
export function LogLines({ rows, names, todayIso, showTo = true, empty = "Nothing sent." }: { rows: LogRow[]; names: Record<string, string>; todayIso: string; showTo?: boolean; empty?: string }) {
  const [open, setOpen] = useState<LogRow | null>(null);
  if (!rows.length) return <p className="pt-empty">{empty}</p>;
  return (
    <>
      <div className="sx-table-wrap">
        <table className="sx-table au-log">
          <thead>
            <tr><th>When</th>{showTo && <th>To</th>}<th>Automation</th><th>How</th><th>What happened</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="au-when">{whenOf(r.at, todayIso)}</td>
                {showTo && <td><b>{r.to}</b><small>{r.rel}</small></td>}
                <td>
                  <button type="button" className="au-open" onClick={() => setOpen(r)} aria-label={`Open the message to ${r.to}: ${names[r.auto] ?? r.auto}`}>
                    {names[r.auto] ?? r.auto}
                  </button>
                  <small className="au-snip">{r.subject ? `${r.subject}: ` : ""}{r.text}</small>
                </td>
                <td><span className="au-ch"><Icon name={r.ch === "Email" ? "mail" : "sms"} /> {r.ch}</span>{r.lang !== "English" && <small>{r.lang}</small>}</td>
                <td><StatusBadge s={r.status} />{r.fail && <small>{r.fail}</small>}{r.reply && r.status !== "failed" && <small>“{r.reply.text}”</small>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open && <RowDetail r={open} name={names[open.auto] ?? open.auto} todayIso={todayIso} onClose={() => setOpen(null)} />}
    </>
  );
}

/** On a resident's page: what Kinlight sent them and their family, by person. */
export function SentByKinlight({ rows, names, todayIso, people, focus, fn }: { rows: LogRow[]; names: Record<string, string>; todayIso: string; people: string[]; focus?: string; fn: string }) {
  const [who, setWho] = useState<string>(focus && people.includes(focus) ? focus : "");
  const [more, setMore] = useState(30);
  const shown = rows.filter((r) => !who || r.to === who);
  const failed = shown.filter((r) => r.status === "failed").length;
  return (
    <section className="sx-card sx-card-body rs-sec au-sent">
      <header className="rs-sec-h">
        <div>
          <h2>Messages Kinlight sent</h2>
          <p className="sx-hint">The last 7 days, to {fn} and their family: reminders, invites, confirmations and the morning menu. Staff messages are under Family.</p>
        </div>
      </header>
      <div className="sx-chips" role="group" aria-label="Show messages to">
        <button type="button" aria-pressed={!who} onClick={() => setWho("")}>Everyone <small>{rows.length}</small></button>
        {people.map((p) => {
          const n = rows.filter((r) => r.to === p).length;
          return <button key={p} type="button" aria-pressed={who === p} onClick={() => setWho(p)} disabled={!n}>{p} <small>{n}</small></button>;
        })}
      </div>
      {failed > 0 && <p className="sx-callout"><Icon name="alert" /> <span>{failed === 1 ? "One message" : `${failed} messages`} didn’t arrive. Open it to see why, or fix it in Automations → Problems.</span></p>}
      <LogLines rows={shown.slice(0, more)} names={names} todayIso={todayIso} showTo={!who} empty={who ? `Nothing sent to ${who} in the last 7 days.` : "Nothing sent in the last 7 days."} />
      {shown.length > more && <button type="button" className="sx-btn sx-btn-sm" onClick={() => setMore((m) => m + 30)}>Show {Math.min(30, shown.length - more)} more</button>}
    </section>
  );
}
