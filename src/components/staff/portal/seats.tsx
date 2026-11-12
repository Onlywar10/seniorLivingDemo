// How full an event is, said the same way everywhere: "4 of 12 seats left", "Full · 2 waiting", or "No limit" for the
// many events anyone can just walk into.
import { Icon } from "../../Icon";

export interface Seated { cap?: number; taken?: number; waitlist?: number }

export function seatInfo(e: Seated) {
  if (!e.cap) return { text: "No limit", short: "No limit", full: false, open: true };
  const taken = Math.min(e.taken ?? 0, e.cap);
  const left = e.cap - taken;
  const full = left <= 0;
  const wait = e.waitlist ? ` · ${e.waitlist} waiting` : "";
  return {
    text: full ? `Full, ${e.cap} of ${e.cap} seats${wait}` : `${left} of ${e.cap} seat${e.cap === 1 ? "" : "s"} left`,
    short: full ? `Full${wait}` : `${taken}/${e.cap} booked`,
    full,
    open: false,
  };
}

/** A small seat chip for cards: green-ish when open, red when full, quiet "No limit" otherwise. */
export function Seats({ e, short = false }: { e: Seated; short?: boolean }) {
  const s = seatInfo(e);
  return (
    <span className={`pt-seats${s.full ? " full" : ""}${s.open ? " open" : ""}`} title={s.text}>
      <Icon name="users" /> {short ? s.short : s.text}
    </span>
  );
}
