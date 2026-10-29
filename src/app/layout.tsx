import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import { EB_Garamond, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import "./features.css";
import { StructureProvider } from "@/lib/structure";
import { PrefsProvider } from "@/lib/prefs";
import { SiteChrome } from "@/components/SiteChrome";

const display = EB_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Larkmoor Senior Living",
    template: "%s · Larkmoor House",
  },
  description:
    "This week's activities, the menus, our care team, apartments, the state inspection record and the family handbook for Larkmoor House in Millbrook Bend, Oregon.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true } },
};

export const viewport: Viewport = { themeColor: "#34453a" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Every page is rendered per request so the calendar, menus and news are always today's.
  await connection();
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <body>
        <PrefsProvider>
          <StructureProvider>
            <a className="skip" href="#main">
              Skip to content
            </a>
            <SiteChrome>{children}</SiteChrome>
          </StructureProvider>
        </PrefsProvider>
      </body>
    </html>
  );
}
