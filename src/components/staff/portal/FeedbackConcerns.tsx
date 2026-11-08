"use client";

// Feedback → Family concerns: each one has an owner and a status (Open, In progress, Resolved) and stays open until
// someone marks it resolved. Never answered by the AI: a person always replies. Reassign, add a note, or mark it
// resolved once the family has been told. Changes stay in this browser.
import { useState } from "react";
import type { Concern, ConcernStatus } from "@/data/staff/engage";
import { Icon } from "../../Icon";
import { Badge } from "../ui";

export interface Owner { key: string; name: string; label: string }

const first = (n = "") => n.split(" ")[0];
const tone = (s: ConcernStatus) => (s === "Resolved" ? "good" : s === "In progress" ? "info" : "warn");

export function FeedbackConcerns({ items, owners, me }: { items: Concern[]; owners: Owner[]; me: string }) {
  const [rows, setRows] = useState(items);
  const [act, setAct] = useState<{ id: string; kind: "note" | "owner" | "resolve" } | null>(null);
  const [val, setVal] = useState("");
  const [filter, setFilter] = useState<"open" | "all">("open");

  const upd = (id: string, f: (c: Concern) => Partial<Concern>) => setRows((xs) => xs.map((x) => (x.id === id ? { ...x, ...f(x) } : x)));
  const done = () => { setAct(null); setVal(""); };

  const submit = (c: Concern) => {
    if (!act) return;
    if (act.kind === "note" && val.trim()) upd(c.id, (x) => ({ log: [...x.log, `${first(me)}: ${val.trim()}`], status: x.status === "Open" ? "In progress" : x.status }));
    if (act.kind === "owner" && val) {
      const o = owners.find((x) => x.key === val);
      if (o) upd(c.id, (x) => ({ owner: o.key, ownerName: o.name, log: [...x.log, `${first(me)} passed it to ${o.name}. ${first(o.name)} got an alert.`] }));
    }
    if (act.kind === "resolve") upd(c.id, (x) => ({ status: "Resolved", log: [...x.log, `${val.trim() ? `${first(me)}: ${val.trim()} ` : ""}${first(x.from)} was told by ${first(me)}. Marked resolved.`] }));
    done();
  };

  const shown = rows.filter((c) => filter === "all" || c.status !== "Resolved");
  const open = rows.filter((c) => c.status !== "Resolved").length;

  return (
    <>
      <div className="fb-bar">
        <span className="sx-seg" role="group" aria-label="Show">
          <button type="button" aria-pressed={filter === "open"} onClick={() => setFilter("open")}>Not resolved ({open})</button>
          <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>All ({rows.length})</button>
        </span>
      </div>
      {shown.length === 0 && <p className="pt-empty"><Icon name="check" /> Every concern is resolved.</p>}
      <ul className="fb-concerns">
        {shown.map((c) => (
          <li key={c.id} className={`fb-concern s-${c.status === "Resolved" ? "done" : c.status === "In progress" ? "prog" : "open"}`}>
            <div className="fb-c-h">
              <span className="pt-tag k-ask">{c.topic}</span>
              <Badge tone={tone(c.status)}>{c.status}</Badge>
              <span className="pt-ago">{c.ago}</span>
            </div>
            <p className="pt-quote">“{c.text}”</p>
            <p className="fb-c-from">{c.from}, {c.relation.toLowerCase()} of {c.resident} · {c.how}</p>
            <div className="pt-facts">
              <span><Icon name="users" /> Owner: {c.ownerName}</span>
              <span className="warn"><Icon name="lock" /> Never answered by the AI</span>
            </div>
            <ol className="fb-log" aria-label="What’s happened">
              {c.log.map((l, i) => <li key={i}>{l}</li>)}
            </ol>
            {c.status !== "Resolved" && (act?.id === c.id ? (
              <form className="fb-act sx-form" onSubmit={(e) => { e.preventDefault(); submit(c); }}>
                {act.kind === "owner" ? (
                  <label>
                    Pass it to
                    <select value={val} onChange={(e) => setVal(e.target.value)} required>
                      <option value="">Choose who</option>
                      {owners.filter((o) => o.key !== c.owner).map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                    </select>
                  </label>
                ) : (
                  <label>
                    {act.kind === "note" ? "Note (staff only)" : `How was ${first(c.from)} told? (optional)`}
                    <textarea rows={2} value={val} onChange={(e) => setVal(e.target.value)} placeholder={act.kind === "note" ? "Called back; checking with the night team" : "Called and explained what we changed"} required={act.kind === "note"} />
                  </label>
                )}
                <div className="pt-act">
                  <button type="submit" className="sx-btn sx-btn-primary">
                    <Icon name="check" /> {act.kind === "note" ? "Add the note" : act.kind === "owner" ? "Reassign" : "Mark resolved"}
                  </button>
                  <button type="button" className="sx-btn" onClick={done}>Cancel</button>
                </div>
              </form>
            ) : (
              <div className="pt-act">
                <button type="button" className="sx-btn sx-btn-primary sx-btn-sm" onClick={() => { setAct({ id: c.id, kind: "resolve" }); setVal(""); }}><Icon name="check" /> Mark resolved</button>
                <button type="button" className="sx-btn sx-btn-sm" onClick={() => { setAct({ id: c.id, kind: "note" }); setVal(""); }}><Icon name="edit" /> Add a note</button>
                <button type="button" className="sx-btn sx-btn-sm" onClick={() => { setAct({ id: c.id, kind: "owner" }); setVal(""); }}><Icon name="users" /> Reassign</button>
              </div>
            ))}
          </li>
        ))}
      </ul>
    </>
  );
}
