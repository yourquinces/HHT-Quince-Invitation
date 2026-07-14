import { invitation } from "../data/invitation";
import BookingSteps from "./BookingSteps";
import PrimaryButton from "./PrimaryButton";
import Section from "./Section";
import SecondaryButton from "./SecondaryButton";

export default function ReservationSection() {
  const { reservationFormUrl, depositPaymentUrl } = invitation;

  return (
    <Section id="reserve" className="bg-blush-50">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-display text-3xl font-bold text-royal-800 sm:text-4xl">
          Ready to Book? Reserve Your Cabin
        </h2>
        <p className="mt-4 text-slate-600">
          Already know you want to join us? Complete the official Happy Holidays Travel reservation
          form below.
        </p>

        <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
          {reservationFormUrl && (
            <PrimaryButton href={reservationFormUrl} className="px-12">
              Reserve Your Cabin
            </PrimaryButton>
          )}
          {depositPaymentUrl && (
            <SecondaryButton href={depositPaymentUrl}>Pay Your Deposit</SecondaryButton>
          )}
        </div>
      </div>

      <div className="mt-14">
        <h3 className="mb-6 text-center font-display text-xl font-semibold text-royal-800">
          How Booking Works
        </h3>
        <BookingSteps />
      </div>
    </Section>
  );
}
