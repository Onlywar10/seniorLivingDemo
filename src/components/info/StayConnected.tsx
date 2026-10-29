"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { SmsConsent } from "./bits";

export interface PreviewItem { wd: number; md: string; time: string; title: string }

const langs = [
  { key: "en", label: "English", hello: "Hi", week: "This week at Prairie City Landing" },
  { key: "es", label: "Español", hello: "¡Hola", week: "Esta semana en Prairie City Landing" },
  { key: "zh", label: "中文", hello: "您好", week: "This week at Prairie City Landing" },
  { key: "tl", label: "Tagalog", hello: "Kumusta", week: "This week at Prairie City Landing" },
  { key: "vi", label: "Tiếng Việt", hello: "Xin chào", week: "This week at Prairie City Landing" },
  { key: "ru", label: "Русский", hello: "Здравствуйте", week: "This week at Prairie City Landing" },
] as const;
type LangKey = (typeof langs)[number]["key"];

const topics = [
  { key: "calendar", label: "Weekly calendar digest", note: "Sunday mornings: the week’s trips, music and special events" },
  { key: "menu", label: "Daily menu", note: "Lunch and dinner specials, each morning at 9:00 am" },
  { key: "photos", label: "Photos & news", note: "New albums and stories, about twice a month" },
  { key: "harbor", label: "Harbor updates", note: "Harbor’s weekly outing and family events" },
  { key: "urgent", label: "Urgent notices only", note: "Weather, closures and anything time-sensitive" },
];

const relationships = ["Daughter", "Son", "Spouse or partner", "Grandchild", "Sibling", "Other family", "Friend", "Resident (myself)", "Care professional"];

const WD_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WD_ES = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

const esTitles: Record<string, string> = {
  "Halloween Happy Hour: Costumes Encouraged": "Happy hour de Halloween: ¡vengan disfrazados!",
  "Trick-or-Treat Hallway for Grandkids": "Pasillo de dulces para los nietos",
  "Pumpkin Carving in the Courtyard": "Tallado de calabazas en el patio",
  "Harbor Pumpkin Painting": "Pintura de calabazas en Harbor",
  "Live Music with Antonio on Violin": "Música en vivo: Antonio al violín",
  "Día de los Muertos Commemoration": "Conmemoración del Día de los Muertos",
  "Conversations with Chef": "Conversaciones con el chef",
  "Happy Hour with Live Music": "Happy hour con música en vivo",
  "Shopping Trip": "Salida de compras",
  "Saturday Bus Trip": "Excursión del sábado",
  "Bus Trip: Nature Walk with Jason": "Caminata por la naturaleza con Jason",
  "Fall Arts & Crafts with Creative Connections": "Manualidades de otoño con Creative Connections",
  "Monthly Events & Adventures Staff & Resident Meeting": "Reunión mensual de Events & Adventures",
  "Donuts, Muffins & Coffee": "Donas, muffins y café",
  "Roasted Marshmallows & Camp Stories": "Malvaviscos asados e historias de campamento",
  "Veterans’ Lunch": "Almuerzo para veteranos",
  "Veterans’ & Families Only Ceremony": "Ceremonia para veteranos y sus familias",
  "Activity Meeting": "Reunión de actividades",
  "Town Hall with the Executive Director": "Reunión abierta con la directora ejecutiva",
  "Quarter Bingo": "Bingo",
  "Prize Bingo": "Bingo con premios",
  "Book Club": "Club de lectura",
  "Dessert Soirée": "Velada de postres",
};

function toSpanish(t: string) {
  if (esTitles[t]) return esTitles[t];
  const rules: [RegExp, string][] = [
    [/^Bus Trip: (.*)$/, "Excursión: $1"],
    [/^Shopping: (.*)$/, "Compras: $1"],
    [/^Happy Hour: (.*)$/, "Happy hour: $1"],
    [/^Happy Hour with (.*)$/, "Happy hour con $1"],
    [/^Dinner Trip: (.*)$/, "Cena fuera: $1"],
    [/^Lunch Trip with Harbor: (.*)$/, "Almuerzo fuera con Harbor: $1"],
    [/^Speaker Series: (.*)$/, "Ciclo de charlas: $1"],
    [/^Veterans Day: Bus Trip to the Veterans Day Parade$/, "Día de los Veteranos: autobús al desfile"],
    [/^Music with (.*)$/, "Música con $1"],
    [/^Armchair Travel: (.*)$/, "Viajes desde el sillón: $1"],
  ];
  for (const [re, out] of rules) if (re.test(t)) return t.replace(re, out);
  return t;
}

export function StayConnectedForm({ preview }: { preview: PreviewItem[] }) {
  const [lang, setLang] = useState<LangKey>("en");
  const [channel, setChannel] = useState<"text" | "email" | "both">("text");
  const [picked, setPicked] = useState<string[]>(["calendar", "photos"]);
  const [sms, setSms] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<null | { name: string; resident: string; phone: string; email: string }>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);
  const wantsText = channel !== "email";

  const toggle = (k: string) => {
    setPicked((p) => {
      if (k === "urgent") return p.includes("urgent") ? [] : ["urgent"];
      const base = p.filter((x) => x !== "urgent");
      return base.includes(k) ? base.filter((x) => x !== k) : [...base, k];
    });
  };

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (picked.length === 0) return setErr("Choose at least one thing you’d like to receive.");
    if (wantsText && !sms) return setErr("To receive texts, please check the box to agree to text messages — or choose email instead.");
    const f = new FormData(e.currentTarget);
    setErr("");
    setDone({ name: String(f.get("name") ?? ""), resident: String(f.get("resident") ?? ""), phone: String(f.get("phone") ?? ""), email: String(f.get("email") ?? "") });
    requestAnimationFrame(() => {
      doneRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      doneRef.current?.focus({ preventScroll: true });
    });
  }

  const L = langs.find((l) => l.key === lang)!;

  if (done) {
    const first = done.name.split(" ")[0] || "";
    const es = lang === "es";
    const items = preview.map((p) => ({
      day: es ? `${WD_ES[p.wd]} ${p.md}` : `${WD_EN[p.wd]} ${p.md}`,
      time: p.time,
      title: es ? toSpanish(p.title) : p.title,
    }));
    return (
      <div className="sc-done">
        <div className="sc-done-copy">
          <span className="sc-done-badge">
            <Icon name="check" />
          </span>
          <h2 ref={doneRef} tabIndex={-1}>
            You’re signed up{first ? <>, <span data-no-translate>{first}</span></> : null}.
          </h2>
          <p className="muted">
            {wantsText
              ? `Your first weekly text arrives Sunday morning${channel === "both" ? ", with the email version in your inbox" : ""}.`
              : "Your first weekly email arrives Sunday morning."}{" "}
            You’ll receive: {picked.map((k) => topics.find((t) => t.key === k)!.label.toLowerCase()).join(", ")}.
          </p>
          <p className="small muted">
            {wantsText ? "Reply STOP at any time to stop texts, or HELP for help. " : ""}To change your choices, call the front desk or sign up again with the
            same details.
          </p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDone(null)}>
            Change my choices
          </button>
        </div>
        <figure className="sc-phone" aria-label="Preview of your first weekly message" data-no-translate>
          <div className="sc-phone-top">
            <span className="sc-phone-av">PCL</span>
            <b>Prairie City Landing</b>
            <small>{wantsText ? "Text message" : "Email"}</small>
          </div>
          <div className="sc-bubble">
            <p>
              {L.hello}
              {first ? ` ${first}` : ""}
              {lang === "es" || lang === "en" ? "!" : ","} {es ? "Esto es lo que viene esta semana en Prairie City Landing:" : `${L.week}:`}
            </p>
            <ul>
              {items.map((i) => (
                <li key={i.day + i.time + i.title}>
                  <b>
                    {i.day}, {i.time}
                  </b>{" "}
                  {i.title}
                </li>
              ))}
            </ul>
            <p>{es ? "Calendario completo: prairiecitylanding.com/calendar" : "Full calendar: prairiecitylanding.com/calendar"}</p>
            {wantsText && <p className="sc-stop">{es ? "Responda STOP para cancelar, HELP para ayuda." : "Reply STOP to opt out, HELP for help."}</p>}
          </div>
          <figcaption className="small muted">Built from this week’s calendar.</figcaption>
        </figure>
      </div>
    );
  }

  return (
    <form className="sc-form" onSubmit={submit}>
      <fieldset className="sc-block">
        <legend>Your language</legend>
        <div className="sc-langs">
          {langs.map((l) => (
            <label key={l.key} className={`sc-lang ${lang === l.key ? "on" : ""}`} data-no-translate>
              <input type="radio" name="lang" value={l.key} checked={lang === l.key} onChange={() => setLang(l.key)} />
              <span lang={l.key}>{l.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="sc-block">
        <legend>How should we send it?</legend>
        <div className="sc-channels">
          {(
            [
              ["text", "By text", "sms"],
              ["email", "By email", "mail"],
              ["both", "Both", "send"],
            ] as const
          ).map(([k, label, icon]) => (
            <label key={k} className={`sc-chan ${channel === k ? "on" : ""}`}>
              <input type="radio" name="channel" value={k} checked={channel === k} onChange={() => setChannel(k)} />
              <Icon name={icon} /> {label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="sc-block">
        <legend>What would you like?</legend>
        <div className="sc-topics">
          {topics.map((t) => (
            <label key={t.key} className={`sc-topic ${picked.includes(t.key) ? "on" : ""}`}>
              <input type="checkbox" checked={picked.includes(t.key)} onChange={() => toggle(t.key)} />
              <span>
                <b>{t.label}</b>
                <small>{t.note}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="sc-block">
        <legend>About you</legend>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="sc-name">Your name</label>
            <input id="sc-name" name="name" autoComplete="name" required />
          </div>
          <div className="field">
            <label htmlFor="sc-rel">Relationship to resident</label>
            <select id="sc-rel" name="relationship" defaultValue="Daughter">
              {relationships.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
          {wantsText && (
            <div className="field">
              <label htmlFor="sc-phone">Mobile number</label>
              <input id="sc-phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" required />
            </div>
          )}
          {channel !== "text" && (
            <div className="field">
              <label htmlFor="sc-email">Email</label>
              <input id="sc-email" name="email" type="email" autoComplete="email" required />
            </div>
          )}
          <div className="field">
            <label htmlFor="sc-res">Resident’s name (optional)</label>
            <input id="sc-res" name="resident" />
          </div>
          <div className="field">
            <label htmlFor="sc-apt">Apartment (optional)</label>
            <input id="sc-apt" name="apartment" inputMode="numeric" />
          </div>
          {wantsText && (
            <div className="full">
              <SmsConsent id="sc-sms" purpose="community calendars, menus, photos, news and notices I have chosen" checked={sms} onChange={setSms} />
            </div>
          )}
        </div>
      </fieldset>

      {err && (
        <p className="tr-error" role="alert">
          <Icon name="alert" /> {err}
        </p>
      )}
      <button className="btn btn-lg" type="submit">
        Sign me up <Icon name="arrow" />
      </button>
    </form>
  );
}
