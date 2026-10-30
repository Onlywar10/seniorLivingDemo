import { cats, seatsLeft, type CalEvent } from "@/data/shared";
import { getT } from "@/i18n/server";
import { fmtRange, fromIso, dayShort, iso, today } from "@/lib/clock";

/** A compact, day-by-day list of events, used for Harbor, fitness and trips. */
export async function WeekEvents({ days, showSeats = false, empty = "Nothing scheduled." }: { days: { date: string; events: CalEvent[] }[]; showSeats?: boolean; empty?: string }) {
  const { t } = await getT();
  const td = iso(today());
  const withEvents = days.filter((d) => d.events.length);
  if (!withEvents.length) return <p className="muted">{t(empty)}</p>;
  return (
    <div className="br-week">
      {withEvents.map((d) => (
        <div className="br-week-day" key={d.date}>
          <h3 className="br-week-date">
            <span>{t(d.date === td ? "Today" : dayShort(fromIso(d.date)).split(",")[0])}</span>
            <b>{t(dayShort(fromIso(d.date)).split(", ")[1])}</b>
          </h3>
          <ul>
            {d.events.map((e) => (
              <li key={e.id} style={{ ["--cc" as string]: cats[e.cat].color }}>
                <time>{t(fmtRange(e.start, e.end))}</time>
                <div>
                  <p className="br-week-title">{t(e.title)}</p>
                  <p className="br-week-room">
                    {t(e.room)}
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

export async function Seats({ e }: { e: CalEvent }) {
  const { t } = await getT();
  const left = seatsLeft(e) ?? 0;
  if (left === 0) return <span className="pill pill-brick br-seats">{t(`Full · ${e.waitlist ?? 1} on waitlist`)}</span>;
  if (left <= 3) return <span className="pill pill-terra br-seats">{t(left === 1 ? "1 seat left" : `${left} seats left`)}</span>;
  return <span className="pill br-seats">{t(`${left} seats left`)}</span>;
}
