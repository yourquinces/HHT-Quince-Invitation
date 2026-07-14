import { useEffect } from "react";
import { invitation } from "./data/invitation";
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

export default function App() {
  // Keep the browser-tab title/description in sync with the config.
  // (Share previews read index.html — see README → Social sharing.)
  useEffect(() => {
    document.title = invitation.social.title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", invitation.social.description);
  }, []);

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
