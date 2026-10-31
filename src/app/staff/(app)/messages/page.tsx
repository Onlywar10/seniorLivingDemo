import type { Metadata } from "next";
import { Composer, Inbox, RateCell } from "@/components/staff/Messaging";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { Avatar, Card, Kpi, PageHead } from "@/components/staff/ui";
import { ago, staffPeople, user } from "@/data/staff";
import { getStaffCommunity } from "@/data/staff/server";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Messages" />;
  const { s } = sc;
  const { community, contacts, sends, templates, threads } = s;
  const tot = sends.reduce((a, s) => ({ sent: a.sent + s.sent, del: a.del + s.delivered, op: a.op + s.opened, rep: a.rep + s.replied }), { sent: 0, del: 0, op: 0, rep: 0 });
  const unread = threads.filter((t) => t.unread).length;
  return (
    <>
      <PageHead title="Messages" sub={`Text and email ${community.families} families in their own language. Replies come back here.`} />
      <div className="sx-kpis">
        <Kpi label="Sent, last 10 days" value={tot.sent.toLocaleString("en-US")} note={`${sends.length} messages`} />
        <Kpi label="Delivered" value={`${((tot.del / tot.sent) * 100).toFixed(1)}%`} note={`${tot.sent - tot.del} undeliverable`} />
        <Kpi label="Opened" value={`${Math.round((tot.op / tot.del) * 100)}%`} note="texts and emails" />
        <Kpi label="Replies" value={tot.rep} note={`${unread} unread`} />
      </div>

      <div className="sx-grid g-2">
        <Card title="New message">
          <Composer templates={templates} families={community.families} lanternFamilies={community.lanternFamilies} contacts={contacts.map((c) => ({ resident: c.resident, contact: c.contact }))} translations={s.translations} alsoTranslated={s.alsoTranslated} defaultEvent={s.composerEvent} />
        </Card>
        <Card title="Replies" sub={`${unread} unread · translated automatically`} pad={false}>
          <Inbox threads={threads.map((t) => ({ ...t, when: ago(t.mins), msgs: t.msgs.map((m) => ({ ...m, when: ago(m.mins) })) }))} suggestions={s.suggestions} me={user.name} />
        </Card>
      </div>

      <Card title="Delivery tracking" sub="Recent sends" pad={false}>
        <div className="sx-table-wrap">
          <table className="sx-table">
            <thead>
              <tr>
                <th>Message</th>
                <th>Sent by</th>
                <th className="num">Sent</th>
                <th>Delivered</th>
                <th>Opened</th>
                <th>Replied</th>
              </tr>
            </thead>
            <tbody>
              {sends.map((s) => (
                <tr key={s.id}>
                  <td>
                    <b>{s.title}</b>
                    <small>{s.audience} · {s.channels} · {ago(s.mins)}{s.lang ? ` · ${s.lang} translated` : ""}</small>
                  </td>
                  <td><span className="sx-name"><Avatar who={s.by} size={28} /><span>{staffPeople[s.by].name.split(" ")[0]}</span></span></td>
                  <td className="num">{s.sent}</td>
                  <td><RateCell n={s.delivered} of={s.sent} /></td>
                  <td><RateCell n={s.opened} of={s.delivered} /></td>
                  <td>{s.replied}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
