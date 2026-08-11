import { invitation } from "../data/invitation";
import Icon from "./Icon";

export default function Header() {
  const { agent, office, reservationFormUrl } = invitation;
  // On the public marketing page the visitor has no invitation and no
  // agent yet, so sending her straight to the booking form skips the
  // lead capture entirely. Point her at the inquiry form instead.
  const isMarketingPage =
    typeof window !== "undefined" &&
    window.location.pathname.replace(/\/+$/, "") === "/quince-cruises";
  const ctaHref = isMarketingPage ? "#inquire" : reservationFormUrl;
  const ctaLabel = isMarketingPage ? "Get My Free Quote" : "Reserve Your Cabin";

  return (
    <header className="sticky top-0 z-40 border-b border-blush-200/70 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-content items-center justify-between px-5 sm:px-8">
        <a href="#top" className="flex items-center gap-2.5" aria-label={`${office.name} home`}>
          <img
            src="/images/logo-mark.png"
            alt=""
            aria-hidden="true"
            className="h-10 w-auto"
            width={212}
            height={320}
          />
          <span className="flex items-baseline gap-2">
            <span className="font-display text-lg font-semibold text-royal-800 sm:text-xl">
              Happy Holidays
            </span>
            {/* The balloon already carries the brand on a phone, where the
                header has no room for the wordmark's second half. */}
            <span className="hidden text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-gold-500 sm:inline">
              Travel
            </span>
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
          {ctaHref && (
            <a
              href={ctaHref}
              target={isMarketingPage ? undefined : "_blank"}
              rel={isMarketingPage ? undefined : "noopener noreferrer"}
              className="ml-1 hidden rounded-full bg-royal-600 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow transition hover:bg-royal-700 sm:inline-flex"
            >
              {ctaLabel}
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}
