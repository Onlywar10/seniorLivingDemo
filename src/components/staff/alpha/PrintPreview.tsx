// Print previews for the Library & print screen: the family sign-up QR poster and a large-print calendar page.
// Server-safe (no hooks): rendered on the server from the community's own name, domain and calendar.
import type { Community } from "@/data/communities";
import { cats, isLantern } from "@/data/shared";
import { hash, iso, monthGrid, monthLabel, today } from "@/lib/clock";

/** A QR-style code: three finder squares and a stable pattern from the address. */
export function QrCode({ text, size = 132 }: { text: string; size?: number }) {
  const n = 25;
  const finder = (x: number, y: number) => {
    const inBox = (ox: number, oy: number) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7;
    for (const [ox, oy] of [[0, 0], [n - 7, 0], [0, n - 7]]) {
      if (inBox(ox, oy)) {
        const dx = x - ox, dy = y - oy;
        const ring = Math.min(dx, dy, 6 - dx, 6 - dy);
        return ring === 0 || ring >= 2 ? 1 : 0;
      }
      if (x >= ox - 1 && x <= ox + 7 && y >= oy - 1 && y <= oy + 7) return 0;
    }
    return -1;
  };
  const cells: [number, number][] = [];
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const f = finder(x, y);
      if (f === 1 || (f === -1 && hash(`${text}:${x}:${y}`) % 100 < 47)) cells.push([x, y]);
    }
  return (
    <svg viewBox={`-2 -2 ${n + 4} ${n + 4}`} width={size} height={size} role="img" aria-label={`QR code for ${text}`} className="pr-qr">
      <rect x="-2" y="-2" width={n + 4} height={n + 4} fill="#fff" />
      {cells.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" fill="#1d2529" />)}
    </svg>
  );
}

export function QrPoster({ name, domain }: { name: string; domain: string }) {
  const url = `${domain}/family`;
  return (
    <div className="pr-sheet pr-poster" aria-label="QR poster preview">
      <p className="pr-eyebrow">{name}</p>
      <p className="pr-big">Get the weekly update</p>
      <p className="pr-mid">Photos, the calendar and menus, by text or email, in your language.</p>
      <QrCode text={url} />
      <p className="pr-mid"><b>Scan with your phone camera</b></p>
      <p className="pr-small">or visit {url} · Reply STOP any time</p>
    </div>
  );
}

/** A large-print monthly calendar page in miniature: day numbers and color-coded activity lines. */
export function CalendarThumb({ c }: { c: Community }) {
  const t = today();
  const weeks = monthGrid(t.getUTCFullYear(), t.getUTCMonth());
  const month = t.getUTCMonth();
  return (
    <div className="pr-sheet pr-cal" aria-label="Large-print calendar preview">
      <p className="pr-cal-h"><b>{c.site.name}</b> · {monthLabel(t)}</p>
      <div className="pr-cal-g" aria-hidden="true">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i} className="pr-cal-dn">{d}</span>)}
        {weeks.flat().map((d) => {
          const out = d.getUTCMonth() !== month;
          const evs = out ? [] : c.staffEventsOn(d, iso(t)).filter((e) => !isLantern(e)).slice(0, 4);
          return (
            <span key={iso(d)} className={`pr-cal-d${out ? " out" : ""}`}>
              <b>{d.getUTCDate()}</b>
              {evs.map((e) => <i key={e.id} style={{ background: cats[e.cat].color }} />)}
            </span>
          );
        })}
      </div>
      <p className="pr-cal-l">
        {(["fitness", "clubs", "trips", "music", "faith"] as const).map((k) => (
          <span key={k}><i style={{ background: cats[k].color }} />{cats[k].label}</span>
        ))}
      </p>
    </div>
  );
}
