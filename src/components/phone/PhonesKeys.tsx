"use client";

// Presenter keys on /phones: → / ← (or Page Down / Page Up, which clickers send) step through the phone,
// and Escape closes the overlay when the page is shown inside one (PhoneStage), unless a preview is open.
import { useEffect } from "react";

export function PhonesKeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      const nav = (label: string) => document.querySelector<HTMLButtonElement>(`.ph-tour-nav button[aria-label="${label}"]`);
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        nav("Next")?.click();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        nav("Previous")?.click();
      } else if (e.key === "Escape" && window.parent !== window && !document.querySelector("dialog[open]")) {
        window.parent.postMessage("phones:close", window.location.origin);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return null;
}
