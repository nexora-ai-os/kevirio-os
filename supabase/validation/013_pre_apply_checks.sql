begin;
set transaction read only;

do $$
declare
  object_name text;
  existing_count integer;
  required_column record;
begin
  if not exists(select 1 from pg_extension where extname='pgcrypto') then
    raise exception 'M013_PRECHECK_PGCRYPTO_MISSING';
  end if;

  foreach object_name in array array[
    'workspaces','workspace_members','brand_profiles','offer_operations',
    'approval_requests','evidence_candidates','revenue_records',
    'operating_cost_records','learning_records','execution_packages','ai_employee_definitions'
  ] loop
    if to_regclass(format('public.%I',object_name)) is null then
      raise exception 'M013_PRECHECK_BASELINE_TABLE_MISSING:%',object_name;
    end if;
  end loop;

  if to_regprocedure('public.ai_metadata_is_safe(jsonb,integer)') is null then
    raise exception 'M013_PRECHECK_BASELINE_FUNCTION_MISSING:ai_metadata_is_safe';
  end if;

  for required_column in select * from (values
    ('workspaces','id'),('workspace_members','workspace_id'),('workspace_members','user_id'),
    ('brand_profiles','id'),('brand_profiles','workspace_id'),
    ('offer_operations','id'),('offer_operations','workspace_id'),
    ('approval_requests','id'),('approval_requests','workspace_id'),
    ('evidence_candidates','workspace_id'),('revenue_records','workspace_id'),
    ('operating_cost_records','workspace_id'),('learning_records','workspace_id'),
    ('execution_packages','workspace_id'),('execution_packages','payload_snapshot')
  ) as required(table_name,column_name) loop
    if not exists(
      select 1 from information_schema.columns c
      where c.table_schema='public'
        and c.table_name=required_column.table_name
        and c.column_name=required_column.column_name
    ) then
      raise exception 'M013_PRECHECK_BASELINE_COLUMN_MISSING:%.%',required_column.table_name,required_column.column_name;
    end if;
  end loop;

  if not exists(
    select 1 from pg_constraint
    where conrelid='public.approval_requests'::regclass
      and contype='u'
      and pg_get_constraintdef(oid) like 'UNIQUE (id, workspace_id)%'
  ) then
    raise exception 'M013_PRECHECK_APPROVAL_WORKSPACE_UNIQUE_MISSING';
  end if;

  select count(*) into existing_count
  from unnest(array[
    'revenue_engine_definitions','market_profiles','revenue_engines','company_cycle_runs',
    'content_assets','revenue_learning_records','executive_decisions','company_operating_events'
  ]) as target(name)
  where to_regclass(format('public.%I',target.name)) is not null;

  if existing_count <> 0 then
    raise exception 'M013_PRECHECK_PARTIAL_SCHEMA:%/8',existing_count;
  end if;
  if to_regprocedure('public.register_revenue_engine(uuid,uuid,uuid,text,text,text,text,text)') is not null
    or to_regprocedure('public.enforce_v1_manual_package_contract()') is not null
    or to_regprocedure('public.touch_company_updated_at()') is not null
    or to_regprocedure('public.reject_company_event_mutation()') is not null then
    raise exception 'M013_PRECHECK_FUNCTION_COLLISION';
  end if;
  if exists(select 1 from pg_trigger where tgname in('execution_packages_v1_contract','company_touch_updated_at','company_operating_events_immutable') and not tgisinternal) then
    raise exception 'M013_PRECHECK_TRIGGER_COLLISION';
  end if;
  if exists(select 1 from pg_indexes where schemaname='public' and indexname in(
    'revenue_engines_workspace_status_type_idx','company_cycle_runs_workspace_status_stage_idx',
    'content_assets_workspace_status_type_idx','revenue_learning_workspace_status_expiry_idx',
    'executive_decisions_workspace_status_deadline_idx','company_events_workspace_entity_created_idx'
  )) then raise exception 'M013_PRECHECK_INDEX_COLLISION'; end if;
  if exists(select 1 from pg_policies where schemaname='public' and (
    (tablename='revenue_engine_definitions' and policyname='revenue_engine_definitions_read')
    or (tablename in('market_profiles','revenue_engines','company_cycle_runs','content_assets','revenue_learning_records','executive_decisions','company_operating_events') and policyname='company_owner_read')
  )) then raise exception 'M013_PRECHECK_POLICY_COLLISION'; end if;
  if not exists(select 1 from pg_roles where rolname='authenticated')
    or not exists(select 1 from pg_roles where rolname='service_role') then
    raise exception 'M013_PRECHECK_REQUIRED_ROLE_MISSING';
  end if;
  if exists(
    select 1 from pg_class c
    where c.oid in('public.brand_profiles'::regclass,'public.offer_operations'::regclass,'public.execution_packages'::regclass)
      and pg_get_userbyid(c.relowner)<>current_user
  ) then raise exception 'M013_PRECHECK_EXISTING_OBJECT_OWNERSHIP_MISMATCH'; end if;
  if exists(select 1 from pg_constraint where conrelid='public.brand_profiles'::regclass and conname='brand_profiles_id_workspace_unique' and pg_get_constraintdef(oid,true)<>'UNIQUE (id, workspace_id)') then
    raise exception 'M013_PRECHECK_BRAND_WORKSPACE_CONSTRAINT_COLLISION';
  end if;
  if exists(select 1 from pg_constraint where conrelid='public.offer_operations'::regclass and conname='offer_operations_id_workspace_unique' and pg_get_constraintdef(oid,true)<>'UNIQUE (id, workspace_id)') then
    raise exception 'M013_PRECHECK_OFFER_WORKSPACE_CONSTRAINT_COLLISION';
  end if;
end $$;

select
  'M013_PRECHECK_PASS'::text as result,
  case when count(*)=0 then 'NOT_APPLIED_READY' else 'FULL_OBJECT_SET_PRESENT_REVIEW_BEFORE_RERUN' end::text as object_state,
  'B5DE02C52806E30F76565C9045C9E4E7FD9CCC5365973C746AB7EF6F563365BB'::text as expected_sha256,
  true as transaction_read_only
from unnest(array[
  'revenue_engine_definitions','market_profiles','revenue_engines','company_cycle_runs',
  'content_assets','revenue_learning_records','executive_decisions','company_operating_events'
]) as target(name)
where to_regclass(format('public.%I',target.name)) is not null;

rollback;
