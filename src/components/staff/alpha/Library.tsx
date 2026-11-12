"use client";

// Print: the large-print items ready to send to the front desk printer, with previews of a QR check-in sign and a
// suggestion slip. Kept in this browser only.
import { useState } from "react";
import { Icon } from "../../Icon";

export interface PrintRow { id: string; title: string; size: string; copies: number; note: string; sign?: { id: string; title: string; when: string; place: string } }

/** A stable 32-bit hash of a string (FNV-1a). */
function h32(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** A QR-like grid drawn from `seed`: three finder squares and deterministic modules. Same seed, same picture. */
export function QrGrid({ seed, size = 21, label }: { seed: string; size?: number; label: string }) {
  let x = h32(seed) || 1;
  const rnd = () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x; };
  const finder = (r: number, c: number) => {
    const inF = (r0: number, c0: number) => r >= r0 && r < r0 + 7 && c >= c0 && c < c0 + 7;
    const at = inF(0, 0) ? [0, 0] : inF(0, size - 7) ? [0, size - 7] : inF(size - 7, 0) ? [size - 7, 0] : null;
    if (!at) return null;
    const dr = r - at[0], dc = c - at[1];
    const ring = Math.max(Math.abs(dr - 3), Math.abs(dc - 3));
    return ring !== 2;
  };
  const cells: [number, number][] = [];
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) {
      const f = finder(r, c);
      const sep = (r === 7 && (c < 8 || c >= size - 8)) || (c === 7 && (r < 8 || r >= size - 8)) || (r === size - 8 && c < 8) || (c === size - 8 && r < 8);
      const on = f ?? (sep ? false : r === 6 || c === 6 ? (r + c) % 2 === 0 : rnd() % 100 < 47);
      if (on) cells.push([r, c]);
    }
  return (
    <svg className="pr-qrgrid" viewBox={`-2 -2 ${size + 4} ${size + 4}`} role="img" aria-label={label} shapeRendering="crispEdges">
      <rect x="-2" y="-2" width={size + 4} height={size + 4} fill="#fff" />
      {cells.map(([r, c]) => <rect key={`${r}-${c}`} x={c} y={r} width="1.02" height="1.02" fill="#1d2a30" />)}
    </svg>
  );
}

export function PrintList({ items, printer, community }: { items: PrintRow[]; printer: string; community?: string }) {
  const [done, setDone] = useState<Record<string, "print" | "pdf">>({});
  const sign = items.find((p) => p.sign)?.sign;
  return (
    <>
      <ul className="pr-list">
        {items.map((p) => (
          <li key={p.id}>
            <span className="pr-ico"><Icon name="printer" /></span>
            <span className="pr-t">
              <b>{p.title}</b>
              <small>{p.size} · {p.copies} {p.copies === 1 ? "copy" : "copies"} · {p.note}</small>
            </span>
            <span className="pr-act">
              {done[p.id] === "print" ? (
                <span className="al-done good" role="status"><Icon name="check" /> Sent to {printer}</span>
              ) : done[p.id] === "pdf" ? (
                <span className="al-done good" role="status"><Icon name="download" /> PDF ready</span>
              ) : (
                <>
                  <button type="button" className="sx-btn sx-btn-sm" onClick={() => setDone((d) => ({ ...d, [p.id]: "print" }))}><Icon name="printer" /> Print</button>
                  <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => setDone((d) => ({ ...d, [p.id]: "pdf" }))} aria-label={`Download ${p.title} as a PDF`}><Icon name="download" /> PDF</button>
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
      <div className="pr-samples">
        {sign && (
          <figure>
            <div className="pr-sheet pr-sign">
              <p className="pr-eyebrow">{community ?? "Check in"}</p>
              <p className="pr-big">{sign.title}</p>
              <p className="pr-mid">{sign.when} · {sign.place}</p>
              <QrGrid seed={`checkin-${sign.id}`} label={`QR code to check in to ${sign.title}`} />
              <p className="pr-scan">Scan to check in</p>
              <p className="pr-small">Use your phone’s camera. No app, no login.</p>
            </div>
            <figcaption className="sx-hint">QR check-in sign, one for each activity</figcaption>
          </figure>
        )}
        <figure>
          <div className="pr-sheet pr-slip">
            <p className="pr-eyebrow">Your ideas</p>
            <p className="pr-big">What would you like to see?</p>
            <span className="pr-lines" aria-hidden="true"><i /><i /><i /></span>
            <p className="pr-small">Your name (optional): ________</p>
            <span className="pr-slip-qr">
              <QrGrid seed={`ideas-${community ?? ""}`} label="QR code to send a suggestion" />
              <small>Or scan to send it from your phone</small>
            </span>
          </div>
          <figcaption className="sx-hint">Suggestion slip, four to a page</figcaption>
        </figure>
      </div>
    </>
  );
}
