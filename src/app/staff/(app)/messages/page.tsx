import type { Metadata } from "next";
import { PageHead, Card, Kpi, HBars } from "@/components/staff/ui";
import { Compose, Inbox, Tracking } from "@/components/staff/Messaging";
import { languages, scope } from "@/data/staff";

export const metadata: Metadata = { title: "Messages" };

export default async function Messages({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const s = scope(c);
  return (
    <>
      <PageHead title="Family messaging" sub={`${s.label} · text and email to every family, one community or one wing, in each family’s language.`} />
      <div className="sx-kpis">
        <Kpi label="Sent this week" value={s.sent.toLocaleString()} />
        <Kpi label="Delivered" value="99.1%" />
        <Kpi label="Opened" value={`${s.openRate}%`} delta={6} note="industry email average is 28%" />
        <Kpi label="Replies" value={s.replies} note="2 waiting for an answer" />
      </div>
      <div className="sx-grid g-21">
        <Card title="New message" pad={false}>
          <Compose />
        </Card>
        <Card title="Families by language" sub="Messages are translated automatically">
          <HBars items={languages.map((l) => ({ label: l.k, value: l.n }))} />
        </Card>
      </div>
      <Card title="Replies" sub="Every reply lands here, translated into English" pad={false}>
        <Inbox />
      </Card>
      <Card title="Delivery tracking" sub="Sent, delivered, opened and replied" pad={false}>
        <Tracking />
      </Card>
    </>
  );
}
