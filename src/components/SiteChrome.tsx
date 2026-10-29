"use client";

import { usePathname } from "next/navigation";
import { ViewTransition, type ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { Footer } from "./Footer";
import { BrandHeader, BrandFooter } from "./BrandHeader";
import { UtilityBar } from "./UtilityBar";
import { NoticeBanner } from "./NoticeBanner";
import { ChatWidget } from "./ChatWidget";
import { Motion, NavDirection } from "./Motion";

/** The group site is the root; /larkmoor-house is the community site with its own header and footer; /staff is the staff system. */
export function SiteChrome({ children }: { children: ReactNode }) {
  const path = usePathname();
  if (path.startsWith("/staff")) return <>{children}</>;
  const community = path.startsWith("/larkmoor-house");
  return (
    <>
      <UtilityBar community={community} />
      {community && <NoticeBanner />}
      {community ? <SiteHeader /> : <BrandHeader />}
      <main id="main">
        {/* Each page slides in on navigation; the header and footer stay put. */}
        <ViewTransition key={path} enter="page" exit="page" default="none">
          <div className="page">{children}</div>
        </ViewTransition>
      </main>
      {community ? <Footer /> : <BrandFooter />}
      <ChatWidget />
      <Motion />
      <NavDirection />
    </>
  );
}
