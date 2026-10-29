"use client";

import { useMemo, useState } from "react";
import type { Thread } from "@/data/staff";
import { Icon } from "../Icon";
import { Badge, Meter } from "./ui";

type Tpl = { k: string; label: string; text: string };

const es: Record<string, string> = {
  event: "Nuevo en el calendario de PCL: {event}. Responda SÍ para reservar un lugar para su ser querido, o llame a la recepción al (916) 458-0303.",
  photos: "¡Ya están las fotos de {event}! Véalas en nuestro sitio web y en Facebook. Gracias por ser parte de la familia de PCL.",
  reminder: "Recordatorio: {event}. Las familias siempre son bienvenidas.",
  change: "Cambio de horario: {event}. Disculpe las molestias. ¿Preguntas? Llame al (916) 458-0303.",
  harbor: "Noticias de Harbor, de parte de Janelle: {event}. Gracias por confiarnos a su ser querido.",
};
const ru: Record<string, string> = {
  event: "Новое в календаре PCL: {event}. Ответьте ДА, чтобы забронировать место, или позвоните на ресепшн: (916) 458-0303.",
  photos: "Фотографии с мероприятия «{event}» уже опубликованы на нашем сайте и в Facebook.",
  reminder: "Напоминание: {event}. Семьи всегда желанные гости.",
  change: "Изменение в расписании: {event}. Вопросы? Звоните (916) 458-0303.",
  harbor: "Новости Harbor от Джанель: {event}. Спасибо, что доверяете нам.",
};

export function Composer({ templates, families, harborFamilies, contacts }: { templates: Tpl[]; families: number; harborFamilies: number; contacts: { resident: string; contact: string }[] }) {
  const [aud, setAud] = useState<"all" | "harbor" | "one">("all");
  const [one, setOne] = useState(contacts[0].resident);
  const [tpl, setTpl] = useState("event");
  const [event, setEvent] = useState("Bus Trip to the Veterans Day Parade, Wed, Nov 11 at 7:30 am from the Lobby");
  const t = templates.find((x) => x.k === tpl)!;
  const [text, setText] = useState(t.text.replace("{event}", event));
  const [sent, setSent] = useState<"idle" | "busy" | "done">("idle");
  const count = aud === "all" ? families : aud === "harbor" ? harborFamilies : 1;

  const applyTpl = (k: string, ev = event) => {
    setTpl(k);
    setText(templates.find((x) => x.k === k)!.text.replace("{event}", ev));
  };

  return (
    <form className="sx-form" onSubmit={(e) => { e.preventDefault(); setSent("busy"); window.setTimeout(() => setSent("done"), 900); }}>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="sx-lbl" style={{ marginBottom: 6 }}>Send to</legend>
        <div className="aud">
          <label><input type="radio" name="aud" checked={aud === "all"} onChange={() => setAud("all")} />All families<small>{families} families · text and email</small></label>
          <label><input type="radio" name="aud" checked={aud === "harbor"} onChange={() => setAud("harbor")} />Harbor families<small>{harborFamilies} families</small></label>
          <label><input type="radio" name="aud" checked={aud === "one"} onChange={() => setAud("one")} />One resident’s family<small>Choose a resident</small></label>
        </div>
      </fieldset>
      {aud === "one" && (
        <label>
          Resident
          <select value={one} onChange={(e) => setOne(e.target.value)}>
            {contacts.map((c) => <option key={c.resident} value={c.resident}>{c.resident} ({c.contact})</option>)}
          </select>
        </label>
      )}
      <div className="sx-row">
        <label>
          Template
          <select value={tpl} onChange={(e) => applyTpl(e.target.value)}>
            {templates.map((x) => <option key={x.k} value={x.k}>{x.label}</option>)}
          </select>
        </label>
        <label>
          Event or news
          <input value={event} onChange={(e) => { setEvent(e.target.value); applyTpl(tpl, e.target.value); }} />
        </label>
      </div>
      <label>
        Message
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} />
        <span className="sx-hint">{text.length} characters · {Math.ceil(text.length / 160)} text{text.length > 160 ? "s" : ""}</span>
      </label>
      <div className="tr-prev" aria-label="Automatic translation preview">
        <div><b><Icon name="translate" /> Spanish · 14 families</b>{(es[tpl] ?? es.event).replace("{event}", event)}</div>
        <div><b>Russian · 6 families</b>{(ru[tpl] ?? ru.event).replace("{event}", event)}</div>
        <div><b>Also translated</b><span className="sx-hint">Tagalog (4), Vietnamese (2) and Chinese (2). Families see the English underneath.</span></div>
      </div>
      <div className="pub-foot">
        <p>{aud === "one" ? `To ${one}’s family` : `To ${count} families`} · replies come to this inbox</p>
        {sent === "done" ? (
          <span className="appr-done" style={{ color: "var(--sx-good)" }} role="status"><Icon name="check" /> Sent to {count} {count === 1 ? "family" : "families"}</span>
        ) : (
          <button type="submit" className="sx-btn sx-btn-terra" disabled={sent === "busy"}><Icon name="send" /> {sent === "busy" ? "Sending…" : "Send now"}</button>
        )}
      </div>
    </form>
  );
}

export function Inbox({ threads }: { threads: (Omit<Thread, "msgs"> & { when: string; msgs: (Thread["msgs"][number] & { when: string })[] })[] }) {
  const [sel, setSel] = useState(threads[0].id);
  const [read, setRead] = useState<Set<string>>(new Set([threads[0].id]));
  const [replies, setReplies] = useState<Record<string, string[]>>({});
  const [draft, setDraft] = useState("");
  const th = threads.find((x) => x.id === sel)!;
  const suggestion = useMemo(
    () =>
      ({
        t1: "¡Claro que sí, María! Las familias son bienvenidas y el disfraz es opcional. ¡Nos encantará ver a Rosa como Frida!",
        t2: "Hi Tom! Dorothy is first on the waitlist. If a seat opens I’ll text you both right away. The trip is free; lunch at the orchard is about $15.",
      })[sel] ?? "",
    [sel]
  );

  return (
    <div className="inbox">
      <ul className="inbox-list" aria-label="Conversations">
        {threads.map((x) => (
          <li key={x.id}>
            <button
              type="button"
              aria-pressed={sel === x.id}
              className={x.unread && !read.has(x.id) ? "unread" : ""}
              onClick={() => { setSel(x.id); setRead((r) => new Set(r).add(x.id)); setDraft(""); }}
            >
              <span className="top"><b>{x.from}</b><small>{x.when}</small></span>
              <span className="sub">{x.relation} of {x.resident} · {x.lang}</span>
              <span className="snip">{x.msgs[x.msgs.length - 1].text}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="thread">
        <div className="thread-h">
          <div>
            <b>{th.from}</b>
            <span>{th.relation} of {th.resident} · Apt {th.apt}</span>
          </div>
          {th.lang !== "English" && <Badge tone="info"><Icon name="translate" /> Translated from {th.lang}</Badge>}
        </div>
        {th.msgs.map((m, i) => (
          <div key={i} className={`t-msg ${m.me ? "t-me" : ""}`}>
            {m.text}
            {m.original && <span className="t-orig" lang={th.lang === "Spanish" ? "es" : "ru"}>{m.me ? "Sent as: " : "Original: "}{m.original}</span>}
            <small>{m.me ? "Toni Glenn" : m.who} · {m.when}</small>
          </div>
        ))}
        {(replies[sel] ?? []).map((r, i) => (
          <div key={`r${i}`} className="t-msg t-me">
            {r}
            {th.lang !== "English" && <span className="t-orig">Translated to {th.lang} automatically</span>}
            <small>Toni Glenn · just now · Delivered</small>
          </div>
        ))}
        <form className="t-reply sx-form" onSubmit={(e) => { e.preventDefault(); if (!draft.trim()) return; setReplies((r) => ({ ...r, [sel]: [...(r[sel] ?? []), draft] })); setDraft(""); }}>
          <label>
            <span className="vh">Reply</span>
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Reply to ${th.from.split(" ")[0]}${th.lang !== "English" ? ` (we’ll translate to ${th.lang})` : ""}`} />
          </label>
          <div className="row">
            {suggestion && !(replies[sel] ?? []).length ? (
              <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => setDraft(suggestion)}><Icon name="wand" /> Suggested reply</button>
            ) : <span />}
            <button type="submit" className="sx-btn sx-btn-primary sx-btn-sm"><Icon name="send" /> Send</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function RateCell({ n, of }: { n: number; of: number }) {
  const p = Math.round((n / of) * 100);
  return (
    <span className="rate">
      <span>{n} · {p}%</span>
      <Meter v={p} label={`${p}%`} />
    </span>
  );
}
