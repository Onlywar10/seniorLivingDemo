// Surveys: what the builder, the survey page and the server all share. Question types, the ready-made templates
// (written once, in English, Spanish and Chinese), a time estimate, "Write it for me", and the words on the survey
// page itself in each language. No imports, so client components can use it.
import type { L, MsgLang } from "./autoText";

export type QType = "rating" | "yesno" | "one" | "many" | "nps" | "text";
export const Q_TYPES: { k: QType; label: string; hint: string }[] = [
  { k: "rating", label: "1 to 5", hint: "Faces or stars" },
  { k: "yesno", label: "Yes or no", hint: "Two big buttons" },
  { k: "one", label: "Choose one", hint: "A short list" },
  { k: "many", label: "Choose several", hint: "Tick all that apply" },
  { k: "nps", label: "Would you recommend (0–10)", hint: "The recommend score" },
  { k: "text", label: "A short written answer", hint: "In their own words" },
];

export interface Question {
  id: string;
  type: QType;
  text: L;
  options?: L[];
  optional?: boolean;
  /** "Only ask if…": ask this one only when an earlier answer is one of these (a rating of 1 or 2, "No"). */
  onlyIf?: { q: string; in: (string | number)[] };
  /** Ratings: faces (the default, easier to read) or stars. */
  look?: "faces" | "stars";
  /** Written by staff and not yet translated: Kinlight translates it when the survey is approved. */
  fresh?: boolean;
}

const q = (id: string, type: QType, en: string, es: string, zh: string, more: Partial<Question> = {}): Question => ({ id, type, text: { en, es, zh }, ...more });
const o = (en: string, es: string, zh: string): L => ({ en, es, zh });

/** Every question the templates use, written once in each language. */
export const BANK: Record<string, Question> = Object.fromEntries([
  q("know", "rating", "I know what’s happening in my loved one’s community", "Sé lo que pasa en la comunidad de mi ser querido", "我了解亲人所在社区的动态"),
  q("part", "rating", "I feel part of the community", "Me siento parte de la comunidad", "我觉得自己是社区的一员"),
  q("useful", "rating", "Messages from the community are useful, not too many", "Los mensajes de la comunidad son útiles, y no demasiados", "社区发来的消息有用且不过多"),
  q("nps", "nps", "How likely are you to recommend {community} to a friend?", "¿Qué tan probable es que recomiende {community} a un amigo?", "您向朋友推荐 {community} 的可能性有多大？"),
  q("better", "text", "What’s one thing we could do better?", "¿Qué es algo que podríamos hacer mejor?", "我们有哪一点可以做得更好？", { optional: true }),
  q("week", "rating", "I know what’s on each week", "Sé qué actividades hay cada semana", "我知道每周有哪些活动"),
  q("ideas", "rating", "My ideas are listened to", "Se escuchan mis ideas", "我的想法会被倾听"),
  q("thank", "text", "Is there someone on the team you’d like to thank?", "¿Hay alguien del equipo a quien quiera dar las gracias?", "您想感谢团队中的哪位成员吗？", { optional: true }),
  q("food", "rating", "How was the food?", "¿Qué le pareció la comida?", "饭菜怎么样？"),
  q("wrong", "text", "Sorry to hear that. What went wrong?", "Lamentamos oírlo. ¿Qué salió mal?", "很抱歉。哪里出了问题？", { onlyIf: { q: "food", in: [1, 2] } }),
  q("service", "rating", "How was the service?", "¿Qué le pareció el servicio?", "服务怎么样？"),
  q("meal", "one", "Which meal do you usually come to?", "¿A qué comida suele venir?", "您通常来吃哪一餐？", { options: [o("Breakfast", "Desayuno", "早餐"), o("Lunch", "Almuerzo", "午餐"), o("Dinner", "Cena", "晚餐")] }),
  q("more", "many", "What would you like to see more of?", "¿Qué le gustaría ver más a menudo?", "您希望多供应哪些？", { options: [o("Fish", "Pescado", "鱼类"), o("Vegetarian dishes", "Platos vegetarianos", "素食"), o("Soups", "Sopas", "汤品"), o("Lighter portions", "Porciones más ligeras", "小份餐")] }),
  q("dine", "text", "Anything else about dining?", "¿Algo más sobre las comidas?", "关于餐饮还有其他意见吗？", { optional: true }),
  q("enjoy", "rating", "How was {event}?", "¿Qué le pareció {event}?", "{event}怎么样？"),
  q("again", "yesno", "Would you go again?", "¿Volvería a ir?", "您还会再去吗？"),
  q("evnote", "text", "Anything you’d change?", "¿Cambiaría algo?", "有什么想改进的吗？", { optional: true }),
  q("settle", "rating", "How settled do you feel?", "¿Qué tan a gusto se siente?", "您适应得怎么样？"),
  q("whom", "yesno", "Do you know who to ask when you need something?", "¿Sabe a quién pedir ayuda cuando necesita algo?", "需要帮助时，您知道该找谁吗？"),
  q("friend", "yesno", "Have you made a friend here yet?", "¿Ya hizo algún amigo aquí?", "您在这里交到朋友了吗？"),
  q("heard", "rating", "How well have we kept you informed?", "¿Qué tan bien le hemos mantenido informado?", "我们让您了解情况做得如何？"),
  q("how", "one", "How would you like to hear from us?", "¿Cómo prefiere que nos comuniquemos?", "您希望我们如何联系您？", { options: [o("Text", "Mensaje de texto", "短信"), o("Email", "Correo electrónico", "电子邮件"), o("Both", "Ambos", "两者都要")] }),
  q("stime", "rating", "Posting an update takes me less time than before", "Publicar una novedad me lleva menos tiempo que antes", "发布动态比以前省时"),
  q("sknow", "rating", "I know what families are hearing from us", "Sé lo que escuchan las familias de nosotros", "我知道家属从我们这里收到了哪些消息"),
  q("srec", "rating", "I’d recommend Kinlight to a colleague at another community", "Recomendaría Kinlight a un colega de otra comunidad", "我会向其他社区的同事推荐 Kinlight"),
  q("snote", "text", "Anything else?", "¿Algo más?", "还有其他想说的吗？", { optional: true }),
  q("famev", "rating", "How was {event} for your family?", "¿Qué tal fue {event} para su familia?", "{event}对您全家来说怎么样？"),
  q("famnext", "yesno", "Would you come to the next family event?", "¿Vendría al próximo evento familiar?", "您会参加下一次家庭活动吗？"),
  q("evtime", "one", "What time suits you best for evening events?", "¿A qué hora le vienen mejor los eventos de la tarde?", "傍晚活动安排在什么时间最适合您？", { options: [o("5:00 pm", "5:00 p. m.", "下午5:00"), o("6:00 pm", "6:00 p. m.", "晚上6:00"), o("7:00 pm", "7:00 p. m.", "晚上7:00"), o("Earlier, in the afternoon", "Más temprano, por la tarde", "更早，下午时段")] }),
  q("evwhy", "many", "What keeps you from coming in the evening?", "¿Qué le impide venir por la tarde?", "是什么让您不方便参加傍晚活动？", { options: [o("It’s too late in the day", "Es demasiado tarde", "时间太晚"), o("I don’t like going out after dark", "No me gusta salir de noche", "天黑后不想出门"), o("I’m tired after dinner", "Estoy cansado después de cenar", "晚饭后比较累"), o("I don’t hear about them in time", "No me entero a tiempo", "没能及时得知")] }),
  q("evwish", "text", "What evening activity would you come to?", "¿A qué actividad de la tarde vendría?", "您愿意参加什么样的傍晚活动？", { optional: true }),
].map((x) => [x.id, x]));

const pick = (...ids: string[]) => ids.map((id) => ({ ...BANK[id] }));

export type Audience = "families" | "residents" | "staff" | "prospects";
export type Area = "community" | "dining" | "activities" | "lantern" | "sales" | "staff";

export interface Template {
  id: string; name: string; about: string; area: Area; audience: Audience[]; questions: Question[];
  /** How it usually repeats. */
  repeat?: Repeat; trigger?: Trigger;
  anonymous?: boolean; paper?: boolean;
  /** Saved by someone at the community (otherwise built in, approved by Kinlight). */
  savedBy?: string;
  /** The invitation's topic: "Alder Bend would love your thoughts on dining". */
  topic: L;
}
export type Repeat = "monthly" | "3 months" | "6 months" | "yearly";
export type Trigger = "after-event" | "after-trip" | "move-in-30" | "family-30" | "after-tour";
export const REPEATS: { k: Repeat; label: string }[] = [{ k: "monthly", label: "Every month" }, { k: "3 months", label: "Every 3 months" }, { k: "6 months", label: "Every 6 months" }, { k: "yearly", label: "Every year" }];
export const TRIGGERS: { k: Trigger; label: string }[] = [
  { k: "after-event", label: "The day after an event" },
  { k: "after-trip", label: "The day after every bus trip" },
  { k: "move-in-30", label: "30 days after move-in" },
  { k: "family-30", label: "30 days after a family joins" },
  { k: "after-tour", label: "The day after a tour" },
];

export const TEMPLATES: Template[] = [
  { id: "t-family", name: "Family satisfaction", about: "The day-90 and six-monthly family survey", area: "community", audience: ["families"], repeat: "6 months", questions: pick("know", "part", "useful", "nps", "better"), topic: o("how we’re doing", "cómo lo estamos haciendo", "我们的服务") },
  { id: "t-resident", name: "Resident satisfaction", about: "Printed, or read aloud by staff", area: "community", audience: ["residents"], repeat: "6 months", paper: true, anonymous: true, questions: pick("week", "part", "ideas", "thank"), topic: o("life here", "la vida aquí", "在这里的生活") },
  { id: "t-dining", name: "Dining experience", about: "Food, service and what to cook more of", area: "dining", audience: ["residents", "families"], questions: pick("food", "wrong", "service", "meal", "more", "dine"), topic: o("dining", "las comidas", "餐饮") },
  { id: "t-event", name: "After an event", about: "“How was the Veterans’ Lunch?”", area: "activities", audience: ["residents"], trigger: "after-event", questions: pick("enjoy", "again", "evnote"), topic: o("{event}", "{event}", "{event}") },
  { id: "t-newres", name: "New resident, 30 days in", about: "How the first month went", area: "community", audience: ["residents"], trigger: "move-in-30", paper: true, questions: pick("settle", "whom", "friend", "better"), topic: o("your first month", "su primer mes", "您入住的第一个月") },
  { id: "t-newfam", name: "New family, 30 days in", about: "Are we keeping them in the loop?", area: "community", audience: ["families"], trigger: "family-30", questions: pick("heard", "how", "better"), topic: o("your first month with us", "su primer mes con nosotros", "您与我们相处的第一个月") },
  { id: "t-nps", name: "Would you recommend us? (0–10)", about: "One question, and why", area: "community", audience: ["families", "residents"], questions: [BANK.nps, { ...BANK.better, onlyIf: { q: "nps", in: [0, 1, 2, 3, 4, 5, 6] } }], topic: o("recommending us", "si nos recomendaría", "是否会推荐我们") },
  { id: "t-staff", name: "Staff pulse", about: "Three questions, two minutes, monthly", area: "staff", audience: ["staff"], repeat: "monthly", anonymous: true, questions: pick("stime", "sknow", "srec", "snote"), topic: o("this month", "este mes", "本月") },
];

/** Nora's own template, saved from a past family event, like saving a past event. */
export const savedTemplate = (by: string): Template => ({ id: "t-famevent", name: "After a family event", about: `Saved by ${by} from the Family Barbecue`, area: "activities", audience: ["families"], trigger: "after-event", savedBy: by, questions: pick("famev", "famnext", "evnote"), topic: o("{event}", "{event}", "{event}") });

/** About how long it takes: ratings and yes/no are quick, written answers take longest. */
export function minutes(qs: Question[]): number {
  const secs = qs.reduce((n, x) => n + (x.type === "text" ? 35 : x.type === "many" ? 15 : x.type === "nps" ? 10 : 8), 0);
  return Math.max(1, Math.round(secs / 60));
}
export const minutesLabel = (qs: Question[]) => { const m = minutes(qs); return `About ${m} ${m === 1 ? "minute" : "minutes"}`; };

/** "Write it for me": a first draft from what someone wants to find out, from the question bank (so every question
 *  is already written in each language). The person edits it before anything is sent. */
export function draftFor(goal: string): { title: string; questions: Question[]; area: Area; audience: Audience[] } {
  const g = goal.toLowerCase();
  if (/evening|night|late/.test(g)) return { title: "Evening events", area: "activities", audience: ["residents"], questions: pick("evtime", "evwhy", "evwish", "week") };
  if (/dining|food|meal|lunch|dinner|menu|kitchen/.test(g)) return { title: "Dining", area: "dining", audience: ["residents", "families"], questions: pick("food", "wrong", "service", "more", "dine") };
  if (/family|families|update|message|text|hear/.test(g)) return { title: "Keeping families informed", area: "community", audience: ["families"], questions: pick("heard", "useful", "how", "better") };
  if (/new|move|settl|first/.test(g)) return { title: "Settling in", area: "community", audience: ["residents"], questions: pick("settle", "whom", "friend", "better") };
  if (/trip|outing|event|activit|class/.test(g)) return { title: "Activities", area: "activities", audience: ["residents"], questions: pick("week", "ideas", "evwish") };
  return { title: "A few quick questions", area: "community", audience: ["families"], questions: pick("part", "nps", "better") };
}

/** The invitation text: "Alder Bend would love your thoughts on dining. It takes about 2 minutes: [link]". */
export const INVITE: L = {
  en: "Hi {first name}, {community} would love your thoughts on {topic}. It takes about {minutes} {unit}: {link}",
  es: "Hola, {first name}: a {community} le encantaría conocer su opinión sobre {topic}. Le tomará unos {minutes} {unit}: {link}",
  zh: "{first name}您好，{community} 很想听听您对{topic}的看法。大约只需 {minutes} {unit}：{link}",
};
export const REMINDER: L = {
  en: "Hi {first name}, a gentle reminder: {community} would still love your thoughts on {topic}. About {minutes} {unit}: {link}",
  es: "Hola, {first name}: un recordatorio amable. A {community} todavía le encantaría conocer su opinión sobre {topic}. Unos {minutes} {unit}: {link}",
  zh: "{first name}您好，温馨提醒：{community} 仍然很想听听您对{topic}的看法。大约 {minutes} {unit}：{link}",
};
export const unitIn = (lang: MsgLang, n: number) => (lang === "es" ? (n === 1 ? "minuto" : "minutos") : lang === "zh" ? "分钟" : n === 1 ? "minute" : "minutes");

/** The words on the survey page itself, in the person's language. */
export const PAGE: Record<string, L> = {
  of: { en: "Question {n} of {total}", es: "Pregunta {n} de {total}", zh: "第 {n} 题，共 {total} 题" },
  next: { en: "Next", es: "Siguiente", zh: "下一题" },
  back: { en: "Back", es: "Atrás", zh: "上一题" },
  skip: { en: "Skip this one", es: "Omitir esta", zh: "跳过此题" },
  finish: { en: "Send my answers", es: "Enviar mis respuestas", zh: "提交答案" },
  optional: { en: "Optional", es: "Opcional", zh: "选答" },
  yes: { en: "Yes", es: "Sí", zh: "是" },
  no: { en: "No", es: "No", zh: "否" },
  type: { en: "Type your answer here", es: "Escriba aquí su respuesta", zh: "请在此输入您的回答" },
  several: { en: "Choose all that apply", es: "Elija todas las que correspondan", zh: "可多选" },
  notLikely: { en: "Not likely", es: "Poco probable", zh: "不太可能" },
  veryLikely: { en: "Very likely", es: "Muy probable", zh: "非常可能" },
  r1: { en: "Very poor", es: "Muy mal", zh: "很差" }, r2: { en: "Poor", es: "Mal", zh: "较差" }, r3: { en: "Okay", es: "Regular", zh: "一般" }, r4: { en: "Good", es: "Bien", zh: "好" }, r5: { en: "Excellent", es: "Excelente", zh: "非常好" },
  anon: { en: "Your answers are anonymous: nobody will see who said what.", es: "Sus respuestas son anónimas: nadie verá quién dijo qué.", zh: "您的回答是匿名的，任何人都看不到是谁的回答。" },
  named: { en: "Your name goes with your answers, so we can follow up if you’d like.", es: "Su nombre acompaña sus respuestas, para que podamos darle seguimiento si lo desea.", zh: "您的回答会附上您的姓名，方便我们在需要时跟进。" },
  resume: { en: "Welcome back. We kept your place.", es: "Bienvenido de nuevo. Guardamos su avance.", zh: "欢迎回来，我们已为您保存进度。" },
  start: { en: "Start", es: "Empezar", zh: "开始" },
  closed: { en: "This survey has closed. Thank you for thinking of us. If you’d still like to tell us something, call {phone}.", es: "Esta encuesta ya cerró. Gracias por pensar en nosotros. Si aún desea decirnos algo, llame al {phone}.", zh: "本次调查已结束，感谢您的关心。如仍有意见，请致电 {phone}。" },
  done: { en: "You’ve already answered this one. Thank you!", es: "Ya respondió esta encuesta. ¡Gracias!", zh: "您已完成本次调查，谢谢！" },
  closes: { en: "Open until {date}", es: "Abierta hasta el {date}", zh: "开放至 {date}" },
  readAloud: { en: "Read this aloud, then tap their answer", es: "Lea esto en voz alta y toque la respuesta", zh: "请朗读题目，然后点选对方的回答" },
};
export const pageText = (k: keyof typeof PAGE, lang: MsgLang, vars: Record<string, string | number> = {}) => PAGE[k][lang].replace(/\{(\w+)\}/g, (_, v) => String(vars[v] ?? `{${v}}`));

export const THANKS: L = {
  en: "Thank you! Your answers help us make {community} better. We read every one.",
  es: "¡Gracias! Sus respuestas nos ayudan a mejorar {community}. Leemos cada una.",
  zh: "谢谢您！您的回答帮助我们把 {community} 做得更好，每一份我们都会认真阅读。",
};

/** Should this question be asked, given the answers so far ("only ask if…")? */
export function asks(x: Question, answers: Record<string, unknown>): boolean {
  if (!x.onlyIf) return true;
  const a = answers[x.onlyIf.q];
  return a !== undefined && x.onlyIf.in.some((v) => String(v) === String(a));
}

export const typeLabel = (t: QType) => Q_TYPES.find((x) => x.k === t)?.label ?? t;
