import type { Metadata } from "next";
import { PageHead, Card, Badge } from "@/components/staff/ui";
import { MenuEditor } from "@/components/staff/Editors";
import { Icon } from "@/components/Icon";
import { getWeekMenu, community, dietLabels } from "@/data/community";
import { scope } from "@/data/staff";

export const metadata: Metadata = { title: "Menus" };

export default async function MenusPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const s = scope(c ?? "larkmoor-house");
  return (
    <>
      <PageHead title="Menus" sub={`${s.label} · week 2 of the fall cycle · ${community.weekLabel}`}>
        <button className="sx-btn" type="button">
          <Icon name="layers" /> Copy from the menu library
        </button>
        <button className="sx-btn sx-btn-primary" type="button">
          <Icon name="send" /> Publish changes
        </button>
      </PageHead>
      <Card
        title="This week’s menu"
        sub="Click a dish to edit it; tap a tag to mark it. Changes publish to the dining page, the family digest and the printed menu card."
        action={<Badge tone="good">Published {s.list[0].menuUpdated}</Badge>}
      >
        <p className="sx-note" style={{ marginTop: 0 }}>
          {Object.entries(dietLabels)
            .map(([k, v]) => `${k} ${v.toLowerCase()}`)
            .join(" · ")}
        </p>
        <MenuEditor menu={getWeekMenu()} />
      </Card>
    </>
  );
}
