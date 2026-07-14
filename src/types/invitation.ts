// TypeScript types for the invitation configuration.
// Edit values in src/data/invitation.ts — not this file.

export interface ExperienceItem {
  /** Set to false to hide this card without deleting it. */
  enabled: boolean;
  /** Icon name — see src/components/Icon.tsx for the available names. */
  icon: string;
  title: string;
  description?: string;
}

export interface PricingLink {
  /** Button label, e.g. "Two Guests Per Cabin". */
  label: string;
  /** Leave "" to hide the button. */
  url: string;
}

export interface InvitationConfig {
  quinceanera: {
    fullName: string;
    preferredName: string;
  };
  /** Group name used by HHT to identify this booking group. */
  groupName: string;

  hero: {
    /** Path (in /public) or full URL of the main invitation image. */
    image: string;
    imageAlt: string;
    /** CSS object-position, e.g. "center", "center top", "50% 30%". */
    imagePosition: string;
  };

  cruise: {
    line: string;
    ship: string;
    /** Human-readable dates shown on the page, e.g. "July 17–24, 2027". */
    sailingDates: string;
    nights: number;
    itineraryName: string;
    departurePort: string;
    destinations: string[];
    /** Smaller ship photo shown in the cruise-details section. */
    shipImage: string;
    shipImageAlt: string;
  };

  invitationMessage: string;
  /** Optional sign-off under the message, e.g. "With love, the Martinez family". */
  invitationSignature: string;

  celebration: {
    heading: string;
    description: string;
  };

  experiences: ExperienceItem[];
  /** Compliance note displayed under the experience cards. */
  openBarNote: string;

  pricing: {
    /** e.g. "$1,150" — leave "" to hide the starting-price line. */
    startingPricePerPerson: string;
    /** Leave any URL "" to hide that button. */
    fullPricingUrl: string;
    occupancyLinks: PricingLink[];
  };

  /** Existing HHT reservation form — buttons across the page use this. */
  reservationFormUrl: string;
  /** Existing HHT deposit-payment link. */
  depositPaymentUrl: string;

  deposit: {
    /** e.g. "$100". */
    amount: string;
    policy: string;
  };

  registry: {
    /** Set to false to hide the gift-registry section entirely. */
    enabled: boolean;
    url: string;
    /** Leave "" to auto-generate "[Name]’s Gift Registry". */
    heading: string;
    description: string;
    buttonLabel: string;
  };

  agent: {
    name: string;
    /** Digits for the tel: link, e.g. "13052674004". */
    phoneDial: string;
    /** Pretty phone display, e.g. "(305) 267-4004". */
    phoneDisplay: string;
    whatsappUrl: string;
    email: string;
    /** Optional photo path in /public — leave "" for none. */
    photo: string;
  };

  office: {
    name: string;
    addressLine1: string;
    addressLine2: string;
    phoneDisplay: string;
    phoneDial: string;
    website: string;
    websiteUrl: string;
  };

  leadForm: {
    enabled: boolean;
    heading: string;
    description: string;
    /** Must match the hidden form name in index.html. */
    formName: string;
    /** "{name}" is replaced with the quinceañera’s preferred name. */
    successMessage: string;
  };

  social: {
    /** Also update index.html <meta> tags — see README → Social sharing. */
    title: string;
    description: string;
    image: string;
  };
}
