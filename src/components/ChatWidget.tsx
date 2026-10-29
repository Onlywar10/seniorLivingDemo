"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { answer, suggestions, type Answer } from "@/lib/answers";
import { Icon } from "./Icon";

type Msg = { who: "me"; text: string } | { who: "us"; a: Answer } | { who: "typing" };

const hello: Answer = {
  text: "Hello. Ask me anything about Larkmoor House: visiting, care, apartments, this week’s activities or tonight’s dinner.",
  source: { label: "Answers come from this website, updated today", href: "/larkmoor-house" },
};

/** "Ask us" chat, on every public page. Answers come from the community's own published content. */
export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{ who: "us", a: hello }]);
  const [q, setQ] = useState("");
  const list = useRef<HTMLOListElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);
  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  const ask = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setQ("");
    setMsgs((m) => [...m, { who: "me", text: t }, { who: "typing" }]);
    window.setTimeout(() => setMsgs((m) => [...m.filter((x) => x.who !== "typing"), { who: "us", a: answer(t) }]), 650 + Math.min(900, t.length * 12));
  };

  const asked = msgs.some((m) => m.who === "me");

  return (
    <>
      <button type="button" className={`chat-fab ${open ? "is-open" : ""}`} aria-expanded={open} aria-controls="chat" onClick={() => setOpen(!open)}>
        {open ? (
          <span aria-hidden="true" className="chat-x">×</span>
        ) : (
          <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
            <path d="M4 5h16v11H9l-5 4z" />
          </svg>
        )}
        <span>{open ? "Close" : "Ask us a question"}</span>
      </button>
      {open && (
        <section className="chat" id="chat" aria-label="Ask Larkmoor House">
          <header className="chat-head">
            <span className="chat-avatar" aria-hidden="true">
              <svg viewBox="0 0 64 64">
                <rect width="64" height="64" fill="#4F6353" />
                <path d="M46 16c-16 0-27 8-29 24 0 2 0 4 1 6 8-14 17-19 25-22-8 5-16 12-22 26 3 1 6 1 9 1 14-1 21-14 20-30-1-2-2-4-4-5z" fill="#D6C28C" />
              </svg>
            </span>
            <div>
              <b>Ask Larkmoor House</b>
              <span>Instant answers, any time · or call (503) 555-0142</span>
            </div>
          </header>
          <ol className="chat-list" ref={list} aria-live="polite">
            {msgs.map((m, i) =>
              m.who === "me" ? (
                <li key={i} className="chat-me">
                  {m.text}
                </li>
              ) : m.who === "typing" ? (
                <li key={i} className="chat-us chat-typing" aria-label="Writing an answer">
                  <i />
                  <i />
                  <i />
                </li>
              ) : (
                <li key={i} className="chat-us">
                  <p>{m.a.text}</p>
                  {m.a.bullets && (
                    <ul>
                      {m.a.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  )}
                  <Link className="chat-src" href={m.a.source.href} onClick={() => setOpen(false)}>
                    <Icon name="doc" /> {m.a.source.label}
                  </Link>
                </li>
              )
            )}
          </ol>
          {!asked && (
            <div className="chat-chips">
              {suggestions.map((s) => (
                <button key={s} type="button" onClick={() => ask(s)}>
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
              Your question
            </label>
            <input id="chat-q" ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type your question" autoComplete="off" />
            <button type="submit" className="btn btn-green" aria-label="Send">
              <Icon name="arrow" />
            </button>
          </form>
        </section>
      )}
    </>
  );
}
