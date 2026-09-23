import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { validateLead, LeadValidationError } from '../lib/lead-schema.ts';
import { captureLead, withdrawLead, LeadStoreError, hashedIp, tokenHash } from '../lib/lead-store.ts';
const url = 'https://script.google.com/macros/s/phototrackly-test-only/exec';
beforeEach(() => { process.env.LEAD_WEBHOOK_URL = url; process.env.LEAD_WEBHOOK_SECRET = 'test-only-google-webhook-secret-never-deploy'; });
const valid = () => ({ requestId: randomUUID(), source: 'hero', email: 'TEST@example.com', company: ' Test Studio ', consent: true, website: '' });
const json = (value: unknown) => new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } });
const status = (n: number) => (e: unknown) => e instanceof LeadStoreError && e.status === n;
test('lead validation normalizes data and requires explicit consent', () => {
  const lead = validateLead(valid()); assert.equal(lead.email, 'test@example.com'); assert.equal(lead.company, 'Test Studio');
  for (const bad of [null, [], { ...valid(), consent: false }, { ...valid(), consent: 'true' }, { ...valid(), email: 'bad' }, { ...valid(), website: 'bot' }, { ...valid(), requestId: 'not-an-id' }, { ...valid(), challenge: 'x'.repeat(2001) }]) assert.throws(() => validateLead(bad), LeadValidationError);
});
test('full registration requires qualification fields and bounded choices', () => {
  assert.throws(() => validateLead({ ...valid(), source: 'footer' }), LeadValidationError);
  const full = { ...valid(), source: 'footer', name: 'Test Person', role: 'Owner / founder', country: 'Australia', volume: '25–99' };
  assert.equal(validateLead(full).country, 'Australia'); assert.throws(() => validateLead({ ...full, volume: '99999' }), LeadValidationError);
});
test('server sends consent, qualification, hashed IP and stable retry identity to Google only', async t => {
  const lead = validateLead(valid()); let sent: Record<string, unknown> = {};
  t.mock.method(globalThis, 'fetch', async (target: string, options: RequestInit) => {
    assert.equal(target, url); assert.equal(options.redirect, 'manual'); assert.equal(options.method, 'POST');
    sent = JSON.parse(String(options.body)); return json({ ok: true, saved: true, reference: lead.requestId });
  });
  const first = await captureLead(lead, '192.0.2.1'); const second = await captureLead(lead, '192.0.2.1');
  assert.deepEqual(first, second); assert.equal(sent.consentVersion, '2026-09-23'); assert.deepEqual(sent.lead, lead);
  assert.equal(sent.withdrawalHash, tokenHash(first.withdrawalToken)); assert.equal(sent.ipHash, hashedIp('192.0.2.1'));
  assert.ok(!JSON.stringify(sent).includes('192.0.2.1')); assert.match(first.withdrawalToken, /^[a-f0-9]{64}$/);
});
test('Google ContentService redirect is followed with GET and without the secret', async t => {
  const lead = validateLead(valid()); let calls = 0;
  t.mock.method(globalThis, 'fetch', async (target: string, options: RequestInit) => {
    if (++calls === 1) return new Response(null, { status: 302, headers: { location: 'https://script.googleusercontent.com/macros/echo?test-response=1' } });
    assert.equal(target, 'https://script.googleusercontent.com/macros/echo?test-response=1'); assert.equal(options.method, 'GET'); assert.equal(options.body, undefined); assert.equal(options.headers, undefined);
    return json({ ok: true, saved: true, reference: lead.requestId });
  });
  await captureLead(lead, '192.0.2.1'); assert.equal(calls, 2);
});
test('unconfirmed responses, sign-in pages, network errors and unsafe redirects never report success', async t => {
  const lead = validateLead(valid()); let response = () => Promise.resolve(json({ ok: true }));
  t.mock.method(globalThis, 'fetch', () => response());
  for (const body of [{ ok: true }, { ok: true, saved: false }, { ok: true, saved: true, reference: 'wrong' }, { ok: false }, null]) {
    response = () => Promise.resolve(json(body)); await assert.rejects(captureLead(lead, '192.0.2.1'), status(502));
  }
  response = () => Promise.resolve(new Response('<html>Sign in</html>', { headers: { 'Content-Type': 'text/html' } }));
  await assert.rejects(captureLead(lead, '192.0.2.1'), status(502));
  for (const code of [302, 307]) {
    response = () => Promise.resolve(new Response(null, { status: code, headers: { location: 'https://untrusted.example/steal' } }));
    await assert.rejects(captureLead(lead, '192.0.2.1'), status(502));
  }
  response = () => Promise.reject(new Error('network')); await assert.rejects(captureLead(lead, '192.0.2.1'), status(502));
});
test('Google error codes preserve retry guidance and private removal needs explicit acknowledgement', async t => {
  let body: object = { ok: false, error: 'rate_limit' }; t.mock.method(globalThis, 'fetch', async () => json(body));
  await assert.rejects(captureLead(validateLead(valid()), 'ip'), status(429));
  body = { ok: false, error: 'idempotency_conflict' }; await assert.rejects(captureLead(validateLead(valid()), 'ip'), status(409));
  body = { ok: true }; await assert.rejects(withdrawLead('a'.repeat(64)), status(502));
  body = { ok: true, removed: true }; await withdrawLead('a'.repeat(64));
});
test('missing configuration or non-Google endpoints are rejected before sending private data', async t => {
  t.mock.method(globalThis, 'fetch', () => { throw new Error('Must not send'); });
  for (const target of ['', 'http://script.google.com/macros/s/test/exec', 'https://evil.example/exec', url + '?secret=x', 'https://user:password@script.google.com/macros/s/test/exec']) {
    process.env.LEAD_WEBHOOK_URL = target; await assert.rejects(captureLead(validateLead(valid()), 'ip'), status(503));
  }
  process.env.LEAD_WEBHOOK_URL = url; process.env.LEAD_WEBHOOK_SECRET = '';
  await assert.rejects(captureLead(validateLead(valid()), 'ip'), status(503));
});
