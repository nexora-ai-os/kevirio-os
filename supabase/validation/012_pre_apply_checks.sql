-- READ ONLY. Run before applying Migration 012. It changes no Production data or schema.
begin transaction read only;
do $$
declare missing_baseline text[]; existing_012 integer;
begin
  select array_agg(name) into missing_baseline from unnest(array[
    'workspaces','workspace_members','approval_requests','approval_decisions',
    'provider_connections','provider_cost_policies'
  ]) name where to_regclass('public.'||name) is null;
  if missing_baseline is not null then raise exception 'M012_PRECHECK_BASELINE_MISSING: %',missing_baseline; end if;
  if not exists(select 1 from pg_extension where extname='pgcrypto') then raise exception 'M012_PRECHECK_PGCRYPTO_MISSING'; end if;
  select count(*) into existing_012 from unnest(array[
    'ai_employee_definitions','ai_employee_capabilities','ai_employee_tasks','ai_employee_task_events',
    'ai_employee_handoffs','google_workspace_bindings','google_quota_policies','google_quota_usage'
  ]) name where to_regclass('public.'||name) is not null;
  if existing_012 not in (0,8) then raise exception 'M012_PRECHECK_PARTIAL_SCHEMA: % of 8 objects',existing_012; end if;
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='approval_requests' and column_name='workspace_id') then raise exception 'M012_PRECHECK_APPROVAL_WORKSPACE_MISSING'; end if;
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='provider_connections' and column_name='workspace_id') then raise exception 'M012_PRECHECK_PROVIDER_WORKSPACE_MISSING'; end if;
  raise notice 'M012_PRECHECK_PASS baseline=yes existing_012=% (0=new,8=re-run)',existing_012;
end $$;
rollback;
