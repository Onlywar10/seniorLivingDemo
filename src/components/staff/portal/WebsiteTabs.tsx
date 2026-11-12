"use client";

// Website's tabs: Pages · Apartments and prices · Galleries · Resources · Freshness, opening on Pages (the most
// common job), so nobody scrolls past twelve floor plans to edit a page. Each role sees only the tabs it may use; with
// one tab there's no tab bar. "#apartments" or "#resources" in the link opens that tab; "?edit=…" opens Pages.
import { useState, useSyncExternalStore, type ReactNode } from "react";

const onHash = (f: () => void) => { window.addEventListener("hashchange", f); return () => window.removeEventListener("hashchange", f); };
const readHash = () => window.location.hash.slice(1);
const noHash = () => "";

export interface WebsiteTab { k: string; label: string; count?: number; node: ReactNode }

export function WebsiteTabs({ tabs, edit }: { tabs: WebsiteTab[]; edit?: string }) {
  const first = edit && tabs.some((t) => t.k === "pages") ? "pages" : tabs[0]?.k;
  const [k, setK] = useState(first);
  // A link to ?edit=… from Freshness goes to Pages, where the editor opens.
  const [lastEdit, setLastEdit] = useState(edit);
  if (edit !== lastEdit) {
    setLastEdit(edit);
    if (edit && tabs.some((t) => t.k === "pages")) setK("pages");
  }

  // The tab named in the link's #hash (also when a link on this page changes it).
  const hash = useSyncExternalStore(onHash, readHash, noHash);
  const [lastHash, setLastHash] = useState(hash);
  if (hash !== lastHash) {
    setLastHash(hash);
    if (tabs.some((t) => t.k === hash)) setK(hash);
  }

  const pick = (to: string) => {
    setK(to);
    const u = new URL(window.location.href);
    u.hash = to === tabs[0]?.k ? "" : to;
    window.history.replaceState(window.history.state, "", u);
  };

  return (
    <>
      {tabs.length > 1 && (
        <nav className="rs-tabs ws-tabs" aria-label="Website">
          {tabs.map((t) => (
            <button key={t.k} type="button" aria-current={k === t.k ? "page" : undefined} onClick={() => pick(t.k)}>
              {t.label}{t.count ? <small>{t.count}</small> : null}
            </button>
          ))}
        </nav>
      )}
      {tabs.map((t) => <div key={t.k} id={`ws-tab-${t.k}`} hidden={k !== t.k} className="ws-panel">{t.node}</div>)}
    </>
  );
}
