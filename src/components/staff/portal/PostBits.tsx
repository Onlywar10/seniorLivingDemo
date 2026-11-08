"use client";

// Small pieces the Post forms share: the "here's what happened automatically" result, and a labelled switch.
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "../../Icon";

type IconName = Parameters<typeof Icon>[0]["name"];
export interface Happened { icon: IconName; title: string; detail: ReactNode; wait?: boolean }

export function Done({ title, line, items, wait = false, actions }: { title: string; line: ReactNode; items: Happened[]; wait?: boolean; actions?: ReactNode }) {
  return (
    <div className="sx-card sx-card-body went pt-went po-done" role="status">
      <div className="went-head">
        <Icon name={wait ? "clock" : "check"} />
        <div>
          <h2>{title}</h2>
          <p className="pt-went-line">{line}</p>
        </div>
      </div>
      <ul className="went-list">
        {items.map((x) => (
          <li key={x.title} className={x.wait ? "wait" : undefined}><Icon name={x.icon} /><b>{x.title}</b><span>{x.detail}</span></li>
        ))}
      </ul>
      <div className="pt-act">
        {actions}
        <Link className="sx-btn" href="/staff/today">Back to Today</Link>
      </div>
    </div>
  );
}

export function Switch({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint?: ReactNode }) {
  return (
    <label className="sx-switch po-switch">
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} />
      <span><b>{label}</b>{hint && <small>{hint}</small>}</span>
    </label>
  );
}

export const andList = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
export const firstName = (n = "") => n.split(" ")[0];
