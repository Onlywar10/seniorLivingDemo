import Link from "next/link";
import { living, type LivingKey } from "@/data/site";

/** Switches between the three living options. */
export function LivingTabs({ current }: { current?: LivingKey }) {
  return (
    <nav className="br-ltabs" aria-label="Living options">
      <div className="wrap">
        <Link href="/living" aria-current={current ? undefined : "page"}>
          Overview
        </Link>
        {(Object.keys(living) as LivingKey[]).map((k) => (
          <Link key={k} href={living[k].href} aria-current={current === k ? "page" : undefined}>
            {living[k].name}
          </Link>
        ))}
        <Link href="/floor-plans">Floor Plans & Pricing</Link>
      </div>
    </nav>
  );
}
