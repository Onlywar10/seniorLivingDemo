import type { Metadata } from "next";
import Image from "next/image";
import { SignIn } from "@/components/staff/SignIn";
import { site } from "@/data/site";
import "./staff.css";

export const metadata: Metadata = { title: { absolute: "Sign in · Prairie City Landing Team" }, robots: { index: false, follow: false } };

export default function StaffSignIn() {
  return (
    <div className="sx-login" data-no-translate>
      <div className="sx-login-photo">
        <Image src="/img/courtyard-aerial.jpg" alt="" fill priority sizes="(max-width: 860px) 100vw, 50vw" />
        <div className="sx-login-quote">
          <p>“Each gives to each, and like the star gets back its gift in tenfold pay.”</p>
          <span>Joaquin Miller</span>
        </div>
      </div>
      <main className="sx-login-panel">
        <div className="sx-brand sx-brand-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/brand/dots.png" alt="" width={52} height={52} />
          <span>
            <b>Prairie City Landing</b>
            <span>Team sign in</span>
          </span>
        </div>
        <SignIn />
        <p className="sx-login-foot">
          For the Prairie City Landing team. Trouble signing in? Ask the front desk at {site.phone}, ext. 100, or email it@tenfoldseniorliving.com.
        </p>
      </main>
    </div>
  );
}
