"use client";

import { useState } from "react";
import { communities } from "@/data/group";
import { library } from "@/data/staff";
import { Icon } from "../Icon";

export function ShareAcross() {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [to, setTo] = useState<string[]>(communities.map((c) => c.slug));
  return (
    <>
      <button className="sx-btn sx-btn-primary" type="button" onClick={() => { setOpen(true); setDone(false); }}>
        <Icon name="share" /> Share content across communities
      </button>
      {open && (
        <div className="sx-modal" role="dialog" aria-modal="true" aria-label="Share content">
          <div className="sx-modal-box sx-card">
            <header className="sx-card-head">
              <div>
                <h2>Share across communities</h2>
                <p>Each community gets its own copy to adjust: times, rooms, names.</p>
              </div>
              <button className="sx-btn" type="button" onClick={() => setOpen(false)} aria-label="Close">
                <Icon name="x" />
              </button>
            </header>
            <div className="sx-card-body sx-form">
              {done ? (
                <div className="pub-ocr">
                  <b>
                    <Icon name="check" /> Shared with {to.length} communities.
                  </b>
                  <span>Each Life Enrichment Director has it in their calendar drafts, ready to set a time.</span>
                </div>
              ) : (
                <>
                  <label>
                    What to share
                    <select defaultValue={library[1].title}>
                      {library.map((l) => (
                        <option key={l.title}>{l.title}</option>
                      ))}
                    </select>
                  </label>
                  <div className="pub-aud">
                    {communities.map((c) => (
                      <label key={c.slug}>
                        <input type="checkbox" checked={to.includes(c.slug)} onChange={(e) => setTo(e.target.checked ? [...to, c.slug] : to.filter((x) => x !== c.slug))} /> {c.name}
                      </label>
                    ))}
                  </div>
                  <label className="sx-check">
                    <input type="checkbox" defaultChecked /> Let each community edit their copy
                  </label>
                  <button className="sx-btn sx-btn-primary sx-btn-lg" type="button" onClick={() => setDone(true)}>
                    Share with {to.length} communities
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
