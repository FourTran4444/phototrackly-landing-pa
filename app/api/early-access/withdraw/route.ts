import { NextRequest } from 'next/server';
import { LeadStoreError, withdrawLead } from '@/lib/lead-store';
import { readLeadRequest, respond, safeHttpError } from '@/lib/lead-http';
export const runtime = 'nodejs';
export const maxDuration = 15;
export async function POST(request: NextRequest) {
  try {
    const body = await readLeadRequest(request) as { token?: unknown };
    if (!body || typeof body.token !== 'string' || !/^[a-f0-9]{64}$/.test(body.token)) return respond({ error: 'Use the private removal link from your registration confirmation.' }, 400);
    await withdrawLead(body.token);
    return respond({ ok: true });
  } catch (error) {
    if (error instanceof LeadStoreError) return respond({ error: error.message }, error.status);
    const known = safeHttpError(error); if (known) return known;
    console.error('[early-access] Withdrawal storage operation failed');
    return respond({ error: 'We could not confirm removal. Please keep your link and try again.' }, 502);
  }
}
