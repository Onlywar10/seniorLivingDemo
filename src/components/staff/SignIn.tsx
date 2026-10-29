"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { user } from "@/data/staff";

export function SignIn() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="sx-form sx-login-form"
      onSubmit={(e) => {
        e.preventDefault();
        setBusy(true);
        window.setTimeout(() => router.push("/staff/dashboard"), 500);
      }}
    >
      <h1>Welcome back</h1>
      <label>
        Work email
        <input type="email" defaultValue={user.email} autoComplete="username" />
      </label>
      <label>
        Password
        <input type="password" defaultValue="larkmoor-staff" autoComplete="current-password" />
      </label>
      <label className="sx-check">
        <input type="checkbox" defaultChecked /> Keep me signed in on this device
      </label>
      <button className="sx-btn sx-btn-primary sx-btn-lg" type="submit" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
      <button className="sx-btn sx-btn-lg" type="button" onClick={() => router.push("/staff/dashboard")}>
        Sign in with Microsoft
      </button>
      <a href="#" className="sx-link">
        Forgotten your password?
      </a>
    </form>
  );
}
