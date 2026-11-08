"use client";

// Taking attendance: a tap list of residents, or a photo of the paper sign-in sheet. Residents who scanned the QR
// check-in sign are already ticked, marked "QR". Saved in this browser only.
import { useEffect, useRef, useState } from "react";
import { Icon } from "../../Icon";
import { Badge } from "../ui";

export interface TapActivity { id: string; title: string; when: string; place: string; pool: string[]; expected: number }

export function TakeAttendance({ activities, qr = [], onSaved }: { activities: TapActivity[]; /** Checked themselves in by QR. */ qr?: string[]; onSaved?: (n: number) => void }) {
  const [sel, setSel] = useState(activities[0]?.id ?? "");
  const [mode, setMode] = useState<"tap" | "photo">("tap");
  const [present, setPresent] = useState<Record<string, Set<string>>>(() => (activities[0] && qr.length ? { [activities[0].id]: new Set(qr) } : {}));
  const [saved, setSaved] = useState<Record<string, number>>({});
  const [photo, setPhoto] = useState<{ url: string; name: string } | null>(null);
  const [reading, setReading] = useState(false);
  const [found, setFound] = useState<Set<string> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const a = activities.find((x) => x.id === sel);
  if (!a) return <p className="sx-empty"><Icon name="check" /> Nothing left to take today.</p>;
  const here = present[a.id] ?? new Set<string>();
  const toggle = (n: string) =>
    setPresent((p) => {
      const s = new Set(p[a.id] ?? []);
      if (s.has(n)) s.delete(n);
      else s.add(n);
      return { ...p, [a.id]: s };
    });
  const choose = (id: string) => {
    setSel(id);
    setPhoto(null);
    setFound(null);
  };
  const upload = (f: File | undefined) => {
    if (!f) return;
    setPhoto({ url: URL.createObjectURL(f), name: f.name });
    setFound(null);
    setReading(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setReading(false);
      setFound(new Set(a.pool.slice(0, Math.min(14, a.pool.length))));
    }, 1200);
  };
  const done = saved[a.id];

  return (
    <div className="at-take">
      <div className="sx-chips" role="group" aria-label="Activity">
        {activities.map((x) => (
          <button key={x.id} type="button" aria-pressed={x.id === sel} onClick={() => choose(x.id)}>
            {saved[x.id] !== undefined && <Icon name="check" />} {x.title} · {x.when}
          </button>
        ))}
      </div>
      <div className="at-head">
        <div>
          <b>{a.title}</b>
          <span className="sx-hint"> · {a.when} · {a.place} · about {a.expected} expected</span>
        </div>
        <div className="sx-seg" role="group" aria-label="How to take attendance">
          <button type="button" aria-pressed={mode === "tap"} onClick={() => setMode("tap")}>Tap list</button>
          <button type="button" aria-pressed={mode === "photo"} onClick={() => setMode("photo")}>Photo of the sheet</button>
        </div>
      </div>

      {done !== undefined ? (
        <div className="sx-callout good" role="status">
          <Icon name="check" />
          <p><b>Saved: {done} came to {a.title}.</b> Counted in Reports and in “what worked” when planning next month.</p>
        </div>
      ) : mode === "tap" ? (
        <>
          <ul className="at-tap" aria-label={`Residents at ${a.title}`}>
            {a.pool.map((n) => (
              <li key={n}>
                <button type="button" aria-pressed={here.has(n)} onClick={() => toggle(n)}>
                  <span className="at-box" aria-hidden="true">{here.has(n) && <Icon name="check" />}</span>
                  {n}
                  {qr.includes(n) && <span className="at-qr">QR</span>}
                </button>
              </li>
            ))}
          </ul>
          <div className="at-foot">
            <span><b>{here.size}</b> present{qr.length > 0 && <> · {qr.filter((n) => here.has(n)).length} by QR, {[...here].filter((n) => !qr.includes(n)).length} tapped in</>}</span>
            <button type="button" className="sx-btn sx-btn-primary" disabled={!here.size} onClick={() => { setSaved((s) => ({ ...s, [a.id]: here.size })); onSaved?.(here.size); }}>
              <Icon name="check" /> Save attendance
            </button>
          </div>
        </>
      ) : (
        <div className="at-photo">
          <label className="pub-file">
            <input type="file" accept="image/*" capture="environment" onChange={(e) => upload(e.target.files?.[0])} />
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <span className="sx-thumb"><img src={photo.url} alt="The sign-in sheet you uploaded" style={{ width: "100%", height: "100%" }} /></span>
            ) : (
              <Icon name="upload" />
            )}
            <span>
              <b>{photo ? photo.name : "Upload a photo of the paper sign-in sheet"}</b>
              <span>{photo ? "Choose another photo" : "Take it on your phone after the activity; names are read for you"}</span>
            </span>
          </label>
          {reading && <p className="sx-note" role="status">Reading the names on the sheet…</p>}
          {found && (
            <>
              <div className="sx-callout info" role="status">
                <Icon name="info" />
                <p><b>Counted {found.size} names.</b> Check them and save.</p>
              </div>
              <ul className="at-tap" aria-label="Names found on the sheet">
                {a.pool.slice(0, Math.min(a.pool.length, found.size + 3)).map((n) => (
                  <li key={n}>
                    <button
                      type="button"
                      aria-pressed={found.has(n)}
                      onClick={() =>
                        setFound((f) => {
                          const s = new Set(f);
                          if (s.has(n)) s.delete(n);
                          else s.add(n);
                          return s;
                        })
                      }
                    >
                      <span className="at-box" aria-hidden="true">{found.has(n) && <Icon name="check" />}</span>
                      {n}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="at-foot">
                <span><b>{found.size}</b> present <Badge tone="neutral">From the photo</Badge></span>
                <button type="button" className="sx-btn sx-btn-primary" onClick={() => { setSaved((s) => ({ ...s, [a.id]: found.size })); onSaved?.(found.size); }}>
                  <Icon name="check" /> Save attendance
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
