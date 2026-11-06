import type { Metadata } from "next";
import { buildBands } from "@/components/flows/bands";
import { FlowBoard } from "@/components/flows/FlowBoard";
import { PhonesKeys } from "@/components/phone/PhonesKeys";
import { communities, isCommunity } from "@/data/communities";

export const metadata: Metadata = {
  title: { absolute: "Messages by audience" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

/**
 * Every message families, prospects, residents and staff receive, drawn as workflows (one band per audience), with a
 * preview of each. Reached by address only: /phones (add ?c=kestrel-point for the other community, #staff to jump).
 */
export default async function PhonesPage({ searchParams }: { searchParams: Promise<{ [k: string]: string | string[] | undefined }> }) {
  const sp = await searchParams;
  const c = typeof sp.c === "string" ? sp.c : undefined;
  const slug = isCommunity(c) ? c : "alder-bend";
  return (
    <main>
      <PhonesKeys />
      <FlowBoard bands={buildBands(slug)} community={communities[slug].site.name} />
    </main>
  );
}
