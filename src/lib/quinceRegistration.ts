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

const headers = {
  "Content-Type": "application/json",
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
};

/** Saves one registration. Throws when the request fails. */
export async function submitQuinceRegistration(data: QuinceRegistration): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/submit_quince_registration`, {
    method: "POST",
    headers,
    body: JSON.stringify({ p_data: data }),
  });
  if (!res.ok) throw new Error(`Registration failed (${res.status})`);
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
