// /pricing — the pricing page linked from each family's invitation.
//
// The cabin grid itself lives in <CabinPricingBrowser>, shared with the
// public marketing page (/quince-cruises) so the two can never drift.
// This file owns only what is invitation-specific: the hero copy, the
// ?sailing= lock, and the reserve-your-cabin CTA.

import { useEffect, useState } from "react";
import { invitation } from "../data/invitation";
import { defaultSailingId, sailings } from "../data/sailings";
import { bookingUrlFor } from "../lib/cabinBooking";
import CabinPricingBrowser from "./CabinPricingBrowser";
import Header from "./Header";
import Footer from "./Footer";
import PrimaryButton from "./PrimaryButton";
import SecondaryButton from "./SecondaryButton";

function initialSailingIndex(): number {
  const wanted = new URLSearchParams(window.location.search).get("sailing");
  let index = sailings.findIndex((s) => s.id === wanted);
  if (index < 0) index = sailings.findIndex((s) => s.id === defaultSailingId);
  return index < 0 ? 0 : index;
}

function initialGuests(): string {
  const guests = new URLSearchParams(window.location.search).get("guests");
  return guests && ["1", "2", "3", "4"].includes(guests) ? guests : "2";
}

export default function PricingPage() {
  const { reservationFormUrl } = invitation;
  // Links from an invitation carry her ?sailing= — lock the page to that
  // cruise so guests only see prices for the sailing they're invited to.
  // The dropdown appears only when /pricing is opened without a sailing.
  const [locked] = useState(() => {
    const wanted = new URLSearchParams(window.location.search).get("sailing");
    return sailings.some((s) => s.id === wanted);
  });
  const [sailingIdx, setSailingIdx] = useState(initialSailingIndex);
  const [guests, setGuests] = useState(initialGuests);

  const sailing = sailings[sailingIdx];
  const tab = sailing.tabs.find((t) => t.guests === guests) ?? sailing.tabs[0];

  // Keep the URL shareable: /pricing?sailing=2027-07-17&guests=2
  useEffect(() => {
    window.history.replaceState(null, "", `/pricing?sailing=${sailing.id}&guests=${tab.guests}`);
  }, [sailing.id, tab.guests]);

  return (
    <>
      <Header />
      <main>
        <CabinPricingBrowser
          sailing={sailing}
          guests={guests}
          onGuestsChange={setGuests}
          pickerSailings={locked ? undefined : sailings}
          onSailingChange={
            locked
              ? undefined
              : (id) =>
                  setSailingIdx(Math.max(0, sailings.findIndex((s) => s.id === id)))
          }
          cabinCta={
            reservationFormUrl
              ? (cabin, resolvedGuests) => ({
                  label: "Reserve This Cabin",
                  href: bookingUrlFor(reservationFormUrl, cabin, sailing, resolvedGuests),
                })
              : undefined
          }
          header={
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gold-600">
                Live Cabin Rates
              </p>
              <h1 className="mt-3 font-display text-4xl font-bold text-royal-800 sm:text-5xl">
                Cabin Pricing
              </h1>
              <p className="mt-4 text-slate-600">
                {sailing.ship} · {sailing.label}
              </p>
              <p className="text-slate-600">
                {sailing.nights} Night {sailing.itineraryName} Cruise from {sailing.departurePort}
              </p>
            </>
          }
        />

        <section className="bg-blush-50 px-5 py-14 text-center sm:px-8">
          <div className="mx-auto max-w-content">
            <h2 className="font-display text-2xl font-bold text-royal-800 sm:text-3xl">
              Found the cabin that fits your family?
            </h2>
            <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
              {reservationFormUrl && (
                <PrimaryButton href={reservationFormUrl} className="px-12">
                  Reserve Your Cabin
                </PrimaryButton>
              )}
              <SecondaryButton href="/#reserve">See Booking Steps</SecondaryButton>
            </div>
            <p className="mt-6 text-sm text-slate-500">
              <a href="/" className="font-medium text-royal-600 underline hover:text-royal-700">
                Back to the invitation
              </a>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
