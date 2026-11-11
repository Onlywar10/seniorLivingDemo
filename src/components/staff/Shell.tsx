"use client";

// The staff workspace frame: sections organised by job, shown according to who is signed in, with one
// "waiting" number (on Today). On a phone the main sections sit in a tab bar at the bottom; the rest open from "More".
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useEffect, useState, useTransition, type ReactNode } from "react";
import { AS_COOKIE, accessLabel, accessOf, sectionsFor, type Section, type StaffRole } from "@/data/staff/shared";
import { staffPeople } from "@/data/staff/people";
import { Icon } from "../Icon";
import { CommunitySwitcher, useStaffCommunity } from "./StaffCommunity";
import { XIcon } from "./ui";

type IconName = Parameters<typeof Icon>[0]["name"];
interface Me { as: StaffRole; key: string; name: string; first: string; title: string; preset: string }

const info: Record<Section, { href: string; label: string; icon?: IconName; x?: "shield" | "door"; hint: string }> = {
  today: { href: "/staff/today", label: "Today", icon: "sun", hint: "What needs you" },
  post: { href: "/staff/post", label: "Post", icon: "send", hint: "Say it once, everywhere" },
  calendar: { href: "/staff/calendar", label: "Calendar", icon: "calendar", hint: "Events and sign-ups" },
  menus: { href: "/staff/menus", label: "Menus", icon: "fork", hint: "Every restaurant, every day" },
  newsletter: { href: "/staff/newsletter", label: "Newsletter", icon: "mail", hint: "Written for you each week" },
  website: { href: "/staff/website", label: "Website", icon: "globe", hint: "Pages, apartments, galleries" },
  people: { href: "/staff/people", label: "People", icon: "users", hint: "Residents and families" },
  feedback: { href: "/staff/feedback", label: "Feedback", icon: "heart", hint: "Ideas, concerns, thank-yous" },
  prospects: { href: "/staff/prospects", label: "Prospects", x: "door", hint: "Inquiries, tours, waitlist" },
  reports: { href: "/staff/reports", label: "Reports", icon: "chart", hint: "Read monthly" },
  settings: { href: "/staff/settings", label: "Settings", x: "shield", hint: "Team, alerts, print" },
};

const ico = (s: Section) => (info[s].icon ? <Icon name={info[s].icon!} /> : <XIcon name={info[s].x!} />);

/** Signs in as someone else (the events lead, sales or the manager) and rebuilds the screen for them. */
function useSignInAs() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return {
    pending,
    go: (as: StaffRole) => {
      document.cookie = `${AS_COOKIE}=${as}; path=/; max-age=31536000; samesite=lax`;
      start(() => router.refresh());
    },
  };
}

export function Shell({ children, me, people, waiting }: { children: ReactNode; me: Me; people: Me[]; waiting: number }) {
  const path = usePathname();
  const { scope, current, site } = useStaffCommunity();
  const name = current ? current.name : "Wrenhaven Senior Living";
  const sections = sectionsFor[me.as];
  const [open, setOpen] = useState(false);
  const [who, setWho] = useState(false);
  const { go, pending } = useSignInAs();
  const on = (s: Section) => path === info[s].href || path.startsWith(info[s].href + "/");
  const color = staffPeople[me.key]?.color ?? "var(--terra-deep)";
  const initials = staffPeople[me.key]?.initials ?? me.first[0];
  // Phone tab bar: the person's four most-used sections; everything else under "More".
  const tabs = (["today", "post", "calendar", "menus", "people", "prospects", "website"] as Section[]).filter((s) => sections.includes(s)).slice(0, 4);

  useEffect(() => {
    if (!open && !who) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      setWho(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, who]);

  return (
    <div className={`sx ${open ? "nav-open" : ""}`} data-no-translate data-as={me.as}>
      <a className="sx-skip" href="#sx-main">
        Skip to content
      </a>
      <aside className="sx-side" id="sx-nav" aria-label="Staff navigation">
        <div className="sx-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/brand/dots.png" alt="" width={38} height={38} />
          <span>
            <b>{name}</b>
            <span>Team</span>
          </span>
          <button type="button" className="sx-close" aria-label="Close menu" onClick={() => setOpen(false)}>
            <Icon name="x" />
          </button>
        </div>
        <CommunitySwitcher />
        <nav className="sx-nav">
          <ul>
            {sections.map((s) => (
              <li key={s}>
                <Link href={info[s].href} onClick={() => setOpen(false)} aria-current={on(s) ? "page" : undefined}>
                  {ico(s)}
                  <span className="sx-nav-t">
                    <span>{info[s].label}</span>
                    {accessLabel[accessOf(me.as, s) ?? "full"] && <small className="pt-nav-part">{accessLabel[accessOf(me.as, s) ?? "full"]}</small>}
                  </span>
                  {s === "today" && waiting > 0 && (
                    <span className="sx-nav-badge">
                      {waiting}
                      <span className="vh"> waiting for you</span>
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Link className="sx-kinlight" href="/kinlight" title="Kinlight, the platform this workspace runs on">
          <i aria-hidden="true" />
          <span>Powered by <b>Kinlight</b></span>
        </Link>
        <div className="sx-user pt-user">
          <button type="button" className="pt-user-btn" aria-expanded={who} aria-controls="pt-who" onClick={() => setWho((w) => !w)} aria-busy={pending || undefined}>
            <span className="sx-avatar" style={{ background: color }} aria-hidden="true">
              {initials}
            </span>
            <span className="sx-user-t">
              <b>{me.name}</b>
              <span>{pending ? "Switching…" : `${me.title} · ${me.preset}`}</span>
            </span>
            <Icon name="chev" />
          </button>
          {who && (
            <div className="pt-who" id="pt-who">
              <p>Signed in as</p>
              <ul>
                {people.map((p) => (
                  <li key={p.as}>
                    <button
                      type="button"
                      aria-current={p.as === me.as ? "true" : undefined}
                      onClick={() => {
                        setWho(false);
                        if (p.as !== me.as) go(p.as);
                      }}
                    >
                      <b>{p.name}</b>
                      <span>{p.title} · {p.preset}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <Link href="/staff" className="pt-who-out">
                <Icon name="logout" /> Sign out
              </Link>
            </div>
          )}
        </div>
      </aside>
      <div className="sx-main">
        <div className="sx-top">
          <button type="button" className="sx-burger" aria-label="Open menu" aria-expanded={open} aria-controls="sx-nav" onClick={() => setOpen(true)}>
            <Icon name="menu" />
          </button>
          <Link href="/staff/today" className="sx-top-brand" aria-label="Today">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/brand/dots.png" alt="" width={28} height={28} />
            <span>{name}</span>
          </Link>
          <div className="sx-top-right">
            {!on("today") && !on("post") && (
              <Link href="/staff/post" className="sx-btn sx-btn-primary sx-top-post" aria-label="Post something">
                <Icon name="plus" /> <span>Post</span>
              </Link>
            )}
            {scope !== "all" && (
              <Link href={site("/")} className="sx-site" target="_blank" rel="noopener" aria-label="View website (opens in a new tab)">
                <Icon name="globe" /> <span>View website</span>
              </Link>
            )}
          </div>
        </div>
        <main className="sx-page" id="sx-main">
          {/* Remount the screen when the community or the person changes, so each starts from their own data. */}
          <Fragment key={`${scope}-${me.as}`}>{children}</Fragment>
        </main>
      </div>
      <nav className="pt-tabs" aria-label="Sections">
        {tabs.map((s) => (
          <Link key={s} href={info[s].href} aria-current={on(s) ? "page" : undefined}>
            {ico(s)}
            <span>{info[s].label}</span>
            {s === "today" && waiting > 0 && <i aria-label={`${waiting} waiting for you`}>{waiting}</i>}
          </Link>
        ))}
        <button type="button" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="sx-nav">
          <Icon name="menu" />
          <span>More</span>
        </button>
      </nav>
      {open && <button type="button" className="sx-scrim" aria-label="Close menu" tabIndex={-1} onClick={() => setOpen(false)} />}
    </div>
  );
}
