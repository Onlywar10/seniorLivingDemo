"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { Footer } from "./Footer";
import { BrandHeader, BrandFooter } from "./BrandHeader";

/** The group site is the root; everything under /larkmoor-house is the community site with its own header and footer. */
export function SiteChrome({ children }: { children: ReactNode }) {
  const path = usePathname();
  const brand = !path.startsWith("/larkmoor-house");
  return (
    <>
      {brand ? <BrandHeader /> : <SiteHeader />}
      <main id="main">{children}</main>
      {brand ? <BrandFooter /> : <Footer />}
    </>
  );
}
