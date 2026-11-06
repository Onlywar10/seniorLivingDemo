"use client";

// Brings up the phone walk-throughs over any page during a meeting, without anything visible on the page itself:
// press Shift+P (not while typing), or add ?phones=family|prospect|resident|staff to the address. The overlay shows
// /phones for the community in the address (or the staff workspace's selected community), full screen.
// Escape or the close button leaves it. Mounted once in the root layout.
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import "./stage.css";

const STORIES = ["family", "prospect", "resident", "staff"] as const;
type Story = (typeof STORIES)[number];
const isStory = (v: unknown): v is Story => typeof v === "string" && (STORIES as readonly string[]).includes(v);
const COMMUNITIES = ["alder-bend", "kestrel-point"];

/** The community in the address (/alder-bend/…, /es/kestrel-point/…), the staff workspace's choice, or Alder Bend. */
function communityFrom(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  const seg = parts[0] === "es" || parts[0] === "zh" ? parts[1] : parts[0];
  if (seg && COMMUNITIES.includes(seg)) return seg;
  if (seg === "staff") {
    const m = document.cookie.match(/(?:^|;\s*)wh-staff-community=([^;]+)/);
    if (m && COMMUNITIES.includes(m[1])) return m[1];
  }
  return "alder-bend";
}

function typing(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
}

const noop = () => () => {};

export function PhoneStage() {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);
  const [manual, setManual] = useState<Story | null>(null);
  const mounted = useSyncExternalStore(noop, () => true, () => false);

  const param = params.get("phones");
  const story = manual ?? (isStory(param) ? param : null);
  // Never inside the phones page itself (it is what the overlay shows).
  const off = pathname.startsWith("/phones");
  const open = mounted && !off && story !== null;

  const close = useCallback(() => {
    setManual(null);
    if (params.has("phones")) {
      const q = new URLSearchParams(params.toString());
      q.delete("phones");
      const qs = q.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }, [params, pathname, router]);

  useEffect(() => {
    if (off) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "KeyP" || !e.shiftKey || e.ctrlKey || e.metaKey || e.altKey || typing(e.target)) return;
      e.preventDefault();
      if (story) close();
      else setManual("family");
    };
    // The phones page posts "phones:close" when Escape is pressed inside the overlay.
    const onMsg = (e: MessageEvent) => {
      if (e.origin === window.location.origin && e.data === "phones:close") close();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("message", onMsg);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("message", onMsg);
    };
  }, [off, story, close]);

  useEffect(() => {
    const d = ref.current;
    if (open && d && !d.open) d.showModal();
  }, [open]);

  if (!open) return null;
  const src = `/phones?c=${communityFrom(pathname)}#${story}`;
  return (
    <dialog
      ref={ref}
      className="phx-stage"
      aria-label="Messages by audience"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <button type="button" className="phx-stage-x" onClick={close} aria-label="Close">
        ×
      </button>
      <iframe src={src} title="Messages by audience" />
    </dialog>
  );
}
