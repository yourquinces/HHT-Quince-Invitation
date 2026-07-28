// Submits inquiries from /quince-cruises into the EXISTING quince_leads
// pipeline, so cold email traffic lands in the same place as leads from
// the quote form and the agent phone intake.
//
// That pipeline lives in the separate HHT-Quinces-Leads site. Its function
// (netlify/functions/quince-request.js) fans out to Supabase quince_leads,
// GoHighLevel, the agent notification email, and the backup Google Sheet.
// It already sends `Access-Control-Allow-Origin: *`, so posting to it
// cross-origin from this site works without any change over there.
//
// ⚠️ Confirm ENDPOINT below matches the deployed leads site before going
// live. Override per-environment with VITE_QUINCE_LEADS_ENDPOINT in
// Netlify → Site settings → Environment variables.

const DEFAULT_ENDPOINT =
  "https://hht-quinces-leads.netlify.app/.netlify/functions/quince-request";

export const ENDPOINT: string =
  import.meta.env.VITE_QUINCE_LEADS_ENDPOINT || DEFAULT_ENDPOINT;

/** Field names must match what quince-request.js reads — see saveToSupabase. */
export interface QuinceLeadPayload {
  quince_first?: string;
  quince_last?: string;
  parent_first: string;
  parent_last?: string;
  parent_email: string;
  parent_phone?: string;
  language?: string;
  travel_year?: string;
  /** Ship / cruise names, stored as a text[] column. */
  interest?: string[];
  heard_about?: string;
  client_notes?: string;
  /** Distinguishes this page from the quote form in reporting. */
  source?: string;
  source_url?: string;
  lead_type?: string;
}

/** Posts one lead. Throws on network failure or a non-ok response. */
export async function submitQuinceLead(payload: QuinceLeadPayload): Promise<void> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lead_type: "Web Form",
      source: "quince-cruises-page",
      ...payload,
    }),
  });

  if (!res.ok) throw new Error(`Lead submission failed (${res.status})`);

  // The function returns 200 with { ok: true } once the lead is captured;
  // downstream steps are best-effort on its side and never fail the visitor.
  const body = await res.json().catch(() => ({}) as { ok?: boolean });
  if (body && body.ok === false) throw new Error("Lead submission rejected");
}
