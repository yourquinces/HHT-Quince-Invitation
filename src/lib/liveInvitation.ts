// Live invitations: pages at /i/<slug> load their content from the
// `invitations` table in the HHT Supabase project (the same database
// HHT-QRS uses). HHT-QRS inserts a row when an agent approves a
// quinceañera cabin, so new invitation pages appear instantly with
// no redeploy.
//
// The publishable key below is safe to ship in the browser — row-level
// security only exposes rows with status = 'active'.

import { invitation } from "../data/invitation";
import { SUPABASE_KEY, SUPABASE_URL } from "./supabase";

export interface InvitationRow {
  slug: string;
  quinceanera_name: string;
  preferred_name: string;
  group_name: string | null;
  family_message: string | null;
  signature: string | null;
  hero_image_url: string | null;
  image_position: string | null;
  registry_url: string | null;
  starting_price: string | null;
  ship: string | null;
  sailing_dates: string | null;
  /** ISO sail date from QRS — matches pricingSheet.sailings ids. */
  sail_date?: string | null;
  agent_name: string | null;
  agent_phone: string | null;
  agent_whatsapp: string | null;
  agent_email: string | null;
}

/** Returns the /i/<slug> slug for the current URL, or null. */
export function liveSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/i\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}

/** Returns the slug for a family edit URL (/i/<slug>/edit), or null. */
export function editSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/i\/([^/]+)\/edit\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}

export interface FamilyEditFields {
  family_message: string;
  signature: string;
  hero_image_url: string;
  image_position: string;
  registry_url: string;
}

/**
 * Saves the family-editable fields via the update_invitation_by_key
 * function, which validates the secret edit key server-side.
 * Returns false when the key doesn't match.
 */
export async function updateInvitationByKey(
  slug: string,
  key: string,
  fields: FamilyEditFields,
): Promise<boolean> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/update_invitation_by_key`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_slug: slug,
      p_key: key,
      p_family_message: fields.family_message,
      p_signature: fields.signature,
      p_hero_image_url: fields.hero_image_url,
      p_image_position: fields.image_position,
      p_registry_url: fields.registry_url,
    }),
  });
  if (!res.ok) throw new Error(`Save failed (${res.status})`);
  return (await res.json()) === true;
}

/** Uploads a family photo to the public bucket; returns its public URL. */
export async function uploadInvitationPhoto(slug: string, file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const name = `inv-${slug}-${Date.now()}.${ext}`;
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/invitation-photos/${encodeURIComponent(name)}`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": file.type || "image/jpeg",
      },
      body: file,
    },
  );
  if (!res.ok) throw new Error(`Photo upload failed (${res.status})`);
  return `${SUPABASE_URL}/storage/v1/object/public/invitation-photos/${encodeURIComponent(name)}`;
}

/** Fetches one active invitation row by slug. Null when none exists. */
export async function fetchInvitationRow(slug: string): Promise<InvitationRow | null> {
  const url =
    `${SUPABASE_URL}/rest/v1/invitations` +
    `?slug=eq.${encodeURIComponent(slug)}&status=eq.active&limit=1`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Invitation lookup failed (${res.status})`);
  const rows: InvitationRow[] = await res.json();
  return rows[0] ?? null;
}

/**
 * Overlays a database row onto the static config. Null/empty fields keep
 * the built-in defaults, so a freshly created row renders a complete page.
 * Must be called before the page components render (they read `invitation`).
 */
export function applyInvitationRow(row: InvitationRow): void {
  const name = row.preferred_name || row.quinceanera_name;

  invitation.quinceanera.fullName = row.quinceanera_name;
  invitation.quinceanera.preferredName = name;
  invitation.groupName = row.group_name || `${name}'s Quinceañera Cruise Group`;

  if (row.family_message) invitation.invitationMessage = row.family_message;
  invitation.invitationSignature = row.signature ?? "";
  if (row.hero_image_url) {
    invitation.hero.image = row.hero_image_url;
    invitation.hero.imageAlt = `${name}'s quinceañera cruise invitation`;
  }
  if (row.image_position) invitation.hero.imagePosition = row.image_position;

  if (row.registry_url) {
    invitation.registry.enabled = true;
    invitation.registry.url = row.registry_url;
    invitation.registry.heading = "";
  } else {
    invitation.registry.enabled = false;
  }

  if (row.starting_price) invitation.pricing.startingPricePerPerson = row.starting_price;
  if (row.ship) invitation.cruise.ship = row.ship;
  if (row.sailing_dates) invitation.cruise.sailingDates = row.sailing_dates;

  // When the reservation's sail date matches a configured sailing, the
  // whole page follows that sailing: cruise details and pricing links.
  const sailing = invitation.pricingSheet.sailings.find((s) => s.id === row.sail_date);
  if (sailing) {
    if (!row.ship) invitation.cruise.ship = sailing.ship;
    if (!row.sailing_dates) invitation.cruise.sailingDates = sailing.label;
    invitation.cruise.nights = sailing.nights;
    invitation.cruise.itineraryName = sailing.itineraryName;
    invitation.cruise.departurePort = sailing.departurePort;
    invitation.cruise.destinations = sailing.destinations;
    invitation.pricing.fullPricingUrl = `/pricing?sailing=${sailing.id}`;
    const GUEST_WORDS: Record<string, string> = { "2": "Two", "3": "Three", "4": "Four" };
    invitation.pricing.occupancyLinks = sailing.tabs
      .filter((t) => GUEST_WORDS[t.guests])
      .map((t) => ({
        label: `${GUEST_WORDS[t.guests]} Guests Per Cabin`,
        url: `/pricing?sailing=${sailing.id}&guests=${t.guests}`,
      }));
  }

  if (row.agent_name) invitation.agent.name = row.agent_name;
  if (row.agent_phone) {
    invitation.agent.phoneDisplay = row.agent_phone;
    invitation.agent.phoneDial = row.agent_phone.replace(/\D/g, "").replace(/^(?!1)/, "1");
  }
  if (row.agent_whatsapp) invitation.agent.whatsappUrl = row.agent_whatsapp;
  if (row.agent_email) invitation.agent.email = row.agent_email;

  invitation.social.title = `Celebrate ${name}'s Quinceañera Cruise | ${invitation.cruise.ship}`;
  invitation.social.description =
    `Join ${name}, her family and friends aboard ${invitation.cruise.ship} ` +
    `${invitation.cruise.sailingDates}. View cruise details, pricing and reservation information.`;
}
