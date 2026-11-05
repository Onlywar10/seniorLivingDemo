"use client";

// The website chat for the Wrenhaven parent home page, with canned answers. It opens with a default question already asked and
// answered, so visitors see what the chat does without opening it. Other questions get canned answers from the
// parent site's own facts; the live chat (with menus and events) runs on each community's site.
import { useEffect, useId, useRef, useState } from "react";
import { useT } from "@/i18n/client";
import { Icon } from "@/components/Icon";
import "@/components/chat/chat.css";

export interface ChatCommunity { name: string; city: string; independent: string; assisted: string; lantern: string; home: string; plans: string }
type Lang = "en" | "es" | "zh";
type Key = "cost" | "which" | "couples" | "care" | "lantern" | "other";
interface Reply { text: string; lines?: { text: string; note?: string }[]; after?: string; links?: { label: string; href: string; ready?: true }[] }
type Msg = { id: number; who: "me"; text: string } | { id: number; who: "us"; r: Reply } | { id: number; who: "typing" };

const QUESTIONS: Record<Lang, Record<Exclude<Key, "other">, string>> = {
  en: { cost: "How much does it cost?", which: "Which community is right for me?", couples: "Is there a second-person fee?", care: "Can I add care later?", lantern: "Tell me about Lantern" },
  es: { cost: "¿Cuánto cuesta?", which: "¿Qué comunidad es para mí?", couples: "¿Hay cargo por segunda persona?", care: "¿Puedo añadir cuidado más adelante?", lantern: "Hábleme de Lantern" },
  zh: { cost: "费用是多少？", which: "哪个社区适合我？", couples: "第二人需要付费吗？", care: "以后可以增加护理服务吗？", lantern: "介绍一下 Lantern" },
};

const UI: Record<Lang, Record<"title" | "sub" | "badge" | "label" | "ph" | "send" | "typing" | "you" | "suggested", string>> = {
  en: { title: "Wrenhaven Senior Living", sub: "Online now · answers from our website", badge: "Online", label: "Your question", ph: "Ask a question…", send: "Send", typing: "Writing an answer", you: "You: ", suggested: "Suggested questions" },
  es: { title: "Wrenhaven Senior Living", sub: "En línea · respuestas de nuestro sitio web", badge: "En línea", label: "Su pregunta", ph: "Escriba su pregunta…", send: "Enviar", typing: "Escribiendo una respuesta", you: "Usted: ", suggested: "Preguntas sugeridas" },
  zh: { title: "Wrenhaven Senior Living", sub: "在线 · 回答来自我们的网站", badge: "在线", label: "您的问题", ph: "请输入您的问题…", send: "发送", typing: "正在撰写回答", you: "您：", suggested: "推荐问题" },
};

function reply(k: Key, l: Lang, cs: ChatCommunity[]): Reply {
  const pick = (en: string, es: string, zh: string) => (l === "es" ? es : l === "zh" ? zh : en);
  const plans = cs.map((c) => ({ label: pick(`${c.name} floor plans`, `Planos de ${c.name}`, `${c.name} 户型与价格`), href: c.plans, ready: true as const }));
  const homes = cs.map((c) => ({ label: pick(`Visit ${c.name}`, `Visitar ${c.name}`, `访问 ${c.name}`), href: c.home, ready: true as const }));
  switch (k) {
    case "cost":
      return {
        text: pick(
          "Monthly rent depends on the community and the apartment. Here is where each one starts:",
          "La renta mensual depende de la comunidad y del apartamento. Estos son los precios iniciales:",
          "月租取决于社区和户型。各社区起价如下："
        ),
        lines: cs.map((c) => ({
          text: `${c.name} · ${c.city}`,
          note: pick(
            `Independent Living from ${c.independent}/mo · Lantern Memory Care from ${c.lantern}/mo · Assisted Living Services ${c.assisted}/mo base, plus care plan`,
            `Vida Independiente desde ${c.independent}/mes · Lantern desde ${c.lantern}/mes · Servicios de Vida Asistida ${c.assisted}/mes de base, más plan de cuidado`,
            `独立生活 ${c.independent}/月起 · Lantern 记忆护理 ${c.lantern}/月起 · 协助生活服务基础费 ${c.assisted}/月，另加护理计划费用`
          ),
        })),
        after: pick(
          "Meals, housekeeping, transportation and the full activity calendar are included, and there is no second-person fee.",
          "Las comidas, la limpieza, el transporte y todo el calendario de actividades están incluidos, y no hay cargo por segunda persona.",
          "餐饮、客房清洁、交通和全部活动日程均已包含，且第二人不另收费。"
        ),
        links: plans,
      };
    case "which":
      return {
        text: pick(
          "Both communities offer Independent Living, Assisted Living Services and Lantern Memory Care. Most people choose by location:",
          "Las dos comunidades ofrecen Vida Independiente, Servicios de Vida Asistida y Lantern. La mayoría elige por la ubicación:",
          "两个社区都提供独立生活、协助生活服务和 Lantern 记忆护理。大多数人按位置选择："
        ),
        lines: cs.map((c) => ({ text: c.name, note: `${c.city}, CA` })),
        after: pick("A tour is the best way to decide; lunch is on us.", "Una visita es la mejor manera de decidir; el almuerzo corre por nuestra cuenta.", "参观是做决定的最好方式，午餐由我们招待。"),
        links: homes,
      };
    case "couples":
      return {
        text: pick(
          "No. A second resident in the same apartment pays nothing extra, which leaves couples about $12,000 a year better off.",
          "No. Un segundo residente en el mismo apartamento no paga nada extra, así que las parejas ahorran unos $12,000 al año.",
          "不需要。同住一套公寓的第二位居民无需额外付费，夫妻每年约可节省 $12,000。"
        ),
        links: plans,
      };
    case "care":
      return {
        text: pick(
          "Yes. Assisted Living Services can be added in any apartment, so you never have to move to receive them. Medication management, personal care and escorts to meals come to your door.",
          "Sí. Los Servicios de Vida Asistida se pueden añadir en cualquier apartamento, así que nunca tendrá que mudarse para recibirlos.",
          "可以。协助生活服务可以在任何公寓中添加，您无需搬家即可获得服务，如用药管理、个人护理和陪同用餐等。"
        ),
        links: [{ label: pick("About Assisted Living Services", "Servicios de Vida Asistida", "协助生活服务"), href: "/living/assisted-living" }],
      };
    case "lantern":
      return {
        text: pick(
          "Lantern is a calm, secure memory care neighborhood inside each community, with its own garden courtyard, activity team and Events & Adventures calendar.",
          "Lantern es un vecindario tranquilo y seguro de cuidado de la memoria dentro de cada comunidad, con su propio jardín, equipo de actividades y calendario.",
          "Lantern 是每个社区内安静、安全的记忆护理街区，拥有自己的花园庭院、活动团队和活动日历。"
        ),
        lines: cs.map((c) => ({ text: c.name, note: pick(`from ${c.lantern}/mo`, `desde ${c.lantern}/mes`, `${c.lantern}/月起`) })),
        links: [{ label: pick("Discover Lantern Memory Care", "Conozca Lantern", "了解 Lantern 记忆护理"), href: "/living/lantern-memory-care" }],
      };
    default:
      return {
        text: pick(
          "Good question. For tonight’s menu, today’s activities and upcoming events, each community’s own website has the answer, and its chat can tell you more.",
          "Buena pregunta. El sitio web de cada comunidad tiene el menú de esta noche, las actividades de hoy y los próximos eventos, y su chat puede contarle más.",
          "好问题。每个社区自己的网站上都有今晚的菜单、今天的活动和近期活动安排，那里的在线对话还能为您详细解答。"
        ),
        links: homes,
      };
  }
}

/** Which canned answer a typed question gets. */
function match(q: string): Key {
  const s = q.toLowerCase();
  if (/cost|price|rent|how much|cuanto|cuánto|precio|费用|价格|多少钱/.test(s)) return "cost";
  if (/second|couple|spouse|segunda|pareja|第二|夫妻/.test(s)) return "couples";
  if (/lantern|memory|dementia|memoria|demencia|记忆|失智/.test(s)) return "lantern";
  if (/care|assist|help|cuidado|asistid|护理|协助/.test(s)) return "care";
  if (/which|where|location|community|cual|cuál|donde|dónde|comunidad|哪|社区/.test(s)) return "which";
  return "other";
}

let seq = 0;

export function ExampleChat({ communities }: { communities: ChatCommunity[] }) {
  const { lang, href } = useT();
  const L = lang as Lang;
  const t = UI[L];
  const titleId = useId();
  const list = useRef<HTMLOListElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [q, setQ] = useState("");
  const [asked, setAsked] = useState<Key[]>(["cost"]);
  const [extra, setExtra] = useState<Msg[]>([]);

  // The default exchange, rebuilt in the page's language.
  const greeting: Reply = {
    text: L === "es"
      ? "¡Hola! Pregúntenos lo que quiera sobre Wrenhaven y nuestras comunidades."
      : L === "zh"
        ? "您好！关于 Wrenhaven 及我们社区的任何问题都欢迎问我们。"
        : "Hello! Ask us anything about Wrenhaven and our communities.",
  };
  const msgs: Msg[] = [
    { id: -3, who: "us", r: greeting },
    { id: -2, who: "me", text: QUESTIONS[L].cost },
    { id: -1, who: "us", r: reply("cost", L, communities) },
    ...extra,
  ];

  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    if (!extra.length) return;
    const el = list.current;
    el?.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [extra]);

  const ask = (text: string, key?: Key) => {
    const s = text.trim();
    if (!s) return;
    const k = key ?? match(s);
    setQ("");
    setAsked((a) => (a.includes(k) ? a : [...a, k]));
    setExtra((m) => [...m.filter((x) => x.who !== "typing"), { id: ++seq, who: "me", text: s }, { id: ++seq, who: "typing" }]);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setExtra((m) => [...m.filter((x) => x.who !== "typing"), { id: ++seq, who: "us", r: reply(k, L, communities) }]);
    }, 700 + Math.min(700, s.length * 12));
  };

  const typing = extra.some((m) => m.who === "typing");
  const chips = (Object.keys(QUESTIONS[L]) as Exclude<Key, "other">[]).filter((k) => !asked.includes(k));

  return (
    <section className="chat chat-inline" aria-labelledby={titleId}>
      <header className="chat-head">
        <span className="chat-avatar">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/brand/dots.png" alt="" width={34} height={34} />
          <i className="chat-online" />
        </span>
        <div className="chat-head-text">
          <h2 id={titleId} data-no-translate>
            {t.title}
          </h2>
          <p>{t.sub}</p>
        </div>
        <span className="chat-badge">{t.badge}</span>
      </header>

      <ol className="chat-list" ref={list} aria-live="polite" aria-relevant="additions">
        {msgs.map((m) =>
          m.who === "me" ? (
            <li key={m.id} className="chat-me" data-no-translate>
              <span className="vh">{t.you}</span>
              {m.text}
            </li>
          ) : m.who === "typing" ? (
            <li key={m.id} className="chat-us chat-typing" aria-label={t.typing}>
              <i />
              <i />
              <i />
            </li>
          ) : (
            <li key={m.id} className="chat-us" data-no-translate>
              <p>{m.r.text}</p>
              {m.r.lines && (
                <div className="chat-group">
                  <ul>
                    {m.r.lines.map((ln) => (
                      <li key={ln.text}>
                        <span className="chat-line">
                          <b>{ln.text}</b>
                          {ln.note && <small>{ln.note}</small>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {m.r.after && <p className="chat-after">{m.r.after}</p>}
              {m.r.links && (
                <div className="chat-links">
                  {m.r.links.map((a) => (
                    <a key={a.href} className="chat-src" href={a.ready ? a.href : href(a.href)}>
                      <Icon name="arrow" /> {a.label}
                    </a>
                  ))}
                </div>
              )}
            </li>
          )
        )}
      </ol>

      {chips.length > 0 && !typing && (
        <div className="chat-chips" role="group" aria-label={t.suggested}>
          {chips.map((k) => (
            <button key={k} type="button" onClick={() => ask(QUESTIONS[L][k], k)}>
              {QUESTIONS[L][k]}
            </button>
          ))}
        </div>
      )}

      <form
        className="chat-form"
        onSubmit={(e) => {
          e.preventDefault();
          ask(q);
        }}
      >
        <label className="vh" htmlFor={`${titleId}-q`}>
          {t.label}
        </label>
        <input id={`${titleId}-q`} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.ph} autoComplete="off" enterKeyHint="send" maxLength={300} />
        <button type="submit" className="chat-send" aria-label={t.send} disabled={!q.trim()}>
          <Icon name="send" />
        </button>
      </form>
    </section>
  );
}
