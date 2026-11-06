"use client";

// The community's real website in a desktop browser window, shrunk to fit, with the visitor's actions played on it:
// scroll to the right part, click, type into the form, point at the button. Nothing is submitted, so no sign-up or
// lead is ever created (the chat's own answers are worked out in the page). Same-origin, so the page is driven
// directly; the cookie banner is hidden, and the chat button too unless the step is about the chat.
import { useEffect, useRef, useState } from "react";
import type { SiteAction } from "./types";

const DESKTOP = 1280;
const HIDE = `.cookie, nextjs-portal { display: none !important; }
html { scrollbar-width: none; scroll-behavior: auto !important; } ::-webkit-scrollbar { display: none; }`;
const HIDE_CHAT = ".chat-fab, .chat { display: none !important; }";

const sleep = (ms: number, live: () => boolean) => new Promise<void>((r) => setTimeout(r, live() ? ms : 0));

function find(doc: Document, a: { sel: string; text?: string; n?: number }) {
  const all = [...doc.querySelectorAll<HTMLElement>(a.sel)].filter((el) => {
    if (!a.text) return true;
    const card = el.closest("article, li, section, .card, [role=dialog], dialog") ?? el;
    return (el.textContent ?? "").includes(a.text) || (card.textContent ?? "").includes(a.text);
  });
  return all[a.n ?? 0] ?? all[0] ?? null;
}

/** Types like a person: one character at a time, through React's own value setter so the page's state follows. */
async function typeInto(el: HTMLInputElement | HTMLTextAreaElement, value: string, live: () => boolean) {
  // The page lives in another window, so its own element classes (not ours) hold the value setter.
  const win = el.ownerDocument.defaultView as (Window & typeof globalThis) | null;
  if (!win) return;
  const proto = el.tagName === "TEXTAREA" ? win.HTMLTextAreaElement.prototype : win.HTMLInputElement.prototype;
  const set = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  el.focus({ preventScroll: true });
  for (let i = 1; i <= value.length && live(); i++) {
    set?.call(el, value.slice(0, i));
    el.dispatchEvent(new Event("input", { bubbles: true }));
    await sleep(55, live);
  }
}

export function SiteFrame({ path, host, actions, chat = false, onDone }: { path: string; host: string; actions: SiteAction[]; chat?: boolean; onDone?: () => void }) {
  const view = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(0.5);
  const [h, setH] = useState(800);
  const [ready, setReady] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number; press: number } | null>(null);
  const done = useRef(onDone);
  const height = useRef(h);
  useEffect(() => {
    done.current = onDone;
    height.current = h;
  });

  // Fit a desktop-width page into the window.
  useEffect(() => {
    const el = view.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const s = e.contentRect.width / DESKTOP;
      setScale(s);
      setH(e.contentRect.height / s);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Once the page has loaded, play the visitor's actions.
  useEffect(() => {
    if (!ready) return;
    const win = frame.current?.contentWindow;
    const doc = frame.current?.contentDocument;
    if (!win || !doc) return;
    let alive = true;
    const live = () => alive;
    const style = doc.createElement("style");
    style.textContent = chat ? HIDE : HIDE + HIDE_CHAT;
    doc.head.appendChild(style);

    const pointAt = async (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      setCursor((c) => ({ x: r.left + Math.min(r.width / 2, 160), y: r.top + r.height / 2, press: c?.press ?? 0 }));
      await sleep(650, live);
    };
    const press = () => setCursor((c) => (c ? { ...c, press: c.press + 1 } : c));

    (async () => {
      await sleep(700, live);
      for (const a of actions) {
        if (!alive) return;
        if (a.do === "wait") {
          await sleep(a.ms, live);
          continue;
        }
        const el = find(doc, a);
        if (!el) continue;
        if (a.do === "scroll") {
          const r = el.getBoundingClientRect();
          win.scrollTo({ top: win.scrollY + r.top - height.current * 0.3, behavior: "smooth" });
          await sleep(1100, live);
          continue;
        }
        // Bring it into view if it's off screen, then move the pointer to it.
        const r = el.getBoundingClientRect();
        if (r.top < 60 || r.bottom > height.current - 40) {
          win.scrollTo({ top: win.scrollY + r.top - height.current * 0.35, behavior: "smooth" });
          await sleep(700, live);
        }
        await pointAt(el);
        if (a.do === "click") {
          press();
          el.click();
          await sleep(500, live);
        } else if (a.do === "point") {
          press();
          await sleep(500, live);
        } else if (a.do === "type" && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) {
          press();
          await typeInto(el as HTMLInputElement | HTMLTextAreaElement, a.value, live);
          await sleep(250, live);
        }
      }
      await sleep(1800, live);
      if (alive) done.current?.();
    })();
    return () => {
      alive = false;
    };
  }, [ready, actions, chat]);

  return (
    <div className="fl-site">
      <div className="fl-site-bar" aria-hidden="true">
        <span className="fl-site-dots"><i /><i /><i /></span>
        <span className="fl-site-url">🔒 {host}{path.replace(/^\/[^/]+/, "").replace(/\?.*$/, "") || "/"}</span>
      </div>
      <div className="fl-site-view" ref={view}>
        <iframe
          ref={frame}
          src={path}
          title={`${host} website`}
          tabIndex={-1}
          style={{ width: DESKTOP, height: h, transform: `scale(${scale})` }}
          onLoad={() => setReady(true)}
        />
        {cursor && (
          <span className="fl-cursor" style={{ left: cursor.x * scale, top: cursor.y * scale }} aria-hidden="true">
            <i key={cursor.press} />
          </span>
        )}
        {!ready && <span className="fl-site-loading" aria-hidden="true" />}
      </div>
    </div>
  );
}
