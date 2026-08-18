// Ship Visit registration — see supabase/ship-visits.sql.
//
// Neither table is publicly readable: these rows hold minors' dates of birth
// and ID numbers. Everything here goes through a security-definer function.
// The form posts to the Netlify function so the Google Sheet mirror can happen
// server-side with a secret the browser never sees, and falls back to calling
// Supabase directly if that endpoint is unreachable — a sheet copy is a
// convenience, a lost registration is not.

import { SUPABASE_KEY, SUPABASE_URL } from "./supabase";

export interface ShipVisit {
  id: string;
  visit_date: string;
  visit_time: string | null;
  ship: string | null;
  capacity: number;
  booked: number;
  remaining: number;
}

export interface ShipVisitSubmission {
  visit_id: string;
  /** False when the quinceañera is already registered and this adds guests. */
  registering_quince?: boolean;
  /** Set when opened from her hub; lets her checklist tick this item. */
  invitation_slug?: string;
  quince_first: string;
  quince_last: string;
  quince_dob?: string;
  quince_email?: string;
  quince_id_type?: string;
  quince_id_number?: string;
  sail_date?: string;
  cell_phone?: string;
  guest1_first?: string;
  guest1_last?: string;
  guest1_dob?: string;
  guest1_email?: string;
  guest1_id_type?: string;
  guest1_id_number?: string;
  guest2_first?: string;
  guest2_last?: string;
  guest2_dob?: string;
  guest2_email?: string;
  guest2_id_type?: string;
  guest2_id_number?: string;
  agent?: string;
  notes?: string;
}

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

/** Upcoming visits with spots left. No personal data comes back. */
export async function fetchShipVisits(): Promise<ShipVisit[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/list_ship_visits`, {
    method: "POST",
    headers,
    body: "{}",
  });
  if (!res.ok) throw new Error(`Could not load ship visits (${res.status})`);
  return (await res.json()) as ShipVisit[];
}

export interface SubmitResult {
  ok: boolean;
  error?: string;
  remaining?: number;
}

export async function submitShipVisit(data: ShipVisitSubmission): Promise<SubmitResult> {
  // Preferred path: the Netlify function saves and mirrors to the sheet.
  try {
    const res = await fetch("/.netlify/functions/ship-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) return (await res.json()) as SubmitResult;
    // A 4xx from the function means it reached Supabase and Supabase said no
    // (usually "that visit is full") — pass that through rather than retrying.
    if (res.status >= 400 && res.status < 500) {
      return (await res.json().catch(() => ({ ok: false, error: "Could not save that." }))) as SubmitResult;
    }
  } catch {
    /* function unreachable — fall through to Supabase directly */
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/submit_ship_visit`, {
    method: "POST",
    headers,
    body: JSON.stringify({ p_data: data }),
  });
  if (!res.ok) throw new Error(`Registration failed (${res.status})`);
  return (await res.json()) as SubmitResult;
}

/* ── Staff ─────────────────────────────────────────────────────────────────
   Same shared key as the other /staff pages, checked inside the function.
   ────────────────────────────────────────────────────────────────────────── */

export interface StaffShipVisit extends Omit<ShipVisit, "remaining"> {
  active: boolean;
  notes: string | null;
}

export interface ShipVisitRegistration {
  id: string;
  created_at: string;
  visit_id: string | null;
  quince_first: string | null;
  quince_last: string | null;
  quince_dob: string | null;
  quince_email: string | null;
  quince_id_type: string | null;
  quince_id_number: string | null;
  sail_date: string | null;
  cell_phone: string | null;
  guest1_first: string | null;
  guest1_last: string | null;
  guest1_dob: string | null;
  guest1_email: string | null;
  guest1_id_type: string | null;
  guest1_id_number: string | null;
  guest2_first: string | null;
  guest2_last: string | null;
  guest2_dob: string | null;
  guest2_email: string | null;
  guest2_id_type: string | null;
  guest2_id_number: string | null;
  agent: string | null;
  notes: string | null;
  party_size: number;
  /** False when she was registered separately and this row only adds guests. */
  registering_quince: boolean;
}

export interface StaffShipVisitData {
  visits: StaffShipVisit[];
  registrations: ShipVisitRegistration[];
}

export async function fetchShipVisitsStaff(key: string): Promise<StaffShipVisitData> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/list_ship_visit_registrations`, {
    method: "POST",
    headers,
    body: JSON.stringify({ p_key: key }),
  });
  if (!res.ok) throw new Error("not authorised");
  return (await res.json()) as StaffShipVisitData;
}

export async function saveShipVisit(
  key: string,
  v: {
    id?: string | null;
    visit_date: string;
    visit_time?: string;
    ship?: string;
    capacity: number;
    active: boolean;
    notes?: string;
  },
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/save_ship_visit`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      p_key: key,
      p_id: v.id ?? null,
      p_visit_date: v.visit_date,
      p_visit_time: v.visit_time ?? null,
      p_ship: v.ship ?? null,
      p_capacity: v.capacity,
      p_active: v.active,
      p_notes: v.notes ?? null,
    }),
  });
  if (!res.ok) return { ok: false, error: `Save failed (${res.status})` };
  return (await res.json()) as { ok: boolean; error?: string };
}
