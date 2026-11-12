// A resident's name that opens their page, wherever it appears.
import Link from "next/link";
import { familyHref, residentHref } from "./residentHref";

export function ResidentLink({ name, children, bold = true }: { name: string; children?: React.ReactNode; bold?: boolean }) {
  return <Link className={`pt-name${bold ? " b" : ""}`} href={residentHref(name)}>{children ?? name}</Link>;
}

/** A family member's name: opens their resident's page at the Family tab, on them, with Text and Email there. */
export function FamilyLink({ name, resident, children, bold = true }: { name: string; resident?: string; children?: React.ReactNode; bold?: boolean }) {
  if (!resident) return <>{children ?? name}</>;
  return <Link className={`pt-name${bold ? " b" : ""}`} href={familyHref(resident, name)}>{children ?? name}</Link>;
}
