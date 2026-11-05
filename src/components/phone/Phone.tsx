"use client";

// A realistic phone, used wherever something happens on a phone: family texts and emails, the personal-link pages,
// prospect replies and staff posting on the go. The frame is self-contained (its own colors), so it looks the same
// on the public site and in the staff system.
//
//   <Phone time="9:41"><SmsThread … /></Phone>
//   <PhoneTour steps={[{ label, caption, screen }]} />  — tap the screen or use the buttons to step through.
import { useState, type ReactNode } from "react";
import "./phone.css";

/* ------------------------------------------------------------ the device */

export function Phone({ children, time = "9:41", dark = false, size = "md", label }: { children: ReactNode; time?: string; dark?: boolean; size?: "sm" | "md" | "lg"; label?: string }) {
  return (
    <div className={`ph ph-${size}${dark ? " ph-dark" : ""}`} role="group" aria-label={label} aria-roledescription="phone">
      <div className="ph-screen">
        <div className="ph-status" aria-hidden="true">
          <span className="ph-time">{time}</span>
          <span className="ph-island" />
          <span className="ph-icons">
            <svg viewBox="0 0 18 12" width="17" height="11"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5.5" width="3" height="6.5" rx="1" /><rect x="10" y="3" width="3" height="9" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></svg>
            <svg viewBox="0 0 16 12" width="15" height="11"><path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.2-1.3A10.4 10.4 0 0 0 8 .4 10.4 10.4 0 0 0 .8 3.3L2 4.6a8.6 8.6 0 0 1 6-2.4Zm0 3.6c1.3 0 2.5.5 3.5 1.3l1.2-1.3A7 7 0 0 0 8 4a7 7 0 0 0-4.7 1.8l1.2 1.3c1-.8 2.2-1.3 3.5-1.3Zm0 3.5c-.5 0-1 .2-1.3.5L8 11.3l1.3-1.5c-.3-.3-.8-.5-1.3-.5Z" /></svg>
            <svg viewBox="0 0 27 12" width="25" height="11"><rect x=".5" y=".5" width="22" height="11" rx="3" fill="none" stroke="currentColor" opacity=".4" /><rect x="2" y="2" width="17" height="8" rx="1.6" /><rect x="24" y="4" width="2" height="4" rx="1" opacity=".4" /></svg>
          </span>
        </div>
        <div className="ph-app">{children}</div>
        <span className="ph-home" aria-hidden="true" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ Messages */

export interface Bubble { me?: boolean; text: ReactNode; img?: string; time?: string; translated?: { lang: string; text: ReactNode }; link?: { title: string; host: string; img?: string } }

/** A text-message conversation. `me` bubbles are sent by the phone's owner (on the right). */
export function SmsThread({ name, sub, initials, color = "#2e4d33", bubbles, draft, typing = false }: { name: string; sub?: string; initials: string; color?: string; bubbles: Bubble[]; draft?: string; typing?: boolean }) {
  return (
    <div className="ph-sms">
      <div className="ph-sms-head">
        <span className="ph-back" aria-hidden="true">‹</span>
        <span className="ph-avatar" style={{ background: color }}>{initials}</span>
        <b>{name}</b>
        {sub && <small>{sub}</small>}
      </div>
      <div className="ph-sms-body">
        {bubbles.map((b, i) => (
          <div key={i} className={`ph-msg${b.me ? " me" : ""}`}>
            {b.time && <span className="ph-msg-time">{b.time}</span>}
            <div className="ph-bubble">
              {b.img && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.img} alt="" />
              )}
              <span>{b.text}</span>
              {b.link && (
                <span className="ph-linkcard">
                  {b.link.img && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.link.img} alt="" />
                  )}
                  <b>{b.link.title}</b>
                  <small>{b.link.host}</small>
                </span>
              )}
            </div>
            {b.translated && (
              <div className="ph-translated">
                <small>Translated from {b.translated.lang}</small>
                {b.translated.text}
              </div>
            )}
          </div>
        ))}
        {typing && (
          <div className="ph-msg">
            <div className="ph-bubble ph-typing" aria-label="Typing">
              <i />
              <i />
              <i />
            </div>
          </div>
        )}
      </div>
      <div className="ph-sms-compose">
        <span className="ph-plus" aria-hidden="true">+</span>
        <span className={`ph-input${draft ? " has" : ""}`}>{draft || "Text Message"}</span>
        <span className="ph-send" aria-hidden="true">↑</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ Mail */

export interface MailRow { from: string; subject: string; preview: string; time: string; unread?: boolean; highlight?: boolean }

export function MailInbox({ rows, account = "Inbox" }: { rows: MailRow[]; account?: string }) {
  return (
    <div className="ph-mail">
      <div className="ph-mail-top">
        <span className="ph-back" aria-hidden="true">‹ Mailboxes</span>
        <b>{account}</b>
      </div>
      <ul className="ph-mail-list">
        {rows.map((r, i) => (
          <li key={i} className={`${r.unread ? "unread" : ""}${r.highlight ? " hl" : ""}`}>
            <span className="ph-mail-dot" aria-hidden="true" />
            <span className="ph-mail-row">
              <b>{r.from}</b>
              <time>{r.time}</time>
            </span>
            <span className="ph-mail-sub">{r.subject}</span>
            <span className="ph-mail-pre">{r.preview}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** One opened email. `children` is the email body (use the .ph-em-* classes for a branded newsletter). */
export function MailMessage({ from, address, to, subject, time, children }: { from: string; address: string; to: string; subject: string; time: string; children: ReactNode }) {
  return (
    <div className="ph-mail ph-mail-open">
      <div className="ph-mail-top">
        <span className="ph-back" aria-hidden="true">‹ Inbox</span>
      </div>
      <div className="ph-mail-hdr">
        <b>{from}</b>
        <small>{address}</small>
        <small>To: {to} · {time}</small>
        <h4>{subject}</h4>
      </div>
      <div className="ph-mail-body">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------ a web page in the browser (personal links) */

export function Browser({ host, children, secure = true }: { host: string; children: ReactNode; secure?: boolean }) {
  return (
    <div className="ph-web">
      <div className="ph-web-page">{children}</div>
      <div className="ph-web-bar">
        <span className="ph-url">
          {secure && <span aria-hidden="true">🔒︎ </span>}
          {host}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ lock screen with notifications */

export interface Notice { app: string; icon?: string; title: string; text: string; time: string }

export function LockScreen({ date, time, notices, wallpaper = "/img/lantern-garden.jpg" }: { date: string; time: string; notices: Notice[]; wallpaper?: string }) {
  return (
    <div className="ph-lock" style={{ backgroundImage: `linear-gradient(rgba(10,20,25,.15), rgba(10,20,25,.55)), url(${wallpaper})` }}>
      <p className="ph-lock-date">{date}</p>
      <p className="ph-lock-time">{time}</p>
      <ul className="ph-notices">
        {notices.map((n, i) => (
          <li key={i}>
            <span className="ph-notice-app">
              <i style={{ background: n.icon ?? "#34c759" }} aria-hidden="true" />
              {n.app}
              <time>{n.time}</time>
            </span>
            <b>{n.title}</b>
            <span>{n.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------ tap-through */

export interface TourStep { label: string; caption?: ReactNode; screen: ReactNode; time?: string; dark?: boolean }

/**
 * A phone you can tap through, as if holding it: tap the screen (or Next) to go to the next moment.
 * The step list beside it names each moment so a presenter can jump around.
 */
export function PhoneTour({ steps, title, size = "md", startAt = 0 }: { steps: TourStep[]; title?: string; size?: "sm" | "md" | "lg"; startAt?: number }) {
  const [i, setI] = useState(startAt);
  const s = steps[i];
  const go = (n: number) => setI(Math.max(0, Math.min(steps.length - 1, n)));
  return (
    <div className="ph-tour">
      <div className="ph-tour-stage">
        {/* Tapping the screen moves on, as on a real phone; controls inside the screen still work on their own. Keyboard users use Next. */}
        <div
          className="ph-tap"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a, button, input, select, textarea, label")) return;
            go(i + 1 >= steps.length ? 0 : i + 1);
          }}
        >
          <Phone time={s.time} dark={s.dark} size={size} label={s.label}>
            <div className="ph-step" key={i}>
              {s.screen}
            </div>
          </Phone>
        </div>
        <div className="ph-tour-nav">
          <button type="button" onClick={() => go(i - 1)} disabled={i === 0} aria-label="Previous">
            ‹
          </button>
          <span>
            {i + 1} / {steps.length}
          </span>
          <button type="button" onClick={() => go(i + 1)} disabled={i === steps.length - 1} aria-label="Next">
            ›
          </button>
        </div>
      </div>
      <div className="ph-tour-side">
        {title && <h3>{title}</h3>}
        <ol>
          {steps.map((st, n) => (
            <li key={n}>
              <button type="button" aria-current={n === i ? "step" : undefined} onClick={() => go(n)}>
                <span className="ph-tour-n">{n + 1}</span>
                <span>
                  <b>{st.label}</b>
                  {n === i && st.caption && <small>{st.caption}</small>}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
