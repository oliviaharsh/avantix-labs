// Avantix Labs enquiry handler (Google Apps Script, bound to the "Avantix Labs enquiries" Sheet).
// The website's form posts here (site.formEndpoint in src/content/content.js). Each enquiry becomes a
// row in the "Enquiries" tab and an email to everyone in TO, with reply-to set to the visitor.
// Deploy: Extensions > Apps Script, paste this file, Deploy > New deployment > Web app,
// "Execute as: Me", "Who has access: Anyone". After editing, use Deploy > Manage deployments > Edit
// > New version, so the URL stays the same.

const TO = ['harshwalia8888@gmail.com', 'parthmsavaliya0315@gmail.com'];
const TAB = 'Enquiries';
const HEADERS = ['Received', 'Name', 'Email', 'Business', 'Needs', 'Budget', 'Timeline', 'Message', 'Status'];

function doPost(e) {
  let d = {};
  try { d = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) { return reply({ ok: false, error: 'bad request' }); }
  if (d.website) return reply({ ok: true }); // hidden field only bots fill in

  const clip = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
  const row = {
    name: clip(d.name, 120),
    email: clip(d.email, 160),
    business: clip(d.business, 160),
    needs: clip([].concat(d.needs || []).join(', '), 300),
    budget: clip(d.budget, 40),
    timeline: clip(d.timeline, 40),
    message: clip(d.message, 4000),
  };
  if (!row.name || !/^\S+@\S+\.\S+$/.test(row.email)) return reply({ ok: false, error: 'name and email required' });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const book = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = book.getSheetByName(TAB) || book.insertSheet(TAB);
    if (sheet.getLastRow() === 0) { sheet.appendRow(HEADERS); sheet.setFrozenRows(1); sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold'); }
    // a leading ' stops spreadsheet formulas being injected through the form
    const safe = (v) => (/^[=+\-@]/.test(v) ? "'" + v : v);
    sheet.appendRow([new Date(), row.name, row.email, row.business, row.needs, row.budget, row.timeline, row.message, 'New'].map((v) => (typeof v === 'string' ? safe(v) : v)));
  } finally {
    lock.releaseLock();
  }

  const subject = 'New enquiry: ' + (row.business || row.name) + (row.needs ? ' – ' + row.needs : '');
  const body = [
    'New enquiry from avantixlabs.in',
    '',
    'Name: ' + row.name,
    'Email: ' + row.email,
    'Business: ' + (row.business || '-'),
    'Needs: ' + (row.needs || '-'),
    'Budget: ' + (row.budget || '-'),
    'Timeline: ' + (row.timeline || '-'),
    '',
    row.message || '(no message)',
    '',
    'Reply to this email to answer them directly. All enquiries: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl(),
  ].join('\n');
  MailApp.sendEmail({ to: TO.join(','), replyTo: row.email, subject: subject, body: body, name: 'Avantix Labs website' });

  return reply({ ok: true });
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Run once from the editor (Run > setup) to grant permissions and create the Enquiries tab.
function setup() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = book.getSheetByName(TAB) || book.insertSheet(TAB, 0);
  if (sheet.getLastRow() === 0) { sheet.appendRow(HEADERS); sheet.setFrozenRows(1); sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold'); }
  Logger.log('Emails left today: ' + MailApp.getRemainingDailyQuota());
}
