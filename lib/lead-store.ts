import { createHash, createHmac } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { isAbsolute, join, resolve, sep } from 'node:path';
import { CONSENT_VERSION, type LeadInput } from './lead-schema';

export class LeadStoreError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export type StoredLead = { lead: LeadInput; requestHash: string; withdrawalHash: string; consentVersion: string };
const unavailable = 'Registration could not be saved. Please try again later. Your details have not been confirmed.';
function secret(): string {
  const value = process.env.LEAD_TOKEN_SECRET || '';
  if (value.length < 32) throw new LeadStoreError(503, unavailable);
  return value;
}
export function withdrawalToken(requestId: string): string {
  return createHmac('sha256', secret()).update(`phototrackly:withdraw:v1:${requestId}`).digest('hex');
}
export function tokenHash(token: string) { return createHash('sha256').update(token).digest('hex'); }
export function hashedIp(ip: string) { return createHmac('sha256', secret()).update(`phototrackly:rate:v1:${ip}`).digest('hex'); }
function prepare(lead: LeadInput): StoredLead {
  return { lead, requestHash: tokenHash(JSON.stringify(lead)), withdrawalHash: tokenHash(withdrawalToken(lead.requestId)), consentVersion: CONSENT_VERSION };
}
function useSqlite(): boolean {
  if (process.env.LEAD_STORAGE !== 'sqlite') return false;
  // A Vercel function filesystem is not durable. Never silently use it for leads.
  if (process.env.VERCEL) throw new LeadStoreError(503, unavailable);
  return true;
}
async function openSqlite() {
  const folder = process.env.LEAD_DATA_DIRECTORY || '';
  if (!folder || !isAbsolute(folder) || resolve(folder).startsWith(resolve('public') + sep) || resolve(folder) === resolve('public')) throw new LeadStoreError(503, unavailable);
  mkdirSync(folder, { recursive: true, mode: 0o700 });
  const { DatabaseSync } = await import('node:sqlite');
  const db = new DatabaseSync(join(folder, 'early-access.sqlite'));
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA synchronous=FULL;
    CREATE TABLE IF NOT EXISTS leads (id TEXT PRIMARY KEY, request_hash TEXT NOT NULL, data TEXT NOT NULL, withdrawal_hash TEXT NOT NULL UNIQUE, consent_version TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS lead_rate_limits (ip_hash TEXT PRIMARY KEY, window_start INTEGER NOT NULL, hits INTEGER NOT NULL);`);
  return db;
}
async function sqliteCapture(payload: StoredLead, ipHash: string): Promise<string> {
  const db = await openSqlite();
  try {
    db.exec('BEGIN IMMEDIATE');
    const existing = db.prepare('SELECT id, request_hash FROM leads WHERE id = ?').get(payload.lead.requestId);
    if (existing) {
      if (existing.request_hash !== payload.requestHash) throw new LeadStoreError(409, 'This submission changed. Please edit a field and try again.');
      db.exec('COMMIT'); return String(existing.id);
    }
    const hour = Math.floor(Date.now() / 3600000);
    db.prepare('DELETE FROM lead_rate_limits WHERE window_start < ?').run(hour - 24);
    const rate = db.prepare(`INSERT INTO lead_rate_limits (ip_hash, window_start, hits) VALUES (?, ?, 1)
      ON CONFLICT(ip_hash) DO UPDATE SET window_start=excluded.window_start, hits=CASE WHEN window_start=excluded.window_start THEN hits+1 ELSE 1 END RETURNING hits`).get(ipHash, hour);
    if (Number(rate?.hits) > 8) throw new LeadStoreError(429, 'Too many registrations from this connection. Please wait up to an hour and try again.');
    db.prepare('INSERT INTO leads (id, request_hash, data, withdrawal_hash, consent_version, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(payload.lead.requestId, payload.requestHash, JSON.stringify(payload.lead), payload.withdrawalHash, payload.consentVersion, new Date().toISOString());
    db.exec('COMMIT'); return payload.lead.requestId;
  } catch (error) {
    if (db.isTransaction) db.exec('ROLLBACK');
    throw error;
  } finally { db.close(); }
}
async function rpc(name: string, args: object): Promise<unknown> {
  const raw = process.env.SUPABASE_URL || ''; const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  let url: URL;
  try { url = new URL(raw); if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/') throw new Error(); }
  catch { throw new LeadStoreError(503, unavailable); }
  if (!key) throw new LeadStoreError(503, unavailable);
  const response = await fetch(`${url.origin}/rest/v1/rpc/${name}`, {
    method: 'POST', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000),
    headers: { 'Content-Type': 'application/json', apikey: key, ...(key.startsWith('eyJ') ? { Authorization: `Bearer ${key}` } : {}) },
    body: JSON.stringify(args),
  });
  const result = await response.json();
  if (!response.ok) {
    if (result?.message === 'rate_limit') throw new LeadStoreError(429, 'Too many registrations from this connection. Please wait up to an hour and try again.');
    if (result?.message === 'idempotency_conflict') throw new LeadStoreError(409, 'This submission changed. Please edit a field and try again.');
    throw new LeadStoreError(502, unavailable);
  }
  return result;
}
export async function captureLead(lead: LeadInput, ip: string): Promise<{ reference: string; withdrawalToken: string }> {
  const payload = prepare(lead); const ipHash = hashedIp(ip);
  let reference: string;
  if (useSqlite()) reference = await sqliteCapture(payload, ipHash);
  else {
    const result = await rpc('capture_early_access', { p_payload: payload, p_ip_hash: ipHash }) as { reference?: unknown };
    if (result?.reference !== lead.requestId) throw new LeadStoreError(502, unavailable);
    reference = result.reference as string;
  }
  return { reference, withdrawalToken: withdrawalToken(lead.requestId) };
}
export async function withdrawLead(token: string): Promise<void> {
  // Validate configuration even when no matching row exists; no fake success on a disconnected store.
  secret();
  if (useSqlite()) {
    const db = await openSqlite();
    try { db.prepare('DELETE FROM leads WHERE withdrawal_hash = ?').run(tokenHash(token)); } finally { db.close(); }
  } else {
    const result = await rpc('withdraw_early_access', { p_token_hash: tokenHash(token) }) as { ok?: unknown };
    if (result?.ok !== true) throw new LeadStoreError(502, unavailable);
  }
}
