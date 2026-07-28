import { useEffect, useState } from "react";
import { invitation } from "./data/invitation";
import {
  applyInvitationRow,
  editSlugFromPath,
  fetchInvitationRow,
  liveSlugFromPath,
} from "./lib/liveInvitation";
import FamilyEditPage from "./components/FamilyEditPage";
import PricingPage from "./components/PricingPage";
import QuinceCruisesPage from "./components/QuinceCruisesPage";
import Header from "./components/Header";
import Hero from "./components/Hero";
import PersonalMessage from "./components/PersonalMessage";
import CruiseDetails from "./components/CruiseDetails";
import CelebrationSection from "./components/CelebrationSection";
import IncludedExperience from "./components/IncludedExperience";
import PricingSection from "./components/PricingSection";
import GuestInterestForm from "./components/GuestInterestForm";
import ReservationSection from "./components/ReservationSection";
import DepositNotice from "./components/DepositNotice";
import RegistrySection from "./components/RegistrySection";
import ContactSection from "./components/ContactSection";
import Footer from "./components/Footer";

function InvitationPage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <PersonalMessage />
        <CruiseDetails />
        <CelebrationSection />
        <IncludedExperience />
        <PricingSection />
        <GuestInterestForm />
        <ReservationSection />
        <DepositNotice />
        <RegistrySection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}

function CenteredNotice({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex min-h-[60vh] items-center justify-center px-5 text-center">
        <div>{children}</div>
      </main>
      <Footer />
    </>
  );
}

/** Live invitation page (/i/<slug>) — loads its content from Supabase. */
function LiveInvitation({ slug }: { slug: string }) {
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    fetchInvitationRow(slug)
      .then((row) => {
        if (cancelled) return;
        if (!row) {
          setState("missing");
          return;
        }
        applyInvitationRow(row);
        document.title = invitation.social.title;
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (state === "loading") {
    return (
      <CenteredNotice>
        <p role="status" className="font-display text-2xl text-royal-800">
          Opening your invitation…
        </p>
      </CenteredNotice>
    );
  }
  if (state === "missing" || state === "error") {
    return (
      <CenteredNotice>
        <p className="font-display text-2xl font-semibold text-royal-800">
          We could not find this invitation.
        </p>
        <p className="mt-3 text-slate-600">
          Please double check the link you received, or contact Happy Holidays Travel at{" "}
          <a href={`tel:+${invitation.office.phoneDial}`} className="font-medium text-royal-600">
            {invitation.office.phoneDisplay}
          </a>
          .
        </p>
      </CenteredNotice>
    );
  }
  return <InvitationPage />;
}

const MARKETING_TITLE = "2027 Quinceañera Cruises | Happy Holidays Travel";
const MARKETING_DESCRIPTION =
  "Celebrate her quinceañera at sea in 2027. Live cabin pricing for our Caribbean and Mediterranean group sailings, plus free quotes and payment plans from Happy Holidays Travel.";

export default function App() {
  const pathname = window.location.pathname;
  const route = pathname.replace(/\/+$/, "");
  const isPricingPage = route === "/pricing";
  // Public landing page for email and ad traffic — belongs to no family.
  const isQuinceCruisesPage = route === "/quince-cruises";
  const editSlug = editSlugFromPath(pathname);
  const liveSlug = liveSlugFromPath(pathname);

  // Keep the browser-tab title/description in sync with the config.
  // (Share previews read index.html — see README → Social sharing.)
  useEffect(() => {
    if (isQuinceCruisesPage) {
      document.title = MARKETING_TITLE;
    } else if (isPricingPage) {
      document.title = `Cabin Pricing | ${invitation.social.title}`;
    } else {
      document.title = invitation.social.title;
    }
    const meta = document.querySelector('meta[name="description"]');
    if (meta)
      meta.setAttribute(
        "content",
        isQuinceCruisesPage ? MARKETING_DESCRIPTION : invitation.social.description,
      );
  }, [isPricingPage, isQuinceCruisesPage]);

  if (isQuinceCruisesPage) return <QuinceCruisesPage />;
  if (isPricingPage) return <PricingPage />;
  if (editSlug) return <FamilyEditPage slug={editSlug} />;
  if (liveSlug) return <LiveInvitation slug={liveSlug} />;
  return <InvitationPage />;
}
