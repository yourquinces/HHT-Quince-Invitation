import { invitation } from "../data/invitation";
import Icon from "./Icon";
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
          Choose the Cabin That Works Best for Your Family
        </h2>
        <p className="mt-4 text-slate-600">
          Prices are per person and vary based on cabin category and the number of guests sharing
          the cabin.
        </p>

        {pricing.startingPricePerPerson && (
          <p className="mt-8 font-display text-2xl text-royal-800 sm:text-3xl">
            Cabins starting at{" "}
            <span className="font-bold text-rosa-600">{pricing.startingPricePerPerson}</span> per
            person
          </p>
        )}

        <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap">
          {pricing.fullPricingUrl && (
            <SecondaryButton href={pricing.fullPricingUrl}>
              View Full Pricing
              <Icon name="externalLink" className="h-4 w-4" />
            </SecondaryButton>
          )}
          {occupancyLinks.map((link) => (
            <SecondaryButton key={link.label} href={link.url}>
              {link.label}
            </SecondaryButton>
          ))}
        </div>

        {reservationFormUrl && (
          <div className="mt-12 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-blush-200">
            <p className="font-display text-xl text-royal-800">Found the right cabin?</p>
            <div className="mt-5 flex justify-center">
              <PrimaryButton href={reservationFormUrl} className="px-12">
                Reserve Your Cabin
              </PrimaryButton>
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}
