import type { Metadata } from "next";
import { EB_Garamond, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { StructureProvider } from "@/lib/structure";
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
    "This week's activities, the menus, our care team, apartments and rates, the state inspection record and the family handbook for Larkmoor House. Demonstration site.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <StructureProvider>
          <a className="skip" href="#main">
            Skip to content
          </a>
          <SiteChrome>{children}</SiteChrome>
        </StructureProvider>
      </body>
    </html>
  );
}
