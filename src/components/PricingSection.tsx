import { invitation } from "../data/invitation";
import { say } from "../lib/inviteLang";
import PrimaryButton from "./PrimaryButton";
import Section from "./Section";
import SecondaryButton from "./SecondaryButton";

export default function PricingSection() {
  const { pricing, reservationFormUrl } = invitation;
  const occupancyLinks = pricing.occupancyLinks.filter((l) => l.url);

  return (
    <Section id="pricing" className="bg-blush-50">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-display text-3xl font-bold text-royal-800 sm:text-4xl">
          {say("Choose the Cabin That Works Best for Your Family", "Elija la Cabina Ideal para su Familia")}
        </h2>
        <p className="mt-4 text-slate-600">
          {say(
            "Prices are per person and vary based on cabin category and the number of guests sharing the cabin.",
            "Los precios son por persona y varían según la categoría de la cabina y el número de personas que la comparten.",
          )}
        </p>

        {pricing.startingPricePerPerson && (
          <p className="mt-8 font-display text-2xl text-royal-800 sm:text-3xl">
            {say("Cabins starting at", "Cabinas desde")}{" "}
            <span className="font-bold text-rosa-600">{pricing.startingPricePerPerson}</span>{" "}
            {say("per person", "por persona")}
          </p>
        )}

        <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap">
          {pricing.fullPricingUrl && (
            <SecondaryButton href={pricing.fullPricingUrl}>{say("View Full Pricing", "Ver Todos los Precios")}</SecondaryButton>
          )}
          {occupancyLinks.map((link) => (
            <SecondaryButton key={link.label} href={link.url}>
              {say(link.label, link.label.replace(/^(\w+) Guests Per Cabin$/, (_, n) => `${({ Two: "Dos", Three: "Tres", Four: "Cuatro" } as Record<string, string>)[n] ?? n} Personas por Cabina`))}
            </SecondaryButton>
          ))}
        </div>

        {reservationFormUrl && (
          <div className="mt-12 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-blush-200">
            <p className="font-display text-xl text-royal-800">{say("Found the right cabin?", "¿Encontró la cabina ideal?")}</p>
            <div className="mt-5 flex justify-center">
              <PrimaryButton href={reservationFormUrl} className="px-12">
                {say("Reserve Your Cabin", "Reserve su Cabina")}
              </PrimaryButton>
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}
