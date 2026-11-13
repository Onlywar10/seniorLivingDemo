"use client";

// "Preview as": exactly what someone will see, before anything is sent. The invitation (the text on a phone, and the
// email), the survey page itself (tap through it as they would, including "only ask if…" questions and the
// thank-you; nothing is saved), and the printed page with its QR code. Switch who you're previewing as: a resident,
// a family member, someone who reads Spanish or Chinese, or a Lantern resident (the read-aloud version). The same
// preview opens from the approval card, so the approver sees what will go out.
import { useState } from "react";
import { fillIn, type L, type MsgLang } from "@/data/staff/autoText";
import { INVITE, minutes, unitIn, type Question } from "@/data/staff/surveyKit";
import { Icon } from "../../Icon";
import { SurveyRunner } from "../../survey/SurveyRunner";
import { say } from "../store";
import { Drawer } from "./Drawer";
import { QrBlock } from "./Qr";

export type Persona = "resident" | "family" | "spanish" | "chinese" | "lantern";
export interface PreviewSurvey { id: string; title: string; questions: Question[]; topic: L; anonymous: boolean; thankYou: L | string; closesLabel?: string; event?: string }
export interface PreviewPeople { resident: string; family: string; spanish: string; chinese: string; lantern: string; legal: string }

const PERSONAS: { k: Persona; label: string }[] = [
  { k: "resident", label: "A resident" }, { k: "family", label: "A family member" }, { k: "spanish", label: "Reads Spanish" }, { k: "chinese", label: "Reads Chinese" }, { k: "lantern", label: "A Lantern resident" },
];

export function SurveyPreview({ sv, community, phone, domain, people, me, onClose }: { sv: PreviewSurvey; community: string; phone: string; domain: string; people: PreviewPeople; me: string; onClose: () => void }) {
  const [who, setWho] = useState<Persona>("family");
  const [view, setView] = useState<"invite" | "page" | "print">("invite");
  const lang: MsgLang = who === "spanish" ? "es" : who === "chinese" ? "zh" : "en";
  const name = people[who === "lantern" ? "lantern" : who];
  const m = minutes(sv.questions);
  const vars = { event: sv.event ?? "the event" };
  const topic = fillIn(sv.topic[lang], vars);
  const link = `${domain}/s/${sv.id}~${name.split(" ")[0].toLowerCase()}`;
  const thanks = typeof sv.thankYou === "string" ? sv.thankYou : sv.thankYou[lang];
  const invite = fillIn(INVITE[lang], { "first name": name.split(" ")[0], community, topic, minutes: m, unit: unitIn(lang, m), link });
  return (
    <Drawer title={`Preview as: ${sv.title}`} sub="Exactly what they’ll see. Nothing here is sent or saved." onClose={onClose} wide
      foot={<div className="pt-act"><button type="button" className="sx-btn" onClick={() => say(`Test sent to ${me.split(" ")[0]}: the real invitation by text and email, with a test link. Test answers aren’t counted.`)}><Icon name="send" /> Send me a test</button><button type="button" className="sx-btn sx-btn-quiet" onClick={onClose}>Close</button></div>}>
      <div className="su-prev">
        <div className="sx-chips" role="group" aria-label="Preview as">
          {PERSONAS.map((p) => <button key={p.k} type="button" aria-pressed={who === p.k} onClick={() => setWho(p.k)}>{p.label}</button>)}
        </div>
        <div className="sx-seg" role="group" aria-label="What to preview">
          {([["invite", "The invitation"], ["page", "The survey page"], ["print", "The printed page"]] as const).map(([k, l]) => <button key={k} type="button" aria-pressed={view === k} onClick={() => setView(k)}>{l}</button>)}
        </div>
        <p className="sx-hint">{who === "lantern" ? `${name} lives in Lantern: never surveyed by text. The care team reads it aloud in person, or it goes to the legal representative, ${people.legal}.` : `As ${name}${lang !== "en" ? `, in ${lang === "es" ? "Spanish" : "Chinese"}` : ""}.`}</p>

        {view === "invite" && (who === "lantern" ? (
          <div className="su-inv">
            <div className="su-card-note"><Icon name="heart" /> <span><b>No text to {name.split(" ")[0]}.</b> It shows on the Lantern team’s Today as “Ask in person”, with the read-aloud version. If {name.split(" ")[0]} can’t answer, the invitation below goes to {people.legal}, their legal representative.</span></div>
            <div className="au-phone"><div className="au-phone-top"><b>{community}</b>Text message</div><p className="au-sms">{fillIn(INVITE.en, { "first name": people.legal.split(" ")[0], community, topic: `${name.split(" ")[0]}’s ${topic}`, minutes: m, unit: unitIn("en", m), link })}</p></div>
          </div>
        ) : (
          <div className="su-inv">
            <div className="au-phone" lang={lang === "en" ? undefined : lang}><div className="au-phone-top"><b>{community}</b>Text message</div><p className="au-sms">{invite}</p></div>
            <div className="au-mail" lang={lang === "en" ? undefined : lang}>
              <div className="au-mail-h"><small>From</small> {community} <small>Subject</small> <b>{lang === "es" ? `Su opinión sobre ${topic}` : lang === "zh" ? `请分享您对${topic}的看法` : `Your thoughts on ${topic}`}</b></div>
              <div className="au-mail-b"><p>{invite.replace(link, "")}</p><span className="su-mail-btn">{lang === "es" ? "Responder la encuesta" : lang === "zh" ? "开始填写" : "Answer the survey"}</span><small>{community} · {phone}</small></div>
            </div>
          </div>
        ))}

        {view === "page" && (
          <div className="su-phone-frame">
            <SurveyRunner key={`${who}-${sv.questions.length}`} title={sv.event ? `${sv.title}: ${sv.event}` : sv.title} community={community} phone={phone} questions={sv.questions} lang={lang} anonymous={sv.anonymous} thankYou={fillIn(thanks, { community })} vars={vars} mode={who === "lantern" ? "aloud" : "preview"} closesLabel={sv.closesLabel} compact />
          </div>
        )}

        {view === "print" && <PrintedSurvey sv={sv} community={community} phone={phone} lang={lang} seed={`${sv.id}-${who}`} />}
      </div>
    </Drawer>
  );
}

/** The large-print paper copy, for the front desk and anyone who prefers paper. Its QR code opens the same survey page. */
export function PrintedSurvey({ sv, community, phone, lang = "en", seed }: { sv: PreviewSurvey; community: string; phone: string; lang?: MsgLang; seed: string }) {
  const fill = (s: string) => fillIn(s, { community, event: sv.event ?? "the event" });
  return (
    <article className="su-paper" aria-label="Printed survey">
      <header>
        <div>
          <p className="su-paper-k">{community}</p>
          <h3>{sv.event ? `${sv.title}: ${sv.event}` : sv.title}</h3>
          <p>{sv.anonymous ? "Anonymous: please don’t write your name." : "Please write your name if you’d like us to follow up."}{sv.closesLabel ? ` Return it to the front desk by ${sv.closesLabel}.` : " Return it to the front desk."}</p>
        </div>
        <figure><QrBlock seed={seed} className="su-qr" /><figcaption>Or scan to answer on your phone</figcaption></figure>
      </header>
      <ol>
        {sv.questions.map((q) => (
          <li key={q.id}>
            <p>{fill(q.text[lang] || q.text.en)}{q.optional ? <small> (optional)</small> : null}{q.onlyIf ? <small> (only if you answered {q.onlyIf.in.join(" or ")} above)</small> : null}</p>
            {q.type === "rating" && <div className="su-boxes">{["Very poor", "Poor", "Okay", "Good", "Excellent"].map((l, i) => <span key={l}><i />{i + 1} {l}</span>)}</div>}
            {q.type === "yesno" && <div className="su-boxes">{["Yes", "No"].map((l) => <span key={l}><i />{l}</span>)}</div>}
            {q.type === "nps" && <div className="su-boxes nps">{Array.from({ length: 11 }, (_, n) => <span key={n}><i />{n}</span>)}</div>}
            {(q.type === "one" || q.type === "many") && <div className="su-boxes col">{(q.options ?? []).map((o) => <span key={o.en}><i />{o[lang] || o.en}</span>)}</div>}
            {q.type === "text" && <div className="su-lines"><span /><span /></div>}
          </li>
        ))}
      </ol>
      <footer>{sv.anonymous ? "" : "Name (optional): ______________________   "}Questions? Call {phone}.</footer>
    </article>
  );
}
