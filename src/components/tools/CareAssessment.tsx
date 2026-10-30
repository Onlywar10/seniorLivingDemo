"use client";

import Image from "next/image";
import Link from "@/i18n/Link";
import { useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { money, type LivingKey } from "@/data/shared";
import type { Community } from "@/data/communities";
import { useCommunity } from "@/lib/community";
import { firstName, keyPeople } from "@/data/communities/copy/living";
import { toolsCopy } from "@/data/communities/copy/tools";
import { useT } from "@/i18n/client";
import type { T } from "@/i18n/translate";

type Who = "self" | "mother" | "father" | "partner" | "other";
interface Opt {
  v: string;
  label: string;
  care?: number;
  memory?: number;
  echo?: string;
}
interface Q {
  id: string;
  topic: string;
  ask: (n: Names) => string;
  help?: string;
  multi?: boolean;
  opts: Opt[];
}
interface Names {
  who: Who;
  name: string; // "you", "your mother", "Margaret"
  Name: string;
  /** The visitor typed a first name (so it is not translated). */
  own?: boolean;
}

const WHO: { v: Who; label: string }[] = [
  { v: "self", label: "Myself" },
  { v: "mother", label: "My mother" },
  { v: "father", label: "My father" },
  { v: "partner", label: "My spouse or partner" },
  { v: "other", label: "Someone else I care about" },
];

const QUESTIONS: Q[] = [
  {
    id: "home",
    topic: "Home today",
    ask: (n) => (n.who === "self" ? "Where are you living right now?" : `Where is ${n.name} living right now?`),
    opts: [
      { v: "alone", label: "At home, living alone", echo: "living alone at home" },
      { v: "spouse", label: "At home with a spouse or partner", echo: "living at home with a partner" },
      { v: "family", label: "With family", echo: "living with family" },
      { v: "community", label: "In another community", echo: "living in another community" },
    ],
  },
  {
    id: "meds",
    topic: "Medications",
    ask: (n) => `How are medications going for ${n.name}?`,
    opts: [
      { v: "none", label: "No daily medications", echo: "no daily medications" },
      { v: "self", label: "Handled independently", echo: "medications handled independently" },
      { v: "remind", label: "Needs a reminder now and then", care: 1, echo: "needs the occasional medication reminder" },
      { v: "manage", label: "Needs someone to manage them", care: 3, echo: "needs help managing medications" },
    ],
  },
  {
    id: "dress",
    topic: "Bathing and dressing",
    ask: (n) => `What about bathing and getting dressed, for ${n.name}?`,
    opts: [
      { v: "fine", label: "No help needed", echo: "bathing and dressing independently" },
      { v: "slower", label: "Slower now; would like someone close by", care: 1, echo: "would like someone close by for bathing" },
      { v: "hands", label: "Needs hands-on help", care: 3, echo: "needs hands-on help with bathing and dressing" },
    ],
  },
  {
    id: "meals",
    topic: "Meals",
    ask: (n) => `And meals? Which sounds most like ${n.name}?`,
    opts: [
      { v: "cooks", label: "Enjoys cooking", echo: "still enjoys cooking" },
      { v: "tired", label: "Tired of cooking for one", echo: "tired of cooking for one" },
      { v: "skips", label: "Skipping meals or eating less", care: 1, echo: "has been skipping meals" },
      { v: "help", label: "Needs help or prompting to eat", care: 2, echo: "needs prompting at mealtimes" },
    ],
  },
  {
    id: "move",
    topic: "Getting around",
    ask: (n) => `How does ${n.name} get around?`,
    opts: [
      { v: "easy", label: "Easily, and still walks for fun", echo: "gets around easily" },
      { v: "aid", label: "With a cane or walker", care: 1, echo: "uses a cane or walker" },
      { v: "fell", label: "Has had a fall in the last year", care: 2, echo: "has had a fall this year" },
      { v: "chair", label: "Mostly uses a wheelchair", care: 2, echo: "mostly uses a wheelchair" },
    ],
  },
  {
    id: "memory",
    topic: "Memory",
    ask: (n) => `Have there been changes in memory for ${n.name}?`,
    help: "Everyone forgets a name now and then. Choose what fits best.",
    opts: [
      { v: "none", label: "No concerns", echo: "no memory concerns" },
      { v: "some", label: "Some forgetfulness, nothing worrying", memory: 1, echo: "some everyday forgetfulness" },
      { v: "lost", label: "Has gotten lost or confused somewhere familiar", memory: 3, echo: "has been confused in familiar places" },
      { v: "dx", label: "Has a dementia or Alzheimer’s diagnosis", memory: 4, echo: "has a dementia diagnosis" },
    ],
  },
  {
    id: "night",
    topic: "Nights",
    ask: (n) => `What are nights like for ${n.name}?`,
    opts: [
      { v: "sleeps", label: "Sleeps through, no help needed", echo: "sleeps well" },
      { v: "sometimes", label: "Occasionally needs a hand at night", care: 1, echo: "occasionally needs help at night" },
      { v: "up", label: "Often up, restless or wandering", memory: 2, echo: "is often up and restless at night" },
    ],
  },
  {
    id: "social",
    topic: "Friends and company",
    ask: (n) => (n.who === "self" ? "How’s your social life these days?" : `How’s ${n.name}’s social life these days?`),
    opts: [
      { v: "busy", label: "Busy, and loves it", echo: "has a busy social life" },
      { v: "more", label: "Would like more company", echo: "would like more company" },
      { v: "lonely", label: "Often lonely", echo: "is often lonely" },
    ],
  },
  {
    id: "wants",
    topic: "The good stuff",
    ask: (n) => (n.who === "self" ? "What would you love to have more of?" : `What would ${n.name} love to have more of?`),
    help: "Choose as many as you like.",
    multi: true,
    opts: [
      { v: "fitness", label: "Fitness classes" },
      { v: "trips", label: "Trips and outings" },
      { v: "dining", label: "Great dining" },
      { v: "arts", label: "Art and music" },
      { v: "garden", label: "Gardening" },
      { v: "pets", label: "Room for a pet" },
      { v: "faith", label: "Faith and reflection" },
      { v: "chores", label: "No more chores" },
    ],
  },
  {
    id: "when",
    topic: "Timing",
    ask: () => "When are you hoping to make a move?",
    opts: [
      { v: "now", label: "As soon as possible", echo: "as soon as possible" },
      { v: "3m", label: "In the next three months", echo: "in the next three months" },
      { v: "6m", label: "In three to six months", echo: "in three to six months" },
      { v: "later", label: "Just exploring for now", echo: "just exploring" },
    ],
  },
];

/** Photo and price line for each recommendation, from the community's pricing. */
function resultFor(c: Community): Record<LivingKey, { photo: string; alt: string; from: string; interest: string }> {
  const { pricing } = c;
  return {
    independent: { photo: "/img/friends-laugh.jpg", alt: "Residents laughing together over coffee", from: `From ${money(pricing.independentRange[0])} a month`, interest: "independent" },
    assisted: { photo: "/img/care-chat.jpg", alt: "A Care Partner chatting with a resident on her sofa", from: `Your apartment, plus a ${money(pricing.assistedBase)} monthly base support fee and personal care by care plan`, interest: "assisted" },
    harbor: { photo: "/img/harbor-couple.jpg", alt: "A couple enjoying time together in Harbor", from: `From ${money(pricing.harbor[0].from)} a month`, interest: "harbor" },
  };
}

/** "Things you'll love", by answer: the community's own copy, with the restaurants named from its venues. */
function wantsFor(c: Community): Record<string, string> {
  const names = c.venueOrder.map((k) => c.venues[k].name);
  const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names.join("");
  return { ...toolsCopy[c.slug].wants, dining: `Three restaurants downstairs: ${list}` };
}

function names(who: Who, first: string): Names {
  const f = first.trim();
  if (who === "self") return { who, name: "you", Name: "You" };
  if (f) return { who, name: f, Name: f, own: true };
  const map: Record<Who, string> = { self: "you", mother: "your mother", father: "your father", partner: "your partner", other: "your loved one" };
  const n = map[who];
  return { who, name: n, Name: n.charAt(0).toUpperCase() + n.slice(1) };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Translates a sentence that mentions the person. "You" sentences are looked up as they are; for anyone else the
 * sentence is looked up with {name} / {Name} in place of the person ("Where is {name} living right now?"), and the
 * (translated) name is put back. Falls back to the English sentence when there is no template.
 */
function say(t: T, N: Names, build: (n: Names) => string): string {
  if (N.who === "self") return t(build(N));
  const tpl = build({ ...N, name: "{name}", Name: "{Name}" });
  const out = t(tpl);
  if (out === tpl) return build(N);
  const nm = N.own ? N.name : t(N.name);
  return out.split("{Name}").join(cap(nm)).split("{name}").join(nm);
}

export function CareAssessment() {
  const { t } = useT();
  const [step, setStep] = useState(0); // 0 = who, 1..N = questions, N+1 = result
  const [who, setWho] = useState<Who | null>(null);
  const [first, setFirst] = useState("");
  const [ans, setAns] = useState<Record<string, string[]>>({});
  const head = useRef<HTMLHeadingElement>(null);
  const total = QUESTIONS.length + 1;
  const N = names(who ?? "other", first);
  const done = step > QUESTIONS.length;

  const move = (to: number) => {
    setStep(to);
    requestAnimationFrame(() => head.current?.focus());
  };
  const q = step >= 1 && step <= QUESTIONS.length ? QUESTIONS[step - 1] : null;
  const picked = q ? ans[q.id] ?? [] : [];
  const canNext = step === 0 ? !!who : q ? q.multi || picked.length > 0 : true;

  const choose = (v: string) => {
    if (!q) return;
    if (q.multi) {
      setAns({ ...ans, [q.id]: picked.includes(v) ? picked.filter((x) => x !== v) : [...picked, v] });
    } else {
      setAns({ ...ans, [q.id]: [v] });
    }
  };

  return (
    <div className="ca">
      <div className="ca-progress" aria-hidden={done}>
        <div className="ca-bar">
          <span style={{ width: `${(Math.min(step, total) / total) * 100}%` }} />
        </div>
        <p className="ca-step">{done ? t("All done") : t(`Question ${step + 1} of ${total}`)}</p>
      </div>

      {step === 0 && (
        <div className="ca-card" key="who">
          <p className="ca-topic">{t("Getting started")}</p>
          <h2 ref={head} tabIndex={-1}>
            {t("Who are you exploring for?")}
          </h2>
          <fieldset className="ca-opts">
            <legend className="vh">{t("Who are you exploring for?")}</legend>
            {WHO.map((o) => (
              <label key={o.v} className={`ca-opt ${who === o.v ? "on" : ""}`}>
                <input type="radio" name="ca-who" checked={who === o.v} onChange={() => setWho(o.v)} />
                <span className="ca-mark" aria-hidden="true" />
                {t(o.label)}
              </label>
            ))}
          </fieldset>
          {who && who !== "self" && (
            <div className="field ca-name">
              <label htmlFor="ca-first">{t("Their first name (optional)")}</label>
              <input id="ca-first" value={first} onChange={(e) => setFirst(e.target.value)} autoComplete="off" maxLength={30} />
            </div>
          )}
        </div>
      )}

      {q && (
        <div className="ca-card" key={q.id}>
          <p className="ca-topic">{t(q.topic)}</p>
          <h2 ref={head} tabIndex={-1}>
            {say(t, N, q.ask)}
          </h2>
          {q.help && <p className="ca-help">{t(q.help)}</p>}
          <fieldset className={`ca-opts ${q.multi ? "ca-opts-multi" : ""}`}>
            <legend className="vh">{say(t, N, q.ask)}</legend>
            {q.opts.map((o) => (
              <label key={o.v} className={`ca-opt ${picked.includes(o.v) ? "on" : ""}`}>
                <input type={q.multi ? "checkbox" : "radio"} name={`ca-${q.id}`} checked={picked.includes(o.v)} onChange={() => choose(o.v)} />
                <span className={`ca-mark ${q.multi ? "sq" : ""}`} aria-hidden="true" />
                {t(o.label)}
              </label>
            ))}
          </fieldset>
        </div>
      )}

      {done && <Result N={N} ans={ans} headRef={head} onRestart={() => { setAns({}); setWho(null); setFirst(""); move(0); }} />}

      {!done && (
        <div className="ca-nav">
          <button type="button" className="btn btn-ghost" onClick={() => move(step - 1)} disabled={step === 0}>
            <Icon name="left" />{t(" Back")}
          </button>
          <button type="button" className="btn btn-green" onClick={() => move(step + 1)} disabled={!canNext} aria-disabled={!canNext}>
            {t(step === QUESTIONS.length ? "See my recommendation" : q?.multi && picked.length === 0 ? "Skip" : "Next")} <Icon name="right" />
          </button>
        </div>
      )}
    </div>
  );
}

function score(ans: Record<string, string[]>) {
  let care = 0;
  let memory = 0;
  let heavy = false;
  for (const q of QUESTIONS) {
    for (const v of ans[q.id] ?? []) {
      const o = q.opts.find((x) => x.v === v);
      if (!o) continue;
      care += o.care ?? 0;
      memory += o.memory ?? 0;
      if ((o.care ?? 0) >= 3) heavy = true;
    }
  }
  const rec: LivingKey = memory >= 3 ? "harbor" : heavy || care >= 3 ? "assisted" : "independent";
  return { rec, care, memory };
}

function Result({ N, ans, headRef, onRestart }: { N: Names; ans: Record<string, string[]>; headRef: React.RefObject<HTMLHeadingElement | null>; onRestart: () => void }) {
  const { t } = useT();
  const c = useCommunity();
  const { living, plans, site } = c;
  const people = keyPeople(c);
  const contact = people.relations && !people.relations.unnamed ? people.relations : null;
  const assessor = people.residentServices && !people.residentServices.unnamed ? people.residentServices : null;
  const contactFirst = firstName(contact);
  const { rec, care, memory } = score(ans);
  const L = living[rec];
  const R = resultFor(c)[rec];
  const WANTS = wantsFor(c);
  const self = N.who === "self";
  const echoes = QUESTIONS.filter((q) => !q.multi && q.id !== "when")
    .map((q) => q.opts.find((o) => o.v === (ans[q.id] ?? [])[0])?.echo)
    .filter(Boolean) as string[];
  const wants = (ans.wants ?? []).map((w) => WANTS[w]).filter(Boolean);
  const when = ans.when?.[0];
  const social = ans.social?.[0];
  const openNow = plans.filter((p) => (rec === "harbor" ? p.kind === "harbor" : p.kind !== "harbor") && p.available > 0).reduce((s, p) => s + p.available, 0);

  const headline =
    rec === "independent" ? (
      <>
        <em>{t("Independent Living")}</em>{t(" looks like a wonderful fit")}
      </>
    ) : rec === "assisted" ? (
      <>
        <em>{t("Assisted Living Services")}</em>{t(" could make every day easier")}
      </>
    ) : (
      <>
        <em>{t("Harbor Memory Care")}</em>{t(" may be the right place")}
      </>
    );

  const why = say(t, N, (n) =>
    rec === "independent"
      ? `${self ? "You sound" : `${n.Name} sounds`} independent and ready to enjoy more of life, with none of the chores. Independent Living means a real apartment home, three restaurants, a calendar full of things to do, and our team on site 24 hours, just in case.`
      : rec === "assisted"
        ? `${self ? "You’d have your own apartment and your own routine" : `${n.Name} would have an apartment and a routine of their own`}, with a Care Partner close by for the parts of the day that have become harder${care >= 5 ? ", from medications to bathing" : ""}. Assisted Living Services are delivered discreetly in every apartment, so nobody ever has to move to get more help.`
        : `${self ? "You’d" : `${n.Name} would`} live in Harbor, our secured, home-like memory care neighborhood with its own courtyard and its own team. Harbor is built around what residents can still do and love${memory >= 4 ? "" : ", and families tell us the peace of mind comes quickly"}: weekly outings, music, gardening and purposeful roles in everyday life.`);

  return (
    <div className="ca-result">
      <div className="ca-res-hero">
        <div className="ca-res-photo">
          <Image src={R.photo} alt={t(R.alt)} fill sizes="(max-width: 860px) 100vw, 40vw" />
        </div>
        <div className="ca-res-text">
          <p className="ca-topic">{say(t, N, (n) => `Our suggestion for ${n.name}`)}</p>
          <h2 ref={headRef} tabIndex={-1}>
            {headline}
          </h2>
          <p className="ca-why">{why}</p>
          <p className="ca-from">
            <Icon name="home" /> {t(R.from)}
          </p>
          <div className="btn-row">
            <Link href={`/tour?interest=${R.interest}`} className="btn btn-lg">
              <Icon name="calendar" />{t(" Schedule a Tour")}
            </Link>
            <a href={site.phoneHref} className="btn btn-ghost btn-lg">
              <Icon name="phone" />{t(contactFirst ? ` Call ${contactFirst}` : " Call us")}
            </a>
          </div>
        </div>
      </div>

      <div className="ca-res-grid">
        <div className="ca-res-box">
          <h3>{t("What you told us")}</h3>
          <ul className="ca-echo">
            {echoes.map((e) => (
              <li key={e}>
                <Icon name="check" />
                {t(cap(e))}
              </li>
            ))}
          </ul>
          {when && (
            <p className="ca-when">
              {when === "later"
                ? t("You’re just exploring, which is the best time to start. There’s no rush and no pressure.")
                : `${t(`You’re hoping to move ${QUESTIONS.find((q) => q.id === "when")!.opts.find((o) => o.v === when)!.echo}.`)} ${t(
                    openNow > 0 ? `We have ${openNow} ${rec === "harbor" ? "Harbor room" : "apartment"}${openNow === 1 ? "" : "s"} available right now.` : `Ask ${contactFirst ?? "us"} about the waitlist; spaces open up regularly.`,
                  )}`}
            </p>
          )}
        </div>
        <div className="ca-res-box">
          <h3>{t(rec === "harbor" ? "Life in Harbor" : `What ${L.name} includes`)}</h3>
          <ul className="ca-echo">
            {L.points.slice(0, 5).map((p) => (
              <li key={p}>
                <Icon name="spark" />
                {t(p)}
              </li>
            ))}
          </ul>
        </div>
        {(wants.length > 0 || social === "more" || social === "lonely") && (
          <div className="ca-res-box ca-res-wide">
            <h3>{self ? t("Things you’ll love") : say(t, N, (n) => `Things ${n.name} will love`)}</h3>
            {(social === "more" || social === "lonely") && (
              <p>
                {self ? t("You mentioned wanting more company.") : say(t, N, (n) => `You mentioned ${n.name} ${social === "lonely" ? "is often lonely" : "would like more company"}.`)}
                {t(toolsCopy[c.slug].social)}
              </p>
            )}
            {wants.length > 0 && (
              <ul className="ca-wants">
                {wants.map((w) => (
                  <li key={w}>{t(w)}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="ca-next">
        <p>
          <strong>{t("Next step:")}</strong>
          {t(" this is a starting point, not a medical evaluation. Before move-in, ")}
          {assessor ? (
            <>
              <span data-no-translate>{assessor.name}</span>
              {t(`, our ${assessor.role}, completes a full pre-move-in assessment with `)}
            </>
          ) : (
            t("our Resident Services Director completes a full pre-move-in assessment with ")
          )}
          {self ? t("you") : say(t, N, (n) => `${n.name} and your family`)}
          {t(" and builds a care plan with your healthcare providers. To talk it through now, call ")}
          {contact && <span data-no-translate>{contact.name}</span>}
          {contact && t(" at ")}
          <a href={site.phoneHref}>{site.phone}</a>.
        </p>
        <div className="btn-row">
          <Link href="/floor-plans" className="link-arrow">
            {t("See floor plans & pricing ")}<Icon name="arrow" />
          </Link>
          <Link href="/cost-comparison" className="link-arrow">
            {t("Compare costs ")}<Icon name="arrow" />
          </Link>
          <button type="button" className="ca-restart" onClick={onRestart}>
            {t("Start over")}
          </button>
        </div>
      </div>
    </div>
  );
}
