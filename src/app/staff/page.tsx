import type { Metadata } from "next";
import Image from "next/image";
import { SignIn } from "@/components/staff/SignIn";
import { communities } from "@/data/communities";
import { getStaffScope } from "@/data/staff/server";
import "./staff.css";

export async function generateMetadata(): Promise<Metadata> {
  const scope = await getStaffScope();
  const name = scope === "all" ? "Wrenhaven Senior Living" : communities[scope].site.name;
  return { title: { absolute: `Sign in · ${name} Team` }, robots: { index: false, follow: false } };
}

export default async function StaffSignIn() {
  const scope = await getStaffScope();
  const site = scope === "all" ? null : communities[scope].site;
  const name = site ? site.name : "Wrenhaven Senior Living";
  return (
    <div className="sx-login" data-no-translate>
      <div className="sx-login-photo">
        <Image src="/img/courtyard-aerial.jpg" alt="" fill priority sizes="(max-width: 860px) 100vw, 50vw" />
        <div className="sx-login-quote">
          <p>“A wren builds a small, snug home and fills it with song. That’s the job.”</p>
          <span>The idea behind Wrenhaven</span>
        </div>
      </div>
      <main className="sx-login-panel">
        <div className="sx-brand sx-brand-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/brand/dots.png" alt="" width={52} height={52} />
          <span>
            <b>{name}</b>
            <span>Team sign in</span>
          </span>
        </div>
        <SignIn />
        <p className="sx-login-foot">
          {site
            ? `For the ${site.name} team. Trouble signing in? Ask the front desk at ${site.phone}${scope === "alder-bend" ? ", ext. 100," : ","} or email it@wrenhaven.example.`
            : "For the Wrenhaven Senior Living team. Trouble signing in? Email it@wrenhaven.example."}
        </p>
      </main>
    </div>
  );
}
