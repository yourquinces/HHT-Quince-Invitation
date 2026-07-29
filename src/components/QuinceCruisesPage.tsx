// /quince-cruises — the public landing page for email and ad traffic.
//
// Unlike /pricing, this page belongs to no family. It sells the 2027
// quinceañera cruise program, then captures the visitor into the
// quince_leads pipeline. The cabin grid is the SAME component /pricing
// renders, so rates and layout can never drift between the two.
//
// ── PAGE HIERARCHY (deliberate — it is a merchandising decision) ─────
//   1. Icon of the Seas    — featured hero panel. The priority sell.
//   2. Allure of the Seas  — supporting callout. Value + itinerary.
//   3. Pricing browser     — defaults to an Icon sailing.
//   4. What's included
//   5. Mediterranean       — modest limited-availability mention, NOT a
//                            push. It is nearly sold out, so promoting
//                            it hard would spend attention we need on Icon.
//   6. Lead form + contact
//
// Which ship is featured vs. secondary comes from FEATURED_SHIP /
// SECONDARY_SHIP in data/sailings.ts — re-rank there, not here.

import { useEffect, useState } from "react";
import { invitation } from "../data/invitation";
import {
  activeSailingsByShip,
  caribbeanSailings,
  defaultSailingId,
  FEATURED_SHIP,
  mediterraneanSailings,
  SECONDARY_SHIP,
  sailingById,
} from "../data/sailings";
import type { PricingSailing } from "../types/invitation";
import type { Cabin } from "../lib/pricingSheet";
import CabinPricingBrowser from "./CabinPricingBrowser";
import QuinceLeadForm from "./QuinceLeadForm";
import Header from "./Header";
import Footer from "./Footer";
import Icon from "./Icon";
import PrimaryButton from "./PrimaryButton";
import SecondaryButton from "./SecondaryButton";

const CARIBBEAN = caribbeanSailings();
const MEDITERRANEAN = mediterraneanSailings();
const ALL = [...CARIBBEAN, ...MEDITERRANEAN];
const FEATURED = activeSailingsByShip(FEATURED_SHIP);
const SECONDARY = activeSailingsByShip(SECONDARY_SHIP);

/** The page opens on the featured ship unless a link asks for otherwise. */
function preferredSailing(): PricingSailing {
  return (
    FEATURED.find((s) => s.id === defaultSailingId) ??
    FEATURED[0] ??
    ALL.find((s) => s.id === defaultSailingId) ??
    CARIBBEAN[0] ??
    ALL[0]
  );
}

function initialSailing(): PricingSailing {
  const wanted = sailingById(
    new URLSearchParams(window.location.search).get("sailing"),
  );
  if (wanted && ALL.some((s) => s.id === wanted.id)) return wanted;
  return preferredSailing();
}

function initialGuests(): string {
  const guests = new URLSearchParams(window.location.search).get("guests");
  return guests && ["1", "2", "3", "4"].includes(guests) ? guests : "2";
}

const INCLUDED = [
  {
    icon: "ship" as const,
    title: "Her cabin, meals and the sailing itself",
    body: "Cruise fare covers accommodations, main dining, buffets, pools, waterslides, shows and the teen club — so the celebration is not an endless list of add-ons.",
  },
  {
    icon: "users" as const,
    title: "Group rates for everyone she invites",
    body: "We hold cabins together as a group so family and friends book at the same rate and end up on the same decks, not scattered across the ship.",
  },
  {
    icon: "calendar" as const,
    title: "Payment plans, not one big bill",
    body: "Reserve with a deposit and pay the balance over time. We will lay out the schedule for your group before you commit to anything.",
  },
  {
    icon: "crown" as const,
    title: "A specialist who has done this before",
    body: "Happy Holidays Travel has planned quinceañera sailings for years. One person handles your group start to finish, in English or Spanish.",
  },
];

export default function QuinceCruisesPage() {
  const { agent, office } = invitation;
  const [sailing, setSailing] = useState<PricingSailing>(initialSailing);
  const [guests, setGuests] = useState(initialGuests);
  // The cabin she clicked, carried into the inquiry form so the agent knows
  // exactly which room she was looking at. Cleared when she changes sailing,
  // because the categories differ from ship to ship.
  const [chosenCabin, setChosenCabin] = useState<Cabin | null>(null);

  const isMed = MEDITERRANEAN.some((s) => s.id === sailing.id);
  const tab = sailing.tabs.find((t) => t.guests === guests) ?? sailing.tabs[0];
  // Once she's viewing a Mediterranean sailing, keep it in the dropdown so
  // she has a way back to the Caribbean list without hunting for it.
  const pickerSailings = isMed ? ALL : CARIBBEAN;

  useEffect(() => {
    window.history.replaceState(
      null,
      "",
      `/quince-cruises?sailing=${sailing.id}&guests=${tab.guests}`,
    );
  }, [sailing.id, tab.guests]);

  const changeSailing = (id: string) => {
    const next = ALL.find((s) => s.id === id);
    if (!next || next.id === sailing.id) return;
    setSailing(next);
    setChosenCabin(null);
  };

  const showPricing = (id: string) => {
    changeSailing(id);
    document
      .getElementById("cabin-pricing")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  /** A cabin card was clicked — carry it to the form and scroll there. */
  const askAboutCabin = (cabin: Cabin) => {
    setChosenCabin(cabin);
    document.getElementById("inquire")?.scrollIntoView({ behavior: "smooth" });
  };

  const featuredLead = FEATURED[0];
  const secondaryLead = SECONDARY[0];

  return (
    <>
      <Header />
      <main>
        {/* ── Hero ───────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-b from-blush-100 via-blush-50 to-white px-5 pb-14 pt-14 text-center sm:px-8 sm:pt-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-rosa-200/40 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-gold-100/60 blur-3xl"
          />
          <div className="relative mx-auto max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gold-600">
              Sailing 2027 · Happy Holidays Travel
            </p>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-royal-800 sm:text-6xl">
              Her Quinceañera,
              <br className="hidden sm:block" /> at Sea
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-600">
              A quinceañera the whole family actually gets to enjoy — one price
              per person, one ship, and every guest celebrating together for a
              week instead of five hours in a ballroom.
            </p>

            <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
              <PrimaryButton href="#inquire" className="px-10">
                Get My Free Quote
              </PrimaryButton>
              <SecondaryButton href="#cabin-pricing">
                See Cabin Pricing
              </SecondaryButton>
            </div>

            <dl className="mt-12 grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
              {[
                {
                  k: FEATURED_SHIP,
                  v: "The newest, most spectacular ship at sea",
                  icon: "sparkles" as const,
                },
                {
                  k: `${CARIBBEAN.length} Caribbean dates`,
                  v: "Sailing from Miami and Fort Lauderdale",
                  icon: "calendar" as const,
                },
                {
                  k: "Hablamos español",
                  v: `${office.addressLine1}, ${office.addressLine2}`,
                  icon: "heart" as const,
                },
              ].map((item) => (
                <div
                  key={item.k}
                  className="rounded-3xl bg-white/80 p-5 shadow-sm ring-1 ring-blush-200 backdrop-blur"
                >
                  <span className="inline-flex rounded-full bg-blush-100 p-2.5 text-royal-600">
                    <Icon name={item.icon} className="h-5 w-5" />
                  </span>
                  <dt className="mt-3 font-display text-lg font-semibold text-royal-800">
                    {item.k}
                  </dt>
                  <dd className="mt-1 text-sm text-slate-600">{item.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ── 1. FEATURED: Icon of the Seas ──────────────────────── */}
        {featuredLead && (
          <section className="px-5 py-14 sm:px-8">
            <div className="mx-auto max-w-content">
              <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-royal-800 via-royal-700 to-royal-800 p-8 shadow-xl sm:p-12">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-20 -right-16 h-72 w-72 rounded-full bg-gold-500/20 blur-3xl"
                />
                <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
                  <div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-gold-500/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-gold-100">
                      <Icon name="crown" className="h-4 w-4" />
                      Our Featured Quince Cruise
                    </span>
                    <h2 className="mt-5 font-display text-3xl font-bold text-white sm:text-5xl">
                      {FEATURED_SHIP}
                    </h2>
                    <p className="mt-3 text-lg font-medium text-gold-200">
                      The most spectacular ship in the world
                    </p>
                    <p className="mt-4 max-w-xl leading-relaxed text-blush-100/90">
                      If she wants the celebration everyone will be talking
                      about, this is it. The newest and most exciting way to
                      mark a quinceañera at sea — a ship built around exactly
                      the kind of week a fifteen-year-old and her friends will
                      never stop retelling, with plenty for the adults in the
                      group too.
                    </p>

                    <ul className="mt-6 flex flex-wrap gap-2">
                      {featuredLead.destinations.map((d) => (
                        <li
                          key={d}
                          className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-sm text-white ring-1 ring-white/15"
                        >
                          <Icon
                            name="mapPin"
                            className="h-3.5 w-3.5 text-gold-300"
                          />
                          {d}
                        </li>
                      ))}
                    </ul>

                    {FEATURED.length > 1 && (
                      <div className="mt-7">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gold-200">
                          Choose her sailing date
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {FEATURED.map((s) => {
                            const selected = sailing.id === s.id;
                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => showPricing(s.id)}
                                aria-pressed={selected}
                                className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                                  selected
                                    ? "bg-white text-royal-800 shadow"
                                    : "bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20"
                                }`}
                              >
                                {s.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-3xl bg-white/95 p-6 text-center shadow-lg">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gold-600">
                      {featuredLead.itineraryName}
                    </p>
                    <p className="mt-2 font-display text-2xl font-bold text-royal-800">
                      {featuredLead.nights} Nights from{" "}
                      {featuredLead.departurePort.split(",")[0]}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {FEATURED.length} sailing{" "}
                      {FEATURED.length === 1 ? "date" : "dates"} in summer 2027
                    </p>
                    <div className="mt-6 flex flex-col gap-3">
                      <button
                        type="button"
                        onClick={() => showPricing(featuredLead.id)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-royal-600 px-6 py-4 text-sm font-semibold uppercase tracking-wider text-white shadow-lg shadow-royal-600/25 transition hover:bg-royal-700"
                      >
                        See Cabin Pricing
                      </button>
                      <a
                        href="#inquire"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-royal-300 px-6 py-4 text-sm font-semibold uppercase tracking-wider text-royal-700 transition hover:bg-royal-50"
                      >
                        Get My Free Quote
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── 2. SUPPORTING: Allure of the Seas ──────────────────── */}
        {secondaryLead && (
          <section className="px-5 pb-14 sm:px-8">
            <div className="mx-auto max-w-content">
              <div className="overflow-hidden rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-blush-200 sm:p-10">
                {/* Same photo as the warm-lead email, so the page reads as a
                    continuation of it rather than a second, different pitch. */}
                <img
                  src="/images/allure.jpg"
                  alt={`${SECONDARY_SHIP} at sea`}
                  className="mb-8 aspect-[21/9] w-full rounded-3xl object-cover ring-1 ring-blush-200"
                  loading="lazy"
                  width={1600}
                  height={1050}
                />
                <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
                  <div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-gold-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-gold-600">
                      <Icon name="anchor" className="h-4 w-4" />
                      Best Value · Best Itinerary
                    </span>
                    <h2 className="mt-5 font-display text-3xl font-bold text-royal-800 sm:text-4xl">
                      {SECONDARY_SHIP}
                    </h2>
                    <p className="mt-3 text-lg font-medium text-rosa-600">
                      The best-value quince cruise on the market
                    </p>
                    <p className="mt-4 max-w-xl leading-relaxed text-slate-600">
                      The strongest itinerary we sell, and the one families come
                      back to when they want the most celebration for the money.
                      A longer sailing, more ports, and a ship with more than
                      enough to keep a group of teenagers happy all week.
                    </p>

                    <ul className="mt-6 flex flex-wrap gap-2">
                      {secondaryLead.destinations.map((d) => (
                        <li
                          key={d}
                          className="inline-flex items-center gap-1.5 rounded-full bg-blush-50 px-3.5 py-1.5 text-sm text-royal-800 ring-1 ring-blush-200"
                        >
                          <Icon
                            name="mapPin"
                            className="h-3.5 w-3.5 text-gold-600"
                          />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-3xl bg-blush-50 p-6 text-center ring-1 ring-blush-200">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gold-600">
                      {secondaryLead.itineraryName}
                    </p>
                    <p className="mt-2 font-display text-2xl font-bold text-royal-800">
                      {secondaryLead.nights} Nights from{" "}
                      {secondaryLead.departurePort.split(",")[0]}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {secondaryLead.label}
                    </p>
                    <div className="mt-6">
                      <button
                        type="button"
                        onClick={() => showPricing(secondaryLead.id)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-royal-300 bg-white px-6 py-4 text-sm font-semibold uppercase tracking-wider text-royal-700 shadow-sm transition hover:border-royal-400 hover:bg-royal-50"
                      >
                        See Allure Pricing
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── 3. Live cabin pricing (shared with /pricing) ────────── */}
        <CabinPricingBrowser
          sailing={sailing}
          guests={guests}
          onGuestsChange={setGuests}
          pickerSailings={pickerSailings}
          onSailingChange={changeSailing}
          resultsId="cabin-pricing"
          cabinCta={(cabin) => ({
            label: "Ask About This Cabin",
            onClick: () => askAboutCabin(cabin),
          })}
          header={
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gold-600">
                Live Cabin Rates
              </p>
              <h2 className="mt-3 font-display text-4xl font-bold text-royal-800 sm:text-5xl">
                Cabin Pricing
              </h2>
              <p className="mt-4 text-slate-600">
                {sailing.ship} · {sailing.label}
              </p>
              <p className="text-slate-600">
                {sailing.nights} Night {sailing.itineraryName} Cruise from{" "}
                {sailing.departurePort}
              </p>
            </>
          }
        />

        {/* ── 4. What the price covers ───────────────────────────── */}
        <section className="bg-blush-50 px-5 py-14 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-content">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-bold text-royal-800 sm:text-4xl">
                What Those Prices Actually Cover
              </h2>
              <p className="mt-4 text-slate-600">
                Cruising is one of the few ways to give her a real celebration
                without an open-ended budget.
              </p>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {INCLUDED.map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-blush-200"
                >
                  <span className="inline-flex rounded-full bg-blush-100 p-3 text-royal-600">
                    <Icon name={item.icon} className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 font-display text-xl font-semibold text-royal-800">
                    {item.title}
                  </h3>
                  <p className="mt-2 leading-relaxed text-slate-600">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-8 text-center text-sm text-slate-500">
              Gratuities, drink packages, shore excursions and airfare are not
              included in the cabin rates above. Ask us and we will price the
              whole trip, not just the cruise.
            </p>
          </div>
        </section>

        {/* ── 5. Mediterranean — modest, honest scarcity ──────────── */}
        {MEDITERRANEAN.length > 0 && (
          <section className="px-5 py-14 sm:px-8">
            <div className="mx-auto max-w-3xl">
              {MEDITERRANEAN.map((med) => (
                <div
                  key={med.id}
                  className="overflow-hidden rounded-3xl border border-gold-200 bg-white shadow-sm sm:grid sm:grid-cols-[0.85fr_1.15fr] sm:items-stretch"
                >
                  {/* Deliberately a side panel, not a banner — Europe stays a
                      mention. A full-width hero here would out-shout Icon. */}
                  <img
                    src="/images/europe.jpg"
                    alt="Blue-domed churches above the sea in Santorini, Greece"
                    className="h-48 w-full object-cover sm:h-full"
                    loading="lazy"
                    width={1216}
                    height={810}
                  />

                  <div className="p-7 sm:p-8">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-2 rounded-full bg-gold-100 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">
                        <Icon name="sparkles" className="h-3.5 w-3.5" />
                        Once in a Lifetime
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rosa-100 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-rosa-600">
                        Very Limited Availability
                      </span>
                    </div>

                    <h2 className="mt-5 font-display text-2xl font-bold text-royal-800 sm:text-3xl">
                      A European Quinceañera
                    </h2>
                    <p className="mt-2 text-sm font-medium text-slate-500">
                      {med.ship} · {med.label} · {med.nights} nights from{" "}
                      {med.departurePort}
                    </p>
                    <p className="mt-4 leading-relaxed text-slate-600">
                      For the rare family who wants her fifteenth marked in the
                      Mediterranean — {med.destinations.slice(0, -1).join(", ")}{" "}
                      and {med.destinations[med.destinations.length - 1]}. We
                      only run this sailing once, and it is close to full. If it
                      interests you, ask early rather than late.
                    </p>

                    <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => showPricing(med.id)}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-royal-300 bg-white px-6 py-3.5 text-sm font-semibold uppercase tracking-wider text-royal-700 shadow-sm transition hover:border-royal-400 hover:bg-royal-50"
                      >
                        See Remaining Cabins
                      </button>
                      <a
                        href="#inquire"
                        className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold uppercase tracking-wider text-royal-700 underline decoration-royal-300 underline-offset-4 transition hover:text-royal-800"
                      >
                        Ask About Availability
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── 6. Primary capture + WhatsApp / phone ──────────────── */}
        <QuinceLeadForm
          sailing={sailing}
          cabin={chosenCabin}
          onClearCabin={() => setChosenCabin(null)}
          id="inquire"
        />

        {/* ── Closing contact strip ──────────────────────────────── */}
        <section className="bg-royal-800 px-5 py-14 text-center sm:px-8">
          <div className="mx-auto max-w-content">
            <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
              Still deciding? Just ask us.
            </h2>
            <p className="mt-3 text-blush-100/80">
              No pressure and no obligation — we will answer questions even if
              you book a year from now.
            </p>
            <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
              <a
                href={agent.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-8 py-4 text-sm font-semibold uppercase tracking-wider text-white shadow-lg transition hover:brightness-95"
              >
                <Icon name="whatsapp" className="h-5 w-5" />
                WhatsApp Us
              </a>
              <a
                href={`tel:+${agent.phoneDial}`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-8 py-4 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-white/20"
              >
                <Icon name="phone" className="h-5 w-5" />
                {agent.phoneDisplay}
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
