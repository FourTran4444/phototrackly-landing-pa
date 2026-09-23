import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createReceiver, TEST_SECRET } from './helpers/google-receiver.mjs';
const payload = () => ({ kind: 'lead', secret: TEST_SECRET, consentVersion: '2026-09-23',
  lead: { requestId: randomUUID(), source: 'hero', email: 'test@example.com', company: '=bad-formula', name: '', role: '', country: '', volume: '', challenge: '', consent: true },
  requestHash: 'a'.repeat(64), withdrawalHash: 'b'.repeat(64), ipHash: 'c'.repeat(64) });
test('Apps Script writes all lead fields as inert cells, then confirms the row', () => {
  const receiver = createReceiver(); const input = payload();
  const result = receiver.post(input); assert.equal(result.saved, true); assert.equal(result.reference, input.lead.requestId);
  const row = receiver.rows()[1]; assert.equal(row[4], "'=bad-formula"); assert.equal(row[18], 'yes'); assert.equal(row[19], '2026-09-23');
  assert.equal(row[16], 'sent'); assert.equal(row[21], input.withdrawalHash); assert.equal(receiver.controls.locked, false);
});
test('Apps Script saves footer qualification fields without changing existing columns', () => {
  const receiver = createReceiver(); const input = payload();
  Object.assign(input.lead, { source: 'footer', name: 'Alex', role: 'Owner / founder', country: 'Australia', volume: '25–99', challenge: 'Editing handoffs' });
  assert.equal(receiver.post(input).saved, true);
  const row = receiver.rows()[1]; assert.equal(row[2], 'Alex'); assert.equal(row[6], 'Owner / founder'); assert.equal(row[7], '25–99'); assert.equal(row[9], 'Editing handoffs'); assert.equal(row[17], 'Australia');
  const header = receiver.rows()[0]; assert.equal(header[3], 'Work Email'); assert.equal(header[15], 'request_id');
  header[17] = 'Unrelated column'; assert.equal(receiver.post(payload()).ok, false); assert.equal(header[17], 'Unrelated column');
});
test('Apps Script rejects unauthorized, invalid, nonconsenting and oversize submissions', () => {
  const receiver = createReceiver(); const input = payload();
  for (const bad of [null, [], {}, { ...input, secret: 'wrong' }, { ...input, kind: 'event' }, { ...input, lead: { ...input.lead, consent: false } }, { ...input, lead: { ...input.lead, country: 'invalid' } }, 'x'.repeat(17000)]) assert.equal(receiver.post(bad).ok, false);
  assert.equal(receiver.rows().length, 0);
});
test('Apps Script deduplicates retries, rejects conflicting requests and limits repeated captures', () => {
  const receiver = createReceiver(); const input = payload(); assert.equal(receiver.post(input).saved, true);
  assert.equal(receiver.post(input).duplicate, true); assert.equal(receiver.rows().length, 2);
  assert.equal(receiver.post({ ...input, requestHash: 'd'.repeat(64) }).error, 'idempotency_conflict');
  for (let i = 0; i < 7; i++) assert.equal(receiver.post(payload()).saved, true);
  assert.equal(receiver.post(payload()).error, 'rate_limit'); assert.equal(receiver.post(input).saved, true);
});
test('Apps Script withdrawal removes only the matching row; busy and unavailable fail closed', () => {
  const receiver = createReceiver(); const first = payload(); receiver.post(first);
  const other = payload(); other.withdrawalHash = 'd'.repeat(64); receiver.post(other);
  const remove = { kind: 'withdraw', secret: TEST_SECRET, tokenHash: first.withdrawalHash };
  assert.equal(receiver.post(remove).removed, true); assert.equal(receiver.rows().length, 2);
  assert.equal(receiver.rows()[1][15], other.lead.requestId); assert.equal(receiver.post(remove).removed, true);
  receiver.controls.busy = true; assert.equal(receiver.post(payload()).ok, false);
  receiver.controls.busy = false; receiver.controls.fail = true; assert.equal(receiver.post(remove).ok, false);
  assert.equal(receiver.controls.locked, false);
});

test('owner mail is sent after saving and contains the lead details and new Sheet link', () => {
  const receiver = createReceiver(); const input = payload();
  Object.assign(input.lead, { company: 'Coastal Studio', name: 'Alex', role: 'Owner / founder', country: 'Australia', volume: '25–99', challenge: 'Editing handoffs' });
  assert.equal(receiver.post(input).saved, true);
  const [mail] = receiver.messages();
  assert.equal(mail.savedAtSend, true); assert.equal(mail.to, 'tranvantubk@gmail.com'); assert.equal(mail.replyTo, input.lead.email);
  for (const text of ['Coastal Studio', 'Alex', 'Australia', '25–99', 'Editing handoffs', '1Vqoauc6MORXZ8cwlTX7eKHXLfju3zKE-uS7wbwitJkE']) assert.ok(mail.body.includes(text));
  for (const privateValue of [TEST_SECRET, input.requestHash, input.withdrawalHash, input.ipHash]) assert.ok(!mail.body.includes(privateValue));
  assert.ok(!mail.htmlBody); assert.ok(!mail.cc); assert.ok(!mail.bcc);
});
test('accepted retries and conflicts never resend owner email', () => {
  const receiver = createReceiver(); const input = payload();
  receiver.post(input); receiver.post(input); receiver.post({ ...input, requestHash: 'd'.repeat(64) });
  assert.equal(receiver.messages().length, 1); assert.equal(receiver.rows().length, 2);
});
test('mail exception preserves saved registration and records failed status without automatic resend', () => {
  const receiver = createReceiver(); const input = payload(); receiver.controls.mailFail = true;
  assert.equal(receiver.post(input).saved, true); assert.equal(receiver.rows()[1][16], 'failed');
  receiver.controls.mailFail = false;
  assert.equal(receiver.post(input).duplicate, true); assert.equal(receiver.messages().length, 0);
  assert.equal(receiver.controls.locked, false);
});
test('exhausted mail quota preserves registration without attempting a send', () => {
  const receiver = createReceiver(); receiver.controls.quota = 0;
  assert.equal(receiver.post(payload()).saved, true); assert.equal(receiver.rows()[1][16], 'quota-exceeded');
  assert.equal(receiver.messages().length, 0);
});
test('failed notification status update does not invalidate a lead or resend mail on retry', () => {
  const receiver = createReceiver(); const input = payload(); receiver.controls.statusFail = true;
  assert.equal(receiver.post(input).saved, true); assert.equal(receiver.rows()[1][16], 'pending');
  assert.equal(receiver.post(input).duplicate, true); assert.equal(receiver.messages().length, 1);
});
test('failed Sheet access, failed flush, bad consent and unauthorized requests never email', () => {
  const receiver = createReceiver(); const input = payload();
  receiver.controls.fail = true; assert.equal(receiver.post(input).ok, false);
  receiver.controls.fail = false; receiver.controls.flushFail = true; assert.equal(receiver.post(input).ok, false);
  assert.equal(receiver.messages().length, 0);
  const clean = createReceiver();
  clean.post({ ...input, secret: 'wrong' }); clean.post({ ...input, lead: { ...input.lead, consent: false } });
  assert.equal(clean.messages().length, 0);
});
test('withdrawal does not send a notification and does not remove unrelated leads', () => {
  const receiver = createReceiver(); const input = payload(); receiver.post(input);
  assert.equal(receiver.post({ kind: 'withdraw', secret: TEST_SECRET, tokenHash: input.withdrawalHash }).removed, true);
  assert.equal(receiver.rows().length, 1); assert.equal(receiver.messages().length, 1);
});
test('mail headers are single-line and form data cannot choose recipients', () => {
  const receiver = createReceiver(); const input = payload();
  input.lead.company = 'Studio\r\nBcc: other@example.com'; input.lead.email = 'name,other@example.com';
  input.to = 'wrong@example.com'; input.lead.notificationEmail = 'wrong@example.com';
  assert.equal(receiver.post(input).saved, true);
  const [mail] = receiver.messages(); assert.equal(mail.to, 'tranvantubk@gmail.com');
  assert.doesNotMatch(mail.subject, /[\r\n]/); assert.equal(mail.replyTo, undefined); assert.equal(mail.bcc, undefined);
});
test('manual test email targets the owner without adding fake leads', () => {
  const receiver = createReceiver(); receiver.sendTestEmail();
  assert.equal(receiver.rows().length, 1); assert.equal(receiver.messages().length, 1);
  assert.equal(receiver.messages()[0].to, 'tranvantubk@gmail.com'); assert.match(receiver.messages()[0].subject, /test/);
  assert.throws(() => createReceiver({ secret: '' }).sendTestEmail());
});
