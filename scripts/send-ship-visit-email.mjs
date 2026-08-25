// Sends the September 26 ship-visit announcement through Resend.
//
//   node scripts/send-ship-visit-email.mjs                      # dry run, file list
//   node scripts/send-ship-visit-email.mjs --from-supabase      # dry run, registered girls
//   node scripts/send-ship-visit-email.mjs --from-supabase --send
//
// WHY A SCRIPT AND NOT A NETLIFY FUNCTION
// This is a one-off campaign, not something the site triggers. Running it
// from a laptop keeps the recipient list off the internet and makes the dry
// run — which is the default — the thing you look at before anything sends.
//
// SAFETY, in the order it matters:
//   1. Dry run is the DEFAULT. Nothing sends without --send.
//   2. Every address is de-duplicated, lower-cased and syntax-checked first.
//   3. One request per recipient, so nobody sees anyone else's address.
//   4. A five-second countdown before the first real send, so a mistyped
//      command can still be killed with Ctrl-C.
//   5. Failures are collected and printed at the end, never swallowed. Rerun
//      with --only-failed to retry just those.
//
// Env: RESEND_API_KEY          required for --send
//      HHT_STAFF_KEY           required for --from-supabase
//      SHIP_VISIT_RECIPIENTS   path to the list, default recipients.txt

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const HTML_FILE = "emails/ship-visit-2026-09-26.html";
const FAILED_FILE = join(root, "scripts/.ship-visit-failed.txt");

const SUBJECT = "🚢✨ Our First Official Quinceañera Cruise Event Is Here!";
const FROM = "Happy Holidays Travel <quinces@hhtcruises.net>";
const REPLY_TO = "info@hhtcruises.com";

// Resend's own unsubscribe only applies to Broadcasts, not to API sends like
// these, so the template carries a *|UNSUB|* token we fill with a mailto and
// mirror into the headers Gmail and Apple Mail turn into a real button.
// Same approach as HHT-Quinces-Leads/netlify/functions/_warm-caller-email.js.
const UNSUB_ADDRESS = "info@hhtcruises.com";
const UNSUB_MAILTO =
  "mailto:" + UNSUB_ADDRESS + "?subject=" + encodeURIComponent("Unsubscribe");

// Resend's default allowance is 2 requests/second. 600ms leaves headroom so a
// long run does not start collecting 429s halfway through.
const GAP_MS = 600;

const SUPABASE_URL = "https://jpgwcfswnfytyqzklrba.supabase.co";
const SUPABASE_KEY = "sb_publishable_122S5BZIb5_yjD2ofGDuuA_nDeB7fuZ";

const args = new Set(process.argv.slice(2));
const SEND = args.has("--send");
const FROM_SUPABASE = args.has("--from-supabase");
const ONLY_FAILED = args.has("--only-failed");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Deliberately loose: it catches typos and stray text, not exotic addresses. */
const looksLikeEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);

/** Accepts "a@b.com", "Name <a@b.com>" and "name,a@b.com" — one per line. */
function parseList(text) {
  const out = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const angle = line.match(/<([^>]+)>/);
    const candidate = angle
      ? angle[1]
      : line.includes(",")
        ? line.split(",").map((p) => p.trim()).find(looksLikeEmail) || ""
        : line;
    const email = candidate.trim().toLowerCase();
    if (looksLikeEmail(email)) out.push(email);
    else console.warn(`  skipped (not an email): ${line.slice(0, 60)}`);
  }
  return out;
}

/** The girls already registered for a 2027 sailing — the natural audience. */
async function fromSupabase() {
  const key = process.env.HHT_STAFF_KEY;
  if (!key) throw new Error("HHT_STAFF_KEY is not set (the /staff/… key).");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/list_quince_registrations`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_key: key }),
  });
  if (!res.ok) throw new Error(`Supabase refused the staff key (${res.status}).`);
  const rows = await res.json();
  console.log(`  ${rows.length} registrations on file`);
  return rows.map((r) => String(r.email || "").trim().toLowerCase()).filter(looksLikeEmail);
}

async function main() {
  const html = readFileSync(join(root, HTML_FILE), "utf8").split("*|UNSUB|*").join(UNSUB_MAILTO);
  if (html.includes("*|UNSUB|*")) throw new Error("unsubscribe token was not replaced");

  console.log(`\nShip-visit announcement — ${SEND ? "LIVE SEND" : "DRY RUN"}\n`);

  let list;
  if (ONLY_FAILED) {
    if (!existsSync(FAILED_FILE)) throw new Error("no .ship-visit-failed.txt to retry");
    console.log("Source: previous failures");
    list = parseList(readFileSync(FAILED_FILE, "utf8"));
  } else if (FROM_SUPABASE) {
    console.log("Source: quince_registrations");
    list = await fromSupabase();
  } else {
    const file = process.env.SHIP_VISIT_RECIPIENTS || join(root, "recipients.txt");
    if (!existsSync(file)) {
      throw new Error(
        `No recipient list at ${file}.\n` +
          `Write one address per line, or pass --from-supabase, or set SHIP_VISIT_RECIPIENTS.`,
      );
    }
    console.log(`Source: ${file}`);
    list = parseList(readFileSync(file, "utf8"));
  }

  const recipients = [...new Set(list)];
  console.log(`\n${recipients.length} unique recipients (${list.length - recipients.length} duplicates removed)`);
  console.log(`Subject: ${SUBJECT}`);
  console.log(`From:    ${FROM}\n`);

  if (!recipients.length) throw new Error("nothing to send to");

  if (!SEND) {
    console.log(recipients.slice(0, 20).map((e) => "  " + e).join("\n"));
    if (recipients.length > 20) console.log(`  … and ${recipients.length - 20} more`);
    console.log(`\nDry run only. Nothing was sent. Add --send to send for real.\n`);
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");

  console.log(`Sending in 5 seconds — Ctrl-C to stop.`);
  for (let i = 5; i > 0; i--) { process.stdout.write(`${i}… `); await sleep(1000); }
  console.log("\n");

  const failed = [];
  let sent = 0;

  for (const [i, to] of recipients.entries()) {
    const label = `[${i + 1}/${recipients.length}] ${to}`;
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: FROM,
          to: [to],
          subject: SUBJECT,
          html,
          reply_to: REPLY_TO,
          headers: {
            "List-Unsubscribe": `<${UNSUB_MAILTO}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        }),
      });
      const text = await res.text();
      if (!res.ok) {
        console.error(`${label} — FAILED ${res.status}: ${text.slice(0, 120)}`);
        failed.push(to);
      } else {
        sent++;
        console.log(`${label} — ok`);
      }
    } catch (e) {
      console.error(`${label} — FAILED: ${e.message}`);
      failed.push(to);
    }
    if (i < recipients.length - 1) await sleep(GAP_MS);
  }

  console.log(`\nSent ${sent} of ${recipients.length}.`);
  if (failed.length) {
    writeFileSync(FAILED_FILE, failed.join("\n") + "\n");
    console.log(`${failed.length} failed. Written to ${FAILED_FILE}`);
    console.log(`Retry with: node scripts/send-ship-visit-email.mjs --only-failed --send`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(`\n${e.message}\n`);
  process.exit(1);
});
