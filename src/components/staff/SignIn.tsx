"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { user } from "@/data/staff/people";
import { Icon } from "../Icon";

export function SignIn() {
  const router = useRouter();
  const [mode, setMode] = useState<"password" | "link">("password");
  const [email, setEmail] = useState(user.email);
  const [stage, setStage] = useState<"idle" | "busy" | "sent">("idle");

  const go = () => window.setTimeout(() => router.push("/staff/today"), 450);

  if (stage === "sent") {
    return (
      <div className="sx-login-form sx-sent" role="status">
        <span className="sx-sent-i">
          <Icon name="mail" />
        </span>
        <h1>Check your email</h1>
        <p>
          We sent a sign-in link to <b>{email || user.email}</b>. It works for 15 minutes on this device.
        </p>
        <button className="sx-btn sx-btn-primary sx-btn-lg" type="button" onClick={() => router.push("/staff/today")}>
          Open the link
        </button>
        <button className="sx-btn sx-btn-lg" type="button" onClick={() => setStage("idle")}>
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form
      className="sx-form sx-login-form"
      onSubmit={(e) => {
        e.preventDefault();
        setStage("busy");
        if (mode === "link") window.setTimeout(() => setStage("sent"), 500);
        else go();
      }}
    >
      <h1>Welcome back</h1>
      <label>
        Work email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
      </label>
      {mode === "password" && (
        <label>
          Password
          <input type="password" defaultValue="••••••••••" autoComplete="current-password" />
        </label>
      )}
      {mode === "password" && (
        <label className="sx-check">
          <input type="checkbox" defaultChecked /> Keep me signed in on this device
        </label>
      )}
      <button className="sx-btn sx-btn-primary sx-btn-lg" type="submit" disabled={stage === "busy"}>
        {stage === "busy" ? (mode === "link" ? "Sending…" : "Signing in…") : mode === "link" ? "Send me a sign-in link" : "Sign in"}
      </button>
      <div className="sx-or">
        <span>or</span>
      </div>
      <button className="sx-btn sx-btn-lg" type="button" onClick={() => setMode(mode === "password" ? "link" : "password")}>
        <Icon name={mode === "password" ? "mail" : "lock"} /> {mode === "password" ? "Send me a sign-in link instead" : "Sign in with a password"}
      </button>
      <a href="#" className="sx-link" onClick={(e) => { e.preventDefault(); setMode("link"); }}>
        Forgot your password?
      </a>
    </form>
  );
}
