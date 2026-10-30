"use client";

import Image from "next/image";
import { useState } from "react";
import { staffPeople } from "@/data/staff/people";
import type { Approval } from "@/data/staff/shared";
import { Icon } from "../Icon";
import { Avatar, Badge } from "./ui";

export function Approvals({ items, approver }: { items: (Approval & { when: string })[]; approver: string }) {
  const [state, setState] = useState<Record<string, "ok" | "req" | "asking">>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const waiting = items.filter((i) => !state[i.id] || state[i.id] === "asking").length;

  return (
    <section className="sx-card">
      <header className="sx-card-head">
        <div>
          <h2>Waiting for {approver} <Badge tone={waiting ? "accent" : "good"}>{waiting ? `${waiting} waiting` : "All done"}</Badge></h2>
          <p>Posts with resident photos, pricing and menus for special days are approved by the Executive Director before they publish.</p>
        </div>
      </header>
      <div className="sx-card-body" style={{ paddingTop: 4 }}>
        {items.map((a) => {
          const s = state[a.id];
          const who = staffPeople[a.by];
          return (
            <article key={a.id} className="appr">
              <div className="appr-img">
                {a.photo ? <Image src={a.photo} alt="" fill sizes="120px" /> : <Icon name="doc" />}
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="appr-meta">
                  <Avatar who={a.by} size={24} />
                  <span><b style={{ color: "var(--sx-ink)" }}>{who.name}</b> · {who.role}</span>
                  <span>· {a.when}</span>
                  <Badge tone="neutral">{a.kind}</Badge>
                </div>
                <h3>{a.title}</h3>
                <p>{a.detail}</p>
                {a.diff && (
                  <div className="appr-diff">
                    <s>{a.diff[0]}</s> <Icon name="arrow" /> <b>{a.diff[1]}</b>
                  </div>
                )}
                {a.note && <p style={{ fontStyle: "italic" }}>“{a.note}”</p>}
                <div className="appr-ch">
                  {a.channels.map((c) => <Badge key={c} tone="info">{c}</Badge>)}
                </div>
              </div>
              <div className="appr-act">
                {s === "ok" ? (
                  <span className="appr-done" style={{ color: "var(--sx-good)" }} role="status"><Icon name="check" /> Approved and published</span>
                ) : s === "req" ? (
                  <span className="appr-done" style={{ color: "var(--sx-warn)" }} role="status"><Icon name="edit" /> Sent back to {who.name.split(" ")[0]}</span>
                ) : (
                  <>
                    <button type="button" className="sx-btn sx-btn-primary" onClick={() => setState((x) => ({ ...x, [a.id]: "ok" }))}>
                      <Icon name="check" /> Approve and publish
                    </button>
                    <button type="button" className="sx-btn" onClick={() => setState((x) => ({ ...x, [a.id]: "asking" }))} aria-expanded={s === "asking"}>
                      <Icon name="edit" /> Request changes
                    </button>
                  </>
                )}
              </div>
              {s === "asking" && (
                <div className="appr-req sx-form">
                  <label>
                    Note to {who.name.split(" ")[0]}
                    <textarea rows={2} value={notes[a.id] ?? ""} onChange={(e) => setNotes((n) => ({ ...n, [a.id]: e.target.value }))} placeholder="What should change?" />
                  </label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" className="sx-btn sx-btn-primary sx-btn-sm" onClick={() => setState((x) => ({ ...x, [a.id]: "req" }))}>Send</button>
                    <button type="button" className="sx-btn sx-btn-sm" onClick={() => setState((x) => { const n = { ...x }; delete n[a.id]; return n; })}>Cancel</button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
