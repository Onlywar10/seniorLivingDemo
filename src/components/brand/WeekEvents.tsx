import { cats, seatsLeft, type CalEvent } from "@/data/calendar";
import { fmtRange, fromIso, dayShort, iso, today } from "@/lib/clock";

/** A compact, day-by-day list of events, used for Harbor, fitness and trips. */
export function WeekEvents({ days, showSeats = false, empty = "Nothing scheduled." }: { days: { date: string; events: CalEvent[] }[]; showSeats?: boolean; empty?: string }) {
  const t = iso(today());
  const withEvents = days.filter((d) => d.events.length);
  if (!withEvents.length) return <p className="muted">{empty}</p>;
  return (
    <div className="br-week">
      {withEvents.map((d) => (
        <div className="br-week-day" key={d.date}>
          <h3 className="br-week-date">
            <span>{d.date === t ? "Today" : dayShort(fromIso(d.date)).split(",")[0]}</span>
            <b>{dayShort(fromIso(d.date)).split(", ")[1]}</b>
          </h3>
          <ul>
            {d.events.map((e) => (
              <li key={e.id} style={{ ["--cc" as string]: cats[e.cat].color }}>
                <time>{fmtRange(e.start, e.end)}</time>
                <div>
                  <p className="br-week-title">{e.title}</p>
                  <p className="br-week-room">
                    {e.room}
                    {e.leader ? <span data-no-translate> · {e.leader}</span> : null}
                  </p>
                </div>
                {showSeats && e.cap ? <Seats e={e} /> : null}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function Seats({ e }: { e: CalEvent }) {
  const left = seatsLeft(e) ?? 0;
  if (left === 0) return <span className="pill pill-brick br-seats">{`Full · ${e.waitlist ?? 1} on waitlist`}</span>;
  if (left <= 3) return <span className="pill pill-terra br-seats">{left === 1 ? "1 seat left" : `${left} seats left`}</span>;
  return <span className="pill br-seats">{`${left} seats left`}</span>;
}
