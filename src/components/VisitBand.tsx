"use client";

// "See it for yourself": the two ways in, on every main page of a community's site. Schedule a tour goes to the tour
// page; Chat with us opens the website chat (the same one in the corner), ready for a question.
import { useId } from "react";
import Link from "@/i18n/Link";
import { useT } from "@/i18n/client";
import { Icon } from "./Icon";
import { Dots } from "./Logo";

/** Ask the website chat to open (ChatWidget listens for this). */
export const OPEN_CHAT = "wh-open-chat";
export const openChat = () => window.dispatchEvent(new CustomEvent(OPEN_CHAT));

export function VisitBand({ title = "See it for yourself", text = "Book a tour at a time that suits you, or chat with us now about apartments, care and what life is like here." }: { title?: string; text?: string }) {
  const { t } = useT();
  const id = useId();
  return (
    <section className="sec tone-green visit-band" aria-labelledby={id}>
      <Dots size={220} style={{ right: -60, top: -50, opacity: 0.3 }} />
      <div className="wrap visit-band-inner">
        <div>
          <p className="eyebrow light">{t("Come and see")}</p>
          <h2 id={id}>{t(title)}</h2>
          <p className="visit-band-text">{t(text)}</p>
        </div>
        <div className="btn-row">
          <Link className="btn btn-light btn-lg" href="/tour">
            <Icon name="calendar" /> {t("Schedule a tour")}
          </Link>
          <button type="button" className="btn btn-outline-light btn-lg" onClick={openChat}>
            <Icon name="sms" /> {t("Chat with us")}
          </button>
        </div>
      </div>
    </section>
  );
}
