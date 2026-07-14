import { invitation } from "../data/invitation";
import Icon from "./Icon";
import PrimaryButton from "./PrimaryButton";
import SecondaryButton from "./SecondaryButton";

export default function Hero() {
  const { quinceanera, hero, cruise, reservationFormUrl } = invitation;

  const details = [
    { icon: "ship", text: `${cruise.ship} · ${cruise.line}` },
    { icon: "calendar", text: cruise.sailingDates },
    { icon: "moon", text: `${cruise.nights}-Night ${cruise.itineraryName} Cruise` },
    { icon: "anchor", text: `Departing from ${cruise.departurePort}` },
  ];

  return (
    <section id="top" className="relative overflow-hidden bg-gradient-to-b from-blush-100 via-blush-50 to-white">
      {/* soft decorative glows */}
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
            Join us as we celebrate
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold leading-tight text-royal-800 sm:text-5xl lg:text-6xl">
            {quinceanera.preferredName}’s
            <span className="mt-1 block bg-gradient-to-r from-rosa-500 to-royal-500 bg-clip-text text-transparent">
              Quinceañera Cruise
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
            {reservationFormUrl && (
              <PrimaryButton href={reservationFormUrl}>Reserve Your Cabin</PrimaryButton>
            )}
            <SecondaryButton href="#pricing">View Cabin Prices</SecondaryButton>
          </div>
        </div>

        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          <div className="rounded-3xl bg-white p-3 shadow-xl shadow-royal-800/10 ring-1 ring-blush-200">
            <div className="aspect-[4/5] overflow-hidden rounded-2xl">
              <img
                src={hero.image}
                alt={hero.imageAlt}
                className="h-full w-full object-cover"
                style={{ objectPosition: hero.imagePosition }}
                fetchPriority="high"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
