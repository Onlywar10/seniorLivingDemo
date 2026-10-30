import Link from "next/link";
import type { ReactNode } from "react";
import { staffPeople } from "@/data/staff/people";
import type { PersonKey } from "@/data/staff/shared";

export const fmt = (n: number) => n.toLocaleString("en-US");
export const pctChange = (a: number, b: number) => Math.round(((a - b) / b) * 100);

/** Icons the staff screens need that the public icon set doesn't have. */
const extra: Record<string, ReactNode> = {
  repeat: <path d="M17 2l3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 0 1-4 4H4" />,
  trend: <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />,
  shield: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />,
  door: <path d="M5 21V3h11v18M16 21h3M12 12h.01M3 21h2" />,
  key: <path d="M15 7a4 4 0 1 1-3.9 4.9L3 20v-3h2v-2h2l2.1-2.1A4 4 0 0 1 15 7zM16 8h.01" />,
  clipboard: <path d="M9 4h6v3H9zM9 5H6v16h12V5h-3M9 12h6M9 16h4" />,
  dash: <path d="M3 13h8V3H3zM13 21h8V11h-8zM13 3v6h8V3zM3 21h8v-6H3z" />,
};
export function XIcon({ name }: { name: keyof typeof extra }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {extra[name]}
    </svg>
  );
}

export function PageHead({ title, sub, children }: { title: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <header className="sx-head">
      <div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {children && <div className="sx-head-actions">{children}</div>}
    </header>
  );
}

export function Card({ title, sub, action, children, className = "", pad = true, id }: { title?: ReactNode; sub?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; pad?: boolean; id?: string }) {
  return (
    <section className={`sx-card ${className}`} id={id}>
      {(title || action) && (
        <header className="sx-card-head">
          <div>
            {title && <h2>{title}</h2>}
            {sub && <p>{sub}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={pad ? "sx-card-body" : ""}>{children}</div>
    </section>
  );
}

export function Delta({ v, invert = false, suffix = "%", label }: { v: number; invert?: boolean; suffix?: string; label?: string }) {
  const good = invert ? v < 0 : v > 0;
  const cls = v === 0 ? "flat" : good ? "up" : "down";
  return (
    <span className={`sx-delta ${cls}`}>
      <span aria-hidden="true">{v > 0 ? "▲" : v < 0 ? "▼" : "–"}</span> {v === 0 ? "No change" : `${Math.abs(v)}${suffix}`}
      {label && <span className="sx-delta-l"> {label}</span>}
    </span>
  );
}

export function Kpi({ label, value, delta, deltaSuffix, note, spark, href, invert }: { label: string; value: ReactNode; delta?: number; deltaSuffix?: string; note?: ReactNode; spark?: number[]; href?: string; invert?: boolean }) {
  const body = (
    <>
      <span className="sx-kpi-l">{label}</span>
      <span className="sx-kpi-v">{value}</span>
      <span className="sx-kpi-n">
        {delta !== undefined && <Delta v={delta} invert={invert} suffix={deltaSuffix} />} {note}
      </span>
      {spark && <Spark values={spark} />}
    </>
  );
  return href ? (
    <Link href={href} className="sx-kpi">
      {body}
    </Link>
  ) : (
    <div className="sx-kpi">{body}</div>
  );
}

export function Spark({ values, w = 120, h = 30, invert = false, className = "sx-spark" }: { values: number[]; w?: number; h?: number; invert?: boolean; className?: string }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const yv = (v: number) => {
    const r = (v - min) / (max - min || 1);
    return invert ? 3 + r * (h - 6) : h - 3 - r * (h - 6);
  };
  const pts = values.map((v, i) => `${((i / (values.length - 1)) * (w - 4) + 2).toFixed(1)},${yv(v).toFixed(1)}`);
  const last = pts[pts.length - 1].split(",");
  return (
    <svg className={className} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline points={pts.join(" ")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="2.6" fill="currentColor" />
    </svg>
  );
}

function niceStep(raw: number) {
  const p = Math.pow(10, Math.floor(Math.log10(raw || 1)));
  const m = raw / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
}

export interface Series { name: string; values: number[]; color: string; dashed?: boolean; area?: boolean }

/** Line chart with a light grid; multiple series are labelled at their line ends. */
export function LineChart({ series, labels, height = 220, yFmt = fmt, every, label, ends: showEnds = true }: { series: Series[]; labels: string[]; height?: number; yFmt?: (n: number) => string; every?: number; label: string; ends?: boolean }) {
  const W = 720, H = height;
  const L = 48, R = series.length > 1 && showEnds ? 118 : 14, T = 12, B = 26;
  const all = series.flatMap((s) => s.values);
  const step = niceStep(Math.max(...all) / 4);
  const max = Math.ceil(Math.max(...all) / step) * step;
  const x = (i: number) => L + (i / (labels.length - 1)) * (W - L - R);
  const y = (v: number) => T + (1 - v / max) * (H - T - B);
  const ticks = Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step);
  const ev = every ?? Math.ceil(labels.length / 7);
  const ends = series.map((s) => ({ s, y: y(s.values[s.values.length - 1]) })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 15) ends[i].y = ends[i - 1].y + 15;
  return (
    <svg className="sx-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} className={t === 0 ? "sx-base" : "sx-gridline"} />
          <text x={L - 8} y={y(t) + 4} textAnchor="end" className="sx-axis">
            {yFmt(t)}
          </text>
        </g>
      ))}
      {labels.map((l, i) =>
        (labels.length - 1 - i) % ev === 0 ? (
          <text key={l + i} x={x(i)} y={H - 6} textAnchor="middle" className="sx-axis">
            {l}
          </text>
        ) : null
      )}
      {series.map((s) => (
        <g key={s.name}>
          {s.area && <polygon points={`${x(0)},${y(0)} ${s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")} ${x(s.values.length - 1)},${y(0)}`} fill={s.color} opacity="0.1" />}
          <polyline points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")} fill="none" stroke={s.color} strokeWidth={s.dashed ? 1.8 : 2.5} strokeDasharray={s.dashed ? "5 5" : undefined} strokeLinejoin="round" strokeLinecap="round" />
          {!s.dashed && <circle cx={x(s.values.length - 1)} cy={y(s.values[s.values.length - 1])} r="4" fill={s.color} />}
        </g>
      ))}
      {series.length > 1 && showEnds &&
        ends.map(({ s, y: ly }) => (
          <text key={s.name} x={W - R + 10} y={ly + 4} className="sx-endlabel" fill={s.color}>
            {s.name}
          </text>
        ))}
    </svg>
  );
}

/** Vertical bars (one series), with the last bar highlighted. */
export function Bars({ values, labels, height = 180, color = "var(--green)", yFmt = fmt, label }: { values: number[]; labels: string[]; height?: number; color?: string; yFmt?: (n: number) => string; label: string }) {
  const W = 720, H = height, L = 48, R = 8, T = 16, B = 26;
  const step = niceStep(Math.max(...values) / 4);
  const max = Math.ceil(Math.max(...values) / step) * step;
  const bw = (W - L - R) / values.length;
  const y = (v: number) => T + (1 - v / max) * (H - T - B);
  const ticks = Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step);
  return (
    <svg className="sx-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} className={t === 0 ? "sx-base" : "sx-gridline"} />
          <text x={L - 8} y={y(t) + 4} textAnchor="end" className="sx-axis">
            {yFmt(t)}
          </text>
        </g>
      ))}
      {values.map((v, i) => (
        <g key={i}>
          <rect x={L + i * bw + bw * 0.18} y={y(v)} width={bw * 0.64} height={y(0) - y(v)} rx="3" fill={color} opacity={i === values.length - 1 ? 1 : 0.55} />
          {i === values.length - 1 && (
            <text x={L + i * bw + bw / 2} y={y(v) - 5} textAnchor="middle" className="sx-endlabel" fill="var(--ink)">
              {yFmt(v)}
            </text>
          )}
          {(values.length - 1 - i) % 2 === 0 && (
            <text x={L + i * bw + bw / 2} y={H - 6} textAnchor="middle" className="sx-axis">
              {labels[i]}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

/** Horizontal bars, value labelled at the end of each bar. */
export function HBars({ items, fmtV = fmt, color = "var(--green)" }: { items: { label: string; value: number; note?: ReactNode }[]; fmtV?: (n: number) => string; color?: string }) {
  const max = Math.max(...items.map((i) => i.value));
  return (
    <ul className="sx-hbars">
      {items.map((i) => (
        <li key={i.label}>
          <span className="sx-hb-l">{i.label}</span>
          <span className="sx-hb-track">
            <span className="sx-hb-bar" style={{ width: `${(i.value / max) * 100}%`, background: color }} />
          </span>
          <span className="sx-hb-v">
            {fmtV(i.value)}
            {i.note && <small> {i.note}</small>}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** A 0–100 score as a ring. */
export function Score({ v, size = 88, label }: { v: number; size?: number; label: string }) {
  const r = 40;
  const c = 2 * Math.PI * r;
  const tone = v >= 60 ? "var(--green)" : v >= 45 ? "var(--olive)" : "var(--brick)";
  return (
    <span className="sx-score" style={{ width: size, height: size }} role="img" aria-label={`${label}: ${v} out of 100`}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r={r} className="sx-score-bg" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={tone} strokeWidth="9" strokeDasharray={`${(v / 100) * c} ${c}`} strokeLinecap="round" transform="rotate(-90 50 50)" />
      </svg>
      <b aria-hidden="true">{v}</b>
    </span>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "good" | "warn" | "bad" | "neutral" | "info" | "accent"; children: ReactNode }) {
  return <span className={`sx-badge sx-${tone}`}>{children}</span>;
}

export function Meter({ v, tone, label }: { v: number; tone?: string; label?: string }) {
  return (
    <span className="sx-meter" role="img" aria-label={label ?? `${Math.round(v)}%`}>
      <span style={{ width: `${Math.min(100, v)}%`, background: tone }} />
    </span>
  );
}

export function Avatar({ who, size = 32 }: { who: PersonKey; size?: number }) {
  const p = staffPeople[who];
  return (
    <span className="sx-avatar" style={{ background: p.color, width: size, height: size, fontSize: size * 0.38 }} aria-hidden="true">
      {p.initials}
    </span>
  );
}

export function Initials({ name, size = 32, color = "var(--slate)" }: { name: string; size?: number; color?: string }) {
  const parts = name.replace(/[()&]/g, " ").split(/\s+/).filter((w) => /^[A-ZÁÉÍÓÚ]/.test(w));
  const ini = ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
  return (
    <span className="sx-avatar" style={{ background: color, width: size, height: size, fontSize: size * 0.38 }} aria-hidden="true">
      {ini}
    </span>
  );
}
