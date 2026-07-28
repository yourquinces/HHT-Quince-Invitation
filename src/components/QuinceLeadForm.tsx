// Primary capture on /quince-cruises — feeds the existing quince_leads
// pipeline. Styled to match GuestInterestForm, but the fields mirror the
// quote form in HHT-Quinces-Leads so both sources produce the same shape.
//
// WhatsApp and phone sit right beside it as prominent secondary paths,
// because a good share of these leads convert faster on WhatsApp than
// they do by waiting for a callback.

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { invitation } from "../data/invitation";
import { submitQuinceLead } from "../lib/quinceLeads";
import { cabinSummary } from "../lib/cabinBooking";
import type { Cabin } from "../lib/pricingSheet";
import type { PricingSailing } from "../types/invitation";
import Icon from "./Icon";
import PrimaryButton from "./PrimaryButton";

type Status = "idle" | "submitting" | "success" | "error";

interface Fields {
  parentFirst: string;
  parentLast: string;
  parentEmail: string;
  parentPhone: string;
  quinceFirst: string;
  language: string;
  travelYear: string;
  interest: string[];
  heardAbout: string;
  notes: string;
  consent: boolean;
  botField: string;
}

const INITIAL: Fields = {
  parentFirst: "",
  parentLast: "",
  parentEmail: "",
  parentPhone: "",
  quinceFirst: "",
  language: "",
  travelYear: "2027",
  interest: [],
  heardAbout: "",
  notes: "",
  consent: false,
  botField: "",
};

const LANGUAGES = ["English", "Spanish"];
const TRAVEL_YEARS = ["2026", "2027", "2028", "Not sure yet"];
// Values are stored in the quince_leads `interest` text[] column, so they
// must stay readable to agents reading the lead in Supabase or GHL.
const SHIP_OPTIONS = [
  "Icon of the Seas",
  "Allure of the Seas",
  "Odyssey of the Seas (Mediterranean)",
  "Not sure yet",
];

const HEARD_ABOUT = [
  "Google",
  "Instagram",
  "Facebook",
  "TikTok",
  "Referred by past customer",
  "Past customer",
  "Radio / TV",
  "Drive by",
  "Other",
];

const inputClass =
  "w-full rounded-xl border border-blush-200 bg-white px-4 py-3.5 text-slate-800 placeholder:text-slate-400 focus:border-royal-400";
const labelClass = "mb-1.5 block text-sm font-semibold text-royal-800";

interface Props {
  /** The sailing she is currently looking at — prefills cruise interest. */
  sailing?: PricingSailing;
  /** A specific cabin she clicked "Ask About This Cabin" on. */
  cabin?: Cabin | null;
  onClearCabin?: () => void;
  id?: string;
}

export default function QuinceLeadForm({
  sailing,
  cabin,
  onClearCabin,
  id = "inquire",
}: Props) {
  const { agent, office } = invitation;
  const [fields, setFields] = useState<Fields>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [pageUrl, setPageUrl] = useState("");

  useEffect(() => {
    setPageUrl(window.location.href);
  }, []);

  const set = (key: keyof Fields, value: string | boolean | string[]) => {
    setFields((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const toggleInterest = (value: string) => {
    setFields((f) => ({
      ...f,
      interest: f.interest.includes(value)
        ? f.interest.filter((v) => v !== value)
        : [...f.interest, value],
    }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof Fields, string>> = {};
    if (!fields.parentFirst.trim()) next.parentFirst = "Please enter your first name.";
    if (!fields.parentEmail.trim()) {
      next.parentEmail = "Please enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.parentEmail.trim())) {
      next.parentEmail = "Please enter a valid email address (example: name@email.com).";
    }
    if (!fields.parentPhone.trim()) next.parentPhone = "Please enter your phone number.";
    if (!fields.language) next.language = "Please choose a language.";
    if (!fields.consent) next.consent = "Please check this box so we may contact you.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "submitting") return; // prevent duplicate submissions
    if (fields.botField) return; // honeypot tripped — silently drop
    if (!validate()) return;

    setStatus("submitting");
    try {
      // Fall back to the sailing she's viewing when she didn't tick a ship.
      const interest =
        fields.interest.length > 0 ? fields.interest : sailing ? [sailing.ship] : [];

      await submitQuinceLead({
        parent_first: fields.parentFirst.trim(),
        parent_last: fields.parentLast.trim(),
        parent_email: fields.parentEmail.trim(),
        parent_phone: fields.parentPhone.trim(),
        quince_first: fields.quinceFirst.trim(),
        language: fields.language,
        travel_year: fields.travelYear,
        interest,
        heard_about: fields.heardAbout,
        client_notes: [
          cabin && sailing ? `Interested in: ${cabinSummary(cabin, sailing)}` : "",
          sailing ? `Viewing: ${sailing.label} · ${sailing.ship}` : "",
          fields.notes.trim(),
        ]
          .filter(Boolean)
          .join(" — "),
        source_url: pageUrl,
      });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section id={id} className="bg-white px-5 py-14 sm:px-8 sm:py-20">
      <div className="mx-auto w-full max-w-content">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gold-600">
            No Obligation
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold text-royal-800 sm:text-4xl">
            Get Your Quinceañera Cruise Quote
          </h2>
          <p className="mt-4 text-slate-600">
            Tell us a little about your celebration and one of our quinceañera specialists will
            send you cabin options, group rates and payment plans — usually the same day.
          </p>
        </div>

        {/* Confirms the cabin she clicked actually came with her. Without
            this the scroll looks like the click did nothing. */}
        {cabin && sailing && status !== "success" && (
          <div className="mx-auto mt-8 max-w-2xl rounded-2xl bg-blush-50 p-4 ring-1 ring-blush-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex shrink-0 rounded-full bg-royal-600 p-2 text-white">
                  <Icon name="check" className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gold-600">
                    Asking about
                  </p>
                  <p className="font-medium text-royal-800">{cabinSummary(cabin, sailing)}</p>
                </div>
              </div>
              {onClearCabin && (
                <button
                  type="button"
                  onClick={onClearCabin}
                  className="text-sm font-medium text-royal-600 underline underline-offset-4 hover:text-royal-800"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* WhatsApp / phone sit above the form so the people who prefer to
            talk never have to scroll past a form to find them. */}
        <div className="mx-auto mt-8 flex max-w-2xl flex-col items-stretch gap-3 sm:flex-row">
          <a
            href={agent.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-4 text-sm font-semibold uppercase tracking-wider text-white shadow-lg shadow-[#25D366]/25 transition hover:brightness-95"
          >
            <Icon name="whatsapp" className="h-5 w-5" />
            Chat on WhatsApp
          </a>
          <a
            href={`tel:+${agent.phoneDial}`}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-royal-300 bg-white px-6 py-4 text-sm font-semibold uppercase tracking-wider text-royal-700 shadow-sm transition hover:border-royal-400 hover:bg-royal-50"
          >
            <Icon name="phone" className="h-5 w-5" />
            Call {agent.phoneDisplay}
          </a>
        </div>
        <p className="mt-3 text-center text-xs text-slate-500">
          Hablamos español · {office.addressLine1}, {office.addressLine2}
        </p>

        {status === "success" ? (
          <div
            role="status"
            className="mx-auto mt-10 max-w-2xl rounded-3xl bg-blush-50 p-8 text-center ring-1 ring-blush-200"
          >
            <span className="inline-flex rounded-full bg-royal-600 p-3 text-white">
              <Icon name="check" className="h-6 w-6" />
            </span>
            <p className="mt-4 text-lg font-medium text-royal-800">
              ¡Gracias! Your request is in.
            </p>
            <p className="mt-2 text-slate-600">
              One of our quinceañera specialists will reach out shortly with cabin options and
              group pricing. If you'd like an answer sooner, message us on WhatsApp above.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="mx-auto mt-10 max-w-2xl rounded-3xl bg-blush-50 p-6 ring-1 ring-blush-200 sm:p-8"
          >
            {/* Honeypot for spam bots — hidden from real visitors */}
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
              <div>
                <label htmlFor="q-parent-first" className={labelClass}>
                  Your first name <span className="text-rosa-500">*</span>
                </label>
                <input
                  id="q-parent-first"
                  type="text"
                  autoComplete="given-name"
                  value={fields.parentFirst}
                  onChange={(e) => set("parentFirst", e.target.value)}
                  className={inputClass}
                  aria-invalid={!!errors.parentFirst}
                  aria-describedby={errors.parentFirst ? "q-parent-first-error" : undefined}
                  required
                />
                {errors.parentFirst && (
                  <p id="q-parent-first-error" className="mt-1.5 text-sm text-rosa-600">
                    {errors.parentFirst}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="q-parent-last" className={labelClass}>
                  Last name
                </label>
                <input
                  id="q-parent-last"
                  type="text"
                  autoComplete="family-name"
                  value={fields.parentLast}
                  onChange={(e) => set("parentLast", e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="q-email" className={labelClass}>
                  Email address <span className="text-rosa-500">*</span>
                </label>
                <input
                  id="q-email"
                  type="email"
                  autoComplete="email"
                  value={fields.parentEmail}
                  onChange={(e) => set("parentEmail", e.target.value)}
                  className={inputClass}
                  aria-invalid={!!errors.parentEmail}
                  aria-describedby={errors.parentEmail ? "q-email-error" : undefined}
                  required
                />
                {errors.parentEmail && (
                  <p id="q-email-error" className="mt-1.5 text-sm text-rosa-600">
                    {errors.parentEmail}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="q-phone" className={labelClass}>
                  Phone number <span className="text-rosa-500">*</span>
                </label>
                <input
                  id="q-phone"
                  type="tel"
                  autoComplete="tel"
                  value={fields.parentPhone}
                  onChange={(e) => set("parentPhone", e.target.value)}
                  className={inputClass}
                  aria-invalid={!!errors.parentPhone}
                  aria-describedby={errors.parentPhone ? "q-phone-error" : undefined}
                  required
                />
                {errors.parentPhone && (
                  <p id="q-phone-error" className="mt-1.5 text-sm text-rosa-600">
                    {errors.parentPhone}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="q-quince-first" className={labelClass}>
                  Quinceañera's first name
                </label>
                <input
                  id="q-quince-first"
                  type="text"
                  value={fields.quinceFirst}
                  onChange={(e) => set("quinceFirst", e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="q-language" className={labelClass}>
                  Preferred language <span className="text-rosa-500">*</span>
                </label>
                <select
                  id="q-language"
                  value={fields.language}
                  onChange={(e) => set("language", e.target.value)}
                  className={inputClass}
                  aria-invalid={!!errors.language}
                  aria-describedby={errors.language ? "q-language-error" : undefined}
                  required
                >
                  <option value="">Choose one…</option>
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>
                      {l === "Spanish" ? "Español" : l}
                    </option>
                  ))}
                </select>
                {errors.language && (
                  <p id="q-language-error" className="mt-1.5 text-sm text-rosa-600">
                    {errors.language}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="q-year" className={labelClass}>
                  Year you'd like to travel
                </label>
                <select
                  id="q-year"
                  value={fields.travelYear}
                  onChange={(e) => set("travelYear", e.target.value)}
                  className={inputClass}
                >
                  {TRAVEL_YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="q-heard" className={labelClass}>
                  How did you hear about us?
                </label>
                <select
                  id="q-heard"
                  value={fields.heardAbout}
                  onChange={(e) => set("heardAbout", e.target.value)}
                  className={inputClass}
                >
                  <option value="">Choose one…</option>
                  {HEARD_ABOUT.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <fieldset className="sm:col-span-2">
                <legend className={labelClass}>
                  Which cruise interests you?{" "}
                  <span className="font-normal text-slate-400">(pick any)</span>
                </legend>
                <div className="flex flex-wrap gap-2">
                  {SHIP_OPTIONS.map((ship) => {
                    const checked = fields.interest.includes(ship);
                    return (
                      <label
                        key={ship}
                        className={`cursor-pointer rounded-full border px-4 py-2.5 text-sm font-medium transition ${
                          checked
                            ? "border-royal-600 bg-royal-600 text-white shadow"
                            : "border-blush-200 bg-white text-royal-700 hover:border-royal-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={() => toggleInterest(ship)}
                        />
                        {ship}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <div className="sm:col-span-2">
                <label htmlFor="q-notes" className={labelClass}>
                  Anything else?{" "}
                  <span className="font-normal text-slate-400">
                    (group size, dates, questions)
                  </span>
                </label>
                <textarea
                  id="q-notes"
                  rows={4}
                  value={fields.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="flex items-start gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={fields.consent}
                    onChange={(e) => set("consent", e.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-blush-200 text-royal-600"
                    aria-invalid={!!errors.consent}
                    aria-describedby={errors.consent ? "q-consent-error" : undefined}
                    required
                  />
                  <span>
                    I agree to be contacted by Happy Holidays Travel about quinceañera cruises.{" "}
                    <span className="text-rosa-500">*</span>
                  </span>
                </label>
                {errors.consent && (
                  <p id="q-consent-error" className="mt-1.5 text-sm text-rosa-600">
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
                Something went wrong sending your request. Please try again, message us on
                WhatsApp, or call {office.phoneDisplay}.
              </div>
            )}

            <div className="mt-7">
              <PrimaryButton
                type="submit"
                disabled={status === "submitting"}
                className="w-full sm:w-full"
              >
                {status === "submitting" ? "Sending…" : "Send Me Pricing & Availability"}
              </PrimaryButton>
            </div>

            <p className="mt-4 text-center text-xs text-slate-500">
              No obligation. Your information is only used by Happy Holidays Travel to follow up
              about your quinceañera cruise.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
