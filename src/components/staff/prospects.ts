// What a prospect who signed up for a public event (an open house) receives: an instant thank-you text and email,
// and a reminder the day before. Plain functions, so the server page and the client lead list share them.
import { fmtTime, fromIso, dayShort } from "@/lib/clock";

export interface ProspectMessage { channel: "Text" | "Email"; at: string; text: string; subject?: string }

/** The community details the messages are written with. */
export interface ProspectCtx { site: string; rep: string; phone: string; address: string; domain: string }

export function signupMessages(ctx: ProspectCtx, p: { name: string; eventTitle: string; date: string; start: number; party: number; at?: string }): ProspectMessage[] {
  const fn = p.name.replace(/&.*$/, "").trim().split(" ")[0];
  const repFirst = ctx.rep.split(" ")[0];
  const day = dayShort(fromIso(p.date));
  const time = fmtTime(p.start);
  const party = p.party > 1 ? `, party of ${p.party}` : "";
  const at = p.at ?? "Just now";
  return [
    { channel: "Text", at, text: `${ctx.site}: thank you, ${fn}! You’re signed up for ${p.eventTitle}, ${day} at ${time}${party}. ${repFirst} will be in touch to confirm. Questions? Call ${ctx.phone}. Reply STOP to opt out.` },
    { channel: "Email", at, subject: `You’re signed up: ${p.eventTitle}`, text: `Dear ${fn},\n\nThank you for signing up for ${p.eventTitle} on ${day} at ${time}${party}. ${ctx.rep} will call to confirm and answer any questions you have.\n\nWe’re at ${ctx.address}. Parking is by the main entrance.\n\nWarmly,\nThe ${ctx.site} team · ${ctx.phone}` },
    { channel: "Text", at: "The day before, 4:00 pm", text: `Reminder from ${ctx.site}: we’ll see you tomorrow at ${time} for ${p.eventTitle}. Ask for ${repFirst} at the front desk.` },
  ];
}
