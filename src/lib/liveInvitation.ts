// Live invitations: pages at /i/<slug> load their content from the
// `invitations` table in the HHT Supabase project (the same database
// HHT-QRS uses). HHT-QRS inserts a row when an agent approves a
// quinceañera cabin, so new invitation pages appear instantly with
// no redeploy.
//
// The publishable key below is safe to ship in the browser — row-level
// security only exposes rows with status = 'active'.

import { invitation } from "../data/invitation";
import { shipPhotos } from "../data/sailings";
import { SUPABASE_KEY, SUPABASE_URL } from "./supabase";

export interface InvitationRow {
  slug: string;
  quinceanera_name: string;
  preferred_name: string;
  group_name: string | null;
  family_message: string | null;
  signature: string | null;
  hero_image_url: string | null;
  /** Square avatar for the hub and registration form; null = show the cartoon. */
  profile_image_url?: string | null;
  image_position: string | null;
  registry_url: string | null;
  starting_price: string | null;
  ship: string | null;
  sailing_dates: string | null;
  /** ISO sail date from QRS — matches pricingSheet.sailings ids. */
  sail_date?: string | null;
  /** Neutral address for the group cruise page. See groupCodeFromPath. */
  group_code?: string | null;
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

/** Returns the slug for the friend invitation (/i/<slug>/friends), or null. */
export function friendsSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/i\/([^/]+)\/friends\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Returns the slug for the group cruise invitation (/i/<slug>/cruise), or null.
 *
 * The original address for that page. It still works so links already handed
 * out keep working, but it is not the one to share: the path spells out her
 * name. Use the /c/<code> form below.
 */
export function groupCruiseSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/i\/([^/]+)\/cruise\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Returns the code for a group cruise page at /c/<code>, or null.
 *
 * This is the address to share. A booked relative forwards it to their own
 * friends, and nothing in it — not the path, not a name — says whose cruise
 * it is. (The hostname is the remaining giveaway; see README.)
 */
export function groupCodeFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/c\/([A-Za-z0-9_-]+)\/?$/);
  return match ? match[1] : null;
}

/** Returns the slug for her registration form (/i/<slug>/register), or null. */
export function registerSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/i\/([^/]+)\/register\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}

/** Returns the slug for her guest list (/i/<slug>/guests), or null. */
export function guestsSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/i\/([^/]+)\/guests\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}

/** Returns the slug for her hub (/i/<slug>/hub), or null. */
export function hubSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/i\/([^/]+)\/hub\/?$/);
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

/* The bucket accepts image/jpeg, image/png and image/webp only. Phones report
   all sorts of other things — image/jpg, image/heic, and application/octet-
   stream when the browser cannot tell — and every one of those was rejected,
   surfacing as "something went wrong while saving".

   So rather than widen the bucket (which would let in HEIC files that most
   browsers cannot display), re-encode to JPEG here. The browser has already
   decoded the image to show a preview, so this is cheap, and it shrinks a
   12-megapixel phone photo well under the 5 MB limit as a side effect. */
const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.85;

function decodeImage(file: File): Promise<CanvasImageSource> {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file).catch(() => decodeViaImg(file));
  }
  return decodeViaImg(file);
}

function decodeViaImg(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("could not read that image"));
    };
    img.src = url;
  });
}

/** Re-encodes any image the browser can open into a JPEG blob. */
async function toJpeg(file: File): Promise<Blob> {
  const src = await decodeImage(file);
  const sw = (src as ImageBitmap).width || (src as HTMLImageElement).naturalWidth;
  const sh = (src as ImageBitmap).height || (src as HTMLImageElement).naturalHeight;
  if (!sw || !sh) throw new Error("could not read that image");

  const scale = Math.min(1, MAX_EDGE / Math.max(sw, sh));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sw * scale));
  canvas.height = Math.max(1, Math.round(sh * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("could not read that image");
  ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
  if ("close" in src && typeof (src as ImageBitmap).close === "function") {
    (src as ImageBitmap).close();
  }

  const blob = await new Promise<Blob | null>((r) =>
    canvas.toBlob(r, "image/jpeg", JPEG_QUALITY),
  );
  if (!blob) throw new Error("could not read that image");
  return blob;
}

/** Uploads a family photo to the public bucket; returns its public URL. */
export async function uploadInvitationPhoto(slug: string, file: File): Promise<string> {
  const jpeg = await toJpeg(file);
  const name = `inv-${slug}-${Date.now()}.jpg`;
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/invitation-photos/${encodeURIComponent(name)}`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "image/jpeg",
      },
      body: jpeg,
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

/** Looks a row up by its neutral group code rather than her slug. */
export async function fetchInvitationByGroupCode(code: string): Promise<InvitationRow | null> {
  const url =
    `${SUPABASE_URL}/rest/v1/invitations` +
    `?group_code=eq.${encodeURIComponent(code)}&status=eq.active&limit=1`;
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
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
    // Framing is only meaningful for her own photo. Applying a leftover
    // "center top" to the ship fallback would crop the ship badly.
    if (row.image_position) invitation.hero.imagePosition = row.image_position;
  }

  // registry.enabled in invitation.ts is the master switch — while it is
  // false, a saved registry link stays hidden on every invitation.
  if (row.registry_url && invitation.registry.enabled) {
    invitation.registry.url = row.registry_url;
    invitation.registry.heading = "";
  } else {
    invitation.registry.enabled = false;
  }

  applySailingAndAgent(row);

  // Photos follow whichever ship we ended up with. Her own photo always wins
  // the hero — the ship only fills the card until she uploads one.
  const heroPhotos = shipPhotos(invitation.cruise.ship);
  if (heroPhotos && !row.hero_image_url) {
    invitation.hero.image = heroPhotos.hero;
    invitation.hero.imageAlt = `Aboard ${invitation.cruise.line}'s ${invitation.cruise.ship}`;
  }

  invitation.social.title = `Celebrate ${name}'s Quinceañera Cruise | ${invitation.cruise.ship}`;
  invitation.social.description =
    `Join ${name}, her family and friends aboard ${invitation.cruise.ship} ` +
    `${invitation.cruise.sailingDates}. View cruise details, pricing and reservation information.`;
}

/**
 * The half of a row that is just "which sailing is this, and whose client are
 * they" — ship, dates, itinerary, pricing links, cabin photo, agent.
 *
 * Shared by the quinceañera invitation and the group cruise page, because
 * those two must never drift apart on the facts. Anything that names her
 * stays out of here, which is exactly what makes the neutral page possible.
 */
function applySailingAndAgent(row: InvitationRow): void {
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

  // Photos follow whichever ship we ended up with. Ships without photos
  // keep the illustrated placeholders.
  const photos = shipPhotos(invitation.cruise.ship);
  if (photos) {
    invitation.cruise.shipImage = photos.details;
    invitation.cruise.shipImageAlt =
      photos.detailsAlt ?? `${invitation.cruise.line}'s ${invitation.cruise.ship}`;
  }

  if (row.agent_name) invitation.agent.name = row.agent_name;
  if (row.agent_phone) {
    invitation.agent.phoneDisplay = row.agent_phone;
    invitation.agent.phoneDial = row.agent_phone.replace(/\D/g, "").replace(/^(?!1)/, "1");
  }
  if (row.agent_whatsapp) invitation.agent.whatsappUrl = row.agent_whatsapp;
  if (row.agent_email) invitation.agent.email = row.agent_email;
}

/**
 * Applies a row for the group cruise page — the same sailing, with every
 * trace of the quinceañera removed.
 *
 * The differences from applyInvitationRow are the whole point of the page, so
 * they are deliberate, not incidental:
 *  · the hero is always the ship. Her uploaded photo is a fifteen-year-old in
 *    a gown and would give the game away in one glance.
 *  · the gift registry is off. It is hers.
 *  · nothing sets quinceanera.* or groupName, so any component that reads
 *    them is simply not rendered on this page.
 */
export function applyGroupCruiseRow(row: InvitationRow): void {
  applySailingAndAgent(row);

  const photos = shipPhotos(invitation.cruise.ship);
  if (photos) {
    invitation.hero.image = photos.hero;
    invitation.hero.imageAlt = `Aboard ${invitation.cruise.line}'s ${invitation.cruise.ship}`;
    invitation.hero.imagePosition = "center";
  }

  invitation.registry.enabled = false;

  invitation.social.title =
    `${invitation.cruise.nights}-Night ${invitation.cruise.itineraryName} Cruise | ` +
    `${invitation.cruise.ship}`;
  invitation.social.description =
    `Join our group aboard ${invitation.cruise.ship} ${invitation.cruise.sailingDates}. ` +
    `Group rates, cabin options and payment plans through Happy Holidays Travel.`;
}

/* ── Guest list ──────────────────────────────────────────────────────────────
   Everyone booked under her in the reservation system, read through one
   SECURITY DEFINER function. The secret edit key is what authorises it — the
   same key that unlocks her family editor — because this returns other
   families' names. Nothing else about those tables is reachable from here.
   ──────────────────────────────────────────────────────────────────────────── */

export interface GuestCabin {
  cabin_number: string | null;
  booking_number: string | null;
  category: string | null;
  occupancy: string | null;
  is_quinceanera: boolean;
  guests: {
    first_name: string | null;
    last_name: string | null;
    is_quinceanera: boolean;
    /** Age ON the sail date, not today. Null when no date of birth is on file. */
    age_at_sailing: number | null;
  }[];
}

export interface GuestList {
  quinceanera: string | null;
  ship: string | null;
  sail_date: string | null;
  cabins: GuestCabin[];
}

/** Null when the key does not match — the page treats that as "not authorised". */
export async function fetchQuinceGuests(slug: string, key: string): Promise<GuestList | null> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/list_quince_guests`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_slug: slug, p_key: key }),
  });
  if (!res.ok) throw new Error(`Guest list lookup failed (${res.status})`);
  return (await res.json()) as GuestList | null;
}

/* ── Profile picture ─────────────────────────────────────────────────────────
   A square avatar, kept apart from the invitation's hero photo: different
   shape, different job, and either may be empty. Cropped and shrunk here
   because a 12-megapixel phone photo has no business being a 40-pixel circle.
   ──────────────────────────────────────────────────────────────────────────── */

const AVATAR_PX = 512;

/** Centre-crops to a square and encodes a modest JPEG. */
async function toSquareJpeg(file: File): Promise<Blob> {
  const src = await decodeImage(file);
  const sw = (src as ImageBitmap).width || (src as HTMLImageElement).naturalWidth;
  const sh = (src as ImageBitmap).height || (src as HTMLImageElement).naturalHeight;
  if (!sw || !sh) throw new Error("could not read that image");

  const side = Math.min(sw, sh);
  const sx = Math.round((sw - side) / 2);
  // Faces sit above centre far more often than below, so a portrait is cropped
  // from a third of the way down rather than the middle — otherwise chins go
  // missing.
  const sy = sh > sw ? Math.round((sh - side) / 3) : Math.round((sh - side) / 2);

  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_PX;
  canvas.height = AVATAR_PX;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("could not read that image");
  ctx.drawImage(src, sx, sy, side, side, 0, 0, AVATAR_PX, AVATAR_PX);
  if ("close" in src && typeof (src as ImageBitmap).close === "function") {
    (src as ImageBitmap).close();
  }

  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
  if (!blob) throw new Error("could not read that image");
  return blob;
}

/** Uploads the avatar to the same public bucket; returns its URL. */
export async function uploadProfilePhoto(slug: string, file: File): Promise<string> {
  const jpeg = await toSquareJpeg(file);
  const name = `avatar-${slug}-${Date.now()}.jpg`;
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/invitation-photos/${encodeURIComponent(name)}`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "image/jpeg",
      },
      body: jpeg,
    },
  );
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  return `${SUPABASE_URL}/storage/v1/object/public/invitation-photos/${encodeURIComponent(name)}`;
}

/** Saves (or with an empty string, clears) the avatar. False = wrong key. */
export async function setProfilePhoto(slug: string, key: string, url: string): Promise<boolean> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/set_invitation_profile_photo`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_slug: slug, p_key: key, p_url: url }),
  });
  if (!res.ok) throw new Error(`Save failed (${res.status})`);
  return (await res.json()) === true;
}

/* ── Hub checklist ───────────────────────────────────────────────────────────
   Two kinds of item. Registration and the ship visit are EARNED — we can see
   whether she has done them, so they tick themselves and she cannot fake them.
   The rest are hers to tick, because nothing on our side can tell whether she
   joined a WhatsApp group or followed an account.
   ──────────────────────────────────────────────────────────────────────────── */

export interface HubProgress {
  registered: boolean;
  ship_visit: boolean;
  checklist: Record<string, boolean>;
}

export async function fetchHubProgress(slug: string): Promise<HubProgress | null> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/quince_hub_progress`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_slug: slug }),
  });
  if (!res.ok) return null;
  return (await res.json()) as HubProgress | null;
}

/** False when the key does not match. */
export async function setChecklistItem(
  slug: string, key: string, item: string, done: boolean,
): Promise<boolean> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/set_checklist_item`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_slug: slug, p_key: key, p_item: item, p_done: done }),
  });
  if (!res.ok) throw new Error(`Save failed (${res.status})`);
  return (await res.json()) === true;
}
