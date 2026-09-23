import { createHash, createHmac } from 'node:crypto';
import { CONSENT_VERSION, type LeadInput } from './lead-schema';

export class LeadStoreError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
const unavailable = 'Registration could not be saved. Please try again later. Your details have not been confirmed.';
function configuration() {
  const secret = process.env.LEAD_WEBHOOK_SECRET || '';
  let url: URL;
  try { url = new URL(process.env.LEAD_WEBHOOK_URL || ''); }
  catch { throw new LeadStoreError(503, unavailable); }
  if (secret.length < 32 || url.origin !== 'https://script.google.com' || url.username || url.password || url.search || url.hash || !/^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url.pathname)) {
    throw new LeadStoreError(503, unavailable);
  }
  return { url: url.href, secret };
}
export function tokenHash(token: string) { return createHash('sha256').update(token).digest('hex'); }
export function withdrawalToken(requestId: string): string {
  return createHmac('sha256', configuration().secret).update(`phototrackly:withdraw:v1:${requestId}`).digest('hex');
}
export function hashedIp(ip: string) {
  return createHmac('sha256', configuration().secret).update(`phototrackly:rate:v1:${ip}`).digest('hex');
}
async function send(payload: object): Promise<Record<string, unknown>> {
  const { url, secret } = configuration();
  const signal = AbortSignal.timeout(10000);
  try {
    let response = await fetch(url, {
      method: 'POST', redirect: 'manual', cache: 'no-store', signal,
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, secret }),
    });
    // ContentService redirects to a Google-owned response URL. Read it with GET;
    // never forward the POST body, secret, or contact details to a redirect.
    if (response.status === 302 || response.status === 303) {
      const location = new URL(response.headers.get('location') || '', url);
      if (location.origin !== 'https://script.googleusercontent.com' || location.username || location.password || location.pathname !== '/macros/echo') throw new Error('Unexpected redirect');
      response = await fetch(location.href, { method: 'GET', redirect: 'error', cache: 'no-store', signal });
    }
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error('Unconfirmed response');
    const result: unknown = await response.json();
    if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error('Invalid response');
    const body = result as Record<string, unknown>;
    if (body.ok !== true) {
      if (body.error === 'rate_limit') throw new LeadStoreError(429, 'Too many registrations from this connection. Please wait up to an hour and try again.');
      if (body.error === 'idempotency_conflict') throw new LeadStoreError(409, 'This submission changed. Please edit a field and try again.');
      throw new Error('Not saved');
    }
    return body;
  } catch (error) {
    if (error instanceof LeadStoreError) throw error;
    throw new LeadStoreError(502, unavailable);
  }
}
export async function captureLead(lead: LeadInput, ip: string): Promise<{ reference: string; withdrawalToken: string }> {
  const token = withdrawalToken(lead.requestId);
  const result = await send({
    kind: 'lead', lead, consentVersion: CONSENT_VERSION,
    requestHash: tokenHash(JSON.stringify(lead)), withdrawalHash: tokenHash(token), ipHash: hashedIp(ip),
  });
  // A health-check response or HTTP 200 alone is not a successful registration.
  if (result.saved !== true || result.reference !== lead.requestId) throw new LeadStoreError(502, unavailable);
  return { reference: lead.requestId, withdrawalToken: token };
}
export async function withdrawLead(token: string): Promise<void> {
  const result = await send({ kind: 'withdraw', tokenHash: tokenHash(token) });
  if (result.removed !== true) throw new LeadStoreError(502, unavailable);
}
