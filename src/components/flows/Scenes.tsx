// Little animated pictures for workflow steps: a text landing on a phone, a flyer sliding out of a printer, an approval
// stamp. Pure markup; the motion lives in scenes.css and plays when a parent has .is-on (FlowBoard remounts the scene
// each time it becomes active, so the animation replays). Without .is-on a scene rests on its final frame.
import type { ReactNode } from "react";
import type { SceneKind } from "./types";
import "./scenes.css";

const Check = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Bell = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 3a6 6 0 0 0-6 6v3.5L4 16h16l-2-3.5V9a6 6 0 0 0-6-6Zm-2.2 15a2.3 2.3 0 0 0 4.4 0Z" fill="currentColor" />
  </svg>
);
const Handset = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1Z" fill="currentColor" />
  </svg>
);

function Phone({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <div className={`sc-phone ${className}`}>
      <div className="sc-screen">{children}</div>
    </div>
  );
}

export function Scene({ kind, text, text2 }: { kind: SceneKind; text?: string; text2?: string }) {
  switch (kind) {
    case "text":
      return (
        <div className="sc sc-text">
          <Phone>
            <span className="sc-line" />
            <span className="sc-line sc-short" />
          </Phone>
          <span className="sc-dots"><i /><i /><i /></span>
          <span className="sc-bubble sc-in sc-float">{text ?? "New message"}</span>
        </div>
      );
    case "reply":
      return (
        <div className="sc sc-reply">
          <Phone>
            <span className="sc-bubble sc-in sc-old" />
          </Phone>
          <span className="sc-bubble sc-out sc-float">{text ?? "Thanks!"}</span>
        </div>
      );
    case "email":
      return (
        <div className="sc sc-email">
          <div className="sc-env">
            <span className="sc-letter">
              <b>{text ?? "New email"}</b>
              <i /><i />
            </span>
            <span className="sc-env-body" />
            <span className="sc-env-flap" />
          </div>
        </div>
      );
    case "form":
      return (
        <div className="sc sc-form">
          <Phone>
            <span className="sc-field" />
            <span className="sc-field" />
            <span className="sc-field" />
            <span className="sc-btn"><Check /></span>
          </Phone>
        </div>
      );
    case "qr":
      return (
        <div className="sc sc-qr">
          <div className="sc-poster"><span className="sc-qrcode" /></div>
          <Phone className="sc-qr-phone">
            <span className="sc-qrcode sc-qr-mini" />
            <span className="sc-scan" />
            <span className="sc-ok"><Check /></span>
          </Phone>
        </div>
      );
    case "camera":
      return (
        <div className="sc sc-camera">
          <Phone>
            <span className="sc-photo" />
            <span className="sc-flash" />
            <span className="sc-caption" />
          </Phone>
        </div>
      );
    case "approve":
      return (
        <div className="sc sc-approve">
          <div className="sc-doc">
            <span className="sc-doc-img" />
            <i /><i /><i />
            {text && <small>{text}</small>}
          </div>
          <span className="sc-stamp"><Check /></span>
        </div>
      );
    case "translate":
      return (
        <div className="sc sc-translate">
          <span className="sc-bubble sc-in sc-tr-a">{text}</span>
          <span className="sc-globe" aria-hidden="true">⇅</span>
          <span className="sc-bubble sc-out sc-tr-b">{text2}</span>
        </div>
      );
    case "route":
      return (
        <div className="sc sc-route">
          <span className="sc-tray" />
          <span className="sc-path" />
          <span className="sc-mail" />
          <span className="sc-people"><i /><i className="sc-me" /><i /></span>
        </div>
      );
    case "calendar":
      return (
        <div className="sc sc-calendar">
          <div className="sc-cal">
            <span className="sc-cal-top" />
            <div className="sc-cal-grid">{Array.from({ length: 21 }, (_, i) => <i key={i} />)}</div>
            <span className="sc-chip" />
          </div>
        </div>
      );
    case "rsvp":
      return (
        <div className="sc sc-rsvp">
          <Phone>
            <span className="sc-rsvp-card" />
            <span className="sc-counter">
              <b>−</b>
              <span className="sc-num"><span>1<br />2<br />3</span></span>
              <b>+</b>
            </span>
            <span className="sc-btn"><Check /></span>
          </Phone>
        </div>
      );
    case "fork":
      return (
        <div className="sc sc-fork">
          <span className="sc-fork-root" />
          <span className="sc-fork-line sc-up" />
          <span className="sc-fork-line sc-down" />
          <span className="sc-yes"><Check /></span>
          <span className="sc-no">✕</span>
        </div>
      );
    case "stop":
      return (
        <div className="sc sc-stop">
          <Phone>
            <span className="sc-toggle"><i /></span>
          </Phone>
          <span className="sc-bubble sc-out sc-float">STOP</span>
        </div>
      );
    case "print":
      return (
        <div className="sc sc-print">
          <span className="sc-printer" />
          <span className="sc-paper"><i /><i /><i /><i /></span>
          <span className="sc-printer-slot" />
        </div>
      );
    case "talk":
      return (
        <div className="sc sc-talk">
          <span className="sc-person sc-p1" />
          <span className="sc-person sc-p2" />
          <span className="sc-speech"><i /><i /><i /></span>
        </div>
      );
    case "bell":
      return (
        <div className="sc sc-bell">
          <Phone className="sc-lock" />
          <span className="sc-notice">
            <span className="sc-notice-ic"><Bell /></span>
            <span>{text ?? "New alert"}</span>
          </span>
        </div>
      );
    case "chart":
      return (
        <div className="sc sc-chart">
          <div className="sc-bars"><i /><i /><i /><i /><i /></div>
        </div>
      );
    case "home":
      return (
        <div className="sc sc-home">
          <div className="sc-building">{Array.from({ length: 12 }, (_, i) => <i key={i} className={i === 6 ? "sc-lit" : undefined} />)}</div>
          <span className="sc-tag">Available</span>
        </div>
      );
    case "call":
      return (
        <div className="sc sc-call">
          <span className="sc-ring" />
          <span className="sc-ring sc-ring2" />
          <span className="sc-handset"><Handset /></span>
        </div>
      );
    case "list":
      return (
        <div className="sc sc-list">
          <div className="sc-clip">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="sc-row">
                <span className="sc-box"><Check /></span>
                <i />
              </span>
            ))}
          </div>
        </div>
      );
    case "guide":
      return (
        <div className="sc sc-guide">
          <span className="sc-book" />
          <span className="sc-arrow">↓</span>
        </div>
      );
    case "send":
      return (
        <div className="sc sc-send">
          <span className="sc-hub" />
          {["web", "sms", "mail", "print"].map((k) => (
            <span key={k} className={`sc-spoke sc-sp-${k}`}><i /></span>
          ))}
          {text && <span className="sc-reach">{text}</span>}
        </div>
      );
    case "slip":
      return (
        <div className="sc sc-slip">
          <div className="sc-slip-paper"><i /><i /><i /></div>
          <span className="sc-pencil" />
        </div>
      );
    case "web":
      return (
        <div className="sc sc-web">
          <div className="sc-win">
            <span className="sc-win-bar"><i /><i /><i /></span>
            <span className="sc-win-hero" />
            <span className="sc-win-body">
              <span className="sc-field" />
              <span className="sc-field" />
              <span className="sc-btn"><Check /></span>
            </span>
          </div>
          <span className="sc-pointer" />
        </div>
      );
    case "chat":
      return (
        <div className="sc sc-chatw">
          <div className="sc-win">
            <span className="sc-win-bar"><i /><i /><i /></span>
            <span className="sc-win-hero" />
            <span />
          </div>
          <div className="sc-chatbox">
            <span className="sc-chatbox-head" />
            <span className="sc-bubble sc-out">{text ?? "Hi!"}</span>
            <span className="sc-dots"><i /><i /><i /></span>
            <span className="sc-bubble sc-in sc-answer"><i /><i /><i /></span>
          </div>
        </div>
      );
    case "build":
      return (
        <div className="sc sc-build">
          <span className="sc-piece sc-piece-photo" />
          <span className="sc-piece sc-piece-cal" />
          <span className="sc-piece sc-piece-menu" />
          <span className="sc-page" />
        </div>
      );
  }
}
