/** PhotoTrackly landing-page intake. Deploy as a dedicated web app.
 * Script Properties: WEBHOOK_SECRET (32+ random characters).
 * Keep this Sheet private; only the script owner needs edit access.
 * New registrations are saved first, then emailed only to NOTIFICATION_EMAIL.
 * A mail error must never turn a saved registration into a failed submission.
 */
const SHEET_ID = '1Vqoauc6MORXZ8cwlTX7eKHXLfju3zKE-uS7wbwitJkE';
const NOTIFICATION_EMAIL = 'tranvantubk@gmail.com';
const HEADERS = ['Submitted At', 'Intent', 'Name', 'Work Email', 'Company', 'Start Timing', 'Role', 'Monthly Orders', 'Current Tools', 'Manual Bottleneck', 'Source', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'request_id', 'notification_status', 'Country', 'Consent', 'Consent Version', 'request_hash', 'withdrawal_hash'];

function doGet() {
  return jsonResponse({ ok: true, service: 'PhotoTrackly Google Sheets intake', version: 3 });
}
function jsonResponse(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
function safeCell(value) {
  const text = String(value == null ? '' : value).trim();
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}
function validHash(value) { return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value); }
function validateInput(input) {
  const lead = input.lead;
  if (!lead || typeof lead !== 'object' || Array.isArray(lead) || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(lead.requestId || '')) return false;
  if (lead.consent !== true || ['hero', 'footer'].indexOf(lead.source) < 0 || input.consentVersion !== '2026-09-23') return false;
  const limits = { email: 254, company: 160, name: 100, role: 50, country: 50, volume: 50, challenge: 2000 };
  if (Object.keys(limits).some(key => typeof lead[key] !== 'string' || lead[key].length > limits[key] || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(lead[key]))) return false;
  if (!lead.company.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) return false;
  const choices = {
    role: ['Owner / founder', 'Operations / coordinator', 'Photographer', 'Editor / production', 'Other'],
    country: ['United States', 'Australia', 'Other'],
    volume: ['Under 25', '25–99', '100–249', '250–499', '500+', 'Not sure yet']
  };
  return !Object.keys(choices).some(key => lead[key] && choices[key].indexOf(lead[key]) < 0) &&
    validHash(input.requestHash) && validHash(input.withdrawalHash) && validHash(input.ipHash);
}
function leadsSheet() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Leads');
  if (!sheet) throw new Error('Leads tab missing');
  const existing = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  // Refuse to overwrite a renamed or unrelated column, even when the tab exists.
  if (existing.some((value, i) => value && value !== HEADERS[i])) throw new Error('Header mismatch');
  if (existing.some((value, i) => value !== HEADERS[i])) sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  return sheet;
}
function findRow(sheet, column, value) {
  const count = sheet.getLastRow() - 1;
  if (count <= 0) return null;
  return sheet.getRange(2, column, count, 1).createTextFinder(value).matchEntireCell(true).findNext();
}
function doPost(event) {
  let lock;
  let locked = false;
  try {
    const raw = event && event.postData && event.postData.contents;
    if (typeof raw !== 'string' || raw.length > 16384) return jsonResponse({ ok: false, error: 'invalid_request' });
    const input = JSON.parse(raw);
    const secret = PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET');
    if (!secret || secret.length < 32 || !input || typeof input !== 'object' || Array.isArray(input) || input.secret !== secret) return jsonResponse({ ok: false, error: 'unauthorized' });
    if (input.kind === 'lead' ? !validateInput(input) : input.kind !== 'withdraw' || !validHash(input.tokenHash)) return jsonResponse({ ok: false, error: 'invalid_request' });
    lock = LockService.getScriptLock();
    locked = lock.tryLock(3000);
    if (!locked) return jsonResponse({ ok: false, error: 'busy' });
    const sheet = leadsSheet();
    if (input.kind === 'withdraw') {
      const found = findRow(sheet, 22, input.tokenHash);
      if (found) sheet.deleteRow(found.getRow());
      SpreadsheetApp.flush();
      return jsonResponse({ ok: true, removed: true });
    }
    const lead = input.lead;
    const found = findRow(sheet, 16, lead.requestId);
    if (found) {
      if (sheet.getRange(found.getRow(), 21).getValue() !== input.requestHash) return jsonResponse({ ok: false, error: 'idempotency_conflict' });
      return jsonResponse({ ok: true, saved: true, reference: lead.requestId, duplicate: true });
    }
    // Lightweight abuse control only: Google's cache can evict early. Configure
    // Vercel Firewall for stricter rate limits; no database is needed here.
    const cache = CacheService.getScriptCache();
    const rateKey = 'pt:' + Math.floor(Date.now() / 3600000) + ':' + input.ipHash;
    const hits = Number(cache.get(rateKey) || 0);
    if (hits >= 8) return jsonResponse({ ok: false, error: 'rate_limit' });
    cache.put(rateKey, String(hits + 1), 3600);
    const submittedAt = new Date().toISOString();
    sheet.appendRow([
      submittedAt, 'early-access', safeCell(lead.name), safeCell(lead.email),
      safeCell(lead.company), '', safeCell(lead.role), safeCell(lead.volume), '', safeCell(lead.challenge),
      'phototrackly-landing:' + lead.source, '', '', '', '', lead.requestId, 'pending',
      safeCell(lead.country), 'yes', input.consentVersion, input.requestHash, input.withdrawalHash
    ]);
    SpreadsheetApp.flush();
    // Keep the lock through the one notification attempt: duplicate requests cannot
    // resend it, and another receiver execution cannot move/delete this row mid-send.
    // The lead is already saved; all mail/status failures are isolated below.
    notifyOwner(sheet, lead, submittedAt);
    return jsonResponse({ ok: true, saved: true, reference: lead.requestId });
  } catch {
    console.error('PhotoTrackly intake failed; no success response issued.');
    return jsonResponse({ ok: false, error: 'intake_failed' });
  } finally {
    if (locked) lock.releaseLock();
  }
}

/** Send only to the owner's fixed address, never to an address in the form. */
function ownerMessage(lead, submittedAt) {
  const sheetUrl = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/edit#gid=840735356';
  const details = [
    ['Submitted at (UTC)', submittedAt], ['Name', lead.name],
    ['Work email', lead.email], ['Company', lead.company], ['Role', lead.role],
    ['Country', lead.country], ['Approximate monthly jobs', lead.volume],
    ['Biggest workflow challenge', lead.challenge],
    ['Form', lead.source === 'hero' ? 'Hero signup' : 'Final signup'],
    ['Contact consent', 'Yes'], ['Registration reference', lead.requestId]
  ];
  const message = {
    to: NOTIFICATION_EMAIL,
    name: 'PhotoTrackly',
    // Form values may contain newlines; never allow them into a mail header.
    subject: '[PhotoTrackly] New early-access lead: ' + String(lead.company).replace(/[\r\n\t]/g, ' ').slice(0, 120),
    body: 'A new early-access registration has been saved in your Google Sheet.\n\n' +
      details.map(item => item[0] + ': ' + (item[1] || 'Not provided')).join('\n') +
      '\n\nOpen the lead sheet:\n' + sheetUrl +
      '\n\nThis notification is for the PhotoTrackly owner. No automatic email was sent to the visitor.'
  };
  // Reply goes to one validated mailbox. Unusual addresses are shown in the body
  // but never used as Reply-To; submitted fields cannot add recipients or headers.
  if (/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(lead.email)) message.replyTo = lead.email;
  return message;
}

function notifyOwner(sheet, lead, submittedAt) {
  let status = 'pending';
  try {
    if (MailApp.getRemainingDailyQuota() < 1) {
      status = 'quota-exceeded';
    } else {
      MailApp.sendEmail(ownerMessage(lead, submittedAt));
      // "sent" means MailApp accepted the send; it is not an inbox delivery receipt.
      status = 'sent';
    }
  } catch {
    status = 'failed';
    console.error('PhotoTrackly owner notification not confirmed; the lead remains saved.');
  }
  try {
    // Locate by stable request ID rather than a row number that an operator may sort.
    const found = findRow(sheet, 16, lead.requestId);
    if (found) {
      sheet.getRange(found.getRow(), 17).setValue(status);
      SpreadsheetApp.flush();
    }
  } catch {
    // Do not retry here: MailApp may already have sent it. No private data in logs.
    console.error('PhotoTrackly mail status update failed; check the owner inbox before resending.');
  }
}

/** Run manually in the Apps Script editor to authorize and send one test email.
 * Does not add a lead, bypass the public webhook, or install a trigger.
 */
function sendTestEmail() {
  const secret = PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET');
  if (!secret || secret.length < 32) throw new Error('Set WEBHOOK_SECRET in Script Properties first (32+ random characters).');
  leadsSheet();
  if (MailApp.getRemainingDailyQuota() < 1) throw new Error('Google mail quota is exhausted. Try after it resets.');
  MailApp.sendEmail({
    to: NOTIFICATION_EMAIL,
    name: 'PhotoTrackly',
    subject: '[PhotoTrackly] Email notification test',
    body: 'PhotoTrackly can access the new lead sheet and submit an owner notification.\n\n' +
      'Recipient: ' + NOTIFICATION_EMAIL + '\n' +
      'Sheet: https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/edit\n\n' +
      'No lead row was added. This test does not verify the website connection. ' +
      'After deployment and Vercel configuration, submit a labeled test through the website and check both the sheet and inbox.'
  });
  console.log('Test notification submitted to MailApp. Check the owner inbox and Spam folder.');
}
