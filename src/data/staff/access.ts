// Which part of a section the signed-in person may use (Server Components only).
import { getStaffRole } from "./server";
import { accessOf, type Access, type Section, type StaffRole } from "./shared";

/** The signed-in role and what it may do in `section` (undefined: not part of their role). */
export async function sectionAccess(section: Section): Promise<{ as: StaffRole; access: Access | undefined }> {
  const as = await getStaffRole();
  return { as, access: accessOf(as, section) };
}
