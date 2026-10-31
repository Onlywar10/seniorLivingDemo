import { WrenhavenChrome } from "@/components/wrenhaven/WrenhavenChrome";

/** The Wrenhaven Senior Living parent site: /, /communities, /living/…, /lifestyle, /about, /careers, /contact and the policies. */
export default function WrenhavenLayout({ children }: { children: React.ReactNode }) {
  return <WrenhavenChrome>{children}</WrenhavenChrome>;
}
