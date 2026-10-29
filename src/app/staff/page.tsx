import type { Metadata } from "next";
import Image from "next/image";
import { SignIn } from "@/components/staff/SignIn";
import "./staff.css";

export const metadata: Metadata = { title: { absolute: "Sign in · Larkmoor Staff" } };

export default function StaffSignIn() {
  return (
    <div className="sx-login" data-no-translate>
      <div className="sx-login-photo">
        <Image src="/photos/building-garden.jpg" alt="" fill priority sizes="50vw" />
      </div>
      <div className="sx-login-panel">
        <div className="sx-brand sx-brand-lg">
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <rect width="64" height="64" fill="#4F6353" />
            <path d="M46 16c-16 0-27 8-29 24 0 2 0 4 1 6 8-14 17-19 25-22-8 5-16 12-22 26 3 1 6 1 9 1 14-1 21-14 20-30-1-2-2-4-4-5z" fill="#D6C28C" />
          </svg>
          <span>
            <b>Larkmoor</b>
            <span>Staff sign in</span>
          </span>
        </div>
        <SignIn />
        <p className="sx-login-foot">Larkmoor Senior Living · for staff of our six communities. Trouble signing in? Call the central office on (503) 555-0100.</p>
      </div>
    </div>
  );
}
