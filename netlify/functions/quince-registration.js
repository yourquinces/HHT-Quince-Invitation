// Quinceañera Registration Form — the one endpoint the form posts to.
//
// Does two things, in this order:
//   1. Saves the registration into Supabase (the record of truth).
//   2. Mirrors it into the Google Sheet (a convenience copy for the office).
//
// The sheet write is best-effort and never fails the girl filling in the form:
// a broken webhook must not cost us her registration. If Supabase fails we do
// return an error, because then nothing was saved and the browser falls back to
// writing directly.
//
// The sheet secret lives here rather than in the page, because anything in the
// bundle is public and would let strangers append rows.

const SUPABASE_URL = "https://jpgwcfswnfytyqzklrba.supabase.co";
const SUPABASE_KEY = "sb_publishable_122S5BZIb5_yjD2ofGDuuA_nDeB7fuZ";

const yesNo = (v) => (v === true ? "Yes" : v === false ? "No" : "");

/** Maps the payload onto the sheet's header names. */
function sheetRow(d) {
  return {
    Timestamp: new Date().toISOString(),
    "First Name": d.first_name || "",
    "Last Name": d.last_name || "",
    "Cell Phone": d.cell_phone || "",
    Email: d.email || "",
    "Sail Date": d.sail_date || "",
    "Sit With Another Quinceañera": yesNo(d.sit_with),
    "Who She Wants To Sit With": d.sit_with_names || "",
    Instagram: d.instagram || "",
    Facebook: d.facebook || "",
    TikTok: d.tiktok || "",
    Snapchat: d.snapchat || "",
    "Favorite Social": d.favorite_social || "",
    "Uses WhatsApp": yesNo(d.uses_whatsapp),
    "High School": d.high_school || "",
    "Graduation Year": d.graduation_year || "",
    "On A Team": yesNo(d.on_team),
    Team: d.team_name || "",
    "Parent's Name": d.parent_name || "",
    "Parent's Instagram": d.parent_instagram || "",
    Invitation: d.invitation_slug || "",
  };
}

async function appendToSheet(data) {
  const url = process.env.GSHEET_REGISTRATIONS_URL;
  if (!url) return { ok: false, skipped: "GSHEET_REGISTRATIONS_URL not set" };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: process.env.GSHEET_REGISTRATIONS_SECRET || "",
        row: sheetRow(data),
      }),
    });
    if (!res.ok) {
      console.error("Registration sheet append failed:", res.status, await res.text());
      return { ok: false, status: res.status };
    }
    return { ok: true };
  } catch (err) {
    console.error("Registration sheet append threw:", err);
    return { ok: false, error: String(err) };
  }
}

export const handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: cors, body: "" };
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: cors, body: JSON.stringify({ ok: false }) };
  }

  let data;
  try {
    data = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ ok: false, error: "bad json" }) };
  }
  if (!data.first_name || !data.last_name || !data.sail_date) {
    return {
      statusCode: 400,
      headers: cors,
      body: JSON.stringify({ ok: false, error: "missing_fields" }),
    };
  }

  const saved = await fetch(`${SUPABASE_URL}/rest/v1/rpc/submit_quince_registration`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({ p_data: data }),
  });

  if (!saved.ok) {
    const text = await saved.text();
    console.error("Registration save failed:", saved.status, text);
    return {
      statusCode: 502,
      headers: cors,
      body: JSON.stringify({ ok: false, error: "save_failed" }),
    };
  }

  const sheet = await appendToSheet(data);
  return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, sheet }) };
};
