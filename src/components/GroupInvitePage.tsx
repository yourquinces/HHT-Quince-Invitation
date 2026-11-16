// A group quinceañera invitation — /g/<slug>
//
// The quince cruise, addressed to a whole community (e.g. the LPM family)
// instead of one girl. Written for TWO audiences, and every line must hold for
// both: girls celebrating their own quinceañera on the sailing, and guests
// coming along to celebrate their friends. No girl's name, photo or registry.
// Leads go to the normal quince_leads pipeline, tagged with the group.
//
// Content lives in src/data/groupInvites.ts.

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { invitation } from "../data/invitation";
import { groupInvites } from "../data/groupInvites";
import { applyGroupCruiseRow } from "../lib/liveInvitation";
import type { InvitationRow } from "../lib/liveInvitation";
import { submitQuinceLead } from "../lib/quinceLeads";
import CruiseDetails from "./CruiseDetails";
import IncludedExperience from "./IncludedExperience";
import PricingSection from "./PricingSection";
import ReservationSection from "./ReservationSection";
import DepositNotice from "./DepositNotice";
import ContactSection from "./ContactSection";
import Header from "./Header";
import Footer from "./Footer";
import Icon from "./Icon";
import PrimaryButton from "./PrimaryButton";
import SecondaryButton from "./SecondaryButton";
import Section from "./Section";

type Status = "idle" | "submitting" | "success" | "error";

const inputClass =
  "w-full rounded-xl border border-blush-200 bg-white px-4 py-3.5 text-slate-800 placeholder:text-slate-400 focus:border-royal-400";
const labelClass = "mb-1.5 block text-sm font-semibold text-royal-800";

const AGENT_EMAILS: Record<string, string> = {
  Camila: "camila@hhtcruises.net",
  Luisa: "luisa@hhtcruises.net",
};

export default function GroupInvitePage({ slug }: { slug: string }) {
  const group = groupInvites[slug];
  const [status, setStatus] = useState<Status>("idle");
  const [fields, setFields] = useState({
    parentFirst: "",
    parentLast: "",
    role: "",
    quinceName: "",
    email: "",
    phone: "",
    notes: "",
    botField: "",
  });

  // Overlay the sailing before the first render — the shared sections read
  // `invitation` directly. Done once; the config is static.
  const [ready] = useState(() => {
    if (!group) return false;
    const row: InvitationRow = {
      slug,
      quinceanera_name: "",
      preferred_name: "",
      group_name: group.groupName,
      family_message: null,
      signature: null,
      hero_image_url: null,
      image_position: null,
      registry_url: null,
      starting_price: null,
      ship: null,
      sailing_dates: null,
      sail_date: group.sailDate,
      agent_name: group.agentName,
      agent_phone: null,
      agent_whatsapp: null,
      agent_email: AGENT_EMAILS[group.agentName] ?? null,
    };
    applyGroupCruiseRow(row);
    // The shared card speaks of one guest of honour; here there are many.
    invitation.experiences = invitation.experiences.map((e) =>
      e.title === "Special Quinceañera Activities"
        ? { ...e, description: "Moments created just for each quinceañera." }
        : e,
    );
    return true;
  });

  const { cruise, office } = invitation;
  const title = group
    ? `Join the ${group.groupName} Family Quinceañera Cruise | ${cruise.ship}`
    : "Happy Holidays Travel";

  useEffect(() => {
    document.title = title;
    if (group)
      document
        .querySelector('meta[name="description"]')
        ?.setAttribute(
          "content",
          `Join the ${group.groupName} family aboard ${cruise.ship}, ${cruise.sailingDates} — ` +
            `celebrate your own quinceañera or come as a guest to celebrate with friends.`,
        );
  }, [title, group, cruise.ship, cruise.sailingDates]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (fields.botField || !group) return; // honeypot
    setStatus("submitting");
    const quince = fields.role === "celebrating" ? fields.quinceName.trim() : "";
    const roleNote =
      fields.role === "celebrating"
        ? "Celebrating her own quinceañera"
        : fields.role === "guest"
          ? "Coming as a guest to celebrate"
          : "";
    try {
      await submitQuinceLead({
        quince_first: quince.split(/\s+/)[0] || "",
        quince_last: quince.split(/\s+/).slice(1).join(" "),
        parent_first: fields.parentFirst.trim(),
        parent_last: fields.parentLast.trim(),
        parent_email: fields.email.trim(),
        parent_phone: fields.phone.trim(),
        interest: [cruise.ship],
        travel_year: group.sailDate.slice(0, 4),
        source: `group-invite:${slug}`,
        source_url: window.location.href,
        heard_about: `${group.groupName} family group invitation`,
        client_notes: [
          roleNote,
          fields.notes.trim(),
          `${group.groupName} family group, sailing ${cruise.sailingDates}. Agent: ${group.agentName}.`,
        ]
          .filter(Boolean)
          .join(" — "),
      });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (!group || !ready) {
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
                <Icon name="crown" className="h-7 w-7" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gold-600">
                You’re Invited
              </p>
              <p className="mt-4 font-display text-lg italic text-royal-600 sm:text-xl">
                Everyone is invited
              </p>
              <h1 className="mt-2 font-display text-4xl font-bold leading-tight text-royal-800 sm:text-5xl lg:text-6xl">
                Join the {group.groupName} Family
                <span className="mt-1 block bg-gradient-to-r from-rosa-500 to-royal-500 bg-clip-text text-transparent">
                  Quinceañera Cruise
                </span>
              </h1>

              <p className="mt-5 text-[1.02rem] leading-relaxed text-slate-600 sm:mx-auto sm:max-w-md lg:mx-0">
                Join the {group.groupName} family for an unforgettable week at sea! Whether she’s
                celebrating her own quinceañera or joining her friends for the fun, everyone is
                invited to be part of the experience. Individual quinceañera celebrations, one
                incredible ship, and a week of memories together!
              </p>

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
                <PrimaryButton href="#join">Join the Group</PrimaryButton>
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

        {/* Ship visit — walk aboard before booking. Near the top on purpose. */}
        <div className="bg-white px-5 sm:px-8">
          <a
            href="/ship-visit"
            className="relative z-10 mx-auto -mt-6 flex w-full max-w-3xl flex-col items-center gap-4 rounded-2xl bg-gradient-to-r from-royal-600 to-rosa-500 px-6 py-5 text-center text-white shadow-lg shadow-royal-800/20 transition hover:shadow-xl sm:flex-row sm:text-left"
          >
            <span className="inline-flex shrink-0 rounded-full bg-white/20 p-3">
              <Icon name="ship" className="h-6 w-6" />
            </span>
            <span className="flex-1">
              <span className="block font-display text-xl font-semibold">
                Come See the Ship in Person
              </span>
              <span className="mt-0.5 block text-sm text-white/90">
                Register for a ship visit — walk aboard, tour the ship and meet the families sailing with us.
              </span>
            </span>
            <span className="shrink-0 rounded-full bg-white px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-royal-700">
              Register for a Visit
            </span>
          </a>
        </div>

        <Section className="bg-white">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-display text-xl italic leading-relaxed text-royal-700 sm:text-2xl">
              “{group.message}”
            </p>
            <p className="mt-5 font-display text-lg text-rosa-600">{group.signature}</p>
          </div>
        </Section>

        <CruiseDetails />
        <IncludedExperience />
        <PricingSection />

        <Section id="join" className="bg-white">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-center font-display text-3xl font-bold text-royal-800 sm:text-4xl">
              Join the {group.groupName} Group
            </h2>
            <p className="mt-4 text-center text-slate-600">
              Leave your details and {group.agentName} from Happy Holidays Travel will call you
              with cabin availability, group pricing and the next steps — whether you are
              celebrating a quinceañera or coming along to celebrate.
            </p>

            {status === "success" ? (
              <p
                role="status"
                className="mt-8 rounded-2xl bg-blush-50 px-6 py-8 text-center font-display text-xl text-royal-800"
              >
                Thank you! {group.agentName} will be in touch shortly. We can’t wait to celebrate
                with you!
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
                  <label className={labelClass} htmlFor="gi-first">
                    First name
                  </label>
                  <input
                    id="gi-first"
                    className={inputClass}
                    required
                    value={fields.parentFirst}
                    onChange={(e) => setFields({ ...fields, parentFirst: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="gi-last">
                    Last name
                  </label>
                  <input
                    id="gi-last"
                    className={inputClass}
                    value={fields.parentLast}
                    onChange={(e) => setFields({ ...fields, parentLast: e.target.value })}
                  />
                </div>
                <fieldset className="sm:col-span-2">
                  <legend className={labelClass}>How are you joining us?</legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { v: "celebrating", label: "Celebrating her quinceañera" },
                      { v: "guest", label: "Coming as a guest to celebrate" },
                    ].map((o) => (
                      <label
                        key={o.v}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3.5 text-slate-800 ${
                          fields.role === o.v
                            ? "border-royal-400 bg-royal-50"
                            : "border-blush-200 bg-white"
                        }`}
                      >
                        <input
                          type="radio"
                          name="gi-role"
                          value={o.v}
                          required
                          checked={fields.role === o.v}
                          onChange={() => setFields({ ...fields, role: o.v })}
                          className="accent-royal-600"
                        />
                        {o.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
                {fields.role === "celebrating" && (
                  <div className="sm:col-span-2">
                    <label className={labelClass} htmlFor="gi-quince">
                      Quinceañera’s name{" "}
                      <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <input
                      id="gi-quince"
                      className={inputClass}
                      value={fields.quinceName}
                      onChange={(e) => setFields({ ...fields, quinceName: e.target.value })}
                    />
                  </div>
                )}
                <div>
                  <label className={labelClass} htmlFor="gi-email">
                    Email
                  </label>
                  <input
                    id="gi-email"
                    type="email"
                    className={inputClass}
                    required
                    value={fields.email}
                    onChange={(e) => setFields({ ...fields, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="gi-phone">
                    Phone
                  </label>
                  <input
                    id="gi-phone"
                    type="tel"
                    className={inputClass}
                    value={fields.phone}
                    onChange={(e) => setFields({ ...fields, phone: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="gi-notes">
                    How many guests, and anything we should know?{" "}
                    <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <textarea
                    id="gi-notes"
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
        <DepositNotice />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
