// The "?" beside anything that needs explaining. Screens show what to do; the why, what Kinlight does automatically,
// privacy rules and how numbers are worked out sit behind this. A native <details>, so it works without JavaScript
// and in Server Components. It is a <details>, so never put it inside a <p> (the browser closes the paragraph early).
import type { ReactNode } from "react";

/** A small "?" that opens a short explanation underneath. `label` names it for screen readers. */
export function Help({ label = "More about this", children, align = "start" }: { label?: string; children: ReactNode; align?: "start" | "end" }) {
  return (
    <details className={`pt-help pt-help-${align}`}>
      <summary aria-label={label} title={label}>?</summary>
      <div className="pt-help-body">{children}</div>
    </details>
  );
}

/** A one-line "what happens automatically" that opens into the full list. */
export function Auto({ summary, children }: { summary: ReactNode; children: ReactNode }) {
  return (
    <details className="pt-auto">
      <summary>{summary}</summary>
      <div className="pt-auto-body">{children}</div>
    </details>
  );
}
