\set ON_ERROR_STOP on
-- Run only against an isolated CI database, never a live lead database.
do $$
declare payload jsonb; result jsonb; n integer;
begin
  if has_table_privilege('anon', 'public.early_access_leads', 'select') or has_function_privilege('anon', 'public.capture_early_access(jsonb,text)', 'execute') then raise exception 'Anonymous access is not locked down'; end if;
  if not has_function_privilege('service_role', 'public.capture_early_access(jsonb,text)', 'execute') then raise exception 'Service role needs execute'; end if;
  payload := jsonb_build_object('lead', jsonb_build_object('requestId','00000000-0000-4000-8000-000000000001','email','ci@example.com','company','CI Test','source','hero','consent',true),'requestHash',repeat('a',64),'withdrawalHash',repeat('b',64),'consentVersion','2026-09-23');
  result := public.capture_early_access(payload, repeat('c',64));
  if result->>'reference' <> '00000000-0000-4000-8000-000000000001' then raise exception 'Missing receipt'; end if;
  perform public.capture_early_access(payload, repeat('c',64));
  select count(*) into n from public.early_access_leads;
  if n <> 1 then raise exception 'Retry created a duplicate'; end if;
  perform public.withdraw_early_access(repeat('b',64));
  select count(*) into n from public.early_access_leads;
  if n <> 0 then raise exception 'Withdrawal did not delete'; end if;
end $$;
