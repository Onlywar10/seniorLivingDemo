import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { Shell } from "@/components/staff/Shell";
import "../staff.css";

export const metadata: Metadata = { title: { default: "Larkmoor Staff", template: "%s · Larkmoor Staff" } };

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense>
      <Shell>{children}</Shell>
    </Suspense>
  );
}
