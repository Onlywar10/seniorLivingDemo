"use client";
import { portraitOf } from "@/data/communities";

import Link from "@/i18n/Link";
import { useT } from "@/i18n/client";
import { hash } from "@/lib/clock";
import { useMaybeCommunity } from "@/lib/community";

const tones = ["var(--green)", "var(--terra-deep)", "var(--slate)", "var(--sky)", "var(--olive)", "var(--brick)"];

export const initials = (name: string) =>
  name
    .replace(/^(Fr\.|Chaplain)\s+/, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

/** A team member's published portrait, or their initials on a brand-color disc. */
export function Monogram({ name, size = 64, tone }: { name: string; size?: number; tone?: string }) {
  const bg = tone ?? tones[hash(name) % tones.length];
  const photo = portraitOf(name);
  // eslint-disable-next-line @next/next/no-img-element
  if (photo) return <img className="inf-mono inf-mono-photo" src={photo} alt="" aria-hidden="true" width={size} height={size} style={{ width: size, height: size }} />;
  return (
    <span className="inf-mono" style={{ width: size, height: size, background: bg, fontSize: size * 0.36 }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

/** TCPA-style SMS consent. Works controlled (checked/onChange) or uncontrolled. */
export function SmsConsent({
  id,
  purpose,
  checked,
  onChange,
  name = "sms",
}: {
  id: string;
  purpose: string;
  checked?: boolean;
  onChange?: (v: boolean) => void;
  name?: string;
}) {
  const { t } = useT();
  const sender = useMaybeCommunity()?.site.name ?? "Wrenhaven Senior Living";
  const controlled = checked !== undefined;
  return (
    <label className="check inf-sms" htmlFor={id}>
      <input
        id={id}
        name={name}
        type="checkbox"
        {...(controlled ? { checked, onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.checked) } : {})}
      />
      <span>
        <b>{t("Yes, you may text me.")}</b>
        {t(` By checking this box, I agree to receive recurring automated text messages from ${sender} at the mobile number provided, about `)}
        {t(purpose)}
        {t(". Message frequency varies. Msg & data rates may apply. Reply STOP to opt out, HELP for help. Consent is not a condition of purchase. See our ")}
        <Link href="/privacy#sms">{t("SMS Terms and Privacy Policy")}</Link>.
      </span>
    </label>
  );
}

/** Small row of dots used as a section divider. */
export function DotRule() {
  return (
    <span className="inf-dotrule" aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}
