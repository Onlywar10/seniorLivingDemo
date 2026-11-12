"use client";

// Feedback → Family concerns: each one has an owner and a status (Open, In progress, Resolved) and stays open until
// someone marks it resolved. Never answered by the AI: a person always replies. Reassign, add a note, or mark it
// resolved once the family has been told. Care concerns are not held here: they were passed straight to the care team
// to be recorded in the community's own care system, so Kinlight shows only where each went and when (no notes, no
// "resolved"). Changes stay in this browser.
import { useState } from "react";
import type { Concern, ConcernStatus } from "@/data/staff/engage";
import { Icon } from "../../Icon";
import { FamilyLink, ResidentLink } from "../ResidentLink";
import { say, useConcernPatches, usePatchConcern } from "../store";
import { Badge } from "../ui";
import { Help } from "./Help";

export interface Owner { key: string; name: string; label: string }

const first = (n = "") => n.split(" ")[0];
const tone = (s: ConcernStatus) => (s === "Resolved" ? "good" : s === "In progress" ? "info" : "warn");

export function FeedbackConcerns({ items, owners, me }: { items: Concern[]; owners: Owner[]; me: string }) {
  // Shared with Today: a concern resolved there is resolved here, and the other way round.
  const patches = useConcernPatches();
  const patch = usePatchConcern();
  const rows = items.filter((c) => !c.care).map((c) => ({ ...c, ...patches[c.id] }));
  const care = items.filter((c) => c.care);
  const [act, setAct] = useState<{ id: string; kind: "note" | "owner" | "resolve" } | null>(null);
  const [val, setVal] = useState("");
  const [filter, setFilter] = useState<"open" | "all">("open");

  const upd = (id: string, f: (c: Concern) => Partial<Concern>) => { const c = rows.find((x) => x.id === id); if (c) patch(id, f(c)); };
  const done = () => { setAct(null); setVal(""); };

  const submit = (c: Concern) => {
    if (!act) return;
    say(act.kind === "note" ? "Note added." : act.kind === "owner" ? "Reassigned. They got an alert." : "Resolved. Updated on Today too.");
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
            <p className="fb-c-from"><FamilyLink name={c.from} resident={c.resident} bold={false} />, {c.relation.toLowerCase()} of <ResidentLink name={c.resident} bold={false} /></p>
            <div className="pt-facts">
              <span><Icon name="users" /> {c.ownerName}</span>
              <span><Icon name="lock" /> Never answered by AI</span>
              <span>{c.how === "Marked as a concern by staff" ? "Marked by staff" : "Spotted by AI"}</span>
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
                    <textarea rows={2} value={val} onChange={(e) => setVal(e.target.value)} placeholder={act.kind === "note" ? "Called back; checking the statement" : "Called and explained what we changed"} required={act.kind === "note"} />
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
                <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => { setAct({ id: c.id, kind: "note" }); setVal(""); }}><Icon name="edit" /> Note</button>
                <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => { setAct({ id: c.id, kind: "owner" }); setVal(""); }}><Icon name="users" /> Reassign</button>
              </div>
            ))}
          </li>
        ))}
      </ul>

      {care.length > 0 && (
        <section className="fb-care" aria-labelledby="fb-care-h">
          <h3 id="fb-care-h">
            Passed to the care team
            <Help label="Why care concerns aren’t kept here">
              <p>Care and safety concerns aren’t held in Kinlight. Each one is passed straight to the care team, to be recorded in the community’s own care system.</p>
              <p>Kinlight shows only that it was routed, to whom and when. It keeps no care record, notes or outcome here, and never answers them with AI.</p>
            </Help>
          </h3>
          <ul className="fb-concerns">
            {care.map((c) => (
              <li key={c.id} className="fb-concern s-care">
                <div className="fb-c-h">
                  <span className="pt-tag k-ask">{c.topic}</span>
                  <Badge tone="info"><Icon name="send" /> Passed to the care team</Badge>
                  <span className="pt-ago">{c.ago}</span>
                </div>
                <p className="pt-quote">“{c.text}”</p>
                <p className="fb-c-from"><FamilyLink name={c.from} resident={c.resident} bold={false} />, {c.relation.toLowerCase()} of <ResidentLink name={c.resident} bold={false} /></p>
                <div className="pt-facts">
                  <span><Icon name="users" /> To {c.care!.team}, {c.care!.at.replace(/^./, (x) => x.toLowerCase())}</span>
                  <span><Icon name="doc" /> Recorded in {c.care!.system}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
