"use client";

import Image from "next/image";
import { useState } from "react";
import { approvals } from "@/data/staff";
import { Badge } from "./ui";
import { Icon } from "../Icon";

export function Approvals({ where }: { where?: string }) {
  const items = approvals().filter((a) => !where || a.where === where);
  const [state, setState] = useState<Record<string, "approved" | "changes">>({});
  const waiting = items.filter((a) => !state[a.id]).length;
  return (
    <section className="sx-card">
      <header className="sx-card-head">
        <div>
          <h2>Waiting for you</h2>
          <p>Approve and it publishes straight away, everywhere it was meant to go</p>
        </div>
        <Badge tone={waiting ? "warn" : "good"}>{waiting ? `${waiting} waiting` : "All done"}</Badge>
      </header>
      <div className="sx-card-body">
        {items.map((a) => (
          <article key={a.id} className="appr">
            <div className="appr-img">
              <Image src={a.photo} alt="" fill sizes="96px" />
            </div>
            <div>
              <h3>{a.title}</h3>
              <div className="appr-meta">
                <Badge tone="neutral">{a.kind}</Badge>
                <span>{a.where}</span>
                <span>
                  Submitted by <b>{a.who}</b>, {a.role} · {a.when}
                </span>
              </div>
              <p>{a.note}</p>
            </div>
            <div className="appr-act">
              {state[a.id] === "approved" ? (
                <span className="appr-done" style={{ color: "var(--sx-good)" }}>
                  <Icon name="check" /> Approved and published
                </span>
              ) : state[a.id] === "changes" ? (
                <span className="appr-done" style={{ color: "var(--sx-warn)" }}>
                  Sent back to {a.who.split(" ")[0]} with your note
                </span>
              ) : (
                <>
                  <button className="sx-btn" type="button">
                    <Icon name="eye" /> Preview
                  </button>
                  <button className="sx-btn" type="button" onClick={() => setState({ ...state, [a.id]: "changes" })}>
                    Ask for changes
                  </button>
                  <button className="sx-btn sx-btn-primary" type="button" onClick={() => setState({ ...state, [a.id]: "approved" })}>
                    <Icon name="check" /> Approve
                  </button>
                </>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
