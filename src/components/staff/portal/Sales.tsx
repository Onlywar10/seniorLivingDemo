"use client";

// Prospects, for sales: upcoming tours (and the outcome of each one, the one sales task the alpha asks for),
// availability (mark a floor plan open with its starting price, which alerts its waitlist) and the waitlist in order.
// Changes stay in this browser.
import { useState } from "react";
import { money } from "@/data/shared";
import { Icon } from "../../Icon";
import { Badge } from "../ui";

export interface TourRow { id: string; who: string; forWhom: string; interest: string; source: string; day: string; time: string; done: boolean; with: string }
export interface PlanRow { code: string; name: string; kind: string; from: number; available: number; waiting: number }
export interface WaitRow { name: string; plan: string; since: string }

const outcomes = ["Moved in", "Still deciding", "Chose elsewhere"] as const;

export function Tours({ tours }: { tours: TourRow[] }) {
  const [out, setOut] = useState<Record<string, string>>({});
  return (
    <ul className="pt-tours">
      {tours.map((t, i) => {
        const head = i === 0 || t.day !== tours[i - 1].day;
        return (
          <li key={t.id}>
            {head && <h3 className="tour-day">{t.day}</h3>}
            <div className={`pt-tour${t.done ? " done" : ""}`}>
              <time>{t.time}</time>
              <span>
                <b>{t.who}</b> <span className="sx-hint">for {t.forWhom}</span>
                <small>{t.interest} · {t.source} · with {t.with}</small>
              </span>
              {t.done && (
                <span className="pt-outcome">
                  {out[t.id] ? (
                    <Badge tone={out[t.id] === "Chose elsewhere" ? "neutral" : "good"}><Icon name="check" /> {out[t.id]}</Badge>
                  ) : (
                    <>
                      <span className="sx-hint">How did it go?</span>
                      <span className="sx-seg" role="group" aria-label={`Outcome of ${t.who}’s tour`}>
                        {outcomes.map((o) => <button key={o} type="button" onClick={() => setOut((x) => ({ ...x, [t.id]: o }))}>{o}</button>)}
                      </span>
                    </>
                  )}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function Availability({ plans }: { plans: PlanRow[] }) {
  const [rows, setRows] = useState(plans);
  const [edit, setEdit] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [toast, setToast] = useState("");
  const mark = (p: PlanRow) => {
    const from = Number(price.replace(/\D/g, "")) || p.from;
    setRows((xs) => xs.map((x) => (x.code === p.code ? { ...x, available: x.available + 1, from } : x)));
    setEdit(null);
    setToast(p.waiting ? `${p.code} is open from ${money(from)} a month. The ${p.waiting} ${p.waiting === 1 ? "person" : "people"} on its waitlist got a text and an email.` : `${p.code} is open from ${money(from)} a month and on the website.`);
    window.setTimeout(() => setToast(""), 4000);
  };
  return (
    <>
      <ul className="pt-plans">
        {rows.map((p) => (
          <li key={p.code}>
            <span className="pt-plan-t">
              <b>{p.code} · {p.name}</b>
              <small>{p.kind === "lantern" ? "Lantern Memory Care" : p.kind === "assisted" ? "Assisted Living" : "Independent Living"} · {p.from ? `from ${money(p.from)}` : "price on request"}</small>
            </span>
            <span className="pt-plan-s">
              {p.available ? <Badge tone="good">{p.available} open</Badge> : <Badge>None open</Badge>}
              {p.waiting > 0 && <small>{p.waiting} waiting</small>}
            </span>
            {edit === p.code ? (
              <form className="pt-plan-f" onSubmit={(e) => { e.preventDefault(); mark(p); }}>
                <label>
                  <span className="vh">Starting price a month</span>
                  <input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={String(p.from)} aria-label={`Starting price for ${p.code}`} />
                </label>
                <button type="submit" className="sx-btn sx-btn-primary sx-btn-sm"><Icon name="check" /> Mark open</button>
                <button type="button" className="sx-btn sx-btn-sm" onClick={() => setEdit(null)}>Cancel</button>
              </form>
            ) : (
              <button type="button" className="sx-btn sx-btn-sm" onClick={() => { setEdit(p.code); setPrice(String(p.from)); }}>Mark one open</button>
            )}
          </li>
        ))}
      </ul>
      {toast && <div className="sx-toast" role="status"><Icon name="check" /> {toast}</div>}
    </>
  );
}

export function Waitlist({ rows }: { rows: WaitRow[] }) {
  return (
    <ol className="pt-wait">
      {rows.map((w, i) => (
        <li key={w.name}>
          <span className="pt-wait-n">{i + 1}</span>
          <span><b>{w.name}</b><small>Since {w.since}</small></span>
          <Badge tone="info">{w.plan}</Badge>
        </li>
      ))}
    </ol>
  );
}
