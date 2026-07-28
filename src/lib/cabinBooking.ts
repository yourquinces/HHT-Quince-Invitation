// Translates a cabin row from the pricing sheet into the vocabulary the
// HHT booking form uses (HHT-Booking/index.html), so a "Reserve this cabin"
// link can carry the visitor's choice across.
//
// ⚠️ The booking form does NOT read query parameters yet — it has no
// URLSearchParams handling, and its sail_date select is populated by JS
// only after a ship is chosen. These params are therefore inert today:
// harmless, ignored, and ready the moment that form learns to read them.
// Until then the link simply opens the form at step one.

import type { Cabin } from "./pricingSheet";
import type { PricingSailing } from "../types/invitation";

/** Ship names → the codes in the booking form's <select name="ship">. */
const SHIP_CODES: Record<string, string> = {
  "Icon of the Seas": "ICON",
  "Allure of the Seas": "ALLURE",
  "Odyssey of the Seas": "ODYSSEY",
};

/** Guests per cabin → <select name="occupancy"> values. */
const OCCUPANCY: Record<string, string> = {
  "1": "Single",
  "2": "Double",
  "3": "Triple",
  "4": "Quad",
};

/** Sheet cabin names → <select name="cabin_type"> values.
 *  Order matters: "Ocean View Balcony" must match balcony before ocean
 *  view, and "Junior Suite" before the generic suite.
 *
 *  Note "window" is deliberately NOT treated as ocean view. Promenade
 *  Window and Central Park View Window face inward — they have a window
 *  but no ocean — so they fall through to OTHER rather than being filed
 *  as something they are not. The exact sheet name always rides along in
 *  cabin_label, so nothing is lost by being honest here. */
const CABIN_TYPE_RULES: Array<[RegExp, string]> = [
  [/junior\s*suite/i, "JUNIOR SUITE"],
  [/balcon/i, "OCEAN VIEW BALCONY"],
  [/suite/i, "GRAND SUITE"],
  [/ocean\s*view|oceanview/i, "OCEAN VIEW"],
  [/interior|inside/i, "INTERIOR"],
];

export function shipCode(ship: string): string {
  return SHIP_CODES[ship] ?? "";
}

/** Best-effort mapping; falls back to OTHER so nothing is mis-filed. */
export function cabinTypeCode(cabin: Cabin): string {
  // The section heading is the coarser, more reliable signal, so an
  // "Inside Cabin" row is INTERIOR no matter how the type is worded.
  const haystack = `${cabin.section} ${cabin.type}`;
  if (/interior|inside/i.test(cabin.section)) return "INTERIOR";
  for (const [pattern, code] of CABIN_TYPE_RULES) {
    if (pattern.test(haystack)) return code;
  }
  return "OTHER";
}

/** Human-readable summary used in lead notes and confirmation chips. */
export function cabinSummary(cabin: Cabin, sailing: PricingSailing): string {
  const category = cabin.category ? ` (${cabin.category})` : "";
  return `${cabin.type}${category} — ${sailing.ship}, ${sailing.label}`;
}

/** Appends the visitor's choice to the booking-form URL. */
export function bookingUrlFor(
  baseUrl: string,
  cabin: Cabin,
  sailing: PricingSailing,
  guests: string,
): string {
  if (!baseUrl) return baseUrl;
  const params = new URLSearchParams({
    ship: shipCode(sailing.ship),
    sail_date: sailing.id,
    occupancy: OCCUPANCY[guests] ?? "",
    cabin_type: cabinTypeCode(cabin),
    // The exact sheet row, so an agent reviewing the request can see the
    // precise category even when cabin_type had to be coarsened.
    cabin_category: cabin.category,
    cabin_label: cabin.type,
  });
  for (const [key, value] of Array.from(params.entries())) {
    if (!value) params.delete(key);
  }
  return `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}${params.toString()}`;
}
