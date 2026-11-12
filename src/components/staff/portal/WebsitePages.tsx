"use client";

// Website → Pages: the pages people write, each with its owner and update rhythm, in a list like a website's page
// list. "Edit page" (or the page's name) opens the full-screen page editor here; Save puts it live on the website
// straight away, in every language. "Preview this page" opens the page on the public website in a new tab. Pages near
// their due date show "Going stale". Changes stay in this browser.
import { useState, useSyncExternalStore } from "react";
import type { Block, MediaItem } from "@/data/staff/blocks";
import type { SitePage } from "@/data/staff/website";
import { Icon } from "../../Icon";
import { Badge } from "../ui";
import { BlockEditor, type EditorDoc } from "./BlockEditor";

const noop = () => () => {};
const plain = (h: string) => h.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

export interface EditorSetup {
  media: MediaItem[];
  live: Block[];
  links: { title: string; path: string }[];
  owners: string[];
  canAssign: boolean;
  langs: string[];
  siteShort: string;
}

export function WebsitePages({ pages, site, showOwner = true, empty, editor, openId }: {
  pages: SitePage[]; site: string; showOwner?: boolean; empty?: string; editor: EditorSetup; openId?: string;
}) {
  const [rows, setRows] = useState(pages);
  const [open, setOpen] = useState<string | null>(openId && pages.some((p) => p.id === openId) ? openId : null);
  // "Update" in Freshness links here with ?edit=…: open that page's editor when the link changes.
  const [lastOpenId, setLastOpenId] = useState(openId);
  if (openId !== lastOpenId) {
    setLastOpenId(openId);
    if (openId && rows.some((p) => p.id === openId)) setOpen(openId);
  }
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  // The editor lives in a portal on document.body, so only draw it in the browser.
  const client = useSyncExternalStore(noop, () => true, () => false);

  if (!rows.length) return <p className="sx-empty">{empty ?? "No pages here."}</p>;

  const save = (id: string, d: EditorDoc) => {
    const first = d.blocks.find((b) => b.type === "paragraph");
    setRows((xs) => xs.map((x) => (x.id === id ? {
      ...x, title: d.title || x.title, blocks: d.blocks, rhythm: d.rhythm, ownerName: d.owner,
      text: first?.type === "paragraph" ? plain(first.html) || x.text : x.text,
      updated: "Just now", stale: false, dueIn: 99,
    } : x)));
    setSaved((x) => ({ ...x, [id]: true }));
  };
  const close = () => {
    setOpen(null);
    const u = new URL(window.location.href);
    if (u.searchParams.has("edit")) { u.searchParams.delete("edit"); window.history.replaceState(null, "", u); }
  };
  const editing = rows.find((p) => p.id === open);

  return (
    <>
      <ul className="ws-pages">
        {rows.map((p) => (
          <li key={p.id} className={`ws-page${p.stale && !saved[p.id] ? " stale" : ""}`}>
            <div className="ws-page-h">
              <span className="ws-page-t">
                <button type="button" className="ws-page-name" onClick={() => setOpen(p.id)}>{p.title}</button>
                <small>
                  {showOwner && <>{p.ownerName} · </>}
                  {p.rhythm} · updated {p.updated.toLowerCase()}
                </small>
              </span>
              <span className="ws-page-s">
                {saved[p.id] ? (
                  <Badge tone="good"><Icon name="check" /> Live</Badge>
                ) : p.stale ? (
                  <Badge tone="warn"><Icon name="clock" /> {p.dueIn <= 0 ? "Due now" : p.dueIn === 1 ? "Due tomorrow" : `Due in ${p.dueIn} days`}</Badge>
                ) : null}
              </span>
              <span className="ws-page-a">
                <button type="button" className="sx-btn sx-btn-sm" onClick={() => setOpen(p.id)} aria-label={`Edit page: ${p.title}`} aria-describedby="ws-edit-hint">
                  <Icon name="edit" /> Edit page
                </button>
                <a className="sx-btn sx-btn-sm sx-btn-quiet" href={`${site}${p.path}`} target="_blank" rel="noopener" aria-label={`Preview ${p.title} on the website (opens a new tab)`}>
                  <Icon name="eye" /> Preview this page
                </a>
              </span>
            </div>
            <p className="ws-page-x">{p.text}</p>
            {saved[p.id] && (
              <p className="ws-done">
                <Icon name="check" /> <span>Saved and live on the website · every language updated · <a className="sx-link" href={`${site}${p.path}`} target="_blank" rel="noopener">See it on the website</a></span>
              </p>
            )}
          </li>
        ))}
      </ul>
      {client && editing && (
        <BlockEditor
          key={editing.id}
          page={editing}
          site={site}
          {...editor}
          onSave={(d) => save(editing.id, d)}
          onClose={close}
        />
      )}
    </>
  );
}
