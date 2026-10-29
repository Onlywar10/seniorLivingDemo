"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";

export interface GalleryItem {
  src: string;
  alt: string;
  title: string;
  caption?: string;
  meta?: string;
}

/** A photo grid that opens into a keyboard-friendly lightbox. */
export function Gallery({ items, variant = "mosaic" }: { items: GalleryItem[]; variant?: "mosaic" | "cards" }) {
  const [open, setOpen] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);

  const show = (i: number, el: HTMLButtonElement) => {
    opener.current = el;
    setOpen(i);
  };
  const close = useCallback(() => setOpen(null), []);
  const step = useCallback((d: number) => setOpen((i) => (i == null ? i : (i + d + items.length) % items.length)), [items.length]);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open != null && !el.open) el.showModal();
    if (open == null && el.open) {
      el.close();
      opener.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (open == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, step]);

  const cur = open != null ? items[open] : null;

  return (
    <>
      <ul className={`br-gal br-gal-${variant}`}>
        {items.map((it, i) => (
          <li key={it.src + i}>
            <button type="button" className="br-gal-btn" onClick={(e) => show(i, e.currentTarget)} aria-label={`Open photo: ${it.title}`}>
              <span className="br-gal-ph">
                <Image src={it.src} alt={it.alt} fill sizes="(max-width: 640px) 100vw, (max-width: 960px) 50vw, 33vw" />
              </span>
              <span className="br-gal-cap">
                <b>{it.title}</b>
                {it.meta && <span>{it.meta}</span>}
              </span>
            </button>
            {variant === "cards" && it.caption && <p className="br-gal-text">{it.caption}</p>}
          </li>
        ))}
      </ul>
      <dialog ref={dialog} className="br-lightbox" onClose={close} onClick={(e) => e.target === e.currentTarget && close()} aria-label={cur?.title ?? "Photo"}>
        {cur && (
          <div className="br-lb-inner">
            <div className="br-lb-ph">
              <Image src={cur.src} alt={cur.alt} fill sizes="90vw" />
            </div>
            <div className="br-lb-text">
              <div>
                <p className="br-lb-title">{cur.title}</p>
                {cur.meta && <p className="br-lb-meta">{cur.meta}</p>}
                {cur.caption && <p className="br-lb-cap">{cur.caption}</p>}
              </div>
              <div className="br-lb-ctl">
                <button type="button" onClick={() => step(-1)} aria-label="Previous photo">
                  <Icon name="left" />
                </button>
                <span className="small">{`${(open ?? 0) + 1} of ${items.length}`}</span>
                <button type="button" onClick={() => step(1)} aria-label="Next photo">
                  <Icon name="right" />
                </button>
                <button type="button" onClick={close} aria-label="Close">
                  <Icon name="x" />
                </button>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
