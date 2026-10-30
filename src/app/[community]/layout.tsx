import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CommunityChrome } from "@/components/CommunityChrome";
import { communities, isCommunity } from "@/data/communities";
import { getT } from "@/i18n/server";

export async function generateMetadata({ params }: { params: Promise<{ community: string }> }): Promise<Metadata> {
  const { community } = await params;
  if (!isCommunity(community)) return {};
  const { site } = communities[community];
  const { t } = await getT();
  return {
    title: { default: `${site.name} · ${t(site.tagline)}`, template: `%s · ${site.name}` },
    description: t(site.tagline),
  };
}

/** One community's site: its own header, footer, chat and colours of copy; the data comes from src/data/communities. */
export default async function CommunityLayout({ children, params }: { children: React.ReactNode; params: Promise<{ community: string }> }) {
  const { community } = await params;
  if (!isCommunity(community)) notFound();
  return <CommunityChrome>{children}</CommunityChrome>;
}
