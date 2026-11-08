"use client";

// Who gets which alert, and how. Toggles are kept in this browser only.
import { useState } from "react";
import type { AlertChannel, AlertSetting } from "@/data/staff/alpha";
import { Icon } from "../../Icon";
import { Avatar } from "../ui";

const channels: AlertChannel[] = ["Text", "Email", "In the portal"];

export function AlertSettings({ rules }: { rules: AlertSetting[] }) {
  const [on, setOn] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(rules.flatMap((r) => r.who.flatMap((w) => channels.map((c) => [`${r.kind}|${w.key}|${c}`, w.on.includes(c)]))))
  );
  const [saved, setSaved] = useState(false);
  return (
    <div className="al-set">
      <div className="sx-table-wrap">
        <table className="sx-table">
          <thead>
            <tr><th>Alert</th><th>Who</th>{channels.map((c) => <th key={c} className="al-c">{c}</th>)}</tr>
          </thead>
          <tbody>
            {rules.map((r) =>
              r.who.map((w, i) => (
                <tr key={r.kind + w.key}>
                  {i === 0 && (
                    <td rowSpan={r.who.length}>
                      <b>{r.label}</b>
                      <small>{r.detail}</small>
                    </td>
                  )}
                  <td>
                    <span className="sx-name"><Avatar who={w.key} size={26} /><span><b>{w.name}</b><small>{w.role}</small></span></span>
                  </td>
                  {channels.map((c) => {
                    const k = `${r.kind}|${w.key}|${c}`;
                    return (
                      <td key={c} className="al-c">
                        <label className="sx-switch">
                          <input type="checkbox" checked={on[k]} onChange={(e) => { setOn((o) => ({ ...o, [k]: e.target.checked })); setSaved(false); }} aria-label={`${r.label}: ${w.name} by ${c.toLowerCase()}`} />
                        </label>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="at-foot">
        <span className="sx-hint">Each alert opens the same card as Today, so one tap decides it. Urgent ones repeat by text after 30 minutes if nobody opens them.</span>
        {saved ? (
          <span className="al-done good" role="status"><Icon name="check" /> Saved</span>
        ) : (
          <button type="button" className="sx-btn sx-btn-primary sx-btn-sm" onClick={() => setSaved(true)}>Save alert settings</button>
        )}
      </div>
    </div>
  );
}
