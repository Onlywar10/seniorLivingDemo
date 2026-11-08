"use client";

// Feedback → Resident suggestions: ideas from paper slips, the QR code on printed calendars, or a text. Listed with
// votes; "Make it an event" opens Post with the idea filled in; when an idea makes the calendar, the resident is told.
// The front desk logs paper slips here. Changes stay in this browser.
import Link from "next/link";
import { useState } from "react";
import { Icon } from "../../Icon";
import { Badge } from "../ui";

export interface IdeaRow { id: string; text: string; from: string; who?: string; status: string; votes: number; ago: string; event?: { title: string; when: string }; note?: string }

const first = (n = "") => n.split(" ")[0];
const order = ["New", "Planned", "On the calendar", "Not this time"];

export function FeedbackSuggestions({ ideas, residents, me }: { ideas: IdeaRow[]; residents: string[]; me: string }) {
  const [rows, setRows] = useState(ideas);
  const [logging, setLogging] = useState(false);
  const [text, setText] = useState("");
  const [who, setWho] = useState("");
  const [toast, setToast] = useState("");
  const say = (t: string) => { setToast(t); window.setTimeout(() => setToast(""), 4000); };

  const sorted = [...rows].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status) || b.votes - a.votes);

  const log = () => {
    const t = text.trim();
    if (!t) return;
    const id = `slip-${Date.now()}`;
    setRows((xs) => [{ id, text: t, from: "Paper slip", who: who || undefined, status: "New", votes: 1, ago: `Just now, logged by ${first(me)}` }, ...xs]);
    setText(""); setWho(""); setLogging(false);
    say(who ? `Logged. If it makes the calendar, ${first(who)} will be told.` : "Logged. It’s on the list with one vote.");
  };

  const vote = (id: string) => setRows((xs) => xs.map((x) => (x.id === id ? { ...x, votes: x.votes + 1 } : x)));
  const plan = (id: string) => setRows((xs) => xs.map((x) => (x.id === id ? { ...x, status: "Planned" } : x)));

  return (
    <>
      <div className="fb-bar">
        {logging ? (
          <form className="fb-slip sx-form" onSubmit={(e) => { e.preventDefault(); log(); }}>
            <label>
              What the slip says
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="A trip to the farmers’ market" autoFocus />
            </label>
            <label>
              From
              <select value={who} onChange={(e) => setWho(e.target.value)}>
                <option value="">No name on it</option>
                {residents.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            <div className="pt-act">
              <button type="submit" className="sx-btn sx-btn-primary"><Icon name="check" /> Log the slip</button>
              <button type="button" className="sx-btn" onClick={() => setLogging(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <button type="button" className="sx-btn" onClick={() => setLogging(true)}><Icon name="plus" /> Log a paper slip</button>
        )}
      </div>

      <ul className="fb-ideas">
        {sorted.map((x) => (
          <li key={x.id} className={x.status === "Not this time" ? "muted" : ""}>
            <span className="fb-votes" aria-label={`${x.votes} votes`}><b>{x.votes}</b><small>{x.votes === 1 ? "vote" : "votes"}</small></span>
            <div className="fb-idea">
              <p>“{x.text}”</p>
              <small>{x.who ?? "No name"} · {x.from} · {x.ago}</small>
              {x.status === "On the calendar" ? (
                <span className="pt-idea-done">
                  <Icon name="check" />
                  <span>{x.event ? `${x.event.title}, ${x.event.when}. ` : "On the calendar. "}{x.who ? `“Your idea made the calendar”: ${first(x.who)} was told.` : "Posted on the suggestion board: no name to tell."}</span>
                </span>
              ) : x.status === "Not this time" ? (
                <span className="sx-hint">Not this time{x.note ? `: ${x.note}` : ""}</span>
              ) : (
                <span className="fb-idea-a">
                  {x.status === "Planned" && <Badge tone="info">Planned</Badge>}
                  <Link className="sx-btn sx-btn-sm sx-btn-primary" href={`/staff/post?type=event&idea=${encodeURIComponent(x.id)}`}><Icon name="plus" /> Make it an event</Link>
                  {x.status === "New" && <button type="button" className="sx-btn sx-btn-sm" onClick={() => plan(x.id)}>Plan it</button>}
                  <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => vote(x.id)} aria-label={`Add a vote for ${x.text}`}>+1 vote</button>
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
      {toast && <div className="sx-toast" role="status"><Icon name="check" /> {toast}</div>}
    </>
  );
}
