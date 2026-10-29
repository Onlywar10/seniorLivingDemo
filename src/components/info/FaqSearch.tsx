"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import type { FaqGroup } from "@/data/info";

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function FaqSearch({ groups }: { groups: FaqGroup[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return groups;
    return groups
      .map((g) => ({ ...g, items: g.items.filter((i) => terms.every((t) => (i.q + " " + i.a).toLowerCase().includes(t))) }))
      .filter((g) => g.items.length);
  }, [q, groups]);
  const total = filtered.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="inf-faq">
      <nav className="inf-faq-nav" aria-label="FAQ topics">
        <div className="field">
          <label htmlFor="faq-q">Search questions</label>
          <div className="inf-search">
            <Icon name="search" />
            <input id="faq-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try “pets” or “parking”" autoComplete="off" />
          </div>
        </div>
        <ul>
          {groups.map((g) => (
            <li key={g.title}>
              <a href={`#${slug(g.title)}`}>{g.title}</a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="inf-faq-list">
        <p className="small muted" aria-live="polite">
          {q ? (total ? `${total} matching ${total === 1 ? "question" : "questions"}` : "No questions match that search. Try another word, or call us at (916) 458-0303.") : ""}
        </p>
        {filtered.map((g) => (
          <section key={g.title} id={slug(g.title)} className="inf-faq-group">
            <h2>{g.title}</h2>
            {g.items.map((i) => (
              <details key={i.q} className="inf-qa" open={!!q}>
                <summary>
                  <span>{i.q}</span>
                  <Icon name="plus" />
                </summary>
                <p>{i.a}</p>
              </details>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
