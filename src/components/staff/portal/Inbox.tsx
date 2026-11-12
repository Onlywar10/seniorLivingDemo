"use client";

// Communications: the conversations on the left (needing a reply first), the one you pick on the right, and a reply
// box underneath: text or email, written in English and sent in their language. Suggested replies use facts from the
// calendar only. "New message" starts a conversation with any family member or resident. Everything sent is filed on
// the resident's page too. Saved in this browser only.
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Convo, ConvoMsg, Reachable } from "@/data/staff/messages";
import type { StaffRole } from "@/data/staff/shared";
import { Icon } from "../../Icon";
import { residentHref } from "../residentHref";
import { FamilyLink, ResidentLink } from "../ResidentLink";
import { say } from "../store";
import { Badge, Initials } from "../ui";

type Show = "reply" | "all" | "done";
const first = (n = "") => n.split(" ")[0];
const tel = (p: string) => `tel:+1${p.replace(/\D/g, "")}`;
const prospect = (c: { relation: string }) => c.relation === "Prospect" || c.relation === "On the waitlist";
/** "Daughter of Rosa Hernández", "Resident", or "Prospect · Assisted Living". */
const sub = (c: { relation: string; resident: string }) => (c.relation === "Resident" ? "Resident" : prospect(c) ? `${c.relation} · ${c.resident}` : `${c.relation} of ${c.resident}`);

export function Inbox({ convos: initial, people, as, me }: { convos: Convo[]; people: Reachable[]; as: StaffRole; me: string }) {
  const [convos, setConvos] = useState(initial);
  const mine = (c: Convo) => c.needsReply && c.owner === as;
  const [show, setShow] = useState<Show>(initial.some(mine) ? "reply" : "all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(initial.find(mine)?.id ?? initial[0]?.id ?? null);
  const [starting, setStarting] = useState(false);
  const [phoneList, setPhoneList] = useState(true);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return convos
      .filter((c) => (show === "reply" ? mine(c) : show === "done" ? !c.needsReply : true))
      .filter((c) => !s || `${c.name} ${c.resident} ${c.msgs.map((m) => m.text).join(" ")}`.toLowerCase().includes(s));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convos, show, q]);
  const open = convos.find((c) => c.id === openId) ?? null;
  const waiting = convos.filter(mine).length;

  const send = (c: Convo, text: string, via: string) => {
    const before = convos;
    const m: ConvoMsg = { id: `me-${Date.now()}`, me: true, who: first(me), text, when: "Just now", via };
    setConvos((xs) => xs.map((x) => (x.id === c.id ? { ...x, needsReply: false, last: 0, msgs: [...x.msgs, m] } : x)));
    say(`Sent to ${first(c.name)} by ${via.toLowerCase()}${c.lang !== "English" ? `, in ${c.lang}` : ""}.${prospect(c) ? " Filed in Prospects." : ` Filed on ${first(c.resident)}’s page.`}`, () => setConvos(before));
  };
  const done = (c: Convo, why: string) => {
    const before = convos;
    setConvos((xs) => xs.map((x) => (x.id === c.id ? { ...x, needsReply: false } : x)));
    say(why, () => setConvos(before));
  };
  const start = (p: Reachable) => {
    const existing = convos.find((c) => c.name === p.name);
    setStarting(false);
    setPhoneList(false);
    if (existing) { setOpenId(existing.id); setShow("all"); return; }
    const c: Convo = { id: `new-${p.name}`, name: p.name, relation: p.relation, resident: p.resident, lang: p.lang, channel: p.channel, phone: p.phone, email: p.email, needsReply: false, last: 0, msgs: [] };
    setConvos((xs) => [c, ...xs]);
    setShow("all");
    setOpenId(c.id);
  };

  return (
    <div className={`ib${phoneList ? "" : " ib-reading"}`}>
      <aside className="sx-card ib-list" aria-label="Conversations">
        <div className="ib-list-h">
          <div className="sx-seg" role="group" aria-label="Show">
            <button type="button" aria-pressed={show === "reply"} onClick={() => setShow("reply")}>Needs a reply <small>{waiting}</small></button>
            <button type="button" aria-pressed={show === "all"} onClick={() => setShow("all")}>All</button>
            <button type="button" aria-pressed={show === "done"} onClick={() => setShow("done")}>Answered</button>
          </div>
          <label className="ib-search"><span className="vh">Search conversations</span><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a name or a word" /></label>
          <button type="button" className="sx-btn sx-btn-primary sx-btn-sm" onClick={() => setStarting(true)}><Icon name="plus" /> New message</button>
        </div>
        <ul>
          {list.map((c) => {
            const last = c.msgs[c.msgs.length - 1];
            return (
              <li key={c.id}>
                <button type="button" aria-current={c.id === openId ? "true" : undefined} className={mine(c) ? "unread" : undefined} onClick={() => { setOpenId(c.id); setPhoneList(false); }}>
                  <Initials name={c.name} size={36} />
                  <span className="ib-row">
                    <span className="ib-row-t"><b>{c.name}</b><small>{last?.when.split(", ")[0] ?? "New"}</small></span>
                    <small>{sub(c)}{c.lang !== "English" ? ` · ${c.lang}` : ""}</small>
                    <span className="ib-snip">{last ? `${last.ai ? "Kinlight: " : last.me ? `${last.who}: ` : ""}${last.text}` : "No messages yet"}</span>
                  </span>
                  {mine(c) && <span className="ib-dot" aria-label="Needs a reply" />}
                </button>
              </li>
            );
          })}
          {!list.length && <li className="pt-empty">{show === "reply" ? "Nothing waiting for a reply." : "No conversations match."}</li>}
        </ul>
      </aside>

      <section className="sx-card ib-thread" aria-label={open ? `Conversation with ${open.name}` : "Conversation"}>
        {open ? <Thread key={open.id} c={open} as={as} onSend={send} onDone={done} onBack={() => setPhoneList(true)} /> : <p className="pt-empty">Choose a conversation, or start a new one.</p>}
      </section>

      {starting && <NewMessage people={people} onPick={start} onClose={() => setStarting(false)} />}
    </div>
  );
}

function Thread({ c, as, onSend, onDone, onBack }: { c: Convo; as: StaffRole; onSend: (c: Convo, text: string, via: string) => void; onDone: (c: Convo, why: string) => void; onBack: () => void }) {
  const canText = c.channel !== "Email" && !!c.phone;
  const canEmail = c.channel !== "Text" && !!c.email;
  const [via, setVia] = useState<"Text" | "Email">(canText || !canEmail ? "Text" : "Email");
  const [text, setText] = useState(c.needsReply ? c.quick?.[0] ?? "" : "");
  const [others, setOthers] = useState(false);
  const yours = c.needsReply && c.owner === as;
  return (
    <>
      <header className="ib-th-h">
        <button type="button" className="sx-btn sx-btn-sm ib-back" onClick={onBack} aria-label="Back to conversations"><Icon name="left" /></button>
        <Initials name={c.name} size={40} />
        <div>
          <h2>{c.relation === "Resident" ? <ResidentLink name={c.name} /> : prospect(c) ? c.name : <FamilyLink name={c.name} resident={c.resident} />}</h2>
          <p>{c.relation === "Resident" || prospect(c) ? sub(c) : <>{c.relation} of <Link className="pt-name" href={residentHref(c.resident, "family")}>{c.resident}</Link></>} · {c.channel} · {c.lang}</p>
        </div>
        <span className="ib-th-a">
          {c.phone && <a className="sx-btn sx-btn-sm" href={tel(c.phone)} onClick={() => yours && window.setTimeout(() => onDone(c, `Called ${first(c.name)}. Marked as answered.`), 400)}><Icon name="phone" /> Call</a>}
          {yours && <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => onDone(c, "No reply needed. Marked as answered.")}>No reply needed</button>}
        </span>
      </header>
      {c.needsReply && c.why && <p className="sx-callout info ib-why"><Icon name="info" /> <span>{c.why}{c.ownerName && !yours ? ` Assigned to ${c.ownerName}.` : ""}</span></p>}
      <ol className="ib-msgs">
        {c.msgs.map((m) => (
          m.note ? (
            <li key={m.id} className="note"><Icon name="spark" /> {m.text} <small>{m.when}</small></li>
          ) : (
            <li key={m.id} className={m.me ? (m.ai ? "me ai" : "me staff") : "them"}>
              <p>{m.text}</p>
              {m.original && <p className="ib-orig">{m.original}</p>}
              <small>{m.ai ? "Sent automatically by Kinlight" : m.who} · {m.via} · {m.when}</small>
            </li>
          )
        ))}
        {!c.msgs.length && <li className="sx-hint ib-none">No messages yet. Write the first one below.</li>}
      </ol>
      <form className="sx-form ib-compose" onSubmit={(e) => { e.preventDefault(); if (text.trim()) { onSend(c, text.trim(), via); setText(""); } }}>
        <div className="ib-compose-h">
          <div className="sx-seg" role="group" aria-label="Send by">
            <button type="button" aria-pressed={via === "Text"} disabled={!canText} onClick={() => setVia("Text")}><Icon name="sms" /> Text</button>
            <button type="button" aria-pressed={via === "Email"} disabled={!canEmail} onClick={() => setVia("Email")}><Icon name="mail" /> Email</button>
          </div>
          {c.lang !== "English" && <small className="sx-hint"><Icon name="translate" /> Write in English: {first(c.name)} gets it in {c.lang}.</small>}
        </div>
        <label><span className="vh">Your message</span><textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder={`Write to ${first(c.name)}`} /></label>
        {c.needsReply && (c.quick?.length ?? 0) > 1 && (
          <div className="pt-quick-more">
            <button type="button" className="sx-link" aria-expanded={others} onClick={() => setOthers((o) => !o)}>{others ? "Hide other replies" : `Other replies (${(c.quick?.length ?? 1) - 1})`}</button>
            {others && <div className="pt-quick" role="group" aria-label="Other replies">{c.quick!.map((x, i) => <button key={i} type="button" aria-pressed={text === x} onClick={() => setText(x)}>{x}</button>)}</div>}
          </div>
        )}
        <div className="pt-act">
          <button type="submit" className="sx-btn sx-btn-primary" disabled={!text.trim()}><Icon name="send" /> Send {via === "Email" ? "email" : "text"}</button>
          {c.needsReply && <small className="sx-hint">Suggested replies use facts from the calendar only, never promises.</small>}
        </div>
      </form>
    </>
  );
}

function NewMessage({ people, onPick, onClose }: { people: Reachable[]; onPick: (p: Reachable) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const s = q.trim().toLowerCase();
  const hits = people.filter((p) => !s || `${p.name} ${p.resident}`.toLowerCase().includes(s)).slice(0, 12);
  return (
    <div className="sx-drawer" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sx-drawer-box" role="dialog" aria-modal="true" aria-label="New message">
        <div className="sx-drawer-h"><div><h2>New message</h2><p>To a family member or a resident</p></div><span className="sx-drawer-a"><button type="button" className="sx-x" onClick={onClose} aria-label="Close"><Icon name="x" /></button></span></div>
        <div className="sx-drawer-b">
          <label className="sx-form"><span className="vh">Who to</span><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a name or a resident" autoFocus /></label>
          <ul className="rs-pick">
            {hits.map((p) => (
              <li key={p.name + p.relation}>
                <button type="button" onClick={() => onPick(p)}>
                  <b>{p.name} {p.relation === "Resident" && <Badge tone="neutral">Resident</Badge>}</b>
                  <small>{p.relation === "Resident" ? "Texts in English" : `${p.relation} of ${p.resident}`} · {p.channel}{p.lang !== "English" ? ` · ${p.lang}` : ""}</small>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
