// What happens at an activity, for a resident deciding whether to go: a short description and a plan of the time
// ("2:00 Welcome and tea · 2:10 The talk, with photos · 2:50 Questions"). Staff can write their own on Post; when they
// haven't, Kinlight drafts one from the kind of activity, its title and its times. Safe on the server and in the browser.

/** One step of the plan: when (minutes since midnight) and what happens. */
export interface PlanStep { at: number; what: string }

type Shape = "trip" | "shop" | "fitness" | "games" | "music" | "movie" | "faith" | "talk" | "craft" | "food" | "social";

function shapeOf(e: { title: string; cat: string }): Shape {
  const t = e.title.toLowerCase();
  if (/shopping|store|market|mall/.test(t)) return "shop";
  if (e.cat === "trips" || /bus trip|outing|museum|tour\b/.test(t)) return "trip";
  if (/paint|craft|knit|clay|wreath|card making|art\b/.test(t)) return "craft";
  if (/cook|bak|tasting|wine|tea\b|breakfast|lunch|brunch|social hour|happy hour/.test(t)) return /happy hour/.test(t) ? "music" : "food";
  if (/talk|lecture|class|travel|history|book|learn|story/.test(t)) return "talk";
  if (e.cat === "fitness") return "fitness";
  if (e.cat === "clubs") return "games";
  if (e.cat === "music") return "music";
  if (e.cat === "movies") return "movie";
  if (e.cat === "faith") return "faith";
  return "social";
}

const round5 = (m: number) => Math.round(m / 5) * 5;
const clean = (title: string) => title.replace(/^Bus Trip:\s*/i, "").replace(/^Shopping:\s*/i, "");

/** Kinlight's draft of the plan, three or four steps across the time. */
export function draftPlan(e: { title: string; cat: string; start: number; end?: number; room?: string; stops?: { name: string; mins: number }[] }): PlanStep[] {
  const end = e.end ?? e.start + 60;
  const len = Math.max(15, end - e.start);
  const at = (f: number) => round5(e.start + len * f);
  const name = clean(e.title);
  const room = e.room ? ` in the ${e.room.replace(/^The /, "")}` : "";
  // Off campus: the bus goes to each stop in turn, with the time there shared between them.
  if (e.stops?.length) {
    const there = e.start + 15 + e.stops[0].mins;
    const back = Math.max(there + 10, end - e.stops[e.stops.length - 1].mins);
    const each = (back - there) / e.stops.length;
    return [
      { at: e.start, what: "Meet in the lobby; staff check everyone in" },
      { at: e.start + 15, what: "The bus leaves" },
      ...e.stops.map((s, i) => ({ at: round5(there + each * i), what: i === 0 ? `Arrive at ${s.name}` : `On to ${s.name}` })),
      { at: round5(back), what: "Back on the bus" },
      { at: end, what: "Home again" },
    ];
  }
  switch (shapeOf(e)) {
    case "trip": return [
      { at: e.start, what: `Meet${room}; staff check everyone in` },
      { at: e.start + 15, what: "The bus leaves" },
      { at: at(0.25), what: `${name}: time to explore at your own pace` },
      { at: Math.max(e.start + 30, end - 30), what: "Back on the bus" },
      { at: end, what: "Home again" },
    ];
    case "shop": return [
      { at: e.start, what: `Meet${room}` },
      { at: e.start + 15, what: `The bus leaves for ${name}` },
      { at: at(0.3), what: "Shop with a staff member nearby to help carry" },
      { at: end, what: "Back home" },
    ];
    case "fitness": return [
      { at: e.start, what: "Warm-up and gentle stretches (chairs available)" },
      { at: at(0.2), what: `${name}, at your own pace` },
      { at: Math.max(at(0.2) + 5, end - 10), what: "Cool down, water and a chat" },
    ];
    case "games": return [
      { at: e.start, what: "Find a table and say hello; new players are paired up" },
      { at: at(0.1), what: `${name}: play starts` },
      { at: Math.max(at(0.1) + 5, end - 10), what: "Final scores and coffee" },
    ];
    case "music": return [
      { at: e.start, what: "Doors open: find a seat, drinks served" },
      { at: at(0.15), what: `${name}: music and sing-along` },
      { at: Math.max(at(0.15) + 5, end - 15), what: "Requests and chat" },
    ];
    case "movie": return [
      { at: e.start, what: "Popcorn and settle in" },
      { at: e.start + 10, what: `${name} starts` },
      { at: end, what: "Ends; stay for a chat about it" },
    ];
    case "faith": return [
      { at: e.start, what: "Gather and quiet time" },
      { at: e.start + 5, what: name },
      { at: Math.max(e.start + 10, end - 10), what: "Fellowship and refreshments" },
    ];
    case "talk": return [
      { at: e.start, what: "Welcome, with tea and coffee" },
      { at: at(0.15), what: `${name}, with pictures on the big screen` },
      { at: Math.max(at(0.15) + 5, end - 15), what: "Questions and stories from the room" },
    ];
    case "craft": return [
      { at: e.start, what: "Supplies out: choose your project" },
      { at: at(0.15), what: "Make it, with help on hand" },
      { at: Math.max(at(0.15) + 5, end - 10), what: "Tidy up and show what you made" },
    ];
    case "food": return [
      { at: e.start, what: "Welcome and a seat at the table" },
      { at: at(0.15), what: `${name}: taste, talk and try` },
      { at: Math.max(at(0.15) + 5, end - 10), what: "Recipes to take home" },
    ];
    default: return [
      { at: e.start, what: "Welcome" },
      { at: at(0.15), what: name },
      { at: Math.max(at(0.15) + 5, end - 10), what: "Chat and refreshments" },
    ];
  }
}

/** Kinlight's short description, for an activity staff haven't described. */
export function draftDescription(e: { title: string; cat: string }): string {
  const name = clean(e.title);
  switch (shapeOf(e)) {
    case "trip": return `An outing to ${name}. The bus leaves from here and brings everyone back; staff come along the whole time.`;
    case "shop": return `A shopping trip to ${name}. Bring a list; staff help with bags and the walk to and from the bus.`;
    case "fitness": return `${name}: a gentle session for every ability, seated or standing. Wear comfortable shoes and bring water.`;
    case "games": return `${name}: friendly games, new players welcome. Someone will show you how to play.`;
    case "music": return `${name}: music, drinks and good company. Come for a song or stay for the whole thing.`;
    case "movie": return `${name} on the big screen, with popcorn.`;
    case "faith": return `${name}, open to everyone who'd like to join.`;
    case "talk": return `${name}: an easy-going talk with pictures, then time for your questions and stories.`;
    case "craft": return `${name}: everything you need is provided, and no experience is needed.`;
    case "food": return `${name}: something good to taste and talk about, and recipes to take home.`;
    default: return `${name}: come along, meet your neighbours and enjoy it.`;
  }
}
