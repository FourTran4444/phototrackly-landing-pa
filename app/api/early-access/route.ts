import { NextRequest } from 'next/server';
import { LeadValidationError, validateLead } from '@/lib/lead-schema';
import { captureLead, LeadStoreError } from '@/lib/lead-store';
import { readLeadRequest, respond, safeHttpError } from '@/lib/lead-http';
export const runtime = 'nodejs';
export const maxDuration = 15;
export async function POST(request: NextRequest) {
  try {
    const lead = validateLead(await readLeadRequest(request));
    // These headers must come from the trusted hosting proxy. Only an HMAC is sent for temporary abuse checks.
    const ip = (request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim().slice(0, 100);
    const receipt = await captureLead(lead, ip);
    return respond({ ok: true, ...receipt });
  } catch (error) {
    if (error instanceof LeadValidationError) return respond({ error: error.message, fields: error.fields }, 400);
    if (error instanceof LeadStoreError) return respond({ error: error.message }, error.status);
    const known = safeHttpError(error); if (known) return known;
    // No form values, tokens, IPs, or Google Sheet error payloads in logs.
    console.error('[early-access] Google Sheets operation failed');
    return respond({ error: 'We could not confirm your registration. Your details are still here; please try again.' }, 502);
  }
}
