import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { invitation } from "../data/invitation";
import { inviteLang, say } from "../lib/inviteLang";
import { submitQuinceLead } from "../lib/quinceLeads";
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

// What a Spanish-reading guest sees for each option. The value submitted stays
// English, so the agent's lead notes read the same whichever page it came from.
const OPTION_ES: Record<string, string> = {
  "Phone call": "Llamada",
  "Text message": "Mensaje de texto",
  WhatsApp: "WhatsApp",
  Email: "Correo electrónico",
  "6 or more": "6 o más",
  "Not sure yet": "Aún no sé",
  Interior: "Interior",
  "Ocean View": "Vista al mar",
  Balcony: "Balcón",
  Suite: "Suite",
};
const optionLabel = (o: string) => say(o, OPTION_ES[o] ?? o);

const inputClass =
  "w-full rounded-xl border border-blush-200 bg-white px-4 py-3.5 text-slate-800 placeholder:text-slate-400 focus:border-royal-400";
const labelClass = "mb-1.5 block text-sm font-semibold text-royal-800";

/** "Maria Elena Ruiz Diaz" → ["Maria", "Elena Ruiz Diaz"] */
function splitName(full: string): [string, string] {
  const parts = full.trim().split(/\s+/);
  return [parts[0] ?? "", parts.slice(1).join(" ")];
}

/** "July 17–24, 2027" → "2027". Empty when the dates carry no year. */
function yearOf(sailingDates: string): string {
  return sailingDates.match(/\b(20\d{2})\b/)?.[1] ?? "";
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

  const successMessage = say(
    leadForm.successMessage,
    "¡Gracias! Un agente de Happy Holidays Travel se comunicará con usted pronto con más información para acompañar a {name} en su crucero.",
  )
    .split("{name}")
    .join(quinceanera.preferredName);

  const set = (key: keyof Fields, value: string | boolean) => {
    setFields((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof Fields, string>> = {};
    if (!fields.name.trim()) next.name = say("Please enter your first and last name.", "Por favor escriba su nombre y apellido.");
    if (!fields.email.trim()) {
      next.email = say("Please enter your email address.", "Por favor escriba su correo electrónico.");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
      next.email = say(
        "Please enter a valid email address (example: name@email.com).",
        "Por favor escriba un correo electrónico válido (ejemplo: nombre@correo.com).",
      );
    }
    if (!fields.phone.trim()) next.phone = say("Please enter your phone number.", "Por favor escriba su número de teléfono.");
    if (!fields.preferredContact) next.preferredContact = say(
        "Please choose how we should contact you.",
        "Por favor elija cómo prefiere que le contactemos.",
      );
    if (!fields.consent) next.consent = say(
        "Please check this box so we may contact you.",
        "Por favor marque esta casilla para que podamos contactarle.",
      );
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "submitting") return; // prevent duplicate submissions
    if (!validate()) return;

    // Honeypot: bots fill the hidden field. Show them the thank-you screen
    // rather than an error, so they never learn the submission was dropped.
    if (fields.botField.trim()) {
      setStatus("success");
      return;
    }

    setStatus("submitting");
    const [guestFirst, guestLast] = splitName(fields.name);
    const [quinceFirst, quinceLast] = splitName(quinceanera.fullName);

    try {
      await submitQuinceLead({
        parent_first: guestFirst,
        parent_last: guestLast,
        parent_email: fields.email.trim(),
        parent_phone: fields.phone.trim(),
        quince_first: quinceFirst,
        quince_last: quinceLast,
        travel_year: yearOf(cruise.sailingDates),
        interest: [cruise.ship],
        client_notes: [
          `Invited guest — ${groupName}`,
          `Sailing: ${cruise.sailingDates}`,
          inviteLang === "es" ? "Came from the Spanish invitation" : "",
          fields.preferredContact ? `Prefers ${fields.preferredContact}` : "",
          fields.guests ? `Guests traveling: ${fields.guests}` : "",
          fields.cabinInterest ? `Cabin interest: ${fields.cabinInterest}` : "",
          fields.comments.trim(),
        ]
          .filter(Boolean)
          .join(" — "),
        source: "invitation-page",
        source_url: pageUrl,
      });
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
            {say(leadForm.heading, "¿Le Gustaría Acompañarnos?")}
          </h2>
          <p className="mt-4 text-slate-600">
            {say(
              leadForm.description,
              "Comparta su información y un agente de Happy Holidays Travel se comunicará con usted con la disponibilidad de cabinas, los precios actuales y los próximos pasos.",
            )}
          </p>
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
            onSubmit={handleSubmit}
            noValidate
            className="mt-10 rounded-3xl bg-blush-50 p-6 ring-1 ring-blush-200 sm:p-8"
          >
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
                  {say("First and last name", "Nombre y apellido")} <span className="text-rosa-500">*</span>
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
                  {say("Email address", "Correo electrónico")} <span className="text-rosa-500">*</span>
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
                  {say("Phone number", "Número de teléfono")} <span className="text-rosa-500">*</span>
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
                  {say("Preferred contact method", "Forma de contacto preferida")} <span className="text-rosa-500">*</span>
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
                  <option value="">{say("Choose one…", "Elija una opción…")}</option>
                  {CONTACT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {optionLabel(m)}
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
                  {say("Number of guests who may travel", "Número de personas que podrían viajar")}
                </label>
                <select
                  id="lead-guests"
                  name="guests"
                  value={fields.guests}
                  onChange={(e) => set("guests", e.target.value)}
                  className={inputClass}
                >
                  <option value="">{say("Choose one…", "Elija una opción…")}</option>
                  {GUEST_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {optionLabel(g)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="lead-cabin" className={labelClass}>
                  {say("Cabin interest", "Tipo de cabina de interés")}
                </label>
                <select
                  id="lead-cabin"
                  name="cabin-interest"
                  value={fields.cabinInterest}
                  onChange={(e) => set("cabinInterest", e.target.value)}
                  className={inputClass}
                >
                  <option value="">{say("Choose one…", "Elija una opción…")}</option>
                  {CABIN_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {optionLabel(c)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="lead-comments" className={labelClass}>
                  {say("Questions or comments", "Preguntas o comentarios")}{" "}
                  <span className="font-normal text-slate-400">{say("(optional)", "(opcional)")}</span>
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
                    {say(
                      "I agree to be contacted by Happy Holidays Travel regarding this cruise.",
                      "Acepto que Happy Holidays Travel me contacte sobre este crucero.",
                    )}{" "}
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
                {say(
                  "Something went wrong sending your information. Please try again, or call Happy Holidays Travel at",
                  "Hubo un problema al enviar su información. Intente de nuevo, o llame a Happy Holidays Travel al",
                )}{" "}
                {invitation.office.phoneDisplay}.
              </div>
            )}

            <div className="mt-7">
              <PrimaryButton type="submit" disabled={status === "submitting"} className="w-full sm:w-full">
                {status === "submitting"
                  ? say("Sending…", "Enviando…")
                  : say("Send Me More Information", "Quiero Más Información")}
              </PrimaryButton>
            </div>

            <p className="mt-4 text-center text-xs text-slate-500">
              {say(
                "Your information will only be used by Happy Holidays Travel to follow up about this cruise.",
                "Su información solo será usada por Happy Holidays Travel para darle seguimiento sobre este crucero.",
              )}
            </p>
          </form>
        )}
      </div>
    </Section>
  );
}
