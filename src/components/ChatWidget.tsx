"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { site } from "@/data/site";
import { usePrefs } from "@/lib/prefs";
import { Icon } from "./Icon";
import { answer, hello, starters, officeOpen, looksSpanish, type Answer, type Lang } from "./chat/answers";
import "./chat/chat.css";

type Msg = { id: number; who: "me"; text: string } | { id: number; who: "us"; a: Answer } | { id: number; who: "typing" };

const UI = {
  en: { launch: "Ask us anything", close: "Close chat", sub: "Answers from our website", call: `or call ${site.phone}`, label: "Your question", ph: "Ask a question…", send: "Send", typing: "Writing an answer", online: "Online now" },
  es: { launch: "Pregúntenos", close: "Cerrar el chat", sub: "Respuestas de nuestro sitio web", call: `o llame al ${site.phone}`, label: "Su pregunta", ph: "Escriba su pregunta…", send: "Enviar", typing: "Escribiendo una respuesta", online: "En línea" },
};

let seq = 0;

/** Website chat, on every public page. Answers come from the community's own published content. */
export function ChatWidget() {
  const { lang } = usePrefs();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const [lift, setLift] = useState(0);
  const list = useRef<HTMLOListElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const fab = useRef<HTMLButtonElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const titleId = useId();
  const L: Lang = lang === "es" ? "es" : "en";
  const t = UI[L];

  // The greeting is built only when the panel first opens (it depends on the time of day).
  useEffect(() => {
    if (!open) return;
    if (msgs.length === 0) setMsgs([{ id: ++seq, who: "us", a: hello(L) }]);
    requestAnimationFrame(() => input.current?.focus());
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the launcher clear of the cookie banner where they would overlap (phones).
  useEffect(() => {
    const measure = () => {
      const c = document.querySelector<HTMLElement>(".cookie");
      if (!c) return setLift(0);
      const r = c.getBoundingClientRect();
      setLift(r.right > window.innerWidth - 240 ? Math.max(0, Math.round(window.innerHeight - r.top)) : 0);
    };
    measure();
    const mo = new MutationObserver(measure);
    mo.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", measure);
    return () => {
      mo.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Answers are read from the top: bring the question that prompted them to the top of the list.
  useEffect(() => {
    const el = list.current;
    const last = el?.lastElementChild as HTMLElement | null | undefined;
    if (!el || !last) return;
    const prev = last.previousElementSibling as HTMLElement | null;
    const top = last.classList.contains("chat-us") && !last.classList.contains("chat-typing") && prev?.classList.contains("chat-me") ? prev.offsetTop - 12 : el.scrollHeight;
    el.scrollTo({ top, behavior: "smooth" });
  }, [msgs]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => fab.current?.focus());
  }, []);

  const ask = (text: string) => {
    const s = text.trim();
    if (!s) return;
    setQ("");
    const a = answer(s, L);
    setMsgs((m) => [...m.filter((x) => x.who !== "typing"), { id: ++seq, who: "me", text: s }, { id: ++seq, who: "typing" }]);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setMsgs((m) => [...m.filter((x) => x.who !== "typing"), { id: ++seq, who: "us", a }]);
    }, 550 + Math.min(800, s.length * 14) + (a.groups ? 250 : 0));
    input.current?.focus();
  };

  const lastUs = [...msgs].reverse().find((m) => m.who === "us") as Extract<Msg, { who: "us" }> | undefined;
  const asked = msgs.some((m) => m.who === "me");
  const typing = msgs.some((m) => m.who === "typing");
  const chips = !asked || typing ? [] : lastUs?.a.chips ?? [];

  return (
    <>
      <button
        ref={fab}
        type="button"
        className={`chat-fab${open ? " is-open" : ""}`}
        style={lift ? { bottom: lift + 12 } : undefined}
        aria-expanded={open}
        aria-controls={open ? "chat-panel" : undefined}
        onClick={() => (open ? close() : setOpen(true))}
      >
        {open ? (
          <Icon name="x" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/img/brand/dots.png" alt="" width={30} height={30} className="chat-fab-dots" />
        )}
        <span className={open ? "vh" : undefined}>{open ? t.close : t.launch}</span>
      </button>

      {open && (
        <section
          className="chat"
          id="chat-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              close();
            }
          }}
        >
          <header className="chat-head">
            <span className="chat-avatar">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/brand/dots.png" alt="" width={34} height={34} />
              <i className="chat-online" title={t.online} />
            </span>
            <div className="chat-head-text">
              <h2 id={titleId} data-no-translate>
                {site.name}
              </h2>
              <p>
                <span>{t.sub} ·</span> <span className="chat-call">{t.call}</span>
              </p>
            </div>
            <button type="button" className="chat-close" onClick={close} aria-label={t.close}>
              <Icon name="x" />
            </button>
          </header>

          <ol className="chat-list" ref={list} aria-live="polite" aria-relevant="additions">
            {msgs.map((m) =>
              m.who === "me" ? (
                <li key={m.id} className="chat-me" data-no-translate>
                  <span className="vh">{L === "es" ? "Usted: " : "You: "}</span>
                  {m.text}
                </li>
              ) : m.who === "typing" ? (
                <li key={m.id} className="chat-us chat-typing" aria-label={t.typing}>
                  <i />
                  <i />
                  <i />
                </li>
              ) : (
                <li key={m.id} className="chat-us" lang={m.a.lang}>
                  <Bubble a={m.a} onNav={close} />
                </li>
              )
            )}
            {!asked && msgs.length > 0 && (
              <li className="chat-starters" role="group" aria-label={L === "es" ? "Preguntas sugeridas" : "Suggested questions"}>
                {starters[L].map((s) => (
                  <button key={s} type="button" onClick={() => ask(s)}>
                    {s}
                  </button>
                ))}
              </li>
            )}
          </ol>

          {chips.length > 0 && (
            <div className="chat-chips" role="group" aria-label={L === "es" ? "Preguntas sugeridas" : "Suggested questions"}>
              {chips.map((s) => (
                <button key={s} type="button" onClick={() => ask(s)} lang={looksSpanish(s) ? "es" : "en"}>
                  {s}
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
            <label className="vh" htmlFor="chat-q">
              {t.label}
            </label>
            <input id="chat-q" ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.ph} autoComplete="off" enterKeyHint="send" maxLength={300} />
            <button type="submit" className="chat-send" aria-label={t.send} disabled={!q.trim()}>
              <Icon name="send" />
            </button>
          </form>
        </section>
      )}
    </>
  );
}

function Bubble({ a, onNav }: { a: Answer; onNav: () => void }) {
  return (
    <>
      <p>{a.text}</p>
      {a.groups?.map((g, i) =>
        g.lines.length ? (
          <div className="chat-group" key={i}>
            {g.title && <h3>{g.title}</h3>}
            <ul>
              {g.lines.map((ln, j) => (
                <li key={j} className={ln.strong ? "is-strong" : undefined}>
                  {ln.time && <span className="chat-time">{ln.time}</span>}
                  <span className="chat-line">
                    <b>{ln.text}</b>
                    {ln.note && <small>{ln.note}</small>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null
      )}
      {a.after && <p className="chat-after">{a.after}</p>}
      {a.lead && <LeadForm lang={a.lang} />}
      {(a.cta || a.source) && (
        <div className="chat-links">
          {a.cta && (
            <Link className="chat-cta" href={a.cta.href} onClick={onNav}>
              {a.cta.label} <Icon name="arrow" />
            </Link>
          )}
          {a.source && a.source.href !== a.cta?.href && (
            <Link className="chat-src" href={a.source.href} onClick={onNav}>
              <Icon name="doc" /> {a.source.label}
            </Link>
          )}
        </div>
      )}
    </>
  );
}

function LeadForm({ lang }: { lang: Lang }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const [done, setDone] = useState<null | { first: string; phone: string; soon: boolean }>(null);
  const id = useId();
  const es = lang === "es";

  if (done)
    return (
      <p className="chat-done" role="status">
        <Icon name="check" />
        <span>
          {es
            ? `Gracias, ${done.first}. Cynthia le llamará al ${done.phone} ${done.soon ? "dentro de una hora" : "mañana a primera hora"}.`
            : `Thank you, ${done.first}. Cynthia will call you ${done.soon ? "within the hour" : "first thing tomorrow morning"} at ${done.phone}.`}
        </span>
      </p>
    );

  return (
    <form
      className="chat-lead"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const digits = phone.replace(/\D/g, "");
        if (!name.trim()) return setErr(es ? "Escriba su nombre." : "Please add your name.");
        if (digits.length < 10) return setErr(es ? "Escriba un teléfono de 10 dígitos." : "Please enter a 10-digit phone number.");
        const d = digits.slice(-10);
        setErr("");
        setDone({ first: name.trim().split(/\s+/)[0], phone: `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`, soon: officeOpen() });
      }}
    >
      <div className="chat-lead-row">
        <label htmlFor={`${id}-n`}>{es ? "Nombre" : "Name"}</label>
        <input id={`${id}-n`} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </div>
      <div className="chat-lead-row">
        <label htmlFor={`${id}-p`}>{es ? "Teléfono" : "Phone"}</label>
        <input id={`${id}-p`} type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" aria-describedby={err ? `${id}-e` : undefined} />
      </div>
      {err && (
        <p className="chat-err" id={`${id}-e`} role="alert">
          {err}
        </p>
      )}
      <button type="submit" className="btn btn-sm">
        {es ? "Pedir que Cynthia me llame" : "Ask Cynthia to call me"}
      </button>
    </form>
  );
}
