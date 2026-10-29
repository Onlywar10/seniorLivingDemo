import Link from "next/link";
import { hash } from "@/lib/clock";

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

/** Initials on a brand-color disc. */
export function Monogram({ name, size = 64, tone }: { name: string; size?: number; tone?: string }) {
  const bg = tone ?? tones[hash(name) % tones.length];
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
        <b>Yes, you may text me.</b> By checking this box, I agree to receive recurring automated text messages from Prairie City Landing at the
        mobile number provided, about {purpose}. Message frequency varies. Msg &amp; data rates may apply. Reply STOP to opt out, HELP for help.
        Consent is not a condition of purchase. See our <Link href="/privacy#sms">SMS Terms and Privacy Policy</Link>.
      </span>
    </label>
  );
}

/** Small confetti-dot row used as a section divider. */
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
