import Image from "next/image";
import { categories, dietLabels, type Event, type Meal, type Photo, type Staff } from "@/data/community";
import { Icon } from "./Icon";

export function EventList({ events }: { events: Event[] }) {
  return (
    <ul className="events">
      {events.map((e) => (
        <li key={e.time + e.name}>
          <time>{e.time}</time>
          <div>
            <span className="nm">
              <i className={`cat c-${e.cat}`} aria-hidden="true" />
              <span className="vh">{categories[e.cat]}: </span>
              {e.name}
            </span>
            {e.note ? (
              <span className="note">{e.note}</span>
            ) : (
              <span className="rm">
                <Icon name="pin" /> {e.room}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Legend() {
  return (
    <div className="legend" aria-label="Activity categories">
      {(Object.keys(categories) as (keyof typeof categories)[]).map((k) => (
        <span key={k}>
          <i className={`cat c-${k}`} aria-hidden="true" />
          {categories[k]}
        </span>
      ))}
    </div>
  );
}

export function MealCard({ meal }: { meal: Meal }) {
  return (
    <div className="meal">
      <h4>
        {meal.name} <span>{meal.hours}</span>
      </h4>
      <ul>
        {meal.items.map((it) => (
          <li key={it.name}>
            <span>{it.name}</span>
            {it.diet && (
              <span className="diet">
                {it.diet.map((d) => (
                  <abbr key={d} title={dietLabels[d]}>
                    {d}
                  </abbr>
                ))}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DietKey() {
  return (
    <span>
      <b>V</b> vegetarian · <b>GF</b> gluten free · <b>SF</b> sugar-free option · <b>Soft</b> mechanical-soft available. Puréed and thickened-liquid versions of every item on request.
    </span>
  );
}

export function PhotoCard({ p, priority = false }: { p: Photo; priority?: boolean }) {
  return (
    <figure className="photo">
      <div className="ph">
        <Image src={p.src} alt={p.alt} fill sizes="(max-width: 520px) 100vw, (max-width: 1000px) 50vw, 25vw" priority={priority} />
      </div>
      <figcaption>
        <b>{p.caption}</b>
        <span className="meta">
          {p.date} · {p.meta}
        </span>
      </figcaption>
    </figure>
  );
}

export function StaffCard({ s }: { s: Staff }) {
  return (
    <li>
      <span className="staff-photo">
        <Image src={s.photo} alt={`${s.name}, ${s.role}`} fill sizes="88px" />
      </span>
      <div>
        <span className="nm">{s.name}</span>
        <span className="role">{s.role}</span>
        <span className="cred">
          {s.cred} · {s.years} years at Larkmoor
        </span>
        <span className="call">
          <b>Call me about:</b> {s.call}. Ext. {s.ext}
        </span>
      </div>
    </li>
  );
}
