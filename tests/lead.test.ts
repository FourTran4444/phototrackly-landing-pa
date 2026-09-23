import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { validateLead, LeadValidationError } from '../lib/lead-schema.ts';
import { captureLead, withdrawLead, LeadStoreError, hashedIp } from '../lib/lead-store.ts';
let directory = '';
before(async () => {
  directory = await mkdtemp(join(tmpdir(), 'phototrackly-test-'));
  process.env.LEAD_STORAGE = 'sqlite'; process.env.LEAD_DATA_DIRECTORY = directory;
  process.env.LEAD_TOKEN_SECRET = 'test-only-secret-at-least-thirty-two-characters';
});
after(async () => { await rm(directory, { recursive: true, force: true }); });
const valid = () => ({ requestId: randomUUID(), source: 'hero', email: 'TEST@example.com', company: ' Test Studio ', consent: true, website: '' });
test('lead validation normalizes data and requires explicit consent', () => {
  const lead = validateLead(valid()); assert.equal(lead.email, 'test@example.com'); assert.equal(lead.company, 'Test Studio');
  for (const bad of [null, [], { ...valid(), consent: false }, { ...valid(), consent: 'true' }, { ...valid(), email: 'bad' }, { ...valid(), website: 'bot' }, { ...valid(), requestId: 'not-an-id' }, { ...valid(), challenge: 'x'.repeat(2001) }]) assert.throws(() => validateLead(bad), LeadValidationError);
});
test('full registration requires qualification fields and bounded choices', () => {
  assert.throws(() => validateLead({ ...valid(), source: 'footer' }), LeadValidationError);
  const full = { ...valid(), source: 'footer', name: 'Test Person', role: 'Owner / founder', country: 'Australia', volume: '25–99' };
  assert.equal(validateLead(full).country, 'Australia');
  assert.throws(() => validateLead({ ...full, volume: '99999' }), LeadValidationError);
});
test('capture persists a real row, survives a new connection, and retries are idempotent', async () => {
  const lead = validateLead(valid()); const first = await captureLead(lead, '192.0.2.1'); const second = await captureLead(lead, '192.0.2.1');
  assert.deepEqual(first, second); assert.equal(first.reference, lead.requestId); assert.match(first.withdrawalToken, /^[a-f0-9]{64}$/);
  const db = new DatabaseSync(join(directory, 'early-access.sqlite'));
  const row = db.prepare('SELECT data, consent_version, withdrawal_hash FROM leads WHERE id = ?').get(lead.requestId);
  assert.equal(JSON.parse(String(row?.data)).email, lead.email); assert.equal(row?.consent_version, '2026-09-23');
  assert.notEqual(row?.withdrawal_hash, first.withdrawalToken); assert.equal(db.prepare('SELECT count(*) AS n FROM leads WHERE id = ?').get(lead.requestId)?.n, 1); db.close();
  await assert.rejects(captureLead({ ...lead, company: 'Changed' }, '192.0.2.1'), (e: unknown) => e instanceof LeadStoreError && e.status === 409);
});
test('rate limiting is persistent; an accepted retry still succeeds at the limit', async () => {
  const leads = Array.from({ length: 8 }, () => validateLead(valid()));
  for (const lead of leads) await captureLead(lead, '192.0.2.2');
  await assert.rejects(captureLead(validateLead(valid()), '192.0.2.2'), (e: unknown) => e instanceof LeadStoreError && e.status === 429);
  assert.equal((await captureLead(leads[0], '192.0.2.2')).reference, leads[0].requestId);
  assert.notEqual(hashedIp('192.0.2.2'), '192.0.2.2');
});
test('private withdrawal removes only the matching record and is idempotent', async () => {
  const lead = validateLead(valid()); const receipt = await captureLead(lead, '192.0.2.3');
  await withdrawLead(receipt.withdrawalToken); await withdrawLead(receipt.withdrawalToken);
  const db = new DatabaseSync(join(directory, 'early-access.sqlite')); assert.equal(db.prepare('SELECT count(*) AS n FROM leads WHERE id = ?').get(lead.requestId)?.n, 0); db.close();
});
test('SQLite refuses to run on Vercel; a disconnected production store never reports success', async () => {
  process.env.VERCEL = '1';
  await assert.rejects(captureLead(validateLead(valid()), '192.0.2.4'), (e: unknown) => e instanceof LeadStoreError && e.status === 503);
  delete process.env.VERCEL; process.env.LEAD_STORAGE = 'supabase';
  await assert.rejects(captureLead(validateLead(valid()), '192.0.2.4'), (e: unknown) => e instanceof LeadStoreError && e.status === 503);
  process.env.LEAD_STORAGE = 'sqlite';
});
