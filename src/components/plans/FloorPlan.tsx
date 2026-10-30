import type { Plan } from "@/data/shared";
import type { T } from "@/i18n/translate";

const same: T = (s) => s;

type Room = Plan["rooms"][number];
type PlanShape = Pick<Plan, "code" | "rooms" | "sqft" | "kind" | "features">;

/** Friendly room names used by the drawing, the tour and its map. */
export function roomName(key: string, plan: Pick<Plan, "kind" | "rooms">): string {
  const room = plan.rooms.find((r) => r[0] === key);
  switch (key) {
    case "entry":
      return "Entry";
    case "kitchen":
      return plan.kind === "assisted" ? "Kitchenette" : "Kitchen";
    case "living":
      return room && room[3] >= 36 ? "Living & dining" : "Living";
    case "bedroom":
      return plan.kind === "harbor" ? "Private room" : plan.rooms.some((r) => r[0] === "bedroom2") ? "Primary bedroom" : "Bedroom";
    case "bedroom2":
      return "Second bedroom";
    case "bath":
      return "Bath";
    case "closet":
      return room && room[3] >= 30 ? "Walk-in closet" : "Closet";
    case "balcony":
      return "Balcony";
    case "den":
      return "Den";
    default:
      return key;
  }
}

/** Short labels for inside the drawing. */
function shortName(key: string, plan: PlanShape, r: Room): string {
  if (key === "bedroom" && plan.kind === "harbor") return "Room";
  if (key === "bedroom") return plan.rooms.some((x) => x[0] === "bedroom2") ? "Bedroom 1" : "Bedroom";
  if (key === "bedroom2") return "Bedroom 2";
  if (key === "living") return r[3] >= 36 ? "Living / Dining" : "Living";
  if (key === "closet") return r[3] >= 30 ? "Walk-in" : "Closet";
  if (key === "kitchen") return plan.kind === "assisted" ? "Kitchenette" : "Kitchen";
  return key.charAt(0).toUpperCase() + key.slice(1);
}

interface Seg {
  o: "v" | "h";
  at: number;
  from: number;
  to: number;
}

function shared(a: Room, b: Room): Seg | null {
  const [, ax, ay, aw, ah] = a;
  const [, bx, by, bw, bh] = b;
  if (ax + aw === bx || bx + bw === ax) {
    const at = ax + aw === bx ? bx : ax;
    const from = Math.max(ay, by);
    const to = Math.min(ay + ah, by + bh);
    if (to - from >= 5) return { o: "v", at, from, to };
  }
  if (ay + ah === by || by + bh === ay) {
    const at = ay + ah === by ? by : ay;
    const from = Math.max(ax, bx);
    const to = Math.min(ax + aw, bx + bw);
    if (to - from >= 5) return { o: "h", at, from, to };
  }
  return null;
}

type OpeningKind = "door" | "open" | "slider" | "window" | "front";
interface Opening {
  seg: Seg; // the gap itself
  kind: OpeningKind;
  dir: 1 | -1; // which side the door swings into
}

const DOOR_TO: Record<string, { to: string[]; kind: OpeningKind; all?: boolean }> = {
  kitchen: { to: ["living", "entry"], kind: "open", all: true },
  living: { to: ["entry"], kind: "open" },
  bedroom: { to: ["living", "entry", "bedroom2"], kind: "door" },
  bedroom2: { to: ["living", "bedroom", "closet", "entry"], kind: "door" },
  bath: { to: ["bedroom", "living", "entry", "closet"], kind: "door" },
  closet: { to: ["bedroom", "bedroom2", "living", "entry", "bath"], kind: "door" },
  balcony: { to: ["living"], kind: "slider" },
  den: { to: ["entry", "living", "bedroom"], kind: "door" },
};

function openings(rooms: Room[]): Opening[] {
  const list: Opening[] = [];
  const byKey = new Map(rooms.map((r) => [r[0], r]));
  const linked = new Set<string>();
  for (const r of rooms) {
    const rule = DOOR_TO[r[0]];
    if (!rule) continue;
    for (const target of rule.to) {
      const t = byKey.get(target);
      if (!t) continue;
      const pair = [r[0], target].sort().join("|");
      if (linked.has(pair)) continue;
      const s = shared(r, t);
      if (!s) continue;
      linked.add(pair);
      const len = s.to - s.from;
      let gap: Seg;
      if (rule.kind === "open") {
        const m = Math.min(4, len * 0.15);
        gap = { ...s, from: s.from + m, to: s.to - m };
      } else if (rule.kind === "slider") {
        const w = Math.min(18, len * 0.6);
        const mid = (s.from + s.to) / 2;
        gap = { ...s, from: mid - w / 2, to: mid + w / 2 };
      } else {
        const w = Math.min(8, len - 3);
        // doors sit toward one end of the shared wall, like a real plan
        const start = s.from + Math.min(3, (len - w) / 2);
        gap = { ...s, from: start, to: start + w };
      }
      const [, rx, ry] = r;
      const dir: 1 | -1 = s.o === "v" ? (rx === s.at ? 1 : -1) : ry === s.at ? 1 : -1;
      list.push({ seg: gap, kind: rule.kind, dir });
      if (!rule.all) break;
    }
  }
  // front door
  const entry = byKey.get("entry");
  if (entry) {
    const [, x, y, w, h] = entry;
    if (y + h === 70) {
      const dw = Math.min(9, w - 4);
      const from = x + (w - dw) / 2;
      list.push({ seg: { o: "h", at: 70, from, to: from + dw }, kind: "front", dir: -1 });
    } else if (x === 0) {
      const dw = Math.min(9, h - 4);
      const from = y + (h - dw) / 2;
      list.push({ seg: { o: "v", at: 0, from, to: from + dw }, kind: "front", dir: 1 });
    }
  }
  // windows on outside walls of living spaces
  const balcony = byKey.get("balcony");
  for (const r of rooms) {
    if (!["living", "bedroom", "bedroom2", "kitchen"].includes(r[0])) continue;
    const [, x, y, w, h] = r;
    const coveredTop = balcony && balcony[1] < x + w && balcony[1] + balcony[3] > x;
    if (y === 0 && !coveredTop && w >= 14) {
      const ww = w * 0.46;
      list.push({ seg: { o: "h", at: 0, from: x + (w - ww) / 2, to: x + (w + ww) / 2 }, kind: "window", dir: 1 });
    }
    if (x + w === 100 && r[0] !== "kitchen" && h >= 14) {
      const wh = h * 0.42;
      list.push({ seg: { o: "v", at: 100, from: y + (h - wh) / 2, to: y + (h + wh) / 2 }, kind: "window", dir: -1 });
    }
  }
  return list;
}

const ft = (units: number, k: number) => {
  const total = Math.round(units * k * 12);
  return `${Math.floor(total / 12)}′${total % 12 ? total % 12 + "″" : ""}`;
};

function Fixtures({ r, plan }: { r: Room; plan: PlanShape }) {
  const [key, x, y, w, h] = r;
  if (key === "kitchen") {
    const d = Math.min(5, w * 0.2);
    return (
      <g className="fp-fix">
        <path d={`M${x + 0.8} ${y + h * 0.82} V${y + 0.8} H${x + w - 0.8} V${y + 0.8 + d} H${x + 0.8 + d} V${y + h * 0.82} Z`} />
        <rect x={x + 0.8 + 0.7} y={y + h * 0.35} width={d - 1.4} height={d - 1.4} rx={0.4} />
        <circle cx={x + 0.8 + d / 2} cy={y + h * 0.35 + d / 2 - 0.7} r={0.9} />
        {w >= 24 && <rect x={x + w * 0.45} y={y + h * 0.45} width={w * 0.4} height={4} rx={0.6} />}
      </g>
    );
  }
  if (key === "bath") {
    const horizontal = w >= h;
    const sw = horizontal ? Math.min(11, w * 0.34) : w - 2;
    const sh = horizontal ? h - 2 : Math.min(11, h * 0.34);
    return (
      <g className="fp-fix">
        <rect x={x + w - 1 - sw} y={y + 1} width={sw} height={sh} rx={0.8} />
        <path d={`M${x + w - 1 - sw} ${y + 1} L${x + w - 1} ${y + 1 + sh}`} strokeDasharray="1 1" />
        <ellipse cx={horizontal ? x + w * 0.35 : x + w * 0.3} cy={horizontal ? y + 3.2 : y + h - 4} rx={1.6} ry={2.1} />
        <rect x={x + 1} y={horizontal ? y + h - 5 : y + h * 0.45} width={horizontal ? Math.min(10, w * 0.3) : 4.5} height={horizontal ? 4 : Math.min(10, h * 0.3)} rx={0.6} />
      </g>
    );
  }
  if (key === "bedroom" || key === "bedroom2") {
    const bw = Math.min(16, w * 0.46);
    const bh = Math.min(19, h * 0.56);
    const bx = x + (w - bw) / 2;
    const by = y + 1.5;
    return (
      <g className="fp-fix">
        <rect x={bx} y={by} width={bw} height={bh} rx={1} />
        <rect x={bx + 1.2} y={by + 1.2} width={bw / 2 - 1.8} height={3.2} rx={0.8} />
        <rect x={bx + bw / 2 + 0.6} y={by + 1.2} width={bw / 2 - 1.8} height={3.2} rx={0.8} />
        <rect x={bx - 4} y={by} width={3} height={3} rx={0.4} />
        <rect x={bx + bw + 1} y={by} width={3} height={3} rx={0.4} />
      </g>
    );
  }
  if (key === "living") {
    const sw = Math.min(20, w * 0.5);
    const sx = x + (w - sw) / 2;
    const sy = y + h - 8;
    return (
      <g className="fp-fix">
        <rect x={sx} y={sy} width={sw} height={5.5} rx={1.2} />
        <rect x={sx + sw * 0.25} y={sy - 6.5} width={sw * 0.5} height={4} rx={0.8} />
        {w >= 36 && <circle cx={x + w - 7} cy={y + 9} r={4.2} />}
      </g>
    );
  }
  if (key === "closet") {
    const washer = plan.features.some((f) => /washer/i.test(f));
    return (
      <g className="fp-fix">
        <path d={`M${x + 1.5} ${y + 1.8} H${x + w - (washer ? 12 : 1.5)}`} strokeDasharray="0.8 0.8" />
        {washer && (
          <>
            <rect x={x + w - 10.5} y={y + 1.2} width={4.4} height={4.4} rx={0.5} />
            <circle cx={x + w - 8.3} cy={y + 3.4} r={1.4} />
            <rect x={x + w - 5.5} y={y + 1.2} width={4.4} height={4.4} rx={0.5} />
            <circle cx={x + w - 3.3} cy={y + 3.4} r={1.4} />
          </>
        )}
      </g>
    );
  }
  return null;
}

/**
 * Architectural floor plan drawn from the plan's room layout (100 × 70 grid).
 * Pass `onSelect` to make rooms clickable (used by the virtual tour map).
 * Works as a Server or Client Component, so it takes the translator `t` as a prop
 * (from getT() or useT()); `label` is expected already translated.
 */
export function FloorPlan({
  plan,
  active,
  onSelect,
  selectable,
  dims = true,
  compact = false,
  className = "",
  label,
  t = same,
}: {
  plan: PlanShape;
  active?: string | null;
  onSelect?: (key: string) => void;
  selectable?: string[];
  dims?: boolean;
  compact?: boolean;
  className?: string;
  label?: string;
  t?: T;
}) {
  const rooms = plan.rooms;
  const minY = Math.min(0, ...rooms.map((r) => r[2]));
  const pad = 4;
  const vb = `${-pad} ${minY - pad} ${100 + pad * 2} ${70 - minY + pad * 2 + 4}`;
  const ops = openings(rooms);
  const mid = `fpm-${plan.code}-${compact ? "c" : "f"}${onSelect ? "i" : ""}`;
  // feet per grid unit, so labelled dimensions add up to the plan's square footage
  const interior = rooms.filter((r) => r[0] !== "balcony").reduce((s, r) => s + r[3] * r[4], 0);
  const k = plan.sqft ? Math.sqrt(plan.sqft / interior) : 0;
  const walls = rooms.filter((r) => r[0] !== "balcony");
  const balcony = rooms.find((r) => r[0] === "balcony");
  const canSelect = (key: string) => !!onSelect && (!selectable || selectable.includes(key));

  return (
    <svg
      className={`fp-svg ${compact ? "fp-svg-compact" : ""} ${className}`}
      viewBox={vb}
      role={onSelect ? "group" : "img"}
      aria-label={label ?? t(`Floor plan of the ${plan.code}`)}
    >
      <defs>
        <mask id={mid} maskUnits="userSpaceOnUse" x={-pad} y={minY - pad} width={100 + pad * 2} height={70 - minY + pad * 2}>
          <rect x={-pad} y={minY - pad} width={100 + pad * 2} height={70 - minY + pad * 2} fill="#fff" />
          {ops.map((o, i) =>
            o.seg.o === "v" ? (
              <rect key={i} x={o.seg.at - 1.5} y={o.seg.from} width={3} height={o.seg.to - o.seg.from} fill="#000" />
            ) : (
              <rect key={i} x={o.seg.from} y={o.seg.at - 1.5} width={o.seg.to - o.seg.from} height={3} fill="#000" />
            )
          )}
        </mask>
      </defs>

      {/* balcony */}
      {balcony && (
        <g
          className={`fp-room fp-room-balcony ${active === "balcony" ? "is-active" : ""} ${canSelect("balcony") ? "is-sel" : ""}`}
          {...(canSelect("balcony") ? selectProps("balcony", t(`Go to ${roomName("balcony", plan)}`), onSelect!, active === "balcony") : {})}
        >
          <rect x={balcony[1]} y={balcony[2]} width={balcony[3]} height={balcony[4]} className="fp-fill" />
          <rect x={balcony[1] + 0.6} y={balcony[2] + 0.6} width={balcony[3] - 1.2} height={balcony[4] - 0.6} className="fp-rail" />
          <text x={balcony[1] + balcony[3] / 2} y={balcony[2] + balcony[4] / 2 + 1.2} className="fp-lbl">
            {t("Balcony")}
          </text>
        </g>
      )}

      {/* rooms */}
      {walls.map((r) => {
        const [key, x, y, w, h] = r;
        const sel = canSelect(key);
        const small = w < 22 || h < 18;
        const showDims = dims && k > 0 && !compact && !small && key !== "closet";
        const cy = y + h / 2 + (showDims ? -0.6 : 1.2);
        return (
          <g
            key={key}
            className={`fp-room fp-room-${key} ${active === key ? "is-active" : ""} ${sel ? "is-sel" : ""}`}
            {...(sel ? selectProps(key, t(`Go to ${roomName(key, plan)}`), onSelect!, active === key) : {})}
          >
            <rect x={x} y={y} width={w} height={h} className="fp-fill" />
            {!compact && <Fixtures r={r} plan={plan} />}
            <text x={x + w / 2} y={cy} className={`fp-lbl ${small ? "fp-lbl-s" : ""}`}>
              {t(shortName(key, plan, r))}
            </text>
            {showDims && (
              <text x={x + w / 2} y={cy + 3.6} className="fp-dim">
                {ft(w, k)} × {ft(h, k)}
              </text>
            )}
          </g>
        );
      })}

      {/* walls with door and window gaps */}
      <g mask={`url(#${mid})`} className="fp-walls">
        {walls.map((r) => (
          <rect key={r[0]} x={r[1]} y={r[2]} width={r[3]} height={r[4]} className="fp-wall" />
        ))}
        <rect x={0} y={0} width={100} height={70} className="fp-wall-outer" />
      </g>

      {/* door swings, sliders, windows */}
      <g className="fp-ops">
        {ops.map((o, i) => {
          const { seg, dir } = o;
          const len = seg.to - seg.from;
          if (o.kind === "window") {
            return seg.o === "h" ? (
              <g key={i} className="fp-win">
                <rect x={seg.from} y={seg.at - 1} width={len} height={2} />
                <line x1={seg.from} x2={seg.to} y1={seg.at} y2={seg.at} />
              </g>
            ) : (
              <g key={i} className="fp-win">
                <rect x={seg.at - 1} y={seg.from} width={2} height={len} />
                <line y1={seg.from} y2={seg.to} x1={seg.at} x2={seg.at} />
              </g>
            );
          }
          if (o.kind === "slider") {
            return seg.o === "h" ? (
              <g key={i} className="fp-slide">
                <line x1={seg.from} x2={seg.from + len * 0.55} y1={seg.at - 0.5} y2={seg.at - 0.5} />
                <line x1={seg.from + len * 0.45} x2={seg.to} y1={seg.at + 0.5} y2={seg.at + 0.5} />
              </g>
            ) : (
              <g key={i} className="fp-slide">
                <line y1={seg.from} y2={seg.from + len * 0.55} x1={seg.at - 0.5} x2={seg.at - 0.5} />
                <line y1={seg.from + len * 0.45} y2={seg.to} x1={seg.at + 0.5} x2={seg.at + 0.5} />
              </g>
            );
          }
          if (o.kind === "open") return null;
          // hinged door: leaf + quarter-circle swing
          if (seg.o === "v") {
            const sweep = dir > 0 ? 1 : 0;
            return (
              <g key={i} className={`fp-door ${o.kind === "front" ? "fp-door-front" : ""}`}>
                <line x1={seg.at} y1={seg.from} x2={seg.at + dir * len} y2={seg.from} />
                <path d={`M${seg.at + dir * len} ${seg.from} A${len} ${len} 0 0 ${sweep} ${seg.at} ${seg.to}`} />
              </g>
            );
          }
          const sweep = dir > 0 ? 0 : 1;
          return (
            <g key={i} className={`fp-door ${o.kind === "front" ? "fp-door-front" : ""}`}>
              <line x1={seg.from} y1={seg.at} x2={seg.from} y2={seg.at + dir * len} />
              <path d={`M${seg.from} ${seg.at + dir * len} A${len} ${len} 0 0 ${sweep} ${seg.to} ${seg.at}`} />
            </g>
          );
        })}
      </g>

      {!compact && (
        <g className="fp-north" transform={`translate(97 ${70 + 3.4})`}>
          <text x={0} y={0} className="fp-dim" textAnchor="end">
            {plan.code}
            {plan.sqft ? t(` · ${plan.sqft.toLocaleString("en-US")} sq ft`) : ""}
          </text>
        </g>
      )}
    </svg>
  );
}

/** `label` is the translated "Go to <room>". */
function selectProps(key: string, label: string, onSelect: (k: string) => void, current: boolean) {
  return {
    role: "button",
    tabIndex: 0,
    "aria-label": label,
    "aria-current": current ? ("true" as const) : undefined,
    onClick: () => onSelect(key),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect(key);
      }
    },
  };
}
