// Ship Visit registration — the one endpoint the form posts to.
//
// Same shape as quince-registration.js:
//   1. Save into Supabase (the record of truth, and where the capacity check
//      lives — it has to be there so two families cannot take the last spot).
//   2. Mirror into the Google Sheet (a convenience copy for the office).
//
// The sheet write is best-effort and never fails the family: a broken webhook
// must not cost us a registration. If Supabase refuses — usually because the
// visit filled up — that IS returned, because nothing was saved.
//
// The sheet secret lives here rather than in the page, because anything in the
// bundle is public and would let strangers append rows.

const SUPABASE_URL = "https://jpgwcfswnfytyqzklrba.supabase.co";
const SUPABASE_KEY = "sb_publishable_122S5BZIb5_yjD2ofGDuuA_nDeB7fuZ";

/** One sheet row per PERSON, not per submission — the port wants a name list. */
function sheetRows(d, visit) {
  const stamp = new Date().toISOString();
  const common = {
    Timestamp: stamp,
    "Ship Visit Date": visit ? visit.visit_date : "",
    "Ship Visit Time": visit ? visit.visit_time || "" : "",
    Ship: visit ? visit.ship || "" : "",
    "Sail Date": d.sail_date || "",
    "Cell Phone": d.cell_phone || "",
    Agent: d.agent || "",
    Notes: d.notes || "",
  };
  const people = [
    ["Quinceañera", d.quince_first, d.quince_last, d.quince_dob, d.quince_email, d.quince_id_type, d.quince_id_number],
    ["Guest #1", d.guest1_first, d.guest1_last, d.guest1_dob, d.guest1_email, d.guest1_id_type, d.guest1_id_number],
    ["Guest #2", d.guest2_first, d.guest2_last, d.guest2_dob, d.guest2_email, d.guest2_id_type, d.guest2_id_number],
  ];
  return people
    .filter(([, first]) => (first || "").trim())
    .map(([who, first, last, dob, email, idType, idNum]) => ({
      ...common,
      Attendee: who,
      "First Name": first || "",
      "Last Name": last || "",
      "Date of Birth": dob || "",
      Email: email || "",
      "Type of ID": idType || "",
      "ID #": idNum || "",
    }));
}

async function mirrorToSheet(rows) {
  const url = process.env.GSHEET_SHIPVISITS_URL;
  if (!url) return { ok: false, skipped: "GSHEET_SHIPVISITS_URL not set" };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: process.env.GSHEET_SHIPVISITS_SECRET || "",
        rows,
      }),
    });
    return { ok: res.ok };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// Matches quince-registration.js's handler style deliberately — one folder,
// one convention, and this one is known to deploy correctly here.
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
  if (!data.visit_id || !data.quince_first || !data.quince_last) {
    return {
      statusCode: 400,
      headers: cors,
      body: JSON.stringify({ ok: false, error: "Please fill in the quinceañera's name and pick a visit date." }),
    };
  }

  const saved = await fetch(`${SUPABASE_URL}/rest/v1/rpc/submit_ship_visit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({ p_data: data }),
  });

  if (!saved.ok) {
    console.error("Ship visit save failed:", saved.status, await saved.text());
    return { statusCode: 502, headers: cors, body: JSON.stringify({ ok: false, error: "save_failed" }) };
  }

  const result = await saved.json();
  if (!result || result.ok === false) {
    // A full visit is a real answer, not a failure — 400 so the browser shows
    // the message instead of falling back and trying again.
    return { statusCode: 400, headers: cors, body: JSON.stringify(result || { ok: false }) };
  }

  // Look the visit up for the sheet's date/ship columns. Best-effort only:
  // the registration is saved and must not be undone over a sheet detail.
  let visit = null;
  try {
    const vres = await fetch(`${SUPABASE_URL}/rest/v1/rpc/list_ship_visits`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: "{}",
    });
    if (vres.ok) {
      const all = await vres.json();
      visit = (all || []).find((v) => v.id === data.visit_id) || null;
    }
  } catch (err) {
    console.error("Ship visit lookup for sheet failed:", err);
  }

  const sheet = await mirrorToSheet(sheetRows(data, visit));
  return { statusCode: 200, headers: cors, body: JSON.stringify({ ...result, sheet }) };
};
