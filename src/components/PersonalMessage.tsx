import { invitation } from "../data/invitation";
import Section from "./Section";

export default function PersonalMessage() {
  const { invitationMessage, invitationSignature } = invitation;
  return (
    <Section className="bg-white">
      <div className="mx-auto max-w-3xl text-center">
        <span aria-hidden="true" className="font-display text-6xl leading-none text-rosa-300">
          “
        </span>
        <p className="-mt-4 font-display text-xl italic leading-relaxed text-royal-800 sm:text-2xl">
          {invitationMessage}
        </p>
        {invitationSignature && (
          <p className="mt-6 text-sm font-medium uppercase tracking-[0.25em] text-gold-600">
            {invitationSignature}
          </p>
        )}
      </div>
    </Section>
  );
}
