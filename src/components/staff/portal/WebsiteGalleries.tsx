"use client";

// Website → Galleries: albums Kinlight builds from event photos. Staff can feature one on the community pages or hide
// one from the website. Changes stay in this browser.
import Image from "next/image";
import { useState } from "react";
import type { Gallery } from "@/data/staff/website";
import { Icon } from "../../Icon";
import { Badge } from "../ui";

export function WebsiteGalleries({ items }: { items: Gallery[] }) {
  const [rows, setRows] = useState(items.map((g) => ({ ...g, hidden: false })));
  const set = (id: string, f: (g: (typeof rows)[number]) => Partial<(typeof rows)[number]>) => setRows((xs) => xs.map((x) => (x.id === id ? { ...x, ...f(x) } : x)));
  return (
    <ul className="ws-gal">
      {rows.map((g) => (
        <li key={g.id} className={g.hidden ? "hidden" : ""}>
          <span className="ws-gal-img"><Image src={g.cover} alt="" fill sizes="(max-width: 700px) 100vw, 240px" /></span>
          <span className="ws-gal-t">
            <b>{g.title}</b>
            <small>{g.photos} photos · {g.when}{g.heldBack ? ` · ${g.heldBack} held back: no photo consent on file` : ""}</small>
          </span>
          <span className="ws-gal-s">
            {g.hidden ? <Badge>Hidden from the website</Badge> : g.featured ? <Badge tone="accent"><Icon name="star" /> Featured</Badge> : <Badge tone="good">On the website</Badge>}
          </span>
          <span className="ws-gal-a">
            {!g.hidden && (
              <button type="button" className="sx-btn sx-btn-sm" aria-pressed={g.featured} onClick={() => set(g.id, (x) => ({ featured: !x.featured }))}>
                <Icon name="star" /> {g.featured ? "Unfeature" : "Feature"}
              </button>
            )}
            <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => set(g.id, (x) => ({ hidden: !x.hidden, featured: false }))}>
              <Icon name={g.hidden ? "eye" : "x"} /> {g.hidden ? "Show" : "Hide"}
            </button>
          </span>
        </li>
      ))}
    </ul>
  );
}
