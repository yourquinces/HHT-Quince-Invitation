// A celebration invitation — /celebrate/<slug>
//
// A birthday (or any party) on one of our group sailings. It sells the same
// sailing as the quinceañera invitations, from the same sailing config and
// live price sheets, but it is not a quinceañera and must never read like one:
// the hero is the ship, there is no registry or private-events list, and the
// interest form feeds the regular-cruise `leads` pipeline, not `quince_leads`.
//
// The page is in Spanish, so it carries its own Spanish versions of the
// shared sections (details, pricing, booking, contact) rather than the
// English components the quince invitations use.
//
// Content lives in src/data/celebrations.ts.

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { invitation } from "../data/invitation";
import { celebrations } from "../data/celebrations";
import { applyGroupCruiseRow } from "../lib/liveInvitation";
import type { InvitationRow } from "../lib/liveInvitation";
import Header from "./Header";
import Footer from "./Footer";
import Icon from "./Icon";
import PrimaryButton from "./PrimaryButton";
import SecondaryButton from "./SecondaryButton";
import Section from "./Section";

type Status = "idle" | "submitting" | "success" | "error";

// The regular (non-quince) quote pipeline. CORS is open on that function.
const QUOTE_ENDPOINT = "https://hht-cruise-quote.netlify.app/.netlify/functions/quote-request";

const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** "24 al 31 de julio de 2027" from the ISO sail date and length. */
function spanishDates(iso: string, nights: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, d));
  const end = new Date(Date.UTC(y, m - 1, d + nights));
  const sm = MONTHS[start.getUTCMonth()];
  const em = MONTHS[end.getUTCMonth()];
  return sm === em
    ? `${start.getUTCDate()} al ${end.getUTCDate()} de ${em} de ${end.getUTCFullYear()}`
    : `${start.getUTCDate()} de ${sm} al ${end.getUTCDate()} de ${em} de ${end.getUTCFullYear()}`;
}

const ITINERARY_ES: Record<string, string> = {
  "Western Caribbean": "Caribe Occidental",
  "Eastern Caribbean": "Caribe Oriental",
  "Southern Caribbean": "Caribe Sur",
  Mediterranean: "Mediterráneo",
};

const GUESTS_ES: Record<string, string> = { "2": "Dos", "3": "Tres", "4": "Cuatro" };

const inputClass =
  "w-full rounded-xl border border-blush-200 bg-white px-4 py-3.5 text-slate-800 placeholder:text-slate-400 focus:border-royal-400";
const labelClass = "mb-1.5 block text-sm font-semibold text-royal-800";

export default function CelebrationInvitePage({ slug }: { slug: string }) {
  const celebration = celebrations[slug];
  const [status, setStatus] = useState<Status>("idle");
  const [fields, setFields] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    notes: "",
    botField: "",
  });

  // Overlay the sailing before the first render — the shared sections read
  // `invitation` directly. Done once; the config is static.
  const [ready] = useState(() => {
    if (!celebration) return false;
    const row: InvitationRow = {
      slug,
      quinceanera_name: "",
      preferred_name: "",
      group_name: null,
      family_message: null,
      signature: null,
      hero_image_url: null,
      image_position: null,
      registry_url: null,
      starting_price: null,
      ship: null,
      sailing_dates: null,
      sail_date: celebration.sailDate,
      agent_name: celebration.agentName,
      agent_phone: null,
      agent_whatsapp: null,
      agent_email: null,
    };
    applyGroupCruiseRow(row);
    return true;
  });

  const title = celebration
    ? `${celebration.occasion} de ${celebration.honoree} | ${invitation.cruise.ship}`
    : "Happy Holidays Travel";
  useEffect(() => {
    document.title = title;
    document.documentElement.lang = "es";
    // index.html's fallback description talks about quinceañeras.
    if (celebration)
      document
        .querySelector('meta[name="description"]')
        ?.setAttribute(
          "content",
          `Celebre el ${celebration.occasion} de ${celebration.honoree} a bordo del ` +
            `${invitation.cruise.ship}.`,
        );
  }, [title, celebration]);

  const { cruise, office, agent, pricing, reservationFormUrl, depositPaymentUrl } = invitation;

  if (!celebration || !ready) {
    return (
      <>
        <Header lang="es" />
        <main className="flex min-h-[60vh] items-center justify-center px-5 text-center">
          <div>
            <p className="font-display text-2xl font-semibold text-royal-800">
              No pudimos encontrar esta invitación.
            </p>
            <p className="mt-3 text-slate-600">
              Verifique el enlace que recibió, o llame a Happy Holidays Travel al{" "}
              <a href={`tel:+${office.phoneDial}`} className="font-medium text-royal-600">
                {office.phoneDisplay}
              </a>
              .
            </p>
          </div>
        </main>
        <Footer lang="es" />
      </>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (fields.botField) return; // honeypot
    setStatus("submitting");
    try {
      const res = await fetch(QUOTE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: fields.firstName.trim(),
          last_name: fields.lastName.trim(),
          email: fields.email.trim(),
          phone: fields.phone.trim(),
          language: "Spanish",
          cruise_type: `Group — ${celebration.occasion} (${celebration.honoree})`,
          dates: cruise.sailingDates,
          duration: `${cruise.nights} nights`,
          destination: `${cruise.itineraryName} from ${cruise.departurePort}`,
          cruise_lines: [cruise.line],
          source_url: window.location.href,
          additional_info: [
            `Guest of ${celebration.honoree}'s ${celebration.occasion} group aboard ${cruise.ship}, ${cruise.sailingDates}.`,
            `Preferred agent: ${celebration.agentName}.`,
            fields.notes.trim(),
          ]
            .filter(Boolean)
            .join(" "),
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  const datesEs = spanishDates(celebration.sailDate, cruise.nights);
  const itineraryEs = ITINERARY_ES[cruise.itineraryName] ?? cruise.itineraryName;
  const details = [
    { icon: "ship", text: `${cruise.ship} · ${cruise.line}` },
    { icon: "calendar", text: datesEs },
    { icon: "moon", text: `Crucero de ${cruise.nights} noches por el ${itineraryEs}` },
    { icon: "anchor", text: `Saliendo de ${cruise.departurePort}` },
  ];
  const cards = [
    { icon: "ship", label: "Barco", value: `${cruise.ship} — ${cruise.line}` },
    { icon: "calendar", label: "Fechas", value: datesEs },
    { icon: "moon", label: "Duración", value: `${cruise.nights} noches · ${itineraryEs}` },
    { icon: "anchor", label: "Puerto de salida", value: cruise.departurePort },
  ];
  const occupancyLinks = pricing.occupancyLinks
    .map((l) => {
      const guests = new URL(l.url, window.location.origin).searchParams.get("guests") ?? "";
      return GUESTS_ES[guests] ? { label: `${GUESTS_ES[guests]} personas por cabina`, url: l.url } : null;
    })
    .filter((l): l is { label: string; url: string } => !!l);

  return (
    <>
      <Header lang="es" />
      <main>
        <section
          id="top"
          className="relative overflow-hidden bg-gradient-to-b from-blush-100 via-blush-50 to-white"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-rosa-200/40 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-royal-200/40 blur-3xl"
          />

          <div className="relative mx-auto grid w-full max-w-content items-center gap-10 px-5 pb-16 pt-12 sm:px-8 sm:pt-16 lg:grid-cols-2 lg:gap-16 lg:pb-24">
            <div className="text-center lg:text-left">
              <div className="mb-4 flex justify-center text-gold-500 lg:justify-start">
                <Icon name="sparkles" className="h-7 w-7" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gold-600">
                Están Invitados
              </p>
              <p className="mt-4 font-display text-lg italic text-royal-600 sm:text-xl">
                Celebremos juntos en alta mar
              </p>
              <h1 className="mt-2 font-display text-4xl font-bold leading-tight text-royal-800 sm:text-5xl lg:text-6xl">
                {celebration.honoree}
                <span className="mt-1 block bg-gradient-to-r from-rosa-500 to-royal-500 bg-clip-text text-transparent">
                  {celebration.occasion}
                </span>
              </h1>

              <ul className="mt-8 space-y-2.5 text-left text-[0.95rem] text-slate-600 sm:mx-auto sm:max-w-md lg:mx-0">
                {details.map((d) => (
                  <li key={d.text} className="flex items-center justify-center gap-3 lg:justify-start">
                    <span className="text-rosa-500">
                      <Icon name={d.icon} className="h-5 w-5" />
                    </span>
                    {d.text}
                  </li>
                ))}
              </ul>

              <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <PrimaryButton href="#join">Quiero Ir</PrimaryButton>
                <SecondaryButton href="#pricing">Ver Precios</SecondaryButton>
              </div>
            </div>

            <div className="mx-auto w-full max-w-sm lg:max-w-md">
              <div className="rounded-3xl bg-white p-3 shadow-xl shadow-royal-800/10 ring-1 ring-blush-200">
                <div className="aspect-[4/5] overflow-hidden rounded-2xl">
                  <img
                    src={invitation.hero.image}
                    alt={invitation.hero.imageAlt}
                    className="h-full w-full object-cover"
                    fetchPriority="high"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <Section className="bg-white">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 flex justify-center text-rosa-500">
              <Icon name="heart" className="h-7 w-7" />
            </div>
            <p className="font-display text-xl leading-relaxed text-royal-800 sm:text-2xl">
              {celebration.message}
            </p>
            <p className="mt-6 font-display text-lg italic text-royal-600">
              {celebration.signature}
            </p>
          </div>
        </Section>

        <Section id="details" className="bg-blush-50">
          <h2 className="text-center font-display text-3xl font-bold text-royal-800 sm:text-4xl">
            Detalles del Crucero
          </h2>
          <div className="mt-10 grid items-center gap-10 lg:grid-cols-5 lg:gap-14">
            <div className="lg:col-span-2">
              <div className="overflow-hidden rounded-3xl shadow-lg shadow-royal-800/10 ring-1 ring-blush-200">
                <img
                  src={cruise.shipImage}
                  alt={cruise.shipImageAlt}
                  className="aspect-[4/3] w-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="lg:col-span-3">
              <div className="grid gap-4 sm:grid-cols-2">
                {cards.map((c) => (
                  <div
                    key={c.label}
                    className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-blush-200"
                  >
                    <span className="mt-0.5 rounded-full bg-royal-50 p-2.5 text-royal-600">
                      <Icon name={c.icon} className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gold-600">
                        {c.label}
                      </p>
                      <p className="mt-1 font-medium text-royal-800">{c.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-blush-200">
                <p className="text-xs font-semibold uppercase tracking-wider text-gold-600">
                  Destinos
                </p>
                <ul className="mt-3 flex flex-wrap gap-2.5">
                  {cruise.destinations.map((d) => (
                    <li
                      key={d}
                      className="inline-flex items-center gap-1.5 rounded-full bg-rosa-100 px-4 py-2 text-sm font-medium text-rosa-600"
                    >
                      <Icon name="mapPin" className="h-4 w-4" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Section>

        <Section id="pricing" className="bg-white">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl font-bold text-royal-800 sm:text-4xl">
              Escoja la Cabina Perfecta para Usted
            </h2>
            <p className="mt-4 text-slate-600">
              Los precios son por persona y varían según la categoría de la cabina y cuántas
              personas la comparten.
            </p>
            <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap">
              {pricing.fullPricingUrl && (
                <SecondaryButton href={pricing.fullPricingUrl}>Ver Todos los Precios</SecondaryButton>
              )}
              {occupancyLinks.map((link) => (
                <SecondaryButton key={link.label} href={link.url}>
                  {link.label}
                </SecondaryButton>
              ))}
            </div>
          </div>
        </Section>

        <Section id="join" className="bg-white">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-center font-display text-3xl font-bold text-royal-800 sm:text-4xl">
              ¿Viene a Celebrar?
            </h2>
            <p className="mt-4 text-center text-slate-600">
              Déjenos sus datos y {celebration.agentName}, de Happy Holidays Travel, le llamará
              con la disponibilidad de cabinas, los precios del grupo y los próximos pasos.
            </p>

            {status === "success" ? (
              <p
                role="status"
                className="mt-8 rounded-2xl bg-blush-50 px-6 py-8 text-center font-display text-xl text-royal-800"
              >
                ¡Gracias! {celebration.agentName} se comunicará con usted muy pronto.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 grid gap-4 sm:grid-cols-2">
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="hidden"
                  value={fields.botField}
                  onChange={(e) => setFields({ ...fields, botField: e.target.value })}
                />
                <div>
                  <label className={labelClass} htmlFor="cel-first">
                    Nombre
                  </label>
                  <input
                    id="cel-first"
                    className={inputClass}
                    required
                    value={fields.firstName}
                    onChange={(e) => setFields({ ...fields, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="cel-last">
                    Apellido
                  </label>
                  <input
                    id="cel-last"
                    className={inputClass}
                    value={fields.lastName}
                    onChange={(e) => setFields({ ...fields, lastName: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="cel-email">
                    Correo electrónico
                  </label>
                  <input
                    id="cel-email"
                    type="email"
                    className={inputClass}
                    required
                    value={fields.email}
                    onChange={(e) => setFields({ ...fields, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="cel-phone">
                    Teléfono
                  </label>
                  <input
                    id="cel-phone"
                    type="tel"
                    className={inputClass}
                    value={fields.phone}
                    onChange={(e) => setFields({ ...fields, phone: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="cel-notes">
                    ¿Cuántas personas, y algo más que debamos saber?{" "}
                    <span className="font-normal text-slate-400">(opcional)</span>
                  </label>
                  <textarea
                    id="cel-notes"
                    rows={3}
                    className={inputClass}
                    value={fields.notes}
                    onChange={(e) => setFields({ ...fields, notes: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="w-full rounded-full bg-gradient-to-r from-rosa-500 to-royal-500 px-8 py-4 font-semibold text-white shadow-lg shadow-royal-800/20 disabled:opacity-60"
                  >
                    {status === "submitting" ? "Enviando…" : "Enviar Mis Datos"}
                  </button>
                  {status === "error" && (
                    <p role="alert" className="mt-3 text-center text-sm font-medium text-rosa-600">
                      No se pudo enviar. Intente de nuevo, o llámenos al{" "}
                      <a href={`tel:+${office.phoneDial}`} className="underline">
                        {office.phoneDisplay}
                      </a>
                      .
                    </p>
                  )}
                </div>
              </form>
            )}
          </div>
        </Section>

        <Section id="reserve" className="bg-blush-50">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl font-bold text-royal-800 sm:text-4xl">
              ¿Listo para Reservar?
            </h2>
            <p className="mt-4 text-slate-600">
              Si ya sabe que viene, complete el formulario oficial de reservación de Happy
              Holidays Travel.
            </p>
            <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
              {reservationFormUrl && (
                <PrimaryButton href={reservationFormUrl} className="px-12">
                  Reservar mi Cabina
                </PrimaryButton>
              )}
              {depositPaymentUrl && (
                <SecondaryButton href={depositPaymentUrl}>Pagar el Depósito</SecondaryButton>
              )}
            </div>
            <ol className="mt-12 grid gap-4 sm:grid-cols-3">
              {[
                "Revise los precios de las cabinas.",
                "Complete el formulario de reservación.",
                "Pague el depósito requerido.",
              ].map((step, i) => (
                <li
                  key={step}
                  className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-blush-200"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rosa-400 to-royal-500 font-display text-lg font-bold text-white">
                    {i + 1}
                  </span>
                  <p className="mt-3 text-sm font-medium text-royal-800">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </Section>

        <Section className="bg-blush-50">
          <div className="mx-auto max-w-2xl rounded-2xl bg-white px-6 py-7 text-center ring-1 ring-blush-200">
            <p className="text-slate-600">
              Para viajar con el grupo y obtener la tarifa de grupo, las cabinas deben reservarse
              con Happy Holidays Travel. Un depósito no reembolsable de{" "}
              <strong className="text-royal-800">{invitation.deposit.amount}</strong> por persona
              inicia la reservación, y el balance se puede pagar a plazos.
            </p>
          </div>
        </Section>

        <Section id="contact" className="bg-white">
          <h2 className="text-center font-display text-3xl font-bold text-royal-800 sm:text-4xl">
            ¿Preguntas? Estamos para Ayudarle
          </h2>
          <div className="mx-auto mt-10 max-w-xl rounded-3xl bg-blush-50 p-8 text-center ring-1 ring-blush-200">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-600">
              Su Agente de Happy Holidays Travel
            </p>
            <p className="mt-2 font-display text-2xl font-semibold text-royal-800">{agent.name}</p>
            <p className="mt-1 text-slate-600">{agent.phoneDisplay}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { icon: "phone", label: "Llamar", href: `tel:+${agent.phoneDial}` },
                { icon: "whatsapp", label: "WhatsApp", href: agent.whatsappUrl },
                { icon: "mail", label: "Correo", href: `mailto:${agent.email}` },
              ].map((a) => (
                <a
                  key={a.label}
                  href={a.href}
                  target={a.href.startsWith("http") ? "_blank" : undefined}
                  rel={a.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-royal-600 px-6 py-3.5 text-sm font-semibold text-white shadow transition hover:bg-royal-700"
                >
                  <Icon name={a.icon} className="h-4 w-4" />
                  {a.label}
                </a>
              ))}
            </div>
          </div>
        </Section>
      </main>
      <Footer lang="es" />
    </>
  );
}
