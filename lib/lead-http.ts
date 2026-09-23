import { NextRequest, NextResponse } from 'next/server';
import { siteUrl } from './site';
export const respond = (body: object, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', ...(status === 429 ? { 'Retry-After': '3600' } : {}) } });
export async function readLeadRequest(request: NextRequest): Promise<unknown> {
  const origin = request.headers.get('origin');
  if (request.headers.get('sec-fetch-site') === 'cross-site' || (origin && ![request.nextUrl.origin, siteUrl()].includes(origin))) throw { status: 403, error: 'Submit the form from the PhotoTrackly website.' };
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw { status: 415, error: 'Send a JSON request.' };
  if (!request.body) throw { status: 400, error: 'Please complete the form.' };
  const reader = request.body.getReader(); const decoder = new TextDecoder(); let bytes = 0; let text = '';
  try {
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      bytes += value.byteLength;
      if (bytes > 16384) { await reader.cancel(); throw { status: 413, error: 'The request is too large. Please shorten your workflow description.' }; }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } finally { reader.releaseLock(); }
  try { return JSON.parse(text); } catch { throw { status: 400, error: 'The form could not be read. Please try again.' }; }
}
export function safeHttpError(error: unknown) {
  if (error && typeof error === 'object' && 'status' in error && 'error' in error && typeof error.status === 'number' && typeof error.error === 'string') return respond({ error: error.error }, error.status);
  return null;
}
