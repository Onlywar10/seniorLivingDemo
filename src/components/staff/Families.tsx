"use client";

import { useMemo, useState } from "react";
import type { Contact } from "@/data/staff/shared";
import { Icon } from "../Icon";
import { Badge } from "./ui";

export function ContactTable({ contacts }: { contacts: Contact[] }) {
  const [q, setQ] = useState("");
  const [f, setF] = useState<"all" | "lantern" | "sms" | "email" | "other" | "nophoto">("all");
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return contacts.filter((c) => {
      if (s && !`${c.resident} ${c.contact} ${c.apt} ${c.relation}`.toLowerCase().includes(s)) return false;
      if (f === "lantern") return c.lantern;
      if (f === "sms") return c.channel !== "Email";
      if (f === "email") return c.channel !== "SMS";
      if (f === "other") return c.lang !== "English";
      if (f === "nophoto") return !c.photos;
      return true;
    });
  }, [q, f, contacts]);

  return (
    <section className="sx-card">
      <div className="sx-card-body" style={{ display: "grid", gap: 12 }}>
        <div className="sx-toolbar">
          <label style={{ flex: "1 1 260px", maxWidth: 380 }} className="sx-form">
            <span className="vh">Search residents and family members</span>
            <input className="sx-input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or apartment" />
          </label>
          <div className="sx-chips" role="group" aria-label="Filter">
            {([["all", "All"], ["lantern", "Lantern"], ["sms", "Texts"], ["email", "Email"], ["other", "Other languages"], ["nophoto", "No photo consent"]] as const).map(([k, l]) => (
              <button key={k} type="button" aria-pressed={f === k} onClick={() => setF(k)}>{l}</button>
            ))}
          </div>
        </div>
        <p className="sx-hint" aria-live="polite" style={{ margin: 0 }}>Showing {rows.length} of {contacts.length} recently updated contacts · 271 in total</p>
      </div>
      <div className="sx-table-wrap">
        <table className="sx-table">
          <thead>
            <tr>
              <th>Resident</th>
              <th>Family contact</th>
              <th>Prefers</th>
              <th>Language</th>
              <th>Texts</th>
              <th>Email</th>
              <th>Photos</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.contact}>
                <td>
                  <b>{c.resident}</b>
                  <small>Apt {c.apt}{c.lantern ? " · " : ""}{c.lantern && <Badge tone="bad">Lantern</Badge>}</small>
                </td>
                <td>
                  <b>{c.contact}</b>
                  <small>{c.relation} · {c.phone}</small>
                  <small>{c.email}</small>
                </td>
                <td>{c.channel}</td>
                <td>{c.lang}</td>
                <td><Opt v={c.sms} /></td>
                <td><Opt v={c.emailOpt} /></td>
                <td><Opt v={c.photos} /></td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="sx-hint">No contacts match “{q}”.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Opt({ v }: { v: boolean }) {
  return v ? (
    <span className="yes"><Icon name="check" /><span className="vh">Opted in</span></span>
  ) : (
    <span className="no"><Icon name="minus" /><span className="vh">Not opted in</span></span>
  );
}

const fields = ["Resident name", "Apartment", "Family member", "Relationship", "Mobile phone", "Email", "Language", "Ignore"];
function guess(h: string) {
  const s = h.toLowerCase();
  if (/resident/.test(s)) return "Resident name";
  if (/apt|apartment|unit|room/.test(s)) return "Apartment";
  if (/relation/.test(s)) return "Relationship";
  if (/phone|mobile|cell/.test(s)) return "Mobile phone";
  if (/mail/.test(s)) return "Email";
  if (/lang/.test(s)) return "Language";
  if (/contact|family|name|responsible/.test(s)) return "Family member";
  return "Ignore";
}
function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const split = (l: string) => {
    const out: string[] = [];
    let cur = "", q = false;
    for (const ch of l) {
      if (ch === '"') q = !q;
      else if (ch === "," && !q) { out.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
    out.push(cur.trim());
    return out;
  };
  return { head: split(lines[0] ?? ""), rows: lines.slice(1).map(split) };
}

export function ImportContacts() {
  const [over, setOver] = useState(false);
  const [file, setFile] = useState<{ name: string; head: string[]; rows: string[][] } | null>(null);
  const [map, setMap] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const read = (fl: File) => {
    const r = new FileReader();
    r.onload = () => {
      const p = parseCsv(String(r.result ?? ""));
      setFile({ name: fl.name, ...p });
      setMap(p.head.map(guess));
      setDone(false);
    };
    r.readAsText(fl);
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <label
        className={`drop ${over ? "over" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); const fl = e.dataTransfer.files?.[0]; if (fl) read(fl); }}
      >
        <input type="file" accept=".csv,text/csv" onChange={(e) => { const fl = e.target.files?.[0]; if (fl) read(fl); }} />
        <Icon name="upload" />
        <b>{file ? file.name : "Drop a spreadsheet here (CSV)"}</b>
        <span className="sx-hint">{file ? `${file.rows.length} rows · ${file.head.length} columns` : "An export from your resident records system or a spreadsheet works. Or click to choose a file."}</span>
      </label>
      {file && !done && (
        <>
          <p className="sx-lbl" style={{ margin: 0 }}>Match your columns</p>
          <div className="map">
            {file.head.map((h, i) => (
              <div key={i} style={{ display: "contents" }}>
                <code title={h}>{h || `Column ${i + 1}`}</code>
                <Icon name="arrow" />
                <label className="sx-form">
                  <span className="vh">Field for {h}</span>
                  <select className="sx-input" value={map[i]} onChange={(e) => setMap((m) => m.map((x, j) => (j === i ? e.target.value : x)))}>
                    {fields.map((x) => <option key={x}>{x}</option>)}
                  </select>
                </label>
              </div>
            ))}
          </div>
          {file.rows.length > 0 && (
            <div className="sx-table-wrap">
              <table className="sx-table">
                <thead><tr>{file.head.map((h, i) => <th key={i}>{map[i] === "Ignore" ? <s>{h}</s> : map[i]}</th>)}</tr></thead>
                <tbody>{file.rows.slice(0, 3).map((r, i) => <tr key={i}>{file.head.map((_, j) => <td key={j}>{r[j]}</td>)}</tr>)}</tbody>
              </table>
            </div>
          )}
          <button type="button" className="sx-btn sx-btn-primary" onClick={() => setDone(true)}>
            <Icon name="check" /> Import {file.rows.length} contacts
          </button>
        </>
      )}
      {done && file && (
        <div className="sx-callout good" role="status">
          <Icon name="check" />
          <p>{file.rows.length} contacts imported from {file.name}. Duplicates were merged, and new contacts get a welcome text asking them to confirm.</p>
        </div>
      )}
    </div>
  );
}
