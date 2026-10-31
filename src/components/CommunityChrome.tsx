"use client";

import type { ReactNode } from "react";
import { useT } from "@/i18n/client";
import { UtilityBar } from "./UtilityBar";
import { LangSuggest } from "./LangSuggest";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CookieConsent } from "./CookieConsent";
import { ChatWidget } from "./ChatWidget";

/** Chrome for a community's pages (/alder-bend/…, /kestrel-point/…). The parent site has WrenhavenChrome. */
export function CommunityChrome({ children }: { children: ReactNode }) {
  const { t } = useT();
  return (
    <>
      <a className="skip" href="#main">
        {t("Skip to content")}
      </a>
      <LangSuggest />
      <UtilityBar />
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <ChatWidget />
      <CookieConsent />
    </>
  );
}
