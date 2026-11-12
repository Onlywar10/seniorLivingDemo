"use client";

// Website → Languages: the site and event pages are translated automatically. A language can be set to wait for a
// person to check new pages before they publish. Changes stay in this browser.
import { useState } from "react";
import { Icon } from "../../Icon";

const codes: Record<string, string> = { Spanish: "es", Russian: "ru", Vietnamese: "vi", Tagalog: "tl", Chinese: "zh", Mandarin: "zh", Cantonese: "yue", Korean: "ko", Punjabi: "pa", Hindi: "hi", Armenian: "hy", Farsi: "fa", Japanese: "ja" };

export interface SiteLanguage { lang: string; families: number; sample?: string }

export function WebsiteLanguages({ langs, canChange }: { langs: SiteLanguage[]; canChange: boolean }) {
  const [review, setReview] = useState<Record<string, boolean>>({});
  return (
    <ul className="sx-list ws-langs">
      {langs.map((l) => (
        <li key={l.lang}>
          <div className="ws-lang-h">
            <span><b>{l.lang}</b><small>{l.families} {l.families === 1 ? "family" : "families"} · {review[l.lang] ? "checked first" : "automatic"}</small></span>
            {canChange && (
              <label className="sx-switch">
                <input type="checkbox" checked={!!review[l.lang]} onChange={(e) => setReview((r) => ({ ...r, [l.lang]: e.target.checked }))} />
                Check first
              </label>
            )}
          </div>
          {l.sample && <p className="ws-lang-x" lang={codes[l.lang]}><Icon name="translate" /> {l.sample}</p>}
        </li>
      ))}
    </ul>
  );
}
