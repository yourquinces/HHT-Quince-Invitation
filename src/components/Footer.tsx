import { invitation } from "../data/invitation";

export default function Footer() {
  const { office } = invitation;
  return (
    <footer className="bg-royal-900 px-5 py-12 text-center text-sm text-royal-200 sm:px-8">
      <p className="font-display text-lg font-semibold text-white">
        Happy Holidays <span className="text-gold-300">Travel</span>
      </p>
      <p className="mt-3">
        {office.addressLine1} · {office.addressLine2}
      </p>
      <p className="mt-1">
        <a href={`tel:+${office.phoneDial}`} className="hover:text-white">
          {office.phoneDisplay}
        </a>
        {" · "}
        <a
          href={office.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white"
        >
          {office.website}
        </a>
      </p>
      <p className="mt-6 text-xs text-royal-300">
        © {new Date().getFullYear()} {office.name}. All rights reserved.
      </p>
    </footer>
  );
}
