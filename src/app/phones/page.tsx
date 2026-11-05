import type { Metadata } from "next";
import Link from "next/link";
import { PhoneStory, STORIES, isStory, storyMeta } from "@/components/phone/stories";
import { PhonesKeys } from "@/components/phone/PhonesKeys";
import { isCommunity } from "@/data/communities";
import "./phones.css";

export const metadata: Metadata = {
  title: { absolute: "On the phone" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

/** The phone walk-throughs, full screen, for presenting: /phones?story=family (reached by address only; ?c= picks the community). */
export default async function PhonesPage({ searchParams }: { searchParams: Promise<{ [k: string]: string | string[] | undefined }> }) {
  const sp = await searchParams;
  const c = typeof sp.c === "string" ? sp.c : undefined;
  const slug = isCommunity(c) ? c : "alder-bend";
  const story = isStory(sp.story) ? sp.story : "family";
  const meta = storyMeta[story];
  const href = (s: string) => (c ? `/phones?c=${slug}&story=${s}` : `/phones?story=${s}`);
  return (
    <main className="phs">
      <PhonesKeys />
      <nav className="phs-switch" aria-label="Choose a phone">
        <span className="phs-seg">
          {STORIES.map((k) => (
            <Link key={k} href={href(k)} aria-current={k === story ? "page" : undefined} replace scroll={false}>
              {storyMeta[k].tab}
            </Link>
          ))}
        </span>
      </nav>
      <div className="phs-stage">
        <header className="phs-intro">
          <p className="phs-kicker">{meta.title}</p>
          <p className="phs-who">{meta.who(slug)}</p>
        </header>
        <PhoneStory slug={slug} story={story} size="lg" />
      </div>
    </main>
  );
}
