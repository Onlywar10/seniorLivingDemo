"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";

export interface GuideItem { title: string; pages: number; photo: string; lede: string; points: string[] }

export function GuideLibrary({ guides }: { guides: GuideItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const [who, setWho] = useState<{ name: string; email: string } | null>(null);
  const [sent, setSent] = useState<number[]>([]);
  const dlg = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    if (open != null && !d.open) d.showModal();
    if (open == null && d.open) d.close();
  }, [open]);

  const g = open != null ? guides[open] : null;
  const isSent = open != null && sent.includes(open);

  function request(i: number) {
    setOpen(i);
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setWho({ name: String(f.get("name") ?? ""), email: String(f.get("email") ?? "") });
    setSent((s) => [...s, open!]);
  }

  return (
    <>
      <ul className="inf-guides">
        {guides.map((x, i) => (
          <li key={x.title} className="card inf-guide">
            <div className="inf-guide-cover">
              <Image src={x.photo} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 960px) 50vw, 33vw" />
              <span className="inf-guide-badge">
                <Icon name="doc" /> {x.pages} pages
              </span>
            </div>
            <div className="card-pad inf-guide-body">
              <h3>{x.title}</h3>
              <p className="small muted">{x.lede}</p>
              <button type="button" className="btn btn-sm btn-green" onClick={() => request(i)}>
                {sent.includes(i) ? (
                  <>
                    <Icon name="eye" /> Read it again
                  </>
                ) : (
                  <>
                    <Icon name="download" /> Get the free guide
                  </>
                )}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <dialog ref={dlg} className="inf-dialog" aria-labelledby="inf-dlg-h" onClose={() => setOpen(null)}>
        {g && (
          <div className="inf-dlg-inner">
            <button type="button" className="inf-dlg-x" aria-label="Close" onClick={() => setOpen(null)}>
              <Icon name="x" />
            </button>
            {!isSent ? (
              <>
                <p className="eyebrow">Free guide · {g.pages} pages</p>
                <h2 id="inf-dlg-h">{g.title}</h2>
                <p className="muted small">Tell us where to send it. We’ll email the full guide right away, and you can start reading here.</p>
                <form className="form-grid" onSubmit={submit}>
                  <div className="field full">
                    <label htmlFor="gd-name">Your name</label>
                    <input id="gd-name" name="name" autoComplete="name" required defaultValue={who?.name} />
                  </div>
                  <div className="field full">
                    <label htmlFor="gd-email">Email</label>
                    <input id="gd-email" name="email" type="email" autoComplete="email" required defaultValue={who?.email} />
                  </div>
                  <label className="check full">
                    <input type="checkbox" name="news" defaultChecked />
                    <span>Also send me occasional news and event invitations from Prairie City Landing. Unsubscribe any time.</span>
                  </label>
                  <div className="full">
                    <button className="btn" type="submit">
                      Send me the guide <Icon name="send" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="inf-reading">
                <div className="success">
                  <Icon name="mail" />
                  <div>
                    <b>We’ve emailed it to you.</b>
                    <p className="small">
                      “{g.title}” is on its way to {who?.email}. If you don’t see it in a few minutes, check your promotions or spam folder.
                    </p>
                  </div>
                </div>
                <p className="eyebrow">In brief</p>
                <h2 id="inf-dlg-h">{g.title}</h2>
                <p className="inf-reading-lede">{g.lede}</p>
                <h3>Inside the guide</h3>
                <ul className="inf-reading-list">
                  {g.points.map((p) => (
                    <li key={p}>
                      <Icon name="check" /> {p}
                    </li>
                  ))}
                </ul>
                <p className="small muted">
                  Questions as you read? Cynthia Bazin, our Community Relations Director, is happy to talk them through at (916) 458-0303, ext. 110.
                </p>
                <div className="btn-row">
                  <a className="btn" href="/tour">
                    Schedule a tour
                  </a>
                  <button type="button" className="btn btn-ghost" onClick={() => setOpen(null)}>
                    Back to the guides
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}
