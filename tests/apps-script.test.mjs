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
  assert.equal(row[16], 'not-configured'); assert.equal(row[21], input.withdrawalHash); assert.equal(receiver.controls.locked, false);
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
