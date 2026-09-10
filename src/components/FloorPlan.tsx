/** Simple schematic floor plans drawn as SVG. Units are feet on a 1:1 grid; not to scale for construction. */

interface Room { x: number; y: number; w: number; h: number; label: string; sub?: string }
interface Plan { w: number; h: number; rooms: Room[]; door: { x: number; y: number; side: "top" | "bottom" | "left" | "right" }; window: { x: number; y: number; len: number; side: "top" | "bottom" | "left" | "right" } }

export const plans: Record<string, Plan> = {
  studio: {
    w: 20, h: 19,
    rooms: [
      { x: 0, y: 0, w: 20, h: 12, label: "Living and sleeping", sub: "18′ × 12′" },
      { x: 0, y: 12, w: 8, h: 7, label: "Bath", sub: "walk-in shower" },
      { x: 8, y: 12, w: 7, h: 7, label: "Kitchenette" },
      { x: 15, y: 12, w: 5, h: 7, label: "Closet" },
    ],
    door: { x: 11, y: 19, side: "bottom" },
    window: { x: 4, y: 0, len: 12, side: "top" },
  },
  one: {
    w: 27, h: 20,
    rooms: [
      { x: 0, y: 0, w: 15, h: 13, label: "Living room", sub: "15′ × 13′" },
      { x: 15, y: 0, w: 12, h: 13, label: "Bedroom", sub: "12′ × 13′" },
      { x: 0, y: 13, w: 9, h: 7, label: "Kitchenette" },
      { x: 9, y: 13, w: 9, h: 7, label: "Bath", sub: "walk-in shower" },
      { x: 18, y: 13, w: 9, h: 7, label: "Closet and entry" },
    ],
    door: { x: 22, y: 20, side: "bottom" },
    window: { x: 2, y: 0, len: 22, side: "top" },
  },
  two: {
    w: 34, h: 22,
    rooms: [
      { x: 0, y: 0, w: 16, h: 14, label: "Living and dining", sub: "16′ × 14′" },
      { x: 16, y: 0, w: 10, h: 14, label: "Bedroom 1", sub: "10′ × 14′" },
      { x: 26, y: 0, w: 8, h: 14, label: "Bedroom 2", sub: "8′ × 14′" },
      { x: 0, y: 14, w: 10, h: 8, label: "Kitchen" },
      { x: 10, y: 14, w: 8, h: 8, label: "Bath", sub: "walk-in shower" },
      { x: 18, y: 14, w: 8, h: 8, label: "Second bath" },
      { x: 26, y: 14, w: 8, h: 8, label: "Entry and closets" },
    ],
    door: { x: 30, y: 22, side: "bottom" },
    window: { x: 2, y: 0, len: 30, side: "top" },
  },
  suite: {
    w: 20, h: 16,
    rooms: [
      { x: 0, y: 0, w: 20, h: 10, label: "Bedroom and sitting area", sub: "18′ × 10′" },
      { x: 0, y: 10, w: 10, h: 6, label: "Bath", sub: "roll-in shower" },
      { x: 10, y: 10, w: 10, h: 6, label: "Closet and entry" },
    ],
    door: { x: 15, y: 16, side: "bottom" },
    window: { x: 3, y: 0, len: 14, side: "top" },
  },
  companion: {
    w: 26, h: 16,
    rooms: [
      { x: 0, y: 0, w: 11, h: 10, label: "Bedroom A", sub: "11′ × 10′" },
      { x: 11, y: 0, w: 4, h: 10, label: "" },
      { x: 15, y: 0, w: 11, h: 10, label: "Bedroom B", sub: "11′ × 10′" },
      { x: 0, y: 10, w: 13, h: 6, label: "Shared bath", sub: "roll-in shower" },
      { x: 13, y: 10, w: 13, h: 6, label: "Sitting area and entry" },
    ],
    door: { x: 22, y: 16, side: "bottom" },
    window: { x: 2, y: 0, len: 22, side: "top" },
  },
};

const S = 12; // px per foot

export function FloorPlan({ plan, title }: { plan: keyof typeof plans; title: string }) {
  const p = plans[plan];
  const W = p.w * S + 24;
  const H = p.h * S + 24;
  const o = 12;
  const win = p.window;
  const winLine =
    win.side === "top"
      ? { x1: o + win.x * S, y1: o, x2: o + (win.x + win.len) * S, y2: o }
      : { x1: o + win.x * S, y1: o + p.h * S, x2: o + (win.x + win.len) * S, y2: o + p.h * S };
  const door = p.door;
  const doorRect =
    door.side === "bottom"
      ? { x: o + door.x * S - 2, y: o + p.h * S - 3, w: 3 * S + 4, h: 6 }
      : { x: o + door.x * S - 2, y: o - 3, w: 3 * S + 4, h: 6 };

  return (
    <svg className="plan" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Floor plan of the ${title}: ${p.rooms.filter((r) => r.label).map((r) => r.label).join(", ")}`}>
      <rect x={o} y={o} width={p.w * S} height={p.h * S} fill="#f7f5ee" stroke="#34453a" strokeWidth="3" />
      {p.rooms.map((r, i) => (
        <g key={i}>
          <rect x={o + r.x * S} y={o + r.y * S} width={r.w * S} height={r.h * S} fill={r.label ? "#eef0e9" : "#e4e1d6"} stroke="#34453a" strokeWidth="1.5" />
          {r.label && (
            <text x={o + (r.x + r.w / 2) * S} y={o + (r.y + r.h / 2) * S - (r.sub ? 4 : -4)} textAnchor="middle" fontSize="12" fontFamily="var(--font-body), sans-serif" fill="#262e29" fontWeight="600">
              {r.label}
            </text>
          )}
          {r.sub && (
            <text x={o + (r.x + r.w / 2) * S} y={o + (r.y + r.h / 2) * S + 12} textAnchor="middle" fontSize="11" fontFamily="var(--font-body), sans-serif" fill="#4e5851">
              {r.sub}
            </text>
          )}
        </g>
      ))}
      <line {...winLine} stroke="#b4975a" strokeWidth="5" />
      <rect {...doorRect} width={doorRect.w} height={doorRect.h} fill="#f7f5ee" />
      <path d={`M ${doorRect.x + 2} ${doorRect.y + 3} a ${3 * S} ${3 * S} 0 0 1 ${3 * S} -${3 * S}`} fill="none" stroke="#34453a" strokeWidth="1" strokeDasharray="3 3" />
    </svg>
  );
}
