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

/** The four things families can get (the same four as on /phones). */
const topics = [
  { key: "news", label: "Community news", note: "A highlight by text midweek, the whole week by email on Sunday" },
  { key: "week", label: "Your resident’s week", note: "Photos they’re in and outings they’re booked on, if they choose to share" },
  { key: "alerts", label: "Alerts", note: "Weather, closures, and changes to events you’re coming to" },
  { key: "invites", label: "Invitations to family events", note: "Reply to the text to RSVP" },
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
  const [picked, setPicked] = useState<string[]>(["news", "alerts", "week", "invites"]);
  const [resident, setResident] = useState("");
  const [sms, setSms] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<null | { name: string; resident: boolean }>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);
  const wantsText = channel !== "email";
  // Anything beyond community news is about one resident, so their name is needed for it.
  const needsResident = picked.some((k) => k !== "news");
  const resRef = useRef<HTMLInputElement>(null);

  const toggle = (k: string) => setPicked((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (picked.length === 0) return setErr("Choose at least one thing you’d like to receive.");
    if (needsResident && !resident.trim()) {
      resRef.current?.focus();
      return setErr("Please enter your resident’s name. It’s needed for anything beyond community news.");
    }
    if (wantsText && !sms) return setErr("To receive texts, please check the box to agree to text messages — or choose email instead.");
    const f = new FormData(e.currentTarget);
    setErr("");
    // Only the first name is shown back. The resident's name goes to the team and is never displayed on the website.
    setDone({ name: String(f.get("name") ?? ""), resident: !!String(f.get("resident") ?? "").trim() });
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
            {t("A welcome message is on its way, and community news starts this week.")}{" "}
            {t("You’ll receive: ")}
            {received}.
          </p>
          <p className="muted">
            {done.resident
              ? t("Our team will check with your resident before anything personal is shared. Once they agree, their week joins your Sunday email.")
              : t("You didn’t give a resident’s name, so you’ll get community news only. Call the front desk any time to add it.")}
          </p>
          <p className="small muted">
            {wantsText ? t("Reply STOP at any time to stop texts, or HELP for help. ") : ""}
            {t("To change your choices, call the front desk or sign up again with the same details.")}
          </p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDone(null)}>
            {t("Change my choices")}
          </button>
        </div>
        <figure className="sc-phone" aria-label="Preview of your first message" data-no-translate>
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
          <div className="field full">
            <label htmlFor="sc-res">{needsResident ? t("Resident’s name") : t("Resident’s name (optional)")}</label>
            <input ref={resRef} id="sc-res" name="resident" value={resident} onChange={(e) => setResident(e.target.value)} required={needsResident} aria-required={needsResident} aria-describedby="sc-res-note" />
            <small id="sc-res-note" className="sc-field-note">
              {needsResident
                ? t("Needed for anything beyond community news. Our team checks with your resident before anything personal is shared. It’s never shown on the website.")
                : t("With it, our team checks with your resident before anything personal is shared. Without it, you get community news only. It’s never shown on the website.")}
            </small>
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
