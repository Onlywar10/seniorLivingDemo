// The interests an event matches, from its title: the same rules Kinlight uses on the calendar. Used to suggest
// interests on a new event, and to pick the activities on a resident's week page that match what they enjoy.
// Safe on the server and in the browser.
import type { Interest } from "@/data/staff/engage";

export function interestsFromTitle(title: string): Interest[] {
  const t = title.toLowerCase();
  const out: Interest[] = [];
  if (/yoga|fit|stretch|balance|walk|tai chi|exercise|dance/.test(t)) out.push("Fitness");
  if (/bridge|bingo|cards|mahjong|poker|canasta|trivia|game/.test(t)) out.push("Cards and games");
  if (/music|concert|choir|sing|piano|jazz|band|hymn/.test(t)) out.push("Music");
  if (/trip|tour|bus|outing|lights|museum|shopping/.test(t)) out.push("Outings");
  if (/paint|craft|knit|art|pumpkin|wreath|clay|card making/.test(t)) out.push("Crafts");
  if (/garden|flower|plant|orchard/.test(t)) out.push("Gardening");
  if (/cook|bak|chef|tasting|wine|tea|fish fry|breakfast/.test(t)) out.push("Cooking");
  if (/lecture|talk|class|book|history|learn|lesson|video call/.test(t)) out.push("Learning");
  if (/movie|film|cine|matinee/.test(t)) out.push("Movies");
  if (/faith|mass|church|worship|bible|rosary|chapel/.test(t)) out.push("Faith");
  return out.filter((x, i, a) => a.indexOf(x) === i).slice(0, 2);
}
