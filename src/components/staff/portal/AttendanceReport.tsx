"use client";

// The attendance report: pick a date range and how to group it (activity, resident, category or area), filter to one
// resident if needed, and see a chart and a table. Export as CSV for a spreadsheet, or print or save as PDF. This is
// the record state surveyors ask for.
import { useMemo, useState } from "react";
import type { AttendanceData } from "@/data/staff/attendanceReport";
import { Icon } from "../../Icon";
import { residentHref } from "../residentHref";
import { say } from "../store";
import { HBars } from "../ui";

type Group = "activity" | "resident" | "category" | "area";
const addDaysIso = (iso: string, n: number) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const nice = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export function AttendanceReport({ data, community, initialResident, initialGroup }: { data: AttendanceData; community: string; initialResident?: string; initialGroup?: Group }) {
  const [from, setFrom] = useState(addDaysIso(data.today, -29));
  const [to, setTo] = useState(data.today);
  const [group, setGroup] = useState<Group>(initialGroup ?? (initialResident ? "activity" : "activity"));
  const [who, setWho] = useState(initialResident && data.residents.includes(initialResident) ? initialResident : "");
  const whoIdx = who ? data.residents.indexOf(who) : -1;

  const rows = useMemo(() => {
    const m = new Map<string, { k: string; sessions: number; came: number; of: number }>();
    const add = (k: string, came: number, of: number) => { const x = m.get(k) ?? { k, sessions: 0, came: 0, of: 0 }; x.sessions++; x.came += came; x.of += of; m.set(k, x); };
    for (const s of data.sessions) {
      if (s.d < from || s.d > to) continue;
      if (whoIdx >= 0 && !s.who.includes(whoIdx)) continue;
      const came = whoIdx >= 0 ? 1 : s.n;
      if (group === "resident") { (whoIdx >= 0 ? [whoIdx] : s.who).forEach((i) => add(data.residents[i], 1, 1)); continue; }
      add(group === "activity" ? s.t : group === "category" ? s.c : s.a, came, s.of);
    }
    return [...m.values()].sort((a, b) => b.came - a.came || a.k.localeCompare(b.k));
  }, [data, from, to, group, whoIdx]);

  const total = rows.reduce((n, r) => n + r.came, 0);
  const sessions = data.sessions.filter((s) => s.d >= from && s.d <= to && (whoIdx < 0 || s.who.includes(whoIdx))).length;
  const preset = (n: number) => { setTo(data.today); setFrom(addDaysIso(data.today, -(n - 1))); };
  const label = { activity: "Activity", resident: "Resident", category: "Category", area: "Who it was for" }[group];

  const csv = () => {
    const head = group === "resident" ? ["Resident", "Activities attended"] : [label, "Sessions", whoIdx >= 0 ? `${who} came` : "Attendances", "Average a session"];
    const lines = [head, ...rows.map((r) => (group === "resident" ? [r.k, r.came] : [r.k, r.sessions, r.came, whoIdx >= 0 ? "" : (r.came / r.sessions).toFixed(1)]))];
    const text = [`Attendance, ${community}, ${nice(from)} to ${nice(to)}${who ? `, ${who}` : ""}`, "", ...lines.map((l) => l.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = `Attendance ${from} to ${to}${who ? ` ${who}` : ""}.csv`; a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    say("CSV downloaded.");
  };

  return (
    <section className="sx-card sx-card-body ar">
      <div className="ar-controls sx-form">
        <div className="ar-range">
          <span className="sx-lbl">Dates</span>
          <div className="sx-seg" role="group" aria-label="Quick ranges">
            {[7, 30, 90].map((n) => <button key={n} type="button" aria-pressed={to === data.today && from === addDaysIso(data.today, -(n - 1))} onClick={() => preset(n)}>Last {n} days</button>)}
          </div>
          <label>From<input type="date" value={from} min={addDaysIso(data.today, -89)} max={to} onChange={(e) => setFrom(e.target.value)} /></label>
          <label>To<input type="date" value={to} min={from} max={data.today} onChange={(e) => setTo(e.target.value)} /></label>
        </div>
        <div className="ar-group">
          <span className="sx-lbl">Group by</span>
          <div className="sx-seg" role="group" aria-label="Group by">
            {(["activity", "resident", "category", "area"] as const).map((g) => <button key={g} type="button" aria-pressed={group === g} onClick={() => setGroup(g)}>{{ activity: "Activity", resident: "Resident", category: "Category", area: "Area" }[g]}</button>)}
          </div>
          <label>Resident
            <select value={who} onChange={(e) => setWho(e.target.value)}>
              <option value="">Everyone</option>
              {data.residents.map((n) => <option key={n}>{n}</option>)}
            </select>
          </label>
        </div>
        <div className="ar-export">
          <button type="button" className="sx-btn sx-btn-sm" onClick={csv}><Icon name="download" /> Export CSV</button>
          <button type="button" className="sx-btn sx-btn-sm" onClick={() => window.print()}><Icon name="printer" /> Print or save as PDF</button>
        </div>
      </div>

      <p className="ar-print-h"><b>Attendance · {community}</b> · {nice(from)} to {nice(to)}{who ? ` · ${who}` : ""} · grouped by {label.toLowerCase()}</p>
      <div className="ar-kpis">
        <div><b>{sessions}</b><small>{who ? "activities attended" : "activity sessions"}</small></div>
        {!who && <div><b>{total.toLocaleString("en-US")}</b><small>attendances</small></div>}
        {!who && <div><b>{sessions ? (total / sessions).toFixed(1) : 0}</b><small>a session, on average</small></div>}
        {who && <div><b><a className="sx-link" href={residentHref(who, "report")}>{who.split(" ")[0]}’s page</a></b><small>the same numbers, with their week</small></div>}
      </div>

      {rows.length === 0 ? <p className="pt-empty">Nothing in this range.</p> : (
        <div className="ar-body">
          <div className="ar-chart">
            <h3>{group === "resident" ? "Most active residents" : `By ${label.toLowerCase()}`}</h3>
            <HBars items={rows.slice(0, 12).map((r) => ({ label: r.k, value: r.came }))} />
          </div>
          <div className="ar-table-w">
            <table className="ar-table">
              <thead>
                <tr><th scope="col">{label}</th>{group !== "resident" && !who && <th scope="col">Sessions</th>}<th scope="col">{group === "resident" ? "Activities" : who ? "Came" : "Attendances"}</th>{group !== "resident" && !who && <th scope="col">Average</th>}</tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.k}>
                    <th scope="row">{group === "resident" ? <a className="pt-name" href={residentHref(r.k, "report")}>{r.k}</a> : r.k}</th>
                    {group !== "resident" && !who && <td>{r.sessions}</td>}
                    <td>{r.came}</td>
                    {group !== "resident" && !who && <td>{(r.came / r.sessions).toFixed(1)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <p className="sx-hint">From attendance taken by tap list, QR check-in or a photo of the sign-in sheet. Per activity, the same numbers as each activity sheet; per resident, the same as their page. Kept for as long as your community uses Kinlight, and included in Export everything (Settings).</p>
    </section>
  );
}
