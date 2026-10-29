import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "../Icon";

export const fmt = (n: number) => n.toLocaleString("en-US");
export const pct = (a: number, b: number) => Math.round(((a - b) / b) * 100);

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

export function Card({ title, sub, action, children, className = "", pad = true }: { title?: ReactNode; sub?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={`sx-card ${className}`}>
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

export function Delta({ v, invert = false, suffix = "%" }: { v: number; invert?: boolean; suffix?: string }) {
  const good = invert ? v < 0 : v > 0;
  const cls = v === 0 ? "flat" : good ? "up" : "down";
  return (
    <span className={`sx-delta ${cls}`}>
      {v > 0 ? "▲" : v < 0 ? "▼" : "■"} {Math.abs(v)}
      {suffix}
    </span>
  );
}

export function Kpi({ label, value, delta, note, spark, href, invert }: { label: string; value: ReactNode; delta?: number; note?: ReactNode; spark?: number[]; href?: string; invert?: boolean }) {
  const body = (
    <>
      <span className="sx-kpi-l">{label}</span>
      <span className="sx-kpi-v">{value}</span>
      <span className="sx-kpi-n">
        {delta !== undefined && <Delta v={delta} invert={invert} />} {note}
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

export function Spark({ values, w = 120, h = 32 }: { values: number[]; w?: number; h?: number }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - 2 - ((v - min) / (max - min || 1)) * (h - 4)}`);
  return (
    <svg className="sx-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline points={pts.join(" ")} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export interface Series { name: string; values: number[]; color: string }

/** Multi-series line chart with a light grid and the series named at the line ends. */
export function LineChart({ series, labels, height = 220, yFmt = fmt, max: forcedMax }: { series: Series[]; labels: string[]; height?: number; yFmt?: (n: number) => string; max?: number }) {
  const W = 720;
  const H = height;
  const L = 52, R = series.length > 1 ? 150 : 16, T = 12, B = 26;
  const all = series.flatMap((s) => s.values);
  const rawMax = forcedMax ?? Math.max(...all);
  const step = niceStep(rawMax / 4);
  const max = forcedMax ?? Math.ceil(rawMax / step) * step;
  const x = (i: number) => L + (i / (labels.length - 1)) * (W - L - R);
  const y = (v: number) => T + (1 - v / max) * (H - T - B);
  const ticks = Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step);
  // keep end labels from colliding
  const ends = series.map((s) => ({ s, y: y(s.values[s.values.length - 1]) })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 15) ends[i].y = ends[i - 1].y + 15;
  return (
    <svg className="sx-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={series.map((s) => `${s.name}: from ${yFmt(s.values[0])} to ${yFmt(s.values[s.values.length - 1])}`).join("; ")}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} className="sx-grid" />
          <text x={L - 8} y={y(t) + 4} textAnchor="end" className="sx-axis">
            {yFmt(t)}
          </text>
        </g>
      ))}
      {labels.map((l, i) =>
        i % Math.ceil(labels.length / 6) === 0 || i === labels.length - 1 ? (
          <text key={l + i} x={x(i)} y={H - 6} textAnchor="middle" className="sx-axis">
            {l}
          </text>
        ) : null
      )}
      {series.map((s) => (
        <g key={s.name}>
          <polyline points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={x(s.values.length - 1)} cy={y(s.values[s.values.length - 1])} r="4" fill={s.color} />
        </g>
      ))}
      {series.length > 1 &&
        ends.map(({ s, y: ly }) => (
          <text key={s.name} x={W - R + 10} y={ly + 4} className="sx-endlabel" fill={s.color}>
            {s.name} {yFmt(s.values[s.values.length - 1])}
          </text>
        ))}
    </svg>
  );
}

function niceStep(raw: number) {
  const p = Math.pow(10, Math.floor(Math.log10(raw || 1)));
  const m = raw / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
}

/** Horizontal bars, value labelled at the end of each bar. */
export function HBars({ items, fmtV = fmt, color = "var(--sx-accent)" }: { items: { label: string; value: number; note?: string }[]; fmtV?: (n: number) => string; color?: string }) {
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
export function Score({ v, label, size = 92 }: { v: number; label?: string; size?: number }) {
  const r = 40;
  const c = 2 * Math.PI * r;
  const tone = v >= 70 ? "var(--sx-good)" : v >= 50 ? "var(--sx-warn)" : "var(--sx-bad)";
  return (
    <span className="sx-score" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r={r} className="sx-score-bg" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={tone} strokeWidth="9" strokeDasharray={`${(v / 100) * c} ${c}`} strokeLinecap="butt" transform="rotate(-90 50 50)" />
      </svg>
      <b>{v}</b>
      {label && <span className="vh">{label}</span>}
    </span>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "good" | "warn" | "bad" | "neutral" | "info" | "accent"; children: ReactNode }) {
  return <span className={`sx-badge sx-${tone}`}>{children}</span>;
}

export function Meter({ v, tone }: { v: number; tone?: string }) {
  return (
    <span className="sx-meter" aria-label={`${v}%`}>
      <span style={{ width: `${v}%`, background: tone }} />
    </span>
  );
}

export function Empty({ icon, children }: { icon: Parameters<typeof Icon>[0]["name"]; children: ReactNode }) {
  return (
    <div className="sx-empty">
      <Icon name={icon} />
      <span>{children}</span>
    </div>
  );
}
