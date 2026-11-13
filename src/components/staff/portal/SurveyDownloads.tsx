"use client";

// Download a survey's results: a one-page PDF (the browser's own "Save as PDF", from a print layout of this page) and
// a spreadsheet of every answer (anonymous surveys carry no names).
import { Icon } from "../../Icon";
import { say } from "../store";

export function SurveyDownloads({ name, head, rows }: { name: string; head: string[]; rows: string[][] }) {
  const csv = () => {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const blob = new Blob(["﻿" + [head, ...rows].map((r) => r.map(esc).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-results.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    say(`Downloaded ${rows.length} answers as a spreadsheet.`);
  };
  return (
    <span className="su-dl">
      <button type="button" className="sx-btn sx-btn-sm" onClick={() => window.print()}><Icon name="download" /> One-page PDF</button>
      <button type="button" className="sx-btn sx-btn-sm" onClick={csv}><Icon name="download" /> Spreadsheet</button>
    </span>
  );
}
