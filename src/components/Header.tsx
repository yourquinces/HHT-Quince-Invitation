import { invitation } from "../data/invitation";
import Icon from "./Icon";

export default function Header() {
  const { agent, office, reservationFormUrl } = invitation;
  return (
    <header className="sticky top-0 z-40 border-b border-blush-200/70 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-content items-center justify-between px-5 sm:px-8">
        <a href="#top" className="flex items-baseline gap-2" aria-label={`${office.name} home`}>
          <span className="font-display text-xl font-semibold text-royal-800">
            Happy Holidays
          </span>
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-gold-500">
            Travel
          </span>
        </a>

        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Quick actions">
          <a
            href={`tel:+${agent.phoneDial}`}
            className="rounded-full p-2.5 text-royal-700 transition hover:bg-royal-50"
            aria-label={`Call Happy Holidays Travel at ${agent.phoneDisplay}`}
          >
            <Icon name="phone" className="h-5 w-5" />
          </a>
          <a
            href={agent.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full p-2.5 text-royal-700 transition hover:bg-royal-50"
            aria-label="Message Happy Holidays Travel on WhatsApp"
          >
            <Icon name="whatsapp" className="h-5 w-5" />
          </a>
          {reservationFormUrl && (
            <a
              href={reservationFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 hidden rounded-full bg-royal-600 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow transition hover:bg-royal-700 sm:inline-flex"
            >
              Reserve Your Cabin
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}
