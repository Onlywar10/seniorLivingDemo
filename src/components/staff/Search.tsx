"use client";

// Search everywhere, from the top bar: a resident, a family member (opens their resident), an event, a website page or a prospect. "/" or Ctrl+K opens it;
// arrows and Enter pick a result. Only what the signed-in person can see is searchable.
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Found } from "@/data/staff/portal";
import { Icon } from "../Icon";

const kindLabel: Record<Found["k"], string> = { resident: "Residents", family: "Family", event: "Events", page: "Website pages", prospect: "Prospects" };
const kindIcon = { resident: "users", family: "heart", event: "calendar", page: "globe", prospect: "phone" } as const;

export function Search({ items }: { items: Found[] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
      if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !typing)) { e.preventDefault(); setOpen(true); }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const hits = words.length
    ? items.filter((x) => words.every((w) => `${x.title} ${x.sub}`.toLowerCase().includes(w)))
        .sort((a, b) => Number(!a.title.toLowerCase().startsWith(words[0])) - Number(!b.title.toLowerCase().startsWith(words[0])))
        .slice(0, 12)
    : [];
  const go = (x: Found) => { setOpen(false); setQ(""); router.push(x.href); };
  const groups = (["resident", "family", "event", "page", "prospect"] as const).map((k) => ({ k, xs: hits.filter((h) => h.k === k) })).filter((g) => g.xs.length);
  const flat = groups.flatMap((g) => g.xs);

  return (
    <>
      <button type="button" className="sx-search-btn" onClick={() => setOpen(true)} aria-label="Search residents, family, events">
        <Icon name="search" /> <span>Search</span> <kbd>/</kbd>
      </button>
      {open && (
        <div className="sx-search" role="dialog" aria-modal="true" aria-label="Search" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="sx-search-box">
            <label className="sx-search-in">
              <Icon name="search" />
              <span className="vh">Search</span>
              <input
                ref={input}
                autoFocus
                value={q}
                onChange={(e) => { setQ(e.target.value); setI(0); }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setI((x) => Math.min(flat.length - 1, x + 1)); }
                  if (e.key === "ArrowUp") { e.preventDefault(); setI((x) => Math.max(0, x - 1)); }
                  if (e.key === "Enter" && flat[i]) go(flat[i]);
                }}
                placeholder="A resident, family member, event, page or prospect"
                role="combobox"
                aria-expanded={flat.length > 0}
                aria-controls="sx-search-list"
                aria-activedescendant={flat[i] ? `sx-hit-${i}` : undefined}
              />
              <button type="button" className="sx-x" onClick={() => setOpen(false)} aria-label="Close search"><Icon name="x" /></button>
            </label>
            <div id="sx-search-list" role="listbox" aria-label="Results">
              {!words.length && <p className="sx-search-hint">Try a resident’s name, “Barbecue”, or a family member.</p>}
              {words.length > 0 && !flat.length && <p className="sx-search-hint">Nothing called “{q}”.</p>}
              {groups.map((g) => (
                <div key={g.k}>
                  <h3>{kindLabel[g.k]}</h3>
                  <ul>
                    {g.xs.map((x) => {
                      const n = flat.indexOf(x);
                      return (
                        <li key={x.k + x.title + x.sub} id={`sx-hit-${n}`} role="option" aria-selected={n === i}>
                          <button type="button" onClick={() => go(x)} onMouseEnter={() => setI(n)}>
                            <Icon name={kindIcon[x.k]} />
                            <span><b>{x.title}</b><small>{x.sub}</small></span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
