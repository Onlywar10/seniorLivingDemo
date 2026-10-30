import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import { headers } from "next/headers";
import { Libre_Baskerville, Montserrat } from "next/font/google";
import "./globals.css";
import { PrefsProvider } from "@/lib/prefs";
import { LangProvider } from "@/i18n/client";
import { dictionaries, getT } from "@/i18n/server";
import { htmlLang, isLang, SUGGEST_HEADER } from "@/i18n/config";

const display = Libre_Baskerville({ variable: "--font-display", subsets: ["latin"], weight: ["400", "700"], style: ["normal", "italic"], display: "swap" });
const body = Montserrat({ variable: "--font-body", subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: { default: t("Tenfold Senior Living · Different By Design"), template: "%s · Tenfold Senior Living" },
    description: t("Luxury senior living communities in Folsom and Elk Grove, California: Independent Living, Assisted Living Services and Harbor Memory Care."),
    icons: { icon: "/img/brand/dots.png" },
    robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true } },
  };
}

export const viewport: Viewport = { themeColor: "#24363f" };

/** The document for every site: the Tenfold parent site, each community and the staff system. Each brings its own chrome. */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Rendered per request so the calendar, menus and "today" are always current.
  await connection();
  const { lang } = await getT();
  const s = (await headers()).get(SUGGEST_HEADER);
  return (
    <html lang={htmlLang[lang]} className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <body>
        <LangProvider lang={lang} dict={dictionaries[lang]} suggest={isLang(s) ? s : null}>
          <PrefsProvider>{children}</PrefsProvider>
        </LangProvider>
      </body>
    </html>
  );
}
