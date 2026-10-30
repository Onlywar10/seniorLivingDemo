"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { useT } from "@/i18n/client";
import type { FaqGroup } from "@/data/shared";
import { useCommunity } from "@/lib/community";

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function FaqSearch({ groups: source }: { groups: FaqGroup[] }) {
  const { t } = useT();
  const { site } = useCommunity();
  const [q, setQ] = useState("");
  // Search the questions in the page language; anchors keep the English slug.
  const groups = useMemo(
    () => source.map((g) => ({ ...g, id: slug(g.title), title: t(g.title), items: g.items.map((i) => ({ q: t(i.q), a: t(i.a) })) })),
    [source, t],
  );
  const filtered = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return groups;
    return groups
      .map((g) => ({ ...g, items: g.items.filter((i) => terms.every((w) => (i.q + " " + i.a).toLowerCase().includes(w))) }))
      .filter((g) => g.items.length);
  }, [q, groups]);
  const total = filtered.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="inf-faq">
      <nav className="inf-faq-nav" aria-label={t("FAQ topics")}>
        <div className="field">
          <label htmlFor="faq-q">{t("Search questions")}</label>
          <div className="inf-search">
            <Icon name="search" />
            <input id="faq-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Try “pets” or “parking”")} autoComplete="off" />
          </div>
        </div>
        <ul>
          {groups.map((g) => (
            <li key={g.id}>
              <a href={`#${g.id}`}>{g.title}</a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="inf-faq-list">
        <p className="small muted" aria-live="polite">
          {q ? (total ? t(`${total} matching ${total === 1 ? "question" : "questions"}`) : t(`No questions match that search. Try another word, or call us at ${site.phone}.`)) : ""}
        </p>
        {filtered.map((g) => (
          <section key={g.id} id={g.id} className="inf-faq-group">
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
