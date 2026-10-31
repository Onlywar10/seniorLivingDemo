// Reading the staff community selection on the server (Server Components only).
import { cookies } from "next/headers";
import { communities, type Community } from "@/data/communities";
import { getStaffData } from "./index";
import { STAFF_COOKIE, parseStaffScope, type StaffData, type StaffScope } from "./shared";

/** The community the staff screens show (from the `wh-staff-community` cookie), or "all". Defaults to Alder Bend. */
export async function getStaffScope(): Promise<StaffScope> {
  return parseStaffScope((await cookies()).get(STAFF_COOKIE)?.value);
}

/** The selected community's staff data and public data, or null in the Wrenhaven overview. */
export async function getStaffCommunity(): Promise<{ s: StaffData; c: Community } | null> {
  const scope = await getStaffScope();
  return scope === "all" ? null : { s: getStaffData(scope), c: communities[scope] };
}
