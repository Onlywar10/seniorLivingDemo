"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { UtilityBar } from "./UtilityBar";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CookieConsent } from "./CookieConsent";
import { ChatWidget } from "./ChatWidget";

/** Public site chrome. The staff system (/staff) has its own shell. */
export function SiteChrome({ children }: { children: ReactNode }) {
  const path = usePathname();
  if (path.startsWith("/staff")) return <>{children}</>;
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <UtilityBar />
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <ChatWidget />
      <CookieConsent />
    </>
  );
}
