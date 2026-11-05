"use client";

// Tours & enquiries: every prospect, and beside them the phone showing exactly what they received from us:
// the instant reply text and email after an inquiry, the tour confirmation and the day-before reminder,
// or the thank-you after a public event sign-up. New sign-ups from the website's open house form appear at the top.
import { useMemo, useState, useSyncExternalStore } from "react";
import { MailMessage, Phone, SmsThread } from "../phone/Phone";
import { signupMessages, type ProspectCtx, type ProspectMessage } from "./prospects";
import { Badge } from "./ui";

export interface Prospect {
  id: string;
  name: string;
  source: string;
  interest: string;
  status: "New" | "Contacted" | "Tour booked" | "Nurturing";
  when: string;
  note?: string;
  contact?: string;
  msgs: ProspectMessage[];
  fresh?: boolean;
}

const statusTone = { New: "accent", Contacted: "info", "Tour booked": "good", Nurturing: "neutral" } as const;

/* ------------------------------------------------------------ open house sign-ups from the public website (this browser) */

interface WebSignup { slug: string; eventId: string; eventTitle: string; date: string; start: number; name: string; phone: string; email: string; party: number; at: number }

const KEY = "wh-public-signups";
const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  window.addEventListener("focus", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("focus", cb);
  };
};
const read = () => {
  try {
    return localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
};
const stamp = (at: number) =>
  new Date(at).toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" }).replace(" AM", " am").replace(" PM", " pm");

export function ProspectInbox({ prospects, slug, ctx }: { prospects: Prospect[]; slug: string; ctx: ProspectCtx }) {
  const raw = useSyncExternalStore(subscribe, read, () => "[]");
  const fresh = useMemo<Prospect[]>(() => {
    try {
      const list = JSON.parse(raw);
      if (!Array.isArray(list)) return [];
      return (list as WebSignup[])
        .filter((x) => x && x.slug === slug && x.name && x.eventTitle)
        .sort((a, b) => b.at - a.at)
        .map((x, i) => ({
          id: `web-${x.at}-${i}`,
          name: x.name,
          source: "Website: Open House sign-up",
          interest: x.eventTitle,
          status: "New" as const,
          when: `Signed up ${stamp(x.at)}`,
          note: `${x.party > 1 ? `Party of ${x.party}` : "Coming alone"}`,
          contact: [x.phone, x.email].filter(Boolean).join(" · "),
          msgs: signupMessages(ctx, { name: x.name, eventTitle: x.eventTitle, date: x.date, start: x.start, party: x.party, at: stamp(x.at) }),
          fresh: true,
        }));
    } catch {
      return [];
    }
  }, [raw, slug, ctx]);

  const all = useMemo(() => [...fresh, ...prospects], [fresh, prospects]);
  const [selId, setSelId] = useState<string | null>(null);
  const [view, setView] = useState<"text" | "email">("text");
  const sel = all.find((p) => p.id === selId) ?? all[0];
  const texts = sel.msgs.filter((m) => m.channel === "Text");
  const email = sel.msgs.find((m) => m.channel === "Email");
  const initials = ctx.site.split(" ").map((w) => w[0]).join("").slice(0, 2);

  return (
    <div className="prs">
      <ul className="prs-list" aria-label="Prospects">
        {all.map((p) => (
          <li key={p.id}>
            <button type="button" aria-pressed={sel.id === p.id} onClick={() => setSelId(p.id)}>
              <span className="top">
                <b>{p.name}</b>
                <Badge tone={statusTone[p.status]}>{p.status}</Badge>
              </span>
              <span className="sub">{p.interest} · {p.source}</span>
              <span className="snip">{p.note ? `“${p.note}”` : p.when}</span>
              <small>{p.when}{p.contact ? ` · ${p.contact}` : ""}</small>
            </button>
          </li>
        ))}
      </ul>
      <div className="prs-phone">
        <div className="sx-seg" role="group" aria-label="Show">
          <button type="button" aria-pressed={view === "text"} onClick={() => setView("text")}>Texts ({texts.length})</button>
          <button type="button" aria-pressed={view === "email"} onClick={() => setView("email")} disabled={!email}>Email</button>
        </div>
        <Phone size="sm" time="9:41" label={`What ${sel.name} received`}>
          {view === "email" && email ? (
            <MailMessage from={ctx.site} address={`hello@${ctx.domain}`} to={sel.name} subject={email.subject ?? ""} time={email.at}>
              <div className="ph-em">
                <div className="ph-em-banner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/img/brand/dots.png" alt="" />
                  {ctx.site}
                </div>
                {email.text.split("\n\n").map((para, i) => <p key={i} className="ph-em-p" style={{ whiteSpace: "pre-line" }}>{para}</p>)}
                <span className="ph-em-btn">Book a tour</span>
                <p className="ph-em-foot">{ctx.site} · {ctx.address} · {ctx.phone}</p>
              </div>
            </MailMessage>
          ) : (
            <SmsThread name={ctx.site} sub={ctx.phone} initials={initials} bubbles={texts.map((m) => ({ time: m.at, text: m.text }))} />
          )}
        </Phone>
        <p className="sx-hint">Sent automatically, day or night. {ctx.rep} is told within 5 minutes.</p>
      </div>
    </div>
  );
}
