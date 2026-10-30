import { getT } from "@/i18n/server";
import { portraitOf } from "@/data/communities";

/** A team member's published portrait, or their initials on a brand-color disc. */
const tones = ["var(--green)", "var(--terra-deep)", "var(--slate)", "var(--sky)", "var(--olive)", "var(--brick)"];

export function initials(name: string) {
  const parts = name.replace(/^(Fr\.|Dr\.)\s+/, "").split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function Monogram({ name, size = 64, tone }: { name: string; size?: number; tone?: number }) {
  const i = tone ?? [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % tones.length;
  const photo = portraitOf(name);
  // eslint-disable-next-line @next/next/no-img-element
  if (photo) return <img className="br-mono br-mono-photo" src={photo} alt="" aria-hidden="true" width={size} height={size} style={{ width: size, height: size }} />;
  return (
    <span className="br-mono" aria-hidden="true" style={{ width: size, height: size, fontSize: size * 0.38, background: tones[i] }}>
      {initials(name)}
    </span>
  );
}

/** A staff card: monogram, name, role, short bio and optional contact line. */
export async function PersonCard({ name, role, children, tone }: { name: string; role: string; children?: React.ReactNode; tone?: number }) {
  const { t } = await getT();
  return (
    <div className="br-person">
      <Monogram name={name} size={76} tone={tone} />
      <div>
        <p className="br-person-name" data-no-translate>
          {name}
        </p>
        <p className="br-person-role">{t(role)}</p>
        {children}
      </div>
    </div>
  );
}
