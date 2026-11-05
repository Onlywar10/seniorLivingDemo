"use client";

// The content library (filter, "Use this") and the print queue (Print, Download PDF). Kept in this browser only.
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { LibraryItem } from "@/data/staff/alpha";
import { Icon } from "../../Icon";
import { Badge } from "../ui";

type Kind = LibraryItem["kind"];
const kinds: Kind[] = ["Activity idea", "Post template", "Flyer template", "Calendar template", "Menu template"];
const targetOf = (k: Kind) =>
  k === "Activity idea" ? { href: "/staff/calendar", label: "Added to the calendar draft" } : k === "Menu template" ? { href: "/staff/menus", label: "Opened in Menus" } : { href: "/staff/publish", label: "Opened in Post once" };

export function LibraryGrid({ items }: { items: (LibraryItem & { here?: string })[] }) {
  const [kind, setKind] = useState<Kind | "All">("All");
  const [used, setUsed] = useState<Record<string, boolean>>({});
  const shown = items.filter((i) => kind === "All" || i.kind === kind);
  return (
    <>
      <div className="sx-chips" role="group" aria-label="Show">
        {(["All", ...kinds] as const).map((k) => (
          <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)}>{k === "All" ? "Everything" : `${k}s`}</button>
        ))}
      </div>
      <ul className="lb-grid">
        {shown.map((i) => {
          const tgt = targetOf(i.kind);
          return (
            <li key={i.id} className="lb-item">
              {i.photo ? (
                <span className="lb-img"><Image src={i.photo} alt="" fill sizes="(max-width: 700px) 100vw, 300px" /></span>
              ) : (
                <span className="lb-img lb-doc"><Icon name={i.kind === "Post template" ? "send" : i.kind === "Menu template" ? "fork" : i.kind === "Calendar template" ? "calendar" : "doc"} /></span>
              )}
              <div className="lb-b">
                <p className="lb-k"><Badge tone="neutral">{i.kind}</Badge> <span className="sx-hint">{i.tag}</span></p>
                <h3>{i.title}</h3>
                <p>{i.text}</p>
                <p className="lb-stats">
                  <span aria-label={`Rated ${i.rating} out of 5`}><Icon name="star" /> {i.rating.toFixed(1)}</span>
                  <span>Used {i.used} times</span>
                </p>
                {i.worked && <p className="lb-worked"><b>What worked:</b> {i.worked}</p>}
                {i.here && <p className="lb-worked"><b>Here:</b> {i.here}</p>}
              </div>
              <div className="lb-foot">
                {used[i.id] ? (
                  <Link href={tgt.href} className="al-done good"><Icon name="check" /> {tgt.label}</Link>
                ) : (
                  <button type="button" className="sx-btn sx-btn-sm" onClick={() => setUsed((u) => ({ ...u, [i.id]: true }))}>Use this</button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export interface PrintRow { id: string; title: string; size: string; copies: number; note: string }

export function PrintList({ items, printer }: { items: PrintRow[]; printer: string }) {
  const [done, setDone] = useState<Record<string, "print" | "pdf">>({});
  return (
    <ul className="pr-list">
      {items.map((p) => (
        <li key={p.id}>
          <span className="pr-ico"><Icon name="printer" /></span>
          <span className="pr-t">
            <b>{p.title}</b>
            <small>{p.size} · {p.copies} copies · {p.note}</small>
          </span>
          <span className="pr-act">
            {done[p.id] === "print" ? (
              <span className="al-done good" role="status"><Icon name="check" /> Sent to {printer}</span>
            ) : done[p.id] === "pdf" ? (
              <span className="al-done good" role="status"><Icon name="download" /> PDF ready</span>
            ) : (
              <>
                <button type="button" className="sx-btn sx-btn-sm sx-btn-primary" onClick={() => setDone((d) => ({ ...d, [p.id]: "print" }))}><Icon name="printer" /> Print</button>
                <button type="button" className="sx-btn sx-btn-sm" onClick={() => setDone((d) => ({ ...d, [p.id]: "pdf" }))}><Icon name="download" /> Download PDF</button>
              </>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
