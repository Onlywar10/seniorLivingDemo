"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/Icon";

export interface NewsCard { slug: string; title: string; dek: string; kind: string; date: string; dateLabel: string; photo: string; alt: string; author: string }

export function NewsList({ items, kinds }: { items: NewsCard[]; kinds: string[] }) {
  const [kind, setKind] = useState("All");
  const shown = kind === "All" ? items : items.filter((i) => i.kind === kind);
  const counts = (k: string) => (k === "All" ? items.length : items.filter((i) => i.kind === k).length);
  return (
    <div>
      <div className="nw-filters" role="group" aria-label="Filter stories">
        {["All", ...kinds].filter((k) => counts(k) > 0).map((k) => (
          <button key={k} type="button" className={`nw-chip ${kind === k ? "on" : ""}`} aria-pressed={kind === k} onClick={() => setKind(k)}>
            {k} <span className="nw-count">{counts(k)}</span>
          </button>
        ))}
      </div>
      <p className="vh" aria-live="polite">
        {shown.length} stories
      </p>
      <ul className="nw-grid">
        {shown.map((s) => (
          <li key={s.slug} className="card nw-card">
            <Link href={`/news/${s.slug}`} className="nw-card-link">
              <div className="card-photo">
                <Image src={s.photo} alt={s.alt} fill sizes="(max-width: 640px) 100vw, (max-width: 960px) 50vw, 33vw" />
              </div>
              <div className="card-pad">
                <p className="nw-meta">
                  <span className="pill pill-terra">{s.kind}</span> <time dateTime={s.date}>{s.dateLabel}</time>
                </p>
                <h3>{s.title}</h3>
                <p className="small muted">{s.dek}</p>
                <span className="link-arrow">
                  Read the story <Icon name="arrow" />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ShareLinks({ title, path }: { title: string; path: string }) {
  const [copied, setCopied] = useState(false);
  const url = "https://prairiecitylanding.com" + path;
  return (
    <div className="nw-share">
      <span className="nw-share-label">Share</span>
      <a className="nw-share-btn" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" aria-label="Share on Facebook">
        <Icon name="facebook" />
      </a>
      <a className="nw-share-btn" href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`} aria-label="Share by email">
        <Icon name="mail" />
      </a>
      <a className="nw-share-btn" href={`sms:?&body=${encodeURIComponent(title + " " + url)}`} aria-label="Share by text message">
        <Icon name="sms" />
      </a>
      <button
        type="button"
        className="nw-share-btn"
        aria-label="Copy link"
        onClick={() => {
          try {
            navigator.clipboard?.writeText(url);
          } catch {}
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        }}
      >
        <Icon name={copied ? "check" : "link"} />
      </button>
      <span className="small muted" aria-live="polite">
        {copied ? "Link copied" : ""}
      </span>
    </div>
  );
}
