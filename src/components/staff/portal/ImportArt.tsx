"use client";

// What people actually upload to Import, drawn in HTML and CSS so it looks like the real thing: the designed PDF
// calendar for next month, a phone photo of the whiteboard in the activities office, a note scribbled at the front desk,
// and the kitchen's PDF menu. Every size is in container units, so the same artwork works as a thumbnail and full size.
import { Caveat, Permanent_Marker } from "next/font/google";
import type { MenuArt, MonthArt, NoteArt, WeekArt } from "@/data/staff/post";

const marker = Permanent_Marker({ weight: "400", subsets: ["latin"], display: "swap" });
const pen = Caveat({ weight: ["500", "700"], subsets: ["latin"], display: "swap" });

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function ImportArt({ art, label }: { art: MonthArt | WeekArt | NoteArt | MenuArt; label: string }) {
  return (
    <div className={`ia ia-${art.kind}`} role="img" aria-label={label}>
      {art.kind === "month" && <MonthPdf a={art} />}
      {art.kind === "week" && <Whiteboard a={art} />}
      {art.kind === "note" && <Note a={art} />}
      {art.kind === "menu" && <MenuPdf a={art} />}
    </div>
  );
}

function MonthPdf({ a }: { a: MonthArt }) {
  const cells = Array.from({ length: 35 }, (_, i) => i - a.lead + 1);
  return (
    <div className="ia-page">
      <div className="ia-cal-head">
        <span className="ia-cal-brand">{a.brand}</span>
        <span className="ia-cal-month">{a.month} <i>{a.year}</i></span>
        <span className="ia-cal-sub">Activity Calendar</span>
      </div>
      <div className="ia-cal-grid">
        {DOW.map((d) => <span key={d} className="ia-cal-dow">{d}</span>)}
        {cells.map((n, i) => (
          <span key={i} className={`ia-cal-cell${n < 1 || n > a.days ? " out" : ""}${i % 7 === 0 || i % 7 === 6 ? " we" : ""}`}>
            {n >= 1 && n <= a.days && (
              <>
                <b>{n}</b>
                {(a.cells[n] ?? []).map((t, k) => <em key={k}>{t}</em>)}
              </>
            )}
          </span>
        ))}
      </div>
      <div className="ia-cal-foot"><span>Large print copies at the front desk</span><span>Page 1 of 2</span></div>
    </div>
  );
}

function Whiteboard({ a }: { a: WeekArt }) {
  return (
    <div className="ia-wall">
      <div className="ia-board">
        <div className={`ia-board-in ${marker.className}`}>
          <span className="ia-wb-title">{a.title}</span>
          <div className="ia-wb-cols">
            {a.cols.map((c) => (
              <div key={c.day} className="ia-wb-col">
                <span className="ia-wb-day">{c.day}</span>
                {c.items.map((x, k) => <span key={k} className={`ia-wb-it ${x.mark ?? ""}`}>{x.text}</span>)}
              </div>
            ))}
          </div>
          <span className="ia-wb-note">sign up @ desk!</span>
        </div>
        <span className="ia-magnet" />
        <span className="ia-tray"><i /><i /><i /></span>
      </div>
      <span className="ia-glare" />
    </div>
  );
}

function Note({ a }: { a: NoteArt }) {
  return (
    <div className="ia-desk">
      <div className={`ia-paper ${pen.className}`}>
        <span className="ia-tape" />
        {a.lines.map((l, i) => <span key={l} className={`ia-pen l${i}`}>{l}</span>)}
        <span className="ia-pen sign">{a.sign}</span>
      </div>
    </div>
  );
}

function MenuPdf({ a }: { a: MenuArt }) {
  const tag = (t: string[]) => (t.length ? <sup>{t.join(" · ")}</sup> : null);
  return (
    <div className="ia-page ia-menu-page">
      <div className="ia-menu-head">
        <span className="ia-menu-venue">{a.venue}</span>
        <span className="ia-menu-week">{a.week}</span>
      </div>
      <div className="ia-menu-days">
        {a.days.map((d) => (
          <div key={d.day} className="ia-menu-day">
            <span className="ia-menu-dn">{d.day.split(",")[0]}</span>
            <span className="ia-menu-sp">{d.special.name}{tag(d.special.tags)}</span>
            <span className="ia-menu-so">{d.soup}</span>
          </div>
        ))}
      </div>
      <div className="ia-menu-foot">{a.brand} · GF gluten free · VG vegetarian · DF dairy free</div>
    </div>
  );
}
