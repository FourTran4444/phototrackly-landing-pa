-- Private persistent lead capture. Apply once in the chosen Supabase project.
-- No browser-facing insert/select/update/delete permissions are granted.
begin;
create table if not exists public.early_access_leads (
  id uuid primary key,
  request_hash text not null check (length(request_hash) = 64),
  email text not null check (length(email) <= 254),
  company text not null check (length(company) between 1 and 160),
  name text not null default '',
  role text not null default '',
  country text not null default '',
  monthly_volume text not null default '',
  challenge text not null default '' check (length(challenge) <= 2000),
  source text not null check (source in ('hero', 'footer')),
  consent_version text not null,
  consent_at timestamptz not null default now(),
  withdrawal_hash text not null unique check (length(withdrawal_hash) = 64),
  created_at timestamptz not null default now()
);
create index if not exists early_access_leads_email_idx on public.early_access_leads(email);
create table if not exists public.early_access_rate_limits (
  ip_hash text primary key check (length(ip_hash) = 64),
  window_start timestamptz not null,
  hits integer not null
);
alter table public.early_access_leads enable row level security;
alter table public.early_access_rate_limits enable row level security;
revoke all on public.early_access_leads, public.early_access_rate_limits from anon, authenticated;

create or replace function public.capture_early_access(p_payload jsonb, p_ip_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_lead jsonb := p_payload->'lead';
  v_id uuid := (p_payload->'lead'->>'requestId')::uuid;
  v_existing text;
  v_hits integer;
begin
  if v_lead->>'consent' is distinct from 'true' then raise exception 'consent_required'; end if;
  -- Serializes retries for the same id without exposing or overwriting an existing lead.
  perform pg_advisory_xact_lock(hashtextextended(v_id::text, 0));
  select request_hash into v_existing from public.early_access_leads where id = v_id;
  if found then
    if v_existing is distinct from p_payload->>'requestHash' then raise exception 'idempotency_conflict'; end if;
    return jsonb_build_object('reference', v_id::text);
  end if;
  insert into public.early_access_rate_limits(ip_hash, window_start, hits)
    values (p_ip_hash, date_trunc('hour', now()), 1)
    on conflict (ip_hash) do update set
      hits = case when early_access_rate_limits.window_start = excluded.window_start then early_access_rate_limits.hits + 1 else 1 end,
      window_start = excluded.window_start
    returning hits into v_hits;
  if v_hits > 8 then raise exception 'rate_limit'; end if;
  delete from public.early_access_rate_limits where window_start < now() - interval '24 hours';
  insert into public.early_access_leads(id, request_hash, email, company, name, role, country, monthly_volume, challenge, source, consent_version, withdrawal_hash)
    values (v_id, p_payload->>'requestHash', v_lead->>'email', v_lead->>'company', coalesce(v_lead->>'name',''), coalesce(v_lead->>'role',''), coalesce(v_lead->>'country',''), coalesce(v_lead->>'volume',''), coalesce(v_lead->>'challenge',''), v_lead->>'source', p_payload->>'consentVersion', p_payload->>'withdrawalHash');
  return jsonb_build_object('reference', v_id::text);
end;
$$;
create or replace function public.withdraw_early_access(p_token_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if length(p_token_hash) <> 64 then raise exception 'invalid_token'; end if;
  delete from public.early_access_leads where withdrawal_hash = p_token_hash;
  -- Same response for already-removed registrations; never disclose stored contact details.
  return jsonb_build_object('ok', true);
end;
$$;
revoke all on function public.capture_early_access(jsonb, text) from public, anon, authenticated;
revoke all on function public.withdraw_early_access(text) from public, anon, authenticated;
grant execute on function public.capture_early_access(jsonb, text) to service_role;
grant execute on function public.withdraw_early_access(text) to service_role;
commit;
