// ====================================================================
//  HAPPY HOLIDAYS TRAVEL — QUINCEAÑERA CRUISE INVITATION
// ====================================================================
//  ⭐ THIS IS THE ONLY FILE YOU EDIT TO CREATE A NEW INVITATION. ⭐
//
//  1. Replace the sample values below with the new family's details.
//  2. Save the file and redeploy the site (see README.md).
//  3. Also update the <title> and <meta> tags in index.html so
//     WhatsApp / Facebook previews match (they cannot read this file).
//
//  Any button whose link is left as "" is automatically hidden,
//  so you never ship a button that does nothing.
// ====================================================================

import type { InvitationConfig } from "../types/invitation";

export const invitation: InvitationConfig = {
  // ------------------------------------------------------------------
  // THE QUINCEAÑERA
  // ------------------------------------------------------------------
  quinceanera: {
    fullName: "Sofia Isabella Martinez",
    // The short name used throughout the page ("Sofia's Quinceañera Cruise").
    preferredName: "Sofia",
  },

  // The group name HHT uses to identify this booking group.
  groupName: "Sofia's Quinceañera Cruise Group",

  // ------------------------------------------------------------------
  // MAIN INVITATION IMAGE (hero)
  // Start with the ship photo. To switch to a photo of the quinceañera:
  //   1. Save her photo as  public/images/quinceanera.jpg  (portrait works best)
  //   2. Change image below to  "/images/quinceanera.jpg"
  //   3. Update imageAlt to describe her photo.
  // Full instructions: README.md → "Replacing the main photo".
  // ------------------------------------------------------------------
  hero: {
    image: "/images/hero-placeholder.svg", // Replace with "/images/ship.jpg" or "/images/quinceanera.jpg"
    imageAlt: "Icon of the Seas sailing the Caribbean",
    // Adjusts which part of the photo stays visible when cropped.
    // "center" | "center top" | "50% 30%" etc. For portraits, "center top"
    // usually keeps faces in frame.
    imagePosition: "center",
  },

  // ------------------------------------------------------------------
  // CRUISE DETAILS
  // ------------------------------------------------------------------
  cruise: {
    line: "Royal Caribbean",
    ship: "Icon of the Seas",
    sailingDates: "July 17–24, 2027",
    nights: 7,
    itineraryName: "Eastern Caribbean",
    departurePort: "Miami, Florida",
    destinations: ["St. Maarten", "St. Thomas", "Perfect Day at CocoCay"],
    // Smaller ship photo shown in the cruise-details section.
    // This stays even after the hero becomes the quinceañera's photo.
    shipImage: "/images/ship-placeholder.svg", // Replace with "/images/ship.jpg"
    shipImageAlt: "Royal Caribbean's Icon of the Seas",
  },

  // ------------------------------------------------------------------
  // PERSONAL INVITATION MESSAGE FROM THE FAMILY
  // ------------------------------------------------------------------
  invitationMessage:
    "We would love for our closest family and friends to join us as we celebrate this unforgettable milestone aboard Icon of the Seas. Come vacation, celebrate and make memories with us!",
  invitationSignature: "With love, the Martinez family",

  // ------------------------------------------------------------------
  // CELEBRATION SECTION
  // ------------------------------------------------------------------
  celebration: {
    heading: "Celebrate, Vacation and Make Memories Together!",
    description:
      "Join our family and friends for an unforgettable week filled with beautiful destinations, private celebrations and memories that will last a lifetime.",
  },

  // ------------------------------------------------------------------
  // WHAT'S INCLUDED — set enabled: false to hide a card.
  // Available icons: sparkles, music, martini, softdrink, crown,
  // camera, heart, ship, anchor, users, gift, calendar, mapPin, moon.
  // ------------------------------------------------------------------
  experiences: [
    {
      enabled: true,
      icon: "sparkles",
      title: "Three Private Celebrations",
      description: "Exclusive events reserved just for our group.",
    },
    {
      enabled: true,
      icon: "music",
      title: "Professional DJ & Entertainment",
      description: "Music and entertainment at every celebration.",
    },
    {
      enabled: true,
      icon: "martini",
      title: "Open Bar for Adults 21+",
      description: "Available during the private group events.",
    },
    {
      enabled: true,
      icon: "softdrink",
      title: "Beverages for Minors",
      description: "Nonalcoholic drinks for our younger guests.",
    },
    {
      enabled: true,
      icon: "crown",
      title: "Special Quinceañera Activities",
      description: "Moments created just for the guest of honor.",
    },
    {
      enabled: true,
      icon: "camera",
      title: "Group Photo Opportunities",
      description: "Capture the celebration together.",
    },
    {
      enabled: true,
      icon: "heart",
      title: "Memories with Family & Friends",
      description: "A once-in-a-lifetime week together at sea.",
    },
  ],
  openBarNote:
    "Open bar is available only to guests age 21 and older. Nonalcoholic beverages will be available for minors.",

  // ------------------------------------------------------------------
  // PRICING
  // Leave any URL as "" to hide that button.
  // ------------------------------------------------------------------
  pricing: {
    // Shown as "Cabins starting at $___ per person". Leave "" to hide.
    startingPricePerPerson: "",
    // These buttons open the live pricing page (/pricing), which pulls
    // current rates straight from the Google Sheet below.
    fullPricingUrl: "/pricing",
    occupancyLinks: [
      { label: "Two Guests Per Cabin", url: "/pricing?guests=2" },
      { label: "Three Guests Per Cabin", url: "/pricing?guests=3" },
      { label: "Four Guests Per Cabin", url: "/pricing?guests=4" },
    ],
  },

  // ------------------------------------------------------------------
  // LIVE PRICING PAGE (/pricing)
  // Rates come straight from the published Google Sheets — edit prices
  // in a sheet and the page updates on its own, no redeploy needed.
  // One entry below per group sailing. publishedId is the long id after
  // /d/e/ in that sailing's published sheet URL; each tab's gid is in
  // the sheet URL when you click that tab.
  // Invitation pages pick their sailing automatically from the
  // reservation's sail date; guests can also switch sailings on the
  // pricing page itself.
  // ------------------------------------------------------------------
  pricingSheet: {
    defaultSailingId: "2027-07-17",
    sailings: [
      {
        id: "2027-06-19",
        label: "June 19–26, 2027",
        ship: "Icon of the Seas",
        nights: 7,
        itineraryName: "Eastern Caribbean",
        departurePort: "Miami, Florida",
        destinations: ["St. Maarten", "St. Thomas", "Perfect Day at CocoCay"],
        publishedId:
          "2PACX-1vQsFMJ1Hcm4fqLYZ8D4u0ygh9SCrf5Ptneux5f1bEFpMCe3kJrxIWr8p9K5SFdyK7rDoEt9clsDpw6F",
        tabs: [
          { label: "One Guest", guests: "1", gid: "864754033" },
          { label: "Two Guests", guests: "2", gid: "1774284890" },
          { label: "Three Guests", guests: "3", gid: "832346416" },
          { label: "Four Guests", guests: "4", gid: "807433313" },
        ],
        backupUrl:
          "https://docs.google.com/spreadsheets/d/e/2PACX-1vQsFMJ1Hcm4fqLYZ8D4u0ygh9SCrf5Ptneux5f1bEFpMCe3kJrxIWr8p9K5SFdyK7rDoEt9clsDpw6F/pubhtml?gid=1774284890&single=true",
      },
      {
        id: "2027-06-26",
        label: "June 26 – July 3, 2027",
        ship: "Icon of the Seas",
        nights: 7,
        itineraryName: "Eastern Caribbean",
        departurePort: "Miami, Florida",
        destinations: ["St. Maarten", "St. Thomas", "Perfect Day at CocoCay"],
        publishedId:
          "2PACX-1vRAwFV-2v3cxREhZjBpFX92w6Vb9VL2LgJVmxbpi6aGBanxw3mCbLuGVCBpBgyEeYIl_Jge58vnWzdM",
        tabs: [
          { label: "One Guest", guests: "1", gid: "864754033" },
          { label: "Two Guests", guests: "2", gid: "1774284890" },
          { label: "Three Guests", guests: "3", gid: "832346416" },
          { label: "Four Guests", guests: "4", gid: "807433313" },
        ],
        backupUrl:
          "https://docs.google.com/spreadsheets/d/e/2PACX-1vRAwFV-2v3cxREhZjBpFX92w6Vb9VL2LgJVmxbpi6aGBanxw3mCbLuGVCBpBgyEeYIl_Jge58vnWzdM/pubhtml?gid=1774284890&single=true",
      },
      {
        id: "2027-07-10",
        label: "July 10–18, 2027",
        ship: "Allure of the Seas",
        nights: 8,
        itineraryName: "Southern Caribbean",
        departurePort: "Fort Lauderdale, Florida",
        destinations: ["Curaçao", "Aruba", "Dominican Republic", "Perfect Day at CocoCay"],
        publishedId:
          "2PACX-1vTg6CL03oAnpadMo1BBki52ZyiskuOxETOzHxhO1dLv_hiv2Jt4Qr8wBQELxiZGa8KaShUl2mjWsSM9",
        tabs: [
          { label: "One Guest", guests: "1", gid: "1448037444" },
          { label: "Two Guests", guests: "2", gid: "650291518" },
          { label: "Three Guests", guests: "3", gid: "159841704" },
          { label: "Four Guests", guests: "4", gid: "1756313995" },
        ],
        backupUrl:
          "https://docs.google.com/spreadsheets/d/e/2PACX-1vTg6CL03oAnpadMo1BBki52ZyiskuOxETOzHxhO1dLv_hiv2Jt4Qr8wBQELxiZGa8KaShUl2mjWsSM9/pubhtml?gid=650291518&single=true",
      },
      {
        id: "2027-07-17",
        label: "July 17–24, 2027",
        ship: "Icon of the Seas",
        nights: 7,
        itineraryName: "Eastern Caribbean",
        departurePort: "Miami, Florida",
        destinations: ["St. Maarten", "St. Thomas", "Perfect Day at CocoCay"],
        publishedId:
          "2PACX-1vQxDS4NriPy1Igl2X7zVmDAkeIOYZ2HMgZXVQtR_NK9YB4BZFhA7ZK1KdbxgKl8wn9K9H8qkqq6N9Tw",
        tabs: [
          { label: "Two Guests", guests: "2", gid: "1774284890" },
          { label: "Three Guests", guests: "3", gid: "832346416" },
          { label: "Four Guests", guests: "4", gid: "807433313" },
        ],
        backupUrl:
          "https://docs.google.com/spreadsheets/d/e/2PACX-1vQxDS4NriPy1Igl2X7zVmDAkeIOYZ2HMgZXVQtR_NK9YB4BZFhA7ZK1KdbxgKl8wn9K9H8qkqq6N9Tw/pubhtml?gid=1774284890&single=true",
      },
      {
        id: "2027-07-24",
        label: "July 24–31, 2027",
        ship: "Icon of the Seas",
        nights: 7,
        itineraryName: "Western Caribbean",
        departurePort: "Miami, Florida",
        destinations: ["Costa Maya", "Roatán", "Cozumel", "Perfect Day at CocoCay"],
        publishedId:
          "2PACX-1vQW1yww-pg1EbW0NdkxTEkIGg-qt-ZZe_zGUHSC4AH9yul3tbNOdV4tpzV5R2gh16iHzOumRZVWxgWn",
        tabs: [
          { label: "Two Guests", guests: "2", gid: "1774284890" },
          { label: "Three Guests", guests: "3", gid: "832346416" },
          { label: "Four Guests", guests: "4", gid: "807433313" },
        ],
        backupUrl:
          "https://docs.google.com/spreadsheets/d/e/2PACX-1vQW1yww-pg1EbW0NdkxTEkIGg-qt-ZZe_zGUHSC4AH9yul3tbNOdV4tpzV5R2gh16iHzOumRZVWxgWn/pubhtml?gid=1774284890&single=true",
      },
      {
        id: "2027-08-01",
        label: "August 1–8, 2027",
        ship: "Odyssey of the Seas",
        nights: 7,
        itineraryName: "Eastern Mediterranean",
        departurePort: "Rome, Italy",
        destinations: ["Santorini", "Ephesus", "Mykonos", "Naples"],
        publishedId:
          "2PACX-1vTWkOFoPOlNdfdCi0uhEskduK7XoXq-bNnoZaS-wBFslKxW9uoGF9aCfRBHnOOk9Fhh5bYSKwCAyy1k",
        tabs: [
          { label: "Two Guests", guests: "2", gid: "1386768225" },
          { label: "Three Guests", guests: "3", gid: "748526258" },
          { label: "Four Guests", guests: "4", gid: "141211820" },
        ],
        backupUrl:
          "https://docs.google.com/spreadsheets/d/e/2PACX-1vTWkOFoPOlNdfdCi0uhEskduK7XoXq-bNnoZaS-wBFslKxW9uoGF9aCfRBHnOOk9Fhh5bYSKwCAyy1k/pubhtml?gid=1386768225&single=true",
      },
    ],
  },

  // The existing Happy Holidays Travel reservation form.
  reservationFormUrl: "https://hht-booking.netlify.app/",

  // The existing Happy Holidays Travel deposit-payment link.
  depositPaymentUrl: "https://hhtcruises.net/deposit.php",

  // ------------------------------------------------------------------
  // DEPOSIT
  // ------------------------------------------------------------------
  deposit: {
    amount: "$100",
    policy:
      "A $100 nonrefundable deposit per person is required to begin the reservation process.",
  },

  // ------------------------------------------------------------------
  // GIFT REGISTRY (optional)
  // Link to the family's page on the HHT Quince Gift Registry, e.g.
  //   https://quinces-registry.netlify.app/r/sofia
  // Set enabled: false to hide this section completely.
  // ------------------------------------------------------------------
  registry: {
    enabled: true,
    url: "https://quinces-registry.netlify.app/r/your-registry-slug",
    heading: "", // Leave "" to auto-generate "Sofia's Gift Registry".
    description:
      "Prefer to give a gift? Visit the gift registry to contribute toward the celebration — every gift, big or small, means the world to us.",
    buttonLabel: "VIEW THE GIFT REGISTRY",
  },

  // ------------------------------------------------------------------
  // ASSIGNED HHT AGENT
  // ------------------------------------------------------------------
  agent: {
    name: "Your HHT Agent",
    phoneDial: "13052674004", // digits only, with country code — used for the call button
    phoneDisplay: "(305) 267-4004",
    // Replace the number after wa.me/ with the agent's WhatsApp number.
    whatsappUrl: "https://wa.me/13052674004",
    email: "info@hhtcruises.com",
    photo: "", // Optional: "/images/agent.jpg" — leave "" for no photo.
  },

  // ------------------------------------------------------------------
  // HAPPY HOLIDAYS TRAVEL OFFICE
  // ------------------------------------------------------------------
  office: {
    name: "Happy Holidays Travel",
    addressLine1: "8160 Coral Way",
    addressLine2: "Miami, Florida 33155",
    phoneDisplay: "305-267-4004",
    phoneDial: "13052674004",
    website: "hhtcruises.com",
    websiteUrl: "https://hhtcruises.com",
  },

  // ------------------------------------------------------------------
  // GUEST INTEREST FORM (lead capture via Netlify Forms)
  // ------------------------------------------------------------------
  leadForm: {
    enabled: true,
    heading: "Interested in Joining Us?",
    description:
      "Share your information below and a Happy Holidays Travel agent will contact you with cabin availability, current pricing and the next steps.",
    // ⚠ Must match the hidden form's name="" in index.html exactly.
    formName: "quince-cruise-interest",
    // "{name}" is replaced automatically with the quinceañera's name.
    successMessage:
      "Thank you! A Happy Holidays Travel agent will contact you soon with more information about joining {name}'s cruise.",
  },

  // ------------------------------------------------------------------
  // SOCIAL SHARING (browser tab title + share previews)
  // ⚠ WhatsApp/Facebook previews read index.html directly — after
  //   editing these, copy the same title/description/image into the
  //   <meta> tags at the top of index.html.
  // ------------------------------------------------------------------
  social: {
    title: "Celebrate Sofia’s Quinceañera Cruise | Icon of the Seas",
    description:
      "Join Sofia, her family and friends aboard Icon of the Seas July 17–24, 2027. View cruise details, pricing and reservation information.",
    image: "/images/social-share.jpg",
  },
};
