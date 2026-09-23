/** PhotoTrackly landing-page intake. Deploy as a dedicated web app.
 * Script Properties: WEBHOOK_SECRET (32+ random characters).
 * Keep this Sheet private; only the script owner needs edit access.
 * Existing A:Q columns and other CRM tabs are preserved.
 */
const SHEET_ID = '1TG7qUvW0C8uu9WaGMKCSUTaamjZFdIxkNFJKlRxBl2c';
const HEADERS = ['Submitted At', 'Intent', 'Name', 'Work Email', 'Company', 'Start Timing', 'Role', 'Monthly Orders', 'Current Tools', 'Manual Bottleneck', 'Source', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'request_id', 'notification_status', 'Country', 'Consent', 'Consent Version', 'request_hash', 'withdrawal_hash'];

function doGet() {
  return jsonResponse({ ok: true, service: 'PhotoTrackly Google Sheets intake', version: 2 });
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
  if (lead.source === 'footer' && ['name', 'role', 'country', 'volume'].some(key => !lead[key].trim())) return false;
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
    sheet.appendRow([
      new Date().toISOString(), 'early-access', safeCell(lead.name), safeCell(lead.email),
      safeCell(lead.company), '', safeCell(lead.role), safeCell(lead.volume), '', safeCell(lead.challenge),
      'phototrackly-landing:' + lead.source, '', '', '', '', lead.requestId, 'not-configured',
      safeCell(lead.country), 'yes', input.consentVersion, input.requestHash, input.withdrawalHash
    ]);
    SpreadsheetApp.flush();
    // Confirmation is returned only after the Sheet write. No email is implied.
    return jsonResponse({ ok: true, saved: true, reference: lead.requestId });
  } catch {
    console.error('PhotoTrackly intake failed; no success response issued.');
    return jsonResponse({ ok: false, error: 'intake_failed' });
  } finally {
    if (locked) lock.releaseLock();
  }
}
