import { useEffect, useState } from "react";
import { invitation } from "./data/invitation";
import {
  applyInvitationRow,
  editSlugFromPath,
  fetchInvitationRow,
  liveSlugFromPath,
  friendsSlugFromPath,
  groupCodeFromPath,
  guestsSlugFromPath,
  groupCruiseSlugFromPath,
  hubSlugFromPath,
  registerSlugFromPath,
} from "./lib/liveInvitation";
import FamilyEditPage from "./components/FamilyEditPage";
import FriendInvitePage from "./components/FriendInvitePage";
import GroupCruisePage from "./components/GroupCruisePage";
import GuestListPage from "./components/GuestListPage";
import ShipVisitFormPage from "./components/ShipVisitFormPage";
import ShipVisitsStaffPage from "./components/ShipVisitsStaffPage";
import QuinceHubPage from "./components/QuinceHubPage";
import QuinceRegistrationPage from "./components/QuinceRegistrationPage";
import RegistrationsStaffPage from "./components/RegistrationsStaffPage";
import HubsStaffPage from "./components/HubsStaffPage";
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
  const friendsSlug = friendsSlugFromPath(pathname);
  // The neutral invitation a booked relative forwards to their own friends.
  const groupCruiseSlug = groupCruiseSlugFromPath(pathname);
  // The neutral address for that same page — nothing in it names her.
  const groupCode = groupCodeFromPath(pathname);
  const hubSlug = hubSlugFromPath(pathname);
  // Her guest list — needs the same secret key as the family editor.
  const guestsSlug = guestsSlugFromPath(pathname);
  const registerSlug = registerSlugFromPath(pathname);
  // Standalone form for staff and anyone without an invitation yet.
  const isRegisterPage = route === "/register";
  const isStaffRegistrations = route === "/staff/registrations";
  const isStaffHubs = route === "/staff/hubs";
  // Ship visit registration, and the staff view that opens the dates.
  const isShipVisit = route === "/ship-visit";
  const isStaffShipVisits = route === "/staff/ship-visits";
  const liveSlug = liveSlugFromPath(pathname);

  // Every page below sets its own tab title, and React runs a parent's effect
  // AFTER its children's — so a blanket title here overwrote all of them, and
  // every page ended up titled with the sample config: "Celebrate Sofia's
  // Quinceañera Cruise". So this only titles the pages it actually owns: the
  // sample invitation at the root, the pricing table, and the marketing page.
  const pageOwnsTitle =
    !!editSlug || !!friendsSlug || !!groupCruiseSlug || !!groupCode || !!guestsSlug ||
    !!hubSlug || !!registerSlug || !!liveSlug ||
    isRegisterPage || isStaffRegistrations || isStaffHubs || isShipVisit || isStaffShipVisits;

  useEffect(() => {
    if (pageOwnsTitle) return;
    // These three belong to no particular girl, so they must not borrow the
    // sample invitation's title — that is how "Celebrate Sofia's Quinceañera
    // Cruise" ended up in the tab on pages that have nothing to do with her.
    const GENERIC = "Quinceañera Cruises | Happy Holidays Travel";
    if (isQuinceCruisesPage) {
      document.title = MARKETING_TITLE;
    } else if (isPricingPage) {
      document.title = "Cabin Pricing | Happy Holidays Travel";
    } else {
      document.title = GENERIC;
    }
    const meta = document.querySelector('meta[name="description"]');
    if (meta)
      meta.setAttribute(
        "content",
        isQuinceCruisesPage
          ? MARKETING_DESCRIPTION
          : "Celebrate a quinceañera at sea with Happy Holidays Travel. Cruise details, cabin prices and reservations for our 2027 group sailings.",
      );
  }, [isPricingPage, isQuinceCruisesPage, pageOwnsTitle]);

  if (isQuinceCruisesPage) return <QuinceCruisesPage />;
  if (isPricingPage) return <PricingPage />;
  if (editSlug) return <FamilyEditPage slug={editSlug} />;
  if (friendsSlug) return <FriendInvitePage slug={friendsSlug} />;
  if (groupCode) return <GroupCruisePage code={groupCode} />;
  if (groupCruiseSlug) return <GroupCruisePage slug={groupCruiseSlug} />;
  if (guestsSlug) return <GuestListPage slug={guestsSlug} />;
  if (hubSlug) return <QuinceHubPage slug={hubSlug} />;
  if (registerSlug) return <QuinceRegistrationPage slug={registerSlug} />;
  if (isRegisterPage) return <QuinceRegistrationPage />;
  if (isStaffRegistrations) return <RegistrationsStaffPage />;
  if (isStaffHubs) return <HubsStaffPage />;
  if (isShipVisit) return <ShipVisitFormPage />;
  if (isStaffShipVisits) return <ShipVisitsStaffPage />;
  if (liveSlug) return <LiveInvitation slug={liveSlug} />;
  return <InvitationPage />;
}
