// ====================================================================
//  HHT 2027 QUINCEAÑERA SAILING CATALOG — SHARED, NOT PER-FAMILY
// ====================================================================
//  This file is shared infrastructure. It is read by BOTH:
//
//    /pricing         — the pricing page linked from each invitation
//    /quince-cruises  — the public marketing page for email leads
//
//  It deliberately does NOT live in invitation.ts, because that file is
//  rewritten for every new family. Editing one family's invitation must
//  never change the sailing list for everyone.
//
//  ── WHAT LIVES WHERE ───────────────────────────────────────────────
//  The RATES are not in this file. They live in the published Google
//  Sheets referenced below — one workbook per sailing, one tab per
//  occupancy. Edit a price in the sheet and both pages show it on the
//  next page load, with no redeploy.
//
//  This file only records WHICH sailings exist and WHERE their sheet
//  lives. Changing it does require a redeploy.
//
//  ── ADDING A SAILING ───────────────────────────────────────────────
//  1. Publish the sailing's workbook to the web (File → Share →
//     Publish to web → Entire document → CSV).
//  2. publishedId is the long id after /d/e/ in the published URL.
//  3. Each tab's gid appears in the URL when you click that tab.
//  4. Set region: "Mediterranean" for Europe sailings — they get the
//     featured treatment on /quince-cruises instead of the picker.
//
//  ── RETIRING A SAILING ─────────────────────────────────────────────
//  Set active: false. It disappears from /quince-cruises but existing
//  invitation links (/pricing?sailing=…) keep working, so a family
//  already booked on it never loses their pricing page.
// ====================================================================

import type { PricingSailing } from "../types/invitation";

/** Sailing shown when a link doesn't specify one (?sailing=...). */
export const defaultSailingId = "2027-07-17";

export const sailings: PricingSailing[] = [
  {
    id: "2027-06-19",
    label: "June 19–26, 2027",
    ship: "Icon of the Seas",
    nights: 7,
    itineraryName: "Eastern Caribbean",
    departurePort: "Miami, Florida",
    destinations: ["St. Maarten", "St. Thomas", "Perfect Day at CocoCay"],
    region: "Caribbean",
    active: true,
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
    region: "Caribbean",
    active: true,
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
    region: "Caribbean",
    active: true,
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
    region: "Caribbean",
    active: true,
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
    region: "Caribbean",
    active: true,
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
    region: "Mediterranean",
    active: true,
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
];

/** The shape invitation.ts re-exports, so nothing downstream had to change. */
export const pricingSheet = { defaultSailingId, sailings };

// ── MERCHANDISING PRIORITY (drives /quince-cruises) ──────────────────
// Which ship gets which treatment on the marketing page. Change these two
// values to re-rank the page — no component edits needed.
//
//   FEATURED_SHIP  → the big royal-and-gold hero panel
//   SECONDARY_SHIP → the supporting callout below it
//
// Everything else stays in the pricing picker. Mediterranean sailings are
// handled separately (see mediterraneanSailings) and sit near the bottom
// as a limited-availability mention rather than a promotional push.
export const FEATURED_SHIP = "Icon of the Seas";
export const SECONDARY_SHIP = "Allure of the Seas";

// ── SHIP PHOTOS ──────────────────────────────────────────────────────
// The cruise-details photo on a live /i/<slug> page follows the ship on
// the reservation. Add a file to public/images and a line here to give a
// ship its own photo; anything missing keeps the illustrated placeholder.
export const SHIP_PHOTOS: Record<string, string> = {
  "Allure of the Seas": "/images/allure.jpg",
};

/** The cruise-details photo for a ship, or null when we have no photo. */
export function shipPhoto(ship: string): string | null {
  return SHIP_PHOTOS[ship] ?? null;
}

const isActive = (s: PricingSailing) => s.active !== false;
const regionOf = (s: PricingSailing) => s.region ?? "Caribbean";

/** Sailings on sale right now — what /quince-cruises shows. */
export function activeSailings(): PricingSailing[] {
  return sailings.filter(isActive);
}

/** Active Caribbean sailings — these fill the sailing picker. */
export function caribbeanSailings(): PricingSailing[] {
  return sailings.filter((s) => isActive(s) && regionOf(s) === "Caribbean");
}

/** Active Mediterranean sailings — featured separately, above the picker. */
export function mediterraneanSailings(): PricingSailing[] {
  return sailings.filter((s) => isActive(s) && regionOf(s) === "Mediterranean");
}

/** Active sailings on one ship, in catalog order. */
export function activeSailingsByShip(ship: string): PricingSailing[] {
  return sailings.filter((s) => isActive(s) && s.ship === ship);
}

/** Looks up a sailing by ISO sail date, active or not, so old invitation
 *  links keep resolving after a sailing is retired. */
export function sailingById(id: string | null): PricingSailing | undefined {
  return id ? sailings.find((s) => s.id === id) : undefined;
}
