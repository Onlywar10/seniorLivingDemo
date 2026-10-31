"use client";

// Which community the staff screens show. The server reads the `wh-staff-community` cookie
// (src/data/staff/server.ts) and the staff layout passes it here for client components.
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, useTransition, type KeyboardEvent, type ReactNode } from "react";
import type { CommunitySlug } from "@/lib/sites";
import { STAFF_COOKIE, siteHref, type StaffScope } from "@/data/staff/shared";
import { Icon } from "../Icon";

export interface StaffCommunityOption { slug: CommunitySlug; name: string; short: string; city: string }

interface Ctx {
  scope: StaffScope;
  options: StaffCommunityOption[];
  /** The selected community, or null in the Wrenhaven overview. */
  current: StaffCommunityOption | null;
  /** A page on the selected community's public website: site("/calendar") → "/kestrel-point/calendar". */
  site: (path?: string) => string;
}

const StaffCommunityContext = createContext<Ctx | null>(null);

export function StaffCommunityProvider({ scope, options, children }: { scope: StaffScope; options: StaffCommunityOption[]; children: ReactNode }) {
  const value: Ctx = {
    scope,
    options,
    current: options.find((o) => o.slug === scope) ?? null,
    site: (path = "/") => siteHref(scope, path),
  };
  return <StaffCommunityContext.Provider value={value}>{children}</StaffCommunityContext.Provider>;
}

export function useStaffCommunity(): Ctx {
  const ctx = useContext(StaffCommunityContext);
  if (!ctx) throw new Error("useStaffCommunity must be used inside StaffCommunityProvider");
  return ctx;
}

/** Sets the cookie and re-renders the current screen for the new community. */
function useSwitch() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const go = (to: StaffScope) => {
    document.cookie = `${STAFF_COOKIE}=${to}; path=/; max-age=31536000; samesite=lax`;
    start(() => router.refresh());
  };
  return { go, pending };
}

const ALL_LABEL = "All communities";

/** The community switcher at the top of the staff sidebar. A disclosure button with a list of choices; arrow keys move between them. */
export function CommunitySwitcher() {
  const { scope, options, current } = useStaffCommunity();
  const { go, pending } = useSwitch();
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const choices: { v: StaffScope; name: string; sub: string }[] = [
    ...options.map((o) => ({ v: o.slug as StaffScope, name: o.name, sub: o.city })),
    { v: "all", name: ALL_LABEL, sub: "Wrenhaven overview" },
  ];

  useEffect(() => {
    if (!open) return;
    const sel = list.current?.querySelector<HTMLButtonElement>('button[aria-current="true"]') ?? list.current?.querySelector<HTMLButtonElement>("button");
    sel?.focus();
  }, [open]);

  const close = (focus = true) => {
    setOpen(false);
    if (focus) btn.current?.focus();
  };
  const choose = (v: StaffScope) => {
    close();
    if (v !== scope) go(v);
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape" && open) {
      e.preventDefault();
      e.stopPropagation();
      close();
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    const items = [...(list.current?.querySelectorAll<HTMLButtonElement>("button") ?? [])];
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    const next = e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : (i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
    e.preventDefault();
    items[next]?.focus();
  };

  return (
    <div
      className="sx-comm"
      onKeyDown={onKey}
      onBlur={(e) => {
        if (open && !e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <span className="sx-comm-l" id="sx-comm-l">Community</span>
      <button
        ref={btn}
        type="button"
        className="sx-comm-btn"
        aria-expanded={open}
        aria-controls="sx-comm-list"
        aria-describedby="sx-comm-l"
        aria-busy={pending || undefined}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="sx-comm-t">
          <b>{current ? current.name : ALL_LABEL}</b>
          <span>{pending ? "Switching…" : current ? current.city : "Wrenhaven overview"}</span>
        </span>
        <Icon name="chev" />
      </button>
      {open && (
        <ul className="sx-comm-list" id="sx-comm-list" ref={list} aria-label="Choose a community">
          {choices.map((ch) => (
            <li key={ch.v}>
              <button type="button" aria-current={ch.v === scope ? "true" : undefined} onClick={() => choose(ch.v)}>
                <span className="sx-comm-t">
                  <b>{ch.name}</b>
                  <span>{ch.sub}</span>
                </span>
                {ch.v === scope && <Icon name="check" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** "Open" a community from the Wrenhaven overview: switches to it and stays on this screen. */
export function OpenCommunity({ slug, name, className = "sx-btn sx-btn-sm sx-btn-primary" }: { slug: CommunitySlug; name: string; className?: string }) {
  const { go, pending } = useSwitch();
  return (
    <button type="button" className={className} onClick={() => go(slug)} disabled={pending} aria-label={`Open ${name}`}>
      {pending ? "Opening…" : "Open"}
    </button>
  );
}

/** Shown on single-community screens while the Wrenhaven overview is selected. */
export function PickCommunity({ screen }: { screen: string }) {
  const { options } = useStaffCommunity();
  const { go, pending } = useSwitch();
  return (
    <>
      <header className="sx-head">
        <div>
          <h1>{screen}</h1>
          <p>You’re looking at all communities. {screen} belongs to one community at a time, so pick one to continue.</p>
        </div>
      </header>
      <section className="sx-card">
        <div className="sx-card-body sx-pick">
          {options.map((o) => (
            <button key={o.slug} type="button" className="sx-btn sx-btn-lg" onClick={() => go(o.slug)} disabled={pending}>
              <Icon name="building" />
              <span className="sx-comm-t">
                <b>{o.name}</b>
                <span>{o.city}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
