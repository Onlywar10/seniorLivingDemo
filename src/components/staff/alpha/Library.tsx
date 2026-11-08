"use client";

// Print: the large-print items ready to send to the front desk printer. Kept in this browser only.
import { useState } from "react";
import { Icon } from "../../Icon";

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
