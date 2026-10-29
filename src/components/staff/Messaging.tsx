"use client";

import { useState } from "react";
import { communities } from "@/data/group";
import { replies, sends, stats } from "@/data/staff";
import { Badge, Meter } from "./ui";
import { Icon } from "../Icon";

export function Compose() {
  const [to, setTo] = useState("larkmoor-house");
  const [wing, setWing] = useState("All families");
  const [body, setBody] = useState("Reminder: the flu and COVID clinic is in the Garden Room on Wednesday, 10 am to 2 pm. Families are welcome too; bring your insurance card.");
  const [sent, setSent] = useState(false);
  const n = to === "all" ? stats.reduce((t, s) => t + s.familiesReached, 0) : stats.find((s) => s.slug === to)!.familiesReached;
  const count = wing === "All families" ? n : Math.round(n * (wing.startsWith("Memory") ? 0.18 : 0.82));

  if (sent)
    return (
      <div className="sx-card-body went">
        <div className="went-head">
          <Icon name="check" />
          <div>
            <h2>Sent to {count} families</h2>
            <p>Translated into each family’s language. Delivery updates below as they come in.</p>
          </div>
        </div>
        <button className="sx-btn" type="button" onClick={() => setSent(false)}>
          Write another
        </button>
      </div>
    );

  return (
    <form
      className="sx-card-body sx-form"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      <div className="sx-row">
        <label>
          To
          <select value={to} onChange={(e) => setTo(e.target.value)}>
            <option value="all">All communities</option>
            {communities.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Who
          <select value={wing} onChange={(e) => setWing(e.target.value)}>
            <option>All families</option>
            <option>Memory care wing</option>
            <option>First floor (assisted living)</option>
          </select>
        </label>
      </div>
      <label>
        Message
        <textarea value={body} onChange={(e) => setBody(e.target.value)} />
      </label>
      <div className="sx-row">
        <label className="sx-check">
          <input type="checkbox" defaultChecked /> Text and email
        </label>
        <label className="sx-check">
          <input type="checkbox" defaultChecked /> Translate per family (6 languages)
        </label>
      </div>
      <div className="pub-foot">
        <p>
          {count} families · about {Math.round(count * 0.14)} will receive it in Spanish, Vietnamese, Chinese, Korean or Tagalog
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="sx-btn" type="button">
            Schedule
          </button>
          <button className="sx-btn sx-btn-primary" type="submit">
            <Icon name="send" /> Send now
          </button>
        </div>
      </div>
    </form>
  );
}

export function Tracking() {
  return (
    <div className="sx-table-wrap">
      <table className="sx-table">
        <thead>
          <tr>
            <th>Message</th>
            <th>Sent</th>
            <th className="num">Sent</th>
            <th className="num">Delivered</th>
            <th style={{ minWidth: 140 }}>Opened</th>
            <th className="num">Replied</th>
          </tr>
        </thead>
        <tbody>
          {sends().map((s) => (
            <tr key={s.id}>
              <td>
                <b>{s.title}</b>{" "}
                <Badge tone={s.kind === "Urgent" ? "bad" : s.kind === "Wing" ? "info" : "neutral"}>{s.kind}</Badge>
                <br />
                <small style={{ color: "var(--sx-ink-3)" }}>
                  {s.to} · {s.langs}
                </small>
              </td>
              <td style={{ whiteSpace: "nowrap" }}>{s.when}</td>
              <td className="num">{s.sent.toLocaleString()}</td>
              <td className="num">{Math.round((s.delivered / s.sent) * 100)}%</td>
              <td>
                <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Meter v={Math.round((s.opened / s.sent) * 100)} />
                  <b>{Math.round((s.opened / s.sent) * 100)}%</b>
                </span>
              </td>
              <td className="num">{s.replied}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Inbox() {
  const list = replies();
  const [sel, setSel] = useState(list[0].id);
  const [answered, setAnswered] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState("");
  const r = list.find((x) => x.id === sel)!;
  return (
    <div className="inbox">
      <ul className="inbox-list">
        {list.map((x) => (
          <li key={x.id} className={x.unread && !answered[x.id] ? "unread" : ""}>
            <button type="button" aria-pressed={x.id === sel} onClick={() => { setSel(x.id); setDraft(""); }}>
              <b>
                {x.from} <small>{x.when}</small>
              </b>
              <span>{x.translated || x.original}</span>
              <span style={{ fontSize: 12, color: "var(--sx-ink-3)" }}>
                Re: {x.about} {x.lang !== "English" && `· ${x.lang}`}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className="thread">
        <div className="thread-h">
          <b>{r.from}</b>
          <span>
            {r.resident} · replying to “{r.about}”
          </span>
        </div>
        <div className="t-msg">
          {r.original}
          <small>
            {r.when} · {r.lang}
          </small>
        </div>
        {r.translated && (
          <div className="t-msg t-tr">
            {r.translated}
            <small>
              <Icon name="translate" /> Translated from {r.lang}
            </small>
          </div>
        )}
        {answered[r.id] && (
          <div className="t-msg t-me">
            {answered[r.id]}
            <small>Just now · {r.lang !== "English" ? `sent in ${r.lang}` : "sent"}</small>
          </div>
        )}
        {!answered[r.id] && (
          <form
            className="sx-form"
            onSubmit={(e) => {
              e.preventDefault();
              setAnswered({ ...answered, [r.id]: draft || "Of course. See you then, and drive safely." });
            }}
          >
            <label>
              Reply {r.lang !== "English" && <span style={{ fontWeight: 400, color: "var(--sx-ink-3)" }}>· write in English, they receive it in {r.lang}</span>}
              <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Of course. See you then, and drive safely." />
            </label>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="sx-btn sx-btn-primary" type="submit">
                <Icon name="send" /> Reply
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
