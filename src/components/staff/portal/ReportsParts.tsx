// Pieces the monthly report tabs share: the evidence table (numbers only, no targets), leads by source, the
// "coming later" note, and the message for a report tab that isn't part of someone's role.
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { Badge, Card, fmt, pctChange } from "@/components/staff/ui";
import type { EvidenceRow } from "@/data/staff/alpha";
import { accessLabel, type Access } from "@/data/staff/shared";
import { MONTHS, today } from "@/lib/clock";

export const show = (v: number, f?: string) => (f === "pct" ? `${v}%` : f === "dec" ? (v > 10 ? `${v.toFixed(1)}%` : v.toFixed(1)) : fmt(v));

/** A plain change against last month, with no good or bad colouring: these are outcomes we track, not promises. */
export function change(now: number, prev: number, fmtKind?: string) {
  if (!prev) return "New this month";
  const d = Number((now - prev).toFixed(1));
  if (d === 0) return "No change";
  const sign = d > 0 ? "+" : "−";
  if (fmtKind === "pct" || fmtKind === "dec") return `${sign}${Math.abs(d).toFixed(fmtKind === "dec" ? 1 : 0)}${fmtKind === "pct" || now > 10 ? " pts" : ""}`;
  return `${sign}${fmt(Math.abs(d))} (${sign}${Math.abs(pctChange(now, prev))}%)`;
}

/** "Dec 1": when the next monthly report is emailed. */
export function nextFirst() {
  const t = today();
  return `${MONTHS[(t.getUTCMonth() + 1) % 12].slice(0, 3)} 1`;
}

export function EvidenceTable({ rows, month, prev }: { rows: EvidenceRow[]; month: string; prev: string }) {
  return (
    <div className="sx-table-wrap">
      <table className="sx-table rp-ev">
        <thead><tr><th>Outcome</th><th className="num">{month}</th><th className="num">{prev}</th><th>Change</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <td><b>{r.label}</b>{r.note && <small>{r.note}</small>}</td>
              <td className="num"><b>{show(r.now, r.fmt)}</b></td>
              <td className="num">{r.prev ? show(r.prev, r.fmt) : "–"}</td>
              <td className="sx-hint rp-nowrap">{change(r.now, r.prev, r.fmt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LeadsBySource({ sources, prevValues, month, prev }: { sources: { label: string; value: number }[]; prevValues: number[]; month: string; prev: string }) {
  const max = Math.max(1, ...sources.map((s) => s.value), ...prevValues);
  return (
    <>
      <ul className="sx-legend">
        <li><i style={{ background: "var(--green)" }} />{month}</li>
        <li><i style={{ background: "#cdbfa5" }} />{prev}</li>
      </ul>
      <ul className="rp-src">
        {sources.map((s, i) => (
          <li key={s.label}>
            <span className="rp-src-l">{s.label}</span>
            <span className="rp-src-v">{s.value} <small>({prevValues[i]})</small></span>
            <span className="rp-src-bars" aria-hidden="true">
              <i style={{ width: `${(s.value / max) * 100}%` }} />
              <i className="prev" style={{ width: `${((prevValues[i] ?? 0) / max) * 100}%` }} />
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

/** Something on the way, said plainly with its timing. */
export function ComingLater({ when, title, children }: { when: "Coming in Beta" | "Coming in Full House"; title: string; children: ReactNode }) {
  return (
    <Card title={title} action={<Badge tone="neutral">{when}</Badge>} className="rp-later">
      <div className="sx-hint rp-later-b">{children}</div>
    </Card>
  );
}

/** A report tab that isn't part of this person's role. */
export function NotThisReport({ title, access }: { title: string; access: Access | undefined }) {
  const part = access ? accessLabel[access] : "";
  return (
    <>
      <header className="sx-head">
        <div>
          <h1>{title}</h1>
          <p>{title} isn’t part of your reports{part ? `: you see ${part.toLowerCase()}` : ""}. An administrator can change that in Settings.</p>
        </div>
      </header>
      <p><Link className="sx-btn sx-btn-primary" href="/staff/reports"><Icon name="chart" /> Back to your reports</Link></p>
    </>
  );
}
