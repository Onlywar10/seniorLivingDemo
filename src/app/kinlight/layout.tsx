import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./kinlight.css";

export const metadata: Metadata = {
  title: { absolute: "Kinlight · Team" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

/** Kinlight's internal view for its own team. Not the operator's staff workspace. */
export default function KinlightLayout({ children }: { children: ReactNode }) {
  return (
    <div className="kl">
      <header className="kl-top">
        <div className="kl-top-in">
          <span className="kl-logo">
            <i aria-hidden="true" />
            <b>Kinlight</b>
            <span>· Team</span>
          </span>
          <span className="kl-internal">Internal: Kinlight staff only. Operators never see this view.</span>
        </div>
        <nav className="kl-nav" aria-label="Sections">
          <a href="#pilots">Pilots</a>
          <a href="#onboarding">Onboarding</a>
          <a href="#promises">Promises</a>
          <a href="#support">Support</a>
          <a href="#ai">AI answers</a>
          <a href="#uptime">Uptime</a>
          <a href="#moves">Site moves</a>
        </nav>
      </header>
      {children}
    </div>
  );
}
