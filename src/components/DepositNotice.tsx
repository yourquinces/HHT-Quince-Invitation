import { invitation } from "../data/invitation";
import Icon from "./Icon";
import Section from "./Section";

export default function DepositNotice() {
  const { deposit, quinceanera } = invitation;

  return (
    <Section className="bg-white !py-10">
      <div className="mx-auto max-w-3xl rounded-3xl bg-gold-100/50 p-7 ring-1 ring-gold-200 sm:p-9">
        <div className="flex items-start gap-4">
          <span className="mt-0.5 shrink-0 rounded-full bg-gold-200/70 p-2.5 text-gold-600">
            <Icon name="info" className="h-5 w-5" />
          </span>
          <div className="space-y-3 text-[0.95rem] leading-relaxed text-slate-700">
            <p>{deposit.policy}</p>
            <p>
              To participate in the private group celebrations, reservations must be made through
              Happy Holidays Travel under {quinceanera.preferredName}’s group.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
