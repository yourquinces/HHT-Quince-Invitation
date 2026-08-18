/**
 * Ship Visit Registration → Google Sheet
 * ---------------------------------------------------------------------------
 * Mirrors every ship visit registration into a spreadsheet, ONE ROW PER PERSON,
 * because what the port asks for is a list of names with dates of birth and ID
 * numbers — not a list of families.
 *
 * This is SEPARATE from the registrations script (google-apps-script.gs) and
 * from the leads script in HHT-Quinces-Leads. Each needs its own deployment;
 * do not point two of them at the same URL.
 *
 * SET UP (once, about five minutes)
 * ---------------------------------------------------------------------------
 * 1. Create a Google Sheet, e.g. "HHT Ship Visits".
 * 2. Extensions → Apps Script. Delete the sample code, paste this file.
 * 3. Change SECRET below to a long random string of your own.
 * 4. Deploy → New deployment → type "Web app".
 *      Execute as:        Me
 *      Who has access:    Anyone
 *    Copy the /exec URL it gives you.
 * 5. In Netlify → HHT-Quince-Invitation → Site configuration → Environment
 *    variables, add:
 *      GSHEET_SHIPVISITS_URL    = the /exec URL
 *      GSHEET_SHIPVISITS_SECRET = the same SECRET
 *    then redeploy the site.
 *
 * Until step 5 is done the form still works — registrations save to the
 * database and show on the staff page; only the sheet copy is skipped.
 *
 * "Anyone" access is required for the Netlify function to reach it; the SECRET
 * is what stops strangers appending rows.
 */

var SECRET = 'CHANGE-ME-to-a-long-random-string';

// Column order in the sheet. Add a key here and to the Netlify function to
// capture something new; existing rows keep their columns.
var HEADERS = [
  'Timestamp',
  'Ship Visit Date',
  'Ship Visit Time',
  'Ship',
  'Quinceañera Group',
  'Attendee',
  'First Name',
  'Last Name',
  'Date of Birth',
  'Type of ID',
  'ID #',
  'Email',
  'Cell Phone',
  'Sail Date',
  'Agent',
  'Notes',
];

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents || '{}');
    if (SECRET && body.secret !== SECRET) {
      return json({ ok: false, error: 'bad secret' });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Ship Visits');
    if (!sheet) sheet = ss.insertSheet('Ship Visits');

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    // One submission arrives as several people. Written in a single call so a
    // family's names always land together, in order.
    var incoming = body.rows || [];
    if (!incoming.length) return json({ ok: true, rows: 0 });

    var values = incoming.map(function (person) {
      return HEADERS.map(function (h) {
        var v = person[h];
        return v === undefined || v === null ? '' : v;
      });
    });
    sheet.getRange(sheet.getLastRow() + 1, 1, values.length, HEADERS.length).setValues(values);

    return json({ ok: true, rows: values.length });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function doGet() {
  return json({ ok: true, service: 'HHT Ship Visits sheet sync' });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
