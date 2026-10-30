import { TenfoldChrome } from "@/components/tenfold/TenfoldChrome";

/** The Tenfold Senior Living parent site: /, /communities, /living/…, /lifestyle, /about, /careers, /contact and the policies. */
export default function TenfoldLayout({ children }: { children: React.ReactNode }) {
  return <TenfoldChrome>{children}</TenfoldChrome>;
}
