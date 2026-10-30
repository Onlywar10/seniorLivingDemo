import Link from "@/i18n/Link";
import { getT } from "@/i18n/server";
import { getCommunity } from "@/lib/community-server";
import type { LivingKey } from "@/data/shared";

/** Switches between the three living options. */
export async function LivingTabs({ current }: { current?: LivingKey }) {
  const { t } = await getT();
  const { living } = await getCommunity();
  return (
    <nav className="br-ltabs" aria-label={t("Living options")}>
      <div className="wrap">
        <Link href="/living" aria-current={current ? undefined : "page"}>
          {t("Overview")}
        </Link>
        {(Object.keys(living) as LivingKey[]).map((k) => (
          <Link key={k} href={living[k].href} aria-current={current === k ? "page" : undefined}>
            {t(living[k].name)}
          </Link>
        ))}
        <Link href="/floor-plans">{t("Floor Plans & Pricing")}</Link>
      </div>
    </nav>
  );
}
