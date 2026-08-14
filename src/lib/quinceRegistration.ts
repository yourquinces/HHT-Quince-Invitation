// Quinceañera Registration Form — see supabase/quince-registration.sql.
//
// Writes go through a security-definer RPC because the table is behind RLS
// with no public read: these rows hold minors' phone numbers, schools and
// social handles. The only thing anon can read back is a boolean saying
// whether a given invitation slug has registered, which is what the hub uses
// to move the card down the list.

import { SUPABASE_URL, SUPABASE_KEY } from "./supabase";

export interface QuinceRegistration {
  invitation_slug?: string;
  first_name: string;
  last_name: string;
  cell_phone?: string;
  email?: string;
  sail_date: string;
  sit_with?: boolean;
  sit_with_names?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  snapchat?: string;
  favorite_social?: string;
  uses_whatsapp?: boolean;
  high_school?: string;
  graduation_year?: string;
  on_team?: boolean;
  team_name?: string;
  parent_name?: string;
  parent_instagram?: string;
}

export interface QuinceRegistrationRow extends QuinceRegistration {
  id: string;
  created_at: string;
}

const headers = {
  "Content-Type": "application/json",
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
};

/** Writes straight to Supabase. The fallback path — see below. */
async function saveDirect(data: QuinceRegistration): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/submit_quince_registration`, {
    method: "POST",
    headers,
    body: JSON.stringify({ p_data: data }),
  });
  if (!res.ok) throw new Error(`Registration failed (${res.status})`);
}

/**
 * Saves one registration.
 *
 * Prefers the Netlify function, which writes to Supabase AND mirrors the row
 * into the Google Sheet — the sheet secret has to stay server-side. If that
 * endpoint is unreachable (local dev, a bad deploy) we still write directly to
 * Supabase rather than lose her registration; the sheet copy can be caught up
 * from Supabase later.
 */
export async function submitQuinceRegistration(data: QuinceRegistration): Promise<void> {
  try {
    const res = await fetch("/.netlify/functions/quince-registration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) return;
    // A 502 means Supabase itself rejected it; retrying direct would fail the
    // same way, so only fall back when the function was never reached.
    if (res.status === 404 || res.status >= 500) {
      await saveDirect(data);
      return;
    }
    throw new Error(`Registration failed (${res.status})`);
  } catch (err) {
    if (err instanceof TypeError) {
      await saveDirect(data);
      return;
    }
    throw err;
  }
}

/** Staff view: every registration, newest first. Throws when the key is wrong. */
export async function listQuinceRegistrations(key: string): Promise<QuinceRegistrationRow[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/list_quince_registrations`, {
    method: "POST",
    headers,
    body: JSON.stringify({ p_key: key }),
  });
  if (!res.ok) throw new Error(`Not authorised (${res.status})`);
  return res.json();
}

/** Has this invitation already registered? Never throws — the hub still
 *  renders if Supabase is unreachable, it just shows the card as pending. */
export async function hasRegistered(slug: string): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/quince_registration_exists`, {
      method: "POST",
      headers,
      body: JSON.stringify({ p_slug: slug }),
    });
    if (!res.ok) return false;
    return (await res.json()) === true;
  } catch {
    return false;
  }
}
