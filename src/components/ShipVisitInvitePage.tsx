// /ship-visit-invite — the announcement for the September 26, 2026 Icon of
// the Seas ship visit.
//
// WHY THIS PAGE EXISTS
// The same words go out as an email (emails/ship-visit-2026-09-26.html), but
// Resend is a sending API: it delivers to inboxes and gives us no public URL
// for the message. Constant Contact's "view in browser" link has no
// equivalent. So the announcement lives here as a real page, and that is the
// link staff paste into a text or a WhatsApp group. One set of words, two
// doors — and the edge function gives it a proper preview card when it is
// forwarded.
//
// Every hard fact below (date, time, price, the two-guest limit) mirrors the
// ship_visits row in Supabase that /ship-visit reads. If a staff member moves
// the date at /staff/ship-visits, THIS PAGE DOES NOT FOLLOW — it is
// announcement copy, not a live view. Check both when anything changes.

import { useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import Icon from "./Icon";
import PrimaryButton from "./PrimaryButton";

const RSVP_URL = "/ship-visit";

/** The facts, in one place, so the page and its tab title cannot disagree. */
const EVENT = {
  ship: "Icon of the Seas",
  date: "Saturday, September 26, 2026",
  time: "10:00 AM",
  price: "$20 per person",
  priceNote: "includes a snack",
  address: "Port of Miami — 1015 North America Way, Miami, FL 33132",
  rsvpBy: "Tuesday, September 8, 2026",
};

const DETAILS = [
  { icon: "mapPin", label: "Location", value: EVENT.address },
  { icon: "calendar", label: "Date", value: EVENT.date },
  { icon: "clock", label: "Time", value: EVENT.time },
  { icon: "gift", label: "Cost", value: `${EVENT.price} (${EVENT.priceNote})` },
];

/** What every guest needs in hand before the form will take them. */
const BRING = [
  "Legal name, exactly as it appears on the photo ID they will bring",
  "Date of birth",
  "Photo ID number",
  "An individual email address — no two guests may share one",
];

export default function ShipVisitInvitePage() {
  useEffect(() => {
    document.title = "Icon of the Seas Ship Visit | Happy Holidays Travel";
  }, []);

  return (
    <div id="top" className="min-h-screen bg-blush-50 font-body text-slate-700">
      <Header />

      {/* Hero */}
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
            Our First Official Event
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-royal-800 sm:text-6xl">
            The Quinceañera Cruise
            <br className="hidden sm:block" /> Experience Starts Here
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-600">
            An exclusive ship visit aboard {EVENT.ship} — where the girls in your group meet
            for the first time, take their first pictures together, and step aboard the ship
            they will be celebrating on.
          </p>
          <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
            <PrimaryButton href={RSVP_URL} className="px-10">
              Reserve Your Spot
            </PrimaryButton>
          </div>
          <p className="mt-4 text-sm font-medium text-rosa-600">
            Space is very limited — RSVP by {EVENT.rsvpBy}
          </p>
        </div>
      </section>

      <main className="px-5 pb-16 sm:px-8">
        <div className="mx-auto max-w-3xl">
          {/* The letter */}
          <section className="rounded-[2rem] bg-white p-7 shadow-sm ring-1 ring-blush-200 sm:p-10">
            <p className="font-display text-xl text-royal-800">
              Dear Quinceañeras &amp; Parents,
            </p>
            <div className="mt-5 space-y-4 text-base leading-relaxed text-slate-600">
              <p>
                Our first official Quinceañera Cruise event has arrived, and we are so excited
                to officially kick off the experience.
              </p>
              <p>
                This is more than just a ship visit. This is the beginning of your Quinceañera
                Cruise journey.
              </p>
              <p>
                For many of the girls, this will be the first time meeting some of the other
                quinceañeras in their group. You'll get to spend time together, take your first
                group pictures, explore the incredible {EVENT.ship}, and start getting to know
                the girls you'll be sharing this unforgettable experience with.
              </p>
              <p className="font-medium text-royal-700">
                The cruise may still be months away, but the Quinceañera Cruise experience
                starts now.
              </p>
              <p>
                We strongly encourage every quinceañera to attend. These pre-cruise events are
                part of what makes the experience so special, and they help create the
                friendships, excitement and memories that build all the way up to sailing day.
              </p>
            </div>
          </section>

          {/* The details */}
          <section className="mt-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-royal-800 via-royal-700 to-royal-800 p-7 shadow-xl sm:p-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-gold-500/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-gold-100">
              <Icon name="ship" className="h-4 w-4" />
              Exclusive Ship Visit
            </span>
            <h2 className="mt-5 font-display text-3xl font-bold text-white sm:text-4xl">
              {EVENT.ship}
            </h2>

            <dl className="mt-7 grid gap-4 sm:grid-cols-2">
              {DETAILS.map((d) => (
                <div
                  key={d.label}
                  className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur"
                >
                  <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold-200">
                    <Icon name={d.icon} className="h-4 w-4" />
                    {d.label}
                  </dt>
                  <dd className="mt-2 text-base font-medium leading-snug text-white">
                    {d.value}
                  </dd>
                </div>
              ))}
            </dl>

            <p className="mt-7 text-base leading-relaxed text-royal-100">
              You'll have the opportunity to walk aboard {EVENT.ship}, explore some of its
              incredible spaces, see where many of your Quinceañera Cruise memories will
              happen, and picture yourself celebrating onboard with your group. And of
              course — come ready for pictures.
            </p>
          </section>

          {/* The rules that get people turned away at the gate */}
          <section className="mt-8 rounded-[2rem] bg-white p-7 shadow-sm ring-1 ring-rosa-200 sm:p-10">
            <h2 className="flex items-center gap-2.5 font-display text-2xl font-bold text-royal-800">
              <span className="inline-flex rounded-full bg-rosa-100 p-2 text-rosa-600">
                <Icon name="info" className="h-5 w-5" />
              </span>
              Important Information
            </h2>

            <p className="mt-5 text-base leading-relaxed text-slate-600">
              Due to limited space, each quinceañera may be accompanied by{" "}
              <strong className="font-semibold text-royal-700">up to 2 adults</strong>.
            </p>

            {/* Port security turns people away for exactly these two reasons, so
                they are a list rather than a sentence people skim past. */}
            <ul className="mt-5 space-y-3">
              {[
                "Everyone must present a valid photo ID to board.",
                "Adults: driver's license or government-issued photo ID.",
                "Quinceañeras: school ID or government-issued photo ID.",
                "No one will be allowed to board without proper photo identification.",
                "Each guest must provide a unique email address.",
              ].map((rule) => (
                <li key={rule} className="flex gap-3 text-base leading-relaxed text-slate-600">
                  <Icon name="check" className="mt-1 h-4 w-4 flex-none text-rosa-500" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* RSVP */}
          <section className="mt-8 rounded-[2rem] bg-white p-7 shadow-sm ring-1 ring-blush-200 sm:p-10">
            <h2 className="flex items-center gap-2.5 font-display text-2xl font-bold text-royal-800">
              <span className="inline-flex rounded-full bg-royal-100 p-2 text-royal-600">
                <Icon name="phone" className="h-5 w-5" />
              </span>
              Reserve Your Spot
            </h2>

            <p className="mt-5 text-base leading-relaxed text-slate-600">
              RSVP by <strong className="font-semibold text-royal-700">{EVENT.rsvpBy}</strong>.
              To reserve, complete the form — you will need the following for{" "}
              <em>each</em> guest:
            </p>

            <ul className="mt-5 space-y-3">
              {BRING.map((item) => (
                <li key={item} className="flex gap-3 text-base leading-relaxed text-slate-600">
                  <Icon name="check" className="mt-1 h-4 w-4 flex-none text-royal-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <p className="mt-5 text-base leading-relaxed text-slate-600">
              Payment is required at the time of RSVP — the form takes you straight to it once
              your details are saved.{" "}
              <strong className="font-semibold text-rosa-600">
                Your spot is not held until payment is made.
              </strong>
            </p>

            <div className="mt-7">
              <PrimaryButton href={RSVP_URL} className="px-10">
                Reserve Your Spot Here
              </PrimaryButton>
            </div>

            <p className="mt-4 text-sm font-medium text-rosa-600">
              Space is very limited, so please reserve as soon as possible.
            </p>
          </section>

          {/* Sign-off */}
          <section className="mt-8 rounded-[2rem] bg-gradient-to-br from-rosa-100 via-blush-100 to-gold-100 p-7 text-center sm:p-10">
            <Icon name="sparkles" className="mx-auto h-7 w-7 text-rosa-500" />
            <p className="mt-4 text-base leading-relaxed text-slate-700">
              We can't wait to see everyone together for the first time and officially begin
              this incredible adventure.
            </p>
            <p className="mt-4 font-display text-xl font-semibold text-royal-800">
              Meet your group. Take your first pictures. Step aboard Icon.
              <br />
              And let the countdown begin.
            </p>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-royal-700">
              Happy Holidays Travel Staff
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
