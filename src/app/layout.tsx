import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import { Libre_Baskerville, Montserrat } from "next/font/google";
import "./globals.css";
import { PrefsProvider } from "@/lib/prefs";
import { SiteChrome } from "@/components/SiteChrome";

const display = Libre_Baskerville({ variable: "--font-display", subsets: ["latin"], weight: ["400", "700"], style: ["normal", "italic"], display: "swap" });
const body = Montserrat({ variable: "--font-body", subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Prairie City Landing · Luxury Senior Living in Folsom, CA", template: "%s · Prairie City Landing" },
  description: "Sacramento County’s award-winning luxury senior living community. Independent Living, Assisted Living Services and Harbor Memory Care at 645 Willard Drive, Folsom, CA.",
  icons: { icon: "/img/brand/dots.png" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true } },
};

export const viewport: Viewport = { themeColor: "#2e4d33" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Rendered per request so the calendar, menus and "today" are always current.
  await connection();
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <body>
        <PrefsProvider>
          <SiteChrome>{children}</SiteChrome>
        </PrefsProvider>
      </body>
    </html>
  );
}
