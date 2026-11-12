// Reading the staff community selection and the signed-in person on the server (Server Components only).
import { cookies } from "next/headers";
import { communities, type Community } from "@/data/communities";
import { getStaffData } from "./index";
import type { AreaState } from "./areas";
import { ALERTS_COOKIE, parseRules, rulesWith } from "./signals";
import { AREAS_COOKIE, ASSIGN_COOKIE, AS_COOKIE, STAFF_COOKIE, parseAs, parseStaffScope, type StaffData, type StaffRole, type StaffScope } from "./shared";

/** The community the staff screens show (from the `wh-staff-community` cookie), or "all". Defaults to Alder Bend. */
export async function getStaffScope(): Promise<StaffScope> {
  return parseStaffScope((await cookies()).get(STAFF_COOKIE)?.value);
}

/** The selected community's staff data and public data, or null in the Wrenhaven overview. */
export async function getStaffCommunity(): Promise<{ s: StaffData; c: Community } | null> {
  const scope = await getStaffScope();
  return scope === "all" ? null : { s: getStaffData(scope), c: communities[scope] };
}

/** Who is signed in (from the `wh-staff-as` cookie). */
export async function getStaffRole(): Promise<StaffRole> {
  return parseAs((await cookies()).get(AS_COOKIE)?.value);
}

/** Settings → Approvals and alerts: who each kind of signal goes to, how urgent it is, and whether it texts. */
export async function getAlertRules() {
  return rulesWith(parseRules((await cookies()).get(ALERTS_COOKIE)?.value));
}

/** "Who looks after whom": the administrator's switch in Settings, and residents placed in an area by hand. */
export async function getAreaState(): Promise<AreaState> {
  const jar = await cookies();
  let placed: Record<string, string> = {};
  try { placed = JSON.parse(decodeURIComponent(jar.get(ASSIGN_COOKIE)?.value ?? "%7B%7D")); } catch { placed = {}; }
  return { on: jar.get(AREAS_COOKIE)?.value === "on", placed };
}
