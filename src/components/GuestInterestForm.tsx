import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { invitation } from "../data/invitation";
import Icon from "./Icon";
import PrimaryButton from "./PrimaryButton";
import Section from "./Section";

type Status = "idle" | "submitting" | "success" | "error";

interface Fields {
  name: string;
  email: string;
  phone: string;
  preferredContact: string;
  guests: string;
  cabinInterest: string;
  comments: string;
  consent: boolean;
  botField: string;
}

const INITIAL: Fields = {
  name: "",
  email: "",
  phone: "",
  preferredContact: "",
  guests: "",
  cabinInterest: "",
  comments: "",
  consent: false,
  botField: "",
};

const CONTACT_METHODS = ["Phone call", "Text message", "WhatsApp", "Email"];
const GUEST_OPTIONS = ["1", "2", "3", "4", "5", "6 or more", "Not sure yet"];
const CABIN_OPTIONS = ["Interior", "Ocean View", "Balcony", "Suite", "Not sure yet"];

const inputClass =
  "w-full rounded-xl border border-blush-200 bg-white px-4 py-3.5 text-slate-800 placeholder:text-slate-400 focus:border-royal-400";
const labelClass = "mb-1.5 block text-sm font-semibold text-royal-800";

function encode(data: Record<string, string>) {
  return Object.keys(data)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
    .join("&");
}

export default function GuestInterestForm() {
  const { leadForm, quinceanera, groupName, cruise } = invitation;
  const [fields, setFields] = useState<Fields>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [pageUrl, setPageUrl] = useState("");

  useEffect(() => {
    setPageUrl(window.location.href);
  }, []);

  if (!leadForm.enabled) return null;

  const successMessage = leadForm.successMessage.split("{name}").join(quinceanera.preferredName);

  const set = (key: keyof Fields, value: string | boolean) => {
    setFields((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof Fields, string>> = {};
    if (!fields.name.trim()) next.name = "Please enter your first and last name.";
    if (!fields.email.trim()) {
      next.email = "Please enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
      next.email = "Please enter a valid email address (example: name@email.com).";
    }
    if (!fields.phone.trim()) next.phone = "Please enter your phone number.";
    if (!fields.preferredContact) next.preferredContact = "Please choose how we should contact you.";
    if (!fields.consent) next.consent = "Please check this box so we may contact you.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "submitting") return; // prevent duplicate submissions
    if (!validate()) return;

    setStatus("submitting");
    try {
      const res = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encode({
          "form-name": leadForm.formName,
          "bot-field": fields.botField,
          name: fields.name.trim(),
          email: fields.email.trim(),
          phone: fields.phone.trim(),
          "preferred-contact": fields.preferredContact,
          guests: fields.guests,
          "cabin-interest": fields.cabinInterest,
          comments: fields.comments.trim(),
          consent: "yes",
          "quinceanera-name": quinceanera.fullName,
          "group-name": groupName,
          "sailing-date": cruise.sailingDates,
          "page-url": pageUrl,
        }),
      });
      if (!res.ok) throw new Error(`Form submission failed (${res.status})`);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <Section id="interest" className="bg-white">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-royal-800 sm:text-4xl">
            {leadForm.heading}
          </h2>
          <p className="mt-4 text-slate-600">{leadForm.description}</p>
        </div>

        {status === "success" ? (
          <div
            role="status"
            className="mt-10 rounded-3xl bg-blush-50 p-8 text-center ring-1 ring-blush-200"
          >
            <span className="inline-flex rounded-full bg-royal-600 p-3 text-white">
              <Icon name="check" className="h-6 w-6" />
            </span>
            <p className="mt-4 text-lg font-medium text-royal-800">{successMessage}</p>
          </div>
        ) : (
          <form
            name={leadForm.formName}
            method="POST"
            data-netlify="true"
            onSubmit={handleSubmit}
            noValidate
            className="mt-10 rounded-3xl bg-blush-50 p-6 ring-1 ring-blush-200 sm:p-8"
          >
            <input type="hidden" name="form-name" value={leadForm.formName} />
            {/* Honeypot for spam bots — hidden from real guests */}
            <p className="hidden" aria-hidden="true">
              <label>
                Don’t fill this out if you’re human:
                <input
                  name="bot-field"
                  value={fields.botField}
                  onChange={(e) => set("botField", e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </label>
            </p>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="lead-name" className={labelClass}>
                  First and last name <span className="text-rosa-500">*</span>
                </label>
                <input
                  id="lead-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={fields.name}
                  onChange={(e) => set("name", e.target.value)}
                  className={inputClass}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "lead-name-error" : undefined}
                  required
                />
                {errors.name && (
                  <p id="lead-name-error" className="mt-1.5 text-sm text-rosa-600">
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="lead-email" className={labelClass}>
                  Email address <span className="text-rosa-500">*</span>
                </label>
                <input
                  id="lead-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={fields.email}
                  onChange={(e) => set("email", e.target.value)}
                  className={inputClass}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "lead-email-error" : undefined}
                  required
                />
                {errors.email && (
                  <p id="lead-email-error" className="mt-1.5 text-sm text-rosa-600">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="lead-phone" className={labelClass}>
                  Phone number <span className="text-rosa-500">*</span>
                </label>
                <input
                  id="lead-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={fields.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  className={inputClass}
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? "lead-phone-error" : undefined}
                  required
                />
                {errors.phone && (
                  <p id="lead-phone-error" className="mt-1.5 text-sm text-rosa-600">
                    {errors.phone}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="lead-contact" className={labelClass}>
                  Preferred contact method <span className="text-rosa-500">*</span>
                </label>
                <select
                  id="lead-contact"
                  name="preferred-contact"
                  value={fields.preferredContact}
                  onChange={(e) => set("preferredContact", e.target.value)}
                  className={inputClass}
                  aria-invalid={!!errors.preferredContact}
                  aria-describedby={errors.preferredContact ? "lead-contact-error" : undefined}
                  required
                >
                  <option value="">Choose one…</option>
                  {CONTACT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                {errors.preferredContact && (
                  <p id="lead-contact-error" className="mt-1.5 text-sm text-rosa-600">
                    {errors.preferredContact}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="lead-guests" className={labelClass}>
                  Number of guests who may travel
                </label>
                <select
                  id="lead-guests"
                  name="guests"
                  value={fields.guests}
                  onChange={(e) => set("guests", e.target.value)}
                  className={inputClass}
                >
                  <option value="">Choose one…</option>
                  {GUEST_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="lead-cabin" className={labelClass}>
                  Cabin interest
                </label>
                <select
                  id="lead-cabin"
                  name="cabin-interest"
                  value={fields.cabinInterest}
                  onChange={(e) => set("cabinInterest", e.target.value)}
                  className={inputClass}
                >
                  <option value="">Choose one…</option>
                  {CABIN_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="lead-comments" className={labelClass}>
                  Questions or comments <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <textarea
                  id="lead-comments"
                  name="comments"
                  rows={4}
                  value={fields.comments}
                  onChange={(e) => set("comments", e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="flex items-start gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name="consent"
                    checked={fields.consent}
                    onChange={(e) => set("consent", e.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-blush-200 text-royal-600"
                    aria-invalid={!!errors.consent}
                    aria-describedby={errors.consent ? "lead-consent-error" : undefined}
                    required
                  />
                  <span>
                    I agree to be contacted by Happy Holidays Travel regarding this cruise.{" "}
                    <span className="text-rosa-500">*</span>
                  </span>
                </label>
                {errors.consent && (
                  <p id="lead-consent-error" className="mt-1.5 text-sm text-rosa-600">
                    {errors.consent}
                  </p>
                )}
              </div>
            </div>

            {status === "error" && (
              <div
                role="alert"
                className="mt-6 rounded-xl bg-rosa-100 p-4 text-sm text-rosa-600 ring-1 ring-rosa-200"
              >
                Something went wrong sending your information. Please try again, or call Happy
                Holidays Travel at {invitation.office.phoneDisplay}.
              </div>
            )}

            <div className="mt-7">
              <PrimaryButton type="submit" disabled={status === "submitting"} className="w-full sm:w-full">
                {status === "submitting" ? "Sending…" : "Send Me More Information"}
              </PrimaryButton>
            </div>

            <p className="mt-4 text-center text-xs text-slate-500">
              Your information will only be used by Happy Holidays Travel to follow up about this
              cruise.
            </p>
          </form>
        )}
      </div>
    </Section>
  );
}
