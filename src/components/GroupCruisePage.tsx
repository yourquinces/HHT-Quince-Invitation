// The group cruise invitation — /i/<slug>/cruise
//
// A booked relative forwards this to their own circle. It sells the same
// sailing as the quinceañera invitation, from the same data, and never
// mentions the quinceañera: no name, no group name, no gown photo, no
// registry, no private celebration. An uncle's colleague should be able to
// read the whole page and see nothing but a group cruise worth joining.
//
// Two things are still true underneath. Leads submitted here carry the
// quinceañera's name in the payload — the visitor never sees it, but the agent
// has to know which group's rate and cabin block the enquiry belongs to. And
// the page deliberately does NOT promise the private group events: those
// belong to her family, and a guest who arrives expecting them was mis-sold.
//
// ?from=Carlos personalises the greeting. It is a display nicety only, so it
// is trimmed hard and never trusted.

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { invitation } from "../data/invitation";
import { applyGroupCruiseRow, fetchInvitationRow } from "../lib/liveInvitation";
import type { InvitationRow } from "../lib/liveInvitation";
import { submitQuinceLead } from "../lib/quinceLeads";
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

type PageState = "loading" | "missing" | "ready";
type Status = "idle" | "submitting" | "success" | "error";

const inputClass =
  "w-full rounded-xl border border-blush-200 bg-white px-4 py-3.5 text-slate-800 placeholder:text-slate-400 focus:border-royal-400";
const labelClass = "mb-1.5 block text-sm font-semibold text-royal-800";

// What a stranger actually gets by booking with us rather than on their own.
// Every line is about the booking, not about the sailing — nothing here can
// go stale or over-promise when the cruise line changes what a fare includes.
const WHY_BOOK = [
  {
    icon: "users",
    title: "Our group rate",
    body: "Cabins are held in our group block, at group pricing rather than the public fare.",
  },
  {
    icon: "ship",
    title: "Cabins near each other",
    body: "Book while the block is open and we keep the group together on the same decks.",
  },
  {
    icon: "calendar",
    title: "Pay over time",
    body: "A deposit holds the cabin and the balance is spread out until the final payment date.",
  },
  {
    icon: "heart",
    title: "Travelling with friends",
    body: "You already know half the group — meals, ports and days at sea with your own people.",
  },
  {
    icon: "anchor",
    title: "One agent handles it",
    body: "Happy Holidays Travel books the cabin, the payments and the paperwork for everyone.",
  },
  {
    icon: "mapPin",
    title: "Same ship, same week",
    body: "Everyone sails together on the dates above — no coordinating separate bookings.",
  },
];

/** A forwarded name is decoration. Keep it short, single-line and plain. */
function cleanFromName(raw: string | null): string {
  if (!raw) return "";
  return raw
    .replace(/[^\p{L}\p{M}'’.\- ]/gu, "")
    .trim()
    .slice(0, 40);
}

export default function GroupCruisePage({ slug }: { slug: string }) {
  const [state, setState] = useState<PageState>("loading");
  const [row, setRow] = useState<InvitationRow | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [copied, setCopied] = useState(false);
  const [fields, setFields] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    notes: "",
    botField: "",
  });

  const fromName = useMemo(
    () => cleanFromName(new URLSearchParams(window.location.search).get("from")),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    fetchInvitationRow(slug)
      .then((r) => {
        if (cancelled) return;
        if (!r) {
          setState("missing");
          return;
        }
        applyGroupCruiseRow(r);
        setRow(r);
        document.title = invitation.social.title;
        setState("ready");
      })
      .catch(() => !cancelled && setState("missing"));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const shareUrl = useMemo(
    () => `${window.location.origin}/i/${encodeURIComponent(slug)}/cruise`,
    [slug],
  );

  const { cruise, office } = invitation;

  const shareText = useMemo(
    () =>
      `Come with us! We're sailing on ${cruise.ship} — ${cruise.nights} nights, ` +
      `${cruise.sailingDates}, out of ${cruise.departurePort}. ` +
      `Group rates and payment plans. Details here: `,
    [cruise.ship, cruise.nights, cruise.sailingDates, cruise.departurePort],
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (fields.botField) return; // honeypot
    setStatus("submitting");
    try {
      await submitQuinceLead({
        // Internal routing only — never rendered on this page. Without it the
        // agent cannot tell which group's cabin block the guest belongs to.
        quince_first: (row?.quinceanera_name || "").split(/\s+/)[0] || "",
        quince_last: (row?.quinceanera_name || "").split(/\s+/).slice(1).join(" "),
        parent_first: fields.firstName.trim(),
        parent_last: fields.lastName.trim(),
        parent_email: fields.email.trim(),
        parent_phone: fields.phone.trim(),
        interest: [cruise.ship],
        travel_year: (row?.sail_date || "").slice(0, 4),
        source: "group-cruise-invite",
        source_url: window.location.href,
        heard_about: fromName ? `Forwarded by ${fromName}` : "Forwarded by a guest in the group",
        client_notes:
          [
            fields.notes.trim(),
            `Guest of the ${row?.preferred_name || "group"} group, sailing ${cruise.sailingDates}.`,
          ]
            .filter(Boolean)
            .join(" — "),
      });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (state === "loading") {
    return (
      <>
        <Header />
        <main className="flex min-h-[60vh] items-center justify-center px-5 text-center">
          <p role="status" className="font-display text-2xl text-royal-800">
            Opening the invitation…
          </p>
        </main>
        <Footer />
      </>
    );
  }

  if (state === "missing") {
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
        {/* Hero — the ship, the dates, and a reason to keep reading. */}
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
                <Icon name="ship" className="h-7 w-7" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gold-600">
                You’re Invited
              </p>
              <p className="mt-4 font-display text-lg italic text-royal-600 sm:text-xl">
                {fromName ? `${fromName} would love you to join` : "Come sail with us"}
              </p>
              <h1 className="mt-2 font-display text-4xl font-bold leading-tight text-royal-800 sm:text-5xl lg:text-6xl">
                Join Our Group
                <span className="mt-1 block bg-gradient-to-r from-rosa-500 to-royal-500 bg-clip-text text-transparent">
                  At Sea
                </span>
              </h1>

              <p className="mt-5 text-[1.02rem] leading-relaxed text-slate-600 sm:mx-auto sm:max-w-md lg:mx-0">
                A group of families and friends sailing together. Book through Happy Holidays
                Travel and you get our group rate, our cabin block and a payment plan — and you
                travel with people you already know.
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
                <PrimaryButton href="#join">Ask About Cabins</PrimaryButton>
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

        <CruiseDetails />

        {/* NOT the shared "What's Included" list. That one is the host family's
            private group events — it names the guest of honour, and promising
            those events to an outside guest would be selling them something
            that is not theirs. This sells the booking instead, which is the
            honest difference between coming with us and booking alone. */}
        <Section className="bg-white">
          <h2 className="text-center font-display text-3xl font-bold text-royal-800 sm:text-4xl">
            Why Book With Our Group
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {WHY_BOOK.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl bg-blush-50 p-6 ring-1 ring-blush-200 transition hover:shadow-md"
              >
                <span className="inline-flex rounded-full bg-gradient-to-br from-rosa-100 to-royal-100 p-3 text-royal-600">
                  <Icon name={item.icon} className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-royal-800">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
        </Section>

        <PricingSection />

        {/* The one call to action. Prices are above; this is where a stranger
            raises their hand and an agent takes it from there. */}
        <Section id="join" className="bg-white">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-center font-display text-3xl font-bold text-royal-800 sm:text-4xl">
              Interested in Joining Us?
            </h2>
            <p className="mt-4 text-center text-slate-600">
              Leave your details and a Happy Holidays Travel agent will call you with cabin
              availability, current group pricing and the next steps.
            </p>

            {status === "success" ? (
              <p
                role="status"
                className="mt-8 rounded-2xl bg-blush-50 px-6 py-8 text-center font-display text-xl text-royal-800"
              >
                Thank you! An agent will be in touch shortly about joining the group.
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
                  <label className={labelClass} htmlFor="gc-first">
                    First name
                  </label>
                  <input
                    id="gc-first"
                    className={inputClass}
                    required
                    value={fields.firstName}
                    onChange={(e) => setFields({ ...fields, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="gc-last">
                    Last name
                  </label>
                  <input
                    id="gc-last"
                    className={inputClass}
                    value={fields.lastName}
                    onChange={(e) => setFields({ ...fields, lastName: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="gc-email">
                    Email
                  </label>
                  <input
                    id="gc-email"
                    type="email"
                    className={inputClass}
                    required
                    value={fields.email}
                    onChange={(e) => setFields({ ...fields, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="gc-phone">
                    Phone
                  </label>
                  <input
                    id="gc-phone"
                    type="tel"
                    className={inputClass}
                    value={fields.phone}
                    onChange={(e) => setFields({ ...fields, phone: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="gc-notes">
                    How many guests, and anything we should know?{" "}
                    <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <textarea
                    id="gc-notes"
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

        {/* Booking through HHT is what puts a guest in the group's cabin block
            and on the group rate. Said plainly, without naming the group. */}
        <Section className="bg-blush-50">
          <div className="mx-auto max-w-2xl rounded-2xl bg-white px-6 py-7 text-center ring-1 ring-blush-200">
            <p className="text-slate-600">
              To sail with us on the group rate, cabins must be booked through Happy Holidays
              Travel. A <strong className="text-royal-800">{invitation.deposit.amount}</strong>{" "}
              nonrefundable deposit per person starts the reservation, and the balance can be paid
              on a plan.
            </p>
          </div>
        </Section>

        {/* For the relative who is forwarding this on. */}
        <Section className="bg-white">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-2xl font-bold text-royal-800">
              Passing this along?
            </h2>
            <p className="mt-3 text-slate-600">
              Send it to anyone you would like sailing with you. The more of us there are, the
              better the week.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a
                className="rounded-full bg-royal-500 px-6 py-3 font-semibold text-white"
                href={`https://wa.me/?text=${encodeURIComponent(shareText + shareUrl)}`}
                target="_blank"
                rel="noopener"
              >
                WhatsApp
              </a>
              <a
                className="rounded-full bg-royal-500 px-6 py-3 font-semibold text-white"
                href={`sms:?&body=${encodeURIComponent(shareText + shareUrl)}`}
              >
                Text
              </a>
              <a
                className="rounded-full bg-royal-500 px-6 py-3 font-semibold text-white"
                href={`mailto:?subject=${encodeURIComponent(
                  `Come with us — ${cruise.ship}, ${cruise.sailingDates}`,
                )}&body=${encodeURIComponent(shareText + shareUrl)}`}
              >
                Email
              </a>
              <button
                type="button"
                className="rounded-full border border-royal-300 px-6 py-3 font-semibold text-royal-700"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(shareUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  } catch {
                    /* clipboard blocked — the link is on screen below */
                  }
                }}
              >
                {copied ? "Copied!" : "Copy link"}
              </button>
            </div>
            <p className="mt-4 break-all text-sm text-slate-400">{shareUrl}</p>
            <p className="mt-2 text-sm text-slate-500">
              Add <span className="font-mono text-slate-600">?from=YourName</span> to the end and
              your friends will see who invited them.
            </p>
          </div>
        </Section>

        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
