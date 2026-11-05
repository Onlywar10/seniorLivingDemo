// The community's upcoming public and family events, placed relative to today so the calendar always has one of each
// coming up: an open house anyone can sign up for, and a family barbecue families RSVP to from their weekly message.
import { addDays, dow, iso, today } from "@/lib/clock";
import type { CalEvent } from "@/data/shared";

type Seed = Omit<CalEvent, "id" | "date">;

/** The first `weekday` (0 = Sunday) that is at least `from` days after today. */
function nextWeekday(weekday: number, from: number): string {
  const start = addDays(today(), from);
  return iso(addDays(start, (weekday - dow(start) + 7) % 7));
}

export interface SpecialsCopy {
  /** Where the open house starts ("Lobby and model apartments"). */
  openHouseRoom: string;
  /** Where the barbecue is ("Courtyard"). */
  barbecueRoom: string;
  /** The restaurant serving lunch at the open house. */
  lunchAt: string;
}

/** The public and family events falling on `dateIso`. */
export function specialsOn(dateIso: string, copy: SpecialsCopy): Seed[] {
  const out: Seed[] = [];
  if (dateIso === nextWeekday(6, 8)) {
    out.push({
      kind: "public",
      start: 10 * 60,
      end: 13 * 60,
      title: "Open House & Lunch",
      desc: `Walk through the model apartments, meet the team and stay for lunch in ${copy.lunchAt}, on us. Bring a friend or a family member. Please let us know you’re coming so lunch is ready for you.`,
      room: copy.openHouseRoom,
      cat: "community",
      special: true,
    });
  }
  if (dateIso === nextWeekday(0, 9)) {
    out.push({
      kind: "family",
      start: 12 * 60,
      end: 14 * 60 + 30,
      title: "Family Barbecue",
      desc: "Burgers, corn on the cob and lemonade with the residents, lawn games for the grandchildren and live music from the Calder Strings.",
      room: copy.barbecueRoom,
      cat: "community",
      special: true,
    });
  }
  return out;
}

/** The dates of the next open house and family barbecue, for screens that link to them. */
export const nextSpecials = () => ({ openHouse: nextWeekday(6, 8), barbecue: nextWeekday(0, 9) });
