import { NextRequest, NextResponse } from 'next/server';
import { validateRegistration } from '@/lib/model';
import { registrationConfigured, siteUrl } from '@/lib/site';

export const runtime = 'nodejs';
export const maxDuration = 15;
const respond = (body: object, status: number) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

async function limitedBody(request: Request): Promise<string> {
  if (!request.body) throw new Error('Empty body');
  const reader = request.body.getReader(); const decoder = new TextDecoder();
  let bytes = 0; let text = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 8192) { await reader.cancel(); throw new Error('Body too large'); }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally { reader.releaseLock(); }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin && origin !== siteUrl()) return respond({ error: 'Submit the form from the PhotoTrackly website.' }, 403);
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return respond({ error: 'Send a JSON request.' }, 415);
  let raw: string;
  try { raw = await limitedBody(request); } catch { return respond({ error: 'The request is empty or too large.' }, 413); }
  let registration;
  try { registration = validateRegistration(JSON.parse(raw)); }
  catch (error) { return respond({ error: error instanceof SyntaxError ? 'Invalid JSON.' : error instanceof Error ? error.message : 'Invalid form.' }, 400); }
  // Honeypot submissions receive a neutral response, without forwarding any data.
  if (registration.website) return respond({ ok: true }, 200);
  if (!registrationConfigured()) return respond({ error: 'Live registration is not connected on this preview. No registration was submitted.' }, 503);
  const { website: _honeypot, ...fields } = registration;
  void _honeypot;
  try {
    const upstream = await fetch(process.env.EARLY_ACCESS_WEBHOOK_URL!, {
      method: 'POST', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(10000),
      headers: { 'Content-Type': 'application/json', ...(process.env.EARLY_ACCESS_WEBHOOK_TOKEN ? { Authorization: `Bearer ${process.env.EARLY_ACCESS_WEBHOOK_TOKEN}` } : {}) },
      body: JSON.stringify({ ...fields, source: 'phototrackly-landing', submittedAt: new Date().toISOString() }),
    });
    if (!upstream.ok) return respond({ error: 'Registration could not be confirmed. Please try again later.' }, 502);
    return respond({ ok: true }, 200);
  } catch { return respond({ error: 'Registration could not be confirmed. Please try again later.' }, 502); }
}
