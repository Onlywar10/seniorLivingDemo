// The least the browser needs to count what's waiting: each card's id, who it's for and when it's due. The menu badge,
// the Today heading and Today's list all count with the same rule. Safe on the server and in the browser.
import type { QItem } from "./portal";
import type { StaffRole } from "./shared";

export type { ConcernOwner, QItem } from "./portal";
export interface QLite { id: string; for: StaffRole[]; due: number }
export const lite = (items: QItem[]): QLite[] => items.map((q) => ({ id: q.id, for: q.for, due: q.due ?? 0 }));
