import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Shell } from "@/components/staff/Shell";
import "../staff.css";

export const metadata: Metadata = {
  title: { default: "Team · Prairie City Landing", template: "%s · PCL Team" },
  robots: { index: false, follow: false },
};

export default function StaffLayout({ children }: { children: ReactNode }) {
  return <Shell>{children}</Shell>;
}
