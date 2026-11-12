// A QR check-in code, drawn from the event id (the same pattern every time for the same event).
import { hash } from "@/lib/clock";

export function QrBlock({ seed, className = "pc-qr" }: { seed: string; className?: string }) {
  const n = 21;
  const finder = (x: number, y: number) => {
    const inBox = (ox: number, oy: number) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7;
    for (const [ox, oy] of [[0, 0], [n - 7, 0], [0, n - 7]] as const) {
      if (inBox(ox, oy)) { const dx = x - ox, dy = y - oy; return dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4) ? 1 : 0; }
      if (x >= ox - 1 && x <= ox + 7 && y >= oy - 1 && y <= oy + 7) return 0;
    }
    return -1;
  };
  const cells: [number, number][] = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const f = finder(x, y);
    if (f === 1 || (f === -1 && hash(`${seed}:${x}:${y}`) % 2 === 0)) cells.push([x, y]);
  }
  return (
    <svg className={className} viewBox={`-1 -1 ${n + 2} ${n + 2}`} role="img" aria-label="QR code">
      {cells.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" />)}
    </svg>
  );
}
