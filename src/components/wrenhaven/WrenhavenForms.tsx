"use client";

import { useId, useState } from "react";
import { Icon } from "@/components/Icon";
import { useT } from "@/i18n/client";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Interest list for a community that is not open yet: name, email and an optional phone. Confirmed on the page. */
export function InterestForm({ community }: { community: string }) {
  const { t } = useT();
  const id = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [sms, setSms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="success tf-done" role="status">
        <Icon name="check" />
        <div>
          <b>{t(`You’re on the ${community} interest list.`)}</b>
          <p className="small">{t("We’ll send news, floor plans and first tour dates as soon as they are ready.")}</p>
        </div>
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!name.trim()) err.name = t("Please enter your name.");
    if (!EMAIL.test(email.trim())) err.email = t("Please enter a valid email address.");
    if (phone.trim() && phone.replace(/\D/g, "").length < 10) err.phone = t("Please enter a 10-digit phone number, or leave it blank.");
    setErrors(err);
    if (Object.keys(err).length === 0) setDone(true);
  };

  return (
    <form className="tf-form" onSubmit={submit} noValidate aria-label={t(`Join the ${community} interest list`)}>
      <div className="form-grid">
        <div className="field full">
          <label htmlFor={`${id}-n`}>{t("Name")}</label>
          <input id={`${id}-n`} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} aria-describedby={errors.name ? `${id}-ne` : undefined} />
          {errors.name && <p id={`${id}-ne`} className="tf-err" role="alert">{errors.name}</p>}
        </div>
        <div className="field">
          <label htmlFor={`${id}-e`}>{t("Email")}</label>
          <input id={`${id}-e`} type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} aria-describedby={errors.email ? `${id}-ee` : undefined} />
          {errors.email && <p id={`${id}-ee`} className="tf-err" role="alert">{errors.email}</p>}
        </div>
        <div className="field">
          <label htmlFor={`${id}-p`}>
            {t("Phone")} <span className="tf-opt">{t("(optional)")}</span>
          </label>
          <input id={`${id}-p`} type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? `${id}-pe` : undefined} />
          {errors.phone && <p id={`${id}-pe`} className="tf-err" role="alert">{errors.phone}</p>}
        </div>
        {phone.trim() && (
          <label className="check full">
            <input type="checkbox" checked={sms} onChange={(e) => setSms(e.target.checked)} />
            <span>{t("Text me updates about this community. Message frequency varies; message and data rates may apply. Reply STOP to opt out. Consent is not a condition of purchase.")}</span>
          </label>
        )}
      </div>
      <button type="submit" className="btn btn-green">
        {t("Join the interest list")}
      </button>
    </form>
  );
}

/** General enquiry for Wrenhaven: who you are, which community, and your message. Confirmed on the page. */
export function EnquiryForm({ communities }: { communities: { slug: string; name: string }[] }) {
  const { t } = useT();
  const id = useId();
  const [v, setV] = useState({ name: "", email: "", phone: "", about: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setV({ ...v, [k]: e.target.value });

  if (done) {
    return (
      <div className="success tf-done" role="status">
        <Icon name="check" />
        <div>
          <b>{t(`Thank you, ${v.name.trim().split(" ")[0]}. Your message is on its way.`)}</b>
          <p className="small">{t("We’ll be in touch soon.")}</p>
        </div>
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!v.name.trim()) err.name = t("Please enter your name.");
    if (!EMAIL.test(v.email.trim())) err.email = t("Please enter a valid email address.");
    if (v.phone.trim() && v.phone.replace(/\D/g, "").length < 10) err.phone = t("Please enter a 10-digit phone number, or leave it blank.");
    if (!v.message.trim()) err.message = t("Please tell us how we can help.");
    setErrors(err);
    if (Object.keys(err).length === 0) setDone(true);
  };

  const field = (k: "name" | "email" | "phone", label: string, type: string, auto: string, optional = false) => (
    <div className={`field ${k === "name" ? "full" : ""}`}>
      <label htmlFor={`${id}-${k}`}>
        {t(label)}
        {optional && <> <span className="tf-opt">{t("(optional)")}</span></>}
      </label>
      <input id={`${id}-${k}`} type={type} autoComplete={auto} value={v[k]} onChange={set(k)} aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `${id}-${k}-e` : undefined} />
      {errors[k] && <p id={`${id}-${k}-e`} className="tf-err" role="alert">{errors[k]}</p>}
    </div>
  );

  return (
    <form className="tf-form" onSubmit={submit} noValidate>
      <div className="form-grid">
        {field("name", "Name", "text", "name")}
        {field("email", "Email", "email", "email")}
        {field("phone", "Phone", "tel", "tel", true)}
        <div className="field full">
          <label htmlFor={`${id}-about`}>{t("Your question is about")}</label>
          <select id={`${id}-about`} value={v.about} onChange={set("about")}>
            <option value="">{t("Wrenhaven in general")}</option>
            {communities.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
            <option value="coming">{t("A community opening in 2027")}</option>
            <option value="careers">{t("Careers")}</option>
          </select>
        </div>
        <div className="field full">
          <label htmlFor={`${id}-m`}>{t("Message")}</label>
          <textarea id={`${id}-m`} value={v.message} onChange={set("message")} aria-invalid={!!errors.message} aria-describedby={errors.message ? `${id}-me` : undefined} />
          {errors.message && <p id={`${id}-me`} className="tf-err" role="alert">{errors.message}</p>}
        </div>
      </div>
      <p className="small muted">{t("We use your details only to answer your message. We never sell your information.")}</p>
      <button type="submit" className="btn">
        {t("Send message")} <Icon name="send" />
      </button>
    </form>
  );
}
