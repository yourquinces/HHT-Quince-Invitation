// A celebration invitation — /celebrate/<slug>
//
// A birthday (or any party) on one of our group sailings. It sells the same
// sailing as the quinceañera invitations, from the same sailing config and
// live price sheets, but it is not a quinceañera and must never read like one:
// the hero is the ship, there is no registry or private-events list, and the
// interest form feeds the regular-cruise `leads` pipeline, not `quince_leads`.
//
// Content lives in src/data/celebrations.ts.

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { invitation } from "../data/invitation";
import { celebrations } from "../data/celebrations";
import { applyGroupCruiseRow } from "../lib/liveInvitation";
import type { InvitationRow } from "../lib/liveInvitation";
import CruiseDetails from "./CruiseDetails";
import PricingSection from "./PricingSection";
import ReservationSection from "./ReservationSection";
import ContactSection from "./ContactSection";
import Header from "./Header";
import Footer from "./Footer";
import Icon from "./Icon";
import PrimaryButton from "./PrimaryButton";
import SecondaryButton from "./SecondaryButton";
import Section from "./Section";

type Status = "idle" | "submitting" | "success" | "error";

// The regular (non-quince) quote pipeline. CORS is open on that function.
const QUOTE_ENDPOINT = "https://hht-cruise-quote.netlify.app/.netlify/functions/quote-request";

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
    ? `${celebration.honoree}’s ${celebration.occasion} Cruise | ${invitation.cruise.ship}`
    : "Happy Holidays Travel";
  useEffect(() => {
    document.title = title;
    // index.html's fallback description talks about quinceañeras.
    if (celebration)
      document
        .querySelector('meta[name="description"]')
        ?.setAttribute(
          "content",
          `Celebrate ${celebration.honoree}'s ${celebration.occasion} aboard ` +
            `${invitation.cruise.ship}, ${invitation.cruise.sailingDates}.`,
        );
  }, [title, celebration]);

  const { cruise, office } = invitation;

  if (!celebration || !ready) {
    return (
      <>
        <Header />
        <main className="flex min-h-[60vh] items-center justify-center px-5 text-center">
          <div>
            <p className="font-display text-2xl font-semibold text-royal-800">
              We could not find this invitation.
            </p>
            <p className="mt-3 text-slate-600">
              Please double check the link you received, or contact Happy Holidays Travel at{" "}
              <a href={`tel:+${office.phoneDial}`} className="font-medium text-royal-600">
                {office.phoneDisplay}
              </a>
              .
            </p>
          </div>
        </main>
        <Footer />
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
          language: "English",
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

  const details = [
    { icon: "ship", text: `${cruise.ship} · ${cruise.line}` },
    { icon: "calendar", text: cruise.sailingDates },
    { icon: "moon", text: `${cruise.nights}-Night ${cruise.itineraryName} Cruise` },
    { icon: "anchor", text: `Departing from ${cruise.departurePort}` },
  ];

  return (
    <>
      <Header />
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
                You’re Invited
              </p>
              <p className="mt-4 font-display text-lg italic text-royal-600 sm:text-xl">
                Celebrate with us at sea
              </p>
              <h1 className="mt-2 font-display text-4xl font-bold leading-tight text-royal-800 sm:text-5xl lg:text-6xl">
                {celebration.honoree}’s
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
                <PrimaryButton href="#join">Join the Celebration</PrimaryButton>
                <SecondaryButton href="#pricing">View Cabin Prices</SecondaryButton>
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

        <CruiseDetails />

        <PricingSection />

        <Section id="join" className="bg-white">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-center font-display text-3xl font-bold text-royal-800 sm:text-4xl">
              Coming to Celebrate?
            </h2>
            <p className="mt-4 text-center text-slate-600">
              Leave your details and {celebration.agentName} from Happy Holidays Travel will call
              you with cabin availability, current group pricing and the next steps.
            </p>

            {status === "success" ? (
              <p
                role="status"
                className="mt-8 rounded-2xl bg-blush-50 px-6 py-8 text-center font-display text-xl text-royal-800"
              >
                Thank you! {celebration.agentName} will be in touch shortly.
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
                    First name
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
                    Last name
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
                    Email
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
                    Phone
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
                    How many guests, and anything we should know?{" "}
                    <span className="font-normal text-slate-400">(optional)</span>
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
                    {status === "submitting" ? "Sending…" : "Send My Details"}
                  </button>
                  {status === "error" && (
                    <p role="alert" className="mt-3 text-center text-sm font-medium text-rosa-600">
                      That did not go through. Please try again, or call us at{" "}
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

        <ReservationSection />

        <Section className="bg-blush-50">
          <div className="mx-auto max-w-2xl rounded-2xl bg-white px-6 py-7 text-center ring-1 ring-blush-200">
            <p className="text-slate-600">
              To sail with the group on the group rate, cabins must be booked through Happy
              Holidays Travel. A{" "}
              <strong className="text-royal-800">{invitation.deposit.amount}</strong> nonrefundable
              deposit per person starts the reservation, and the balance can be paid on a plan.
            </p>
          </div>
        </Section>

        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
