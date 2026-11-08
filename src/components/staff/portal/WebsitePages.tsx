"use client";

// Website → Pages and Resources: the pages people write, each with its owner and update rhythm. Edit a page's words in
// place and save: it's live on the website straight away. Pages near their due date show "Going stale". Changes stay
// in this browser.
import { useState } from "react";
import type { SitePage } from "@/data/staff/website";
import { Icon } from "../../Icon";
import { Badge } from "../ui";

export function WebsitePages({ pages, site, showOwner = true, empty }: { pages: SitePage[]; site: string; showOwner?: boolean; empty?: string }) {
  const [rows, setRows] = useState(pages);
  const [open, setOpen] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  if (!rows.length) return <p className="sx-empty">{empty ?? "No pages here."}</p>;

  const save = (p: SitePage) => {
    setRows((xs) => xs.map((x) => (x.id === p.id ? { ...x, text: draft.trim() || x.text, updated: "Just now", stale: false, dueIn: 99 } : x)));
    setSaved((x) => ({ ...x, [p.id]: true }));
    setOpen(null);
  };

  return (
    <ul className="ws-pages">
      {rows.map((p) => {
        const editing = open === p.id;
        return (
          <li key={p.id} className={`ws-page${p.stale ? " stale" : ""}${editing ? " open" : ""}`}>
            <div className="ws-page-h">
              <span className="ws-page-t">
                <b>{p.title}</b>
                <small>
                  {showOwner && <>{p.ownerName} · </>}
                  {p.rhythm} · updated {p.updated.toLowerCase()}
                </small>
              </span>
              <span className="ws-page-s">
                {saved[p.id] ? (
                  <Badge tone="good"><Icon name="check" /> Live on the website</Badge>
                ) : p.stale ? (
                  <Badge tone="warn"><Icon name="clock" /> Going stale{p.dueIn <= 0 ? ": due now" : p.dueIn === 1 ? ": due tomorrow" : `: due in ${p.dueIn} days`}</Badge>
                ) : (
                  <Badge tone="neutral">Up to date</Badge>
                )}
              </span>
              <span className="ws-page-a">
                {!editing && (
                  <button type="button" className="sx-btn sx-btn-sm" onClick={() => { setOpen(p.id); setDraft(p.text); }} aria-label={`Edit ${p.title}`}>
                    <Icon name="edit" /> Edit
                  </button>
                )}
                <a className="sx-btn sx-btn-sm sx-btn-quiet" href={`${site}${p.path}`} target="_blank" rel="noopener" aria-label={`Open ${p.title} on the website`}>
                  <Icon name="eye" /> View
                </a>
              </span>
            </div>
            {editing ? (
              <form className="ws-edit sx-form" onSubmit={(e) => { e.preventDefault(); save(p); }}>
                <label>
                  <span className="vh">Words on the {p.title} page</span>
                  <textarea rows={4} value={draft} onChange={(e) => setDraft(e.target.value)} />
                </label>
                {p.fills && <p className="pt-hint"><Icon name="sparkle" /> {p.fills} You only write the words.</p>}
                <div className="pt-act">
                  <button type="submit" className="sx-btn sx-btn-primary"><Icon name="check" /> Save: it goes live</button>
                  <button type="button" className="sx-btn" onClick={() => setOpen(null)}>Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <p className="ws-page-x">{p.text}</p>
                {saved[p.id] && <p className="ws-done"><Icon name="check" /> Saved just now. It’s live on the website, and the Spanish and other language versions are updated too.</p>}
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}
