import { cats, type CalEvent } from "@/data/shared";
import { getT } from "@/i18n/server";
import { fmtRange, fromIso, dayShort, iso, today } from "@/lib/clock";

/** A compact, day-by-day list of events, used for Lantern, fitness and trips. */
export async function WeekEvents({ days, empty = "Nothing scheduled." }: { days: { date: string; events: CalEvent[] }[]; empty?: string }) {
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
                  {(e.room || e.leader) && (
                    <p className="br-week-room">
                      {e.room && t(e.room)}
                      {e.leader ? <span data-no-translate>{e.room ? " · " : ""}{e.leader}</span> : null}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
