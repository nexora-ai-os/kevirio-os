-- READ ONLY. Run after Owner applies Migration 012. It changes no Production data or schema.
begin transaction read only;
do $$
declare name text; signature text; function_oid oid; missing text[]; unsafe_count integer; search_path_is_empty boolean;
begin
  select array_agg(item) into missing from unnest(array[
    'ai_employee_definitions','ai_employee_capabilities','ai_employee_tasks','ai_employee_task_events',
    'ai_employee_handoffs','google_workspace_bindings','google_quota_policies','google_quota_usage'
  ]) item where to_regclass('public.'||item) is null;
  if missing is not null then raise exception 'M012_SMOKE_TABLES_MISSING: %',missing; end if;
  foreach name in array array['ai_employee_capabilities','ai_employee_tasks','ai_employee_task_events','ai_employee_handoffs','google_workspace_bindings','google_quota_policies','google_quota_usage'] loop
    if not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname=name and c.relrowsecurity) then raise exception 'M012_SMOKE_RLS_DISABLED: %',name; end if;
    if not exists(select 1 from pg_policies where schemaname='public' and tablename=name and policyname='ai_employee_owner_read') then raise exception 'M012_SMOKE_POLICY_MISSING: %',name; end if;
  end loop;
  foreach signature in array array[
    'public.create_ai_employee_task(uuid,uuid,text,text,text,text,text,text,text,jsonb,text,text,text,integer,integer,integer,numeric,uuid,timestamptz,timestamptz)',
    'public.transition_ai_employee_task(uuid,uuid,text,text,text,text,jsonb,text)',
    'public.reserve_google_quota(uuid,uuid,text,text,text,integer,text)',
    'public.finalize_google_quota(uuid,uuid,integer,text)',
    'public.release_google_quota(uuid,uuid)',
    'public.create_ai_employee_handoff(uuid,uuid,text,text,text,text,text[],jsonb,uuid,text)'
  ] loop
    function_oid := to_regprocedure(signature);
    if function_oid is null then raise exception 'M012_SMOKE_RPC_MISSING: %',signature; end if;
    if not exists(select 1 from pg_proc where oid=function_oid and prosecdef) then raise exception 'M012_SMOKE_RPC_NOT_SECURITY_DEFINER: %',signature; end if;
    select exists(select 1 from pg_proc p cross join lateral unnest(coalesce(p.proconfig,'{}'::text[])) config(value)
      where p.oid=function_oid and split_part(config.value,'=',1)='search_path'
        and btrim(substring(config.value from position('=' in config.value)+1),E' \t\r\n"''')='') into search_path_is_empty;
    if not search_path_is_empty then raise exception 'M012_SMOKE_RPC_SEARCH_PATH_NOT_EMPTY: %',signature; end if;
  end loop;
  select count(*) into unsafe_count from information_schema.role_table_grants where table_schema='public' and table_name in ('ai_employee_capabilities','ai_employee_tasks','ai_employee_task_events','ai_employee_handoffs','google_workspace_bindings','google_quota_policies','google_quota_usage') and grantee in ('anon','authenticated','PUBLIC') and privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER');
  if unsafe_count<>0 then raise exception 'M012_SMOKE_UNSAFE_TABLE_GRANTS: %',unsafe_count; end if;
  if has_function_privilege('authenticated','public.create_ai_employee_task(uuid,uuid,text,text,text,text,text,text,text,jsonb,text,text,text,integer,integer,integer,numeric,uuid,timestamptz,timestamptz)','execute') or has_function_privilege('authenticated','public.transition_ai_employee_task(uuid,uuid,text,text,text,text,jsonb,text)','execute') then raise exception 'M012_SMOKE_AUTHENTICATED_RPC_EXECUTE'; end if;
  if not exists(select 1 from pg_trigger where tgrelid='public.ai_employee_task_events'::regclass and tgname='ai_task_events_immutable' and tgenabled<>'D') then raise exception 'M012_SMOKE_EVENT_IMMUTABILITY_MISSING'; end if;
  if not exists(select 1 from public.ai_employee_definitions where id='google_operations' and maturity='Conditional' and external_execution_allowed=false) then raise exception 'M012_SMOKE_GOOGLE_DEFINITION_INVALID'; end if;
  raise notice 'M012_POST_APPLY_SMOKE_PASS';
end $$;
rollback;
