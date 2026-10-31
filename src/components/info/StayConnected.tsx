"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { useT } from "@/i18n/client";
import { useCommunity } from "@/lib/community";
import { SmsConsent } from "./bits";

export interface PreviewItem { wd: number; md: string; time: string; title: string }

/** `week(name)`: the digest's opening line, with the community name. */
const langs = [
  { key: "en", label: "English", hello: "Hi", week: (n: string) => `This week at ${n}` },
  { key: "es", label: "Español", hello: "¡Hola", week: (n: string) => `Esta semana en ${n}` },
  { key: "zh", label: "中文", hello: "您好", week: (n: string) => `本周 ${n} 活动预告` },
  { key: "tl", label: "Tagalog", hello: "Kumusta", week: (n: string) => `This week at ${n}` },
  { key: "vi", label: "Tiếng Việt", hello: "Xin chào", week: (n: string) => `This week at ${n}` },
  { key: "ru", label: "Русский", hello: "Здравствуйте", week: (n: string) => `This week at ${n}` },
] as const;
type LangKey = (typeof langs)[number]["key"];

const topics = [
  { key: "calendar", label: "Weekly calendar digest", note: "Sunday mornings: the week’s trips, music and special events" },
  { key: "menu", label: "Daily menu", note: "Lunch and dinner specials, each morning at 9:00 am" },
  { key: "photos", label: "Photos & news", note: "New albums and stories, about twice a month" },
  { key: "lantern", label: "Lantern updates", note: "Lantern’s weekly outing and family events" },
  { key: "urgent", label: "Urgent notices only", note: "Weather, closures and anything time-sensitive" },
];

const relationships = ["Daughter", "Son", "Spouse or partner", "Grandchild", "Sibling", "Other family", "Friend", "Resident (myself)", "Care professional"];

const WD_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WD_ES = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const WD_ZH = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

/** "9:00 am" → "上午9:00" for the Chinese digest preview. */
const zhClock = (s: string) =>
  s.replace(/(\d{1,2}):(\d{2}) (am|pm)/, (_, h: string, m: string, ap: string) => `${ap === "am" ? "上午" : +h === 12 ? "中午" : +h < 6 ? "下午" : "晚上"}${h}:${m}`);

const esTitles: Record<string, string> = {
  "Halloween Happy Hour: Costumes Encouraged": "Happy hour de Halloween: ¡vengan disfrazados!",
  "Trick-or-Treat Hallway for Grandkids": "Pasillo de dulces para los nietos",
  "Pumpkin Carving in the Courtyard": "Tallado de calabazas en el patio",
  "Lantern Pumpkin Painting": "Pintura de calabazas en Lantern",
  "Live Music with Lorenzo on Violin": "Música en vivo: Lorenzo al violín",
  "Día de los Muertos Commemoration": "Conmemoración del Día de los Muertos",
  "Conversations with Chef": "Conversaciones con el chef",
  "Happy Hour with Live Music": "Happy hour con música en vivo",
  "Shopping Trip": "Salida de compras",
  "Saturday Bus Trip": "Excursión del sábado",
  "Bus Trip: Nature Walk with Devin": "Caminata por la naturaleza con Devin",
  "Fall Arts & Crafts with the Calder Arts Collective": "Manualidades de otoño con el Calder Arts Collective",
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
    [/^Lunch Trip with Lantern: (.*)$/, "Almuerzo fuera con Lantern: $1"],
    [/^Speaker Series: (.*)$/, "Ciclo de charlas: $1"],
    [/^Veterans Day: Bus Trip to the Veterans Day Parade$/, "Día de los Veteranos: autobús al desfile"],
    [/^Music with (.*)$/, "Música con $1"],
    [/^Armchair Travel: (.*)$/, "Viajes desde el sillón: $1"],
  ];
  for (const [re, out] of rules) if (re.test(t)) return t.replace(re, out);
  return t;
}

export function StayConnectedForm({ preview }: { preview: PreviewItem[] }) {
  const { t, lang: pageLang } = useT();
  const { site } = useCommunity();
  const domain = site.email.split("@")[1];
  // The digest language starts as the page language; the visitor can pick any of the six.
  const [lang, setLang] = useState<LangKey>(pageLang);
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
    const zh = lang === "zh";
    const items = preview.map((p) => ({
      day: es ? `${WD_ES[p.wd]} ${p.md}` : zh ? `${WD_ZH[p.wd]} ${p.md}` : `${WD_EN[p.wd]} ${p.md}`,
      time: zh ? zhClock(p.time) : p.time,
      title: es ? toSpanish(p.title) : p.title,
    }));
    const received = picked
      .map((k) => {
        const label = topics.find((x) => x.key === k)!.label;
        return pageLang === "zh" ? t(label) : t(label.toLowerCase());
      })
      .join(pageLang === "zh" ? "、" : ", ");
    return (
      <div className="sc-done">
        <div className="sc-done-copy">
          <span className="sc-done-badge">
            <Icon name="check" />
          </span>
          <h2 ref={doneRef} tabIndex={-1}>
            {t("You’re signed up")}
            {first ? (
              <>
                , <span data-no-translate>{first}</span>
              </>
            ) : null}
            .
          </h2>
          <p className="muted">
            {wantsText
              ? t(`Your first weekly text arrives Sunday morning${channel === "both" ? ", with the email version in your inbox" : ""}.`)
              : t("Your first weekly email arrives Sunday morning.")}{" "}
            {t("You’ll receive: ")}
            {received}.
          </p>
          <p className="small muted">
            {wantsText ? t("Reply STOP at any time to stop texts, or HELP for help. ") : ""}
            {t("To change your choices, call the front desk or sign up again with the same details.")}
          </p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDone(null)}>
            {t("Change my choices")}
          </button>
        </div>
        <figure className="sc-phone" aria-label="Preview of your first weekly message" data-no-translate>
          <div className="sc-phone-top">
            <span className="sc-phone-av">{site.short}</span>
            <b>{site.name}</b>
            <small>{wantsText ? "Text message" : "Email"}</small>
          </div>
          <div className="sc-bubble">
            <p>
              {L.hello}
              {first ? ` ${first}` : ""}
              {zh ? `，${L.week(site.name)}：` : <>{lang === "es" || lang === "en" ? "!" : ","} {es ? `Esto es lo que viene esta semana en ${site.name}:` : `${L.week(site.name)}:`}</>}
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
            <p>{es ? `Calendario completo: ${domain}/calendar` : zh ? `完整日历：${domain}/calendar` : `Full calendar: ${domain}/calendar`}</p>
            {wantsText && <p className="sc-stop">{es ? "Responda STOP para cancelar, HELP para ayuda." : zh ? "回复 STOP 退订，回复 HELP 获取帮助。" : "Reply STOP to opt out, HELP for help."}</p>}
          </div>
          <figcaption className="small muted">Built from this week’s calendar.</figcaption>
        </figure>
      </div>
    );
  }

  return (
    <form className="sc-form" onSubmit={submit}>
      <fieldset className="sc-block">
        <legend>{t("Your language")}</legend>
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
        <legend>{t("How should we send it?")}</legend>
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
              <Icon name={icon} /> {t(label)}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="sc-block">
        <legend>{t("What would you like?")}</legend>
        <div className="sc-topics">
          {topics.map((x) => (
            <label key={x.key} className={`sc-topic ${picked.includes(x.key) ? "on" : ""}`}>
              <input type="checkbox" checked={picked.includes(x.key)} onChange={() => toggle(x.key)} />
              <span>
                <b>{t(x.label)}</b>
                <small>{t(x.note)}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="sc-block">
        <legend>{t("About you")}</legend>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="sc-name">{t("Your name")}</label>
            <input id="sc-name" name="name" autoComplete="name" required />
          </div>
          <div className="field">
            <label htmlFor="sc-rel">{t("Relationship to resident")}</label>
            <select id="sc-rel" name="relationship" defaultValue="Daughter">
              {relationships.map((r) => (
                <option key={r} value={r}>
                  {t(r)}
                </option>
              ))}
            </select>
          </div>
          {wantsText && (
            <div className="field">
              <label htmlFor="sc-phone">{t("Mobile number")}</label>
              <input id="sc-phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" required />
            </div>
          )}
          {channel !== "text" && (
            <div className="field">
              <label htmlFor="sc-email">{t("Email")}</label>
              <input id="sc-email" name="email" type="email" autoComplete="email" required />
            </div>
          )}
          <div className="field">
            <label htmlFor="sc-res">{t("Resident’s name (optional)")}</label>
            <input id="sc-res" name="resident" />
          </div>
          <div className="field">
            <label htmlFor="sc-apt">{t("Apartment (optional)")}</label>
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
          <Icon name="alert" /> {t(err)}
        </p>
      )}
      <button className="btn btn-lg" type="submit">
        {t("Sign me up")} <Icon name="arrow" />
      </button>
    </form>
  );
}
