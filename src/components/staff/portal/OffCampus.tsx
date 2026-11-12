"use client";

// Where an off-campus event goes: one or more stops, found with a map search, in order, with the drive there and a
// small route map. MOCK: the search and drive times come from src/lib/places.ts; the product uses Google Places or
// Mapbox for both.
import { useState } from "react";
import { customPlace, searchPlaces, type Place } from "@/lib/places";
import { Icon } from "../../Icon";

/** Minutes on the bus for the whole trip: there, between stops, and back. */
export function busMinutes(stops: Pick<Place, "mins" | "x" | "y">[]): number {
  return stops.reduce((n, s, i) => n + (i === 0 ? s.mins : Math.max(5, Math.round(Math.hypot(s.x - stops[i - 1].x, s.y - stops[i - 1].y) / 3))), 0) + (stops.length ? stops[stops.length - 1].mins : 0);
}

export function OffCampus({ stops, onChange, from, minutes }: { stops: Place[]; onChange: (x: Place[]) => void; from: string; minutes: number }) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const results = searchPlaces(q).filter((p) => !stops.some((s) => s.id === p.id));
  const add = (p: Place) => { onChange([...stops, p]); setQ(""); setActive(0); };
  const move = (i: number, by: number) => { const x = [...stops]; const [s] = x.splice(i, 1); x.splice(i + by, 0, s); onChange(x); };
  const total = busMinutes(stops);

  return (
    <fieldset className="po-field oc">
      <legend className="sx-lbl">Destinations <span className="oc-mock">Map search · mock</span></legend>
      <div className="oc-search">
        <Icon name="search" />
        <input
          value={q}
          onChange={(ev) => { setQ(ev.target.value); setActive(0); }}
          onKeyDown={(ev) => {
            if (ev.key === "ArrowDown") { ev.preventDefault(); setActive((a) => Math.min(a + 1, results.length)); }
            if (ev.key === "ArrowUp") { ev.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
            if (ev.key === "Enter" && q.trim()) { ev.preventDefault(); add(results[active] ?? customPlace(q)); }
          }}
          placeholder="Search for a place or address: museum, Lakeview Park…"
          aria-label="Search for a destination"
          role="combobox"
          aria-expanded={q.trim().length > 1}
          aria-controls="oc-results"
          autoComplete="off"
        />
      </div>
      {q.trim().length > 1 && (
        <ul className="oc-results" id="oc-results" role="listbox">
          {results.map((p, i) => (
            <li key={p.id} role="option" aria-selected={i === active}>
              <button type="button" onMouseEnter={() => setActive(i)} onClick={() => add(p)}>
                <Icon name="pin" />
                <span><b>{p.name}</b><small>{p.address} · {p.kind}</small></span>
                <em>{p.mins} min</em>
              </button>
            </li>
          ))}
          <li role="option" aria-selected={active === results.length}>
            <button type="button" className="oc-custom" onMouseEnter={() => setActive(results.length)} onClick={() => add(customPlace(q))}>
              <Icon name="plus" /><span><b>Add “{q.trim()}”</b><small>Not in the list: staff confirm the address</small></span>
            </button>
          </li>
        </ul>
      )}

      {stops.length > 0 ? (
        <div className="oc-body">
          <ol className="oc-stops">
            <li className="oc-home"><span className="oc-dot">●</span><span><b>{from}</b><small>Leaves from the lobby</small></span></li>
            {stops.map((s, i) => (
              <li key={s.id}>
                <span className="oc-dot">{i + 1}</span>
                <span><b>{s.name}</b><small>{s.address}{i === 0 ? ` · ${s.mins} min by bus` : ""}</small></span>
                <span className="oc-btns">
                  <button type="button" className="sx-x" aria-label={`Move ${s.name} earlier`} disabled={i === 0} onClick={() => move(i, -1)}><Icon name="chev" /></button>
                  <button type="button" className="sx-x oc-down" aria-label={`Move ${s.name} later`} disabled={i === stops.length - 1} onClick={() => move(i, 1)}><Icon name="chev" /></button>
                  <button type="button" className="sx-x" aria-label={`Remove ${s.name}`} onClick={() => onChange(stops.filter((x) => x.id !== s.id))}><Icon name="x" /></button>
                </span>
              </li>
            ))}
            <li className="oc-home"><span className="oc-dot">●</span><span><b>Back to {from}</b><small>About {total} min on the bus in all</small></span></li>
          </ol>
          <MockMap stops={stops} />
          {total + 30 > minutes && (
            <p className="sx-callout oc-short" role="status"><Icon name="clock" /> <span>The bus alone takes about {total} minutes and the event is {minutes}. Give it more time on the Time tab: about {Math.ceil((total + 30 * stops.length) / 15) * 15} minutes leaves half an hour at each stop.</span></p>
          )}
        </div>
      ) : (
        <p className="sx-hint">Add where the bus is going. Add more than one for a trip with stops; they’re visited in this order.</p>
      )}
    </fieldset>
  );
}

/** A route sketch: the community in the middle, each stop in order. MOCK of a map tile with a route line. */
function MockMap({ stops }: { stops: Place[] }) {
  const pts = [{ x: 50, y: 50 }, ...stops.map((s) => ({ x: s.x, y: s.y })), { x: 50, y: 50 }];
  // Zoom to fit the community and every stop, with a margin.
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const size = Math.max(30, Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) + 16;
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
  const box = `${cx - size / 2} ${cy - size / 2} ${size} ${size}`;
  const k = size / 100;
  return (
    <figure className="oc-map" aria-label="Route map (mock)">
      <svg viewBox={box} preserveAspectRatio="xMidYMid meet" role="img" style={{ "--k": k } as React.CSSProperties}>
        <title>Route from the community to {stops.map((s) => s.name).join(", ")} and back</title>
        <rect x="-50" y="-50" width="200" height="200" className="oc-land" />
        <path d="M-50 70 Q30 60 55 75 T150 68" className="oc-river" />
        <path d="M10 -50 L18 150 M-50 30 L150 38 M62 -50 L70 150" className="oc-road" />
        <polyline points={pts.map((p) => `${p.x},${p.y}`).join(" ")} className="oc-route" />
        <circle cx="50" cy="50" r={3.2 * k} className="oc-home-pin" />
        {stops.map((s, i) => (
          <g key={s.id}>
            <circle cx={s.x} cy={s.y} r={3.6 * k} className="oc-pin" />
            <text x={s.x} y={s.y + 1.3 * k} textAnchor="middle" className="oc-pin-n" fontSize={3.6 * k}>{i + 1}</text>
          </g>
        ))}
      </svg>
      <figcaption>Mock map. The live version shows the real route.</figcaption>
    </figure>
  );
}
