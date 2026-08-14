/**
 * Quinceañera Registration Form → Google Sheet
 * ---------------------------------------------------------------------------
 * Mirrors every registration into a spreadsheet so the office can sort, filter
 * and share it without opening Supabase.
 *
 * This is SEPARATE from the leads sheet script in HHT-Quinces-Leads. That one
 * is hardcoded to a "Leads" tab with lead columns; do not point both at the
 * same deployment.
 *
 * SET UP (once, about five minutes)
 * ---------------------------------------------------------------------------
 * 1. Create a Google Sheet, e.g. "HHT Quinceañera Registrations".
 * 2. Extensions → Apps Script. Delete the sample code, paste this file.
 * 3. Change SECRET below to a long random string of your own.
 * 4. Deploy → New deployment → type "Web app".
 *      Execute as:        Me
 *      Who has access:    Anyone
 *    Copy the /exec URL it gives you.
 * 5. In Netlify → HHT-Quince-Invitation → Site configuration → Environment
 *    variables, add:
 *      GSHEET_REGISTRATIONS_URL    = the /exec URL
 *      GSHEET_REGISTRATIONS_SECRET = the same SECRET
 *    then redeploy the site.
 *
 * "Anyone" access is required for the Netlify function to reach it; the SECRET
 * is what stops strangers appending rows.
 */

var SECRET = 'CHANGE-ME-to-a-long-random-string';

// Column order in the sheet. Add a key here and to the Netlify function to
// capture a new question; existing rows keep their columns.
var HEADERS = [
  'Timestamp',
  'First Name',
  'Last Name',
  'Cell Phone',
  'Email',
  'Sail Date',
  'Sit With Another Quinceañera',
  'Who She Wants To Sit With',
  'Instagram',
  'Facebook',
  'TikTok',
  'Snapchat',
  'Favorite Social',
  'Uses WhatsApp',
  'High School',
  'Graduation Year',
  'On A Team',
  'Team',
  "Parent's Name",
  "Parent's Instagram",
  'Invitation',
];

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents || '{}');
    if (SECRET && body.secret !== SECRET) {
      return json({ ok: false, error: 'bad secret' });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Registrations');
    if (!sheet) sheet = ss.insertSheet('Registrations');

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    var incoming = body.row || {};
    var row = HEADERS.map(function (h) {
      var v = incoming[h];
      return v === undefined || v === null ? '' : v;
    });
    sheet.appendRow(row);

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function doGet() {
  return json({ ok: true, service: 'HHT Quinceañera Registrations sheet sync' });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
