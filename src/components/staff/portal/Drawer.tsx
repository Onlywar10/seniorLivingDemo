"use client";

// A panel that slides in from the right (a sheet from the bottom on a phone). Escape or the backdrop closes it.
import { useEffect, type ReactNode } from "react";
import { Icon } from "../../Icon";

export function Drawer({ title, sub, onClose, children, foot, wide = false }: { title: string; sub?: ReactNode; onClose: () => void; children: ReactNode; foot?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const k = (ev: KeyboardEvent) => ev.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="sx-drawer" onClick={(ev) => ev.target === ev.currentTarget && onClose()}>
      <div className={`sx-drawer-box${wide ? " pt-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="sx-drawer-h">
          <div>
            <h2>{title}</h2>
            {sub && <p>{sub}</p>}
          </div>
          <button type="button" className="sx-x" onClick={onClose} aria-label="Close" autoFocus>
            <Icon name="x" />
          </button>
        </div>
        <div className="sx-drawer-b">{children}</div>
        {foot && <div className="sx-drawer-f">{foot}</div>}
      </div>
    </div>
  );
}
